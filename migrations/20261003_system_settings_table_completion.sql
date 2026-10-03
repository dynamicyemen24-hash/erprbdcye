-- ================================================================
-- NexoraOS - System Settings Table Completion
-- Migration: 20261003_system_settings_table_completion
-- Closes a proven gap: policyEngine reads system_settings and the
-- enterprise seeder inserts into it, but no schema ever created it.
-- Columns match exactly what the seeder writes and the engine reads.
-- ADDITIVE ONLY, guarded DO blocks, runner owns the transaction.
-- ================================================================

DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS system_settings (
    setting_key TEXT PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'string',
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'system-settings-completion skipped (schema drift): %', SQLERRM;
END
$$;

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_system_settings_org
    ON system_settings(organization_id) WHERE organization_id IS NOT NULL;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'system-settings-completion skipped (schema drift): %', SQLERRM;
END
$$;

-- DOWN
DROP TABLE IF EXISTS system_settings;
