-- ═══════════════════════════════════════════════════════════════════════════════
-- NexoraOS™ — Fix fan-out explosion in dashboard aggregate views
-- Date: 2026-10-05 | NEB-01/NEB-13
--
-- PROBLEM (caught by E2E: dashboard-stats timed out at 30s+):
-- v_executive_dashboard joined organizations × transactions × projects ×
-- activities × beneficiaries (and v_statistical_summary_new added parties ×
-- party_roles × transactions on top) in ONE flat join with COUNT(DISTINCT).
-- Intermediate row counts reach billions on production volumes; the three
-- views hung past every timeout even on small tables (cold shared compute).
-- As a bonus bug, SUM(budget) over fan-out rows INFLATED every money total
-- by the fan-out factor.
--
-- FIX (standard BI practice, SAP BW-style): pre-aggregate each domain in an
-- indexed GROUP BY subquery, then LEFT JOIN the small per-org aggregates.
-- Output columns, names, order and types are IDENTICAL to the old views
-- (verified: numeric stays numeric, counts stay bigint); only the inflated
-- money totals now report correct (lower) values.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. v_executive_dashboard ─────────────────────────────────────────────
CREATE OR REPLACE VIEW v_executive_dashboard AS
SELECT
  o.id AS organization_id,
  o.name_ar AS organization_name,
  COALESCE(t.total_donations, 0::numeric) AS total_donations,
  COALESCE(t.total_expenses, 0::numeric) AS total_expenses,
  COALESCE(t.net_position, 0::numeric) AS net_position,
  COALESCE(b.total_beneficiaries, 0::bigint) AS total_beneficiaries,
  COALESCE(b.active_beneficiaries, 0::bigint) AS active_beneficiaries,
  COALESCE(p.total_projects, 0::bigint) AS total_projects,
  COALESCE(p.active_projects, 0::bigint) AS active_projects,
  COALESCE(p.completed_projects, 0::bigint) AS completed_projects,
  COALESCE(a.total_activities, 0::bigint) AS total_activities,
  COALESCE(a.completed_activities, 0::bigint) AS completed_activities,
  COALESCE(t.active_donors, 0::bigint) AS active_donors
FROM organizations o
LEFT JOIN (
  SELECT organization_id,
    SUM(CASE WHEN transaction_type::text = 'donation' THEN total_debit ELSE 0::numeric END) AS total_donations,
    SUM(CASE WHEN transaction_type::text = 'expense' THEN total_debit ELSE 0::numeric END) AS total_expenses,
    SUM(CASE WHEN transaction_type::text = 'donation' THEN total_debit ELSE -total_debit END) AS net_position,
    COUNT(DISTINCT CASE WHEN transaction_type::text = 'donation' AND primary_party_id IS NOT NULL THEN primary_party_id END) AS active_donors
  FROM transactions
  WHERE is_posted = true AND deleted_at IS NULL
  GROUP BY organization_id
) t ON t.organization_id = o.id
LEFT JOIN (
  SELECT organization_id,
    COUNT(*) AS total_beneficiaries,
    COUNT(*) FILTER (WHERE status_code::text = 'active') AS active_beneficiaries
  FROM beneficiaries
  WHERE deleted_at IS NULL
  GROUP BY organization_id
) b ON b.organization_id = o.id
LEFT JOIN (
  SELECT organization_id,
    COUNT(*) AS total_projects,
    COUNT(*) FILTER (WHERE status_code::text = 'active') AS active_projects,
    COUNT(*) FILTER (WHERE status_code::text = 'completed') AS completed_projects
  FROM projects
  WHERE deleted_at IS NULL
  GROUP BY organization_id
) p ON p.organization_id = o.id
LEFT JOIN (
  SELECT organization_id,
    COUNT(*) AS total_activities,
    COUNT(*) FILTER (WHERE status_code::text = 'completed') AS completed_activities
  FROM activities
  WHERE deleted_at IS NULL
  GROUP BY organization_id
) a ON a.organization_id = o.id
WHERE o.deleted_at IS NULL AND o.status::text = 'active';

-- ─── 2. v_statistical_summary_new ─────────────────────────────────────────
CREATE OR REPLACE VIEW v_statistical_summary_new AS
SELECT
  o.id AS organization_id,
  o.name_ar AS organization_name,
  COALESCE(pg.total_programs, 0::bigint) AS total_programs,
  COALESCE(pg.active_programs, 0::bigint) AS active_programs,
  COALESCE(pg.total_program_budget, 0::numeric) AS total_program_budget,
  COALESCE(prj.total_projects, 0::bigint) AS total_projects,
  COALESCE(prj.active_projects, 0::bigint) AS active_projects,
  COALESCE(prj.total_project_budget, 0::numeric) AS total_project_budget,
  COALESCE(act.total_activities, 0::bigint) AS total_activities,
  COALESCE(act.active_activities, 0::bigint) AS active_activities,
  COALESCE(ben.total_beneficiaries, 0::bigint) AS total_beneficiaries,
  COALESCE(don.total_donations, 0::bigint) AS total_donations,
  COALESCE(don.total_donation_amount, 0::numeric) AS total_donation_amount
FROM organizations o
LEFT JOIN (
  SELECT organization_id,
    COUNT(*) AS total_programs,
    COUNT(*) FILTER (WHERE status_code::text = 'active') AS active_programs,
    SUM(budget) AS total_program_budget
  FROM programs
  WHERE deleted_at IS NULL
  GROUP BY organization_id
) pg ON pg.organization_id = o.id
LEFT JOIN (
  SELECT organization_id,
    COUNT(*) AS total_projects,
    COUNT(*) FILTER (WHERE status_code::text = 'active') AS active_projects,
    SUM(budget) AS total_project_budget
  FROM projects
  WHERE deleted_at IS NULL
  GROUP BY organization_id
) prj ON prj.organization_id = o.id
LEFT JOIN (
  SELECT organization_id,
    COUNT(*) AS total_activities,
    COUNT(*) FILTER (WHERE status_code::text = 'in_progress') AS active_activities
  FROM activities
  WHERE deleted_at IS NULL
  GROUP BY organization_id
) act ON act.organization_id = o.id
LEFT JOIN (
  SELECT p2.organization_id, COUNT(DISTINCT p2.id) AS total_beneficiaries
  FROM parties p2
  JOIN party_roles pr2 ON pr2.party_id = p2.id AND pr2.deleted_at IS NULL
  WHERE p2.deleted_at IS NULL AND pr2.role_code::text = 'beneficiary'
  GROUP BY p2.organization_id
) ben ON ben.organization_id = o.id
LEFT JOIN (
  SELECT organization_id,
    COUNT(*) FILTER (WHERE transaction_type::text = 'donation') AS total_donations,
    COALESCE(SUM(CASE WHEN transaction_type::text = 'donation' THEN total_credit ELSE 0::numeric END), 0::numeric) AS total_donation_amount
  FROM transactions
  WHERE deleted_at IS NULL
  GROUP BY organization_id
) don ON don.organization_id = o.id
WHERE o.deleted_at IS NULL;
