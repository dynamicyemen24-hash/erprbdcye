require('dotenv').config();
const { Client } = require('pg');
(async () => {
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
  const fn = `CREATE OR REPLACE FUNCTION fn_calculate_roi(
  total_investment DECIMAL,
  total_returns DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  IF total_investment = 0 THEN RETURN 0; END IF;
  RETURN 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;`;
  try {
    await c.query('BEGIN');
    await c.query(fn);
    await c.query('ROLLBACK');
    console.log('ROI-OK');
  } catch (e) {
    try {
      await c.query('ROLLBACK');
    } catch {}
    console.log('ROI-FAIL:', e.message);
  }
  await c.end();
})().catch((e) => {
  console.log('FAIL', e.message);
  process.exit(1);
});
