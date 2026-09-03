-- ═══════════════════════════════════════════════════════════════════
-- NexoraOS™ — NEB-15: Unified Revenue Engine
-- Migration: 20260829_unified_revenue_engine.sql
-- Purpose: Support ANY revenue type for various project activities
--          with full lifecycle, IPSAS double-entry automation & intelligence
-- Standard: IPSAS 9 (Revenue from Exchange Transactions),
--           IPSAS 23 (Revenue from Non-Exchange Transactions)
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Revenue Streams Registry ─────────────────────────────────
-- Defines every revenue type the organization can earn, its recognition
-- policy and its default GL accounts. Adding a new revenue type never
-- requires code changes — just a new row here.

CREATE TABLE IF NOT EXISTS revenue_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  stream_code VARCHAR(60) NOT NULL,
  name_ar VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  description TEXT,
  -- Recognition policy: CASH_BASIS (on collection) | ACCRUAL (on approval)
  -- | DEFERRED (liability until earned)
  recognition_method VARCHAR(20) NOT NULL DEFAULT 'CASH_BASIS'
    CHECK (recognition_method IN ('CASH_BASIS', 'ACCRUAL', 'DEFERRED')),
  -- Non-exchange (donations/grants) vs exchange (sales/services) per IPSAS
  exchange_type VARCHAR(20) NOT NULL DEFAULT 'NON_EXCHANGE'
    CHECK (exchange_type IN ('NON_EXCHANGE', 'EXCHANGE')),
  is_restricted BOOLEAN NOT NULL DEFAULT FALSE,
  -- Default GL accounts for automated posting
  debit_account_id UUID REFERENCES chart_of_accounts(id),   -- Cash / AR
  credit_account_id UUID REFERENCES chart_of_accounts(id),  -- Revenue
  deferred_account_id UUID REFERENCES chart_of_accounts(id),-- Deferred revenue liability
  default_currency VARCHAR(3) NOT NULL DEFAULT 'YER',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, stream_code)
);

-- ─── 2. Unified Revenue Records ─────────────────────────────────
-- One document for ANY revenue (donation, grant, sponsorship, service fee,
-- sales, investment return, membership, rental, event, in-kind, other)
-- linked to program / project / WBS activity.

CREATE TABLE IF NOT EXISTS revenue_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  revenue_number VARCHAR(40) NOT NULL UNIQUE,
  stream_id UUID REFERENCES revenue_streams(id),
  revenue_type VARCHAR(60) NOT NULL,
  -- Lifecycle: DRAFT → PENDING_APPROVAL → APPROVED → POSTED
  --            → PARTIALLY_COLLECTED → COLLECTED  |  VOIDED / REJECTED
  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT','PENDING_APPROVAL','APPROVED','POSTED',
                      'PARTIALLY_COLLECTED','COLLECTED','REJECTED','VOIDED')),
  counterparty_name VARCHAR(255),
  counterparty_party_id UUID,
  program_id UUID REFERENCES programs(id),
  project_id UUID REFERENCES projects(id),
  activity_id UUID, -- WBS activity linkage (NEB-04/NEB-05)
  amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  currency_code VARCHAR(3) NOT NULL DEFAULT 'YER',
  exchange_rate NUMERIC(18,8) NOT NULL DEFAULT 1,
  amount_base NUMERIC(18,2) NOT NULL DEFAULT 0,
  collected_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  collected_amount_base NUMERIC(18,2) NOT NULL DEFAULT 0,
  earned_amount_base NUMERIC(18,2) NOT NULL DEFAULT 0,
  revenue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  description TEXT,
  reference_number VARCHAR(100),
  ledger_transaction_id UUID, -- posted IPSAS transaction (recognition)
  rejection_reason TEXT,
  metadata JSONB,
  created_by UUID,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ─── 3. Revenue Collections (partial / full settlement) ─────────

