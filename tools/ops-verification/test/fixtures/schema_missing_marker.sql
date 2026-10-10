-- Negative fixture for verify.js: mirrors schema_full.sql but one of the four
-- offline-first markers is absent, so verify.js must report 3/4 and exit 1.
-- (Do not name that marker in this comment - the script greps raw text.)

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY,
  offline_enabled BOOLEAN DEFAULT TRUE,
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS beneficiaries (
  id UUID PRIMARY KEY,
  offline_enabled BOOLEAN DEFAULT TRUE,
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY,
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY,
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS investment_portfolios (
  id UUID PRIMARY KEY,
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMP WITH TIME ZONE
);

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

CREATE TABLE IF NOT EXISTS field_disbursements (
  id UUID PRIMARY KEY,
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMP WITH TIME ZONE
);
