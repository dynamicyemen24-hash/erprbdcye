require('dotenv').config();
const { Client } = require('pg');
(async () => {
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
  const tests = [
    'SELECT EXTRACT(DAY FROM (NOW() - CURRENT_DATE))',
    'SELECT EXTRACT(DAY FROM (NOW() - start_date)) FROM projects LIMIT 1',
    'SELECT EXTRACT(DAY FROM (NOW() - (SELECT start_date FROM projects LIMIT 1)))',
  ];
  for (const sql of tests) {
    try {
      const r = await c.query(sql);
      console.log('OK:', sql.slice(0, 60), '->', JSON.stringify(r.rows[0]));
    } catch (e) {
      console.log('FAIL:', sql.slice(0, 60), '->', e.message);
    }
  }
  await c.end();
})().catch((e) => {
  console.log('FAIL', e.message);
  process.exit(1);
});
