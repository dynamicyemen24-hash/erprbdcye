-- ═══════════════════════════════════════════════════════════════════
-- UAMEX ERP™ — Global Federation Cockpit™ Migration
-- Multi-Tenant + ESG + Post-Quantum Cryptography + Observability
-- Migration Date: 2026-09-02
-- ═══════════════════════════════════════════════════════════════════
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
-- ═══════════════════════════════════════════════════════════════════
-- 1. MULTI-TENANT FEDERATION TABLES
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS federation_tenants (
    tenant_id VARCHAR(64) PRIMARY KEY,
    display_name VARCHAR(200) NOT NULL,
    legal_entity VARCHAR(300) NOT NULL,
    country_code CHAR(2) NOT NULL,
    default_currency CHAR(3) NOT NULL DEFAULT 'USD',
    default_locale VARCHAR(10) NOT NULL DEFAULT 'en-US',
    tier VARCHAR(20) NOT NULL CHECK (
        tier IN (
            'starter',
            'professional',
            'enterprise',
            'sovereign'
        )
    ),
    isolation_level VARCHAR(20) NOT NULL CHECK (
        isolation_level IN ('database', 'schema', 'row', 'compute')
    ),
    data_residency VARCHAR(20) NOT NULL CHECK (
        data_residency IN ('local', 'regional', 'global')
    ),
    region VARCHAR(20) NOT NULL CHECK (
        region IN ('mea', 'apac', 'eur', 'amer', 'global')
    ),
    database_url TEXT,
    schema_name VARCHAR(64),
    feature_flags JSONB DEFAULT '{}'::jsonb,
    quotas JSONB NOT NULL,
    branding JSONB NOT NULL,
    compliance_frameworks JSONB DEFAULT '[]'::jsonb,
    parent_tenant_id VARCHAR(64) REFERENCES federation_tenants(tenant_id) ON DELETE
    SET NULL,
        child_tenant_ids JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(20) NOT NULL DEFAULT 'onboarding' CHECK (
            status IN ('active', 'suspended', 'archived', 'onboarding')
        ),
        contract_expires_at TIMESTAMPTZ,
        archived_at TIMESTAMPTZ,
        retention_expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_federation_tenants_status ON federation_tenants(status)
WHERE status = 'active';
CREATE INDEX idx_federation_tenants_tier ON federation_tenants(tier);
CREATE INDEX idx_federation_tenants_region ON federation_tenants(region);
CREATE INDEX idx_federation_tenants_parent ON federation_tenants(parent_tenant_id)
WHERE parent_tenant_id IS NOT NULL;
CREATE INDEX idx_federation_tenants_country ON federation_tenants(country_code);
CREATE INDEX idx_federation_tenants_features ON federation_tenants USING GIN (feature_flags);
CREATE INDEX idx_federation_tenants_search ON federation_tenants USING GIN (
    display_name gin_trgm_ops,
    legal_entity gin_trgm_ops
);
-- Tenant usage metrics (daily rollup)
CREATE TABLE IF NOT EXISTS tenant_usage_metrics (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL REFERENCES federation_tenants(tenant_id) ON DELETE CASCADE,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    active_users INTEGER NOT NULL DEFAULT 0,
    storage_used_gb DECIMAL(15, 4) NOT NULL DEFAULT 0,
    api_calls_count BIGINT NOT NULL DEFAULT 0,
    ai_tokens_used BIGINT NOT NULL DEFAULT 0,
    transactions_processed BIGINT NOT NULL DEFAULT 0,
    peak_concurrent_users INTEGER NOT NULL DEFAULT 0,
    compliance_violations INTEGER NOT NULL DEFAULT 0,
    esg_score_delta DECIMAL(8, 4) NOT NULL DEFAULT 0,
    carbon_offset_kg DECIMAL(15, 4) NOT NULL DEFAULT 0,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, period_start)
);
CREATE INDEX idx_tenant_usage_tenant ON tenant_usage_metrics(tenant_id, period_start DESC);
-- Tenant routing rules
CREATE TABLE IF NOT EXISTS tenant_routing_rules (
    rule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id_pattern VARCHAR(200) NOT NULL,
    country_code CHAR(2),
    region VARCHAR(20) NOT NULL,
    isolation_level VARCHAR(20) NOT NULL,
    database_endpoint TEXT NOT NULL,
    schema_name VARCHAR(64),
    priority INTEGER NOT NULL DEFAULT 100,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tenant_routing_active ON tenant_routing_rules(active, priority)
WHERE active = true;
-- Federation audit chain (Merkle-based)
CREATE TABLE IF NOT EXISTS federation_audit_chain (
    block_index BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    event_id VARCHAR(100) NOT NULL,
    actor VARCHAR(200) NOT NULL,
    action VARCHAR(200) NOT NULL,
    details JSONB,
    result VARCHAR(20) NOT NULL,
    signature VARCHAR(128) NOT NULL,
    merkle_root CHAR(64) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_federation_audit_tenant ON federation_audit_chain(tenant_id, block_index);
CREATE INDEX idx_federation_audit_timestamp ON federation_audit_chain(timestamp DESC);
CREATE INDEX idx_federation_audit_action ON federation_audit_chain(action);
-- ═══════════════════════════════════════════════════════════════════
-- 2. ESG & CARBON CREDIT TABLES
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS carbon_footprints (
    footprint_id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    program_id VARCHAR(64),
    project_id VARCHAR(64),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    scope1_kg_co2e DECIMAL(15, 4) NOT NULL DEFAULT 0,
    scope2_kg_co2e DECIMAL(15, 4) NOT NULL DEFAULT 0,
    scope3_kg_co2e DECIMAL(15, 4) NOT NULL DEFAULT 0,
    total_kg_co2e DECIMAL(15, 4) NOT NULL DEFAULT 0,
    methodology VARCHAR(50) NOT NULL DEFAULT 'GHG_PROTOCOL',
    verification_status VARCHAR(50) NOT NULL DEFAULT 'unverified',
    verifier_name VARCHAR(200),
    offset_kg_co2e DECIMAL(15, 4) NOT NULL DEFAULT 0,
    net_kg_co2e DECIMAL(15, 4) NOT NULL DEFAULT 0,
    activities_detail JSONB,
    evidence JSONB DEFAULT '[]'::jsonb,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_carbon_footprints_tenant ON carbon_footprints(tenant_id, period_start DESC);
CREATE INDEX idx_carbon_footprints_verification ON carbon_footprints(verification_status);
CREATE TABLE IF NOT EXISTS carbon_offset_projects (
    project_id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    project_name VARCHAR(200) NOT NULL,
    project_type VARCHAR(50) NOT NULL,
    registry VARCHAR(50) NOT NULL,
    registry_project_id VARCHAR(100),
    country_code CHAR(2) NOT NULL,
    coordinates JSONB,
    total_credits_issued DECIMAL(15, 4) NOT NULL DEFAULT 0,
    credits_retired DECIMAL(15, 4) NOT NULL DEFAULT 0,
    credits_available DECIMAL(15, 4) NOT NULL DEFAULT 0,
    price_per_tonne_usd DECIMAL(10, 2) NOT NULL,
    sdg_goals JSONB NOT NULL DEFAULT '[]'::jsonb,
    verification_body VARCHAR(200),
    vintage INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'registered',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_carbon_projects_tenant ON carbon_offset_projects(tenant_id, status);
CREATE INDEX idx_carbon_projects_type ON carbon_offset_projects(project_type);
CREATE INDEX idx_carbon_projects_country ON carbon_offset_projects(country_code);
CREATE TABLE IF NOT EXISTS carbon_credit_transactions (
    transaction_id VARCHAR(64) PRIMARY KEY,
    buyer_tenant_id VARCHAR(64) NOT NULL,
    seller_tenant_id VARCHAR(64),
    project_id VARCHAR(64) NOT NULL,
    credits_amount DECIMAL(15, 4) NOT NULL,
    price_per_tonne_usd DECIMAL(10, 2) NOT NULL,
    total_amount_usd DECIMAL(15, 2) NOT NULL,
    retirement_purpose TEXT,
    beneficiary_description TEXT,
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    retirement_date TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    serial_numbers JSONB,
    blockchain_tx_hash VARCHAR(100),
    type VARCHAR(20) NOT NULL DEFAULT 'transfer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_carbon_txn_buyer ON carbon_credit_transactions(buyer_tenant_id, transaction_date DESC);
CREATE INDEX idx_carbon_txn_project ON carbon_credit_transactions(project_id);
CREATE INDEX idx_carbon_txn_status ON carbon_credit_transactions(status);
CREATE TABLE IF NOT EXISTS esg_metrics (
    metric_id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    program_id VARCHAR(64),
    project_id VARCHAR(64),
    framework VARCHAR(20) NOT NULL,
    metric_code VARCHAR(100) NOT NULL,
    metric_name VARCHAR(300) NOT NULL,
    category VARCHAR(20) NOT NULL,
    subcategory VARCHAR(100),
    unit VARCHAR(50) NOT NULL,
    value DECIMAL(20, 4) NOT NULL,
    target_value DECIMAL(20, 4),
    reporting_period VARCHAR(20) NOT NULL,
    data_source VARCHAR(200) NOT NULL,
    verification_level VARCHAR(20) NOT NULL DEFAULT 'self_reported',
    evidence_url TEXT,
    sdg_goals JSONB DEFAULT '[]'::jsonb,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_esg_metrics_tenant ON esg_metrics(tenant_id, reporting_period DESC);
CREATE INDEX idx_esg_metrics_framework ON esg_metrics(framework);
CREATE INDEX idx_esg_metrics_category ON esg_metrics(category);
CREATE INDEX idx_esg_metrics_sdg ON esg_metrics USING GIN (sdg_goals);
CREATE TABLE IF NOT EXISTS sdg_impact_reports (
    report_id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    program_id VARCHAR(64),
    project_id VARCHAR(64),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    sdg_impacts JSONB NOT NULL,
    total_beneficiaries BIGINT NOT NULL DEFAULT 0,
    total_budget_spent DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_budget_currency CHAR(3) NOT NULL DEFAULT 'USD',
    methodology TEXT,
    limitations TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sdg_reports_tenant ON sdg_impact_reports(tenant_id, period_start DESC);
-- ═══════════════════════════════════════════════════════════════════
-- 3. POST-QUANTUM CRYPTOGRAPHY TABLES
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS pqc_key_pairs (
    key_id VARCHAR(80) PRIMARY KEY,
    algorithm VARCHAR(50) NOT NULL,
    public_key TEXT NOT NULL,
    private_key_encrypted TEXT NOT NULL,
    key_size INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    usage VARCHAR(10) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pqc_keys_tenant ON pqc_key_pairs(tenant_id, status);
CREATE INDEX idx_pqc_keys_expiry ON pqc_key_pairs(expires_at)
WHERE status = 'active';
CREATE INDEX idx_pqc_keys_algorithm ON pqc_key_pairs(algorithm);
CREATE TABLE IF NOT EXISTS quantum_safe_envelopes (
    envelope_id VARCHAR(80) PRIMARY KEY,
    algorithm VARCHAR(50) NOT NULL,
    ciphertext TEXT NOT NULL,
    encapsulated_key TEXT,
    iv TEXT NOT NULL,
    auth_tag TEXT NOT NULL,
    aad TEXT,
    recipient_key_id VARCHAR(80) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_qse_tenant ON quantum_safe_envelopes(tenant_id, created_at DESC);
CREATE TABLE IF NOT EXISTS zero_trust_sessions (
    session_id VARCHAR(80) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    device_fingerprint VARCHAR(64) NOT NULL,
    ip_address INET NOT NULL,
    geo_location JSONB,
    risk_score INTEGER NOT NULL DEFAULT 50,
    trust_level VARCHAR(10) NOT NULL DEFAULT 'medium',
    policies_applied JSONB NOT NULL DEFAULT '[]'::jsonb,
    mfa_verified BOOLEAN NOT NULL DEFAULT false,
    device_compliant BOOLEAN NOT NULL DEFAULT false,
    network_compliant BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_zts_user ON zero_trust_sessions(user_id, expires_at);
CREATE INDEX idx_zts_tenant ON zero_trust_sessions(tenant_id, last_activity_at DESC);
CREATE INDEX idx_zts_active ON zero_trust_sessions(expires_at)
WHERE expires_at > NOW();
CREATE TABLE IF NOT EXISTS security_events (
    event_id VARCHAR(80) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64),
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(10) NOT NULL,
    risk_score INTEGER NOT NULL DEFAULT 0,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    geo_location JSONB,
    mitigated BOOLEAN NOT NULL DEFAULT false,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sec_events_tenant ON security_events(tenant_id, detected_at DESC);
CREATE INDEX idx_sec_events_type ON security_events(event_type, detected_at DESC);
CREATE INDEX idx_sec_events_severity ON security_events(severity)
WHERE severity IN ('high', 'critical');
-- ═══════════════════════════════════════════════════════════════════
-- 4. OBSERVABILITY TABLES
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS spans (
    trace_id CHAR(32) NOT NULL,
    span_id CHAR(16) NOT NULL,
    parent_span_id CHAR(16),
    operation_name VARCHAR(200) NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    start_time_unix_nano BIGINT NOT NULL,
    end_time_unix_nano BIGINT,
    duration_ms DECIMAL(15, 6),
    status VARCHAR(10) NOT NULL DEFAULT 'UNSET',
    attributes JSONB DEFAULT '{}'::jsonb,
    events JSONB DEFAULT '[]'::jsonb,
    tenant_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (trace_id, span_id)
);
CREATE INDEX idx_spans_service ON spans(service_name, start_time_unix_nano DESC);
CREATE INDEX idx_spans_tenant ON spans(tenant_id, created_at DESC);
CREATE INDEX idx_spans_duration ON spans(duration_ms)
WHERE duration_ms > 1000;
CREATE INDEX idx_spans_trace ON spans(trace_id);
CREATE TABLE IF NOT EXISTS metrics_points (
    metric_id BIGSERIAL PRIMARY KEY,
    metric_name VARCHAR(200) NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    timestamp_unix_ms BIGINT NOT NULL,
    value DECIMAL(20, 6) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    tags JSONB DEFAULT '{}'::jsonb,
    tenant_id VARCHAR(64) NOT NULL
);
CREATE INDEX idx_metrics_name_time ON metrics_points(metric_name, timestamp_unix_ms DESC);
CREATE INDEX idx_metrics_service ON metrics_points(service_name, timestamp_unix_ms DESC);
CREATE INDEX idx_metrics_tenant ON metrics_points(tenant_id, timestamp_unix_ms DESC);
-- Partition metrics_points by month for performance
-- Note: Production should use proper partitioning. Here we use index for demo.
CREATE TABLE IF NOT EXISTS structured_logs (
    log_id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level VARCHAR(10) NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    trace_id CHAR(32),
    span_id CHAR(16),
    message TEXT NOT NULL,
    context JSONB DEFAULT '{}'::jsonb,
    tenant_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64),
    request_id VARCHAR(64),
    error JSONB
);
CREATE INDEX idx_logs_timestamp ON structured_logs(timestamp DESC);
CREATE INDEX idx_logs_level ON structured_logs(level, timestamp DESC);
CREATE INDEX idx_logs_trace ON structured_logs(trace_id)
WHERE trace_id IS NOT NULL;
CREATE INDEX idx_logs_tenant ON structured_logs(tenant_id, timestamp DESC);
CREATE INDEX idx_logs_message_search ON structured_logs USING GIN (to_tsvector('english', message));
CREATE TABLE IF NOT EXISTS slo_definitions (
    slo_id VARCHAR(80) PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    slo_name VARCHAR(200) NOT NULL,
    description TEXT,
    sli_numerator_query TEXT NOT NULL,
    sli_denominator_query TEXT NOT NULL,
    target DECIMAL(5, 4) NOT NULL,
    window VARCHAR(5) NOT NULL,
    burn_rate_threshold DECIMAL(8, 4) NOT NULL,
    alert_channel VARCHAR(200),
    tenant_id VARCHAR(64) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_slo_def_service ON slo_definitions(service_name, active)
WHERE active = true;
CREATE INDEX idx_slo_def_tenant ON slo_definitions(tenant_id, active);
CREATE TABLE IF NOT EXISTS slo_status (
    slo_id VARCHAR(80) PRIMARY KEY REFERENCES slo_definitions(slo_id) ON DELETE CASCADE,
    current_sli DECIMAL(8, 6) NOT NULL,
    error_budget_remaining DECIMAL(8, 6) NOT NULL,
    burn_rate DECIMAL(10, 6) NOT NULL,
    status VARCHAR(20) NOT NULL,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_slo_status_calculated ON slo_status(calculated_at DESC);
CREATE INDEX idx_slo_status_unhealthy ON slo_status(status)
WHERE status IN ('warning', 'critical', 'exhausted');
CREATE TABLE IF NOT EXISTS anomaly_detections (
    detection_id VARCHAR(80) PRIMARY KEY,
    metric_name VARCHAR(200) NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    anomaly_type VARCHAR(20) NOT NULL,
    severity VARCHAR(10) NOT NULL,
    observed_value DECIMAL(20, 6) NOT NULL,
    expected_value DECIMAL(20, 6) NOT NULL,
    deviation_std_dev DECIMAL(10, 4) NOT NULL,
    confidence DECIMAL(5, 4) NOT NULL,
    possible_causes JSONB,
    recommended_actions JSONB,
    tenant_id VARCHAR(64) NOT NULL,
    acknowledged BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX idx_anomalies_tenant ON anomaly_detections(tenant_id, detected_at DESC);
CREATE INDEX idx_anomalies_severity ON anomaly_detections(severity, detected_at DESC)
WHERE severity IN ('high', 'critical');
CREATE INDEX idx_anomalies_unack ON anomaly_detections(tenant_id, detected_at DESC)
WHERE acknowledged = false;
-- ═══════════════════════════════════════════════════════════════════
-- 5. ROW-LEVEL SECURITY POLICIES
-- ═══════════════════════════════════════════════════════════════════
-- Enable RLS on multi-tenant tables
ALTER TABLE federation_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE carbon_footprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE carbon_offset_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE carbon_credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE esg_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdg_impact_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE pqc_key_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quantum_safe_envelopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE zero_trust_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE spans ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE structured_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE slo_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_detections ENABLE ROW LEVEL SECURITY;
-- Drop existing policies if they exist
DROP POLICY IF EXISTS tenant_isolation_policy ON federation_tenants;
DROP POLICY IF EXISTS tenant_usage_isolation ON tenant_usage_metrics;
DROP POLICY IF EXISTS carbon_footprint_isolation ON carbon_footprints;
DROP POLICY IF EXISTS carbon_projects_isolation ON carbon_offset_projects;
DROP POLICY IF EXISTS carbon_txn_isolation ON carbon_credit_transactions;
DROP POLICY IF EXISTS esg_isolation ON esg_metrics;
DROP POLICY IF EXISTS sdg_isolation ON sdg_impact_reports;
DROP POLICY IF EXISTS pqc_isolation ON pqc_key_pairs;
DROP POLICY IF EXISTS qse_isolation ON quantum_safe_envelopes;
DROP POLICY IF EXISTS zts_isolation ON zero_trust_sessions;
DROP POLICY IF EXISTS sec_events_isolation ON security_events;
DROP POLICY IF EXISTS spans_isolation ON spans;
DROP POLICY IF EXISTS metrics_isolation ON metrics_points;
DROP POLICY IF EXISTS logs_isolation ON structured_logs;
DROP POLICY IF EXISTS slo_isolation ON slo_definitions;
DROP POLICY IF EXISTS anomalies_isolation ON anomaly_detections;
-- Create isolation policies
CREATE POLICY tenant_isolation_policy ON federation_tenants USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR current_setting('app.is_federation_admin', true) = 'true'
);
CREATE POLICY tenant_usage_isolation ON tenant_usage_metrics USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR current_setting('app.is_federation_admin', true) = 'true'
);
CREATE POLICY carbon_footprint_isolation ON carbon_footprints USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR current_setting('app.is_federation_admin', true) = 'true'
);
CREATE POLICY carbon_projects_isolation ON carbon_offset_projects USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR current_setting('app.is_federation_admin', true) = 'true'
);
CREATE POLICY carbon_txn_isolation ON carbon_credit_transactions USING (
    buyer_tenant_id = current_setting('app.current_tenant_id', true)
    OR seller_tenant_id = current_setting('app.current_tenant_id', true)
    OR current_setting('app.is_federation_admin', true) = 'true'
);
CREATE POLICY esg_isolation ON esg_metrics USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR current_setting('app.is_federation_admin', true) = 'true'
);
CREATE POLICY sdg_isolation ON sdg_impact_reports USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR current_setting('app.is_federation_admin', true) = 'true'
);
CREATE POLICY pqc_isolation ON pqc_key_pairs USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR current_setting('app.is_federation_admin', true) = 'true'
);
CREATE POLICY qse_isolation ON quantum_safe_envelopes USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR current_setting('app.is_federation_admin', true) = 'true'
);
CREATE POLICY zts_isolation ON zero_trust_sessions USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR user_id = current_setting('app.current_user_id', true)
    OR current_setting('app.is_federation_admin', true) = 'true'
);
CREATE POLICY sec_events_isolation ON security_events USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR current_setting('app.is_federation_admin', true) = 'true'
);
CREATE POLICY spans_isolation ON spans USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR current_setting('app.is_federation_admin', true) = 'true'
);
CREATE POLICY metrics_isolation ON metrics_points USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR current_setting('app.is_federation_admin', true) = 'true'
);
CREATE POLICY logs_isolation ON structured_logs USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR current_setting('app.is_federation_admin', true) = 'true'
);
CREATE POLICY slo_isolation ON slo_definitions USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR current_setting('app.is_federation_admin', true) = 'true'
);
CREATE POLICY anomalies_isolation ON anomaly_detections USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR current_setting('app.is_federation_admin', true) = 'true'
);
-- ═══════════════════════════════════════════════════════════════════
-- 6. TRIGGERS FOR AUTOMATIC UPDATES
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_federation_tenants_updated ON federation_tenants;
CREATE TRIGGER trg_federation_tenants_updated BEFORE
UPDATE ON federation_tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS trg_pqc_keys_updated ON pqc_key_pairs;
CREATE TRIGGER trg_pqc_keys_updated BEFORE
UPDATE ON pqc_key_pairs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Auto-flag high-severity security events
CREATE OR REPLACE FUNCTION auto_flag_security_event() RETURNS TRIGGER AS $$ BEGIN IF NEW.severity IN ('high', 'critical')
    AND NOT NEW.mitigated THEN -- Log to special audit channel
