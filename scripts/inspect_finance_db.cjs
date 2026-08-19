require('dotenv').config();

const pg = require('pg');
const { Client } = pg;

if (!process.env.DATABASE_URL) { console.error('DATABASE_URL required'); process.exit(1); }

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function inspectFinanceDB() {
  console.log('⚡ Inspecting Finance & Compliance Tables (NEB-10) in Neon PostgreSQL...');
  await client.connect();

  const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE '%account%' OR table_name LIKE '%transact%' OR table_name LIKE '%fiscal%' OR table_name LIKE '%budget%')");
  console.log('Finance & Accounting Tables:', tablesRes.rows.map(r => r.table_name));

  const viewsRes = await client.query("SELECT table_name FROM information_schema.views WHERE table_schema = 'public' AND (table_name LIKE '%finance%' OR table_name LIKE '%ledger%' OR table_name LIKE '%account%')");
  console.log('Finance & Accounting Views:', viewsRes.rows.map(r => r.table_name));

  await client.end();
}

inspectFinanceDB().catch(console.error);
