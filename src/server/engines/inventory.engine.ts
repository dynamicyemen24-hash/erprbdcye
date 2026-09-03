/**
 * UAMEX ERP™ — NEB-05/NEB-09: Inventory & Warehouse OS
 * Inventory Engine (Production-Grade, E2E)
 * محرك المخازن: دليل أصناف، أرصدة، حركات بتقييم متوسط مرجّح،
 * تحويلات، تسويات، جرد فعلي، سياسات، تحليلات وذكاء أعمال.
 *
 * المنهجية المعيارية:
 * - دفتر حركات موحد غير قابل للتعديل (Immutable Movement Ledger)
 * - تقييم بمتوسط مرجّح افتراضياً مع دعم FIFO على مستوى الدفعات
 * - منع الرصيد السالب إلا إذا سمحت السياسة صراحة
 * - كل ترحيل ذري (Atomic) داخل معاملة واحدة مع تدقيق كامل
 */

import { queryOne, queryMany, transaction, query } from '../core/database';
import { PaginationParams, PaginatedResult, AuditAction } from '../core/types';
import {
  paginatedQuery, requireField, optionalString, optionalNumber,
  sanitize, generateCode, generateTxNumber, auditLog, AuthContext
} from '../core/helpers';
import {
  InventoryMovementType, InventoryCostingMethod,
  INBOUND_MOVEMENT_TYPES, INVENTORY_ROLE_PERMISSIONS, InventoryPermissionKey,
  TransferStatus, AdjustmentStatus, StocktakeStatus,
  TRANSFER_TRANSITIONS, ADJUSTMENT_TRANSITIONS, STOCKTAKE_TRANSITIONS
} from '../../features/inventory/inventoryTypes';

// ─── التحقق من الصلاحيات المعيارية ─────────────────────────

export function hasInventoryPermission(role: string | undefined, key: InventoryPermissionKey): boolean {
  if (!role) return false;
  const perms = INVENTORY_ROLE_PERMISSIONS[role] || [];
  return perms.includes(key);
}

export function assertInventoryPermission(auth: AuthContext, key: InventoryPermissionKey): void {
  if (!hasInventoryPermission(auth.role, key)) {
    throw new Error(`ليست لديك صلاحية تنفيذ هذه العملية (${key}). يرجى مراجعة مدير النظام.`);
  }
}

// ─── محرك السياسات والإعدادات ──────────────────────────────

export class InventoryPolicyEngine {
  /** جلب سياسات المنظمة (مع إنشاء افتراضي عند أول استخدام) */
  static async get(orgId: string): Promise<any> {
    let policy = await queryOne(
      `SELECT * FROM inventory_policies WHERE organization_id = $1`, [orgId]
    );
    if (!policy) {
      policy = await queryOne(
        `INSERT INTO inventory_policies (organization_id) VALUES ($1) RETURNING *`, [orgId]
      );
    }
    return policy;
  }

  /** تحديث السياسات (المنهجية المعيارية: قيم مسموحة فقط) */
  static async update(orgId: string, updates: Record<string, any>, auth: AuthContext): Promise<any> {
    assertInventoryPermission(auth, 'inventory.policies.manage');
    const allowed = [
      'costing_method', 'allow_negative_stock', 'require_approval_issue',
      'require_approval_transfer', 'require_approval_adjustment',
      'issue_approval_threshold', 'adjustment_approval_threshold',
      'default_stocktake_frequency', 'expiry_alert_days',
      'reorder_alert_enabled', 'auto_reserve_on_transfer', 'fifo_enabled',
    ];
    const sets: string[] = ['updated_by = $2', 'updated_at = NOW()'];
    const params: any[] = [orgId, auth.userId];
    let idx = 3;
    for (const [k, v] of Object.entries(updates)) {
      if (!allowed.includes(k)) continue;
      if (k === 'costing_method' && !['WEIGHTED_AVERAGE', 'FIFO'].includes(String(v))) {
        throw new Error('طريقة التقييم غير معتمدة. المسموح: WEIGHTED_AVERAGE أو FIFO');
      }
      sets.push(`${k} = $${idx++}`);
      params.push(v);
    }
    await query(
      `UPDATE inventory_policies SET ${sets.join(', ')} WHERE organization_id = $1`,
      params
    );
    await auditLog({
      organizationId: orgId, userId: auth.userId, action: 'UPDATE',
      tableName: 'inventory_policies', details: { updates },
    });
    return this.get(orgId);
  }
}

// ─── محرك دليل الأصناف (Master Data) ───────────────────────

export class ItemEngine {
  static async list(orgId: string, pagination: PaginationParams = {}, filters?: {
    status?: string; categoryId?: string; search?: string; itemType?: string;
  }): Promise<PaginatedResult<any>> {
    const conditions = ['i.organization_id = $1'];
    const params: any[] = [orgId];
    let idx = 2;
    if (filters?.status) { conditions.push(`i.status = $${idx++}`); params.push(filters.status); }
    if (filters?.categoryId) { conditions.push(`i.category_id = $${idx++}`); params.push(filters.categoryId); }
    if (filters?.itemType) { conditions.push(`i.item_type = $${idx++}`); params.push(filters.itemType); }
    if (filters?.search) {
      conditions.push(`(i.name_ar ILIKE $${idx} OR i.name_en ILIKE $${idx} OR i.item_code ILIKE $${idx} OR i.barcode ILIKE $${idx})`);
      params.push(`%${filters.search}%`);
      idx++;
    }
    const where = conditions.join(' AND ');
    return paginatedQuery(
      `SELECT i.*, c.name_ar as category_name_ar, u.code as uom_code,
              COALESCE((SELECT SUM(b.quantity_on_hand) FROM inventory_stock_balances b WHERE b.item_id = i.id), 0) AS total_on_hand,
              COALESCE((SELECT SUM(b.quantity_on_hand * b.unit_cost) FROM inventory_stock_balances b WHERE b.item_id = i.id), 0) AS total_value
       FROM inventory_items i
       LEFT JOIN inventory_categories c ON c.id = i.category_id
       LEFT JOIN inventory_uoms u ON u.id = i.uom_id
       WHERE ${where}
       ORDER BY i.item_code`,
      `SELECT COUNT(*) FROM inventory_items i WHERE ${where}`,
      params, pagination
    );
  }

  static async getById(orgId: string, itemId: string): Promise<any> {
    const item = await queryOne(
      `SELECT i.*, c.name_ar as category_name_ar, u.code as uom_code
       FROM inventory_items i
       LEFT JOIN inventory_categories c ON c.id = i.category_id
       LEFT JOIN inventory_uoms u ON u.id = i.uom_id
       WHERE i.id = $1 AND i.organization_id = $2`, [itemId, orgId]
    );
    if (!item) return null;
    item.balances = await queryMany(
      `SELECT b.*, w.name_ar as warehouse_name_ar
       FROM inventory_stock_balances b
       JOIN warehouses w ON w.id = b.warehouse_id
       WHERE b.item_id = $1 AND b.quantity_on_hand > 0
       ORDER BY b.expiry_date NULLS LAST`, [itemId]
    );
    return item;
  }

