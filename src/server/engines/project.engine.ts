/**
 * NexoraOS™ — Project Management Engine (NEB-04 & NEB-05)
 * ================================================================================
 * Full project lifecycle: planning, execution, EVM, Gantt, milestones, WBS,
 * risk assessment, AI-powered forecasting, resource optimization, variance analysis
 * ================================================================================
 */

import { query, queryOne, queryMany, transaction } from '../core/database';
import {
  ProjectCreate, MilestoneCreate, ProjectStatus, MilestoneStatus,
  EVMData, PaginationParams, PaginatedResult
} from '../core/types';
import {
  paginatedQuery, requireField, optionalString, optionalNumber,
  generateCode, auditLog, AuthContext
} from '../core/helpers';
import logger from '../core/logger';

// ─── Project CRUD ──────────────────────────────────────

export class ProjectEngine {
  /**
   * List projects with filtering and pagination
   */
  static async list(orgId: string, pagination: PaginationParams = {}, filters?: {
    status?: string;
    programId?: string;
    search?: string;
  }): Promise<PaginatedResult<any>> {
    const conditions = ['p.organization_id = $1', 'p.deleted_at IS NULL'];
    const params: any[] = [orgId];
    let idx = 2;

    if (filters?.status) { conditions.push(`p.status_code = $${idx++}`); params.push(filters.status); }
    if (filters?.programId) { conditions.push(`p.program_id = $${idx++}`); params.push(filters.programId); }
    if (filters?.search) {
      conditions.push(`(p.name_ar ILIKE $${idx} OR p.name_en ILIKE $${idx} OR p.project_code ILIKE $${idx})`);
      params.push(`%${filters.search}%`);
      idx++;
    }

    const where = conditions.join(' AND ');

    return paginatedQuery(
      `SELECT p.*, pr.name_ar as program_name_ar, pr.name_en as program_name_en,
              (SELECT COUNT(*) FROM milestones m WHERE m.project_id = p.id AND m.status_code = 'COMPLETED') as completed_milestones,
              (SELECT COUNT(*) FROM milestones m WHERE m.project_id = p.id) as total_milestones,
              (SELECT COUNT(*) FROM activities a WHERE a.project_id = p.id AND a.deleted_at IS NULL) as activities_count
       FROM projects p
       LEFT JOIN programs pr ON pr.id = p.program_id
       WHERE ${where}`,
      `SELECT COUNT(*) FROM projects p WHERE ${where}`,
      params,
      pagination
    );
  }

  /**
   * Get project by ID with full details
   */
  static async getById(projectId: string) {
    const project = await queryOne(
      `SELECT p.*, pr.name_ar as program_name_ar, pr.name_en as program_name_en
       FROM projects p
       LEFT JOIN programs pr ON pr.id = p.program_id
       WHERE p.id = $1 AND p.deleted_at IS NULL`,
      [projectId]
    );

    if (!project) return null;

    const milestones = await queryMany(
      `SELECT * FROM milestones WHERE project_id = $1 AND deleted_at IS NULL ORDER BY COALESCE(planned_date, actual_date)`,
      [projectId]
    );

    const activities = await queryMany(
      `SELECT * FROM activities WHERE project_id = $1 ORDER BY created_at`,
      [projectId]
    );

    const schedules = await queryMany(
      `SELECT * FROM project_schedules WHERE project_id = $1 ORDER BY start_date`,
      [projectId]
    );

    // Budget summary
    const budgetSummary = await queryOne(
      `SELECT
        COALESCE(SUM(bl.allocated_budget), 0) as total_budget,
        COALESCE(SUM(bl.spent_amount), 0) as total_spent
       FROM budget_lines bl WHERE bl.project_id = $1`,
      [projectId]
    );

    return {
      ...project,
      milestones,
      activities,
      schedules,
      budgetSummary: {
        totalBudget: Number(budgetSummary?.total_budget || 0),
        totalSpent: Number(budgetSummary?.total_spent || 0),
        remaining: Number(budgetSummary?.total_budget || 0) - Number(budgetSummary?.total_spent || 0),
        utilizationPct: Number(budgetSummary?.total_budget || 0) > 0
          ? Math.round((Number(budgetSummary?.total_spent || 0) / Number(budgetSummary?.total_budget || 0)) * 100)
          : 0,
      },
    };
  }

