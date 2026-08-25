import { Pool } from 'pg';

const databaseUrl = 'postgresql://neondb_owner:npg_dIXtW6LQw8sH@ep-shiny-wind-ai4w5o0l-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString: databaseUrl,
  max: 20,
  min: 2,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 15000,
  statement_timeout: 30000,
  query_timeout: 30000,
  ssl: { rejectUnauthorized: false },
});

async function testFinanceWorkflow() {
  console.log('========================================');
  console.log('P0-1: Finance Workflow End-to-End Test');
  console.log('========================================\n');
  
  // Helper to get first row count
  const getCount = async (table) => {
    const { rows } = await pool.query(`SELECT COUNT(*) as cnt FROM "${table}" LIMIT 1`);
    return rows[0]?.cnt;
  };
  
  // Helper to get first row
  const getFirst = async (query) => {
    const { rows } = await pool.query(query);
    return rows[0];
  };
  
  // TEST 1: Schema verification
  console.log('=== TEST 1: Database Schema Verification ===');
  const tables = ['donations', 'transactions', 'transaction_lines', 'journal_entries', 'journal_entry_lines', 'chart_of_accounts', 'fiscal_years', 'audit_logs'];
  let allTablesExist = true;
  for (const t of tables) {
    const cnt = await getCount(t);
    console.log(`  ${t}: ${cnt !== undefined ? `EXISTS (rows: ${cnt}) ✅` : `MISSING ❌`}`);
    if (cnt === undefined || cnt === 0) allTablesExist = false;
  }
  console.log(`  All tables exist: ${allTablesExist ? '✅' : '❌'}\n`);
  
  // TEST 2: Fiscal years
  console.log('=== TEST 2: Fiscal Years ===');
  const fys = await pool.query('SELECT id, status, start_date, end_date FROM fiscal_years');
  console.log(`  Found ${fys.rows.length} fiscal years total`);
  const openFys = fys.rows.filter(fy => fy.status === 'open');
  console.log(`  Open fiscal years: ${openFys.length}`);
  openFys.forEach(fy => console.log(`    ID: ${fy.id}, period: ${fy.start_date} to ${fy.end_date}`));
  if (openFys.length === 0) console.log('  ⚠️ No open fiscal years found - voucher posting may fail');
  console.log();
  
  // TEST 3: Organizations
  console.log('=== TEST 3: Organizations ===');
  const orgs = await pool.query('SELECT id, name_ar, created_at FROM organizations');
  console.log(`  Found ${orgs.rows.length} organizations`);
  orgs.rows.forEach(org => console.log(`    ID: ${org.id}, name: ${org.name_ar}, created: ${org.created_at}`));
  console.log();
  
  // TEST 4: Donations
  console.log('=== TEST 4: Donations ===');
  const donations = await pool.query('SELECT id, amount, currency_code, status, donation_date FROM donations LIMIT 10');
  console.log(`  Found ${donations.rows.length} donations`);
  donations.rows.forEach(d => {
    const date = d.donation_date ? new Date(d.donation_date).toLocaleDateString() : 'N/A';
    console.log(`    ID: ${d.id}, amount: ${d.amount} ${d.currency_code}, status: ${d.status}, date: ${date}`);
  });
  const totalDonationAmount = donations.rows.reduce((sum, d) => sum + Number(d.amount), 0);
  console.log(`  Total donation amount: ${totalDonationAmount} ${donations.rows[0]?.currency_code || 'YER'}`);
  console.log();
  
  // TEST 5: Transactions
  console.log('=== TEST 5: Transactions ===');
  const txns = await pool.query('SELECT id, transaction_number, transaction_date, total_debit, total_credit, fiscal_year_id, status, organization_id FROM transactions LIMIT 10');
  console.log(`  Found ${txns.rows.length} transactions`);
  let balanced = 0;
  let unbalanced = 0;
  txns.rows.forEach(t => {
    const isBalanced = Math.abs(Number(t.total_debit) - Number(t.total_credit)) < 0.01;
    if (isBalanced) balanced++; else unbalanced++;
    const fy = t.fiscal_year_id ? `FY:${t.fiscal_year_id}` : 'No FY';
    console.log(`    ID: ${t.id}, number: ${t.transaction_number}, debit: ${t.total_debit}, credit: ${t.total_credit}, balanced:${isBalanced}, ${fy}, org:${t.organization_id}`);
  });
  console.log(`  Balanced: ${balanced}, Unbalanced: ${unbalanced}`);
  if (unbalanced > 0) console.log('  ⚠️ Unbalanced transactions found - CHECK constraint may be needed');
  console.log();
  
  // TEST 6: Transaction Lines
  console.log('=== TEST 6: Transaction Lines ===');
  const lines = await pool.query('SELECT id, transaction_id, account_id, debit, credit, currency_code FROM transaction_lines LIMIT 10');
  console.log(`  Found ${lines.rows.length} transaction lines`);
  let linesBalanced = 0;
  lines.rows.forEach(l => {
    const isBalanced = Math.abs(Number(l.debit) - Number(l.credit)) < 0.01;
    if (isBalanced) linesBalanced++;
    console.log(`    TX: ${l.transaction_id}, Acct: ${l.account_id}, debit: ${l.debit}, credit: ${l.credit}, balanced:${isBalanced}`);
  });
  console.log(`  Lines balanced: ${linesBalanced}/${lines.rows.length}`);
  console.log();
  
  // TEST 7: Chart of Accounts
  console.log('=== TEST 7: Chart of Accounts ===');
  const coa = await pool.query('SELECT id, account_code, name_ar, currency_code, current_balance FROM chart_of_accounts LIMIT 5');
  console.log(`  Found ${coa.rows.length} accounts`);
  coa.rows.forEach(a => console.log(`    ID: ${a.id}, code: ${a.account_code}, name: ${a.name_ar}, currency: ${a.currency_code}, balance: ${a.current_balance}`));
  console.log();
  
  // TEST 8: Journal Entries
  console.log('=== TEST 8: Journal Entries ===');
  const journals = await pool.query('SELECT id, entry_number, entry_date, description, fiscal_year_id, status, organization_id FROM journal_entries LIMIT 5');
  console.log(`  Found ${journals.rows.length} journal entries`);
  journals.rows.forEach(j => console.log(`    ID: ${j.id}, number: ${j.entry_number}, date: ${j.entry_date}, FY: ${j.fiscal_year_id}, status: ${j.status}, org: ${j.organization_id}`));
  console.log();
  
  // TEST 9: Journal Entry Lines
  console.log('=== TEST 9: Journal Entry Lines ===');
  const jLines = await pool.query('SELECT id, journal_entry_id, account_id, debit, credit, currency_code FROM journal_entry_lines LIMIT 10');
  console.log(`  Found ${jLines.rows.length} journal entry lines`);
  let jLinesBalanced = 0;
  jLines.rows.forEach(l => {
    const isBalanced = Math.abs(Number(l.debit) - Number(l.credit)) < 0.01;
    if (isBalanced) jLinesBalanced++;
    console.log(`    JE: ${l.journal_entry_id}, Acct: ${l.account_id}, debit: ${l.debit}, credit: ${l.credit}, balanced:${isBalanced}`);
  });
  console.log(`  JE lines balanced: ${jLinesBalanced}/${jLines.rows.length}`);
  console.log();
  
  // TEST 10: Audit Logs
  console.log('=== TEST 10: Audit Logs ===');
  const audit = await pool.query('SELECT id, action, entity_name, entity_id, performed_by, created_at FROM audit_logs LIMIT 10');
  console.log(`  Found ${audit.rows.length} audit logs`);
  audit.rows.forEach(a => {
    const time = a.created_at ? new Date(a.created_at).toLocaleString() : 'N/A';
    console.log(`    ID: ${a.id}, action: ${a.action}, entity: ${a.entity_name}/${a.entity_id}, by: ${a.performed_by}, at: ${time}`);
  });
  console.log();
  
  // TEST 11: CHECK constraint status
  console.log('=== TEST 11: CHECK Constraint on Transactions ===');
  try {
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'transactions' AND constraint_type = 'CHECK'
      )
    `);
    const hasCheck = checkResult.rows[0].exists;
    console.log(`  CHECK constraint on transactions: ${hasCheck ? '✅ PRESENT' : '❌ ABSENT'}`);
    if (!hasCheck) console.log('  → Recommendation: ADD CONSTRAINT chk_transaction_balance CHECK (total_debit = total_credit)');
  } catch (e) {
    console.log(`  Error checking constraint: ${e.message}`);
  }
  console.log();
  
  await pool.end();
  console.log('=== TEST COMPLETE ===');
}

testFinanceWorkflow().catch(console.error);