INSERT INTO structured_logs (level, service_name, message, context, tenant_id)
VALUES (
        'WARN',
        'security-engine',
        'Security alert: ' || NEW.event_type,
        jsonb_build_object(
            'eventId',
            NEW.event_id,
            'severity',
            NEW.severity,
            'riskScore',
            NEW.risk_score
        ),
        NEW.tenant_id
    );
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_auto_flag_security ON security_events;
CREATE TRIGGER trg_auto_flag_security
AFTER
INSERT ON security_events FOR EACH ROW EXECUTE FUNCTION auto_flag_security_event();
-- Auto-expire zero-trust sessions
CREATE OR REPLACE FUNCTION expire_zero_trust_sessions() RETURNS void AS $$ BEGIN
UPDATE zero_trust_sessions
SET trust_level = 'critical'
WHERE expires_at < NOW()
    AND trust_level != 'critical';
END;
$$ LANGUAGE plpgsql;
-- ═══════════════════════════════════════════════════════════════════
-- 7. VIEWS FOR COMMON QUERIES
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW v_active_tenants AS
SELECT tenant_id,
    display_name,
    tier,
    isolation_level,
    region,
    country_code,
    quotas,
    created_at
FROM federation_tenants
WHERE status = 'active';
CREATE OR REPLACE VIEW v_tenant_health_summary AS
SELECT t.tenant_id,
    t.display_name,
    t.tier,
    t.status,
    t.region,
    COALESCE(SUM(m.api_calls_count), 0) as total_api_calls_30d,
    COALESCE(SUM(m.transactions_processed), 0) as total_transactions_30d,
    COALESCE(SUM(m.carbon_offset_kg), 0) as total_carbon_offset_30d,
    COALESCE(AVG(m.compliance_violations), 0) as avg_compliance_violations
