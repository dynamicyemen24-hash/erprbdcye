/**
 * UAMEX ERP™ — NEB-05/NEB-09: Inventory & Warehouse OS
 * Domain Types & Standard Methodology — وحدة المخازن: المنهجية المعيارية
 *
 * Organization: جمعية رُحماء بينهم للعمل الإنساني والتنمية
 * System: UAMEX ERP™ Intelligent Enterprise Operating System
 */

// ─── أنواع الحركات المعيارية ───────────────────────────────

export type InventoryMovementType =
  | 'RECEIPT'          // استلام (شراء / تبرع عيني / مرتجع)
  | 'ISSUE'            // صرف (مشاريع / مستفيدين / تشغيل)
  | 'TRANSFER_IN'      // تحويل وارد
  | 'TRANSFER_OUT'     // تحويل صادر
  | 'ADJUSTMENT_IN'    // تسوية بالزيادة
  | 'ADJUSTMENT_OUT';  // تسوية بالنقص

export const INBOUND_MOVEMENT_TYPES: InventoryMovementType[] = [
  'RECEIPT', 'TRANSFER_IN', 'ADJUSTMENT_IN',
];
export const OUTBOUND_MOVEMENT_TYPES: InventoryMovementType[] = [
  'ISSUE', 'TRANSFER_OUT', 'ADJUSTMENT_OUT',
];

// ─── طرق التقييم المعيارية ─────────────────────────────────

export type InventoryCostingMethod = 'WEIGHTED_AVERAGE' | 'FIFO';

// ─── حالات مستندات المخزون ─────────────────────────────────

export type InventoryDocStatus =
  | 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED'
  | 'POSTED' | 'REJECTED' | 'VOID';

export type TransferStatus =
  | 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED'
  | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';

export type StocktakeStatus =
  | 'OPEN' | 'COUNTING' | 'PENDING_APPROVAL'
  | 'APPROVED' | 'POSTED' | 'CANCELLED';

export type AdjustmentStatus =
  | 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED'
  | 'POSTED' | 'REJECTED';

/** انتقالات الحالة المعيارية لأوامر التحويل */
export const TRANSFER_TRANSITIONS: Record<TransferStatus, TransferStatus[]> = {
  DRAFT: ['PENDING_APPROVAL', 'CANCELLED'],
  PENDING_APPROVAL: ['APPROVED', 'DRAFT', 'CANCELLED'],
  APPROVED: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['RECEIVED'],
  RECEIVED: [],
  CANCELLED: [],
};

/** انتقالات الحالة المعيارية للتسويات */
export const ADJUSTMENT_TRANSITIONS: Record<AdjustmentStatus, AdjustmentStatus[]> = {
  DRAFT: ['PENDING_APPROVAL'],
  PENDING_APPROVAL: ['APPROVED', 'REJECTED'],
  APPROVED: ['POSTED'],
  POSTED: [],
  REJECTED: [],
};

/** انتقالات الحالة المعيارية للجرد */
export const STOCKTAKE_TRANSITIONS: Record<StocktakeStatus, StocktakeStatus[]> = {
  OPEN: ['COUNTING', 'CANCELLED'],
  COUNTING: ['PENDING_APPROVAL', 'CANCELLED'],
  PENDING_APPROVAL: ['APPROVED', 'COUNTING'],
  APPROVED: ['POSTED'],
  POSTED: [],
  CANCELLED: [],
};

// ─── رموز أسباب التسوية المعيارية ──────────────────────────

export type AdjustmentReasonCode =
  | 'DAMAGE' | 'EXPIRY' | 'LOSS' | 'THEFT'
  | 'COUNT_CORRECTION' | 'REVALUATION' | 'DONATION_RETURN' | 'OTHER';

export const ADJUSTMENT_REASON_LABELS: Record<AdjustmentReasonCode, { ar: string; en: string }> = {
  DAMAGE: { ar: 'تلف', en: 'Damage' },
  EXPIRY: { ar: 'انتهاء صلاحية', en: 'Expiry' },
  LOSS: { ar: 'فقدان', en: 'Loss' },
  THEFT: { ar: 'سرقة', en: 'Theft' },
  COUNT_CORRECTION: { ar: 'تصحيح فرق جرد', en: 'Count Correction' },
  REVALUATION: { ar: 'إعادة تقييم', en: 'Revaluation' },
  DONATION_RETURN: { ar: 'مرتجع تبرع', en: 'Donation Return' },
  OTHER: { ar: 'أخرى', en: 'Other' },
};

// ─── أنواع الأصناف ─────────────────────────────────────────

