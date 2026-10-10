-- 2026-09-10: Create journal_headers table for audit ledger references
CREATE TABLE IF NOT EXISTS journal_headers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE journal_headers IS 'Headers for journal entries, linked to organizations';