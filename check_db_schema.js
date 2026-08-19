import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});
async function run() {
  await client.connect();
  const tables = ['parties', 'organizations', 'beneficiaries', 'sponsorships', 'activities', 'chart_of_accounts', 'projects'];
  for (const table of tables) {
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1 AND table_schema = 'public'
      ORDER BY ordinal_position;
    `, [table]);
    console.log(`\n=== TABLE: ${table} ===`);
    console.log(res.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
  }
  await client.end();
}
run().catch(console.error);
