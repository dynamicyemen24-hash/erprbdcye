// Standardized Enterprise Cost Centers Architecture (دليل مراكز التكلفة المعياري المؤسسي)
// جمعية رُحماء بينهم للعمل الإنساني والتنمية (Rohamā'a Baynahum Charity Foundation)
// UAMEX ERP™ Intelligent Enterprise Operating System

export type CostCenterCategory = 'programs' | 'regional' | 'operations' | 'governance';

export interface LinkedProjectShare {
  id: string;
  code: string;
  name_ar: string;
  share_percent: number;
}

export interface CostDriverAllocation {
  driver_name_ar: string;
  driver_name_en: string;
  units_consumed: number;
  cost_per_unit_yer: number;
  total_allocated_yer: number;
}

export interface EnterpriseCostCenter {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  category: CostCenterCategory;
  category_name_ar: string;
  parent_code: string | null;
  level: number; // 1: محور رئيسي تجميعي, 2: مركز تكلفة فرعي تشغيلي
  manager_name: string;
  manager_title: string;
  linked_department_code: string;
  approved_budget_yer: number;
  actual_expenses_yer: number;
  committed_procurement_yer: number;
  allocated_indirect_cost_yer: number; // التكاليف غير المباشرة المحملة عبر نظام ABC
  total_incurred_cost_yer: number; // الإجمالي الفعلي والملتزم به
  allocated_revenue_yer: number; // الإيرادات والتبرعات المخصصة للمركز
  burn_rate_percent: number;
  variance_status: 'FAVORABLE' | 'NORMAL' | 'WARNING' | 'EXCEEDED';
  linked_projects: LinkedProjectShare[];
  cost_drivers: CostDriverAllocation[];
  is_active: boolean;
  notes_ar?: string;
}

