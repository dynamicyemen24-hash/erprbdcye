import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;

async function explore() {
  const client = new pg.Client({ connectionString });
  const report: any = {
    tables: [],
    errors: []
  };

  try {
    await client.connect();
    console.log("Connected to PostgreSQL successfully!\n");

    // 1. Get all tables in the public schema
    const tablesRes = await client.query(`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    const tableList = tablesRes.rows;
    console.log(`Found ${tableList.length} tables/views.`);

    for (const item of tableList) {
      const table = item.table_name;
      const type = item.table_type;
      console.log(`Processing: ${table} (${type})`);

      const tableData: any = {
        name: table,
        type: type,
        columns: [],
        rowCount: 0,
        sampleData: [],
        error: null
      };

      try {
        // Get columns
        const colsRes = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position;
        `, [table]);

        tableData.columns = colsRes.rows;

        // Get count
        const countRes = await client.query(`SELECT COUNT(*) FROM "${table}"`);
        tableData.rowCount = parseInt(countRes.rows[0].count);

        // Get sample data
        if (tableData.rowCount > 0) {
          try {
            const sampleRes = await client.query(`SELECT * FROM "${table}" LIMIT 10`);
            tableData.sampleData = sampleRes.rows;
          } catch (sampleErr: any) {
            tableData.error = `Error loading sample data: ${sampleErr.message}`;
          }
        }
      } catch (err: any) {
        console.error(`Error processing table ${table}:`, err.message);
        tableData.error = err.message;
      }

      report.tables.push(tableData);
    }

    fs.writeFileSync('./db_schema_output.json', JSON.stringify(report, null, 2));
    console.log("\nSuccess! Report saved to ./db_schema_output.json");

  } catch (err: any) {
    console.error("General error:", err);
    report.errors.push(err.message);
    fs.writeFileSync('./db_schema_output.json', JSON.stringify(report, null, 2));
  } finally {
    await client.end();
  }
}

explore();

