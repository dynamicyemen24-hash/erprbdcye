/**
 * NexoraOS™ — NEB-01: Strategy & Performance Engine
 * Strategic Plans, Goals, KPIs, SWOT, Balanced Scorecard, Strategic Alignment
 */

import { query, queryOne, queryMany, transaction } from '../core/database';
import { PaginationParams, PaginatedResult } from '../core/types';
import { paginatedQuery, requireField, optionalString, auditLog, AuthContext, generateCode } from '../core/helpers';

// ─── Strategic Plans ───────────────────────────────────

export class StrategicPlanEngine {
  static async list(orgId: string, pagination: PaginationParams = {}, filters?: {
    status?: string;
    year?: number;
  }): Promise<PaginatedResult<any>> {
    const conditions = ['sp.organization_id = $1'];
    const params: any[] = [orgId];
    let idx = 2;

    if (filters?.status) { conditions.push(`sp.status = $${idx++}`); params.push(filters.status); }
    if (filters?.year) { conditions.push(`sp.start_year <= $${idx} AND sp.end_year >= $${idx}`); params.push(filters.year); idx++; }

    const where = conditions.join(' AND ');

    return paginatedQuery(
      `SELECT sp.*,
        (SELECT COUNT(*) FROM strategic_goals sg WHERE sg.plan_id = sp.id) as total_goals,
        (SELECT COUNT(*) FROM strategic_goals sg WHERE sg.plan_id = sp.id AND sg.status = 'ON_TRACK') as on_track,
        (SELECT COUNT(*) FROM strategic_goals sg WHERE sg.plan_id = sp.id AND sg.status = 'AT_RISK') as at_risk,
        (SELECT COUNT(*) FROM strategic_goals sg WHERE sg.plan_id = sp.id AND sg.status = 'BEHIND') as behind
       FROM strategic_plans sp
       WHERE ${where}`,
      `SELECT COUNT(*) FROM strategic_plans sp WHERE ${where}`,
      params, pagination
    );
  }

  static async getById(planId: string) {
    const plan = await queryOne('SELECT * FROM strategic_plans WHERE id = $1', [planId]);
    if (!plan) return null;

    const goals = await queryMany(
      `SELECT sg.*,
        (SELECT COUNT(*) FROM kpi_indicators ki WHERE ki.plan_id = sg.plan_id) as kpis_count
       FROM strategic_goals sg WHERE sg.plan_id = $1 ORDER BY sg.goal_code`,
      [planId]
    );

    const kpis = await queryMany(
      `SELECT * FROM kpi_indicators WHERE plan_id = $1 ORDER BY kpi_code`,
      [planId]
    );

    return { ...plan, goals, kpis };
  }

  static async create(data: {
    organizationId: string;
    titleAr: string;
    titleEn?: string;
    startYear: number;
    endYear: number;
    visionAr?: string;
    visionEn?: string;
    missionAr?: string;
    missionEn?: string;
    coreValues?: string[];
    strategicPillars?: string[];
    targetBeneficiariesCount?: number;
    totalEstimatedBudgetYer?: number;
  }, auth: AuthContext) {
    return await transaction(async (client) => {
      const code = generateCode('SP-');
      const result = await client.query(
        `INSERT INTO strategic_plans
         (organization_id, plan_code, title_ar, title_en, start_year, end_year,
          vision_ar, vision_en, mission_ar, mission_en, core_values, strategic_pillars,
          target_beneficiaries_count, total_estimated_budget_yer, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'DRAFT')
         RETURNING *`,
        [
          data.organizationId, code,
          requireField(data.titleAr, 'titleAr'), optionalString(data.titleEn),
          data.startYear, data.endYear,
          optionalString(data.visionAr), optionalString(data.visionEn),
          optionalString(data.missionAr), optionalString(data.missionEn),
          JSON.stringify(data.coreValues || []), JSON.stringify(data.strategicPillars || []),
          data.targetBeneficiariesCount || 0, data.totalEstimatedBudgetYer || 0,
        ]
      );
      await auditLog({ organizationId: data.organizationId, userId: auth.userId, action: 'CREATE', tableName: 'strategic_plans', recordId: result.rows[0].id });
      return result.rows[0];
    });
  }