  /**
   * Create a new project
   */
  private static async invalidateCache(orgId: string) {
    try {
      const { CachedQuery } = await import('../core/performance');
      CachedQuery.invalidateTags([`org:${orgId}`, 'projects']);
    } catch { /* safe to ignore in dev */ }
  }

  static async create(data: ProjectCreate, auth: AuthContext) {
    return await transaction(async (client) => {
      // Auto-generate project code if not provided
      const code = data.projectCode || generateCode('PRJ-');

      // Validate program exists if specified
      if (data.programId) {
        const program = await client.query(
          'SELECT id FROM programs WHERE id = $1 AND deleted_at IS NULL',
          [data.programId]
        );
        if (program.rows.length === 0) {
          throw new Error('Parent program not found');
        }
      }

      const result = await client.query(
        `INSERT INTO projects
         (organization_id, program_id, project_code, name_ar, name_en,
          status_code, budget, start_date, end_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          data.organizationId,
          data.programId || null,
          code,
          requireField(data.nameAr, 'nameAr'),
          optionalString(data.nameEn),
          data.statusCode || 'PLANNING',
          data.budget || 0,
          data.startDate || null,
          data.endDate || null,
        ]
      );

      const project = result.rows[0];

      await auditLog({
        organizationId: data.organizationId,
        userId: auth.userId,
        action: 'CREATE',
        tableName: 'projects',
        recordId: project.id,
        details: { projectCode: code, nameAr: data.nameAr },
      });

      return project;
    }).finally(() => this.invalidateCache(data.organizationId));
  }

  /**
   * Update project
   */
  static async update(projectId: string, data: Partial<{
    nameAr: string;
    nameEn: string;
    statusCode: ProjectStatus;
    budget: number;
    progressPercent: number;
    startDate: string;
    endDate: string;
  }>, auth: AuthContext) {
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.nameAr !== undefined) { sets.push(`name_ar = $${idx++}`); values.push(data.nameAr); }
    if (data.nameEn !== undefined) { sets.push(`name_en = $${idx++}`); values.push(data.nameEn); }
    if (data.statusCode !== undefined) { sets.push(`status_code = $${idx++}`); values.push(data.statusCode); }
    if (data.budget !== undefined) { sets.push(`budget = $${idx++}`); values.push(data.budget); }
    if (data.progressPercent !== undefined) { sets.push(`progress_percent = $${idx++}`); values.push(data.progressPercent); }
    if (data.startDate !== undefined) { sets.push(`start_date = $${idx++}`); values.push(data.startDate); }
    if (data.endDate !== undefined) { sets.push(`end_date = $${idx++}`); values.push(data.endDate); }
    sets.push(`updated_at = NOW()`);
    values.push(projectId);

    if (sets.length === 1) return null; // only updated_at

    const result = await queryOne(
      `UPDATE projects SET ${sets.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL RETURNING *`,
      values
    );

    if (result) {
      await auditLog({
        organizationId: result.organization_id,
        userId: auth.userId,
        action: 'UPDATE',
        tableName: 'projects',
        recordId: projectId,
        details: data,
      });
    }

    return result;
  }

  /**
   * Soft delete project
   */
  static async delete(projectId: string, auth: AuthContext) {
    const project = await queryOne('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (!project) throw new Error('Project not found');

    await query('UPDATE projects SET deleted_at = NOW() WHERE id = $1', [projectId]);

    await auditLog({
      organizationId: project.organization_id,
      userId: auth.userId,
      action: 'DELETE',
      tableName: 'projects',
      recordId: projectId,
    });
  }

  /**
   * Earned Value Management (EVM) calculation
   */
  static async calculateEVM(projectId: string): Promise<EVMData | null> {
    const project = await queryOne(
      'SELECT * FROM projects WHERE id = $1 AND deleted_at IS NULL',
      [projectId]
    );
    if (!project) return null;

    const budget = Number(project.budget || 0);
    const progressPct = Number(project.progress_percent || 0) / 100;

    // Prefer the latest VERIFIED metric persisted in earned_value_metrics
    // (live production table) so EVM reflects the authoritative record.
    const latestMetric = await queryOne(
      `SELECT * FROM earned_value_metrics
       WHERE project_id = $1
       ORDER BY measurement_date DESC, created_at DESC
       LIMIT 1`,
      [projectId]
    );

    // Calculate from activities and milestones using the real schema.
    const activityData = await queryOne(
      `SELECT
        COALESCE(SUM(budget), 0) as total_activity_budget,
        COALESCE(SUM(actual_cost), 0) as total_actual_cost,
        COALESCE(SUM(earned_value), 0) as total_earned_value,
        CASE WHEN SUM(budget) > 0
          THEN SUM(COALESCE(actual_cost,0)) / SUM(budget)
          ELSE 0 END as cost_efficiency
       FROM activities WHERE project_id = $1 AND deleted_at IS NULL`,
      [projectId]
    );

    const milestoneData = await queryOne(
      `SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status_code = 'COMPLETED' THEN 1 END) as completed,
        CASE WHEN COUNT(*) > 0
          THEN COUNT(CASE WHEN status_code = 'COMPLETED' THEN 1 END)::float / COUNT(*)::float
          ELSE 0 END as milestone_completion_pct
       FROM milestones WHERE project_id = $1 AND deleted_at IS NULL`,
      [projectId]
    );

    // EVM Calculations — prefer persisted metric values when available
    const pv = Number(latestMetric?.planned_value ?? budget);              // Planned Value
    const ev = Number(latestMetric?.earned_value ?? budget * progressPct); // Earned Value
    const ac = Number(latestMetric?.actual_cost ?? (activityData?.total_actual_cost || 0)); // Actual Cost

    const cpi = Number(latestMetric?.cost_performance_index ?? (ac > 0 ? ev / ac : 1));
    const spi = Number(latestMetric?.schedule_performance_index ?? (pv > 0 ? ev / pv : 1));
    const eac = Number(latestMetric?.estimate_at_completion ?? (cpi > 0 ? budget / cpi : budget));
    const etc = Number(latestMetric?.estimate_to_complete ?? eac - ac);
    const vac = Number(latestMetric?.variance_at_completion ?? budget - eac);
    const tcpi = Number(latestMetric?.to_complete_performance_index ?? 0);

    const rawPctComplete = latestMetric?.percent_complete;
    const pctComplete = rawPctComplete != null && Number.isFinite(Number(rawPctComplete))
      ? Number(rawPctComplete)
      : progressPct;

    return {
      project,
      pv,
      ev,
      ac,
      cpi: Math.round(cpi * 100) / 100,
      spi: Math.round(spi * 100) / 100,
      eac: Math.round(eac * 100) / 100,
      etc: Math.round(etc * 100) / 100,
      vac: Math.round(vac * 100) / 100,
      percentComplete: Math.round(pctComplete * 100),
      tcpi: Math.round(tcpi * 100) / 100,
      source: latestMetric ? 'earned_value_metrics' : 'computed',
      milestones: {
        total: Number(milestoneData?.total || 0),
        completed: Number(milestoneData?.completed || 0),
        completionPct: Math.round(Number(milestoneData?.milestone_completion_pct || 0) * 100),
      },
    };
  }

  /**
   * Get project Gantt data — real schema, real dependency_network
   * Corrects schema mismatches against the live Neon DB (milestones.milestone_name_ar,
   * project_schedules.progress_percent) and returns true task dependencies.
   */
  static async getGanttData(projectId: string) {
    const project = await queryOne(
      'SELECT * FROM projects WHERE id = $1',
      [projectId]
    );

    const tasks = await queryMany(
      `SELECT
        ps.id,
        ps.task_name_ar as name,
        ps.task_name_en as name_en,
        ps.start_date as start,
        ps.end_date as "end",
        COALESCE(ps.progress_percent, 0) as progress,
        ps.wbs_code,
        COALESCE(ps.is_critical, false) as is_critical,
        'schedule' as type,
        ps.status_code
       FROM project_schedules ps
       WHERE ps.project_id = $1 AND ps.deleted_at IS NULL
       UNION ALL
       SELECT
        m.id,
        COALESCE(m.milestone_name_ar, m.milestone_name_en) as name,
        COALESCE(m.milestone_name_en, m.milestone_name_ar) as name_en,
        m.planned_date as start,
        m.planned_date as "end",
        COALESCE(m.progress_percent, CASE WHEN m.status_code = 'COMPLETED' THEN 100 ELSE 0 END) as progress,
        m.wbs_code,
        COALESCE(m.is_key_milestone, false) as is_critical,
        'milestone' as type,
        m.status_code
       FROM milestones m
       WHERE m.project_id = $1 AND m.deleted_at IS NULL
       ORDER BY start`,
      [projectId]
    );

    // Real dependencies from dependency_network (successor_id => [predecessor task ids])
    const dependencies = await queryMany(
      `SELECT predecessor_id, successor_id, dependency_type, lag_days
       FROM dependency_network
       WHERE project_id = $1`,
      [projectId]
    );

    return {
      project,
      tasks,
      dependencies: dependencies.map((d: any) => ({
        from: d.predecessor_id,
        to: d.successor_id,
        type: d.dependency_type || 'FS',
        lag: Number(d.lag_days || 0),
      })),
    };
  }

  /**
   * Dashboard summary for all projects
   */
  static async getDashboard(orgId: string) {
    // Performance: read-through cache (60s) + parallel Promise.all instead of 3 sequential awaits.
    const { CachedQuery } = await import('../core/performance');
    return CachedQuery.fetch(
      `project:dashboard:${orgId}`,
      async () => {
        const [stats, recentProjects, upcomingMilestones] = await Promise.all([
          queryOne(
            `SELECT
              COUNT(*) as total_projects,
              COUNT(CASE WHEN status_code = 'ACTIVE' THEN 1 END) as active_projects,
              COUNT(CASE WHEN status_code = 'COMPLETED' THEN 1 END) as completed_projects,
              COUNT(CASE WHEN status_code = 'PLANNING' THEN 1 END) as planning_projects,
              COUNT(CASE WHEN status_code = 'ON_HOLD' THEN 1 END) as on_hold_projects,
              COALESCE(SUM(budget), 0) as total_budget,
              COALESCE(AVG(progress_percent), 0) as avg_progress
             FROM projects
             WHERE organization_id = $1 AND deleted_at IS NULL`,
            [orgId]
          ),
          queryMany(
            `SELECT id, project_code, name_ar, status_code, progress_percent, budget
             FROM projects
             WHERE organization_id = $1 AND deleted_at IS NULL
             ORDER BY updated_at DESC LIMIT 5`,
            [orgId]
          ),
          queryMany(
            `SELECT m.*, p.name_ar as project_name_ar
             FROM milestones m
             JOIN projects p ON p.id = m.project_id
             WHERE p.organization_id = $1
               AND m.status_code IN ('PENDING', 'IN_PROGRESS')
               AND m.planned_date >= CURRENT_DATE
             ORDER BY m.planned_date
             LIMIT 10`,
            [orgId]
          ),
        ]);
        return { statistics: stats, recentProjects, upcomingMilestones };
      },
      { ttlMs: 60_000, tags: ['projects', `org:${orgId}`] }
    );
  }
}

// ─── Milestone Management ──────────────────────────────

export class MilestoneEngine {
  static async listByProject(projectId: string) {
    return queryMany(
      `SELECT m.*,
        (SELECT COUNT(*) FROM activities a WHERE a.project_id = m.project_id AND a.deleted_at IS NULL) as project_activities
       FROM milestones m
       WHERE m.project_id = $1 AND m.deleted_at IS NULL
       ORDER BY COALESCE(m.planned_date, m.actual_date)`,
      [projectId]
    );
  }

  static async create(data: MilestoneCreate, auth: AuthContext) {
    return await transaction(async (client) => {
      // Verify project exists
      const project = await client.query(
        'SELECT id, organization_id FROM projects WHERE id = $1 AND deleted_at IS NULL',
        [data.projectId]
      );
      if (project.rows.length === 0) throw new Error('Project not found');

      const result = await client.query(
        `INSERT INTO milestones
         (organization_id, project_id, milestone_name_ar, milestone_name_en, planned_date, status_code, milestone_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          project.rows[0].organization_id,
          data.projectId,
          requireField(data.titleAr, 'titleAr'),
          optionalString(data.titleEn),
          data.targetDate || null,
          data.status || 'PENDING',
          generateCode('MS-'),
        ]
      );

      return result.rows[0];
    });
  }

