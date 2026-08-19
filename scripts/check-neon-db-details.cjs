require('dotenv').config();
const { Pool } = require('pg');

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  // 1. Current connected database
  const curDb = await pool.query('SELECT current_database(), current_user, current_schema()');
  console.log('Current DB info:', curDb.rows[0]);

  // 2. All databases on this Neon server
  const dbs = await pool.query('SELECT datname FROM pg_database WHERE datistemplate = false');
  console.log('All databases on this server:', dbs.rows.map(r => r.datname));

  // 3. Count in erprbdcyedb
  const userCount = await pool.query('SELECT count(*) FROM users');
  const orgCount = await pool.query('SELECT count(*) FROM organizations');
  const benCount = await pool.query('SELECT count(*) FROM beneficiaries');
  const tablesCount = await pool.query("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'");

  console.log({
    connected_database: curDb.rows[0].current_database,
    total_public_tables: tablesCount.rows[0].count,
    users_rows: userCount.rows[0].count,
    orgs_rows: orgCount.rows[0].count,
    beneficiaries_rows: benCount.rows[0].count
  });

  await pool.end();
}
run();
