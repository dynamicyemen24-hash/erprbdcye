import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  RefreshCw, 
  Search, 
  X, 
  Download, 
  FilterX, 
  Grid, 
  List, 
  Calendar, 
  Globe, 
  Brain, 
  Sparkles, 
  Sliders, 
  CheckCircle2, 
  Briefcase, 
  Users, 
  Coins, 
  Heart, 
  Compass, 
  Layers, 
  FileText, 
  Activity, 
  ZoomIn, 
  ZoomOut,
  Building2,
  ShieldCheck,
  Building,
  Lock,
  Award,
  ChevronDown,
  Target,
  Zap,
  LayoutDashboard,
  SlidersHorizontal
} from 'lucide-react';
import { triggerHaptic } from '../helpers/hapticSwipe';
import { ActiveTab } from '../core/types';
import { useEnterprise } from '../core/context/EnterpriseContext';

export interface TabConfigItem {
  id?: ActiveTab;
  title_ar: string;
  title_en: string;
  icon: any;
  category_ar?: string;
  category_en?: string;
}

interface UnifiedContextRibbonProps {
  lang: 'ar' | 'en';
  activeTab: ActiveTab;
  openTabs: ActiveTab[];
  tabConfig: Record<ActiveTab, TabConfigItem>;
  onSelectTab: (tab: ActiveTab) => void;
  onCloseTab: (tab: ActiveTab, e: React.MouseEvent) => void;
  onRefreshData: () => void;
  isLoading?: boolean;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onResetFilters: () => void;
  onOpenExportModal: () => void;
  onOpenCopilot: () => void;
  organizationName?: string;
  homeExperienceMode?: 'work_first' | 'classic_analytics';
  onSetHomeExperienceMode?: (mode: 'work_first' | 'classic_analytics') => void;
  onOpenExperienceModeModal?: () => void;
}

