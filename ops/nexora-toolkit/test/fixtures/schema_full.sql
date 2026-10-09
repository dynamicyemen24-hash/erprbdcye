-- Hermetic fixture: mirrors the local (initial) schema surface checked by
-- final_verification.js and verify.js. Contains every substring those scripts
-- look for in LOCAL_SCHEMA_PATH. No real project paths, no DB access.

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

-- NEB-02 portfolio domain
CREATE TABLE IF NOT EXISTS investment_portfolios (
  id UUID PRIMARY KEY,
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