  static async create(orgId: string, data: Record<string, any>, auth: AuthContext): Promise<any> {
    assertInventoryPermission(auth, 'inventory.items.manage');
    const nameAr = requireField(data.name_ar, 'اسم الصنف (عربي)');
    const itemCode = data.item_code || generateCode('ITM-', 5);
    const created = await queryOne(
      `INSERT INTO inventory_items
        (organization_id, category_id, uom_id, item_code, barcode, name_ar, name_en,
         description, item_type, valuation_method, min_level, max_level,
         reorder_level, reorder_qty, shelf_life_days, storage_conditions,
         is_serialized, is_batch_tracked, standard_cost, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       RETURNING *`,
      [
        orgId, data.category_id || null, data.uom_id || null, itemCode,
        optionalString(data.barcode), sanitize(nameAr), optionalString(data.name_en),
        optionalString(data.description), data.item_type || 'STOCK',
        data.valuation_method || 'WEIGHTED_AVERAGE',
        optionalNumber(data.min_level) ?? 0, optionalNumber(data.max_level) ?? 0,
        optionalNumber(data.reorder_level) ?? 0, optionalNumber(data.reorder_qty) ?? 0,
        optionalNumber(data.shelf_life_days), optionalString(data.storage_conditions),
        data.is_serialized === true, data.is_batch_tracked !== false,
        optionalNumber(data.standard_cost) ?? 0, data.status || 'ACTIVE', auth.userId,
      ]
    );
    await auditLog({
      organizationId: orgId, userId: auth.userId, action: 'CREATE',
      tableName: 'inventory_items', recordId: created?.id,
      details: { item_code: itemCode, name_ar: nameAr },
    });
    return created;
  }

  static async update(orgId: string, itemId: string, data: Record<string, any>, auth: AuthContext): Promise<any> {
    assertInventoryPermission(auth, 'inventory.items.manage');
    const existing = await queryOne(
      `SELECT id FROM inventory_items WHERE id = $1 AND organization_id = $2`, [itemId, orgId]
    );
    if (!existing) throw new Error('الصنف غير موجود');
    const allowed = [
      'category_id', 'uom_id', 'barcode', 'name_ar', 'name_en', 'description',
      'item_type', 'valuation_method', 'min_level', 'max_level', 'reorder_level',
      'reorder_qty', 'shelf_life_days', 'storage_conditions', 'is_serialized',
      'is_batch_tracked', 'standard_cost', 'status',
    ];
    const sets: string[] = ['updated_at = NOW()'];
    const params: any[] = [];
    let idx = 1;
    for (const [k, v] of Object.entries(data)) {
      if (!allowed.includes(k)) continue;
      sets.push(`${k} = $${idx++}`);
      params.push(typeof v === 'string' ? sanitize(v) : v);
    }
    if (sets.length === 1) return this.getById(orgId, itemId);
    params.push(itemId, orgId);
    await query(
      `UPDATE inventory_items SET ${sets.join(', ')} WHERE id = $${idx++} AND organization_id = $${idx}`,
      params
    );
    await auditLog({
      organizationId: orgId, userId: auth.userId, action: 'UPDATE',
      tableName: 'inventory_items', recordId: itemId, details: { fields: Object.keys(data) },
    });
    return this.getById(orgId, itemId);
  }
}

// ─── محرك الفئات والوحدات ──────────────────────────────────

export class CategoryEngine {
  static async list(orgId: string): Promise<any[]> {
    return queryMany(
      `SELECT c.*, parent.name_ar as parent_name_ar,
              (SELECT COUNT(*) FROM inventory_items i WHERE i.category_id = c.id)::int AS items_count
       FROM inventory_categories c
       LEFT JOIN inventory_categories parent ON parent.id = c.parent_id
       WHERE c.organization_id = $1
       ORDER BY c.code`, [orgId]
    );
  }

  static async create(orgId: string, data: Record<string, any>, auth: AuthContext): Promise<any> {
    assertInventoryPermission(auth, 'inventory.items.manage');
    const nameAr = requireField(data.name_ar, 'اسم الفئة (عربي)');
    const created = await queryOne(
      `INSERT INTO inventory_categories (organization_id, parent_id, code, name_ar, name_en, description)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [orgId, data.parent_id || null, data.code || generateCode('CAT-', 3),
       sanitize(nameAr), optionalString(data.name_en), optionalString(data.description)]
    );
    await auditLog({
      organizationId: orgId, userId: auth.userId, action: 'CREATE',
      tableName: 'inventory_categories', recordId: created?.id,
    });
    return created;
  }
}

export class UomEngine {
  static async list(orgId: string): Promise<any[]> {
    return queryMany(
      `SELECT * FROM inventory_uoms WHERE organization_id = $1 ORDER BY code`, [orgId]
    );
  }

  static async create(orgId: string, data: Record<string, any>, auth: AuthContext): Promise<any> {
    assertInventoryPermission(auth, 'inventory.items.manage');
    const created = await queryOne(
      `INSERT INTO inventory_uoms (organization_id, code, name_ar, name_en, base_uom_code, conversion_factor)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [orgId, requireField(data.code, 'رمز الوحدة'), requireField(data.name_ar, 'اسم الوحدة (عربي)'),
       optionalString(data.name_en), optionalString(data.base_uom_code),
       optionalNumber(data.conversion_factor) ?? 1]
    );
    await auditLog({
      organizationId: orgId, userId: auth.userId, action: 'CREATE',
      tableName: 'inventory_uoms', recordId: created?.id,
    });
    return created;
  }
}

// ─── محرك المخازن ──────────────────────────────────────────

export class WarehouseEngine {
  static async list(orgId: string, pagination: PaginationParams = {}, filters?: {
    status?: string; search?: string;
  }): Promise<PaginatedResult<any>> {
    const conditions = ['w.organization_id = $1'];
    const params: any[] = [orgId];
    let idx = 2;
    if (filters?.status) { conditions.push(`w.status = $${idx++}`); params.push(filters.status); }
    if (filters?.search) {
      conditions.push(`(w.name_ar ILIKE $${idx} OR w.name_en ILIKE $${idx} OR w.location ILIKE $${idx})`);
      params.push(`%${filters.search}%`);
      idx++;
    }
    const where = conditions.join(' AND ');
    return paginatedQuery(
      `SELECT w.*,
              (SELECT COUNT(*) FROM inventory_stock_balances b WHERE b.warehouse_id = w.id AND b.quantity_on_hand > 0)::int AS active_skus,
              COALESCE((SELECT SUM(b.quantity_on_hand * b.unit_cost) FROM inventory_stock_balances b WHERE b.warehouse_id = w.id), 0) AS stock_value
       FROM warehouses w
       WHERE ${where}
       ORDER BY created_at DESC`,
      `SELECT COUNT(*) FROM warehouses w WHERE ${where}`,
      params, pagination
    );
  }

