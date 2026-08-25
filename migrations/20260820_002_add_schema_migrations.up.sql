-- Migration 002: Schema version tracking — NEXORA_MIGRATION_AUDIT P0
-- Provides idempotent migration history for all future DDL changes
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  version VARCHAR(64) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checksum VARCHAR(128),
  execution_ms INTEGER
);
CREATE INDEX IF NOT EXISTS idx_schema_migrations_version ON schema_migrations(version);
-- Seed current migrations as applied
INSERT INTO schema_migrations (version, name, checksum) VALUES
  ('20260820_001', 'add_transaction_balance_constraint', 'chk_transaction_balance')
ON CONFLICT (version) DO NOTHING;
INSERT INTO schema_migrations (version, name, checksum) VALUES
  ('20260820_002', 'add_schema_migrations', 'schema_migrations_table')
ON CONFLICT (version) DO NOTHING;