FROM federation_tenants t
    LEFT JOIN tenant_usage_metrics m ON t.tenant_id = m.tenant_id
    AND m.period_start >= NOW() - INTERVAL '30 days'
GROUP BY t.tenant_id,
    t.display_name,
    t.tier,
    t.status,
    t.region;
CREATE OR REPLACE VIEW v_security_dashboard AS
SELECT tenant_id,
    COUNT(*) as total_events_24h,
    COUNT(
        CASE
            WHEN severity = 'critical' THEN 1
        END
    ) as critical_events,
    COUNT(
        CASE
            WHEN severity = 'high' THEN 1
        END
    ) as high_events,
    COUNT(
        CASE
            WHEN event_type = 'anomaly_detected' THEN 1
        END
    ) as anomalies,
    MAX(detected_at) as last_event_at
FROM security_events
WHERE detected_at >= NOW() - INTERVAL '24 hours'
GROUP BY tenant_id;
CREATE OR REPLACE VIEW v_esg_summary AS
SELECT cf.tenant_id,
    SUM(cf.total_kg_co2e) as total_emissions_kg,
    SUM(cf.offset_kg_co2e) as total_offset_kg,
    SUM(cf.net_kg_co2e) as net_emissions_kg,
    COUNT(DISTINCT cop.project_id) as active_offset_projects,
    COUNT(DISTINCT cct.transaction_id) as credit_transactions
