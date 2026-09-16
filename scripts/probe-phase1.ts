import { getPool, closePool } from '../src/server/core/database';

async function main() {
  const pool = getPool();
  const steps: [string, () => Promise<unknown>][] = [];
  const esc = await import('../src/server/database/enterprise_schema_completion');
  steps.push(['runEnterpriseSchemaCompletion', () => esc.runEnterpriseSchemaCompletion(pool)]);
  steps.push(['applyEnterpriseIndexes', () => esc.applyEnterpriseIndexes(pool)]);
  steps.push(['applyEnterpriseViews', () => esc.applyEnterpriseViews(pool)]);
  const compat = await import('../src/server/bootstrap/compatibility');
  const compatFn = (compat as any).ensurePpmCompatibilityColumns;
  if (compatFn) steps.push(['ensurePpmCompatibilityColumns', () => compatFn(pool)]);
  steps.push(['seedEnterpriseUsersAndOrg', () => esc.seedEnterpriseUsersAndOrg(pool)]);

  for (const [name, fn] of steps) {
    try {
      await fn();
      console.log(`OK: ${name}`);
    } catch (err: any) {
      console.log(`FAIL: ${name}: ${err.message}`);
      console.log(`  code=${err.code} position=${err.position}`);
      process.exitCode = 1;
      break;
    }
  }
  await closePool();
}

main().catch((e) => {
  console.error('PROBE-CRASH', e?.message || e);
  process.exit(2);
});
