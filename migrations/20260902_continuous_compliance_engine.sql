-- ═══════════════════════════════════════════════════════════════════
-- UAMEX ERP™ — Continuous Compliance Engine™ (CCE)
-- Database Migration: Compliance Rules, Violations, Assessments, Audit Chain
-- Supports: IPSAS 23/24/41, IFRS 15, ASC 958, Sphere 2024, CHS, OECD-DAC, IATI 2.03, SOX 404, ISO 27001, GDPR
-- ═══════════════════════════════════════════════════════════════════
-- 1. Compliance Rules Registry
CREATE TABLE IF NOT EXISTS compliance_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    framework VARCHAR(50) NOT NULL,
    -- IPSAS_23, IFRS_15, SPHERE_2024, etc.
    code VARCHAR(50) NOT NULL UNIQUE,
    -- IPSAS-23-001
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    -- financial, operational, security, data, reporting
    severity VARCHAR(20) NOT NULL DEFAULT 'medium',
    -- info, low, medium, high, critical
    domain VARCHAR(20) NOT NULL,
    -- NEB-01 to NEB-15
    entity_type VARCHAR(100) NOT NULL,
    -- table name
    policy_expression TEXT NOT NULL,
    -- Policy-as-Code (Rego/JSONata)
    auto_remediation TEXT,
    -- Auto-fix logic
    mandatory BOOLEAN DEFAULT true,
    standard_reference VARCHAR(255) NOT NULL,
    -- e.g., 'IPSAS 23.30'
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Index for framework queries
CREATE INDEX IF NOT EXISTS idx_compliance_rules_framework ON compliance_rules (framework, enabled);
-- 2. Compliance Violations
CREATE TABLE IF NOT EXISTS compliance_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL,
    framework VARCHAR(50) NOT NULL,
    rule_code VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    tenant_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    description TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    resolution TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    -- open, acknowledged, remediated, accepted_risk, false_positive
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (rule_id) REFERENCES compliance_rules(id) ON DELETE CASCADE
);
-- Index for open violations
CREATE INDEX IF NOT EXISTS idx_violations_open ON compliance_violations (
    organization_id,
    status,
    severity,
    detected_at DESC
)
WHERE status = 'open';
-- Index for entity history
CREATE INDEX IF NOT EXISTS idx_violations_entity ON compliance_violations (entity_type, entity_id);
-- Index for framework reporting
CREATE INDEX IF NOT EXISTS idx_violations_framework ON compliance_violations (framework, detected_at DESC);
-- 3. Compliance Assessments
CREATE TABLE IF NOT EXISTS compliance_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    framework VARCHAR(50) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    total_rules INTEGER DEFAULT 0,
    passed INTEGER DEFAULT 0,
    failed INTEGER DEFAULT 0,
    warnings INTEGER DEFAULT 0,
    compliance_score INTEGER DEFAULT 0,
    -- 0-100
    assessed_by UUID NOT NULL,
    assessment_type VARCHAR(20) NOT NULL DEFAULT 'automated',
    -- manual, automated, continuous
    status VARCHAR(20) NOT NULL DEFAULT 'running',
    -- running, completed, failed
    report_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Index for assessment history