  static async update(planId: string, data: Partial<{
    titleAr: string; titleEn: string; status: string;
    visionAr: string; visionEn: string; missionAr: string; missionEn: string;
    coreValues: string[]; strategicPillars: string[];
    overallProgressPct: number;
  }>) {
    const sets: string[] = []; const values: any[] = []; let idx = 1;
    if (data.titleAr !== undefined) { sets.push(`title_ar = $${idx++}`); values.push(data.titleAr); }
    if (data.titleEn !== undefined) { sets.push(`title_en = $${idx++}`); values.push(data.titleEn); }
    if (data.status !== undefined) { sets.push(`status = $${idx++}`); values.push(data.status); }
    if (data.visionAr !== undefined) { sets.push(`vision_ar = $${idx++}`); values.push(data.visionAr); }
    if (data.visionEn !== undefined) { sets.push(`vision_en = $${idx++}`); values.push(data.visionEn); }
    if (data.missionAr !== undefined) { sets.push(`mission_ar = $${idx++}`); values.push(data.missionAr); }
    if (data.missionEn !== undefined) { sets.push(`mission_en = $${idx++}`); values.push(data.missionEn); }
    if (data.coreValues !== undefined) { sets.push(`core_values = $${idx++}`); values.push(JSON.stringify(data.coreValues)); }
    if (data.strategicPillars !== undefined) { sets.push(`strategic_pillars = $${idx++}`); values.push(JSON.stringify(data.strategicPillars)); }
    if (data.overallProgressPct !== undefined) { sets.push(`overall_progress_pct = $${idx++}`); values.push(data.overallProgressPct); }
    sets.push(`updated_at = NOW()`); values.push(planId);
    if (sets.length === 1) return null;
    return queryOne(`UPDATE strategic_plans SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, values);
  }

  static async delete(planId: string) {
    await query('DELETE FROM strategic_goals WHERE plan_id = $1', [planId]);
    await query('DELETE FROM strategic_plans WHERE id = $1', [planId]);
  }
}

// ─── Strategic Goals ───────────────────────────────────

export class StrategicGoalEngine {
  static async listByPlan(planId: string) {
    return queryMany(
      `SELECT sg.*,
        (SELECT COUNT(*) FROM kpi_indicators ki WHERE ki.goal_id = sg.id) as kpi_count,
        CASE WHEN sg.target_value > 0 THEN ROUND((sg.current_value::float / sg.target_value::float * 100)::numeric, 1) ELSE 0 END as achievement_pct
       FROM strategic_goals sg WHERE sg.plan_id = $1 ORDER BY sg.goal_code`,
      [planId]
    );
  }

  static async create(data: {
    planId: string; goalCode: string; pillarCode?: string;
    titleAr: string; titleEn?: string; descriptionAr?: string;
    targetValue?: number; weightPct?: number;
  }, auth: AuthContext) {
    return await transaction(async (client) => {
      const plan = await client.query('SELECT organization_id FROM strategic_plans WHERE id = $1', [data.planId]);
      if (plan.rows.length === 0) throw new Error('Strategic plan not found');

      const result = await client.query(
        `INSERT INTO strategic_goals
         (plan_id, goal_code, pillar_code, title_ar, title_en, description_ar, target_value, weight_pct, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'ON_TRACK') RETURNING *`,
        [data.planId, requireField(data.goalCode, 'goalCode'), optionalString(data.pillarCode),
         requireField(data.titleAr, 'titleAr'), optionalString(data.titleEn),
         optionalString(data.descriptionAr), data.targetValue || 0, data.weightPct || 0]
      );
      return result.rows[0];
    });
  }

  static async update(goalId: string, data: Partial<{
    titleAr: string; titleEn: string; descriptionAr: string;
    targetValue: number; currentValue: number; weightPct: number; status: string;
  }>) {
    const sets: string[] = []; const values: any[] = []; let idx = 1;
    if (data.titleAr !== undefined) { sets.push(`title_ar = $${idx++}`); values.push(data.titleAr); }
    if (data.titleEn !== undefined) { sets.push(`title_en = $${idx++}`); values.push(data.titleEn); }
    if (data.descriptionAr !== undefined) { sets.push(`description_ar = $${idx++}`); values.push(data.descriptionAr); }
    if (data.targetValue !== undefined) { sets.push(`target_value = $${idx++}`); values.push(data.targetValue); }
    if (data.currentValue !== undefined) { sets.push(`current_value = $${idx++}`); values.push(data.currentValue); }
    if (data.weightPct !== undefined) { sets.push(`weight_pct = $${idx++}`); values.push(data.weightPct); }
    if (data.status !== undefined) { sets.push(`status = $${idx++}`); values.push(data.status); }
    values.push(goalId);
    if (sets.length === 0) return null;
    return queryOne(`UPDATE strategic_goals SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, values);
  }

