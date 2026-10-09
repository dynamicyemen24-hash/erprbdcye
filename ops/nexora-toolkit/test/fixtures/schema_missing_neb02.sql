-- Negative fixture for final_verification.js: identical to schema_full.sql
-- but the NEB-02 portfolio table is absent, so the result must come out below
-- 19/19 and the script must exit 1. (Comment must not name the missing table.)

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY,
  offline_enabled BOOLEAN DEFAULT TRUE,
  sync_status TEXT DEFAULT 'pending',
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS beneficiaries (
  id UUID PRIMARY KEY,
  offline_enabled BOOLEAN DEFAULT TRUE,
  sync_status TEXT DEFAULT 'pending',
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY,
  sync_status TEXT DEFAULT 'pending',
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY,
  sync_status TEXT DEFAULT 'pending',
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- NEB-12 integration domain
CREATE TABLE IF NOT EXISTS api_endpoints (
  id UUID PRIMARY KEY,
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS api_credentials (
  id UUID PRIMARY KEY,
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- NEB-13 AI domain
CREATE TABLE IF NOT EXISTS ai_model_configs (
  id UUID PRIMARY KEY,
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS ai_prompt_templates (
  id UUID PRIMARY KEY,
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- NEB-10 finance domain
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY,
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id UUID PRIMARY KEY,
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- NEB-05 operations domain
CREATE TABLE IF NOT EXISTS field_disbursements (
  id UUID PRIMARY KEY,
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMP WITH TIME ZONE
);
