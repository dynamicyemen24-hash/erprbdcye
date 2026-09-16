import React, { useState, useMemo, useCallback } from 'react';
import { 
  ShoppingCart,
  ChevronRight, ChevronLeft, Pin, PinOff, Search,
  LayoutDashboard, Compass, Briefcase, Layers, Activity, 
  Users, Heart, Coins, ShieldCheck, TrendingUp, User, 
  Box, FileCheck, Settings, Database, PlayCircle, BookOpen, GitBranch,
  Globe, Calendar, Sliders, Brain, Sparkles, HelpCircle, FileText, Lock, Receipt,
  Printer, Clock, Calculator, BarChart3,
} from 'lucide-react';
import { useEnterprise } from '../core/context/EnterpriseContext';
import { triggerHaptic } from '../helpers/hapticSwipe';
import { instantPrint } from '../core/export';

// ActiveTab is the single source of truth — imported from core/types/dashboard.ts
import { ActiveTab } from '../core/types/dashboard';
interface UnifiedLeftSidebarProps {
  lang: 'ar' | 'en';
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  onPrintReport?: (reportType: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenCopilot?: () => void;
  onOpenDocs?: () => void;
  onOpenScenarios?: () => void;
  onOpenHelpers?: () => void;
  onOpenSystemMap?: () => void;
}

export interface SidebarDomainGroup {
  id: string;
  titleAr: string;
  titleEn: string;
  items: {
    tab: ActiveTab;
    domainCode: string;
    titleAr: string;
    titleEn: string;
    icon: any;
    badgeAr?: string;
    badgeEn?: string;
  }[];
}

export const UnifiedLeftSidebar: React.FC<UnifiedLeftSidebarProps> = ({
  lang,
  activeTab,
  onNavigate,
  onPrintReport,
  isCollapsed,
  onToggleCollapse,
  onOpenCopilot,
  onOpenDocs,
  onOpenScenarios,
  onOpenHelpers,
  onOpenSystemMap
}) => {
  const isRtl = lang === 'ar';
  const { activeRolePerspective, setActiveRolePerspective } = useEnterprise();
  const [searchQuery, setSearchQuery] = useState('');

  // Key Operational Modules Organized in 6 Clean Suites
  const domainGroups: SidebarDomainGroup[] = useMemo(() => [
    {
      id: 'suite_strategy',
      titleAr: 'الاستراتيجية والأداء',
      titleEn: 'Strategy & Performance',
      items: [
        { tab: 'dashboard', domainCode: '', titleAr: 'لوحة القيادة الاستراتيجية', titleEn: 'Strategy Dashboard', icon: LayoutDashboard },
        { tab: 'workspaces', domainCode: '', titleAr: 'مساحات عمل الوحدات التشغيلية', titleEn: 'Institutional Workspaces', icon: Briefcase, badgeAr: 'أدوار', badgeEn: 'Roles' },
        { tab: 'strategic_planning', domainCode: '', titleAr: 'التخطيط الاستراتيجي والأداء', titleEn: 'Strategic Planning', icon: Activity, badgeAr: 'خطة', badgeEn: 'Plan' },
        { tab: 'investments', domainCode: '', titleAr: 'المشاريع الاستثمارية والأوقاف', titleEn: 'Investment & Endowments', icon: TrendingUp },
        { tab: 'business_intelligence', domainCode: 'NEB-13', titleAr: 'ذكاء الأعمال والتحليلات', titleEn: 'Business Intelligence', icon: BarChart3, badgeAr: 'BI', badgeEn: 'BI' },
      ]
    },
    {
      id: 'suite_ops',
      titleAr: 'البرامج والتشغيل الميداني',
      titleEn: 'Programs & Field Operations',
      items: [
        { tab: 'programs', domainCode: '', titleAr: 'إدارة البرامج التنموية', titleEn: 'Program Management', icon: Briefcase },
        { tab: 'projects', domainCode: '', titleAr: 'المشاريع الميدانية والتنفيذ', titleEn: 'Project Management', icon: Layers },
        { tab: 'activities', domainCode: '', titleAr: 'الأنشطة الميدانية والمهام', titleEn: 'Field Activities', icon: Compass },
        { tab: 'portfolio_intelligence', domainCode: '', titleAr: 'ذكاء المحفظة والمسار الحرج', titleEn: 'Portfolio Intelligence', icon: GitBranch },
        { tab: 'scenarios', domainCode: '', titleAr: 'أدلة التشغيل القياسية', titleEn: 'Operational Playbooks', icon: PlayCircle },
      ]
    },
    {
      id: 'suite_services',
      titleAr: 'الخدمات والمستفيدون',
      titleEn: 'Services & Beneficiaries',
      items: [
        { tab: 'beneficiaries', domainCode: '', titleAr: 'خدمات ورعاية المستفيدين', titleEn: 'Beneficiary Services', icon: Users },
        { tab: 'sponsorships', domainCode: '', titleAr: 'الكفالات والرعاية الاجتماعية', titleEn: 'Sponsorships & Welfare', icon: Heart, badgeAr: 'كفالات', badgeEn: 'Relief' },
        { tab: 'geospatial', domainCode: '', titleAr: 'خريطة التغطية الجغرافية', titleEn: 'Geographic Coverage Map', icon: Globe },
      ]
    },
    {
      id: 'suite_finance',
      titleAr: 'المالية والحسابات',
      titleEn: 'Finance & Accounts',
      items: [
        { tab: 'finance', domainCode: '', titleAr: 'النظام المالي والقيود المحاسبية', titleEn: 'Financial Ledger', icon: Coins },
        { tab: 'sales', domainCode: '', titleAr: 'المبيعات والإيرادات والتبرعات', titleEn: 'Sales & Revenue', icon: Receipt },
        { tab: 'approvals', domainCode: '', titleAr: 'الموافقات والاعتمادات', titleEn: 'Approval Requests', icon: ShieldCheck },
        { tab: 'currencies', domainCode: '', titleAr: 'أسعار وصرف العملات', titleEn: 'Currencies & FX', icon: Coins },
      ]
    },
    {
      id: 'suite_resources',
      titleAr: 'الموارد والمشتريات',
      titleEn: 'Resources & Procurement',
      items: [
        { tab: 'procurement', domainCode: '', titleAr: 'المشتريات والمناقصات (P2P)', titleEn: 'Procurement & Tenders', icon: ShoppingCart, badgeAr: 'P2P', badgeEn: 'P2P' },
        { tab: 'inventory', domainCode: '', titleAr: 'إدارة المخازن والمواد', titleEn: 'Inventory Management', icon: Box },
        { tab: 'contracts', domainCode: '', titleAr: 'عقود الموردين والمشتريات', titleEn: 'Vendor Contracts', icon: FileCheck },
        { tab: 'allocations', domainCode: '', titleAr: 'تخطيط وتوزيع الكادر', titleEn: 'Resource Allocation', icon: Calendar },
        { tab: 'hr_dashboard', domainCode: '', titleAr: 'الموارد البشرية والكادر', titleEn: 'HR Management', icon: User },
        { tab: 'third-party-network', domainCode: '', titleAr: 'شبكة الشركاء والتجار', titleEn: 'Third-Party Network', icon: ShieldCheck }
      ]
    },
    {
      id: 'suite_admin',
      titleAr: 'الإدارة والنظام',
      titleEn: 'Admin & System',
      items: [
        { tab: 'users', domainCode: '', titleAr: 'المستخدمون والصلاحيات', titleEn: 'User Management', icon: Users },
        { tab: 'reports', domainCode: '', titleAr: 'التقارير والمؤشرات المعتمدة', titleEn: 'Certified Reports', icon: TrendingUp },
        { tab: 'communications', domainCode: 'NEB-11', titleAr: 'الاتصال الإداري الذكي', titleEn: 'Intelligent Communications', icon: FileText, badgeAr: '12', badgeEn: 'Comms' },
        { tab: 'control_panel', domainCode: '', titleAr: 'لوحة التحكم والعمليات', titleEn: 'Control Console', icon: Sliders },
        { tab: 'settings', domainCode: '', titleAr: 'إعدادات المؤسسة', titleEn: 'System Settings', icon: Settings },
        { tab: 'backup', domainCode: '', titleAr: 'النسخ الاحتياطي والأرشفة', titleEn: 'Backup & Recovery', icon: Database },
        { tab: 'audit', domainCode: '', titleAr: 'سجل التدقيق الداخلي', titleEn: 'Audit Logs', icon: Database },
        { tab: 'docs', domainCode: '', titleAr: 'دليل النظام والسياسات', titleEn: 'Knowledge & Policies', icon: BookOpen },
      ]
    }
  ], []);

  // Filter items by role perspective and search query
  const filteredGroups = useMemo(() => {
    // Role-Based Allowed Tabs Map
    const roleAllowedTabs: Record<string, ActiveTab[]> = {
      executive: ['dashboard', 'workspaces', 'strategic_planning', 'investments', 'programs', 'procurement', 'scenarios', 'reports', 'business_intelligence', 'domains', 'control_panel', 'sales', 'communications'],
      manager: ['finance', 'sales', 'approvals', 'currencies', 'procurement', 'inventory', 'contracts', 'reports', 'business_intelligence', 'audit', 'users', 'hr_dashboard', 'third-party-network', 'workspaces', 'communications'],
      field: ['beneficiaries', 'sponsorships', 'geospatial', 'programs', 'projects', 'activities', 'allocations', 'scenarios', 'workspaces'],
    };

    const allowed = roleAllowedTabs[activeRolePerspective];

    return domainGroups.map(group => {
      const matchedItems = group.items.filter(item => {
        // Apply RBAC filtering if allowed list exists
        if (allowed && !allowed.includes(item.tab)) return false;

        // Apply Search query filtering
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return item.titleAr.toLowerCase().includes(q) || item.titleEn.toLowerCase().includes(q) || item.domainCode.toLowerCase().includes(q);
      });
      return { ...group, items: matchedItems };
    }).filter(group => group.items.length > 0);
  }, [domainGroups, searchQuery, activeRolePerspective]);

  return (
    <aside 
      className={`relative h-full bg-white dark:bg-zinc-950 border-r rtl:border-r-0 rtl:border-l border-slate-200 dark:border-zinc-800/90 transition-all duration-300 z-30 flex flex-col shrink-0 shadow-sm select-none ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* SIDEBAR HEADER / TOGGLE BAR */}
      <div className="h-12 px-3 border-b border-slate-100 dark:border-zinc-900 flex items-center justify-between gap-2 shrink-0 bg-slate-50/50 dark:bg-zinc-900/50">
        {!isCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="p-1.5 bg-emerald-600/10 border border-emerald-500/20 rounded-lg shrink-0">
              <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="font-black text-xs text-slate-800 dark:text-zinc-100 truncate">
              {isRtl ? 'أنظمة التشغيل الـ15' : '15 Enterprise Domains'}
            </span>
          </div>
        )}

        <button
          onClick={() => {
            triggerHaptic('light');
            onToggleCollapse();
          }}
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition-colors mx-auto"
          title={isCollapsed ? (isRtl ? 'توسيع القائمة' : 'Expand Sidebar') : (isRtl ? 'طي القائمة' : 'Collapse Sidebar')}
        >
          {isCollapsed ? (
            isRtl ? <ChevronLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" /> : <ChevronRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          ) : (
            <PinOff className="w-4 h-4 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200" />
          )}
        </button>
      </div>

      {/* ROLE PERSPECTIVE SWITCHER (Only visible when expanded) */}
      {!isCollapsed && (
        <div className="px-2 pt-2 pb-1 border-b border-slate-100 dark:border-zinc-900">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-zinc-500 mb-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isRtl ? 'منظور الدور والصلاحيات:' : 'Role Perspective:'}</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl border border-slate-200 dark:border-zinc-800 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setActiveRolePerspective('executive')}
              className={`py-1.5 px-1 rounded-lg text-center truncate transition-all cursor-pointer flex items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                activeRolePerspective === 'executive'
                  ? 'bg-emerald-600 text-white font-black shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
              title={isRtl ? 'المنظور القيادي والتنفيذي' : 'Executive Perspective'}
            >
              <Briefcase className="w-3 h-3 shrink-0" />
              <span>{isRtl ? 'قيادي' : 'Exec'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveRolePerspective('manager')}
              className={`py-1.5 px-1 rounded-lg text-center truncate transition-all cursor-pointer flex items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                activeRolePerspective === 'manager'
                  ? 'bg-emerald-600 text-white font-black shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
              title={isRtl ? 'المنظور المحاسبي والمالي' : 'Financial Perspective'}
            >
              <Coins className="w-3 h-3 shrink-0" />
              <span>{isRtl ? 'مالي' : 'Finance'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveRolePerspective('field')}
              className={`py-1.5 px-1 rounded-lg text-center truncate transition-all cursor-pointer flex items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                activeRolePerspective === 'field'
                  ? 'bg-emerald-600 text-white font-black shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
              title={isRtl ? 'المنظور الميداني والرعاية' : 'Field & Welfare Perspective'}
            >
              <Compass className="w-3 h-3 shrink-0" />
              <span>{isRtl ? 'ميداني' : 'Field'}</span>
            </button>
          </div>
        </div>
      )}

      {/* SEARCH BOX & MODE B EXPLORER */}
      {!isCollapsed ? (
        <div className="p-2 border-b border-slate-100 dark:border-zinc-900 shrink-0 space-y-1.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 rtl:left-auto rtl:right-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRtl ? 'بحث في القائمة...' : 'Filter domains...'}
              className="w-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] font-bold rounded-lg pl-8 rtl:pl-2 rtl:pr-8 py-1.5 text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {onOpenSystemMap && (
            <button
              onClick={onOpenSystemMap}
              className="w-full px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-black flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
              title="Alt + M"
            >
              <div className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-45 transition-transform" />
                <span>{isRtl ? 'خريطة المنظومة الشاملة' : 'Enterprise System Map'}</span>
              </div>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-emerald-500/20 text-slate-500 dark:text-zinc-400">
                Alt+M
              </span>
            </button>
          )}
        </div>
      ) : (
        onOpenSystemMap && (
          <div className="p-1 border-b border-slate-100 dark:border-zinc-900 flex justify-center shrink-0">
            <button
              onClick={onOpenSystemMap}
              className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-amber-400 transition-all cursor-pointer"
              title={isRtl ? 'خريطة المنظومة الشاملة [Alt+M]' : 'Enterprise System Map [Alt+M]'}
            >
              <Compass className="w-4 h-4" />
            </button>
          </div>
        )
      )}

