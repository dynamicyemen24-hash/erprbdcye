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
  const res = await client.query("SELECT * FROM users LIMIT 1;");
  console.log(res.rows);
  await client.end();
}
run();
