// One-shot repair for 20260830_unified_expense_engine.sql: drift-tolerant
// approval_delegations block (lines are 0-indexed below; verified by anchor).
const fs = require('fs');
const p = 'migrations/20260830_unified_expense_engine.sql';
const raw = fs.readFileSync(p, 'utf8');
const eol = raw.includes('\r\n') ? '\r\n' : '\n';
const lines = raw.split(/\r?\n/);

const startAnchor = '-- NEB-10: APPROVAL DELEGATIONS';
const endAnchor = 'CREATE INDEX IF NOT EXISTS idx_approval_delegations_active';
const start = lines.findIndex((l) => l.includes(startAnchor));
const endIdx = lines.findIndex((l) => l.includes(endAnchor));
if (start === -1 || endIdx === -1) throw new Error('anchors not found');
console.log('replacing lines', start + 1, 'to', endIdx + 1);

const block = [
  '-- ═══════════════════════════════════════════════════════════════════════',
  '-- NEB-10: APPROVAL DELEGATIONS',
  '-- ═══════════════════════════════════════════════════════════════════════',
  'CREATE TABLE IF NOT EXISTS approval_delegations (',
  '  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,',
  '  delegator_user_id UUID NOT NULL REFERENCES users(id),',
  '  delegate_user_id UUID NOT NULL REFERENCES users(id),',
  '  valid_from TIMESTAMPTZ NOT NULL,',
  '  valid_until TIMESTAMPTZ NOT NULL,',
  '  is_active BOOLEAN NOT NULL DEFAULT TRUE,',
  '  categories JSONB, -- Allowed expense categories, null = all',
  '  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
  ');',
  '',
  '-- Drift-tolerant reconciliation: older environments may already carry an',
  '-- approval_delegations table with a different column set (e.g.',
  '-- delegator_id/delegate_id). CREATE TABLE IF NOT EXISTS is a no-op there,',
  '-- so add the columns this release needs (nullable + best-effort backfill).',
  'DO $$',
  'BEGIN',
  "  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='approval_delegations' AND column_name='delegator_user_id') THEN",
  '    ALTER TABLE approval_delegations ADD COLUMN delegator_user_id UUID REFERENCES users(id);',
  '  END IF;',
  "  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='approval_delegations' AND column_name='delegate_user_id') THEN",
  '    ALTER TABLE approval_delegations ADD COLUMN delegate_user_id UUID REFERENCES users(id);',
  '  END IF;',
  "  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='approval_delegations' AND column_name='valid_from') THEN",
  '    ALTER TABLE approval_delegations ADD COLUMN valid_from TIMESTAMPTZ;',
  '  END IF;',
  "  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='approval_delegations' AND column_name='valid_until') THEN",
  '    ALTER TABLE approval_delegations ADD COLUMN valid_until TIMESTAMPTZ;',
  '  END IF;',
  "  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='approval_delegations' AND column_name='categories') THEN",
  '    ALTER TABLE approval_delegations ADD COLUMN categories JSONB;',
  '  END IF;',
  '  -- Best-effort backfill from legacy column names when present',
  "  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='approval_delegations' AND column_name='delegator_id') THEN",
  '    UPDATE approval_delegations SET delegator_user_id = delegator_id::uuid WHERE delegator_user_id IS NULL AND delegator_id IS NOT NULL;',
  '  END IF;',
  "  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='approval_delegations' AND column_name='delegate_id') THEN",
  '    UPDATE approval_delegations SET delegate_user_id = delegate_id::uuid WHERE delegate_user_id IS NULL AND delegate_id IS NOT NULL;',
  '  END IF;',
  'END',
  '$$;',
  '',
  'DO $$',
  'BEGIN',
  "  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='approval_delegations' AND column_name='delegator_user_id')",
  "     AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_approval_delegations_active') THEN",
  '    CREATE INDEX idx_approval_delegations_active ON approval_delegations(delegator_user_id, is_active) WHERE is_active = TRUE;',
  '  END IF;',
  'END',
  '$$;',
];
// Drop the decorative separator line above the section header (keep file tidy)
let from = start;
if (from > 0 && /^--\s*═+\s*$/.test(lines[from - 1])) from -= 1;
const next = [...lines.slice(0, from), ...block, ...lines.slice(endIdx + 1)];
fs.writeFileSync(p, next.join(eol), { encoding: 'utf8' });
console.log('patched ok, new total lines:', next.length);
