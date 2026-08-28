// Standardized Institutional Organizational Structure Architecture
// جمعية رُحماء بينهم للعمل الإنساني والتنمية (Rohamā'a Baynahum Charity Foundation)
// UAMEX ERP™ Intelligent Enterprise Operating System

export interface OrgUnit {
  code: string;
  name_ar: string;
  name_en: string;
  level: number; // 1: مجلس الإدارة / الإدارة العليا, 2: قطاع / إدارة عامة, 3: إدارة تنفيذية / فرع إقليمي, 4: قسم / وحدة تشغيلية
  parent_code: string | null;
  type: 'governance' | 'sector' | 'department' | 'branch' | 'unit' | 'section';
  manager_name: string;
  manager_title: string;
  manager_email: string;
  manager_phone?: string;
  linked_cost_center_code: string;
  budgeted_headcount: number;
  actual_headcount: number;
  annual_budget_yer: number;
  linked_projects_count: number;
  primary_responsibilities: string[];
  governance_delegation_limit_yer: number; // سقف الصلاحية المالية المعتمدة للصرف
  status: 'active' | 'under_restructure';
}

export interface JobPosition {
  code: string;
  title_ar: string;
  title_en: string;
  department_code: string;
  department_name_ar: string;
  reports_to_position_code: string | null;
  grade_level: 'EXEC' | 'DIR' | 'MGR' | 'LEAD' | 'SPEC' | 'OFFICER' | 'COORD' | 'FIELD';
  employment_type: 'permanent' | 'contract' | 'consultant' | 'volunteer';
  budgeted_count: number;
  occupied_count: number;
  salary_range_min_yer: number;
  salary_range_max_yer: number;
  approval_authority_limit_yer: number;
  core_competencies: string[];
  is_critical_role: boolean;
}

