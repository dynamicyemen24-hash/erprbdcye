import { getPool, closePool } from '../src/server/core/database';

async function main() {
  const pool = getPool();
  const tests: [string, string][] = [
    ['org-cols', `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='organizations' ORDER BY 1`],
    ['minimal', `SELECT org.id, cat.category_code FROM organizations org CROSS JOIN (VALUES ('A','B')) AS cat(category_type, category_code) LIMIT 1`],
    ['no-alias-collision', `SELECT org.id, v.code FROM organizations org CROSS JOIN (VALUES ('A','B')) AS v(t1, code) LIMIT 1`],
  ];
  for (const [name, sql] of tests) {
    try {
      const r = await pool.query(sql);
      console.log(`${name}: OK rows=${r.rows.length} cols=${Object.keys(r.rows[0] || {}).join(',')}`);
    } catch (e: any) {
      console.log(`${name}: FAIL: ${e.message}`);
    }
  }
  await closePool();
}
main().catch((e) => {
  console.error('PROBE-CRASH', e?.message || e);
  process.exit(2);
});
