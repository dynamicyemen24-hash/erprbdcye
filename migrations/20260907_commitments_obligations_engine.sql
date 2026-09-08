-- ═══════════════════════════════════════════════════════════════════
-- NexoraOS™ — NEB-08/NEB-10: Commitments & Obligations Engine
-- Migration: 20260907_commitments_obligations_engine.sql
-- Purpose: Full lifecycle management for financial commitments
--          (تعهدات) and periodic obligations (التزامات) with
--          payment disbursements, reports, documents, and analytics.
-- Standard: IPSAS-compliant budget commitment tracking.
-- NOTE: Fully idempotent (IF NOT EXISTS) — no destructive operations.
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Commitments (التعهدات) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  commitment_number VARCHAR(60) NOT NULL,
  commitment_type VARCHAR(30) NOT NULL DEFAULT 'BUDGET'
    CHECK (commitment_type IN (
      'BUDGET',        -- تعهد ميزانيي
      'DONOR',         -- تعهد منحة / تمويل
      'CONTRACTUAL',   -- تعهد تعاقدي
      'SPONSORSHIP',   -- تعهد كفالة
      'INTER_ORG',     -- تعهد بين مؤسسي
      'GRANT',         -- تعهد منحة دولية
      'OTHER'          -- تعهد آخر
    )),
  title_ar VARCHAR(300) NOT NULL,
  title_en VARCHAR(300),
  description TEXT,
  -- Financial
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  spent_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  remaining_amount NUMERIC(15,2) GENERATED ALWAYS AS (total_amount - spent_amount) STORED,
  currency_code VARCHAR(10) NOT NULL DEFAULT 'YER',
  -- Relationships
  project_id UUID,
  program_id UUID,
  donor_id UUID,
  beneficiary_id UUID,
  contract_id UUID,
  budget_line_id UUID,
  -- Periodicity for recurring commitments
  is_periodic BOOLEAN DEFAULT FALSE,
  periodicity VARCHAR(20) DEFAULT 'ONE_TIME'
    CHECK (periodicity IN (
      'ONE_TIME', 'MONTHLY', 'QUARTERLY', 'SEMESTER', 'ANNUAL', 'CUSTOM'
    )),
  next_due_date DATE,
  -- Lifecycle: DRAFT → APPROVED → ACTIVE → PARTIALLY_FULFILLED → FULFILLED → CLOSED → CANCELLED
  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN (
      'DRAFT', 'SUBMITTED', 'APPROVED', 'ACTIVE', 'PARTIALLY_FULFILLED',
      'FULFILLED', 'CLOSED', 'CANCELLED', 'SUSPENDED'
    )),
  priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL'
    CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  -- Dates
  commitment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_date DATE,
  end_date DATE,
  -- Parties
  committed_by VARCHAR(255),
  committed_by_user_id UUID,
  approved_by VARCHAR(255),
  approved_by_user_id UUID,
  approved_at TIMESTAMPTZ,
  -- Reference
  reference_document TEXT,
  internal_notes TEXT,
  attachments_count INTEGER DEFAULT 0,
  -- Audit
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (organization_id, commitment_number)
);

CREATE INDEX IF NOT EXISTS idx_commitments_org ON commitments(organization_id);
CREATE INDEX IF NOT EXISTS idx_commitments_status ON commitments(status);
CREATE INDEX IF NOT EXISTS idx_commitments_type ON commitments(commitment_type);
CREATE INDEX IF NOT EXISTS idx_commitments_project ON commitments(project_id);
CREATE INDEX IF NOT EXISTS idx_commitments_periodic ON commitments(is_periodic, next_due_date);

