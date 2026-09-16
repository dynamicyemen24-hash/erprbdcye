-- ═══════════════════════════════════════════════════════════════════════════════
-- UAMEX ERP™ - Project Management Office (PMO) Module Migration
-- NEB-04 Project Management OS
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- © 2026 Rohamaa Baynahum Charity Foundation - UAMEX ERP™
-- One Platform. One Organization. One Vision.
--
-- Supports Global Project Management Methodologies:
-- - PMBOK® Guide 7th Edition
-- - PRINCE2® 2017
-- - Agile/Scrum
-- - Waterfall
-- - Hybrid
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- PMO Configuration Tables
-- ─────────────────────────────────────────────────────────────────────────────

-- Project Methodologies Configuration
CREATE TABLE IF NOT EXISTS pmo_methodologies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default methodologies
INSERT INTO pmo_methodologies (code, name, description) VALUES
    ('PMBOK', 'PMBOK Guide 7th Edition', 'Project Management Body of Knowledge by PMI'),
    ('PRINCE2', 'PRINCE2® 2017', 'Projects IN Controlled Environments'),
    ('AGILE_SCRUM', 'Agile Scrum', 'Agile methodology with Scrum framework'),
    ('WATERFALL', 'Waterfall', 'Traditional sequential methodology'),
    ('HYBRID', 'Hybrid', 'Combination of Agile and Waterfall')
ON CONFLICT (code) DO NOTHING;

-- PMBOK Knowledge Areas
CREATE TABLE IF NOT EXISTS pmbok_knowledge_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO pmbok_knowledge_areas (code, name, description) VALUES
    ('INTEGRATION', 'Project Integration Management', 'Coordination of all project elements'),
    ('SCOPE', 'Project Scope Management', 'Ensuring project includes all required work'),
    ('SCHEDULE', 'Project Schedule Management', 'Timely project completion'),
    ('COST', 'Project Cost Management', 'Planning and controlling project budget'),
    ('QUALITY', 'Project Quality Management', 'Quality requirements and standards'),
    ('RESOURCES', 'Project Resource Management', 'Identification and management of resources'),
    ('COMMUNICATIONS', 'Project Communications Management', 'Timely and appropriate information exchange'),
    ('RISK', 'Project Risk Management', 'Identification and response to risks'),
    ('PROCUREMENT', 'Project Procurement Management', 'Acquisition of products and services'),
    ('STAKEHOLDER', 'Project Stakeholder Management', 'Stakeholder engagement')
ON CONFLICT (code) DO NOTHING;

-- PRINCE2 Themes and Processes
CREATE TABLE IF NOT EXISTS prince2_themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO prince2_themes (code, name, description) VALUES
    ('BUSINESS_CASE', 'Business Case', 'Why the project is being undertaken'),
    ('ORGANIZATION', 'Organization', 'Who is involved and their responsibilities'),
    ('QUALITY', 'Quality', 'Quality expectations and acceptance criteria'),
    ('PLANS', 'Plans', 'Levels and content of planning documents'),
    ('RISK', 'Risk', 'Risk management approach'),
    ('CHANGE', 'Change', 'Issue and change control procedures'),
    ('PROGRESS', 'Progress', 'Monitoring and decision-making')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS prince2_processes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO prince2_processes (code, name, description) VALUES
    ('SU', 'Starting Up a Project', 'Pre-project activities'),
    ('IP', 'Initiating a Project', 'Project definition and justification'),
    ('DP', 'Directing a Project', 'Management and oversight'),
    ('MP', 'Managing a Stage Boundary', 'End of stage planning'),
    ('SB', 'Managing Stage Boundaries', 'Stage end activities'),
    ('CP', 'Controlling a Stage', 'Work delegation and monitoring'),
    ('VE', 'Closing a Project', 'Project closure activities')
ON CONFLICT (code) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Project Management Tables
-- ─────────────────────────────────────────────────────────────────────────────

