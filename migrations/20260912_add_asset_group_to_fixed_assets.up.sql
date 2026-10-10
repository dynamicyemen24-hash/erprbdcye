-- 2026-09-12: Ensure fixed_assets has the asset_group column required by later migrations
-- This migration must run before 20260915_001_immutable_audit_ledger.up.sql
ALTER TABLE fixed_assets ADD COLUMN IF NOT EXISTS asset_group VARCHAR(50) NOT NULL DEFAULT 'UNCLASSIFIED';

COMMENT ON COLUMN fixed_assets.asset_group IS 'Asset group classification for IPSAS 17 reporting';