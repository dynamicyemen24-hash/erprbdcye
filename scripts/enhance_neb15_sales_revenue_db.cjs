require('dotenv').config();

const pg = require('pg');
const { Client } = pg;

if (!process.env.DATABASE_URL) { console.error('DATABASE_URL required'); process.exit(1); }

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function enhanceNEB15DB() {
  console.log('⚡ Enhancing NEB-15 Sales, Revenue & Fundraising Architecture...');
  await client.connect();

  // 1. Create Table sales_invoices if not exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS sales_invoices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID,
      invoice_number VARCHAR(50) UNIQUE NOT NULL,
      donor_or_client_name VARCHAR(255) NOT NULL,
      revenue_type VARCHAR(50) DEFAULT 'DONATION',
      program_id UUID,
      project_id UUID,
      total_amount NUMERIC(15,2) NOT NULL,
      currency_code VARCHAR(10) DEFAULT 'YER',
      payment_gateway VARCHAR(50) DEFAULT 'KURIMI',
      payment_status VARCHAR(50) DEFAULT 'PAID',
      qr_hash VARCHAR(255),
      issued_date DATE DEFAULT CURRENT_DATE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ Table `sales_invoices` created/verified.');

  // 2. Create Composite Indexes for NEB-15
  const idxList = [
    'CREATE INDEX IF NOT EXISTS idx_donations_created_status ON donations (created_at DESC, status_code);',
    'CREATE INDEX IF NOT EXISTS idx_sales_invoices_org_status ON sales_invoices (organization_id, payment_status);',
    'CREATE INDEX IF NOT EXISTS idx_sales_invoices_type ON sales_invoices (revenue_type, currency_code);'
  ];

  for (const sql of idxList) {
    try {
      await client.query(sql);
    } catch (e) {
      console.warn('Index notice:', e.message);
    }
  }
  console.log('✅ NEB-15 Composite Indexes Applied.');

  // 3. Populate MDM Categories & Items for Gateways & Revenue Types
  let catRes = await client.query("SELECT id FROM code_categories WHERE code = 'FUNDRAISING_GATEWAY'");
  let catId;
  if (catRes.rows.length === 0) {
    const res = await client.query(`
      INSERT INTO code_categories (code, name_ar, name_en, description, is_system, is_active)
      VALUES ('FUNDRAISING_GATEWAY', 'بوابات التبرع والدفع الرقمي', 'Payment & Donation Gateways', 'Digital Payment Gateways for NGO Fundraising', true, true)
      RETURNING id;
    `);
    catId = res.rows[0].id;
    console.log(`✅ Category FUNDRAISING_GATEWAY created.`);
  } else {
    catId = catRes.rows[0].id;
  }

  const gateways = [
    { code: 'KURIMI', ar: 'الكريمي إكسبرس (Kurimi Express)', en: 'Kurimi Express' },
    { code: 'HASEB', ar: 'خدمة حاسب / تضامن (Haseb Pay)', en: 'Haseb Payment' },
    { code: 'JAWAL_PAY', ar: 'جوال بي (Jawal Pay)', en: 'Jawal Pay Wallet' },
    { code: 'STRIPE', ar: 'سترايب الدولي (Stripe Global)', en: 'Stripe International' },
    { code: 'PAYPAL', ar: 'بايبال (PayPal)', en: 'PayPal E-Donations' },
    { code: 'BANK_DIRECT', ar: 'تحويل بنكي مباشر (Direct Transfer)', en: 'Direct Bank Transfer' },
  ];

  for (let i = 0; i < gateways.length; i++) {
    const item = gateways[i];
    const check = await client.query("SELECT id FROM code_items WHERE category_id = $1 AND code = $2", [catId, item.code]);
    if (check.rows.length === 0) {
      await client.query(`
        INSERT INTO code_items (category_id, code, name_ar, name_en, sort_order, is_active)
        VALUES ($1, $2, $3, $4, $5, true);
      `, [catId, item.code, item.ar, item.en, i + 1]);
      console.log(`  + Payment Gateway Item ${item.code} inserted.`);
    }
  }

  // 4. Create View v_sales_revenue_summary
  await client.query(`
    CREATE OR REPLACE VIEW v_sales_revenue_summary AS
    SELECT 
      id AS invoice_id,
      invoice_number,
      donor_or_client_name,
      revenue_type,
      total_amount,
      currency_code,
      payment_gateway,
      payment_status,
      issued_date
    FROM sales_invoices;
  `);
  console.log('✅ View `v_sales_revenue_summary` created/verified.');

  await client.end();
  console.log('🚀 NEB-15 Sales, Revenue & Fundraising DB Enhancement Completed 100%!');
}

enhanceNEB15DB().catch(console.error);