-- Projects Table
CREATE TABLE IF NOT EXISTS pmo_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    methodology VARCHAR(50) REFERENCES pmo_methodologies(code),
    status VARCHAR(50) DEFAULT 'PLANNING',
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    complexity VARCHAR(20) DEFAULT 'MODERATE',
    portfolio_id UUID,
    program_id UUID,
    owner_id UUID,
    sponsor_id UUID,
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    planned_duration_days INTEGER,
    actual_duration_days INTEGER,
    baseline_budget DECIMAL(18,2) DEFAULT 0,
    current_budget DECIMAL(18,2) DEFAULT 0,
    total_budget DECIMAL(18,2) DEFAULT 0,
    cost_at_completion DECIMAL(18,2),
    earned_value DECIMAL(18,2) DEFAULT 0,
    actual_cost DECIMAL(18,2) DEFAULT 0,
    planned_value DECIMAL(18,2) DEFAULT 0,
    progress_percent DECIMAL(5,2) DEFAULT 0,
    health_status VARCHAR(20) DEFAULT 'GREEN',
    tenant_id UUID,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WBS Elements Table
CREATE TABLE IF NOT EXISTS pmo_wbs_elements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES pmo_projects(id) ON DELETE CASCADE,
    wbs_code VARCHAR(100) NOT NULL,
    name VARCHAR(500) NOT NULL,
    level INTEGER DEFAULT 1,
    parent_id UUID REFERENCES pmo_wbs_elements(id),
    element_type VARCHAR(50) NOT NULL,
    responsible_id UUID,
    planned_duration_days INTEGER,
    actual_duration_days INTEGER,
    start_date DATE,
    end_date DATE,
    baseline_cost DECIMAL(18,2) DEFAULT 0,
    actual_cost DECIMAL(18,2) DEFAULT 0,
    earned_value DECIMAL(18,2) DEFAULT 0,
    physical_progress_pct DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'NOT_STARTED',
    tenant_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, wbs_code)
);

-- Schedule Activities Table
CREATE TABLE IF NOT EXISTS pmo_schedule_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES pmo_projects(id) ON DELETE CASCADE,
    wbs_id UUID REFERENCES pmo_wbs_elements(id),
    activity_code VARCHAR(100) NOT NULL,
    name VARCHAR(500) NOT NULL,
    duration_days INTEGER DEFAULT 0,
    earliest_start TIMESTAMPTZ,
    earliest_finish TIMESTAMPTZ,
    latest_start TIMESTAMPTZ,
    latest_finish TIMESTAMPTZ,
    total_float_days DECIMAL(10,2) DEFAULT 0,
    free_float_days DECIMAL(10,2) DEFAULT 0,
    is_critical BOOLEAN DEFAULT false,
    baseline_start DATE,
    baseline_finish DATE,
    actual_start DATE,
    actual_finish DATE,
    percent_complete DECIMAL(5,2) DEFAULT 0,
    scheduled_hours DECIMAL(10,2) DEFAULT 0,
    actual_hours DECIMAL(10,2) DEFAULT 0,
    planned_cost DECIMAL(18,2) DEFAULT 0,
    actual_cost DECIMAL(18,2) DEFAULT 0,
    tenant_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Dependencies Table
CREATE TABLE IF NOT EXISTS pmo_activity_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    predecessor_activity_id UUID NOT NULL REFERENCES pmo_schedule_activities(id) ON DELETE CASCADE,
    successor_activity_id UUID NOT NULL REFERENCES pmo_schedule_activities(id) ON DELETE CASCADE,
    dependency_type VARCHAR(10) DEFAULT 'FS',
    lag_days INTEGER DEFAULT 0,
    tenant_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(predecessor_activity_id, successor_activity_id)
);

-- Milestones Table
CREATE TABLE IF NOT EXISTS pmo_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES pmo_projects(id) ON DELETE CASCADE,
    milestone_code VARCHAR(100) NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    planned_date DATE,
    actual_date DATE,
    status VARCHAR(50) DEFAULT 'PENDING',
    responsible_id UUID,
    tenant_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, milestone_code)
);

