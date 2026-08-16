import pg from 'pg';
import fs from 'fs';

const connectionString = "postgresql://neondb_owner:npg_Dq90uUgVxdre@ep-shiny-wind-ai4w5o0l-pooler.c-4.us-east-1.aws.neon.tech/erprbdcyedb?sslmode=require";

async function fastList() {
  const client = new pg.Client({ connectionString });
  await client.connect();

  const viewsRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'VIEW'
    ORDER BY table_name;
  `);

  console.log(`TOTAL VIEWS: ${viewsRes.rows.length}`);
  const summary: any[] = [];

  for (const row of viewsRes.rows) {
    const vName = row.table_name;
    try {
      const cntRes = await client.query(`SELECT COUNT(*) FROM "${vName}"`);
      summary.push({ name: vName, count: parseInt(cntRes.rows[0].count) });
    } catch (e: any) {
      summary.push({ name: vName, error: e.message });
    }
  }

  fs.writeFileSync('./views_fast_summary.json', JSON.stringify(summary, null, 2));
  console.log("FAST SUMMARY WRITTEN TO ./views_fast_summary.json");
  await client.end();
}

fastList().catch(err => console.error(err));
