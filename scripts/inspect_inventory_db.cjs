const pg = require('pg');
const { Client } = pg;

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Dq90uUgVxdre@ep-shiny-wind-ai4w5o0l-pooler.c-4.us-east-1.aws.neon.tech/erprbdcyedb?sslmode=verify-full';

const client = new Client({ connectionString });

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
