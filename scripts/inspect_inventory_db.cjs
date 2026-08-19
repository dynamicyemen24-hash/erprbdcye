require('dotenv').config();

const pg = require('pg');
const { Client } = pg;

if (!process.env.DATABASE_URL) { console.error('DATABASE_URL required'); process.exit(1); }

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function inspectInventoryDB() {
  console.log('⚡ Inspecting Inventory & Warehouse Tables in Neon PostgreSQL...');
  await client.connect();

  const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE '%inventor%' OR table_name LIKE '%stock%' OR table_name LIKE '%warehouse%' OR table_name LIKE '%asset%')");
  console.log('Inventory & Warehouse Tables:', tablesRes.rows.map(r => r.table_name));

  const viewsRes = await client.query("SELECT table_name FROM information_schema.views WHERE table_schema = 'public' AND (table_name LIKE '%inventor%' OR table_name LIKE '%stock%' OR table_name LIKE '%asset%')");
  console.log('Inventory & Warehouse Views:', viewsRes.rows.map(r => r.table_name));

  await client.end();
}

inspectInventoryDB().catch(console.error);
