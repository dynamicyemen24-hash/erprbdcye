require('dotenv').config();
const fs = require('fs');
const { Client } = require('pg');
(async () => {
  const file = process.argv[2];
  const sql = fs.readFileSync(file, 'utf8');
  let c = null;
  for (let a = 0; a < 5; a++) {
    c = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 60000 });
    try {
      await c.connect();
      break;
    } catch (e) {
      try {
        await c.end().catch(() => {});
      } catch {}
      await new Promise((r) => setTimeout(r, 3000 * (a + 1)));
      if (a === 4) throw e;
      c = null;
    }
  }
  try {
    await c.query('BEGIN');
    await c.query(sql);
    await c.query('ROLLBACK');
    console.log('WHOLE-FILE OK (rolled back)');
  } catch (e) {
    try {
      await c.query('ROLLBACK');
    } catch {}
    console.log('FAIL:', e.message);
    const pos = parseInt(e.position || '0', 10);
    if (pos) {
      console.log('CONTEXT:', JSON.stringify(sql.slice(Math.max(0, pos - 250), pos + 120)));
    }
  }
  await c.end();
})().catch((e) => {
  console.log('FAIL', e.message);
  process.exit(1);
});