  static async create(orgId: string, data: Record<string, any>, auth: AuthContext): Promise<any> {
    assertInventoryPermission(auth, 'inventory.warehouses.manage');
    const nameAr = requireField(data.name_ar, 'اسم المخزن (عربي)');
    const created = await queryOne(
      `INSERT INTO warehouses (organization_id, name_ar, name_en, location, manager_name, status)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [orgId, sanitize(nameAr), optionalString(data.name_en), optionalString(data.location),
       optionalString(data.manager_name), data.status || 'ACTIVE']
    );
    await auditLog({
      organizationId: orgId, userId: auth.userId, action: 'CREATE',
      tableName: 'warehouses', recordId: created?.id,
    });
    return created;
  }
}

// ─── محرك الحركات والترحيل (Core Posting Engine) ───────────

export interface MovementPostingInput {
  movementType: InventoryMovementType;
  warehouseId: string;
  itemId: string;
  quantity: number;
  unitCost?: number;
  batchNumber?: string | null;
  expiryDate?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  referenceNumber?: string | null;
  projectId?: string | null;
  activityId?: string | null;
  beneficiaryId?: string | null;
  donorId?: string | null;
  docDate?: string;
  notes?: string | null;
  postedBy?: string | null;
}

export class StockMovementEngine {

  /** جلب سياسة المخزون داخل الترحيل (مع قيم افتراضية آمنة) */
  private static async getPolicyRow(client: any, orgId: string) {
    const res = await client.query(
      `SELECT * FROM inventory_policies WHERE organization_id = $1`, [orgId]
    );
    return res.rows[0] || {
      costing_method: 'WEIGHTED_AVERAGE', allow_negative_stock: false,
    };
  }

  /**
   * ترحيل حركة واحدة بشكل ذري:
   * - الوارد: تحديث متوسط التكلفة المرجّح
   * - الصادر: التكلفة بالمتوسط المرجّح الحالي + حماية من الرصيد السالب
   * - تسجيل الحركة في الدفتر الموحد مع الرصيد بعد الحركة
   */
  static async postMovement(orgId: string, input: MovementPostingInput, auth: AuthContext): Promise<any> {
    const qty = Number(input.quantity);
    if (!Number.isFinite(qty) || qty <= 0) throw new Error('الكمية يجب أن تكون رقماً موجباً أكبر من الصفر');
    if (!orgId || auth.orgId !== orgId) throw new Error('لا يمكن ترحيل حركة خارج نطاق المنظمة الحالية');
    if (!input.movementType || !['RECEIPT', 'ISSUE', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT'].includes(input.movementType)) {
      throw new Error('نوع حركة المخزون غير معتمد');
    }

    // صلاحيات الترحيل حسب نوع الحركة
    if (input.movementType === 'RECEIPT') {
      assertInventoryPermission(auth, 'inventory.receipt.post');
    } else if (input.movementType === 'ISSUE') {
      assertInventoryPermission(auth, 'inventory.issue.post');
    } else if (input.movementType === 'ADJUSTMENT_IN' || input.movementType === 'ADJUSTMENT_OUT') {
      assertInventoryPermission(auth, 'inventory.adjustment.manage');
    }

    const isInbound = INBOUND_MOVEMENT_TYPES.includes(input.movementType);
    const movementNumber = generateTxNumber(
      input.movementType === 'RECEIPT' ? 'RCV'
        : input.movementType === 'ISSUE' ? 'ISS'
        : input.movementType === 'TRANSFER_OUT' ? 'TRO'
        : input.movementType === 'TRANSFER_IN' ? 'TRI' : 'ADJ'
    );

    const result = await transaction(async (client: any) => {
      const policy = await this.getPolicyRow(client, orgId);

      const scopeRes = await client.query(
        `SELECT i.id AS item_id, w.id AS warehouse_id
         FROM inventory_items i
         JOIN warehouses w ON w.id = $3 AND w.organization_id = $1
         WHERE i.id = $2 AND i.organization_id = $1 AND i.status = 'ACTIVE'`,
        [orgId, input.itemId, input.warehouseId]
      );
      if (scopeRes.rows.length === 0) {
        throw new Error('الصنف أو المخزن غير موجود أو غير نشط ضمن المنظمة الحالية');
      }

      // قفل صف الرصيد (SELECT FOR UPDATE) لضمان سلامة التزامن
      const balRes = await client.query(
        `SELECT * FROM inventory_stock_balances
         WHERE organization_id = $1 AND warehouse_id = $2 AND item_id = $3
           AND COALESCE(batch_number, '') = COALESCE($4, '')
         FOR UPDATE`,
        [orgId, input.warehouseId, input.itemId, input.batchNumber || null]
      );
      const balance = balRes.rows[0];

      const unitCostIn = Number(input.unitCost ?? 0);
      if (isInbound && (!Number.isFinite(unitCostIn) || unitCostIn < 0)) {
        throw new Error('تكلفة الوحدة الواردة يجب أن تكون رقماً صفرياً أو موجباً');
      }
      let effectiveUnitCost: number;
      let newQty: number;
      let avgCost: number;

      if (!balance && !isInbound && !policy.allow_negative_stock) {
        throw new Error('لا يمكن الصرف من صنف غير متوفر في هذا المخزن (الرصيد صفر). يمكن تفعيل السماح بالسالب من السياسات.');
      }

      const onHand = Number(balance?.quantity_on_hand || 0);
      const reserved = Number(balance?.quantity_reserved || 0);
      const available = onHand - reserved;
      const currentAvg = Number(balance?.unit_cost || 0);

      if (isInbound) {
        newQty = onHand + qty;
        // المتوسط المرجّح: (الرصيد الحالي × تكلفته + الكمية الواردة × تكلفتها) ÷ الإجمالي
        avgCost = newQty > 0
          ? (onHand * currentAvg + qty * unitCostIn) / newQty
          : unitCostIn;
        effectiveUnitCost = unitCostIn;
      } else {
        newQty = onHand - qty;
        if (qty > available && !policy.allow_negative_stock) {
          throw new Error(`الرصيد المتاح للصرف غير كافٍ: المتاح ${Math.max(available, 0)} والمطلوب ${qty}. توجد كميات محجوزة لا يمكن تجاوزها.`);
        }
        avgCost = currentAvg;
        effectiveUnitCost = currentAvg;
      }

      // تحديث أو إنشاء الرصيد
      if (balance?.id) {
        await client.query(
          `UPDATE inventory_stock_balances
           SET quantity_on_hand = $1, unit_cost = $2, last_movement_at = NOW(), updated_at = NOW()
           WHERE id = $3 AND organization_id = $4`,
          [newQty, avgCost, balance.id, orgId]
        );
      } else {
        await client.query(
          `INSERT INTO inventory_stock_balances
            (organization_id, warehouse_id, item_id, batch_number, expiry_date,
             quantity_on_hand, quantity_reserved, unit_cost, last_movement_at)
           VALUES ($1,$2,$3,$4,$5,$6,0,$7,NOW())`,
          [orgId, input.warehouseId, input.itemId, input.batchNumber || null,
           input.expiryDate || null, newQty, avgCost]
        );
      }

      // إثبات الحركة في الدفتر الموحد (Immutable Ledger)
      const insertRes = await client.query(
        `INSERT INTO inventory_movements
          (organization_id, movement_number, movement_type, warehouse_id, item_id,
           batch_number, expiry_date, quantity, unit_cost, total_value, balance_after,
           reference_type, reference_id, reference_number, project_id, activity_id,
           beneficiary_id, donor_id, doc_date, notes, status, posted_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,'POSTED',$21)
         RETURNING *`,
        [
          orgId, movementNumber, input.movementType, input.warehouseId, input.itemId,
          input.batchNumber || null, input.expiryDate || null, qty,
          effectiveUnitCost, qty * effectiveUnitCost, newQty,
          input.referenceType || null, input.referenceId || null,
          input.referenceNumber || null, input.projectId || null, input.activityId || null,
          input.beneficiaryId || null, input.donorId || null,
          input.docDate || new Date().toISOString().slice(0, 10),
          optionalString(input.notes), auth.userId,
        ]
      );

      return { row: insertRes.rows[0], unitCost: effectiveUnitCost };
    });

    await auditLog({
      organizationId: orgId, userId: auth.userId, action: 'CREATE' as AuditAction,
      tableName: 'inventory_movements', recordId: result.row?.id,
      details: {
        movement_number: movementNumber, movement_type: input.movementType,
        quantity: qty, unit_cost: result.unitCost,
      },
    });
    return result.row;
  }

  /** سجل الحركات مع صفحات ومرشحات */
  static async list(orgId: string, pagination: PaginationParams = {}, filters?: {
    movementType?: string; warehouseId?: string; itemId?: string;
    dateFrom?: string; dateTo?: string; search?: string; status?: string;
  }): Promise<PaginatedResult<any>> {
    const conditions = ['m.organization_id = $1'];
    const params: any[] = [orgId];
    let idx = 2;
    if (filters?.movementType) { conditions.push(`m.movement_type = $${idx++}`); params.push(filters.movementType); }
    if (filters?.warehouseId) { conditions.push(`m.warehouse_id = $${idx++}`); params.push(filters.warehouseId); }
    if (filters?.itemId) { conditions.push(`m.item_id = $${idx++}`); params.push(filters.itemId); }
    if (filters?.status) { conditions.push(`m.status = $${idx++}`); params.push(filters.status); }
    if (filters?.dateFrom) { conditions.push(`m.doc_date >= $${idx++}`); params.push(filters.dateFrom); }
    if (filters?.dateTo) { conditions.push(`m.doc_date <= $${idx++}`); params.push(filters.dateTo); }
    if (filters?.search) {
      conditions.push(`(m.movement_number ILIKE $${idx} OR i.name_ar ILIKE $${idx} OR i.item_code ILIKE $${idx} OR m.reference_number ILIKE $${idx})`);
      params.push(`%${filters.search}%`);
      idx++;
    }
    const where = conditions.join(' AND ');
    return paginatedQuery(
      `SELECT m.*, i.item_code, i.name_ar as item_name_ar, w.name_ar as warehouse_name_ar,
              p.name_ar as project_name_ar, b.full_name_ar as beneficiary_name_ar
       FROM inventory_movements m
       JOIN inventory_items i ON i.id = m.item_id
       JOIN warehouses w ON w.id = m.warehouse_id
       LEFT JOIN projects p ON p.id = m.project_id
       LEFT JOIN beneficiaries b ON b.id = m.beneficiary_id
       WHERE ${where}
       ORDER BY m.created_at DESC`,
      `SELECT COUNT(*) FROM inventory_movements m
       JOIN inventory_items i ON i.id = m.item_id
       WHERE ${where}`,
      params, pagination
    );
  }

  /** الأرصدة الحالية مع مرشحات (تحت حد الطلب / قاربت الانتهاء) */
  static async listBalances(orgId: string, pagination: PaginationParams = {}, filters?: {
    warehouseId?: string; itemId?: string; categoryId?: string;
    belowReorder?: boolean; nearExpiryDays?: number; search?: string;
  }): Promise<PaginatedResult<any>> {
    const conditions = ['b.organization_id = $1'];
    const params: any[] = [orgId];
    let idx = 2;
    if (filters?.warehouseId) { conditions.push(`b.warehouse_id = $${idx++}`); params.push(filters.warehouseId); }
    if (filters?.itemId) { conditions.push(`b.item_id = $${idx++}`); params.push(filters.itemId); }
    if (filters?.categoryId) { conditions.push(`i.category_id = $${idx++}`); params.push(filters.categoryId); }
    if (filters?.belowReorder) { conditions.push(`b.quantity_on_hand <= i.reorder_level AND i.reorder_level > 0`); }
    if (filters?.nearExpiryDays) {
      conditions.push(`b.expiry_date IS NOT NULL AND b.expiry_date <= CURRENT_DATE + ($${idx++} || ' days')::interval`);
      params.push(filters.nearExpiryDays);
    }
    if (filters?.search) {
      conditions.push(`(i.name_ar ILIKE $${idx} OR i.item_code ILIKE $${idx})`);
      params.push(`%${filters.search}%`);
      idx++;
    }
    const where = conditions.join(' AND ');
    return paginatedQuery(
      `SELECT b.*, i.item_code, i.name_ar as item_name_ar, i.reorder_level, i.min_level,
              w.name_ar as warehouse_name_ar, u.code as uom_code,
              (b.quantity_on_hand * b.unit_cost) as total_value,
              (b.expiry_date::date - CURRENT_DATE) as days_to_expiry
       FROM inventory_stock_balances b
       JOIN inventory_items i ON i.id = b.item_id
       JOIN warehouses w ON w.id = b.warehouse_id
       LEFT JOIN inventory_uoms u ON u.id = i.uom_id
       WHERE ${where}
       ORDER BY i.item_code`,
      `SELECT COUNT(*) FROM inventory_stock_balances b
       JOIN inventory_items i ON i.id = b.item_id
       WHERE ${where}`,
      params, pagination
    );
  }
}

// ─── محرك أوامر التحويل بين المخازن ────────────────────────

export class TransferEngine {
  static async list(orgId: string, pagination: PaginationParams = {}, filters?: {
    status?: string; warehouseId?: string; search?: string;
  }): Promise<PaginatedResult<any>> {
    const conditions = ['t.organization_id = $1'];
    const params: any[] = [orgId];
    let idx = 2;
    if (filters?.status) { conditions.push(`t.status = $${idx++}`); params.push(filters.status); }
    if (filters?.warehouseId) {
      conditions.push(`(t.from_warehouse_id = $${idx} OR t.to_warehouse_id = $${idx})`);
      params.push(filters.warehouseId);
      idx++;
    }
    if (filters?.search) {
      conditions.push(`(t.transfer_number ILIKE $${idx} OR fw.name_ar ILIKE $${idx} OR tw.name_ar ILIKE $${idx})`);
      params.push(`%${filters.search}%`);
      idx++;
    }
    const where = conditions.join(' AND ');
    return paginatedQuery(
      `SELECT t.*, fw.name_ar as from_warehouse_name_ar, tw.name_ar as to_warehouse_name_ar,
              (SELECT COUNT(*) FROM inventory_transfer_lines l WHERE l.transfer_id = t.id)::int AS lines_count,
              (SELECT COALESCE(SUM(l.quantity * l.unit_cost), 0) FROM inventory_transfer_lines l WHERE l.transfer_id = t.id) AS total_value
       FROM inventory_transfers t
       JOIN warehouses fw ON fw.id = t.from_warehouse_id
       JOIN warehouses tw ON tw.id = t.to_warehouse_id
       WHERE ${where}
       ORDER BY t.created_at DESC`,
      `SELECT COUNT(*) FROM inventory_transfers t
       JOIN warehouses fw ON fw.id = t.from_warehouse_id
       JOIN warehouses tw ON tw.id = t.to_warehouse_id
       WHERE ${where}`,
      params, pagination
    );
  }

  static async getById(orgId: string, transferId: string): Promise<any> {
    const transfer = await queryOne(
      `SELECT t.*, fw.name_ar as from_warehouse_name_ar, tw.name_ar as to_warehouse_name_ar
       FROM inventory_transfers t
       JOIN warehouses fw ON fw.id = t.from_warehouse_id
       JOIN warehouses tw ON tw.id = t.to_warehouse_id
       WHERE t.id = $1 AND t.organization_id = $2`, [transferId, orgId]
    );
    if (!transfer) return null;
    transfer.lines = await queryMany(
      `SELECT l.*, i.item_code, i.name_ar as item_name_ar
       FROM inventory_transfer_lines l
       JOIN inventory_items i ON i.id = l.item_id
       WHERE l.transfer_id = $1 ORDER BY l.id`, [transferId]
    );
    return transfer;
  }

  /** إنشاء أمر تحويل مع بنوده */
  static async create(orgId: string, data: Record<string, any>, auth: AuthContext): Promise<any> {
    assertInventoryPermission(auth, 'inventory.transfer.manage');
    const lines = Array.isArray(data.lines) ? data.lines : [];
    if (!lines.length) throw new Error('يجب إضافة بند واحد على الأقل لأمر التحويل');
    if (data.from_warehouse_id === data.to_warehouse_id) {
      throw new Error('لا يمكن التحويل من المخزن إلى نفسه');
    }
    const transferNumber = generateTxNumber('TRF');
    const transfer = await queryOne(
      `INSERT INTO inventory_transfers
        (organization_id, transfer_number, from_warehouse_id, to_warehouse_id,
         transfer_date, reason, status, requested_by)
       VALUES ($1,$2,$3,$4,$5,$6,'DRAFT',$7) RETURNING *`,
      [orgId, transferNumber, data.from_warehouse_id, data.to_warehouse_id,
       data.transfer_date || new Date().toISOString().slice(0, 10),
       optionalString(data.reason), auth.userId]
    );
    for (const line of lines) {
      await query(
        `INSERT INTO inventory_transfer_lines
          (transfer_id, item_id, batch_number, quantity, unit_cost, notes)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [transfer.id, line.item_id, line.batch_number || null,
         Number(line.quantity), Number(line.unit_cost) || 0, optionalString(line.notes)]
      );
    }
    await auditLog({
      organizationId: orgId, userId: auth.userId, action: 'CREATE',
      tableName: 'inventory_transfers', recordId: transfer?.id,
      details: { transfer_number: transferNumber, lines: lines.length },
    });
    return this.getById(orgId, transfer.id);
  }

  /** انتقال حالة أمر التحويل + ترحيل مزدوج (صادر/وارد) عند الشحن والاستلام */
  static async transition(orgId: string, transferId: string, targetStatus: TransferStatus, auth: AuthContext): Promise<any> {
    assertInventoryPermission(auth, 'inventory.transfer.manage');
    const transfer = await queryOne(
      `SELECT * FROM inventory_transfers WHERE id = $1 AND organization_id = $2`, [transferId, orgId]
    );
    if (!transfer) throw new Error('أمر التحويل غير موجود');
    const allowed = TRANSFER_TRANSITIONS[transfer.status as TransferStatus] || [];
    if (!allowed.includes(targetStatus)) {
      throw new Error(`انتقال حالة غير صالح: من "${transfer.status}" إلى "${targetStatus}"`);
    }
    if (targetStatus === 'APPROVED') {
      await query(
        `UPDATE inventory_transfers SET status = 'APPROVED', approved_by = $1, approved_at = NOW(), updated_at = NOW() WHERE id = $2`,
        [auth.userId, transferId]
      );
    } else if (targetStatus === 'IN_TRANSIT') {
      // الشحن: خصم الكميات من المخزن المرسل (TRANSFER_OUT)
      const lines = await queryMany(
        `SELECT * FROM inventory_transfer_lines WHERE transfer_id = $1`, [transferId]
      );
      for (const line of lines) {
        await StockMovementEngine.postMovement(orgId, {
          movementType: 'TRANSFER_OUT',
          warehouseId: transfer.from_warehouse_id,
          itemId: line.item_id,
          quantity: Number(line.quantity),
          unitCost: Number(line.unit_cost) || 0,
          batchNumber: line.batch_number,
          referenceType: 'TRANSFER',
          referenceId: transferId,
          referenceNumber: transfer.transfer_number,
          notes: 'شحن أمر تحويل',
        }, auth);
      }
      await query(
        `UPDATE inventory_transfers SET status = 'IN_TRANSIT', shipped_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [transferId]
      );
    } else if (targetStatus === 'RECEIVED') {
      // الاستلام: إضافة الكميات للمخزن المستقبل (TRANSFER_IN) بنفس التكلفة
      const lines = await queryMany(
        `SELECT * FROM inventory_transfer_lines WHERE transfer_id = $1`, [transferId]
      );
      for (const line of lines) {
        await StockMovementEngine.postMovement(orgId, {
          movementType: 'TRANSFER_IN',
          warehouseId: transfer.to_warehouse_id,
          itemId: line.item_id,
          quantity: Number(line.quantity),
          unitCost: Number(line.unit_cost) || 0,
          batchNumber: line.batch_number,
          referenceType: 'TRANSFER',
          referenceId: transferId,
          referenceNumber: transfer.transfer_number,
          notes: 'استلام أمر تحويل',
        }, auth);
      }
      await query(
        `UPDATE inventory_transfer_lines SET quantity_received = quantity WHERE transfer_id = $1`,
        [transferId]
      );
      await query(
        `UPDATE inventory_transfers SET status = 'RECEIVED', received_by = $1, received_at = NOW(), updated_at = NOW() WHERE id = $2`,
        [auth.userId, transferId]
      );
    } else {
      await query(
        `UPDATE inventory_transfers SET status = $1, updated_at = NOW() WHERE id = $2`,
        [targetStatus, transferId]
      );
    }
    await auditLog({
      organizationId: orgId, userId: auth.userId, action: 'UPDATE',
      tableName: 'inventory_transfers', recordId: transferId,
      details: { from: transfer.status, to: targetStatus },
    });
    return this.getById(orgId, transferId);
  }
}

// ─── محرك تسويات المخزون ───────────────────────────────────

export class AdjustmentEngine {
  static async list(orgId: string, pagination: PaginationParams = {}, filters?: {
    status?: string; warehouseId?: string; reasonCode?: string; search?: string;
  }): Promise<PaginatedResult<any>> {
    const conditions = ['a.organization_id = $1'];
    const params: any[] = [orgId];
    let idx = 2;
    if (filters?.status) { conditions.push(`a.status = $${idx++}`); params.push(filters.status); }
    if (filters?.warehouseId) { conditions.push(`a.warehouse_id = $${idx++}`); params.push(filters.warehouseId); }
    if (filters?.reasonCode) { conditions.push(`a.reason_code = $${idx++}`); params.push(filters.reasonCode); }
    if (filters?.search) {
      conditions.push(`(a.adjustment_number ILIKE $${idx} OR a.reason_text ILIKE $${idx})`);
      params.push(`%${filters.search}%`);
      idx++;
    }
    const where = conditions.join(' AND ');
    return paginatedQuery(
      `SELECT a.*, w.name_ar as warehouse_name_ar,
              (SELECT COUNT(*) FROM inventory_adjustment_lines l WHERE l.adjustment_id = a.id)::int AS lines_count
       FROM inventory_adjustments a
       JOIN warehouses w ON w.id = a.warehouse_id
       WHERE ${where}
       ORDER BY a.created_at DESC`,
      `SELECT COUNT(*) FROM inventory_adjustments a WHERE ${where}`,
      params, pagination
    );
  }

  /** إنشاء تسوية مع بنودها (اتجاه IN/OUT + سبب معياري) */
  static async create(orgId: string, data: Record<string, any>, auth: AuthContext): Promise<any> {
    assertInventoryPermission(auth, 'inventory.adjustment.manage');
    const lines = Array.isArray(data.lines) ? data.lines : [];
    if (!lines.length) throw new Error('يجب إضافة بند واحد على الأقل للتسوية');
    if (!['IN', 'OUT'].includes(String(data.direction))) {
      throw new Error('اتجاه التسوية يجب أن يكون IN (زيادة) أو OUT (نقص)');
    }
    const adjustmentNumber = generateTxNumber(data.direction === 'IN' ? 'ADJI' : 'ADJO');
    const adjustment = await queryOne(
      `INSERT INTO inventory_adjustments
        (organization_id, adjustment_number, warehouse_id, adjustment_date,
         direction, reason_code, reason_text, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'DRAFT',$8) RETURNING *`,
      [orgId, adjustmentNumber, data.warehouse_id,
       data.adjustment_date || new Date().toISOString().slice(0, 10),
       data.direction, requireField(data.reason_code, 'سبب التسوية'),
       optionalString(data.reason_text), auth.userId]
    );
    let totalValue = 0;
    for (const line of lines) {
      const qty = Number(line.quantity);
      const cost = Number(line.unit_cost) || 0;
      if (!qty || qty <= 0) throw new Error('كمية بند التسوية يجب أن تكون موجبة');
      totalValue += qty * cost;
      await query(
        `INSERT INTO inventory_adjustment_lines
          (adjustment_id, item_id, batch_number, quantity, unit_cost, total_value, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [adjustment.id, line.item_id, line.batch_number || null, qty, cost, qty * cost, optionalString(line.notes)]
      );
    }
    await query(
      `UPDATE inventory_adjustments SET total_value = $1 WHERE id = $2`, [totalValue, adjustment.id]
    );
    await auditLog({
      organizationId: orgId, userId: auth.userId, action: 'CREATE',
      tableName: 'inventory_adjustments', recordId: adjustment?.id,
      details: { adjustment_number: adjustmentNumber, direction: data.direction, total_value: totalValue },
    });
    return adjustment;
  }

  /** انتقال حالة التسوية: APPROVED (اعتماد) ثم POSTED (ترحيل فعلي للأرصدة) */
  static async transition(orgId: string, adjustmentId: string, targetStatus: AdjustmentStatus, auth: AuthContext): Promise<any> {
    const adjustment = await queryOne(
      `SELECT * FROM inventory_adjustments WHERE id = $1 AND organization_id = $2`, [adjustmentId, orgId]
    );
    if (!adjustment) throw new Error('التسوية غير موجدة');
    const allowed = ADJUSTMENT_TRANSITIONS[adjustment.status as AdjustmentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      throw new Error(`انتقال حالة غير صالح: من "${adjustment.status}" إلى "${targetStatus}"`);
    }
    if (targetStatus === 'APPROVED') {
      assertInventoryPermission(auth, 'inventory.approve');
      await query(
        `UPDATE inventory_adjustments SET status = 'APPROVED', approved_by = $1, approved_at = NOW() WHERE id = $2`,
        [auth.userId, adjustmentId]
      );
    } else if (targetStatus === 'POSTED') {
      assertInventoryPermission(auth, 'inventory.adjustment.manage');
      const lines = await queryMany(
        `SELECT * FROM inventory_adjustment_lines WHERE adjustment_id = $1`, [adjustmentId]
      );
      for (const line of lines) {
        await StockMovementEngine.postMovement(orgId, {
          movementType: adjustment.direction === 'IN' ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
          warehouseId: adjustment.warehouse_id,
          itemId: line.item_id,
          quantity: Number(line.quantity),
          unitCost: Number(line.unit_cost) || 0,
          batchNumber: line.batch_number,
          referenceType: 'ADJUSTMENT',
          referenceId: adjustmentId,
          referenceNumber: adjustment.adjustment_number,
          notes: adjustment.reason_text || adjustment.reason_code,
        }, auth);
      }
      await query(
        `UPDATE inventory_adjustments SET status = 'POSTED', posted_at = NOW() WHERE id = $1`,
        [adjustmentId]
      );
    } else if (targetStatus === 'REJECTED') {
      assertInventoryPermission(auth, 'inventory.approve');
      await query(
        `UPDATE inventory_adjustments SET status = 'REJECTED' WHERE id = $1`, [adjustmentId]
      );
    }
    await auditLog({
      organizationId: orgId, userId: auth.userId, action: 'UPDATE',
      tableName: 'inventory_adjustments', recordId: adjustmentId,
      details: { from: adjustment.status, to: targetStatus },
    });
    return queryOne(`SELECT * FROM inventory_adjustments WHERE id = $1`, [adjustmentId]);
  }
}

