-- ═══════════════════════════════════════════════════════════════════════════
-- UAMEX ERP™ — Business Intelligence Views, Functions & Triggers
-- Advanced Aggregate, Statistical, Evaluation & Analytical Views
-- Migration Date: 2026-09-02
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 1: FINANCIAL INTELLIGENCE VIEWS
-- ═══════════════════════════════════════════════════════════════════════════

-- View: Daily Transaction Summary
DO $$
BEGIN
  CREATE OR REPLACE VIEW v_daily_financial_summary AS
  SELECT 
    DATE(t.transaction_date) AS transaction_date,
    COUNT(DISTINCT t.id) AS transaction_count,
    COUNT(DISTINCT tl.account_id) AS account_count,
    SUM(tl.debit_amount) AS total_debit,
    SUM(tl.credit_amount) AS total_credit,
    SUM(CASE WHEN tl.debit_amount > 0 THEN tl.debit_amount ELSE 0 END) AS total_expenses,
    SUM(CASE WHEN tl.credit_amount > 0 THEN tl.credit_amount ELSE 0 END) AS total_revenue,
    COUNT(DISTINCT t.created_by_id) AS users_creating,
    COUNT(DISTINCT t.reference_no) AS referenced_count
  FROM transactions t
  JOIN transaction_lines tl ON tl.transaction_id = t.id
  WHERE t.status = 'POSTED'
  GROUP BY DATE(t.transaction_date)
  ORDER BY transaction_date DESC;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'bi-views skipped (schema drift): %', SQLERRM;
END
$$;

-- View: Monthly Financial Performance
DO $$
BEGIN
  CREATE OR REPLACE VIEW v_monthly_financial_performance AS
  SELECT 
    DATE_TRUNC('month', t.transaction_date) AS month,
    EXTRACT(YEAR FROM t.transaction_date) AS year,
    EXTRACT(MONTH FROM t.transaction_date) AS month_num,
    COUNT(DISTINCT t.id) AS transaction_count,
    SUM(tl.debit_amount) AS total_debit,
    SUM(tl.credit_amount) AS total_credit,
    SUM(CASE WHEN coa.account_type = 'REVENUE' THEN tl.credit_amount ELSE 0 END) AS revenue_total,
    SUM(CASE WHEN coa.account_type = 'EXPENSE' THEN tl.debit_amount ELSE 0 END) AS expense_total,
    SUM(CASE WHEN coa.account_type = 'ASSET' THEN tl.debit_amount ELSE 0 END) AS asset_increase,
    SUM(CASE WHEN coa.account_type = 'LIABILITY' THEN tl.credit_amount ELSE 0 END) AS liability_increase,
    SUM(CASE WHEN coa.account_type = 'REVENUE' THEN tl.credit_amount 
              WHEN coa.account_type = 'EXPENSE' THEN -tl.debit_amount ELSE 0 END) AS net_position,
    SUM(CASE WHEN coa.account_type = 'REVENUE' THEN tl.credit_amount 
              WHEN coa.account_type = 'EXPENSE' THEN -tl.debit_amount ELSE 0 END) / 
         NULLIF(SUM(CASE WHEN coa.account_type = 'REVENUE' THEN tl.credit_amount ELSE 0 END), 0) * 100 AS profit_margin_pct
  FROM transactions t
  JOIN transaction_lines tl ON tl.transaction_id = t.id
  JOIN chart_of_accounts coa ON coa.id = tl.account_id
  WHERE t.status = 'POSTED'
  GROUP BY DATE_TRUNC('month', t.transaction_date), 
           EXTRACT(YEAR FROM t.transaction_date),
           EXTRACT(MONTH FROM t.transaction_date)
  ORDER BY year DESC, month_num DESC;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'bi-views skipped (schema drift): %', SQLERRM;
END
$$;

-- View: Account Balance Summary
DO $$
BEGIN
  CREATE OR REPLACE VIEW v_account_balances AS
  SELECT 
    coa.id AS account_id,
    coa.account_code,
    coa.name_ar,
    coa.name_en,
    coa.account_type,
    coa.parent_account_id,
    COALESCE(SUM(tl.debit_amount), 0) AS total_debits,
    COALESCE(SUM(tl.credit_amount), 0) AS total_credits,
    COALESCE(SUM(CASE WHEN coa.account_type IN ('ASSET', 'EXPENSE') THEN tl.debit_amount - tl.credit_amount
                      WHEN coa.account_type IN ('LIABILITY', 'EQUITY', 'REVENUE') THEN tl.credit_amount - tl.debit_amount
                      ELSE 0 END), 0) AS current_balance,
    COUNT(DISTINCT t.id) AS transaction_count,
    MIN(t.transaction_date) AS first_transaction,
    MAX(t.transaction_date) AS last_transaction
  FROM chart_of_accounts coa
  LEFT JOIN transaction_lines tl ON tl.account_id = coa.id
  LEFT JOIN transactions t ON t.id = tl.transaction_id AND t.status = 'POSTED'
  GROUP BY coa.id, coa.account_code, coa.name_ar, coa.name_en, coa.account_type, coa.parent_account_id
  ORDER BY coa.account_type, coa.account_code;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'bi-views skipped (schema drift): %', SQLERRM;
END
$$;

-- View: Budget vs Actual Analysis
DO $$
BEGIN
  CREATE OR REPLACE VIEW v_budget_vs_actual AS
  SELECT 
    bl.fiscal_year_id,
    fy.name_ar AS fiscal_year_name,
    bl.account_id,
    coa.account_code,
    coa.name_ar AS account_name,
    coa.account_type,
    bl.project_id,
    p.name_ar AS project_name,
    bl.allocated_budget,
    bl.spent_amount,
    bl.allocated_budget - bl.spent_amount AS variance,
    CASE WHEN bl.allocated_budget > 0 
         THEN (bl.spent_amount / bl.allocated_budget * 100)::DECIMAL(10,2) 
         ELSE 0 END AS utilization_pct,
    CASE WHEN bl.allocated_budget > 0 AND bl.spent_amount > bl.allocated_budget 
         THEN 'OVER_BUDGET' 
         WHEN bl.allocated_budget > 0 AND bl.spent_amount > bl.allocated_budget * 0.9 
         THEN 'AT_RISK'
         WHEN bl.allocated_budget > 0 AND bl.spent_amount > 0
         THEN 'ON_TRACK'
         ELSE 'NOT_STARTED' END AS budget_status
  FROM budget_lines bl
  JOIN fiscal_years fy ON fy.id = bl.fiscal_year_id
  JOIN chart_of_accounts coa ON coa.id = bl.account_id
  LEFT JOIN projects p ON p.id = bl.project_id
  WHERE bl.allocated_budget > 0 OR bl.spent_amount > 0
  ORDER BY fy.year_number DESC, utilization_pct DESC;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'bi-views skipped (schema drift): %', SQLERRM;
END
$$;

