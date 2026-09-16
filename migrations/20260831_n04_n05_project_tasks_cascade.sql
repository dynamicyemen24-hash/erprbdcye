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
-- Drift-tolerant reconciliation: older environments may carry a project_tasks
-- table without the WBS columns. Add them (nullable + defaults so existing
-- rows survive; fresh installs get the full definition from CREATE TABLE).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='project_tasks' AND column_name='activity_id') THEN
    ALTER TABLE project_tasks ADD COLUMN activity_id UUID REFERENCES activities(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='project_tasks' AND column_name='priority') THEN
    ALTER TABLE project_tasks ADD COLUMN priority TEXT DEFAULT 'MEDIUM';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='project_tasks' AND column_name='weight_pct') THEN
    ALTER TABLE project_tasks ADD COLUMN weight_pct NUMERIC(5, 2) DEFAULT 10;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='project_tasks' AND column_name='status') THEN
    ALTER TABLE project_tasks ADD COLUMN status TEXT DEFAULT 'TODO';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='project_tasks' AND column_name='progress_pct') THEN
    ALTER TABLE project_tasks ADD COLUMN progress_pct NUMERIC(5, 2) DEFAULT 0;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='project_tasks' AND column_name='activity_id')
     AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_project_tasks_activity') THEN
    CREATE INDEX idx_project_tasks_activity ON project_tasks(activity_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='project_tasks' AND column_name='assigned_to')
     AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_project_tasks_assignee') THEN
    CREATE INDEX idx_project_tasks_assignee ON project_tasks(assigned_to);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='project_tasks' AND column_name='status')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='project_tasks' AND column_name='priority')
     AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_project_tasks_status') THEN
    CREATE INDEX idx_project_tasks_status ON project_tasks(status, priority);
  END IF;
END
$$;
-- 2. Ensure activities.progress_pct exists (in case earlier schema did not have it)
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS progress_pct NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (
        progress_pct >= 0
        AND progress_pct <= 100
    );
-- 3. Ensure projects.spent_amount + project_code indexes exist
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS spent_amount NUMERIC(18, 2) NOT NULL DEFAULT 0 CHECK (spent_amount >= 0);
-- 4. Useful indexes (column-guarded: legacy tables may lack these columns)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='activities' AND column_name='project_id')
     AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_activities_project') THEN
    CREATE INDEX idx_activities_project ON activities(project_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='activities' AND column_name='status_code')
     AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_activities_status') THEN
    CREATE INDEX idx_activities_status ON activities(status_code);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='organization_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='status_code')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='deleted_at')
     AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_projects_org_status') THEN
    CREATE INDEX idx_projects_org_status ON projects(organization_id, status_code) WHERE deleted_at IS NULL;
  END IF;
END
$$;
-- 5. updated_at trigger
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_touch_project_tasks ON project_tasks;
CREATE TRIGGER trg_touch_project_tasks BEFORE
UPDATE ON project_tasks FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
-- 6. Seed: a few sample tasks (only if activities exist, none seeded yet).
-- Drift-safe: legacy project_tasks variants may carry an extra NOT NULL
-- project_id column, and legacy activities may lack project_id.
DO $$
DECLARE v_activity_id UUID;
v_user_id UUID;
v_project_id UUID;
v_has_project_id BOOLEAN;
BEGIN
SELECT id INTO v_activity_id
FROM activities
LIMIT 1;
SELECT id INTO v_user_id
FROM users
LIMIT 1;
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema='public' AND table_name='project_tasks' AND column_name='project_id'
) INTO v_has_project_id;
IF EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema='public' AND table_name='activities' AND column_name='project_id'
) THEN
  SELECT project_id INTO v_project_id FROM activities WHERE id = v_activity_id;
END IF;
IF v_activity_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM project_tasks WHERE activity_id = v_activity_id) THEN
  IF v_has_project_id THEN
    INSERT INTO project_tasks (
        activity_id, project_id, title_ar, title_en, priority, weight_pct, status, progress_pct, due_date
    )
    VALUES
    (v_activity_id, v_project_id, 'تجهيز قوائم المستفيدين', 'Prepare Beneficiary Lists', 'HIGH', 25, 'DONE', 100, CURRENT_DATE + 7),
    (v_activity_id, v_project_id, 'التنسيق مع الموردين', 'Coordinate with Vendors', 'MEDIUM', 20, 'IN_PROGRESS', 50, CURRENT_DATE + 14),
    (v_activity_id, v_project_id, 'تنفيذ التوزيع الميداني', 'Field Distribution Execution', 'CRITICAL', 35, 'TODO', 0, CURRENT_DATE + 21),
    (v_activity_id, v_project_id, 'التوثيق وإعداد التقارير', 'Documentation & Reporting', 'LOW', 20, 'TODO', 0, CURRENT_DATE + 28)
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO project_tasks (
        activity_id, title_ar, title_en, priority, weight_pct, status, progress_pct, due_date
    )
    VALUES
    (v_activity_id, 'تجهيز قوائم المستفيدين', 'Prepare Beneficiary Lists', 'HIGH', 25, 'DONE', 100, CURRENT_DATE + 7),
    (v_activity_id, 'التنسيق مع الموردين', 'Coordinate with Vendors', 'MEDIUM', 20, 'IN_PROGRESS', 50, CURRENT_DATE + 14),
    (v_activity_id, 'تنفيذ التوزيع الميداني', 'Field Distribution Execution', 'CRITICAL', 35, 'TODO', 0, CURRENT_DATE + 21),
    (v_activity_id, 'التوثيق وإعداد التقارير', 'Documentation & Reporting', 'LOW', 20, 'TODO', 0, CURRENT_DATE + 28)
    ON CONFLICT DO NOTHING;
  END IF;
END IF;
END $$;