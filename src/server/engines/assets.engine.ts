/**
 * NexoraOS™ — NEB-09: Resource & Asset Engine
 * Fixed Assets, Inventory, Warehouses, Depreciation, Asset Lifecycle
 */

import { query, queryOne, queryMany, transaction } from '../core/database';
import { PaginationParams, PaginatedResult } from '../core/types';
import { paginatedQuery, requireField, optionalString, auditLog, AuthContext } from '../core/helpers';
import logger from '../core/logger';

// ─── Fixed Assets ──────────────────────────────────────

export class AssetEngine {
  static async list(orgId: string, pagination: PaginationParams = {}, filters?: {
    category?: string;
    status?: string;
    warehouseId?: string;
    search?: string;
  }): Promise<PaginatedResult<any>> {
    const conditions = ['a.organization_id = $1'];
    const params: any[] = [orgId]; let idx = 2;
    if (filters?.category) { conditions.push(`a.category = $${idx++}`); params.push(filters.category); }
    if (filters?.status) { conditions.push(`a.status_code = $${idx++}`); params.push(filters.status); }
    if (filters?.warehouseId) { conditions.push(`a.warehouse_id = $${idx++}`); params.push(filters.warehouseId); }
    if (filters?.search) {
      conditions.push(`(a.name_ar ILIKE $${idx} OR a.name_en ILIKE $${idx} OR a.asset_code ILIKE $${idx})`);
      params.push(`%${filters.search}%`); idx++;
    }
    const where = conditions.join(' AND ');
    return paginatedQuery(
      `SELECT a.*,
        (a.purchase_cost - COALESCE(a.current_value, a.purchase_cost)) as depreciation_amount,
        CASE WHEN a.purchase_cost > 0 THEN ROUND(((a.purchase_cost - COALESCE(a.current_value, a.purchase_cost)) / a.purchase_cost * 100)::numeric, 2) ELSE 0 END as depreciation_pct
       FROM fixed_assets a WHERE ${where}`,
      `SELECT COUNT(*) FROM fixed_assets a WHERE ${where}`,
      params, pagination
    );
  }

  static async getById(assetId: string) {
    const asset = await queryOne('SELECT * FROM fixed_assets WHERE id = $1', [assetId]);
    if (!asset) return null;
    const lifecycle = await queryMany(
      'SELECT * FROM asset_lifecycle_events WHERE asset_id = $1 ORDER BY created_at DESC', [assetId]
    ).catch((err) => { logger.error('Query failed', { context: 'assets', error: err.message }); return []; });
    return { ...asset, lifecycle };
  }

  static async create(data: {
    organizationId: string; assetCode: string; nameAr: string; nameEn?: string;
    category?: string; purchaseCost: number; purchaseDate?: string;
    usefulLifeMonths?: number; residualValue?: number;
    locationName?: string; warehouseId?: string; projectId?: string;
    assignedCustodianHr?: string; conditionCode?: string;
  }, auth: AuthContext) {
    return await transaction(async (client) => {
      const result = await client.query(
        `INSERT INTO fixed_assets (organization_id, asset_code, name_ar, name_en, category,
          purchase_cost, current_value, residual_value, useful_life_months,
          purchase_date, location_name, warehouse_id, project_id,
          assigned_custodian_hr, condition_code, status_code)
         VALUES ($1,$2,$3,$4,$5,$6,$6,$7,$8,$9,$10,$11,$12,$13,$14,'ACTIVE')
         RETURNING *`,
        [data.organizationId, requireField(data.assetCode, 'assetCode'),
         requireField(data.nameAr, 'nameAr'), optionalString(data.nameEn),
         optionalString(data.category), data.purchaseCost || 0,
         data.residualValue || 0, data.usefulLifeMonths || 60,
         data.purchaseDate || null, optionalString(data.locationName),
         optionalString(data.warehouseId), optionalString(data.projectId),
         optionalString(data.assignedCustodianHr), optionalString(data.conditionCode)]
      );
      await auditLog({ organizationId: data.organizationId, userId: auth.userId, action: 'CREATE', tableName: 'fixed_assets', recordId: result.rows[0].id });
      return result.rows[0];
    });
  }

  static async update(assetId: string, data: Partial<{
    nameAr: string; nameEn: string; category: string; currentValue: number;
    locationName: string; conditionCode: string; assignedCustodianHr: string;
    statusCode: string;
  }>) {
    const sets: string[] = []; const values: any[] = []; let idx = 1;
    Object.entries(data).forEach(([key, val]) => {
      if (val !== undefined) { sets.push(`${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = $${idx++}`); values.push(val); }
    });
    values.push(assetId);
    if (sets.length === 0) return null;
    return queryOne(`UPDATE fixed_assets SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, values);
  }

  static async delete(assetId: string) {
    await query('DELETE FROM fixed_assets WHERE id = $1', [assetId]);
  }

  /**
   * Record asset lifecycle event (maintenance, transfer, disposal)
   */
  static async recordLifecycleEvent(data: {
    assetId: string; eventType: string; description: string; cost?: number;
  }) {
    return queryOne(
      `INSERT INTO asset_lifecycle_events (asset_id, event_type, description, cost)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [data.assetId, data.eventType, data.description, data.cost || 0]
    );
  }