-- View: Cash Flow Summary
DO $$
BEGIN
  CREATE OR REPLACE VIEW v_cash_flow_summary AS
  WITH cash_accounts AS (
    SELECT id FROM chart_of_accounts 
    WHERE account_code LIKE '1%' OR name_ar ILIKE '%نقد%' OR name_ar ILIKE '%bank%'
  ),
  cash_flow AS (
    SELECT 
      DATE_TRUNC('month', t.transaction_date) AS month,
      SUM(CASE WHEN tl.debit_amount > 0 AND tl.account_id IN (SELECT id FROM cash_accounts) 
               THEN tl.debit_amount ELSE 0 END) AS cash_inflow,
      SUM(CASE WHEN tl.credit_amount > 0 AND tl.account_id IN (SELECT id FROM cash_accounts) 
               THEN tl.credit_amount ELSE 0 END) AS cash_outflow,
      SUM(CASE WHEN tl.debit_amount > 0 AND tl.account_id IN (SELECT id FROM cash_accounts) 
               THEN tl.debit_amount
               WHEN tl.credit_amount > 0 AND tl.account_id IN (SELECT id FROM cash_accounts) 
               THEN -tl.credit_amount
               ELSE 0 END) AS net_cash_flow
    FROM transactions t
    JOIN transaction_lines tl ON tl.transaction_id = t.id
    WHERE t.status = 'POSTED'
    GROUP BY DATE_TRUNC('month', t.transaction_date)
  )
  SELECT 
    month,
    cash_inflow,
    cash_outflow,
    net_cash_flow,
    SUM(net_cash_flow) OVER (ORDER BY month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_cash_flow,
    CASE WHEN cash_inflow > 0 THEN ((cash_outflow / cash_inflow) * 100)::DECIMAL(10,2) ELSE 0 END AS burn_rate_pct
  FROM cash_flow
  ORDER BY month DESC;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'bi-views skipped (schema drift): %', SQLERRM;
END
$$;

-- View: Revenue by Stream Analysis
DO $$
BEGIN
  CREATE OR REPLACE VIEW v_revenue_streams_analysis AS
  SELECT 
    rr.stream_code,
    rr.stream_name_ar,
    rr.revenue_type,
    COUNT(rr.id) AS record_count,
    SUM(rr.amount) AS total_amount,
    AVG(rr.amount) AS average_amount,
    MIN(rr.amount) AS min_amount,
    MAX(rr.amount) AS max_amount,
    SUM(rr.amount) / NULLIF(
      (SELECT SUM(amount) FROM revenue_records WHERE status = 'RECOGNIZED'), 0
    ) * 100 AS revenue_share_pct,
    COUNT(DISTINCT rr.donor_id) AS donor_count,
    COUNT(DISTINCT rr.project_id) AS project_count
  FROM revenue_records rr
  WHERE rr.status = 'RECOGNIZED'
  GROUP BY rr.stream_code, rr.stream_name_ar, rr.revenue_type
  ORDER BY total_amount DESC;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'bi-views skipped (schema drift): %', SQLERRM;
END
$$;

-- View: Expense Breakdown by Category
DO $$
BEGIN
  CREATE OR REPLACE VIEW v_expense_breakdown AS
  SELECT 
    coa.account_code,
    coa.name_ar AS category_name,
    coa.account_type,
    COUNT(DISTINCT t.id) AS transaction_count,
    SUM(tl.debit_amount) AS total_amount,
    AVG(tl.debit_amount) AS average_amount,
    COUNT(DISTINCT t.created_by_id) AS users_creating,
    COUNT(DISTINCT tl.project_id) AS project_count,
    SUM(tl.debit_amount) / NULLIF(
      (SELECT SUM(tl2.debit) FROM transaction_lines tl2 
       JOIN transactions t2 ON t2.id = tl2.transaction_id
       JOIN chart_of_accounts coa2 ON coa2.id = tl2.account_id
       WHERE t2.status = 'POSTED' AND coa2.account_type = 'EXPENSE'), 0
    ) * 100 AS expense_share_pct
  FROM transactions t
  JOIN transaction_lines tl ON tl.transaction_id = t.id
  JOIN chart_of_accounts coa ON coa.id = tl.account_id
  WHERE t.status = 'POSTED' AND coa.account_type = 'EXPENSE'
  GROUP BY coa.account_code, coa.name_ar, coa.account_type
  ORDER BY total_amount DESC;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'bi-views skipped (schema drift): %', SQLERRM;
END
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 2: BENEFICIARY INTELLIGENCE VIEWS
-- ═══════════════════════════════════════════════════════════════════════════

-- View: Beneficiary Demographics Summary
DO $$
BEGIN
  CREATE OR REPLACE VIEW v_beneficiary_demographics AS
  SELECT 
    CASE WHEN b.gender = 'M' THEN 'Male' WHEN b.gender = 'F' THEN 'Female' ELSE 'Unknown' END AS gender,
    CASE 
      WHEN b.vulnerability_status = 'CRITICAL' THEN 'Critical Vulnerability'
      WHEN b.vulnerability_status = 'HIGH' THEN 'High Vulnerability'
      WHEN b.vulnerability_status = 'MEDIUM' THEN 'Medium Vulnerability'
      ELSE 'Standard'
    END AS vulnerability_level,
    b.governorate,
    b.district,
    COUNT(b.id) AS beneficiary_count,
    SUM(b.family_members_count) AS total_family_members,
    AVG(b.family_members_count)::DECIMAL(10,2) AS avg_family_size,
    COUNT(DISTINCT b.sub_district) AS area_count,
    MIN(b.created_at) AS first_registration,
    MAX(b.created_at) AS last_registration,
    COUNT(CASE WHEN b.status = 'ACTIVE' THEN 1 END) AS active_count,
    COUNT(CASE WHEN b.status = 'INACTIVE' THEN 1 END) AS inactive_count
  FROM beneficiaries b
  GROUP BY 
    CASE WHEN b.gender = 'M' THEN 'Male' WHEN b.gender = 'F' THEN 'Female' ELSE 'Unknown' END,
    CASE 
      WHEN b.vulnerability_status = 'CRITICAL' THEN 'Critical Vulnerability'
      WHEN b.vulnerability_status = 'HIGH' THEN 'High Vulnerability'
      WHEN b.vulnerability_status = 'MEDIUM' THEN 'Medium Vulnerability'
      ELSE 'Standard'
    END,
    b.governorate,
    b.district
  ORDER BY beneficiary_count DESC;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'bi-views skipped (schema drift): %', SQLERRM;
END
$$;

-- View: Beneficiary Coverage by Geographic Area
DO $$
BEGIN
  CREATE OR REPLACE VIEW v_beneficiary_coverage AS
  SELECT 
    COALESCE(b.governorate, 'Unknown') AS governorate,
    COALESCE(b.district, 'Unknown') AS district,
    COALESCE(b.sub_district, 'Unknown') AS sub_district,
    COUNT(b.id) AS total_beneficiaries,
    SUM(b.family_members_count) AS total_people_covered,
    COUNT(DISTINCT b.vulnerability_status) AS vulnerability_types,
    COUNT(DISTINCT p.id) AS active_projects,
    COUNT(DISTINCT ad.id) AS total_distributions,
    SUM(ad.quantity) AS total_aid_quantity,
    COUNT(DISTINCT ad.distribution_date) AS distribution_events,
    ROUND(COUNT(b.id) * 1.0 / NULLIF(
      (SELECT SUM(family_members_count) FROM beneficiaries WHERE status = 'ACTIVE'), 0
    ) * 100, 2) AS coverage_pct
  FROM beneficiaries b
  LEFT JOIN projects p ON p.district = b.district AND p.status_code = 'ACTIVE'
  LEFT JOIN aid_distributions ad ON ad.beneficiary_id = b.id
  GROUP BY ROLLUP (b.governorate, b.district, b.sub_district)
  HAVING GROUPING(b.governorate) = 0
  ORDER BY total_beneficiaries DESC;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'bi-views skipped (schema drift): %', SQLERRM;
END
$$;

-- View: Beneficiary Age Distribution
DO $$
BEGIN
  CREATE OR REPLACE VIEW v_beneficiary_age_distribution AS
  SELECT 
    CASE 
      WHEN EXTRACT(YEAR FROM AGE(b.birth_date)) < 5 THEN '0-4 (Infant)'
      WHEN EXTRACT(YEAR FROM AGE(b.birth_date)) BETWEEN 5 AND 12 THEN '5-12 (Child)'
      WHEN EXTRACT(YEAR FROM AGE(b.birth_date)) BETWEEN 13 AND 18 THEN '13-18 (Youth)'
      WHEN EXTRACT(YEAR FROM AGE(b.birth_date)) BETWEEN 19 AND 35 THEN '19-35 (Young Adult)'
      WHEN EXTRACT(YEAR FROM AGE(b.birth_date)) BETWEEN 36 AND 55 THEN '36-55 (Adult)'
      WHEN EXTRACT(YEAR FROM AGE(b.birth_date)) BETWEEN 56 AND 70 THEN '56-70 (Senior)'
      ELSE '70+ (Elder)'
    END AS age_group,
    b.gender,
    COUNT(b.id) AS beneficiary_count,
    SUM(b.family_members_count) AS family_members,
    AVG(b.family_members_count)::DECIMAL(10,2) AS avg_family_size,
    COUNT(CASE WHEN b.vulnerability_status IN ('CRITICAL', 'HIGH') THEN 1 END) AS high_vulnerability_count
  FROM beneficiaries b
  WHERE b.birth_date IS NOT NULL
  GROUP BY 
    CASE 
      WHEN EXTRACT(YEAR FROM AGE(b.birth_date)) < 5 THEN '0-4 (Infant)'
      WHEN EXTRACT(YEAR FROM AGE(b.birth_date)) BETWEEN 5 AND 12 THEN '5-12 (Child)'
      WHEN EXTRACT(YEAR FROM AGE(b.birth_date)) BETWEEN 13 AND 18 THEN '13-18 (Youth)'
      WHEN EXTRACT(YEAR FROM AGE(b.birth_date)) BETWEEN 19 AND 35 THEN '19-35 (Young Adult)'
      WHEN EXTRACT(YEAR FROM AGE(b.birth_date)) BETWEEN 36 AND 55 THEN '36-55 (Adult)'
      WHEN EXTRACT(YEAR FROM AGE(b.birth_date)) BETWEEN 56 AND 70 THEN '56-70 (Senior)'
      ELSE '70+ (Elder)'
    END,
    b.gender
  ORDER BY 
    CASE 
      WHEN age_group LIKE '0-4%' THEN 1
      WHEN age_group LIKE '5-12%' THEN 2
      WHEN age_group LIKE '13-18%' THEN 3
      WHEN age_group LIKE '19-35%' THEN 4
      WHEN age_group LIKE '36-55%' THEN 5
      WHEN age_group LIKE '56-70%' THEN 6
      ELSE 7
    END;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'bi-views skipped (schema drift): %', SQLERRM;
END
$$;

-- View: Sponsorship Program Performance
DO $$
BEGIN
  CREATE OR REPLACE VIEW v_sponsorship_performance AS
  SELECT 
    s.sponsorship_type,
    COUNT(DISTINCT s.id) AS total_sponsorships,
    COUNT(DISTINCT s.beneficiary_id) AS sponsored_beneficiaries,
    SUM(s.monthly_amount) AS total_monthly_commitment,
    AVG(s.monthly_amount) AS avg_monthly_amount,
    COUNT(DISTINCT sp.id) AS total_payments,
    SUM(sp.payment_amount) AS total_paid,
    COUNT(CASE WHEN sp.status = 'COMPLETED' THEN 1 END) AS completed_payments,
    COUNT(CASE WHEN sp.status = 'PENDING' THEN 1 END) AS pending_payments,
    COUNT(CASE WHEN s.status = 'ACTIVE' THEN 1 END) AS active_sponsorships,
    COUNT(CASE WHEN s.status = 'TERMINATED' THEN 1 END) AS terminated_sponsorships,
    SUM(sp.payment_amount) / NULLIF(
      COUNT(DISTINCT DATE_TRUNC('month', sp.payment_date)), 0
    ) AS avg_monthly_disbursement,
    COUNT(DISTINCT s.sponsor_party_id) AS unique_sponsors
  FROM sponsorships s
  LEFT JOIN sponsorship_payments sp ON sp.sponsorship_id = s.id
  GROUP BY s.sponsorship_type
  ORDER BY total_sponsorships DESC;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'bi-views skipped (schema drift): %', SQLERRM;
END
$$;

-- View: Aid Distribution Summary
DO $$
BEGIN
  CREATE OR REPLACE VIEW v_aid_distribution_summary AS
  SELECT 
    ad.distribution_type,
    ad.aid_category,
    DATE_TRUNC('month', ad.distribution_date) AS distribution_month,
    COUNT(DISTINCT ad.id) AS distribution_count,
    COUNT(DISTINCT ad.beneficiary_id) AS unique_beneficiaries,
    SUM(ad.quantity) AS total_quantity,
    SUM(ad.value_amount) AS total_value,
    AVG(ad.quantity) AS avg_quantity_per_beneficiary,
    AVG(ad.value_amount) AS avg_value_per_beneficiary,
    COUNT(DISTINCT ad.project_id) AS projects_covered,
    COUNT(DISTINCT ad.warehouse_id) AS warehouses_used,
    COUNT(DISTINCT ad.distributed_by) AS distributors
  FROM aid_distributions ad
  GROUP BY ad.distribution_type, ad.aid_category, DATE_TRUNC('month', ad.distribution_date)
  ORDER BY distribution_month DESC, total_value DESC;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'bi-views skipped (schema drift): %', SQLERRM;
END
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 3: PROJECT & PROGRAM INTELLIGENCE VIEWS
-- ═══════════════════════════════════════════════════════════════════════════

-- View: Project Portfolio Summary
DO $$
BEGIN
  CREATE OR REPLACE VIEW v_project_portfolio AS
  SELECT 
    p.id AS project_id,
    p.project_code,
    p.name_ar,
    p.status_code,
    p.budget,
    p.progress_percent,
    p.start_date,
    p.end_date,
    p.governorate,
    p.district,
    prog.name_ar AS program_name,
    prog.code AS program_code,
    donor.name_ar AS donor_name,
    g.total_amount AS grant_amount,
    COALESCE(SUM(tl.debit_amount), 0) AS total_spent,
    p.budget - COALESCE(SUM(tl.debit_amount), 0) AS budget_remaining,
    CASE WHEN p.budget > 0 THEN (COALESCE(SUM(tl.debit_amount), 0) / p.budget * 100)::DECIMAL(10,2) ELSE 0 END AS budget_utilization_pct,
    CASE WHEN p.end_date < NOW() AND p.progress_percent < 100 THEN 'DELAYED' 
         WHEN p.progress_percent >= 100 THEN 'COMPLETED'
         WHEN p.budget > 0 AND COALESCE(SUM(tl.debit_amount), 0) > p.budget THEN 'OVER_BUDGET'
         ELSE p.status_code END AS health_status,
    EXTRACT(DAY FROM (COALESCE(p.end_date, NOW()) - p.start_date)) AS planned_duration_days,
    EXTRACT(DAY FROM (NOW() - p.start_date)) AS elapsed_days,
    CASE WHEN p.end_date > p.start_date 
         THEN (EXTRACT(DAY FROM (NOW() - p.start_date)) / 
               ((p.end_date)::date - (p.start_date)::date) * 100)::DECIMAL(10,2)
         ELSE 0 END AS time_elapsed_pct
  FROM projects p
  LEFT JOIN programs prog ON prog.id = p.program_id
  LEFT JOIN grants g ON g.project_id = p.id
  LEFT JOIN donors donor ON donor.id = g.donor_id
  LEFT JOIN transaction_lines tl ON tl.project_id = p.id
  LEFT JOIN transactions t ON t.id = tl.transaction_id AND t.status = 'POSTED'
  GROUP BY p.id, p.project_code, p.name_ar, p.status_code, p.budget, p.progress_percent,
           p.start_date, p.end_date, p.governorate, p.district,
           prog.name_ar, prog.code, donor.name_ar, g.total_amount
  ORDER BY p.budget DESC NULLS LAST;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'bi-views skipped (schema drift): %', SQLERRM;
END
$$;

-- View: Program Progress Overview
DO $$
BEGIN
  CREATE OR REPLACE VIEW v_program_progress AS
  SELECT 
    pr.id AS program_id,
    pr.code AS program_code,
    pr.name_ar,
    COUNT(DISTINCT p.id) AS project_count,
    SUM(p.budget) AS total_program_budget,
    AVG(p.progress_percent) AS avg_progress,
    COUNT(CASE WHEN p.status_code = 'ACTIVE' THEN 1 END) AS active_projects,
    COUNT(CASE WHEN p.status_code = 'COMPLETED' THEN 1 END) AS completed_projects,
    COUNT(CASE WHEN p.status_code = 'ON_HOLD' THEN 1 END) AS on_hold_projects,
    COALESCE(SUM(tl.debit_amount), 0) AS total_spent,
    SUM(p.budget) - COALESCE(SUM(tl.debit_amount), 0) AS total_remaining,
    COUNT(DISTINCT p.district) AS geographic_coverage
  FROM programs pr
  LEFT JOIN projects p ON p.program_id = pr.id
  LEFT JOIN transaction_lines tl ON tl.project_id = p.id
  LEFT JOIN transactions t ON t.id = tl.transaction_id AND t.status = 'POSTED'
  GROUP BY pr.id, pr.code, pr.name_ar
  ORDER BY total_program_budget DESC NULLS LAST;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'bi-views skipped (schema drift): %', SQLERRM;
END
$$;

-- View: Milestone Tracking
DO $$
BEGIN
  CREATE OR REPLACE VIEW v_milestone_tracking AS
  SELECT 
    m.id AS milestone_id,
    m.title_ar,
    m.target_date,
    m.completed_date,
    m.status,
    CASE WHEN m.completed_date IS NOT NULL AND m.completed_date <= m.target_date THEN 'ON_TIME'
         WHEN m.completed_date IS NOT NULL AND m.completed_date > m.target_date THEN 'LATE'
         WHEN m.target_date < NOW() AND m.status != 'COMPLETED' THEN 'OVERDUE'
         ELSE 'UPCOMING' END AS milestone_health,
    EXTRACT(DAY FROM (m.target_date - NOW())) AS days_until_due,
    CASE WHEN m.completed_date IS NOT NULL 
         THEN ((m.completed_date)::date - (m.target_date)::date)
         ELSE NULL END AS delay_days,
    p.name_ar AS project_name,
    p.project_code,
    prog.name_ar AS program_name,
    org.name_ar AS organization_name
  FROM milestones m
  JOIN projects p ON p.id = m.project_id
  JOIN programs prog ON prog.id = p.program_id
  JOIN organizations org ON org.id = p.organization_id
  ORDER BY m.target_date ASC;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'bi-views skipped (schema drift): %', SQLERRM;
END
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 4: HR & WORKFORCE ANALYTICS VIEWS
-- �══════════════════════════════════════════════════════════════════════════

-- View: Staff Composition Analysis
DO $$
BEGIN
  CREATE OR REPLACE VIEW v_staff_composition AS
  SELECT 
    hs.department,
    hs.job_title,
    COUNT(hs.id) AS staff_count,
    COUNT(CASE WHEN hs.status = 'ACTIVE' THEN 1 END) AS active_count,
    COUNT(CASE WHEN hs.status = 'ON_LEAVE' THEN 1 END) AS on_leave_count,
    COUNT(CASE WHEN hs.status = 'TERMINATED' THEN 1 END) AS terminated_count,
    COUNT(DISTINCT b.id) AS branch_count,
    COUNT(DISTINCT p.id) AS project_count
  FROM hr_staff hs
  LEFT JOIN branches b ON b.id = hs.branch_id
  LEFT JOIN projects p ON p.id = hs.project_id
  GROUP BY hs.department, hs.job_title
  HAVING COUNT(hs.id) > 0
  ORDER BY staff_count DESC;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'bi-views skipped (schema drift): %', SQLERRM;
END
$$;

-- View: Volunteer Engagement Analysis
DO $$
BEGIN
  CREATE OR REPLACE VIEW v_volunteer_engagement AS
  SELECT 
    v.field,
    v.status,
    COUNT(v.id) AS volunteer_count,
    SUM(v.hours_contributed) AS total_hours,
    AVG(v.hours_contributed)::DECIMAL(10,2) AS avg_hours,
    MIN(v.hours_contributed) AS min_hours,
    MAX(v.hours_contributed) AS max_hours,
    COUNT(DISTINCT p.id) AS projects_participated,
    COUNT(DISTINCT vt.task_id) AS tasks_completed,
    COUNT(DISTINCT CASE WHEN vt.status = 'COMPLETED' THEN vt.id END) AS completed_tasks,
    CASE WHEN COUNT(vt.id) > 0 
         THEN (COUNT(DISTINCT CASE WHEN vt.status = 'COMPLETED' THEN vt.id END)::DECIMAL / 
               COUNT(DISTINCT vt.id) * 100)::DECIMAL(10,2)
         ELSE 0 END AS task_completion_rate
  FROM volunteers v
  LEFT JOIN volunteer_tasks vt ON vt.volunteer_id = v.id
  LEFT JOIN projects p ON p.id = vt.project_id
  GROUP BY v.field, v.status
  ORDER BY total_hours DESC;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'bi-views skipped (schema drift): %', SQLERRM;
END
$$;

-- View: Attendance Patterns
DO $$
BEGIN
  CREATE OR REPLACE VIEW v_attendance_patterns AS
  SELECT 
    DATE_TRUNC('month', a.attendance_date) AS month,
    a.department,
    COUNT(DISTINCT a.staff_id) AS total_staff,
    COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END) AS present_count,
    COUNT(CASE WHEN a.status = 'ABSENT' THEN 1 END) AS absent_count,
    COUNT(CASE WHEN a.status = 'LATE' THEN 1 END) AS late_count,
    COUNT(CASE WHEN a.status = 'LEAVE' THEN 1 END) AS leave_count,
    (COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END)::DECIMAL / 
     NULLIF(COUNT(*), 0) * 100)::DECIMAL(10,2) AS attendance_rate_pct,
    (COUNT(CASE WHEN a.status = 'LATE' THEN 1 END)::DECIMAL / 
     NULLIF(COUNT(*), 0) * 100)::DECIMAL(10,2) AS late_rate_pct,
    AVG(a.work_hours)::DECIMAL(10,2) AS avg_work_hours
  FROM attendance a
  GROUP BY DATE_TRUNC('month', a.attendance_date), a.department
  ORDER BY month DESC;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'bi-views skipped (schema drift): %', SQLERRM;