export type ItemType = 'STOCK' | 'CONSUMABLE' | 'ASSET_SPARE' | 'DONATION_GOODS';

// ─── مفاتيح الصلاحيات المعيارية للوحدة ─────────────────────

export type InventoryPermissionKey =
  | 'inventory.view'
  | 'inventory.items.manage'
  | 'inventory.warehouses.manage'
  | 'inventory.receipt.post'
  | 'inventory.issue.post'
  | 'inventory.transfer.manage'
  | 'inventory.adjustment.manage'
  | 'inventory.stocktake.manage'
  | 'inventory.policies.manage'
  | 'inventory.approve';

export const INVENTORY_ROLE_PERMISSIONS: Record<string, InventoryPermissionKey[]> = {
  admin: ['inventory.view', 'inventory.items.manage', 'inventory.warehouses.manage', 'inventory.receipt.post', 'inventory.issue.post', 'inventory.transfer.manage', 'inventory.adjustment.manage', 'inventory.stocktake.manage', 'inventory.policies.manage', 'inventory.approve'],
  finance_manager: ['inventory.view', 'inventory.approve', 'inventory.policies.manage'],
  warehouse_keeper: ['inventory.view', 'inventory.receipt.post', 'inventory.issue.post', 'inventory.transfer.manage', 'inventory.stocktake.manage'],
  auditor: ['inventory.view'],
  project_manager: ['inventory.view', 'inventory.issue.post'],
};

// ─── أنواع الواجهة المشتركة ────────────────────────────────

export interface InventoryItemDTO {
  id: string;
  item_code: string;
  name_ar: string;
  name_en?: string | null;
  category_id?: string | null;
  category_name_ar?: string | null;
  uom_id?: string | null;
  uom_code?: string | null;
  item_type?: ItemType;
  valuation_method?: InventoryCostingMethod;
  min_level?: number;
  max_level?: number;
  reorder_level?: number;
  standard_cost?: number;
  status?: string;
  barcode?: string | null;
  is_batch_tracked?: boolean;
  shelf_life_days?: number | null;
}

export interface StockBalanceDTO {
  id: string;
  warehouse_id: string;
  warehouse_name_ar?: string;
  item_id: string;
  item_code?: string;
  item_name_ar?: string;
  batch_number?: string | null;
  expiry_date?: string | null;
  quantity_on_hand: number;
  quantity_reserved: number;
  unit_cost: number;
  total_value: number;
  days_to_expiry?: number | null;
}

export interface MovementDTO {
  id: string;
  movement_number: string;
  movement_type: InventoryMovementType;
  warehouse_id: string;
  warehouse_name_ar?: string;
  item_id: string;
  item_code?: string;
  item_name_ar?: string;
  quantity: number;
  unit_cost: number;
  total_value: number;
  balance_after?: number | null;
  reference_type?: string | null;
  reference_number?: string | null;
  project_name_ar?: string | null;
  beneficiary_name_ar?: string | null;
  doc_date: string;
  status: InventoryDocStatus;
  notes?: string | null;
}

// ─── تسميات واجهة معيارية ثنائية اللغة ─────────────────────

export const MOVEMENT_TYPE_LABELS: Record<InventoryMovementType, { ar: string; en: string }> = {
  RECEIPT: { ar: 'استلام', en: 'Receipt' },
  ISSUE: { ar: 'صرف', en: 'Issue' },
  TRANSFER_IN: { ar: 'تحويل وارد', en: 'Transfer In' },
  TRANSFER_OUT: { ar: 'تحويل صادر', en: 'Transfer Out' },
  ADJUSTMENT_IN: { ar: 'تسوية بالزيادة', en: 'Adjustment In' },
  ADJUSTMENT_OUT: { ar: 'تسوية بالنقص', en: 'Adjustment Out' },
};

export const INVENTORY_STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  DRAFT: { ar: 'مسودة', en: 'Draft' },
  PENDING_APPROVAL: { ar: 'بانتظار الاعتماد', en: 'Pending Approval' },
  APPROVED: { ar: 'معتمد', en: 'Approved' },
  POSTED: { ar: 'مُرحّل', en: 'Posted' },
  REJECTED: { ar: 'مرفوض', en: 'Rejected' },
  VOID: { ar: 'ملغى', en: 'Void' },
  IN_TRANSIT: { ar: 'قيد النقل', en: 'In Transit' },
  RECEIVED: { ar: 'مستلم', en: 'Received' },
  CANCELLED: { ar: 'ملغي', en: 'Cancelled' },
  OPEN: { ar: 'مفتوح', en: 'Open' },
  COUNTING: { ar: 'قيد العد', en: 'Counting' },
};