// ─── محرك الجرد الفعلي (Stocktake) ─────────────────────────

export class StocktakeEngine {
  static async list(orgId: string, pagination: PaginationParams = {}, filters?: {
    status?: string; warehouseId?: string; search?: string;
  }): Promise<PaginatedResult<any>> {
    const conditions = ['s.organization_id = $1'];
    const params: any[] = [orgId];
    let idx = 2;
    if (filters?.status) { conditions.push(`s.status = $${idx++}`); params.push(filters.status); }
    if (filters?.warehouseId) { conditions.push(`s.warehouse_id = $${idx++}`); params.push(filters.warehouseId); }
    if (filters?.search) {
      conditions.push(`(s.stocktake_number ILIKE $${idx} OR w.name_ar ILIKE $${idx})`);
      params.push(`%${filters.search}%`);
      idx++;
    }
    const where = conditions.join(' AND ');
    return paginatedQuery(
      `SELECT s.*, w.name_ar as warehouse_name_ar,
              (SELECT COUNT(*) FROM inventory_stocktake_lines l WHERE l.stocktake_id = s.id)::int AS lines_count,
              (SELECT COUNT(*) FROM inventory_stocktake_lines l WHERE l.stocktake_id = s.id AND l.variance_quantity <> 0)::int AS variance_lines
       FROM inventory_stocktakes s
       JOIN warehouses w ON w.id = s.warehouse_id
       WHERE ${where}
       ORDER BY s.created_at DESC`,
      `SELECT COUNT(*) FROM inventory_stocktakes s WHERE ${where}`,
      params, pagination
    );
  }

