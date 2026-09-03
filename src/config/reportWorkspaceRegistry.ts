export interface ReportWorkspaceDefinition {
  id: string;
  reportTab: string;
  workspaceTab: string;
  titleAr: string;
  titleEn: string;
  documentAr: string;
  documentEn: string;
  standardAr: string;
  standardEn: string;
}

export const REPORT_WORKSPACE_REGISTRY: ReportWorkspaceDefinition[] = [
  {
    id: 'strategy',
    reportTab: 'executive_report',
    workspaceTab: 'strategic_planning',
    titleAr: 'التخطيط الاستراتيجي',
    titleEn: 'Strategic Planning',
    documentAr: 'الخطة الاستراتيجية وبطاقة الأداء المتوازن',
    documentEn: 'Strategic Plan & Balanced Scorecard',
    standardAr: 'أهداف ومحاور ومؤشرات وقرارات',
    standardEn: 'Objectives, pillars, KPIs and decisions'
  },
  {
    id: 'projects',
    reportTab: 'programs_projects',
    workspaceTab: 'projects',
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
    titleAr: 'الأنشطة والعمليات',
    titleEn: 'Activities & Operations',
    documentAr: 'تقرير النشاط الميداني ومحضر الإنجاز',
    documentEn: 'Field Activity & Completion Report',
    standardAr: 'حزم العمل والمخرجات والتحقق',
    standardEn: 'Work packages, outputs and verification'
  },
  {
    id: 'finance',
    reportTab: 'financial',
    workspaceTab: 'finance',
    titleAr: 'المحاسبة والمالية',
    titleEn: 'Accounting & Finance',
    documentAr: 'القوائم المالية ودفتر الأستاذ',
    documentEn: 'Financial Statements & General Ledger',
    standardAr: 'القيد المزدوج وIPSAS',
    standardEn: 'Double-entry accounting and IPSAS'
  },
  {
    id: 'inventory',
    reportTab: 'financial',
    workspaceTab: 'inventory',
    titleAr: 'المخزون والأصول',
    titleEn: 'Inventory & Assets',
    documentAr: 'سجل المخزون وحركة الصرف والاستلام',
    documentEn: 'Inventory Register & Movement Report',
    standardAr: 'الرصيد والتتبع والجرد',
    standardEn: 'Balances, traceability and stocktake'
  },
  {
    id: 'sales',
    reportTab: 'intelligence',
    workspaceTab: 'sales',
    titleAr: 'المبيعات والإيرادات',
    titleEn: 'Sales & Revenue',
    documentAr: 'تقرير الإيرادات والفواتير والتحصيل',
    documentEn: 'Revenue, Invoicing & Collections Report',
    standardAr: 'الفوترة والتحصيل والاعتراف بالإيراد',
    standardEn: 'Invoicing, collections and revenue recognition'
  },
  {
    id: 'procurement',
    reportTab: 'financial',
    workspaceTab: 'procurement',
    titleAr: 'المشتريات والعقود',
    titleEn: 'Procurement & Contracts',
    documentAr: 'تقرير دورة الشراء ومقارنة العروض',
    documentEn: 'Procure-to-Pay & Quote Comparison Report',
    standardAr: 'طلب وشراء واستلام وفاتورة',
    standardEn: 'Requisition, purchase, receipt and invoice'
  },
  {
    id: 'beneficiaries',
    reportTab: 'beneficiaries_sponsorships',
    workspaceTab: 'beneficiaries',
    titleAr: 'المستفيدون والكفالات',
    titleEn: 'Beneficiaries & Sponsorships',
    documentAr: 'سجل المستفيدين وتقرير الأثر والخدمات',
    documentEn: 'Beneficiary Register & Impact Services Report',
    standardAr: 'الأهلية والخدمة والنتيجة',
    standardEn: 'Eligibility, service and outcome'
  }
];
