const pg = require('pg');
const { Client } = pg;

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Dq90uUgVxdre@ep-shiny-wind-ai4w5o0l-pooler.c-4.us-east-1.aws.neon.tech/erprbdcyedb?sslmode=verify-full';

const client = new Client({ connectionString });

async function verifyAndPopulateMDM() {
  console.log('⚡ Verifying MDM Tables (code_categories, code_items, coding_system)...');
  await client.connect();

  // 1. Verify code_categories & code_items
  const catCount = await client.query('SELECT COUNT(*) FROM code_categories');
  const itemCount = await client.query('SELECT COUNT(*) FROM code_items');
  console.log(`📊 Current MDM Totals: Categories = ${catCount.rows[0].count}, Items = ${itemCount.rows[0].count}`);

  // Fetch recent HR categories
  const hrCats = await client.query("SELECT code, name_ar FROM code_categories WHERE code LIKE 'HR%'");
  console.log('HR Categories in DB:', hrCats.rows);

  // 2. Check exchange rates table
  const curRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%curren%' OR table_name LIKE '%exchange%'");
  console.log('Currency / Exchange tables:', curRes.rows.map(r => r.table_name));

  await client.end();
}

verifyAndPopulateMDM().catch(console.error);
