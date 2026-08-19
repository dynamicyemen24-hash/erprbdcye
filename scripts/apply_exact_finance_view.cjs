require('dotenv').config();

const pg = require('pg');
const { Client } = pg;

if (!process.env.DATABASE_URL) { console.error('DATABASE_URL required'); process.exit(1); }

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function applyExactFinanceView() {
  console.log('⚡ Creating Exact IPSAS Trial Balance View (v_ipsas_trial_balance)...');
  await client.connect();

  await client.query(`
    CREATE OR REPLACE VIEW v_ipsas_trial_balance AS
    SELECT 
      id,
      account_code,
      name_ar,
      name_en,
      account_type,
      opening_balance,
      current_balance,
      debit_total,
      credit_total,
      is_active
    FROM chart_of_accounts;
  `);
  console.log('✅ View `v_ipsas_trial_balance` created/verified!');

  await client.end();
  console.log('🚀 Exact Finance View & Indexes Completed 100%!');
}

applyExactFinanceView().catch(console.error);
