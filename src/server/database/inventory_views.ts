/**
 * UAMEX ERP™ — NEB-05/NEB-09: Inventory Analytical Views (Live Database)
 * فيوز تحليلية معيارية تُغذّي التقارير وذكاء الأعمال لوحدة المخازن.
 * كل الفيوز Idempotent (CREATE OR REPLACE) ومتوافقة مع المخطط الحي.
 */

import pg from 'pg';
import { logger } from '../core/logger';

const VIEW_STATEMENTS: string[] = [
  // 1) المخزون الحالي الموحد (الرصيد × الصنف × المخزن)
  `CREATE OR REPLACE VIEW v_inv_stock_current AS
   SELECT b.organization_id, b.warehouse_id, w.name_ar AS warehouse_name_ar, w.code AS warehouse_code,
          b.item_id, i.item_code, i.name_ar AS item_name_ar, i.name_en AS item_name_en,
          i.category_code, i.item_type, i.default_unit_code, i.requires_expiry_date,
          b.batch_number, b.expiry_date, b.unit_code,
          b.quantity_on_hand, b.quantity_reserved,
          (b.quantity_on_hand - b.quantity_reserved) AS quantity_available,
          b.unit_cost, (b.quantity_on_hand * b.unit_cost) AS total_value,
          i.minimum_stock_level, i.reorder_point,
          (i.reorder_point > 0 AND b.quantity_on_hand <= i.reorder_point) AS is_below_reorder,
          (i.minimum_stock_level > 0 AND b.quantity_on_hand <= i.minimum_stock_level) AS is_below_minimum,
          (b.expiry_date IS NOT NULL AND b.expiry_date <= CURRENT_DATE + INTERVAL '30 days') AS is_near_expiry,
          (b.expiry_date IS NOT NULL AND b.expiry_date < CURRENT_DATE) AS is_expired,
          b.last_movement_at
   FROM inventory_stock_balances b
   JOIN inventory_items i ON i.id = b.item_id AND i.deleted_at IS NULL
   JOIN warehouses w ON w.id = b.warehouse_id AND w.deleted_at IS NULL
   WHERE b.deleted_at IS NULL`,

  // 2) تنبيهات الصلاحية (دفعات تقارب أو تجاوزت الانتهاء)
  `CREATE OR REPLACE VIEW v_inv_expiry_alerts AS
   SELECT b.organization_id, b.warehouse_id, w.name_ar AS warehouse_name_ar,
          b.item_id, i.item_code, i.name_ar AS item_name_ar,
          b.batch_number, b.expiry_date, b.quantity_on_hand, b.unit_cost,
          (b.quantity_on_hand * b.unit_cost) AS value_at_risk,
          (b.expiry_date - CURRENT_DATE) AS days_to_expiry,
          CASE
            WHEN b.expiry_date < CURRENT_DATE THEN 'expired'
            WHEN b.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'critical'
            WHEN b.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'warning'
            ELSE 'notice'
          END AS severity
   FROM inventory_stock_balances b
   JOIN inventory_items i ON i.id = b.item_id AND i.deleted_at IS NULL
   JOIN warehouses w ON w.id = b.warehouse_id
   WHERE b.deleted_at IS NULL AND b.expiry_date IS NOT NULL
     AND b.quantity_on_hand > 0
     AND b.expiry_date <= CURRENT_DATE + INTERVAL '60 days'`,

  // 3) تنبيهات إعادة الطلب (تحت نقطة الطلب / الحد الأدنى)
  `CREATE OR REPLACE VIEW v_inv_reorder_alerts AS
   SELECT s.organization_id, s.warehouse_id, w.name_ar AS warehouse_name_ar,
          s.item_id, i.item_code, i.name_ar AS item_name_ar, i.category_code,
          s.quantity_on_hand, i.minimum_stock_level, i.reorder_point, i.maximum_stock_level,
          i.standard_unit_cost,
          GREATEST(i.reorder_point - s.quantity_on_hand, 0) AS suggested_order_qty,
          CASE
            WHEN s.quantity_on_hand <= i.minimum_stock_level THEN 'critical'
            WHEN s.quantity_on_hand <= i.reorder_point THEN 'warning'
            ELSE 'notice'
          END AS severity
   FROM (
     SELECT organization_id, warehouse_id, item_id, SUM(quantity_on_hand) AS quantity_on_hand
     FROM inventory_stock_balances
     WHERE deleted_at IS NULL
     GROUP BY organization_id, warehouse_id, item_id
   ) s
   JOIN inventory_items i ON i.id = s.item_id AND i.deleted_at IS NULL
   JOIN warehouses w ON w.id = s.warehouse_id
   WHERE i.reorder_point > 0 AND s.quantity_on_hand <= i.reorder_point`,

  // 4) حركة المخزون الشهرية (تحليلي: وارد/صادر/صافي لكل صنف)
  `CREATE OR REPLACE VIEW v_inv_movements_monthly AS
   SELECT m.organization_id, m.item_id, i.item_code, i.name_ar AS item_name_ar,
          date_trunc('month', m.movement_date)::date AS period_month,
          SUM(CASE WHEN m.movement_type IN ('receipt','transfer_in','adjustment_in') THEN m.quantity ELSE 0 END) AS inbound_qty,
          SUM(CASE WHEN m.movement_type IN ('issue','transfer_out','adjustment_out') THEN m.quantity ELSE 0 END) AS outbound_qty,
          SUM(CASE WHEN m.movement_type IN ('receipt','transfer_in','adjustment_in') THEN m.total_cost ELSE 0 END) AS inbound_value,
          SUM(CASE WHEN m.movement_type IN ('issue','transfer_out','adjustment_out') THEN m.total_cost ELSE 0 END) AS outbound_value,
          COUNT(*) AS movement_count
   FROM inventory_movements m
   JOIN inventory_items i ON i.id = m.item_id
   WHERE m.deleted_at IS NULL AND m.status_code = 'posted'
   GROUP BY m.organization_id, m.item_id, i.item_code, i.name_ar, date_trunc('month', m.movement_date)`,

  // 5) تقييم المخزون حسب المخزن (تقرير القيمة)
  `CREATE OR REPLACE VIEW v_inv_valuation_by_warehouse AS
   SELECT b.organization_id, b.warehouse_id, w.name_ar AS warehouse_name_ar, w.code AS warehouse_code,
          COUNT(DISTINCT b.item_id) AS sku_count,
          SUM(b.quantity_on_hand) AS total_quantity,
          SUM(b.quantity_on_hand * b.unit_cost) AS total_value,
          SUM(CASE WHEN b.expiry_date IS NOT NULL AND b.expiry_date < CURRENT_DATE
                   THEN b.quantity_on_hand * b.unit_cost ELSE 0 END) AS expired_value
   FROM inventory_stock_balances b
   JOIN warehouses w ON w.id = b.warehouse_id
   WHERE b.deleted_at IS NULL
   GROUP BY b.organization_id, b.warehouse_id, w.name_ar, w.code`,
];

