export interface ReportWorkspaceDefinition {
  id: string;
  reportTab: string;
  workspaceTab: string;
  /** NEB domain codes covered by this report (NEB-01..15). */
  nebCodes: string[];
  /** SAP equivalent module(s). */
  sapModules: string[];
  /** Live DB view(s) backing the report. */
  dbViews: string[];
  /** Production API endpoint(s) feeding the report. */
  apiEndpoints: string[];
  titleAr: string;
  titleEn: string;
  documentAr: string;
  documentEn: string;
  standardAr: string;
  standardEn: string;
}

/**
 * Complete NEB-01..15 report coverage (SAP-style).
 * Original 8 entries preserved verbatim + enriched with nebCodes/sapModules/dbViews/apiEndpoints.
 * 10 new entries close the gaps: portfolio, funding, assets, community, hr,
 * meal, knowledge, integration, admin, commitments.
 */
export const REPORT_WORKSPACE_REGISTRY: ReportWorkspaceDefinition[] = [
  {
    id: 'strategy',
    reportTab: 'executive_report',
    workspaceTab: 'strategic_planning',
    nebCodes: ['NEB-01'], sapModules: ['BI', 'PPM'],
    dbViews: ['v_kpi_vs_target_dashboard'],
    apiEndpoints: ['GET /api/v2/strategy/kpis'],
    titleAr: 'التخطيط الاستراتيجي',
    titleEn: 'Strategic Planning',
    documentAr: 'الخطة الاستراتيجية وبطاقة الأداء المتوازن',
    documentEn: 'Strategic Plan & Balanced Scorecard',
    standardAr: 'أهداف ومحاور ومؤشرات وقرارات',
    standardEn: 'Objectives, pillars, KPIs and decisions'
  },
  {
    id: 'portfolio',
    reportTab: 'programs_projects',
    workspaceTab: 'portfolio_intelligence',
    nebCodes: ['NEB-02'], sapModules: ['PPM', 'CO'],
    dbViews: ['v_kpi_vs_target_dashboard'],
    apiEndpoints: ['GET /api/v2/domains/portfolio/overview', 'GET /api/v2/ppm/dashboard'],
    titleAr: 'المحفظة الاستثمارية',
    titleEn: 'Portfolio Intelligence',
    documentAr: 'تقرير أداء المحفظة والمخاطر والمعايير',
    documentEn: 'Portfolio Performance, Risks & Benchmarks Report',
    standardAr: 'العائد والمخاطر والمواءمة الاستراتيجية',
    standardEn: 'Return, risk and strategic alignment'
  },
  {
    id: 'projects',
    reportTab: 'programs_projects',
    workspaceTab: 'projects',
    nebCodes: ['NEB-03', 'NEB-04'], sapModules: ['PS', 'PPM'],
    dbViews: ['v_kpi_vs_target_dashboard'],
    apiEndpoints: ['GET /api/v2/projects', 'GET /api/v2/ppm/timeline'],
    titleAr: 'المشاريع والبرامج',
    titleEn: 'Projects & Programs',
    documentAr: 'تقرير حالة المشروع وسجل المخاطر',
    documentEn: 'Project Status & Risk Register',
    standardAr: 'النطاق والوقت والتكلفة والإنجاز',
    standardEn: 'Scope, schedule, cost and delivery'
  },
  {
    id: 'activities',
    reportTab: 'geographic',
    workspaceTab: 'activities',
    nebCodes: ['NEB-05'], sapModules: ['PM'],
    dbViews: ['v_service_delivery_metrics'],
    apiEndpoints: ['GET /api/v2/domains/activities'],
    titleAr: 'الأنشطة والعمليات',
    titleEn: 'Activities & Operations',
    documentAr: 'تقرير النشاط الميداني ومحضر الإنجاز',
    documentEn: 'Field Activity & Completion Report',
    standardAr: 'حزم العمل والمخرجات والتحقق',
    standardEn: 'Work packages, outputs and verification'
  },
  {
    id: 'beneficiaries',
    reportTab: 'beneficiaries_sponsorships',
    workspaceTab: 'beneficiaries',
    nebCodes: ['NEB-06'], sapModules: ['CRM'],
    dbViews: ['v_beneficiary_vulnerability_index', 'v_service_delivery_metrics'],
    apiEndpoints: ['GET /api/tables/beneficiaries', 'GET /api/v2/services/deliveries'],
    titleAr: 'المستفيدون والكفالات',
    titleEn: 'Beneficiaries & Sponsorships',
    documentAr: 'سجل المستفيدين وتقرير الأثر والخدمات',
    documentEn: 'Beneficiary Register & Impact Services Report',
    standardAr: 'الأهلية والخدمة والنتيجة',
    standardEn: 'Eligibility, service and outcome'
  },
  {
    id: 'community',
    reportTab: 'beneficiaries_sponsorships',
    workspaceTab: 'beneficiaries',
    nebCodes: ['NEB-07'], sapModules: ['HCM'],
    dbViews: ['v_volunteer_hours_report'],
    apiEndpoints: ['GET /api/v2/domains/volunteers', 'GET /api/v2/domains/volunteers/hours-report'],
    titleAr: 'التطوع والمجتمع',
    titleEn: 'Volunteers & Community',
    documentAr: 'سجل المتطوعين وساعات التطوع واللجان المجتمعية',
    documentEn: 'Volunteer Register, Hours & Community Committees Report',
    standardAr: 'الاستقطاب والساعات والمهارات',
    standardEn: 'Recruitment, hours and skills'
  },
  {
    id: 'funding',
    reportTab: 'financial',
    workspaceTab: 'contracts',
    nebCodes: ['NEB-08'], sapModules: ['GM'],
    dbViews: ['v_grant_utilization_report', 'v_donor_portfolio_analysis'],
    apiEndpoints: ['GET /api/v2/domains/grants', 'GET /api/v2/domains/utilization', 'GET /api/v2/institutional-reports/grant-utilization'],
    titleAr: 'التمويل والمانحون',
    titleEn: 'Funding & Donors',
    documentAr: 'تقرير استخدام المنح ومحفظة المانحين وIATI',
    documentEn: 'Grant Utilization, Donor Portfolio & IATI Report',
    standardAr: 'القيود والاستخدام والامتثال IATI',
    standardEn: 'Restrictions, utilization and IATI compliance'
  },
  {
    id: 'assets',
    reportTab: 'financial',
    workspaceTab: 'inventory',
    nebCodes: ['NEB-09'], sapModules: ['AA'],
    dbViews: [],
    apiEndpoints: ['GET /api/v2/domains/assets', 'GET /api/v2/domains/assets/depreciation'],
    titleAr: 'الأصول الثابتة',
    titleEn: 'Fixed Assets',
    documentAr: 'سجل الأصول والإهلاك والجرد المادي',
    documentEn: 'Fixed Asset Register, Depreciation & Physical Audit',
    standardAr: 'التسجيل والإهلاك والجرد IPSAS 17',
    standardEn: 'Capitalization, depreciation and IPSAS 17 stocktake'
  },
  {
    id: 'hr',
    reportTab: 'beneficiaries_sponsorships',
    workspaceTab: 'hr_dashboard',
    nebCodes: ['NEB-09'], sapModules: ['HCM'],
    dbViews: [],
    apiEndpoints: ['GET /api/v2/domains/hr/staff', 'GET /api/v2/domains/hr/dashboard'],
    titleAr: 'الموارد البشرية',
    titleEn: 'Human Resources',
    documentAr: 'تقرير الكادر والحضور والإجازات والرواتب',
    documentEn: 'Workforce, Attendance, Leaves & Payroll Report',
    standardAr: 'الملف والدوام والأجر IPSAS 25',
    standardEn: 'Profile, attendance and IPSAS 25 payroll'
  },
  {
    id: 'finance',
    reportTab: 'financial',
    workspaceTab: 'finance',
    nebCodes: ['NEB-10'], sapModules: ['FI', 'CO'],
    dbViews: [],
    apiEndpoints: ['GET /api/v2/finance/trial-balance', 'GET /api/v2/finance/balance-sheet', 'GET /api/v2/finance/income-statement'],
    titleAr: 'المحاسبة والمالية',
    titleEn: 'Accounting & Finance',
    documentAr: 'القوائم المالية ودفتر الأستاذ',
    documentEn: 'Financial Statements & General Ledger',
    standardAr: 'القيد المزدوج وIPSAS',
    standardEn: 'Double-entry accounting and IPSAS'
  },
  {
    id: 'commitments',
    reportTab: 'financial',
    workspaceTab: 'contracts',
    nebCodes: ['NEB-08', 'NEB-10'], sapModules: ['GM', 'FI'],
    dbViews: ['v_procurement_3way_match'],
    apiEndpoints: ['GET /api/tables/commitments', 'GET /api/tables/obligations'],
    titleAr: 'التعهدات والالتزامات',
    titleEn: 'Commitments & Obligations',
    documentAr: 'تقرير التعهدات والالتزامات الدورية',
    documentEn: 'Commitments & Periodic Obligations Report',
    standardAr: 'التعهد والدفع والتسوية',
    standardEn: 'Commitment, payment and settlement'
  },
  {
    id: 'knowledge',
    reportTab: 'intelligence',
    workspaceTab: 'docs',
    nebCodes: ['NEB-11'], sapModules: ['DMS'],
    dbViews: [],
    apiEndpoints: ['GET /api/v2/domains/knowledge', 'GET /api/v2/communications/memoranda'],
    titleAr: 'المعرفة والوثائق',
    titleEn: 'Knowledge & Documents',
    documentAr: 'دليل السياسات والأرشيف والمذكرات الرسمية',
    documentEn: 'Policy Library, Archive & Official Memoranda',
    standardAr: 'التوثيق والنسخ والاعتماد',
    standardEn: 'Documentation, versioning and approval'
  },
  {
    id: 'integration',
    reportTab: 'intelligence',
    workspaceTab: 'admin_control_center',
    nebCodes: ['NEB-12'], sapModules: ['BASIS'],
    dbViews: [],
    apiEndpoints: ['GET /api/v2/integration/status', 'GET /api/v2/system/health'],
    titleAr: 'التكامل والربط الرقمي',
    titleEn: 'Integration & Digital',
    documentAr: 'تقرير التكامل والمزامنة وIATI التقني',
    documentEn: 'Integration, Sync & Technical IATI Report',
    standardAr: 'الربط والمزامنة والحوكمة التقنية',
    standardEn: 'Connectivity, sync and technical governance'
  },
  {
    id: 'meal',
    reportTab: 'intelligence',
    workspaceTab: 'reports',
    nebCodes: ['NEB-13', 'NEB-01'], sapModules: ['BI'],
    dbViews: ['v_chs_compliance_dashboard', 'v_ai_anomaly_detection_feed'],
    apiEndpoints: ['GET /api/v2/domains/ai/insights', 'GET /api/v2/domains/ai/impact', 'GET /api/v2/domains/ai/executive-summary'],
    titleAr: 'الرقابة والتقييم والجودة MEAL',
    titleEn: 'MEAL & Accountability',
    documentAr: 'تقرير الامتثال CHS ومعايير Sphere وكشف الشذوذ',
    documentEn: 'CHS Compliance, Sphere Standards & Anomaly Report',
    standardAr: 'الجودة والمساءلة والأثر CHS/Sphere',
    standardEn: 'Quality, accountability and CHS/Sphere impact'
  },
  {
    id: 'procurement',
    reportTab: 'financial',
    workspaceTab: 'procurement',
    nebCodes: ['NEB-14'], sapModules: ['MM'],
    dbViews: ['v_procurement_3way_match', 'v_procurement_performance'],
    apiEndpoints: ['GET /api/v2/procurement/rfqs', 'GET /api/v2/procurement/purchase-orders'],
    titleAr: 'المشتريات والعقود',
    titleEn: 'Procurement & Contracts',
    documentAr: 'تقرير دورة الشراء ومقارنة العروض',
    documentEn: 'Procure-to-Pay & Quote Comparison Report',
    standardAr: 'طلب وشراء واستلام وفاتورة',
    standardEn: 'Requisition, purchase, receipt and invoice'
  },
  {
    id: 'inventory',
    reportTab: 'financial',
    workspaceTab: 'inventory',
    nebCodes: ['NEB-05', 'NEB-09'], sapModules: ['EWM', 'MM'],
    dbViews: [],
    apiEndpoints: ['GET /api/v2/inventory/items', 'GET /api/v2/inventory/balances'],
    titleAr: 'المخزون والمستودعات',
    titleEn: 'Inventory & Warehouses',
    documentAr: 'سجل المخزون وحركة الصرف والاستلام',
    documentEn: 'Inventory Register & Movement Report',
    standardAr: 'الرصيد والتتبع والجرد',
    standardEn: 'Balances, traceability and stocktake'
  },
  {
    id: 'sales',
    reportTab: 'intelligence',
    workspaceTab: 'sales',
    nebCodes: ['NEB-15'], sapModules: ['SD'],
    dbViews: [],
    apiEndpoints: ['GET /api/v2/revenue/records', 'GET /api/v2/domains/donations', 'GET /api/v2/domains/campaigns'],
    titleAr: 'المبيعات والإيرادات',
    titleEn: 'Sales & Revenue',
    documentAr: 'تقرير الإيرادات والفواتير والتحصيل',
    documentEn: 'Revenue, Invoicing & Collections Report',
    standardAr: 'الفوترة والتحصيل والاعتراف بالإيراد',
    standardEn: 'Invoicing, collections and revenue recognition'
  },
  {
    id: 'admin',
    reportTab: 'executive_report',
    workspaceTab: 'users',
    nebCodes: ['NEB-12'], sapModules: ['GRC'],
    dbViews: [],
    apiEndpoints: ['GET /api/tables/audit_logs', 'GET /api/v2/system/health'],
    titleAr: 'الحوكمة والتدقيق',
    titleEn: 'Governance & Audit',
    documentAr: 'سجل التدقيق الأمني وحوكمة الصلاحيات',
    documentEn: 'Security Audit Log & Access Governance Report',
    standardAr: 'الصلاحيات والتدقيق والاستمرارية',
    standardEn: 'Access, audit and continuity'
  },
];

export function getReportWorkspace(id: string): ReportWorkspaceDefinition | undefined {
  return REPORT_WORKSPACE_REGISTRY.find((r) => r.id === id);
}

export function getReportsByWorkspaceTab(workspaceTab: string): ReportWorkspaceDefinition[] {
  return REPORT_WORKSPACE_REGISTRY.filter((r) => r.workspaceTab === workspaceTab);
}

export function getReportsByNeb(nebCode: string): ReportWorkspaceDefinition[] {
  const needle = nebCode.toUpperCase();
  return REPORT_WORKSPACE_REGISTRY.filter((r) =>
    r.nebCodes.some((c) => c.toUpperCase() === needle),
  );
}

export function getReportsByTab(reportTab: string): ReportWorkspaceDefinition[] {
  return REPORT_WORKSPACE_REGISTRY.filter((r) => r.reportTab === reportTab);
}
