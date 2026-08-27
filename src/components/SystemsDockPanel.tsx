import React, { useState, useMemo } from 'react';
import { 
  Grid, Pin, PinOff, Search, ChevronRight, ChevronLeft, 
  Layers, Briefcase, Compass, Users, Heart, Brain, Coins, 
  ShieldCheck, Settings, Database, Activity, Sliders,
  Maximize2, Minimize2, CheckCircle2, X, Calendar, Globe,
  BookOpen, PlayCircle, TrendingUp, Sparkles, Filter, ChevronDown,
  FileCheck, Building2, Calculator, PackageCheck, Handshake
} from 'lucide-react';
import { useEnterprise } from '../core/context/EnterpriseContext';

import { ActiveTab } from '../core/types/dashboard';
export type { ActiveTab };

interface SystemsDockPanelProps {
  lang: 'ar' | 'en';
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  isDockPinned: boolean;
  onToggleDockPin: () => void;
  isMobileMode?: boolean;
  onOpenCopilot?: () => void;
  onOpenDocs?: () => void;
  onOpenScenarios?: () => void;
  onOpenHelpers?: () => void;
}

export interface SystemItem {
  id: string;
  tab: ActiveTab;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  suiteId: 'strategy' | 'ops' | 'services' | 'finance' | 'governance';
  suiteAr: string;
  suiteEn: string;
  icon: any;
  statusAr: string;
  statusEn: string;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
}

