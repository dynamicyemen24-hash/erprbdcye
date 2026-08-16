const pg = require('pg');
const { Client } = pg;

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Dq90uUgVxdre@ep-shiny-wind-ai4w5o0l-pooler.c-4.us-east-1.aws.neon.tech/erprbdcyedb?sslmode=verify-full';

const client = new Client({ connectionString });

async function inspectSalesRevenueDB() {
  console.log('⚡ Inspecting Sales, Revenue & Fundraising Tables (NEB-15) in Neon PostgreSQL...');
  await client.connect();

  const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE '%sales%' OR table_name LIKE '%revenue%' OR table_name LIKE '%donation%' OR table_name LIKE '%invoice%' OR table_name LIKE '%gateway%')");
  console.log('Sales & Revenue Tables:', tablesRes.rows.map(r => r.table_name));

  const viewsRes = await client.query("SELECT table_name FROM information_schema.views WHERE table_schema = 'public' AND (table_name LIKE '%sales%' OR table_name LIKE '%revenue%' OR table_name LIKE '%donation%')");
  console.log('Sales & Revenue Views:', viewsRes.rows.map(r => r.table_name));

  await client.end();
}

inspectSalesRevenueDB().catch(console.error);