const UnifiedContextRibbonInner: React.FC<UnifiedContextRibbonProps> = ({
  lang,
  activeTab,
  openTabs,
  tabConfig,
  onSelectTab,
  onCloseTab,
  onRefreshData,
  isLoading = false,
  searchQuery,
  onSearchChange,
  onResetFilters,
  onOpenExportModal,
  onOpenCopilot,
  organizationName,
  homeExperienceMode = 'work_first',
  onSetHomeExperienceMode,
  onOpenExperienceModeModal
}) => {
  const isRtl = lang === 'ar';
  const currentConfig = tabConfig[activeTab] || tabConfig['dashboard'];
  const ActiveIcon = currentConfig.icon;

  // Read Enterprise Context
  const enterprise = useEnterprise();
  const {
    organizationId, setOrganizationId,
    selectedBranchCode, setSelectedBranchCode,
    fiscalYear, setFiscalYear,
    securityClearanceLevel, setSecurityClearanceLevel,
    complianceStandards, organizations
  } = enterprise;

  // View modes for applicable tabs (projects, activities, geospatial, etc.)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'gantt' | 'map'>('grid');
  const [zoomLevel, setZoomLevel] = useState<'months' | 'quarters' | 'annual'>('months');

  // Contextual Primary Action details by activeTab
  const getPrimaryActionDetails = () => {
    switch (activeTab) {
      case 'programs':
        return { labelAr: 'إضافة برنامج تنموي', labelEn: 'Add Program', tagAr: 'برامج' };
      case 'projects':
        return { labelAr: 'إضافة مشروع ميداني', labelEn: 'Add Project', tagAr: 'مشاريع' };
      case 'activities':
        return { labelAr: 'إضافة نشاط تنفيذي', labelEn: 'Add Activity', tagAr: 'أنشطة' };
      case 'beneficiaries':
        return { labelAr: 'تسجيل مستفيد جديد', labelEn: 'Register Beneficiary', tagAr: 'خدمات' };
      case 'sponsorships':
        return { labelAr: 'إصدار كفالة جديدة', labelEn: 'New Sponsorship', tagAr: 'كفالات' };
      case 'finance':
        return { labelAr: 'إضافة قيد محاسبي', labelEn: 'Add Ledger Entry', tagAr: 'مالية' };
      case 'allocations':
        return { labelAr: 'تخصيص مورد جديد', labelEn: 'Allocate Resource', tagAr: 'موارد' };
      case 'currencies':
        return { labelAr: 'إضافة سعر صرف عملة', labelEn: 'Add Currency Rate', tagAr: 'عملات' };
      default:
        return null;
    }
  };

  const primaryAction = getPrimaryActionDetails();

  // Contextual Navigation links for the active tab
  const getContextualLinks = () => {
    switch (activeTab) {
      case 'projects':
        return [
          { labelAr: 'الأنشطة الميدانية', labelEn: 'Field Activities', tab: 'activities' as ActiveTab, icon: Compass },
          { labelAr: 'مالية المشروعات', labelEn: 'Project Finance', tab: 'finance' as ActiveTab, icon: Coins },
          { labelAr: 'خريطة GIS', labelEn: 'GIS Map', tab: 'geospatial' as ActiveTab, icon: Globe },
          { labelAr: 'تقارير الأثر والتحليلات', labelEn: 'Impact & Reports', tab: 'reports' as ActiveTab, icon: FileText },
        ];
      case 'programs':
        return [
          { labelAr: 'المشاريع المرتبطة', labelEn: 'Linked Projects', tab: 'projects' as ActiveTab, icon: Briefcase },
          { labelAr: 'موازنة البرنامج', labelEn: 'Program Budget', tab: 'finance' as ActiveTab, icon: Coins },
          { labelAr: 'تحليلات البرامج والأثر', labelEn: 'Program BI & Impact', tab: 'reports' as ActiveTab, icon: Brain },
        ];
      case 'beneficiaries':
        return [
          { labelAr: 'كفالات الأيتام المباشرة', labelEn: 'Direct Sponsorships', tab: 'sponsorships' as ActiveTab, icon: Heart },
          { labelAr: 'الخريطة المكانية', labelEn: 'Spatial Map', tab: 'geospatial' as ActiveTab, icon: Globe },
          { labelAr: 'تقارير ومؤشرات الخدمة', labelEn: 'Service Delivery Reports', tab: 'reports' as ActiveTab, icon: FileText },
        ];
      case 'sponsorships':
        return [
          { labelAr: 'سجل المستفيدين الأيتام', labelEn: 'Beneficiaries Registry', tab: 'beneficiaries' as ActiveTab, icon: Users },
          { labelAr: 'المستحقات المالية', labelEn: 'Dues & Finance', tab: 'finance' as ActiveTab, icon: Coins },
        ];
      case 'finance':
        return [
          { labelAr: 'اعتمادات الصرف', labelEn: 'Approval Requests', tab: 'approvals' as ActiveTab, icon: ShieldCheck },
          { labelAr: 'أسعار العملات', labelEn: 'Currency Ledger', tab: 'currencies' as ActiveTab, icon: Coins },
          { labelAr: 'تقارير الميزانية والـ BI', labelEn: 'Financial Reports & BI', tab: 'reports' as ActiveTab, icon: FileText },
        ];
      case 'dashboard':
      case 'workspaces':
        return [
          { labelAr: 'الخطة الاستراتيجية', labelEn: 'Strategic Plan', tab: 'strategic_planning' as ActiveTab, icon: Target },
          { labelAr: 'المشاريع الميدانية', labelEn: 'Field Projects', tab: 'projects' as ActiveTab, icon: Briefcase },
          { labelAr: 'سجل المستفيدين والأيتام', labelEn: 'Beneficiaries', tab: 'beneficiaries' as ActiveTab, icon: Users },
          { labelAr: 'النظام المالي IPSAS', labelEn: 'Financial Ledger', tab: 'finance' as ActiveTab, icon: Coins },
        ];
      default:
        return [
          { labelAr: 'مركز الأنظمة المؤسسية', labelEn: 'Enterprise Systems Center', tab: 'domains' as ActiveTab, icon: Layers },
          { labelAr: 'تخصيص الكوادر والموارد', labelEn: 'Resource Allocations', tab: 'allocations' as ActiveTab, icon: Calendar },
          { labelAr: 'لوحة التقارير والمؤشرات', labelEn: 'BI Reports Board', tab: 'reports' as ActiveTab, icon: FileText },
        ];
    }
  };

  const contextualLinks = getContextualLinks();

  return (
    <div className="bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 shadow-xs z-20 shrink-0">
      {/* WORKSPACE TAB CONTROL STRIP (DEDICATED FULL WIDTH RTL TAB BAR) */}
      <div className="flex items-center border-b border-slate-200 dark:border-zinc-800/80 px-3 bg-slate-100/70 dark:bg-zinc-950/80 w-full overflow-hidden">
        {/* Workspace Open Tabs - 100% Full Width RTL */}
        <div className="flex items-end gap-1.5 overflow-x-auto custom-scrollbar pt-1.5 w-full rtl:flex-row">
          {(Array.from(new Set(openTabs)) as ActiveTab[]).map((tabKey) => {
            const cfg = tabConfig[tabKey] || tabConfig['dashboard'];
            const TabIcon = cfg.icon;
            const isActive = activeTab === tabKey;

            return (
              <div
                key={tabKey}
                onClick={() => {
                  triggerHaptic('light');
                  onSelectTab(tabKey);
                }}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-t-xl border-t border-x text-xs font-bold transition-all cursor-pointer select-none whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700/80 text-emerald-600 dark:text-emerald-400 font-black shadow-[0_-2px_12px_rgba(0,0,0,0.06)]'
                    : 'bg-slate-200/60 dark:bg-zinc-900/40 border-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-200/90 dark:hover:bg-zinc-800'
                }`}
                style={{ marginBottom: '-1px' }}
              >
                {isActive && (
                  <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 to-teal-400 rounded-t-xl"></span>
                )}
                <TabIcon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-zinc-400'}`} />
                <span>{isRtl ? cfg.title_ar : cfg.title_en}</span>

                {isActive && cfg.category_ar && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                    {isRtl ? cfg.category_ar : cfg.category_en}
                  </span>
                )}

                {openTabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(tabKey, e);
                    }}
                    className="p-1 rtl:mr-1 ltr:ml-1 rounded-md hover:bg-rose-500/20 hover:text-rose-500 text-zinc-400 transition-colors cursor-pointer"
                    title={isRtl ? 'إغلاق التبويب' : 'Close tab'}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ROW 2: CONTEXTUAL OPERATIONAL ACTIONS */}
      <div className="px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50 dark:bg-zinc-900/30">
        
        {/* Left Side: Context Breadcrumb on Home, or Search & Primary Action on Work Area */}
        {activeTab === 'dashboard' ? (
          <div className="flex items-center flex-wrap gap-3 text-xs py-0.5">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400 font-semibold">
              <span>{isRtl ? 'المنظومة' : 'System'}</span>
              <span className="text-slate-300 dark:text-zinc-600">/</span>
              <span className="font-extrabold text-slate-700 dark:text-zinc-200">
                {isRtl ? 'بيئة العمل' : 'Workspace'}
              </span>
            </div>

            {/* Smart Segmented Mode Switcher Pill */}
            <div className="flex items-center bg-slate-200/80 dark:bg-zinc-800 p-0.5 rounded-xl border border-slate-300/80 dark:border-zinc-700 text-xs shadow-2xs">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onSetHomeExperienceMode?.('work_first');
                }}
                className={`px-2.5 py-1 rounded-lg font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  homeExperienceMode === 'work_first'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={isRtl ? 'قمرة الإنجاز الفوري المؤسسي (نمط العمل السريع)' : 'Quantum Work-First Cockpit'}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isRtl ? 'قمرة الإنجاز الفوري' : 'Work-First'}</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  onSetHomeExperienceMode?.('classic_analytics');
                }}
                className={`px-2.5 py-1 rounded-lg font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  homeExperienceMode === 'classic_analytics'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={isRtl ? 'النمط الاستراتيجي التحليلي الكلاسيكي' : 'Classic Strategic Analytics Hub'}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>{isRtl ? 'النمط التحليلي الكلاسيكي' : 'Classic Analytics'}</span>
              </button>

              <button
                onClick={onOpenExperienceModeModal}
                className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer border-r border-slate-300 dark:border-zinc-700 pr-1.5 mr-0.5"
                title={isRtl ? 'تخصيص أنماط بيئة العمل والتوصيات الذكية (Alt + X)' : 'Customize Experience Modes (Alt + X)'}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center flex-wrap gap-2">
            
            {/* Active View Quick Filter / Search */}
            <div className="relative flex items-center">
              <Search className={`w-3.5 h-3.5 text-zinc-400 absolute ${isRtl ? 'right-2.5' : 'left-2.5'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={isRtl ? `تصفية ${currentConfig.title_ar}...` : `Filter ${currentConfig.title_en}...`}
                className={`text-xs py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 w-36 sm:w-48 transition-all font-medium ${
                  isRtl ? 'pr-8 pl-6' : 'pl-8 pr-6'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={onResetFilters}
                  className={`absolute ${isRtl ? 'left-2' : 'right-2'} text-zinc-400 hover:text-rose-500`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Primary Action Button (If applicable) */}
            {primaryAction && (
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  window.dispatchEvent(new CustomEvent('nexora-open-add-modal', { detail: { tab: activeTab } }));
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-white" />
                <span>{isRtl ? primaryAction.labelAr : primaryAction.labelEn}</span>
              </button>
            )}

          {/* View Mode Switcher for Projects/Activities/Geospatial */}
          {(activeTab === 'projects' || activeTab === 'activities' || activeTab === 'geospatial') && (
            <div className="flex items-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-0.5 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
                }`}
                title={isRtl ? 'عرض شبكي' : 'Grid View'}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'list' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
                }`}
                title={isRtl ? 'عرض قائمتي' : 'List View'}
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('gantt')}
                className={`p-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'gantt' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
                }`}
                title={isRtl ? 'عرض الجدول الزمني Gantt' : 'Gantt Timeline'}
              >
                <Calendar className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>
        )}

        {/* Right Side: Context Shortcuts (max 2, rest via overflow) */}
        <div className="flex items-center gap-1.5 overflow-hidden shrink-0">
          {contextualLinks.slice(0, 2).map((link, idx) => {
            const LinkIcon = link.icon;
            return (
              <button
                key={idx}
                onClick={() => onSelectTab(link.tab)}
                className="px-2.5 py-1 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-lg text-[11px] font-bold text-slate-700 dark:text-zinc-300 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <LinkIcon className="w-3 h-3 text-amber-500" />
                <span>{isRtl ? link.labelAr : link.labelEn}</span>
              </button>
            );
          })}
          {contextualLinks.length > 2 && (
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 px-1">+{contextualLinks.length - 2}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(UnifiedContextRibbonInner);
export { UnifiedContextRibbonInner as UnifiedContextRibbon };