-- Resource Allocations Table
CREATE TABLE IF NOT EXISTS pmo_resource_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES pmo_projects(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL,
    resource_name VARCHAR(200) NOT NULL,
    role_code VARCHAR(50),
    task_id UUID,
    allocated_hours DECIMAL(10,2) DEFAULT 0,
    allocated_pct DECIMAL(5,2) DEFAULT 100,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'ASSIGNED',
    tenant_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Earned Value Management Tables
-- ─────────────────────────────────────────────────────────────────────────────

-- EVM Snapshots Table
CREATE TABLE IF NOT EXISTS pmo_evm_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES pmo_projects(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    planned_value DECIMAL(18,2) DEFAULT 0,
    earned_value DECIMAL(18,2) DEFAULT 0,
    actual_cost DECIMAL(18,2) DEFAULT 0,
    budget_at_completion DECIMAL(18,2) DEFAULT 0,
    estimate_at_completion DECIMAL(18,2),
    cost_variance DECIMAL(18,2),
    schedule_variance DECIMAL(18,2),
    cost_performance_index DECIMAL(5,3),
    schedule_performance_index DECIMAL(5,3),
    variance_at_completion DECIMAL(18,2),
    to_complete_cost_performance_index DECIMAL(5,3),
    tenant_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, snapshot_date)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Risk Management Tables (ISO 31000)
-- ─────────────────────────────────────────────────────────────────────────────

-- Risk Register Table
CREATE TABLE IF NOT EXISTS pmo_risks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES pmo_projects(id) ON DELETE CASCADE,
    risk_code VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    probability DECIMAL(3,2) DEFAULT 0.5,
    impact VARCHAR(20) DEFAULT 'MEDIUM',
    risk_score DECIMAL(5,2) DEFAULT 0,
    inherent_risk_level VARCHAR(20),
    response_strategy VARCHAR(50),
    mitigation_plan TEXT,
    contingency_plan TEXT,
    owner_id UUID,
    status VARCHAR(50) DEFAULT 'IDENTIFIED',
    identified_date TIMESTAMPTZ DEFAULT NOW(),
    target_date TIMESTAMPTZ,
    actual_date TIMESTAMPTZ,
    triggers TEXT[],
    fallback_date TIMESTAMPTZ,
    fallback_trigger TEXT,
    closure_notes TEXT,
    closed_date TIMESTAMPTZ,
    last_reviewed TIMESTAMPTZ DEFAULT NOW(),
    tenant_id UUID,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, risk_code)
);

-- Risk Responses Table
CREATE TABLE IF NOT EXISTS pmo_risk_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    risk_id UUID NOT NULL REFERENCES pmo_risks(id) ON DELETE CASCADE,
    strategy VARCHAR(50) NOT NULL,
    description TEXT,
    owner_id UUID,
    due_date TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'PLANNED',
    cost_budget DECIMAL(18,2) DEFAULT 0,
    actual_cost DECIMAL(18,2) DEFAULT 0,
    completion_pct DECIMAL(5,2) DEFAULT 0,
    tenant_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Stakeholder Management Tables
-- ─────────────────────────────────────────────────────────────────────────────

-- Stakeholder Register Table
CREATE TABLE IF NOT EXISTS pmo_stakeholders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES pmo_projects(id) ON DELETE CASCADE,
    stakeholder_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    organization VARCHAR(200),
    role VARCHAR(200),
    power VARCHAR(20) DEFAULT 'MEDIUM',
    interest VARCHAR(20) DEFAULT 'MEDIUM',
    influence VARCHAR(20) DEFAULT 'MEDIUM',
    current_engagement VARCHAR(20) DEFAULT 'NEUTRAL',
    desired_engagement VARCHAR(20) DEFAULT 'SUPPORTIVE',
    engagement_strategy TEXT,
    communication_plan TEXT,
    importance_score INTEGER DEFAULT 5,
    assessment_date TIMESTAMPTZ DEFAULT NOW(),
    last_communication TIMESTAMPTZ,
    notes TEXT,
    tenant_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Issue & Change Management Tables
-- ─────────────────────────────────────────────────────────────────────────────

-- Issues Table
CREATE TABLE IF NOT EXISTS pmo_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES pmo_projects(id) ON DELETE CASCADE,
    issue_number VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    issue_type VARCHAR(20) DEFAULT 'MAJOR',
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    status VARCHAR(50) DEFAULT 'OPEN',
    raised_by UUID NOT NULL,
    assigned_to UUID,
    due_date TIMESTAMPTZ,
    resolved_date TIMESTAMPTZ,
    root_cause TEXT,
    resolution TEXT,
    related_risks UUID[],
    related_changes UUID[],
    tenant_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, issue_number)
);

