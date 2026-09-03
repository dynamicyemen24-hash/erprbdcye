/**
 * NexoraOS™ — NEB-05: Operations & Field Execution Engine
 * Activities, WBS, Resource Allocation, Geospatial, Field Sync
 */

import { query, queryOne, queryMany, transaction } from '../core/database';
import { PaginationParams, PaginatedResult } from '../core/types';
import { paginatedQuery, requireField, optionalString, auditLog, AuthContext } from '../core/helpers';
import logger from '../core/logger';

export class ActivityEngine {
  static async list(orgId: string, pagination: PaginationParams = {}, filters?: {
    projectId?: string;
    status?: string;
    search?: string;
  }): Promise<PaginatedResult<any>> {
    const conditions = ['a.organization_id = $1'];
    const params: any[] = [orgId]; let idx = 2;
    if (filters?.projectId) { conditions.push(`a.project_id = $${idx++}`); params.push(filters.projectId); }
    if (filters?.status) { conditions.push(`a.status_code = $${idx++}`); params.push(filters.status); }
    if (filters?.search) {
      conditions.push(`(a.name_ar ILIKE $${idx} OR a.name_en ILIKE $${idx} OR a.code ILIKE $${idx})`);
      params.push(`%${filters.search}%`); idx++;
    }
    const where = conditions.join(' AND ');
    return paginatedQuery(
      `SELECT a.*, p.name_ar as project_name_ar,
        (a.actual_cost / NULLIF(a.budget, 0) * 100) as budget_utilization_pct
       FROM activities a
       LEFT JOIN projects p ON p.id = a.project_id
       WHERE ${where}`,
      `SELECT COUNT(*) FROM activities a WHERE ${where}`,
      params, pagination
    );
  }

  static async getById(activityId: string) {
    return queryOne('SELECT a.*, p.name_ar as project_name_ar FROM activities a LEFT JOIN projects p ON p.id = a.project_id WHERE a.id = $1', [activityId]);
  }

