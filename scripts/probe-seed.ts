import { getPool, closePool } from '../src/server/core/database';
import { readFileSync } from 'fs';

async function main() {
  const pool = getPool();
  const sql = readFileSync('migrations/20260830_unified_expense_engine.sql', 'utf8');
  const start = sql.indexOf('INSERT INTO expense_categories');
  const end = sql.indexOf('ON CONFLICT (organization_id, category_code) DO NOTHING;') + 'ON CONFLICT (organization_id, category_code) DO NOTHING;'.length;
  const stmt = sql.slice(start, end);
  // Dry-run as SELECT only (strip INSERT header, keep SELECT..VALUES, LIMIT 1)
  const selStart = stmt.indexOf('SELECT');
  const selectOnly = stmt.slice(selStart).split('ON CONFLICT')[0] + ' LIMIT 1';
  try {
    const r = await pool.query(selectOnly);
    console.log('SELECT-OK cols:', Object.keys(r.rows[0] || {}).join(','));
  } catch (e: any) {
    console.log('SELECT-FAIL:', e.message);
  }
  await closePool();
}
main().catch((e) => {
  console.error('PROBE-CRASH', e?.message || e);
  process.exit(2);
});
