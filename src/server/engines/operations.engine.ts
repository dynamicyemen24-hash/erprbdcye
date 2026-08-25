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
        (a.spent_amount / NULLIF(a.budget_allocated, 0) * 100) as budget_utilization_pct
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
        `INSERT INTO activities (organization_id, project_id, code, name_ar, name_en, budget_allocated)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [data.organizationId, data.projectId || null, requireField(data.code, 'code'),
         requireField(data.nameAr, 'nameAr'), optionalString(data.nameEn), data.budgetAllocated || 0]
      );
      await auditLog({ organizationId: data.organizationId, userId: auth.userId, action: 'CREATE', tableName: 'activities', recordId: result.rows[0].id });
      return result.rows[0];
    });
  }

  static async update(activityId: string, data: Partial<{
    nameAr: string; nameEn: string; budgetAllocated: number; spentAmount: number;
    progressPct: number; statusCode: string;
  }>) {
    const sets: string[] = []; const values: any[] = []; let idx = 1;
    Object.entries(data).forEach(([key, val]) => {
      if (val !== undefined) {
        const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        sets.push(`${col} = $${idx++}`);
        values.push(val);
      }
    });
    values.push(activityId);
    if (sets.length === 0) return null;
    return queryOne(`UPDATE activities SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, values);
  }

  static async delete(activityId: string) {
    await query('DELETE FROM activities WHERE id = $1', [activityId]);
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
        totalBudget: activities.reduce((s: number, a: any) => s + Number(a.budget_allocated || 0), 0),
        totalSpent: activities.reduce((s: number, a: any) => s + Number(a.spent_amount || 0), 0),
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