-- ─── 2. Obligations (الالتزامات) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  obligation_number VARCHAR(60) NOT NULL,
  obligation_type VARCHAR(30) NOT NULL DEFAULT 'RECURRING'
    CHECK (obligation_type IN (
      'RECURRING',      -- التزام دوري (رواتب، إيجار، اشتراكات)
      'CONTRACTUAL',    -- التزام تعاقدي
      'REGULATORY',     -- التزام قانوني/تنظيمي
      'BENEFICIARY',    -- التزام تجاه المستفيدين
      'DONOR',          -- التزام تجاه المانحين
      'OTHER'           -- التزام آخر
    )),
  title_ar VARCHAR(300) NOT NULL,
  title_en VARCHAR(300),
  description TEXT,
  -- Financial
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  pending_amount NUMERIC(15,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  currency_code VARCHAR(10) NOT NULL DEFAULT 'YER',
  -- Periodicity
  periodicity VARCHAR(20) NOT NULL DEFAULT 'MONTHLY'
    CHECK (periodicity IN (
      'ONE_TIME', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMESTER', 'ANNUAL', 'CUSTOM'
    )),
  frequency_count INTEGER DEFAULT 1,
  -- Relationships
  project_id UUID,
  program_id UUID,
  beneficiary_id UUID,
  vendor_id UUID,
  contract_id UUID,
  budget_line_id UUID,
  -- Lifecycle: DRAFT → ACTIVE → PARTIALLY_PAID → PAID → OVERDUE → CLOSED → CANCELLED
  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN (
      'DRAFT', 'SUBMITTED', 'APPROVED', 'ACTIVE', 'PARTIALLY_PAID',
      'PAID', 'OVERDUE', 'CLOSED', 'CANCELLED', 'SUSPENDED'
    )),
  priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL'
    CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  -- Dates
  obligation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_date DATE,
  end_date DATE,
  next_due_date DATE,
  last_payment_date DATE,
  -- Approval
  created_by VARCHAR(255),
  created_by_user_id UUID,
  approved_by VARCHAR(255),
  approved_by_user_id UUID,
  approved_at TIMESTAMPTZ,
  -- Reference
  reference_document TEXT,
  internal_notes TEXT,
  attachments_count INTEGER DEFAULT 0,
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (organization_id, obligation_number)
);

CREATE INDEX IF NOT EXISTS idx_obligations_org ON obligations(organization_id);
CREATE INDEX IF NOT EXISTS idx_obligations_status ON obligations(status);
CREATE INDEX IF NOT EXISTS idx_obligations_type ON obligations(obligation_type);
CREATE INDEX IF NOT EXISTS idx_obligations_periodic ON obligations(periodicity, next_due_date);
CREATE INDEX IF NOT EXISTS idx_obligations_overdue ON obligations(next_due_date, status) WHERE status IN ('ACTIVE', 'PARTIALLY_PAID');

