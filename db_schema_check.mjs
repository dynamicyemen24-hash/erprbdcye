import 'dotenv/config'; // loads .env.production first
import pkg from 'pg';
const { Client } = pkg;

const conn = process.env.DATABASE_URL;
const ssl = { rejectUnauthorized: false };

const c = new Client({ connectionString: conn, ssl });
try {
  await c.connect();
  const t = await c.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
  console.log('TOTAL TABLES:', t.rowCount);
  console.log('TABLES:', t.rows.map(r => r.tablename).join(', '));
  const keyTables = ['users', 'organizations', 'beneficiaries', 'programs', 'projects', 'chart_of_accounts'];
  for (const kt of keyTables) {
    const r = await c.query(`SELECT to_regclass('public.${kt}') AS exists_flag`);
    console.log(`${kt}: ${r.rows[0].exists_flag ? 'EXISTS' : 'MISSING'}`);
  }
  const u = await c.query('SELECT COUNT(*)::int AS n FROM users');
  console.log('users count:', u.rows[0].n);
  await c.end();
} catch (e) {
  console.log('ERR:', e.message);
}