export const STANDARD_ORGANIZATIONAL_UNITS: OrgUnit[] = [
  // Level 1: القيادة العليا والحوكمة المؤسسية
  {
    code: 'BOD-GOV',
    name_ar: 'مجلس الإدارة والجمعية العمومية',
    name_en: 'Board of Directors & General Assembly',
    level: 1,
    parent_code: null,
    type: 'governance',
    manager_name: 'الشيخ / يحيى ناصر الرويشان',
    manager_title: 'رئيس مجلس الإدارة',
    manager_email: 'board@rohamaab.org',
    manager_phone: '+967 1 450000',
    linked_cost_center_code: 'CC-ADM-EXEC',
    budgeted_headcount: 7,
    actual_headcount: 7,
    annual_budget_yer: 15000000,
    linked_projects_count: 0,
    primary_responsibilities: [
      'اعتماد السياسات واللوائح والخطط الاستراتيجية الخمسية',
      'المصادقة على الموازنة التقديرية السنوية والقوائم المالية المدققة',
      'تعيين ومساءلة المدير التنفيذي العام وتشكيل اللجان الرقابية'
    ],
    governance_delegation_limit_yer: 50000000,
    status: 'active'
  },
  {
    code: 'DIR-EXEC',
    name_ar: 'مكتب الإدارة التنفيذية العامة',
    name_en: 'Office of the Chief Executive Officer',
    level: 1,
    parent_code: 'BOD-GOV',
    type: 'governance',
    manager_name: 'د. عبد الله محمد الشامي',
    manager_title: 'المدير التنفيذي العام',
    manager_email: 'ceo@rohamaab.org',
    manager_phone: '+967 1 450100',
    linked_cost_center_code: 'CC-ADM-EXEC',
    budgeted_headcount: 4,
    actual_headcount: 4,
    annual_budget_yer: 35000000,
    linked_projects_count: 14,
    primary_responsibilities: [
      'القيادة الشاملة لعمليات المنظومة وتطبيق أهداف الخطة التشغيلية',
      'تمثيل الجمعية أمام الجهات الحكومية والمانحين والمنظمات الأممية',
      'الإشراف المباشر على مدراء القطاعات والإدارات التنفيذية'
    ],
    governance_delegation_limit_yer: 25000000,
    status: 'active'
  },

  // Level 2: القطاعات التنفيذية الكبرى
  {
    code: 'DEP-PRG',
    name_ar: 'قطاع البرامج الإنسانية والمشاريع الميدانية',
    name_en: 'Humanitarian Programs & Projects Sector',
    level: 2,
    parent_code: 'DIR-EXEC',
    type: 'sector',
    manager_name: 'م. أحمد خالد المعمري',
    manager_title: 'مدير قطاع البرامج والمشاريع',
    manager_email: 'programs@rohamaab.org',
    manager_phone: '+967 1 450201',
    linked_cost_center_code: 'CC-PRG-FOOD-01',
    budgeted_headcount: 36,
    actual_headcount: 32,
    annual_budget_yer: 850000000,
    linked_projects_count: 8,
    primary_responsibilities: [
      'إدارة وتخطيط دورة حياة المشاريع الإنسانية وفق معايير Sphere وميثاق CHS',
      'الإشراف على التدخلات الإغاثية ومشاريع التنمية المستدامة وسلاسل الإمداد الميدانية',
      'إعداد مقترحات المشاريع التمويلية وتقارير الأثر والجهات المانحة'
    ],
    governance_delegation_limit_yer: 15000000,
    status: 'active'
  },
  {
    code: 'DEP-FIN',
    name_ar: 'قطاع الشؤون المالية والامتثال IPSAS',
    name_en: 'Finance & Compliance Sector',
    level: 2,
    parent_code: 'DIR-EXEC',
    type: 'sector',
    manager_name: 'أ. ياسر سعيد باوزير',
    manager_title: 'المدير المالي ورئيس قطاع الامتثال',
    manager_email: 'finance@rohamaab.org',
    manager_phone: '+967 1 450202',
    linked_cost_center_code: 'CC-ADM-FIN',
    budgeted_headcount: 12,
    actual_headcount: 11,
    annual_budget_yer: 62000000,
    linked_projects_count: 14,
    primary_responsibilities: [
      'إدارة الأستاذ العام والقيود المزدوجة وإعداد القوائم المالية وفق IPSAS',
      'إدارة السيولة النقدية والخزائن والحسابات المصرفية ومطابقة العملات',
      'مراقبة الموازنات التقديرية ومحاسبة المنح والمطابقة الثلاثية للمشتريات'
    ],
    governance_delegation_limit_yer: 10000000,
    status: 'active'
  },
  {
    code: 'DEP-OPS',
    name_ar: 'قطاع العمليات الميدانية واللوجستيات والمشتريات',
    name_en: 'Operations, Logistics & Procurement Sector',
    level: 2,
    parent_code: 'DIR-EXEC',
    type: 'sector',
    manager_name: 'د. خالد وليد العماري',
    manager_title: 'مدير العمليات وسلاسل الإمداد',
    manager_email: 'operations@rohamaab.org',
    manager_phone: '+967 1 450203',
    linked_cost_center_code: 'CC-OPS-PROC',
    budgeted_headcount: 28,
    actual_headcount: 25,
    annual_budget_yer: 95000000,
    linked_projects_count: 12,
    primary_responsibilities: [
      'تنفيذ سياسات الشراء الشفاف والمناقصات وإدارة الموردين المؤهلين',
      'إدارة المستودعات المركزية والإقليمية وتتبع حركة المخزون والمواد العينية',
      'تشغيل وتأمين أسطول النقل الميداني والخدمات اللوجستية لمواقع التوزيع'
    ],
    governance_delegation_limit_yer: 8000000,
    status: 'active'
  },
  {
    code: 'DEP-FRD',
    name_ar: 'قطاع تنمية الموارد والاتصال المؤسسي',
    name_en: 'Fundraising, Partnerships & Communications Sector',
    level: 2,
    parent_code: 'DIR-EXEC',
    type: 'sector',
    manager_name: 'أ. طارق عبد الرحمن القدسي',
    manager_title: 'مدير تنمية الموارد والشراكات',
    manager_email: 'fundraising@rohamaab.org',
    manager_phone: '+967 1 450204',
    linked_cost_center_code: 'CC-FRD-CAMP',
    budgeted_headcount: 14,
    actual_headcount: 12,
    annual_budget_yer: 48000000,
    linked_projects_count: 9,
    primary_responsibilities: [
      'تنمية التبرعات الرقمية وإطلاق الحملات الموسمية (رمضان، الأضاحي، الشتاء)',
      'بناء وتوثيق الشراكات مع كبار المتبرعين والمنظمات والصناديق التنموية',
      'إدارة الإعلام المؤسسي وصناعة المحتوى والتوثيق الميداني والتقارير المرئية'
    ],
    governance_delegation_limit_yer: 5000000,
    status: 'active'
  },
  {
    code: 'DEP-HR',
    name_ar: 'قطاع الموارد البشرية والخدمات الإدارية',
    name_en: 'Human Resources & Administration Sector',
    level: 2,
    parent_code: 'DIR-EXEC',
    type: 'sector',
    manager_name: 'أ. هناء عبد الله المنصوب',
    manager_title: 'مديرة الموارد البشرية والخدمات',
    manager_email: 'hr@rohamaab.org',
    manager_phone: '+967 1 450205',
    linked_cost_center_code: 'CC-ADM-HR',
    budgeted_headcount: 10,
    actual_headcount: 9,
    annual_budget_yer: 38000000,
    linked_projects_count: 0,
    primary_responsibilities: [
      'استقطاب وتوظيف الكفاءات وإدارة عقود الموظفين والخبراء والاستشاريين',
      'إدارة وتقييم الأداء المؤسسي وبرامج التدريب وبناء قدرات الفرق الميدانية',
      'إدارة شؤون المتطوعين والسلامة المهنية والأرشفة والخدمات الإدارية'
    ],
    governance_delegation_limit_yer: 4000000,
    status: 'active'
  },

  // Level 3: إدارات البرامج التخصصية (تحت قطاع البرامج)
  {
    code: 'DEP-PRG-FOOD',
    name_ar: 'إدارة الأمن الغذائي وسُبل العيش',
    name_en: 'Food Security & Livelihoods Department',
    level: 3,
    parent_code: 'DEP-PRG',
    type: 'department',
    manager_name: 'م. فؤاد قاسم الصبري',
    manager_title: 'مدير برنامج الأمن الغذائي',
    manager_email: 'food.sec@rohamaab.org',
    linked_cost_center_code: 'CC-PRG-FOOD-01',
    budgeted_headcount: 8,
    actual_headcount: 7,
    annual_budget_yer: 320000000,
    linked_projects_count: 3,
    primary_responsibilities: [
      'تخطيط وتوزيع السلال الغذائية الشهرية والموسمية للأسر الأشد فقراً',
      'إدارة المطابخ والمخابز الخيرية ومشاريع الوجبات الساخنة للنازحين',
      'مشاريع التمكين الاقتصادي الزراعي والحيواني لتوليد الدخل المستدام'
    ],
    governance_delegation_limit_yer: 5000000,
    status: 'active'
  },
  {
    code: 'DEP-PRG-ORPHAN',
    name_ar: 'إدارة الرعاية الشاملة وكفالة الأيتام',
    name_en: 'Social Welfare & Orphan Sponsorship Department',
    level: 3,
    parent_code: 'DEP-PRG',
    type: 'department',
    manager_name: 'أ. مروان عبد السلام الحمادي',
    manager_title: 'مدير إدارة كفالة الأيتام',
    manager_email: 'orphans@rohamaab.org',
    linked_cost_center_code: 'CC-PRG-ORPHAN-01',
    budgeted_headcount: 9,
    actual_headcount: 9,
    annual_budget_yer: 280000000,
    linked_projects_count: 2,
    primary_responsibilities: [
      'إدارة ملفات الكفالة الفردية والجماعية وصرف المخصصات النقدية الشهرية',
      'متابعة الرعاية التعليمية والصحية والتربوية للأيتام وأسرهم',
      'إصدار التقارير الدورية للكافلين والربط مع منظومة المستفيدين'
    ],
    governance_delegation_limit_yer: 5000000,
    status: 'active'
  },
  {
    code: 'DEP-PRG-WASH',
    name_ar: 'إدارة مشاريع المياه والإصحاح البيئي (WASH)',
    name_en: 'Water, Sanitation & Hygiene (WASH) Department',
    level: 3,
    parent_code: 'DEP-PRG',
    type: 'department',
    manager_name: 'م. عادل الشميري',
    manager_title: 'مدير مشاريع المياه والإصحاح',
    manager_email: 'wash@rohamaab.org',
    linked_cost_center_code: 'CC-PRG-WASH-01',
    budgeted_headcount: 7,
    actual_headcount: 6,
    annual_budget_yer: 240000000,
    linked_projects_count: 2,
    primary_responsibilities: [
      'حفر وتأهيل الآبار الارتوازية وتمديد شبكات المياه بالطاقة الشمسية',
      'توزيع مياه الشرب النظيفة للقرى ومخيمات النازحين ومكافحة الأوبئة',
      'إنشاء وتأهيل مرافق الصرف الصحي وحملات التوعية بالنظافة العامة'
    ],
    governance_delegation_limit_yer: 5000000,
    status: 'active'
  },
  {
    code: 'DEP-PRG-MEAL',
    name_ar: 'إدارة الرصد والتقييم والمساءلة والتعلم (MEAL)',
    name_en: 'Monitoring, Evaluation, Accountability & Learning (MEAL)',
    level: 3,
    parent_code: 'DEP-PRG',
    type: 'department',
    manager_name: 'د. سامية عبد الحكيم الشرعبي',
    manager_title: 'مديرة الرصد والتقييم والمساءلة',
    manager_email: 'meal@rohamaab.org',
    linked_cost_center_code: 'CC-PRG-FOOD-01',
    budgeted_headcount: 5,
    actual_headcount: 4,
    annual_budget_yer: 35000000,
    linked_projects_count: 8,
    primary_responsibilities: [
      'تطبيق مصفوفات التحقق المستقلة وخطوط الأساس واستطلاعات رضا المستفيدين',
      'إدارة آلية الشكاوى والمقترحات المجتمعية المستقلة (CRM Feedback)',
      'قياس مؤشرات الأداء والأثر وفق معايير Sphere ومبادئ CHS الإنسانية'
    ],
    governance_delegation_limit_yer: 3000000,
    status: 'active'
  },

  // Level 3: المكاتب والفروع الإقليمية الميدانية
  {
    code: 'BRN-SANAA',
    name_ar: 'فرع العاصمة صنعاء والمحافظات المركزية',
    name_en: 'Sana\'a Regional Hub & Central Branch',
    level: 3,
    parent_code: 'DIR-EXEC',
    type: 'branch',
    manager_name: 'أ. نبيل صالح الغرباني',
    manager_title: 'مدير فرع صنعاء',
    manager_email: 'branch.sanaa@rohamaab.org',
    linked_cost_center_code: 'CC-GEO-SANAA',
    budgeted_headcount: 14,
    actual_headcount: 13,
    annual_budget_yer: 110000000,
    linked_projects_count: 5,
    primary_responsibilities: [
      'التنسيق الميداني للتدخلات وتوزيع الإغاثة في أمانة العاصمة والمحافظات المجاورة',
      'إدارة العلاقات المحلية والتصاريح الأمنية والمجتمعية للمشاريع',
      'إدارة مخازن الفرع وفرق المتطوعين الميدانيين'
    ],
    governance_delegation_limit_yer: 6000000,
    status: 'active'
  },
  {
    code: 'BRN-ADEN',
    name_ar: 'مكتب التنسيق والعمليات الميدانية - عدن',
    name_en: 'Aden Regional Coordination Hub',
    level: 3,
    parent_code: 'DIR-EXEC',
    type: 'branch',
    manager_name: 'أ. وضاح محمد فضل',
    manager_title: 'مدير مكتب عدن',
    manager_email: 'branch.aden@rohamaab.org',
    linked_cost_center_code: 'CC-GEO-ADEN',
    budgeted_headcount: 10,
    actual_headcount: 9,
    annual_budget_yer: 85000000,
    linked_projects_count: 4,
    primary_responsibilities: [
      'التنسيق مع الوزارات والمنظمات الدولية والموانئ الجمركية',
      'إدارة العمليات الميدانية في عدن ولحج وأبين والمحافظات المجاورة',
      'المتابعة اللوجستية لشحنات المعونات الواردة عبر ميناء ومطار عدن'
    ],
    governance_delegation_limit_yer: 5000000,
    status: 'active'
  },
  {
    code: 'BRN-TAIZ',
    name_ar: 'فرع محافظة تعز والمناطق الريفية (صبر)',
    name_en: 'Taiz Branch & Rural Operations (Sabir)',
    level: 3,
    parent_code: 'DIR-EXEC',
    type: 'branch',
    manager_name: 'م. ميثاق عبد الجليل المقطري',
    manager_title: 'مدير فرع تعز والريف',
    manager_email: 'branch.taiz@rohamaab.org',
    linked_cost_center_code: 'CC-GEO-TAIZ',
    budgeted_headcount: 12,
    actual_headcount: 11,
    annual_budget_yer: 145000000,
    linked_projects_count: 6,
    primary_responsibilities: [
      'إدارة التدخلات في مدينة تعز ومديريات صبر والمواسط والمناطق الجبلية',
      'تشغيل مشاريع المياه والإصحاح وتوزيع المعونات الغذائية للأسر المتضررة',
      'تنسيق اللجان المجتمعية وضبط كشوفات الصرف والتحقق الميداني'
    ],
    governance_delegation_limit_yer: 6000000,
    status: 'active'
  },
  {
    code: 'BRN-HODEIDAH',
    name_ar: 'مكتب الإغاثة الطارئة - الحديدة والساحل الغربي',
    name_en: 'Hodeidah & West Coast Emergency Hub',
    level: 3,
    parent_code: 'DIR-EXEC',
    type: 'branch',
    manager_name: 'أ. يوسف إبراهيم تهامي',
    manager_title: 'مدير مكتب الحديدة',
    manager_email: 'branch.hodeidah@rohamaab.org',
    linked_cost_center_code: 'CC-GEO-HODEIDAH',
    budgeted_headcount: 8,
    actual_headcount: 7,
    annual_budget_yer: 95000000,
    linked_projects_count: 3,
    primary_responsibilities: [
      'الاستجابة الإنسانية العاجلة لمتضرري السيول وسوء التغذية في تهامة',
      'توزيع السلال الإغاثية والوجبات ومياه الشرب لمخيمات الساحل',
      'تنسيق العيادات المتنقلة مع مكتب الصحة والجهات المعنية'
    ],
    governance_delegation_limit_yer: 4000000,
    status: 'active'
  },
  {
    code: 'BRN-MUKALLA',
    name_ar: 'فرع حضرموت والمهرة - المكلا',
    name_en: 'Hadramout & Mahrah Branch (Mukalla)',
    level: 3,
    parent_code: 'DIR-EXEC',
    type: 'branch',
    manager_name: 'أ. سالم عمر العمودي',
    manager_title: 'مدير فرع حضرموت',
    manager_email: 'branch.mukalla@rohamaab.org',
    linked_cost_center_code: 'CC-GEO-HADRAMOUT',
    budgeted_headcount: 6,
    actual_headcount: 5,
    annual_budget_yer: 65000000,
    linked_projects_count: 2,
    primary_responsibilities: [
      'إدارة برامج كفالة الأيتام والتدخلات التنموية والتعليمية في حضرموت والمهرة',
      'التنسيق مع الجمعيات الشريكة ورجال الخير والأوقاف التنموية',
      'متابعة البرامج الحرفية والتمكين الأسري'
    ],
    governance_delegation_limit_yer: 4000000,
    status: 'active'
  }
];