END
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 5: INVENTORY & OPERATIONS VIEWS
-- ═══════════════════════════════════════════════════════════════════════════

-- View: Inventory Health Dashboard
DO $$
BEGIN
  CREATE OR REPLACE VIEW v_inventory_health AS
  SELECT 
    ii.item_code,
    ii.name_ar AS item_name,
    ii.category,
    w.name_ar AS warehouse_name,
    isb.quantity AS current_stock,
    ii.total_quantity_on_hand,
    CASE WHEN ii.total_quantity_on_hand > 0 
         THEN (isb.quantity / ii.total_quantity_on_hand * 100)::DECIMAL(10,2)
         ELSE 0 END AS stock_share_pct,
    isb.reserved_quantity,
    isb.available_quantity,
    isb.reorder_level,
    isb.maximum_level,
    CASE WHEN isb.quantity <= isb.reorder_level THEN 'REORDER_REQUIRED'
         WHEN isb.quantity >= isb.maximum_level THEN 'OVERSTOCKED'
         ELSE 'ADEQUATE' END AS stock_status,
    im.movements_30d,
    im.avg_daily_usage,
    CASE WHEN im.avg_daily_usage > 0 
         THEN (isb.quantity / im.avg_daily_usage)::DECIMAL(10,1)
         ELSE NULL END AS days_of_stock
  FROM inventory_items ii
  JOIN inventory_stock_balances isb ON isb.item_id = ii.id
  JOIN warehouses w ON w.id = isb.warehouse_id
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS movements_30d, AVG(im.quantity) AS avg_daily_usage
    FROM inventory_movements im
    WHERE im.item_id = ii.id 
      AND im.movement_date >= NOW() - INTERVAL '30 days'
  ) im ON true
  ORDER BY 
    CASE WHEN isb.quantity <= isb.reorder_level THEN 0 ELSE 1 END,
    isb.quantity ASC;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'bi-views skipped (schema drift): %', SQLERRM;
