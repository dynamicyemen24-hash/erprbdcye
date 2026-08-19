require('dotenv').config();
const { Pool } = require('pg');

async function checkSettings() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const sysCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'system_settings'
    `);
    const orgCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'organization_settings'
    `);
    const currentSys = await pool.query('SELECT * FROM system_settings');
    const currentOrg = await pool.query('SELECT * FROM organization_settings');

    console.log('--- system_settings columns ---');
    console.table(sysCols.rows);
    console.log('--- system_settings current data ---');
    console.table(currentSys.rows);
    console.log('--- organization_settings columns ---');
    console.table(orgCols.rows);
    console.log('--- organization_settings current data ---');
    console.table(currentOrg.rows);
  } catch (err) {
    console.error('Settings check error:', err);
  } finally {
    await pool.end();
  }
}

checkSettings();
