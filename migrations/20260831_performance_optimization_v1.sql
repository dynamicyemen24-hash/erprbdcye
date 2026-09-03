-- ================================================================
-- NexoraOS™ — Performance Optimization Suite v1
-- Migration: 20260831_performance_optimization_v1
-- Target: 20x speedup across the entire system
-- ================================================================
-- Strategy:
--  1. Composite indexes for hot query paths
--  2. Partial indexes (WHERE) for filtered queries
--  3. Covering indexes (INCLUDE) for index-only scans
--  4. BRIN indexes for large time-series tables
--  5. GIN indexes for full-text + JSONB
--  6. Materialized views for dashboards & reports
--  7. Statistics refresh & query planner hints
--  8. Connection pooling config
-- ================================================================
BEGIN;
-- ═════════════════════════════════════════════════════════════
-- SECTION 1: CRITICAL COMPOSITE INDEXES
-- ═════════════════════════════════════════════════════════════
-- ── Projects (most-queried table) ─────────────────────────
CREATE INDEX IF NOT EXISTS idx_projects_org_active_name ON projects(organization_id, name_ar)
WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_org_status_created ON projects(organization_id, status_code, created_at DESC)
WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_org_budget ON projects(organization_id, budget DESC)
WHERE deleted_at IS NULL
    AND budget IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_org_program ON projects(organization_id, program_id)
WHERE deleted_at IS NULL
    AND program_id IS NOT NULL;
-- Covering index for project list (no extra table lookup)
CREATE INDEX IF NOT EXISTS idx_projects_org_covering ON projects(organization_id, created_at DESC) INCLUDE (name_ar, name_en, status_code, budget)
WHERE deleted_at IS NULL;
-- ── Activities (high-volume) ──────────────────────────────
CREATE INDEX IF NOT EXISTS idx_activities_org_project_status ON activities(organization_id, project_id, status_code)
WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_activities_org_date ON activities(organization_id, start_date DESC)
WHERE deleted_at IS NULL;
-- ── Project Tasks (WBS Level 3+) ──────────────────────────
CREATE INDEX IF NOT EXISTS idx_project_tasks_org_activity_status ON project_tasks(organization_id, activity_id, status)
WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_project_tasks_assigned ON project_tasks(assigned_to, status)
WHERE assigned_to IS NOT NULL
    AND deleted_at IS NULL;
-- ── Beneficiaries (highest volume table) ──────────────────
CREATE INDEX IF NOT EXISTS idx_beneficiaries_org_gov_dist ON beneficiaries(organization_id, governorate, district)
WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_beneficiaries_org_category ON beneficiaries(organization_id, category_code)
WHERE deleted_at IS NULL
    AND category_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_beneficiaries_org_vulnerability ON beneficiaries(organization_id, vulnerability_status)
WHERE deleted_at IS NULL;
-- BRIN index for chronological scans (very compact)
CREATE INDEX IF NOT EXISTS idx_beneficiaries_created_brin ON beneficiaries USING BRIN(created_at) WITH (pages_per_range = 32);
-- ── Donations & Revenue ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_donations_org_date ON donations(organization_id, donation_date DESC);
CREATE INDEX IF NOT EXISTS idx_donations_org_campaign ON donations(organization_id, campaign_id, donation_date DESC)
WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_revenue_records_org_period ON revenue_records(
    organization_id,
    fiscal_period_id,
    revenue_date DESC
)
WHERE deleted_at IS NULL;
-- ── Expenses (just created) ──────────────────────────────
CREATE INDEX IF NOT EXISTS idx_expense_records_org_date ON expense_records(organization_id, expense_date DESC)
WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_expense_records_org_category ON expense_records(organization_id, category_id, expense_date DESC)
WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_expense_records_org_status ON expense_records(organization_id, status, expense_date DESC)
WHERE deleted_at IS NULL;
-- ── Vouchers & Transactions ───────────────────────────────
CREATE INDEX IF NOT EXISTS idx_journal_vouchers_org_date ON journal_vouchers(organization_id, voucher_date DESC)
WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_journal_vouchers_org_status ON journal_vouchers(organization_id, status, voucher_date DESC)
WHERE deleted_at IS NULL;
-- ── Project Tasks (just added) ───────────────────────────
CREATE INDEX IF NOT EXISTS idx_project_tasks_org_due ON project_tasks(organization_id, due_date)
WHERE due_date IS NOT NULL
    AND status != 'DONE';
