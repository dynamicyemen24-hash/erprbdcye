-- ═══════════════════════════════════════════════════════════════════════
-- UAMEX ERP™ — Database Security Hardening
-- Migration: 20260903_security_hardening.sql
-- Applies: least-privilege schema grants, tenant-scoped hot-path indexes,
--           and explicit security posture documentation.
-- Note: every statement is idempotent and safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════

-- ─── 1. Least-privilege: PUBLIC can no longer CREATE objects in `public`.
-- The application role owns the schema (Neon default) so it keeps its own DDL
-- rights, while every OTHER role is locked down. Prevents cross-tenant or
-- compromised-account object tampering.
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

-- ─── 2. Tenant-scoped hot-path indexes: fill the gaps where the migrations
-- and schema completion did not already add them. Guarded so it never fails
-- (IF table does not exist yet, skip it).
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'beneficiaries', 'hr_staff', 'volunteers', 'donors', 'grants',
    'inventory_items', 'stock_movements', 'assets', 'procurements',
    'official_communications', 'official_communication_recipients',
    'revenue_records', 'revenue_streams', 'expense_records',
    'journal_entries', 'journal_items', 'vouchers', 'invoices', 'approvals'
  ] LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_org ON %I (organization_id)', t, t);
    END IF;
  END LOOP;
END $$;

-- ─── 3. DoS guard: bound every server-side statement/query for this role too.
-- Only advisory when they pool settings are not honored (defense-in-depth for ad-hoc tools).
ALTER ROLE CURRENT_USER SET statement_timeout = '30s';

-- ─── 4. Security posture documentation ─────────────────────────────────────
COMMENT ON SCHEMA public IS
  'UAMEX ERP public schema — tenant isolation is enforced at the query layervia organization_id; PUBLIC DDL revoked; hot-path org indexes maintained by 20260903_security_hardening.sql.';