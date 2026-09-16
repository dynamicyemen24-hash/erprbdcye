import dotenv from 'dotenv';
dotenv.config();

import { getPool } from '../src/server/core/database';

async function main() {
  console.log("=== CONNECTING TO LIVE NEON DATABASE ===");
  const pool = getPool();
  
  try {
    // 1. Get database version & current time
    const resVer = await pool.query('SELECT version(), NOW(), current_database(), current_user');
    console.log("\n--- Live DB Connection Info ---");
    console.log("DB Name:", resVer.rows[0].current_database);
    console.log("User:", resVer.rows[0].current_user);
    console.log("Time:", resVer.rows[0].now);

    // 2. Count tables in public schema
    const resTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log(`\n--- Live Tables Count: ${resTables.rows.length} ---`);
    const tableNames = resTables.rows.map(r => r.table_name);
    console.log("Tables list:\n", tableNames.join(', '));

    // 3. Inspect key operational tables counts & sample rows
    const keyTables = [
      'organizations', 'users', 'journal_headers', 'journal_lines',
      'beneficiaries', 'projects', 'programs', 'fixed_assets',
      'inventory_items', 'procurement_orders', 'tenders',
      'documents', 'digital_signatures', 'audit_logs', 'fund_balances'
    ];

    console.log("\n--- Real Live Data Counts & Sample Records ---");
    for (const tbl of keyTables) {
      if (tableNames.includes(tbl)) {
        const countRes = await pool.query(`SELECT COUNT(*) FROM "${tbl}"`);
        const count = countRes.rows[0].count;
        console.log(`\n[Table: ${tbl}] -> Total Rows: ${count}`);
        
        if (parseInt(count) > 0) {
          const sample = await pool.query(`SELECT * FROM "${tbl}" LIMIT 2`);
          console.log(`   Sample Rows (${tbl}):`, JSON.stringify(sample.rows, null, 2).substring(0, 400));
        }
      } else {
        console.log(`\n[Table: ${tbl}] -> Not created in DB schema yet.`);
      }
    }

    // 4. Detailed audit of Organizations and Users
    if (tableNames.includes('organizations')) {
      const orgs = await pool.query('SELECT id, name_ar, name_en, code FROM organizations LIMIT 5');
      console.log("\n--- Live Organizations in DB ---");
      console.dir(orgs.rows);
    }

    if (tableNames.includes('users')) {
      const users = await pool.query('SELECT id, email, full_name, role, is_active FROM users LIMIT 10');
      console.log("\n--- Live Users in DB ---");
      console.dir(users.rows);
    }

  } catch (err: any) {
    console.error("DB Connection / Query Error:", err);
  } finally {
    await pool.end();
  }
}

main();