-- Change Requests Table
CREATE TABLE IF NOT EXISTS pmo_change_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES pmo_projects(id) ON DELETE CASCADE,
    change_number VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    rationale TEXT,
    impact VARCHAR(20) DEFAULT 'LOW',
    scope_impact TEXT,
    schedule_impact_days INTEGER DEFAULT 0,
    cost_impact DECIMAL(18,2) DEFAULT 0,
    risk_impact TEXT,
    status VARCHAR(50) DEFAULT 'SUBMITTED',
    submitted_by UUID NOT NULL,
    submitted_date TIMESTAMPTZ DEFAULT NOW(),
    assessed_by UUID,
    assessed_date TIMESTAMPTZ,
    approved_by UUID,
    approved_date TIMESTAMPTZ,
    rejection_reason TEXT,
    implementation_plan TEXT,
    implemented_by UUID,
    implemented_date TIMESTAMPTZ,
    tenant_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, change_number)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Lessons Learned Table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pmo_lessons_learned (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES pmo_projects(id) ON DELETE CASCADE,
    project_code VARCHAR(50),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'TECHNICAL',
    lesson_type VARCHAR(50) DEFAULT 'BEST_PRACTICE',
    impact VARCHAR(20) DEFAULT 'NEUTRAL',
    root_cause TEXT,
    recommendation TEXT,
    evidence TEXT,
    tags TEXT[],
    applicable_projects UUID[],
    shared_by UUID NOT NULL,
    shared_date TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by UUID,
    review_date TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'DRAFT',
    tenant_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Quality Management Tables
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pmo_quality_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES pmo_projects(id) ON DELETE CASCADE,
    metric_code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    target_value DECIMAL(10,2) DEFAULT 0,
    tolerance DECIMAL(10,2) DEFAULT 0,
    measurement_method VARCHAR(200),
    frequency VARCHAR(50) DEFAULT 'MONTHLY',
    current_value DECIMAL(10,2),
    last_measurement_date TIMESTAMPTZ,
    trend VARCHAR(20) DEFAULT 'STABLE',
    status VARCHAR(20) DEFAULT 'ON_TARGET',
    tenant_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, metric_code)
);

CREATE TABLE IF NOT EXISTS pmo_quality_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES pmo_projects(id) ON DELETE CASCADE,
    audit_number VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    scope TEXT,
    criteria TEXT[],
    auditor VARCHAR(200),
    audited_by UUID,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    findings JSONB DEFAULT '[]',
    overall_result VARCHAR(20) DEFAULT 'PENDING',
    next_audit_date TIMESTAMPTZ,
    tenant_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, audit_number)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Portfolio & Program Tables
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pmo_portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    manager_id UUID,
    objectives TEXT[],
    constraints TEXT[],
    strategic_alignment TEXT[],
    total_budget DECIMAL(18,2) DEFAULT 0,
    total_spent DECIMAL(18,2) DEFAULT 0,
    total_planned_value DECIMAL(18,2) DEFAULT 0,
    total_earned_value DECIMAL(18,2) DEFAULT 0,
    overall_progress DECIMAL(5,2) DEFAULT 0,
    health_score DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'PLANNING',
    tenant_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pmo_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID REFERENCES pmo_portfolios(id) ON DELETE SET NULL,
    program_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    manager_id UUID,
    objectives TEXT[],
    benefits TEXT[],
    total_budget DECIMAL(18,2) DEFAULT 0,
    total_spent DECIMAL(18,2) DEFAULT 0,
    overall_progress DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'CHARTERED',
    tenant_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio-Program-Project Mapping
