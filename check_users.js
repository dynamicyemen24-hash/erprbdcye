import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_Dq90uUgVxdre@ep-shiny-wind-ai4w5o0l-pooler.c-4.us-east-1.aws.neon.tech/erprbdcyedb?sslmode=require',
});
async function run() {
  await client.connect();
  const res = await client.query("SELECT * FROM users LIMIT 1;");
  console.log(res.rows);
  await client.end();
}
run();
