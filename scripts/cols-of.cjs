require('dotenv').config();
const { Client } = require('pg');
(async () => {
  const table = process.argv[2];
  const c = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 60000 });
  for (let i = 0; i < 5; i++) {
    try {
      await c.connect();
      break;
    } catch (e) {
      await new Promise((r) => setTimeout(r, 3000 * (i + 1)));
      if (i === 4) throw e;
    }
  }
  const r = await c.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position",
    [table]
  );
  console.log(table + ': ' + (r.rows.map((x) => x.column_name).join(',') || '(missing)'));
  await c.end();
})().catch((e) => {
  console.log('FAIL', e.message);
  process.exit(1);
});
