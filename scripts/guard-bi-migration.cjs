// One-shot repair for 20260902_business_intelligence_views.sql:
// 1. Ledger dialect: tl./NEW./OLD. debit|credit -> debit_amount|credit_amount
//    (writer + real schema use *_amount; old names abort view creation and
//    would fail every voucher write at runtime via triggers).
// 2. Neutralize dangerous trigger INSTALLATIONS (bodies reference columns that
//    do not exist and/or double-maintain app-owned balances). DROP IF EXISTS
//    lines stay as cleanup. Function definitions are kept (inert, documented).
// 3. Best-effort guards around CREATE VIEW/MATVIEW/INDEX/ALTER/ANALYZE so a
//    speculative perf/BI artifact can never abort bootstrap (NOTICE + skip).
// 4. REFRESH CONCURRENTLY -> plain (cannot run inside runner transaction).
const fs = require('fs');
const p = 'migrations/20260902_business_intelligence_views.sql';
let raw = fs.readFileSync(p, 'utf8');
const eol = raw.includes('\r\n') ? '\r\n' : '\n';

// ── 1. dialect ──
const before1 = raw;
raw = raw
  .replace(/\btl\.debit\b/g, 'tl.debit_amount')
  .replace(/\btl\.credit\b/g, 'tl.credit_amount')
  .replace(/\b(NEW|OLD)\.debit\b/g, '$1.debit_amount')
  .replace(/\b(NEW|OLD)\.credit\b/g, '$1.credit_amount');
console.log('dialect replacements done:', raw !== before1);

// ── 2. neutralize trigger installations ──
const neut = (name, reason) =>
  `-- NEUTRALIZED (release-hardening 2026-09-10): trigger ${name} is NOT installed. ${reason}`;
raw = raw.replace(
  /CREATE TRIGGER trg_transaction_lines_balance[\s\S]*?EXECUTE FUNCTION trg_update_account_balance\(\);/,
  neut(
    'trg_transaction_lines_balance',
    'Body used pre-dialect columns and the app already maintains current_balance in code (double-count risk).'
  )
);
raw = raw.replace(
  /CREATE TRIGGER trg_project_progress[\s\S]*?EXECUTE FUNCTION trg_update_project_progress\(\);/,
  neut(
    'trg_project_progress',
    'Body references projects.progress_percent which legacy schemas lack; progress is app-maintained.'
  )
);
raw = raw.replace(
  /CREATE TRIGGER trg_update_budget[\s\S]*?EXECUTE FUNCTION trg_update_budget_spent\(\);/,
  neut(
    'trg_update_budget',
    'Body targets budget_lines with dialect mismatches; budgets are enforced in service code.'
  )
);
raw = raw.replace(
  /CREATE TRIGGER (trg_audit_\w+)[\s\S]*?EXECUTE FUNCTION trg_audit_changes\(\);/g,
  (_m, name) =>
    neut(
      name,
      'Body inserts performed_by/old_data/new_data/timestamp which audit_logs does not have; would fail every audited write.'
    )
);
raw = raw.replace(
  /CREATE TRIGGER trg_aid_distribution_stats[\s\S]*?EXECUTE FUNCTION trg_update_aid_stats\(\);/,
  neut(
    'trg_aid_distribution_stats',
    'Body sets aid_distributions.beneficiary_count which does not exist.'
  )
);

// ── 3+4. splitter + guards ──
const lines = raw.split(/\r?\n/);
const out = [];
let acc = null;
let parenDepth = 0;
let dollarDepth = 0;

function isWrapperStart(line) {
  return (
    /^\s*CREATE\s+(UNIQUE\s+)?INDEX\b/i.test(line) ||
    /^\s*CREATE\s+(OR\s+REPLACE\s+)?MATERIALIZED\s+VIEW\b/i.test(line) ||
    /^\s*CREATE\s+OR\s+REPLACE\s+VIEW\b/i.test(line) ||
    /^\s*ALTER\s+TABLE\b/i.test(line) ||
    /^\s*ANALYZE\b/i.test(line)
  );
}
function countParens(s) {
  let d = 0;
  for (const ch of s) {
    if (ch === '(') d++;
    if (ch === ')') d--;
  }
  return d;
}
function wrap(stmtLines) {
  return [
    'DO $$',
    'BEGIN',
    ...stmtLines.map((l) => '  ' + l),
    'EXCEPTION WHEN undefined_table OR undefined_column THEN',
    "  RAISE NOTICE 'bi-views skipped (schema drift): %', SQLERRM;",
    'END',
    '$$;',
  ].join('\n');
}

for (const line of lines) {
  const dollars = (line.match(/\$\$/g) || []).length;
  if (acc === null) {
    if (dollarDepth === 0 && isWrapperStart(line)) {
      acc = [line];
      parenDepth = countParens(line);
      if (/;\s*$/.test(line) && parenDepth <= 0) {
        out.push(wrap(acc));
        acc = null;
        parenDepth = 0;
      }
    } else {
      out.push(line.replace(/REFRESH\s+MATERIALIZED\s+VIEW\s+CONCURRENTLY/i, 'REFRESH MATERIALIZED VIEW'));
    }
  } else {
    acc.push(line);
    parenDepth += countParens(line);
    if (/;\s*$/.test(line) && parenDepth <= 0) {
      out.push(wrap(acc));
      acc = null;
      parenDepth = 0;
    }
  }
  if (dollars % 2 === 1) {
    dollarDepth = dollarDepth === 0 ? 1 : 0;
  }
}
if (acc) out.push(...acc);

fs.writeFileSync(p, out.join(eol), { encoding: 'utf8' });
console.log('wrapped file lines:', out.length);
