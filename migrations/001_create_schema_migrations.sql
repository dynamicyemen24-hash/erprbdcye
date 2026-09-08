CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  migration_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(500) NOT NULL,
  checksum VARCHAR(64) NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  duration_ms INTEGER
);
CREATE INDEX IF NOT EXISTS idx_schema_migrations_id ON schema_migrations(migration_id);
