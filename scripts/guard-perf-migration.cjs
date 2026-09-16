// One-shot transform: 20260831_performance_optimization_v1.sql becomes a
// best-effort perf suite. Perf indexes/views must NEVER break bootstrap:
// speculative statements are wrapped so undefined_table/undefined_column
// only emit a NOTICE while real errors still abort the migration.
const fs = require('fs');
const p = 'migrations/20260831_performance_optimization_v1.sql';
const raw = fs.readFileSync(p, 'utf8');
const eol = raw.includes('\r\n') ? '\r\n' : '\n';
const lines = raw.split(/\r?\n/);

const out = [];
let acc = null; // accumulating a statement
let dollarDepth = 0;
let parenDepth = 0;

function isWrapperStart(line) {
  return /^\s*CREATE\s+(UNIQUE\s+)?INDEX\b/i.test(line)
    || /^\s*CREATE\s+(OR\s+REPLACE\s+)?MATERIALIZED\s+VIEW\b/i.test(line)
    || /^\s*CREATE\s+OR\s+REPLACE\s+VIEW\b/i.test(line)
    || /^\s*ALTER\s+TABLE\b/i.test(line)
    || /^\s*ANALYZE\b/i.test(line)
    || /^\s*REFRESH\s+MATERIALIZED\s+VIEW\b/i.test(line)
    || /^\s*SELECT\s+refresh_all_materialized_views\(\)/i.test(line);
}

function countParens(s) {
  let d = 0;
  for (const ch of s) {
    if (ch === '(') d++;
    if (ch === ')') d--;
  }
  return d;
}

for (const line of lines) {
  const trimmed = line.trim();
  // Runner already wraps the file in a transaction — own txn verbs break atomicity
  if (/^BEGIN\s*;\s*$/.test(trimmed) || /^COMMIT\s*;\s*$/.test(trimmed)) {
    out.push('-- (removed standalone ' + trimmed.replace(';', '') + ': runner owns the transaction)');
    continue;
  }
  // CONCURRENTLY cannot run inside the runner transaction
  if (/REFRESH\s+MATERIALIZED\s+VIEW\s+CONCURRENTLY/i.test(line)) {
    out.push(line.replace(/CONCURRENTLY\s+/i, ''));
    continue;
  }
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
      out.push(line);
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
  dollarDepth += dollars % 2 === 1 ? 1 : 0;
  if (dollarDepth > 1) dollarDepth = 0; // $$ ... $$ pairs
}
if (acc) out.push(...acc); // safety: flush unterminated

function wrap(stmtLines) {
  const stmt = stmtLines.join('\n');
  return [
    'DO $$',
    'BEGIN',
    ...stmtLines.map((l) => '  ' + l),
    'EXCEPTION WHEN undefined_table OR undefined_column THEN',
    "  RAISE NOTICE 'perf-v1 skipped (schema drift): %', SQLERRM;",
    'END',
    '$$;',
  ].join('\n');
}

fs.writeFileSync(p, out.join(eol), { encoding: 'utf8' });
console.log('transformed. lines:', out.length);