  static async create(data: {
    organizationId: string; projectId?: string; code: string;
    nameAr: string; nameEn?: string; budgetAllocated?: number;
  }, auth: AuthContext) {
    return await transaction(async (client) => {
      const result = await client.query(
        `INSERT INTO activities (organization_id, project_id, code, name_ar, name_en, budget, status_code)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [data.organizationId, data.projectId || null, requireField(data.code, 'code'),
         requireField(data.nameAr, 'nameAr'), optionalString(data.nameEn), data.budgetAllocated || 0, 'PLANNED']
      );
      await auditLog({ organizationId: data.organizationId, userId: auth.userId, action: 'CREATE', tableName: 'activities', recordId: result.rows[0].id });
      return result.rows[0];
    });
  }

  static async update(activityId: string, data: Partial<{
    nameAr: string; nameEn: string; budgetAllocated: number; spentAmount: number;
    progressPct: number; statusCode: string;
  }>) {
    // Explicit real-schema column mapping (solves camelCase→snake drift).
    const map: Record<string, string> = {
      budgetAllocated: 'budget',
      spentAmount: 'actual_cost',
      progressPct: 'progress_pct',
      statusCode: 'status_code',
      nameAr: 'name_ar',
      nameEn: 'name_en',
    };
    const sets: string[] = []; const values: any[] = []; let idx = 1;
    for (const key of Object.keys(data) as Array<keyof typeof data>) {
      const val = data[key];
      if (val === undefined) continue;
      const col = map[key] || key.replace(/([A-Z])/g, '_$1').toLowerCase();
      sets.push(`${col} = $${idx++}`);
      values.push(val);
    }
    if (sets.length === 0) return null;
    values.push(activityId);
    return queryOne(`UPDATE activities SET ${sets.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL RETURNING *`, values);
  }

  static async delete(activityId: string) {
    await query('UPDATE activities SET deleted_at = NOW() WHERE id = $1', [activityId]);
  }

  /**
   * Update activity progress with automatic parent project recalculation
   * INTELLIGENT: Cascades progress updates to project level
   */
  static async updateProgress(activityId: string, progressPct: number, auth: AuthContext) {
    if (progressPct < 0 || progressPct > 100) {
      throw new Error('Progress must be between 0 and 100');
    }

    return await transaction(async (client) => {
      const result = await client.query(
        `UPDATE activities
         SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('progress_pct', $1, 'progress_updated_at', NOW()),
             status_code = CASE
               WHEN $1 = 0 THEN 'PLANNED'
               WHEN $1 >= 100 THEN 'COMPLETED'
               ELSE 'IN_PROGRESS'
             END,
             updated_at = NOW()
         WHERE id = $2 RETURNING *`,
        [progressPct, activityId]
      );

      if (result.rows.length === 0) throw new Error('Activity not found');
      const activity = result.rows[0];

      await auditLog({
        organizationId: activity.organization_id,
        userId: auth.userId,
        action: 'UPDATE' as any,
        tableName: 'activities',
        recordId: activityId,
        details: { progressPct, statusCode: activity.status_code, type: 'PROGRESS_UPDATE' }
      });

      // Recalculate parent project progress based on weighted EVM of activities
      if (activity.project_id) {
        await client.query(
          `UPDATE projects SET
             progress_percent = COALESCE((
               SELECT ROUND(AVG(
                 CASE WHEN budget > 0 THEN (earned_value / budget) * 100
                      WHEN earned_value > 0 THEN earned_value
                      ELSE 0 END
               ))::int
               FROM activities
               WHERE project_id = $1 AND deleted_at IS NULL
             ), progress_percent),
             updated_at = NOW()
           WHERE id = $1`,
          [activity.project_id]
        );
      }

      return activity;
    });
  }

  /**
   * Get WBS (Work Breakdown Structure) for a project
   */
  static async getWBS(projectId: string) {
    const activities = await queryMany(
      `SELECT a.*, p.name_ar as project_name
       FROM activities a
       LEFT JOIN projects p ON p.id = a.project_id
       WHERE a.project_id = $1
       ORDER BY a.code`,
      [projectId]
    );

    return {
      project: await queryOne('SELECT * FROM projects WHERE id = $1', [projectId]),
      wbs: buildWBSTree(activities),
      summary: {
        totalActivities: activities.length,
        totalBudget: activities.reduce((s: number, a: any) => s + Number(a.budget || 0), 0),
        totalSpent: activities.reduce((s: number, a: any) => s + Number(a.actual_cost || 0), 0),
      },
    };
  }
}

function buildWBSTree(activities: any[]): any[] {
  const map = new Map<string, any>();
  const roots: any[] = [];
  activities.forEach(a => map.set(a.id, { ...a, children: [] }));
  activities.forEach(a => {
    const node = map.get(a.id)!;
    if (a.parent_activity_id && map.has(a.parent_activity_id)) {
      map.get(a.parent_activity_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

// ─── Resource Allocation ───────────────────────────────

export class ResourceAllocationEngine {
  static async list(orgId: string, projectId?: string) {
    let where = 'ra.organization_id = $1';
    const params: any[] = [orgId];
    if (projectId) { where += ' AND ra.project_id = $2'; params.push(projectId); }

    return queryMany(
      `SELECT ra.*, a.name_ar as activity_name, p.name_ar as project_name
       FROM resource_allocations ra
       LEFT JOIN activities a ON a.id = ra.activity_id
       LEFT JOIN projects p ON p.id = ra.project_id
       WHERE ${where} ORDER BY ra.allocation_date DESC`,
      params
    ).catch((err) => { logger.error('Query failed', { context: 'operations', error: err.message }); return []; });
  }

  static async create(data: {
    organizationId: string; projectId?: string; activityId?: string;
    resourceName: string; resourceType: string;
    allocatedHours: number; allocationDate: string;
  }) {
    return queryOne(
      `INSERT INTO resource_allocations
       (organization_id, project_id, activity_id, resource_name, resource_type, allocated_hours, allocation_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [data.organizationId, data.projectId || null, data.activityId || null,
       data.resourceName, data.resourceType, data.allocatedHours, data.allocationDate]
    ).catch((err: any) => { console.error('[Engine] Query failed:', err.message); return null; });
  }
}

// ─── Geospatial ────────────────────────────────────────

export class GeospatialEngine {
  static async listAreas(orgId: string) {
    return queryMany('SELECT * FROM geographic_areas WHERE organization_id = $1 OR organization_id IS NULL ORDER BY name_ar', [orgId]);
  }

  static async createArea(data: {
    code: string; nameAr: string; nameEn?: string;
    parentAreaId?: string; areaType?: string;
    latitude?: number; longitude?: number;
  }) {
    return queryOne(
      `INSERT INTO geographic_areas (code, name_ar, name_en, parent_area_id, area_type, latitude, longitude)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [data.code, requireField(data.nameAr, 'nameAr'), optionalString(data.nameEn),
       optionalString(data.parentAreaId), optionalString(data.areaType),
       data.latitude || null, data.longitude || null]
    );
  }

  static async getProjectLocations(orgId: string) {
    return queryMany(
      `SELECT pr.id, pr.name_ar, pr.project_code, pr.status_code,
              ga.name_ar as area_name, ga.latitude, ga.longitude
       FROM projects pr
       LEFT JOIN geographic_areas ga ON ga.id = pr.geographic_area_id
       WHERE pr.organization_id = $1 AND pr.deleted_at IS NULL AND ga.latitude IS NOT NULL`,
      [orgId]
    ).catch((err) => { logger.error('Query failed', { context: 'operations', error: err.message }); return []; });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TASK ENGINE — WBS Level 3+ Task Management
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * TaskEngine — Fine-grained task tracking within WBS activities
 * Features:
 *  - Weighted progress cascading (Task → Activity → Project)
 *  - Priority management (LOW/MEDIUM/HIGH/CRITICAL)
 *  - Assignee tracking
 *  - Auto-recalculation of parent progress on every update
 */
export class TaskEngine {
  static async listByActivity(activityId: string) {
    return queryMany(
      `SELECT t.*, u.full_name_ar as assignee_name
       FROM project_tasks t
       LEFT JOIN users u ON u.id = t.assigned_to
       WHERE t.activity_id = $1 AND t.deleted_at IS NULL
       ORDER BY COALESCE(t.priority_code, 'MEDIUM') DESC, t.due_date NULLS LAST`,
      [activityId]
    ).catch((err) => { logger.error('Tasks list query failed', { context: 'tasks', error: err.message }); return []; });
  }

  static async create(data: {
    activityId: string;
    titleAr: string;
    titleEn?: string;
    assignedTo?: string;
    dueDate?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    weightPct?: number;
  }, auth: AuthContext) {
    return await transaction(async (client) => {
      const actRes = await client.query(
        'SELECT id, project_id, organization_id FROM activities WHERE id = $1',
        [data.activityId]
      );
      if (actRes.rows.length === 0) throw new Error('Activity not found');

      const result = await client.query(
        `INSERT INTO project_tasks
          (activity_id, project_id, title_ar, title_en, assigned_to, due_date, priority_code, weight_pct, status_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'TODO')
         RETURNING *`,
        [
          data.activityId,
          actRes.rows[0].project_id || null,
          requireField(data.titleAr, 'titleAr'),
          optionalString(data.titleEn),
          data.assignedTo || null,
          data.dueDate || null,
          data.priority || 'MEDIUM',
          data.weightPct || 10
        ]
      );
      const task = result.rows[0];

      await auditLog({
        organizationId: actRes.rows[0].organization_id,
        userId: auth.userId,
        action: 'CREATE' as any,
        tableName: 'project_tasks',
        recordId: task.id,
        details: { title: data.titleAr, activityId: data.activityId }
      });

      return task;
    });
  }

  /**
   * INTELLIGENT: Cascades progress through the entire WBS hierarchy
   * Task → Activity → Project (automatic recalculation)
   */
  static async updateProgress(taskId: string, progressPct: number, auth: AuthContext) {
    if (progressPct < 0 || progressPct > 100) {
      throw new Error('Progress must be between 0 and 100');
    }
    return await transaction(async (client) => {
      const result = await client.query(
        `UPDATE project_tasks
         SET progress_percent = $1,
             status_code = CASE WHEN $1 >= 100 THEN 'DONE' WHEN $1 > 0 THEN 'IN_PROGRESS' ELSE 'TODO' END,
             updated_at = NOW()
         WHERE id = $2 AND deleted_at IS NULL RETURNING activity_id`,
        [progressPct, taskId]
      );
      if (result.rows.length === 0) throw new Error('Task not found');
      const activityId = result.rows[0].activity_id;

      // Recalculate activity progress as weighted average of tasks
      await client.query(
        `UPDATE activities SET
           progress_pct = COALESCE((
             SELECT ROUND(SUM(progress_percent * weight_pct) / NULLIF(SUM(weight_pct), 0))::int
             FROM project_tasks WHERE activity_id = $1 AND deleted_at IS NULL
           ), progress_pct),
           status_code = CASE
             WHEN COALESCE((SELECT AVG(progress_percent) FROM project_tasks WHERE activity_id = $1 AND deleted_at IS NULL), 0) >= 100 THEN 'COMPLETED'
             WHEN COALESCE((SELECT AVG(progress_percent) FROM project_tasks WHERE activity_id = $1 AND deleted_at IS NULL), 0) > 0 THEN 'IN_PROGRESS'
             ELSE status_code
           END,
           updated_at = NOW()
         WHERE id = $1`,
        [activityId]
      );

      // Cascade: recalculate parent project progress
      const actRow = await client.query('SELECT project_id, organization_id FROM activities WHERE id = $1', [activityId]);
      if (actRow.rows.length > 0 && actRow.rows[0].project_id) {
        await client.query(
          `UPDATE projects SET
             progress_percent = COALESCE((
               SELECT ROUND(AVG(progress_pct))::int FROM activities WHERE project_id = $1 AND deleted_at IS NULL
             ), progress_percent),
             updated_at = NOW()
           WHERE id = $1`,
          [actRow.rows[0].project_id]
        );

        await auditLog({
          organizationId: actRow.rows[0].organization_id,
          userId: auth.userId,
          action: 'UPDATE' as any,
          tableName: 'project_tasks',
          recordId: taskId,
          details: { progressPct, type: 'TASK_PROGRESS_CASCADE', activityId, projectId: actRow.rows[0].project_id }
        });
      }

      return await client.query('SELECT * FROM project_tasks WHERE id = $1', [taskId]).then(r => r.rows[0]);
    });
  }

  static async delete(taskId: string) {
    await query('UPDATE project_tasks SET deleted_at = NOW() WHERE id = $1', [taskId]);
  }
}
