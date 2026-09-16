-- ═══════════════════════════════════════════════════════════════════
-- NexoraOS™ — SaaS E2E Foundation (durable jobs, idempotency, MFA/TOTP)
-- Idempotent: safe to re-apply (IF NOT EXISTS / ON CONFLICT / DO blocks).
-- ═══════════════════════════════════════════════════════════════════

-- gen_random_uuid() for durable_jobs PK (allowed on Neon / managed Postgres)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── Durable job queue (Postgres SKIP LOCKED consumer) ─────────────
CREATE TABLE IF NOT EXISTS durable_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  priority SMALLINT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','active','completed','failed','cancelled')),
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_by TEXT NULL,
  locked_at TIMESTAMPTZ NULL,
  started_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  last_error TEXT NULL,
  result JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_durable_jobs_claim
  ON durable_jobs (status, run_at, priority DESC, created_at)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_durable_jobs_type ON durable_jobs (type);
CREATE INDEX IF NOT EXISTS idx_durable_jobs_org ON durable_jobs (organization_id)
  WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_durable_jobs_cleanup
  ON durable_jobs (status, completed_at)
  WHERE status IN ('completed','failed','cancelled');

-- ─── Server-side idempotency keys ──────────────────────────────────
CREATE TABLE IF NOT EXISTS idempotency_keys (
  organization_id TEXT NOT NULL DEFAULT 'global',
  idem_key TEXT NOT NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  payload_hash CHAR(32) NOT NULL,
  status_code INT NOT NULL,
  response JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
  PRIMARY KEY (organization_id, idem_key, method, path)
);

CREATE INDEX IF NOT EXISTS idx_idempotency_expiry ON idempotency_keys (expires_at);

-- ─── Server-enforced MFA/TOTP on users ─────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='users') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='totp_secret') THEN
      ALTER TABLE users ADD COLUMN totp_secret TEXT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='totp_enabled') THEN
      ALTER TABLE users ADD COLUMN totp_enabled BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='totp_verified_at') THEN
      ALTER TABLE users ADD COLUMN totp_verified_at TIMESTAMPTZ NULL;
    END IF;
  END IF;
END
$$;

-- ─── Defense-in-depth tenant isolation (FORCE RLS) ─────────────────
-- Applies even to the table owner (Neon roles connect as owner), using the
-- per-request `app.current_org` setting. Permissive when unset so bootstrap,
-- seeds, and single-tenant flows keep working; restrictive when set.
DO $$
DECLARE
  t RECORD;
  pol TEXT;
BEGIN
  FOR t IN
    SELECT c.relname AS tablename
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = c.relname
          AND column_name = 'organization_id'
      )
      AND c.relname NOT IN ('spatial_ref_sys', '_migrations', 'schema_migrations')
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t.tablename);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    pol := 'tenant_isolation_' || t.tablename;
    BEGIN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I AS PERMISSIVE FOR ALL TO PUBLIC ' ||
        'USING (current_setting(''app.current_org'', true) IS NULL ' ||
        'OR current_setting(''app.current_org'', true) = '''' ' ||
        'OR organization_id::text = current_setting(''app.current_org'', true)) ' ||
        'WITH CHECK (current_setting(''app.current_org'', true) IS NULL ' ||
        'OR current_setting(''app.current_org'', true) = '''' ' ||
        'OR organization_id::text = current_setting(''app.current_org'', true))',
        pol, t.tablename
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
                WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END
$$;