      {/* NAVIGATION TREE */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-3">
        {filteredGroups.map((group) => (
          <div key={group.id} className="space-y-1">
            {/* Group Label (Expanded Mode) */}
            {!isCollapsed && (
              <h3 className="px-2 pt-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center justify-between">
                <span>{isRtl ? group.titleAr : group.titleEn}</span>
              </h3>
            )}

            {/* Items */}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.tab;

                return (
                  <button
                    key={item.tab}
                    onClick={() => {
                      triggerHaptic('light');
                      onNavigate(item.tab);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all group relative cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-black'
                        : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-zinc-100'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                    title={isCollapsed ? (isRtl ? item.titleAr : item.titleEn) : undefined}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 dark:text-zinc-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                    }`} />

                    {!isCollapsed && (
                      <div className="flex-1 flex items-center justify-between min-w-0 text-right rtl:text-right">
                        <span className="truncate">{isRtl ? item.titleAr : item.titleEn}</span>
                        {item.badgeAr && (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black shrink-0 ${
                            isActive ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {isRtl ? item.badgeAr : item.badgeEn}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Active Accent Indicator (Collapsed Mode) */}
                    {isCollapsed && isActive && (
                      <span className="absolute left-0 rtl:left-auto rtl:right-0 top-1.5 bottom-1.5 w-1 bg-amber-400 rounded-r rtl:rounded-l"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER — Compact & Calm (single calm entry, no competing gradients) */}
      <div className="p-2 border-t border-slate-100 dark:border-zinc-900 bg-slate-50/80 dark:bg-zinc-900/40 shrink-0 space-y-1.5">
        {onOpenHelpers && (
          <button
            onClick={() => { triggerHaptic('light'); onOpenHelpers(); }}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              isCollapsed ? 'justify-center bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-emerald-500/30 hover:text-emerald-700 dark:hover:text-emerald-300'
            }`}
            title={isRtl ? 'أدوات المساعدة (12 أداة)' : 'Helper Tools (12)'}
          >
            <Calculator className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            {!isCollapsed && <span className="flex-1 text-right rtl:text-right truncate">{isRtl ? 'أدوات المساعدة' : 'Helper Tools'}</span>}
          </button>
        )}
        <div className={`flex items-center gap-1 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {onOpenDocs && (
            <button onClick={() => { triggerHaptic('light'); onOpenDocs(); }} className="p-2 rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer" title={isRtl ? 'الدليل والوثائق' : 'Docs'}>
              <BookOpen className="w-3.5 h-3.5" />
            </button>
          )}
          {onOpenScenarios && (
            <button onClick={() => { triggerHaptic('light'); onOpenScenarios(); }} className="p-2 rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer" title={isRtl ? 'السيناريوهات SOP' : 'SOPs'}>
              <PlayCircle className="w-3.5 h-3.5" />
            </button>
          )}
          {!isCollapsed && (
            <span className="text-[9px] font-mono text-slate-400 dark:text-zinc-500 px-1.5">UAMEX</span>
          )}
        </div>
      </div>
    </aside>
  );
};

export default UnifiedLeftSidebar;
