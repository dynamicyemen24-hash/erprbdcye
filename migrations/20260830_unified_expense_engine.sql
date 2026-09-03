/**
 * NexoraOS™ — UAMEX ERP™ — NEB-10: Unified Expense Engine Migration
 * ============================================================================
 * Full expense management system with:
 *  - Expense Categories Registry
 *  - Expense Records with full lifecycle
 *  - Attachments & Documentation
 *  - Approval Workflows
 *  - Payment Schedules
 *  - Budget Commitments
 *  - Petty Cash Management
 *  - Recurring Expense Templates
 *  - Batch Journal Entries
 * 
 * Run: psql $DATABASE_URL -f migrations/20260830_unified_expense_engine.sql
 * ============================================================================
 */

-- ═══════════════════════════════════════════════════════════════════════════════
-- NEB-10: EXPENSE CATEGORIES REGISTRY
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category_code VARCHAR(60) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  description TEXT,
  category_type VARCHAR(30) NOT NULL, -- OPERATIONAL, PROGRAM, ADMINISTRATIVE, CAPITAL, EMERGENCY, TRAVEL, etc.
  recognition_method VARCHAR(30) NOT NULL DEFAULT 'ACCRUAL_BASIS', -- CASH_BASIS, ACCRUAL_BASIS, MODIFIED_CASH
  is_budgeted BOOLEAN NOT NULL DEFAULT TRUE,
  requires_receipt BOOLEAN NOT NULL DEFAULT TRUE,
  requires_approval BOOLEAN NOT NULL DEFAULT TRUE,
  approval_threshold NUMERIC(18,2),
  debit_account_id UUID REFERENCES chart_of_accounts(id),
  credit_account_id UUID REFERENCES chart_of_accounts(id),
  default_vat_rate NUMERIC(5,2) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  parent_category_id UUID REFERENCES expense_categories(id),
  sort_order INT NOT NULL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, category_code)
);