CREATE INDEX IF NOT EXISTS idx_assessments_tenant ON compliance_assessments (organization_id, framework, completed_at DESC);
-- 4. Tamper-Proof Audit Logs (Merkle Chain)
CREATE TABLE IF NOT EXISTS audit_logs_tamper_proof (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    before_data JSONB,
    after_data JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    signature VARCHAR(128) NOT NULL,
    -- HMAC-SHA256
    previous_hash VARCHAR(64) NOT NULL,
    -- Chain link
    hash VARCHAR(64) NOT NULL UNIQUE,
    -- Current hash
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs_tamper_proof (
    organization_id,
    entity_type,
    entity_id,
    timestamp DESC
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs_tamper_proof (user_id, timestamp DESC);
-- Index for chain verification
CREATE INDEX IF NOT EXISTS idx_audit_logs_hash ON audit_logs_tamper_proof (hash, previous_hash);
-- 5. Risk Scores History
CREATE TABLE IF NOT EXISTS compliance_risk_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    score INTEGER NOT NULL,
    level VARCHAR(20) NOT NULL,
    -- low, medium, high, critical
    factors JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    scored_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    scored_by VARCHAR(100) DEFAULT 'system'
);
-- Index for risk history
CREATE INDEX IF NOT EXISTS idx_risk_scores_entity ON compliance_risk_scores (entity_type, entity_id, scored_at DESC);
-- Index for high-risk entities
CREATE INDEX IF NOT EXISTS idx_risk_scores_high ON compliance_risk_scores (organization_id, level, scored_at DESC)
WHERE level IN ('high', 'critical');
-- 6. IATI Reporting Cache
CREATE TABLE IF NOT EXISTS compliance_iati_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    project_id UUID NOT NULL,
    iati_identifier VARCHAR(100) NOT NULL,
    reporting_org_ref VARCHAR(100) NOT NULL,
    activity_data JSONB NOT NULL,
    transactions_data JSONB DEFAULT '[]',
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sync_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, iati_identifier)
);
-- 7. Compliance Dashboards (Materialized for performance)
CREATE TABLE IF NOT EXISTS compliance_dashboards (
    organization_id UUID PRIMARY KEY,
    overall_score INTEGER DEFAULT 100,
    critical_violations INTEGER DEFAULT 0,
    high_violations INTEGER DEFAULT 0,
    medium_violations INTEGER DEFAULT 0,
    low_violations INTEGER DEFAULT 0,
    open_violations INTEGER DEFAULT 0,
    resolved_today INTEGER DEFAULT 0,
    ipsas_23_score INTEGER DEFAULT 100,
    ifrs_15_score INTEGER DEFAULT 100,
    sphere_score INTEGER DEFAULT 100,
    chs_score INTEGER DEFAULT 100,
    oecd_dac_score INTEGER DEFAULT 100,
    gdpr_score INTEGER DEFAULT 100,
    sox_404_score INTEGER DEFAULT 100,
    iso_27001_score INTEGER DEFAULT 100,
    last_audit_verification TIMESTAMPTZ,
    audit_chain_valid BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- 8. Auto-remediation Actions Log
CREATE TABLE IF NOT EXISTS compliance_auto_remediations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    violation_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    -- set_default, escalate, block_posting, etc.
    action_target VARCHAR(100) NOT NULL,
    before_state JSONB,
    after_state JSONB,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    executed_by VARCHAR(100) DEFAULT 'auto-remediator',
    success BOOLEAN NOT NULL,
    error_message TEXT,
    FOREIGN KEY (violation_id) REFERENCES compliance_violations(id) ON DELETE CASCADE
);
-- Index for remediation history
CREATE INDEX IF NOT EXISTS idx_auto_remediations_violation ON compliance_auto_remediations (violation_id, executed_at DESC);
-- 9. Insert default IPSAS 23 rules
INSERT INTO compliance_rules (
        id,
        framework,
        code,
        name,
        name_ar,
        description,
        description_ar,
        category,
        severity,
        domain,
        entity_type,
        policy_expression,
        standard_reference
    )
