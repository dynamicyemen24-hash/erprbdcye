require('dotenv').config();

const pg = require('pg');
const { Client } = pg;

if (!process.env.DATABASE_URL) { console.error('DATABASE_URL required'); process.exit(1); }

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function inspectInvCols() {
  await client.connect();
  const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'inventory_items'");
  console.log('inventory_items columns:', res.rows.map(r => r.column_name).join(', '));
  await client.end();
}

inspectInvCols().catch(console.error);