  static async delete(goalId: string) {
    await query('DELETE FROM kpi_indicators WHERE goal_id = $1', [goalId]);
    await query('DELETE FROM strategic_goals WHERE id = $1', [goalId]);
  }

  static async recalculateProgress(planId: string) {
    const stats = await queryOne(
      `SELECT
        COALESCE(SUM(sg.current_value * sg.weight_pct / 100), 0) as weighted_progress,
        COALESCE(SUM(sg.weight_pct), 0) as total_weight
       FROM strategic_goals sg WHERE sg.plan_id = $1`,
      [planId]
    );
    if (stats && Number(stats.total_weight) > 0) {
      const progress = Math.round((Number(stats.weighted_progress) / Number(stats.total_weight)) * 100);
      await query('UPDATE strategic_plans SET overall_progress_pct = $1, updated_at = NOW() WHERE id = $2', [progress, planId]);
    }
  }
}

// ─── KPI Indicators ────────────────────────────────────

export class KPIEngine2 {
  static async list(orgId: string, pagination: PaginationParams = {}, filters?: {
    category?: string;
    planId?: string;
    goalId?: string;
    status?: string;
  }): Promise<PaginatedResult<any>> {
    const conditions = ['ki.organization_id = $1'];
    const params: any[] = [orgId]; let idx = 2;
    if (filters?.category) { conditions.push(`ki.category = $${idx++}`); params.push(filters.category); }
    if (filters?.planId) { conditions.push(`ki.plan_id = $${idx++}`); params.push(filters.planId); }
    if (filters?.goalId) { conditions.push(`ki.goal_id = $${idx++}`); params.push(filters.goalId); }
    if (filters?.status) { conditions.push(`ki.status = $${idx++}`); params.push(filters.status); }
    const where = conditions.join(' AND ');
    return paginatedQuery(
      `SELECT ki.*, sg.title_ar as goal_title, sp.title_ar as plan_title,
        CASE WHEN ki.target_value > 0 THEN ROUND((ki.current_value::float / ki.target_value::float * 100)::numeric, 1) ELSE 0 END as achievement_pct
       FROM kpi_indicators ki
       LEFT JOIN strategic_goals sg ON sg.id = ki.goal_id
       LEFT JOIN strategic_plans sp ON sp.id = ki.plan_id
       WHERE ${where}`,
      `SELECT COUNT(*) FROM kpi_indicators ki WHERE ${where}`,
      params, pagination
    );
  }

  static async create(data: {
    organizationId: string; planId?: string; goalId?: string;
    kpiCode: string; nameAr: string; nameEn?: string;
    category?: string; targetValue?: number; unit?: string;
  }, auth: AuthContext) {
    return await transaction(async (client) => {
      const result = await client.query(
        `INSERT INTO kpi_indicators
         (organization_id, plan_id, goal_id, kpi_code, name_ar, name_en, category, target_value, unit, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'ACTIVE') RETURNING *`,
        [
          data.organizationId, data.planId || null, data.goalId || null,
          requireField(data.kpiCode, 'kpiCode'), requireField(data.nameAr, 'nameAr'),
          optionalString(data.nameEn), optionalString(data.category),
          data.targetValue || 0, optionalString(data.unit),
        ]
      );
      return result.rows[0];
    });
  }

  static async updateValue(kpiId: string, currentValue: number) {
    const kpi = await queryOne('SELECT * FROM kpi_indicators WHERE id = $1', [kpiId]);
    if (!kpi) throw new Error('KPI not found');

    const newStatus = Number(kpi.target_value) > 0
      ? (currentValue / Number(kpi.target_value) * 100 >= 80 ? 'ON_TRACK' : currentValue / Number(kpi.target_value) * 100 >= 50 ? 'AT_RISK' : 'BEHIND')
      : 'ACTIVE';

    return queryOne(
      `UPDATE kpi_indicators SET current_value = $1, status = $2 WHERE id = $3 RETURNING *`,
      [currentValue, newStatus, kpiId]
    );
  }

  static async delete(kpiId: string) {
    await query('DELETE FROM kpi_indicators WHERE id = $1', [kpiId]);
  }
}

// ─── SWOT Analysis ─────────────────────────────────────

export class SWOTEngine {
  static async getByPlan(planId: string) {
    return queryMany('SELECT * FROM swot_analysis WHERE plan_id = $1 ORDER BY category, priority', [planId]);
  }

