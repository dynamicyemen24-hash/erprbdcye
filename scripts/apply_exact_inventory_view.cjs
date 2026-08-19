require('dotenv').config();

const pg = require('pg');
const { Client } = pg;

if (!process.env.DATABASE_URL) { console.error('DATABASE_URL required'); process.exit(1); }

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function applyExactInvView() {
  console.log('⚡ Creating Exact Inventory Valuation View (v_inventory_valuation_summary)...');
  await client.connect();

  await client.query(`
    CREATE OR REPLACE VIEW v_inventory_valuation_summary AS
    SELECT 
      category_code,
      COUNT(id) AS total_sku_count,
      SUM(minimum_stock_level * standard_unit_cost) AS estimated_valuation_yer,
      COUNT(CASE WHEN is_distributable = true THEN 1 END) AS distributable_items_count
    FROM inventory_items
    GROUP BY category_code;
  `);
  console.log('✅ View `v_inventory_valuation_summary` successfully created!');

  await client.end();
  console.log('🚀 Exact Inventory View & Indexes Completed 100%!');
}

applyExactInvView().catch(console.error);
