const pg = require('pg');
const { Client } = pg;

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Dq90uUgVxdre@ep-shiny-wind-ai4w5o0l-pooler.c-4.us-east-1.aws.neon.tech/erprbdcyedb?sslmode=verify-full';

const client = new Client({ connectionString });

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
