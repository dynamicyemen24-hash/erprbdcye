require('dotenv').config();

const pg = require('pg');
const { Client } = pg;

if (!process.env.DATABASE_URL) { console.error('DATABASE_URL required'); process.exit(1); }

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function enhanceInventoryDB() {
  console.log('⚡ Enhancing Inventory & Warehouse Database Architecture (Neon PostgreSQL)...');
  await client.connect();

  // 1. Apply Composite Performance Indexes
  const idxList = [
    'CREATE INDEX IF NOT EXISTS idx_inventory_items_warehouse ON inventory_items (warehouse_id, category);',
    'CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON inventory_items (item_code, barcode);',
    'CREATE INDEX IF NOT EXISTS idx_fixed_assets_org_dept ON fixed_assets (organization_id, department_id);',
    'CREATE INDEX IF NOT EXISTS idx_inventory_transfers_status ON inventory_transfers (from_warehouse_id, to_warehouse_id, status);',
    'CREATE INDEX IF NOT EXISTS idx_inventory_issues_project ON inventory_issues (project_id, issue_date);'
  ];

  for (const sql of idxList) {
    try {
      await client.query(sql);
    } catch (e) {
      console.warn('Index warning:', e.message);
    }
  }
  console.log('✅ Inventory & Warehouse Composite Indexes Applied.');

  // 2. Insert Master Categories in MDM (code_categories & code_items)
  let catRes = await client.query("SELECT id FROM code_categories WHERE code = 'INVENTORY_ITEM_CATEGORY'");
  let catId;
  if (catRes.rows.length === 0) {
    const res = await client.query(`
      INSERT INTO code_categories (code, name_ar, name_en, description, is_system, is_active)
      VALUES ('INVENTORY_ITEM_CATEGORY', 'تصنيفات الأصناف والمواد المخزنية', 'Inventory Item Categories', 'Relief and Fixed Asset Material Classifications', true, true)
      RETURNING id;
    `);
    catId = res.rows[0].id;
    console.log(`✅ Category INVENTORY_ITEM_CATEGORY created.`);
  } else {
    catId = catRes.rows[0].id;
  }

  const itemCategories = [
    { code: 'FOOD_RATION', ar: '🌾 سلال غذائية ومواد تموينية', en: 'Food Rations & Kits' },
    { code: 'MEDICAL_SUPPLIES', ar: '💊 أدوية ومستلزمات طبية', en: 'Medical & Pharma Supplies' },
    { code: 'WASH_EQUIPMENT', ar: '💧 معدات مياه وحفر آبار', en: 'WASH & Well Drill Equipment' },
    { code: 'SHELTER_KITS', ar: '🏕️ خيام ومواد إيواء طوارئ', en: 'Emergency Tents & Shelter Kits' },
    { code: 'EDUCATIONAL', ar: '📚 حقائب وأدوات مدرسية', en: 'Education & School Kits' },
    { code: 'FIXED_ASSET', ar: '🚜 أصول ثابتة ومعدات ثقيلة', en: 'IPSAS-17 Fixed Assets' },
  ];

  for (let i = 0; i < itemCategories.length; i++) {
    const item = itemCategories[i];
    const check = await client.query("SELECT id FROM code_items WHERE category_id = $1 AND code = $2", [catId, item.code]);
    if (check.rows.length === 0) {
      await client.query(`
        INSERT INTO code_items (category_id, code, name_ar, name_en, sort_order, is_active)
        VALUES ($1, $2, $3, $4, $5, true);
      `, [catId, item.code, item.ar, item.en, i + 1]);
      console.log(`  + Inventory Item Category ${item.code} inserted.`);
    }
  }

  // 3. Movement Types MDM Category
  let movCat = await client.query("SELECT id FROM code_categories WHERE code = 'INVENTORY_MOVEMENT_TYPE'");
  let movCatId;
  if (movCat.rows.length === 0) {
    const res = await client.query(`
      INSERT INTO code_categories (code, name_ar, name_en, description, is_system, is_active)
      VALUES ('INVENTORY_MOVEMENT_TYPE', 'أنواع الحركات والمستندات المخزنية', 'Stock Movement Types', 'Inbound, Outbound, Transfer & Stocktakes', true, true)
      RETURNING id;
    `);
    movCatId = res.rows[0].id;
    console.log(`✅ Category INVENTORY_MOVEMENT_TYPE created.`);
  } else {
    movCatId = movCat.rows[0].id;
  }

  const movTypes = [
    { code: 'INBOUND_RECEIPT', ar: '📥 إذن استلام وتوريد مخزني', en: 'Inbound Stock Receipt' },
    { code: 'OUTBOUND_ISSUE', ar: '📤 إذن صرف إغاثي ميداني', en: 'Field Relief Stock Issue' },
    { code: 'INTERNAL_TRANSFER', ar: '🔄 نقل وتحويل بين المستودعات', en: 'Inter-Warehouse Transfer' },
    { code: 'STOCK_ADJUSTMENT', ar: '📋 تسوية وتسوية جردية', en: 'Stocktake Adjustment' },
  ];

  for (let i = 0; i < movTypes.length; i++) {
    const item = movTypes[i];
    const check = await client.query("SELECT id FROM code_items WHERE category_id = $1 AND code = $2", [movCatId, item.code]);
    if (check.rows.length === 0) {
      await client.query(`
        INSERT INTO code_items (category_id, code, name_ar, name_en, sort_order, is_active)
        VALUES ($1, $2, $3, $4, $5, true);
      `, [movCatId, item.code, item.ar, item.en, i + 1]);
      console.log(`  + Movement Type Item ${item.code} inserted.`);
    }
  }

  // 4. Create View v_inventory_valuation_summary
  await client.query(`
    CREATE OR REPLACE VIEW v_inventory_valuation_summary AS
    SELECT 
      w.name_ar AS warehouse_name_ar,
      w.governorate,
      COUNT(i.id) AS total_sku_count,
      SUM(i.quantity * i.unit_cost) AS total_valuation_yer,
      SUM(CASE WHEN i.expiry_date IS NOT NULL AND i.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 1 ELSE 0 END) AS expiring_sku_count
    FROM warehouses w
    LEFT JOIN inventory_items i ON w.id = i.warehouse_id
    GROUP BY w.id, w.name_ar, w.governorate;
  `);
  console.log('✅ View `v_inventory_valuation_summary` created/verified.');

  await client.end();
  console.log('🚀 Inventory & Warehouse Database Architecture Completed 100%!');
}

enhanceInventoryDB().catch(console.error);
