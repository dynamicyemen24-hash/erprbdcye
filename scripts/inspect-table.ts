import { getPool, closePool } from '../src/server/core/database';

async function main() {
  const table = process.argv[2] || 'approval_delegations';
  const pool = getPool();
  const cols = await pool.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
    [table]
  );
  console.log(`columns of ${table}:`, cols.rows.map((r: any) => r.column_name).join(', ') || '(table missing)');
  const migs = await pool.query(`SELECT name FROM _migrations ORDER BY name`).catch(() => ({ rows: [] as any[] }));
  console.log('applied migrations:', migs.rows.map((r: any) => r.name).join(' | ') || '(none)');
  await closePool();
}

main().catch((e) => {
  console.error('INSPECT-FAIL', e?.message || e);
  process.exit(1);
});