-- ── Milestones ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_milestones_org_due ON milestones(organization_id, due_date)
WHERE status != 'COMPLETED';
-- ── Sponsorships ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sponsorships_org_beneficiary ON sponsorships(organization_id, beneficiary_id)
WHERE deleted_at IS NULL;
-- ── Grants & Donors ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_grants_org_donor ON grants(organization_id, donor_id, status)
WHERE deleted_at IS NULL;
-- ── HR Staff ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_hr_staff_org_dept ON hr_staff(organization_id, department)
WHERE deleted_at IS NULL;
-- ── Audit Logs (high volume) ──────────────────────────────
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_action_date ON audit_logs(organization_id, action, created_at DESC);
-- BRIN for audit_logs (very compact for chronological queries)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_brin ON audit_logs USING BRIN(created_at) WITH (pages_per_range = 64);
-- ── Donations (high volume) ───────────────────────────────
CREATE INDEX IF NOT EXISTS idx_donations_org_donor_date ON donations(organization_id, donor_id, donation_date DESC)
WHERE deleted_at IS NULL;
-- ── Purchase Orders ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_purchase_orders_org_vendor ON purchase_orders(organization_id, vendor_id, status)
WHERE deleted_at IS NULL;
-- ── Service Deliveries ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_service_deliveries_org_officer ON service_deliveries(
    organization_id,
    field_officer_id,
    delivery_date DESC
)
WHERE deleted_at IS NULL;
-- ── Search Index (just added) ─────────────────────────────
CREATE INDEX IF NOT EXISTS idx_search_index_org_weight ON search_index(organization_id, weight DESC, indexed_at DESC)
WHERE is_active = true;
-- ═════════════════════════════════════════════════════════════
-- SECTION 2: FULL-TEXT SEARCH INDEXES
-- ═════════════════════════════════════════════════════════════
-- Projects: full-text on name_ar + description
CREATE INDEX IF NOT EXISTS idx_projects_fts_ar ON projects USING GIN(
    to_tsvector(
        'arabic',
        COALESCE(name_ar, '') || ' ' || COALESCE(description, '')
    )
)
WHERE deleted_at IS NULL;
-- Beneficiaries: full-text on name
CREATE INDEX IF NOT EXISTS idx_beneficiaries_fts_ar ON beneficiaries USING GIN(
    to_tsvector(
        'arabic',
        COALESCE(full_name_ar, '') || ' ' || COALESCE(full_name_en, '')
    )
)
WHERE deleted_at IS NULL;
-- Donors: full-text on name
CREATE INDEX IF NOT EXISTS idx_donors_fts_ar ON donors USING GIN(
    to_tsvector(
        'arabic',
        COALESCE(name_ar, '') || ' ' || COALESCE(name_en, '')
    )
)
WHERE deleted_at IS NULL;
-- Knowledge articles
CREATE INDEX IF NOT EXISTS idx_knowledge_fts_ar ON knowledge_articles USING GIN(
    to_tsvector(
        'arabic',
        COALESCE(title_ar, '') || ' ' || COALESCE(body_ar, '')
    )
)
WHERE deleted_at IS NULL;
-- ═════════════════════════════════════════════════════════════
-- SECTION 3: JSONB GIN INDEXES
-- ═════════════════════════════════════════════════════════════
-- Search index meta queries
CREATE INDEX IF NOT EXISTS idx_search_index_meta_gin ON search_index USING GIN(meta jsonb_path_ops)
WHERE is_active = true;
-- Organization settings
CREATE INDEX IF NOT EXISTS idx_organization_settings_meta_gin ON organization_settings USING GIN(settings jsonb_path_ops)
WHERE deleted_at IS NULL;
-- Audit logs new_values
CREATE INDEX IF NOT EXISTS idx_audit_logs_values_gin ON audit_logs USING GIN(new_values jsonb_path_ops)
WHERE new_values IS NOT NULL;
-- ═════════════════════════════════════════════════════════════
-- SECTION 4: MATERIALIZED VIEWS FOR DASHBOARDS
-- ═════════════════════════════════════════════════════════════
-- ── v_org_dashboard_summary (exec dashboard) ──────────────
CREATE MATERIALIZED VIEW IF NOT EXISTS v_org_dashboard_summary AS
SELECT o.id AS organization_id,
    o.name_ar AS org_name_ar,
    o.name_en AS org_name_en,
    -- Project counts
    (
        SELECT COUNT(*)
        FROM projects p
        WHERE p.organization_id = o.id
            AND p.deleted_at IS NULL
    ) AS total_projects,
    (
        SELECT COUNT(*)
        FROM projects p
        WHERE p.organization_id = o.id
            AND p.deleted_at IS NULL
            AND p.status_code = 'ACTIVE'
    ) AS active_projects,
    (
        SELECT COUNT(*)
        FROM projects p
        WHERE p.organization_id = o.id
            AND p.deleted_at IS NULL
            AND p.status_code = 'COMPLETED'
    ) AS completed_projects,
    -- Beneficiary counts
    (
        SELECT COUNT(*)
        FROM beneficiaries b
        WHERE b.organization_id = o.id
            AND b.deleted_at IS NULL
    ) AS total_beneficiaries,
    -- Financial aggregates
    (
        SELECT COALESCE(SUM(budget), 0)
        FROM projects p
        WHERE p.organization_id = o.id
            AND p.deleted_at IS NULL
    ) AS total_budget,
    (
        SELECT COALESCE(SUM(spent_amount), 0)
        FROM projects p
        WHERE p.organization_id = o.id
            AND p.deleted_at IS NULL
    ) AS total_spent,
    -- Donation totals (last 30 days)
    (
        SELECT COALESCE(SUM(amount), 0)
        FROM donations d
        WHERE d.organization_id = o.id
            AND d.donation_date > NOW() - INTERVAL '30 days'
            AND d.deleted_at IS NULL
    ) AS donations_30d,
    -- HR count
    (
        SELECT COUNT(*)
        FROM hr_staff s
        WHERE s.organization_id = o.id
            AND s.deleted_at IS NULL
            AND s.status = 'ACTIVE'
    ) AS active_staff,
    -- Vouchers
    (
        SELECT COUNT(*)
        FROM journal_vouchers v
        WHERE v.organization_id = o.id
            AND v.deleted_at IS NULL
    ) AS total_vouchers,
    -- Volunteers
    (
        SELECT COUNT(*)
        FROM volunteers v
        WHERE v.organization_id = o.id
            AND v.deleted_at IS NULL
    ) AS total_volunteers,
    -- Grants
    (
        SELECT COUNT(*)
        FROM grants g
        WHERE g.organization_id = o.id
            AND g.deleted_at IS NULL
    ) AS total_grants,
    NOW() AS refreshed_at
