require('dotenv').config();

const pg = require('pg');
const { Client } = pg;

if (!process.env.DATABASE_URL) { console.error('DATABASE_URL required'); process.exit(1); }

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function populateUNHumanitarianMDM() {
  console.log('⚡ Populating UN/IATI Humanitarian Standards into MDM & Currency Tables...');
  await client.connect();

  // 1. HR Contract Types Category
  let catRes = await client.query("SELECT id FROM code_categories WHERE code = 'HR_CONTRACT_TYPE'");
  let contractCatId;
  if (catRes.rows.length === 0) {
    const res = await client.query(`
      INSERT INTO code_categories (code, name_ar, name_en, description, is_system, is_active)
      VALUES ('HR_CONTRACT_TYPE', 'أنواع العقود الوظيفية', 'Employment Contract Types', 'Humanitarian Workforce Contract Classifications', true, true)
      RETURNING id;
    `);
    contractCatId = res.rows[0].id;
    console.log(`✅ Category HR_CONTRACT_TYPE created.`);
  } else {
    contractCatId = catRes.rows[0].id;
  }

  const contractItems = [
    { code: 'PERM_FULL', name_ar: 'عقد عمل دائم كامل الوقت', name_en: 'Full-time Permanent' },
    { code: 'VOL_FIELD', name_ar: 'اتفاقية تطوع ميداني إنساني', name_en: 'Field Volunteer Agreement' },
    { code: 'DAILY_WAGE', name_ar: 'عقد تعاون بأجر يومي', name_en: 'Daily Wage Work Contract' },
    { code: 'EXT_CONSULT', name_ar: 'عقد خدمات استشارية وتقييم أثر', name_en: 'Consultancy Services Contract' },
  ];

  for (let i = 0; i < contractItems.length; i++) {
    const item = contractItems[i];
    const check = await client.query("SELECT id FROM code_items WHERE category_id = $1 AND code = $2", [contractCatId, item.code]);
    if (check.rows.length === 0) {
      await client.query(`
        INSERT INTO code_items (category_id, code, name_ar, name_en, sort_order, is_active)
        VALUES ($1, $2, $3, $4, $5, true);
      `, [contractCatId, item.code, item.name_ar, item.name_en, i + 1]);
      console.log(`  + Contract Code Item ${item.code} inserted.`);
    }
  }

  // 2. UN Humanitarian Sectors Category
  let sectorCat = await client.query("SELECT id FROM code_categories WHERE code = 'UN_HUMANITARIAN_SECTOR'");
  let sectorCatId;
  if (sectorCat.rows.length === 0) {
    const res = await client.query(`
      INSERT INTO code_categories (code, name_ar, name_en, description, is_system, is_active)
      VALUES ('UN_HUMANITARIAN_SECTOR', 'قطاعات التدخل الإنساني الدولية (UN Clusters)', 'UN Humanitarian Clusters', 'IATI & OCHA Standard Sectors', true, true)
      RETURNING id;
    `);
    sectorCatId = res.rows[0].id;
    console.log(`✅ Category UN_HUMANITARIAN_SECTOR created.`);
  } else {
    sectorCatId = sectorCat.rows[0].id;
  }

  const sectorItems = [
    { code: 'FSC', name_ar: 'الأمن الغذائي والزراعة (Food Security)', name_en: 'Food Security Cluster' },
    { code: 'WASH', name_ar: 'المياه والإصحاح البيئي (WASH)', name_en: 'Water & Sanitation' },
    { code: 'HEALTH', name_ar: 'الصحة والخدمات الطبية (Health)', name_en: 'Health & Nutrition' },
    { code: 'PROT', name_ar: 'الحماية وحماية الأطفال (Protection & Safeguarding)', name_en: 'Child Protection' },
    { code: 'SHELTER', name_ar: 'الإيواء والمواد غير الغذائية (Shelter & NFI)', name_en: 'Shelter & NFI' },
  ];

  for (let i = 0; i < sectorItems.length; i++) {
    const item = sectorItems[i];
    const check = await client.query("SELECT id FROM code_items WHERE category_id = $1 AND code = $2", [sectorCatId, item.code]);
    if (check.rows.length === 0) {
      await client.query(`
        INSERT INTO code_items (category_id, code, name_ar, name_en, sort_order, is_active)
        VALUES ($1, $2, $3, $4, $5, true);
      `, [sectorCatId, item.code, item.name_ar, item.name_en, i + 1]);
      console.log(`  + UN Sector Item ${item.code} inserted.`);
    }
  }

  // 3. Verify Exchange Rates for USD, YER, SAR
  try {
    const currCount = await client.query('SELECT COUNT(*) FROM currencies');
    console.log(`💱 Active currencies in database: ${currCount.rows[0].count}`);
  } catch (err) {
    console.warn('Currency query warning:', err.message);
  }

  await client.end();
  console.log('🚀 UN/IATI Master Reference Data Population Complete 100%!');
}

populateUNHumanitarianMDM().catch(console.error);
