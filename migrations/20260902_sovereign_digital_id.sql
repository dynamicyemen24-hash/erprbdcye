-- ═══════════════════════════════════════════════════════════════════
-- UAMEX ERP™ — Sovereign Digital ID™ (NEB-06)
-- Database Migration: W3C DID, Verifiable Credentials, Biometrics, E-Vouchers
-- Standards: W3C DID Core, W3C VC Data Model, OpenID4VC, MOSIP
-- ═══════════════════════════════════════════════════════════════════
-- 1. Beneficiary DIDs (Decentralized Identifiers)
CREATE TABLE IF NOT EXISTS beneficiary_dids (
    did VARCHAR(255) PRIMARY KEY,
    beneficiary_id UUID NOT NULL,
    document JSONB NOT NULL,
    -- W3C DID Document
    public_key_jwk JSONB NOT NULL,
    private_key_jwk_encrypted TEXT NOT NULL,
    -- AES-256-GCM encrypted
    encryption_method VARCHAR(50) DEFAULT 'AES-256-GCM',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    -- active, suspended, revoked
    recovery_method VARCHAR(50),
    -- social, biometric, paper
    last_used_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_beneficiary_dids ON beneficiary_dids (beneficiary_id, status);
CREATE INDEX IF NOT EXISTS idx_beneficiary_dids_status ON beneficiary_dids (status, created_at DESC);
-- 2. Verifiable Credentials (W3C VC)
CREATE TABLE IF NOT EXISTS verifiable_credentials (
    id VARCHAR(255) PRIMARY KEY,
    -- URN UUID
    beneficiary_did VARCHAR(255) NOT NULL,
    credential_type VARCHAR(100) NOT NULL,
    -- BeneficiaryIDCredential, etc.
    claims JSONB NOT NULL,
    issuance_date TIMESTAMPTZ NOT NULL,
    expiration_date TIMESTAMPTZ,
    issuer_did VARCHAR(255) NOT NULL,
    proof JSONB NOT NULL,
    -- Signature proof
    revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID,
    revocation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (beneficiary_did) REFERENCES beneficiary_dids(did) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_vc_beneficiary ON verifiable_credentials (beneficiary_did, credential_type);
CREATE INDEX IF NOT EXISTS idx_vc_active ON verifiable_credentials (beneficiary_did, revoked)
WHERE revoked = false;
CREATE INDEX IF NOT EXISTS idx_vc_expiration ON verifiable_credentials (expiration_date)
WHERE revoked = false
    AND expiration_date IS NOT NULL;
-- 3. VC Verification Logs
CREATE TABLE IF NOT EXISTS vc_verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vc_id VARCHAR(255) NOT NULL,
    verifier_did VARCHAR(255) NOT NULL,
    challenge VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    verified BOOLEAN NOT NULL,
    failure_reason TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vc_verification ON vc_verification_logs (vc_id, verified_at DESC);
-- 4. Beneficiary Biometrics (Multi-Modal)
CREATE TABLE IF NOT EXISTS beneficiary_biometrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiary_id UUID NOT NULL,
    modality VARCHAR(20) NOT NULL,
    -- fingerprint, face, iris, voice
    template_encrypted TEXT NOT NULL,
    -- AES-256-GCM encrypted template
    quality_score DECIMAL(5, 2) NOT NULL,
    -- 0.00 to 100.00
    device_id VARCHAR(255) NOT NULL,
    device_model VARCHAR(255),
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    last_verified_at TIMESTAMPTZ,
    verification_count INTEGER DEFAULT 0,
    encryption_method VARCHAR(50) DEFAULT 'AES-256-GCM',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    -- active, suspended, expired
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_biometrics_beneficiary ON beneficiary_biometrics (beneficiary_id, modality, status);
CREATE INDEX IF NOT EXISTS idx_biometrics_active ON beneficiary_biometrics (status, expires_at)
WHERE status = 'active';
-- 5. E-Vouchers (Cash Transfer)
CREATE TABLE IF NOT EXISTS evouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_code VARCHAR(20) UNIQUE NOT NULL,
    -- XXXX-XXXX-XXXX
    qr_payload TEXT NOT NULL,
    -- Base64-encoded signed JSON
    beneficiary_did VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    -- ACTIVE, REDEEMED, EXPIRED, REVOKED
    redemption_channel VARCHAR(20),
    -- VENDOR, BANK, MOBILE_WALLET
    redeemed_at TIMESTAMPTZ,
    redeemed_by VARCHAR(255),
    redemption_count INTEGER DEFAULT 0,
    purpose TEXT NOT NULL,
    project_id UUID,
    vendor_list JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (beneficiary_did) REFERENCES beneficiary_dids(did)
);
CREATE INDEX IF NOT EXISTS idx_evouchers_beneficiary ON evouchers (beneficiary_did, status);
CREATE INDEX IF NOT EXISTS idx_evouchers_active ON evouchers (status, valid_until)
WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_evouchers_code ON evouchers (voucher_code);
-- 6. Voucher Redemption History
CREATE TABLE IF NOT EXISTS evoucher_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id UUID NOT NULL,
    vendor_did VARCHAR(255) NOT NULL,
    vendor_name VARCHAR(255),
    amount DECIMAL(15, 2) NOT NULL,
    items JSONB DEFAULT '[]',
    -- [{sku, quantity, price}]
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    receipt_url TEXT,
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    FOREIGN KEY (voucher_id) REFERENCES evouchers(id)
);
CREATE INDEX IF NOT EXISTS idx_redemptions_voucher ON evoucher_redemptions (voucher_id, redeemed_at DESC);
CREATE INDEX IF NOT EXISTS idx_redemptions_vendor ON evoucher_redemptions (vendor_did, redeemed_at DESC);
-- 7. Consent Records (GDPR/Yemen DPL)
CREATE TABLE IF NOT EXISTS consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiary_did VARCHAR(255) NOT NULL,
    purpose TEXT NOT NULL,
    data_categories JSONB NOT NULL,
    -- ['personal_id', 'biometric', 'financial', etc.]
    granted_to JSONB NOT NULL,
    -- Organization DIDs
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'GRANTED',
    -- GRANTED, REVOKED, EXPIRED
    signature VARCHAR(128) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (beneficiary_did) REFERENCES beneficiary_dids(did) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_consent_beneficiary ON consent_records (beneficiary_did, status, granted_at DESC);
