-- 2026-09-13: Ensure fixed_assets has the asset_status column required by later migrations
-- This migration must run before 20260915_001_immutable_audit_ledger.up.sql
ALTER TABLE fixed_assets ADD COLUMN IF NOT EXISTS asset_status VARCHAR(20) NOT NULL DEFAULT 'IN_USE' CHECK (asset_status IN ('IN_USE', 'MAINTENANCE', 'DISPOSED', 'REVALUED', 'HELD_FOR_SALE'));

COMMENT ON COLUMN fixed_assets.asset_status IS 'Current status of the fixed asset';