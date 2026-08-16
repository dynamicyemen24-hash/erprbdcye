const pg = require('pg');
const { Client } = pg;
const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Dq90uUgVxdre@ep-shiny-wind-ai4w5o0l-pooler.c-4.us-east-1.aws.neon.tech/erprbdcyedb?sslmode=verify-full';

const client = new Client({ connectionString });

async function checkCols() {
  await client.connect();
  const bCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'beneficiaries'");
  console.log('beneficiaries columns:', bCols.rows.map(r => r.column_name));
  
  const aCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'audit_logs'");
  console.log('audit_logs columns:', aCols.rows.map(r => r.column_name));
  await client.end();
}
checkCols().catch(console.error);
