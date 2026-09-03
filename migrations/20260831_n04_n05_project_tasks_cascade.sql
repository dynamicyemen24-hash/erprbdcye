-- ═══════════════════════════════════════════════════════════════════════════════
-- NEB-04 / NEB-05 Project Tasks, Activity Progress & Cascade Recalculation
-- ═══════════════════════════════════════════════════════════════════════════════
-- This migration introduces the WBS Level 3+ Task hierarchy and adds
-- progress tracking fields to activities & projects, enabling automatic
-- cascading progress recalculation from task → activity → project.
-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. project_tasks — fine-grained WBS tasks
CREATE TABLE IF NOT EXISTS project_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    title_ar TEXT NOT NULL,
    title_en TEXT,
    description TEXT,
    assigned_to UUID REFERENCES users(id) ON DELETE
    SET NULL,
        due_date DATE,
        priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (
            priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
        ),
        weight_pct NUMERIC(5, 2) NOT NULL DEFAULT 10 CHECK (
            weight_pct > 0
            AND weight_pct <= 100
        ),
        status TEXT NOT NULL DEFAULT 'TODO' CHECK (
            status IN (
                'TODO',
                'IN_PROGRESS',
                'BLOCKED',
                'DONE',
                'CANCELLED'
            )
        ),
        progress_pct NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (
            progress_pct >= 0
            AND progress_pct <= 100
        ),
        start_date DATE,
        completed_date DATE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_project_tasks_activity ON project_tasks(activity_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assignee ON project_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON project_tasks(status, priority);
-- 2. Ensure activities.progress_pct exists (in case earlier schema did not have it)
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS progress_pct NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (
        progress_pct >= 0
        AND progress_pct <= 100
    );
-- 3. Ensure projects.spent_amount + project_code indexes exist
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS spent_amount NUMERIC(18, 2) NOT NULL DEFAULT 0 CHECK (spent_amount >= 0);
-- 4. Useful indexes
CREATE INDEX IF NOT EXISTS idx_activities_project ON activities(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status_code);
CREATE INDEX IF NOT EXISTS idx_projects_org_status ON projects(organization_id, status_code)
WHERE deleted_at IS NULL;
-- 5. updated_at trigger
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_touch_project_tasks ON project_tasks;
CREATE TRIGGER trg_touch_project_tasks BEFORE
UPDATE ON project_tasks FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
-- 6. Seed: confirm a few sample tasks for demo (only if activities exist)
DO $$
DECLARE v_activity_id UUID;
v_user_id UUID;
BEGIN -- Pick the first activity
SELECT id INTO v_activity_id
FROM activities
LIMIT 1;
-- Pick the first user
SELECT id INTO v_user_id
FROM users
LIMIT 1;
IF v_activity_id IS NOT NULL THEN
INSERT INTO project_tasks (
        activity_id,
        title_ar,
        title_en,
        priority,
        weight_pct,
        status,
        progress_pct,
        due_date
    )
VALUES (
        v_activity_id,
        'تجهيز قوائم المستفيدين',
        'Prepare Beneficiary Lists',
        'HIGH',
        25,
        'DONE',
        100,
        CURRENT_DATE + 7
    ),
    (
        v_activity_id,
        'التنسيق مع الموردين',
        'Coordinate with Vendors',
        'MEDIUM',
        20,
        'IN_PROGRESS',
        50,
        CURRENT_DATE + 14
    ),
    (
        v_activity_id,
        'تنفيذ التوزيع الميداني',
        'Field Distribution Execution',
        'CRITICAL',
        35,
        'TODO',
        0,
        CURRENT_DATE + 21
    ),
    (
        v_activity_id,
        'التوثيق وإعداد التقارير',
        'Documentation & Reporting',
        'LOW',
        20,
        'TODO',
        0,
        CURRENT_DATE + 28
    ) ON CONFLICT DO NOTHING;
END IF;
END $$;