  static async updateStatus(milestoneId: string, status: MilestoneStatus, auth: AuthContext) {
    const completedDate = status === 'COMPLETED' ? 'NOW()' : 'NULL';
    const result = await queryOne(
      `UPDATE milestones
       SET status_code = $1, actual_date = ${completedDate}
       WHERE id = $2 RETURNING *`,
      [status, milestoneId]
    );

    if (result) {
      // Recalculate project progress based on milestones
      await this.recalculateProjectProgress(result.project_id);
    }

    return result;
  }

  static async delete(milestoneId: string) {
    await query('UPDATE milestones SET deleted_at = NOW() WHERE id = $1', [milestoneId]);
  }

  private static async recalculateProjectProgress(projectId: string) {
    const stats = await queryOne(
      `SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status_code = 'COMPLETED' THEN 1 END) as completed
       FROM milestones WHERE project_id = $1 AND deleted_at IS NULL`,
      [projectId]
    );

    if (stats && Number(stats.total) > 0) {
      const progress = Math.round((Number(stats.completed) / Number(stats.total)) * 100);
      await query(
        'UPDATE projects SET progress_percent = $1, updated_at = NOW() WHERE id = $2',
        [progress, projectId]
      );
    }
  }
}

// ─── Schedule Management ───────────────────────────────

