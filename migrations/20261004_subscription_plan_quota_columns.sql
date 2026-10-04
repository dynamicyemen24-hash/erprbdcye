-- =================================================================
-- NexoraOS - Subscription plan quota columns
-- Migration: 20261004_subscription_plan_quota_columns
-- Closes a proven gap: the Settings UI reads
-- organizations.max_users / organizations.max_storage_gb and the
-- subscription switch persists them, but no schema ever created
-- the columns. subscription_plan is included defensively for fresh
-- databases (registration already inserts it).
-- ADDITIVE ONLY (IF NOT EXISTS), runner owns the transaction.
-- =================================================================

DO $$
BEGIN
  ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'enterprise_pro';
  ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 50;
  ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_storage_gb INTEGER DEFAULT 100;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_column THEN
  RAISE NOTICE 'subscription quota columns skipped (schema drift): %', SQLERRM;
END
$$;
