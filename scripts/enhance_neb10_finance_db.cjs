const pg = require('pg');
const { Client } = pg;

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Dq90uUgVxdre@ep-shiny-wind-ai4w5o0l-pooler.c-4.us-east-1.aws.neon.tech/erprbdcyedb?sslmode=verify-full';

const client = new Client({ connectionString });

async function enhanceFinanceDB() {
  console.log('⚡ Enhancing NEB-10 Finance & Compliance Database Architecture (Neon PostgreSQL)...');
  await client.connect();

  // 1. Apply Composite Performance Indexes for IPSAS General Ledger
  const idxList = [
    'CREATE INDEX IF NOT EXISTS idx_transactions_org_date ON transactions (organization_id, transaction_date DESC);',
    'CREATE INDEX IF NOT EXISTS idx_txlines_account_tx ON transaction_lines (account_id, transaction_id);',
    'CREATE INDEX IF NOT EXISTS idx_chart_accounts_code ON chart_of_accounts (account_code, account_type);',
    'CREATE INDEX IF NOT EXISTS idx_budget_lines_proj ON budget_lines (project_id, fiscal_year_id);'
  ];

  for (const sql of idxList) {
    try {
      await client.query(sql);
      console.log(`✅ Index applied: ${sql.split(' ')[4]}`);
    } catch (e) {
      console.warn('Index notice:', e.message);
    }
  }

  // 2. Populate MDM Categories in code_categories & code_items
  let catRes = await client.query("SELECT id FROM code_categories WHERE code = 'IPSAS_ACCOUNT_TYPE'");
  let catId;
  if (catRes.rows.length === 0) {
    const res = await client.query(`
      INSERT INTO code_categories (code, name_ar, name_en, description, is_system, is_active)
      VALUES ('IPSAS_ACCOUNT_TYPE', 'أنواع الحسابات المالية IPSAS', 'IPSAS Account Types', 'Chart of Accounts Top-Level Types', true, true)
      RETURNING id;
    `);
    catId = res.rows[0].id;
    console.log(`✅ Category IPSAS_ACCOUNT_TYPE created.`);
  } else {
    catId = catRes.rows[0].id;
  }

  const accTypes = [
    { code: 'ASSET', ar: 'الأصول (ثابتة ومتداولة)', en: 'Assets (Fixed & Current)' },
    { code: 'LIABILITY', ar: 'الالتزامات والخصوم (دائنون وأمانات)', en: 'Liabilities' },
    { code: 'EQUITY', ar: 'صافي الأصول والأوقاف (Net Assets & Endowments)', en: 'Net Assets & Endowments' },
    { code: 'REVENUE', ar: 'الإيرادات والتبرعات (Donations & Grants)', en: 'Revenues & Grants' },
    { code: 'EXPENSE', ar: 'المصروفات النفقات التشغيلية والإغاثية', en: 'Expenses & Project Costs' },
  ];

  for (let i = 0; i < accTypes.length; i++) {
    const item = accTypes[i];
    const check = await client.query("SELECT id FROM code_items WHERE category_id = $1 AND code = $2", [catId, item.code]);
    if (check.rows.length === 0) {
      await client.query(`
        INSERT INTO code_items (category_id, code, name_ar, name_en, sort_order, is_active)
        VALUES ($1, $2, $3, $4, $5, true);
      `, [catId, item.code, item.ar, item.en, i + 1]);
      console.log(`  + IPSAS Account Type ${item.code} inserted.`);
    }
  }

  // 3. Voucher Types Category
  let vCat = await client.query("SELECT id FROM code_categories WHERE code = 'FINANCIAL_VOUCHER_TYPE'");
  let vCatId;
  if (vCat.rows.length === 0) {
    const res = await client.query(`
      INSERT INTO code_categories (code, name_ar, name_en, description, is_system, is_active)
      VALUES ('FINANCIAL_VOUCHER_TYPE', 'أنواع السندات والقيود المالية', 'Financial Voucher Types', 'Journal, Receipt, Payment & Adjustment Vouchers', true, true)
      RETURNING id;
    `);
    vCatId = res.rows[0].id;
    console.log(`✅ Category FINANCIAL_VOUCHER_TYPE created.`);
  } else {
    vCatId = vCat.rows[0].id;
  }

  const vTypes = [
    { code: 'JOURNAL', ar: 'قيد يومية مزدوج (Journal Entry)', en: 'General Journal Voucher' },
    { code: 'RECEIPT', ar: 'سند قبض نقدية / بنك (Receipt Voucher)', en: 'Cash/Bank Receipt' },
    { code: 'PAYMENT', ar: 'سند صرف نقدية / بنك (Payment Voucher)', en: 'Cash/Bank Payment' },
    { code: 'CLOSING', ar: 'قيد تسوية وإغلاق فترة (Adjustment Voucher)', en: 'Period Closing Voucher' },
  ];

  for (let i = 0; i < vTypes.length; i++) {
    const item = vTypes[i];
    const check = await client.query("SELECT id FROM code_items WHERE category_id = $1 AND code = $2", [vCatId, item.code]);
    if (check.rows.length === 0) {
      await client.query(`
        INSERT INTO code_items (category_id, code, name_ar, name_en, sort_order, is_active)
        VALUES ($1, $2, $3, $4, $5, true);
      `, [vCatId, item.code, item.ar, item.en, i + 1]);
      console.log(`  + Voucher Type ${item.code} inserted.`);
    }
  }

  // 4. Create View v_ipsas_trial_balance
  await client.query(`
    CREATE OR REPLACE VIEW v_ipsas_trial_balance AS
    SELECT 
      c.account_code,
      c.account_name_ar,
      c.account_type,
      COALESCE(SUM(l.debit_amount), 0) AS total_debit,
      COALESCE(SUM(l.credit_amount), 0) AS total_credit,
      COALESCE(SUM(l.debit_amount - l.credit_amount), 0) AS net_balance
    FROM chart_of_accounts c
    LEFT JOIN transaction_lines l ON c.id = l.account_id
    GROUP BY c.id, c.account_code, c.account_name_ar, c.account_type;
  `);
  console.log('✅ View `v_ipsas_trial_balance` created/verified.');

  await client.end();
  console.log('🚀 NEB-10 Finance & Compliance DB Architecture Completed 100%!');
}

enhanceFinanceDB().catch(console.error);
