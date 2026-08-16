const pg = require('pg');

const DATABASE_URL = "postgresql://neondb_owner:npg_Dq90uUgVxdre@ep-shiny-wind-ai4w5o0l-pooler.c-4.us-east-1.aws.neon.tech/erprbdcyedb?sslmode=verify-full";

async function checkHrSchema() {
  const pool = new pg.Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const client = await pool.connect();
  const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'hr_staff'");
  console.log("hr_staff columns:", res.rows.map(r => r.column_name));
  client.release();
  await pool.end();
}

checkHrSchema();