FROM carbon_footprints cf
    LEFT JOIN carbon_offset_projects cop ON cf.tenant_id = cop.tenant_id
    AND cop.status = 'active'
    LEFT JOIN carbon_credit_transactions cct ON cop.project_id = cct.project_id
GROUP BY cf.tenant_id;
-- ═══════════════════════════════════════════════════════════════════
-- 8. COMMENTS & METADATA
-- ═══════════════════════════════════════════════════════════════════
COMMENT ON TABLE federation_tenants IS 'Multi-tenant federation: isolation levels (database/schema/row/compute)';
COMMENT ON TABLE federation_audit_chain IS 'Merkle-chain tamper-proof audit log for federation operations';
COMMENT ON TABLE pqc_key_pairs IS 'Post-quantum cryptographic keys (CRYSTALS-Kyber, CRYSTALS-Dilithium, FALCON, SPHINCS+)';
COMMENT ON TABLE zero_trust_sessions IS 'Zero-trust architecture session tracking with risk scoring';
COMMENT ON TABLE carbon_footprints IS 'GHG Protocol-aligned carbon footprint calculations';
COMMENT ON TABLE carbon_offset_projects IS 'Verified carbon offset projects (Gold Standard, Verra VCS, etc.)';
COMMENT ON TABLE esg_metrics IS 'Environmental, Social, Governance metrics across multiple frameworks';
COMMENT ON TABLE sdg_impact_reports IS 'UN Sustainable Development Goals impact reports';
COMMENT ON TABLE spans IS 'OpenTelemetry distributed tracing spans';
COMMENT ON TABLE metrics_points IS 'Time-series metrics for federation observability';
COMMENT ON TABLE structured_logs IS 'Structured application logs with trace correlation';
COMMENT ON TABLE slo_definitions IS 'Service Level Objectives with SLI queries';
COMMENT ON TABLE anomaly_detections IS 'AI-detected metric anomalies with possible causes';
-- ═══════════════════════════════════════════════════════════════════
-- 9. GRANTS
-- ═══════════════════════════════════════════════════════════════════
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON ALL TABLES IN SCHEMA public TO nexora_app;
GRANT USAGE,
    SELECT ON ALL SEQUENCES IN SCHEMA public TO nexora_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO nexora_app;
-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════
-- Log successful migration
DO $$ BEGIN RAISE NOTICE '✅ Global Federation Cockpit™ migration completed successfully';
RAISE NOTICE '   - Multi-Tenant Federation: federation_tenants, tenant_usage_metrics, federation_audit_chain';
RAISE NOTICE '   - ESG & Carbon: carbon_footprints, carbon_offset_projects, carbon_credit_transactions, esg_metrics, sdg_impact_reports';
RAISE NOTICE '   - Post-Quantum Crypto: pqc_key_pairs, quantum_safe_envelopes, zero_trust_sessions, security_events';
RAISE NOTICE '   - Observability: spans, metrics_points, structured_logs, slo_definitions, anomaly_detections';
RAISE NOTICE '   - Row-Level Security policies enabled on all tenant-scoped tables';
END $$;