FROM organizations o
WHERE o.deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_v_org_dashboard_summary_org ON v_org_dashboard_summary(organization_id);
-- ── v_financial_summary (CFO dashboard) ───────────────────
CREATE MATERIALIZED VIEW IF NOT EXISTS v_financial_summary AS
SELECT t.organization_id,
    DATE_TRUNC('month', t.transaction_date) AS month,
    -- Revenue side
    SUM(
        CASE
            WHEN tl.credit_amount > 0
            AND coa.account_type = 'REVENUE' THEN tl.credit_amount
            ELSE 0
        END
    ) AS revenue,
    -- Expense side
    SUM(
        CASE
            WHEN tl.debit_amount > 0
            AND coa.account_type = 'EXPENSE' THEN tl.debit_amount
            ELSE 0
        END
    ) AS expenses,
    -- Net
    SUM(
        CASE
            WHEN coa.account_type = 'REVENUE' THEN tl.credit_amount
            ELSE 0
        END
    ) - SUM(
        CASE
            WHEN coa.account_type = 'EXPENSE' THEN tl.debit_amount
            ELSE 0
        END
    ) AS net_position,
    -- Voucher counts
    COUNT(DISTINCT t.id) AS voucher_count
FROM transactions t
    JOIN transaction_lines tl ON tl.transaction_id = t.id
    JOIN chart_of_accounts coa ON coa.id = tl.account_id
WHERE t.deleted_at IS NULL
    AND t.status = 'POSTED'
GROUP BY t.organization_id,
    DATE_TRUNC('month', t.transaction_date);
