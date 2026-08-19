require('dotenv').config();
const { Pool } = require('pg');

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const pCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'permissions'");
  const rpCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'role_permissions'");
  const samplePerms = await pool.query('SELECT * FROM permissions LIMIT 5');
  console.log('Permissions columns:', pCols.rows);
  console.log('Role Permissions columns:', rpCols.rows);
  console.log('Sample perms:', samplePerms.rows);
  await pool.end();
}
run();
