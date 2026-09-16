require('dotenv').config();
const { Client } = require('pg');
(async () => {
  const tables = process.argv.slice(2);
  let c = null;
  for (let a = 0; a < 5; a++) {
    c = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 60000 });
    try {
      await c.connect();
      break;
    } catch (e) {
      await new Promise((r) => setTimeout(r, 3000 * (a + 1)));
      if (a === 4) throw e;
      c = null;
    }
  }
  for (const t of tables) {
    const r = await c.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position",
      [t]
    );
    const cols = r.rows.map((x) => x.column_name);
    console.log(`${t}: ${cols.length === 0 ? '(missing)' : cols.join(',')}`);
  }
  await c.end();
})().catch((e) => {
  console.log('FAIL', e.message);
  process.exit(1);
});
