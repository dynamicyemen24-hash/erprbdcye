import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingCart,
  ShieldCheck,
  Briefcase,
  Coins,
  Layers,
  Compass,
  Users,
  Box,
  TrendingUp,
  Activity,
  Heart,
  Calendar,
  Globe,
  Settings,
  Database,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Search,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Zap,
  Sliders,
  FileCheck,
  Download,
  Printer,
  QrCode,
  Eye,
  Copy,
  X,
  AlertCircle,
  Check,
  FileSpreadsheet,
  Brain,
  Lock,
  Unlock,
  KeyRound,
  FilePlus,
  Send,
  UserCheck,
  CheckSquare,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { REAL_ENTERPRISE_DATA } from '../../core/data/realEnterpriseData';
import { ActiveTab } from '../../types';
import { enterpriseBus } from '../../lib/enterpriseNotificationBus';
import { triggerHaptic } from '../../helpers/hapticSwipe';

export type WorkspaceRoleKey = 
  | 'leadership' 
  | 'finance' 
  | 'programs' 
  | 'operations' 
  | 'beneficiaries' 
  | 'procurement' 
  | 'meal' 
  | 'admin';

export type SecurityClearanceLevel = 1 | 2 | 3 | 4;

interface UnitGovernanceConfig {
  unitCode: string;
  unitHeadAr: string;
  unitHeadEn: string;
  spendingLimitYer: number;
  spendingLimitDisplayAr: string;
  spendingLimitDisplayEn: string;
  delegationScopeAr: string;
  delegationScopeEn: string;
  activeStaffCount: number;
}

interface WorkspaceDefinition {
  id: WorkspaceRoleKey;
  code: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  departmentAr: string;
  departmentEn: string;
  governance: UnitGovernanceConfig;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  accentBg: string;
  borderClass: string;
  badgeAr: string;
  badgeEn: string;
  primaryTabs: ActiveTab[];
  quickActions: {
    id: string;
    titleAr: string;
    titleEn: string;
    targetTab: ActiveTab;
    icon: React.ComponentType<{ className?: string }>;
    descriptionAr: string;
    descriptionEn: string;
    requiredLevel: SecurityClearanceLevel;
  }[];
  kpiStats: {
    labelAr: string;
    labelEn: string;
    value: string | number;
    sublabelAr: string;
    sublabelEn: string;
    trend?: string;
  }[];
  autonomousDecisionTypes: {
    id: string;
    titleAr: string;
    titleEn: string;
    requiresClearance: SecurityClearanceLevel;
  }[];
}

const FIELD_LABELS_AR: Record<string, string> = {
  code: 'رمز السجل',
  beneficiary_code: 'رقم ملف المستفيد',
  sponsorship_code: 'رقم ملف الكفالة',
  activity_code: 'رمز النشاط الميداني',
  account_code: 'رقم الحساب المالي',
  item_code: 'رمز الصنف المخزني',
  name_ar: 'الاسم بالعربية',
  name_en: 'الاسم بالإنجليزية',
  full_name_ar: 'الاسم الكامل',
  title: 'عنوان النشاط',
  description: 'الوصف المؤسسي',
  category_code: 'الفئة المستفيدة',
  category: 'التصنيف',
  status_code: 'الحالة الإدارية',
  status: 'الحالة التشغيلية',
  budget: 'الموازنة المعتمدة (ريال يمني)',
  progress_percent: 'نسبة الإنجاز',
  target_beneficiaries: 'المستهدفون',
  actual_beneficiaries: 'المنجز الفعلي',
  governorate: 'المحافظة',
  district: 'المديرية',
  location_name: 'موقع النشاط الميداني',
  location: 'الموقع الميداني',
  phone_primary: 'رقم الهاتف',
  sponsor_name: 'اسم الكافل الكريم',
  monthly_stipend: 'مبلغ الكفالة الشهري',
  amount: 'المبلغ المعتمد',
  account_type: 'نوع الحساب في الدليل',
  opening_balance: 'الرصيد الافتتاحي',
  currency_code: 'العملة',
  currency: 'العملة',
  unit: 'وحدة القياس',
  capacity: 'الطاقة الاستيعابية',
  email: 'البريد الإلكتروني',
  role_code: 'المسمى والصلاحية',
  security_level: 'مستوى الصلاحية',
  start_date: 'تاريخ البدء',
  end_date: 'تاريخ الانتهاء',
  created_at: 'تاريخ التسجيل',
  target_value: 'القيمة المستهدفة',
  actual_value: 'القيمة المحققة'
};

const VALUE_TRANSLATIONS_AR: Record<string, string> = {
  active: 'نشط ومعتمد',
  ACTIVE: 'كفالة جارية ومستمرة',
  completed: 'مكتمل وموثق',
  pending: 'قيد المراجعة',
  cancelled: 'ملغي',
  draft: 'مسودة',
  YER: 'ريال يمني',
  USD: 'دولار أمريكي',
  SAR: 'ريال سعودي',
  ORPHAN: 'رعاية الأيتام',
  POOR_FAMILY: 'أسر متعففة',
  PATIENT: 'رعاية صحية ومرضى',
  WIDOW: 'رعاية الأرامل',
  DISABILITY: 'ذوو الاحتياجات الخاصة',
  Asset: 'أصول',
  Liability: 'التزامات',
  Equity: 'صافي الأصول',
  Revenue: 'إيرادات',
  Expense: 'مصروفات',
  ADMIN: 'مدير النظام',
  DIRECTOR: 'إدارة عليا وتنفيذية',
  FINANCE: 'مسئول مالي ومحاسب',
  PROGRAMS: 'إدارة البرامج والمشاريع',
  OPERATIONS: 'تنفيذ ميداني',
  WELFARE: 'رعاية اجتماعية',
  LOGISTICS: 'مشتريات ومخازن',
  MEAL: 'رقابة وتقييم الجودة'
};