export const SystemsDockPanel: React.FC<SystemsDockPanelProps> = ({
  lang,
  activeTab,
  onNavigate,
  isDockPinned,
  onToggleDockPin,
  isMobileMode = false,
  onOpenCopilot,
  onOpenDocs,
  onOpenScenarios,
  onOpenHelpers
}) => {
  const isRtl = lang === 'ar';
  const { activeRolePerspective } = useEnterprise();

  const allowedTabsByPerspective = useMemo(() => {
    switch (activeRolePerspective) {
      case 'executive':
        return [
          'strategic_planning', 'dashboard', 'domains', 'programs',
          'investments', 'finance', 'currencies', 'reports',
          'approvals', 'docs', 'scenarios', 'hr_dashboard', 'third-party-network'
        ];
      case 'manager':
        return [
          'programs', 'projects', 'activities', 'investments', 'finance',
          'currencies', 'contracts', 'inventory', 'approvals', 'users', 'control_panel',
          'settings', 'audit', 'backup', 'docs', 'scenarios', 'hr_dashboard', 'third-party-network'
        ];
      case 'field':
        return [
          'projects', 'activities', 'geospatial', 'allocations',
          'beneficiaries', 'sponsorships', 'inventory', 'docs', 'scenarios'
        ];
      default:
        return [];
    }
  }, [activeRolePerspective]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSuite, setSelectedSuite] = useState<string>('all');
  const [collapsedSuites, setCollapsedSuites] = useState<Record<string, boolean>>({});

  const isCompact = isMobileMode ? false : !isDockPinned;

  // Enterprise Systems Registry
  const allSystems: SystemItem[] = useMemo(() => [
    // 1. Strategy & Planning Suite
    {
      id: 'sys-strategic-plan',
      tab: 'strategic_planning',
      titleAr: 'التخطيط الاستراتيجي والمؤشرات',
      titleEn: 'Strategic Planning & KPIs',
      descAr: 'الخطة الاستراتيجية الخمسية، مصفوفة التحليل ومؤشرات القياس',
      descEn: '5-Year Strategic Goals & Database Integration',
      suiteId: 'strategy',
      suiteAr: 'الاستراتيجية والتخطيط',
      suiteEn: 'Strategy & Planning',
      icon: Activity,
      statusAr: 'استراتيجي',
      statusEn: 'Strategic',
      accentColor: 'emerald',
      badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      badgeText: 'text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'sys-strategy',
      tab: 'dashboard',
      titleAr: 'لوحة القيادة والمؤشرات العامة',
      titleEn: 'Strategy & Performance',
      descAr: 'المؤشرات الرئيسية والأداء الاستراتيجي المؤسسي الشامل',
      descEn: 'Strategic KPIs & Balanced Scorecards',
      suiteId: 'strategy',
      suiteAr: 'الاستراتيجية والتخطيط',
      suiteEn: 'Strategy & Planning',
      icon: Activity,
      statusAr: 'قيادي',
      statusEn: 'Executive',
      accentColor: 'emerald',
      badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      badgeText: 'text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'sys-domains',
      tab: 'domains',
      titleAr: 'نطاقات العمل المؤسسية',
      titleEn: 'Enterprise Domains',
      descAr: 'الإشراف على النطاقات التشغيلية التنموية وحوكمتها',
      descEn: 'Development Portfolios Overview',
      suiteId: 'strategy',
      suiteAr: 'الاستراتيجية والتخطيط',
      suiteEn: 'Strategy & Planning',
      icon: Compass,
      statusAr: 'مركزي',
      statusEn: 'Active',
      accentColor: 'amber',
      badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
      badgeText: 'text-amber-700 dark:text-amber-400 border-amber-500/20'
    },
    {
      id: 'sys-programs',
      tab: 'programs',
      titleAr: 'البرامج التنموية والإنسانية',
      titleEn: 'Program Management',
      descAr: 'إدارة البرامج التنموية والميزانيات المرتبطة والخطط',
      descEn: 'Programs & Strategic Initiatives',
      suiteId: 'strategy',
      suiteAr: 'الاستراتيجية والتخطيط',
      suiteEn: 'Strategy & Planning',
      icon: Briefcase,
      statusAr: 'معتمد',
      statusEn: 'Approved',
      accentColor: 'emerald',
      badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      badgeText: 'text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
    },

    // 2. Operations & Field Execution Suite
    {
      id: 'sys-projects',
      tab: 'projects',
      titleAr: 'المشاريع الميدانية التنفيذية',
      titleEn: 'Field Project Operations',
      descAr: 'متابعة تنفيذ المشاريع ونسب الإنجاز الفعلي والميداني',
      descEn: 'Field Projects & Milestones',
      suiteId: 'ops',
      suiteAr: 'التشغيل والميدان',
      suiteEn: 'Operations & Field',
      icon: Layers,
      statusAr: 'ميداني',
      statusEn: 'Field',
      accentColor: 'emerald',
      badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      badgeText: 'text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'sys-activities',
      tab: 'activities',
      titleAr: 'الأنشطة والمهام التشغيلية',
      titleEn: 'Operational Activities',
      descAr: 'جدولة المهام التنفيذية والمخرجات الميدانية',
      descEn: 'Work Breakdown & Outputs',
      suiteId: 'ops',
      suiteAr: 'التشغيل والميدان',
      suiteEn: 'Operations & Field',
      icon: CheckCircle2,
      statusAr: 'تشغيلي',
      statusEn: 'Operational',
      accentColor: 'cyan',
      badgeBg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
      badgeText: 'text-cyan-700 dark:text-cyan-400 border-cyan-500/20'
    },
    {
      id: 'sys-geospatial',
      tab: 'geospatial',
      titleAr: 'الخريطة المكانية وبؤر الاحتياج',
      titleEn: 'Geospatial Field Map',
      descAr: 'الربط الجغرافي وتوزيع التدخلات والمساعدات المكانية',
      descEn: 'Spatial Heatmaps & Geotagging',
      suiteId: 'ops',
      suiteAr: 'التشغيل والميدان',
      suiteEn: 'Operations & Field',
      icon: Globe,
      statusAr: 'مكاني',
      statusEn: 'Spatial',
      accentColor: 'emerald',
      badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      badgeText: 'text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'sys-allocations',
      tab: 'allocations',
      titleAr: 'تخصيص الموارد والفرق الميدانية',
      titleEn: 'Staff & Resource Allocation',
      descAr: 'توزيع الكوادر الفنية والمعدات على مواقع العمل',
      descEn: 'Resource Planning & Workload',
      suiteId: 'ops',
      suiteAr: 'التشغيل والميدان',
      suiteEn: 'Operations & Field',
      icon: Calendar,
      statusAr: 'موارد',
      statusEn: 'Resources',
      accentColor: 'amber',
      badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
      badgeText: 'text-amber-700 dark:text-amber-400 border-amber-500/20'
    },

    // 3. Social Services & Welfare Suite
    {
      id: 'sys-beneficiaries',
      tab: 'beneficiaries',
      titleAr: 'سجل المستفيدين والخدمات',
      titleEn: 'Beneficiaries & Services',
      descAr: 'إدارة سجلات المستفيدين والمسوحات الميدانية والتحقق',
      descEn: 'Beneficiary Registry & Service Log',
      suiteId: 'services',
      suiteAr: 'الخدمات والرعاية',
      suiteEn: 'Services & Welfare',
      icon: Users,
      statusAr: 'خدمي',
      statusEn: 'Service',
      accentColor: 'blue',
      badgeBg: 'bg-blue-500/10 dark:bg-blue-500/20',
      badgeText: 'text-blue-700 dark:text-blue-400 border-blue-500/20'
    },
    {
      id: 'sys-sponsorships',
      tab: 'sponsorships',
      titleAr: 'كفالات الأيتام والرعاية الاجتماعية',
      titleEn: 'Orphan Care & Sponsorships',
      descAr: 'إدارة ملفات الأيتام والأسر المكفولة وتوزيع الكفالات',
      descEn: 'Orphan Care & Social Welfare',
      suiteId: 'services',
      suiteAr: 'الخدمات والرعاية',
      suiteEn: 'Services & Welfare',
      icon: Heart,
      statusAr: 'رعاية',
      statusEn: 'Welfare',
      accentColor: 'rose',
      badgeBg: 'bg-rose-500/10 dark:bg-rose-500/20',
      badgeText: 'text-rose-700 dark:text-rose-400 border-rose-500/20'
    },

    // 4. Finance, Assets & Impact Analytics Suite
    {
      id: 'sys-investments',
      tab: 'investments',
      titleAr: 'المشاريع الاستثمارية والأوقاف التنموية',
      titleEn: 'Investment & Endowment OS',
      descAr: 'إدارة الأوقاف التنموية، عوائد الاستثمار والاستدامة المالية',
      descEn: 'Endowment Investments & Yield Distribution',
      suiteId: 'finance',
      suiteAr: 'المالية والأثر',
      suiteEn: 'Finance & Impact',
      icon: TrendingUp,
      statusAr: 'استثمار',
      statusEn: 'Endowment',
      accentColor: 'amber',
      badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
      badgeText: 'text-amber-700 dark:text-amber-400 border-amber-500/20'
    },
    {
      id: 'sys-finance',
      tab: 'finance',
      titleAr: 'المالية ودفتر الأستاذ العام',
      titleEn: 'Finance & General Ledger',
      descAr: 'دليل الحسابات المعتمد، قيود اليومية وميزان المراجعة',
      descEn: 'Chart of Accounts & General Ledger',
      suiteId: 'finance',
      suiteAr: 'المالية والأثر',
      suiteEn: 'Finance & Impact',
      icon: Coins,
      statusAr: 'محاسبة',
      statusEn: 'Ledger',
      accentColor: 'emerald',
      badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      badgeText: 'text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'sys-currencies',
      tab: 'currencies',
      titleAr: 'العملات وأسعار الصرف',
      titleEn: 'Currencies & Exchange Rates',
      descAr: 'إدارة العملات وأسعار الصرف والتحويلات المالية',
      descEn: 'Multi-currency & FX Rates',
      suiteId: 'finance',
      suiteAr: 'المالية والأثر',
      suiteEn: 'Finance & Impact',
      icon: Coins,
      statusAr: 'عملات',
      statusEn: 'Forex',
      accentColor: 'amber',
      badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
      badgeText: 'text-amber-700 dark:text-amber-400 border-amber-500/20'
    },
    {
      id: 'sys-contracts',
      tab: 'contracts',
      titleAr: 'العقود والاتفاقيات الرسمية',
      titleEn: 'Contracts & Agreements',
      descAr: 'عقود التوريد والمقاولات واتفاقيات الشركاء والمنح',
      descEn: 'Procurement contracts, renewals & payment milestones',
      suiteId: 'finance',
      suiteAr: 'المالية والأثر',
      suiteEn: 'Finance & Impact',
      icon: FileCheck,
      statusAr: 'عقود',
      statusEn: 'Contracts',
      accentColor: 'emerald',
      badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      badgeText: 'text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'sys-reports',
      tab: 'reports',
      titleAr: 'التقارير المؤسسية الشاملة',
      titleEn: 'Institutional Reports',
      descAr: 'التقارير التحليلية والمخرجات الرسمية القابلة للطباعة',
      descEn: 'Analytics, printable statements & impact logs',
      suiteId: 'finance',
      suiteAr: 'المالية والأثر',
      suiteEn: 'Finance & Impact',
      icon: Brain,
      statusAr: 'تقارير',
      statusEn: 'Reports',
      accentColor: 'purple',
      badgeBg: 'bg-purple-500/10 dark:bg-purple-500/20',
      badgeText: 'text-purple-700 dark:text-purple-400 border-purple-500/20'
    },

    // 5. Governance & Platform Core Suite
    {
      id: 'sys-approvals',
      tab: 'approvals',
      titleAr: 'سلسلة الموافقات والاعتمادات',
      titleEn: 'Approval Workflows',
      descAr: 'الموافقات المالية والإدارية متعددة المستويات',
      descEn: 'Multi-level Authorization Engine',
      suiteId: 'governance',
      suiteAr: 'الحوكمة والنظام',
      suiteEn: 'Governance & Core',
      icon: ShieldCheck,
      statusAr: 'اعتمادات',
      statusEn: 'Approvals',
      accentColor: 'emerald',
      badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      badgeText: 'text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'sys-hr-dashboard',
      tab: 'hr_dashboard',
      titleAr: 'الموارد البشرية والكوادر',
      titleEn: 'Human Resources & Talent',
      descAr: 'الملفات الوظيفية، مسيرات الرواتب والعهد الميدانية',
      descEn: 'Performance dashboard, payroll & staff ledger',
      suiteId: 'governance',
      suiteAr: 'الحوكمة والنظام',
      suiteEn: 'Governance & Core',
      icon: Users,
      statusAr: 'كوادر',
      statusEn: 'HR',
      accentColor: 'emerald',
      badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      badgeText: 'text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'sys-inventory',
      tab: 'inventory',
      titleAr: 'المستودعات وإدارة المخزون',
      titleEn: 'Warehouse & Inventory OS',
      descAr: 'إدارة المخازن المركزية، الأصناف وسندات الاستلام والصرف',
      descEn: 'Central Warehouses, stock items & dispatch receipts',
      suiteId: 'governance',
      suiteAr: 'الحوكمة والنظام',
      suiteEn: 'Governance & Core',
      icon: PackageCheck,
      statusAr: 'مستودعات',
      statusEn: 'Stock',
      accentColor: 'emerald',
      badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      badgeText: 'text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'sys-third-party',
      tab: 'third-party-network',
      titleAr: 'شبكة الشركاء والجهات الداعمة',
      titleEn: 'Partner & Donor Network',
      descAr: 'سجل المانحين والمنظمات الدولية والجهات الشريكة',
      descEn: 'Donors, international partners & collaborative registry',
      suiteId: 'governance',
      suiteAr: 'الحوكمة والنظام',
      suiteEn: 'Governance & Core',
      icon: Handshake,
      statusAr: 'شركاء',
      statusEn: 'Partners',
      accentColor: 'blue',
      badgeBg: 'bg-blue-500/10 dark:bg-blue-500/20',
      badgeText: 'text-blue-700 dark:text-blue-400 border-blue-500/20'
    },
    {
      id: 'sys-users',
      tab: 'users',
      titleAr: 'المستخدمون ومصفوفة الصلاحيات',
      titleEn: 'Users & Permissions',
      descAr: 'إدارة حسابات الكادر المؤسسي ومستويات الأمان والاعتمادات',
      descEn: 'Role-Based Access Control',
      suiteId: 'governance',
      suiteAr: 'الحوكمة والنظام',
      suiteEn: 'Governance & Core',
      icon: Users,
      statusAr: 'صلاحيات',
      statusEn: 'RBAC',
      accentColor: 'indigo',
      badgeBg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
      badgeText: 'text-indigo-700 dark:text-indigo-400 border-indigo-500/20'
    },
    {
      id: 'sys-control-panel',
      tab: 'control_panel',
      titleAr: 'لوحة التحكم والمراقبة المركزية',
      titleEn: 'Control Panel & Console',
      descAr: 'مراقبة أداء الخوادم، قواعد البيانات السحابية وحالة الربط',
      descEn: 'Cloud Engine & System Switches',
      suiteId: 'governance',
      suiteAr: 'الحوكمة والنظام',
      suiteEn: 'Governance & Core',
      icon: Sliders,
      statusAr: 'تحكم',
      statusEn: 'Console',
      accentColor: 'amber',
      badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
      badgeText: 'text-amber-700 dark:text-amber-400 border-amber-500/20'
    },
    {
      id: 'sys-settings',
      tab: 'settings',
      titleAr: 'الإعدادات العامة والسياسات',
      titleEn: 'Platform Settings',
      descAr: 'إعدادات المنظومة، هوية المؤسسة، التراخيص والضوابط',
      descEn: 'Enterprise Identity & Config',
      suiteId: 'governance',
      suiteAr: 'الحوكمة والنظام',
      suiteEn: 'Governance & Core',
      icon: Settings,
      statusAr: 'إعدادات',
      statusEn: 'Settings',
      accentColor: 'slate',
      badgeBg: 'bg-slate-500/10 dark:bg-slate-500/20',
      badgeText: 'text-slate-700 dark:text-slate-300 border-slate-500/20'
    },
    {
      id: 'sys-audit',
      tab: 'audit',
      titleAr: 'سجل التدقيق والأمان المؤسسي',
      titleEn: 'Audit & Compliance Logs',
      descAr: 'سجل العمليات الإدارية والرقابة على الحركات الحساسة',
      descEn: 'Immutable System Audit Trail',
      suiteId: 'governance',
      suiteAr: 'الحوكمة والنظام',
      suiteEn: 'Governance & Core',
      icon: Database,
      statusAr: 'تدقيق',
      statusEn: 'Audit',
      accentColor: 'slate',
      badgeBg: 'bg-slate-500/10 dark:bg-slate-500/20',
      badgeText: 'text-slate-700 dark:text-slate-300 border-slate-500/20'
    },
    {
      id: 'sys-backup',
      tab: 'backup',
      titleAr: 'النسخ الاحتياطي واستعادة البيانات',
      titleEn: 'Backup & Recovery',
      descAr: 'إدارة النسخ الاحتياطية وتأمين قواعد البيانات السحابية',
      descEn: 'Database Backups & Disaster Recovery',
      suiteId: 'governance',
      suiteAr: 'الحوكمة والنظام',
      suiteEn: 'Governance & Core',
      icon: Database,
      statusAr: 'نسخ أمان',
      statusEn: 'Backup',
      accentColor: 'slate',
      badgeBg: 'bg-slate-500/10 dark:bg-slate-500/20',
      badgeText: 'text-slate-700 dark:text-slate-300 border-slate-500/20'
    },
    {
      id: 'sys-docs',
      tab: 'docs',
      titleAr: 'دليل الاستخدام واللوائح المؤسسية',
      titleEn: 'SOP & Knowledge Base',
      descAr: 'الأدلة الإجرائية واللوائح والسياسات التشغيلية الداخلية',
      descEn: 'Operating Manuals & Governance',
      suiteId: 'governance',
      suiteAr: 'الحوكمة والنظام',
      suiteEn: 'Governance & Core',
      icon: BookOpen,
      statusAr: 'لوائح',
      statusEn: 'Docs',
      accentColor: 'sky',
      badgeBg: 'bg-sky-500/10 dark:bg-sky-500/20',
      badgeText: 'text-sky-700 dark:text-sky-400 border-sky-500/20'
    },
    {
      id: 'sys-scenarios',
      tab: 'scenarios',
      titleAr: 'سيناريوهات العمليات التشغيلية',
      titleEn: 'Operational Playbooks',
      descAr: 'محاكاة الأزمات وإجراءات الاستجابة الميدانية السريعة',
      descEn: 'Emergency Response Playbooks',
      suiteId: 'governance',
      suiteAr: 'الحوكمة والنظام',
      suiteEn: 'Governance & Core',
      icon: PlayCircle,
      statusAr: 'سيناريو',
      statusEn: 'Playbooks',
      accentColor: 'amber',
      badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
      badgeText: 'text-amber-700 dark:text-amber-400 border-amber-500/20'
    }
  ], []);

  // Filtered list based on role, search and suite tab
  const filteredSystems = useMemo(() => {
    return allSystems.filter(sys => {
      const matchesRole = allowedTabsByPerspective.includes(sys.tab);
      if (!matchesRole) return false;

      const matchesSuite = selectedSuite === 'all' || sys.suiteId === selectedSuite;
      const matchesSearch = !searchTerm || (
        sys.titleAr.includes(searchTerm) ||
        sys.titleEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sys.descAr.includes(searchTerm) ||
        sys.descEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sys.suiteAr.includes(searchTerm)
      );
      return matchesSuite && matchesSearch;
    });
  }, [allSystems, searchTerm, selectedSuite, allowedTabsByPerspective]);

  // Group by suite
  const groupedSuites = useMemo(() => {
    const suitesMap: Record<string, { suiteAr: string; suiteEn: string; items: SystemItem[] }> = {};

    filteredSystems.forEach(sys => {
      if (!suitesMap[sys.suiteId]) {
        suitesMap[sys.suiteId] = {
          suiteAr: sys.suiteAr,
          suiteEn: sys.suiteEn,
          items: []
        };
      }
      suitesMap[sys.suiteId].items.push(sys);
    });

    return Object.entries(suitesMap);
  }, [filteredSystems]);

  const toggleSuiteCollapse = (suiteId: string) => {
    setCollapsedSuites(prev => ({
      ...prev,
      [suiteId]: !prev[suiteId]
    }));
  };

  const suiteFilterPills = [
    { id: 'all', labelAr: 'الكل', labelEn: 'All', count: allSystems.length },
    { id: 'strategy', labelAr: 'الاستراتيجية', labelEn: 'Strategy', count: allSystems.filter(s => s.suiteId === 'strategy').length },
    { id: 'ops', labelAr: 'الميدان', labelEn: 'Field Ops', count: allSystems.filter(s => s.suiteId === 'ops').length },
    { id: 'services', labelAr: 'الخدمات', labelEn: 'Services', count: allSystems.filter(s => s.suiteId === 'services').length },
    { id: 'finance', labelAr: 'المالية', labelEn: 'Finance', count: allSystems.filter(s => s.suiteId === 'finance').length },
    { id: 'governance', labelAr: 'الحوكمة', labelEn: 'Governance', count: allSystems.filter(s => s.suiteId === 'governance').length },
  ];

  return (
    <div className="flex flex-col h-full w-full select-none">
      
      {/* HEADER: Dock Launcher Bar */}
      <div className="flex items-center justify-between gap-2 pb-2.5 mb-2 border-b border-slate-200 dark:border-zinc-800">
        {!isCompact && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-500/20 shrink-0">
              <Grid className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                <span>{isRtl ? 'لوحة الأنظمة المؤسسية' : 'Enterprise Systems Dock'}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded border border-emerald-500/20 shrink-0">
                  {allSystems.length} {isRtl ? 'نظام' : 'Systems'}
                </span>
              </h3>
              <p className="text-[9px] text-slate-500 dark:text-zinc-400 font-bold truncate">
                {isRtl ? 'التنقل المباشر عبر المنظومة التشغيلية' : 'Instant Platform Navigation'}
              </p>
            </div>
          </div>
        )}

        {!isMobileMode && (
          <div className="flex items-center gap-1 mx-auto sm:mx-0 shrink-0">
            <button
              onClick={onToggleDockPin}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-zinc-700"
              title={isCompact ? (isRtl ? 'توسيع لوحة الأنظمة' : 'Expand Systems Panel') : (isRtl ? 'تصغير إلى شريط الدوك' : 'Compact Dock Mode')}
            >
              {isCompact ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* EXPANDED MODE SEARCH & SUITE FILTERS */}
      {!isCompact && (
        <div className="space-y-2 mb-2.5">
          {/* Live Search Input */}
          <div className="relative">
            <Search className={`w-3.5 h-3.5 text-slate-400 absolute top-2.5 ${isRtl ? 'right-2.5' : 'left-2.5'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isRtl ? 'بحث سريع في الأنظمة...' : 'Filter Enterprise Systems...'}
              className={`w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl py-1.5 ${
                isRtl ? 'pr-8 pl-6' : 'pl-8 pr-6'
              } text-[11px] font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors shadow-2xs`}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className={`absolute top-2 ${isRtl ? 'left-2' : 'right-2'} text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5 rounded-md`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Suite Category Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
            {suiteFilterPills.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedSuite(p.id)}
                className={`px-2 py-1 rounded-lg text-[10px] font-extrabold whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                  selectedSuite === p.id 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' 
                    : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-800'
                }`}
              >
                <span>{isRtl ? p.labelAr : p.labelEn}</span>
                <span className="rtl:mr-1 ltr:ml-1 opacity-75 font-mono text-[9px]">({p.count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SYSTEMS LIST (ACCORDION OR COMPACT) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5 pr-0.5">
        {isCompact ? (
          /* COMPACT RAIL MODE (Icons Only) */
          <div className="flex flex-col items-center gap-1.5 py-1">
            {filteredSystems.map((system) => {
              const IconComp = system.icon;
              const isActive = activeTab === system.tab;

              return (
                <button
                  key={system.id}
                  onClick={() => onNavigate(system.tab)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group border ${
                    isActive 
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm' 
                      : 'bg-slate-50 dark:bg-zinc-900/60 border-slate-200/80 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-emerald-600 hover:border-emerald-500/50'
                  }`}
                  title={isRtl ? system.titleAr : system.titleEn}
                >
                  <IconComp className="w-4 h-4 shrink-0" />
                  
                  {/* Floating tooltip on hover */}
                  <div className={`absolute ${isRtl ? 'right-11' : 'left-11'} top-1 hidden group-hover:block bg-zinc-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md whitespace-nowrap z-50`}>
                    {isRtl ? system.titleAr : system.titleEn}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* EXPANDED ACCORDION MODE (Grouped by Suites) */
          <>
            {groupedSuites.length === 0 ? (
              <div className="p-4 text-center text-slate-400 dark:text-zinc-500 text-[11px] font-bold">
                {isRtl ? 'لا توجد أنظمة مطابقة لخيارات البحث' : 'No matching systems found'}
              </div>
            ) : (
              groupedSuites.map(([suiteKey, suiteData]) => {
                const isCollapsed = collapsedSuites[suiteKey];

                return (
                  <div key={suiteKey} className="rounded-xl border border-slate-200/80 dark:border-zinc-800/80 overflow-hidden bg-white/50 dark:bg-zinc-950/40">
                    {/* Suite Header bar */}
                    <button
                      onClick={() => toggleSuiteCollapse(suiteKey)}
                      className="w-full px-2.5 py-1.5 bg-slate-100/70 dark:bg-zinc-900/70 hover:bg-slate-200/70 dark:hover:bg-zinc-850 text-left rtl:text-right flex items-center justify-between transition-colors border-b border-slate-200/50 dark:border-zinc-800/50 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                          {isRtl ? suiteData.suiteAr : suiteData.suiteEn}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-mono">
                          {suiteData.items.length}
                        </span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isCollapsed ? '-rotate-90 rtl:rotate-90' : ''}`} />
                    </button>

                    {/* Suite Systems Items */}
                    {!isCollapsed && (
                      <div className="p-1.5 space-y-1">
                        {suiteData.items.map((system) => {
                          const IconComp = system.icon;
                          const isActive = activeTab === system.tab;

                          return (
                            <button
                              key={system.id}
                              onClick={() => onNavigate(system.tab)}
                              className={`w-full p-2 rounded-xl text-left rtl:text-right flex items-center justify-between transition-all cursor-pointer border ${
                                isActive 
                                  ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-extrabold shadow-2xs' 
                                  : 'bg-slate-50/60 dark:bg-zinc-900/40 hover:bg-slate-100 dark:hover:bg-zinc-800/80 border-slate-200/80 dark:border-zinc-800/80 text-slate-800 dark:text-zinc-200'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className={`p-1.5 rounded-lg shrink-0 ${
                                  isActive 
                                    ? 'bg-emerald-600 text-white shadow-xs' 
                                    : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700'
                                }`}>
                                  <IconComp className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[11px] font-black truncate leading-tight">
                                      {isRtl ? system.titleAr : system.titleEn}
                                    </span>
                                    <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${system.badgeBg} ${system.badgeText}`}>
                                      {isRtl ? system.statusAr : system.statusEn}
                                    </span>
                                  </div>
                                  <p className={`text-[9.5px] font-medium block truncate mt-0.5 ${isActive ? 'text-emerald-700/90 dark:text-emerald-400/90' : 'text-slate-500 dark:text-zinc-400'}`}>
                                    {isRtl ? system.descAr : system.descEn}
                                  </p>
                                </div>
                              </div>

                              {isActive && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 rtl:mr-1.5 ltr:ml-1.5 shadow-xs"></span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}
      </div>


      {/* FOOTER: Live Status & System Engine Info */}
      {!isCompact && (
        <div className="pt-2 mt-2 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-[9px] font-bold text-slate-500 dark:text-zinc-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{isRtl ? 'المنظومة: نشطة ومتصلة' : 'System: Operational'}</span>
          </div>
          <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">UAMEX Engine</span>
        </div>
      )}

    </div>
  );
};

export default SystemsDockPanel;