export async function runInventoryViews(pool?: pg.Pool): Promise<void> {
  const ownsPool = !pool;
  const p = pool ?? new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2,
    connectionTimeoutMillis: 30000,
    ssl: { rejectUnauthorized: false },
  });
  const client = await p.connect();
  try {
    await client.query('BEGIN');
    for (const ddl of VIEW_STATEMENTS) {
      await client.query(ddl);
    }
    await client.query('COMMIT');
    logger.info('[Inventory Views] 5 analytical views ensured', { context: 'inventory-migration' });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch { /* noop */ }
    logger.error(`[Inventory Views] FAILED: ${err instanceof Error ? err.message : err}`, { context: 'inventory-migration' });
    throw err;
  } finally {
    client.release();
    if (ownsPool) await p.end();
  }
}

// التشغيل المباشر: npx tsx src/server/database/inventory_views.ts
const isDirectRun = process.argv[1] && process.argv[1].replace(/\\/g, '/').includes('inventory_views');
if (isDirectRun) {
  const { config } = await import('dotenv');
  config();
  runInventoryViews()
    .then(() => { console.log('INVENTORY_VIEWS_OK'); process.exit(0); })
    .catch((e: unknown) => { console.error('INVENTORY_VIEWS_FAILED', e); process.exit(1); });
}