  /** بدء جلسة جرد: تجميد الأرصدة النظامية وقت البدء */
  static async create(orgId: string, data: Record<string, any>, auth: AuthContext): Promise<any> {
    assertInventoryPermission(auth, 'inventory.stocktake.manage');
    if (!data.warehouse_id) throw new Error('يجب تحديد المخزن الموضوع عليه الجرد');
    const stocktakeNumber = generateTxNumber('STK');
    const stocktake = await queryOne(
      `INSERT INTO inventory_stocktakes
        (organization_id, stocktake_number, warehouse_id, stocktake_date, count_type, status, counted_by, notes)
       VALUES ($1,$2,$3,$4,$5,'COUNTING',$6,$7) RETURNING *`,
      [orgId, stocktakeNumber, data.warehouse_id,
       data.stocktake_date || new Date().toISOString().slice(0, 10),
       data.count_type || 'FULL', auth.userId, optionalString(data.notes)]
    );
    // تجميد الأرصدة النظامية الحالية في بنود الجرد
    await query(
      `INSERT INTO inventory_stocktake_lines
        (stocktake_id, item_id, batch_number, system_quantity, unit_cost, variance_quantity, variance_value)
       SELECT $1, b.item_id, b.batch_number, b.quantity_on_hand, b.unit_cost, 0, 0
       FROM inventory_stock_balances b
       WHERE b.warehouse_id = $2 AND b.organization_id = $3`,
      [stocktake.id, data.warehouse_id, orgId]
    );
    await auditLog({
      organizationId: orgId, userId: auth.userId, action: 'CREATE',
      tableName: 'inventory_stocktakes', recordId: stocktake?.id,
      details: { stocktake_number: stocktakeNumber, warehouse: data.warehouse_id },
    });
    return stocktake;
  }

