-- Hermetic fixture: mirrors the enterprise schema completion layer checked via
-- the combined schema + completion text in final_verification.js. Contains
-- every substring that script looks up in COMPLETION_SCHEMA_PATH.

CREATE TABLE IF NOT EXISTS sync_queue (
  id UUID PRIMARY KEY,
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS funding_proposals (
  id UUID PRIMARY KEY,
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS donor_reports (
  id UUID PRIMARY KEY,
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS partner_agreements (
  id UUID PRIMARY KEY,
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS service_deliveries (
  id UUID PRIMARY KEY,
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS aid_distributions (
  id UUID PRIMARY KEY,
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS sponsorship_payments (
  id UUID PRIMARY KEY,
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS revenue_records (
  id UUID PRIMARY KEY,
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS revenue_batches (
  id UUID PRIMARY KEY,
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS rfqs (
  id UUID PRIMARY KEY,
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS three_way_match_records (
  id UUID PRIMARY KEY,
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMP WITH TIME ZONE
);
