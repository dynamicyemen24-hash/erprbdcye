require('dotenv').config();
const pg = require('pg');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'transaction_lines'");
  console.log("transaction_lines columns:", cols.rows.map(c => c.column_name));
  
  const sample = await pool.query("SELECT * FROM transaction_lines LIMIT 2");
  console.log("sample lines:", sample.rows);
  pool.end();
}
check();