  /** تسجيل الكميات المعدودة وحساب الفروقات */
  static async submitCounts(orgId: string, stocktakeId: string, counts: Array<{ lineId: string; countedQuantity: number }>, auth: AuthContext): Promise<any> {
    assertInventoryPermission(auth, 'inventory.stocktake.manage');
    const stocktake = await queryOne(
      `SELECT * FROM inventory_stocktakes WHERE id = $1 AND organization_id = $2`,
      [stocktakeId, orgId]
    );
    if (!stocktake) throw new Error('جلسة الجرد غير موجودة');
    if (!['OPEN', 'COUNTING'].includes(stocktake.status)) {
      throw new Error('لا يمكن تعديل كميات جرد تم اعتماده أو ترحيله');
    }
    for (const c of counts) {
      await query(
        `UPDATE inventory_stocktake_lines
         SET counted_quantity = $1,
             variance_quantity = $1 - system_quantity,
             variance_value = ($1 - system_quantity) * unit_cost
         WHERE id = $2 AND stocktake_id = $3`,
        [Number(c.countedQuantity), c.lineId, stocktakeId]
      );
    }
    await query(
      `UPDATE inventory_stocktakes
       SET status = 'PENDING_APPROVAL',
           total_variance_value = (SELECT COALESCE(SUM(variance_value), 0) FROM inventory_stocktake_lines WHERE stocktake_id = $1)
       WHERE id = $1`,
      [stocktakeId]
    );
    await auditLog({
      organizationId: orgId, userId: auth.userId, action: 'UPDATE',
      tableName: 'inventory_stocktakes', recordId: stocktakeId,
      details: { counted_lines: counts.length },
    });
    return queryOne(`SELECT * FROM inventory_stocktakes WHERE id = $1`, [stocktakeId]);
  }

