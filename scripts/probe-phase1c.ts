import { getPool, closePool } from '../src/server/core/database';
import { writeFileSync } from 'fs';

async function main() {
  const pool = getPool();
  const realConnect = pool.connect.bind(pool);
  let n = 0;
  (pool as any).connect = async () => {
    const client: any = await realConnect();
    const realQuery = client.query.bind(client);
    client.query = async (text: any, params?: any) => {
      n++;
      if (n === 16) {
        writeFileSync('stmt16.sql', String(text));
        console.log(`dumped #16 len=${String(text).length}`);
      }
      return realQuery(text, params);
    };
    return client;
  };
  const esc = await import('../src/server/database/enterprise_schema_completion');
  try {
    await esc.runEnterpriseSchemaCompletion(pool);
  } catch (e: any) {
    console.log(`ABORTED: ${e.message}`);
  }
  await closePool();
}

main().catch((e) => {
  console.error('PROBE-CRASH', e?.message || e);
  process.exit(2);
});