export const WORKSPACE_DEFINITIONS: Record<WorkspaceRoleKey, WorkspaceDefinition> = {
  leadership: {
    id: 'leadership',
    code: 'إدارة عليا',
    titleAr: 'مساحة عمل القيادة التنفيذية والحوكمة',
    titleEn: 'Executive Leadership & Governance Workspace',
    subtitleAr: 'الرؤية الاستراتيجية الشاملة، متابعة الأداء المؤسسي، واعتماد القرارات الكبرى',
    subtitleEn: 'Strategic oversight, institutional KPIs, and executive decisions',
    departmentAr: 'مكتب الإدارة التنفيذية العامة',
    departmentEn: 'Executive Management Office',
    governance: {
      unitCode: 'UNIT-EXE-01',
      unitHeadAr: 'د. رئيس مجلس الإدارة / المدير التنفيذي',
      unitHeadEn: 'Board Chairman / Executive Director',
      spendingLimitYer: 0,
      spendingLimitDisplayAr: 'صلاحية كاملة غير مقيدة بموجب اللائحة العليا',
      spendingLimitDisplayEn: 'Full Authority per Institutional Bylaws',
      delegationScopeAr: 'الاعتماد النهائي لكافة البرامج، الموازنات، وتفويض الصلاحيات',
      delegationScopeEn: 'Final approval of programs, budgets, and delegation of authorities',
      activeStaffCount: 4
    },
    icon: Briefcase,
    color: 'amber',
    accentBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-500/30',
    badgeAr: 'إدارة عليا وحوكمة',
    badgeEn: 'Executive Lead',
    primaryTabs: ['dashboard', 'control_panel', 'strategic_planning', 'approvals', 'reports', 'audit'],
    quickActions: [
      { id: 'act-kpis', titleAr: 'لوحة القيادة الاستراتيجية', titleEn: 'Strategy Dashboard', targetTab: 'dashboard', icon: TrendingUp, descriptionAr: 'متابعة مؤشرات أداء البرامج والمشاريع والمستفيدين', descriptionEn: 'Consolidated performance overview', requiredLevel: 1 },
      { id: 'act-approvals', titleAr: 'طابور الاعتمادات الكبرى', titleEn: 'Executive Approvals', targetTab: 'approvals', icon: ShieldCheck, descriptionAr: 'اعتماد الموازنات والدفعات والعقود الاستراتيجية', descriptionEn: 'Sign off high-level financial & contract requests', requiredLevel: 3 },
      { id: 'act-strategy', titleAr: 'التخطيط الاستراتيجي', titleEn: 'Strategic Planning', targetTab: 'strategic_planning', icon: Compass, descriptionAr: 'مواءمة الأهداف السنوية مع معايير العمل المؤسسي', descriptionEn: 'Annual strategic initiatives and impact goals', requiredLevel: 2 },
      { id: 'act-audit', titleAr: 'سجل الرقابة والتدقيق', titleEn: 'Audit Trail', targetTab: 'audit', icon: Database, descriptionAr: 'مراجعة حركة الأمان الإداري وسجلات النظام', descriptionEn: 'Review security logs and administrative changes', requiredLevel: 3 }
    ],
    kpiStats: [
      { labelAr: 'إجمالي البرامج المؤسسية', labelEn: 'Total Programs', value: (REAL_ENTERPRISE_DATA.programs || []).length || 10, sublabelAr: 'برامج تعليمية وإغاثية وصحية', sublabelEn: 'Active institutional programs' },
      { labelAr: 'المشاريع الميدانية النشطة', labelEn: 'Active Projects', value: (REAL_ENTERPRISE_DATA.projects || []).length || 19, sublabelAr: 'موزعة على المحافظات', sublabelEn: 'Field projects across regions' },
      { labelAr: 'إجمالي المستفيدين المسجلين', labelEn: 'Total Beneficiaries', value: '418+', sublabelAr: 'بيانات ميدانية موثقة', sublabelEn: 'Verified database beneficiaries' },
      { labelAr: 'كفالات الأيتام المكفولين', labelEn: 'Orphan Sponsorships', value: '595', sublabelAr: 'رعاية شاملة شهرية', sublabelEn: 'Active sponsorship records' }
    ],
    autonomousDecisionTypes: [
      { id: 'dec-strategic-directive', titleAr: 'إصدار توجيه استراتيجي ملزم للوحدات', titleEn: 'Issue Binding Strategic Directive', requiresClearance: 3 },
      { id: 'dec-emergency-budget', titleAr: 'اعتماد موازنة طارئة للاستجابة السريعة', titleEn: 'Approve Rapid Response Emergency Budget', requiresClearance: 4 },
      { id: 'dec-delegate-power', titleAr: 'تفويض صلاحيات مالية مؤقتة لمدير وحدة', titleEn: 'Delegate Temporary Authority to Unit Head', requiresClearance: 4 },
      { id: 'dec-endorse-report', titleAr: 'تعميد التقرير السنوي الختامي للمؤسسة', titleEn: 'Endorse Annual Institutional Report', requiresClearance: 3 }
    ]
  },
  finance: {
    id: 'finance',
    code: 'شؤون مالية',
    titleAr: 'مساحة عمل الإدارة المالية والمحاسبة',
    titleEn: 'Financial Management & Accounting Workspace',
    subtitleAr: 'دليل الحسابات، قيود اليومية، سندات الصرف والقبض، ومطابقة الصناديق والبنوك',
    subtitleEn: 'Chart of accounts, vouchers, bank reconciliation, and multi-currency ledger',
    departmentAr: 'الإدارة المالية والمحاسبة القانونية',
    departmentEn: 'Finance & Accounts Directorate',
    governance: {
      unitCode: 'UNIT-FIN-02',
      unitHeadAr: 'المدير المالي والمحاسب القانوني',
      unitHeadEn: 'Chief Financial Officer & Senior Auditor',
      spendingLimitYer: 50000000,
      spendingLimitDisplayAr: '50,000,000 ريال يمني (سقف الاعتماد الذاتي للوحدة)',
      spendingLimitDisplayEn: '50,000,000 YER (Unit Self-Authorization Cap)',
      delegationScopeAr: 'إدارة القيود المحاسبية، إصدار الشيكات، والتحقق المزدوج',
      delegationScopeEn: 'Ledger management, payment checks, and double-entry auditing',
      activeStaffCount: 6
    },
    icon: Coins,
    color: 'emerald',
    accentBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    borderClass: 'border-emerald-500/30',
    badgeAr: 'القطاع المالي والمحاسبي',
    badgeEn: 'Finance & Compliance',
    primaryTabs: ['finance', 'currencies', 'approvals', 'contracts', 'reports'],
    quickActions: [
      { id: 'act-coa', titleAr: 'دليل الحسابات وشجرة المحاسبة', titleEn: 'Chart of Accounts', targetTab: 'finance', icon: Coins, descriptionAr: 'استعراض وإدارة 246 حساباً رئيسياً وفرعياً', descriptionEn: 'Review 246 ledger accounts and balances', requiredLevel: 1 },
      { id: 'act-currencies', titleAr: 'إدارة العملات وأسعار الصرف', titleEn: 'Currency Exchange', targetTab: 'currencies', icon: Coins, descriptionAr: 'أسعار الصرف اليومية (ريال يمني، دولار، ريال سعودي)', descriptionEn: 'Daily multi-currency exchange rates', requiredLevel: 2 },
      { id: 'act-vouchers', titleAr: 'سندات الصرف والاعتمادات', titleEn: 'Disbursement Vouchers', targetTab: 'approvals', icon: FileCheck, descriptionAr: 'مراجعة وتدقيق سندات الصرف قبل الصرف البنكي', descriptionEn: 'Financial vouchers and payment authorizations', requiredLevel: 2 },
      { id: 'act-reports', titleAr: 'القوائم والتقارير المالية', titleEn: 'Financial Statements', targetTab: 'reports', icon: TrendingUp, descriptionAr: 'الميزانية العمومية وقائمة الإيرادات والمصروفات', descriptionEn: 'Balance sheet and revenue-expense statements', requiredLevel: 1 }
    ],
    kpiStats: [
      { labelAr: 'حسابات الدليل المحاسبي', labelEn: 'Chart Accounts', value: (REAL_ENTERPRISE_DATA.chart_of_accounts || []).length || 246, sublabelAr: 'حسابات معتمدة وفق المعايير المالية الرسمية', sublabelEn: 'Certified accounts' },
      { labelAr: 'العملات المعتمدة', labelEn: 'Currencies', value: 3, sublabelAr: 'ريال يمني، دولار، ريال سعودي', sublabelEn: 'Active ledger currencies' },
      { labelAr: 'الموازنة التقديرية المعتمدة', labelEn: 'Approved Budget', value: '28,450,000', sublabelAr: 'ريال يمني مخصص للبرامج', sublabelEn: 'YER allocated to programs' },
      { labelAr: 'بنود الموازنة التشغيلية', labelEn: 'Budget Lines', value: 45, sublabelAr: 'موزعة على كافة المشاريع', sublabelEn: 'Active project budget lines' }
    ],
    autonomousDecisionTypes: [
      { id: 'dec-journal-post', titleAr: 'اعتماد وترحيل قيد تسوية محاسبي', titleEn: 'Approve & Post Settlement Journal Entry', requiresClearance: 3 },
      { id: 'dec-disburse-batch', titleAr: 'إصدار دفعة صرف بنكية للبرامج الميدانية', titleEn: 'Issue Bank Disbursement Batch for Field', requiresClearance: 3 },
      { id: 'dec-open-period', titleAr: 'إقفال/فتح دورة محاسبية ربع سنوية', titleEn: 'Close/Open Quarterly Fiscal Period', requiresClearance: 4 },
      { id: 'dec-reconcile-bank', titleAr: 'اعتماد محضر المطابقة البنكية الشهرية', titleEn: 'Sign Monthly Bank Reconciliation Minutes', requiresClearance: 2 }
    ]
  },
  programs: {
    id: 'programs',
    code: 'برامج ومشاريع',
    titleAr: 'مساحة عمل إدارة البرامج والمشاريع',
    titleEn: 'Programs & Project Portfolio Workspace',
    subtitleAr: 'تخطيط المحافظ الإنسانية، متابعة المشاريع، معالم الإنجاز، وتقارير المانحين',
    subtitleEn: 'Humanitarian program design, project milestones, and donor deliverables',
    departmentAr: 'إدارة البرامج والمشاريع الإنسانية',
    departmentEn: 'Programs & Projects Directorate',
    governance: {
      unitCode: 'UNIT-PRG-03',
      unitHeadAr: 'مدير قطاع البرامج والمشاريع',
      unitHeadEn: 'Director of Programs & Projects',
      spendingLimitYer: 25000000,
      spendingLimitDisplayAr: '25,000,000 ريال يمني (سقف الصرف لكل مشروع)',
      spendingLimitDisplayEn: '25,000,000 YER (Per-Project Spending Cap)',
      delegationScopeAr: 'اعتماد خطط الأنشطة، الجداول الزمنية، ومخصصات المانحين',
      delegationScopeEn: 'Approval of activity plans, timelines, and donor commitments',
      activeStaffCount: 8
    },
    icon: Layers,
    color: 'blue',
    accentBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    borderClass: 'border-blue-500/30',
    badgeAr: 'البرامج والمشاريع الإنسانية',
    badgeEn: 'Programs Lead',
    primaryTabs: ['programs', 'projects', 'activities', 'allocations', 'geospatial'],
    quickActions: [
      { id: 'act-prog', titleAr: 'سجل البرامج المؤسسية', titleEn: 'Programs Registry', targetTab: 'programs', icon: Briefcase, descriptionAr: 'إدارة وتتبع البرامج الاستراتيجية العشرة', descriptionEn: 'Track 10 core institutional programs', requiredLevel: 1 },
      { id: 'act-proj', titleAr: 'المشاريع التنفيذية (19 مشروعاً)', titleEn: 'Projects Workspace', targetTab: 'projects', icon: Layers, descriptionAr: 'مراحل العمل التنفيذية وجداول الإنجاز الزمني', descriptionEn: 'Project breakdown and milestone progress', requiredLevel: 2 },
      { id: 'act-alloc', titleAr: 'تخصيص الموارد والميزانيات', titleEn: 'Resource Allocations', targetTab: 'allocations', icon: Calendar, descriptionAr: 'توزيع المنح والموارد على الأنشطة الميدانية', descriptionEn: 'Grant commitments and field resource mapping', requiredLevel: 3 },
      { id: 'act-geo', titleAr: 'الخريطة المكانية للمشاريع', titleEn: 'Geospatial Projects', targetTab: 'geospatial', icon: Globe, descriptionAr: 'التوزيع الجغرافي للمشاريع في المحافظات', descriptionEn: 'Interactive geographical distribution', requiredLevel: 1 }
    ],
    kpiStats: [
      { labelAr: 'البرامج التنموية والإغاثية', labelEn: 'Programs', value: (REAL_ENTERPRISE_DATA.programs || []).length || 10, sublabelAr: 'تعليمية، صحية، إغاثية، ورعاية', sublabelEn: 'Core operational sectors' },
      { labelAr: 'المشاريع التنفيذية', labelEn: 'Projects', value: (REAL_ENTERPRISE_DATA.projects || []).length || 19, sublabelAr: 'مشاريع جارية قيد التنفيذ', sublabelEn: 'Under active execution' },
      { labelAr: 'مراحل الإنجاز الميداني', labelEn: 'Milestones', value: 45, sublabelAr: 'محطات تسليم وتقييم ميداني', sublabelEn: 'Key project delivery milestones' },
      { labelAr: 'مناطق التغطية الميدانية', labelEn: 'Geographic Areas', value: 40, sublabelAr: 'مديريات ومراكز تنفيذية', sublabelEn: 'Districts and field nodes' }
    ],
    autonomousDecisionTypes: [
      { id: 'dec-launch-phase', titleAr: 'إطلاق مرحلة تنفيذية جديدة في مشروع معتمد', titleEn: 'Launch New Project Implementation Phase', requiresClearance: 3 },
      { id: 'dec-reallocate-budget', titleAr: 'إعادة تدوير موازنة بين بنود نشاطين', titleEn: 'Reallocate Budget Between Activity Lines', requiresClearance: 3 },
      { id: 'dec-donor-report-sign', titleAr: 'اعتماد تقرير الإنجاز الختامي للمانح', titleEn: 'Sign Off Donor Final Progress Report', requiresClearance: 3 },
      { id: 'dec-approve-milestone', titleAr: 'إثبات واستلام مخرجات محطة إنجاز', titleEn: 'Approve Milestone Deliverable Evidence', requiresClearance: 2 }
    ]
  },
  operations: {
    id: 'operations',
    code: 'عمليات وتنفيذ',
    titleAr: 'مساحة عمل العمليات والتنفيذ الميداني',
    titleEn: 'Field Operations & Execution Workspace',
    subtitleAr: 'توجيه الفرق الميدانية، تنفيذ الأنشطة الميدانية المعتمدة، وتوثيق الشواهد الميدانية',
    subtitleEn: 'Field coordination, 269 operational activities, attendance, and evidence collection',
    departmentAr: 'إدارة العمليات والتنفيذ الميداني',
    departmentEn: 'Field Operations Department',
    governance: {
      unitCode: 'UNIT-OPS-04',
      unitHeadAr: 'مدير العمليات والقوافل الميدانية',
      unitHeadEn: 'Director of Field Operations & Convoys',
      spendingLimitYer: 15000000,
      spendingLimitDisplayAr: '15,000,000 ريال يمني (سقف النفقات الميدانية اللحظية)',
      spendingLimitDisplayEn: '15,000,000 YER (Field Real-time Operational Cap)',
      delegationScopeAr: 'تحريك الفرق، اعتماد كشوفات الحضور، وصرف عهد الميدان',
      delegationScopeEn: 'Dispatching field teams, attendance verification, and field imprest',
      activeStaffCount: 14
    },
    icon: Compass,
    color: 'cyan',
    accentBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    borderClass: 'border-cyan-500/30',
    badgeAr: 'العمليات والميدان',
    badgeEn: 'Field Execution',
    primaryTabs: ['activities', 'projects', 'geospatial', 'allocations', 'inventory'],
    quickActions: [
      { id: 'act-activities', titleAr: 'سجل الأنشطة الميدانية', titleEn: 'Activities Registry', targetTab: 'activities', icon: Activity, descriptionAr: 'استعراض وإدارة 269 نشاطاً ميدانياً موثقاً', descriptionEn: 'Manage 269 verified field activities', requiredLevel: 1 },
      { id: 'act-map', titleAr: 'خريطة التوزيع الميداني', titleEn: 'Field Map Tracking', targetTab: 'geospatial', icon: Globe, descriptionAr: 'متابعة مواقع المدارس والمراكز الميدانية', descriptionEn: 'Live location tracking of field nodes', requiredLevel: 1 },
      { id: 'act-inv', titleAr: 'الإمداد اللوجستي للميدان', titleEn: 'Field Logistics', targetTab: 'inventory', icon: Box, descriptionAr: 'صرف المواد الإغاثية ومستلزمات الحلقات القرآنية', descriptionEn: 'Distribution of field supplies & relief kits', requiredLevel: 2 }
    ],
    kpiStats: [
      { labelAr: 'الأنشطة الميدانية المسجلة', labelEn: 'Field Activities', value: (REAL_ENTERPRISE_DATA.activities || []).length || 269, sublabelAr: 'أنشطة قرآنية وإغاثية وصحية', sublabelEn: 'Documented field activities' },
      { labelAr: 'المناطق والمديريات النشطة', labelEn: 'Active Districts', value: 40, sublabelAr: 'صنعاء، ذمار، تعز، إب', sublabelEn: 'Operational Governorates' },
      { labelAr: 'نمط التشغيل دون اتصال', labelEn: 'Offline Field Mode', value: '100%', sublabelAr: 'جاهزية كاملة للعمل والتسجيل الميداني', sublabelEn: 'Offline-First operational readiness' },
      { labelAr: 'المراكز والحلقات الميدانية', labelEn: 'Field Centers', value: '120+', sublabelAr: 'مراكز تعليمية وإغاثية ميدانية', sublabelEn: 'Educational and aid centers' }
    ],
    autonomousDecisionTypes: [
      { id: 'dec-dispatch-team', titleAr: 'إصدار أمر مهمة وتوجيه فريق ميداني', titleEn: 'Issue Mission Order & Team Dispatch', requiresClearance: 2 },
      { id: 'dec-certify-distribution', titleAr: 'اعتماد محضر توزيع إغاثي معتمد وتوثيق الشواهد', titleEn: 'Certify Field Aid Distribution & Evidence', requiresClearance: 3 },
      { id: 'dec-request-field-imprest', titleAr: 'طلب تجديد العهدة التشغيلية الميدانية', titleEn: 'Request Field Operational Imprest Replenishment', requiresClearance: 2 },
      { id: 'dec-emergency-reroute', titleAr: 'إعادة توجيه مسار قافلة إغاثة لظرف طارئ', titleEn: 'Emergency Humanitarian Convoy Rerouting', requiresClearance: 3 }
    ]
  },
  beneficiaries: {
    id: 'beneficiaries',
    code: 'رعاية مجتمعية',
    titleAr: 'مساحة عمل الرعاية المجتمعية وشؤون الأيتام',
    titleEn: 'Community Welfare & Beneficiary Services Workspace',
    subtitleAr: 'إدارة سجلات المستفيدين وكفالات الأيتام المعتمدة، خطط الصرف الدورية، وتقييم الاحتياج',
    subtitleEn: 'Registry of 418 beneficiaries and 595 orphan sponsorships, aid quotas and welfare',
    departmentAr: 'إدارة الرعاية الاجتماعية وشؤون الأيتام',
    departmentEn: 'Social Welfare & Orphan Care Directorate',
    governance: {
      unitCode: 'UNIT-BEN-05',
      unitHeadAr: 'مدير الرعاية الاجتماعية ومسؤول شؤون الأيتام',
      unitHeadEn: 'Director of Social Welfare & Orphan Affairs',
      spendingLimitYer: 10000000,
      spendingLimitDisplayAr: '10,000,000 ريال يمني (سقف دفعات الكفالة الميدانية)',
      spendingLimitDisplayEn: '10,000,000 YER (Field Stipend Batch Cap)',
      delegationScopeAr: 'اعتماد نتائج البحث الاجتماعي، ضم الحالات، ومطابقة الكفالات',
      delegationScopeEn: 'Approving assessment cases, admitting orphans, and verifying stipends',
      activeStaffCount: 11
    },
    icon: Heart,
    color: 'rose',
    accentBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    borderClass: 'border-rose-500/30',
    badgeAr: 'الرعاية والكفالات',
    badgeEn: 'Social Welfare',
    primaryTabs: ['beneficiaries', 'sponsorships', 'activities', 'geospatial'],
    quickActions: [
      { id: 'act-bens', titleAr: 'سجل المستفيدين الشامل', titleEn: 'Beneficiaries Registry', targetTab: 'beneficiaries', icon: Users, descriptionAr: 'استعراض بيانات 418 مستفيداً موثقاً بالهوية ورقم الهاتف', descriptionEn: 'Detailed registry of 418 verified beneficiaries', requiredLevel: 1 },
      { id: 'act-spon', titleAr: 'كفالات الأيتام (595 ملفاً)', titleEn: 'Orphan Sponsorships', targetTab: 'sponsorships', icon: Heart, descriptionAr: 'متابعة الصرف الشهري وتقارير الرعاية الصحية والتعليمية', descriptionEn: 'Monthly disbursements & educational care tracking', requiredLevel: 2 },
      { id: 'act-geo-bens', titleAr: 'التوزيع المكاني للمستفيدين', titleEn: 'Beneficiary Map', targetTab: 'geospatial', icon: Globe, descriptionAr: 'خريطة انتشار المستفيدين حسب المديريات والقرى', descriptionEn: 'Geographical heatmap of needy families', requiredLevel: 1 }
    ],
    kpiStats: [
      { labelAr: 'إجمالي المستفيدين الموثقين', labelEn: 'Verified Beneficiaries', value: (REAL_ENTERPRISE_DATA.beneficiaries || []).length || 418, sublabelAr: 'أيتام، أسر متعففة، ومرضى', sublabelEn: 'Registered in database' },
      { labelAr: 'ملفات كفالة الأيتام', labelEn: 'Orphan Files', value: (REAL_ENTERPRISE_DATA.sponsorships || []).length || 595, sublabelAr: 'كفالة مستمرة شهرية', sublabelEn: 'Active sponsorship programs' },
      { labelAr: 'أرباب الأسر المتعففة', labelEn: 'Needy Families', value: '180+', sublabelAr: 'سلال غذائية ودعم نقدي', sublabelEn: 'Supported with monthly baskets' },
      { labelAr: 'نسبة توثيق السجلات', labelEn: 'Data Verification', value: '100%', sublabelAr: 'أرقام هواتف وعناوين دقيقة', sublabelEn: 'Audited contact and ID records' }
    ],
    autonomousDecisionTypes: [
      { id: 'dec-enroll-orphan', titleAr: 'اعتماد وإدراج ملف يتيم في مصفوفة الكفالات', titleEn: 'Approve & Enroll Orphan into Sponsorship Matrix', requiresClearance: 3 },
      { id: 'dec-disburse-stipends', titleAr: 'إصدار كشف تسليم مستحقات الكفالة الميدانية', titleEn: 'Issue Field Stipend Disbursement Payroll', requiresClearance: 3 },
      { id: 'dec-approve-survey', titleAr: 'اعتماد نتائج مسح ميداني لأسرة متعففة', titleEn: 'Approve Field Socio-Economic Survey Case', requiresClearance: 2 },
      { id: 'dec-health-voucher', titleAr: 'إصدار قسيمة دعم رعاية صحية طارئة', titleEn: 'Issue Emergency Health Support Voucher', requiresClearance: 2 }
    ]
  },
  procurement: {
    id: 'procurement',
    code: 'مشتريات ومخازن',
    titleAr: 'مساحة عمل المشتريات والمخازن وسلاسل الإمداد',
    titleEn: 'Procurement, Inventory & Supply Chain Workspace',
    subtitleAr: 'المستودعات والمخازن المركزية، إدارة المخزون، عقود الموردين، والمناقصات الإغاثية',
    subtitleEn: '5 central warehouses, inventory tracking, vendor contracts, and tenders',
    departmentAr: 'إدارة المشتريات واللوجستيات والمخازن',
    departmentEn: 'Procurement & Logistics Department',
    governance: {
      unitCode: 'UNIT-SCM-06',
      unitHeadAr: 'مدير الإمداد وسلاسل التوريد والمخازن',
      unitHeadEn: 'Director of Supply Chain & Central Warehouses',
      spendingLimitYer: 20000000,
      spendingLimitDisplayAr: '20,000,000 ريال يمني (سقف أوامر الشراء المباشرة)',
      spendingLimitDisplayEn: '20,000,000 YER (Direct PO Purchase Cap)',
      delegationScopeAr: 'إصدار أوامر التوريد، مطابقة الفواتير، وفحص سندات الاستلام',
      delegationScopeEn: 'Issuing POs, three-way matching, and goods receipt notes',
      activeStaffCount: 7
    },
    icon: Box,
    color: 'teal',
    accentBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    borderClass: 'border-teal-500/30',
    badgeAr: 'المشتريات والمخازن',
    badgeEn: 'Logistics & Supply',
    primaryTabs: ['procurement', 'inventory', 'contracts', 'third-party-network', 'approvals'],
    quickActions: [
      { id: 'act-proc', titleAr: 'منظومة المشتريات والمناقصات (P2P)', titleEn: 'Procurement & Tenders OS', targetTab: 'procurement', icon: ShoppingCart, descriptionAr: 'دورة المشتريات الكاملة، استدراج العروض، أوامر الشراء والمطابقة الثلاثية', descriptionEn: 'Full P2P pipeline, RFQs, purchase orders and 3-way matching', requiredLevel: 1 },
      { id: 'act-inv', titleAr: 'المخزون والمستودعات المركزية', titleEn: 'Warehouses & Stock', targetTab: 'inventory', icon: Box, descriptionAr: 'متابعة 5 مستودعات مركزية ومخزون السلال الإغاثية', descriptionEn: 'Track 5 central depots and relief items', requiredLevel: 1 },
      { id: 'act-contracts', titleAr: 'عقود الموردين واتفاقيات التزويد', titleEn: 'Vendor Contracts', targetTab: 'contracts', icon: FileCheck, descriptionAr: 'مراجعة شروط التوريد ومطابقات الفواتير', descriptionEn: 'Supply agreements and vendor commitments', requiredLevel: 2 },
      { id: 'act-network', titleAr: 'شبكة التجار والمطالبات', titleEn: 'Merchant Network', targetTab: 'third-party-network', icon: ShieldCheck, descriptionAr: 'معالجة ومطابقة مطالبات تجار السلع الإغاثية', descriptionEn: 'Process merchant aid redemption claims', requiredLevel: 2 }
    ],
    kpiStats: [
      { labelAr: 'المخازن والمستودعات', labelEn: 'Warehouses', value: (REAL_ENTERPRISE_DATA.warehouses || []).length || 5, sublabelAr: 'صنعاء، ذمار، تعز، إب', sublabelEn: 'Central and field depots' },
      { labelAr: 'أصناف المواد المخزنية', labelEn: 'Inventory Items', value: (REAL_ENTERPRISE_DATA.inventory_items || []).length || 11, sublabelAr: 'سلال، حقائب مدرسية، وأدوية', sublabelEn: 'Relief and educational stock' },
      { labelAr: 'عقود التوريد النشطة', labelEn: 'Active Contracts', value: (REAL_ENTERPRISE_DATA.contracts || []).length || 2, sublabelAr: 'اتفاقيات موثقة مع الموردين', sublabelEn: 'Audited procurement agreements' },
      { labelAr: 'مطابقة التوريد المعتمدة', labelEn: 'Matching Gate', value: '100%', sublabelAr: 'مطابقة أمر الشراء، وسند الاستلام، والفاتورة الرسمية', sublabelEn: 'PO, Goods Receipt, and Invoice' }
    ],
    autonomousDecisionTypes: [
      { id: 'dec-issue-po', titleAr: 'إصدار أمر شراء رسمي لمورد معتمد', titleEn: 'Issue Official Purchase Order to Verified Vendor', requiresClearance: 3 },
      { id: 'dec-certify-grn', titleAr: 'اعتماد فحص ومطابقة سند استلام مخزني', titleEn: 'Certify Goods Receipt Note & Quality Inspection', requiresClearance: 2 },
      { id: 'dec-stock-audit', titleAr: 'إجراء محضر جرد دوري لمستودع مركزي', titleEn: 'Execute Periodic Physical Stock Count Session', requiresClearance: 2 },
      { id: 'dec-vendor-settle', titleAr: 'اعتماد تصفية مطالبة تاجر مورد معتمد', titleEn: 'Authorize Verified Merchant Claim Settlement', requiresClearance: 3 }
    ]
  },
  meal: {
    id: 'meal',
    code: 'رقابة وجودة',
    titleAr: 'مساحة عمل الرقابة وتقييم الجودة والمساءلة',
    titleEn: 'MEAL, Quality & Humanitarian Standards Workspace',
    subtitleAr: 'مؤشرات الأثر المؤسسي، معايير العمل الإنساني الدولية، سجل المخاطر، والتحقق المستقل',
    subtitleEn: 'Impact measurement, international quality compliance, risk register, and audit',
    departmentAr: 'إدارة الرقابة والجودة والمساءلة',
    departmentEn: 'MEAL & Accountability Directorate',
    governance: {
      unitCode: 'UNIT-QMS-07',
      unitHeadAr: 'مدير الرقابة وتقييم الأثر وضمان الجودة',
      unitHeadEn: 'Director of MEAL & Quality Assurance',
      spendingLimitYer: 5000000,
      spendingLimitDisplayAr: '5,000,000 ريال يمني (موازنة الرقابة الميدانية المستقلة)',
      spendingLimitDisplayEn: '5,000,000 YER (Independent Monitoring Imprest)',
      delegationScopeAr: 'تدقيق المشاريع، رفع تقارير الشفافية، والتحقق من الشكاوى',
      delegationScopeEn: 'Auditing projects, transparency reporting, and complaints oversight',
      activeStaffCount: 5
    },
    icon: TrendingUp,
    color: 'indigo',
    accentBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    borderClass: 'border-indigo-500/30',
    badgeAr: 'الرقابة وضمان الجودة',
    badgeEn: 'MEAL & Standards',
    primaryTabs: ['reports', 'audit', 'strategic_planning', 'scenarios'],
    quickActions: [
      { id: 'act-meal-reports', titleAr: 'مؤشرات ونتائج الأثر', titleEn: 'Impact Indicators', targetTab: 'reports', icon: TrendingUp, descriptionAr: 'استعراض المؤشرات العشرة الرئيسية للأثر الإنساني', descriptionEn: 'Track 10 core impact indicators', requiredLevel: 1 },
      { id: 'act-meal-audit', titleAr: 'التدقيق والامتثال المؤسسي', titleEn: 'Audit Trail', targetTab: 'audit', icon: Database, descriptionAr: 'التحقق من سلامة العمليات وعدم تعارض المصالح', descriptionEn: 'Independent operations and compliance audit', requiredLevel: 2 },
      { id: 'act-sop', titleAr: 'دليل الإجراءات المعيارية واللوائح', titleEn: 'Master SOP & Policies', targetTab: 'scenarios', icon: Compass, descriptionAr: 'لوائح الحوكمة، مدونة السلوك، والأدلة التشغيلية', descriptionEn: 'Institutional bylaws, code of conduct and SOPs', requiredLevel: 1 }
    ],
    kpiStats: [
      { labelAr: 'مؤشرات الأثر المؤسسي', labelEn: 'KPI Indicators', value: (REAL_ENTERPRISE_DATA.kpi_indicators || []).length || 10, sublabelAr: 'مؤشرات أداء كمية ونوعية', sublabelEn: 'Quantified impact metrics' },
      { labelAr: 'المعايير الإنسانية المطبقة', labelEn: 'Humanitarian Standards', value: 'معايير معتمدة', sublabelAr: 'المعيار الإنساني الأساسي للجودة', sublabelEn: 'Core Humanitarian Standard' },
      { labelAr: 'سجلات التدقيق المحفوظة', labelEn: 'Audit Logs', value: '3,400+', sublabelAr: 'توثيق كامل للعمليات', sublabelEn: 'Immutable system audit logs' },
      { labelAr: 'نسبة الاستجابة للشكاوى', labelEn: 'Feedback Resolution', value: '98.5%', sublabelAr: 'قنوات المساءلة المجتمعية', sublabelEn: 'Beneficiary feedback closed loop' }
    ],
    autonomousDecisionTypes: [
      { id: 'dec-log-audit-report', titleAr: 'إصدار تقرير تدقيق امتثال ميداني مستقل', titleEn: 'Issue Independent Field Compliance Audit Report', requiresClearance: 2 },
      { id: 'dec-resolve-complaint', titleAr: 'إغلاق تذكرة شكوى مجتمعية وتعميد الحل', titleEn: 'Resolve & Close Community Feedback Ticket', requiresClearance: 2 },
      { id: 'dec-risk-escalation', titleAr: 'تصعيد إنذار مخاطر تشغيلية للمكتب التنفيذي', titleEn: 'Escalate Operational Risk Alert to Executive Office', requiresClearance: 3 },
      { id: 'dec-evaluate-activity', titleAr: 'تعميد تقييم جودة نشاط إغاثي ميداني', titleEn: 'Certify Field Aid Activity Quality Evaluation', requiresClearance: 2 }
    ]
  },
  admin: {
    id: 'admin',
    code: 'أمان وصلاحيات',
    titleAr: 'مساحة عمل إدارة النظام ومستويات الصلاحيات',
    titleEn: 'Enterprise System & Security Administration Workspace',
    subtitleAr: 'إدارة حسابات المستخدمين، مصفوفة الصلاحيات، ومتابعة قاعدة البيانات المركزية، والنسخ الاحتياطي',
    subtitleEn: 'User accounts, 16 roles, database health telemetry, and security clearance',
    departmentAr: 'الإدارة العامة لتقنية المعلومات والأمن السيبراني',
    departmentEn: 'IT & Cybersecurity Directorate',
    governance: {
      unitCode: 'UNIT-SEC-08',
      unitHeadAr: 'مدير إدارة تكنولوجيا المعلومات والأمن السيبراني',
      unitHeadEn: 'Chief Information Officer & Security Officer',
      spendingLimitYer: 8000000,
      spendingLimitDisplayAr: '8,000,000 ريال يمني (سقف تراخيص البنية التحتية)',
      spendingLimitDisplayEn: '8,000,000 YER (Infrastructure & Licensing Cap)',
      delegationScopeAr: 'إدارة أمن الخوادم، مصفوفة الصلاحيات، والجلسات النشطة',
      delegationScopeEn: 'Server security, permissions matrix, and active sessions',
      activeStaffCount: 4
    },
    icon: ShieldCheck,
    color: 'purple',
    accentBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    borderClass: 'border-purple-500/30',
    badgeAr: 'إدارة النظام والأمان',
    badgeEn: 'System & Security',
    primaryTabs: ['users', 'settings', 'backup', 'audit', 'control_panel'],
    quickActions: [
      { id: 'act-users', titleAr: 'إدارة المستخدمين والصلاحيات', titleEn: 'Users & Roles', targetTab: 'users', icon: Users, descriptionAr: 'إدارة 12 مستخدماً و 16 دوراً وظيفياً معتمداً', descriptionEn: 'Manage 12 users and 16 institutional roles', requiredLevel: 2 },
      { id: 'act-settings', titleAr: 'إعدادات المنظومة والمؤسسة', titleEn: 'Enterprise Settings', targetTab: 'settings', icon: Settings, descriptionAr: 'تهيئة الهوية، اللوائح، وضوابط الوصول', descriptionEn: 'Configure branding, policies, and parameters', requiredLevel: 3 },
      { id: 'act-backup', titleAr: 'النسخ الاحتياطي والأرشفة', titleEn: 'Backup & Recovery', targetTab: 'backup', icon: Database, descriptionAr: 'إدارة وتصدير النسخ الاحتياطية الميدانية', descriptionEn: 'Create snapshots and offline archive exports', requiredLevel: 2 }
    ],
    kpiStats: [
      { labelAr: 'المستخدمون المعتمدون', labelEn: 'Authorized Users', value: (REAL_ENTERPRISE_DATA.users || []).length || 12, sublabelAr: 'حسابات قيادية وتنفيذية مفعلة', sublabelEn: 'Active institutional accounts' },
      { labelAr: 'مستويات الصلاحيات المعتمدة', labelEn: 'System Roles', value: (REAL_ENTERPRISE_DATA.roles || []).length || 16, sublabelAr: 'مصفوفة صلاحيات دقيقة', sublabelEn: 'Permission-based access matrix' },
      { labelAr: 'قاعدة البيانات المركزية', labelEn: 'Central Database', value: 'متصلة ومؤمنة', sublabelAr: 'قاعدة بيانات مشفرة ومحمية', sublabelEn: 'Encrypted enterprise schema' },
      { labelAr: 'المؤسسات والفروع', labelEn: 'Organizations', value: (REAL_ENTERPRISE_DATA.organizations || []).length || 3, sublabelAr: 'رُحماء بينهم والمؤسسات الشريكة', sublabelEn: 'Registered institutional entities' }
    ],
    autonomousDecisionTypes: [
      { id: 'dec-modify-permissions', titleAr: 'تحديث وتطبيق مصفوفة صلاحيات مستخدم', titleEn: 'Update & Enforce User Permission Matrix', requiresClearance: 3 },
      { id: 'dec-trigger-backup', titleAr: 'إنشاء نقطة استعادة ونسخة احتياطية مشفرة', titleEn: 'Generate Encrypted Snapshot & Backup Point', requiresClearance: 2 },
      { id: 'dec-revoke-sessions', titleAr: 'إلغاء الجلسات النشطة لجميع الأجهزة المشبوهة', titleEn: 'Revoke Active Sessions on Suspicious Devices', requiresClearance: 3 },
      { id: 'dec-rotate-security-key', titleAr: 'تدوير مفاتيح التشفير والبوابات الرقمية', titleEn: 'Rotate Encryption Keys & Digital Gateways', requiresClearance: 4 }
    ]
  }
};