-- ─── 3. Commitment Payments (مدفوعات التعهدات) ────────────────────
CREATE TABLE IF NOT EXISTS commitment_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  commitment_id UUID NOT NULL REFERENCES commitments(id) ON DELETE CASCADE,
  payment_number VARCHAR(60) NOT NULL,
  payment_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency_code VARCHAR(10) NOT NULL DEFAULT 'YER',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method VARCHAR(20) DEFAULT 'BANK_TRANSFER'
    CHECK (payment_method IN (
      'CASH', 'BANK_TRANSFER', 'CHECK', 'MOBILE_PAYMENT', 'OTHER'
    )),
  voucher_number VARCHAR(60),
  receipt_number VARCHAR(60),
  approved_by VARCHAR(255),
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED'
    CHECK (status IN ('PENDING', 'COMPLETED', 'REVERSED', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_commitment_payments_commitment ON commitment_payments(commitment_id);
CREATE INDEX IF NOT EXISTS idx_commitment_payments_org ON commitment_payments(organization_id);

-- ─── 4. Obligation Payments (مدفوعات الالتزامات) ──────────────────
CREATE TABLE IF NOT EXISTS obligation_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  obligation_id UUID NOT NULL REFERENCES obligations(id) ON DELETE CASCADE,
  payment_number VARCHAR(60) NOT NULL,
  payment_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency_code VARCHAR(10) NOT NULL DEFAULT 'YER',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method VARCHAR(20) DEFAULT 'BANK_TRANSFER'
    CHECK (payment_method IN (
      'CASH', 'BANK_TRANSFER', 'CHECK', 'MOBILE_PAYMENT', 'OTHER'
    )),
  voucher_number VARCHAR(60),
  receipt_number VARCHAR(60),
  approved_by VARCHAR(255),
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED'
    CHECK (status IN ('PENDING', 'COMPLETED', 'REVERSED', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_obligation_payments_obligation ON obligation_payments(obligation_id);
CREATE INDEX IF NOT EXISTS idx_obligation_payments_org ON obligation_payments(organization_id);

-- ─── 5. Commitment Documents (مستندات التعهدات والالتزامات) ────────
CREATE TABLE IF NOT EXISTS commitment_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('COMMITMENT', 'OBLIGATION')),
  entity_id UUID NOT NULL,
  document_type VARCHAR(30) NOT NULL DEFAULT 'ATTACHMENT'
    CHECK (document_type IN (
      'ATTACHMENT', 'SIGNED_CONTRACT', 'APPROVAL_LETTER', 'PAYMENT_RECEIPT',
      'BUDGET_ALLOCATION', 'AUDIT_REPORT', 'CORRESPONDENCE', 'OTHER'
    )),
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500),
  file_size INTEGER,
  uploaded_by VARCHAR(255),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_commitment_documents_entity ON commitment_documents(entity_type, entity_id);

-- ─── 6. Analytics Views ───────────────────────────────────────────

-- Commitments summary by type
CREATE OR REPLACE VIEW v_commitments_summary AS
SELECT
  c.organization_id,
  c.commitment_type,
  COUNT(*) AS total_count,
  SUM(c.total_amount) AS total_committed,
  SUM(c.spent_amount) AS total_spent,
  SUM(c.remaining_amount) AS total_remaining,
  CASE WHEN SUM(c.total_amount) > 0
    THEN ROUND((SUM(c.spent_amount) / SUM(c.total_amount)) * 100, 2)
    ELSE 0 END AS fulfillment_pct,
  COUNT(*) FILTER (WHERE c.status = 'ACTIVE') AS active_count,
  COUNT(*) FILTER (WHERE c.status = 'FULFILLED') AS fulfilled_count,
  COUNT(*) FILTER (WHERE c.status = 'CANCELLED') AS cancelled_count
FROM commitments c
WHERE c.deleted_at IS NULL
GROUP BY c.organization_id, c.commitment_type;

-- Obligations summary by type and overdue status
CREATE OR REPLACE VIEW v_obligations_summary AS
SELECT
  o.organization_id,
  o.obligation_type,
  o.periodicity,
  COUNT(*) AS total_count,
  SUM(o.total_amount) AS total_obligated,
  SUM(o.paid_amount) AS total_paid,
  SUM(o.pending_amount) AS total_pending,
  CASE WHEN SUM(o.total_amount) > 0
    THEN ROUND((SUM(o.paid_amount) / SUM(o.total_amount)) * 100, 2)
    ELSE 0 END AS payment_pct,
  COUNT(*) FILTER (WHERE o.status = 'ACTIVE') AS active_count,
  COUNT(*) FILTER (WHERE o.status = 'OVERDUE') AS overdue_count,
  COUNT(*) FILTER (WHERE o.status = 'PAID') AS paid_count,
  COUNT(*) FILTER (WHERE o.next_due_date < CURRENT_DATE AND o.status IN ('ACTIVE', 'PARTIALLY_PAID')) AS due_soon_count
FROM obligations o
WHERE o.deleted_at IS NULL
GROUP BY o.organization_id, o.obligation_type, o.periodicity;

-- Combined commitments & obligations cash flow projection
CREATE OR REPLACE VIEW v_commitment_obligation_cashflow AS
SELECT
  organization_id,
  'COMMITMENT' AS entity_type,
  commitment_number AS entity_number,
  title_ar,
  total_amount,
  spent_amount AS paid_amount,
  remaining_amount AS pending_amount,
  currency_code,
  status,
  next_due_date AS due_date,
  end_date
FROM commitments WHERE deleted_at IS NULL AND status IN ('ACTIVE', 'PARTIALLY_FULFILLED')
UNION ALL
SELECT
  organization_id,
  'OBLIGATION' AS entity_type,
  obligation_number AS entity_number,
  title_ar,
  total_amount,
  paid_amount,
  pending_amount,
  currency_code,
  status,
  next_due_date AS due_date,
  end_date
FROM obligations WHERE deleted_at IS NULL AND status IN ('ACTIVE', 'PARTIALLY_PAID', 'OVERDUE')
ORDER BY due_date ASC NULLS LAST;