export const STANDARD_JOB_POSITIONS: JobPosition[] = [
  {
    code: 'POS-CEO',
    title_ar: 'المدير التنفيذي العام',
    title_en: 'Chief Executive Officer (CEO)',
    department_code: 'DIR-EXEC',
    department_name_ar: 'الإدارة التنفيذية العامة',
    reports_to_position_code: null,
    grade_level: 'EXEC',
    employment_type: 'permanent',
    budgeted_count: 1,
    occupied_count: 1,
    salary_range_min_yer: 1800000,
    salary_range_max_yer: 2500000,
    approval_authority_limit_yer: 25000000,
    core_competencies: ['القيادة الاستراتيجية', 'إدارة المنظمات غير الربحية', 'الحوكمة والامتثال الدولي'],
    is_critical_role: true
  },
  {
    code: 'POS-CFO',
    title_ar: 'المدير المالي ورئيس قطاع الامتثال',
    title_en: 'Chief Financial Officer (CFO)',
    department_code: 'DEP-FIN',
    department_name_ar: 'قطاع الشؤون المالية',
    reports_to_position_code: 'POS-CEO',
    grade_level: 'DIR',
    employment_type: 'permanent',
    budgeted_count: 1,
    occupied_count: 1,
    salary_range_min_yer: 1400000,
    salary_range_max_yer: 1900000,
    approval_authority_limit_yer: 10000000,
    core_competencies: ['معايير IPSAS المحاسبية', 'إدارة التدفقات النقدية', 'التدقيق والرقابة الداخلية'],
    is_critical_role: true
  },
  {
    code: 'POS-PRG-DIR',
    title_ar: 'مدير قطاع البرامج الإنسانية والمشاريع',
    title_en: 'Humanitarian Programs Director',
    department_code: 'DEP-PRG',
    department_name_ar: 'قطاع البرامج والمشاريع',
    reports_to_position_code: 'POS-CEO',
    grade_level: 'DIR',
    employment_type: 'permanent',
    budgeted_count: 1,
    occupied_count: 1,
    salary_range_min_yer: 1400000,
    salary_range_max_yer: 1900000,
    approval_authority_limit_yer: 15000000,
    core_competencies: ['معايير Sphere وCHS', 'إدارة دورة حياة المشاريع PMP', 'إدارة المنح التمويلية'],
    is_critical_role: true
  },
  {
    code: 'POS-OPS-DIR',
    title_ar: 'مدير العمليات اللوجستية وسلاسل الإمداد',
    title_en: 'Operations & Supply Chain Director',
    department_code: 'DEP-OPS',
    department_name_ar: 'قطاع العمليات الميدانية',
    reports_to_position_code: 'POS-CEO',
    grade_level: 'DIR',
    employment_type: 'permanent',
    budgeted_count: 1,
    occupied_count: 1,
    salary_range_min_yer: 1200000,
    salary_range_max_yer: 1600000,
    approval_authority_limit_yer: 8000000,
    core_competencies: ['إدارة المناقصات وسلاسل الإمداد', 'إدارة المخازن المركزية', 'إدارة الأزمات والطوارئ'],
    is_critical_role: true
  },
  {
    code: 'POS-WASH-ENG',
    title_ar: 'كبير مهندسي مشاريع المياه والإصحاح',
    title_en: 'Lead WASH Engineer',
    department_code: 'DEP-PRG-WASH',
    department_name_ar: 'إدارة مشاريع المياه WASH',
    reports_to_position_code: 'POS-PRG-DIR',
    grade_level: 'LEAD',
    employment_type: 'permanent',
    budgeted_count: 2,
    occupied_count: 2,
    salary_range_min_yer: 900000,
    salary_range_max_yer: 1300000,
    approval_authority_limit_yer: 3000000,
    core_competencies: ['الهندسة الهيدروليكية', 'منظومات الضخ بالطاقة الشمسية', 'إشراف فني على المقاولين'],
    is_critical_role: true
  },
  {
    code: 'POS-ORPHAN-COORD',
    title_ar: 'منسق عام برامج كفالة الأيتام والرعاية',
    title_en: 'Orphan Sponsorship Coordinator',
    department_code: 'DEP-PRG-ORPHAN',
    department_name_ar: 'إدارة الرعاية وكفالة الأيتام',
    reports_to_position_code: 'POS-PRG-DIR',
    grade_level: 'COORD',
    employment_type: 'permanent',
    budgeted_count: 3,
    occupied_count: 3,
    salary_range_min_yer: 600000,
    salary_range_max_yer: 850000,
    approval_authority_limit_yer: 1500000,
    core_competencies: ['إدارة قواعد بيانات المستفيدين', 'المتابعة الاجتماعية الميدانية', 'إعداد تقارير الكافلين'],
    is_critical_role: false
  },
  {
    code: 'POS-AUDIT-OFFICER',
    title_ar: 'ضابط أول الرقابة والمراجعة الداخلية',
    title_en: 'Senior Internal Audit Officer',
    department_code: 'DEP-FIN',
    department_name_ar: 'قطاع الشؤون المالية',
    reports_to_position_code: 'POS-CFO',
    grade_level: 'SPEC',
    employment_type: 'permanent',
    budgeted_count: 2,
    occupied_count: 2,
    salary_range_min_yer: 800000,
    salary_range_max_yer: 1100000,
    approval_authority_limit_yer: 2000000,
    core_competencies: ['المطابقة الثلاثية للمشتريات', 'فحص الامتثال المحاسبي', 'مكافحة الاحتيال وتضارب المصالح'],
    is_critical_role: true
  },
  {
    code: 'POS-PROC-OFFICER',
    title_ar: 'مسؤول المشتريات ولجان المناقصات',
    title_en: 'Procurement & Tenders Officer',
    department_code: 'DEP-OPS',
    department_name_ar: 'قطاع العمليات الميدانية',
    reports_to_position_code: 'POS-OPS-DIR',
    grade_level: 'OFFICER',
    employment_type: 'permanent',
    budgeted_count: 3,
    occupied_count: 3,
    salary_range_min_yer: 700000,
    salary_range_max_yer: 950000,
    approval_authority_limit_yer: 2000000,
    core_competencies: ['تحليل عروض الأسعار RFQ', 'إدارة أوامر الشراء PO', 'تقييم واعتماد الموردين'],
    is_critical_role: false
  },
  {
    code: 'POS-MEAL-OFFICER',
    title_ar: 'أخصائي الرصد والتقييم الميداني',
    title_en: 'MEAL Field Specialist',
    department_code: 'DEP-PRG-MEAL',
    department_name_ar: 'إدارة الرصد والتقييم MEAL',
    reports_to_position_code: 'POS-PRG-DIR',
    grade_level: 'SPEC',
    employment_type: 'permanent',
    budgeted_count: 4,
    occupied_count: 3,
    salary_range_min_yer: 750000,
    salary_range_max_yer: 1050000,
    approval_authority_limit_yer: 1000000,
    core_competencies: ['جمع وتحليل البيانات الميدانية', 'إجراء استطلاعات الرضا PDM', 'توثيق الدروس المستفادة'],
    is_critical_role: false
  },
  {
    code: 'POS-BRN-TAIZ-MGR',
    title_ar: 'مدير فرع تعز والمناطق الريفية',
    title_en: 'Taiz Branch Area Manager',
    department_code: 'BRN-TAIZ',
    department_name_ar: 'فرع تعز وصبر الموادم',
    reports_to_position_code: 'POS-CEO',
    grade_level: 'MGR',
    employment_type: 'permanent',
    budgeted_count: 1,
    occupied_count: 1,
    salary_range_min_yer: 1100000,
    salary_range_max_yer: 1500000,
    approval_authority_limit_yer: 6000000,
    core_competencies: ['القيادة الميدانية', 'إدارة الفرق والمتطوعين', 'إدارة الأمن وسلامة الفرق'],
    is_critical_role: true
  }
];