CREATE TABLE IF NOT EXISTS revenue_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  revenue_record_id UUID NOT NULL REFERENCES revenue_records(id),
  collection_number VARCHAR(40) NOT NULL UNIQUE,
  amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  currency_code VARCHAR(3) NOT NULL DEFAULT 'YER',
  exchange_rate NUMERIC(18,8) NOT NULL DEFAULT 1,
  amount_base NUMERIC(18,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  collection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ledger_transaction_id UUID,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 4. Performance Indexes ─────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_revenue_records_org_status
  ON revenue_records (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_revenue_records_org_date
  ON revenue_records (organization_id, revenue_date DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_records_project
  ON revenue_records (project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_revenue_records_activity
  ON revenue_records (activity_id) WHERE activity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_revenue_records_stream
  ON revenue_records (stream_id) WHERE stream_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_revenue_collections_record
  ON revenue_collections (revenue_record_id);
CREATE INDEX IF NOT EXISTS idx_revenue_streams_org_active
  ON revenue_streams (organization_id, is_active);

-- ─── 5. Revenue Performance View (Intelligence) ─────────────────

CREATE OR REPLACE VIEW v_revenue_performance AS
SELECT
  rr.organization_id,
  rr.revenue_type,
  rr.program_id,
  rr.project_id,
  rr.activity_id,
  rs.name_ar AS stream_name_ar,
  rs.is_restricted,
  rs.exchange_type,
  rr.currency_code,
  COUNT(*) AS record_count,
  COALESCE(SUM(rr.amount_base), 0) AS total_amount_base,
  COALESCE(SUM(rr.collected_amount_base), 0) AS total_collected_base,
  COALESCE(SUM(rr.earned_amount_base), 0) AS total_earned_base,
  COALESCE(SUM(rr.amount_base - rr.collected_amount_base), 0) AS total_outstanding_base,
  DATE_TRUNC('month', rr.revenue_date) AS revenue_month
FROM revenue_records rr
LEFT JOIN revenue_streams rs ON rs.id = rr.stream_id
WHERE rr.deleted_at IS NULL
  AND rr.status NOT IN ('DRAFT','REJECTED','VOIDED')
GROUP BY rr.organization_id, rr.revenue_type, rr.program_id, rr.project_id,
         rr.activity_id, rs.name_ar, rs.is_restricted, rs.exchange_type,
         rr.currency_code, DATE_TRUNC('month', rr.revenue_date);

-- ─── 6. Atomic Numbering Sequence ───────────────────────────────

CREATE SEQUENCE IF NOT EXISTS revenue_record_seq START 1;
CREATE SEQUENCE IF NOT EXISTS revenue_collection_seq START 1;

-- ─── 8. Audit Logs Schema Drift Fix ─────────────────────────────
-- Multiple audit writers (policy middleware, engines, security core)
-- write a `details` jsonb column; the live table lacks it.
-- Adding it settles the drift for ALL writers at once.

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details JSONB;

-- ─── 7. Seed Default Revenue Streams ────────────────────────────
-- Defaults resolve GL accounts at posting time via engine fallback logic,
-- so seeds remain valid across organizations with different COAs.

INSERT INTO revenue_streams (organization_id, stream_code, name_ar, name_en, recognition_method, exchange_type, is_restricted, default_currency)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'DONATION_GENERAL',    'تبرعات عامة',                    'General Donations',           'CASH_BASIS', 'NON_EXCHANGE', FALSE, 'YER'),
  ('00000000-0000-0000-0000-000000000001', 'DONATION_RESTRICTED', 'تبرعات مقيدة على برامج',         'Restricted Donations',        'CASH_BASIS', 'NON_EXCHANGE', TRUE,  'YER'),
  ('00000000-0000-0000-0000-000000000001', 'GRANT_INSTITUTIONAL', 'منح حكومية ومؤسسية ودولية',      'Institutional Grants',        'ACCRUAL',    'NON_EXCHANGE', TRUE,  'USD'),
  ('00000000-0000-0000-0000-000000000001', 'SPONSORSHIP',         'كفالات ورعايات',                 'Sponsorships',                'CASH_BASIS', 'NON_EXCHANGE', FALSE, 'YER'),
  ('00000000-0000-0000-0000-000000000001', 'SERVICE_FEE',         'رسوم خدمات وتقييم ميداني',       'Service Fees',                'ACCRUAL',    'EXCHANGE',     FALSE, 'YER'),
  ('00000000-0000-0000-0000-000000000001', 'GOODS_SALES',         'مبيعات أصول ومنتجات',            'Sales of Goods',              'ACCRUAL',    'EXCHANGE',     FALSE, 'YER'),
  ('00000000-0000-0000-0000-000000000001', 'INVESTMENT_RETURN',   'عوائد استثمارية',                'Investment Returns',          'CASH_BASIS', 'NON_EXCHANGE', FALSE, 'YER'),
  ('00000000-0000-0000-0000-000000000001', 'ENDOWMENT_RETURN',    'عوائد أوقاف',                    'Endowment Returns',           'CASH_BASIS', 'NON_EXCHANGE', FALSE, 'YER'),
  ('00000000-0000-0000-0000-000000000001', 'MEMBERSHIP_FEE',      'اشتراكات عضويات',                'Membership Fees',             'CASH_BASIS', 'EXCHANGE',     FALSE, 'YER'),
  ('00000000-0000-0000-0000-000000000001', 'RENTAL_INCOME',       'إيرادات إيجارات',                'Rental Income',               'ACCRUAL',    'EXCHANGE',     FALSE, 'YER'),
  ('00000000-0000-0000-0000-000000000001', 'EVENT_INCOME',        'إيرادات فعاليات وحملات',         'Event & Campaign Income',     'CASH_BASIS', 'NON_EXCHANGE', FALSE, 'YER'),
  ('00000000-0000-0000-0000-000000000001', 'IN_KIND_DONATION',    'تبرعات عينية',                   'In-Kind Donations',           'CASH_BASIS', 'NON_EXCHANGE', FALSE, 'YER'),
  ('00000000-0000-0000-0000-000000000001', 'OTHER_REVENUE',       'إيرادات أخرى متنوعة',            'Other Revenue',               'CASH_BASIS', 'NON_EXCHANGE', FALSE, 'YER')
ON CONFLICT (organization_id, stream_code) DO NOTHING;
