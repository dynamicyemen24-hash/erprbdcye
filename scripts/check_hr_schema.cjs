require('dotenv').config();

const pg = require('pg');

if (!process.env.DATABASE_URL) { console.error('DATABASE_URL required'); process.exit(1); }

async function checkHrSchema() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const client = await pool.connect();
  const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'hr_staff'");
  console.log("hr_staff columns:", res.rows.map(r => r.column_name));
  client.release();
  await pool.end();
}

checkHrSchema();