  static async create(data: {
    planId: string; organizationId: string;
    category: string; titleAr: string; titleEn?: string;
    descriptionAr?: string; priority?: number; impactLevel?: string;
  }, auth: AuthContext) {
    return await transaction(async (client) => {
      const result = await client.query(
        `INSERT INTO swot_analysis
         (plan_id, organization_id, category, title_ar, title_en, description_ar, priority, impact_level)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [
          data.planId, data.organizationId,
          requireField(data.category, 'category'), requireField(data.titleAr, 'titleAr'),
          optionalString(data.titleEn), optionalString(data.descriptionAr),
          data.priority || 1, optionalString(data.impactLevel),
        ]
      );
      return result.rows[0];
    });
  }

  static async update(swotId: string, data: Partial<{
    titleAr: string; titleEn: string; descriptionAr: string;
    priority: number; impactLevel: string; status: string;
  }>) {
    const sets: string[] = []; const values: any[] = []; let idx = 1;
    if (data.titleAr !== undefined) { sets.push(`title_ar = $${idx++}`); values.push(data.titleAr); }
    if (data.titleEn !== undefined) { sets.push(`title_en = $${idx++}`); values.push(data.titleEn); }
    if (data.descriptionAr !== undefined) { sets.push(`description_ar = $${idx++}`); values.push(data.descriptionAr); }
    if (data.priority !== undefined) { sets.push(`priority = $${idx++}`); values.push(data.priority); }
    if (data.impactLevel !== undefined) { sets.push(`impact_level = $${idx++}`); values.push(data.impactLevel); }
    if (data.status !== undefined) { sets.push(`status = $${idx++}`); values.push(data.status); }
    values.push(swotId);
    if (sets.length === 0) return null;
    return queryOne(`UPDATE swot_analysis SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, values);
  }

  static async delete(swotId: string) {
    await query('DELETE FROM swot_analysis WHERE id = $1', [swotId]);
  }

  static async getMatrix(orgId: string, planId?: string) {
    let where = 'organization_id = $1';
    const params: any[] = [orgId];
    if (planId) { where += ' AND plan_id = $2'; params.push(planId); }

    const items = await queryMany(`SELECT * FROM swot_analysis WHERE ${where}`, params);
    return {
      strengths: items.filter((i: any) => i.category === 'STRENGTH'),
      weaknesses: items.filter((i: any) => i.category === 'WEAKNESS'),
      opportunities: items.filter((i: any) => i.category === 'OPPORTUNITY'),
      threats: items.filter((i: any) => i.category === 'THREAT'),
    };
  }
}

// ─── Strategic Alignment ───────────────────────────────

export class StrategicAlignmentEngine {
  static async getAlignment(orgId: string, planId: string) {
    const goals = await queryMany(
      `SELECT sg.*,
        (SELECT json_agg(json_build_object(
          'id', ki.id, 'kpi_code', ki.kpi_code, 'name_ar', ki.name_ar,
          'target_value', ki.target_value, 'current_value', ki.current_value,
          'achievement_pct', CASE WHEN ki.target_value > 0 THEN ROUND((ki.current_value::float/ki.target_value::float*100)::numeric,1) ELSE 0 END
        )) FROM kpi_indicators ki WHERE ki.goal_id = sg.id) as kpis
       FROM strategic_goals sg WHERE sg.plan_id = $1`,
      [planId]
    );

    const projects = await queryMany(
      `SELECT p.id, p.name_ar, p.progress_percent, p.budget,
        (SELECT COUNT(*) FROM milestones m WHERE m.project_id = p.id AND m.status = 'COMPLETED') as completed_milestones,
        (SELECT COUNT(*) FROM milestones m WHERE m.project_id = p.id) as total_milestones
       FROM projects p WHERE p.organization_id = $1 AND p.deleted_at IS NULL AND p.status_code = 'ACTIVE'`,
      [orgId]
    );

    return { goals, projects, alignmentScore: this.calculateAlignmentScore(goals) };
  }

  private static calculateAlignmentScore(goals: any[]): number {
    if (goals.length === 0) return 0;
    const totalWeight = goals.reduce((s, g) => s + Number(g.weight_pct || 0), 0);
    if (totalWeight === 0) return 0;
    const weightedProgress = goals.reduce((s, g) => s + (Number(g.progress_pct || 0) * Number(g.weight_pct || 0) / 100), 0);
    return Math.round(weightedProgress);
  }
}
