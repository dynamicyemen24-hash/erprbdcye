-- ================================================================
-- NexoraOS - Login & Vendor Hot-Path Indexes
-- Migration: 20261003_login_vendor_hotpath_indexes
-- Targets the two hottest production API paths that had no index:
--   1. POST /api/auth/login  -> LOWER(users.email) lookup
--   2. GET  /api/operational/vendors -> org vendor register
--      ORDER BY performance_score DESC, created_at DESC
-- Standards: additive only, IF NOT EXISTS inside guarded DO blocks
--   (schema drift can never break bootstrap). Runner owns the
--   transaction (no standalone BEGIN/COMMIT here).
-- ================================================================

-- 1. Login: case-insensitive email match (functional index)
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_users_lower_email
    ON users (LOWER(email))
    WHERE deleted_at IS NULL;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'login-email index skipped (schema drift): %', SQLERRM;
END
$$;

-- 2. Vendors register: org scope + score ordering (partial, matches query)
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_vendors_org_score
    ON vendors (organization_id, performance_score DESC, created_at DESC)
    WHERE deleted_at IS NULL;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'vendors-score index skipped (schema drift): %', SQLERRM;
END
$$;

-- 3. Communications overview rollups (status/priority scans per open)
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_official_comm_org_priority
    ON official_communications (organization_id, priority)
    WHERE deleted_at IS NULL;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'comms-priority index skipped (schema drift): %', SQLERRM;
END
$$;
