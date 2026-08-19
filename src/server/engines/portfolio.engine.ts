/**
 * NexoraOS™ — NEB-02 & NEB-03: Portfolio & Program Engine
 * Portfolio oversight, Program lifecycle, objectives tracking, progress aggregation
 */

import { query, queryOne, queryMany, transaction } from '../core/database';
import { PaginationParams, PaginatedResult } from '../core/types';
import { paginatedQuery, requireField, optionalString, auditLog, AuthContext, generateCode } from '../core/helpers';

// ─── Portfolio Engine (NEB-02) ─────────────────────────

export class PortfolioEngine {
  /**
   * Get portfolio overview - aggregated view of all programs and projects
   */
  static async getOverview(orgId: string) {
    const programs = await queryMany(
      `SELECT p.*,
        (SELECT COUNT(*) FROM projects pr WHERE pr.program_id = p.id AND pr.deleted_at IS NULL) as project_count,
        (SELECT COUNT(*) FROM projects pr WHERE pr.program_id = p.id AND pr.status_code = 'ACTIVE') as active_projects,
        (SELECT COUNT(*) FROM projects pr WHERE pr.program_id = p.id AND pr.status_code = 'COMPLETED') as completed_projects,
        (SELECT COALESCE(SUM(pr.budget), 0) FROM projects pr WHERE pr.program_id = p.id) as total_project_budget,
        (SELECT COALESCE(AVG(pr.progress_percent), 0) FROM projects pr WHERE pr.program_id = p.id) as avg_progress
       FROM programs p
       WHERE p.organization_id = $1 AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC`,
      [orgId]
    );

    const summary = {
      totalPrograms: programs.length,
      totalProjects: programs.reduce((s: number, p: any) => s + Number(p.project_count || 0), 0),
      activeProjects: programs.reduce((s: number, p: any) => s + Number(p.active_projects || 0), 0),
      completedProjects: programs.reduce((s: number, p: any) => s + Number(p.completed_projects || 0), 0),
      totalBudget: programs.reduce((s: number, p: any) => s + Number(p.total_project_budget || 0), 0),
      avgProgress: programs.length > 0
        ? Math.round(programs.reduce((s: number, p: any) => s + Number(p.avg_progress || 0), 0) / programs.length)
        : 0,
    };

    return { summary, programs };
  }

  /**
   * Get portfolio health score
   */
  static async getHealthScore(orgId: string) {
    const stats = await queryOne(
      `SELECT
        COUNT(DISTINCT pr.id) as total_projects,
        COUNT(DISTINCT CASE WHEN pr.status_code = 'ACTIVE' THEN pr.id END) as active,
        COUNT(DISTINCT CASE WHEN pr.status_code = 'COMPLETED' THEN pr.id END) as completed,
        COUNT(DISTINCT CASE WHEN pr.status_code = 'ON_HOLD' THEN pr.id END) as on_hold,
        COUNT(DISTINCT CASE WHEN pr.status_code = 'CANCELLED' THEN pr.id END) as cancelled,
        COALESCE(AVG(pr.progress_percent), 0) as avg_progress,
        COALESCE(SUM(pr.budget), 0) as total_budget
       FROM projects pr
       WHERE pr.organization_id = $1 AND pr.deleted_at IS NULL`,
      [orgId]
    );

    const overdueMilestones = await queryOne(
      `SELECT COUNT(*) as count FROM milestones m
       JOIN projects pr ON pr.id = m.project_id
       WHERE pr.organization_id = $1 AND m.status IN ('PENDING','IN_PROGRESS')
       AND m.target_date < CURRENT_DATE`,
      [orgId]
    );

    const total = Number(stats?.total_projects || 0);
    const completed = Number(stats?.completed || 0);
    const cancelled = Number(stats?.cancelled || 0);
    const overdue = Number(overdueMilestones?.count || 0);

    const healthScore = total > 0
      ? Math.round(((completed / total) * 40) + ((1 - cancelled / total) * 30) + ((1 - overdue / Math.max(1, total)) * 30))
      : 0;

    return {
      score: healthScore,
      rating: healthScore >= 80 ? 'EXCELLENT' : healthScore >= 60 ? 'GOOD' : healthScore >= 40 ? 'FAIR' : 'POOR',
      stats: { ...stats, overdueMilestones: overdue },
    };
  }

  /**
   * Get portfolio timeline (all projects Gantt-like data)
   */
  static async getTimeline(orgId: string) {
    return queryMany(
      `SELECT pr.id, pr.project_code, pr.name_ar, pr.status_code,
              pr.start_date, pr.end_date, pr.progress_percent,
              p.name_ar as program_name
       FROM projects pr
       LEFT JOIN programs p ON p.id = pr.program_id
       WHERE pr.organization_id = $1 AND pr.deleted_at IS NULL
       ORDER BY pr.start_date`,
      [orgId]
    );
  }
}

// ─── Program Engine (NEB-03) ───────────────────────────

