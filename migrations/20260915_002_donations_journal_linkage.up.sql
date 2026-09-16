-- ═══════════════════════════════════════════════════════════════════
-- NexoraOS™ — Donations↔Transactions & Journal Entries↔Transactions
-- Migration: 20260915_002_donations_journal_linkage.up.sql
-- Purpose: Link donations to transactions and journal entries to
--          transactions for full traceability and IPSAS 23 compliance.
-- Note: Fully idempotent (IF NOT EXISTS / DO blocks).
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Add donation_id to transactions ───────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'donation_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN donation_id UUID REFERENCES donors(id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'grant_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN grant_id UUID REFERENCES grants(id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'fund_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN fund_id UUID REFERENCES financial_dimensions(id);
  END IF;
END $$;

-- ─── 2. Add transaction_id references to journal entries ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'journal_entries' AND column_name = 'transaction_id'
  ) THEN
    ALTER TABLE journal_entries ADD COLUMN transaction_id UUID REFERENCES transactions(id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'journal_entry_lines' AND column_name = 'transaction_id'
  ) THEN
    ALTER TABLE journal_entry_lines ADD COLUMN transaction_id UUID REFERENCES transactions(id);
  END IF;
END $$;

-- ─── 3. Create exchange_rate_log for currency conversion ──
CREATE TABLE IF NOT EXISTS exchange_rate_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  transaction_id UUID REFERENCES transactions(id),
  source_currency VARCHAR(3) NOT NULL,
  target_currency VARCHAR(3) NOT NULL,
  source_amount NUMERIC(15,6) NOT NULL,
  target_amount NUMERIC(15,6) NOT NULL,
  exchange_rate NUMERIC(15,6) NOT NULL,
  rate_date DATE NOT NULL DEFAULT CURRENT_DATE,
  rate_source VARCHAR(50),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exchange_tx ON exchange_rate_log(transaction_id);
CREATE INDEX IF NOT EXISTS idx_exchange_org ON exchange_rate_log(organization_id);

-- ─── 4. Create IATI export log for grant reporting ────────
CREATE TABLE IF NOT EXISTS iati_export_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  grant_id UUID REFERENCES grants(id),
  export_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  export_type VARCHAR(20) NOT NULL CHECK (export_type IN ('FULL', 'INCREMENTAL')),
  xml_output TEXT,
  validation_status VARCHAR(20) CHECK (validation_status IN ('VALID', 'INVALID', 'PENDING')),
  errors TEXT,
  exported_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_iati_grant ON iati_export_log(grant_id);
CREATE INDEX IF NOT EXISTS idx_iati_org ON iati_export_log(organization_id);

-- ─── 5. Add mandatory fund validation trigger ────────────
CREATE OR REPLACE FUNCTION enforce_fund_dimension()
RETURNS TRIGGER AS $$
BEGIN
  -- Fund/Donor segment is mandatory for all financial transactions
  IF NG.current_setting('app.enforce_fund_segment', true) = 'true' THEN
    IF NEW.fund_id IS NULL THEN
      RAISE EXCEPTION 'Fund/Donor segment is mandatory for all journal entries (IPSAS 23 Compliance)';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_fund_segment ON transaction_lines;
CREATE TRIGGER trg_enforce_fund_segment
  BEFORE INSERT OR UPDATE ON transaction_lines
  FOR EACH ROW
  EXECUTE FUNCTION enforce_fund_dimension();

COMMENT ON FUNCTION enforce_fund_dimension() IS 'Enforces Fund/Donor dimension as mandatory in all transaction lines per IPSAS 23';
