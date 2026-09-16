-- ═══════════════════════════════════════════════════════════════════
-- NexoraOS™ — Immutable Audit Ledger (SHA-256 Chain)
-- Migration: 20260915_001_immutable_audit_ledger.up.sql
-- Purpose: Tamper-proof audit trail for all financial transactions
--          with cryptographic chain linking per IPSAS 10.
-- Standard: IPSAS 10, AML/CFT compliance, SoD governance
-- Note: Fully idempotent (IF NOT EXISTS) — safe to re-apply.
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Immutable Audit Ledger ──────────────────────────
CREATE TABLE IF NOT EXISTS immutable_audit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  journal_header_id UUID NOT NULL REFERENCES journal_headers(id) ON DELETE CASCADE,
  ledger_hash CHAR(64) NOT NULL,
  previous_ledger_hash CHAR(64) NOT NULL,
  ledger_number INT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, journal_header_id)
);

CREATE INDEX IF NOT EXISTS idx_immutable_org ON immutable_audit_ledger(organization_id);
CREATE INDEX IF NOT EXISTS idx_immutable_chain ON immutable_audit_ledger(previous_ledger_hash);
CREATE INDEX IF NOT EXISTS idx_immutable_header ON immutable_audit_ledger(journal_header_id);

-- ─── 2. Function: Generate Ledger Hash ──────────────────
CREATE OR REPLACE FUNCTION generate_ledger_hash(
  p_organization_id UUID,
  p_journal_header_id UUID,
  p_previous_hash CHAR(64),
  p_ledger_number INT
) RETURNS CHAR(64) AS $$
DECLARE
  v_data TEXT;
  v_hash CHAR(64);
BEGIN
  v_data := p_organization_id::TEXT || ':' || p_journal_header_id::TEXT || ':' || p_previous_hash || ':' || p_ledger_number::TEXT || ':' || NOW()::TEXT;
  v_hash := encode(digest(v_data, 'sha256'), 'hex');
  RETURN v_hash;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ─── 3. Function: Verify Chain Integrity ────────────────
CREATE OR REPLACE FUNCTION verify_audit_chain(
  p_organization_id UUID
) RETURNS TABLE (
  ledger_id UUID,
  ledger_number INT,
  ledger_hash CHAR(64),
  previous_hash CHAR(64),
  is_valid BOOLEAN,
  expected_hash CHAR(64)
) AS $$
DECLARE
  rec RECORD;
  v_expected CHAR(64);
  v_prev_hash CHAR(64) := '0000000000000000000000000000000000000000000000000000000000000000';
BEGIN
  FOR rec IN
    SELECT id, ledger_number, ledger_hash, previous_ledger_hash
    FROM immutable_audit_ledger
    WHERE organization_id = p_organization_id
    ORDER BY ledger_number ASC
  LOOP
    v_expected := generate_ledger_hash(
      p_organization_id,
      rec.id,
      v_prev_hash,
      rec.ledger_number
    );
    is_valid := (rec.ledger_hash = v_expected);
    expected_hash := v_expected;
    ledger_id := rec.id;
    ledger_number := rec.ledger_number;
    ledger_hash := rec.ledger_hash;
    previous_hash := rec.previous_ledger_hash;
    RETURN NEXT;
    v_prev_hash := rec.ledger_hash;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ─── 4. Period Lock Log ─────────────────────────────────
CREATE TABLE IF NOT EXISTS period_lock_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  fiscal_period_id UUID NOT NULL REFERENCES fiscal_periods(id),
  lock_type VARCHAR(20) NOT NULL CHECK (lock_type IN ('SOFT', 'HARD')),
  action VARCHAR(20) NOT NULL CHECK (action IN ('LOCK', 'UNLOCK', 'FORCE_UNLOCK')),
  reason TEXT,
  performed_by UUID REFERENCES users(id),
  performed_by_role VARCHAR(50),
  approved_by UUID REFERENCES users(id),
  approval_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_period_lock_org ON period_lock_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_period_lock_period ON period_lock_log(fiscal_period_id);

-- ─── 5. Segregation of Duties Matrix ────────────────────
CREATE TABLE IF NOT EXISTS segregation_of_duties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  role_name VARCHAR(50) NOT NULL CHECK (role_name IN ('JOURNAL_ORIGINATOR', 'FINANCIAL_REVIEWER', 'FINANCIAL_APPROVER', 'INTERNAL_AUDITOR', 'SYSTEM_ADMIN')),
  can_create BOOLEAN NOT NULL DEFAULT FALSE,
  can_review BOOLEAN NOT NULL DEFAULT FALSE,
  can_approve BOOLEAN NOT NULL DEFAULT FALSE,
  can_post BOOLEAN NOT NULL DEFAULT FALSE,
  can_reverse BOOLEAN NOT NULL DEFAULT FALSE,
  can_lock_period BOOLEAN NOT NULL DEFAULT FALSE,
  can_close_period BOOLEAN NOT NULL DEFAULT FALSE,
  can_audit BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_users BOOLEAN NOT NULL DEFAULT FALSE,
  can_override_lock BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, role_name)
);

