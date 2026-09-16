/**
 * NexoraOS™ — Strategic Planning Seeder
 * Seeds the 5-year strategic plan, goals, SWOT, and related triggers.
 */

import pg from 'pg';
import logger from '../core/logger';

export async function ensureStrategicPlanningSchema(pool: pg.Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS strategic_plans (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
      plan_code VARCHAR(50) NOT NULL UNIQUE,
      title_ar TEXT NOT NULL,
      title_en TEXT NOT NULL,
      start_year INT NOT NULL,
      end_year INT NOT NULL,
      vision_ar TEXT,
      vision_en TEXT,
      mission_ar TEXT,
      mission_en TEXT,
      core_values JSONB,
      strategic_pillars JSONB,
      target_beneficiaries_count BIGINT DEFAULT 500000,
      total_estimated_budget_yer NUMERIC DEFAULT 1200000000,
      overall_progress_pct NUMERIC DEFAULT 0,
      status VARCHAR(30) DEFAULT 'ACTIVE',
      security_level INT DEFAULT 3,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      deleted_at TIMESTAMP WITH TIME ZONE
    );

    CREATE TABLE IF NOT EXISTS strategic_goals (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      plan_id UUID NOT NULL REFERENCES strategic_plans(id) ON DELETE CASCADE,
      goal_code VARCHAR(50) NOT NULL UNIQUE,
      pillar_code VARCHAR(50) NOT NULL,
      title_ar TEXT NOT NULL,
      title_en TEXT NOT NULL,
      description_ar TEXT,
      description_en TEXT,
      weight_pct NUMERIC DEFAULT 10,
      progress_pct NUMERIC DEFAULT 0,
      kpi_target NUMERIC NOT NULL,
      kpi_current NUMERIC DEFAULT 0,
      kpi_unit_ar VARCHAR(50),
      kpi_unit_en VARCHAR(50),
      allocated_budget_yer NUMERIC DEFAULT 0,
      spent_budget_yer NUMERIC DEFAULT 0,
      assigned_owner_role TEXT,
      assigned_owner_name TEXT,
      linked_domain VARCHAR(30) DEFAULT 'NEB-01',
      status VARCHAR(30) DEFAULT 'ON_TRACK',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      deleted_at TIMESTAMP WITH TIME ZONE
    );

    CREATE TABLE IF NOT EXISTS swot_analysis (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      plan_id UUID NOT NULL REFERENCES strategic_plans(id) ON DELETE CASCADE,
      category VARCHAR(30) NOT NULL,
      title_ar TEXT NOT NULL,
      title_en TEXT NOT NULL,
      impact_level VARCHAR(30) DEFAULT 'HIGH',
      strategic_action_ar TEXT,
      strategic_action_en TEXT,
      linked_goal_code VARCHAR(50),
      owner_name TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS strategic_kpis (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      goal_id UUID NOT NULL REFERENCES strategic_goals(id) ON DELETE CASCADE,
      kpi_code VARCHAR(50) NOT NULL UNIQUE,
      name_ar TEXT NOT NULL,
      name_en TEXT NOT NULL,
      measurement_frequency VARCHAR(30) DEFAULT 'QUARTERLY',
      baseline_value NUMERIC DEFAULT 0,
      target_value NUMERIC NOT NULL,
      current_value NUMERIC DEFAULT 0,
      unit_ar VARCHAR(30),
      unit_en VARCHAR(30),
      status VARCHAR(30) DEFAULT 'ON_TRACK',
      last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS strategic_initiatives (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      goal_id UUID NOT NULL REFERENCES strategic_goals(id) ON DELETE CASCADE,
      initiative_code VARCHAR(50) NOT NULL UNIQUE,
      title_ar TEXT NOT NULL,
      title_en TEXT NOT NULL,
      linked_program_id VARCHAR(50),
      linked_project_id VARCHAR(50),
      budget_allocated NUMERIC DEFAULT 0,
      completion_pct NUMERIC DEFAULT 0,
      status VARCHAR(30) DEFAULT 'IN_PROGRESS',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- NOTE: outer block uses $outer$ tags because the inner function body
    -- needs its own $$ quoting; identical $$ tags would terminate the outer
    -- string early (this previously failed with a syntax error at DECLARE).
    DO $outer$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_strategic_goals_progress_update') THEN
        CREATE OR REPLACE FUNCTION fn_recalculate_strategic_plan_progress()
        RETURNS TRIGGER AS $$
        DECLARE
          v_plan_id UUID;
          v_avg_progress NUMERIC;
        BEGIN
          IF TG_OP = 'DELETE' THEN
            v_plan_id := OLD.plan_id;
          ELSE
            v_plan_id := NEW.plan_id;
          END IF;

          SELECT ROUND(COALESCE(SUM(progress_pct * (weight_pct / 100.0)), AVG(progress_pct)), 2)
          INTO v_avg_progress
          FROM strategic_goals
          WHERE plan_id = v_plan_id AND deleted_at IS NULL;

          UPDATE strategic_plans
          SET overall_progress_pct = COALESCE(v_avg_progress, 0),
              updated_at = NOW()
          WHERE id = v_plan_id;

          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER trg_strategic_goals_progress_update
        AFTER INSERT OR UPDATE OR DELETE ON strategic_goals
        FOR EACH ROW EXECUTE FUNCTION fn_recalculate_strategic_plan_progress();
      END IF;
    END $outer$;
  `);
}

export async function seedStrategicPlanningIfEmpty(pool: pg.Pool): Promise<void> {
  try {
    await ensureStrategicPlanningSchema(pool);
    const checkRes = await pool.query("SELECT COUNT(*) FROM strategic_plans");
    const count = parseInt(checkRes.rows[0].count);
    if (count > 0) return;

    const coreValues = JSON.stringify([
      { code: "VAL-01", name_ar: "الشفافية والحوكمة", name_en: "Transparency & Governance" },
      { code: "VAL-02", name_ar: "الكرامة الإنسانية", name_en: "Human Dignity" },
      { code: "VAL-03", name_ar: "الاستدامة والتمكين", name_en: "Sustainability & Empowerment" },
      { code: "VAL-04", name_ar: "الإبداع والتحول الرقمي", name_en: "Digital Innovation & Transformation" },
      { code: "VAL-05", name_ar: "الشراكة الفاعلة", name_en: "Effective Strategic Partnerships" }
    ]);

    const pillars = JSON.stringify([
      { code: "PIL-FINANCE", title_ar: "الاستدامة المالية وتنويع التمويل", title_en: "Financial Sustainability & Resource Diversification", icon: "Coins", weight_pct: 20 },
      { code: "PIL-GOVERNANCE", title_ar: "التحول الرقمي والتميز المؤسسي", title_en: "Digital Transformation & Institutional Excellence", icon: "ShieldCheck", weight_pct: 20 },
      { code: "PIL-SERVICE", title_ar: "جودة الخدمات والأثر الإنساني", title_en: "Service Quality & Humanitarian Impact", icon: "HeartHandshake", weight_pct: 25 },
      { code: "PIL-OPS", title_ar: "التميز التشغيلي والتكيف الميداني", title_en: "Operational Excellence & Field Execution", icon: "Building2", weight_pct: 20 },
      { code: "PIL-HUMAN", title_ar: "الاستثمار البشري والتمكين المجتمعي", title_en: "Human Capital & Community Empowerment", icon: "Users", weight_pct: 15 }
    ]);

    const planRes = await pool.query(`
      INSERT INTO strategic_plans (
        organization_id, plan_code, title_ar, title_en, start_year, end_year,
        vision_ar, vision_en, mission_ar, mission_en, core_values, strategic_pillars,
        target_beneficiaries_count, total_estimated_budget_yer, overall_progress_pct, status
      ) VALUES (
        '00000000-0000-0000-0000-000000000001', 'STP-2025-2029',
        'الخطة الاستراتيجية الخمسية لمؤسسة رُحماء بينهم (2025 - 2029)',
        '5-Year Strategic Plan for Rohamaa Baynahum Foundation (2025-2029)',
        2025, 2029,
        'الريادة والإبداع في تقديم الخدمات الإنسانية والتنموية المستدامة وتمكين المجتمعات النائية في اليمن وفق أعلى معايير الحوكمة الشاملة والشفافية الرقمية.',
        'Leadership and innovation in providing sustainable humanitarian and development services, empowering remote communities in Yemen according to the highest standards of governance and transparency.',
        'تقديم مساعدات إغاثية وتنموية متكاملة ترتقي بحياة الفئات الأشد ضعفاً، وتكفل الأيتام، وتستثمر في الموارد البشرية والتحول الرقمي من خلال شراكات استراتيجية موثوقة.',
        'Delivering integrated relief and development aid to uplift vulnerable populations, sponsor orphans, and invest in human capital and digital transformation through trusted strategic partnerships.',
        $1, $2, 500000, 1850000000, 83.2, 'ACTIVE'
      ) RETURNING id
    `, [coreValues, pillars]);

    const planId = planRes.rows[0].id;

    const goals = [
      ['OBJ-2025-01', 'PIL-FINANCE', 'رفع إيرادات التمويل الذاتي والأوقاف إلى 35% من الميزانية', 'Increase self-funding and endowments revenue to 35% of operational budget', 'استراتيجية تنويع مصادر الدخل وإنشاء أوقاف إنتاجية لتقليل الاعتماد على التبرعات الموسمية.', 'Diverting income sources into productive endowments to lower reliance on seasonal donations.', 12, 68, 35, 24, '%', '%', 250000000, 170000000, 'مدير الاستثمار والتنميه', 'د. عبدالحكيم السقاف', 'NEB-15', 'ON_TRACK'],
      ['OBJ-2025-02', 'PIL-GOVERNANCE', 'التحول الرقمي المكتمل 100% والارتباط المباشر بـ Neon PostgreSQL', '100% Digital Transformation across all enterprise operations', 'ربط كافة إدارات المؤسسة والأنشطة الميدانية بنظام التشغيل المؤسسي NexoraOS.', 'Connecting all enterprise domains and field activities to NexoraOS cloud database.', 12, 92, 100, 92, '%', '%', 180000000, 165000000, 'مدير النظم والمعلومات', 'د. عبدالكريم الحمداني', 'NEB-12', 'ON_TRACK'],
      ['OBJ-2025-03', 'PIL-SERVICE', 'تقديم الرعاية الشاملة لـ 15,000 يتيم وأسرة مكفولة مع التحديث الجغرافي', 'Provide comprehensive care to 15,000 sponsored orphans with GPS field updates', 'تأمين المساعدات الشهرية والتعليمية والصحية للأيتام والأسر المعسرة الموثقة برقم الهوية والبصمة.', 'Securing monthly living, education, and healthcare stipends for registered beneficiaries.', 15, 78, 15000, 11700, 'أسرة / يتيم', 'Families/Orphans', 450000000, 351000000, 'مديرة إدارة الكفالات', 'أ. فاطمة باعباد', 'NEB-06', 'ON_TRACK'],
      ['OBJ-2025-04', 'PIL-SERVICE', 'تنفيذ مشاريع استجابة طوارئ مائية وتنموية لـ 250,000 مستفيد', 'Execute emergency water and relief projects benefiting 250,000+ people', 'حفر آبار مياه الشرب وتزويدها بمنظومات طاقة شمسية في مأرب والساحل الغربي.', 'Drilling deep groundwater boreholes powered by solar energy pumps in West Coast & Marib.', 15, 85, 250000, 212500, 'مستفيد', 'Beneficiaries', 380000000, 323000000, 'مدير المشاريع الميدانية', 'م. ناصر سعيد المعمري', 'NEB-04', 'ON_TRACK'],
      ['OBJ-2025-05', 'PIL-FINANCE', 'تطبيق معايير الامتثال المالي الدولية IPSAS وشفافية تدقيق 100%', 'Implement IPSAS international accounting standards with 100% audit compliance', 'الالتزام الكامل بالقيود المزدوجة وتقارير التدقيق المالي المعتمدة وقوائم الحسابات الختامية.', 'Full compliance with double-entry ledger, audited financial statements, and IPSAS taxonomy.', 10, 95, 100, 95, '%', '%', 90000000, 85000000, 'المدير المالي', 'أ. سالم عبدالله العولقي', 'NEB-10', 'ON_TRACK'],
      ['OBJ-2025-06', 'PIL-OPS', 'تطبيق نظام المقارنة الثلاثية والمناقصات الشفافة بنسبة 100% في المشتريات', '100% Implementation of 3-Way Quote Comparison Matrix in Procurement', 'إخضاع جميع عمليات التوريد لطلبات الشراء وتتبع المناقصات عبر بوابات العروض المقارنة.', 'Subjecting all purchasing processes to formal PRs, RFQs, and 3-way quote matrix.', 10, 88, 100, 88, '%', '%', 120000000, 105000000, 'مسؤول المشتريات', 'م. أحمد سالم باثواب', 'NEB-14', 'ON_TRACK'],
      ['OBJ-2025-07', 'PIL-HUMAN', 'تدريب وبناء قدرات 500 متطوع وكادر ميداني لتغطية المحافظات', 'Train and empower 500 field volunteers and staff across target governorates', 'تنفيذ دورات التقييم الميداني، إدارة الكوارث، والرفع ببيانات المستفيدين عبر التطبيق الرقمي.', 'Executing field assessment, disaster management, and digital beneficiary profiling workshops.', 8, 72, 500, 360, 'متدرب', 'Trainees', 60000000, 43200000, 'مسؤولة التدريب', 'أ. سمية باوزير', 'NEB-07', 'ON_TRACK'],
      ['OBJ-2025-08', 'PIL-GOVERNANCE', 'الحصول على اعتماد المعايير الإنسانية الدولية Sphere ومعايير CHS', 'Attain Sphere Humanitarian Standards & CHS Quality Certification', 'تطبيق الدليل الإنساني ومعايير الجودة والتحقق الامتثالي في توزيع المعونات الغذائية والمائية.', 'Applying international Sphere indicators and Quality & Accountability standards.', 8, 84, 100, 84, '%', '%', 50000000, 42000000, 'أخصائي الحوكمة', 'د. ياسر بافليلة', 'NEB-13', 'ON_TRACK'],
      ['OBJ-2025-09', 'PIL-FINANCE', 'تطوير محرك التنبؤ المالي بـ AI للتحوط ضد تقلبات العملة YER والتضخم', 'Develop AI Financial Predictive Engine for YER currency inflation hedging', 'توفير نماذج المحاكاة لـ 12 شهراً مستقبلياً للتنبؤ بالفجوات المالية وتقلبات الصرف.', 'Running 12-month predictive simulation models for cashflow liquidity and YER exchange rates.', 5, 90, 100, 90, '%', '%', 40000000, 36000000, 'مدير النظم والمعلومات', 'د. عبدالكريم الحمداني', 'NEB-13', 'ON_TRACK'],
      ['OBJ-2025-10', 'PIL-OPS', 'تأمين مخزون استراتيجي إغاثي يغطي احتياجات 10,000 أسرة في حالات الطوارئ', 'Secure strategic relief inventory buffer covering 10,000 emergency households', 'تجهيز مستودعات مأرب والحديدة بالسلال الغذائية والحقائب الإوائية لتلبية حالات الطوارئ.', 'Equipping Marib & Hodeidah warehouses with emergency food kits and shelter packages.', 5, 80, 10000, 8000, 'أسرة', 'Families', 150000000, 120000000, 'مدير المخازن', 'أ. خالد عبدالرحيم', 'NEB-09', 'ON_TRACK']
    ];

    const goalCols = ['plan_id', 'goal_code', 'pillar_code', 'title_ar', 'title_en', 'description_ar', 'description_en', 'weight_pct', 'progress_pct', 'kpi_target', 'kpi_current', 'kpi_unit_ar', 'kpi_unit_en', 'allocated_budget_yer', 'spent_budget_yer', 'assigned_owner_role', 'assigned_owner_name', 'linked_domain', 'status'];
    const goalValues: any[] = [];
    const goalPlaceholders = goals.map((g, i) => {
      const offset = i * 19;
      goalValues.push(planId, ...g);
      return `(${Array.from({ length: 19 }, (_, j) => `$${offset + j + 1}`).join(', ')})`;
    }).join(', ');
    await pool.query(`INSERT INTO strategic_goals (${goalCols.join(', ')}) VALUES ${goalPlaceholders}`, goalValues);

    const swotItems = [
      ['STRENGTH', 'بيئة رقمية موحدة وعالية الكفاءة عبر منصة NexoraOS وبدعم قاعدة Neon PostgreSQL', 'Unified high-performance digital workspace powered by NexoraOS and Neon PostgreSQL cloud database', 'CRITICAL', 'استدامة التميز التكنولوجي وتوسيع الربط الشبكي الميداني.', 'Sustain technology lead and extend offline field synchronization.', 'OBJ-2025-02', 'د. عبدالكريم الحمداني'],
      ['STRENGTH', 'شبكة ميدانية واسعة وفريق تطوعي مؤهل في محافظات مأرب والساحل الغربي والحديدة', 'Extensive field network and qualified volunteer force across Marib, West Coast & Hodeidah', 'HIGH', 'تفعيل التدريب المستمر وتقييم الأداء الميداني الرقمي.', 'Institutionalize ongoing training and digital performance evaluations.', 'OBJ-2025-07', 'أ. سمية باوزير'],
      ['STRENGTH', 'ثقة عالية ومعدل استبقاء وتجديد كفالات الأيتام يصل إلى 89.4%', 'High donor trust and orphan sponsorship renewal rate of 89.4%', 'HIGH', 'توسيع التغطية الإعلامية وتقارير التحديث الميداني المباشرة.', 'Expand direct impact field reporting to sponsors.', 'OBJ-2025-03', 'أ. فاطمة باعباد'],
      ['WEAKNESS', 'الاعتماد المرتفع نسبيًا على التبرعات الموسمية (رمضان والأضاحي)', 'High relative seasonal dependency on Ramadan & Qurbani campaigns', 'HIGH', 'تفعيل برامج الأوقاف والاستثمار التنموي المستدام.', 'Expand productive endowments and income-generating social programs.', 'OBJ-2025-01', 'د. عبدالحكيم السقاف'],
      ['WEAKNESS', 'التحديات اللوجستية وتكاليف النقل إلى القرى والوديان النائية', 'Logistics challenges and high transportation costs to remote mountain valleys', 'MEDIUM', 'استحداث نقاط توزيع فرعية وتوقيع عقود نقل محلية معتمدة.', 'Establish regional distribution hubs and local transport agreements.', 'OBJ-2025-04', 'م. ناصر سعيد المعمري'],
      ['OPPORTUNITY', 'التكامل الدولي عبر معايير IATI وتوزيع المساعدات طبقاً لمعايير Sphere العالمية', 'International reporting compliance via IATI standards and Sphere guidelines', 'CRITICAL', 'تعزيز الشراكات مع المنظمات الأممية OCHA, UNICEF, WFP.', 'Strengthen UN partnership proposals (OCHA, WFP, UNICEF).', 'OBJ-2025-08', 'د. ياسر بافليلة'],
      ['OPPORTUNITY', 'التوسع في مشاريع الطاقة البديلة المبتكرة لضخ المياه الجوفية وتوليد الكهرباء', 'Expanding innovative solar-powered groundwater pumping and community energy', 'HIGH', 'طرح مناقصات توريد منظومات الطاقة الشمسية ذات الكفاءة.', 'Issue RFQs for solar energy equipment and water well rigs.', 'OBJ-2025-04', 'م. ناصر سعيد المعمري'],
      ['OPPORTUNITY', 'استخدام تقنيات الذكاء الاصطناعي Gemini لضبط الإنفاق والتنقيح الآلي للفواتير', 'Leveraging Gemini AI for automated OCR invoice parsing and budget controls', 'HIGH', 'تأكيد التشغيل الكامل للماسح الضوئي الذكي ومصفوفة المطابقة.', 'Deploy automated 3-way quote matrix and OCR invoice verification.', 'OBJ-2025-02', 'د. عبدالكريم الحمداني'],
      ['THREAT', 'تذبذب أسعار صرف العملة المحلية (YER) وارتفاع معدلات التضخم المستورد', 'Volatile local currency exchange rates (YER) and import inflation risks', 'CRITICAL', 'تطبيق التحوط بالعملات الصعبة (USD/SAR) وتحديث أسعار الصرف الحية.', 'Implement hard currency reserves (USD/SAR) with live rate API.', 'OBJ-2025-09', 'أ. سالم عبدالله العولقي'],
      ['THREAT', 'الظروف الجوية القاسية والكوارث الطبيعية والأمطار السيول', 'Severe weather, seasonal flash floods, and access route disruptions', 'HIGH', 'تكوين مخزون استراتيجي طارئ وخطة طوارئ استجابة لمخاطر السيول.', 'Maintain strategic emergency warehouse buffers and rapid flood response.', 'OBJ-2025-10', 'أ. خالد عبدالرحيم']
    ];

    const swotCols = ['plan_id', 'category', 'title_ar', 'title_en', 'impact_level', 'strategic_action_ar', 'strategic_action_en', 'linked_goal_code', 'owner_name'];
    const swotValues: any[] = [];
    const swotPlaceholders = swotItems.map((sw, i) => {
      const offset = i * 9;
      swotValues.push(planId, ...sw);
      return `(${Array.from({ length: 9 }, (_, j) => `$${offset + j + 1}`).join(', ')})`;
    }).join(', ');
    await pool.query(`INSERT INTO swot_analysis (${swotCols.join(', ')}) VALUES ${swotPlaceholders}`, swotValues);

    logger.info('[SEEDER] strategic_planning seeded', { context: 'seeder' });
  } catch (err: any) {
    logger.error(`[SEEDER] strategic_planning: ${err.message}`, { context: 'seeder' });
  }
}
