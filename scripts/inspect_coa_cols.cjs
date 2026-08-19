require('dotenv').config();

const pg = require('pg');
const { Client } = pg;

if (!process.env.DATABASE_URL) { console.error('DATABASE_URL required'); process.exit(1); }

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function inspectCoaCols() {
  await client.connect();
  const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'chart_of_accounts'");
  console.log('chart_of_accounts columns:', res.rows.map(r => r.column_name).join(', '));
  await client.end();
}

inspectCoaCols().catch(console.error);