export class ProgramEngine {
  static async list(orgId: string, pagination: PaginationParams = {}, filters?: {
    search?: string;
    categoryCode?: string;
  }): Promise<PaginatedResult<any>> {
    const conditions = ['p.organization_id = $1', 'p.deleted_at IS NULL'];
    const params: any[] = [orgId]; let idx = 2;
    if (filters?.search) {
      conditions.push(`(p.name_ar ILIKE $${idx} OR p.name_en ILIKE $${idx} OR p.code ILIKE $${idx})`);
      params.push(`%${filters.search}%`); idx++;
    }
    if (filters?.categoryCode) { conditions.push(`p.category_code = $${idx++}`); params.push(filters.categoryCode); }
    const where = conditions.join(' AND ');

    return paginatedQuery(
      `SELECT p.*,
        (SELECT COUNT(*) FROM projects pr WHERE pr.program_id = p.id AND pr.deleted_at IS NULL) as project_count,
        (SELECT COALESCE(SUM(pr.budget), 0) FROM projects pr WHERE pr.program_id = p.id) as total_budget,
        (SELECT COALESCE(AVG(pr.progress_percent), 0) FROM projects pr WHERE pr.program_id = p.id) as avg_progress,
        (SELECT COUNT(*) FROM program_objectives po WHERE po.program_id = p.id) as objectives_count
       FROM programs p WHERE ${where}`,
      `SELECT COUNT(*) FROM programs p WHERE ${where}`,
      params, pagination
    );
  }

  static async getById(programId: string) {
    const program = await queryOne('SELECT * FROM programs WHERE id = $1 AND deleted_at IS NULL', [programId]);
    if (!program) return null;

    const projects = await queryMany(
      `SELECT * FROM projects WHERE program_id = $1 AND deleted_at IS NULL ORDER BY created_at`,
      [programId]
    );
    const objectives = await queryMany(
      `SELECT * FROM program_objectives WHERE program_id = $1 ORDER BY created_at`,
      [programId]
    );

    return { ...program, projects, objectives };
  }

  static async create(data: {
    organizationId: string; code?: string; nameAr: string; nameEn?: string;
    categoryCode?: string; budget?: number;
  }, auth: AuthContext) {
    return await transaction(async (client) => {
      const code = data.code || generateCode('PRG-');
      const result = await client.query(
        `INSERT INTO programs (organization_id, code, name_ar, name_en, category_code, budget)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [data.organizationId, code, requireField(data.nameAr, 'nameAr'), optionalString(data.nameEn),
         optionalString(data.categoryCode), data.budget || 0]
      );
      await auditLog({ organizationId: data.organizationId, userId: auth.userId, action: 'CREATE', tableName: 'programs', recordId: result.rows[0].id });
      return result.rows[0];
    });
  }

  static async update(programId: string, data: Partial<{
    nameAr: string; nameEn: string; categoryCode: string; budget: number; progressPercent: number;
  }>) {
    const sets: string[] = []; const values: any[] = []; let idx = 1;
    if (data.nameAr !== undefined) { sets.push(`name_ar = $${idx++}`); values.push(data.nameAr); }
    if (data.nameEn !== undefined) { sets.push(`name_en = $${idx++}`); values.push(data.nameEn); }
    if (data.categoryCode !== undefined) { sets.push(`category_code = $${idx++}`); values.push(data.categoryCode); }
    if (data.budget !== undefined) { sets.push(`budget = $${idx++}`); values.push(data.budget); }
    if (data.progressPercent !== undefined) { sets.push(`progress_percent = $${idx++}`); values.push(data.progressPercent); }
    values.push(programId);
    if (sets.length === 0) return null;
    return queryOne(`UPDATE programs SET ${sets.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL RETURNING *`, values);
  }

  static async delete(programId: string) {
    await query('UPDATE programs SET deleted_at = NOW() WHERE id = $1', [programId]);
  }

  /**
   * Recalculate program progress from child projects
   */
  static async recalculateProgress(programId: string) {
    const stats = await queryOne(
      `SELECT COALESCE(AVG(progress_percent), 0) as avg_progress
       FROM projects WHERE program_id = $1 AND deleted_at IS NULL`,
      [programId]
    );
    if (stats) {
      await query('UPDATE programs SET progress_percent = $1 WHERE id = $2', [Math.round(Number(stats.avg_progress)), programId]);
    }
  }

  /**
   * Create program objective
   */
  static async createObjective(data: {
    programId: string; objectiveType: string;
    descriptionAr: string; descriptionEn?: string;
    targetValue?: number;
  }) {
    return queryOne(
      `INSERT INTO program_objectives (program_id, objective_type, description_ar, description_en, target_value, current_value)
       VALUES ($1,$2,$3,$4,$5,0) RETURNING *`,
      [data.programId, optionalString(data.objectiveType), requireField(data.descriptionAr, 'descriptionAr'),
       optionalString(data.descriptionEn), data.targetValue || 0]
    );
  }

  static async updateObjective(objectiveId: string, data: Partial<{
    currentValue: number; targetValue: number; descriptionAr: string;
  }>) {
    const sets: string[] = []; const values: any[] = []; let idx = 1;
    if (data.currentValue !== undefined) { sets.push(`current_value = $${idx++}`); values.push(data.currentValue); }
    if (data.targetValue !== undefined) { sets.push(`target_value = $${idx++}`); values.push(data.targetValue); }
    if (data.descriptionAr !== undefined) { sets.push(`description_ar = $${idx++}`); values.push(data.descriptionAr); }
    values.push(objectiveId);
    if (sets.length === 0) return null;
    return queryOne(`UPDATE program_objectives SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, values);
  }
}