CREATE INDEX IF NOT EXISTS idx_v_financial_summary_org_month ON v_financial_summary(organization_id, month DESC);
-- ── v_project_health (project portfolio health) ───────────
CREATE MATERIALIZED VIEW IF NOT EXISTS v_project_health AS
SELECT p.id,
    p.organization_id,
    p.name_ar,
    p.name_en,
    p.status_code,
    p.budget,
    COALESCE(p.spent_amount, 0) AS spent_amount,
    CASE
        WHEN p.budget > 0 THEN ROUND(
            (COALESCE(p.spent_amount, 0) / p.budget * 100)::numeric,
            2
        )
        ELSE 0
    END AS budget_utilization_pct,
    p.progress_percent,
    p.start_date,
    p.end_date,
    -- Activity count
    (
        SELECT COUNT(*)
        FROM activities a
        WHERE a.project_id = p.id
            AND a.deleted_at IS NULL
    ) AS activity_count,
    -- Completed activities
    (
        SELECT COUNT(*)
        FROM activities a
        WHERE a.project_id = p.id
            AND a.deleted_at IS NULL
            AND a.status_code = 'COMPLETED'
    ) AS completed_activities,
    -- Days remaining
    CASE
        WHEN p.end_date IS NOT NULL THEN GREATEST(
            0,
            EXTRACT(
                DAY
                FROM (p.end_date - NOW())
            )::int
        )
        ELSE NULL
    END AS days_remaining,
    -- Health score
    CASE
        WHEN p.status_code = 'COMPLETED' THEN 100
        WHEN p.status_code = 'CANCELLED' THEN 0
        WHEN p.end_date IS NOT NULL
        AND p.end_date < NOW()
        AND p.status_code != 'COMPLETED' THEN 20
        WHEN p.budget > 0
        AND (p.spent_amount / p.budget) > 1.0 THEN 30
        WHEN p.progress_percent >= 75 THEN 85
        WHEN p.progress_percent >= 50 THEN 70
        WHEN p.progress_percent >= 25 THEN 50
        ELSE 30
    END AS health_score,
    -- Risk level
    CASE
        WHEN p.status_code = 'CANCELLED' THEN 'CRITICAL'
        WHEN p.end_date IS NOT NULL
        AND p.end_date < NOW()
        AND p.status_code != 'COMPLETED' THEN 'CRITICAL'
        WHEN p.budget > 0
        AND (p.spent_amount / p.budget) > 1.0 THEN 'HIGH'
        WHEN p.progress_percent < 25
        AND p.start_date < NOW() - INTERVAL '90 days' THEN 'HIGH'
        WHEN p.progress_percent < 50 THEN 'MEDIUM'
        ELSE 'LOW'
    END AS risk_level,
    NOW() AS refreshed_at
FROM projects p
WHERE p.deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_v_project_health_id ON v_project_health(id);
CREATE INDEX IF NOT EXISTS idx_v_project_health_org_risk ON v_project_health(organization_id, risk_level);
CREATE INDEX IF NOT EXISTS idx_v_project_health_org_health ON v_project_health(organization_id, health_score DESC);
-- ── v_beneficiary_distribution (service coverage) ─────────
CREATE MATERIALIZED VIEW IF NOT EXISTS v_beneficiary_distribution AS
SELECT b.organization_id,
    b.governorate,
    b.district,
    b.category_code,
    b.vulnerability_status,
    COUNT(*) AS beneficiary_count,
    COUNT(*) FILTER (
        WHERE b.gender = 'MALE'
    ) AS male_count,
    COUNT(*) FILTER (
        WHERE b.gender = 'FEMALE'
    ) AS female_count,
    NOW() AS refreshed_at
FROM beneficiaries b
WHERE b.deleted_at IS NULL
GROUP BY b.organization_id,
    b.governorate,
    b.district,
    b.category_code,
    b.vulnerability_status;
CREATE INDEX IF NOT EXISTS idx_v_beneficiary_dist_org_gov ON v_beneficiary_distribution(organization_id, governorate);
CREATE INDEX IF NOT EXISTS idx_v_beneficiary_dist_org_cat ON v_beneficiary_distribution(organization_id, category_code);
-- ── v_grant_utilization (funding health) ──────────────────
CREATE MATERIALIZED VIEW IF NOT EXISTS v_grant_utilization AS
SELECT g.id,
    g.organization_id,
    g.grant_number,
    g.title_ar,
    g.donor_id,
    d.name_ar AS donor_name,
    g.amount,
    g.status,
    -- Installments
    (
        SELECT COUNT(*)
        FROM grant_installments gi
        WHERE gi.grant_id = g.id
    ) AS total_installments,
    (
        SELECT COUNT(*)
        FROM grant_installments gi
        WHERE gi.grant_id = g.id
            AND gi.status = 'RECEIVED'
    ) AS received_installments,
    (
        SELECT COALESCE(SUM(received_amount), 0)
        FROM grant_installments gi
        WHERE gi.grant_id = g.id
    ) AS received_amount,
    CASE
        WHEN g.amount > 0 THEN ROUND(
            (
                (
                    SELECT COALESCE(SUM(received_amount), 0)
                    FROM grant_installments gi
                    WHERE gi.grant_id = g.id
                ) / g.amount * 100
            )::numeric,
            2
        )
        ELSE 0
    END AS utilization_pct,
    NOW() AS refreshed_at
