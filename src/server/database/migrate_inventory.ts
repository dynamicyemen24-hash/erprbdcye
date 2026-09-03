/**
 * UAMEX ERP™ — NEB-05/NEB-09: Inventory Migration (Live Database)
 * هجرة العمود الفقري لوحدة المخازن على قاعدة البيانات السحابية الحية.
 *
 * تضيف المكونات المفقودة فقط (Idempotent):
 * 1. inventory_movements   — دفتر الحركات الموحد غير القابل للتعديل
 * 2. inventory_stock_balances — أرصدة المخزون الفورية (item × warehouse × batch)
 * 3. inventory_policies    — سياسات وإعدادات الوحدة لكل منظمة
 *
 * الالتزام: مطابقة كاملة لمعايير المخطط الحي
 * (status_code بأحرف صغيرة، metadata jsonb، أعمدة الحوكمة القياسية)
 */

import pg from 'pg';
import { logger } from '../core/logger';

const GOVERNANCE_COLS = `
  security_level INT NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  is_demo BOOLEAN DEFAULT FALSE,
  data_classification VARCHAR(30) DEFAULT 'PRODUCTION',
  verification_status VARCHAR(30) DEFAULT 'VERIFIED'`;

const DDL_STATEMENTS: string[] = [
  // ─── 1) دفتر الحركات الموحد (العمود الفقري للتتبع والتدقيق) ───
  `CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    movement_number VARCHAR(40) NOT NULL,
    movement_type VARCHAR(30) NOT NULL,
    warehouse_id UUID NOT NULL,
    item_id UUID NOT NULL,
    batch_number VARCHAR(60),
    expiry_date DATE,
    quantity NUMERIC(18,4) NOT NULL,
    unit_code VARCHAR(20) NOT NULL DEFAULT 'unit',
    unit_cost NUMERIC(18,4) NOT NULL DEFAULT 0,
    total_cost NUMERIC(18,4) NOT NULL DEFAULT 0,
    balance_after NUMERIC(18,4),
    source_doc_type VARCHAR(40),
    source_doc_id UUID,
    source_doc_number VARCHAR(40),
    issue_id UUID,
    transfer_id UUID,
    count_id UUID,
    project_id UUID,
    activity_id UUID,
    beneficiary_id UUID,
    movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    status_code VARCHAR(20) NOT NULL DEFAULT 'posted',
    posted_by UUID,
    posted_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    ${GOVERNANCE_COLS}
  )`,

  // ─── 2) أرصدة المخزون الفورية ───
  `CREATE TABLE IF NOT EXISTS inventory_stock_balances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    warehouse_id UUID NOT NULL,
    item_id UUID NOT NULL,
    batch_number VARCHAR(60),
    expiry_date DATE,
    quantity_on_hand NUMERIC(18,4) NOT NULL DEFAULT 0,
    quantity_reserved NUMERIC(18,4) NOT NULL DEFAULT 0,
    unit_code VARCHAR(20) NOT NULL DEFAULT 'unit',
    unit_cost NUMERIC(18,4) NOT NULL DEFAULT 0,
    last_movement_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    ${GOVERNANCE_COLS}
  )`,
  // فريد تعبيري (يسمح بعدة دفعات NULL = غير مُدفّع)
  `CREATE UNIQUE INDEX IF NOT EXISTS uq_inv_stock_balance
   ON inventory_stock_balances (warehouse_id, item_id, COALESCE(batch_number, ''))`,

  // ─── 3) سياسات وإعدادات وحدة المخازن ───
  `CREATE TABLE IF NOT EXISTS inventory_policies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL UNIQUE,
    costing_method VARCHAR(30) NOT NULL DEFAULT 'weighted_average',
    allow_negative_stock BOOLEAN NOT NULL DEFAULT FALSE,
    require_approval_issue BOOLEAN NOT NULL DEFAULT TRUE,
    require_approval_transfer BOOLEAN NOT NULL DEFAULT TRUE,
    require_approval_adjustment BOOLEAN NOT NULL DEFAULT TRUE,
    issue_approval_threshold NUMERIC(18,4) DEFAULT 0,
    adjustment_approval_threshold NUMERIC(18,4) DEFAULT 0,
    default_stocktake_frequency VARCHAR(30) DEFAULT 'monthly',
    expiry_alert_days INT NOT NULL DEFAULT 60,
    reorder_alert_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    auto_reserve_on_transfer BOOLEAN NOT NULL DEFAULT TRUE,
    updated_by UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    ${GOVERNANCE_COLS}
  )`,
];

const INDEX_STATEMENTS: string[] = [
  `CREATE INDEX IF NOT EXISTS idx_inv_mov_org ON inventory_movements(organization_id)`,
  `CREATE INDEX IF NOT EXISTS idx_inv_mov_wh ON inventory_movements(warehouse_id)`,
  `CREATE INDEX IF NOT EXISTS idx_inv_mov_item ON inventory_movements(item_id)`,
  `CREATE INDEX IF NOT EXISTS idx_inv_mov_type ON inventory_movements(movement_type)`,
  `CREATE INDEX IF NOT EXISTS idx_inv_mov_date ON inventory_movements(movement_date)`,
  `CREATE INDEX IF NOT EXISTS idx_inv_mov_source ON inventory_movements(source_doc_type, source_doc_id)`,
  `CREATE INDEX IF NOT EXISTS idx_inv_mov_number ON inventory_movements(organization_id, movement_number)`,
  `CREATE INDEX IF NOT EXISTS idx_inv_bal_wh_item ON inventory_stock_balances(warehouse_id, item_id)`,
  `CREATE INDEX IF NOT EXISTS idx_inv_bal_org ON inventory_stock_balances(organization_id)`,
  `CREATE INDEX IF NOT EXISTS idx_inv_bal_expiry ON inventory_stock_balances(expiry_date) WHERE expiry_date IS NOT NULL`,
  `CREATE INDEX IF NOT EXISTS idx_inv_bal_positive ON inventory_stock_balances(quantity_on_hand) WHERE quantity_on_hand > 0`,
];

export async function runInventoryMigration(pool?: pg.Pool): Promise<void> {
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
    for (const ddl of [...DDL_STATEMENTS, ...INDEX_STATEMENTS]) {
      await client.query(ddl);
    }
    await client.query('COMMIT');
    logger.info('[Inventory Migration] Spine tables ensured (movements, balances, policies)', { context: 'inventory-migration' });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch { /* noop */ }
    logger.error(`[Inventory Migration] FAILED: ${err instanceof Error ? err.message : err}`, { context: 'inventory-migration' });
    throw err;
  } finally {
    client.release();
    if (ownsPool) await p.end();
  }
}

// السماح بالتشغيل المباشر: npx tsx src/server/database/migrate_inventory.ts
const isDirectRun = process.argv[1] && process.argv[1].replace(/\\/g, '/').includes('migrate_inventory');
if (isDirectRun) {
  const { config } = await import('dotenv');
  config();
  runInventoryMigration()
    .then(() => { console.log('INVENTORY_MIGRATION_OK'); process.exit(0); })
    .catch((e: unknown) => { console.error('INVENTORY_MIGRATION_FAILED', e); process.exit(1); });
}
