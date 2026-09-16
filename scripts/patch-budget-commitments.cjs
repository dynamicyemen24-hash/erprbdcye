// One-shot repair: drift-tolerant budget_commitments block in 20260830.
const fs = require('fs');
const p = 'migrations/20260830_unified_expense_engine.sql';
const raw = fs.readFileSync(p, 'utf8');
const eol = raw.includes('\r\n') ? '\r\n' : '\n';
const lines = raw.split(/\r?\n/);

const start = lines.findIndex((l) => l.includes('CREATE TABLE IF NOT EXISTS budget_commitments ('));
const endIdx = lines.findIndex(
  (l, i) => i > start && l.includes('idx_budget_commitments_expense')
);
if (start === -1 || endIdx === -1) throw new Error('anchors not found');
console.log('replacing lines', start + 1, 'to', endIdx + 1);

const block = [
  'CREATE TABLE IF NOT EXISTS budget_commitments (',
  '  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,',
  '  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,',
  '  budget_line_id UUID NOT NULL,',
  '  expense_record_id UUID REFERENCES expense_records(id),',
  '  commitment_type VARCHAR(20) NOT NULL, -- COMMITTED, OBLIGATION, ACTUAL',
  '  amount NUMERIC(18,2) NOT NULL,',
  '  committed_by UUID NOT NULL REFERENCES users(id),',
  '  committed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),',
  '  released_at TIMESTAMPTZ,',
  '  release_reason TEXT',
  ');',
  '',
  '-- Drift-tolerant reconciliation (see approval_delegations note above).',
  'DO $$',
  'BEGIN',
  "  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='budget_commitments' AND column_name='budget_line_id') THEN",
  '    ALTER TABLE budget_commitments ADD COLUMN budget_line_id UUID;',
  '  END IF;',
  "  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='budget_commitments' AND column_name='expense_record_id') THEN",
  '    ALTER TABLE budget_commitments ADD COLUMN expense_record_id UUID REFERENCES expense_records(id);',
  '  END IF;',
  "  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='budget_commitments' AND column_name='commitment_type') THEN",
  "    ALTER TABLE budget_commitments ADD COLUMN commitment_type VARCHAR(20);",
  '  END IF;',
  "  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='budget_commitments' AND column_name='amount') THEN",
  '    ALTER TABLE budget_commitments ADD COLUMN amount NUMERIC(18,2);',
  '  END IF;',
  "  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='budget_commitments' AND column_name='committed_by') THEN",
  '    ALTER TABLE budget_commitments ADD COLUMN committed_by UUID REFERENCES users(id);',
  '  END IF;',
  "  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='budget_commitments' AND column_name='committed_at') THEN",
  '    ALTER TABLE budget_commitments ADD COLUMN committed_at TIMESTAMPTZ DEFAULT NOW();',
  '  END IF;',
  "  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='budget_commitments' AND column_name='released_at') THEN",
  '    ALTER TABLE budget_commitments ADD COLUMN released_at TIMESTAMPTZ;',
  '  END IF;',
  "  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='budget_commitments' AND column_name='release_reason') THEN",
  '    ALTER TABLE budget_commitments ADD COLUMN release_reason TEXT;',
  '  END IF;',
  'END',
  '$$;',
  '',
  'DO $$',
  'BEGIN',
  "  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='budget_commitments' AND column_name='budget_line_id')",
  "     AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_budget_commitments_budget_line') THEN",
  '    CREATE INDEX idx_budget_commitments_budget_line ON budget_commitments(budget_line_id);',
  '  END IF;',
  "  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='budget_commitments' AND column_name='expense_record_id')",
  "     AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_budget_commitments_expense') THEN",
  '    CREATE INDEX idx_budget_commitments_expense ON budget_commitments(expense_record_id) WHERE expense_record_id IS NOT NULL;',
  '  END IF;',
  'END',
  '$$;',
];
const next = [...lines.slice(0, start), ...block, ...lines.slice(endIdx + 1)];
fs.writeFileSync(p, next.join(eol), { encoding: 'utf8' });
console.log('patched ok, new total lines:', next.length);
