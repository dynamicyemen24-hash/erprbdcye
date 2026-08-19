require('dotenv').config();

const pg = require('pg');
const { Client } = pg;

if (!process.env.DATABASE_URL) { console.error('DATABASE_URL required'); process.exit(1); }

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function checkCols() {
  await client.connect();
  const bCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'beneficiaries'");
  console.log('beneficiaries columns:', bCols.rows.map(r => r.column_name));
  
  const aCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'audit_logs'");
  console.log('audit_logs columns:', aCols.rows.map(r => r.column_name));
  await client.end();
}
checkCols().catch(console.error);
