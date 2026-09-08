-- ═══════════════════════════════════════════════════════════════════════════════
-- NexoraOS™ — Token Blacklist & Security Events Migration
-- ═══════════════════════════════════════════════════════════════════════════════
-- Adds tables for JWT token revocation, security event tracking,
-- and session management to support advanced security features.

-- Token Blacklist — Stores revoked JWT tokens
CREATE TABLE IF NOT EXISTS token_blacklist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token_fingerprint VARCHAR(64) NOT NULL UNIQUE,
    user_id UUID NOT NULL,
    reason VARCHAR(50) NOT NULL DEFAULT 'logout',
    revoked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for token blacklist
CREATE INDEX IF NOT EXISTS idx_token_blacklist_fingerprint ON token_blacklist(token_fingerprint);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_user_id ON token_blacklist(user_id);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires_at ON token_blacklist(expires_at);

-- Auto-cleanup expired tokens (run daily)
-- This is a one-time cleanup; the application handles ongoing cleanup
DELETE FROM token_blacklist WHERE expires_at < NOW() - INTERVAL '7 days';

-- Security Events — Centralized security event logging
CREATE TABLE IF NOT EXISTS security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'INFO',
    source VARCHAR(50) NOT NULL DEFAULT 'system',
    ip_address VARCHAR(45),
    user_id UUID,
    user_agent TEXT,
    path VARCHAR(500),
    details JSONB DEFAULT '{}',
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by UUID,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for security events
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_acknowledged ON security_events(acknowledged) WHERE acknowledged = FALSE;

-- Partition security events by month for performance (optional, for high-volume systems)
-- Uncomment if using PostgreSQL 12+ with partitioning
-- CREATE TABLE IF NOT EXISTS security_events_2026_09 PARTITION OF security_events
--     FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

-- Sessions — Active session tracking
CREATE TABLE IF NOT EXISTS active_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL UNIQUE,
    user_id UUID NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    fingerprint VARCHAR(64),
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Indexes for sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON active_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON active_sessions(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON active_sessions(expires_at);

-- Cleanup expired sessions
DELETE FROM active_sessions WHERE expires_at < NOW() OR is_active = FALSE;

-- Audit Log Enhancements — Add HMAC signature column if not exists
DO $$ BEGIN
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS hmac_signature VARCHAR(128);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add tamper-proof chain columns to audit_logs if not exists
DO $$ BEGIN
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS previous_hash VARCHAR(64);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entry_hash VARCHAR(64);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Performance indexes for audit log chain verification
CREATE INDEX IF NOT EXISTS idx_audit_logs_hash ON audit_logs(entry_hash) WHERE entry_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_previous_hash ON audit_logs(previous_hash) WHERE previous_hash IS NOT NULL;

-- Log the migration
INSERT INTO audit_logs (id, action, table_name, record_id, user_id, details, created_at)
VALUES (
    gen_random_uuid(),
    'SYSTEM_MIGRATION',
    'schema',
    'token_blacklist_security_events',
    NULL,
    '{"migration": "20260907_token_blacklist_and_security_events.sql", "description": "Added token blacklist, security events, and session tracking tables"}',
    NOW()
);
