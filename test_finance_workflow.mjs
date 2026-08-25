import { getPool } from './src/server/core/database.js';
import { IPSASFinanceService } from './src/server/services/finance.service.js';

async function testFinanceWorkflow() {
  const pool = getPool();
  
  // Test 1: Check database state - tables exist
  console.log('=== TEST 1: Database Schema Verification ===');
  const tables = ['donations', 'transactions', 'transaction_lines', 'journal_entries', 'journal_entry_lines', 'chart_of_accounts', 'fiscal_years', 'audit_logs'];
  for (const t of tables) {
    try {
      const [result] = await pool.query(`SELECT COUNT(*) as cnt FROM ${t} LIMIT 1`);
      console.log(`  ${t}: EXISTS (rows: ${result.rows[0].cnt})`);
    } catch (e) {
      console.log(`  ${t}: MISSING - ${e.message}`);
    }
  }
  
  // Test 2: Check fiscal years
  console.log('\n=== TEST 2: Fiscal Years ===');
  const [fys] = await pool.query('SELECT id, status, start_date, end_date FROM fiscal_years LIMIT 5');
  console.log(`  Found ${fys.rows.length} fiscal years`);
  fys.rows.forEach(fy => console.log(`    ID: ${fy.id}, status: ${fy.status}, period: ${fy.start_date} to ${fy.end_date}`));
  
  // Test 3: Check organizations
  console.log('\n=== TEST 3: Organizations ===');
  const [orgs] = await pool.query('SELECT id, name_ar FROM organizations LIMIT 3');
  console.log(`  Found ${orgs.rows.length} organizations`);
  orgs.rows.forEach(org => console.log(`    ID: ${org.id}, name: ${org.name_ar}`));
  
  await pool.end();
}

testFinanceWorkflow().catch(console.error);