export const STANDARD_COST_CENTERS: EnterpriseCostCenter[] = [
  // ==================== 1. مراكز تكلفة البرامج والمشاريع الميدانية (PROGRAMS) ====================
  {
    id: 'cc-prg-food',
    code: 'CC-PRG-FOOD-01',
    name_ar: 'مركز تكلفة مشاريع الأمن الغذائي والسلال الإغاثية',
    name_en: 'Food Security & Relief Baskets Cost Center',
    category: 'programs',
    category_name_ar: 'البرامج والمشاريع الميدانية',
    parent_code: null,
    level: 1,
    manager_name: 'م. فؤاد قاسم الصبري',
    manager_title: 'مدير برنامج الأمن الغذائي',
    linked_department_code: 'DEP-PRG-FOOD',
    approved_budget_yer: 320000000,
    actual_expenses_yer: 245600000,
    committed_procurement_yer: 32400000,
    allocated_indirect_cost_yer: 14200000,
    total_incurred_cost_yer: 292200000,
    allocated_revenue_yer: 340000000,
    burn_rate_percent: 91.3,
    variance_status: 'NORMAL',
    linked_projects: [
      { id: 'prj-01', code: 'PRJ-FOOD-26-01', name_ar: 'مشروع سلال رمضان الغذائية للأسر الأشد فقراً', share_percent: 60 },
      { id: 'prj-02', code: 'PRJ-BAKERY-26', name_ar: 'مشروع المخابز الخيرية والوجبات الساخنة', share_percent: 40 }
    ],
    cost_drivers: [
      { driver_name_ar: 'عدد السلال الغذائية الموزعة', driver_name_en: 'Food Baskets Distributed', units_consumed: 8500, cost_per_unit_yer: 1200, total_allocated_yer: 10200000 },
      { driver_name_ar: 'رحلات الشاحنات اللوجستية', driver_name_en: 'Truck Transport Trips', units_consumed: 40, cost_per_unit_yer: 100000, total_allocated_yer: 4000000 }
    ],
    is_active: true,
    notes_ar: 'المركز الرئيسي لتكاليف التدخلات الغذائية الطارئة والموسمية.'
  },
  {
    id: 'cc-prg-orphan',
    code: 'CC-PRG-ORPHAN-01',
    name_ar: 'مركز تكلفة الرعاية الشاملة وكفالة الأيتام',
    name_en: 'Orphan Sponsorship & Social Welfare Cost Center',
    category: 'programs',
    category_name_ar: 'البرامج والمشاريع الميدانية',
    parent_code: null,
    level: 1,
    manager_name: 'أ. مروان عبد السلام الحمادي',
    manager_title: 'مدير إدارة كفالة الأيتام',
    linked_department_code: 'DEP-PRG-ORPHAN',
    approved_budget_yer: 280000000,
    actual_expenses_yer: 218500000,
    committed_procurement_yer: 12800000,
    allocated_indirect_cost_yer: 11400000,
    total_incurred_cost_yer: 242700000,
    allocated_revenue_yer: 295000000,
    burn_rate_percent: 86.7,
    variance_status: 'FAVORABLE',
    linked_projects: [
      { id: 'prj-03', code: 'PRJ-ORPHAN-KAFALA', name_ar: 'برنامج الكفالة النقدية والتعليمية للأيتام', share_percent: 85 },
      { id: 'prj-04', code: 'PRJ-EID-CLOTHES', name_ar: 'مشروع كسوة وعيدية عيد الفطر المبارك', share_percent: 15 }
    ],
    cost_drivers: [
      { driver_name_ar: 'عدد الأيتام المكفولين شهرياً', driver_name_en: 'Orphans Sponsored per Month', units_consumed: 1450, cost_per_unit_yer: 6000, total_allocated_yer: 8700000 },
      { driver_name_ar: 'الزيارات الميدانية والمتابعة الاجتماعية', driver_name_en: 'Field Social Assessments', units_consumed: 180, cost_per_unit_yer: 15000, total_allocated_yer: 2700000 }
    ],
    is_active: true,
    notes_ar: 'حسابات ومصاريف الكفالات النقدية، الرعاية الصحية، والأنشطة التربوية للأيتام.'
  },
  {
    id: 'cc-prg-wash',
    code: 'CC-PRG-WASH-01',
    name_ar: 'مركز تكلفة مشاريع المياه وإصحاح البيئة (WASH)',
    name_en: 'Water, Sanitation & Hygiene (WASH) Cost Center',
    category: 'programs',
    category_name_ar: 'البرامج والمشاريع الميدانية',
    parent_code: null,
    level: 1,
    manager_name: 'م. عادل الشميري',
    manager_title: 'مدير مشاريع المياه والإصحاح',
    linked_department_code: 'DEP-PRG-WASH',
    approved_budget_yer: 240000000,
    actual_expenses_yer: 188450000,
    committed_procurement_yer: 28600000,
    allocated_indirect_cost_yer: 9800000,
    total_incurred_cost_yer: 226850000,
    allocated_revenue_yer: 248000000,
    burn_rate_percent: 94.5,
    variance_status: 'WARNING',
    linked_projects: [
      { id: 'prj-05', code: 'PRJ-WASH-SABIR-01', name_ar: 'مشروع مياه وإصحاح ريف تعز وصبر الموادم', share_percent: 75 },
      { id: 'prj-06', code: 'PRJ-WASH-WELLS-26', name_ar: 'حفر وتأهيل الآبار بالطاقة الشمسية', share_percent: 25 }
    ],
    cost_drivers: [
      { driver_name_ar: 'ساعات الفحص والمسح الهندسي الهيدروليكي', driver_name_en: 'Hydraulic Survey Hours', units_consumed: 120, cost_per_unit_yer: 45000, total_allocated_yer: 5400000 },
      { driver_name_ar: 'فحوصات الجودة البكتريولوجية للمياه', driver_name_en: 'Water Quality Lab Tests', units_consumed: 88, cost_per_unit_yer: 50000, total_allocated_yer: 4400000 }
    ],
    is_active: true,
    notes_ar: 'تأهيل شبكات المياه وحفر الآبار الارتوازية والمنظومات الكهروضوئية.'
  },
  {
    id: 'cc-prg-shelter',
    code: 'CC-PRG-SHELTER-01',
    name_ar: 'مركز تكلفة الإيواء الطارئ ومخيمات النازحين (NFI)',
    name_en: 'Emergency Shelter & Camp Coordination Cost Center',
    category: 'programs',
    category_name_ar: 'البرامج والمشاريع الميدانية',
    parent_code: null,
    level: 1,
    manager_name: 'م. أحمد خالد المعمري',
    manager_title: 'مدير قطاع البرامج والمشاريع',
    linked_department_code: 'DEP-PRG',
    approved_budget_yer: 160000000,
    actual_expenses_yer: 112300000,
    committed_procurement_yer: 18500000,
    allocated_indirect_cost_yer: 6200000,
    total_incurred_cost_yer: 137000000,
    allocated_revenue_yer: 165000000,
    burn_rate_percent: 85.6,
    variance_status: 'FAVORABLE',
    linked_projects: [
      { id: 'prj-07', code: 'PRJ-SHELTER-CAMP', name_ar: 'مشروع صيانة وتأهيل الخيام وتوزيع المواد غير الغذائية', share_percent: 100 }
    ],
    cost_drivers: [
      { driver_name_ar: 'عدد الأسر المستفيدة من مواد المأوى', driver_name_en: 'Shelter Beneficiary Households', units_consumed: 1200, cost_per_unit_yer: 3500, total_allocated_yer: 4200000 },
      { driver_name_ar: 'ساعات التجهيز والتركيب الميداني', driver_name_en: 'Field Installation Hours', units_consumed: 100, cost_per_unit_yer: 20000, total_allocated_yer: 2000000 }
    ],
    is_active: true,
    notes_ar: 'تدخلات الطوارئ وإصلاح الخيام ومواد التدفئة وتجهيزات النازحين.'
  },

  // ==================== 2. مراكز تكلفة الفروع والمكاتب الجغرافية (REGIONAL) ====================
  {
    id: 'cc-geo-sanaa',
    code: 'CC-GEO-SANAA',
    name_ar: 'مركز تكلفة فرع العاصمة صنعاء والمحافظات المركزية',
    name_en: 'Sana\'a Regional Hub Cost Center',
    category: 'regional',
    category_name_ar: 'الفروع والمكاتب الميدانية',
    parent_code: null,
    level: 1,
    manager_name: 'أ. نبيل صالح الغرباني',
    manager_title: 'مدير فرع صنعاء',
    linked_department_code: 'BRN-SANAA',
    approved_budget_yer: 110000000,
    actual_expenses_yer: 86400000,
    committed_procurement_yer: 9200000,
    allocated_indirect_cost_yer: 5800000,
    total_incurred_cost_yer: 101400000,
    allocated_revenue_yer: 115000000,
    burn_rate_percent: 92.2,
    variance_status: 'NORMAL',
    linked_projects: [
      { id: 'prj-08', code: 'PRJ-SANAA-LOCAL', name_ar: 'الأنشطة المجتمعية وتوزيع الإغاثة بالأمانة', share_percent: 100 }
    ],
    cost_drivers: [
      { driver_name_ar: 'إيجار وتشغيل المقر والمخزن الإقليمي', driver_name_en: 'Facility Lease & Operations', units_consumed: 12, cost_per_unit_yer: 350000, total_allocated_yer: 4200000 },
      { driver_name_ar: 'تصاريح التوزيع والمطابقة الميدانية', driver_name_en: 'Field Permits & Clearances', units_consumed: 32, cost_per_unit_yer: 50000, total_allocated_yer: 1600000 }
    ],
    is_active: true,
    notes_ar: 'النفقات التشغيلية والمكتبية لفرع صنعاء ومستودعاته الملحقة.'
  },
  {
    id: 'cc-geo-aden',
    code: 'CC-GEO-ADEN',
    name_ar: 'مركز تكلفة مكتب التنسيق والعمليات الميدانية - عدن',
    name_en: 'Aden Regional Hub Cost Center',
    category: 'regional',
    category_name_ar: 'الفروع والمكاتب الميدانية',
    parent_code: null,
    level: 1,
    manager_name: 'أ. وضاح محمد فضل',
    manager_title: 'مدير مكتب عدن',
    linked_department_code: 'BRN-ADEN',
    approved_budget_yer: 85000000,
    actual_expenses_yer: 64500000,
    committed_procurement_yer: 7400000,
    allocated_indirect_cost_yer: 4200000,
    total_incurred_cost_yer: 76100000,
    allocated_revenue_yer: 88000000,
    burn_rate_percent: 89.5,
    variance_status: 'NORMAL',
    linked_projects: [
      { id: 'prj-09', code: 'PRJ-ADEN-PORTS', name_ar: 'التخليص الجمركي وتنسيق المعونات عبر ميناء ومطار عدن', share_percent: 100 }
    ],
    cost_drivers: [
      { driver_name_ar: 'معاملات التخليص والتفتيش الجمركي', driver_name_en: 'Port Customs Clearances', units_consumed: 14, cost_per_unit_yer: 200000, total_allocated_yer: 2800000 },
      { driver_name_ar: 'بدلات الانتقال والتنسيق الحكومي', driver_name_en: 'Government Coordination Trips', units_consumed: 28, cost_per_unit_yer: 50000, total_allocated_yer: 1400000 }
    ],
    is_active: true,
    notes_ar: 'المتابعة الميدانية في عدن ولحج ومكتب الاتصال بالمانحين الدوليين.'
  },
  {
    id: 'cc-geo-taiz',
    code: 'CC-GEO-TAIZ',
    name_ar: 'مركز تكلفة فرع تعز والعمليات الريفية (صبر الموادم)',
    name_en: 'Taiz & Sabir Branch Cost Center',
    category: 'regional',
    category_name_ar: 'الفروع والمكاتب الميدانية',
    parent_code: null,
    level: 1,
    manager_name: 'م. ميثاق عبد الجليل المقطري',
    manager_title: 'مدير فرع تعز والريف',
    linked_department_code: 'BRN-TAIZ',
    approved_budget_yer: 145000000,
    actual_expenses_yer: 128900000,
    committed_procurement_yer: 12500000,
    allocated_indirect_cost_yer: 7100000,
    total_incurred_cost_yer: 148500000,
    allocated_revenue_yer: 152000000,
    burn_rate_percent: 102.4,
    variance_status: 'EXCEEDED',
    linked_projects: [
      { id: 'prj-10', code: 'PRJ-TAIZ-WATER', name_ar: 'تشغيل وصيانة مشاريع مياه قرى جبل صبر', share_percent: 60 },
      { id: 'prj-11', code: 'PRJ-TAIZ-RELIEF', name_ar: 'توزيع المعونات الدورية للأسر المحاصرة', share_percent: 40 }
    ],
    cost_drivers: [
      { driver_name_ar: 'نقل وصيانة الشاحنات في الطرق الجبلية الوعرة', driver_name_en: 'Mountain Transport Logistics', units_consumed: 65, cost_per_unit_yer: 80000, total_allocated_yer: 5200000 },
      { driver_name_ar: 'لجان الرقابة المجتمعية والتحقق', driver_name_en: 'Community Oversight Committees', units_consumed: 38, cost_per_unit_yer: 50000, total_allocated_yer: 1900000 }
    ],
    is_active: true,
    notes_ar: 'الفرع التشغيلي الأكبر ميدانياً مع مشاريع مياه وإغاثة متكاملة في ريف تعز.'
  },

  // ==================== 3. مراكز تكلفة الإسناد والعمليات وسلاسل الإمداد (OPERATIONS) ====================
  {
    id: 'cc-ops-proc',
    code: 'CC-OPS-PROC',
    name_ar: 'مركز تكلفة المشتريات والمناقصات والعقود',
    name_en: 'Procurement & Supply Contracts Cost Center',
    category: 'operations',
    category_name_ar: 'العمليات اللوجستية والإسناد',
    parent_code: null,
    level: 1,
    manager_name: 'د. خالد وليد العماري',
    manager_title: 'مدير العمليات وسلاسل الإمداد',
    linked_department_code: 'DEP-OPS',
    approved_budget_yer: 35000000,
    actual_expenses_yer: 26800000,
    committed_procurement_yer: 2400000,
    allocated_indirect_cost_yer: 1800000,
    total_incurred_cost_yer: 31000000,
    allocated_revenue_yer: 36000000,
    burn_rate_percent: 88.6,
    variance_status: 'NORMAL',
    linked_projects: [],
    cost_drivers: [
      { driver_name_ar: 'أوامر الشراء المنجزة والمطابقة', driver_name_en: 'Completed Purchase Orders', units_consumed: 160, cost_per_unit_yer: 8000, total_allocated_yer: 1280000 },
      { driver_name_ar: 'جلسات لجان فتح المظاريف والترسية', driver_name_en: 'Tender Opening Sessions', units_consumed: 26, cost_per_unit_yer: 20000, total_allocated_yer: 520000 }
    ],
    is_active: true,
    notes_ar: 'فحص عروض الأسعار، إدارة الموردين، وإصدار أوامر الشراء المعتمدة.'
  },
  {
    id: 'cc-ops-wh',
    code: 'CC-OPS-WH',
    name_ar: 'مركز تكلفة المستودعات المركزية وسلاسل الإمداد',
    name_en: 'Central Warehouses & Inventory Cost Center',
    category: 'operations',
    category_name_ar: 'العمليات اللوجستية والإسناد',
    parent_code: null,
    level: 1,
    manager_name: 'أ. سامي عبد الله الحسام',
    manager_title: 'أمين المستودعات المركزية',
    linked_department_code: 'DEP-OPS',
    approved_budget_yer: 42000000,
    actual_expenses_yer: 33400000,
    committed_procurement_yer: 3600000,
    allocated_indirect_cost_yer: 2100000,
    total_incurred_cost_yer: 39100000,
    allocated_revenue_yer: 44000000,
    burn_rate_percent: 93.1,
    variance_status: 'NORMAL',
    linked_projects: [],
    cost_drivers: [
      { driver_name_ar: 'مساحة التخزين المشغولة (متر مربع/شهر)', driver_name_en: 'Storage Area Sqm/Month', units_consumed: 1200, cost_per_unit_yer: 1200, total_allocated_yer: 1440000 },
      { driver_name_ar: 'أذونات الاستلام والصرف المخزني (MRV/GIV)', driver_name_en: 'Material Receipt & Issue Notes', units_consumed: 330, cost_per_unit_yer: 2000, total_allocated_yer: 660000 }
    ],
    is_active: true,
    notes_ar: 'تشغيل وتأمين المخازن المركزية وضبط الجرد الدوري للمساعدات العينية.'
  },
  {
    id: 'cc-ops-fleet',
    code: 'CC-OPS-FLEET',
    name_ar: 'مركز تكلفة أسطول النقل والحركة الميدانية',
    name_en: 'Fleet & Field Transportation Cost Center',
    category: 'operations',
    category_name_ar: 'العمليات اللوجستية والإسناد',
    parent_code: null,
    level: 1,
    manager_name: 'أ. كمال علي الواسعي',
    manager_title: 'مسؤول الحركة والأسطول',
    linked_department_code: 'DEP-OPS',
    approved_budget_yer: 28000000,
    actual_expenses_yer: 22100000,
    committed_procurement_yer: 2900000,
    allocated_indirect_cost_yer: 1600000,
    total_incurred_cost_yer: 26600000,
    allocated_revenue_yer: 29000000,
    burn_rate_percent: 95.0,
    variance_status: 'WARNING',
    linked_projects: [],
    cost_drivers: [
      { driver_name_ar: 'كيلومترات التشغيل للسيارات والشاحنات', driver_name_en: 'Fleet Operational Kilometers', units_consumed: 45000, cost_per_unit_yer: 25, total_allocated_yer: 1125000 },
      { driver_name_ar: 'أوامر الصيانة وتغيير الزيوت وقطع الغيار', driver_name_en: 'Fleet Maintenance Work Orders', units_consumed: 35, cost_per_unit_yer: 13571, total_allocated_yer: 475000 }
    ],
    is_active: true,
    notes_ar: 'وقود وصيانة وتأمين شاحنات النقل الإغاثي وسيارات الرقابة الميدانية.'
  },

  // ==================== 4. مراكز تكلفة الحوكمة والإدارة وتنمية الموارد (GOVERNANCE & ADMIN) ====================
  {
    id: 'cc-adm-exec',
    code: 'CC-ADM-EXEC',
    name_ar: 'مركز تكلفة الإدارة التنفيذية العامة والتخطيط',
    name_en: 'Executive Leadership & Planning Cost Center',
    category: 'governance',
    category_name_ar: 'الحوكمة والإدارة العامة',
    parent_code: null,
    level: 1,
    manager_name: 'د. عبد الله محمد الشامي',
    manager_title: 'المدير التنفيذي العام',
    linked_department_code: 'DIR-EXEC',
    approved_budget_yer: 50000000,
    actual_expenses_yer: 39500000,
    committed_procurement_yer: 4100000,
    allocated_indirect_cost_yer: 2500000,
    total_incurred_cost_yer: 46100000,
    allocated_revenue_yer: 52000000,
    burn_rate_percent: 92.2,
    variance_status: 'NORMAL',
    linked_projects: [],
    cost_drivers: [
      { driver_name_ar: 'جلسات مجالس الإدارة واللجان القيادية', driver_name_en: 'Board & Executive Meetings', units_consumed: 24, cost_per_unit_yer: 75000, total_allocated_yer: 1800000 },
      { driver_name_ar: 'الاستشارات القانونية والمراجعة المؤسسية', driver_name_en: 'Legal & Governance Retainers', units_consumed: 10, cost_per_unit_yer: 70000, total_allocated_yer: 700000 }
    ],
    is_active: true,
    notes_ar: 'نفقات القيادة العليا والخطط الاستراتيجية وتطوير النظم والحوكمة.'
  },
  {
    id: 'cc-adm-fin',
    code: 'CC-ADM-FIN',
    name_ar: 'مركز تكلفة الإدارة المالية والمراجعة الداخلية',
    name_en: 'Finance & Internal Audit Cost Center',
    category: 'governance',
    category_name_ar: 'الحوكمة والإدارة العامة',
    parent_code: null,
    level: 1,
    manager_name: 'أ. ياسر سعيد باوزير',
    manager_title: 'المدير المالي ورئيس قطاع الامتثال',
    linked_department_code: 'DEP-FIN',
    approved_budget_yer: 38000000,
    actual_expenses_yer: 28900000,
    committed_procurement_yer: 3200000,
    allocated_indirect_cost_yer: 1900000,
    total_incurred_cost_yer: 34000000,
    allocated_revenue_yer: 40000000,
    burn_rate_percent: 89.5,
    variance_status: 'NORMAL',
    linked_projects: [],
    cost_drivers: [
      { driver_name_ar: 'تقارير المراجعة والتدقيق المالي المحاسبي', driver_name_en: 'Internal Audit Reports', units_consumed: 48, cost_per_unit_yer: 25000, total_allocated_yer: 1200000 },
      { driver_name_ar: 'التحويلات المصرفية ورسوم السويفت', driver_name_en: 'Bank Wire & SWIFT Fees', units_consumed: 140, cost_per_unit_yer: 5000, total_allocated_yer: 700000 }
    ],
    is_active: true,
    notes_ar: 'إدارة المحاسبة وإصدار القوائم المالية والتدقيق المحاسبي المستمر.'
  },
  {
    id: 'cc-frd-camp',
    code: 'CC-FRD-CAMP',
    name_ar: 'مركز تكلفة تنمية الموارد والحملات الإعلامية',
    name_en: 'Fundraising & Donor Campaigns Cost Center',
    category: 'governance',
    category_name_ar: 'الحوكمة والإدارة العامة',
    parent_code: null,
    level: 1,
    manager_name: 'أ. طارق عبد الرحمن القدسي',
    manager_title: 'مدير تنمية الموارد والشراكات',
    linked_department_code: 'DEP-FRD',
    approved_budget_yer: 48000000,
    actual_expenses_yer: 36200000,
    committed_procurement_yer: 4800000,
    allocated_indirect_cost_yer: 2200000,
    total_incurred_cost_yer: 43200000,
    allocated_revenue_yer: 180000000, // جذب تبرعات بقيمة 180 مليون ر.ي
    burn_rate_percent: 90.0,
    variance_status: 'FAVORABLE',
    linked_projects: [],
    cost_drivers: [
      { driver_name_ar: 'الحملات التسويقية والمنصات الرقمية', driver_name_en: 'Digital Media Campaigns', units_consumed: 18, cost_per_unit_yer: 80000, total_allocated_yer: 1440000 },
      { driver_name_ar: 'إنتاج الأفلام والتقارير الميدانية المرئية', driver_name_en: 'Video Documentary Production', units_consumed: 12, cost_per_unit_yer: 63333, total_allocated_yer: 760000 }
    ],
    is_active: true,
    notes_ar: 'حملات التبرعات الموسمية، إنتاج الأفلام الإنسانية، وتطوير منصات الدفع الإلكتروني.'
  }
];
