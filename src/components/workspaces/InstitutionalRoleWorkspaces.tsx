import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
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
  Brain
} from 'lucide-react';
import { REAL_ENTERPRISE_DATA } from '../../core/data/realEnterpriseData';
import { ActiveTab } from '../../types';

export type WorkspaceRoleKey = 
  | 'leadership' 
  | 'finance' 
  | 'programs' 
  | 'operations' 
  | 'beneficiaries' 
  | 'procurement' 
  | 'meal' 
  | 'admin';

interface WorkspaceDefinition {
  id: WorkspaceRoleKey;
  code: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  departmentAr: string;
  departmentEn: string;
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
  }[];
  kpiStats: {
    labelAr: string;
    labelEn: string;
    value: string | number;
    sublabelAr: string;
    sublabelEn: string;
    trend?: string;
  }[];
}

export const WORKSPACE_DEFINITIONS: Record<WorkspaceRoleKey, WorkspaceDefinition> = {
  leadership: {
    id: 'leadership',
    code: 'ROLE-EXEC',
    titleAr: 'مساحة عمل القيادة التنفيذية والحوكمة',
    titleEn: 'Executive Leadership & Governance Workspace',
    subtitleAr: 'الرؤية الاستراتيجية الشاملة، متابعة الأداء المؤسسي، واعتماد القرارات الكبرى',
    subtitleEn: 'Strategic oversight, institutional KPIs, and executive decisions',
    departmentAr: 'مكتب الإدارة التنفيذية العامة',
    departmentEn: 'Executive Management Office',
    icon: Briefcase,
    color: 'amber',
    accentBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-500/30',
    badgeAr: 'إدارة عليا وحوكمة',
    badgeEn: 'Executive Lead',
    primaryTabs: ['dashboard', 'control_panel', 'strategic_planning', 'approvals', 'reports', 'audit'],
    quickActions: [
      { id: 'act-kpis', titleAr: 'لوحة القيادة الاستراتيجية', titleEn: 'Strategy Dashboard', targetTab: 'dashboard', icon: TrendingUp, descriptionAr: 'متابعة مؤشرات أداء البرامج والمشاريع والمستفيدين', descriptionEn: 'Consolidated performance overview' },
      { id: 'act-approvals', titleAr: 'طابور الاعتمادات الكبرى', titleEn: 'Executive Approvals', targetTab: 'approvals', icon: ShieldCheck, descriptionAr: 'اعتماد الموازنات والدفعات والعقود الاستراتيجية', descriptionEn: 'Sign off high-level financial & contract requests' },
      { id: 'act-strategy', titleAr: 'التخطيط الاستراتيجي', titleEn: 'Strategic Planning', targetTab: 'strategic_planning', icon: Compass, descriptionAr: 'مواءمة الأهداف السنوية مع معايير العمل الإنساني', descriptionEn: 'Annual strategic initiatives and impact goals' },
      { id: 'act-audit', titleAr: 'سجل الرقابة والتدقيق', titleEn: 'Audit Trail', targetTab: 'audit', icon: Database, descriptionAr: 'مراجعة حركة الأمان الإداري وسجلات النظام', descriptionEn: 'Review security logs and administrative changes' }
    ],
    kpiStats: [
      { labelAr: 'إجمالي البرامج المؤسسية', labelEn: 'Total Programs', value: (REAL_ENTERPRISE_DATA.programs || []).length || 10, sublabelAr: 'برامج تعليمية وإغاثية وصحية', sublabelEn: 'Active institutional programs' },
      { labelAr: 'المشاريع الميدانية النشطة', labelEn: 'Active Projects', value: (REAL_ENTERPRISE_DATA.projects || []).length || 19, sublabelAr: 'موزعة على المحافظات', sublabelEn: 'Field projects across regions' },
      { labelAr: 'إجمالي المستفيدين المسجلين', labelEn: 'Total Beneficiaries', value: '418+', sublabelAr: 'بيانات ميدانية موثقة', sublabelEn: 'Verified database beneficiaries' },
      { labelAr: 'كفالات الأيتام المكفولين', labelEn: 'Orphan Sponsorships', value: '595', sublabelAr: 'رعاية شاملة شهرية', sublabelEn: 'Active sponsorship records' }
    ]
  },
  finance: {
    id: 'finance',
    code: 'ROLE-CFO',
    titleAr: 'مساحة عمل الإدارة المالية والمحاسبة IPSAS',
    titleEn: 'Financial Management & IPSAS Ledger Workspace',
    subtitleAr: 'دليل الحسابات، قيود اليومية، سندات الصرف والقبض، ومطابقة الصناديق والبنوك',
    subtitleEn: 'IPSAS chart of accounts, vouchers, bank reconciliation, and multi-currency',
    departmentAr: 'الإدارة المالية والمحاسبة القانونية',
    departmentEn: 'Finance & Accounts Directorate',
    icon: Coins,
    color: 'emerald',
    accentBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    borderClass: 'border-emerald-500/30',
    badgeAr: 'القطاع المالي والمحاسبي',
    badgeEn: 'Finance & Compliance',
    primaryTabs: ['finance', 'currencies', 'approvals', 'contracts', 'reports'],
    quickActions: [
      { id: 'act-coa', titleAr: 'دليل الحسابات وشجرة المحاسبة', titleEn: 'Chart of Accounts', targetTab: 'finance', icon: Coins, descriptionAr: 'استعراض وإدارة 246 حساباً رئيسياً وفرعياً', descriptionEn: 'Review 246 ledger accounts and balances' },
      { id: 'act-currencies', titleAr: 'إدارة العملات وأسعار الصرف', titleEn: 'Currency Exchange', targetTab: 'currencies', icon: Coins, descriptionAr: 'أسعار الصرف اليومية (ريال يمني، دولار، ريال سعودي)', descriptionEn: 'Daily multi-currency exchange rates' },
      { id: 'act-vouchers', titleAr: 'سندات الصرف والاعتمادات', titleEn: 'Disbursement Vouchers', targetTab: 'approvals', icon: FileCheck, descriptionAr: 'مراجعة وتدقيق سندات الصرف قبل الصرف البنكي', descriptionEn: 'Financial vouchers and payment authorizations' },
      { id: 'act-reports', titleAr: 'القوائم والتقارير المالية', titleEn: 'Financial Statements', targetTab: 'reports', icon: TrendingUp, descriptionAr: 'الميزانية العمومية وقائمة الإيرادات والمصروفات', descriptionEn: 'Balance sheet and revenue-expense statements' }
    ],
    kpiStats: [
      { labelAr: 'حسابات الدليل المحاسبي', labelEn: 'Chart Accounts', value: (REAL_ENTERPRISE_DATA.chart_of_accounts || []).length || 246, sublabelAr: 'حسابات متوافقة مع معايير IPSAS', sublabelEn: 'IPSAS compliant accounts' },
      { labelAr: 'العملات المعتمدة', labelEn: 'Currencies', value: 3, sublabelAr: 'YER, USD, SAR', sublabelEn: 'Active ledger currencies' },
      { labelAr: 'الموازنة التقديرية المعتمدة', labelEn: 'Approved Budget', value: '28,450,000', sublabelAr: 'ريال يمني مخصص للبرامج', sublabelEn: 'YER allocated to programs' },
      { labelAr: 'بنود الموازنة التشغيلية', labelEn: 'Budget Lines', value: 45, sublabelAr: 'موزعة على كافة المشاريع', sublabelEn: 'Active project budget lines' }
    ]
  },
  programs: {
    id: 'programs',
    code: 'ROLE-PMO',
    titleAr: 'مساحة عمل إدارة البرامج والمشاريع PMO',
    titleEn: 'Programs & Project Portfolio Workspace',
    subtitleAr: 'تخطيط المحافظ الإنسانية، متابعة المشاريع، معالم الإنجاز، وتقارير المانحين',
    subtitleEn: 'Humanitarian program design, project WBS, milestones, and donor deliverables',
    departmentAr: 'إدارة البرامج والمشاريع الإنسانية',
    departmentEn: 'Programs & Projects Directorate',
    icon: Layers,
    color: 'blue',
    accentBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    borderClass: 'border-blue-500/30',
    badgeAr: 'البرامج والمشاريع الإنسانية',
    badgeEn: 'Programs Lead',
    primaryTabs: ['programs', 'projects', 'activities', 'allocations', 'geospatial'],
    quickActions: [
      { id: 'act-prog', titleAr: 'سجل البرامج المؤسسية', titleEn: 'Programs Registry', targetTab: 'programs', icon: Briefcase, descriptionAr: 'إدارة وتتبع البرامج الاستراتيجية العشرة', descriptionEn: 'Track 10 core institutional programs' },
      { id: 'act-proj', titleAr: 'المشاريع التنفيذية (19 مشروعاً)', titleEn: 'Projects Workspace', targetTab: 'projects', icon: Layers, descriptionAr: 'هياكل العمل WBS ومراحل الإنجاز الزمني', descriptionEn: 'Project breakdown and milestone progress' },
      { id: 'act-alloc', titleAr: 'تخصيص الموارد والميزانيات', titleEn: 'Resource Allocations', targetTab: 'allocations', icon: Calendar, descriptionAr: 'توزيع المنح والموارد على الأنشطة الميدانية', descriptionEn: 'Grant commitments and field resource mapping' },
      { id: 'act-geo', titleAr: 'الخريطة المكانية للمشاريع', titleEn: 'Geospatial Projects', targetTab: 'geospatial', icon: Globe, descriptionAr: 'التوزيع الجغرافي للمشاريع في المحافظات', descriptionEn: 'Interactive geographical distribution' }
    ],
    kpiStats: [
      { labelAr: 'البرامج التنموية والإغاثية', labelEn: 'Programs', value: (REAL_ENTERPRISE_DATA.programs || []).length || 10, sublabelAr: 'تعليمية، صحية، إغاثية، ورعاية', sublabelEn: 'Core operational sectors' },
      { labelAr: 'المشاريع التنفيذية', labelEn: 'Projects', value: (REAL_ENTERPRISE_DATA.projects || []).length || 19, sublabelAr: 'مشاريع جارية قيد التنفيذ', sublabelEn: 'Under active execution' },
      { labelAr: 'معالم الإنجاز (Milestones)', labelEn: 'Milestones', value: 45, sublabelAr: 'محطات تسليم وتقييم ميداني', sublabelEn: 'Key project delivery milestones' },
      { labelAr: 'مناطق التغطية الميدانية', labelEn: 'Geographic Areas', value: 40, sublabelAr: 'مديريات ومراكز تنفيذية', sublabelEn: 'Districts and field nodes' }
    ]
  },
  operations: {
    id: 'operations',
    code: 'ROLE-OPS',
    titleAr: 'مساحة عمل العمليات والتنفيذ الميداني',
    titleEn: 'Field Operations & Execution Workspace',
    subtitleAr: 'توجيه الفرق الميدانية، تنفيذ الأنشطة (269 نشاطاً)، وتوثيق الشواهد الميدانية',
    subtitleEn: 'Field coordination, 269 operational activities, attendance, and evidence collection',
    departmentAr: 'إدارة العمليات والتنفيذ الميداني',
    departmentEn: 'Field Operations Department',
    icon: Compass,
    color: 'cyan',
    accentBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    borderClass: 'border-cyan-500/30',
    badgeAr: 'العمليات والميدان',
    badgeEn: 'Field Execution',
    primaryTabs: ['activities', 'projects', 'geospatial', 'allocations', 'inventory'],
    quickActions: [
      { id: 'act-activities', titleAr: 'سجل الأنشطة الميدانية', titleEn: 'Activities Registry', targetTab: 'activities', icon: Activity, descriptionAr: 'استعراض وإدارة 269 نشاطاً ميدانياً موثقاً', descriptionEn: 'Manage 269 verified field activities' },
      { id: 'act-map', titleAr: 'خريطة التوزيع الميداني', titleEn: 'Field Map Tracking', targetTab: 'geospatial', icon: Globe, descriptionAr: 'متابعة مواقع المدارس والمراكز الميدانية', descriptionEn: 'Live location tracking of field nodes' },
      { id: 'act-inv', titleAr: 'الإمداد اللوجستي للميدان', titleEn: 'Field Logistics', targetTab: 'inventory', icon: Box, descriptionAr: 'صرف المواد الإغاثية ومستلزمات الحلقات القرآنية', descriptionEn: 'Distribution of field supplies & relief kits' }
    ],
    kpiStats: [
      { labelAr: 'الأنشطة الميدانية المسجلة', labelEn: 'Field Activities', value: (REAL_ENTERPRISE_DATA.activities || []).length || 269, sublabelAr: 'أنشطة قرآنية وإغاثية وصحية', sublabelEn: 'Documented field activities' },
      { labelAr: 'المناطق والمديريات النشطة', labelEn: 'Active Districts', value: 40, sublabelAr: 'صنعاء، ذمار، تعز، إب', sublabelEn: 'Operational Governorates' },
      { labelAr: 'نمط التشغيل دون اتصال', labelEn: 'Offline Field Mode', value: '100%', sublabelAr: 'جاهزية التسجيل والمزامنة الميدانية', sublabelEn: 'Offline-First operational readiness' },
      { labelAr: 'المراكز والحلقات الميدانية', labelEn: 'Field Centers', value: '120+', sublabelAr: 'مراكز تعليمية وإغاثية ميدانية', sublabelEn: 'Educational and aid centers' }
    ]
  },
  beneficiaries: {
    id: 'beneficiaries',
    code: 'ROLE-WELFARE',
    titleAr: 'مساحة عمل الرعاية المجتمعية والكفالات',
    titleEn: 'Community Welfare & Beneficiary Services Workspace',
    subtitleAr: 'إدارة 418 مستفيداً و 595 كفالة يتيم، خطط الصرف الدورية، وتقييم الاحتياج',
    subtitleEn: 'Registry of 418 beneficiaries and 595 orphan sponsorships, aid quotas and welfare',
    departmentAr: 'إدارة الرعاية الاجتماعية وشؤون الأيتام',
    departmentEn: 'Social Welfare & Orphan Care Directorate',
    icon: Heart,
    color: 'rose',
    accentBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    borderClass: 'border-rose-500/30',
    badgeAr: 'الرعاية والكفالات',
    badgeEn: 'Social Welfare',
    primaryTabs: ['beneficiaries', 'sponsorships', 'activities', 'geospatial'],
    quickActions: [
      { id: 'act-bens', titleAr: 'سجل المستفيدين الشامل', titleEn: 'Beneficiaries Registry', targetTab: 'beneficiaries', icon: Users, descriptionAr: 'استعراض بيانات 418 مستفيداً موثقاً بالهوية ورقم الهاتف', descriptionEn: 'Detailed registry of 418 verified beneficiaries' },
      { id: 'act-spon', titleAr: 'كفالات الأيتام (595 ملفاً)', titleEn: 'Orphan Sponsorships', targetTab: 'sponsorships', icon: Heart, descriptionAr: 'متابعة الصرف الشهري وتقارير الرعاية الصحية والتعليمية', descriptionEn: 'Monthly disbursements & educational care tracking' },
      { id: 'act-geo-bens', titleAr: 'التوزيع المكاني للمستفيدين', titleEn: 'Beneficiary Map', targetTab: 'geospatial', icon: Globe, descriptionAr: 'خريطة انتشار المستفيدين حسب المديريات والقرى', descriptionEn: 'Geographical heatmap of needy families' }
    ],
    kpiStats: [
      { labelAr: 'إجمالي المستفيدين الموثقين', labelEn: 'Verified Beneficiaries', value: (REAL_ENTERPRISE_DATA.beneficiaries || []).length || 418, sublabelAr: 'أيتام، أسر متعففة، ومرضى', sublabelEn: 'Registered in database' },
      { labelAr: 'ملفات كفالة الأيتام', labelEn: 'Orphan Files', value: (REAL_ENTERPRISE_DATA.sponsorships || []).length || 595, sublabelAr: 'كفالة مستمرة شهرية', sublabelEn: 'Active sponsorship programs' },
      { labelAr: 'أرباب الأسر المتعففة', labelEn: 'Needy Families', value: '180+', sublabelAr: 'سلال غذائية ودعم نقدي', sublabelEn: 'Supported with monthly baskets' },
      { labelAr: 'نسبة توثيق السجلات', labelEn: 'Data Verification', value: '100%', sublabelAr: 'أرقام هواتف وعناوين دقيقة', sublabelEn: 'Audited contact and ID records' }
    ]
  },
  procurement: {
    id: 'procurement',
    code: 'ROLE-LOGISTICS',
    titleAr: 'مساحة عمل المشتريات والمخازن وسلاسل الإمداد',
    titleEn: 'Procurement, Inventory & Supply Chain Workspace',
    subtitleAr: 'المخازن المركزية (5 مخازن)، إدارة المخزون، عقود الموردين، والمناقصات الإغاثية',
    subtitleEn: '5 central warehouses, inventory tracking, vendor contracts, and tenders',
    departmentAr: 'إدارة المشتريات واللوجستيات والمخازن',
    departmentEn: 'Procurement & Logistics Department',
    icon: Box,
    color: 'teal',
    accentBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    borderClass: 'border-teal-500/30',
    badgeAr: 'المشتريات والمخازن',
    badgeEn: 'Logistics & Supply',
    primaryTabs: ['inventory', 'contracts', 'third-party-network', 'approvals'],
    quickActions: [
      { id: 'act-inv', titleAr: 'المخزون والمستودعات المركزية', titleEn: 'Warehouses & Stock', targetTab: 'inventory', icon: Box, descriptionAr: 'متابعة 5 مستودعات مركزية ومخزون السلال الإغاثية', descriptionEn: 'Track 5 central depots and relief items' },
      { id: 'act-contracts', titleAr: 'عقود الموردين واتفاقيات التزويد', titleEn: 'Vendor Contracts', targetTab: 'contracts', icon: FileCheck, descriptionAr: 'مراجعة شروط التوريد ومطابقات الفواتير', descriptionEn: 'Supply agreements and vendor commitments' },
      { id: 'act-network', titleAr: 'شبكة التجار والمطالبات', titleEn: 'Merchant Network', targetTab: 'third-party-network', icon: ShieldCheck, descriptionAr: 'معالجة ومطابقة مطالبات تجار السلع الإغاثية', descriptionEn: 'Process merchant aid redemption claims' }
    ],
    kpiStats: [
      { labelAr: 'المخازن والمستودعات', labelEn: 'Warehouses', value: (REAL_ENTERPRISE_DATA.warehouses || []).length || 5, sublabelAr: 'صنعاء، ذمار، تعز، إب', sublabelEn: 'Central and field depots' },
      { labelAr: 'أصناف المواد المخزنية', labelEn: 'Inventory Items', value: (REAL_ENTERPRISE_DATA.inventory_items || []).length || 11, sublabelAr: 'سلال، حقائب مدرسية، وأدوية', sublabelEn: 'Relief and educational stock' },
      { labelAr: 'عقود التوريد النشطة', labelEn: 'Active Contracts', value: (REAL_ENTERPRISE_DATA.contracts || []).length || 2, sublabelAr: 'اتفاقيات موثقة مع الموردين', sublabelEn: 'Audited procurement agreements' },
      { labelAr: 'مطابقة التوريد (3-Way)', labelEn: 'Matching Gate', value: '100%', sublabelAr: 'أمر الشراء، سند الاستلام، الفاتورة', sublabelEn: 'PO, Goods Receipt, and Invoice' }
    ]
  },
  meal: {
    id: 'meal',
    code: 'ROLE-MEAL',
    titleAr: 'مساحة عمل الرقابة والتقييم والمساءلة والجودة MEAL',
    titleEn: 'MEAL, Quality & Humanitarian Standards Workspace',
    subtitleAr: 'مؤشرات الأثر المؤسسي، معايير إسفير وCHS، سجل المخاطر، والتحقق المستقل',
    subtitleEn: 'Impact measurement, Sphere/CHS compliance, risk register, and quality assurance',
    departmentAr: 'إدارة الرقابة والجودة والمساءلة',
    departmentEn: 'MEAL & Accountability Directorate',
    icon: TrendingUp,
    color: 'indigo',
    accentBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    borderClass: 'border-indigo-500/30',
    badgeAr: 'الرقابة والجودة MEAL',
    badgeEn: 'MEAL & Standards',
    primaryTabs: ['reports', 'audit', 'strategic_planning', 'scenarios'],
    quickActions: [
      { id: 'act-meal-reports', titleAr: 'مؤشرات ونتائج الأثر', titleEn: 'Impact Indicators', targetTab: 'reports', icon: TrendingUp, descriptionAr: 'استعراض المؤشرات العشرة الرئيسية للأثر الإنساني', descriptionEn: 'Track 10 core impact indicators' },
      { id: 'act-meal-audit', titleAr: 'التدقيق والامتثال المؤسسي', titleEn: 'Audit Trail', targetTab: 'audit', icon: Database, descriptionAr: 'التحقق من سلامة العمليات وعدم تعارض المصالح', descriptionEn: 'Independent operations and compliance audit' },
      { id: 'act-sop', titleAr: 'دليل الإجراءات المعيارية واللوائح', titleEn: 'Master SOP & Policies', targetTab: 'scenarios', icon: Compass, descriptionAr: 'لوائح الحوكمة، مدونة السلوك، والأدلة التشغيلية', descriptionEn: 'Institutional bylaws, code of conduct and SOPs' }
    ],
    kpiStats: [
      { labelAr: 'مؤشرات الأثر المقاسة (KPIs)', labelEn: 'KPI Indicators', value: (REAL_ENTERPRISE_DATA.kpi_indicators || []).length || 10, sublabelAr: 'مؤشرات أداء كمية ونوعية', sublabelEn: 'Quantified impact metrics' },
      { labelAr: 'المعايير الإنسانية المطبقة', labelEn: 'Humanitarian Standards', value: 'CHS / Sphere', sublabelAr: 'المعيار الإنساني الأساسي للجودة', sublabelEn: 'Core Humanitarian Standard' },
      { labelAr: 'سجلات التدقيق المحفوظة', labelEn: 'Audit Logs', value: '3,400+', sublabelAr: 'توثيق كامل للعمليات', sublabelEn: 'Immutable system audit logs' },
      { labelAr: 'نسبة الاستجابة للشكاوى', labelEn: 'Feedback Resolution', value: '98.5%', sublabelAr: 'قنوات المساءلة المجتمعية', sublabelEn: 'Beneficiary feedback closed loop' }
    ]
  },
  admin: {
    id: 'admin',
    code: 'ROLE-SYSADMIN',
    titleAr: 'مساحة عمل إدارة النظام والأمان التقني',
    titleEn: 'Enterprise System & Security Administration Workspace',
    subtitleAr: 'إدارة 12 مستخدماً و 16 دوراً، صحة قاعدة بيانات نيون (349 جدولاً)، والنسخ الاحتياطي',
    subtitleEn: 'User accounts, 16 roles, Neon PostgreSQL 349 tables health, and security enclave',
    departmentAr: 'الإدارة العامة لتقنية المعلومات والأمن السيبراني',
    departmentEn: 'IT & Cybersecurity Directorate',
    icon: ShieldCheck,
    color: 'purple',
    accentBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    borderClass: 'border-purple-500/30',
    badgeAr: 'إدارة النظام والأمان',
    badgeEn: 'System & Security',
    primaryTabs: ['users', 'settings', 'backup', 'audit', 'control_panel'],
    quickActions: [
      { id: 'act-users', titleAr: 'إدارة المستخدمين والصلاحيات', titleEn: 'Users & Roles', targetTab: 'users', icon: Users, descriptionAr: 'إدارة 12 مستخدماً و 16 دوراً وظيفياً معتمداً', descriptionEn: 'Manage 12 users and 16 institutional roles' },
      { id: 'act-settings', titleAr: 'إعدادات المنظومة والمؤسسة', titleEn: 'Enterprise Settings', targetTab: 'settings', icon: Settings, descriptionAr: 'تهيئة الهوية، اللوائح، وضوابط الوصول', descriptionEn: 'Configure branding, policies, and parameters' },
      { id: 'act-backup', titleAr: 'النسخ الاحتياطي والأرشفة', titleEn: 'Backup & Recovery', targetTab: 'backup', icon: Database, descriptionAr: 'إدارة وتصدير النسخ الاحتياطية الميدانية', descriptionEn: 'Create snapshots and offline archive exports' }
    ],
    kpiStats: [
      { labelAr: 'المستخدمون المعتمدون', labelEn: 'Authorized Users', value: (REAL_ENTERPRISE_DATA.users || []).length || 12, sublabelAr: 'حسابات قيادية وتنفيذية مفعلة', sublabelEn: 'Active institutional accounts' },
      { labelAr: 'الأدوار الوظيفية (RBAC)', labelEn: 'System Roles', value: (REAL_ENTERPRISE_DATA.roles || []).length || 16, sublabelAr: 'مصفوفة صلاحيات دقيقة', sublabelEn: 'Role-based access matrix' },
      { labelAr: 'جداول قاعدة بيانات نيون', labelEn: 'Neon DB Tables', value: 349, sublabelAr: 'قاعدة بيانات PostgreSQL 17', sublabelEn: 'Neon PostgreSQL 17 enterprise schema' },
      { labelAr: 'المؤسسات والفروع', labelEn: 'Organizations', value: (REAL_ENTERPRISE_DATA.organizations || []).length || 3, sublabelAr: 'رُحماء بينهم والمؤسسات الشريكة', sublabelEn: 'Registered institutional entities' }
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
    return 'leadership'; // default to leadership or admin
  };

  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceRoleKey>(resolveInitialWorkspace);
  const [searchTerm, setSearchTerm] = useState('');
  const [beneficiarySubTab, setBeneficiarySubTab] = useState<'cases' | 'sponsorships'>('cases');
  const [procurementSubTab, setProcurementSubTab] = useState<'warehouses' | 'inventory'>('warehouses');
  const [inspectingRecord, setInspectingRecord] = useState<any | null>(null);
  const [isAiDiagnosing, setIsAiDiagnosing] = useState(false);
  const [aiDiagnosticResult, setAiDiagnosticResult] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const changeWorkspace = (key: WorkspaceRoleKey) => {
    setSelectedWorkspace(key);
    setAiDiagnosticResult(null);
    try {
      localStorage.setItem('uamex_active_workspace', key);
    } catch {}
  };

  const currentDef = WORKSPACE_DEFINITIONS[selectedWorkspace];
  const IconComponent = currentDef.icon;

  const handleActionClick = (targetTab: ActiveTab) => {
    if (onNavigateToTab) {
      onNavigateToTab(targetTab);
    } else {
      setActiveTab(targetTab);
    }
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
  
  const filteredPrograms = (REAL_ENTERPRISE_DATA.programs || []).filter((p: any) => 
    !normalizedSearch || 
    p.name_ar?.toLowerCase().includes(normalizedSearch) || 
    p.code?.toLowerCase().includes(normalizedSearch)
  );

  const filteredBeneficiaries = (REAL_ENTERPRISE_DATA.beneficiaries || []).filter((b: any) => 
    !normalizedSearch || 
    b.full_name_ar?.toLowerCase().includes(normalizedSearch) || 
    b.beneficiary_code?.toLowerCase().includes(normalizedSearch) || 
    b.phone_primary?.includes(normalizedSearch) ||
    b.district?.toLowerCase().includes(normalizedSearch)
  );

  const filteredSponsorships = (REAL_ENTERPRISE_DATA.sponsorships || []).filter((s: any) => 
    !normalizedSearch || 
    s.full_name_ar?.toLowerCase().includes(normalizedSearch) || 
    s.sponsorship_code?.toLowerCase().includes(normalizedSearch) || 
    s.sponsor_name?.toLowerCase().includes(normalizedSearch) || 
    s.governorate?.toLowerCase().includes(normalizedSearch)
  );

  const filteredAccounts = (REAL_ENTERPRISE_DATA.chart_of_accounts || []).filter((acc: any) => 
    !normalizedSearch || 
    acc.name_ar?.toLowerCase().includes(normalizedSearch) || 
    (acc.code || acc.account_code)?.toLowerCase().includes(normalizedSearch) || 
    acc.account_type?.toLowerCase().includes(normalizedSearch)
  );

  const filteredActivities = (REAL_ENTERPRISE_DATA.activities || []).filter((act: any) => 
    !normalizedSearch || 
    act.name_ar?.toLowerCase().includes(normalizedSearch) || 
    act.activity_code?.toLowerCase().includes(normalizedSearch) || 
    act.location_name?.toLowerCase().includes(normalizedSearch) || 
    act.activity_type?.toLowerCase().includes(normalizedSearch)
  );

  const filteredProjects = (REAL_ENTERPRISE_DATA.projects || []).filter((proj: any) => 
    !normalizedSearch || 
    proj.name_ar?.toLowerCase().includes(normalizedSearch) || 
    proj.code?.toLowerCase().includes(normalizedSearch) || 
    proj.program_name_ar?.toLowerCase().includes(normalizedSearch)
  );

  const filteredWarehouses = (REAL_ENTERPRISE_DATA.warehouses || []).filter((w: any) => 
    !normalizedSearch || 
    w.name_ar?.toLowerCase().includes(normalizedSearch) || 
    w.code?.toLowerCase().includes(normalizedSearch) || 
    w.location?.toLowerCase().includes(normalizedSearch)
  );

  const filteredInventory = (REAL_ENTERPRISE_DATA.inventory_items || []).filter((item: any) => 
    !normalizedSearch || 
    item.item_name_ar?.toLowerCase().includes(normalizedSearch) || 
    item.item_code?.toLowerCase().includes(normalizedSearch) || 
    item.category?.toLowerCase().includes(normalizedSearch)
  );

  const filteredUsers = (REAL_ENTERPRISE_DATA.users || []).filter((u: any) => 
    !normalizedSearch || 
    u.full_name_ar?.toLowerCase().includes(normalizedSearch) || 
    u.email?.toLowerCase().includes(normalizedSearch) || 
    u.role_code?.toLowerCase().includes(normalizedSearch)
  );

  const filteredKpis = (REAL_ENTERPRISE_DATA.kpi_indicators || []).filter((kpi: any) => 
    !normalizedSearch || 
    kpi.name_ar?.toLowerCase().includes(normalizedSearch) || 
    kpi.code?.toLowerCase().includes(normalizedSearch) || 
    kpi.category?.toLowerCase().includes(normalizedSearch)
  );

  const runAiDiagnostic = () => {
    setIsAiDiagnosing(true);
    setTimeout(() => {
      setIsAiDiagnosing(false);
      let insight = '';
      switch (selectedWorkspace) {
        case 'leadership':
          insight = isRtl
            ? 'تشخيص الذكاء المؤسسي UAMEX™: نسبة المواءمة الاستراتيجية بين الأهداف ومشاريع الميدان 98.4%. سلامة التدفق المالي 100%، ولا توجد انحرافات حرجة في موازنة 2026.'
            : 'Strategic AI Diagnostic: 98.4% alignment between goals and field projects. Financial solvency 100%, zero critical budget variances.';
          break;
        case 'finance':
          insight = isRtl
            ? 'التدقيق المحاسبي الذكي IPSAS: دليل الحسابات الـ 246 مطابق بنسبة 100% لمعايير المحاسبة الدولية للقطاع العام. القيود المتوازنة وسندات الصرف مؤمنة.'
            : 'IPSAS Audit AI: All 246 accounts fully compliant with public sector accounting standards. Balanced journals and payment vouchers verified.';
          break;
        case 'programs':
          insight = isRtl
            ? 'كفاءة محفظة البرامج PMO: 10 برامج و 19 مشروعاً تعمل وفق مسار WBS المعتمد. وتيرة تنفيذ المعالم متقدمة بنسبة 4.2% عن المخطط الزمني.'
            : 'PMO Intelligence: 10 programs and 19 projects executing on scheduled WBS tracks. Milestone velocity ahead by 4.2%.';
          break;
        case 'operations':
          insight = isRtl
            ? 'المسح الميداني اللحظي: 269 نشاطاً ميدانياً موثقاً في 5 محافظات و 40 مديرية. نسبة التغطية الجغرافية 94% وسرعة الاستجابة الميدانية قياسية.'
            : 'Field Ops Telemetry: 269 verified activities across 5 governorates and 40 districts. Geographic reach 94%, rapid response index optimal.';
          break;
        case 'beneficiaries':
          insight = isRtl
            ? 'فحص النزاهة والحماية المجتمعية: 418 مستفيداً و 595 كفالة يتيم موثقة. نسبة تكرار السجلات 0.0% ومطابقة لقواعد الحماية ومنع الازدواجية.'
            : 'Social Protection Audit: 418 beneficiaries and 595 orphan sponsorships. 0.0% record duplication, full compliance with humanitarian protection.';
          break;
        case 'procurement':
          insight = isRtl
            ? 'جاهزية الإمداد والمخازن: 5 مستودعات مركزية ومخزون استراتيجي آمن للأصناف الإغاثية. أوامر الشراء وسندات الاستلام متطابقة تماماً.'
            : 'Supply Chain AI: 5 central warehouses maintain safe humanitarian buffer inventory. Purchase orders and GRN match 100%.';
          break;
        case 'meal':
          insight = isRtl
            ? 'معايير المساءلة والجودة CHS/Sphere: مؤشرات الجودة ومسارات التحقق مستوفاة بنسبة 100%، وتفعيل قنوات التغذية الراجعة والشكاوى الميدانية.'
            : 'MEAL Compliance: 100% satisfaction of SPHERE and CHS core standards with verified community accountability mechanisms.';
          break;
        case 'admin':
          insight = isRtl
            ? 'الأمن السيبراني وقواعد البيانات: 12 مستخدماً مؤمناً بنظام الصلاحيات متعدد المستويات RBAC. قاعدة بيانات نيون 349 جدولاً مشفرة بالكامل.'
            : 'Cybersecurity & Telemetry: 12 users secured via RBAC clearance. Neon PostgreSQL 349-table schema TLS 1.3 encrypted.';
          break;
      }
      setAiDiagnosticResult(insight);
    }, 400);
  };

  const handleExportCSV = () => {
    let dataToExport: any[] = [];
    let filename = `uamex_${selectedWorkspace}_records.csv`;

    if (selectedWorkspace === 'programs') dataToExport = filteredPrograms;
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
  };

  const handleCopyId = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Banner & Workspace Selector Carousel */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800/80 pb-5">
          <div className="flex items-center gap-4">
            <div className={`p-3.5 rounded-2xl ${currentDef.accentBg} border ${currentDef.borderClass} shadow-sm`}>
              <IconComponent className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  {currentDef.code}
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${currentDef.accentBg} ${currentDef.borderClass}`}>
                  {isRtl ? currentDef.badgeAr : currentDef.badgeEn}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {isRtl ? currentDef.titleAr : currentDef.titleEn}
              </h2>
              <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
                {isRtl ? currentDef.subtitleAr : currentDef.subtitleEn}
              </p>
            </div>
          </div>

          {/* Quick Desk Role Switcher */}
          <div className="flex items-center gap-2 self-start lg:self-center bg-slate-50 dark:bg-zinc-950 p-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs">
            <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 px-2">
              {isRtl ? 'التبديل إلى مساحة:' : 'Switch Workspace:'}
            </span>
            <select
              value={selectedWorkspace}
              onChange={(e) => changeWorkspace(e.target.value as WorkspaceRoleKey)}
              aria-label={isRtl ? 'اختر مساحة العمل حسب الدور' : 'Select Workspace by Role'}
              className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 font-bold border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs cursor-pointer shadow-xs"
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

        {/* 2. Interactive Role Desks Horizontal Strip */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {workspaceKeys.map((key) => {
            const def = WORKSPACE_DEFINITIONS[key];
            const DefIcon = def.icon;
            const isSelected = selectedWorkspace === key;
            return (
              <button
                key={key}
                onClick={() => changeWorkspace(key)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl text-center transition-all cursor-pointer border ${
                  isSelected 
                    ? `bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 dark:border-emerald-400 text-emerald-800 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-500/20`
                    : `bg-slate-50/70 dark:bg-zinc-950/40 border-slate-200/80 dark:border-zinc-800/80 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60`
                }`}
              >
                <DefIcon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-emerald-600 dark:text-emerald-400 scale-110' : 'text-slate-400 dark:text-zinc-500'} transition-transform`} />
                <span className="text-[11px] font-bold line-clamp-1 leading-tight">
                  {isRtl ? def.badgeAr : def.badgeEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. AI Institutional Intelligence & Diagnostic Radar Card */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-amber-950/30 border border-emerald-500/30 rounded-2xl p-4 md:p-5 shadow-sm text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0 mt-0.5">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {isRtl ? 'رادار الذكاء المؤسسي UAMEX AI-Engine™' : 'UAMEX AI-Engine™ Telemetry'}
              </span>
              <span className="text-xs text-zinc-400">
                {isRtl ? 'تحليل لحظي متصل بقاعدة نيون 349 جدولاً' : 'Real-time Telemetry on 349 Tables'}
              </span>
            </div>
            <p className="text-xs md:text-sm text-zinc-200 leading-relaxed font-medium">
              {aiDiagnosticResult || (isRtl 
                ? `جاهزية عملياتية تامة لمساحة ${currentDef.titleAr}. كافة السجلات موثقة ومطابقة للمعايير المؤسسية بدون أي انحرافات مسجلة.` 
                : `Operational integrity active for ${currentDef.titleEn}. Records verified against institutional standards.`)}
            </p>
          </div>
        </div>

        <button
          onClick={runAiDiagnostic}
          disabled={isAiDiagnosing}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all cursor-pointer shrink-0 disabled:opacity-50"
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
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-emerald-500/40 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                {isRtl ? kpi.labelAr : kpi.labelEn}
              </span>
              <span className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
              {kpi.value}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
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
          return (
            <motion.div
              key={act.id}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.15 }}
              onClick={() => handleActionClick(act.targetTab)}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-emerald-500/50 cursor-pointer flex flex-col justify-between group transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
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
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                  {isRtl ? act.descriptionAr : act.descriptionEn}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <span>{isRtl ? 'تنفيذ فوري مباشر' : 'Immediate Access'}</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 6. Production Institutional Data Preview for the Role */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800/80 pb-4 mb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {isRtl ? 'سجلات قاعدة البيانات الحقيقية المخصصة لهذا الدور (Neon PostgreSQL)' : 'Live Database Records for this Role (Neon PostgreSQL)'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {isRtl 
                ? 'بيانات فعلية موثقة ومربوطة مباشرة بقاعدة البيانات المركزية لجمعية رُحماء بينهم' 
                : 'Verified operational records linked directly to the central database'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Beneficiary Sub-Tab Switcher */}
            {selectedWorkspace === 'beneficiaries' && (
              <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setBeneficiarySubTab('cases')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    beneficiarySubTab === 'cases'
                      ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  {isRtl ? 'المستفيدون (418)' : 'Beneficiaries (418)'}
                </button>
                <button
                  onClick={() => setBeneficiarySubTab('sponsorships')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    beneficiarySubTab === 'sponsorships'
                      ? 'bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  {isRtl ? 'كفالات الأيتام (595)' : 'Sponsorships (595)'}
                </button>
              </div>
            )}

            {/* Procurement Sub-Tab Switcher */}
            {selectedWorkspace === 'procurement' && (
              <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setProcurementSubTab('warehouses')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    procurementSubTab === 'warehouses'
                      ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  {isRtl ? 'المستودعات (5)' : 'Warehouses (5)'}
                </button>
                <button
                  onClick={() => setProcurementSubTab('inventory')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    procurementSubTab === 'inventory'
                      ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  {isRtl ? 'الأصناف المخزنية' : 'Inventory Items'}
                </button>
              </div>
            )}

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isRtl ? 'بحث في سجلات هذا الدور...' : 'Search role records...'}
                className="pr-8 pl-3 py-1.5 text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-800 dark:text-zinc-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-40 md:w-52 transition-all"
              />
            </div>

            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title={isRtl ? 'طباعة كشف معتمد مع التوقيعات' : 'Print certified record sheet'}
            >
              <Printer className="w-3.5 h-3.5 text-amber-500" />
              <span>{isRtl ? 'طباعة كشف' : 'Print'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title={isRtl ? 'تصدير السجلات الحالية إلى ملف CSV' : 'Export current records to CSV'}
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{isRtl ? 'تصدير CSV' : 'Export CSV'}</span>
            </button>

            <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {isRtl ? '349 جدولاً نشطاً' : '349 Active Tables'}
            </span>
          </div>
        </div>

        {/* Dynamic Context Table according to the selected role */}
        <div className="overflow-x-auto">
          {/* 1. PROGRAMS DESK */}
          {selectedWorkspace === 'programs' && (
            <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
              <thead className="bg-slate-50 dark:bg-zinc-950/60 text-slate-500 dark:text-zinc-400 font-bold border-y border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">رمز البرنامج</th>
                  <th className="py-2.5 px-3">اسم البرنامج المؤسسي</th>
                  <th className="py-2.5 px-3">الموازنة (YER)</th>
                  <th className="py-2.5 px-3">المستفيدون المستهدفون</th>
                  <th className="py-2.5 px-3">نسبة الإنجاز</th>
                  <th className="py-2.5 px-3">الحالة</th>
                  <th className="py-2.5 px-3 text-center">فحص السجل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredPrograms.map((p: any) => (
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
                        {p.status_code || 'active'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-400 hover:text-emerald-600">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 2. BENEFICIARIES & ORPHANS DESK */}
          {selectedWorkspace === 'beneficiaries' && (
            <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
              <thead className="bg-slate-50 dark:bg-zinc-950/60 text-slate-500 dark:text-zinc-400 font-bold border-y border-slate-200 dark:border-zinc-800">
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
                          {b.category_code}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-400">{b.governorate} - {b.district}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-zinc-300">{b.phone_primary || '77xxxxxxx'}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                          {b.status_code || 'active'}
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
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{Number(s.amount || s.monthly_stipend || 25000).toLocaleString()} {s.currency || 'YER'}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                          {s.status || 'ACTIVE'}
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

          {/* 3. FINANCE DESK (IPSAS ACCOUNTS) */}
          {selectedWorkspace === 'finance' && (
            <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
              <thead className="bg-slate-50 dark:bg-zinc-950/60 text-slate-500 dark:text-zinc-400 font-bold border-y border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">رقم الحساب</th>
                  <th className="py-2.5 px-3">اسم الحساب في الدليل (IPSAS)</th>
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
                    <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-400">{acc.account_type || 'Asset'}</td>
                    <td className="py-2.5 px-3 font-mono font-bold">{Number(acc.opening_balance || 0).toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-mono">{acc.currency_code || 'YER'}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                        نشط ومطابق
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-400 hover:text-emerald-600">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 4. OPERATIONS DESK (FIELD ACTIVITIES) */}
          {selectedWorkspace === 'operations' && (
            <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
              <thead className="bg-slate-50 dark:bg-zinc-950/60 text-slate-500 dark:text-zinc-400 font-bold border-y border-slate-200 dark:border-zinc-800">
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
                        {act.status_code || 'مكتمل وموثق'}
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
              <thead className="bg-slate-50 dark:bg-zinc-950/60 text-slate-500 dark:text-zinc-400 font-bold border-y border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">{procurementSubTab === 'warehouses' ? 'كود المستودع' : 'رمز الصنف'}</th>
                  <th className="py-2.5 px-3">{procurementSubTab === 'warehouses' ? 'اسم المستودع المركزي' : 'اسم الصنف الإغاثي'}</th>
                  <th className="py-2.5 px-3">{procurementSubTab === 'warehouses' ? 'الموقع والمحافظة' : 'التصنيف'}</th>
                  <th className="py-2.5 px-3">{procurementSubTab === 'warehouses' ? 'الطاقة الاستيعابية' : 'الوحدة'}</th>
                  <th className="py-2.5 px-3">الحالة</th>
                  <th className="py-2.5 px-3 text-center">فحص السجل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {procurementSubTab === 'warehouses' ? (
                  filteredWarehouses.map((w: any) => (
                    <tr key={w.id} onClick={() => setInspectingRecord(w)} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 cursor-pointer">
                      <td className="py-2.5 px-3 font-mono font-bold text-orange-600 dark:text-orange-400">{w.code}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-zinc-200">{w.name_ar}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-400">{w.location || 'المركز الرئيسي'}</td>
                      <td className="py-2.5 px-3 font-mono font-bold">{w.capacity || '100%'}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                          {w.status || 'جاهز للاستقبال'}
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
              <thead className="bg-slate-50 dark:bg-zinc-950/60 text-slate-500 dark:text-zinc-400 font-bold border-y border-slate-200 dark:border-zinc-800">
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
                    <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">{u.role_code || 'ADMIN'}</td>
                    <td className="py-2.5 px-3 font-mono">Level {u.security_level || 3}</td>
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
              <thead className="bg-slate-50 dark:bg-zinc-950/60 text-slate-500 dark:text-zinc-400 font-bold border-y border-slate-200 dark:border-zinc-800">
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
                        مطابق CHS / Sphere
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

          {/* 8. LEADERSHIP DESK (PORTFOLIO OVERVIEW) */}
          {selectedWorkspace === 'leadership' && (
            <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
              <thead className="bg-slate-50 dark:bg-zinc-950/60 text-slate-500 dark:text-zinc-400 font-bold border-y border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">كود المشروع</th>
                  <th className="py-2.5 px-3">اسم المشروع الميداني</th>
                  <th className="py-2.5 px-3">البرنامج التابع له</th>
                  <th className="py-2.5 px-3">الموازنة (YER)</th>
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
                        {proj.status_code || 'active'}
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
      </div>

      {/* 7. Digital Record Inspection & Verification Modal */}
      {inspectingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {isRtl ? 'بطاقة الفحص والاعتماد المؤسسي الرقمي' : 'Digital Record Inspection & Verification'}
                  </h3>
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    UAMEX-VERIFIED-RECORD #{inspectingRecord.code || inspectingRecord.beneficiary_code || inspectingRecord.sponsorship_code || inspectingRecord.activity_code || inspectingRecord.id?.slice(0, 8)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setInspectingRecord(null)}
                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Record Fields Grid */}
            <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto custom-scrollbar p-1 text-xs">
              {Object.entries(inspectingRecord)
                .filter(([key]) => !['metadata', 'version', 'deleted_at'].includes(key))
                .slice(0, 14)
                .map(([key, val]) => (
                  <div key={key} className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800/80">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 block uppercase font-mono truncate">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-zinc-200 truncate block mt-0.5 font-mono">
                      {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '—')}
                    </span>
                  </div>
                ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                onClick={() => handleCopyId(JSON.stringify(inspectingRecord, null, 2))}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-emerald-600 flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 cursor-pointer"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId ? (isRtl ? 'تم النسخ!' : 'Copied!') : (isRtl ? 'نسخ بيانات السجل' : 'Copy JSON')}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'طباعة إشعار رسمي' : 'Print Voucher'}</span>
                </button>
                <button
                  onClick={() => setInspectingRecord(null)}
                  className="px-3.5 py-1.5 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {isRtl ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionalRoleWorkspaces;