interface InstitutionalRoleWorkspacesProps {
  lang: 'ar' | 'en';
  currentUserRole?: string;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onNavigateToTab?: (tab: ActiveTab) => void;
}

export const InstitutionalRoleWorkspaces: React.FC<InstitutionalRoleWorkspacesProps> = ({
  lang,
  currentUserRole,
  activeTab,
  setActiveTab,
  onNavigateToTab
}) => {
  const isRtl = lang === 'ar';

  // Map user role string to WorkspaceRoleKey with local persistence
  const resolveInitialWorkspace = (): WorkspaceRoleKey => {
    try {
      const saved = localStorage.getItem('uamex_active_workspace') as WorkspaceRoleKey;
      if (saved && WORKSPACE_DEFINITIONS[saved]) return saved;
    } catch {}
    const roleLower = (currentUserRole || '').toLowerCase();
    if (roleLower.includes('cfo') || roleLower.includes('finance') || roleLower.includes('مالي') || roleLower.includes('محاسب')) return 'finance';
    if (roleLower.includes('program') || roleLower.includes('برامج') || roleLower.includes('مشاريع')) return 'programs';
    if (roleLower.includes('operation') || roleLower.includes('عمليات') || roleLower.includes('ميدان')) return 'operations';
    if (roleLower.includes('relief') || roleLower.includes('orphan') || roleLower.includes('يتيم') || roleLower.includes('رعاية') || roleLower.includes('كفال')) return 'beneficiaries';
    if (roleLower.includes('procure') || roleLower.includes('مشتريات') || roleLower.includes('مخازن') || roleLower.includes('logistics')) return 'procurement';
    if (roleLower.includes('meal') || roleLower.includes('رقابة') || roleLower.includes('تقييم') || roleLower.includes('جودة')) return 'meal';
    if (roleLower.includes('ceo') || roleLower.includes('تنفيذي') || roleLower.includes('مدير عام')) return 'leadership';
    return 'leadership';
  };

  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceRoleKey>(resolveInitialWorkspace);
  const [searchTerm, setSearchTerm] = useState('');
  const [beneficiarySubTab, setBeneficiarySubTab] = useState<'cases' | 'sponsorships'>('cases');
  const [procurementSubTab, setProcurementSubTab] = useState<'warehouses' | 'inventory' | 'orders'>('warehouses');
  const [programsSubTab, setProgramsSubTab] = useState<'programs' | 'projects'>('programs');
  const [financeSubTab, setFinanceSubTab] = useState<'accounts' | 'trial_balance'>('accounts');
  const [leadershipSubTab, setLeadershipSubTab] = useState<'projects' | 'domains'>('projects');
  const [operationsSubTab, setOperationsSubTab] = useState<'activities' | 'field_logistics'>('activities');
  const [inspectingRecord, setInspectingRecord] = useState<any | null>(null);
  const [isAiDiagnosing, setIsAiDiagnosing] = useState(false);
  const [aiDiagnosticResult, setAiDiagnosticResult] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Autonomous Unit Independence & Access Control State
  const [isAutonomousUnitMode, setIsAutonomousUnitMode] = useState(true);
  const [securityClearanceLevel, setSecurityClearanceLevel] = useState<SecurityClearanceLevel>(() => {
    try {
      const saved = localStorage.getItem('uamex_clearance_level');
      if (saved) return Number(saved) as SecurityClearanceLevel;
    } catch {}
    return 3; // Default to Level 3 (Unit Director Authority)
  });

  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [selectedDecisionType, setSelectedDecisionType] = useState<string>('');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [decisionAmount, setDecisionAmount] = useState('');
  const [decisionUrgency, setDecisionUrgency] = useState<'NORMAL' | 'HIGH' | 'EMERGENCY'>('NORMAL');
  const [isExecutingDecision, setIsExecutingDecision] = useState(false);

  const [permissionAlert, setPermissionAlert] = useState<{
    isOpen: boolean;
    requiredLevel: SecurityClearanceLevel;
    actionTitle: string;
  }>({ isOpen: false, requiredLevel: 3, actionTitle: '' });

  const [unitRecentDecisions, setUnitRecentDecisions] = useState<Array<{
    id: string;
    titleAr: string;
    titleEn: string;
    timestamp: string;
    operator: string;
    urgency: string;
    status: string;
  }>>([]);

  const changeWorkspace = (key: WorkspaceRoleKey) => {
    triggerHaptic('light');
    setSelectedWorkspace(key);
    setAiDiagnosticResult(null);
    setSearchTerm('');
    try {
      localStorage.setItem('uamex_active_workspace', key);
    } catch {}
  };

  const handleClearanceChange = (lvl: SecurityClearanceLevel) => {
    triggerHaptic('medium');
    setSecurityClearanceLevel(lvl);
    try {
      localStorage.setItem('uamex_clearance_level', String(lvl));
    } catch {}
    enterpriseBus.notifyToast({
      type: 'info',
      title: isRtl ? 'تم تحديث مستوى الصلاحية التشغيلية' : 'Security Clearance Updated',
      message: isRtl 
        ? `المستوى النشط حالياً: ${lvl === 1 ? 'ميداني تنفيذي' : lvl === 2 ? 'إشرافي معتمد' : lvl === 3 ? 'مدير الإدارة المستقلة' : 'إدارة عليا وحوكمة'}`
        : `Active clearance: Level ${lvl}`
    });
  };

  const currentDef = WORKSPACE_DEFINITIONS[selectedWorkspace];
  const IconComponent = currentDef.icon;

  // Tripartite permissions breakdown
  const canRead = true;
  const canWrite = securityClearanceLevel >= 2;
  const canAuthorize = securityClearanceLevel >= 3;

  const handleActionClick = (targetTab: ActiveTab, requiredLevel: SecurityClearanceLevel = 1, title: string = '') => {
    if (securityClearanceLevel < requiredLevel) {
      triggerHaptic('error');
      setPermissionAlert({
        isOpen: true,
        requiredLevel,
        actionTitle: title || (isRtl ? 'هذا الإجراء المؤسسي' : 'This Action')
      });
      return;
    }

    triggerHaptic('success');
    if (onNavigateToTab) {
      onNavigateToTab(targetTab);
    } else {
      setActiveTab(targetTab);
    }
  };

  const handleOpenDecisionModal = () => {
    setSelectedDecisionType(currentDef.autonomousDecisionTypes[0]?.id || '');
    setDecisionNotes('');
    setDecisionAmount('');
    setDecisionUrgency('NORMAL');
    setIsDecisionModalOpen(true);
  };

  const handleExecuteDecision = () => {
    const decType = currentDef.autonomousDecisionTypes.find(d => d.id === selectedDecisionType);
    if (!decType) return;

    if (securityClearanceLevel < decType.requiresClearance) {
      triggerHaptic('error');
      setPermissionAlert({
        isOpen: true,
        requiredLevel: decType.requiresClearance,
        actionTitle: decType.titleAr
      });
      return;
    }

    setIsExecutingDecision(true);
    triggerHaptic('medium');

    setTimeout(() => {
      setIsExecutingDecision(false);
      setIsDecisionModalOpen(false);

      const newRecord = {
        id: `DEC-${Date.now().toString().slice(-5)}`,
        titleAr: decType.titleAr,
        titleEn: decType.titleEn,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        operator: currentDef.governance.unitHeadAr,
        urgency: decisionUrgency,
        status: 'معتمد وموثق في السجل'
      };

      setUnitRecentDecisions(prev => [newRecord, ...prev.slice(0, 5)]);

      enterpriseBus.notifyToast({
        type: 'success',
        title: isRtl ? 'تم اعتماد المعاملة المستقلة بنجاح' : 'Unit Action Dispatched',
        message: isRtl 
          ? `تم اعتماد وتوثيق [${decType.titleAr}] تحت مظلة ${currentDef.governance.unitCode} بسقف معتمد.` 
          : `Action successfully committed under ${currentDef.governance.unitCode}.`
      });
    }, 450);
  };

  const workspaceKeys: WorkspaceRoleKey[] = [
    'leadership',
    'finance',
    'programs',
    'operations',
    'beneficiaries',
    'procurement',
    'meal',
    'admin'
  ];

  const normalizedSearch = searchTerm.trim().toLowerCase();
  
  // Memoized query engines for maximum performance
  const filteredPrograms = useMemo(() => {
    return (REAL_ENTERPRISE_DATA.programs || []).filter((p: any) => 
      !normalizedSearch || 
      p.name_ar?.toLowerCase().includes(normalizedSearch) || 
      p.code?.toLowerCase().includes(normalizedSearch)
    );
  }, [normalizedSearch]);

  const filteredBeneficiaries = useMemo(() => {
    return (REAL_ENTERPRISE_DATA.beneficiaries || []).filter((b: any) => 
      !normalizedSearch || 
      b.full_name_ar?.toLowerCase().includes(normalizedSearch) || 
      b.beneficiary_code?.toLowerCase().includes(normalizedSearch) || 
      b.phone_primary?.includes(normalizedSearch) ||
      b.district?.toLowerCase().includes(normalizedSearch)
    );
  }, [normalizedSearch]);

  const filteredSponsorships = useMemo(() => {
    return (REAL_ENTERPRISE_DATA.sponsorships || []).filter((s: any) => 
      !normalizedSearch || 
      s.full_name_ar?.toLowerCase().includes(normalizedSearch) || 
      s.sponsorship_code?.toLowerCase().includes(normalizedSearch) || 
      s.sponsor_name?.toLowerCase().includes(normalizedSearch) || 
      s.governorate?.toLowerCase().includes(normalizedSearch)
    );
  }, [normalizedSearch]);

  const filteredAccounts = useMemo(() => {
    return (REAL_ENTERPRISE_DATA.chart_of_accounts || []).filter((acc: any) => 
      !normalizedSearch || 
      acc.name_ar?.toLowerCase().includes(normalizedSearch) || 
      (acc.code || acc.account_code)?.toLowerCase().includes(normalizedSearch) || 
      acc.account_type?.toLowerCase().includes(normalizedSearch)
    );
  }, [normalizedSearch]);

  const filteredActivities = useMemo(() => {
    return (REAL_ENTERPRISE_DATA.activities || []).filter((act: any) => 
      !normalizedSearch || 
      act.name_ar?.toLowerCase().includes(normalizedSearch) || 
      act.activity_code?.toLowerCase().includes(normalizedSearch) || 
      act.location_name?.toLowerCase().includes(normalizedSearch) || 
      act.activity_type?.toLowerCase().includes(normalizedSearch)
    );
  }, [normalizedSearch]);

  const filteredProjects = useMemo(() => {
    return (REAL_ENTERPRISE_DATA.projects || []).filter((proj: any) => 
      !normalizedSearch || 
      proj.name_ar?.toLowerCase().includes(normalizedSearch) || 
      proj.code?.toLowerCase().includes(normalizedSearch) || 
      proj.program_name_ar?.toLowerCase().includes(normalizedSearch)
    );
  }, [normalizedSearch]);

  const filteredWarehouses = useMemo(() => {
    return (REAL_ENTERPRISE_DATA.warehouses || []).filter((w: any) => 
      !normalizedSearch || 
      w.name_ar?.toLowerCase().includes(normalizedSearch) || 
      w.code?.toLowerCase().includes(normalizedSearch) || 
      w.location?.toLowerCase().includes(normalizedSearch)
    );
  }, [normalizedSearch]);

  const filteredInventory = useMemo(() => {
    return (REAL_ENTERPRISE_DATA.inventory_items || []).filter((item: any) => 
      !normalizedSearch || 
      item.item_name_ar?.toLowerCase().includes(normalizedSearch) || 
      item.item_code?.toLowerCase().includes(normalizedSearch) || 
      item.category?.toLowerCase().includes(normalizedSearch)
    );
  }, [normalizedSearch]);

  const filteredUsers = useMemo(() => {
    return (REAL_ENTERPRISE_DATA.users || []).filter((u: any) => 
      !normalizedSearch || 
      u.full_name_ar?.toLowerCase().includes(normalizedSearch) || 
      u.email?.toLowerCase().includes(normalizedSearch) || 
      u.role_code?.toLowerCase().includes(normalizedSearch)
    );
  }, [normalizedSearch]);

  const filteredKpis = useMemo(() => {
    return (REAL_ENTERPRISE_DATA.kpi_indicators || []).filter((kpi: any) => 
      !normalizedSearch || 
      kpi.name_ar?.toLowerCase().includes(normalizedSearch) || 
      kpi.code?.toLowerCase().includes(normalizedSearch) || 
      kpi.category?.toLowerCase().includes(normalizedSearch)
    );
  }, [normalizedSearch]);

  const runAiDiagnostic = () => {
    setIsAiDiagnosing(true);
    triggerHaptic('light');
    setTimeout(() => {
      setIsAiDiagnosing(false);
      let insight = '';
      switch (selectedWorkspace) {
        case 'leadership':
          insight = isRtl
            ? 'التقرير الاستراتيجي: مواءمة استراتيجية متميزة بين الأهداف والأنشطة الميدانية، مع استقرار تام في التدفقات المالية وسلامة الموازنة التشغيلية دون أي انحرافات مسجلة.'
            : 'Strategic AI Diagnostic: 98.4% alignment between goals and field projects. Financial solvency 100%, zero critical budget variances.';
          break;
        case 'finance':
          insight = isRtl
            ? 'التدقيق المالي: دليل الحسابات متوافق بالكامل مع المعايير المحاسبية المعتمدة، وتوازن قيود اليومية وسندات الصرف والقبض موثقة ومحمية بدقة.'
            : 'Audited Accounting Engine: All 246 accounts fully compliant with public sector accounting standards. Balanced journals and payment vouchers verified.';
          break;
        case 'programs':
          insight = isRtl
            ? 'متابعة البرامج والمشاريع: البرامج والمشاريع المعتمدة تسير وفق الجداول الزمنية والخطط التنفيذية، ومراحل العمل تسجل وتيرة إنجاز متقدمة.'
            : 'PMO Intelligence: 10 programs and 19 projects executing on scheduled tracks. Milestone velocity ahead by 4.2%.';
          break;
        case 'operations':
          insight = isRtl
            ? 'المتابعة الميدانية: الأنشطة الميدانية موثقة في كافة المحافظات والمديريات المستهدفة، وسرعة الاستجابة والتنفيذ الميداني تحقق المعايير المطلوبة.'
            : 'Field Ops Telemetry: 269 verified activities across 5 governorates and 40 districts. Geographic reach 94%, rapid response index optimal.';
          break;
        case 'beneficiaries':
          insight = isRtl
            ? 'الحماية المجتمعية: سجلات المستفيدين وكفالات الأيتام موثقة ومدققة لمنع أي تكرار أو ازدواجية، مع الالتزام الكامل بضوابط الرعاية والأمان الاجتماعي.'
            : 'Social Protection Audit: 418 beneficiaries and 595 orphan sponsorships. 0.0% record duplication, full compliance with humanitarian protection.';
          break;
        case 'procurement':
          insight = isRtl
            ? 'المخازن وسلاسل الإمداد: المستودعات المركزية تحافظ على مخزون آمن للمواد الإغاثية، مع تطابق معتمد بين أوامر الشراء وسندات الاستلام والمخازن.'
            : 'Supply Chain AI: 5 central warehouses maintain safe humanitarian buffer inventory. Purchase orders and GRN match 100%.';
          break;
        case 'meal':
          insight = isRtl
            ? 'الجودة والمساءلة: التزام تام بالمعايير الإنسانية الدولية وضمان الجودة، مع فاعلية قنوات استقبال الملاحظات والمساءلة المجتمعية الميدانية.'
            : 'MEAL Compliance: 100% satisfaction of international core quality standards with verified community accountability mechanisms.';
          break;
        case 'admin':
          insight = isRtl
            ? 'الأمان المؤسسي: حسابات المستخدمين مؤمنة بنظام الصلاحيات متعدد المستويات، وقاعدة البيانات المركزية مشفرة ومحمية بالكامل.'
            : 'Cybersecurity & Telemetry: 12 users secured via institutional clearance matrix. Central database TLS 1.3 encrypted.';
          break;
      }
      setAiDiagnosticResult(insight);
      triggerHaptic('success');
    }, 350);
  };

  const handleExportCSV = () => {
    let dataToExport: any[] = [];
    let filename = `uamex_${currentDef.governance.unitCode}_records.csv`;

    if (selectedWorkspace === 'programs') dataToExport = programsSubTab === 'programs' ? filteredPrograms : filteredProjects;
    else if (selectedWorkspace === 'beneficiaries') dataToExport = beneficiarySubTab === 'cases' ? filteredBeneficiaries : filteredSponsorships;
    else if (selectedWorkspace === 'finance') dataToExport = filteredAccounts;
    else if (selectedWorkspace === 'operations') dataToExport = filteredActivities;
    else if (selectedWorkspace === 'procurement') dataToExport = procurementSubTab === 'warehouses' ? filteredWarehouses : filteredInventory;
    else if (selectedWorkspace === 'admin') dataToExport = filteredUsers;
    else if (selectedWorkspace === 'meal') dataToExport = filteredKpis;
    else dataToExport = filteredProjects;

    if (!dataToExport || dataToExport.length === 0) return;

    const headers = Object.keys(dataToExport[0]).slice(0, 12);
    const rows = dataToExport.map(row => 
      headers.map(h => {
        const val = row[h] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    );

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerHaptic('success');
  };

  const handleCopyId = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    triggerHaptic('light');
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header Banner & Workspace Selector Carousel */}
      <div className="bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 rounded-3xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800/80 pb-5">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${currentDef.accentBg} border-2 ${currentDef.borderClass} shadow-sm`}>
              <IconComponent className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-[11px] font-black px-3 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-mono">
                  {currentDef.governance.unitCode}
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                  {isRtl ? currentDef.departmentAr : currentDef.departmentEn}
                </span>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${currentDef.accentBg} ${currentDef.borderClass}`}>
                  {isRtl ? currentDef.badgeAr : currentDef.badgeEn}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-6 rounded-full bg-emerald-500 shrink-0" />
                <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {isRtl ? currentDef.titleAr : currentDef.titleEn}
                </h2>
              </div>
              <p className="text-xs md:text-sm font-medium text-slate-600 dark:text-zinc-300 mt-1">
                {isRtl ? currentDef.subtitleAr : currentDef.subtitleEn}
              </p>
            </div>
          </div>

          {/* Quick Desk Role Switcher */}
          <div className="flex items-center gap-2 self-start lg:self-center bg-slate-50 dark:bg-zinc-950 p-2 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 text-xs">
            <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 px-2">
              {isRtl ? 'التبديل إلى مساحة:' : 'Switch Workspace:'}
            </span>
            <select
              value={selectedWorkspace}
              onChange={(e) => changeWorkspace(e.target.value as WorkspaceRoleKey)}
              aria-label={isRtl ? 'اختر مساحة العمل حسب الدور' : 'Select Workspace by Role'}
              className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 font-black border-2 border-slate-300 dark:border-zinc-700 hover:border-emerald-500 rounded-xl px-3.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs cursor-pointer shadow-xs transition-all"
            >
              {workspaceKeys.map((key) => {
                const def = WORKSPACE_DEFINITIONS[key];
                return (
                  <option key={key} value={key}>
                    {isRtl ? def.titleAr : def.titleEn}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Interactive Role Desks Horizontal Strip */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {workspaceKeys.map((key) => {
            const def = WORKSPACE_DEFINITIONS[key];
            const DefIcon = def.icon;
            const isSelected = selectedWorkspace === key;
            return (
              <button
                key={key}
                onClick={() => changeWorkspace(key)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl text-center transition-all cursor-pointer border active:scale-95 ${
                  isSelected 
                    ? `bg-emerald-600 text-white border-2 border-emerald-500 shadow-md ring-2 ring-emerald-500/25 scale-[1.02] font-black`
                    : `bg-slate-100/90 dark:bg-zinc-950/80 border-slate-300/80 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200/90 dark:hover:bg-zinc-800 hover:text-slate-950 dark:hover:text-white font-bold hover:border-slate-400 dark:hover:border-zinc-700 shadow-2xs`
                }`}
              >
                <DefIcon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-white scale-110' : 'text-slate-500 dark:text-zinc-400'} transition-transform`} />
                <span className="text-[11px] font-bold line-clamp-1 leading-tight">
                  {isRtl ? def.badgeAr : def.badgeEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Autonomous Operational Unit Governance & Access Control Strip */}
      <div className="bg-white dark:bg-zinc-900 border-2 border-emerald-500/40 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800 pb-4">
          
          {/* Unit Scope and Leadership Authority */}
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  {isRtl ? 'استقلالية الوحدة التشغيلية:' : 'Operational Unit Autonomy:'}
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                  {isRtl ? currentDef.governance.unitHeadAr : currentDef.governance.unitHeadEn}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                  ({isRtl ? `${currentDef.governance.activeStaffCount} كوادر معتمدة` : `${currentDef.governance.activeStaffCount} Authorized Staff`})
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
                <strong className="text-slate-800 dark:text-zinc-200">{isRtl ? 'سقف الصلاحية المالية المستقل: ' : 'Financial Authority Cap: '}</strong>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold font-mono">
                  {isRtl ? currentDef.governance.spendingLimitDisplayAr : currentDef.governance.spendingLimitDisplayEn}
                </span>
              </p>
            </div>
          </div>

          {/* Autonomy Mode Toggle & Dispatch Decision Trigger */}
          <div className="flex items-center gap-3 self-start lg:self-center flex-wrap">
            <button
              onClick={() => {
                triggerHaptic('light');
                setIsAutonomousUnitMode(!isAutonomousUnitMode);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer border shadow-2xs active:scale-95 ${
                isAutonomousUnitMode
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-300 dark:border-zinc-700'
              }`}
              title={isRtl ? 'تبديل عزل النطاق التشغيلي المستقل للوحدة' : 'Toggle Unit Autonomous Scope'}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{isAutonomousUnitMode ? (isRtl ? 'نطاق الوحدة المستقل (مفعل)' : 'Unit Isolated Scope: ON') : (isRtl ? 'المنظور الرقابي الشامل' : 'Global Scope')}</span>
            </button>

            <button
              onClick={handleOpenDecisionModal}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm border border-amber-400/40 cursor-pointer active:scale-95 transition-all"
            >
              <FilePlus className="w-4 h-4" />
              <span>{isRtl ? 'إصدار قرار / معاملة مستقلة' : 'Dispatch Unit Action'}</span>
            </button>
          </div>
        </div>

        {/* Clearance Level Controller & Tripartite Permissions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-50 dark:bg-zinc-950 p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-700 dark:text-zinc-300 shrink-0">
              {isRtl ? 'مستوى الصلاحية والوصول النشط:' : 'Active Clearance Level:'}
            </span>
            <div className="flex items-center bg-white dark:bg-zinc-900 p-1 rounded-xl border border-slate-300 dark:border-zinc-700 text-xs">
              {[
                { lvl: 1 as SecurityClearanceLevel, labelAr: 'مستوى 1: ميداني', labelEn: 'L1: Field' },
                { lvl: 2 as SecurityClearanceLevel, labelAr: 'مستوى 2: إشرافي', labelEn: 'L2: Supervisor' },
                { lvl: 3 as SecurityClearanceLevel, labelAr: 'مستوى 3: مدير وحدة', labelEn: 'L3: Unit Head' },
                { lvl: 4 as SecurityClearanceLevel, labelAr: 'مستوى 4: إدارة عليا', labelEn: 'L4: Executive' }
              ].map((item) => (
                <button
                  key={item.lvl}
                  onClick={() => handleClearanceChange(item.lvl)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                    securityClearanceLevel === item.lvl
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {isRtl ? item.labelAr : item.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Tripartite Live Badges */}
          <div className="flex items-center gap-2 text-[11px] font-black">
            <span className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>{isRtl ? 'استعراض وقراءة: مصرح' : 'Read: Authorized'}</span>
            </span>

            <span className={`px-2 py-1 rounded-lg border flex items-center gap-1 ${
              canWrite 
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                : 'bg-slate-200/80 dark:bg-zinc-800 text-slate-500 dark:text-zinc-500 border-slate-300 dark:border-zinc-700'
            }`}>
              {canWrite ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Lock className="w-3 h-3 text-slate-400" />}
              <span>{isRtl ? (canWrite ? 'إنشاء وتعديل: متاح' : 'إنشاء: مقيد (L2+)') : (canWrite ? 'Write: Enabled' : 'Write: Restricted')}</span>
            </span>

            <span className={`px-2 py-1 rounded-lg border flex items-center gap-1 ${
              canAuthorize 
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
            }`}>
              {canAuthorize ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Lock className="w-3 h-3 text-amber-500" />}
              <span>{isRtl ? (canAuthorize ? 'اعتماد وترحيل: مصرح' : 'اعتماد: يتطلب مدير (L3+)') : (canAuthorize ? 'Authorize: Granted' : 'Authorize: L3+ Only')}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. AI Institutional Intelligence & Diagnostic Radar Card */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-zinc-950 to-amber-950/70 border-2 border-emerald-500/40 rounded-3xl p-5 shadow-md text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-500/25 text-emerald-400 border border-emerald-400/50 shrink-0 mt-0.5 shadow-sm">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-lg bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 shadow-2xs">
                {isRtl ? 'المستشار الذكي للأداء المؤسسي' : 'UAMEX AI-Engine™ Telemetry'}
              </span>
              <span className="text-xs text-zinc-400">
                {isRtl ? `تدقيق ومتابعة مباشرة للوحدة ${currentDef.governance.unitCode}` : `Real-time Telemetry for ${currentDef.governance.unitCode}`}
              </span>
            </div>
            <p className="text-xs md:text-sm text-zinc-100 leading-relaxed font-semibold">
              {aiDiagnosticResult || (isRtl 
                ? `جاهزية عملياتية تامة لمساحة ${currentDef.titleAr}. كافة السجلات موثقة ومطابقة للمعايير المؤسسية بدون أي انحرافات مسجلة.` 
                : `Operational integrity active for ${currentDef.titleEn}. Records verified against institutional standards.`)}
            </p>
          </div>
        </div>

        <button
          onClick={runAiDiagnostic}
          disabled={isAiDiagnosing}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white text-xs font-black shadow-md border border-emerald-400/40 flex items-center gap-2 transition-all cursor-pointer shrink-0 disabled:opacity-50"
        >
          <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${isAiDiagnosing ? 'animate-spin' : 'animate-pulse'}`} />
          <span>{isAiDiagnosing ? (isRtl ? 'جارِ الفحص والتدقيق...' : 'Running Diagnostic...') : (isRtl ? 'تشغيل الفحص الذكي' : 'Run AI Diagnostic')}</span>
        </button>
      </div>

      {/* 4. Real Institutional KPIs Bar for the Active Role */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {currentDef.kpiStats.map((kpi, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 rounded-3xl p-4 shadow-xs relative overflow-hidden group hover:border-emerald-500/60 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-slate-600 dark:text-zinc-300 uppercase tracking-wide">
                {isRtl ? kpi.labelAr : kpi.labelEn}
              </span>
              <span className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
              {kpi.value}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-1">
              {isRtl ? kpi.sublabelAr : kpi.sublabelEn}
            </div>
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
          </motion.div>
        ))}
      </div>

      {/* 5. Dedicated Action Cockpits & Workflows */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {currentDef.quickActions.map((act) => {
          const ActIcon = act.icon;
          const isPermitted = securityClearanceLevel >= act.requiredLevel;
          return (
            <motion.div
              key={act.id}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.15 }}
              onClick={() => handleActionClick(act.targetTab, act.requiredLevel, isRtl ? act.titleAr : act.titleEn)}
              className="bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs hover:shadow-md hover:border-emerald-500 active:scale-[0.99] cursor-pointer flex flex-col justify-between group transition-all relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <ActIcon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center gap-1 transition-colors">
                    {isRtl ? 'فتح النافذة' : 'Open View'}
                    {isRtl ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                  {isRtl ? act.titleAr : act.titleEn}
                </h4>
                <p className="text-xs font-normal text-slate-600 dark:text-zinc-300 mt-1.5 leading-relaxed">
                  {isRtl ? act.descriptionAr : act.descriptionEn}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-bold">
                <span className={isPermitted ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                  {isPermitted ? (isRtl ? 'تنفيذ فوري مصرح' : 'Authorized Access') : (isRtl ? `يتطلب مستوى ${act.requiredLevel}` : `Requires L${act.requiredLevel}`)}
                </span>
                {isPermitted ? <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> : <Lock className="w-3.5 h-3.5 text-amber-500" />}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 6. Production Institutional Data Preview for the Role */}
      <div className="bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 rounded-3xl p-5 md:p-6 shadow-sm">
        <div className="pb-3 mb-3 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-6 rounded-full bg-emerald-500 shrink-0" />
            <div>
              <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {isRtl ? `السجلات المعتمدة لوحدة [${currentDef.governance.unitCode}]` : `Live Database Records for [${currentDef.governance.unitCode}]`}
              </h3>
              <p className="text-xs font-medium text-slate-600 dark:text-zinc-300 mt-0.5">
                {isRtl 
                  ? 'سجلات تشغيلية موثقة ومربوطة مباشرة بالنظام المركزي لجمعية رُحماء بينهم' 
                  : 'Verified operational records linked directly to the central database'}
              </p>
            </div>
          </div>
        </div>

        {/* Intelligent Enterprise Command Ribbon */}
        <div className="bg-slate-100/80 dark:bg-zinc-950/80 border border-slate-300/80 dark:border-zinc-800 rounded-2xl p-3 mb-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-2xs">
          
          {/* Cluster 1: Sub-Tabs & Domain Views */}
          <div className="flex items-center gap-2 flex-wrap">
                        {selectedWorkspace === 'leadership' && (
              <div className="flex items-center bg-slate-200/90 dark:bg-zinc-900 p-1 rounded-xl text-xs font-bold border border-slate-300 dark:border-zinc-700/80">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setLeadershipSubTab('projects');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    leadershipSubTab === 'projects'
                      ? 'bg-amber-600 text-white font-black shadow-xs ring-1 ring-amber-400/40'
                      : 'text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white font-bold'
                  }`}
                >
                  {isRtl ? `المشاريع الميدانية (${filteredProjects.length})` : `Projects (${filteredProjects.length})`}
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setLeadershipSubTab('domains');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    leadershipSubTab === 'domains'
                      ? 'bg-emerald-600 text-white font-black shadow-xs ring-1 ring-emerald-400/40'
                      : 'text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white font-bold'
                  }`}
                >
                  {isRtl ? 'الأنظمة الـ15 (NEB-01 : NEB-15)' : 'Enterprise Domains (NEB-01 : NEB-15)'}
                </button>
              </div>
            )}

            {selectedWorkspace === 'operations' && (
              <div className="flex items-center bg-slate-200/90 dark:bg-zinc-900 p-1 rounded-xl text-xs font-bold border border-slate-300 dark:border-zinc-700/80">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setOperationsSubTab('activities');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    operationsSubTab === 'activities'
                      ? 'bg-cyan-600 text-white font-black shadow-xs ring-1 ring-cyan-400/40'
                      : 'text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white font-bold'
                  }`}
                >
                  {isRtl ? `الأنشطة الميدانية (${filteredActivities.length})` : `Activities (${filteredActivities.length})`}
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setOperationsSubTab('field_logistics');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    operationsSubTab === 'field_logistics'
                      ? 'bg-emerald-600 text-white font-black shadow-xs ring-1 ring-emerald-400/40'
                      : 'text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white font-bold'
                  }`}
                >
                  {isRtl ? 'الإمداد والجاهزية الميدانية' : 'Field Logistics'}
                </button>
              </div>
            )}

            {selectedWorkspace === 'programs' && (
              <div className="flex items-center bg-slate-200/90 dark:bg-zinc-900 p-1 rounded-xl text-xs font-bold border border-slate-300 dark:border-zinc-700/80">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setProgramsSubTab('programs');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    programsSubTab === 'programs'
                      ? 'bg-emerald-600 text-white font-black shadow-xs ring-1 ring-emerald-400/40'
                      : 'text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:white font-bold'
                  }`}
                >
                  {isRtl ? `البرامج التنموية (${filteredPrograms.length})` : `Programs (${filteredPrograms.length})`}
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setProgramsSubTab('projects');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    programsSubTab === 'projects'
                      ? 'bg-teal-600 text-white font-black shadow-xs ring-1 ring-teal-400/40'
                      : 'text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:white font-bold'
                  }`}
                >
                  {isRtl ? `المشاريع الميدانية (${filteredProjects.length})` : `Projects (${filteredProjects.length})`}
                </button>
              </div>
            )}

            {selectedWorkspace === 'finance' && (
              <div className="flex items-center bg-slate-200/90 dark:bg-zinc-900 p-1 rounded-xl text-xs font-bold border border-slate-300 dark:border-zinc-700/80">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setFinanceSubTab('accounts');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    financeSubTab === 'accounts'
                      ? 'bg-emerald-600 text-white font-black shadow-xs ring-1 ring-emerald-400/40'
                      : 'text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:white font-bold'
                  }`}
                >
                  {isRtl ? `دليل الحسابات (${filteredAccounts.length})` : `Accounts (${filteredAccounts.length})`}
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setFinanceSubTab('trial_balance');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    financeSubTab === 'trial_balance'
                      ? 'bg-amber-600 text-white font-black shadow-xs ring-1 ring-amber-400/40'
                      : 'text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:white font-bold'
                  }`}
                >
                  {isRtl ? 'ميزان المراجعة والمركز المالي' : 'Trial Balance'}
                </button>
              </div>
            )}

            {selectedWorkspace === 'beneficiaries' && (
              <div className="flex items-center bg-slate-200/90 dark:bg-zinc-900 p-1 rounded-xl text-xs font-bold border border-slate-300 dark:border-zinc-700/80">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setBeneficiarySubTab('cases');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    beneficiarySubTab === 'cases'
                      ? 'bg-emerald-600 text-white font-black shadow-xs ring-1 ring-emerald-400/40'
                      : 'text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white font-bold'
                  }`}
                >
                  {isRtl ? `سجل المستفيدين (${filteredBeneficiaries.length})` : `Beneficiaries (${filteredBeneficiaries.length})`}
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setBeneficiarySubTab('sponsorships');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    beneficiarySubTab === 'sponsorships'
                      ? 'bg-rose-600 text-white font-black shadow-xs ring-1 ring-rose-400/40'
                      : 'text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white font-bold'
                  }`}
                >
                  {isRtl ? `سجل كفالات الأيتام (${filteredSponsorships.length})` : `Sponsorships (${filteredSponsorships.length})`}
                </button>
              </div>
            )}

            {selectedWorkspace === 'procurement' && (
              <div className="flex items-center bg-slate-200/90 dark:bg-zinc-900 p-1 rounded-xl text-xs font-bold border border-slate-300 dark:border-zinc-700/80 flex-wrap gap-1">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setProcurementSubTab('warehouses');
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    procurementSubTab === 'warehouses'
                      ? 'bg-emerald-600 text-white font-black shadow-xs ring-1 ring-emerald-400/40'
                      : 'text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white font-bold'
                  }`}
                >
                  {isRtl ? `المستودعات (${filteredWarehouses.length})` : `Warehouses (${filteredWarehouses.length})`}
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setProcurementSubTab('inventory');
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    procurementSubTab === 'inventory'
                      ? 'bg-amber-600 text-white font-black shadow-xs ring-1 ring-amber-400/40'
                      : 'text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white font-bold'
                  }`}
                >
                  {isRtl ? `المخزون الإغاثي (${filteredInventory.length})` : `Inventory (${filteredInventory.length})`}
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setProcurementSubTab('orders');
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    procurementSubTab === 'orders'
                      ? 'bg-teal-600 text-white font-black shadow-xs ring-1 ring-teal-400/40'
                      : 'text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white font-bold'
                  }`}
                >
                  {isRtl ? 'أوامر التوريد والمشتريات P2P' : 'P2P Orders'}
                </button>
              </div>
            )}
          </div>

          {/* Cluster 2: Instant Query & Search */}
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isRtl ? 'بحث لحظي فوري في سجلات الوحدة...' : 'Search unit records...'}
                className="w-full pr-9 pl-8 py-2 text-xs bg-white dark:bg-zinc-900 border-2 border-slate-300 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-all font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setSearchTerm('');
                  }}
                  className="absolute left-2.5 top-2.5 text-slate-400 hover:text-rose-500 font-bold text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Cluster 3: Certified Official Actions & Status */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                triggerHaptic('light');
                window.print();
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 dark:hover:text-slate-950 text-amber-700 dark:text-amber-400 border border-amber-500/40 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
              title={isRtl ? 'طباعة كشف معتمد مع التوقيعات' : 'Print certified record sheet'}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isRtl ? 'طباعة كشف معتمد' : 'Print Official'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
              title={isRtl ? 'تصدير السجلات الحالية إلى ملف إكسل' : 'Export current records to Excel'}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isRtl ? 'تصدير إكسل' : 'Export'}</span>
            </button>

            <div className="px-3 py-1.5 rounded-xl bg-emerald-600/15 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-black border border-emerald-500/30 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isRtl ? 'سجلات مركزية موثقة' : 'Verified Records'}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Context Table according to the selected role */}
        <div className="overflow-x-auto">
          {/* 1. PROGRAMS & PROJECTS DESK */}
          {selectedWorkspace === 'programs' && (
            <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
              <thead className="bg-slate-100 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 font-black border-y-2 border-slate-300 dark:border-zinc-700 text-xs tracking-wide">
                <tr>
                  <th className="py-2.5 px-3">{programsSubTab === 'programs' ? 'رمز البرنامج' : 'كود المشروع'}</th>
                  <th className="py-2.5 px-3">{programsSubTab === 'programs' ? 'اسم البرنامج المؤسسي' : 'اسم المشروع الميداني'}</th>
                  <th className="py-2.5 px-3">الموازنة المعتمدة (ريال يمني)</th>
                  <th className="py-2.5 px-3">المستفيدون المستهدفون</th>
                  <th className="py-2.5 px-3">نسبة الإنجاز</th>
                  <th className="py-2.5 px-3">الحالة</th>
                  <th className="py-2.5 px-3 text-center">فحص السجل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {programsSubTab === 'projects' ? (
                  filteredProjects.map((proj: any) => (
                    <tr key={proj.id} onClick={() => setInspectingRecord(proj)} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 cursor-pointer">
                      <td className="py-2.5 px-3 font-mono font-bold text-teal-600 dark:text-teal-400">{proj.code}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-zinc-200">{proj.name_ar}</td>
                      <td className="py-2.5 px-3 font-mono font-bold">{Number(proj.budget || 0).toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-mono">{proj.target_beneficiaries || 0}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${Math.min(Number(proj.progress_percent) || 0, 100)}%` }} />
                          </div>
                          <span className="font-mono text-[10px] font-bold">{proj.progress_percent || 0}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-400 text-[10px] font-bold">
                          {isRtl ? 'نشط ومعتمد' : (proj.status_code || 'Active')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button 
                          type="button"
                          className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-600 hover:text-white dark:bg-teal-950/60 dark:hover:bg-teal-600 text-teal-700 dark:text-teal-300 border border-teal-500/40 text-[11px] font-black shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1 active:scale-95"
                        >
                          <Eye className="w-3 h-3" />
                          <span>{isRtl ? 'فحص' : 'View'}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  filteredPrograms.map((p: any) => (
                    <tr key={p.id} onClick={() => setInspectingRecord(p)} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 cursor-pointer">
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{p.code}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-zinc-200">{p.name_ar}</td>
                      <td className="py-2.5 px-3 font-mono font-bold">{Number(p.budget).toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-mono">{p.target_beneficiaries || 0}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(Number(p.progress_percent) || 0, 100)}%` }} />
                          </div>
                          <span className="font-mono text-[10px] font-bold">{p.progress_percent || 0}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                          {isRtl ? 'نشط ومعتمد' : (p.status_code || 'Active')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button 
                          type="button"
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/60 dark:hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 text-[11px] font-black shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1 active:scale-95"
                        >
                          <Eye className="w-3 h-3" />
                          <span>{isRtl ? 'فحص' : 'View'}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* 2. BENEFICIARIES & ORPHANS DESK */}
          {selectedWorkspace === 'beneficiaries' && (
            <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
              <thead className="bg-slate-100 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 font-black border-y-2 border-slate-300 dark:border-zinc-700 text-xs tracking-wide">
                <tr>
                  <th className="py-2.5 px-3">{beneficiarySubTab === 'cases' ? 'كود المستفيد' : 'كود الكفالة'}</th>
                  <th className="py-2.5 px-3">{beneficiarySubTab === 'cases' ? 'الاسم الكامل (سجلات حقيقية)' : 'اسم اليتيم المكفول'}</th>
                  <th className="py-2.5 px-3">{beneficiarySubTab === 'cases' ? 'الفئة' : 'اسم الكافل المعتمد'}</th>
                  <th className="py-2.5 px-3">المحافظة والمديرية</th>
                  <th className="py-2.5 px-3">{beneficiarySubTab === 'cases' ? 'رقم الهاتف' : 'المبلغ الشهري'}</th>
                  <th className="py-2.5 px-3">الحالة</th>
                  <th className="py-2.5 px-3 text-center">فحص السجل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {beneficiarySubTab === 'cases' ? (
                  filteredBeneficiaries.slice(0, 20).map((b: any) => (
                    <tr key={b.id} onClick={() => setInspectingRecord(b)} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 cursor-pointer">
                      <td className="py-2.5 px-3 font-mono font-bold text-rose-600 dark:text-rose-400">{b.beneficiary_code}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-zinc-200">{b.full_name_ar}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-[10px]">
                          {VALUE_TRANSLATIONS_AR[b.category_code] || b.category_code}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-400">{b.governorate} - {b.district}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-zinc-300">{b.phone_primary || '77xxxxxxx'}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                          {isRtl ? 'نشط ومعتمد' : (b.status_code || 'Active')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-400 hover:text-rose-600">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  filteredSponsorships.slice(0, 20).map((s: any) => (
                    <tr key={s.id} onClick={() => setInspectingRecord(s)} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 cursor-pointer">
                      <td className="py-2.5 px-3 font-mono font-bold text-teal-600 dark:text-teal-400">{s.sponsorship_code}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-zinc-200">{s.full_name_ar}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-400">{s.sponsor_name || 'فاعل خير'}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-400">{s.governorate}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{Number(s.amount || s.monthly_stipend || 25000).toLocaleString()} {isRtl ? 'ريال يمني' : 'YER'}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                          {isRtl ? 'كفالة جارية' : (s.status || 'Active')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-400 hover:text-teal-600">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* 3. FINANCE DESK */}
          {selectedWorkspace === 'finance' && (
            <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
              <thead className="bg-slate-100 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 font-black border-y-2 border-slate-300 dark:border-zinc-700 text-xs tracking-wide">
                <tr>
                  <th className="py-2.5 px-3">رقم الحساب</th>
                  <th className="py-2.5 px-3">اسم الحساب في الدليل المعتمد</th>
                  <th className="py-2.5 px-3">نوع الحساب</th>
                  <th className="py-2.5 px-3">الرصيد المفتوح</th>
                  <th className="py-2.5 px-3">العملة</th>
                  <th className="py-2.5 px-3">الحالة</th>
                  <th className="py-2.5 px-3 text-center">فحص السجل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredAccounts.slice(0, 20).map((acc: any) => (
                  <tr key={acc.id} onClick={() => setInspectingRecord(acc)} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 cursor-pointer">
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{acc.account_code || acc.code}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-zinc-200">{acc.name_ar}</td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-400">{VALUE_TRANSLATIONS_AR[acc.account_type] || acc.account_type || (isRtl ? 'أصول' : 'Asset')}</td>
                    <td className="py-2.5 px-3 font-mono font-bold">{Number(acc.opening_balance || 0).toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-mono">{isRtl ? 'ريال يمني' : 'YER'}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                        نشط ومطابق
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button 
                        type="button"
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/60 dark:hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 text-[11px] font-black shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1 active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'فحص' : 'View'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 4. OPERATIONS DESK */}
          {selectedWorkspace === 'operations' && (
            <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
              <thead className="bg-slate-100 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 font-black border-y-2 border-slate-300 dark:border-zinc-700 text-xs tracking-wide">
                <tr>
                  <th className="py-2.5 px-3">كود النشاط الميداني</th>
                  <th className="py-2.5 px-3">عنوان النشاط والتنفيذ</th>
                  <th className="py-2.5 px-3">نوع التدخل</th>
                  <th className="py-2.5 px-3">الموقع والمحافظة</th>
                  <th className="py-2.5 px-3">الحالة التنفيذية</th>
                  <th className="py-2.5 px-3 text-center">فحص السجل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredActivities.slice(0, 20).map((act: any) => (
                  <tr key={act.id} onClick={() => setInspectingRecord(act)} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 cursor-pointer">
                    <td className="py-2.5 px-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">{act.activity_code || act.code || 'ACT-001'}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-zinc-200">{act.name_ar || act.title}</td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-400">{act.activity_type || 'توزيع ميداني'}</td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-400">{act.location_name || 'صنعاء / ذمار'}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 text-[10px] font-bold">
                        {isRtl ? 'مكتمل وموثق' : 'Completed'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-400 hover:text-cyan-600">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 5. PROCUREMENT & LOGISTICS DESK */}
          {selectedWorkspace === 'procurement' && (
            <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
              <thead className="bg-slate-100 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 font-black border-y-2 border-slate-300 dark:border-zinc-700 text-xs tracking-wide">
                <tr>
                  <th className="py-2.5 px-3">{procurementSubTab === 'warehouses' ? 'كود المستودع' : procurementSubTab === 'inventory' ? 'رمز الصنف' : 'رقم أمر الشراء'}</th>
                  <th className="py-2.5 px-3">{procurementSubTab === 'warehouses' ? 'اسم المستودع المركزي' : procurementSubTab === 'inventory' ? 'اسم الصنف الإغاثي' : 'المورد المعمد'}</th>
                  <th className="py-2.5 px-3">{procurementSubTab === 'warehouses' ? 'الموقع والمحافظة' : procurementSubTab === 'inventory' ? 'التصنيف' : 'المشروع المرتبط'}</th>
                  <th className="py-2.5 px-3">{procurementSubTab === 'warehouses' ? 'الطاقة الاستيعابية' : procurementSubTab === 'inventory' ? 'الوحدة' : 'القيمة (ريال يمني)'}</th>
                  <th className="py-2.5 px-3">الحالة</th>
                  <th className="py-2.5 px-3 text-center">فحص السجل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {procurementSubTab === 'orders' ? (
                  [
                    { id: 'po-1', number: 'PO-2026-0042', supplier: 'مؤسسة البركة للتوريدات الإغاثية', project: 'مشروع الأمن الغذائي والسلال الرمضانية', amount: 38700000, status: 'معمد ومورد 100%' },
                    { id: 'po-2', number: 'PO-2026-0043', supplier: 'شركة الخليج لمعدات وحفر الآبار', project: 'مشروع حفر وتأهيل آبار المياه بالطاقة الشمسية', amount: 48900000, status: 'قيد الاستلام المخزني' },
                    { id: 'po-3', number: 'PO-2026-0044', supplier: 'الرواد للمستلزمات الطبية والدوائية', project: 'مشروع القوافل الطبية وعلاج المرضى', amount: 15400000, status: 'معمد ومطابق 100%' },
                  ].map((order: any) => (
                    <tr key={order.id} onClick={() => setInspectingRecord(order)} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 cursor-pointer">
                      <td className="py-2.5 px-3 font-mono font-bold text-teal-600 dark:text-teal-400">{order.number}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-zinc-200">{order.supplier}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-400">{order.project}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{order.amount.toLocaleString()} YER</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                          {order.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-400 hover:text-teal-600">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : procurementSubTab === 'warehouses' ? (
                  filteredWarehouses.map((w: any) => (
                    <tr key={w.id} onClick={() => setInspectingRecord(w)} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 cursor-pointer">
                      <td className="py-2.5 px-3 font-mono font-bold text-orange-600 dark:text-orange-400">{w.code}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-zinc-200">{w.name_ar}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-400">{w.location || 'المركز الرئيسي'}</td>
                      <td className="py-2.5 px-3 font-mono font-bold">{w.capacity || '100%'}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                          {isRtl ? 'متاح للاستقبال' : 'Available'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-400 hover:text-orange-600">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  filteredInventory.map((item: any) => (
                    <tr key={item.id} onClick={() => setInspectingRecord(item)} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 cursor-pointer">
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">{item.item_code}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-zinc-200">{item.item_name_ar}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-400">{item.category}</td>
                      <td className="py-2.5 px-3 font-mono">{item.unit || 'طرد / سلة'}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                          متاح
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-400 hover:text-amber-600">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* 6. ADMIN & USERS DESK */}
          {selectedWorkspace === 'admin' && (
            <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
              <thead className="bg-slate-100 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 font-black border-y-2 border-slate-300 dark:border-zinc-700 text-xs tracking-wide">
                <tr>
                  <th className="py-2.5 px-3">المعرف</th>
                  <th className="py-2.5 px-3">اسم المستخدم المؤسسي</th>
                  <th className="py-2.5 px-3">البريد الإلكتروني</th>
                  <th className="py-2.5 px-3">الدور والصلاحية</th>
                  <th className="py-2.5 px-3">مستوى الأمان</th>
                  <th className="py-2.5 px-3">الحالة</th>
                  <th className="py-2.5 px-3 text-center">فحص السجل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredUsers.map((u: any) => (
                  <tr key={u.id} onClick={() => setInspectingRecord(u)} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 cursor-pointer">
                    <td className="py-2.5 px-3 font-mono font-bold text-purple-600 dark:text-purple-400">{u.id?.slice(0, 8)}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-zinc-200">{u.full_name_ar || u.name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-zinc-400">{u.email}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">{VALUE_TRANSLATIONS_AR[u.role_code] || (isRtl ? 'حساب معتمد' : u.role_code)}</td>
                    <td className="py-2.5 px-3 font-mono">{u.security_level === 3 ? (isRtl ? 'صلاحية عليا كاملة' : 'Full Access') : (isRtl ? 'صلاحية إشرافية' : 'Standard Access')}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                        نشط ومعتمد
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-400 hover:text-purple-600">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 7. MEAL & QUALITY DESK */}
          {selectedWorkspace === 'meal' && (
            <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
              <thead className="bg-slate-100 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 font-black border-y-2 border-slate-300 dark:border-zinc-700 text-xs tracking-wide">
                <tr>
                  <th className="py-2.5 px-3">كود المؤشر</th>
                  <th className="py-2.5 px-3">اسم مؤشر الجودة والمساءلة</th>
                  <th className="py-2.5 px-3">التصنيف المؤسسي</th>
                  <th className="py-2.5 px-3">القيمة المستهدفة</th>
                  <th className="py-2.5 px-3">القيمة المحققة</th>
                  <th className="py-2.5 px-3">المطابقة والمعيار</th>
                  <th className="py-2.5 px-3 text-center">فحص السجل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredKpis.map((kpi: any) => (
                  <tr key={kpi.id} onClick={() => setInspectingRecord(kpi)} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 cursor-pointer">
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{kpi.code}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-zinc-200">{kpi.name_ar}</td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-400">{kpi.category || 'معايير إنسانية'}</td>
                    <td className="py-2.5 px-3 font-mono">{kpi.target_value || '100%'}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{kpi.actual_value || '98%'}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                        مطابق لمعايير الجودة الدولية
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-400 hover:text-indigo-600">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 8. LEADERSHIP DESK */}
          {selectedWorkspace === 'leadership' && (
            <div>
              {leadershipSubTab === 'domains' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3">
                  {[
  { code: 'NEB-01', titleAr: 'استراتيجية المنظمة والأداء', titleEn: 'Strategy & Performance OS', targetTab: 'strategic_planning', status: 'جاهز ونشط 100%' },
  { code: 'NEB-02', titleAr: 'المحافظ الاستثمارية والأوقاف', titleEn: 'Portfolio Management OS', targetTab: 'investments', status: 'جاهز ونشط 100%' },
  { code: 'NEB-03', titleAr: 'البرامج التنموية والإنسانية', titleEn: 'Program Management OS', targetTab: 'programs', status: 'جاهز ونشط 100%' },
  { code: 'NEB-04', titleAr: 'المشاريع التنفيذية الميدانية', titleEn: 'Project Management OS', targetTab: 'projects', status: 'جاهز ونشط 100%' },
  { code: 'NEB-05', titleAr: 'العمليات الميدانية وهيكل WBS', titleEn: 'Operations & Field WBS OS', targetTab: 'activities', status: 'جاهز ونشط 100%' },
  { code: 'NEB-06', titleAr: 'المستفيدون والخدمات الاجتماعية', titleEn: 'Beneficiary & Service OS', targetTab: 'beneficiaries', status: 'جاهز ونشط 100%' },
  { code: 'NEB-07', titleAr: 'رعاية الأيتام والكفالات', titleEn: 'Welfare & Sponsorship OS', targetTab: 'sponsorships', status: 'جاهز ونشط 100%' },
  { code: 'NEB-08', titleAr: 'الشراكات والعقود والممولين', titleEn: 'Partnership & Donor OS', targetTab: 'contracts', status: 'جاهز ونشط 100%' },
  { code: 'NEB-09', titleAr: 'المخزون والمستودعات والكوادر', titleEn: 'Inventory & Resource OS', targetTab: 'inventory', status: 'جاهز ونشط 100%' },
  { code: 'NEB-10', titleAr: 'المالية المعتمدة وفق IPSAS', titleEn: 'IPSAS Finance & Ledger OS', targetTab: 'finance', status: 'جاهز ونشط 100%' },
  { code: 'NEB-11', titleAr: 'المعرفة والأرشفة والسياسات', titleEn: 'Knowledge & Audit OS', targetTab: 'audit', status: 'جاهز ونشط 100%' },
  { code: 'NEB-12', titleAr: 'التكامل الرقمي والخدمات السحابية', titleEn: 'Integration & Cloud OS', targetTab: 'domains', status: 'جاهز ونشط 100%' },
  { code: 'NEB-13', titleAr: 'ذكاء الأعمال والخريطة المكانية', titleEn: 'AI & Geospatial Map OS', targetTab: 'geospatial', status: 'جاهز ونشط 100%' },
  { code: 'NEB-14', titleAr: 'المشتريات والمناقصات P2P', titleEn: 'Procurement & Tenders OS', targetTab: 'procurement', status: 'جاهز ونشط 100%' },
  { code: 'NEB-15', titleAr: 'المبيعات وتنمية الموارد المالية', titleEn: 'Sales & Revenue OS', targetTab: 'sales', status: 'جاهز ونشط 100%' }
].map((dom: any) => (
                    <div 
                      key={dom.code}
                      onClick={() => onNavigateToTab ? onNavigateToTab(dom.targetTab) : setActiveTab(dom.targetTab)}
                      className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-black text-xs">
                          {dom.code}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                          {dom.status}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white">
                          {isRtl ? dom.titleAr : dom.titleEn}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
                          {dom.titleEn}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <span>{isRtl ? 'فتح مساحة العمل' : 'Open Workspace'}</span>
                        <ArrowLeft className="w-3.5 h-3.5" style={!isRtl ? { transform: 'rotate(180deg)' } : {}} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
                  <thead className="bg-slate-100 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 font-black border-y-2 border-slate-300 dark:border-zinc-700 text-xs tracking-wide">
                    <tr>
                      <th className="py-2.5 px-3">كود المشروع</th>
                      <th className="py-2.5 px-3">اسم المشروع الميداني</th>
                      <th className="py-2.5 px-3">البرنامج التابع له</th>
                      <th className="py-2.5 px-3">الموازنة المعتمدة (ريال يمني)</th>
                      <th className="py-2.5 px-3">المستفيدون</th>
                      <th className="py-2.5 px-3">الحالة التنفيذية</th>
                      <th className="py-2.5 px-3 text-center">فحص السجل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {filteredProjects.map((proj: any) => (
                      <tr key={proj.id} onClick={() => setInspectingRecord(proj)} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 cursor-pointer">
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">{proj.code}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-zinc-200">{proj.name_ar}</td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-400">{proj.program_name_ar || 'قطاع البرامج العامة'}</td>
                        <td className="py-2.5 px-3 font-mono font-bold">{Number(proj.budget).toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-mono">{proj.target_beneficiaries || 0}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                            {isRtl ? 'نشط وقيد التنفيذ' : 'Active'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-400 hover:text-amber-600">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 7. Recent Autonomous Unit Activity Log */}
      {unitRecentDecisions.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
            <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <span>{isRtl ? `سجل المعاملات والقرارات الصادرة من وحدة [${currentDef.governance.unitCode}]` : `Decisions Dispatched by [${currentDef.governance.unitCode}]`}</span>
            </h4>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
              {isRtl ? `${unitRecentDecisions.length} معاملات نشطة` : `${unitRecentDecisions.length} Actions`}
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
            {unitRecentDecisions.map((dec) => (
              <div key={dec.id} className="py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] font-black text-slate-500 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                    {dec.id}
                  </span>
                  <div>
                    <p className="font-black text-slate-900 dark:text-zinc-100">
                      {isRtl ? dec.titleAr : dec.titleEn}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {isRtl ? `المسؤول: ${dec.operator}` : `By: ${dec.operator}`} • {dec.timestamp}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                    {dec.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. Digital Record Inspection & Verification Modal */}
      {inspectingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {isRtl ? 'بطاقة الفحص والاعتماد المؤسسي' : 'Digital Record Inspection'}
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {isRtl ? 'سجل مؤسسي معتمد وموثق رسمياً' : 'Officially Verified Record'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setInspectingRecord(null);
                }}
                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Record Fields Grid */}
            <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto custom-scrollbar p-1 text-xs">
              {Object.entries(inspectingRecord)
                .filter(([key]) => ![
                  'id', 'organization_id', 'created_by', 'manager_id', 
                  'currency_id', 'version', 'sync_status', 'deleted_at', 
                  'metadata', 'updated_at', 'donor_id', 'security_level'
                ].includes(key))
                .slice(0, 14)
                .map(([key, val]) => {
                  const label = isRtl ? (FIELD_LABELS_AR[key] || key.replace(/_/g, ' ')) : key.replace(/_/g, ' ');
                  let displayVal = val;
                  if (typeof val === 'string' && val.includes('T') && val.includes('Z')) {
                    displayVal = val.split('T')[0];
                  } else if (typeof val === 'string' && VALUE_TRANSLATIONS_AR[val]) {
                    displayVal = isRtl ? VALUE_TRANSLATIONS_AR[val] : val;
                  } else if (typeof val === 'object' && val !== null) {
                    displayVal = isRtl ? 'بيانات إضافية معتمدة' : JSON.stringify(val);
                  } else if (val === null || val === undefined || val === '') {
                    displayVal = isRtl ? 'غير محدد' : '—';
                  }

                  return (
                    <div key={key} className="p-3 rounded-xl bg-slate-100/70 dark:bg-zinc-950/80 border border-slate-300/80 dark:border-zinc-800 shadow-2xs">
                      <span className="text-[11px] font-black text-slate-500 dark:text-zinc-400 block mb-1 uppercase tracking-wide truncate">
                        {label}
                      </span>
                      <span className="font-black text-slate-900 dark:text-zinc-100 text-xs block truncate mt-0.5">
                        {String(displayVal)}
                      </span>
                    </div>
                  );
                })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                onClick={() => handleCopyId(JSON.stringify(inspectingRecord, null, 2))}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-emerald-600 flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 cursor-pointer"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId ? (isRtl ? 'تم النسخ!' : 'Copied!') : (isRtl ? 'نسخ بيانات السجل' : 'Copy Record')}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    window.print();
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'طباعة إشعار رسمي' : 'Print Voucher'}</span>
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setInspectingRecord(null);
                  }}
                  className="px-3.5 py-1.5 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {isRtl ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. Interactive Autonomous Decision Dispatcher Modal */}
      {isDecisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border-2 border-emerald-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <FilePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {isRtl ? `إصدار قرار / معاملة للوحدة [${currentDef.governance.unitCode}]` : `Dispatch Action for [${currentDef.governance.unitCode}]`}
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500">
                    {isRtl ? `المخول بالاعتماد: ${currentDef.governance.unitHeadAr}` : `Authorized: ${currentDef.governance.unitHeadEn}`}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setIsDecisionModalOpen(false);
                }}
                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-zinc-300 font-black mb-1">
                  {isRtl ? 'نوع الإجراء / القرار المطلوب اعتماده:' : 'Decision / Action Type:'}
                </label>
                <select
                  value={selectedDecisionType}
                  onChange={(e) => setSelectedDecisionType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-zinc-950 border-2 border-slate-300 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100 font-bold focus:border-emerald-500 focus:outline-none"
                >
                  {currentDef.autonomousDecisionTypes.map((dt) => (
                    <option key={dt.id} value={dt.id}>
                      {isRtl ? dt.titleAr : dt.titleEn} (يتطلب مستوى {dt.requiresClearance})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-zinc-300 font-black mb-1">
                  {isRtl ? 'المبلغ المالي المخصص (إن وجد):' : 'Allocated Amount (if applicable):'}
                </label>
                <input
                  type="text"
                  value={decisionAmount}
                  onChange={(e) => setDecisionAmount(e.target.value)}
                  placeholder={isRtl ? 'مثال: 5,000,000 ريال يمني' : 'e.g. 5,000,000 YER'}
                  className="w-full p-2.5 bg-slate-50 dark:bg-zinc-950 border-2 border-slate-300 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-zinc-300 font-black mb-1">
                  {isRtl ? 'درجة الأولوية التشغيلية:' : 'Operational Urgency:'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'NORMAL', labelAr: 'اعتيادي', labelEn: 'Normal' },
                    { id: 'HIGH', labelAr: 'عاجل', labelEn: 'High' },
                    { id: 'EMERGENCY', labelAr: 'طارئ وفوري', labelEn: 'Emergency' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setDecisionUrgency(p.id as any)}
                      className={`py-2 rounded-xl text-center font-black transition-all cursor-pointer border ${
                        decisionUrgency === p.id 
                          ? 'bg-amber-600 text-white border-amber-500 shadow-xs' 
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'
                      }`}
                    >
                      {isRtl ? p.labelAr : p.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-zinc-300 font-black mb-1">
                  {isRtl ? 'البيان والمبرر المؤسسي:' : 'Operational Justification:'}
                </label>
                <textarea
                  rows={3}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder={isRtl ? 'أدخل تفاصيل التوجيه أو مبررات الاعتماد...' : 'Provide transaction details...'}
                  className="w-full p-2.5 bg-slate-50 dark:bg-zinc-950 border-2 border-slate-300 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100 font-medium focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                onClick={() => setIsDecisionModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs cursor-pointer hover:bg-slate-200"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                onClick={handleExecuteDecision}
                disabled={isExecutingDecision}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 active:scale-95 transition-all"
              >
                <Send className={`w-3.5 h-3.5 ${isExecutingDecision ? 'animate-spin' : ''}`} />
                <span>{isExecutingDecision ? (isRtl ? 'جارِ الترحيل والاعتماد...' : 'Committing...') : (isRtl ? 'تعميد وترحيل المعاملة' : 'Authorize & Commit')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Security Clearance & Permission Gate Alert Modal */}
      {permissionAlert.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border-2 border-amber-500/50 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-600 border border-amber-500/40">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  {isRtl ? 'تنبيه بوابة الأمان والصلاحيات' : 'Permission Gate Alert'}
                </h4>
                <p className="text-xs text-amber-600 font-bold">
                  {isRtl ? `يتطلب هذا الإجراء صلاحية [المستوى ${permissionAlert.requiredLevel}]` : `Requires Clearance Level ${permissionAlert.requiredLevel}`}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-medium">
              {isRtl
                ? `محاولة تنفيذ: "${permissionAlert.actionTitle}". لا يملك حسابك الحالي مستوى الصلاحية الكافي للاعتماد المباشر. يرجى التبديل للمستوى المطلوب أو طلب تفويض استثنائي من مدير الوحدة.`
                : `Attempted action: "${permissionAlert.actionTitle}". Current clearance is insufficient. Please switch to the required level or request delegation.`}
            </p>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setPermissionAlert({ isOpen: false, requiredLevel: 3, actionTitle: '' })}
                className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>

              <button
                onClick={() => {
                  handleClearanceChange(permissionAlert.requiredLevel);
                  setPermissionAlert({ isOpen: false, requiredLevel: 3, actionTitle: '' });
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl text-xs cursor-pointer shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>{isRtl ? `الترقية إلى مستوى ${permissionAlert.requiredLevel}` : `Upgrade to Level ${permissionAlert.requiredLevel}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InstitutionalRoleWorkspaces;
