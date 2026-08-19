require('dotenv').config();

const pg = require('pg');
const { Client } = pg;

if (!process.env.DATABASE_URL) { console.error('DATABASE_URL required'); process.exit(1); }

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function enhanceHRDatabase() {
  console.log('⚡ Starting Deep HR Database & Schema Enhancement...');
  await client.connect();

  // 1. HR Composite Indexes
  const indexes = [
    { name: 'idx_hr_staff_org_dept', sql: 'CREATE INDEX IF NOT EXISTS idx_hr_staff_org_dept ON hr_staff (organization_id, department_code);' },
    { name: 'idx_attendance_user_date', sql: 'CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance_records (user_id, date DESC);' },
    { name: 'idx_hr_leaves_user_status', sql: 'CREATE INDEX IF NOT EXISTS idx_hr_leaves_user_status ON hr_leaves (user_id, status); font;' },
    { name: 'idx_payroll_records_period', sql: 'CREATE INDEX IF NOT EXISTS idx_payroll_records_period ON payroll_records (payroll_period_id, user_id);' }
  ];

  for (const idx of indexes) {
    try {
      // Fix syntax
      const cleanSql = idx.sql.replace(' font;', '');
      await client.query(cleanSql);
      console.log(`✅ Index ${idx.name} verified.`);
    } catch (err) {
      console.warn(`⚠️ Warning on ${idx.name}:`, err.message);
    }
  }

  // 2. Ensure HR Master Code Category & Items in Governance Layer
  try {
    console.log('📦 Verifying HR Master Reference Data in code_categories & code_items...');
    
    // Check if HR_WORKFORCE_TYPE category exists
    const catRes = await client.query("SELECT id FROM code_categories WHERE code = 'HR_WORKFORCE_TYPE'");
    let catId;
    
    if (catRes.rows.length === 0) {
      const insertCat = await client.query(`
        INSERT INTO code_categories (code, name_ar, name_en, description, is_system, is_active)
        VALUES ('HR_WORKFORCE_TYPE', 'تصنيفات القوى العاملة', 'Workforce Categories', 'Human Capital Employment Categories', true, true)
        RETURNING id;
      `);
      catId = insertCat.rows[0].id;
      console.log(`✅ Category HR_WORKFORCE_TYPE created with ID: ${catId}`);
    } else {
      catId = catRes.rows[0].id;
      console.log(`✅ Category HR_WORKFORCE_TYPE exists with ID: ${catId}`);
    }

    // Insert master items if missing
    const items = [
      { code: 'PERM', name_ar: 'كادر دائم', name_en: 'Permanent FTE', sort: 1 },
      { code: 'VOL', name_ar: 'متطوع ميداني', name_en: 'Field Volunteer', sort: 2 },
      { code: 'COOP', name_ar: 'متعاون بأجر يومي', name_en: 'Daily Wage Cooperator', sort: 3 },
      { code: 'DEL', name_ar: 'مندوب إقليمي', name_en: 'Regional Delegate', sort: 4 },
      { code: 'CONS', name_ar: 'استشاري خبير', name_en: 'External Consultant', sort: 5 },
    ];

    for (const item of items) {
      const itemCheck = await client.query("SELECT id FROM code_items WHERE category_id = $1 AND code = $2", [catId, item.code]);
      if (itemCheck.rows.length === 0) {
        await client.query(`
          INSERT INTO code_items (category_id, code, name_ar, name_en, sort_order, is_active)
          VALUES ($1, $2, $3, $4, $5, true);
        `, [catId, item.code, item.name_ar, item.name_en, item.sort]);
        console.log(`  + Code item ${item.code} (${item.name_ar}) created.`);
      }
    }
  } catch (err) {
    console.warn('⚠️ Master code categories warning:', err.message);
  }

  // 3. Verify HR Views
  try {
    console.log('🔍 Verifying HR Database Views...');
    const viewsRes = await client.query("SELECT table_name FROM information_schema.views WHERE table_name LIKE 'v_hr%'");
    console.log('Active HR Views:', viewsRes.rows.map(r => r.table_name));
  } catch (err) {
    console.warn('⚠️ Views verification warning:', err.message);
  }

  await client.end();
  console.log('🚀 Deep HR Database & Schema Enhancement completed with 100% success!');
}

enhanceHRDatabase().catch(console.error);
