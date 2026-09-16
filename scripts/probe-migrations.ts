import { join } from 'path';
import { Migrator } from '../src/server/database/migrator';
import { closePool } from '../src/server/core/database';

async function main() {
  const migrator = new Migrator(join(process.cwd(), 'migrations'));
  const result = await migrator.migrate();
  console.log(`APPLIED(${result.applied.length}): ${result.applied.join(' | ')}`);
  console.log(`ERRORS(${result.errors.length}):`);
  result.errors.forEach((e) => console.log('  - ' + e));
  await closePool();
  process.exit(result.errors.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('PROBE-CRASH', e?.message || e);
  process.exit(2);
});
