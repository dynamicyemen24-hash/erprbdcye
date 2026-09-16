-- ═══════════════════════════════════════════════════════════════════
-- UAMEX ERP™ — Sovereign AI Core™ (NEB-13)
-- Database Migration: AI Usage, RAG Documents, Digital Twin Simulations
-- Supports: Multi-Model Router, RAG with pgvector, Digital Twin
-- ═══════════════════════════════════════════════════════════════════
-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;
-- 1. AI Usage Metrics
CREATE TABLE IF NOT EXISTS ai_usage_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    user_id UUID NOT NULL,
    model VARCHAR(50) NOT NULL,
    -- gemini-3-pro, claude-4.5-sonnet, etc.
    task_type VARCHAR(50) NOT NULL,
    -- chat, analysis, embedding, etc.
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    cost DECIMAL(10, 6) DEFAULT 0,
    latency_ms INTEGER DEFAULT 0,
    cached BOOLEAN DEFAULT false,
    routing_strategy VARCHAR(50),
    rag_enabled BOOLEAN DEFAULT false,
    rag_sources_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Indexes for usage analytics
CREATE INDEX IF NOT EXISTS idx_ai_usage_tenant ON ai_usage_metrics (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_model ON ai_usage_metrics (model, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_cost ON ai_usage_metrics (organization_id, cost, created_at DESC);
-- 2. RAG Documents with Vector Embeddings
CREATE TABLE IF NOT EXISTS rag_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection VARCHAR(100) NOT NULL,
    -- 'policies', 'financial', 'humanitarian', etc.
    title TEXT,
    content TEXT NOT NULL,
    source VARCHAR(500),
    -- URL, file path, etc.
    source_type VARCHAR(50),
    -- 'pdf', 'html', 'manual', etc.
    language VARCHAR(10) DEFAULT 'ar',
    embedding vector(768),
    -- Gemini text-embedding-004 dimension
    metadata JSONB DEFAULT '{}',
    tenant_id UUID,
    -- null for global documents
    organization_id UUID,
    -- null for global
    indexed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    -- TTL for time-sensitive docs
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Vector similarity search index (HNSW for performance)
CREATE INDEX IF NOT EXISTS idx_rag_embedding_hnsw ON rag_documents USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
-- Index for collection filtering
CREATE INDEX IF NOT EXISTS idx_rag_collection ON rag_documents (collection, language);
CREATE INDEX IF NOT EXISTS idx_rag_tenant ON rag_documents (tenant_id, organization_id, collection);
-- 3. RAG Collections Registry
CREATE TABLE IF NOT EXISTS rag_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description TEXT,
    embedding_model VARCHAR(50) DEFAULT 'gemini',
    chunk_size INTEGER DEFAULT 512,
    chunk_overlap INTEGER DEFAULT 50,
    document_count INTEGER DEFAULT 0,
    last_indexed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Insert default collections
INSERT INTO rag_collections (code, name, name_ar, description)
VALUES (
        'policies',
        'Organizational Policies',
        'السياسات المؤسسية',
        'Internal policies and procedures'
    ),
    (
        'financial',
        'Financial Knowledge',
        'المعرفة المالية',
        'IPSAS, IFRS, accounting standards'
    ),
    (
        'humanitarian',
        'Humanitarian Standards',
        'المعايير الإنسانية',
        'Sphere, CHS, humanitarian principles'
    ),
    (
        'procedures',
        'Operational Procedures',
        'الإجراءات التشغيلية',
        'SOPs and operational guidelines'
    ),
    (
        'donors',
        'Donor Guidelines',
        'إرشادات المانحين',
        'Donor requirements and reporting'
    ),
    (
        'legal',
        'Legal Documents',
        'الوثائق القانونية',
        'Contracts, agreements, regulations'
    ) ON CONFLICT (code) DO NOTHING;
-- 4. Digital Twin Simulations
CREATE TABLE IF NOT EXISTS digital_twin_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_name VARCHAR(255) NOT NULL,
    sector VARCHAR(50) NOT NULL,
    -- FOOD, WASH, HEALTH, etc.
    target_population INTEGER NOT NULL,
    budget DECIMAL(15, 2) NOT NULL,
    outcomes JSONB NOT NULL,
    risk_assessment JSONB NOT NULL,
    impact_projection JSONB NOT NULL,
    budget_analysis JSONB NOT NULL,
    monte_carlo_runs INTEGER DEFAULT 1000,
    confidence_score INTEGER DEFAULT 0,
    -- 0-100
    recommendations JSONB DEFAULT '[]',
    ran_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_ms INTEGER DEFAULT 0,
    created_by UUID,
    organization_id UUID
);
-- Index for simulation history
CREATE INDEX IF NOT EXISTS idx_simulations_organization ON digital_twin_simulations (organization_id, ran_at DESC);
CREATE INDEX IF NOT EXISTS idx_simulations_sector ON digital_twin_simulations (sector, ran_at DESC);
-- 5. AI Insights Cache
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_type VARCHAR(50) NOT NULL,
    -- 'anomaly', 'forecast', 'recommendation', 'alert'
    domain VARCHAR(20) NOT NULL,
    -- NEB-01 to NEB-15
    title VARCHAR(500) NOT NULL,
    title_ar VARCHAR(500),
    description TEXT NOT NULL,
    description_ar TEXT,
    severity VARCHAR(20) DEFAULT 'info',
    -- info, low, medium, high, critical
    confidence DECIMAL(5, 2) DEFAULT 0,
    -- 0.00 to 1.00
    action_items JSONB DEFAULT '[]',
    evidence JSONB DEFAULT '{}',
    related_entities JSONB DEFAULT '{}',
    tenant_id UUID,
    organization_id UUID,
    expires_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Drift-tolerant reconciliation for pre-existing ai_insights tables.
-- Older environments carry a narrower prototype shape; add every canonical
-- column this release needs (nullable + defaults — never destructive).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_insights' AND column_name='domain') THEN
    ALTER TABLE ai_insights ADD COLUMN domain VARCHAR(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_insights' AND column_name='title') THEN
    ALTER TABLE ai_insights ADD COLUMN title VARCHAR(500);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_insights' AND column_name='title_ar') THEN
    ALTER TABLE ai_insights ADD COLUMN title_ar VARCHAR(500);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_insights' AND column_name='description') THEN
    ALTER TABLE ai_insights ADD COLUMN description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_insights' AND column_name='description_ar') THEN
    ALTER TABLE ai_insights ADD COLUMN description_ar TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_insights' AND column_name='severity') THEN
    ALTER TABLE ai_insights ADD COLUMN severity VARCHAR(20) DEFAULT 'info';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_insights' AND column_name='confidence') THEN
    ALTER TABLE ai_insights ADD COLUMN confidence DECIMAL(5, 2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_insights' AND column_name='action_items') THEN
    ALTER TABLE ai_insights ADD COLUMN action_items JSONB DEFAULT '[]';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_insights' AND column_name='evidence') THEN
    ALTER TABLE ai_insights ADD COLUMN evidence JSONB DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_insights' AND column_name='related_entities') THEN
    ALTER TABLE ai_insights ADD COLUMN related_entities JSONB DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_insights' AND column_name='tenant_id') THEN
    ALTER TABLE ai_insights ADD COLUMN tenant_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_insights' AND column_name='acknowledged_at') THEN
    ALTER TABLE ai_insights ADD COLUMN acknowledged_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_insights' AND column_name='acknowledged_by') THEN
    ALTER TABLE ai_insights ADD COLUMN acknowledged_by UUID;
  END IF;
END
$$;
-- Index for active insights
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_insights' AND column_name='acknowledged_at')
     AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_insights_active') THEN
    CREATE INDEX idx_insights_active ON ai_insights (organization_id, severity, created_at DESC) WHERE acknowledged_at IS NULL;
  END IF;
END
$$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_insights' AND column_name='domain')
     AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_insights_domain') THEN
    CREATE INDEX idx_insights_domain ON ai_insights (domain, organization_id, created_at DESC);
  END IF;
END
$$;
-- 6. AI Conversation History (for AI Copilot)
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    user_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL,
    -- user, assistant, system
    content TEXT NOT NULL,
    model VARCHAR(50),
    tokens_used INTEGER DEFAULT 0,
    context_used JSONB DEFAULT '{}',
    feedback_score INTEGER,
    -- 1-5 rating
    feedback_text TEXT,
    parent_message_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Index for conversation retrieval
CREATE INDEX IF NOT EXISTS idx_conversations_thread ON ai_conversations (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON ai_conversations (user_id, organization_id, created_at DESC);
-- 7. Predictive Models Registry
CREATE TABLE IF NOT EXISTS ai_predictive_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description TEXT,
    model_type VARCHAR(50) NOT NULL,
    -- 'revenue_forecast', 'donor_retention', 'risk_score', etc.
    version VARCHAR(20) DEFAULT '1.0.0',
    accuracy DECIMAL(5, 4),
    -- 0.0000 to 1.0000
    last_trained_at TIMESTAMPTZ,
    training_data_size INTEGER,
    features JSONB DEFAULT '[]',
    hyperparameters JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active',
    -- training, active, deprecated
    organization_id UUID,
    -- null for global models
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Insert default models
INSERT INTO ai_predictive_models (
        model_code,
        name,
        name_ar,
        description,
        model_type,
        accuracy
    )
VALUES (
        'revenue-forecast-v1',
        'Revenue Forecast Model',
        'نموذج توقع الإيرادات',
        'Predicts monthly revenue based on historical patterns',
        'time_series',
        0.8700
    ),
    (
        'donor-retention-v1',
        'Donor Retention Model',
        'نموذج الاحتفاظ بالمانحين',
        'Predicts donor churn probability',
        'classification',
        0.8400
    ),
    (
        'project-success-v1',
        'Project Success Predictor',
        'متنبئ نجاح المشاريع',
        'Predicts project completion probability',
        'classification',
        0.7900
    ),
    (
        'beneficiary-vulnerability-v1',
        'Vulnerability Score',
        'مؤشر الضعف',
        'Scores beneficiary vulnerability level',
        'regression',
        0.8200
    ),
    (
        'budget-overrun-v1',
        'Budget Overrun Predictor',
        'متنبئ تجاوز الميزانية',
        'Predicts budget overrun probability',
        'classification',
        0.7600
    ) ON CONFLICT (model_code) DO NOTHING;
-- 8. AI Rate Limiting
CREATE TABLE IF NOT EXISTS ai_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    user_id UUID,
    limit_type VARCHAR(50) NOT NULL,
    -- 'per_minute', 'per_day', 'per_month'
    max_requests INTEGER NOT NULL,
    max_tokens INTEGER,
    max_cost DECIMAL(10, 2),
    current_count INTEGER DEFAULT 0,
    current_tokens INTEGER DEFAULT 0,
    current_cost DECIMAL(10, 2) DEFAULT 0,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- 9. Cost Analytics View
CREATE OR REPLACE VIEW ai_cost_analytics AS
SELECT organization_id,
    DATE_TRUNC('day', created_at) as day,
    model,
    COUNT(*) as request_count,
    SUM(total_tokens) as total_tokens,
    SUM(cost) as total_cost,
    AVG(latency_ms) as avg_latency_ms
FROM ai_usage_metrics
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY organization_id,
    DATE_TRUNC('day', created_at),
    model;
-- 10. Function to find similar documents
CREATE OR REPLACE FUNCTION find_similar_documents(
        query_embedding vector(768),
        target_collection VARCHAR,
        similarity_threshold FLOAT DEFAULT 0.7,
        max_results INT DEFAULT 5
    ) RETURNS TABLE (
        doc_id UUID,
        doc_title TEXT,
        doc_content TEXT,
        doc_source VARCHAR,
        similarity FLOAT
    ) AS $$ BEGIN RETURN QUERY
SELECT d.id,
    d.title,
    d.content,
    d.source,
    (1 - (d.embedding <=> query_embedding))::FLOAT as similarity
FROM rag_documents d
WHERE d.collection = target_collection
    AND (1 - (d.embedding <=> query_embedding)) > similarity_threshold
ORDER BY d.embedding <=> query_embedding
LIMIT max_results;
END;
$$ LANGUAGE plpgsql;
COMMENT ON TABLE ai_usage_metrics IS 'AI request usage and cost tracking (UAMEX NEB-13)';
COMMENT ON TABLE rag_documents IS 'RAG documents with vector embeddings using pgvector (UAMEX NEB-13)';
COMMENT ON TABLE rag_collections IS 'RAG document collections registry (UAMEX NEB-13)';
COMMENT ON TABLE digital_twin_simulations IS 'Digital twin field operation simulations (UAMEX NEB-13)';
COMMENT ON TABLE ai_insights IS 'AI-generated insights and recommendations (UAMEX NEB-13)';
COMMENT ON TABLE ai_conversations IS 'AI Copilot conversation history (UAMEX NEB-13)';
COMMENT ON TABLE ai_predictive_models IS 'Predictive AI models registry (UAMEX NEB-13)';
COMMENT ON TABLE ai_rate_limits IS 'AI rate limiting per organization/user (UAMEX NEB-13)';