CREATE INDEX IF NOT EXISTS idx_consent_active ON consent_records (beneficiary_did, status)
WHERE status = 'GRANTED';
-- 8. Cross-Border Data Transfer Logs
CREATE TABLE IF NOT EXISTS cross_border_data_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiary_did VARCHAR(255) NOT NULL,
    source_country VARCHAR(2) NOT NULL,
    destination_country VARCHAR(2) NOT NULL,
    data_categories JSONB NOT NULL,
    legal_basis VARCHAR(100) NOT NULL,
    -- consent, contract, etc.
    purpose TEXT NOT NULL,
    consent_id UUID,
    transferred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    encryption_method VARCHAR(50) DEFAULT 'AES-256-GCM',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cross_border ON cross_border_data_transfers (beneficiary_did, transferred_at DESC);
-- 9. Identity Verification Events
CREATE TABLE IF NOT EXISTS identity_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiary_id UUID,
    beneficiary_did VARCHAR(255),
    verification_type VARCHAR(50) NOT NULL,
    -- 'biometric', 'vc', 'otp', 'password'
    modality VARCHAR(50),
    -- fingerprint, face, iris, etc.
    success BOOLEAN NOT NULL,
    confidence_score DECIMAL(5, 4),
    -- 0.0000 to 1.0000
    device_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    failure_reason TEXT,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_verifications_beneficiary ON identity_verifications (beneficiary_did, verified_at DESC);
