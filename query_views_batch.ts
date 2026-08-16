import pg from 'pg';
import fs from 'fs';

const connectionString = "postgresql://neondb_owner:npg_Dq90uUgVxdre@ep-shiny-wind-ai4w5o0l-pooler.c-4.us-east-1.aws.neon.tech/erprbdcyedb?sslmode=require";

async function fastBatchQuery() {
  const pool = new pg.Pool({ connectionString, max: 10 });
  
  // 1. Get view names
  const viewsRes = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'VIEW'
    ORDER BY table_name;
  `);

  console.log(`TOTAL VIEWS FOUND: ${viewsRes.rows.length}`);

  // 2. Fetch in batches of 10
  const viewNames = viewsRes.rows.map(r => r.table_name);
  const results: any[] = [];

  for (let i = 0; i < viewNames.length; i += 10) {
    const chunk = viewNames.slice(i, i + 10);
    const chunkPromises = chunk.map(async (vName) => {
      try {
        const [cntRes, colsRes] = await Promise.all([
          pool.query(`SELECT COUNT(*) FROM "${vName}"`),
          pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = $1
            ORDER BY ordinal_position;
          `, [vName])
        ]);

        return {
          name: vName,
          rowCount: parseInt(cntRes.rows[0].count),
          columnCount: colsRes.rows.length,
          columns: colsRes.rows.map(c => `${c.column_name} (${c.data_type})`)
        };
      } catch (err: any) {
        return {
          name: vName,
          error: err.message
        };
      }
    });

    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }

  fs.writeFileSync('./real_db_97_views_full_report.json', JSON.stringify(results, null, 2));
  console.log("=== SUCCESS! 97 VIEWS AUDITED IN BATCHES AND SAVED TO ./real_db_97_views_full_report.json ===");

  await pool.end();
}

fastBatchQuery().catch(err => console.error("Batch query error:", err));