  /**
   * Calculate depreciation for all assets
   */
  static async calculateDepreciation(orgId: string) {
    return queryMany(
      `SELECT a.id, a.asset_code, a.name_ar, a.purchase_cost, a.current_value,
              a.useful_life_months, a.residual_value, a.purchase_date,
        CASE WHEN a.useful_life_months > 0 AND a.purchase_date IS NOT NULL
          THEN GREATEST(a.residual_value, a.purchase_cost - ((a.purchase_cost - a.residual_value) / a.useful_life_months * EXTRACT(MONTH FROM AGE(CURRENT_DATE, a.purchase_date))))
          ELSE a.current_value END as calculated_value,
        CASE WHEN a.useful_life_months > 0 AND a.purchase_date IS NOT NULL
          THEN ROUND(((a.purchase_cost - GREATEST(a.residual_value, a.purchase_cost - ((a.purchase_cost - a.residual_value) / a.useful_life_months * EXTRACT(MONTH FROM AGE(CURRENT_DATE, a.purchase_date))))) / a.purchase_cost * 100)::numeric, 2)
          ELSE 0 END as accumulated_depreciation_pct
       FROM fixed_assets a
       WHERE a.organization_id = $1 AND a.status_code = 'ACTIVE'`,
      [orgId]
    );
  }

  /**
   * Asset dashboard
   */
  static async getDashboard(orgId: string) {
    const stats = await queryOne(
      `SELECT
        COUNT(*) as total_assets,
        COUNT(CASE WHEN status_code = 'ACTIVE' THEN 1 END) as active,
        COUNT(CASE WHEN status_code = 'MAINTENANCE' THEN 1 END) in_maintenance,
        COALESCE(SUM(purchase_cost), 0) as total_cost,
        COALESCE(SUM(current_value), 0) as total_current_value,
        COALESCE(AVG(current_value), 0) as avg_value
       FROM fixed_assets WHERE organization_id = $1`, [orgId]
    );
    const byCategory = await queryMany(
      `SELECT category, COUNT(*) as count, SUM(purchase_cost) as total_cost
       FROM fixed_assets WHERE organization_id = $1 AND category IS NOT NULL
       GROUP BY category ORDER BY count DESC`, [orgId]
    );
    return { statistics: stats, byCategory };
  }
}

// ─── Inventory ─────────────────────────────────────────

export class InventoryEngine {
  static async list(orgId: string, pagination: PaginationParams = {}, filters?: {
    category?: string;
    warehouseId?: string;
    search?: string;
  }): Promise<PaginatedResult<any>> {
    const conditions = ['i.organization_id = $1'];
    const params: any[] = [orgId]; let idx = 2;
    if (filters?.category) { conditions.push(`i.category = $${idx++}`); params.push(filters.category); }
    if (filters?.warehouseId) { conditions.push(`i.warehouse_id = $${idx++}`); params.push(filters.warehouseId); }
    if (filters?.search) {
      conditions.push(`(i.name_ar ILIKE $${idx} OR i.name_en ILIKE $${idx} OR i.item_code ILIKE $${idx})`);
      params.push(`%${filters.search}%`); idx++;
    }
    const where = conditions.join(' AND ');
    return paginatedQuery(
      `SELECT i.*, w.name_ar as warehouse_name,
        (i.unit_cost * i.total_quantity_on_hand) as total_value
       FROM inventory_items i
       LEFT JOIN warehouses w ON w.id = i.warehouse_id
       WHERE ${where}`,
      `SELECT COUNT(*) FROM inventory_items i WHERE ${where}`,
      params, pagination
    );
  }

  static async create(data: {
    organizationId: string; itemCode: string; nameAr: string; nameEn?: string;
    category?: string; unitCode?: string; unitCost?: number;
    totalQuantityOnHand?: number; warehouseId?: string;
  }, auth: AuthContext) {
    return queryOne(
      `INSERT INTO inventory_items (organization_id, item_code, name_ar, name_en, category,
        unit_code, unit_cost, total_quantity_on_hand, warehouse_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [data.organizationId, requireField(data.itemCode, 'itemCode'), requireField(data.nameAr, 'nameAr'),
       optionalString(data.nameEn), optionalString(data.category), optionalString(data.unitCode),
       data.unitCost || 0, data.totalQuantityOnHand || 0, optionalString(data.warehouseId)]
    );
  }

  static async updateStock(itemId: string, quantityChange: number, reason: string) {
    return queryOne(
      `UPDATE inventory_items SET total_quantity_on_hand = total_quantity_on_hand + $1 WHERE id = $2 RETURNING *`,
      [quantityChange, itemId]
    );
  }
}

// ─── Warehouses ────────────────────────────────────────

export class WarehouseEngine {
  static async list(orgId: string) {
    return queryMany(
      `SELECT w.*,
        (SELECT COUNT(*) FROM inventory_items i WHERE i.warehouse_id = w.id) as items_count
       FROM warehouses w WHERE w.organization_id = $1 ORDER BY w.name_ar`, [orgId]
    );
  }

  static async create(data: {
    organizationId: string; code: string; nameAr: string; nameEn?: string;
    location?: string; managerName?: string;
  }, auth: AuthContext) {
    return queryOne(
      `INSERT INTO warehouses (organization_id, code, name_ar, name_en, location, manager_name)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [data.organizationId, requireField(data.code, 'code'), requireField(data.nameAr, 'nameAr'),
       optionalString(data.nameEn), optionalString(data.location), optionalString(data.managerName)]
    );
  }

  static async update(warehouseId: string, data: Partial<{
    nameAr: string; nameEn: string; location: string; managerName: string;
  }>) {
    const sets: string[] = []; const values: any[] = []; let idx = 1;
    Object.entries(data).forEach(([key, val]) => {
      if (val !== undefined) { sets.push(`${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = $${idx++}`); values.push(val); }
    });
    values.push(warehouseId);
    if (sets.length === 0) return null;
    return queryOne(`UPDATE d.warehouses SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, values);
  }
}