END
$$;

-- View: Warehouse Utilization
DO $$
BEGIN
  CREATE OR REPLACE VIEW v_warehouse_utilization AS
  SELECT 
    w.id AS warehouse_id,
    w.name_ar AS warehouse_name,
    w.location,
    w.manager_name,
    COUNT(DISTINCT isb.item_id) AS unique_items,
    SUM(isb.quantity) AS total_quantity,
    SUM(isb.quantity * COALESCE(ii.unit_cost, 0)) AS total_value,
    SUM(isb.reserved_quantity) AS reserved_stock,
    SUM(isb.available_quantity) AS available_stock,
    w.capacity_sqm,
    COALESCE(w.used_capacity_sqm, 0) AS used_capacity,
    CASE WHEN w.capacity_sqm > 0 
         THEN (COALESCE(w.used_capacity_sqm, 0) / w.capacity_sqm * 100)::DECIMAL(10,2)
         ELSE 0 END AS utilization_pct,
    COUNT(DISTINCT im.movement_id) AS movements_30d,
    COUNT(DISTINCT CASE WHEN im.movement_type = 'RECEIPT' THEN im.id END) AS receipts_30d,
    COUNT(DISTINCT CASE WHEN im.movement_type = 'DISPATCH' THEN im.id END) AS dispatches_30d
  FROM warehouses w
  LEFT JOIN inventory_stock_balances isb ON isb.warehouse_id = w.id
  LEFT JOIN inventory_items ii ON ii.id = isb.item_id
  LEFT JOIN LATERAL (
    SELECT DISTINCT movement_id, item_id, movement_type, movement_date
    FROM inventory_movements
    WHERE movement_date >= NOW() - INTERVAL '30 days'
  ) im ON im.item_id = isb.item_id
  GROUP BY w.id, w.name_ar, w.location, w.manager_name, w.capacity_sqm, w.used_capacity_sqm
  ORDER BY total_value DESC;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'bi-views skipped (schema drift): %', SQLERRM;
