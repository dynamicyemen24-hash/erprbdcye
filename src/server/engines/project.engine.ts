/**
 * NexoraOS™ — Project Management Engine
 * Full project lifecycle: planning, execution, EVM, Gantt, milestones, resource tracking
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
              (SELECT COUNT(*) FROM milestones m WHERE m.project_id = p.id AND m.status = 'COMPLETED') as completed_milestones,
              (SELECT COUNT(*) FROM milestones m WHERE m.project_id = p.id) as total_milestones,
              (SELECT COUNT(*) FROM activities a WHERE a.project_id = p.id) as activities_count
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
      `SELECT * FROM milestones WHERE project_id = $1 ORDER BY target_date`,
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
    });
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

    // Calculate from activities and milestones
    const activityData = await queryOne(
      `SELECT
        COALESCE(SUM(budget_allocated), 0) as total_activity_budget,
        COALESCE(SUM(spent_amount), 0) as total_actual_cost,
        CASE WHEN SUM(budget_allocated) > 0
          THEN SUM(spent_amount) / SUM(budget_allocated)
          ELSE 0 END as cost_efficiency
       FROM activities WHERE project_id = $1`,
      [projectId]
    );

    const milestoneData = await queryOne(
      `SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
        CASE WHEN COUNT(*) > 0
          THEN COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::float / COUNT(*)::float
          ELSE 0 END as milestone_completion_pct
       FROM milestones WHERE project_id = $1`,
      [projectId]
    );

    // EVM Calculations
    const pv = budget; // Planned Value = total budget
    const ev = budget * progressPct; // Earned Value = budget * % complete
    const ac = Number(activityData?.total_actual_cost || 0); // Actual Cost

    const cpi = ac > 0 ? ev / ac : 0; // Cost Performance Index
    const spi = pv > 0 ? ev / pv : 0; // Schedule Performance Index
    const eac = cpi > 0 ? budget / cpi : budget; // Estimate at Completion
    const etc = eac - ac; // Estimate to Complete
    const vac = budget - eac; // Variance at Completion

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
      percentComplete: Math.round(progressPct * 100),
      milestones: {
        total: Number(milestoneData?.total || 0),
        completed: Number(milestoneData?.completed || 0),
        completionPct: Math.round(Number(milestoneData?.milestone_completion_pct || 0) * 100),
      },
    };
  }

  /**
   * Get project Gantt data
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
        ps.start_date as start,
        ps.end_date as end,
        ps.progress_pct as progress,
        'schedule' as type
       FROM project_schedules ps
       WHERE ps.project_id = $1
       UNION ALL
       SELECT
        m.id,
        m.title_ar as name,
        m.target_date as start,
        m.completed_date as end,
        CASE WHEN m.status = 'COMPLETED' THEN 100 ELSE 0 END as progress,
        'milestone' as type
       FROM milestones m
       WHERE m.project_id = $1
       ORDER BY start`,
      [projectId]
    );

    return {
      project,
      tasks,
      dependencies: [], // Could be extended with task dependencies
    };
  }

  /**
   * Dashboard summary for all projects
   */
  static async getDashboard(orgId: string) {
    const stats = await queryOne(
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
    );

    const recentProjects = await queryMany(
      `SELECT id, project_code, name_ar, status_code, progress_percent, budget
       FROM projects
       WHERE organization_id = $1 AND deleted_at IS NULL
       ORDER BY updated_at DESC LIMIT 5`,
      [orgId]
    );

    const upcomingMilestones = await queryMany(
      `SELECT m.*, p.name_ar as project_name_ar
       FROM milestones m
       JOIN projects p ON p.id = m.project_id
       WHERE p.organization_id = $1
         AND m.status IN ('PENDING', 'IN_PROGRESS')
         AND m.target_date >= CURRENT_DATE
       ORDER BY m.target_date
       LIMIT 10`,
      [orgId]
    );

    return {
      statistics: stats,
      recentProjects,
      upcomingMilestones,
    };
  }
}

// ─── Milestone Management ──────────────────────────────

export class MilestoneEngine {
  static async listByProject(projectId: string) {
    return queryMany(
      `SELECT m.*,
        (SELECT COUNT(*) FROM activities a WHERE a.project_id = m.project_id) as project_activities
       FROM milestones m
       WHERE m.project_id = $1
       ORDER BY m.target_date`,
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
         (organization_id, project_id, title_ar, title_en, target_date, status)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          project.rows[0].organization_id,
          data.projectId,
          requireField(data.titleAr, 'titleAr'),
          optionalString(data.titleEn),
          data.targetDate || null,
          data.status || 'PENDING',
        ]
      );

      return result.rows[0];
    });
  }

  static async updateStatus(milestoneId: string, status: MilestoneStatus, auth: AuthContext) {
    const completedDate = status === 'COMPLETED' ? 'NOW()' : 'NULL';
    const result = await queryOne(
      `UPDATE milestones
       SET status = $1, completed_date = ${completedDate}
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
    await query('DELETE FROM milestones WHERE id = $1', [milestoneId]);
  }

  private static async recalculateProjectProgress(projectId: string) {
    const stats = await queryOne(
      `SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed
       FROM milestones WHERE project_id = $1`,
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
      `SELECT * FROM project_schedules WHERE project_id = $1 ORDER BY start_date`,
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
       (project_id, task_name_ar, start_date, end_date, progress_pct)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.projectId, data.taskNameAr, data.startDate, data.endDate, data.progressPct || 0]
    );
  }

  static async updateProgress(scheduleId: string, progressPct: number) {
    return queryOne(
      `UPDATE project_schedules SET progress_pct = $1 WHERE id = $2 RETURNING *`,
      [progressPct, scheduleId]
    );
  }

  static async delete(scheduleId: string) {
    await query('DELETE FROM project_schedules WHERE id = $1', [scheduleId]);
  }
}
