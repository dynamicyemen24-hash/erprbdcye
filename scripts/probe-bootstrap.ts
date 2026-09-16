import { getPool, closePool } from '../src/server/core/database';
import { bootstrapDatabase } from '../src/server/bootstrap/index';

async function main() {
  const pool = getPool();
  const result = await bootstrapDatabase(pool);
  console.log(`BOOTSTRAP success=${result.success} fatal=${result.fatal || 'none'}`);
  result.errors.forEach((e) => console.log('  - ' + e));
  await closePool();
  process.exit(result.fatal ? 1 : 0);
}

main().catch((e) => {
  console.error('PROBE-CRASH', e?.message || e);
  process.exit(2);
});
