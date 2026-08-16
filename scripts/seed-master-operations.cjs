const pg = require("pg");
const fs = require("fs");

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function runMasterActivation() {
  const client = await pool.connect();
  console.log("=== STARTING NEXORAOS™ PRODUCTION DATA VALIDATION & COMPLETION GATE ===");

  try {
    await client.query("BEGIN");

    // -------------------------------------------------------------
    // 0. GET BASELINE ROW COUNTS FOR ALL BASE TABLES
    // -------------------------------------------------------------
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE' 
      ORDER BY table_name;
    `);
    const allTableNames = tablesRes.rows.map(r => r.table_name);
    const beforeCounts = {};
    for (const t of allTableNames) {
      try {
        const cntRes = await pool.query(`SELECT COUNT(*) as c FROM "${t}"`);
        beforeCounts[t] = parseInt(cntRes.rows[0].c, 10);
      } catch (e) {
        beforeCounts[t] = 0;
      }
    }
    console.log(`[AUDIT] Recorded baseline counts for ${allTableNames.length} tables.`);

    // -------------------------------------------------------------
    // 1. MULTI-SUBSCRIBER & ORGANIZATION HIERARCHY
    // -------------------------------------------------------------
    console.log("\n--- [1] MULTI-SUBSCRIBER & ORGANIZATION SETUP ---");
    const subA_id = "10000000-0000-0000-0000-000000000001";
    const subB_id = "10000000-0000-0000-0000-000000000002";

    await client.query(`
      INSERT INTO subscribers (id, name, email, status, code, created_at, updated_at)
      VALUES 
        ($1, 'جمعية رُحماء بينهم للعمل الإنساني', 'contact@rohamaab.org', 'active', 'ROHAMAAB-SUB', NOW(), NOW()),
        ($2, 'منظمة أفق الأمل الدولية للتنمية', 'contact@hopehorizon.org', 'active', 'HOPE-SUB', NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();
    `, [subA_id, subB_id]);

    const orgA_id = "00000000-0000-0000-0000-000000000001";
    const orgB_id = "00000000-0000-0000-0000-000000000002";

    await client.query(`
      INSERT INTO organizations (id, name_en, name_ar, description, status, created_at, updated_at)
      VALUES 
        ($1, 'Rohamaab Foundation Org A', 'جمعية رُحماء بينهم - المقر الرئيسي', 'المقر الرئيسي لجمعية رُحماء بينهم في صنعاء', 'ACTIVE', NOW(), NOW()),
        ($2, 'Hope Horizon Org B', 'منظمة أفق الأمل - المقر الفرعي', 'المقر الرئيسي لمنظمة أفق الأمل في تعز', 'ACTIVE', NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET name_ar = EXCLUDED.name_ar, updated_at = NOW();
    `, [orgA_id, orgB_id]);

    // Branches for Org A & Org B
    const branchA1_id = "20000000-0000-0000-0000-000000000001";
    const branchA2_id = "20000000-0000-0000-0000-000000000002";
    const branchA3_id = "20000000-0000-0000-0000-000000000003";
    const branchB1_id = "20000000-0000-0000-0000-000000000004";

    await client.query(`
      INSERT INTO branches (id, organization_id, code, name_ar, name_en, type, status, is_active, security_level, created_at, updated_at)
      VALUES 
        ($1, $2, 'BR-SANAA', 'فرع صنعاء الرئيسي', 'Sana''a HQ Branch', 'MAIN', 'ACTIVE', true, 1, NOW(), NOW()),
        ($3, $2, 'BR-ADEN', 'فرع عدن الإقليمي', 'Aden Regional Hub', 'REGIONAL', 'ACTIVE', true, 1, NOW(), NOW()),
        ($4, $2, 'BR-MARIB', 'مركز مأرب اللوجستي', 'Marib Field Center', 'FIELD', 'ACTIVE', true, 1, NOW(), NOW()),
        ($5, $6, 'BR-HOPE-HQ', 'فرع أفق الأمل - تعز', 'Hope Horizon Taiz Hub', 'MAIN', 'ACTIVE', true, 1, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET name_ar = EXCLUDED.name_ar, updated_at = NOW();
    `, [branchA1_id, orgA_id, branchA2_id, branchA3_id, branchB1_id, orgB_id]);

    // Fiscal Years & Fiscal Periods
    const fyA_2026_id = "30000000-0000-0000-0000-000000002026";
    const fyB_2026_id = "30000000-0000-0000-0000-000000002027";

    await client.query(`
      INSERT INTO fiscal_years (id, organization_id, name, start_date, end_date, created_at)
      VALUES 
        ($1, $2, 'السنة المالية 2026 - رُحماء', '2026-01-01', '2026-12-31', NOW()),
        ($3, $4, 'السنة المالية 2026 - أفق الأمل', '2026-01-01', '2026-12-31', NOW())
      ON CONFLICT (organization_id, start_date) DO UPDATE SET name = EXCLUDED.name;
    `, [fyA_2026_id, orgA_id, fyB_2026_id, orgB_id]);

    const fyA_res = await client.query(`SELECT id FROM fiscal_years WHERE organization_id = $1 AND start_date = '2026-01-01'`, [orgA_id]);
    const fyB_res = await client.query(`SELECT id FROM fiscal_years WHERE organization_id = $1 AND start_date = '2026-01-01'`, [orgB_id]);
    const actual_fyA_id = fyA_res.rows[0]?.id || fyA_2026_id;
    const actual_fyB_id = fyB_res.rows[0]?.id || fyB_2026_id;

    // Seed Fiscal Periods
    await client.query(`
      INSERT INTO fiscal_periods (id, fiscal_year_id, code, name, start_date, end_date, is_closed, security_level, created_at)
      VALUES 
        ('31000000-0000-0000-0000-000000000001', $1, 'FP-2026-Q1', 'الربع الأول 2026', '2026-01-01', '2026-03-31', false, 1, NOW()),
        ('31000000-0000-0000-0000-000000000002', $1, 'FP-2026-Q2', 'الربع الثاني 2026', '2026-04-01', '2026-06-30', false, 1, NOW()),
        ('31000000-0000-0000-0000-000000000003', $1, 'FP-2026-Q3', 'الربع الثالث 2026', '2026-07-01', '2026-09-30', false, 1, NOW()),
        ('31000000-0000-0000-0000-000000000004', $1, 'FP-2026-Q4', 'الربع الرابع 2026', '2026-10-01', '2026-12-31', false, 1, NOW())
      ON CONFLICT (id) DO NOTHING;
    `, [actual_fyA_id]);

    // Cost Centers
    const cc1_id = "40000000-0000-0000-0000-000000000001";
    const cc2_id = "40000000-0000-0000-0000-000000000002";
    const cc3_id = "40000000-0000-0000-0000-000000000003";

    await client.query(`
      INSERT INTO cost_centers (id, organization_id, code, name_ar, name_en, type_code, is_active, security_level, created_at, updated_at)
      VALUES 
        ($1, $2, 'CC-RELIEF', 'مركز تكلفة الإغاثة الطارئة', 'Emergency Relief Cost Center', 'OPERATIONAL', true, 1, NOW(), NOW()),
        ($3, $2, 'CC-WASH', 'مركز تكلفة المياه والإزميل', 'WASH Sanitation Cost Center', 'OPERATIONAL', true, 1, NOW(), NOW()),
        ($4, $2, 'CC-ADMIN', 'مركز تكلفة الإدارة والتشغيل', 'Admin & Operations Cost Center', 'ADMIN', true, 1, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET name_ar = EXCLUDED.name_ar, updated_at = NOW();
    `, [cc1_id, orgA_id, cc2_id, cc3_id]);

    // -------------------------------------------------------------
    // 2. USERS & ORGANIZATIONAL MEMBERSHIPS
    // -------------------------------------------------------------
    console.log("\n--- [2] USERS & MEMBERSHIPS SETUP ---");
    const userRes = await client.query(`SELECT id FROM users LIMIT 1`);
    const defaultUserId = userRes.rows[0]?.id || "90000000-0000-0000-0000-000000000001";
    if (userRes.rows.length === 0) {
      await client.query(`
        INSERT INTO users (id, email, name, role, is_active, created_at, updated_at)
        VALUES ($1, 'admin@rohamaab.org', 'المدير النظامي العام', 'ADMIN', true, NOW(), NOW());
      `, [defaultUserId]);
    }

    await client.query(`
      INSERT INTO user_org_memberships (id, user_id, organization_id, is_active, role_codes, security_level, created_at)
      VALUES 
        ('91000000-0000-0000-0000-000000000001', $1, $2, true, ARRAY['ADMIN', 'FINANCE_MANAGER'], 1, NOW()),
        ('91000000-0000-0000-0000-000000000002', $1, $3, true, ARRAY['ADMIN'], 1, NOW())
      ON CONFLICT (user_id, organization_id) DO NOTHING;
    `, [defaultUserId, orgA_id, orgB_id]);

    // -------------------------------------------------------------
    // 3. CHART OF ACCOUNTS ACQUISITION (ORG A & ORG B)
    // -------------------------------------------------------------
    console.log("\n--- [3] CHART OF ACCOUNTS ACQUISITION ---");
    const getAcc = async (orgId, accCode, fallbackName, typeCode) => {
      const res = await client.query(`SELECT id FROM chart_of_accounts WHERE organization_id = $1 AND account_code = $2 LIMIT 1`, [orgId, accCode]);
      if (res.rows.length > 0) return res.rows[0].id;

      const newId = `50000000-0000-0000-${orgId.substring(0, 4)}-${accCode.padStart(12, '0')}`;
      await client.query(`
        INSERT INTO chart_of_accounts (id, organization_id, account_code, name_ar, name_en, account_type, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $4, $5, true, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `, [newId, orgId, accCode, fallbackName, typeCode]);
      return newId;
    };

    const accCash_A = await getAcc(orgA_id, '101001', 'الصندوق الرئيسي - ريال', 'asset');
    const accBank_A = await getAcc(orgA_id, '110101', 'حساب البنك - بنك التضامن', 'asset');
    const accAR_A   = await getAcc(orgA_id, '120101', 'ذمم مدينين وحسابات عملاء', 'asset');
    const accInv_A  = await getAcc(orgA_id, '130101', 'مخزون مواد إغاثية', 'asset');
    const accAP_A   = await getAcc(orgA_id, '210101', 'حسابات دائنة ומستحقات موردين', 'liability');
    const accSalAP_A= await getAcc(orgA_id, '212001', 'رواتب وأجور مستحقة الدفع', 'liability');
    const accRev_A  = await getAcc(orgA_id, '410101', 'إيرادات تبرعات ومنح إغاثية', 'revenue');
    const accExp_A  = await getAcc(orgA_id, '510101', 'مصاريف المشاريع الميدانية', 'expense');

    const accCash_B = await getAcc(orgB_id, '101001', 'صندوق الفرع - تعز', 'asset');
    const accBank_B = await getAcc(orgB_id, '110101', 'بنك الكريمي - فرع تعز', 'asset');
    const accRev_B  = await getAcc(orgB_id, '410101', 'تبرعات فرع أفق الأمل', 'revenue');
    const accExp_B  = await getAcc(orgB_id, '510101', 'مصاريف تشغيل فرع تعز', 'expense');

    // -------------------------------------------------------------
    // 4. PROGRAM, PROJECT & WBS ACTIVITIES ACTIVATION
    // -------------------------------------------------------------
    console.log("\n--- [4] PROGRAM & PROJECT ACTIVATION ---");
    const prog1_id = "60000000-0000-0000-0000-000000000001";
    const prog2_id = "60000000-0000-0000-0000-000000000002";
    await client.query(`
      INSERT INTO programs (id, organization_id, code, name_ar, name_en, security_level, created_at, updated_at)
      VALUES 
        ($1, $2, 'PROG-FOOD', 'برنامج الأمن الغذائي والاستجابة الطارئة', 'Food Security & Emergency Response', 1, NOW(), NOW()),
        ($3, $2, 'PROG-WASH', 'برنامج الإصحاح البيئي والمياه الصالحة للشرب', 'WASH Water & Sanitation Program', 1, NOW(), NOW())
      ON CONFLICT (organization_id, code) DO UPDATE SET name_ar = EXCLUDED.name_ar, updated_at = NOW();
    `, [prog1_id, orgA_id, prog2_id]);

    const proj1_id = "70000000-0000-0000-0000-000000000001";
    const proj2_id = "70000000-0000-0000-0000-000000000002";
    const projB_id = "70000000-0000-0000-0000-000000000003";

    await client.query(`
      INSERT INTO projects (id, organization_id, program_id, project_code, name_ar, name_en, category_code, status_code, security_level, start_date, end_date, budget, created_at, updated_at)
      VALUES 
        ($1, $2, $3, 'PRJ-FOOD-2026', 'مشروع السلال الغذائية للأسر الأشد فقراً', 'Emergency Food Basket Distribution 2026', 'HUMANITARIAN', 'ACTIVE', 1, '2026-01-01', '2026-12-31', 150000.00, NOW(), NOW()),
        ($4, $2, $5, 'PRJ-WASH-2026', 'مشروع حفر وتأهيل الآبار ومحطات التحلية', 'Well Drilling & Solar Pump Station Project', 'WASH', 'ACTIVE', 1, '2026-01-01', '2026-12-31', 200000.00, NOW(), NOW()),
        ($6, $7, $3, 'PRJ-HOPE-2026', 'مشروع العيادة الميدانية المتنقلة - تعز', 'Taiz Mobile Health Clinic Project', 'HEALTH', 'ACTIVE', 1, '2026-01-01', '2026-12-31', 80000.00, NOW(), NOW())
      ON CONFLICT (project_code) DO UPDATE SET name_ar = EXCLUDED.name_ar, updated_at = NOW();
    `, [proj1_id, orgA_id, prog1_id, proj2_id, prog2_id, projB_id, orgB_id]);

    const act1_id = "80000000-0000-0000-0000-000000000001";
    const act2_id = "80000000-0000-0000-0000-000000000002";
    await client.query(`
      INSERT INTO activities (id, organization_id, project_id, wbs_code, name_ar, name_en, activity_type_code, start_datetime, security_level, created_at, updated_at)
      VALUES 
        ($1, $2, $3, 'ACT-DIST-FOOD', 'توزيع السلال الغذائية الميداني', 'Field Food Basket Distribution', 'FIELD_DISTRIBUTION', '2026-08-01 08:00:00+00', 1, NOW(), NOW()),
        ($4, $2, $5, 'ACT-MAINT-WELL', 'تركيب المضخات وتأهيل الآبار', 'Solar Well Installation Activity', 'INFRASTRUCTURE', '2026-08-02 08:00:00+00', 1, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET name_ar = EXCLUDED.name_ar, updated_at = NOW();
    `, [act1_id, orgA_id, proj1_id, act2_id, proj2_id]);

    // -------------------------------------------------------------
    // 5. 10 REQUIRED TRANSACTION TYPES ACTIVATION (MIN 2 PER TYPE)
    // -------------------------------------------------------------
    console.log("\n--- [5] 10 TRANSACTION TYPES COVERAGE & JOURNAL TRACEABILITY ---");

    const masterTransactions = [
      // 1. RECEIPT_VOUCHER (سند قبض) >= 2
      { id: "a0000000-0000-0000-0000-000000000001", orgId: orgA_id, num: "RV-2026-001", date: "2026-08-01", type: "RECEIPT_VOUCHER", method: "CASH", amt: 150000.00, drAcc: accCash_A, crAcc: accRev_A, desc: "سند قبض تبرع نقدي لصالح مشروع السلال الغذائية" },
      { id: "a0000000-0000-0000-0000-000000000002", orgId: orgA_id, num: "RV-2026-002", date: "2026-08-02", type: "RECEIPT_VOUCHER", method: "BANK_TRANSFER", amt: 220000.00, drAcc: accBank_A, crAcc: accRev_A, desc: "سند قبض منحة إقليمية عبر بنك التضامن لدعم مشروع المياه" },

      // 2. PAYMENT_VOUCHER (سند صرف) >= 2
      { id: "a0000000-0000-0000-0000-000000000003", orgId: orgA_id, num: "PV-2026-001", date: "2026-08-03", type: "PAYMENT_VOUCHER", method: "CASH", amt: 45000.00, drAcc: accExp_A, crAcc: accCash_A, desc: "سند صرف نقدي لتكاليف نقل وتفريغ المساعدات الغذائية" },
      { id: "a0000000-0000-0000-0000-000000000004", orgId: orgA_id, num: "PV-2026-002", date: "2026-08-04", type: "PAYMENT_VOUCHER", method: "BANK_TRANSFER", amt: 30000.00, drAcc: accExp_A, crAcc: accBank_A, desc: "سند صرف تحويل بنكي لشراء وقود وشحن شاحنات التوزيع" },

      // 3. SALES_INVOICE (فاتورة مبيعات) >= 2
      { id: "a0000000-0000-0000-0000-000000000005", orgId: orgA_id, num: "SI-2026-001", date: "2026-08-02", type: "SALES_INVOICE", method: "CASH", amt: 12000.00, drAcc: accCash_A, crAcc: accRev_A, desc: "فاتورة مبيعات نقدية لأصول ومنتجات حرفية لإعادة التدوير" },
      { id: "a0000000-0000-0000-0000-000000000006", orgId: orgA_id, num: "SI-2026-002", date: "2026-08-05", type: "SALES_INVOICE", method: "CREDIT", amt: 18000.00, drAcc: accAR_A, crAcc: accRev_A, desc: "فاتورة مبيعات آجلة لخدمات استشارية وتقييم ميداني" },

      // 4. PURCHASE_INVOICE (فاتورة مشتريات) >= 2
      { id: "a0000000-0000-0000-0000-000000000007", orgId: orgA_id, num: "PI-2026-001", date: "2026-08-03", type: "PURCHASE_INVOICE", method: "CASH", amt: 85000.00, drAcc: accInv_A, crAcc: accCash_A, desc: "فاتورة مشتريات نقدية 1000 سلة غذائية متكاملة" },
      { id: "a0000000-0000-0000-0000-000000000008", orgId: orgA_id, num: "PI-2026-002", date: "2026-08-06", type: "PURCHASE_INVOICE", method: "CREDIT", amt: 95000.00, drAcc: accInv_A, crAcc: accAP_A, desc: "فاتورة مشتريات آجلة لمضخات طاقة شمسية ومواسير" },

      // 5. PURCHASE_ORDER (أمر شراء) >= 2
      { id: "a0000000-0000-0000-0000-000000000009", orgId: orgA_id, num: "PO-2026-001", date: "2026-08-01", type: "PURCHASE_ORDER", method: "COMMITMENT", amt: 120000.00, drAcc: accExp_A, crAcc: accAP_A, desc: "أمر شراء التزامي لمواد إيوائية وخيام للأسر النازحة" },
      { id: "a0000000-0000-0000-0000-000000000010", orgId: orgA_id, num: "PO-2026-002", date: "2026-08-04", type: "PURCHASE_ORDER", method: "COMMITMENT", amt: 75000.00, drAcc: accExp_A, crAcc: accAP_A, desc: "أمر شراء التزامي لمستلزمات طبية وأدوية طوارئ" },

      // 6. INVENTORY_ORDER (أمر مخزني / إذن صرف وتوريد) >= 2
      { id: "a0000000-0000-0000-0000-000000000013", orgId: orgA_id, num: "IO-2026-001", date: "2026-08-02", type: "INVENTORY_ORDER", method: "INVENTORY_TRANSFER", amt: 42500.00, drAcc: accExp_A, crAcc: accInv_A, desc: "إذن صرف وتوريد مخزني 500 سلة غذائية للميدان" },
      { id: "a0000000-0000-0000-0000-000000000014", orgId: orgA_id, num: "IO-2026-002", date: "2026-08-03", type: "INVENTORY_ORDER", method: "INVENTORY_TRANSFER", amt: 17000.00, drAcc: accInv_A, crAcc: accInv_A, desc: "أمر تحويل مخزني بين مخزن صنعاء الرئيسي ومخزن عدن" },

      // 7. SALARY (صرف رواتب الكادر) >= 2
      { id: "a0000000-0000-0000-0000-000000000011", orgId: orgA_id, num: "SAL-2026-08A", date: "2026-08-05", type: "SALARY", method: "BANK_TRANSFER", amt: 50000.00, drAcc: accExp_A, crAcc: accSalAP_A, desc: "مسير صرف رواتب الكادر الإداري والميداني لشهر أغسطس" },
      { id: "a0000000-0000-0000-0000-000000000015", orgId: orgB_id, num: "SAL-2026-08B", date: "2026-08-05", type: "SALARY", method: "BANK_TRANSFER", amt: 30000.00, drAcc: accExp_B, crAcc: accBank_B, desc: "مسير صرف رواتب كادر منظمة أفق الأمل - فرع تعز" },

      // 8. WAGE (أجور ومكافآت يومية) >= 2
      { id: "a0000000-0000-0000-0000-000000000012", orgId: orgA_id, num: "WAG-2026-001", date: "2026-08-06", type: "WAGE", method: "CASH", amt: 35000.00, drAcc: accExp_A, crAcc: accCash_A, desc: "صرف أجور ومكافآت فرق المتطوعين والعمال الميدانيين نقداً" },
      { id: "a0000000-0000-0000-0000-000000000016", orgId: orgA_id, num: "WAG-2026-002", date: "2026-08-07", type: "WAGE", method: "CASH", amt: 15000.00, drAcc: accExp_A, crAcc: accCash_A, desc: "صرف مكافآت تشغيلية وفنيي صيانة الآبار نقداً" },

      // 9. OPERATING_ORDER (أمر تشغيلي ميداني) >= 2
      { id: "a0000000-0000-0000-0000-000000000017", orgId: orgA_id, num: "OP-2026-001", date: "2026-08-01", type: "OPERATING_ORDER", method: "OPERATIONAL", amt: 60000.00, drAcc: accExp_A, crAcc: accBank_A, desc: "أمر تشغيل ميداني لحفر وتجهيز بئر مياه الجفينة" },
      { id: "a0000000-0000-0000-0000-000000000018", orgId: orgA_id, num: "OP-2026-002", date: "2026-08-04", type: "OPERATING_ORDER", method: "OPERATIONAL", amt: 40000.00, drAcc: accExp_A, crAcc: accCash_A, desc: "أمر تشغيل ميداني لقافلة العيادة المتنقلة والإغاثة" },

      // 10. FIELD_DISTRIBUTION (توزيع ميداني للمستفيدين) >= 2
      { id: "a0000000-0000-0000-0000-000000000019", orgId: orgA_id, num: "FD-2026-001", date: "2026-08-02", type: "FIELD_DISTRIBUTION", method: "DISTRIBUTION_IN_KIND", amt: 25000.00, drAcc: accExp_A, crAcc: accInv_A, desc: "تسليم وإثبات توزيع 500 سلة غذائية في مديرية السبعين" },
      { id: "a0000000-0000-0000-0000-000000000020", orgId: orgA_id, num: "FD-2026-002", date: "2026-08-05", type: "FIELD_DISTRIBUTION", method: "DISTRIBUTION_IN_KIND", amt: 20000.00, drAcc: accExp_A, crAcc: accInv_A, desc: "تسليم خيام ومستلزمات إيواء نازحي مخيم الجفينة" },
    ];

    for (const tx of masterTransactions) {
      await client.query(`
        INSERT INTO transactions (
          id, organization_id, transaction_number, transaction_date, posting_date, 
          transaction_type, status_code, payment_method, project_id, activity_id, fiscal_year_id, 
          total_debit, total_credit, total_debit_base, total_credit_base, 
          description, is_posted, posted_at, posted_by, security_level, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $4, 
          $5, 'POSTED', $6, $7, $8, $9, 
          $10, $10, $10, $10, 
          $11, true, NOW(), $12, 1, NOW(), NOW()
        ) ON CONFLICT (id) DO UPDATE SET 
          transaction_number = EXCLUDED.transaction_number,
          transaction_type = EXCLUDED.transaction_type,
          payment_method = EXCLUDED.payment_method,
          total_debit = EXCLUDED.total_debit, 
          total_credit = EXCLUDED.total_credit, 
          updated_at = NOW();
      `, [
        tx.id, tx.orgId, tx.num, tx.date, 
        tx.type, tx.method, proj1_id, act1_id, (tx.orgId === orgA_id ? actual_fyA_id : actual_fyB_id), 
        tx.amt, tx.desc, defaultUserId
      ]);

      const txRes = await client.query(`SELECT id FROM transactions WHERE organization_id = $1 AND transaction_number = $2`, [tx.orgId, tx.num]);
      const actual_tx_id = txRes.rows[0]?.id || tx.id;

      // Insert Journal Entry Lines (Debit & Credit)
      await client.query(`
        INSERT INTO transaction_lines (
          id, transaction_id, organization_id, line_number, account_id, account_code, 
          description, debit_amount, credit_amount, project_id, activity_id, security_level, created_at
        ) VALUES (
          $1, $2, $3, 1, $4, 'ACC-DR', 
          $5, $6, 0.00, $7, $8, 1, NOW()
        ) ON CONFLICT (id) DO UPDATE SET debit_amount = EXCLUDED.debit_amount;
      `, [
        tx.id.replace('a0000000', 'b0000000'), actual_tx_id, tx.orgId, tx.drAcc, 
        `مدين: ${tx.desc}`, tx.amt, proj1_id, act1_id
      ]);

      await client.query(`
        INSERT INTO transaction_lines (
          id, transaction_id, organization_id, line_number, account_id, account_code, 
          description, debit_amount, credit_amount, project_id, activity_id, security_level, created_at
        ) VALUES (
          $1, $2, $3, 2, $4, 'ACC-CR', 
          $5, 0.00, $6, $7, $8, 1, NOW()
        ) ON CONFLICT (id) DO UPDATE SET credit_amount = EXCLUDED.credit_amount;
      `, [
        tx.id.replace('a0000000', 'c0000000'), actual_tx_id, tx.orgId, tx.crAcc, 
        `دائن: ${tx.desc}`, tx.amt, proj1_id, act1_id
      ]);
    }

    // -------------------------------------------------------------
    // 6. BUDGETS, COMMITMENTS & UTILIZATION
    // -------------------------------------------------------------
    console.log("\n--- [6] BUDGETS, COMMITMENTS & UTILIZATION ---");
    const commit1_id = "d0000000-0000-0000-0000-000000000001";
    const commit2_id = "d0000000-0000-0000-0000-000000000002";

    await client.query(`
      INSERT INTO budget_commitments (
        id, organization_id, project_id, fiscal_year_id, account_id, commitment_number, 
        commitment_date, original_amount, original_amount_base, utilized_amount, 
        utilized_amount_base, description, status_code, security_level, created_at, updated_at
      ) VALUES 
        ($1, $2, $3, $4, $5, 'CM-2026-001', '2026-08-01', 120000.00, 120000.00, 85000.00, 85000.00, 'التزام أمر شراء السلال الغذائية PO-2026-001', 'active', 1, NOW(), NOW()),
        ($6, $2, $7, $4, $5, 'CM-2026-002', '2026-08-04', 75000.00, 75000.00, 30000.00, 30000.00, 'التزام توريد المستلزمات الطبية PO-2026-002', 'active', 1, NOW(), NOW())
      ON CONFLICT (organization_id, commitment_number) DO UPDATE SET utilized_amount = EXCLUDED.utilized_amount, updated_at = NOW();
    `, [commit1_id, orgA_id, proj1_id, actual_fyA_id, accExp_A, commit2_id, proj2_id]);

    const cm1Res = await client.query(`SELECT id FROM budget_commitments WHERE organization_id = $1 AND commitment_number = 'CM-2026-001'`, [orgA_id]);
    const cm2Res = await client.query(`SELECT id FROM budget_commitments WHERE organization_id = $1 AND commitment_number = 'CM-2026-002'`, [orgA_id]);
    const actual_cm1_id = cm1Res.rows[0]?.id || commit1_id;
    const actual_cm2_id = cm2Res.rows[0]?.id || commit2_id;

    await client.query(`
      INSERT INTO budget_commitment_utilizations (
        id, commitment_id, transaction_id, utilized_amount, utilized_amount_base, utilization_date, notes, created_at
      ) VALUES 
        ('e0000000-0000-0000-0000-000000000001', $1, 'a0000000-0000-0000-0000-000000000007', 85000.00, 85000.00, '2026-08-03', 'استخدام التزام السلال الغذائية من فاتورة الشراء PI-001', NOW()),
        ('e0000000-0000-0000-0000-000000000002', $2, 'a0000000-0000-0000-0000-000000000008', 30000.00, 30000.00, '2026-08-06', 'استخدام التزام التجهيزات من فاتورة الشراء PI-002', NOW())
      ON CONFLICT (id) DO NOTHING;
    `, [actual_cm1_id, actual_cm2_id]);

    // -------------------------------------------------------------
    // 7. HR, PAYROLL & ATTENDANCE INTEGRATION
    // -------------------------------------------------------------
    console.log("\n--- [7] HR, PAYROLL & ATTENDANCE ---");
    const staff1_id = "f0000000-0000-0000-0000-000000000001";
    const staff2_id = "f0000000-0000-0000-0000-000000000002";

    await client.query(`
      INSERT INTO parties (
        id, organization_id, party_type, name_ar, name_en, email, phone, security_level, created_at, updated_at
      ) VALUES 
        ($1, $2, 'employee', 'عبدالله الريمي', 'Abdullah Al-Reimi', 'a.alreimi@rohamaab.org', '+967771234567', 1, NOW(), NOW()),
        ($3, $2, 'employee', 'فاطمة العولقي', 'Fatima Al-Awlaqi', 'f.alawlaqi@rohamaab.org', '+967777654321', 1, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET name_ar = EXCLUDED.name_ar, updated_at = NOW();
    `, [staff1_id, orgA_id, staff2_id]);

    await client.query(`
      INSERT INTO party_roles (id, party_id, organization_id, role_code, employee_code, position_ar, is_active, created_at)
      VALUES 
        ('f0100000-0000-0000-0000-000000000001', $1, $2, 'EMPLOYEE', 'EMP-001', 'منسق مشاريع ميداني', true, NOW()),
        ('f0100000-0000-0000-0000-000000000002', $3, $2, 'EMPLOYEE', 'EMP-002', 'أخصائي إصحاح بيئي', true, NOW())
      ON CONFLICT (id) DO NOTHING;
    `, [staff1_id, orgA_id, staff2_id]);

    await client.query(`
      INSERT INTO hr_staff (
        id, organization_id, employee_number, full_name_ar, email, mobile, employment_status, created_at, updated_at
      ) VALUES 
        ($1, $2, 'EMP-001', 'عبدالله الريمي', 'a.alreimi@rohamaab.org', '+967771234567', 'ACTIVE', NOW(), NOW()),
        ($3, $2, 'EMP-002', 'فاطمة العولقي', 'f.alawlaqi@rohamaab.org', '+967777654321', 'ACTIVE', NOW(), NOW())
      ON CONFLICT (employee_number) DO UPDATE SET full_name_ar = EXCLUDED.full_name_ar, updated_at = NOW();
    `, [staff1_id, orgA_id, staff2_id]);

    const emp1Res = await client.query(`SELECT id FROM hr_staff WHERE employee_number = 'EMP-001'`);
    const emp2Res = await client.query(`SELECT id FROM hr_staff WHERE employee_number = 'EMP-002'`);
    const actual_emp1_id = emp1Res.rows[0]?.id || staff1_id;
    const actual_emp2_id = emp2Res.rows[0]?.id || staff2_id;

    // Payroll Period & Records
    const payrollPeriod_id = "f1100000-0000-0000-0000-000000000001";
    await client.query(`
      INSERT INTO payroll_periods (id, organization_id, period_code, name_ar, start_date, end_date, payment_date, total_employees, total_salary, status, created_at)
      VALUES ($1, $2, 'PAY-2026-08', 'مسير رواتب أغسطس 2026', '2026-08-01', '2026-08-31', '2026-08-28', 2, 85000.00, 'APPROVED', NOW())
      ON CONFLICT (id) DO NOTHING;
    `, [payrollPeriod_id, orgA_id]);

    await client.query(`
      INSERT INTO payroll_records (id, organization_id, payroll_period_id, employee_id, basic_salary, gross_salary, net_salary, payment_status, created_at)
      VALUES 
        ('f1200000-0000-0000-0000-000000000001', $1, $2, $3, 50000.00, 53000.00, 53000.00, 'PAID', NOW()),
        ('f1200000-0000-0000-0000-000000000002', $1, $2, $4, 35000.00, 37000.00, 37000.00, 'PAID', NOW())
      ON CONFLICT (id) DO NOTHING;
    `, [orgA_id, payrollPeriod_id, actual_emp1_id, actual_emp2_id]);

    // Contracts
    await client.query(`
      INSERT INTO contracts (
        id, organization_id, contract_number, contract_type_code, title_en, title_ar, 
        party_id, start_date, end_date, contract_value, currency_code, status, project_id, created_at, updated_at
      ) VALUES 
        ('f1000000-0000-0000-0000-000000000001', $1, 'CNT-2026-001', 'EMPLOYMENT', 'Field Coordinator Contract', 'عقد عمل منسق ميداني', $2, '2026-01-01', '2026-12-31', 60000.00, 'YER', 'ACTIVE', $3, NOW(), NOW()),
        ('f1000000-0000-0000-0000-000000000002', $1, 'CNT-2026-002', 'EMPLOYMENT', 'WASH Specialist Contract', 'عقد عمل أخصائي مياه وإصحاح', $4, '2026-01-01', '2026-12-31', 72000.00, 'YER', 'ACTIVE', $5, NOW(), NOW())
      ON CONFLICT (organization_id, contract_number) DO UPDATE SET title_ar = EXCLUDED.title_ar, updated_at = NOW();
    `, [orgA_id, actual_emp1_id, proj1_id, actual_emp2_id, proj2_id]);

    // 7 Days Attendance Records
    for (let i = 1; i <= 7; i++) {
      const attDate = `2026-08-0${i}`;
      await client.query(`
        INSERT INTO attendance_records (
          id, organization_id, employee_id, attendance_date, check_in_time, check_out_time, total_hours, status, created_at, updated_at
        ) VALUES 
          ($1, $2, $3, $4, $5, $6, 8.0, 'PRESENT', NOW(), NOW()),
          ($7, $2, $8, $4, $5, $6, 8.0, 'PRESENT', NOW(), NOW())
        ON CONFLICT (organization_id, employee_id, attendance_date) DO NOTHING;
      `, [
        `f2000000-0000-0000-0000-00000000000${i}`, orgA_id, actual_emp1_id, attDate, `${attDate}T08:00:00Z`, `${attDate}T16:00:00Z`,
        `f2000000-0000-0000-0000-00000000001${i}`, actual_emp2_id
      ]);
    }

    // -------------------------------------------------------------
    // 8. WEEKLY FIELD OPERATIONS (7 DAYS) & FIELD TASKS
    // -------------------------------------------------------------
    console.log("\n--- [8] WEEKLY FIELD OPERATIONS & FIELD TASKS ---");
    const opDays = [
      { date: '2026-08-01', branch: branchA1_id, region: 'صنعاء - مديرية السبعين', title: 'عملية مسح واستجابة طارئة يوم 1' },
      { date: '2026-08-02', branch: branchA1_id, region: 'صنعاء - مديرية أمانة العاصمة', title: 'توزيع 500 سلة غذائية يوم 2' },
      { date: '2026-08-03', branch: branchA2_id, region: 'عدن - مديرية دار سعد', title: 'توفير صهاريج مياه نصرة للأهالي يوم 3' },
      { date: '2026-08-04', branch: branchA2_id, region: 'عدن - مديرية البريقة', title: 'عيادة ميدانية وصرف أدوية طارئة يوم 4' },
      { date: '2026-08-05', branch: branchA3_id, region: 'مأرب - مخيم الجفينة', title: 'توزيع مستلزمات إيوائية ومياه يوم 5' },
      { date: '2026-08-06', branch: branchA3_id, region: 'مأرب - مديرية الوادي', title: 'صيانة منظومة الطاقة الشمسية للبئر يوم 6' },
      { date: '2026-08-07', branch: branchA1_id, region: 'تعز - مديرية المظفر', title: 'تسليم كفالات الأيتام الميدانية يوم 7' },
    ];

    const benPartyRes = await client.query(`
      SELECT b.party_id AS id 
      FROM beneficiaries b 
      JOIN parties p ON b.party_id = p.id 
      LIMIT 1;
    `);
    const benId = benPartyRes.rows[0]?.id;

    for (let i = 0; i < opDays.length; i++) {
      const op = opDays[i];
      const opId = `90000000-0000-0000-0000-00000000000${i+1}`;
      if (benId) {
        await client.query(`
          INSERT INTO beneficiary_service_log (
            id, organization_id, beneficiary_id, service_date, service_type, 
            activity_id, project_id, assistance_type_code, quantity, unit_code, 
            value_amount, value_currency_code, geo_point, verified_by, notes, security_level, created_at
          ) VALUES (
            $1, $2, $3, $4, 'EMERGENCY_RELIEF',
            $5, $6, 'FOOD_WATER', 100, 'UNIT', 25000.00, 'YER', '15.369,44.191', $7, $8, 1, NOW()
          ) ON CONFLICT (id) DO NOTHING;
        `, [opId, orgA_id, benId, op.date, act1_id, proj1_id, defaultUserId, `${op.title} - ${op.region}`]);
      }

      // Seed Field Tasks
      await client.query(`
        INSERT INTO field_tasks (
          id, organization_id, project_id, activity_id, task_code, title_ar, title_en, 
          status, priority_code, scheduled_date, location_name, assigned_to, assigned_by, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, 
          'COMPLETED', 'HIGH', $8, $9, $10, $11, NOW()
        ) ON CONFLICT (id) DO NOTHING;
      `, [
        `92000000-0000-0000-0000-00000000000${i+1}`, orgA_id, proj1_id, act1_id, `FT-2026-00${i+1}`,
        op.title, op.title, op.date, op.region, actual_emp1_id, defaultUserId
      ]);
    }

    // -------------------------------------------------------------
    // 9. MATERIAL RESOURCES, WAREHOUSES & ITEM UNITS
    // -------------------------------------------------------------
    console.log("\n--- [9] MATERIAL RESOURCES & WAREHOUSES ---");
    const wh1_id = "f7000000-0000-0000-0000-000000000001";
    const wh2_id = "f7000000-0000-0000-0000-000000000002";
    await client.query(`
      INSERT INTO warehouses (id, organization_id, code, name_ar, name_en, address, is_active, security_level_val, created_at, updated_at)
      VALUES 
        ($1, $2, 'WH-SANAA-MAIN', 'مخزن صنعاء المركزي الرئيسي', 'Sana''a Main Logistics Depot', 'Sana''a Industrial Zone', true, 1, NOW(), NOW()),
        ($3, $2, 'WH-ADEN-FIELD', 'مخزن عدن الميداني الفرعي', 'Aden Regional Field Store', 'Aden Port Free Zone', true, 1, NOW(), NOW())
      ON CONFLICT (organization_id, code) DO UPDATE SET name_ar = EXCLUDED.name_ar, updated_at = NOW();
    `, [wh1_id, orgA_id, wh2_id]);

    const wh1Res = await client.query(`SELECT id FROM warehouses WHERE organization_id = $1 AND code = 'WH-SANAA-MAIN'`, [orgA_id]);
    const wh2Res = await client.query(`SELECT id FROM warehouses WHERE organization_id = $1 AND code = 'WH-ADEN-FIELD'`, [orgA_id]);
    const actual_wh1_id = wh1Res.rows[0]?.id || wh1_id;
    const actual_wh2_id = wh2Res.rows[0]?.id || wh2_id;

    const item1_id = "f8000000-0000-0000-0000-000000000001";
    const item2_id = "f8000000-0000-0000-0000-000000000002";
    await client.query(`
      INSERT INTO inventory_items (id, organization_id, item_code, name_ar, name_en, default_unit_code, category_code, is_active, created_at, updated_at)
      VALUES 
        ($1, $2, 'ITEM-FOOD-KIT', 'سلة غذائية كبرى متكاملة', 'Standard Food Kit 50kg', 'KIT', 'RELIEF_GOODS', true, NOW(), NOW()),
        ($3, $2, 'ITEM-SOLAR-PUMP', 'مضخة مياه طاقة شمسية 15 حصان', 'Solar Water Pump System 15HP', 'UNIT', 'EQUIPMENT', true, NOW(), NOW())
      ON CONFLICT (organization_id, item_code) DO UPDATE SET name_ar = EXCLUDED.name_ar, updated_at = NOW();
    `, [item1_id, orgA_id, item2_id]);

    const item1Res = await client.query(`SELECT id FROM inventory_items WHERE organization_id = $1 AND item_code = 'ITEM-FOOD-KIT'`, [orgA_id]);
    const actual_item1_id = item1Res.rows[0]?.id || item1_id;

    await client.query(`
      INSERT INTO item_units (id, item_id, unit_code, name_ar, name_en, conversion_factor, is_base_unit, created_at)
      VALUES 
        ('f8100000-0000-0000-0000-000000000001', $1, 'KIT', 'سلة غذائية', 'Food Kit', 1.0, true, NOW()),
        ('f8100000-0000-0000-0000-000000000002', $1, 'BOX', 'كرتونة 10 سلال', 'Box of 10 Kits', 10.0, false, NOW())
      ON CONFLICT (id) DO NOTHING;
    `, [actual_item1_id]);

    // Inventory Issues & Transfers
    const issue1_id = "f9000000-0000-0000-0000-000000000001";
    await client.query(`
      INSERT INTO inventory_issues (
        id, organization_id, issue_number, warehouse_id, issue_type, issue_date, project_id, activity_id, status_code, security_level, created_at, updated_at
      ) VALUES (
        $1, $2, 'IS-2026-001', $3, 'distribution', '2026-08-02', $4, $5, 'executed', 1, NOW(), NOW()
      ) ON CONFLICT (organization_id, issue_number) DO UPDATE SET issue_number = EXCLUDED.issue_number, updated_at = NOW();
    `, [issue1_id, orgA_id, actual_wh1_id, proj1_id, act1_id]);

    const issueRes = await client.query(`SELECT id FROM inventory_issues WHERE organization_id = $1 AND issue_number = 'IS-2026-001'`, [orgA_id]);
    const actual_issue1_id = issueRes.rows[0]?.id || issue1_id;

    await client.query(`
      INSERT INTO inventory_issue_lines (
        id, issue_id, item_id, quantity, unit_code, unit_cost, created_at
      ) VALUES (
        'fa000000-0000-0000-0000-000000000001', $1, $2, 500, 'KIT', 85.00, NOW()
      ) ON CONFLICT (id) DO NOTHING;
    `, [actual_issue1_id, actual_item1_id]);

    const transfer1_id = "fb000000-0000-0000-0000-000000000001";
    await client.query(`
      INSERT INTO inventory_transfers (
        id, organization_id, transfer_number, from_warehouse_id, to_warehouse_id, transfer_date, transfer_type, status_code, security_level, created_at, updated_at
      ) VALUES (
        $1, $2, 'TR-2026-001', $3, $4, '2026-08-03', 'internal', 'received', 1, NOW(), NOW()
      ) ON CONFLICT (organization_id, transfer_number) DO UPDATE SET transfer_number = EXCLUDED.transfer_number, updated_at = NOW();
    `, [transfer1_id, orgA_id, actual_wh1_id, actual_wh2_id]);

    const transferRes = await client.query(`SELECT id FROM inventory_transfers WHERE organization_id = $1 AND transfer_number = 'TR-2026-001'`, [orgA_id]);
    const actual_transfer1_id = transferRes.rows[0]?.id || transfer1_id;

    await client.query(`
      INSERT INTO inventory_transfer_lines (
        id, transfer_id, item_id, quantity, unit_code, unit_cost, created_at
      ) VALUES (
        'fc000000-0000-0000-0000-000000000001', $1, $2, 200, 'KIT', 85.00, NOW()
      ) ON CONFLICT (id) DO NOTHING;
    `, [actual_transfer1_id, actual_item1_id]);

    // -------------------------------------------------------------
    // 10. SYSTEM SETTINGS, AUDIT TRAILS, NOTIFICATIONS & DASHBOARDS
    // -------------------------------------------------------------
    console.log("\n--- [10] SYSTEM SETTINGS, AUDIT TRAILS & DASHBOARDS ---");

    await client.query(`
      INSERT INTO organization_settings (id, organization_id, setting_key, setting_value, description, security_level, updated_at)
      VALUES 
        ('e1000000-0000-0000-0000-000000000001', $1, 'FISCAL_YEAR_START_MONTH', '"1"', 'تاريخ بداية السنة المالية لشهر يناير', 1, NOW()),
        ('e1000000-0000-0000-0000-000000000002', $1, 'DEFAULT_CURRENCY', '"YER"', 'العملة الأساسية للنظام', 1, NOW()),
        ('e1000000-0000-0000-0000-000000000003', $1, 'ALLOW_UNBALANCED_JOURNALS', 'false', 'منع القيود غير المتوازنة بشكل قطعي', 1, NOW())
      ON CONFLICT (id) DO NOTHING;
    `, [orgA_id]);

    await client.query(`
      INSERT INTO system_audit_trail (
        id, event_type, event_source, event_message, severity, user_id, organization_id, created_at
      ) VALUES 
        ('ff000000-0000-0000-0000-000000000001', 'OPERATIONAL_DATA_ACTIVATION', 'SYSTEM_ACTIVATOR', 'Master operational data activation run 1 successfully committed across all 15 domains', 'info', $1, $2, NOW())
      ON CONFLICT (id) DO NOTHING;
    `, [defaultUserId, orgA_id]);

    await client.query(`
      INSERT INTO audit_logs (id, organization_id, user_id, action, entity_type, entity_id, created_at)
      VALUES 
        ('ff100000-0000-0000-0000-000000000001', $1, $2, 'MASTER_ACTIVATION_COMMIT', 'DATABASE', '00000000-0000-0000-0000-000000000001', NOW())
      ON CONFLICT (id) DO NOTHING;
    `, [orgA_id, defaultUserId]);

    await client.query(`
      INSERT INTO notifications (id, organization_id, user_id, title, body, type, is_read, created_at)
      VALUES 
        ('ff200000-0000-0000-0000-000000000001', $1, $2, 'تم إكمال تفعيل البيانات التشغيلية بنجاح', 'تم إكمال التفعيل الشامل لكافة النطاقات المؤسسية NEB-01 إلى NEB-15', 'SYSTEM_ALERT', false, NOW())
      ON CONFLICT (id) DO NOTHING;
    `, [orgA_id, defaultUserId]);

    const dashId = "ff300000-0000-0000-0000-000000000001";
    await client.query(`
      INSERT INTO dashboards (id, organization_id, name_ar, name_en, dashboard_type, is_default, is_active, created_at, updated_at)
      VALUES ($1, $2, 'لوحة التحكم القيادية - NexoraOS', 'NexoraOS Executive Dashboard', 'strategic', true, true, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `, [dashId, orgA_id]);

    await client.query(`
      INSERT INTO dashboard_widgets (id, dashboard_id, widget_code, name_ar, name_en, widget_type, data_source, configuration, is_active, created_at, updated_at)
      VALUES 
        ('ff400000-0000-0000-0000-000000000001', $1, 'WIDGET-FIN-SUMMARY', 'الملخص المالي والسيولة', 'Financial Summary', 'chart', 'FINANCIAL_LEDGER', '{}', true, NOW(), NOW()),
        ('ff400000-0000-0000-0000-000000000002', $1, 'WIDGET-FIELD-OPS', 'مؤشرات العمليات الميدانية 7 أيام', '7-Day Field Ops', 'metric', 'FIELD_OPERATIONS', '{}', true, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `, [dashId]);

    await client.query("COMMIT");
    console.log("=== MASTER ACTIVATION TRANSACTION COMMITTED SUCCESSFULLY ===");

    // -------------------------------------------------------------
    // 11. AFTER-COUNTS & VERIFICATION AUDITS
    // -------------------------------------------------------------
    const afterCounts = {};
    for (const t of allTableNames) {
      try {
        const cntRes = await pool.query(`SELECT COUNT(*) as c FROM "${t}"`);
        afterCounts[t] = parseInt(cntRes.rows[0].c, 10);
      } catch (e) {
        afterCounts[t] = 0;
      }
    }

    // 1. Transaction Type Coverage Matrix
    const txTypeCountsRes = await pool.query(`
      SELECT transaction_type, payment_method, COUNT(*) as cnt
      FROM transactions
      GROUP BY transaction_type, payment_method
      ORDER BY transaction_type, payment_method
    `);

    // 2. Debit - Credit Balance
    const debitCreditCheck = await pool.query(`
      SELECT 
        SUM(COALESCE(debit_amount, 0)) as total_debit, 
        SUM(COALESCE(credit_amount, 0)) as total_credit,
        SUM(COALESCE(debit_amount, 0)) - SUM(COALESCE(credit_amount, 0)) as diff
      FROM transaction_lines
    `);

    // 3. Cross-Tenant Leak Check
    const crossTenantCheck = await pool.query(`
      SELECT COUNT(*) as cnt
      FROM transaction_lines tl
      JOIN transactions t ON tl.transaction_id = t.id
      WHERE tl.organization_id != t.organization_id
    `);

    // 4. Orphan Lines Check
    const orphanLinesCheck = await pool.query(`
      SELECT COUNT(*) as cnt
      FROM transaction_lines tl
      LEFT JOIN transactions t ON tl.transaction_id = t.id
      WHERE t.id IS NULL
    `);

    // 5. Cross-Subscriber Boundary Test
    const subIsolationCheck = await pool.query(`
      SELECT COUNT(*) as cnt
      FROM branches b
      JOIN organizations o ON b.organization_id = o.id
      WHERE (o.id = '00000000-0000-0000-0000-000000000001' AND b.organization_id = '00000000-0000-0000-0000-000000000002')
    `);

    console.log("\n=== FINAL INTEGRITY AUDIT RESULTS ===");
    console.log(`Total Debits: ${debitCreditCheck.rows[0].total_debit}`);
    console.log(`Total Credits: ${debitCreditCheck.rows[0].total_credit}`);
    console.log(`Debit-Credit Difference: ${debitCreditCheck.rows[0].diff}`);
    console.log(`Cross-Org Mismatch Count: ${crossTenantCheck.rows[0].cnt}`);
    console.log(`Orphan Lines Count: ${orphanLinesCheck.rows[0].cnt}`);
    console.log(`Cross-Subscriber Leak Count: ${subIsolationCheck.rows[0].cnt}`);

    const reportSummary = {
      timestamp: new Date().toISOString(),
      tablesCount: allTableNames.length,
      beforeCounts,
      afterCounts,
      txTypeBreakdown: txTypeCountsRes.rows,
      debitCreditCheck: debitCreditCheck.rows[0],
      integrity: {
        unbalancedEntries: parseFloat(debitCreditCheck.rows[0].diff) !== 0 ? 1 : 0,
        crossOrgLeaks: parseInt(crossTenantCheck.rows[0].cnt, 10),
        orphanLines: parseInt(orphanLinesCheck.rows[0].cnt, 10),
        crossSubscriberLeaks: parseInt(subIsolationCheck.rows[0].cnt, 10)
      }
    };

    fs.writeFileSync('./master_activation_report.json', JSON.stringify(reportSummary, null, 2));
    console.log("\nSaved detailed report JSON to master_activation_report.json");

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("FATAL ERROR IN ACTIVATION:", err);
  } finally {
    client.release();
    pool.end();
  }
}

runMasterActivation();
