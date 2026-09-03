-- ================================================================
-- NexoraOS™ — NEB-12 & NEB-13: Unified Search & Query Engine
-- Migration: 20260831_unified_search_engine
-- ================================================================
-- Tables created:
--   • search_index        — Persisted inverted index for all domains
--   • saved_searches      — Personal & shared saved search queries
--   • search_analytics    — Click-through & query telemetry
-- ================================================================

BEGIN;

-- ── 1. search_index ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_index (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id            UUID NOT NULL,
    domain            TEXT NOT NULL,
    record_id         UUID NOT NULL,
    title             TEXT NOT NULL,
    subtitle          TEXT,
    description       TEXT,
    keywords          TEXT,
    raw_search        TEXT NOT NULL,
    meta              JSONB DEFAULT '{}'::jsonb,
    weight            NUMERIC(3,2) NOT NULL DEFAULT 0.5,
    is_active         BOOLEAN NOT NULL DEFAULT true,
    indexed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT si_org_domain_record_uniq UNIQUE (org_id, domain, record_id)
);

COMMENT ON TABLE search_index IS 'Persisted unified search index across all 15 NEB domains';
COMMENT ON COLUMN search_index.domain IS 'SearchableDomain: project|beneficiary|donor|staff|voucher|...';
COMMENT ON COLUMN search_index.keywords IS 'Normalized (Arabic + English), space-separated tokens for fast ILIKE';
COMMENT ON COLUMN search_index.weight IS '0=lowest rank, 1=highest (e.g. active projects weight 0.8, archived 0.2)';
COMMENT ON COLUMN search_index.meta IS 'JSON: {url, status, governorate, category, ...}';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_si_org_active         ON search_index(org_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_si_org_domain          ON search_index(org_id, domain);
CREATE INDEX IF NOT EXISTS idx_si_raw_search_gin      ON search_index USING gin(to_tsvector('simple', raw_search));
CREATE INDEX IF NOT EXISTS idx_si_keywords_gin        ON search_index USING gin(to_tsvector('simple', keywords));
CREATE INDEX IF NOT EXISTS idx_si_record_lookup       ON search_index(org_id, domain, record_id);
CREATE INDEX IF NOT EXISTS idx_si_weight               ON search_index(org_id, weight DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_si_meta_status          ON search_index(org_id, (meta->>'status')) WHERE meta ? 'status';
CREATE INDEX IF NOT EXISTS idx_si_meta_governorate    ON search_index(org_id, (meta->>'governorate')) WHERE meta ? 'governorate';

-- ── 2. saved_searches ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_searches (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id            UUID NOT NULL,
    user_id           UUID NOT NULL,
    name              TEXT NOT NULL,
    description       TEXT,
    query             TEXT NOT NULL,
    domains           TEXT[] DEFAULT ARRAY[]::TEXT[],
    filters           JSONB DEFAULT '{}'::jsonb,
    is_public         BOOLEAN NOT NULL DEFAULT false,
    is_pinned         BOOLEAN NOT NULL DEFAULT false,
    tags              TEXT[] DEFAULT ARRAY[]::TEXT[],
    use_count         INTEGER NOT NULL DEFAULT 0,
    last_used_at      TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at        TIMESTAMPTZ
);

COMMENT ON TABLE saved_searches IS 'Personal & shared saved search queries with filters';
CREATE INDEX IF NOT EXISTS idx_ss_org_user             ON saved_searches(org_id, user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ss_org_public            ON saved_searches(org_id) WHERE is_public = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ss_pinned               ON saved_searches(org_id, is_pinned DESC, last_used_at DESC NULLS LAST) WHERE deleted_at IS NULL;

-- ── 3. search_analytics ────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_analytics (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id            UUID NOT NULL,
    user_id           UUID,
    query             TEXT NOT NULL,
    normalized_query  TEXT NOT NULL,
    domains_searched  TEXT[] DEFAULT ARRAY[]::TEXT[],
    hit_count         INTEGER NOT NULL DEFAULT 0,
    clicked_domain    TEXT,
    clicked_record_id UUID,
    duration_ms       INTEGER NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE search_analytics IS 'Search query telemetry: impressions, clicks, latency';
CREATE INDEX IF NOT EXISTS idx_sa_org_created         ON search_analytics(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sa_org_user             ON search_analytics(org_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sa_org_norm_query       ON search_analytics(org_id, normalized_query);
CREATE INDEX IF NOT EXISTS idx_sa_clicked              ON search_analytics(org_id, clicked_record_id) WHERE clicked_record_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sa_slow                ON search_analytics(org_id, duration_ms DESC) WHERE duration_ms > 500;
CREATE INDEX IF NOT EXISTS idx_sa_zero_hits           ON search_analytics(org_id, hit_count) WHERE hit_count = 0;

-- ── Touch trigger function ───────────────────────────────────
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_search_index_updated_at ON search_index;
CREATE TRIGGER trg_search_index_updated_at
    BEFORE UPDATE ON search_index
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_saved_searches_updated_at ON saved_searches;
CREATE TRIGGER trg_saved_searches_updated_at
    BEFORE UPDATE ON saved_searches
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ── Auto-index helper functions ──────────────────────────────
-- These helper functions are invoked by triggers to upsert into search_index

CREATE OR REPLACE FUNCTION upsert_search_index_project()
RETURNS TRIGGER AS $$
DECLARE
    v_org_id UUID;
BEGIN
    v_org_id := COALESCE(NEW.organization_id, '00000000-0000-0000-0000-000000000000'::uuid);
    IF NEW.deleted_at IS NOT NULL THEN
        UPDATE search_index SET is_active = false, updated_at = NOW()
            WHERE org_id = v_org_id AND record_id = NEW.id AND domain = 'project';
        RETURN NEW;
    END IF;
    INSERT INTO search_index (org_id, domain, record_id, title, subtitle, raw_search, keywords, meta, weight, is_active)
    VALUES (
        v_org_id, 'project', NEW.id,
        COALESCE(NEW.name_ar, NEW.name_en, NEW.project_code, ''),
        COALESCE(NEW.project_code, ''),
        LOWER(COALESCE(NEW.name_ar, '') || ' ' || COALESCE(NEW.name_en, '') || ' ' || COALESCE(NEW.project_code, '')),
        LOWER(COALESCE(NEW.name_ar, '') || ' ' || COALESCE(NEW.name_en, '')),
        jsonb_build_object(
            'url', '/projects/' || NEW.id,
            'status', NEW.status_code,
            'category', COALESCE(NEW.category_code, ''),
            'created_at', NEW.created_at
        ),
        CASE WHEN NEW.status_code = 'ACTIVE' THEN 0.8 WHEN NEW.status_code = 'COMPLETED' THEN 0.5 ELSE 0.3 END,
        true
    )
    ON CONFLICT (org_id, domain, record_id) DO UPDATE SET
        title = EXCLUDED.title,
        subtitle = EXCLUDED.subtitle,
        raw_search = EXCLUDED.raw_search,
        keywords = EXCLUDED.keywords,
        meta = EXCLUDED.meta,
        weight = EXCLUDED.weight,
        is_active = true,
        indexed_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION upsert_search_index_beneficiary()
RETURNS TRIGGER AS $$
DECLARE
    v_org_id UUID;
BEGIN
    v_org_id := COALESCE(NEW.organization_id, '00000000-0000-0000-0000-000000000000'::uuid);
    IF NEW.deleted_at IS NOT NULL THEN
        UPDATE search_index SET is_active = false, updated_at = NOW()
            WHERE org_id = v_org_id AND record_id = NEW.id AND domain = 'beneficiary';
        RETURN NEW;
    END IF;
    INSERT INTO search_index (org_id, domain, record_id, title, subtitle, raw_search, keywords, meta, weight, is_active)
    VALUES (
        v_org_id, 'beneficiary', NEW.id,
        COALESCE(NEW.full_name_ar, NEW.full_name_en, NEW.beneficiary_code, ''),
        COALESCE(NEW.beneficiary_code, ''),
        LOWER(COALESCE(NEW.full_name_ar, '') || ' ' || COALESCE(NEW.full_name_en, '') || ' ' || COALESCE(NEW.beneficiary_code, '')),
        LOWER(COALESCE(NEW.full_name_ar, '') || ' ' || COALESCE(NEW.full_name_en, '')),
        jsonb_build_object(
            'url', '/beneficiaries/' || NEW.id,
            'governorate', COALESCE(NEW.governorate, ''),
            'district', COALESCE(NEW.district, ''),
            'created_at', NEW.created_at
        ),
        0.7,
        true
    )
    ON CONFLICT (org_id, domain, record_id) DO UPDATE SET
        title = EXCLUDED.title,
        subtitle = EXCLUDED.subtitle,
        raw_search = EXCLUDED.raw_search,
        keywords = EXCLUDED.keywords,
        meta = EXCLUDED.meta,
        weight = EXCLUDED.weight,
        is_active = true,
        indexed_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS trg_project_auto_index ON projects;
CREATE TRIGGER trg_project_auto_index
    AFTER INSERT OR UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION upsert_search_index_project();

DROP TRIGGER IF EXISTS trg_beneficiary_auto_index ON beneficiaries;
CREATE TRIGGER trg_beneficiary_auto_index
    AFTER INSERT OR UPDATE ON beneficiaries
    FOR EACH ROW EXECUTE FUNCTION upsert_search_index_beneficiary();

-- ── Seed default saved searches (system-wide examples) ──────
-- (Skipped seed to avoid clashing with tenant orgs; real users create their own)
INSERT INTO saved_searches (org_id, user_id, name, description, query, domains, is_public, is_pinned, tags)
SELECT
    o.id, m.user_id, 'المشاريع النشطة' AS name,
    'جميع المشاريع الحالية والفعّالة' AS description,
    'مشاريع نشطة' AS query,
    ARRAY['project'] AS domains, true, true, ARRAY['projects','dashboard']
FROM organizations o
JOIN user_org_memberships m ON m.organization_id = o.id
WHERE NOT EXISTS (
    SELECT 1 FROM saved_searches s
    WHERE s.org_id = o.id AND s.user_id = m.user_id AND s.name = 'المشاريع النشطة'
)
LIMIT 1;

COMMIT;
