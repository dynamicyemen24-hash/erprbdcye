require('dotenv').config();

const pg = require('pg');
const { Client } = pg;

if (!process.env.DATABASE_URL) { console.error('DATABASE_URL required'); process.exit(1); }

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function createProcurementDB() {
  console.log('⚡ Building NEB-14 Procurement & Tenders Database Architecture...');
  await client.connect();

  // 1. Create Vendors Table
  await client.query(`
    CREATE TABLE IF NOT EXISTS vendors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID,
      vendor_code VARCHAR(50) UNIQUE NOT NULL,
      name_ar VARCHAR(255) NOT NULL,
      name_en VARCHAR(255),
      tax_number VARCHAR(100),
      commercial_register VARCHAR(100),
      contact_person VARCHAR(150),
      mobile VARCHAR(50),
      email VARCHAR(150),
      governorate VARCHAR(100),
      rating_score NUMERIC(5,2) DEFAULT 90.00,
      category VARCHAR(100) DEFAULT 'GENERAL',
      status VARCHAR(50) DEFAULT 'ACTIVE',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ Table `vendors` created/verified.');

  // 2. Create Procurement Requisitions Table (PRs)
  await client.query(`
    CREATE TABLE IF NOT EXISTS procurement_requisitions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID,
      pr_code VARCHAR(50) UNIQUE NOT NULL,
      title_ar VARCHAR(255) NOT NULL,
      project_id UUID,
      activity_id UUID,
      requested_by UUID,
      estimated_amount NUMERIC(15,2) NOT NULL,
      currency_code VARCHAR(10) DEFAULT 'USD',
      status VARCHAR(50) DEFAULT 'PENDING_APPROVAL',
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ Table `procurement_requisitions` created/verified.');

  // 3. Create RFQs / Tenders Table
  await client.query(`
    CREATE TABLE IF NOT EXISTS procurement_rfqs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID,
      rfq_code VARCHAR(50) UNIQUE NOT NULL,
      title_ar VARCHAR(255) NOT NULL,
      title_en VARCHAR(255),
      pr_id UUID REFERENCES procurement_requisitions(id) ON DELETE SET NULL,
      submission_deadline DATE,
      budget_limit NUMERIC(15,2),
      status VARCHAR(50) DEFAULT 'OPEN',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ Table `procurement_rfqs` created/verified.');

  // 4. Create Bids / Quotations Table (Three-Way Evaluation)
  await client.query(`
    CREATE TABLE IF NOT EXISTS procurement_bids (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      rfq_id UUID REFERENCES procurement_rfqs(id) ON DELETE CASCADE,
      vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
      bid_amount NUMERIC(15,2) NOT NULL,
      currency_code VARCHAR(10) DEFAULT 'USD',
      delivery_days INT DEFAULT 14,
      technical_score NUMERIC(5,2) DEFAULT 85.00,
      financial_score NUMERIC(5,2) DEFAULT 90.00,
      is_awarded BOOLEAN DEFAULT FALSE,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ Table `procurement_bids` created/verified.');

  // 5. Create Purchase Orders Table (POs)
  await client.query(`
    CREATE TABLE IF NOT EXISTS procurement_pos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      po_code VARCHAR(50) UNIQUE NOT NULL,
      rfq_id UUID REFERENCES procurement_rfqs(id) ON DELETE SET NULL,
      vendor_id UUID REFERENCES vendors(id) ON DELETE RESTRICT,
      total_amount NUMERIC(15,2) NOT NULL,
      currency_code VARCHAR(10) DEFAULT 'USD',
      delivery_status VARCHAR(50) DEFAULT 'ISSUED',
      encumbrance_status VARCHAR(50) DEFAULT 'POSTED',
      expected_delivery_date DATE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ Table `procurement_pos` created/verified.');

  // 6. Apply Composite Indexes
  const idxList = [
    'CREATE INDEX IF NOT EXISTS idx_vendors_org_status ON vendors (organization_id, status);',
    'CREATE INDEX IF NOT EXISTS idx_pr_code_status ON procurement_requisitions (pr_code, status);',
    'CREATE INDEX IF NOT EXISTS idx_rfq_status ON procurement_rfqs (status, submission_deadline);',
    'CREATE INDEX IF NOT EXISTS idx_bids_rfq_vendor ON procurement_bids (rfq_id, vendor_id);',
    'CREATE INDEX IF NOT EXISTS idx_pos_vendor_status ON procurement_pos (vendor_id, delivery_status);'
  ];

  for (const sql of idxList) {
    await client.query(sql);
  }
  console.log('✅ Procurement Composite Indexes Applied.');

  // 7. Insert Master Reference Categories in MDM
  let catRes = await client.query("SELECT id FROM code_categories WHERE code = 'PROCUREMENT_STATUS'");
  let catId;
  if (catRes.rows.length === 0) {
    const res = await client.query(`
      INSERT INTO code_categories (code, name_ar, name_en, description, is_system, is_active)
      VALUES ('PROCUREMENT_STATUS', 'حالات المناقصات والمشتريات', 'Procurement Statuses', 'P2P Requisition and PO Statuses', true, true)
      RETURNING id;
    `);
    catId = res.rows[0].id;
    console.log(`✅ Category PROCUREMENT_STATUS created.`);
  } else {
    catId = catRes.rows[0].id;
  }

  const pStatuses = [
    { code: 'DRAFT', ar: 'مسودة طلب', en: 'Draft Requisition' },
    { code: 'RFQ_OPEN', ar: 'مناقصة مفتوحة للعروض', en: 'RFQ Open' },
    { code: 'EVALUATION', ar: 'قيد التحليل والتنافس الثلاثي', en: 'Three-Way Evaluation' },
    { code: 'AWARDED', ar: 'ترسية المناقصة واختيار الفائز', en: 'Awarded to Vendor' },
    { code: 'PO_ISSUED', ar: 'امر توريد معتمد PO', en: 'PO Issued' },
    { code: 'DELIVERED', ar: 'مستلم ميدانياً ومكتمل', en: 'Delivered & Verified' },
  ];

  for (let i = 0; i < pStatuses.length; i++) {
    const item = pStatuses[i];
    const check = await client.query("SELECT id FROM code_items WHERE category_id = $1 AND code = $2", [catId, item.code]);
    if (check.rows.length === 0) {
      await client.query(`
        INSERT INTO code_items (category_id, code, name_ar, name_en, sort_order, is_active)
        VALUES ($1, $2, $3, $4, $5, true);
      `, [catId, item.code, item.ar, item.en, i + 1]);
      console.log(`  + Procurement Status Code Item ${item.code} inserted.`);
    }
  }

  // 8. Create View v_procurement_summary
  await client.query(`
    CREATE OR REPLACE VIEW v_procurement_summary AS
    SELECT 
      po.id AS po_id,
      po.po_code,
      po.total_amount,
      po.currency_code,
      po.delivery_status,
      v.name_ar AS vendor_name_ar,
      v.vendor_code,
      r.rfq_code,
      r.title_ar AS tender_title
    FROM procurement_pos po
    LEFT JOIN vendors v ON po.vendor_id = v.id
    LEFT JOIN procurement_rfqs r ON po.rfq_id = r.id;
  `);
  console.log('✅ View `v_procurement_summary` created/verified.');

  await client.end();
  console.log('🚀 NEB-14 Procurement Database Architecture Completed 100%!');
}

createProcurementDB().catch(console.error);