CREATE INDEX IF NOT EXISTS idx_expense_categories_org_type ON expense_categories(organization_id, category_type);
CREATE INDEX IF NOT EXISTS idx_expense_categories_active ON expense_categories(organization_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_expense_categories_parent ON expense_categories(parent_category_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- NEB-10: EXPENSE RECORDS — Core Entity
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS expense_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  expense_number VARCHAR(40) NOT NULL UNIQUE,
  category_id UUID REFERENCES expense_categories(id),
  category_code VARCHAR(60) NOT NULL,
  category_name_ar VARCHAR(255) NOT NULL,
  expense_type VARCHAR(30) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  
  -- Counterparty
  counterparty_name VARCHAR(255) NOT NULL,
  counterparty_party_id UUID,
  counterparty_vendor_id UUID,
  counterparty_type VARCHAR(30) NOT NULL DEFAULT 'VENDOR',
  
  -- Amount & Currency
  amount NUMERIC(18,2) NOT NULL,
  currency_code VARCHAR(10) NOT NULL DEFAULT 'YER',
  exchange_rate NUMERIC(18,6) NOT NULL DEFAULT 1,
  amount_base NUMERIC(18,2) NOT NULL DEFAULT 0,
  
  -- VAT/Tax
  vat_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  vat_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  is_vat_registered BOOLEAN NOT NULL DEFAULT FALSE,
  vat_recoverable BOOLEAN NOT NULL DEFAULT FALSE,
  tax_withheld NUMERIC(18,2),
  
  -- Net
  net_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  
  -- Project/Activity Attribution (WBS)
  program_id UUID REFERENCES programs(id),
  project_id UUID REFERENCES projects(id),
  activity_id UUID REFERENCES activities(id),
  
  -- Cost Center
  cost_center_id UUID REFERENCES cost_centers(id),
  
  -- Budget
  budget_line_id UUID,
  budget_commitment_id UUID,
  committed_amount NUMERIC(18,2),
  variance_amount NUMERIC(18,2),
  
  -- Payment
  payment_method VARCHAR(30),
  payment_reference VARCHAR(255),
  payment_due_date DATE,
  payment_date DATE,
  paid_amount NUMERIC(18,2) DEFAULT 0,
  
  -- Receipt
  receipt_number VARCHAR(100),
  receipt_attachment_url TEXT,
  has_receipt BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Description
  description TEXT,
  reference_number VARCHAR(100),
  notes TEXT,
  
  -- Approval
  approval_level INT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- IPSAS Ledger
  ledger_transaction_id UUID REFERENCES transactions(id),
  posted_at TIMESTAMPTZ,
  posted_by UUID REFERENCES users(id),
  
  -- Petty Cash
  petty_cash_request_id UUID,
  
  -- Audit
  metadata JSONB,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_expense_records_org_status ON expense_records(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_expense_records_org_date ON expense_records(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expense_records_category ON expense_records(category_code);
CREATE INDEX IF NOT EXISTS idx_expense_records_project ON expense_records(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expense_records_activity ON expense_records(activity_id) WHERE activity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expense_records_cost_center ON expense_records(cost_center_id) WHERE cost_center_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expense_records_counterparty ON expense_records(organization_id, counterparty_name);
CREATE INDEX IF NOT EXISTS idx_expense_records_due_date ON expense_records(payment_due_date) WHERE payment_due_date IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- NEB-10: EXPENSE ATTACHMENTS — Receipts & Documents
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS expense_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  expense_record_id UUID NOT NULL REFERENCES expense_records(id) ON DELETE CASCADE,
  attachment_type VARCHAR(30) NOT NULL DEFAULT 'RECEIPT', -- RECEIPT, INVOICE, CONTRACT, APPROVAL_DOC, OTHER
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expense_attachments_record ON expense_attachments(expense_record_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- NEB-10: APPROVAL WORKFLOW CONFIGURATION
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS approval_workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workflow_name VARCHAR(100) NOT NULL,
  category_type VARCHAR(30) NOT NULL,
  min_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  max_amount NUMERIC(18,2),
  levels JSONB NOT NULL, -- [{level: 1, approver_role: 'MANAGER'}, {level: 2, approver_role: 'DIRECTOR'}]
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, workflow_name)
);

CREATE INDEX IF NOT EXISTS idx_approval_workflows_category ON approval_workflows(category_type);

-- ═══════════════════════════════════════════════════════════════════════════════
-- NEB-10: APPROVAL HISTORY
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS expense_approval_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_record_id UUID NOT NULL REFERENCES expense_records(id) ON DELETE CASCADE,
  approval_level INT NOT NULL,
  approver_user_id UUID NOT NULL REFERENCES users(id),
  approver_name VARCHAR(255),
  approver_role VARCHAR(100),
  action VARCHAR(20) NOT NULL, -- APPROVE, REJECT, ESCALATE, DELEGATE
  comments TEXT,
  delegated_to UUID REFERENCES users(id),
  action_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expense_approval_history_record ON expense_approval_history(expense_record_id);
CREATE INDEX IF NOT EXISTS idx_expense_approval_history_approver ON expense_approval_history(approver_user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- NEB-10: APPROVAL DELEGATIONS
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS approval_delegations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  delegator_user_id UUID NOT NULL REFERENCES users(id),
  delegate_user_id UUID NOT NULL REFERENCES users(id),
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  categories JSONB, -- Allowed expense categories, null = all
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_delegations_active ON approval_delegations(delegator_user_id, is_active) WHERE is_active = TRUE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- NEB-10: PAYMENT SCHEDULES
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS expense_payment_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  expense_record_id UUID NOT NULL REFERENCES expense_records(id) ON DELETE CASCADE,
  installment_number INT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_amount NUMERIC(18,2) NOT NULL,
  actual_date DATE,
  actual_amount NUMERIC(18,2),
  payment_method VARCHAR(30),
  payment_reference VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, PAID, OVERDUE, CANCELLED
  paid_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expense_payment_schedules_record ON expense_payment_schedules(expense_record_id);
CREATE INDEX IF NOT EXISTS idx_expense_payment_schedules_status ON expense_payment_schedules(status) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_expense_payment_schedules_due ON expense_payment_schedules(scheduled_date) WHERE status = 'PENDING';

-- ═══════════════════════════════════════════════════════════════════════════════
-- NEB-10: BUDGET COMMITMENTS
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS budget_commitments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  budget_line_id UUID NOT NULL,
  expense_record_id UUID REFERENCES expense_records(id),
  commitment_type VARCHAR(20) NOT NULL, -- COMMITTED, OBLIGATION, ACTUAL
  amount NUMERIC(18,2) NOT NULL,
  committed_by UUID NOT NULL REFERENCES users(id),
  committed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  release_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_budget_commitments_budget_line ON budget_commitments(budget_line_id);
CREATE INDEX IF NOT EXISTS idx_budget_commitments_expense ON budget_commitments(expense_record_id) WHERE expense_record_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- NEB-10: PETTY CASH MANAGEMENT
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS petty_cash_floats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  custodian_id UUID NOT NULL REFERENCES users(id),
  custodian_name VARCHAR(255) NOT NULL,
  total_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  current_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency_code VARCHAR(10) NOT NULL DEFAULT 'YER',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_replenishment_date DATE,
  min_balance_threshold NUMERIC(18,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS petty_cash_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  request_number VARCHAR(40) NOT NULL UNIQUE,
  requester_id UUID NOT NULL REFERENCES users(id),
  requester_name VARCHAR(255) NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  purpose TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, ISSUED, SETTLED, REJECTED
  custodian_id UUID REFERENCES users(id),
  issued_date TIMESTAMPTZ,
  settled_date TIMESTAMPTZ,
  receipt_attachment_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_petty_cash_requests_status ON petty_cash_requests(status);
CREATE INDEX IF NOT EXISTS idx_petty_cash_requests_requester ON petty_cash_requests(requester_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- NEB-10: RECURRING EXPENSE TEMPLATES
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS recurring_expense_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_name VARCHAR(100) NOT NULL,
  category_id UUID NOT NULL REFERENCES expense_categories(id),
  counterparty_name VARCHAR(255) NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  currency_code VARCHAR(10) NOT NULL DEFAULT 'YER',
  vat_rate NUMERIC(5,2) DEFAULT 0,
  payment_method VARCHAR(30) NOT NULL,
  frequency VARCHAR(20) NOT NULL, -- WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, SEMIANNUAL, ANNUAL
  start_date DATE NOT NULL,
  end_date DATE,
  next_run_date DATE NOT NULL,
  auto_approve BOOLEAN NOT NULL DEFAULT FALSE,
  auto_post BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recurring_expense_next_run ON recurring_expense_templates(next_run_date) WHERE is_active = TRUE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- NEB-10: EXPENSE BATCHES — Multi-entry Journal Entries
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS expense_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  batch_number VARCHAR(40) NOT NULL UNIQUE,
  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  total_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency_code VARCHAR(10) NOT NULL DEFAULT 'YER',
  exchange_rate NUMERIC(18,6) NOT NULL DEFAULT 1,
  batch_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  posted_by UUID REFERENCES users(id),
  posted_at TIMESTAMPTZ,
  rejection_reason TEXT,
  entry_count INT NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expense_batch_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES expense_batches(id) ON DELETE CASCADE,
  sequence_number INT NOT NULL,
  account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
  account_code VARCHAR(20) NOT NULL,
  account_name_ar VARCHAR(255) NOT NULL,
  debit_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  credit_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency_code VARCHAR(10) NOT NULL DEFAULT 'YER',
  exchange_rate NUMERIC(18,6) NOT NULL DEFAULT 1,
  amount_base NUMERIC(18,2) NOT NULL DEFAULT 0,
  description TEXT,
  project_id UUID REFERENCES projects(id),
  activity_id UUID REFERENCES activities(id),
  cost_center_id UUID REFERENCES cost_centers(id),
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_expense_batches_org_status ON expense_batches(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_expense_batches_org_date ON expense_batches(organization_id, batch_date DESC);
CREATE INDEX IF NOT EXISTS idx_expense_batch_entries_batch ON expense_batch_entries(batch_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SEQUENCES
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE SEQUENCE IF NOT EXISTS expense_record_seq START 1;
CREATE SEQUENCE IF NOT EXISTS expense_batch_seq START 1;
CREATE SEQUENCE IF NOT EXISTS petty_cash_request_seq START 1;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED DEFAULT EXPENSE CATEGORIES (17 standard types)
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO expense_categories (organization_id, category_code, name_ar, name_en, description,
  category_type, recognition_method, is_budgeted, requires_receipt, requires_approval, default_vat_rate, sort_order)
SELECT 
  org.id, cat.*
FROM organizations org
CROSS JOIN (
  VALUES
    ('OPERATIONAL',    'OPERATIONAL',    'مصروفات تشغيلية',            'Operational Expenses',            'المصروفات اليومية التشغيلية', 'OPERATIONAL',    'ACCRUAL_BASIS',  TRUE,  TRUE,  TRUE,  15, 1),
    ('PROGRAM',        'PROGRAM',        'مصروفات برنامجية',            'Program Expenses',                'المصروفات المتعلقة بأنشطة البرامج', 'PROGRAM',     'ACCRUAL_BASIS',  TRUE,  TRUE,  TRUE,  15, 2),
    ('ADMIN',         'ADMIN',          'مصروفات إدارية',              'Administrative Expenses',         'المصروفات الإدارية والعمومية', 'ADMINISTRATIVE', 'ACCRUAL_BASIS',  TRUE,  TRUE,  TRUE,  15, 3),
    ('CAPITAL',        'CAPITAL',        'مصروفات رأسمالية',            'Capital Expenditures',            'المشتريات الرأسمالية والاستثمارات', 'CAPITAL',      'ACCRUAL_BASIS',  FALSE, TRUE,  TRUE,  0,  4),
    ('EMERGENCY',      'EMERGENCY',      'مصروفات طوارئ',              'Emergency Expenses',              'المصروفات الطارئة وغير المتوقعة', 'EMERGENCY',    'CASH_BASIS',     TRUE,  FALSE, TRUE,  0,  5),
    ('TRAVEL',         'TRAVEL',         'مصاريف سفر وانتقال',          'Travel & Transportation',        'مصاريف السفر والتنقل', 'TRAVEL',          'ACCRUAL_BASIS',  TRUE,  TRUE,  TRUE,  0,  6),
    ('PROCUREMENT',    'PROCUREMENT',    'مصروفات مشتريات',            'Procurement Expenses',            'مصاريف المشتريات والتوريدات', 'PROCUREMENT',   'ACCRUAL_BASIS',  TRUE,  TRUE,  TRUE,  15, 7),
    ('HR',             'HR',             'مصروفات الموارد البشرية',     'HR Expenses',                    'الرواتب والاجور والمزايا', 'HR',              'ACCRUAL_BASIS',  FALSE, TRUE,  TRUE,  0,  8),
    ('MARKETING',      'MARKETING',      'مصروفات تسويق',              'Marketing Expenses',              'مصاريف التسويق والدعاية', 'MARKETING',      'ACCRUAL_BASIS',  TRUE,  TRUE,  TRUE,  15, 9),
    ('IT',             'IT',             'مصروفات تقنية معلومات',       'IT Expenses',                    'المصروفات التقنية والانظمة', 'IT',             'ACCRUAL_BASIS',  TRUE,  TRUE,  TRUE,  15, 10),
    ('FACILITY',       'FACILITY',       'مصروفات مرافق وصيانة',       'Facility & Maintenance',         'صيانة المباني والمرافق', 'FACILITY',        'ACCRUAL_BASIS',  TRUE,  TRUE,  TRUE,  15, 11),
    ('CONSULTING',     'CONSULTING',     'مصروفات استشارات',           'Consulting Fees',                 'أتعاب الاستشارات', 'CONSULTING',      'ACCRUAL_BASIS',  TRUE,  TRUE,  TRUE,  0,  12),
    ('LEGAL',          'LEGAL',          'مصاريف قانونية',             'Legal Expenses',                 'المصاريف القانونية والقضائية', 'LEGAL',        'ACCRUAL_BASIS',  TRUE,  TRUE,  TRUE,  0,  13),
    ('INSURANCE',      'INSURANCE',      'مصروفات تأمينات',            'Insurance Expenses',              'التأمينات', 'INSURANCE',         'ACCRUAL_BASIS',  TRUE,  FALSE, TRUE,  0,  14),
    ('UTILITIES',      'UTILITIES',      'مصروفات مرافق',              'Utilities Expenses',              'الكهرباء والماء والاتصالات', 'UTILITIES',     'ACCRUAL_BASIS',  FALSE, FALSE, TRUE,  0,  15),
    ('RENT',           'RENT',           'مصروفات إيجارات',            'Rent Expenses',                   'الإيجارات', 'RENT',             'ACCRUAL_BASIS',  FALSE, TRUE,  TRUE,  0,  16),
    ('OTHER',          'OTHER',          'مصروفات أخرى',               'Other Expenses',                  'مصروفات متنوعة', 'OTHER',            'ACCRUAL_BASIS',  TRUE,  TRUE,  TRUE,  0,  99)
) AS cat(category_type, category_code, name_ar, name_en, description, 
         category_type, recognition_method, is_budgeted, requires_receipt, requires_approval, default_vat_rate, sort_order)
ON CONFLICT (organization_id, category_code) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRIGGER: Auto-update updated_at
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_expense_categories_updated_at BEFORE UPDATE ON expense_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_records_updated_at BEFORE UPDATE ON expense_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_payment_schedules_updated_at BEFORE UPDATE ON expense_payment_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_petty_cash_floats_updated_at BEFORE UPDATE ON petty_cash_floats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_petty_cash_requests_updated_at BEFORE UPDATE ON petty_cash_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_expense_templates_updated_at BEFORE UPDATE ON recurring_expense_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_batches_updated_at BEFORE UPDATE ON expense_batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════════
-- COMMENT: Documentation
-- ═══════════════════════════════════════════════════════════════════════════════
COMMENT ON TABLE expense_categories IS 'UAMEX ERP™ NEB-10: Expense category registry with GL account mapping';
COMMENT ON TABLE expense_records IS 'UAMEX ERP™ NEB-10: Core expense records with full lifecycle (DRAFT→POSTED→PAID→RECONCILED)';
COMMENT ON TABLE expense_attachments IS 'UAMEX ERP™ NEB-10: Receipt and supporting document attachments';
COMMENT ON TABLE approval_workflows IS 'UAMEX ERP™ NEB-10: Multi-tier approval workflow configuration';
COMMENT ON TABLE expense_approval_history IS 'UAMEX ERP™ NEB-10: Approval audit trail';
COMMENT ON TABLE approval_delegations IS 'UAMEX ERP™ NEB-10: Approval delegation management';
COMMENT ON TABLE expense_payment_schedules IS 'UAMEX ERP™ NEB-10: Multi-installment payment schedules';
COMMENT ON TABLE budget_commitments IS 'UAMEX ERP™ NEB-10: Budget commitment tracking';
COMMENT ON TABLE petty_cash_floats IS 'UAMEX ERP™ NEB-10: Petty cash float management';
COMMENT ON TABLE petty_cash_requests IS 'UAMEX ERP™ NEB-10: Petty cash request lifecycle';
COMMENT ON TABLE recurring_expense_templates IS 'UAMEX ERP™ NEB-10: Recurring expense automation templates';
COMMENT ON TABLE expense_batches IS 'UAMEX ERP™ NEB-10: Bulk expense journal entry batches';
COMMENT ON TABLE expense_batch_entries IS 'UAMEX ERP™ NEB-10: Individual entries in expense batches';
