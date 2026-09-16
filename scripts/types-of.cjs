require('dotenv').config();
const { Client } = require('pg');
(async () => {
  const [, , table, ...cols] = process.argv;
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
    'SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2 AND column_name = ANY($3) ORDER BY 1',
    ['public', table, cols]
  );
  r.rows.forEach((x) => console.log(`${x.column_name}: ${x.data_type} (${x.udt_name})`));
  await c.end();
})().catch((e) => {
  console.log('FAIL', e.message);
  process.exit(1);
});