END
$$;

-- View: Procurement Pipeline
DO $$
BEGIN
  CREATE OR REPLACE VIEW v_procurement_pipeline AS
  SELECT 
    pt.id AS tender_id,
    pt.tender_number,
    pt.title_ar,
    pt.status,
    pt.procurement_method,
    pt.estimated_value,
    pt.actual_value,
    pt.closing_date,
    pt.award_date,
    pt.created_at,
    CASE WHEN pt.closing_date < NOW() AND pt.status = 'OPEN' THEN 'OVERDUE'
         WHEN pt.status = 'AWARDED' AND pt.award_date IS NOT NULL THEN 'COMPLETED'
         WHEN pt.status = 'OPEN' AND pt.closing_date >= NOW() THEN 'ACTIVE'
         ELSE pt.status END AS pipeline_status,
    COUNT(DISTINCT vb.id) AS bid_count,
    COUNT(DISTINCT CASE WHEN vb.status = 'QUALIFIED' THEN vb.id END) AS qualified_bids,
    MIN(vb.bid_amount) AS lowest_bid,
    MAX(vb.bid_amount) AS highest_bid,
    AVG(vb.bid_amount) AS avg_bid,
    ((pt.award_date)::date - (pt.closing_date)::date) AS award_lead_time_days
  FROM procurement_tenders pt
  LEFT JOIN vendor_bids vb ON vb.tender_id = pt.id
  GROUP BY pt.id, pt.tender_number, pt.title_ar, pt.status, pt.procurement_method,
           pt.estimated_value, pt.actual_value, pt.closing_date, pt.award_date, pt.created_at
  ORDER BY pt.created_at DESC;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'bi-views skipped (schema drift): %', SQLERRM;
END
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 6: STRATEGIC & KPI VIEWS
-- ═══════════════════════════════════════════════════════════════════════════

-- View: Strategic Plan Progress
DO $$
BEGIN
  CREATE OR REPLACE VIEW v_strategic_plan_progress AS
  SELECT 
    sp.id AS plan_id,
    sp.plan_code,
    sp.title_ar,
    sp.start_year,
    sp.end_year,
    sp.target_beneficiaries_count,
    sp.total_estimated_budget_yer,
    sp.overall_progress_pct,
    COUNT(DISTINCT sg.id) AS goal_count,
    AVG(sg.progress_pct) AS avg_goal_progress,
    COUNT(DISTINCT CASE WHEN sg.status = 'ON_TRACK' THEN sg.id END) AS on_track_goals,
    COUNT(DISTINCT CASE WHEN sg.status = 'AT_RISK' THEN sg.id END) AS at_risk_goals,
    COUNT(DISTINCT CASE WHEN sg.status = 'BEHIND' THEN sg.id END) AS behind_goals,
    COUNT(DISTINCT ki.id) AS kpi_count,
    AVG(ki.current_value::DECIMAL / NULLIF(ki.target_value::DECIMAL, 0) * 100) AS avg_kpi_achievement,
    COUNT(DISTINCT p.id) AS program_count,
    COUNT(DISTINCT proj.id) AS project_count
  FROM strategic_plans sp
  LEFT JOIN strategic_goals sg ON sg.plan_id = sp.id
  LEFT JOIN kpi_indicators ki ON ki.organization_id = sp.organization_id
  LEFT JOIN programs p ON p.organization_id = sp.organization_id
  LEFT JOIN projects proj ON proj.organization_id = sp.organization_id
  GROUP BY sp.id, sp.plan_code, sp.title_ar, sp.start_year, sp.end_year,
           sp.target_beneficiaries_count, sp.total_estimated_budget_yer, sp.overall_progress_pct
  ORDER BY sp.start_year DESC;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'bi-views skipped (schema drift): %', SQLERRM;
END
$$;

-- View: KPI Dashboard Data
DO $$
BEGIN
  CREATE OR REPLACE VIEW v_kpi_dashboard AS
  SELECT 
    ki.id AS kpi_id,
    ki.kpi_code,
    ki.name_ar,
    ki.category,
    ki.target_value,
    ki.current_value,
    ki.unit,
    ki.status,
    CASE WHEN ki.target_value > 0 
         THEN (ki.current_value::DECIMAL / ki.target_value * 100)::DECIMAL(10,2)
         ELSE 0 END AS achievement_pct,
    CASE WHEN ki.target_value > 0 AND ki.current_value >= ki.target_value THEN 'ACHIEVED'
         WHEN ki.target_value > 0 AND ki.current_value >= ki.target_value * 0.9 THEN 'NEARLY_ACHIEVED'
         WHEN ki.target_value > 0 AND ki.current_value >= ki.target_value * 0.75 THEN 'ON_TRACK'
         WHEN ki.target_value > 0 AND ki.current_value >= ki.target_value * 0.5 THEN 'AT_RISK'
         ELSE 'BEHIND_TARGET' END AS kpi_status,
    sp.title_ar AS plan_name,
    prog.name_ar AS program_name,
    proj.name_ar AS project_name,
    proj.status_code AS project_status
  FROM kpi_indicators ki
  LEFT JOIN strategic_plans sp ON sp.organization_id = ki.organization_id
  LEFT JOIN programs prog ON prog.id = ki.program_id
  LEFT JOIN projects proj ON proj.id = ki.project_id
  ORDER BY achievement_pct ASC NULLS LAST;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'bi-views skipped (schema drift): %', SQLERRM;
END
$$;

-- View: Donor Performance Metrics
DO $$
BEGIN
  CREATE OR REPLACE VIEW v_donor_performance AS
  SELECT 
    d.id AS donor_id,
    d.donor_code,
    d.name_ar,
    d.donor_type,
    COUNT(DISTINCT g.id) AS grant_count,
    SUM(g.total_amount) AS total_granted,
    AVG(g.total_amount) AS avg_grant_size,
    COUNT(DISTINCT g.project_id) AS projects_funded,
    COUNT(DISTINCT CASE WHEN g.status = 'ACTIVE' THEN g.id END) AS active_grants,
    COUNT(DISTINCT CASE WHEN g.status = 'COMPLETED' THEN g.id END) AS completed_grants,
    COUNT(DISTINCT gi.id) AS installment_count,
    SUM(gi.amount) AS total_disbursed,
    SUM(gi.amount) / NULLIF(SUM(g.total_amount), 0) * 100 AS disbursement_rate_pct,
    MIN(g.start_date) AS first_grant_date,
    MAX(g.end_date) AS last_grant_end_date,
    COUNT(DISTINCT dr.id) AS report_count,
    COUNT(DISTINCT dcr.id) AS compliance_count
  FROM donors d
  LEFT JOIN grants g ON g.donor_id = d.id
  LEFT JOIN grant_installments gi ON gi.grant_id = g.id AND gi.status = 'DISBURSED'
  LEFT JOIN donor_reports dr ON dr.donor_id = d.id
  LEFT JOIN donor_compliance_requirements dcr ON dcr.donor_id = d.id
  GROUP BY d.id, d.donor_code, d.name_ar, d.donor_type
  ORDER BY total_granted DESC;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'bi-views skipped (schema drift): %', SQLERRM;
