import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;

async function queryAllViews() {
  const client = new pg.Client({ connectionString });
  await client.connect();

  const viewsRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'VIEW'
    ORDER BY table_name;
  `);

  console.log(`TOTAL VIEWS DETECTED: ${viewsRes.rows.length}`);
  const report: any[] = [];

  for (const row of viewsRes.rows) {
    const vName = row.table_name;
    try {
      const cntRes = await client.query(`SELECT COUNT(*) FROM "${vName}"`);
      const count = parseInt(cntRes.rows[0].count);
      
      const colsRes = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [vName]);

      report.push({
        name: vName,
        rowCount: count,
        columnCount: colsRes.rows.length,
        columns: colsRes.rows.map(c => c.column_name)
      });
    } catch (err: any) {
      report.push({
        name: vName,
        error: err.message
      });
    }
  }

  fs.writeFileSync('./scratch/all_97_views_summary.json', JSON.stringify(report, null, 2));
  console.log("=== WRITTEN ALL 97 VIEWS TO ./scratch/all_97_views_summary.json ===");

  await client.end();
}

queryAllViews().catch(e => console.error("Error:", e.message));
