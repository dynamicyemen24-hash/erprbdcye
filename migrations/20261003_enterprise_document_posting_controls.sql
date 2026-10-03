-- ================================================================
-- NexoraOS - Enterprise Document & Posting Controls
-- Migration: 20261003_enterprise_document_posting_controls
-- Standards: SAP (document numbering, SoD) + Oracle SLA (posting
--   rules) + Microsoft Dynamics (number series, dimensions)
-- Safety: ADDITIVE ONLY. No ALTER DROP, no renames, no deletes.
--   Every statement is IF NOT EXISTS inside a guarded DO block,
--   so schema drift can never break bootstrap. Runner owns the
--   transaction (no standalone BEGIN/COMMIT here).
-- Tables:
--   1. document_number_series (Dynamics Number Series)
--   2. posting_rules          (Dynamics posting groups / Oracle SLA)
--   3. dimensions, dimension_values, record_dimensions (Dimensions)
--   4. sod_conflict_matrix    (SAP/Oracle segregation of duties)
-- ================================================================

-- ─── 1. Document Number Series ─────────────────────────────────
DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS document_number_series (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    series_code VARCHAR(30) NOT NULL,
    name_ar VARCHAR(200) NOT NULL,
    name_en VARCHAR(200),
    prefix VARCHAR(20) NOT NULL DEFAULT '',
    next_number BIGINT NOT NULL DEFAULT 1 CHECK (next_number > 0),
    increment_by INTEGER NOT NULL DEFAULT 1 CHECK (increment_by > 0),
    min_digits INTEGER NOT NULL DEFAULT 6 CHECK (min_digits BETWEEN 1 AND 20),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, series_code)
  );
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'enterprise-controls skipped (schema drift): %', SQLERRM;
END
$$;

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_doc_series_org_active
    ON document_number_series(organization_id, series_code) WHERE is_active = true;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'enterprise-controls skipped (schema drift): %', SQLERRM;
END
$$;

-- ─── 2. Posting Rules (source event -> debit/credit accounts) ──
DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS posting_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    source_table VARCHAR(100) NOT NULL,
    event_code VARCHAR(60) NOT NULL,
    debit_account_id UUID REFERENCES chart_of_accounts(id),
    credit_account_id UUID REFERENCES chart_of_accounts(id),
    priority INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, source_table, event_code, priority)
  );
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'enterprise-controls skipped (schema drift): %', SQLERRM;
END
$$;

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_posting_rules_lookup
    ON posting_rules(organization_id, source_table, event_code, priority DESC)
    WHERE is_active = true;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'enterprise-controls skipped (schema drift): %', SQLERRM;
END
$$;

-- ─── 3. Dimensions framework ───────────────────────────────────
DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS dimensions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    dimension_code VARCHAR(40) NOT NULL,
    name_ar VARCHAR(200) NOT NULL,
    name_en VARCHAR(200),
    is_required BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, dimension_code)
  );
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'enterprise-controls skipped (schema drift): %', SQLERRM;
END
$$;

DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS dimension_values (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dimension_id UUID NOT NULL REFERENCES dimensions(id) ON DELETE CASCADE,
    value_code VARCHAR(60) NOT NULL,
    name_ar VARCHAR(200) NOT NULL,
    name_en VARCHAR(200),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(dimension_id, value_code)
  );
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'enterprise-controls skipped (schema drift): %', SQLERRM;
END
$$;

DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS record_dimensions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    dimension_id UUID NOT NULL REFERENCES dimensions(id) ON DELETE CASCADE,
    dimension_value_id UUID NOT NULL REFERENCES dimension_values(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(table_name, record_id, dimension_id)
  );
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'enterprise-controls skipped (schema drift): %', SQLERRM;
END
$$;

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_record_dimensions_lookup
    ON record_dimensions(organization_id, table_name, record_id);
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'enterprise-controls skipped (schema drift): %', SQLERRM;
END
$$;

-- ─── 4. Segregation-of-Duties conflict matrix ──────────────────
-- organization_id NULL = global rule applying to every organization.
DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS sod_conflict_matrix (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    role_a VARCHAR(80) NOT NULL,
    role_b VARCHAR(80) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'HIGH',
    description_ar VARCHAR(500),
    is_blocking BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_a, role_b)
  );
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'enterprise-controls skipped (schema drift): %', SQLERRM;
END
$$;

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_sod_lookup
    ON sod_conflict_matrix(role_a, role_b) WHERE is_active = true;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'enterprise-controls skipped (schema drift): %', SQLERRM;
END
$$;

-- DOWN
DROP TABLE IF EXISTS record_dimensions;
DROP TABLE IF EXISTS dimension_values;
DROP TABLE IF EXISTS dimensions;
DROP TABLE IF EXISTS posting_rules;
DROP TABLE IF EXISTS document_number_series;
DROP TABLE IF EXISTS sod_conflict_matrix;