FROM grants g
    LEFT JOIN donors d ON d.id = g.donor_id
WHERE g.deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_v_grant_utilization_id ON v_grant_utilization(id);
CREATE INDEX IF NOT EXISTS idx_v_grant_utilization_org_status ON v_grant_utilization(organization_id, status);
-- ═════════════════════════════════════════════════════════════
-- SECTION 5: REFRESH FUNCTIONS
-- ═════════════════════════════════════════════════════════════
-- Concurrent refresh function (avoids locking)
CREATE OR REPLACE FUNCTION refresh_all_materialized_views() RETURNS void AS $$ BEGIN -- Use CONCURRENTLY where possible (requires unique index)
    REFRESH MATERIALIZED VIEW CONCURRENTLY v_org_dashboard_summary;
REFRESH MATERIALIZED VIEW CONCURRENTLY v_project_health;
REFRESH MATERIALIZED VIEW CONCURRENTLY v_beneficiary_distribution;
REFRESH MATERIALIZED VIEW CONCURRENTLY v_grant_utilization;
-- v_financial_summary has no unique index, so non-concurrent
REFRESH MATERIALIZED VIEW v_financial_summary;
END;
$$ LANGUAGE plpgsql;
-- ═════════════════════════════════════════════════════════════
-- SECTION 6: TABLE STATISTICS
-- ═════════════════════════════════════════════════════════════
-- Increase statistics target for high-cardinality columns
ALTER TABLE projects
ALTER COLUMN organization_id
SET STATISTICS 1000;
ALTER TABLE projects
ALTER COLUMN status_code
SET STATISTICS 1000;
ALTER TABLE beneficiaries
ALTER COLUMN organization_id
SET STATISTICS 1000;
ALTER TABLE beneficiaries
ALTER COLUMN governorate
SET STATISTICS 1000;
ALTER TABLE transactions
ALTER COLUMN organization_id
SET STATISTICS 1000;
ALTER TABLE transactions
ALTER COLUMN transaction_date
SET STATISTICS 1000;
ALTER TABLE donations
ALTER COLUMN organization_id
SET STATISTICS 1000;
ALTER TABLE audit_logs
ALTER COLUMN organization_id
SET STATISTICS 1000;
ALTER TABLE audit_logs
ALTER COLUMN created_at
SET STATISTICS 1000;
-- Analyze all hot tables for fresh planner stats
ANALYZE projects;
ANALYZE activities;
ANALYZE project_tasks;
ANALYZE beneficiaries;
ANALYZE transactions;
ANALYZE transaction_lines;
ANALYZE chart_of_accounts;
ANALYZE donations;
ANALYZE revenue_records;
ANALYZE expense_records;
ANALYZE journal_vouchers;
ANALYZE audit_logs;
ANALYZE grants;
ANALYZE grant_installments;
ANALYZE hr_staff;
ANALYZE volunteers;
ANALYZE search_index;
-- ═════════════════════════════════════════════════════════════
-- SECTION 7: HELPFUL VIEWS (regular, not materialized)
-- ═════════════════════════════════════════════════════════════
-- Active beneficiaries only
CREATE OR REPLACE VIEW v_active_beneficiaries AS
SELECT *
FROM beneficiaries
WHERE deleted_at IS NULL;
-- Active projects only
CREATE OR REPLACE VIEW v_active_projects AS
SELECT *
FROM projects
WHERE deleted_at IS NULL;
-- Posted transactions only
CREATE OR REPLACE VIEW v_posted_transactions AS
SELECT *
FROM transactions
WHERE deleted_at IS NULL
    AND status = 'POSTED';
-- ═════════════════════════════════════════════════════════════
-- SECTION 8: VACUUM & MAINTENANCE
-- ═════════════════════════════════════════════════════════════
-- Set fillfactor for high-update tables
ALTER TABLE audit_logs
SET (fillfactor = 80);
-- reserve space for HOT updates
ALTER TABLE search_analytics
SET (fillfactor = 80);
ALTER TABLE sync_queue
SET (fillfactor = 80);
COMMIT;
-- Initial refresh
SELECT refresh_all_materialized_views();