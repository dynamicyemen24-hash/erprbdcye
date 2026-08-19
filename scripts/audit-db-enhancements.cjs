require('dotenv').config();
const { Pool } = require('pg');

async function audit() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  // 1. Check extensions installed
  const ext = await pool.query('SELECT extname, extversion FROM pg_extension');
  console.log('Installed extensions:', ext.rows);

  // 2. Check foreign keys missing indexes
  const missingFkIndexes = await pool.query(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM
      information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    LIMIT 20
  `);
  console.log('Sample FK constraints count:', missingFkIndexes.rows.length);

  // 3. Check JSONB indexes and Full-Text search capabilities
  const ginIndexes = await pool.query(`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public' AND indexdef LIKE '%gin%'
  `);
  console.log('GIN indexes count:', ginIndexes.rows.length);

  // 4. Check triggers for updated_at auto-updating
  const triggers = await pool.query(`
    SELECT trigger_name, event_manipulation, event_object_table
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    LIMIT 10
  `);
  console.log('Triggers count:', triggers.rows.length);

  await pool.end();
}
audit();