CREATE INDEX IF NOT EXISTS idx_sod_org ON segregation_of_duties(organization_id);

-- ─── 6. Fund Balances (Restricted vs Unrestricted) ──────
CREATE TABLE IF NOT EXISTS fund_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  fund_id UUID NOT NULL REFERENCES financial_dimensions(id),
  donor_id UUID REFERENCES financial_dimensions(id),
  fund_type VARCHAR(20) NOT NULL CHECK (fund_type IN ('UNRESTRICTED', 'RESTRICTED', 'TEMPORARILY_RESTRICTED', 'PERMANENTLY_RESTRICTED')),
  opening_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_receipts NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_disbursements NUMERIC(15,2) NOT NULL DEFAULT 0,
  current_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, fund_id, donor_id)
);

CREATE INDEX IF NOT EXISTS idx_fund_balance_org ON fund_balances(organization_id);
CREATE INDEX IF NOT EXISTS idx_fund_balance_fund ON fund_balances(fund_id);

-- ─── 7. Fixed Assets (IPSAS 17) ─────────────────────────
CREATE TABLE IF NOT EXISTS fixed_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  asset_code VARCHAR(30) NOT NULL,
  name_ar VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  asset_group VARCHAR(50) NOT NULL,
  acquisition_date DATE NOT NULL,
  acquisition_cost NUMERIC(15,2) NOT NULL,
  currency_code VARCHAR(3) NOT NULL DEFAULT 'USD',
  accumulated_depreciation NUMERIC(15,2) NOT NULL DEFAULT 0,
  net_book_value NUMERIC(15,2) GENERATED ALWAYS AS (acquisition_cost - accumulated_depreciation) STORED,
  useful_life_months INT NOT NULL,
  depreciation_method VARCHAR(20) NOT NULL CHECK (depreciation_method IN ('STRAIGHT_LINE', 'SUM_OF_YEARS', 'UNITS_OF_PRODUCTION')),
  salvage_value NUMERIC(15,2) NOT NULL DEFAULT 0,
  location VARCHAR(200),
  serial_number VARCHAR(100),
  asset_status VARCHAR(20) NOT NULL DEFAULT 'IN_USE' CHECK (asset_status IN ('IN_USE', 'MAINTENANCE', 'DISPOSED', 'REVALUED', 'HELD_FOR_SALE')),
  fund_id UUID REFERENCES financial_dimensions(id),
  donor_id UUID REFERENCES financial_dimensions(id),
  project_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, asset_code)
);

CREATE INDEX IF NOT EXISTS idx_fixed_assets_org ON fixed_assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_group ON fixed_assets(asset_group);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_status ON fixed_assets(asset_status);

