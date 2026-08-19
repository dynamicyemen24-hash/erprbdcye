require('dotenv').config();
const { Pool } = require('pg');

async function checkHost() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const verRes = await pool.query('SELECT version()');
    const sizeRes = await pool.query('SELECT current_database() as db_name, pg_size_pretty(pg_database_size(current_database())) as total_size');
    const tablesRes = await pool.query(`
      SELECT 
        table_name,
        pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as total_size,
        (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I', table_name), false, true, '')))[1]::text::int AS row_count
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I', table_name), false, true, '')))[1]::text::int DESC
      LIMIT 35;
    `);
    const connRes = await pool.query('SELECT count(*) as count, state FROM pg_stat_activity GROUP BY state');
    const extRes = await pool.query('SELECT extname, extversion FROM pg_extension');

    console.log('\n=================== NEON HOST LIVE CONTROL PANEL ===================');
    console.log('Database Engine:  ', verRes.rows[0].version);
    console.log('Database Name:    ', sizeRes.rows[0].db_name);
    console.log('Total Disk Size:  ', sizeRes.rows[0].total_size);
    console.log('\n--- Active Connection States ---');
    console.table(connRes.rows);
    console.log('\n--- Top Populated Tables in Database ---');
    console.table(tablesRes.rows);
    console.log('====================================================================\n');
  } catch (err) {
    console.error('Diagnostic error:', err);
  } finally {
    await pool.end();
  }
}

checkHost();