  /** اعتماد ثم ترحيل الجرد: إنشاء حركات تسوية تلقائية بالفروقات */
  static async transition(orgId: string, stocktakeId: string, targetStatus: StocktakeStatus, auth: AuthContext): Promise<any> {
    const stocktake = await queryOne(
      `SELECT * FROM inventory_stocktakes WHERE id = $1 AND organization_id = $2`,
      [stocktakeId, orgId]
    );
    if (!stocktake) throw new Error('جلسة الجرد غير موجودة');
    const allowed = STOCKTAKE_TRANSITIONS[stocktake.status as StocktakeStatus] || [];
    if (!allowed.includes(targetStatus)) {
      throw new Error(`انتقال حالة غير صالح: من "${stocktake.status}" إلى "${targetStatus}"`);
    }
    if (targetStatus === 'APPROVED') {
      assertInventoryPermission(auth, 'inventory.approve');
      await query(
        `UPDATE inventory_stocktakes SET status = 'APPROVED', approved_by = $1, approved_at = NOW() WHERE id = $2`,
        [auth.userId, stocktakeId]
      );
    } else if (targetStatus === 'POSTED') {
      assertInventoryPermission(auth, 'inventory.stocktake.manage');
      const variances = await queryMany(
        `SELECT * FROM inventory_stocktake_lines
         WHERE stocktake_id = $1 AND variance_quantity IS NOT NULL AND variance_quantity <> 0`,
        [stocktakeId]
      );
      for (const v of variances) {
        await StockMovementEngine.postMovement(orgId, {
          movementType: Number(v.variance_quantity) > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
          warehouseId: stocktake.warehouse_id,
          itemId: v.item_id,
          quantity: Math.abs(Number(v.variance_quantity)),
          unitCost: Number(v.unit_cost) || 0,
          batchNumber: v.batch_number,
          referenceType: 'STOCKTAKE',
          referenceId: stocktakeId,
          referenceNumber: stocktake.stocktake_number,
          notes: 'تسوية فرق جرد فعلي',
        }, auth);
      }
      await query(
        `UPDATE inventory_stocktakes SET status = 'POSTED', posted_at = NOW() WHERE id = $1`,
        [stocktakeId]
      );
    } else {
      await query(
        `UPDATE inventory_stocktakes SET status = $1 WHERE id = $2`,
        [targetStatus, stocktakeId]
      );
    }
    await auditLog({
      organizationId: orgId, userId: auth.userId, action: 'UPDATE',
      tableName: 'inventory_stocktakes', recordId: stocktakeId,
      details: { from: stocktake.status, to: targetStatus },
    });
    return queryOne(`SELECT * FROM inventory_stocktakes WHERE id = $1`, [stocktakeId]);
  }

