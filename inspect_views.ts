import pg from 'pg';
import fs from 'fs';

const connectionString = "postgresql://neondb_owner:npg_Dq90uUgVxdre@ep-shiny-wind-ai4w5o0l-pooler.c-4.us-east-1.aws.neon.tech/erprbdcyedb?sslmode=require";

async function inspectViews() {
  const client = new pg.Client({ connectionString });
  await client.connect();

  console.log("=== CONNECTED TO LIVE NEON POSTGRESQL ===");

  // 1. Fetch all Views
  const viewsRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'VIEW'
    ORDER BY table_name;
  `);

  console.log(`\n>>> TOTAL VIEWS FOUND IN PUBLIC SCHEMA: ${viewsRes.rows.length} <<<\n`);

  const viewsDetails: any[] = [];

  for (const v of viewsRes.rows) {
    const viewName = v.table_name;
    
    // View Definition
    let viewDef = "";
    try {
      const defRes = await client.query(`SELECT pg_get_viewdef($1::regclass, true) as def`, [viewName]);
      viewDef = defRes.rows[0]?.def || "";
    } catch (e: any) {
      viewDef = `Error fetching def: ${e.message}`;
    }

    // View Columns
    const colsRes = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `, [viewName]);

    // View Row Count & Sample
    let rowCount = 0;
    let sample: any = [];
    try {
      const countRes = await client.query(`SELECT COUNT(*) FROM "${viewName}"`);
      rowCount = parseInt(countRes.rows[0].count);

      if (rowCount > 0) {
        const sampleRes = await client.query(`SELECT * FROM "${viewName}" LIMIT 2`);
        sample = sampleRes.rows;
      }
    } catch (e: any) {
      rowCount = -1;
      sample = `Query error: ${e.message}`;
    }

    console.log(`- [VIEW] ${viewName} | Columns: ${colsRes.rows.length} | Rows: ${rowCount}`);

    viewsDetails.push({
      viewName,
      columnsCount: colsRes.rows.length,
      columns: colsRes.rows,
      rowCount,
      sample,
      definition: viewDef
    });
  }

  // 2. Fetch Existing Indexes across all base tables
  const indexesRes = await client.query(`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `);

  console.log(`\n>>> TOTAL INDEXES FOUND: ${indexesRes.rows.length} <<<\n`);

  const result = {
    totalViews: viewsRes.rows.length,
    views: viewsDetails,
    totalIndexes: indexesRes.rows.length,
    indexes: indexesRes.rows
  };

  fs.writeFileSync('./live_db_views_audit.json', JSON.stringify(result, null, 2));
  console.log("=== AUDIT COMPLETE! FULL DETAILS SAVED TO ./live_db_views_audit.json ===");

  await client.end();
}

inspectViews().catch(err => {
  console.error("Audit error:", err);
  process.exit(1);
});