export class ScheduleEngine {
  static async listByProject(projectId: string) {
    return queryMany(
      `SELECT * FROM project_schedules WHERE project_id = $1 AND deleted_at IS NULL ORDER BY start_date`,
      [projectId]
    );
  }

  static async create(data: {
    projectId: string;
    taskNameAr: string;
    startDate: string;
    endDate: string;
    progressPct?: number;
  }) {
    return queryOne(
      `INSERT INTO project_schedules
       (project_id, task_name_ar, start_date, end_date, progress_percent, status_code)
       VALUES ($1, $2, $3, $4, $5, 'NOT_STARTED') RETURNING *`,
      [data.projectId, data.taskNameAr, data.startDate, data.endDate, data.progressPct || 0]
    );
  }

  static async updateProgress(scheduleId: string, progressPct: number) {
    return queryOne(
      `UPDATE project_schedules SET progress_percent = $1 WHERE id = $2 RETURNING *`,
      [progressPct, scheduleId]
    );
  }

  static async delete(scheduleId: string) {
    await query('UPDATE project_schedules SET deleted_at = NOW() WHERE id = $1', [scheduleId]);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SMART ANALYTICS & INTELLIGENCE LAYER — Professional Enterprise Capabilities
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ProjectIntelligenceEngine
 * Advanced analytics, risk assessment, forecasting, and portfolio health
 */
export class ProjectIntelligenceEngine {
  /**
   * Get comprehensive project intelligence snapshot for an organization.
   * Includes portfolio health, risk distribution, financial KPIs, and AI insights.
   */
  static async getSnapshot(orgId: string): Promise<{
    portfolio: any;
    riskMatrix: any[];
    performance: any;
    financials: any;
    timeline: any;
    insights: string[];
    alerts: Array<{ severity: string; title_ar: string; message_ar: string }>;
  }> {
    // 1. Portfolio overview
    const portfolio = await queryOne(
      `SELECT
         COUNT(*) as total_projects,
         COUNT(CASE WHEN status_code = 'ACTIVE' THEN 1 END) as active,
         COUNT(CASE WHEN status_code = 'PLANNING' THEN 1 END) as planning,
         COUNT(CASE WHEN status_code = 'COMPLETED' THEN 1 END) as completed,
         COUNT(CASE WHEN status_code = 'ON_HOLD' THEN 1 END) as on_hold,
         COUNT(CASE WHEN status_code = 'CANCELLED' THEN 1 END) as cancelled,
         COALESCE(SUM(budget), 0) as total_budget,
         COALESCE(SUM(spent_amount), 0) as total_spent,
         COALESCE(AVG(progress_percent), 0) as avg_progress
       FROM projects
       WHERE organization_id = $1 AND deleted_at IS NULL`,
      [orgId]
    );

    // 2. Risk matrix — projects by health classification
    const riskMatrix = await queryMany(
      `WITH project_kpis AS (
         SELECT
           p.id, p.name_ar, p.project_code, p.budget, p.spent_amount,
           p.progress_percent, p.start_date, p.end_date, p.status_code,
           CASE
             WHEN p.end_date < CURRENT_DATE AND p.status_code NOT IN ('COMPLETED','CANCELLED') THEN 'CRITICAL'
             WHEN p.spent_amount > p.budget THEN 'CRITICAL'
             WHEN (p.progress_percent::float / 100.0) < 0.4
                  AND p.start_date < CURRENT_DATE - INTERVAL '60 days' THEN 'AT_RISK'
             WHEN (p.progress_percent::float / 100.0) < 0.7
                  AND p.end_date < CURRENT_DATE + INTERVAL '30 days' THEN 'WARNING'
             WHEN (p.progress_percent::float / 100.0) >= 0.8 THEN 'ON_TRACK'
             ELSE 'NORMAL'
           END as health_status
         FROM projects p
         WHERE p.organization_id = $1 AND p.deleted_at IS NULL
       )
       SELECT health_status, COUNT(*) as count, COALESCE(SUM(budget), 0) as total_budget
       FROM project_kpis
       GROUP BY health_status
       ORDER BY CASE health_status
         WHEN 'CRITICAL' THEN 1
         WHEN 'AT_RISK' THEN 2
         WHEN 'WARNING' THEN 3
         WHEN 'ON_TRACK' THEN 4
         ELSE 5 END`,
      [orgId]
    );

    // 3. Performance KPIs (EVM aggregated)
    const performance = await queryMany(
      `SELECT
         id, project_code, name_ar, budget, spent_amount, progress_percent,
         CASE WHEN budget > 0 THEN ROUND((spent_amount / budget * 100)::numeric, 1) ELSE 0 END as budget_utilization,
         CASE WHEN progress_percent > 0 THEN ROUND((spent_amount / NULLIF(progress_percent, 0) * 100)::numeric, 1) ELSE 0 END as cost_per_progress
       FROM projects
       WHERE organization_id = $1 AND deleted_at IS NULL AND status_code = 'ACTIVE'
       ORDER BY progress_percent DESC LIMIT 20`,
      [orgId]
    );

    // 4. Financial health
    const financials = await queryOne(
      `SELECT
         COALESCE(SUM(budget), 0) as total_allocated,
         COALESCE(SUM(spent_amount), 0) as total_spent,
         COALESCE(SUM(budget) - SUM(spent_amount), 0) as total_remaining,
         CASE WHEN SUM(budget) > 0
           THEN ROUND((SUM(spent_amount) / SUM(budget) * 100)::numeric, 1)
           ELSE 0 END as utilization_pct
       FROM projects
       WHERE organization_id = $1 AND deleted_at IS NULL`,
      [orgId]
    );

    // 5. Timeline analytics
    const timeline = await queryMany(
      `SELECT
         TO_CHAR(DATE_TRUNC('month', start_date), 'YYYY-MM') as month,
         COUNT(*) as started,
         COALESCE(SUM(budget), 0) as budget_started
       FROM projects
       WHERE organization_id = $1 AND deleted_at IS NULL
         AND start_date >= CURRENT_DATE - INTERVAL '12 months'
       GROUP BY DATE_TRUNC('month', start_date)
       ORDER BY month DESC`,
      [orgId]
    );

    // 6. Generate AI insights
    const insights: string[] = [];
    const alerts: Array<{ severity: string; title_ar: string; message_ar: string }> = [];

    const totalBudget = Number(portfolio?.total_budget || 0);
    const totalSpent = Number(portfolio?.total_spent || 0);
    const avgProgress = Number(portfolio?.avg_progress || 0);
    const onTrack = riskMatrix.find(r => r.health_status === 'ON_TRACK')?.count || 0;
    const critical = riskMatrix.find(r => r.health_status === 'CRITICAL')?.count || 0;
    const atRisk = riskMatrix.find(r => r.health_status === 'AT_RISK')?.count || 0;
    const total = Number(portfolio?.total_projects || 0);

    if (totalBudget > 0) {
      const utilPct = (totalSpent / totalBudget) * 100;
      if (utilPct > 90) {
        insights.push(`⚠️ نسبة الاستهلاك المالي مرتفعة (${utilPct.toFixed(1)}%) - راجع ميزانيات المشاريع الحرجة`);
      } else if (utilPct < 30) {
        insights.push(`💡 الاستهلاك المالي منخفض (${utilPct.toFixed(1)}%) - يمكن تسريع التنفيذ`);
      }
    }

    if (avgProgress < 40 && Number(portfolio?.active) > 0) {
      insights.push(`📊 متوسط الإنجاز ${avgProgress.toFixed(0)}% - يحتاج متابعة ميدانية مكثفة`);
    }

    if (critical > 0) {
      alerts.push({
        severity: 'CRITICAL',
        title_ar: 'مشاريع في حالة حرجة',
        message_ar: `${critical} مشروع في حالة حرجة (تجاوز ميزانية أو تأخر) - تدخل فوري مطلوب`
      });
    }

    if (atRisk > 0) {
      alerts.push({
        severity: 'HIGH',
        title_ar: 'مشاريع تحت الخطر',
        message_ar: `${atRisk} مشروع يحتاج إعادة تخطيط وميزانية`
      });
    }

    if (onTrack > 0 && total > 0) {
      const healthyPct = (Number(onTrack) / total) * 100;
      if (healthyPct >= 70) {
        insights.push(`✅ ${healthyPct.toFixed(0)}% من المشاريع على المسار الصحيح`);
      }
    }

    return {
      portfolio: {
        total: Number(portfolio?.total_projects || 0),
        active: Number(portfolio?.active || 0),
        planning: Number(portfolio?.planning || 0),
        completed: Number(portfolio?.completed || 0),
        onHold: Number(portfolio?.on_hold || 0),
        cancelled: Number(portfolio?.cancelled || 0),
        avgProgress: Math.round(avgProgress),
        totalBudget: Number(portfolio?.total_budget || 0),
        totalSpent: Number(portfolio?.total_spent || 0),
      },
      riskMatrix: riskMatrix.map(r => ({
        status: r.health_status,
        count: Number(r.count),
        totalBudget: Number(r.total_budget)
      })),
      performance: performance.map(p => ({
        id: p.id,
        projectCode: p.project_code,
        nameAr: p.name_ar,
        budget: Number(p.budget),
        spent: Number(p.spent_amount),
        progress: Number(p.progress_percent),
        budgetUtilization: Number(p.budget_utilization),
        costPerProgress: Number(p.cost_per_progress || 0)
      })),
      financials: {
        totalAllocated: Number(financials?.total_allocated || 0),
        totalSpent: Number(financials?.total_spent || 0),
        totalRemaining: Number(financials?.total_remaining || 0),
        utilizationPct: Number(financials?.utilization_pct || 0)
      },
      timeline,
      insights,
      alerts
    };
  }

  /**
   * AI-powered risk assessment for a single project
   */
  static async assessRisk(projectId: string): Promise<{
    riskScore: number; // 0-100
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    factors: Array<{ name_ar: string; weight: number; status: 'OK' | 'WARNING' | 'CRITICAL' }>;
    recommendations: string[];
  }> {
    const project = await queryOne(
      `SELECT * FROM projects WHERE id = $1 AND deleted_at IS NULL`,
      [projectId]
    );
    if (!project) throw new Error('Project not found');

    const factors: Array<{ name_ar: string; weight: number; status: 'OK' | 'WARNING' | 'CRITICAL' }> = [];
    const recommendations: string[] = [];
    let totalScore = 0;

    // Factor 1: Budget overrun
    const budget = Number(project.budget || 0);
    const spent = Number(project.spent_amount || 0);
    if (budget > 0) {
      const burnRate = (spent / budget) * 100;
      const progress = Number(project.progress_percent || 0);
      const expectedSpend = (progress / 100) * budget;
      const overrunPct = expectedSpend > 0 ? ((spent - expectedSpend) / expectedSpend) * 100 : 0;

      if (burnRate > 100) {
        factors.push({ name_ar: 'تجاوز الميزانية', weight: 25, status: 'CRITICAL' });
        recommendations.push('إعادة هيكلة الميزانية أو طلب تمويل إضافي');
        totalScore += 25;
      } else if (overrunPct > 20) {
        factors.push({ name_ar: 'استهلاك ميزانية سريع', weight: 15, status: 'WARNING' });
        recommendations.push('مراجعة كفاءة الصرف وتبرير الفروقات');
        totalScore += 15;
      } else {
        factors.push({ name_ar: 'الميزانية', weight: 0, status: 'OK' });
      }
    }

    // Factor 2: Schedule slippage
    if (project.end_date) {
      const endDate = new Date(project.end_date);
      const today = new Date();
      const daysToDeadline = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const progress = Number(project.progress_percent || 0);
      const timeProgress = project.start_date
        ? Math.min(100, Math.max(0, ((today.getTime() - new Date(project.start_date).getTime()) /
            (endDate.getTime() - new Date(project.start_date).getTime())) * 100))
        : 0;

      if (daysToDeadline < 0 && progress < 100) {
        factors.push({ name_ar: 'تجاوز الموعد النهائي', weight: 25, status: 'CRITICAL' });
        recommendations.push('تمديد المشروع رسمياً أو الإغلاق المبكر');
        totalScore += 25;
      } else if (progress < timeProgress - 20) {
        factors.push({ name_ar: 'تأخر في الجدول الزمني', weight: 15, status: 'WARNING' });
        recommendations.push('تسريع وتيرة التنفيذ');
        totalScore += 15;
      } else {
        factors.push({ name_ar: 'الجدول الزمني', weight: 0, status: 'OK' });
      }
    }

    // Factor 3: Progress stagnation
    const lastUpdate = project.updated_at ? new Date(project.updated_at) : new Date(project.created_at);
    const daysSinceUpdate = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceUpdate > 30 && project.status_code === 'ACTIVE') {
      factors.push({ name_ar: 'عدم تحديث منذ فترة طويلة', weight: 10, status: 'WARNING' });
      recommendations.push('تحديث حالة المشروع في النظام');
      totalScore += 10;
    }

    // Factor 4: Status appropriateness
    if (project.status_code === 'PLANNING' && project.start_date) {
      const startDate = new Date(project.start_date);
      if (startDate < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
        factors.push({ name_ar: 'تأخر الانتقال للتنفيذ', weight: 10, status: 'WARNING' });
        recommendations.push('تفعيل المشروع والانتقال للتنفيذ');
        totalScore += 10;
      }
    }

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (totalScore >= 50) riskLevel = 'CRITICAL';
    else if (totalScore >= 30) riskLevel = 'HIGH';
    else if (totalScore >= 15) riskLevel = 'MEDIUM';
    else riskLevel = 'LOW';

    return {
      riskScore: Math.min(100, totalScore),
      riskLevel,
      factors,
      recommendations
    };
  }

  /**
   * Forecast project completion based on current burn rate
   */
  static async forecastCompletion(projectId: string): Promise<{
    estimatedCompletionDate: string | null;
    estimatedFinalCost: number;
    confidence: 'LOW' | 'MEDIUM' | 'HIGH';
    onTrack: boolean;
  }> {
    const project = await queryOne(
      `SELECT * FROM projects WHERE id = $1 AND deleted_at IS NULL`,
      [projectId]
    );
    if (!project) throw new Error('Project not found');

    const budget = Number(project.budget || 0);
    const spent = Number(project.spent_amount || 0);
    const progress = Number(project.progress_percent || 0);

    if (progress === 0 || spent === 0) {
      return {
        estimatedCompletionDate: project.end_date,
        estimatedFinalCost: budget,
        confidence: 'LOW',
        onTrack: true
      };
    }

    // Cost Performance Index (CPI)
    const cpi = spent > 0 ? (budget * progress / 100) / spent : 1;
    const estimatedFinalCost = cpi > 0 ? budget / cpi : budget;

    // Time forecast
    let estimatedCompletionDate: string | null = project.end_date;
    let onTrack = true;
    if (project.start_date) {
      const startDate = new Date(project.start_date);
      const today = new Date();
      const daysElapsed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const burnRate = progress / Math.max(1, daysElapsed); // % per day

      if (burnRate > 0) {
        const daysToComplete = (100 - progress) / burnRate;
        const completionDate = new Date(today.getTime() + daysToComplete * 24 * 60 * 60 * 1000);
        estimatedCompletionDate = completionDate.toISOString().split('T')[0];
      }
    }

    // Determine if on track
    if (project.end_date) {
      const plannedEnd = new Date(project.end_date);
      const estimatedEnd = estimatedCompletionDate ? new Date(estimatedCompletionDate) : plannedEnd;
      onTrack = estimatedEnd <= plannedEnd;
    }

    // Confidence based on data availability
    const confidence: 'LOW' | 'MEDIUM' | 'HIGH' =
      daysSinceUpdate(project) > 7 ? 'LOW' : daysSinceUpdate(project) > 3 ? 'MEDIUM' : 'HIGH';

    return {
      estimatedCompletionDate,
      estimatedFinalCost: Math.round(estimatedFinalCost),
      confidence,
      onTrack
    };
  }
}

function daysSinceUpdate(project: any): number {
  const last = project.updated_at ? new Date(project.updated_at) : new Date(project.created_at);
  return Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24));
}