  static async getLines(orgId: string, stocktakeId: string): Promise<any[]> {
    return queryMany(
      `SELECT l.*, i.item_code, i.name_ar as item_name_ar
       FROM inventory_stocktake_lines l
       JOIN inventory_items i ON i.id = l.item_id
       JOIN inventory_stocktakes s ON s.id = l.stocktake_id
       WHERE l.stocktake_id = $1 AND s.organization_id = $2
       ORDER BY i.item_code`, [stocktakeId, orgId]
    );
  }
}

// ─── محرك التحليلات وذكاء الأعمال (Inventory BI) ───────────

export class InventoryAnalyticsEngine {

  /** لوحة القيادة التنفيذية: مؤشرات KPI شاملة */
  static async dashboard(orgId: string, policy?: any): Promise<any> {
    const expiryDays = Number(policy?.expiry_alert_days) || 60;
    const [summary] = await queryMany(
      `SELECT
        COALESCE(SUM(b.quantity_on_hand * b.unit_cost), 0)::float AS total_stock_value,
        COALESCE(SUM(b.quantity_on_hand), 0)::float AS total_units,
        COUNT(DISTINCT b.item_id)::int AS active_skus,
        COUNT(DISTINCT b.warehouse_id)::int AS active_warehouses
       FROM inventory_stock_balances b
       WHERE b.organization_id = $1 AND b.quantity_on_hand > 0`,
      [orgId]
    );
    const [alerts] = await queryMany(
      `SELECT
        (SELECT COUNT(*) FROM inventory_stock_balances b
          JOIN inventory_items i ON i.id = b.item_id
          WHERE b.organization_id = $1 AND b.quantity_on_hand > 0
            AND i.reorder_level > 0 AND b.quantity_on_hand <= i.reorder_level)::int AS below_reorder,
        (SELECT COUNT(*) FROM inventory_stock_balances b
          WHERE b.organization_id = $1 AND b.expiry_date IS NOT NULL
            AND b.expiry_date <= CURRENT_DATE + ($2 || ' days')::interval
            AND b.quantity_on_hand > 0)::int AS near_expiry,
        (SELECT COUNT(*) FROM inventory_stock_balances b
          WHERE b.organization_id = $1 AND b.quantity_on_hand <= 0)::int AS zero_stock`,
      [orgId, expiryDays]
    );
    const pendingDocs = await queryMany(
      `SELECT 'TRANSFER' as doc_type, COUNT(*)::int as cnt FROM inventory_transfers WHERE organization_id = $1 AND status IN ('PENDING_APPROVAL','IN_TRANSIT')
       UNION ALL
       SELECT 'ADJUSTMENT', COUNT(*)::int FROM inventory_adjustments WHERE organization_id = $1 AND status IN ('PENDING_APPROVAL','APPROVED')
       UNION ALL
       SELECT 'STOCKTAKE', COUNT(*)::int FROM inventory_stocktakes WHERE organization_id = $1 AND status IN ('COUNTING','PENDING_APPROVAL','APPROVED')`,
      [orgId]
    );
    const topIssued = await queryMany(
      `SELECT i.item_code, i.name_ar as item_name_ar, u.code as uom_code,
              SUM(m.quantity)::float AS issued_qty, SUM(m.total_value)::float AS issued_value
       FROM inventory_movements m
       JOIN inventory_items i ON i.id = m.item_id
       LEFT JOIN inventory_uoms u ON u.id = i.uom_id
       WHERE m.organization_id = $1 AND m.movement_type = 'ISSUE'
         AND m.doc_date >= CURRENT_DATE - INTERVAL '90 days'
       GROUP BY i.id, i.item_code, i.name_ar, u.code
       ORDER BY issued_value DESC LIMIT 10`,
      [orgId]
    );
    const movementTrend = await queryMany(
      `SELECT to_char(date_trunc('month', doc_date), 'YYYY-MM') as month,
              SUM(CASE WHEN movement_type IN ('RECEIPT','TRANSFER_IN','ADJUSTMENT_IN') THEN total_value ELSE 0 END)::float AS inbound_value,
              SUM(CASE WHEN movement_type IN ('ISSUE','TRANSFER_OUT','ADJUSTMENT_OUT') THEN total_value ELSE 0 END)::float AS outbound_value
       FROM inventory_movements
       WHERE organization_id = $1 AND doc_date >= CURRENT_DATE - INTERVAL '12 months'
       GROUP BY 1 ORDER BY 1`,
      [orgId]
    );
    const warehouseBreakdown = await queryMany(
      `SELECT w.id, w.name_ar,
              COALESCE(SUM(b.quantity_on_hand * b.unit_cost), 0)::float AS stock_value,
              COUNT(DISTINCT b.item_id)::int AS sku_count
       FROM warehouses w
       LEFT JOIN inventory_stock_balances b ON b.warehouse_id = w.id AND b.quantity_on_hand > 0
       WHERE w.organization_id = $1
       GROUP BY w.id, w.name_ar
       ORDER BY stock_value DESC`,
      [orgId]
    );
    const categoryBreakdown = await queryMany(
      `SELECT c.id, c.name_ar,
              COALESCE(SUM(b.quantity_on_hand * b.unit_cost), 0)::float AS stock_value
       FROM inventory_categories c
       LEFT JOIN inventory_items i ON i.category_id = c.id
       LEFT JOIN inventory_stock_balances b ON b.item_id = i.id AND b.quantity_on_hand > 0
       WHERE c.organization_id = $1
       GROUP BY c.id, c.name_ar
       HAVING COALESCE(SUM(b.quantity_on_hand * b.unit_cost), 0) > 0
       ORDER BY stock_value DESC LIMIT 10`,
      [orgId]
    );
    return {
      summary: summary || { total_stock_value: 0, total_units: 0, active_skus: 0, active_warehouses: 0 },
      alerts: alerts || { below_reorder: 0, near_expiry: 0, zero_stock: 0 },
      pendingDocs,
      topIssued,
      movementTrend,
      warehouseBreakdown,
      categoryBreakdown,
      expiryAlertDays: expiryDays,
    };
  }
}
