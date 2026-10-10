-- 2026-10-05: Add missing asset_group column to fixed_assets table
-- This column is referenced by the immutable audit ledger migration (20260915_001)
ALTER TABLE fixed_assets ADD COLUMN IF NOT EXISTS asset_group VARCHAR(50) NOT NULL DEFAULT 'UNCLASSIFIED';

COMMENT ON COLUMN fixed_assets.asset_group IS 'Asset group classification for IPSAS 17 reporting';