require('dotenv').config();

const pg = require('pg');
const { Client } = pg;

if (!process.env.DATABASE_URL) { console.error('DATABASE_URL required'); process.exit(1); }

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function inspectCols() {
  await client.connect();
  const tables = ['hr_staff', 'attendance_records', 'hr_leaves', 'payroll_records'];
  for (const t of tables) {
    const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${t}'`);
    console.log(`Table ${t} columns:`, res.rows.map(r => r.column_name).join(', '));
  }
  await client.end();
}

inspectCols().catch(console.error);
