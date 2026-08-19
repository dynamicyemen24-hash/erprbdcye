require('dotenv').config();
const { Pool } = require('pg');

async function seedEnhancedSettings() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const orgId = '00000000-0000-0000-0000-000000000001';

  console.log('\n🚀 Starting Standardized Enterprise Settings Seed across all 15 Operational Domains...');

  // 1. Enhanced System Settings (system_settings)
  const systemSettings = [
    // Core Platform & Branding (NEB-01)
    { key: 'system_name', val: 'NexoraOS™ Intelligent Enterprise OS', type: 'string', desc: 'اسم النظام المؤسسي الموحد' },
    { key: 'organization_name', val: 'جمعية رُحماء بينهم للعمل الإنساني والتنمية', type: 'string', desc: 'الاسم الرسمي للمنظمة' },
    { key: 'system_version', val: '2.5.0-ENTERPRISE', type: 'string', desc: 'إصدار النظام المؤسسي' },
    { key: 'system_environment', val: 'production', type: 'string', desc: 'بيئة تشغيل النظام' },
    { key: 'default_language', val: 'ar', type: 'string', desc: 'اللغة الافتراضية للنظام' },
    { key: 'default_currency', val: 'YER', type: 'string', desc: 'العملة المحاسبية الأساسية' },
    { key: 'timezone', val: 'Asia/Aden', type: 'string', desc: 'المنطقة الزمنية المعتمدة' },
    { key: 'date_format', val: 'YYYY-MM-DD', type: 'string', desc: 'تنسيق التاريخ القياسي' },

    // Strategy & Performance (NEB-01 & NEB-02)
    { key: 'strat_kpi_review_cycle', val: 'QUARTERLY', type: 'string', desc: 'دورية مراجعة وتقييم مؤشرات الأداء الاستراتيجية' },
    { key: 'strat_warning_threshold_pct', val: 85, type: 'number', desc: 'نسبة التنبيه لانحراف مؤشرات الأداء الاستراتيجية (%)' },
    { key: 'strat_plan_span_years', val: 5, type: 'number', desc: 'المدى الزمني للخطة الاستراتيجية المؤسسية (سنوات)' },

    // Projects & Field Operations (NEB-04 & NEB-05)
    { key: 'proj_overbudget_warning_pct', val: 90, type: 'number', desc: 'نسبة تنبيه الاقتراب من تجاوز موازنة المشروع (%)' },
    { key: 'proj_wbs_auto_code_enabled', val: true, type: 'boolean', desc: 'التوليد الآلي لأكواد هيكل تفكيك العمل (WBS)' },
    { key: 'proj_daily_field_log_mandatory', val: true, type: 'boolean', desc: 'إلزامية تسجيل تقرير الإنجاز الميداني اليومي' },
    { key: 'proj_gps_geofence_radius_meters', val: 500, type: 'number', desc: 'نطاق التحقق الجغرافي (GPS) لنقاط التوزيع الميداني (متر)' },

    // Service Delivery & Humanitarian Standards (NEB-06)
    { key: 'serv_sphere_standards_enforced', val: true, type: 'boolean', desc: 'تطبيق والتحقق من المعايير الإنسانية الدولية (Sphere Standards)' },
    { key: 'serv_national_id_dedup_check', val: true, type: 'boolean', desc: 'التحقق الصارم من عدم تكرار الرقم الوطني للمستفيد' },
    { key: 'serv_vulnerability_reassess_days', val: 180, type: 'number', desc: 'دورية إعادة تقييم مؤشر الهشاشة والاحتياج (يوم)' },
    { key: 'serv_aid_receipt_biometric_enabled', val: true, type: 'boolean', desc: 'إتاحة التوثيق بالبصمة لتسليم المعونات الإنسانية' },

    // Community & Volunteers (NEB-07)
    { key: 'vol_minimum_age_years', val: 18, type: 'number', desc: 'الحد الأدنى لسن قبول المتطوعين' },
    { key: 'vol_hourly_credit_value_yer', val: 2500, type: 'number', desc: 'القيمة التقديرية لساعة العمل التطوعي المعياري (ريال)' },
    { key: 'comm_committee_min_members', val: 5, type: 'number', desc: 'الحد الأدنى لأعضاء اللجان المجتمعية المحلية' },

    // Grants & Donors (NEB-08)
    { key: 'grant_closeout_notice_days', val: 45, type: 'number', desc: 'مهلة التنبيه المبكر لإغلاق المنح والمشاريع (يوم)' },
    { key: 'grant_donor_report_lead_days', val: 14, type: 'number', desc: 'مهلة التذكير التلقائي برفع التقارير الدورية للمانحين (يوم)' },
    { key: 'grant_iati_standard_export', val: true, type: 'boolean', desc: 'التوافق والتصدير الآلي وفق معيار الشفافية الدولية IATI' },

    // HR & Asset Governance (NEB-09)
    { key: 'hr_probation_period_months', val: 3, type: 'number', desc: 'فترة التجربة والتقييم للموظفين الجدد (أشهر)' },
    { key: 'hr_appraisal_interval_months', val: 6, type: 'number', desc: 'دورية تقييم الأداء الوظيفي (أشهر)' },
    { key: 'asset_depreciation_method', val: 'STRAIGHT_LINE', type: 'string', desc: 'طريقة إهلاك الأصول الثابتة المعتمدة (القسط الثابت)' },
    { key: 'asset_capitalization_threshold_yer', val: 250000, type: 'number', desc: 'الحد المالي الأدنى لرسملة الأصول الثابتة (ريال يمني)' },

    // Financial Governance & IPSAS (NEB-10)
    { key: 'fin_accounting_standard', val: 'IPSAS_ACCRUAL', type: 'string', desc: 'المعيار المحاسبي المعتمد (معايير المحاسبة الدولية للقطاع العام)' },
    { key: 'fin_unbalanced_journals_allowed', val: false, type: 'boolean', desc: 'الحظر الصارم لتمرير أي قيد محاسبي غير متوازن' },
    { key: 'fin_petty_cash_max_limit_yer', val: 5000000, type: 'number', desc: 'الحد الأقصى لسقف العهدة النقدية المؤقتة (ريال يمني)' },
    { key: 'fin_journal_code_prefix', val: 'JV-', type: 'string', desc: 'البادئة القياسية لسندات وقيود اليومية العامة' },
    { key: 'fin_fx_rate_daily_refresh', val: true, type: 'boolean', desc: 'التحديث اليومي التلقائي لأسعار صرف العملات الأجنبية' },

    // Knowledge & Records (NEB-11)
    { key: 'doc_retention_policy_years', val: 10, type: 'number', desc: 'مدة الأرشفة الإلزامية للوثائق والملفات المالية والقانونية (سنوات)' },
    { key: 'doc_watermark_sensitive_enabled', val: true, type: 'boolean', desc: 'إضافة علامة مائية ذكية للوثائق المصنفة سرية' },

    // Security & Digital Services (NEB-12)
    { key: 'sec_password_min_length', val: 10, type: 'number', desc: 'الحد الأدنى لعدد خانات كلمة المرور' },
    { key: 'sec_session_timeout_minutes', val: 60, type: 'number', desc: 'مهلة انتهاء الجلسة التلقائي في حال عدم النشاط (دقيقة)' },
    { key: 'sec_max_failed_attempts', val: 5, type: 'number', desc: 'الحد الأقصى لمحاولات تسجيل الدخول الفاشلة قبل القفل المؤقت' },
    { key: 'sec_audit_trail_immutable', val: true, type: 'boolean', desc: 'حماية سجل التدقيق والرقابة من التعديل أو الحذف' },

    // AI & Impact Intelligence (NEB-13)
    { key: 'ai_anomaly_detection_level', val: 'STRICT', type: 'string', desc: 'مستوى حساسية خوارزمية الذكاء الاصطناعي لكشف الانحرافات المالية' },
    { key: 'ai_chs_compliance_tracking', val: true, type: 'boolean', desc: 'التتبع الذكي للالتزام بالمعايير الإنسانية التسعة (CHS 1-9)' },

    // Procurement & Tenders (NEB-14)
    { key: 'proc_three_way_match_tolerance_pct', val: 1.5, type: 'number', desc: 'نسبة التسامح المسموح بها في المطابقة الثلاثية لأوامر الشراء (%)' },
    { key: 'proc_min_rfq_vendor_bids', val: 3, type: 'number', desc: 'الحد الأدنى الإلزامي لعروض الأسعار في طلبات الشراء' },
    { key: 'proc_tender_opening_quorum', val: 3, type: 'number', desc: 'الحد الأدنى للنصاب القانوني للجنة فتح المظاريف' },

    // Revenue & Fundraising (NEB-15)
    { key: 'fund_campaign_deduction_rate_pct', val: 0.0, type: 'number', desc: 'نسبة الاستقطاع الإداري من حملات التبرعات المباشرة (%)' },
    { key: 'fund_donor_auto_acknowledgment', val: true, type: 'boolean', desc: 'الإرسال الفوري لرسائل الشكر وسندات القبض الرقمية للمتبرعين' },
    { key: 'fund_zakat_nisab_standard', val: 'SILVER_595G', type: 'string', desc: 'معيار نصاب الزكاة المعتمد شرعاً (الفضة 595 جرام)' }
  ];

  let sysCount = 0;
  for (const s of systemSettings) {
    const existing = await pool.query('SELECT id FROM system_settings WHERE setting_key = $1', [s.key]);
    if (existing.rows.length > 0) {
      await pool.query(`
        UPDATE system_settings 
        SET setting_value = $1, setting_type = $2, description = $3, updated_at = NOW()
        WHERE setting_key = $4
      `, [JSON.stringify(s.val), s.type, s.desc, s.key]);
    } else {
      await pool.query(`
        INSERT INTO system_settings (
          organization_id, setting_key, setting_value, setting_type, description, is_encrypted, is_public, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, false, false, NOW(), NOW()
        )
      `, [orgId, s.key, JSON.stringify(s.val), s.type, s.desc]);
    }
    sysCount++;
  }
  console.log(`✅ [system_settings] Synced ${sysCount} standardized domain settings.`);

  // 2. Enhanced Organization Settings (organization_settings)
  const orgSettings = [
    { key: 'ORG_OFFICIAL_NAME_AR', val: 'جمعية رُحماء بينهم للعمل الإنساني والتنمية', desc: 'الاسم الرسمي المعتمد للمنظمة بالعربية', sec: 5 },
    { key: 'ORG_OFFICIAL_NAME_EN', val: 'Rohamā\'a Baynahum Charity Foundation', desc: 'الاسم الرسمي المعتمد للمنظمة بالإنجليزية', sec: 5 },
    { key: 'ORG_TAX_REGISTRATION_NO', val: 'YE-NGO-2024-8891', desc: 'رقم الترخيص والتسجيل الرسمي لدى وزارة الشؤون الاجتماعية', sec: 5 },
    { key: 'ORG_HEADQUARTERS_CITY', val: 'تعز - الجمهورية اليمنية', desc: 'المقر الرئيسي للمنظمة', sec: 4 },
    { key: 'ORG_OPERATIONAL_GOVERNORATES', val: ['تعز', 'عدن', 'لحج', 'إب', 'مأرب', 'حضرموت', 'الحديدة'], desc: 'المحافظات والنطاقات الجغرافية المعتمدة للتدخلات', sec: 4 },
    { key: 'FIN_BASE_CURRENCY', val: 'YER', desc: 'العملة الأساسية لإعداد القوائم المالية والميزانية العمومية', sec: 5 },
    { key: 'FIN_REPORTING_CURRENCIES', val: ['USD', 'SAR', 'EUR'], desc: 'العملات الأجنبية المعتمدة لتقارير المانحين والاتفاقيات', sec: 4 },
    { key: 'FIN_EXCHANGE_RATE_SOURCE', val: 'CENTRAL_BANK_OF_YEMEN', desc: 'المصدر الرسمي لتقييم ونشرات أسعار الصرف', sec: 4 },
    { key: 'FIN_FISCAL_YEAR_START_MONTH', val: 1, desc: 'شهر بداية السنة المالية (1 = يناير)', sec: 5 },
    { key: 'FIN_FISCAL_YEAR_END_MONTH', val: 12, desc: 'شهر نهاية السنة المالية (12 = ديسمبر)', sec: 5 },
    { key: 'OPS_EMERGENCY_RESPONSE_PROTOCOL', val: 'LEVEL_3_STANDARD', desc: 'بروتوكول الاستجابة الطارئة والإغاثة العاجلة', sec: 4 },
    { key: 'OPS_BENEFICIARY_DATA_PROTECTION', val: 'GDPR_HUMANITARIAN_COMPLIANT', desc: 'سياسة حماية وسرية بيانات المستفيدين والفئات الضعيفة', sec: 5 },
    { key: 'HR_STANDARD_WEEKLY_HOURS', val: 40, desc: 'ساعات العمل الأسبوعية المعيارية للكوادر والموظفين', sec: 4 },
    { key: 'HR_ANNUAL_PAID_LEAVE_DAYS', val: 30, desc: 'رصيد الإجازة السنوية المدفوعة للموظفين (أيام)', sec: 4 },
    { key: 'PROC_APPROVAL_TIER_1_LIMIT_YER', val: 1000000, desc: 'سقف صلاحية الشراء المباشر لمدير المشروع (ريال)', sec: 4 },
    { key: 'PROC_APPROVAL_TIER_2_LIMIT_YER', val: 10000000, desc: 'سقف صلاحية لجنة المشتريات والمناقصات المحدودة (ريال)', sec: 5 },
    { key: 'PROC_APPROVAL_TIER_3_LIMIT_YER', val: 50000000, desc: 'سقف صلاحية المدير التنفيذي ومجلس الإدارة (ريال)', sec: 5 }
  ];

  let orgCount = 0;
  for (const o of orgSettings) {
    const existing = await pool.query('SELECT id FROM organization_settings WHERE setting_key = $1', [o.key]);
    if (existing.rows.length > 0) {
      await pool.query(`
        UPDATE organization_settings 
        SET setting_value = $1, description = $2, security_level = $3, updated_at = NOW()
        WHERE setting_key = $4
      `, [JSON.stringify(o.val), o.desc, o.sec, o.key]);
    } else {
      await pool.query(`
        INSERT INTO organization_settings (
          organization_id, setting_key, setting_value, description, security_level, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, NOW()
        )
      `, [orgId, o.key, JSON.stringify(o.val), o.desc, o.sec]);
    }
    orgCount++;
  }
  console.log(`✅ [organization_settings] Synced ${orgCount} standardized enterprise policies.`);

  console.log('🎉 Enterprise settings synchronization completed successfully.\n');
  await pool.end();
}

seedEnhancedSettings().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
