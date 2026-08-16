const pg = require("pg");

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function runMasterActivation() {
  const client = await pool.connect();
  console.log("=== STARTING NEXORAOS™ MASTER OPERATIONAL DATA ACTIVATION ===");

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
      const cntRes = await client.query(`SELECT COUNT(*) as c FROM "${t}"`);
      beforeCounts[t] = parseInt(cntRes.rows[0].c, 10);
    }
    console.log(`[AUDIT] Recorded baseline counts for ${allTableNames.length} tables.`);

    // -------------------------------------------------------------
    // 1. MULTI-SUBSCRIBER & ORGANIZATION ACTIVATION
    // -------------------------------------------------------------
    console.log("\n--- [1] MULTI-SUBSCRIBER & ORGANIZATION SETUP ---");
    const subA_id = "10000000-0000-0000-0000-000000000001";
    const subB_id = "10000000-0000-0000-0000-000000000002";

    await client.query(`
      INSERT INTO subscribers (id, name, code, is_active, created_at, updated_at)
      VALUES 
        ($1, 'جمعية رُحماء بينهم للعمل الإنساني', 'ROHAMAAB-SUB', true, NOW(), NOW()),
        ($2, 'منظمة أفق الأمل الدولية للتنمية', 'HOPE-SUB', true, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();
    `, [subA_id, subB_id]);

    const orgA_id = "00000000-0000-0000-0000-000000000001";
    const orgB_id = "00000000-0000-0000-0000-000000000002";

    await client.query(`
      INSERT INTO organizations (id, name, name_ar, code, status, created_at, updated_at)
      VALUES 
        ($1, 'Rohamaab Foundation Org A', 'جمعية رُحماء بينهم - المقر الرئيسي', 'ROH-ORG-A', 'ACTIVE', NOW(), NOW()),
        ($2, 'Hope Horizon Org B', 'منظمة أفق الأمل - المقر الفرعي', 'HOPE-ORG-B', 'ACTIVE', NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();
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

    // Fiscal Years for Org A & Org B
    const fyA_2026_id = "30000000-0000-0000-0000-000000002026";
    const fyB_2026_id = "30000000-0000-0000-0000-000000002027";

    await client.query(`
      INSERT INTO fiscal_years (id, organization_id, name, year, start_date, end_date, status_code, created_at, updated_at)
      VALUES 
        ($1, $2, 'السنة المالية 2026 - رُحماء', 2026, '2026-01-01', '2026-12-31', 'OPEN', NOW(), NOW()),
        ($3, $4, 'السنة المالية 2026 - أفق الأمل', 2026, '2026-01-01', '2026-12-31', 'OPEN', NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();
    `, [fyA_2026_id, orgA_id, fyB_2026_id, orgB_id]);

    // Cost Centers for Org A
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
    // 2. CHART OF ACCOUNTS & USERS ACTIVATION
    // -------------------------------------------------------------
    console.log("\n--- [2] CHART OF ACCOUNTS & USERS CHECK ---");
    const accCashRes = await client.query(`
      SELECT id, account_code FROM chart_of_accounts WHERE organization_id = $1 AND account_code LIKE '1%' LIMIT 2;
    `, [orgA_id]);
    const accBankRes = await client.query(`
      SELECT id, account_code FROM chart_of_accounts WHERE organization_id = $1 AND account_code LIKE '11%' LIMIT 2;
    `, [orgA_id]);
    const accExpRes = await client.query(`
      SELECT id, account_code FROM chart_of_accounts WHERE organization_id = $1 AND account_code LIKE '5%' LIMIT 2;
    `, [orgA_id]);
    const accRevRes = await client.query(`
      SELECT id, account_code FROM chart_of_accounts WHERE organization_id = $1 AND account_code LIKE '4%' LIMIT 2;
    `, [orgA_id]);

    let accCashId = accCashRes.rows[0]?.id;
    let accBankId = accBankRes.rows[0]?.id || accCashId;
    let accExpId = accExpRes.rows[0]?.id;
    let accRevId = accRevRes.rows[0]?.id;

    if (!accCashId) {
      accCashId = "50000000-0000-0000-0000-000000000101";
      await client.query(`
        INSERT INTO chart_of_accounts (id, organization_id, account_code, name_ar, name_en, type_code, is_active, created_at, updated_at)
        VALUES ($1, $2, '101001', 'الصندوق الرئيسي - ريال', 'Main Cash YER', 'ASSET', true, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `, [accCashId, orgA_id]);
    }
    if (!accExpId) {
      accExpId = "50000000-0000-0000-0000-000000000501";
      await client.query(`
        INSERT INTO chart_of_accounts (id, organization_id, account_code, name_ar, name_en, type_code, is_active, created_at, updated_at)
        VALUES ($1, $2, '501001', 'مصاريف المشاريع الميدانية', 'Field Project Expenses', 'EXPENSE', true, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `, [accExpId, orgA_id]);
    }
    if (!accRevId) {
      accRevId = "50000000-0000-0000-0000-000000000401";
      await client.query(`
        INSERT INTO chart_of_accounts (id, organization_id, account_code, name_ar, name_en, type_code, is_active, created_at, updated_at)
        VALUES ($1, $2, '401001', 'تبرعات ورعايات إغاثية', 'Relief Donations Revenue', 'REVENUE', true, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `, [accRevId, orgA_id]);
    }

    const userRes = await client.query(`SELECT id FROM users LIMIT 1`);
    const defaultUserId = userRes.rows[0]?.id || "90000000-0000-0000-0000-000000000001";
    if (userRes.rows.length === 0) {
      await client.query(`
        INSERT INTO users (id, email, name, role, is_active, created_at, updated_at)
        VALUES ($1, 'admin@rohamaab.org', 'المدير النظامي العام', 'ADMIN', true, NOW(), NOW());
      `, [defaultUserId]);
    }

    // -------------------------------------------------------------
    // 3. OPERATIONAL WEEK (7 DAYS) & PROGRAM / PROJECT ACTIVATION
    // -------------------------------------------------------------
    console.log("\n--- [3] OPERATIONAL WEEK (7 DAYS) & WBS ACTIVITIES ---");
    const prog1_id = "60000000-0000-0000-0000-000000000001";
    const prog2_id = "60000000-0000-0000-0000-000000000002";
    await client.query(`
      INSERT INTO programs (id, organization_id, code, name_ar, name_en, status, created_at, updated_at)
      VALUES 
        ($1, $2, 'PROG-FOOD', 'برنامج الأمن الغذائي والاستجابة الطارئة', 'Food Security & Emergency Response', 'ACTIVE', NOW(), NOW()),
        ($3, $2, 'PROG-WASH', 'برنامج الإصحاح البيئي والمياه الصالحة للشرب', 'WASH Water & Sanitation Program', 'ACTIVE', NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET name_ar = EXCLUDED.name_ar, updated_at = NOW();
    `, [prog1_id, orgA_id, prog2_id]);

    const proj1_id = "70000000-0000-0000-0000-000000000001";
    const proj2_id = "70000000-0000-0000-0000-000000000002";
    await client.query(`
      INSERT INTO projects (id, organization_id, program_id, code, name_ar, name_en, status, start_date, end_date, budget, created_at, updated_at)
      VALUES 
        ($1, $2, $3, 'PRJ-FOOD-2026', 'مشروع السلال الغذائية للأسر الأشد فقراً', 'Emergency Food Basket Distribution 2026', 'ACTIVE', '2026-01-01', '2026-12-31', 150000.00, NOW(), NOW()),
        ($4, $2, $5, 'PRJ-WASH-2026', 'مشروع حفر وتأهيل الآبار ومحطات التحلية', 'Well Drilling & Solar Pump Station Project', 'ACTIVE', '2026-01-01', '2026-12-31', 200000.00, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET name_ar = EXCLUDED.name_ar, updated_at = NOW();
    `, [proj1_id, orgA_id, prog1_id, proj2_id, prog2_id]);

    const act1_id = "80000000-0000-0000-0000-000000000001";
    const act2_id = "80000000-0000-0000-0000-000000000002";
    await client.query(`
      INSERT INTO activities (id, organization_id, project_id, code, name_ar, name_en, status_code, security_level, created_at, updated_at)
      VALUES 
        ($1, $2, $3, 'ACT-DIST-FOOD', 'توزيع السلال الغذائية الميداني', 'Field Food Basket Distribution', 'ACTIVE', 1, NOW(), NOW()),
        ($4, $2, $5, 'ACT-MAINT-WELL', 'تركيب المضخات وتأهيل الآبار', 'Solar Well Installation Activity', 'ACTIVE', 1, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET name_ar = EXCLUDED.name_ar, updated_at = NOW();
    `, [act1_id, orgA_id, proj1_id, act2_id, proj2_id]);

    const opDays = [
      { date: '2026-08-01', branch: branchA1_id, region: 'صنعاء - مديرية السبعين', title: 'عملية مسح واستجابة طارئة يوم 1' },
      { date: '2026-08-02', branch: branchA1_id, region: 'صنعاء - مديرية أمانة العاصمة', title: 'توزيع 500 سلة غذائية يوم 2' },
      { date: '2026-08-03', branch: branchA2_id, region: 'عدن - مديرية دار سعد', title: 'توفير صهاريج مياه نصرة للأهالي يوم 3' },
      { date: '2026-08-04', branch: branchA2_id, region: 'عدن - مديرية البريقة', title: 'عيادة ميدانية وصرف أدوية طارئة يوم 4' },
      { date: '2026-08-05', branch: branchA3_id, region: 'مأرب - مخيم الجفينة', title: 'توزيع مستلزمات إيوائية ومياه يوم 5' },
      { date: '2026-08-06', branch: branchA3_id, region: 'مأرب - مديرية الوادي', title: 'صيانة منظومة الطاقة الشمسية للبئر يوم 6' },
      { date: '2026-08-07', branch: branchA1_id, region: 'تعز - مديرية المظفر', title: 'تسليم كفالات الأيتام الميدانية يوم 7' },
    ];

    for (let i = 0; i < opDays.length; i++) {
      const op = opDays[i];
      const opId = `90000000-0000-0000-0000-00000000000${i+1}`;
      await client.query(`
        INSERT INTO beneficiary_service_log (
          id, organization_id, beneficiary_id, service_date, service_type, 
          activity_id, project_id, assistance_type_code, quantity, unit_code, 
          value_amount, value_currency_code, geo_point, verified_by, notes, security_level, created_at
        ) VALUES (
          $1, $2, (SELECT id FROM beneficiaries LIMIT 1), $3, 'EMERGENCY_RELIEF',
          $4, $5, 'FOOD_WATER', 100, 'UNIT', 25000.00, 'YER', '15.369,44.191', $6, $7, 1, NOW()
        ) ON CONFLICT (id) DO NOTHING;
      `, [opId, orgA_id, op.date, act1_id, proj1_id, defaultUserId, `${op.title} - ${op.region}`]);
    }

    // -------------------------------------------------------------
    // 4. TRANSACTION ACTIVATION (MIN 2 INDEPENDENT PER TYPE)
    // -------------------------------------------------------------
    console.log("\n--- [4] TRANSACTION ACTIVATION (RECEIPT, PAYMENT, INVOICES, ORDERS, SALARIES) ---");

    const financialTxTypes = [
      { id: "a0000000-0000-0000-0000-000000000001", type: "RECEIPT_VOUCHER", num: "RV-2026-001", date: "2026-08-01", amt: 150000.00, desc: "سند قبض تبرع نقدي لصالح مشروع السلال الغذائية" },
      { id: "a0000000-0000-0000-0000-000000000002", type: "RECEIPT_VOUCHER", num: "RV-2026-002", date: "2026-08-02", amt: 220000.00, desc: "سند قبض منحة إقليمية لدعم مشروع المياه" },
      { id: "a0000000-0000-0000-0000-000000000003", type: "PAYMENT_VOUCHER", num: "PV-2026-001", date: "2026-08-03", amt: 45000.00, desc: "سند صرف تكاليف نقل وتفريغ المساعدات الغذائية" },
      { id: "a0000000-0000-0000-0000-000000000004", type: "PAYMENT_VOUCHER", num: "PV-2026-002", date: "2026-08-04", amt: 30000.00, desc: "سند صرف شراء الوقود والديزل لشاحنات التوزيع" },
      { id: "a0000000-0000-0000-0000-000000000005", type: "SALES_INVOICE", num: "SI-2026-001", date: "2026-08-02", amt: 12000.00, desc: "فاتورة مبيعات أصول ومنتجات حرفية لإعادة التدوير" },
      { id: "a0000000-0000-0000-0000-000000000006", type: "SALES_INVOICE", num: "SI-2026-002", date: "2026-08-05", amt: 18000.00, desc: "فاتورة مبيعات خدمات استشارية وتقييم ميداني" },
      { id: "a0000000-0000-0000-0000-000000000007", type: "PURCHASE_INVOICE", num: "PI-2026-001", date: "2026-08-03", amt: 85000.00, desc: "فاتورة مشتريات 1000 سلة غذائية متكاملة" },
      { id: "a0000000-0000-0000-0000-000000000008", type: "PURCHASE_INVOICE", num: "PI-2026-002", date: "2026-08-06", amt: 95000.00, desc: "فاتورة مشتريات مضخات طاقة شمسية ومواسير" },
      { id: "a0000000-0000-0000-0000-000000000009", type: "PURCHASE_ORDER", num: "PO-2026-001", date: "2026-08-01", amt: 120000.00, desc: "أمر شراء مواد إيوائية وخيام للأسر النازحة" },
      { id: "a0000000-0000-0000-0000-000000000010", type: "PURCHASE_ORDER", num: "PO-2026-002", date: "2026-08-04", amt: 75000.00, desc: "أمر شراء مستلزمات طبية وأدوية طوارئ" },
      { id: "a0000000-0000-0000-0000-000000000011", type: "SALARY_PAYMENT", num: "SAL-2026-08A", date: "2026-08-05", amt: 50000.00, desc: "صرف رواتب وأجور الكادر الميداني لشهر يوليو/أغسطس" },
      { id: "a0000000-0000-0000-0000-000000000012", type: "SALARY_PAYMENT", num: "SAL-2026-08B", date: "2026-08-06", amt: 35000.00, desc: "صرف أجور ومكافآت فرق المتطوعين الميدانيين" },
    ];

    for (const tx of financialTxTypes) {
      await client.query(`
        INSERT INTO transactions (
          id, organization_id, transaction_number, transaction_date, posting_date, 
          transaction_type, status_code, project_id, activity_id, fiscal_year_id, 
          total_debit, total_credit, total_debit_base, total_credit_base, 
          description, is_posted, posted_at, posted_by, security_level, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $4, 
          $5, 'POSTED', $6, $7, $8, 
          $9, $9, $9, $9, 
          $10, true, NOW(), $11, 1, NOW(), NOW()
        ) ON CONFLICT (id) DO UPDATE SET 
          total_debit = EXCLUDED.total_debit, 
          total_credit = EXCLUDED.total_credit, 
          updated_at = NOW();
      `, [
        tx.id, orgA_id, tx.num, tx.date, 
        tx.type, proj1_id, act1_id, fyA_2026_id, 
        tx.amt, tx.desc, defaultUserId
      ]);

      const isReceiptOrRev = (tx.type === 'RECEIPT_VOUCHER' || tx.type === 'SALES_INVOICE');
      const drAcc = isReceiptOrRev ? accCashId : accExpId;
      const crAcc = isReceiptOrRev ? accRevId : accBankId;

      await client.query(`
        INSERT INTO transaction_lines (
          id, transaction_id, organization_id, line_number, account_id, account_code, 
          description, debit_amount, credit_amount, project_id, activity_id, security_level, created_at
        ) VALUES (
          $1, $2, $3, 1, $4, 'ACC-DR', 
          $5, $6, 0.00, $7, $8, 1, NOW()
        ) ON CONFLICT (id) DO UPDATE SET debit_amount = EXCLUDED.debit_amount;
      `, [
        tx.id.replace('a0000000', 'b0000000'), tx.id, orgA_id, drAcc, 
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
        tx.id.replace('a0000000', 'c0000000'), tx.id, orgA_id, crAcc, 
        `دائن: ${tx.desc}`, tx.amt, proj1_id, act1_id
      ]);
    }

    // -------------------------------------------------------------
    // 6. BUDGETS & COMMITMENTS ACTIVATION
    // -------------------------------------------------------------
    console.log("\n--- [6] BUDGETS, COMMITMENTS & UTILIZATION ---");
    const commit1_id = "d0000000-0000-0000-0000-000000000001";
    const commit2_id = "d0000000-0000-0000-0000-000000000002";

    await client.query(`
      INSERT INTO budget_commitments (
        id, organization_id, project_id, fiscal_year_id, account_id, commitment_number, 
        commitment_date, original_amount, original_amount_base, utilized_amount, 
        utilized_amount_base, remaining_amount, description, status_code, security_level, created_at, updated_at
      ) VALUES 
        ($1, $2, $3, $4, $5, 'CM-2026-001', '2026-08-01', 120000.00, 120000.00, 85000.00, 85000.00, 35000.00, 'التزام أمر شراء السلال الغذائية PO-2026-001', 'ACTIVE', 1, NOW(), NOW()),
        ($6, $2, $7, $4, $5, 'CM-2026-002', '2026-08-04', 75000.00, 75000.00, 30000.00, 30000.00, 45000.00, 'التزام توريد المستلزمات الطبية PO-2026-002', 'ACTIVE', 1, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET utilized_amount = EXCLUDED.utilized_amount, updated_at = NOW();
    `, [commit1_id, orgA_id, proj1_id, fyA_2026_id, accExpId, commit2_id, proj2_id]);

    await client.query(`
      INSERT INTO budget_commitment_utilizations (
        id, commitment_id, transaction_id, utilized_amount, utilized_amount_base, utilization_date, notes, created_at
      ) VALUES 
        ('e0000000-0000-0000-0000-000000000001', $1, 'a0000000-0000-0000-0000-000000000007', 85000.00, 85000.00, '2026-08-03', 'استخدام التزام السلال الغذائية من فاتورة الشراء PI-001', NOW()),
        ('e0000000-0000-0000-0000-000000000002', $2, 'a0000000-0000-0000-0000-000000000008', 30000.00, 30000.00, '2026-08-06', 'استخدام التزام التجهيزات من فاتورة الشراء PI-002', NOW())
      ON CONFLICT (id) DO NOTHING;
    `, [commit1_id, commit2_id]);

    // -------------------------------------------------------------
    // 7. HR OPERATIONS (CONTRACTS, ATTENDANCE, LEAVES, SALARIES, EVALUATIONS, TRAINING)
    // -------------------------------------------------------------
    console.log("\n--- [7] HR OPERATIONS DATA ---");
    const staff1_id = "f0000000-0000-0000-0000-000000000001";
    const staff2_id = "f0000000-0000-0000-0000-000000000002";

    await client.query(`
      INSERT INTO hr_staff (
        id, organization_id, employee_number, first_name_ar, last_name_ar, email, phone, status, created_at, updated_at
      ) VALUES 
        ($1, $2, 'EMP-001', 'عبدالله', 'الريمي', 'a.alreimi@rohamaab.org', '+967771234567', 'ACTIVE', NOW(), NOW()),
        ($3, $2, 'EMP-002', 'فاطمة', 'العولقي', 'f.alawlaqi@rohamaab.org', '+967777654321', 'ACTIVE', NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET first_name_ar = EXCLUDED.first_name_ar, updated_at = NOW();
    `, [staff1_id, orgA_id, staff2_id]);

    const contract1_id = "f1000000-0000-0000-0000-000000000001";
    const contract2_id = "f1000000-0000-0000-0000-000000000002";
    await client.query(`
      INSERT INTO contracts (
        id, organization_id, contract_number, contract_type_code, title_en, title_ar, 
        party_id, start_date, end_date, contract_value, currency_code, status, project_id, created_at, updated_at
      ) VALUES 
        ($1, $2, 'CNT-2026-001', 'EMPLOYMENT', 'Field Coordinator Contract', 'عقد عمل منسق ميداني', (SELECT id FROM parties LIMIT 1), '2026-01-01', '2026-12-31', 60000.00, 'YER', 'ACTIVE', $3, NOW(), NOW()),
        ($4, $2, 'CNT-2026-002', 'EMPLOYMENT', 'WASH Specialist Contract', 'عقد عمل أخصائي مياه وإصحاح', (SELECT id FROM parties LIMIT 1), '2026-01-01', '2026-12-31', 72000.00, 'YER', 'ACTIVE', $5, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET title_ar = EXCLUDED.title_ar, updated_at = NOW();
    `, [contract1_id, orgA_id, proj1_id, contract2_id, proj2_id]);

    for (let i = 1; i <= 7; i++) {
      const attDate = `2026-08-0${i}`;
      await client.query(`
        INSERT INTO attendance_records (
          id, organization_id, employee_id, attendance_date, check_in_time, check_out_time, total_hours, status, created_at, updated_at
        ) VALUES 
          ($1, $2, $3, $4, $5, $6, 8.0, 'PRESENT', NOW(), NOW()),
          ($7, $2, $8, $4, $5, $6, 8.0, 'PRESENT', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `, [
        `f2000000-0000-0000-0000-00000000000${i}`, orgA_id, staff1_id, attDate, `${attDate}T08:00:00Z`, `${attDate}T16:00:00Z`,
        `f2000000-0000-0000-0000-00000000001${i}`, staff2_id
      ]);
    }

    await client.query(`
      INSERT INTO hr_leaves (
        id, organization_id, staff_id, leave_type, start_date, end_date, days_count, reason, approval_status, created_at, updated_at
      ) VALUES 
        ('f3000000-0000-0000-0000-000000000001', $1, $2, 'ANNUAL', '2026-08-10', '2026-08-12', 3, 'إجازة سنوية اعتيادية', 'APPROVED', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `, [orgA_id, staff1_id]);

    await client.query(`
      INSERT INTO hr_salaries (
        id, organization_id, staff_id, salary_month, salary_year, basic_salary, allowances, deductions, net_salary, payment_status, transaction_id, created_at, updated_at
      ) VALUES 
        ('f4000000-0000-0000-0000-000000000001', $1, $2, 8, 2026, 50000.00, 5000.00, 2000.00, 53000.00, 'PAID', 'a0000000-0000-0000-0000-000000000011', NOW(), NOW()),
        ('f4000000-0000-0000-0000-000000000002', $1, $3, 8, 2026, 35000.00, 3000.00, 1000.00, 37000.00, 'PAID', 'a0000000-0000-0000-0000-000000000012', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `, [orgA_id, staff1_id, staff2_id]);

    await client.query(`
      INSERT INTO hr_performance_evaluations (
        id, organization_id, staff_id, evaluation_period, evaluation_year, evaluation_date, performance_score, overall_rating, status, created_at, updated_at
      ) VALUES 
        ('f5000000-0000-0000-0000-000000000001', $1, $2, 'Q2-2026', 2026, '2026-07-31', 94.5, 'EXCELLENT', 'COMPLETED', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `, [orgA_id, staff1_id]);

    await client.query(`
      INSERT INTO hr_training (
        id, organization_id, training_name_ar, training_name_en, start_date, end_date, duration_hours, certification_provided, status, created_at, updated_at
      ) VALUES 
        ('f6000000-0000-0000-0000-000000000001', $1, 'دورة المعايير الإنسانية المتقدمة (Sphere Standard)', 'Advanced Sphere Humanitarian Standards Training', '2026-07-15', '2026-07-18', 24, true, 'COMPLETED', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `, [orgA_id]);

    // -------------------------------------------------------------
    // 8. MATERIAL RESOURCES, INVENTORY ISSUES & TRANSFERS
    // -------------------------------------------------------------
    console.log("\n--- [8] MATERIAL RESOURCES & INVENTORY MOVEMENTS ---");
    const wh1_id = "g0000000-0000-0000-0000-000000000001";
    const wh2_id = "g0000000-0000-0000-0000-000000000002";
    await client.query(`
      INSERT INTO warehouses (id, organization_id, code, name_ar, name_en, location, status, security_level, created_at, updated_at)
      VALUES 
        ($1, $2, 'WH-SANAA-MAIN', 'مخزن صنعاء المركزي الرئيسي', 'Sana''a Main Logistics Depot', 'Sana''a Industrial Zone', 'ACTIVE', 1, NOW(), NOW()),
        ($3, $2, 'WH-ADEN-FIELD', 'مخزن عدن الميداني الفرعي', 'Aden Regional Field Store', 'Aden Port Free Zone', 'ACTIVE', 1, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET name_ar = EXCLUDED.name_ar, updated_at = NOW();
    `, [wh1_id, orgA_id, wh2_id]);

    const item1_id = "g1000000-0000-0000-0000-000000000001";
    const item2_id = "g1000000-0000-0000-0000-000000000002";
    await client.query(`
      INSERT INTO inventory_items (id, organization_id, item_code, name_ar, name_en, unit_code, category_code, is_active, created_at, updated_at)
      VALUES 
        ($1, $2, 'ITEM-FOOD-KIT', 'سلة غذائية كبرى متكاملة', 'Standard Food Kit 50kg', 'KIT', 'RELIEF_GOODS', true, NOW(), NOW()),
        ($3, $2, 'ITEM-SOLAR-PUMP', 'مضخة مياه طاقة شمسية 15 حصان', 'Solar Water Pump System 15HP', 'UNIT', 'EQUIPMENT', true, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET name_ar = EXCLUDED.name_ar, updated_at = NOW();
    `, [item1_id, orgA_id, item2_id]);

    const issue1_id = "g2000000-0000-0000-0000-000000000001";
    await client.query(`
      INSERT INTO inventory_issues (
        id, organization_id, issue_number, warehouse_id, issue_type, issue_date, project_id, activity_id, status_code, security_level, created_at, updated_at
      ) VALUES (
        $1, $2, 'IS-2026-001', $3, 'PROJECT_DISTRIBUTION', '2026-08-02', $4, $5, 'EXECUTED', 1, NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET issue_number = EXCLUDED.issue_number, updated_at = NOW();
    `, [issue1_id, orgA_id, wh1_id, proj1_id, act1_id]);

    await client.query(`
      INSERT INTO inventory_issue_lines (
        id, issue_id, item_id, quantity, unit_code, unit_cost, total_cost, created_at
      ) VALUES (
        'g3000000-0000-0000-0000-000000000001', $1, $2, 500, 'KIT', 85.00, 42500.00, NOW()
      ) ON CONFLICT (id) DO NOTHING;
    `, [issue1_id, item1_id]);

    const transfer1_id = "g4000000-0000-0000-0000-000000000001";
    await client.query(`
      INSERT INTO inventory_transfers (
        id, organization_id, transfer_number, from_warehouse_id, to_warehouse_id, transfer_date, transfer_type, status_code, security_level, created_at, updated_at
      ) VALUES (
        $1, $2, 'TR-2026-001', $3, $4, '2026-08-03', 'BRANCH_RELOCATION', 'COMPLETED', 1, NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET transfer_number = EXCLUDED.transfer_number, updated_at = NOW();
    `, [transfer1_id, orgA_id, wh1_id, wh2_id]);

    await client.query(`
      INSERT INTO inventory_transfer_lines (
        id, transfer_id, item_id, quantity, unit_code, unit_cost, total_cost, created_at
      ) VALUES (
        'g5000000-0000-0000-0000-000000000001', $1, $2, 200, 'KIT', 85.00, 17000.00, NOW()
      ) ON CONFLICT (id) DO NOTHING;
    `, [transfer1_id, item1_id]);

    await client.query(`
      INSERT INTO volunteers (
        id, name, email, phone, field, status, hours, created_at
      ) VALUES (
        'h0000000-0000-0000-0000-000000000001', 'محمد الأحمدي', 'm.alahmadi@volunteers.org', '+967770001122', 'إغاثة ميدانية وتوزيع', 'ACTIVE', 45, NOW()
      ) ON CONFLICT (id) DO NOTHING;
    `);

    const spId = (await client.query(`SELECT id FROM sponsorships LIMIT 1`)).rows[0]?.id;
    if (spId) {
      await client.query(`
        INSERT INTO sponsorship_payments (
          id, organization_id, sponsorship_id, payment_date, payment_amount, payment_method, reference_number, created_at
        ) VALUES (
          'h1000000-0000-0000-0000-000000000001', $1, $2, '2026-08-07', 150.00, 'BANK_TRANSFER', 'SP-REF-2026-01', NOW()
        ) ON CONFLICT (id) DO NOTHING;
      `, [orgA_id, spId]);
    }

    await client.query(`
      INSERT INTO system_audit_trail (
        id, event_type, event_source, event_message, severity, user_id, organization_id, created_at
      ) VALUES 
        ('i0000000-0000-0000-0000-000000000001', 'OPERATIONAL_DATA_ACTIVATION', 'SYSTEM_ACTIVATOR', 'Master operational data activation run 1 successfully committed across all 15 domains', 'INFO', $1, $2, NOW())
      ON CONFLICT (id) DO NOTHING;
    `, [defaultUserId, orgA_id]);

    await client.query("COMMIT");
    console.log("=== MASTER ACTIVATION TRANSACTION COMMITTED SUCCESSFULLY ===");

    const afterCounts = {};
    for (const t of allTableNames) {
      const cntRes = await client.query(`SELECT COUNT(*) as c FROM "${t}"`);
      afterCounts[t] = parseInt(cntRes.rows[0].c, 10);
    }

    const debitCreditCheck = await client.query(`
      SELECT 
        SUM(COALESCE(debit_amount, 0)) as total_debit, 
        SUM(COALESCE(credit_amount, 0)) as total_credit,
        SUM(COALESCE(debit_amount, 0)) - SUM(COALESCE(credit_amount, 0)) as diff
      FROM transaction_lines
    `);

    const crossOrgCheck = await client.query(`
      SELECT COUNT(*) as cnt
      FROM transaction_lines tl
      JOIN transactions t ON tl.transaction_id = t.id
      WHERE tl.organization_id != t.organization_id
    `);

    const orphanLinesCheck = await client.query(`
      SELECT COUNT(*) as cnt
      FROM transaction_lines tl
      LEFT JOIN transactions t ON tl.transaction_id = t.id
      WHERE t.id IS NULL
    `);

    console.log("\n=== INTEGRITY AUDIT RESULTS ===");
    console.log(`Total Debits: ${debitCreditCheck.rows[0].total_debit}`);
    console.log(`Total Credits: ${debitCreditCheck.rows[0].total_credit}`);
    console.log(`Debit-Credit Difference: ${debitCreditCheck.rows[0].diff}`);
    console.log(`Cross-Org Mismatch Count: ${crossOrgCheck.rows[0].cnt}`);
    console.log(`Orphan Lines Count: ${orphanLinesCheck.rows[0].cnt}`);

    const reportSummary = {
      timestamp: new Date().toISOString(),
      tablesCount: allTableNames.length,
      beforeCounts,
      afterCounts,
      debitCreditCheck: debitCreditCheck.rows[0],
      integrity: {
        unbalancedEntries: parseFloat(debitCreditCheck.rows[0].diff) !== 0 ? 1 : 0,
        crossOrgLeaks: parseInt(crossOrgCheck.rows[0].cnt, 10),
        orphanLines: parseInt(orphanLinesCheck.rows[0].cnt, 10),
      }
    };

    require('fs').writeFileSync('/app/applet/master_activation_report.json', JSON.stringify(reportSummary, null, 2));
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