END
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 7: MATERIALIZED VIEWS (For Performance)
-- ═══════════════════════════════════════════════════════════════════════════

-- Materialized View: Daily Beneficiary Snapshot
DO $$
BEGIN
  CREATE MATERIALIZED VIEW mv_daily_beneficiary_snapshot AS
  SELECT 
    CURRENT_DATE AS snapshot_date,
    governorate,
    district,
    gender,
    vulnerability_status,
    COUNT(*) AS beneficiary_count,
    SUM(family_members_count) AS total_family_members,
    COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) AS active_count
  FROM beneficiaries
  GROUP BY governorate, district, gender, vulnerability_status;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'bi-views skipped (schema drift): %', SQLERRM;
END
$$;

DO $$
BEGIN
  CREATE UNIQUE INDEX idx_mv_beneficiary_snapshot 
  ON mv_daily_beneficiary_snapshot(snapshot_date, governorate, district, gender, vulnerability_status);
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'bi-views skipped (schema drift): %', SQLERRM;
END
$$;

-- Materialized View: Monthly Financial Rollup
DO $$
BEGIN
  CREATE MATERIALIZED VIEW mv_monthly_financial_rollup AS
  SELECT 
    DATE_TRUNC('month', t.transaction_date)::DATE AS month,
    coa.account_type,
    coa.account_code,
    COUNT(*) AS transaction_count,
    SUM(tl.debit_amount) AS total_debit,
    SUM(tl.credit_amount) AS total_credit,
    COUNT(DISTINCT t.created_by_id) AS unique_users
  FROM transactions t
  JOIN transaction_lines tl ON tl.transaction_id = t.id
  JOIN chart_of_accounts coa ON coa.id = tl.account_id
  WHERE t.status = 'POSTED'
  GROUP BY DATE_TRUNC('month', t.transaction_date), coa.account_type, coa.account_code;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'bi-views skipped (schema drift): %', SQLERRM;
END
$$;

DO $$
BEGIN
  CREATE UNIQUE INDEX idx_mv_financial_rollup 
  ON mv_monthly_financial_rollup(month, account_type, account_code);
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'bi-views skipped (schema drift): %', SQLERRM;
END
$$;

-- Materialized View: Project Budget Utilization
DO $$
BEGIN
  CREATE MATERIALIZED VIEW mv_project_budget_utilization AS
  SELECT 
    p.id AS project_id,
    p.project_code,
    p.name_ar,
    p.budget,
    p.progress_percent,
    p.status_code,
    p.start_date,
    p.end_date,
    COALESCE(SUM(tl.debit_amount), 0) AS total_spent,
    p.budget - COALESCE(SUM(tl.debit_amount), 0) AS budget_remaining,
    CASE WHEN p.budget > 0 
         THEN (COALESCE(SUM(tl.debit_amount), 0) / p.budget * 100)::DECIMAL(10,2)
         ELSE 0 END AS utilization_pct,
    COUNT(DISTINCT CASE WHEN t.status = 'POSTED' THEN t.id END) AS transaction_count
  FROM projects p
  LEFT JOIN transaction_lines tl ON tl.project_id = p.id
  LEFT JOIN transactions t ON t.id = tl.transaction_id
  GROUP BY p.id, p.project_code, p.name_ar, p.budget, p.progress_percent, 
           p.status_code, p.start_date, p.end_date;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'bi-views skipped (schema drift): %', SQLERRM;
END
$$;

