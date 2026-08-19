require('dotenv').config();

const pg = require('pg');
const { Client } = pg;

if (!process.env.DATABASE_URL) { console.error('DATABASE_URL required'); process.exit(1); }

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function inspectProcurementDB() {
  console.log('⚡ Inspecting Procurement Tables & Views in Neon PostgreSQL...');
  await client.connect();

  const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE '%procure%' OR table_name LIKE '%vendor%' OR table_name LIKE '%rfq%' OR table_name LIKE '%bid%' OR table_name LIKE '%purchase%')");
  console.log('Procurement Tables:', tablesRes.rows.map(r => r.table_name));

  const viewsRes = await client.query("SELECT table_name FROM information_schema.views WHERE table_schema = 'public' AND (table_name LIKE '%procure%' OR table_name LIKE '%vendor%' OR table_name LIKE '%purchase%')");
  console.log('Procurement Views:', viewsRes.rows.map(r => r.table_name));

  await client.end();
}

inspectProcurementDB().catch(console.error);
