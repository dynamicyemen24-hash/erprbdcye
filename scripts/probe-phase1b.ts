import { getPool, closePool } from '../src/server/core/database';

async function main() {
  const pool = getPool();
  const realConnect = pool.connect.bind(pool);
  let n = 0;
  (pool as any).connect = async () => {
    const client: any = await realConnect();
    const realQuery = client.query.bind(client);
    client.query = async (text: any, params?: any) => {
      n++;
      const snippet = String(text).slice(0, 120).replace(/\s+/g, ' ');
      try {
        const r = await realQuery(text, params);
        if (n % 50 === 0) console.log(`ok ${n}: ${snippet}`);
        return r;
      } catch (err: any) {
        console.log(`FAIL #${n}: ${snippet}`);
        console.log(`  message: ${err.message}`);
        throw err;
      }
    };
    return client;
  };
  const esc = await import('../src/server/database/enterprise_schema_completion');
  try {
    await esc.runEnterpriseSchemaCompletion(pool);
    console.log(`DONE total=${n}`);
  } catch (e: any) {
    console.log(`ABORTED after ${n} statements: ${e.message}`);
    process.exitCode = 1;
  }
  await closePool();
}

main().catch((e) => {
  console.error('PROBE-CRASH', e?.message || e);
  process.exit(2);
});