DO $$
BEGIN
  CREATE UNIQUE INDEX idx_mv_project_budget ON mv_project_budget_utilization(project_id);
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'bi-views skipped (schema drift): %', SQLERRM;
END
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 8: ADVANCED STORED FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Function: Calculate NPV (Net Present Value) for project cash flows
CREATE OR REPLACE FUNCTION fn_calculate_npv(
  cash_flows DECIMAL[],
  discount_rate DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  npv DECIMAL := 0;
  i INTEGER;
BEGIN
  FOR i IN 1..array_length(cash_flows, 1) LOOP
    npv := npv + (cash_flows[i] / POWER(1 + discount_rate, i - 1));
  END LOOP;
  RETURN npv;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Calculate ROI (Return on Investment)
CREATE OR REPLACE FUNCTION fn_calculate_roi(
  total_investment DECIMAL,
  total_returns DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  IF total_investment = 0 THEN RETURN 0; END IF;
  RETURN ((total_returns - total_investment) / total_investment * 100)::DECIMAL(10,2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Calculate budget variance
CREATE OR REPLACE FUNCTION fn_budget_variance(
  p_allocated DECIMAL,
  p_spent DECIMAL
) RETURNS TABLE(
  variance DECIMAL,
  variance_pct DECIMAL,
  status VARCHAR(20)
) AS $$
BEGIN
  variance := p_allocated - p_spent;
  IF p_allocated > 0 THEN
    variance_pct := (variance / p_allocated * 100)::DECIMAL(10,2);
  ELSE
    variance_pct := 0;
  END IF;
  
  IF p_spent > p_allocated THEN
    status := 'OVER_BUDGET';
  ELSIF p_spent >= p_allocated * 0.9 THEN
    status := 'AT_RISK';
  ELSIF p_spent > 0 THEN
    status := 'ON_TRACK';
  ELSE
    status := 'NOT_STARTED';
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function: Get fiscal period info
CREATE OR REPLACE FUNCTION fn_get_fiscal_period(
  p_date DATE,
  p_org_id UUID
) RETURNS TABLE(
  fiscal_year_id UUID,
  fiscal_year_name VARCHAR,
  period_start DATE,
  period_end DATE,
  period_number INTEGER,
  is_current BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fy.id,
    fy.name_ar,
    fy.start_date::DATE,
    fy.end_date::DATE,
    EXTRACT(MONTH FROM p_date - fy.start_date)::INTEGER + 1 AS period_number,
    (p_date BETWEEN fy.start_date AND fy.end_date) AS is_current
  FROM fiscal_years fy
  WHERE fy.organization_id = p_org_id
    AND p_date BETWEEN fy.start_date AND fy.end_date
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate beneficiary coverage percentage
CREATE OR REPLACE FUNCTION fn_coverage_percentage(
  p_target_group VARCHAR,
  p_total_beneficiaries BIGINT,
  p_target_number BIGINT
) RETURNS DECIMAL AS $$
BEGIN
  IF p_target_number = 0 THEN RETURN 0; END IF;
  RETURN LEAST((p_total_beneficiaries::DECIMAL / p_target_number * 100), 100)::DECIMAL(10,2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Aggregate monthly trends with growth rate
CREATE OR REPLACE FUNCTION fn_monthly_growth_rate(
  p_values DECIMAL[]
) RETURNS TABLE(
  month_index INTEGER,
  value DECIMAL,
  previous_value DECIMAL,
  growth_rate DECIMAL,
  cumulative DECIMAL
) AS $$
DECLARE
  cumulative_val DECIMAL := 0;
BEGIN
  FOR i IN 1..array_length(p_values, 1) LOOP
    cumulative_val := cumulative_val + p_values[i];
    RETURN QUERY SELECT 
      i,
      p_values[i],
      CASE WHEN i > 1 THEN p_values[i-1] ELSE NULL END,
      CASE WHEN i > 1 AND p_values[i-1] != 0 
           THEN ((p_values[i] - p_values[i-1]) / p_values[i-1] * 100)::DECIMAL(10,2)
           ELSE NULL END,
      cumulative_val;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate compliance score
CREATE OR REPLACE FUNCTION fn_compliance_score(
  p_total_requirements INTEGER,
  p_met_requirements INTEGER,
  p_partial_credit DECIMAL DEFAULT 0.5
) RETURNS DECIMAL AS $$
BEGIN
  IF p_total_requirements = 0 THEN RETURN 100; END IF;
  RETURN ((p_met_requirements + (p_total_requirements - p_met_requirements) * p_partial_credit) 
          / p_total_requirements * 100)::DECIMAL(10,2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Detect anomalies using standard deviation
CREATE OR REPLACE FUNCTION fn_detect_anomaly(
  p_values DECIMAL[],
  p_threshold DECIMAL DEFAULT 2.0
) RETURNS TABLE(
  index_pos INTEGER,
  value DECIMAL,
  mean_val DECIMAL,
  std_dev DECIMAL,
  z_score DECIMAL,
  is_anomaly BOOLEAN
) AS $$
DECLARE
  mean_val DECIMAL;
  std_dev DECIMAL;
  variance DECIMAL := 0;
  val DECIMAL;
BEGIN
  -- Calculate mean
  mean_val := (SELECT AVG(v) FROM unnest(p_values) AS v);
  
  -- Calculate variance and std dev
  FOREACH val IN ARRAY p_values LOOP
    variance := variance + POWER(val - mean_val, 2);
  END LOOP;
  std_dev := SQRT(variance / array_length(p_values, 1));
  
  -- Detect anomalies
  FOR i IN 1..array_length(p_values, 1) LOOP
    IF std_dev > 0 THEN
      z_score := (p_values[i] - mean_val) / std_dev;
    ELSE
      z_score := 0;
    END IF;
    
    RETURN QUERY SELECT 
      i,
      p_values[i],
      mean_val,
      std_dev,
      z_score,
      ABS(z_score) > p_threshold;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function: Get top N performers by metric
CREATE OR REPLACE FUNCTION fn_top_performers(
  p_table_name VARCHAR,
  p_value_column VARCHAR,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE(
  id UUID,
  value DECIMAL,
  rank_pos INTEGER
) AS $$
BEGIN
  RETURN QUERY EXECUTE format(
    'SELECT id, %I::DECIMAL AS value, ROW_NUMBER() OVER (ORDER BY %I DESC)::INTEGER AS rank
     FROM %I
     ORDER BY %I DESC
     LIMIT %s',
    p_value_column, p_value_column, p_table_name, p_value_column, p_limit
  );
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate weighted average for score
CREATE OR REPLACE FUNCTION fn_weighted_average(
  p_scores DECIMAL[],
  p_weights DECIMAL[]
) RETURNS DECIMAL AS $$
DECLARE
  total_weight DECIMAL := 0;
  weighted_sum DECIMAL := 0;
BEGIN
  FOR i IN 1..array_length(p_scores, 1) LOOP
    weighted_sum := weighted_sum + COALESCE(p_scores[i], 0) * COALESCE(p_weights[i], 1);
    total_weight := total_weight + COALESCE(p_weights[i], 1);
  END LOOP;
  
  IF total_weight = 0 THEN RETURN 0; END IF;
  RETURN (weighted_sum / total_weight)::DECIMAL(10,2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Generate fiscal year calendar
CREATE OR REPLACE FUNCTION fn_fiscal_year_calendar(
  p_start_date DATE,
  p_end_date DATE,
  p_period_type VARCHAR DEFAULT 'MONTHLY'
) RETURNS TABLE(
  period_start DATE,
  period_end DATE,
  period_label VARCHAR,
  period_number INTEGER
) AS $$
DECLARE
  v_current_date DATE := p_start_date;
  period_num INTEGER := 1;
  interval_val INTERVAL;
BEGIN
  interval_val := CASE p_period_type 
    WHEN 'WEEKLY' THEN INTERVAL '1 week'
    WHEN 'MONTHLY' THEN INTERVAL '1 month'
    WHEN 'QUARTERLY' THEN INTERVAL '3 months'
    ELSE INTERVAL '1 month'
  END;
  
  WHILE v_current_date <= p_end_date LOOP
    RETURN QUERY SELECT 
      v_current_date,
      LEAST(v_current_date + interval_val - INTERVAL '1 day', p_end_date),
      TO_CHAR(v_current_date, 'YYYY-MM'),
      period_num;
    
    v_current_date := v_current_date + interval_val;
    period_num := period_num + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function: Cascade delete with audit
CREATE OR REPLACE FUNCTION fn_cascade_delete_with_audit(
  p_table_name VARCHAR,
  p_record_id UUID,
  p_deleted_by UUID,
  p_reason TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_deleted_at TIMESTAMPTZ := NOW();
BEGIN
  -- Insert into audit log (columns match the real audit_logs schema)
  INSERT INTO audit_logs (
    id, table_name, record_id, action, user_id, details, created_at
  ) VALUES (
    gen_random_uuid(), p_table_name, p_record_id, 'DELETE',
    p_deleted_by,
    jsonb_build_object('reason', p_reason, 'timestamp', v_deleted_at),
    NOW()
  );
  
  -- Execute dynamic delete
  EXECUTE format('DELETE FROM %I WHERE id = $1', p_table_name) USING p_record_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 9: AUTOMATIC TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Trigger Function: Update account balances on transaction line change
CREATE OR REPLACE FUNCTION trg_update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE chart_of_accounts 
    SET current_balance = current_balance + 
      CASE WHEN NEW.debit_amount > 0 THEN NEW.debit_amount 
           WHEN NEW.credit_amount > 0 THEN -NEW.credit_amount
           ELSE 0 END
    WHERE id = NEW.account_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Reverse old entry
    UPDATE chart_of_accounts 
    SET current_balance = current_balance - 
      CASE WHEN OLD.debit_amount > 0 THEN OLD.debit_amount 
           WHEN OLD.credit_amount > 0 THEN -OLD.credit_amount
           ELSE 0 END
    WHERE id = OLD.account_id;
    
    -- Apply new entry
    UPDATE chart_of_accounts 
    SET current_balance = current_balance + 
      CASE WHEN NEW.debit_amount > 0 THEN NEW.debit_amount 
           WHEN NEW.credit_amount > 0 THEN -NEW.credit_amount
           ELSE 0 END
    WHERE id = NEW.account_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE chart_of_accounts 
    SET current_balance = current_balance - 
      CASE WHEN OLD.debit_amount > 0 THEN OLD.debit_amount 
           WHEN OLD.credit_amount > 0 THEN -OLD.credit_amount
           ELSE 0 END
    WHERE id = OLD.account_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for transaction_lines
DROP TRIGGER IF EXISTS trg_transaction_lines_balance ON transaction_lines;
-- NEUTRALIZED (release-hardening 2026-09-10): trigger trg_transaction_lines_balance is NOT installed. Body used pre-dialect columns and the app already maintains current_balance in code (double-count risk).

-- Trigger Function: Update project progress based on transactions
CREATE OR REPLACE FUNCTION trg_update_project_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_budget DECIMAL;
  v_spent DECIMAL;
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE', 'DELETE') THEN
    -- Calculate new spent amount
    SELECT COALESCE(SUM(tl.debit_amount), 0), p.budget
    INTO v_spent, v_budget
    FROM projects p
    LEFT JOIN transaction_lines tl ON tl.project_id = p.id
    LEFT JOIN transactions t ON t.id = tl.transaction_id AND t.status = 'POSTED'
    WHERE p.id = COALESCE(NEW.project_id, OLD.project_id)
    GROUP BY p.budget;
    
    -- Update project progress
    UPDATE projects SET 
      progress_percent = CASE WHEN v_budget > 0 
                             THEN LEAST((v_spent / v_budget * 100)::DECIMAL(10,2), 100)
                             ELSE 0 END,
      updated_at = NOW()
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_project_progress ON transaction_lines;
-- NEUTRALIZED (release-hardening 2026-09-10): trigger trg_project_progress is NOT installed. Body references projects.progress_percent which legacy schemas lack; progress is app-maintained.

-- Trigger Function: Update beneficiary count on distributions
CREATE OR REPLACE FUNCTION trg_update_aid_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update distribution stats
    UPDATE aid_distributions ad
    SET beneficiary_count = (
      SELECT COUNT(*) FROM distribution_beneficiaries WHERE distribution_id = ad.id
    )
    WHERE ad.id = NEW.distribution_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_aid_distribution_stats ON distribution_beneficiaries;
-- NEUTRALIZED (release-hardening 2026-09-10): trigger trg_aid_distribution_stats is NOT installed. Body sets aid_distributions.beneficiary_count which does not exist.

-- Trigger Function: Log all data changes for audit
CREATE OR REPLACE FUNCTION trg_audit_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_old_data JSONB;
  v_new_data JSONB;
BEGIN
  -- Get current user (in production, this would come from app context)
  v_user_id := NULLIF(current_setting('app.current_user_id', true), '')::UUID;
  
  IF TG_OP = 'INSERT' THEN
    v_new_data := to_jsonb(NEW);
    v_old_data := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := NULL;
  END IF;
  
  INSERT INTO audit_logs (
    id, table_name, record_id, action, performed_by, 
    old_data, new_data, ip_address, timestamp
  ) VALUES (
    gen_random_uuid(),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    v_user_id,
    v_old_data,
    v_new_data,
    NULLIF(current_setting('app.current_ip', true), ''),
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit trigger to critical tables
DROP TRIGGER IF EXISTS trg_audit_transactions ON transactions;
-- NEUTRALIZED (release-hardening 2026-09-10): trigger trg_audit_transactions is NOT installed. Body inserts performed_by/old_data/new_data/timestamp which audit_logs does not have; would fail every audited write.

DROP TRIGGER IF EXISTS trg_audit_beneficiaries ON beneficiaries;
-- NEUTRALIZED (release-hardening 2026-09-10): trigger trg_audit_beneficiaries is NOT installed. Body inserts performed_by/old_data/new_data/timestamp which audit_logs does not have; would fail every audited write.

DROP TRIGGER IF EXISTS trg_audit_users ON users;
-- NEUTRALIZED (release-hardening 2026-09-10): trigger trg_audit_users is NOT installed. Body inserts performed_by/old_data/new_data/timestamp which audit_logs does not have; would fail every audited write.

DROP TRIGGER IF EXISTS trg_audit_grants ON grants;
-- NEUTRALIZED (release-hardening 2026-09-10): trigger trg_audit_grants is NOT installed. Body inserts performed_by/old_data/new_data/timestamp which audit_logs does not have; would fail every audited write.

-- Trigger Function: Update budget spent on transaction
CREATE OR REPLACE FUNCTION trg_update_budget_spent()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE budget_lines
    SET spent_amount = spent_amount + NEW.debit_amount
    WHERE account_id = NEW.account_id
      AND COALESCE(project_id, '00000000-0000-0000-0000-000000000000') = COALESCE(NEW.project_id, '00000000-0000-0000-0000-000000000000')
      AND fiscal_year_id = (SELECT fiscal_year_id FROM transactions WHERE id = NEW.transaction_id);
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE budget_lines
    SET spent_amount = spent_amount - OLD.debit_amount
    WHERE account_id = OLD.account_id
      AND COALESCE(project_id, '00000000-0000-0000-0000-000000000000') = COALESCE(OLD.project_id, '00000000-0000-0000-0000-000000000000')
      AND fiscal_year_id = (SELECT fiscal_year_id FROM transactions WHERE id = OLD.transaction_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_budget ON transaction_lines;
-- NEUTRALIZED (release-hardening 2026-09-10): trigger trg_update_budget is NOT installed. Body targets budget_lines with dialect mismatches; budgets are enforced in service code.

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 10: REFRESH FUNCTIONS FOR MATERIALIZED VIEWS
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION fn_refresh_all_materialized_views()
RETURNS TABLE(view_name TEXT, refreshed_at TIMESTAMPTZ) AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_daily_beneficiary_snapshot;
  RETURN QUERY SELECT 'mv_daily_beneficiary_snapshot'::TEXT, NOW();
  
  REFRESH MATERIALIZED VIEW mv_monthly_financial_rollup;
  RETURN QUERY SELECT 'mv_monthly_financial_rollup'::TEXT, NOW();
  
  REFRESH MATERIALIZED VIEW mv_project_budget_utilization;
  RETURN QUERY SELECT 'mv_project_budget_utilization'::TEXT, NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to refresh specific materialized view
CREATE OR REPLACE FUNCTION fn_refresh_materialized_view(p_view_name VARCHAR)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  EXECUTE format('REFRESH MATERIALIZED VIEW %I', p_view_name);
  RETURN NOW();
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════════════

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ Business Intelligence Views & Functions migration completed';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Financial Views:';
  RAISE NOTICE '   - v_daily_financial_summary';
  RAISE NOTICE '   - v_monthly_financial_performance';
  RAISE NOTICE '   - v_account_balances';
  RAISE NOTICE '   - v_budget_vs_actual';
  RAISE NOTICE '   - v_cash_flow_summary';
  RAISE NOTICE '   - v_revenue_streams_analysis';
  RAISE NOTICE '   - v_expense_breakdown';
  RAISE NOTICE '';
  RAISE NOTICE '👥 Beneficiary Views:';
  RAISE NOTICE '   - v_beneficiary_demographics';
  RAISE NOTICE '   - v_beneficiary_coverage';
  RAISE NOTICE '   - v_beneficiary_age_distribution';
  RAISE NOTICE '   - v_sponsorship_performance';
  RAISE NOTICE '   - v_aid_distribution_summary';
  RAISE NOTICE '';
  RAISE NOTICE '📁 Project Views:';
  RAISE NOTICE '   - v_project_portfolio';
  RAISE NOTICE '   - v_program_progress';
  RAISE NOTICE '   - v_milestone_tracking';
  RAISE NOTICE '';
  RAISE NOTICE '👔 HR Views:';
  RAISE NOTICE '   - v_staff_composition';
  RAISE NOTICE '   - v_volunteer_engagement';
  RAISE NOTICE '   - v_attendance_patterns';
  RAISE NOTICE '';
  RAISE NOTICE '📦 Inventory Views:';
  RAISE NOTICE '   - v_inventory_health';
  RAISE NOTICE '   - v_warehouse_utilization';
  RAISE NOTICE '   - v_procurement_pipeline';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 KPI & Strategy Views:';
  RAISE NOTICE '   - v_strategic_plan_progress';
  RAISE NOTICE '   - v_kpi_dashboard';
  RAISE NOTICE '   - v_donor_performance';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ Materialized Views:';
  RAISE NOTICE '   - mv_daily_beneficiary_snapshot';
  RAISE NOTICE '   - mv_monthly_financial_rollup';
  RAISE NOTICE '   - mv_project_budget_utilization';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Functions:';
  RAISE NOTICE '   - fn_calculate_npv, fn_calculate_roi';
  RAISE NOTICE '   - fn_budget_variance, fn_coverage_percentage';
  RAISE NOTICE '   - fn_detect_anomaly, fn_monthly_growth_rate';
  RAISE NOTICE '   - fn_weighted_average, fn_compliance_score';
  RAISE NOTICE '   - fn_get_fiscal_period, fn_fiscal_year_calendar';
  RAISE NOTICE '   - fn_refresh_all_materialized_views';
  RAISE NOTICE '';
  RAISE NOTICE '⚙️  Triggers:';
  RAISE NOTICE '   - trg_update_account_balance';
  RAISE NOTICE '   - trg_update_project_progress';
  RAISE NOTICE '   - trg_update_aid_stats';
  RAISE NOTICE '   - trg_audit_changes (on critical tables)';
  RAISE NOTICE '   - trg_update_budget_spent';
END $$;
