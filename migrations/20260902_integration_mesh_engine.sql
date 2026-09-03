-- ═══════════════════════════════════════════════════════════════════
-- UAMEX ERP™ — Hyper-Scale Integration Mesh™ (NEB-12)
-- Database Migration: Integration Outbox, Subscriptions, and Sync Jobs
-- ═══════════════════════════════════════════════════════════════════
-- 1. Integration Outbox Table (Transactional Outbox Pattern)
CREATE TABLE IF NOT EXISTS integration_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(100) NOT NULL,
    -- NEB domain code (e.g., 'NEB-10')
    aggregate_id UUID NOT NULL,
    -- Entity ID
    event_type VARCHAR(255) NOT NULL,
    -- Full event type (e.g., 'NEB-10.transaction.created')
    payload JSONB NOT NULL,
    -- Full event envelope
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    -- PENDING, PUBLISHED, FAILED, DEAD_LETTERED
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 5,
    next_retry_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Index for efficient outbox processing
CREATE INDEX IF NOT EXISTS idx_outbox_status_created ON integration_outbox (status, created_at ASC)
WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_outbox_retry ON integration_outbox (next_retry_at ASC)
WHERE status = 'FAILED';
-- 2. Integration Subscriptions Table
CREATE TABLE IF NOT EXISTS integration_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    topic_pattern VARCHAR(255) NOT NULL,
    -- e.g., 'NEB-10.transaction.*'
    consumer_group VARCHAR(100) NOT NULL,
    transport VARCHAR(20) NOT NULL,
    -- webhook, kafka, nats, rabbitmq, sqs
    endpoint VARCHAR(500) NOT NULL,
    -- URL or broker address
    auth_config JSONB DEFAULT '{}',
    -- Auth configuration
    filter_expression TEXT,
    -- Optional JSONata filter
    retry_policy JSONB DEFAULT '{"maxAttempts": 3, "backoffStrategy": "exponential", "initialDelayMs": 1000, "maxDelayMs": 60000}',
    dead_letter_topic VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    -- ACTIVE, PAUSED, DISABLED
    metrics JSONB DEFAULT '{"totalEvents": 0, "successCount": 0, "failureCount": 0, "avgLatencyMs": 0}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Index for pattern matching
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_pattern ON integration_subscriptions (status, topic_pattern);
-- 3. Integration Sync Jobs Table
CREATE TABLE IF NOT EXISTS integration_sync_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    system_code VARCHAR(50) NOT NULL,
    -- IATI, UNHCR_PROGRES, WFP_SCOPE, etc.
    direction VARCHAR(20) NOT NULL,
    -- push, pull, bidirectional
    entity_type VARCHAR(100) NOT NULL,
    -- projects, beneficiaries, transactions
    status VARCHAR(20) NOT NULL DEFAULT 'running',
    -- running, completed, failed, cancelled
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Index for job history
CREATE INDEX IF NOT EXISTS idx_sync_jobs_system_started ON integration_sync_jobs (system_code, started_at DESC);
-- Index for running jobs
CREATE INDEX IF NOT EXISTS idx_sync_jobs_running ON integration_sync_jobs (started_at)
WHERE status = 'running';
-- 4. Integration Adapters Configuration Table
CREATE TABLE IF NOT EXISTS integration_adapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    system_code VARCHAR(50) NOT NULL UNIQUE,
    -- IATI, UN_OCHA_FTS, UNHCR_PROGRES, etc.
    display_name VARCHAR(255) NOT NULL,
    display_name_ar VARCHAR(255),
    version VARCHAR(20) NOT NULL,
    spec_url VARCHAR(500),
    transport VARCHAR(20) NOT NULL,
    -- rest, graphql, soap, sftp, kafka
    endpoint VARCHAR(500) NOT NULL,
    auth_profile JSONB DEFAULT '{}',
    field_mappings JSONB DEFAULT '[]',
    sync_interval_minutes INTEGER DEFAULT 60,
    default_sync_direction VARCHAR(20) DEFAULT 'pull',
    status VARCHAR(20) NOT NULL DEFAULT 'PROVISIONING',
    -- PROVISIONING, ACTIVE, DEGRADED, OFFLINE
    health_check JSONB DEFAULT '{"status": "unknown", "latencyMs": 0, "checkedAt": null}',
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Index for active adapters
CREATE INDEX IF NOT EXISTS idx_adapters_status ON integration_adapters (status);
-- 5. Event Audit Trail (Tamper-proof)
CREATE TABLE IF NOT EXISTS integration_event_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    merkle_hash VARCHAR(64) NOT NULL,
    -- SHA-256 hash for tamper detection
    previous_hash VARCHAR(64),
    -- Chain link to previous event
    tenant_id UUID NOT NULL,
    domain_code VARCHAR(20) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    signature VARCHAR(128) NOT NULL,
    -- HMAC-SHA256 signature
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_event_audit_entity ON integration_event_audit (tenant_id, domain_code, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_event_audit_created ON integration_event_audit (created_at DESC);
-- Index for chain verification
CREATE INDEX IF NOT EXISTS idx_event_audit_hash_chain ON integration_event_audit (merkle_hash);
-- 6. CDC (Change Data Capture) Tracking
CREATE TABLE IF NOT EXISTS integration_cdc_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_name VARCHAR(100) NOT NULL UNIQUE,
    publication_name VARCHAR(100) NOT NULL,
    last_lsn VARCHAR(50) NOT NULL,
    last_processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- 7. Reconciliation Reports
CREATE TABLE IF NOT EXISTS integration_reconciliation_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    system_a VARCHAR(50) NOT NULL,
    system_b VARCHAR(50) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    matched_count INTEGER DEFAULT 0,
    mismatch_count INTEGER DEFAULT 0,
    missing_in_a_count INTEGER DEFAULT 0,
    missing_in_b_count INTEGER DEFAULT 0,
    mismatches JSONB DEFAULT '[]',
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Index for report queries
CREATE INDEX IF NOT EXISTS idx_recon_reports_systems ON integration_reconciliation_reports (system_a, system_b, generated_at DESC);
-- 8. Insert default integration adapters
INSERT INTO integration_adapters (
        system_code,
        display_name,
        display_name_ar,
        version,
        transport,
        endpoint,
        status
    )
VALUES (
        'IATI',
        'IATI Datastore',
        'قاعدة بيانات معايير الشفافية الدولية',
        '2.03',
        'rest',
        'https://www.iatistandard.org/api',
        'PROVISIONING'
    ),
    (
        'UN_OCHA_FTS',
        'UN OCHA Financial Tracking Service',
        'خدمة تتبع التمويل التابعة للأمم المتحدة',
        '3.0',
        'rest',
        'https://api.hpc.tools/v1',
        'PROVISIONING'
    ),
    (
        'UNHCR_PROGRES',
        'UNHCR proGres',
        'نظام تتبع المستفيدين UNHCR',
        '4.5',
        'rest',
        'https://api.unhcr.org/v1',
        'PROVISIONING'
    ),
    (
        'WFP_SCOPE',
        'WFP SCOPE',
        'نظام SCOPE للتسجيل',
        '2.0',
        'rest',
        'https://api.wfp.org/v1',
        'PROVISIONING'
    ) ON CONFLICT (system_code) DO NOTHING;
-- 9. Insert default outbox cleanup function
CREATE OR REPLACE FUNCTION cleanup_integration_outbox() RETURNS void AS $$ BEGIN -- Delete published events older than 7 days
DELETE FROM integration_outbox
WHERE status = 'PUBLISHED'
    AND published_at < NOW() - INTERVAL '7 days';
-- Archive dead-lettered events older than 30 days
DELETE FROM integration_outbox
WHERE status = 'DEAD_LETTERED'
    AND created_at < NOW() - INTERVAL '30 days';
-- Reset failed events that have exceeded retry limit for re-processing
UPDATE integration_outbox
SET status = 'PENDING',
    retry_count = 0,
    next_retry_at = NULL
WHERE status = 'FAILED'
    AND retry_count >= max_retries
    AND created_at > NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;
-- 10. Create scheduled job for outbox processing (requires pg_cron extension)
-- Note: This is a placeholder for PostgreSQL pg_cron
-- SELECT cron.schedule('process-outbox', '*/1 * * * *', 'SELECT process_integration_outbox_batch(100)');
COMMENT ON TABLE integration_outbox IS 'Transactional outbox for guaranteed event delivery (UAMEX NEB-12)';
COMMENT ON TABLE integration_subscriptions IS 'Event subscription registry for external integrations (UAMEX NEB-12)';
COMMENT ON TABLE integration_sync_jobs IS 'Sync job history for external system integrations (UAMEX NEB-12)';
COMMENT ON TABLE integration_adapters IS 'External system adapter configurations (UAMEX NEB-12)';
COMMENT ON TABLE integration_event_audit IS 'Tamper-proof event audit trail with Merkle chain (UAMEX NEB-12)';
COMMENT ON TABLE integration_cdc_positions IS 'CDC WAL position tracking for PostgreSQL replication (UAMEX NEB-12)';
COMMENT ON TABLE integration_reconciliation_reports IS 'Cross-system data reconciliation reports (UAMEX NEB-12)';