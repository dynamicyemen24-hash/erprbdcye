// ═══════════════════════════════════════════════════════════════════════════════
// NexoraOS™ Report Template System
// Pre-built enterprise report templates with IPSAS compliance,
// domain-specific column configurations, and formatting presets.
// ═══════════════════════════════════════════════════════════════════════════════

import type { PrintColumn, PrintConfig, PrintOrientation, PrintDensity } from './printEngine';

export type ReportTemplateId =
  | 'general'
  | 'finance_ledger'
  | 'finance_trial_balance'
  | 'projects'
  | 'programs'
  | 'beneficiaries'
  | 'procurement'
  | 'hr'
  | 'inventory'
  | 'audit_log'
  | 'approvals'
  | 'sponsorships'
  | 'sales'
  | 'strategy_kpi';

export interface ReportTemplate {
  id: ReportTemplateId;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: string;
  orientation: PrintOrientation;
  density: PrintDensity;
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
  complianceStandard: string;
  columns: PrintColumn[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// Template Definitions
// ═══════════════════════════════════════════════════════════════════════════════

export const REPORT_TEMPLATES: Record<ReportTemplateId, ReportTemplate> = {
  general: {
    id: 'general',
    nameAr: 'تقرير عام',
    nameEn: 'General Report',
    descriptionAr: 'تقرير عام لبيانات غير محددة',
    descriptionEn: 'Generic report for unspecified data',
    icon: 'FileText',
    orientation: 'landscape',
    density: 'normal',
    classification: 'internal',
    complianceStandard: 'IPSAS & Sphere CHS',
    columns: [],
  },

  finance_ledger: {
    id: 'finance_ledger',
    nameAr: 'دفتر الأستاذ المحاسبي',
    nameEn: 'Financial Ledger',
    descriptionAr: 'سجل المعاملات المالية المزدوجة وفق IPSAS',
    descriptionEn: 'Double-entry transaction ledger per IPSAS',
    icon: 'Coins',
    orientation: 'landscape',
    density: 'compact',
    classification: 'confidential',
    complianceStandard: 'IPSAS 1, 2, 9, 19',
    columns: [
      { key: 'date', label: 'Date', labelAr: 'التاريخ', format: 'date', width: 90 },
      { key: 'reference', label: 'Reference', labelAr: 'المرجع', format: 'text', width: 100 },
      { key: 'account_code', label: 'Account', labelAr: 'الحساب', format: 'text', width: 80 },
      { key: 'account_name', label: 'Account Name', labelAr: 'اسم الحساب', format: 'text', width: 150 },
      { key: 'description', label: 'Description', labelAr: 'الوصف', format: 'text', width: 200 },
      { key: 'debit', label: 'Debit', labelAr: 'مدين', format: 'currency', align: 'right', width: 100 },
      { key: 'credit', label: 'Credit', labelAr: 'دائن', format: 'currency', align: 'right', width: 100 },
      { key: 'balance', label: 'Balance', labelAr: 'الرصيد', format: 'currency', align: 'right', width: 100 },
      { key: 'currency', label: 'CCY', labelAr: 'العملة', format: 'text', width: 50 },
    ],
  },

  finance_trial_balance: {
    id: 'finance_trial_balance',
    nameAr: 'ميزان المراجعة',
    nameEn: 'Trial Balance',
    descriptionAr: 'ميزان المراجعة المحاسبي المُحكم',
    descriptionEn: 'Balanced trial balance report',
    icon: 'Calculator',
    orientation: 'landscape',
    density: 'normal',
    classification: 'confidential',
    complianceStandard: 'IPSAS 1, 2',
    columns: [
      { key: 'account_code', label: 'Code', labelAr: 'الكود', format: 'text', width: 80 },
      { key: 'account_name', label: 'Account Name', labelAr: 'اسم الحساب', format: 'text', width: 200 },
      { key: 'account_type', label: 'Type', labelAr: 'النوع', format: 'text', width: 100 },
      { key: 'debit', label: 'Debit', labelAr: 'مدين', format: 'currency', align: 'right', width: 120 },
      { key: 'credit', label: 'Credit', labelAr: 'دائن', format: 'currency', align: 'right', width: 120 },
      { key: 'net_balance', label: 'Net Balance', labelAr: 'صافي الرصيد', format: 'currency', align: 'right', width: 120 },
    ],
  },

  projects: {
    id: 'projects',
    nameAr: 'تقرير المشاريع الميدانية',
    nameEn: 'Field Projects Report',
    descriptionAr: 'حالة المشاريع وميزانياتها ونسبة الإنجاز',
    descriptionEn: 'Project status, budgets, and completion rates',
    icon: 'Layers',
    orientation: 'landscape',
    density: 'normal',
    classification: 'internal',
    complianceStandard: 'Sphere CHS, EVM',
    columns: [
      { key: 'name', label: 'Project Name', labelAr: 'اسم المشروع', format: 'text', width: 180 },
      { key: 'status', label: 'Status', labelAr: 'الحالة', format: 'status', width: 90 },
      { key: 'budget', label: 'Budget', labelAr: 'الميزانية', format: 'currency', align: 'right', width: 110 },
      { key: 'spent', label: 'Spent', labelAr: 'المصروف', format: 'currency', align: 'right', width: 110 },
      { key: 'progress', label: 'Progress %', labelAr: 'نسبة الإنجاز', format: 'percent', align: 'center', width: 80 },
      { key: 'start_date', label: 'Start', labelAr: 'البداية', format: 'date', width: 90 },
      { key: 'end_date', label: 'End', labelAr: 'النهاية', format: 'date', width: 90 },
      { key: 'beneficiaries', label: 'Beneficiaries', labelAr: 'المستفيدون', format: 'number', align: 'center', width: 80 },
      { key: 'governorate', label: 'Location', labelAr: 'الموقع', format: 'text', width: 100 },
    ],
  },

  programs: {
    id: 'programs',
    nameAr: 'تقرير البرامج التنموية',
    nameEn: 'Development Programs Report',
    descriptionAr: 'البرامج والميزانيات والمستفيدون',
    descriptionEn: 'Programs, budgets, and beneficiaries',
    icon: 'Briefcase',
    orientation: 'landscape',
    density: 'normal',
    classification: 'internal',
    complianceStandard: 'Sphere CHS',
    columns: [
      { key: 'name', label: 'Program', labelAr: 'البرنامج', format: 'text', width: 180 },
      { key: 'status', label: 'Status', labelAr: 'الحالة', format: 'status', width: 90 },
      { key: 'budget', label: 'Budget', labelAr: 'الميزانية', format: 'currency', align: 'right', width: 110 },
      { key: 'actual_beneficiaries', label: 'Beneficiaries', labelAr: 'المستفيدون', format: 'number', align: 'center', width: 90 },
      { key: 'target_beneficiaries', label: 'Target', labelAr: 'الهدف', format: 'number', align: 'center', width: 80 },
      { key: 'sector', label: 'Sector', labelAr: 'القطاع', format: 'text', width: 100 },
      { key: 'governorate', label: 'Location', labelAr: 'الموقع', format: 'text', width: 100 },
    ],
  },

  beneficiaries: {
    id: 'beneficiaries',
    nameAr: 'سجل المستفيدين',
    nameEn: 'Beneficiaries Registry',
    descriptionAr: 'بيانات المستفيدين والخدمات المقدمة',
    descriptionEn: 'Beneficiary data and services delivered',
    icon: 'Users',
    orientation: 'landscape',
    density: 'compact',
    classification: 'confidential',
    complianceStandard: 'Sphere CHS, GDPR',
    columns: [
      { key: 'name', label: 'Name', labelAr: 'الاسم', format: 'text', width: 160 },
      { key: 'category', label: 'Category', labelAr: 'الفئة', format: 'text', width: 100 },
      { key: 'gender', label: 'Gender', labelAr: 'الجنس', format: 'text', width: 60 },
      { key: 'age', label: 'Age', labelAr: 'العمر', format: 'number', align: 'center', width: 50 },
      { key: 'village', label: 'Village', labelAr: 'القرية', format: 'text', width: 100 },
      { key: 'governorate', label: 'Governorate', labelAr: 'المحافظة', format: 'text', width: 100 },
      { key: 'services_received', label: 'Services', labelAr: 'الخدمات', format: 'text', width: 150 },
      { key: 'registration_date', label: 'Registered', labelAr: 'تاريخ التسجيل', format: 'date', width: 90 },
    ],
  },

  procurement: {
    id: 'procurement',
    nameAr: 'تقرير المشتريات والعقود',
    nameEn: 'Procurement & Contracts Report',
    descriptionAr: 'طلبات الشراء ومزايدي الموردين',
    descriptionEn: 'Purchase orders and vendor bids',
    icon: 'FileCheck',
    orientation: 'landscape',
    density: 'normal',
    classification: 'confidential',
    complianceStandard: 'IPSAS 12, Procurement Policy',
    columns: [
      { key: 'po_number', label: 'PO #', labelAr: 'رقم الأمر', format: 'text', width: 100 },
      { key: 'vendor', label: 'Vendor', labelAr: 'المورد', format: 'text', width: 150 },
      { key: 'item', label: 'Item', labelAr: 'البند', format: 'text', width: 180 },
      { key: 'quantity', label: 'Qty', labelAr: 'الكمية', format: 'number', align: 'center', width: 60 },
      { key: 'unit_price', label: 'Unit Price', labelAr: 'سعر الوحدة', format: 'currency', align: 'right', width: 100 },
      { key: 'total', label: 'Total', labelAr: 'الإجمالي', format: 'currency', align: 'right', width: 100 },
      { key: 'status', label: 'Status', labelAr: 'الحالة', format: 'status', width: 90 },
      { key: 'order_date', label: 'Date', labelAr: 'التاريخ', format: 'date', width: 90 },
    ],
  },

  hr: {
    id: 'hr',
    nameAr: 'تقرير الموارد البشرية',
    nameEn: 'Human Resources Report',
    descriptionAr: 'بيانات الموظفين والأدوار والرواتب',
    descriptionEn: 'Employee data, roles, and salaries',
    icon: 'Users',
    orientation: 'landscape',
    density: 'normal',
    classification: 'confidential',
    complianceStandard: 'Labor Law',
    columns: [
      { key: 'name', label: 'Employee', labelAr: 'اسم الموظف', format: 'text', width: 160 },
      { key: 'role', label: 'Role', labelAr: 'الدور', format: 'text', width: 130 },
      { key: 'department', label: 'Department', labelAr: 'القسم', format: 'text', width: 120 },
      { key: 'status', label: 'Status', labelAr: 'الحالة', format: 'status', width: 80 },
      { key: 'salary', label: 'Salary', labelAr: 'الراتب', format: 'currency', align: 'right', width: 100 },
      { key: 'join_date', label: 'Join Date', labelAr: 'تاريخ التعيين', format: 'date', width: 90 },
      { key: 'location', label: 'Location', labelAr: 'الموقع', format: 'text', width: 100 },
    ],
  },

  inventory: {
    id: 'inventory',
    nameAr: 'تقرير المخزون الإغاثي',
    nameEn: 'Relief Inventory Report',
    descriptionAr: ' Movements and balances of relief items',
    descriptionEn: 'Movements and balances of relief items',
    icon: 'Box',
    orientation: 'landscape',
    density: 'compact',
    classification: 'internal',
    complianceStandard: 'Sphere Logistics',
    columns: [
      { key: 'item_name', label: 'Item', labelAr: 'البند', format: 'text', width: 180 },
      { key: 'sku', label: 'SKU', labelAr: 'الرمز', format: 'text', width: 80 },
      { key: 'category', label: 'Category', labelAr: 'الفئة', format: 'text', width: 100 },
      { key: 'quantity', label: 'Qty', labelAr: 'الكمية', format: 'number', align: 'center', width: 60 },
      { key: 'unit', label: 'Unit', labelAr: 'الوحدة', format: 'text', width: 60 },
      { key: 'warehouse', label: 'Warehouse', labelAr: 'المستودع', format: 'text', width: 120 },
      { key: 'expiry_date', label: 'Expiry', labelAr: 'الانتهاء', format: 'date', width: 90 },
      { key: 'status', label: 'Status', labelAr: 'الحالة', format: 'status', width: 80 },
    ],
  },

  audit_log: {
    id: 'audit_log',
    nameAr: 'سجل التدقيق والمراجعة',
    nameEn: 'Audit Log Report',
    descriptionAr: 'سجل الأحداث والأمن وال Truman',
    descriptionEn: 'Event log, security, and compliance trail',
    icon: 'Database',
    orientation: 'landscape',
    density: 'compact',
    classification: 'restricted',
    complianceStandard: 'IPSAS 1, Internal Audit',
    columns: [
      { key: 'timestamp', label: 'Timestamp', labelAr: 'الوقت', format: 'date', width: 140 },
      { key: 'user', label: 'User', labelAr: 'المستخدم', format: 'text', width: 120 },
      { key: 'action', label: 'Action', labelAr: 'الإجراء', format: 'text', width: 120 },
      { key: 'module', label: 'Module', labelAr: 'الوحدة', format: 'text', width: 100 },
      { key: 'details', label: 'Details', labelAr: 'التفاصيل', format: 'text', width: 200 },
      { key: 'ip_address', label: 'IP', labelAr: 'عنوان IP', format: 'text', width: 100 },
      { key: 'status', label: 'Result', labelAr: 'النتيجة', format: 'status', width: 80 },
    ],
  },

  approvals: {
    id: 'approvals',
    nameAr: 'تقرير الموافقات',
    nameEn: 'Approvals Report',
    descriptionAr: 'طلبات الموافقات والاعتمادات',
    descriptionEn: 'Approval requests and authorizations',
    icon: 'ShieldCheck',
    orientation: 'landscape',
    density: 'normal',
    classification: 'internal',
    complianceStandard: 'Internal Policy',
    columns: [
      { key: 'title', label: 'Request', labelAr: 'الطلب', format: 'text', width: 200 },
      { key: 'requester', label: 'Requester', labelAr: 'المتقدم', format: 'text', width: 130 },
      { key: 'type', label: 'Type', labelAr: 'النوع', format: 'text', width: 100 },
      { key: 'amount', label: 'Amount', labelAr: 'المبلغ', format: 'currency', align: 'right', width: 110 },
      { key: 'status', label: 'Status', labelAr: 'الحالة', format: 'status', width: 90 },
      { key: 'submitted_date', label: 'Submitted', labelAr: 'التقديم', format: 'date', width: 90 },
      { key: 'approver', label: 'Approver', labelAr: 'الموافق', format: 'text', width: 130 },
    ],
  },

  sponsorships: {
    id: 'sponsorships',
    nameAr: 'تقرير الكفالات',
    nameEn: 'Sponsorships Report',
    descriptionAr: 'كفالات الأيتام والرعاية الاجتماعية',
    descriptionEn: 'Orphan sponsorships and welfare',
    icon: 'Heart',
    orientation: 'portrait',
    density: 'normal',
    classification: 'confidential',
    complianceStandard: 'Sphere CHS',
    columns: [
      { key: 'orphan_name', label: 'Child Name', labelAr: 'اسم الطفل', format: 'text', width: 150 },
      { key: 'sponsor_name', label: 'Sponsor', labelAr: 'الكفيل', format: 'text', width: 150 },
      { key: 'amount', label: 'Amount', labelAr: 'المبلغ', format: 'currency', align: 'right', width: 100 },
      { key: 'frequency', label: 'Frequency', labelAr: 'التكرار', format: 'text', width: 80 },
      { key: 'status', label: 'Status', labelAr: 'الحالة', format: 'status', width: 80 },
      { key: 'start_date', label: 'Start', labelAr: 'البداية', format: 'date', width: 90 },
    ],
  },

  sales: {
    id: 'sales',
    nameAr: 'تقرير المبيعات والإيرادات',
    nameEn: 'Sales & Revenue Report',
    descriptionAr: 'المبيعات وال الإيرادات وتنمية الموارد',
    descriptionEn: 'Sales, revenue, and fundraising',
    icon: 'TrendingUp',
    orientation: 'landscape',
    density: 'normal',
    classification: 'internal',
    complianceStandard: 'IPSAS 9, 11',
    columns: [
      { key: 'invoice_number', label: 'Invoice #', labelAr: 'رقم الفاتورة', format: 'text', width: 100 },
      { key: 'customer', label: 'Customer', labelAr: 'العميل', format: 'text', width: 150 },
      { key: 'item', label: 'Item', labelAr: 'البند', format: 'text', width: 180 },
      { key: 'quantity', label: 'Qty', labelAr: 'الكمية', format: 'number', align: 'center', width: 60 },
      { key: 'amount', label: 'Amount', labelAr: 'المبلغ', format: 'currency', align: 'right', width: 110 },
      { key: 'status', label: 'Status', labelAr: 'الحالة', format: 'status', width: 80 },
      { key: 'date', label: 'Date', labelAr: 'التاريخ', format: 'date', width: 90 },
    ],
  },

  strategy_kpi: {
    id: 'strategy_kpi',
    nameAr: 'مؤشرات الأداء الاستراتيجي',
    nameEn: 'Strategic KPI Dashboard',
    descriptionAr: 'مؤشرات الأداء والTargets الاستراتيجية',
    descriptionEn: 'Performance indicators and strategic targets',
    icon: 'Target',
    orientation: 'landscape',
    density: 'normal',
    classification: 'internal',
    complianceStandard: 'Balanced Scorecard',
    columns: [
      { key: 'kpi_name', label: 'KPI', labelAr: 'المؤشر', format: 'text', width: 200 },
      { key: 'category', label: 'Category', labelAr: 'الفئة', format: 'text', width: 120 },
      { key: 'target', label: 'Target', labelAr: 'الهدف', format: 'number', align: 'center', width: 80 },
      { key: 'actual', label: 'Actual', labelAr: 'الفعلي', format: 'number', align: 'center', width: 80 },
      { key: 'achievement', label: 'Achievement %', labelAr: 'نسبة الإنجاز', format: 'percent', align: 'center', width: 90 },
      { key: 'status', label: 'Status', labelAr: 'الحالة', format: 'status', width: 80 },
      { key: 'responsible', label: 'Owner', labelAr: 'المسؤول', format: 'text', width: 130 },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Template Helpers
// ═══════════════════════════════════════════════════════════════════════════════

export function getTemplate(id: ReportTemplateId): ReportTemplate {
  return REPORT_TEMPLATES[id] || REPORT_TEMPLATES.general;
}

export function getAllTemplates(): ReportTemplate[] {
  return Object.values(REPORT_TEMPLATES);
}

export function templateToPrintConfig(template: ReportTemplate, lang: 'ar' | 'en', titleAr?: string, titleEn?: string): PrintConfig {
  return {
    header: {
      title: lang === 'ar' ? (titleAr || template.nameAr) : (titleEn || template.nameEn),
      organization: lang === 'ar' ? 'جمعية رُحماء بينهم للعمل الإنساني والتنمية' : 'Rohamā\'a Baynahum Charity Foundation',
      classification: template.classification,
    },
    footer: {
      showPageNumbers: true,
      showTimestamp: true,
      showComplianceBadge: true,
      complianceStandard: template.complianceStandard,
    },
    page: {
      orientation: template.orientation,
      paperSize: 'a4',
      density: template.density,
      margins: { top: 15, right: 15, bottom: 15, left: 15 },
      showGridLines: true,
      alternateRowColors: true,
      frozenHeader: true,
    },
    columns: template.columns,
    lang,
  };
}

// Auto-detect template from tab name or data keys
export function detectTemplate(tabName: string, data?: any[]): ReportTemplateId {
  const tab = tabName.toLowerCase();
  if (tab.includes('finance') || tab.includes('account') || tab.includes('ledger')) return 'finance_ledger';
  if (tab.includes('trial') || tab.includes('balance')) return 'finance_trial_balance';
  if (tab.includes('project')) return 'projects';
  if (tab.includes('program')) return 'programs';
  if (tab.includes('beneficiar')) return 'beneficiaries';
  if (tab.includes('procurement') || tab.includes('contract')) return 'procurement';
  if (tab.includes('hr') || tab.includes('human') || tab.includes('staff') || tab.includes('user')) return 'hr';
  if (tab.includes('inventory') || tab.includes('warehouse')) return 'inventory';
  if (tab.includes('audit') || tab.includes('log')) return 'audit_log';
  if (tab.includes('approval')) return 'approvals';
  if (tab.includes('sponsor') || tab.includes('orphan')) return 'sponsorships';
  if (tab.includes('sale') || tab.includes('revenue') || tab.includes('fund')) return 'sales';
  if (tab.includes('strategy') || tab.includes('kpi')) return 'strategy_kpi';
  return 'general';
}