-- ─── 8. Depreciation Schedule ───────────────────────────
CREATE TABLE IF NOT EXISTS depreciation_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  asset_id UUID NOT NULL REFERENCES fixed_assets(id) ON DELETE CASCADE,
  fiscal_period_id UUID NOT NULL REFERENCES fiscal_periods(id),
  period_number INT NOT NULL,
  depreciation_amount NUMERIC(15,2) NOT NULL,
  accumulated_to_date NUMERIC(15,2) NOT NULL,
  remaining_depreciable NUMERIC(15,2) NOT NULL,
  depreciation_method VARCHAR(20) NOT NULL,
  journal_entry_id UUID REFERENCES journal_headers(id),
  status VARCHAR(20) NOT NULL DEFAULT 'POSTED' CHECK (status IN ('PENDING', 'POSTED', 'REVERSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, asset_id, fiscal_period_id)
);

CREATE INDEX IF NOT EXISTS idx_dep_schedule_asset ON depreciation_schedule(asset_id);
CREATE INDEX IF NOT EXISTS idx_dep_schedule_period ON depreciation_schedule(fiscal_period_id);

-- ─── 9. Asset Disposal ──────────────────────────────────
CREATE TABLE IF NOT EXISTS asset_disposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  asset_id UUID NOT NULL REFERENCES fixed_assets(id),
  disposal_date DATE NOT NULL,
  disposal_type VARCHAR(20) NOT NULL CHECK (disposal_type IN ('SALE', 'SCRAP', 'DONATION', 'EXCHANGE', 'WRITEOFF')),
  disposal_value NUMERIC(15,2) NOT NULL,
  accumulated_depreciation NUMERIC(15,2) NOT NULL,
  net_book_value NUMERIC(15,2) NOT NULL,
  gain_loss NUMERIC(15,2) NOT NULL,
  journal_entry_id UUID REFERENCES journal_headers(id),
  disposed_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 10. Asset Revaluation ──────────────────────────────
CREATE TABLE IF NOT EXISTS asset_revaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  asset_id UUID NOT NULL REFERENCES fixed_assets(id),
  revaluation_date DATE NOT NULL,
  previous_cost NUMERIC(15,2) NOT NULL,
  new_cost NUMERIC(15,2) NOT NULL,
  revaluation_amount NUMERIC(15,2) NOT NULL,
  accumulated_depreciation_adjustment NUMERIC(15,2) NOT NULL,
  journal_entry_id UUID REFERENCES journal_headers(id),
  revalued_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 11. Budget Reservations ────────────────────────────
CREATE TABLE IF NOT EXISTS budget_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  project_id UUID NOT NULL,
  budget_line_id UUID NOT NULL REFERENCES chart_of_accounts(id),
  fund_id UUID REFERENCES financial_dimensions(id),
  donor_id UUID REFERENCES financial_dimensions(id),
  reservation_amount NUMERIC(15,2) NOT NULL,
  consumed_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  remaining_amount NUMERIC(15,2) GENERATED ALWAYS AS (reservation_amount - consumed_amount) STORED,
  reservation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'RESERVED' CHECK (status IN ('RESERVED', 'CONVERTED_TO_COMMITMENT', 'RELEASED', 'EXPIRED')),
  requested_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  reference VARCHAR(60),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_budget_res_org ON budget_reservations(organization_id);
CREATE INDEX IF NOT EXISTS idx_budget_res_project ON budget_reservations(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_res_status ON budget_reservations(status);

-- ─── 12. Financial Dimensions Table ─────────────────────
CREATE TABLE IF NOT EXISTS financial_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  dimension_type VARCHAR(20) NOT NULL CHECK (dimension_type IN ('BRANCH', 'DONOR_GRANT', 'COST_CENTER', 'PROJECT_ACTIVITY', 'INTERCOMPANY', 'SECONDARY')),
  dimension_code VARCHAR(30) NOT NULL,
  name_ar VARCHAR(150) NOT NULL,
  name_en VARCHAR(150) NOT NULL,
  parent_id UUID REFERENCES financial_dimensions(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, dimension_type, dimension_code)
);

CREATE INDEX IF NOT EXISTS idx_fin_dim_org ON financial_dimensions(organization_id);
CREATE INDEX IF NOT EXISTS idx_fin_dim_type ON financial_dimensions(dimension_type);
CREATE INDEX IF NOT EXISTS idx_fin_dim_active ON financial_dimensions(is_active);

-- ─── 13. Add Fund/Donor columns to transaction_lines ─────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transaction_lines' AND column_name = 'donor_id'
  ) THEN
    ALTER TABLE transaction_lines ADD COLUMN donor_id UUID REFERENCES financial_dimensions(id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transaction_lines' AND column_name = 'cost_center_id'
  ) THEN
    ALTER TABLE transaction_lines ADD COLUMN cost_center_id UUID REFERENCES financial_dimensions(id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transaction_lines' AND column_name = 'intercompany_id'
  ) THEN
    ALTER TABLE transaction_lines ADD COLUMN intercompany_id UUID REFERENCES financial_dimensions(id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transaction_lines' AND column_name = 'secondary_dimension_id'
  ) THEN
    ALTER TABLE transaction_lines ADD COLUMN secondary_dimension_id UUID REFERENCES financial_dimensions(id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transaction_lines' AND column_name = 'fund_id'
  ) THEN
    ALTER TABLE transaction_lines ADD COLUMN fund_id UUID REFERENCES financial_dimensions(id);
  END IF;
END $$;

-- ─── 14. Add period lock columns to fiscal_periods ───────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fiscal_periods' AND column_name = 'is_soft_locked'
  ) THEN
    ALTER TABLE fiscal_periods ADD COLUMN is_soft_locked BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fiscal_periods' AND column_name = 'soft_locked_at'
  ) THEN
    ALTER TABLE fiscal_periods ADD COLUMN soft_locked_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fiscal_periods' AND column_name = 'locked_by'
  ) THEN
    ALTER TABLE fiscal_periods ADD COLUMN locked_by UUID REFERENCES users(id);
  END IF;
END $$;

COMMENT ON TABLE immutable_audit_ledger IS 'Tamper-proof SHA-256 chained audit trail for all financial journal entries (IPSAS 10)';
COMMENT ON TABLE period_lock_log IS 'Log of all period lock/unlock actions with approval trail';
COMMENT ON TABLE segregation_of_duties IS 'SoD matrix defining role-based permissions to prevent conflicts of interest';
COMMENT ON TABLE fund_balances IS 'Tracking of restricted vs unrestricted fund balances per donor/grant';
COMMENT ON TABLE fixed_assets IS 'Fixed asset register compliant with IPSAS 17';
COMMENT ON TABLE depreciation_schedule IS 'Automatic depreciation schedule with journal entry linkage';
COMMENT ON TABLE budget_reservations IS 'Budget reservation tracking before commitment (4-state control)';
COMMENT ON TABLE financial_dimensions IS '7-dimensional financial dimensions for segmented Chart of Accounts';
