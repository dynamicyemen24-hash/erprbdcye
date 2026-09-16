import { getPool, closePool } from '../src/server/core/database';

async function main() {
  const step = process.argv[2];
  const pool = getPool();
  const esc = await import('../src/server/database/enterprise_schema_completion');
  const compat = await import('../src/server/bootstrap/compatibility');
  const fns: Record<string, () => Promise<unknown>> = {
    schema: () => esc.runEnterpriseSchemaCompletion(pool),
    indexes: () => esc.applyEnterpriseIndexes(pool),
    views: () => esc.applyEnterpriseViews(pool),
    compat: () => (compat as any).ensurePpmCompatibilityColumns(pool),
    seedusers: () => esc.seedEnterpriseUsersAndOrg(pool),
  };
  const fn = fns[step];
  if (!fn) {
    console.log('unknown step. use: schema|indexes|views|compat|seedusers');
    process.exit(2);
  }
  try {
    await fn();
    console.log(`OK: ${step}`);
  } catch (err: any) {
    console.log(`FAIL: ${step}: ${err.message}`);
    process.exitCode = 1;
  }
  await closePool();
}

main().catch((e) => {
  console.error('PROBE-CRASH', e?.message || e);
  process.exit(2);
});
