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
  ChevronDown
} from 'lucide-react';
import { triggerHaptic } from '../helpers/hapticSwipe';
import { ActiveTab } from '../core/types';
import { useEnterprise } from '../core/context/EnterpriseContext';

export interface TabConfigItem {
  icon: any;
  title_ar: string;
  title_en: string;
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
  organizationName
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
        return { labelAr: 'تسجيل مستفيد جديد', labelEn: 'Add Program', tagAr: 'الجنس' };
      case 'projects':
        return { labelAr: 'منطقة عالية الأمان', labelEn: 'Add Project', tagAr: 'فبراير' };
      case 'activities':
        return { labelAr: 'إضافة نشاط WBS', labelEn: 'Add Activity', tagAr: 'تشغيل' };
      case 'beneficiaries':
        return { labelAr: 'تسجيل مستفيد جديد', labelEn: 'Register Beneficiary', tagAr: 'خدمات' };
      case 'sponsorships':
        return { labelAr: 'إصدار كفالة جديدة', labelEn: 'New Sponsorship', tagAr: 'رعاية' };
      case 'finance':
        return { labelAr: 'إضافة قيد محاسبي IPSAS', labelEn: 'Add Ledger Entry', tagAr: 'مالية' };
      case 'allocations':
        return { labelAr: 'تخصيص موظف جديد', labelEn: 'Allocate Resource', tagAr: 'موارد' };
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
      default:
        return [
          { labelAr: 'مركز الأنظمة المؤسسية', labelEn: 'Enterprise Systems Center', tab: 'domains' as ActiveTab, icon: Layers },
          { labelAr: 'تخصيص الكوادر', labelEn: 'Resource Allocations', tab: 'allocations' as ActiveTab, icon: Calendar },
          { labelAr: 'أمين المستودع المعتمد', labelEn: 'BI Reports Board', tab: 'reports' as ActiveTab, icon: FileText },
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
      {activeTab !== 'dashboard' && (
      <div className="px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50 dark:bg-zinc-900/30">
        
        {/* Left Side: Search & Primary Action */}
        <div className="flex items-center flex-wrap gap-2">
          
          {/* Active View Quick Filter / Search */}
          <div className="relative flex items-center">
            <Search className={`w-3.5 h-3.5 text-zinc-400 absolute ${isRtl ? 'right-2.5' : 'left-2.5'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={isRtl ? `تحويل ${currentConfig.title_ar}...` : `Filter ${currentConfig.title_en}...`}
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

        {/* Right Side: Context Shortcuts & AI Tools */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar max-w-full">
          
          {/* Contextual Jump Links */}
          {contextualLinks.map((link, idx) => {
            const LinkIcon = link.icon;
            return (
              <button
                key={idx}
                onClick={() => onSelectTab(link.tab)}
                className="px-2.5 py-1 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-lg text-[11px] font-bold text-slate-700 dark:text-zinc-300 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <LinkIcon className="w-3 h-3 text-amber-500" />
                <span>{isRtl ? link.labelAr : link.labelEn}</span>
              </button>
            );
          })}

          {/* Export Data Button */}
          <button
            onClick={onOpenExportModal}
            className="p-1.5 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer"
            title={isRtl ? 'تصدير بيانات الوحدة' : 'Export Module Data'}
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </button>

          {/* Nexora AI Copilot Trigger */}
          <button
            onClick={onOpenCopilot}
            className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-amber-400 rounded-lg text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title={isRtl ? 'مساعد الذكاء الاصطناعي التشغيلي' : 'Nexora AI Copilot'}
          >
            <Brain className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          </button>
        </div>
      </div>
      )}
    </div>
  );
};

export default React.memo(UnifiedContextRibbonInner);
export { UnifiedContextRibbonInner as UnifiedContextRibbon };
