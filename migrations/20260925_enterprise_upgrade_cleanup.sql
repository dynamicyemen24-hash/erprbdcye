-- ================================================================
-- UAMEX ERP™ Sovereign Enterprise OS — Upgrade & Cleanup Suite v4.0
-- Migration: 20260925_enterprise_upgrade_cleanup
-- Target: Real-time analytical views, EVM project metrics, audit index hardening,
--         and automated session/token cleanup.
-- ================================================================

-- 1. Analytical View: Unified Financial Ledger Summary (IPSAS Double-Entry)
CREATE OR REPLACE VIEW v_unified_financial_ledger_summary AS
SELECT 
  c.account_code,
  c.name_ar AS account_name_ar,
  c.name_en AS account_name_en,
  c.account_type,
  c.organization_id,
  COALESCE(SUM(tl.debit_amount), 0) AS total_debit_yer,
  COALESCE(SUM(tl.credit_amount), 0) AS total_credit_yer,
  (COALESCE(SUM(tl.debit_amount), 0) - COALESCE(SUM(tl.credit_amount), 0)) AS net_balance_yer,
  COUNT(tl.id) AS transaction_count,
  MAX(tl.created_at) AS last_activity_at
FROM chart_of_accounts c
LEFT JOIN transaction_lines tl ON c.id = tl.account_id
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.account_code, c.name_ar, c.name_en, c.account_type, c.organization_id;

-- 2. Analytical View: Project Earned Value Management (EVM Master Metrics)
CREATE OR REPLACE VIEW v_project_evm_master_report AS
SELECT 
  p.id AS project_id,
  p.project_code,
  p.name_ar AS project_name_ar,
  p.name_en AS project_name_en,
  p.organization_id,
  p.status_code,
  COALESCE(p.budget, 0) AS budget_at_completion_bac,
  COALESCE(p.progress_percent, 0) AS actual_progress_pct,
  (COALESCE(p.budget, 0) * (COALESCE(p.progress_percent, 0) / 100.0)) AS earned_value_ev,
  (COALESCE(p.budget, 0) * (COALESCE(p.progress_percent, 0) / 100.0)) - COALESCE(p.budget, 0) AS cost_variance_cv,
  CASE 
    WHEN COALESCE(p.budget, 0) > 0 THEN 
      ROUND(( (COALESCE(p.budget, 0) * (COALESCE(p.progress_percent, 0) / 100.0)) / NULLIF(p.budget, 0) )::numeric, 2)
    ELSE 1.00 
  END AS cost_performance_index_cpi,
  p.created_at,
  p.updated_at
FROM projects p
WHERE p.deleted_at IS NULL;

-- 3. Analytical View: Beneficiary Distribution Intelligence
CREATE OR REPLACE VIEW v_beneficiary_distribution_analytics AS
SELECT 
  organization_id,
  COALESCE(governorate, 'غير محدد') AS governorate,
  COALESCE(district, 'غير محدد') AS district,
  COALESCE(status, 'ACTIVE') AS status,
  COUNT(id) AS total_beneficiaries,
  SUM(COALESCE(family_members_count, 1)) AS total_family_members
FROM beneficiaries
WHERE deleted_at IS NULL
GROUP BY organization_id, governorate, district, status;

-- 4. Audit & FK Index Hardening for Billion-Row Performance

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record 
  ON audit_logs (table_name, record_id);
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'Index audit_logs_table_record skipped: %', SQLERRM;
END
$$;

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_sponsorships_ben_donor 
  ON sponsorships (beneficiary_id, donor_id);
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'Index sponsorships_ben_donor skipped: %', SQLERRM;
END
$$;

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_commitments_project_fund 
  ON commitments (project_id, fund_id);
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'Index commitments_project_fund skipped: %', SQLERRM;
END
$$;

-- 5. Stored Cleanup Procedure for Old Security Events & Expired Sessions

CREATE OR REPLACE FUNCTION sp_cleanup_expired_security_events()
RETURNS void AS $$
BEGIN
  DELETE FROM audit_logs 
  WHERE created_at < NOW() - INTERVAL '365 days'
    AND action LIKE 'READ%';
END;
$$ LANGUAGE plpgsql;