CREATE TABLE IF NOT EXISTS pmo_portfolio_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID REFERENCES pmo_portfolios(id) ON DELETE CASCADE,
    program_id UUID REFERENCES pmo_programs(id) ON DELETE SET NULL,
    project_id UUID NOT NULL REFERENCES pmo_projects(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 5,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    added_date TIMESTAMPTZ DEFAULT NOW(),
    removed_date TIMESTAMPTZ,
    tenant_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- PMO Views
-- ─────────────────────────────────────────────────────────────────────────────

-- Project Health Dashboard View
CREATE OR REPLACE VIEW v_pmo_project_health AS
SELECT 
    p.id,
    p.project_code,
    p.name,
    p.status,
    p.health_status,
    p.progress_percent,
    p.planned_start_date,
    p.planned_end_date,
    p.actual_start_date,
    p.actual_end_date,
    p.baseline_budget,
    p.current_budget,
    p.total_budget,
    p.earned_value,
    p.actual_cost,
    p.planned_value,
    p.planned_value - p.earned_value AS schedule_variance_value,
    p.earned_value - p.actual_cost AS cost_variance_value,
    CASE 
        WHEN p.planned_value > 0 THEN ROUND((p.earned_value / p.planned_value)::numeric, 3)
        ELSE 1 
    END AS schedule_performance_index,
    CASE 
        WHEN p.actual_cost > 0 THEN ROUND((p.earned_value / p.actual_cost)::numeric, 3)
        ELSE 1 
    END AS cost_performance_index,
    CASE 
        WHEN p.total_budget > 0 THEN ROUND((p.actual_cost / p.total_budget * 100)::numeric, 2)
        ELSE 0 
    END AS budget_utilization_pct,
    CASE 
        WHEN p.planned_end_date IS NOT NULL AND p.actual_end_date IS NULL
        THEN p.planned_end_date - CURRENT_DATE
        ELSE 0
    END AS days_remaining,
    CASE 
        WHEN p.actual_end_date IS NOT NULL AND p.planned_end_date IS NOT NULL
        THEN p.actual_end_date - p.planned_end_date
        ELSE 0
    END AS schedule_variance_days,
    COALESCE(r.risk_count, 0) AS total_risks,
    COALESCE(r.high_risks, 0) AS high_risks,
    COALESCE(i.open_issues, 0) AS open_issues,
    COALESCE(c.pending_changes, 0) AS pending_changes,
    p.tenant_id
FROM pmo_projects p
LEFT JOIN (
    SELECT project_id, COUNT(*) AS risk_count, 
           COUNT(*) FILTER (WHERE risk_score >= 0.7) AS high_risks
    FROM pmo_risks WHERE status != 'CLOSED'
    GROUP BY project_id
) r ON r.project_id = p.id
LEFT JOIN (
    SELECT project_id, COUNT(*) AS open_issues
    FROM pmo_issues WHERE status IN ('OPEN', 'IN_PROGRESS')
    GROUP BY project_id
) i ON i.project_id = p.id
LEFT JOIN (
    SELECT project_id, COUNT(*) AS pending_changes
    FROM pmo_change_requests WHERE status IN ('SUBMITTED', 'ASSESSED')
    GROUP BY project_id
) c ON c.project_id = p.id;

-- Portfolio Overview View
CREATE OR REPLACE VIEW v_pmo_portfolio_overview AS
SELECT 
    pf.id,
    pf.portfolio_code,
    pf.name,
    pf.total_budget,
    pf.total_spent,
    pf.overall_progress,
    pf.health_score,
    pf.status,
    COUNT(DISTINCT pp.project_id) AS project_count,
    COUNT(DISTINCT prog.id) AS program_count,
    ROUND((pf.total_spent / NULLIF(pf.total_budget, 0) * 100)::numeric, 2) AS budget_utilization_pct,
    -- Hours live on pmo_schedule_activities (not on EVM snapshots): aggregate
    -- via correlated subqueries to avoid join fan-out distortion.
    COALESCE((
      SELECT SUM(sa.scheduled_hours)
      FROM pmo_schedule_activities sa
      JOIN pmo_portfolio_projects ppp ON ppp.project_id = sa.project_id
      WHERE ppp.portfolio_id = pf.id
    ), 0) AS total_scheduled_hours,
    COALESCE((
      SELECT SUM(sa.actual_hours)
      FROM pmo_schedule_activities sa
      JOIN pmo_portfolio_projects ppp ON ppp.project_id = sa.project_id
      WHERE ppp.portfolio_id = pf.id
    ), 0) AS total_actual_hours,
    pf.tenant_id
FROM pmo_portfolios pf
LEFT JOIN pmo_portfolio_projects pp ON pp.portfolio_id = pf.id
LEFT JOIN pmo_programs prog ON prog.portfolio_id = pf.id
LEFT JOIN pmo_projects prj ON prj.id = pp.project_id
GROUP BY pf.id, pf.portfolio_code, pf.name, pf.total_budget, pf.total_spent,
         pf.overall_progress, pf.health_score, pf.status, pf.tenant_id;

-- Risk Register Summary View
CREATE OR REPLACE VIEW v_pmo_risk_summary AS
SELECT 
    r.id,
    r.project_id,
    r.risk_code,
    r.title,
    r.category,
    r.probability,
    r.impact,
    r.risk_score,
    r.inherent_risk_level,
    r.response_strategy,
    r.status,
    r.owner_id,
    r.identified_date,
    r.target_date,
    CASE 
        WHEN r.probability >= 0.7 AND r.impact IN ('HIGH', 'VERY_HIGH') THEN 'CRITICAL'
        WHEN r.probability >= 0.5 AND r.impact IN ('HIGH', 'VERY_HIGH', 'MEDIUM') THEN 'HIGH'
        WHEN r.probability >= 0.3 OR r.impact IN ('MEDIUM') THEN 'MEDIUM'
        ELSE 'LOW'
    END AS risk_priority,
    CASE 
        WHEN r.status = 'IDENTIFIED' AND r.mitigation_plan IS NULL THEN 'ACTION_REQUIRED'
        WHEN r.status = 'IDENTIFIED' AND r.mitigation_plan IS NOT NULL THEN 'PLAN_PENDING'
        ELSE r.status
    END AS action_status,
    p.project_code,
    p.name AS project_name,
    r.tenant_id
FROM pmo_risks r
JOIN pmo_projects p ON p.id = r.project_id;

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_pmo_projects_tenant ON pmo_projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pmo_projects_status ON pmo_projects(status);
CREATE INDEX IF NOT EXISTS idx_pmo_projects_portfolio ON pmo_projects(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_pmo_wbs_project ON pmo_wbs_elements(project_id);
CREATE INDEX IF NOT EXISTS idx_pmo_activities_project ON pmo_schedule_activities(project_id);
CREATE INDEX IF NOT EXISTS idx_pmo_activities_critical ON pmo_schedule_activities(is_critical);
CREATE INDEX IF NOT EXISTS idx_pmo_risks_project ON pmo_risks(project_id);
CREATE INDEX IF NOT EXISTS idx_pmo_risks_status ON pmo_risks(status);
CREATE INDEX IF NOT EXISTS idx_pmo_risks_level ON pmo_risks(inherent_risk_level);
CREATE INDEX IF NOT EXISTS idx_pmo_issues_project ON pmo_issues(project_id);
CREATE INDEX IF NOT EXISTS idx_pmo_issues_status ON pmo_issues(status);
CREATE INDEX IF NOT EXISTS idx_pmo_changes_project ON pmo_change_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_pmo_changes_status ON pmo_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_pmo_stakeholders_project ON pmo_stakeholders(project_id);
CREATE INDEX IF NOT EXISTS idx_pmo_evm_project_date ON pmo_evm_snapshots(project_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_pmo_lessons_project ON pmo_lessons_learned(project_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Triggers
-- ─────────────────────────────────────────────────────────────────────────────

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pmo_projects_updated
    BEFORE UPDATE ON pmo_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_pmo_wbs_updated
    BEFORE UPDATE ON pmo_wbs_elements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_pmo_activities_updated
    BEFORE UPDATE ON pmo_schedule_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_pmo_risks_updated
    BEFORE UPDATE ON pmo_risks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_pmo_issues_updated
    BEFORE UPDATE ON pmo_issues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_pmo_changes_updated
    BEFORE UPDATE ON pmo_change_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate risk score on insert/update
CREATE OR REPLACE FUNCTION calculate_risk_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.risk_score = ROUND((NEW.probability * 
        CASE NEW.impact 
            WHEN 'VERY_LOW' THEN 0.2
            WHEN 'LOW' THEN 0.4
            WHEN 'MEDIUM' THEN 0.6
            WHEN 'HIGH' THEN 0.8
            WHEN 'VERY_HIGH' THEN 1.0
            ELSE 0.5
        END)::numeric, 2);
    
    NEW.inherent_risk_level = CASE
        WHEN NEW.risk_score <= 0.2 THEN 'VERY_LOW'
        WHEN NEW.risk_score <= 0.4 THEN 'LOW'
        WHEN NEW.risk_score <= 0.6 THEN 'MEDIUM'
        WHEN NEW.risk_score <= 0.8 THEN 'HIGH'
        ELSE 'VERY_HIGH'
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pmo_risks_score
    BEFORE INSERT OR UPDATE ON pmo_risks
    FOR EACH ROW EXECUTE FUNCTION calculate_risk_score();

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies (Row-Level Security)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE pmo_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE pmo_wbs_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE pmo_schedule_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE pmo_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE pmo_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE pmo_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pmo_stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pmo_evm_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE pmo_lessons_learned ENABLE ROW LEVEL SECURITY;
ALTER TABLE pmo_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE pmo_programs ENABLE ROW LEVEL SECURITY;

-- Policy examples (implement based on tenant_id)
CREATE POLICY pmo_tenant_isolation_projects ON pmo_projects
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY pmo_tenant_isolation_risks ON pmo_risks
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration Complete
-- ═══════════════════════════════════════════════════════════════════════════════
