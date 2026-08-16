import pg from 'pg';
import fs from 'fs';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_Dq90uUgVxdre@ep-shiny-wind-ai4w5o0l-pooler.c-4.us-east-1.aws.neon.tech/erprbdcyedb?sslmode=require',
});

async function run() {
  await client.connect();
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';");
  const tables = res.rows.map(r => r.table_name);
  await client.end();
  
  let content = fs.readFileSync('server.ts', 'utf8');
  
  const whitelistMatch = content.match(/const TABLE_WHITELIST = \[\s*[\s\S]*?\s*\];/m);
  if (whitelistMatch) {
    const newWhitelist = "const TABLE_WHITELIST = [\n  '" + tables.join("',\n  '") + "'\n];";
    content = content.replace(whitelistMatch[0], newWhitelist);
    fs.writeFileSync('server.ts', content, 'utf8');
    console.log("Updated TABLE_WHITELIST with", tables.length, "tables.");
  } else {
    console.log("TABLE_WHITELIST not found in server.ts");
  }
}
run();
