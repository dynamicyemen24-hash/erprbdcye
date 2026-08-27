import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  X, 
  Search, 
  Compass, 
  Layers, 
  Coins, 
  Briefcase, 
  Users, 
  Heart, 
  ShieldCheck, 
  TrendingUp, 
  ShoppingCart, 
  Box, 
  FileCheck, 
  Calendar, 
  Globe, 
  Target, 
  Activity, 
  Sliders, 
  Settings, 
  Database, 
  BookOpen, 
  PlayCircle,
  Receipt,
  Sparkles,
  ArrowUpRight,
  ExternalLink
} from 'lucide-react';
import { ActiveTab } from '../../core/types/dashboard';

interface EnterpriseSystemMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
  onNavigate: (tab: ActiveTab) => void;
}

interface DomainSuiteItem {
  tab: ActiveTab;
  code: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  icon: any;
  badgeAr?: string;
  badgeEn?: string;
  color: string;
}

interface DomainSuiteCluster {
  id: string;
  code: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  color: string;
  icon: any;
  items: DomainSuiteItem[];
}

export const EnterpriseSystemMapModal: React.FC<EnterpriseSystemMapModalProps> = ({
  isOpen,
  onClose,
  lang,
  onNavigate
}) => {
  const isRtl = lang === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus input automatically upon opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // All 15 Enterprise Domains clustered logically into 6 Functional Suites
  const domainClusters: DomainSuiteCluster[] = useMemo(() => [
    {
      id: 'cluster_strategy',
      code: 'NEB-01',
      titleAr: 'القيادة والتخطيط الاستراتيجي',
      titleEn: 'Strategy & Leadership',
      descAr: 'الحوكمة والأهداف الخمسية والأوقاف الاستثمارية',
      descEn: 'Governance, strategic goals & endowments',
      color: 'border-amber-500/30 bg-amber-500/5 text-amber-500',
      icon: Target,
      items: [
        {
          tab: 'dashboard',
          code: 'NEB-01A',
          titleAr: 'محطة العمل والقيادة',
          titleEn: 'My Work Cockpit',
          descAr: 'المهام اليومية وطابور الاعتمادات والمؤشرات الحية',
          descEn: 'Daily work stream, approvals & live KPIs',
          icon: Activity,
          color: 'text-emerald-500'
        },
        {
          tab: 'strategic_planning',
          code: 'NEB-01B',
          titleAr: 'التخطيط والأهداف الخمسية',
          titleEn: 'Strategic Planning',
          descAr: 'بطاقة الأداء المتوازن (BSC) والأهداف العشرة',
          descEn: 'Balanced Scorecard & 10 strategic objectives',
          icon: Target,
          badgeAr: 'BSC',
          badgeEn: 'BSC',
          color: 'text-amber-500'
        },
        {
          tab: 'investments',
          code: 'NEB-01C',
          titleAr: 'المشاريع الاستثمارية والأوقاف',
          titleEn: 'Endowments & Investments',
          descAr: 'محفظة الأصول الوقفية والعوائد التنموية المستدامة',
          descEn: 'Endowments portfolio & sustainable returns',
          icon: TrendingUp,
          color: 'text-teal-500'
        },
        {
          tab: 'workspaces',
          code: 'NEB-01D',
          titleAr: 'مساحات العمل التخصصية للأدوار',
          titleEn: 'Role Workspaces Hub',
          descAr: 'بوابات المكاتب التشغيلية لجميع تخصصات المؤسسة',
          descEn: 'Specialized role desks for all departments',
          icon: Briefcase,
          badgeAr: 'أدوار',
          badgeEn: 'Roles',
          color: 'text-blue-500'
        }
      ]
    },
    {
      id: 'cluster_operations',
      code: 'NEB-03-05',
      titleAr: 'البرامج والتشغيل الميداني (WBS)',
      titleEn: 'Programs & Field Operations',
      descAr: 'إدارة المحافظ والمشاريع التنموية والإغاثية الميدانية',
      descEn: 'Portfolios, projects & field execution work',
      color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-500',
      icon: Layers,
      items: [
        {
          tab: 'programs',
          code: 'NEB-03',
          titleAr: 'البرامج التنموية الشاملة',
          titleEn: 'Program Management',
          descAr: 'محافظ البرامج، مؤشرات الأثر، وتخصيص الموازنات',
          descEn: 'Program portfolios, impact KPIs & allocations',
          icon: Briefcase,
          color: 'text-emerald-500'
        },
        {
          tab: 'projects',
          code: 'NEB-04',
          titleAr: 'المشاريع الميدانية والتنفيذ',
          titleEn: 'Project Management',
          descAr: 'تتبع مراحل الإنجاز، المقاولين، ونسب التنفيذ الفعلي',
          descEn: 'Execution stages, contractors & progress',
          icon: Layers,
          badgeAr: 'ميداني',
          badgeEn: 'Field',
          color: 'text-teal-500'
        },
        {
          tab: 'activities',
          code: 'NEB-05',
          titleAr: 'الأنشطة الميدانية والمهام (WBS)',
          titleEn: 'Field Activities & Tasks',
          descAr: 'حزم العمل التفصيلية ومحاضر الاستلام والإنجاز',
          descEn: 'Work Breakdown Structure & handover tasks',
          icon: Compass,
          color: 'text-cyan-500'
        },
        {
          tab: 'geospatial',
          code: 'NEB-12B',
          titleAr: 'خريطة الأثر والتغطية الجغرافية',
          titleEn: 'GIS & Spatial Coverage Map',
          descAr: 'الانتشار الجغرافي للمشاريع والمستفيدين بالخرائط',
          descEn: 'Geographic distribution of projects & reach',
          icon: Globe,
          color: 'text-sky-500'
        }
      ]
    },
    {
      id: 'cluster_welfare',
      code: 'NEB-06-07',
      titleAr: 'المستفيدون والخدمات والرعاية',
      titleEn: 'Beneficiaries & Social Welfare',
      descAr: 'إدارة شؤون الأسر المتعففة وكفالات الأيتام المعتمدة',
      descEn: 'Beneficiary services & orphan sponsorship programs',
      color: 'border-rose-500/30 bg-rose-500/5 text-rose-500',
      icon: Heart,
      items: [
        {
          tab: 'beneficiaries',
          code: 'NEB-06',
          titleAr: 'سجل المستفيدين والخدمات',
          titleEn: 'Beneficiaries Registry',
          descAr: 'قاعدة بيانات المستحقين، المسح الميداني، والتحقق',
          descEn: 'Eligibility registry, field survey & verification',
          icon: Users,
          color: 'text-rose-500'
        },
        {
          tab: 'sponsorships',
          code: 'NEB-07',
          titleAr: 'كفالات الأيتام والرعاية الاجتماعية',
          titleEn: 'Orphan Sponsorships & Welfare',
          descAr: 'إدارة الكفلاء والمكفولين وصرف المستحقات الدورية',
          descEn: 'Donors, orphans & periodic stipend disbursement',
          icon: Heart,
          badgeAr: '595 كفالة',
          badgeEn: '595 active',
          color: 'text-pink-500'
        }
      ]
    },
    {
      id: 'cluster_finance',
      code: 'NEB-10',
      titleAr: 'المالية والحسابات والحوكمة (IPSAS)',
      titleEn: 'Finance, Accounts & IPSAS',
      descAr: 'شجرة الحسابات، قيود اليومية، والاعتمادات المالية',
      descEn: 'Chart of accounts, general ledger & approvals',
      color: 'border-amber-500/30 bg-amber-500/5 text-amber-500',
      icon: Coins,
      items: [
        {
          tab: 'finance',
          code: 'NEB-10A',
          titleAr: 'دفتر الأستاذ والقيود المحاسبية',
          titleEn: 'Financial Ledger & Journals',
          descAr: 'القيود المزدوجة، مراكز التكلفة، وموازين المراجعة',
          descEn: 'Double-entry journals, cost centers & trial balance',
          icon: Coins,
          badgeAr: 'IPSAS',
          badgeEn: 'IPSAS',
          color: 'text-amber-500'
        },
        {
          tab: 'approvals',
          code: 'NEB-10B',
          titleAr: 'طابور الموافقات والاعتمادات',
          titleEn: 'Approval Workflow Center',
          descAr: 'سلسلة الاعتمادات لمذكرات الصرف والتحويلات',
          descEn: 'Approval chain for vouchers & disbursements',
          icon: ShieldCheck,
          color: 'text-emerald-500'
        },
        {
          tab: 'sales',
          code: 'NEB-15',
          titleAr: 'تنمية الموارد والإيرادات والتبرعات',
          titleEn: 'Fundraising & Revenue OS',
          descAr: 'إدارة المنح، سندات القبض، ومساهمات الداعمين',
          descEn: 'Grants, donations, receipts & fundraising',
          icon: Receipt,
          color: 'text-teal-500'
        },
        {
          tab: 'currencies',
          code: 'NEB-10C',
          titleAr: 'أسعار وصرف العملات المتعددة',
          titleEn: 'Multi-Currency & FX Ledger',
          descAr: 'أسعار الصرف اليومية، فروق العملات، والتحوط المالي',
          descEn: 'Daily exchange rates, FX variance & hedging',
          icon: Coins,
          color: 'text-yellow-500'
        }
      ]
    },
    {
      id: 'cluster_procurement',
      code: 'NEB-14',
      titleAr: 'المشتريات وسلاسل الإمداد والمخازن (P2P)',
      titleEn: 'Procurement, Logistics & P2P',
      descAr: 'دورة الشراء الكاملة، مستودعات الإغاثة، وعقود الموردين',
      descEn: 'Procure-to-pay lifecycle, relief warehouses & vendors',
      color: 'border-orange-500/30 bg-orange-500/5 text-orange-500',
      icon: ShoppingCart,
      items: [
        {
          tab: 'procurement',
          code: 'NEB-14A',
          titleAr: 'المشتريات والمناقصات (P2P)',
          titleEn: 'Procurement & Tenders',
          descAr: 'طلبات الشراء، العطاءات، والمقارنة الفنية والمالية',
          descEn: 'Purchase requests, RFQs, vendor bids & awards',
          icon: ShoppingCart,
          badgeAr: 'P2P',
          badgeEn: 'P2P',
          color: 'text-orange-500'
        },
        {
          tab: 'inventory',
          code: 'NEB-14B',
          titleAr: 'إدارة المخازن والمستودعات الإغاثية',
          titleEn: 'Warehouse & Inventory OS',
          descAr: 'أذونات الاستلام والصرف، الجرد الدوري، ومخزون الطوارئ',
          descEn: 'Goods receipt, dispatch notes & emergency stock',
          icon: Box,
          color: 'text-amber-500'
        },
        {
          tab: 'contracts',
          code: 'NEB-14C',
          titleAr: 'عقود الموردين والشركاء',
          titleEn: 'Vendor Contract Management',
          descAr: 'توثيق الاتفاقيات، خطابات الضمان، والالتزامات التعاقدية',
          descEn: 'Supplier agreements, performance bonds & contracts',
          icon: FileCheck,
          color: 'text-cyan-500'
        },
        {
          tab: 'third-party-network',
          code: 'NEB-07B',
          titleAr: 'شبكة التجار والأطراف الثالثة',
          titleEn: 'Third-Party Merchant Network',
          descAr: 'إدارة شبكة نقاط التوزيع وصرف القسائم والمطالبات',
          descEn: 'Voucher redemption network, claims & settlements',
          icon: ShieldCheck,
          color: 'text-purple-500'
        }
      ]
    },
    {
      id: 'cluster_admin',
      code: 'NEB-09-13',
      titleAr: 'الموارد البشرية والإدارة والأمان والذكاء',
      titleEn: 'HR, Admin, Security & Intelligence',
      descAr: 'إدارة الكادر، الصلاحيات، مؤشرات الأثر، وسجل التدقيق',
      descEn: 'Personnel, permissions, impact BI & audit trail',
      color: 'border-purple-500/30 bg-purple-500/5 text-purple-500',
      icon: Settings,
      items: [
        {
          tab: 'hr_dashboard',
          code: 'NEB-09A',
          titleAr: 'الموارد البشرية والكادر المؤسسي',
          titleEn: 'HR Management & Personnel',
          descAr: 'هياكل الوظائف، تقييم الأداء، وحضور الكوادر',
          descEn: 'Job taxonomy, performance evaluation & staff files',
          icon: Users,
          color: 'text-indigo-500'
        },
        {
          tab: 'allocations',
          code: 'NEB-09B',
          titleAr: 'تخطيط وتوزيع الموارد والكوادر',
          titleEn: 'Resource & Staff Allocation',
          descAr: 'جدولة فرق العمل وتوزيع الكوادر على المشاريع الميدانية',
          descEn: 'Team scheduling & project staff assignment',
          icon: Calendar,
          color: 'text-blue-500'
        },
        {
          tab: 'business_intelligence',
          code: 'NEB-13',
          titleAr: 'ذكاء الأعمال ومؤشرات الأثر الدولي',
          titleEn: 'BI & International Impact OS',
          descAr: 'معايير إسفير و CHS ومؤشرات شفافية IATI الدولية',
          descEn: 'Sphere & CHS compliance, IATI impact metrics',
          icon: TrendingUp,
          badgeAr: 'Sphere',
          badgeEn: 'Sphere',
          color: 'text-emerald-500'
        },
        {
          tab: 'reports',
          code: 'NEB-13B',
          titleAr: 'التقارير والمؤشرات المعتمدة',
          titleEn: 'Certified Reporting Center',
          descAr: 'التقارير المالية والتشغيلية الجاهزة للتصدير والطباعة',
          descEn: 'Audited operational & financial printable reports',
          icon: FileCheck,
          color: 'text-teal-500'
        },
        {
          tab: 'scenarios',
          code: 'NEB-11A',
          titleAr: 'أدلة التشغيل القياسية واللوائح (SOP)',
          titleEn: 'Master SOP & Bylaws Playbooks',
          descAr: 'اللوائح الداخلية، التوصيف الوظيفي، ومسارات العمليات',
          descEn: 'Institutional bylaws, role taxonomies & SOP',
          icon: PlayCircle,
          color: 'text-amber-500'
        },
        {
          tab: 'audit',
          code: 'NEB-10D',
          titleAr: 'سجل التدقيق والأمان المؤسسي',
          titleEn: 'Immutable Audit Trail & Logs',
          descAr: 'سجل العمليات المشفر غير القابل للتعديل لجميع المستخدمين',
          descEn: 'Tamper-proof chronological system activity trail',
          icon: Database,
          color: 'text-rose-500'
        },
        {
          tab: 'settings',
          code: 'NEB-12C',
          titleAr: 'إعدادات المنظومة وهوية المؤسسة',
          titleEn: 'System Configuration & Branding',
          descAr: 'إعدادات الفروع، الهوية البصرية، وقواعد بيانات PostgreSQL',
          descEn: 'Multi-branch setup, branding & Neon PostgreSQL config',
          icon: Settings,
          color: 'text-zinc-400'
        },
        {
          tab: 'docs',
          code: 'NEB-11B',
          titleAr: 'دليل الاستخدام الشامل للمنظومة',
          titleEn: 'Comprehensive User Manual',
          descAr: 'الدليل المرجعي الإرشادي للمستخدمين وفرق العمل',
          descEn: 'Complete end-user manual & step-by-step guides',
          icon: BookOpen,
          color: 'text-sky-500'
        }
      ]
    }
  ], []);

  // Filter clusters and items by search query
  const filteredClusters = useMemo(() => {
    if (!searchQuery.trim()) return domainClusters;
    const query = searchQuery.toLowerCase().trim();

    return domainClusters
      .map(cluster => {
        const matchesCluster = 
          cluster.titleAr.toLowerCase().includes(query) ||
          cluster.titleEn.toLowerCase().includes(query) ||
          cluster.descAr.toLowerCase().includes(query) ||
          cluster.descEn.toLowerCase().includes(query);

        const matchedItems = cluster.items.filter(item => 
          matchesCluster ||
          item.titleAr.toLowerCase().includes(query) ||
          item.titleEn.toLowerCase().includes(query) ||
          item.descAr.toLowerCase().includes(query) ||
          item.descEn.toLowerCase().includes(query) ||
          item.code.toLowerCase().includes(query) ||
          item.tab.toLowerCase().includes(query)
        );

        return {
          ...cluster,
          items: matchedItems
        };
      })
      .filter(cluster => cluster.items.length > 0);
  }, [domainClusters, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-7xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER STRIP */}
        <div className="h-16 px-6 bg-slate-50 dark:bg-zinc-900/80 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  {isRtl ? 'خريطة منظومة UAMEX ERP™ المؤسسية الشاملة' : 'Enterprise Product Map & Navigation Canvas'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  Mode B
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {isRtl ? 'استكشاف سريع لكافة الأنظمة الـ 15 والوحدات التشغيلية للمنظومة' : 'Direct access to all 15 enterprise operating systems and modules'}
              </p>
            </div>
          </div>

          {/* SEARCH FILTER BOX */}
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className={`w-4 h-4 text-slate-400 dark:text-zinc-400 absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-3' : 'left-3'}`} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRtl ? 'تصفية فورية بالاسم، الكود، أو الوظيفة...' : 'Filter modules by title, code, or function...'}
                className={`w-full text-xs py-2 rounded-xl bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all ${
                  isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={`absolute top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 ${isRtl ? 'left-2' : 'right-2'}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <kbd className="hidden lg:inline-flex px-2 py-1 text-[10px] font-mono font-bold bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-lg border border-slate-300 dark:border-zinc-700">
              Esc للعودة
            </kbd>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title={isRtl ? 'إغلاق الخريطة' : 'Close map'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MOBILE SEARCH BAR */}
        <div className="p-3 sm:hidden border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900">
          <div className="relative">
            <Search className={`w-4 h-4 text-slate-400 dark:text-zinc-400 absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRtl ? 'تصفية فورية...' : 'Filter modules...'}
              className={`w-full text-xs py-2 rounded-xl bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500 ${
                isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'
              }`}
            />
          </div>
        </div>

        {/* CLUSTERS GRID CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-slate-100/50 dark:bg-zinc-950/40">
          {filteredClusters.length === 0 ? (
            <div className="py-20 text-center text-slate-400 dark:text-zinc-500">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-bold">{isRtl ? 'لم يتم العثور على أنظمة مطابقة لمعيار البحث' : 'No matching systems or modules found'}</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
              >
                {isRtl ? 'مسح الفلتر واستعراض كافة الأنظمة' : 'Clear search to view all systems'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredClusters.map((cluster) => {
                const ClusterIcon = cluster.icon;
                return (
                  <div
                    key={cluster.id}
                    className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      {/* CLUSTER TITLE BAR */}
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl border ${cluster.color}`}>
                            <ClusterIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-xs md:text-sm font-black text-slate-900 dark:text-white">
                                {isRtl ? cluster.titleAr : cluster.titleEn}
                              </h3>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-1">
                              {isRtl ? cluster.descAr : cluster.descEn}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 shrink-0">
                          {cluster.code}
                        </span>
                      </div>

                      {/* MODULE ITEMS LIST */}
                      <div className="space-y-1.5">
                        {cluster.items.map((item) => {
                          const ItemIcon = item.icon;
                          return (
                            <button
                              key={item.tab}
                              onClick={() => {
                                onClose();
                                onNavigate(item.tab);
                              }}
                              className="w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/60 border border-transparent hover:border-slate-200 dark:hover:border-zinc-700/80 transition-all text-left rtl:text-right flex items-center justify-between gap-3 group cursor-pointer"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 group-hover:scale-105 transition-transform shrink-0 ${item.color}`}>
                                  <ItemIcon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                                      {isRtl ? item.titleAr : item.titleEn}
                                    </span>
                                    {item.badgeAr && (
                                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 shrink-0">
                                        {isRtl ? item.badgeAr : item.badgeEn}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate mt-0.5">
                                    {isRtl ? item.descAr : item.descEn}
                                  </p>
                                </div>
                              </div>
                              <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-600 group-hover:text-emerald-500 group-hover:translate-x-[-2px] transition-all shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="h-12 px-6 bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 shrink-0">
          <span className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {isRtl ? 'منظومة يو امكس المؤسسية المعتمدة (15 نظاماً تشغيلياً متكاملاً)' : 'UAMEX Enterprise™ 15 Fully Integrated Operating Domains'}
          </span>
          <span className="font-mono text-[10px]">
            {isRtl ? 'اختصار الاستدعاء السريع: Alt + M' : 'Quick Toggle: Alt + M'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseSystemMapModal;