CREATE INDEX IF NOT EXISTS idx_verifications_failed ON identity_verifications (beneficiary_did, verified_at DESC)
WHERE success = false;
-- 10. Privacy-Preserving Hash for PII
-- (Hash-based pseudonymization for analytics without exposing PII)
CREATE TABLE IF NOT EXISTS beneficiary_pseudonyms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiary_id UUID NOT NULL,
    pseudonym_hash VARCHAR(128) UNIQUE NOT NULL,
    -- SHA-256 of national_id + salt
    salt VARCHAR(64) NOT NULL,
    -- Random salt for hash
    purpose VARCHAR(50) NOT NULL,
    -- 'analytics', 'reporting', 'research'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pseudonyms ON beneficiary_pseudonyms (pseudonym_hash, purpose);
-- 11. Insert issuer configuration
-- NOTE (release-hardening): public_key_jwk is NULLABLE by design. The issuer
-- signing key is provisioned at deploy time by the operator — migrations must
-- never fabricate cryptographic material to satisfy a NOT NULL constraint.
CREATE TABLE IF NOT EXISTS identity_issuer_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issuer_did VARCHAR(255) UNIQUE NOT NULL,
    issuer_name VARCHAR(255) NOT NULL,
    issuer_name_ar VARCHAR(255),
    public_key_jwk JSONB,
    vc_service_url VARCHAR(500),
    messaging_url VARCHAR(500),
    trust_registry_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO identity_issuer_config (
        issuer_did,
        issuer_name,
        issuer_name_ar,
        vc_service_url,
        messaging_url
    )
VALUES (
        'did:nexora:issuer:uamex-erp',
        'UAMEX ERP Foundation',
        'مؤسسة UAMEX ERP',
        'https://vc.nexora.app',
        'https://msg.nexora.app'
    ) ON CONFLICT (issuer_did) DO NOTHING;
-- 12. Data Subject Rights Requests (GDPR Articles 15-22)
CREATE TABLE IF NOT EXISTS data_subject_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number VARCHAR(50) UNIQUE NOT NULL,
    beneficiary_did VARCHAR(255) NOT NULL,
    request_type VARCHAR(50) NOT NULL,
    -- 'access', 'rectification', 'erasure', 'portability', 'restrict', 'object'
    status VARCHAR(20) DEFAULT 'pending',
    -- pending, in_progress, completed, rejected
    request_details TEXT,
    response_data JSONB,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ NOT NULL,
    -- 30 days by GDPR
    completed_at TIMESTAMPTZ,
    processed_by UUID,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dsr_pending ON data_subject_requests (status, due_date)
WHERE status IN ('pending', 'in_progress');
COMMENT ON TABLE beneficiary_dids IS 'W3C Decentralized Identifiers for beneficiaries (UAMEX NEB-06)';
COMMENT ON TABLE verifiable_credentials IS 'W3C Verifiable Credentials (UAMEX NEB-06)';
COMMENT ON TABLE vc_verification_logs IS 'VC verification audit trail (UAMEX NEB-06)';
COMMENT ON TABLE beneficiary_biometrics IS 'Multi-modal biometric templates (UAMEX NEB-06)';
COMMENT ON TABLE evouchers IS 'E-Vouchers for cash transfers (UAMEX NEB-06)';
COMMENT ON TABLE evoucher_redemptions IS 'E-Voucher redemption history (UAMEX NEB-06)';
COMMENT ON TABLE consent_records IS 'GDPR/Yemen DPL consent records (UAMEX NEB-06)';
COMMENT ON TABLE cross_border_data_transfers IS 'Cross-border data transfer logs (UAMEX NEB-06)';
COMMENT ON TABLE identity_verifications IS 'Identity verification events (UAMEX NEB-06)';
COMMENT ON TABLE beneficiary_pseudonyms IS 'Privacy-preserving pseudonyms for analytics (UAMEX NEB-06)';
COMMENT ON TABLE data_subject_requests IS 'GDPR Data Subject Rights requests (UAMEX NEB-06)';