VALUES (
        gen_random_uuid(),
        'IPSAS_23',
        'IPSAS-23-001',
        'Revenue Recognition Period',
        'فترة إثبات الإيرادات',
        'Non-exchange revenue must be recognized when control is obtained and recognition criteria met',
        'يجب إثبات الإيرادات غير التبادلية عند الحصول على السيطرة وتحقق معايير الإثبات',
        'financial',
        'high',
        'NEB-10',
        'transactions',
        'transaction.exchange_type == "NON_EXCHANGE" && transaction.recognition_date != null',
        'IPSAS 23.30'
    ),
    (
        gen_random_uuid(),
        'IPSAS_23',
        'IPSAS-23-002',
        'Restricted Fund Segregation',
        'فصل الأموال المقيدة',
        'Restricted funds must be tracked separately from unrestricted funds',
        'يجب تتبع الأموال المقيدة بشكل منفصل عن الأموال غير المقيدة',
        'financial',
        'critical',
        'NEB-10',
        'transactions',
        'transaction.is_restricted == true && transaction.fund_classification != null',
        'IPSAS 23.45-47'
    ),
    (
        gen_random_uuid(),
        'IFRS_15',
        'IFRS-15-001',
        'Five-Step Revenue Recognition',
        'إثبات الإيرادات بخمسة خطوات',
        'Exchange transactions must follow 5-step model',
        'يجب أن تتبع المعاملات التبادلية نموذج 5 خطوات',
        'financial',
        'high',
        'NEB-10',
        'revenue_records',
        'revenue.performance_obligations.length > 0',
        'IFRS 15.9-10'
    ),
    (
        gen_random_uuid(),
        'SPHERE_2024',
        'SPHERE-001',
        'Minimum WASH Standards',
        'الحد الأدنى لمعايير المياه والصرف الصحي',
        'Water access: 15L/person/day minimum',
        'الوصول للمياه: 15 لتر/شخص/يوم كحد أدنى',
        'operational',
        'critical',
        'NEB-05',
        'projects',
        'project.water_per_person_liters >= 15',
        'Sphere 2024 - Water Supply Standard 1.1'
    ),
    (
        gen_random_uuid(),
        'CHS_9',
        'CHS-C1',
        'Community Participation',
        'مشاركة المجتمع',
        'Communities must be consulted in humanitarian response',
        'يجب استشارة المجتمعات في الاستجابة الإنسانية',
        'operational',
        'high',
        'NEB-06',
        'service_delivery',
        'service.community_consulted == true',
        'CHS Commitment 1'
    ),
    (
        gen_random_uuid(),
        'OECD_DAC',
        'OECD-DAC-CR',
        'Creditor Reporting System Markers',
        'علامات نظام إعداد التقارير للدائنين',
        'All aid activities must include Rio Markers',
        'يجب أن تتضمن جميع الأنشطة الإغاثية علامات ريو',
        'reporting',
        'medium',
        'NEB-03',
        'projects',
        'project.rio_markers != null',
        'OECD-DAC CRS Directives'
    ),
    (
        gen_random_uuid(),
        'SOX_404',
        'SOX-404-01',
        'Segregation of Duties',
        'فصل الواجبات',
        'Authorization, recording, and custody of assets must be separated',
        'يجب فصل التفويض والتسجيل وحفظ الأصول',
        'financial',
        'critical',
        'NEB-10',
        'transactions',
        'transaction.created_by != transaction.approved_by',
        'SOX Section 404'
    ),
    (
        gen_random_uuid(),
        'ISO_27001',
        'ISO-27001-A9',
        'Access Control Policy',
        'سياسة التحكم في الوصول',
        'Access to information systems must follow least privilege principle',
        'يجب أن يتبع الوصول إلى أنظمة المعلومات مبدأ الحد الأدنى من الامتيازات',
        'security',
        'high',
        'NEB-12',
        'users',
        'user.role_count <= user.required_roles',
        'ISO 27001:2022 - A.9.1.1'
    ),
    (
        gen_random_uuid(),
        'GDPR',
        'GDPR-Art-6',
        'Lawful Basis for Processing',
        'الأساس القانوني للمعالجة',
        'Personal data processing must have a lawful basis',
        'يجب أن يكون لمعالجة البيانات الشخصية أساس قانوني',
        'data',
        'critical',
        'NEB-06',
        'beneficiaries',
        'beneficiary.consent_obtained == true',
        'GDPR Article 6'
    ),
    (
        gen_random_uuid(),
        'YEMEN_DPL',
        'YEMEN-DPL-001',
        'Cross-Border Data Transfer',
        'نقل البيانات عبر الحدود',
        'Personal data transfer outside Yemen requires explicit consent',
        'يتطلب نقل البيانات الشخصية خارج اليمن موافقة صريحة',
        'data',
        'high',
        'NEB-06',
        'beneficiaries',
        'beneficiary.country != "YE" && beneficiary.cross_border_consent == true',
        'Yemen Data Protection Law 2024 - Article 22'
    ) ON CONFLICT (code) DO NOTHING;
-- 10. Compliance chain validation function
CREATE OR REPLACE FUNCTION validate_compliance_chain(org_id UUID) RETURNS TABLE (
        chain_valid BOOLEAN,
        entries_checked BIGINT,
        broken_at UUID,
        error_msg TEXT
    ) AS $$
DECLARE prev_hash VARCHAR(64) := '';
entry_record RECORD;
count BIGINT := 0;
expected_hash VARCHAR(64);
BEGIN FOR entry_record IN
SELECT *
FROM audit_logs_tamper_proof
WHERE organization_id = org_id
ORDER BY timestamp ASC LOOP count := count + 1;
IF entry_record.previous_hash != prev_hash THEN RETURN QUERY
SELECT false,
    count,
    entry_record.id,
    'Broken chain link'::TEXT;
RETURN;
END IF;
prev_hash := entry_record.hash;
END LOOP;
RETURN QUERY
SELECT true,
    count,
    NULL::UUID,
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql;
COMMENT ON TABLE compliance_rules IS 'Policy-as-Code rule registry (UAMEX CCE)';
COMMENT ON TABLE compliance_violations IS 'Real-time compliance violations (UAMEX CCE)';
COMMENT ON TABLE compliance_assessments IS 'Periodic compliance assessments (UAMEX CCE)';
COMMENT ON TABLE audit_logs_tamper_proof IS 'Tamper-proof audit chain with Merkle hash linking (UAMEX CCE)';
COMMENT ON TABLE compliance_risk_scores IS 'Entity-level risk scores (UAMEX CCE)';
COMMENT ON TABLE compliance_iati_reports IS 'IATI reporting cache (UAMEX CCE)';
COMMENT ON TABLE compliance_dashboards IS 'Aggregated compliance metrics (UAMEX CCE)';
COMMENT ON TABLE compliance_auto_remediations IS 'Auto-remediation action log (UAMEX CCE)';