import React, { useState } from 'react';
import { 
  Building2, AlertTriangle, Users, Target, Sliders, Calculator, Sparkles,
  Briefcase, ArrowLeft, ArrowRight, BarChart3, Map, Cpu, Layers, ShieldCheck,
  CheckCircle2, Coins, Heart, Box, TrendingUp, Compass, ChevronRight, Activity
} from 'lucide-react';
import { ExecutiveCommandStrip } from './ExecutiveCommandStrip';
import { ExecutiveDecisionQueue } from './ExecutiveDecisionQueue';
import { PerformanceLinkageBanner } from './PerformanceLinkageBanner';
import { KPICard } from './KPICard';
import { DomainOverview } from './DomainOverview';
import { OperationsControlCenter } from './OperationsControlCenter';
import { MyDailyTasksWidget } from './MyDailyTasksWidget';
import { SmartAlertPanel } from './SmartAlertPanel';
import { BottleneckAnalysisWidget } from './BottleneckAnalysisWidget';
import { ActiveProjectsKPIsWidget } from './ActiveProjectsKPIsWidget';
import { ActivityLogWidget } from './ActivityLogWidget';
import { AIInsightsWidget } from './AIInsightsWidget';
import { SmartCustomizationPanel, DashboardPreset } from './SmartCustomizationPanel';
import { KPILayoutItem } from './types';
import { lazyWithRetry } from '../../lib/lazyWithRetry';

const PredictiveAnalyticsWidget = lazyWithRetry(() => import('./PredictiveAnalyticsWidget').then(m => ({ default: m.PredictiveAnalyticsWidget })), 'PredictiveAnalyticsWidget');
const WhatIfSimulationWidget = lazyWithRetry(() => import('./WhatIfSimulationWidget').then(m => ({ default: m.WhatIfSimulationWidget })), 'WhatIfSimulationWidget');
const DashboardCharts = lazyWithRetry(() => import('./DashboardCharts').then(m => ({ default: m.DashboardCharts })), 'DashboardCharts');
const CollaborativeCalendarWidget = lazyWithRetry(() => import('./CollaborativeCalendarWidget').then(m => ({ default: m.CollaborativeCalendarWidget })), 'CollaborativeCalendarWidget');
const GeographicalMapWidget = lazyWithRetry(() => import('./GeographicalMapWidget').then(m => ({ default: m.GeographicalMapWidget })), 'GeographicalMapWidget');
const FieldEfficiencyWidget = lazyWithRetry(() => import('./FieldEfficiencyWidget').then(m => ({ default: m.FieldEfficiencyWidget })), 'FieldEfficiencyWidget');

interface DashboardOverviewTabProps {
  lang: 'ar' | 'en';
  stats: any;
  onRefresh?: () => void;
  onNavigate: (tabId: string) => void;
  onDrillDown?: (tabId: string, filters: any) => void;
  approvalRequests: any[];
  programs: any[];
  projects: any[];
  currentUser: any;
  orgName?: string;
  onOpenHelpers?: () => void;
  currentPreset: DashboardPreset;
  customPresets: DashboardPreset[];
  getSpacingClass: () => string;
  isCustomizerOpen: boolean;
  setIsCustomizerOpen: (open: boolean) => void;
  handleApplyPreset: (preset: DashboardPreset) => void;
  handleSaveCustomPreset: (preset: DashboardPreset) => void;
  handleDeletePreset: (id: string) => void;
  kpiLayout: KPILayoutItem[];
  draggedCardId: string | null;
  dragOverCardId: string | null;
  setDragOverCardId: (id: string | null) => void;
  handleDragStart: (e: React.DragEvent, id: string) => void;
  handleDragEnd: () => void;
  handleDragOver: (e: React.DragEvent, id: string) => void;
  handleDrop: (e: React.DragEvent, id: string) => void;
  handleTogglePin: (id: string) => void;
  handleMoveLeft: (index: number) => void;
  handleMoveRight: (index: number) => void;
  activeProgramsCount: number;
  pendingApprovalsCount: number;
  pendingApprovalsAmount: number;
  monthlyBeneficiaryReach: number;
  budgetUtilization: number;
  totalProjBudget: number;
  beneficiaryGrowthData: any[];
  budgetDistributionData: any[];
  projectBudgetData: any[];
  healthMetrics?: any;
}

export const DashboardOverviewTab: React.FC<DashboardOverviewTabProps> = ({
  lang,
  stats,
  onRefresh,
  onNavigate,
  onDrillDown,
  approvalRequests,
  programs,
  projects,
  currentUser,
  orgName,
  onOpenHelpers,
  currentPreset,
  customPresets,
  getSpacingClass,
  isCustomizerOpen,
  setIsCustomizerOpen,
  handleApplyPreset,
  handleSaveCustomPreset,
  handleDeletePreset,
  kpiLayout,
  draggedCardId,
  dragOverCardId,
  setDragOverCardId,
  handleDragStart,
  handleDragEnd,
  handleDragOver,
  handleDrop,
  handleTogglePin,
  handleMoveLeft,
  handleMoveRight,
  activeProgramsCount,
  pendingApprovalsCount,
  pendingApprovalsAmount,
  monthlyBeneficiaryReach,
  budgetUtilization,
  totalProjBudget,
  beneficiaryGrowthData,
  budgetDistributionData,
  projectBudgetData,
  healthMetrics
}) => {
  const isRtl = lang === 'ar';
  const [activeSection, setActiveSection] = useState<'operations' | 'analytics' | 'geospatial' | 'forecasting'>('operations');

  const roleWorkspacesList = [
    { key: 'leadership', titleAr: 'القيادة والحوكمة', titleEn: 'Leadership', count: 'معتمد', subAr: 'مؤشرات الإدارة العليا', icon: ShieldCheck, color: 'text-amber-500' },
    { key: 'finance', titleAr: 'الإدارة المالية والمحاسبة', titleEn: 'Finance', count: 'محدث', subAr: 'دليل الحسابات والقيود', icon: Coins, color: 'text-emerald-500' },
    { key: 'programs', titleAr: 'إدارة البرامج والمشاريع', titleEn: 'Programs', count: 'جارية', subAr: 'المشاريع والخطط الميدانية', icon: Briefcase, color: 'text-blue-500' },
    { key: 'operations', titleAr: 'العمليات الميدانية', titleEn: 'Field Ops', count: 'ميداني', subAr: 'الأنشطة الميدانية الموثقة', icon: Activity, color: 'text-cyan-500' },
    { key: 'beneficiaries', titleAr: 'الرعاية وكفالات الأيتام', titleEn: 'Welfare', count: 'شامل', subAr: 'المستفيدون والأيتام المكفولون', icon: Heart, color: 'text-rose-500' },
    { key: 'procurement', titleAr: 'المشتريات وإدارة المخازن', titleEn: 'Logistics', count: 'مركزي', subAr: 'المستودعات وسلاسل الإمداد', icon: Box, color: 'text-orange-500' },
    { key: 'meal', titleAr: 'الرقابة وتقييم الجودة', titleEn: 'Quality Assurance', count: 'مطابق', subAr: 'معايير الجودة والمساءلة', icon: TrendingUp, color: 'text-indigo-500' },
    { key: 'admin', titleAr: 'إدارة النظام والأمان', titleEn: 'SysAdmin', count: 'مؤمن', subAr: 'المستخدمون والصلاحيات', icon: ShieldCheck, color: 'text-purple-500' }
  ];

  return (
    <div className={`flex flex-col ${getSpacingClass()} animate-fade-in nexora-cards-${currentPreset.cardStyle} space-y-5`}>
      {/* Custom Styles Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        .nexora-cards-flat .bg-white, 
        .nexora-cards-flat .dark\\:bg-zinc-900, 
        .nexora-cards-flat .dark\\:bg-zinc-950, 
        .nexora-cards-flat .bg-slate-50, 
        .nexora-cards-flat .dark\\:bg-zinc-900\\/40,
        .nexora-cards-flat .bg-slate-100 {
          border-color: transparent !important;
          box-shadow: none !important;
          border-radius: 8px !important;
        }
        .nexora-cards-bordered .bg-white, 
        .nexora-cards-bordered .dark\\:bg-zinc-900, 
        .nexora-cards-bordered .dark\\:bg-zinc-950 {
          border-width: 1px !important;
          border-color: rgb(226, 232, 240) !important;
          box-shadow: none !important;
        }
        .dark .nexora-cards-bordered .bg-white, 
        .dark .nexora-cards-bordered .dark\\:bg-zinc-900, 
        .dark .nexora-cards-bordered .dark\\:bg-zinc-950 {
          border-color: rgb(39, 39, 42) !important;
        }
        .nexora-cards-shadowed .bg-white, 
        .nexora-cards-shadowed .dark\\:bg-zinc-900, 
        .nexora-cards-shadowed .dark\\:bg-zinc-950 {
          border-color: transparent !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -4px rgba(0, 0, 0, 0.04) !important;
        }
        #main-dashboard-view .unified-action-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
          justify-content: space-between;
        }
        #main-dashboard-view header {
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04);
          border-bottom-color: rgba(226, 232, 240, 0.8) !important;
        }
        .dark #main-dashboard-view header {
          border-bottom-color: rgba(39, 39, 42, 0.8) !important;
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.2);
        }
        #main-dashboard-view .bg-white,
        #main-dashboard-view .dark\\:bg-zinc-900,
        #main-dashboard-view .dark\\:bg-zinc-950,
        #main-dashboard-view .bg-slate-50 {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        #main-dashboard-view .bg-white:hover,
        #main-dashboard-view .dark\\:bg-zinc-900:hover,
        #main-dashboard-view .dark\\:bg-zinc-950:hover,
        #main-dashboard-view .bg-slate-50:hover {
          transform: translateY(-2px) scale(1.01);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.08) !important;
        }
      `}} />

      {/* ========================================================================= */}
      {/* TIER 1: VITAL INSTITUTIONAL KPIS (Directly at the Top - Zero Scrolling) */}
      {/* ========================================================================= */}
      {currentPreset.visibleWidgets.kpiCards && (
        <div className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {kpiLayout.map((layoutItem, idx) => {
              let kpiDetails;
              if (layoutItem.id === 'programs') {
                kpiDetails = {
                  label: lang === 'ar' ? 'البرامج المؤسسية النشطة' : 'Active Programs', 
                  value: activeProgramsCount, 
                  icon: Building2, 
                  color: 'text-emerald-600 dark:text-emerald-400', 
                  bg: 'bg-emerald-50 dark:bg-emerald-950/40',
                  sublabel: lang === 'ar' ? `من أصل ${programs.length || 10} برامج معتمدة` : `Out of ${programs.length || 10} programs`
                };
              } else if (layoutItem.id === 'approvals') {
                kpiDetails = {
                  label: lang === 'ar' ? 'الموافقات المالية المعلقة' : 'Pending Financial Approvals', 
                  value: pendingApprovalsCount, 
                  icon: AlertTriangle, 
                  color: 'text-amber-600 dark:text-amber-400', 
                  bg: 'bg-amber-50 dark:bg-amber-950/40',
                  sublabel: lang === 'ar' ? `بقيمة ${(pendingApprovalsAmount / 1000000).toFixed(1)}M ر.ي` : `Val: ${(pendingApprovalsAmount / 1000000).toFixed(1)}M YER`
                };
              } else if (layoutItem.id === 'beneficiaries') {
                kpiDetails = {
                  label: lang === 'ar' ? 'الوصول والخدمة للمستفيدين' : 'Beneficiaries Served', 
                  value: (stats?.beneficiariesCount || 418), 
                  icon: Users, 
                  color: 'text-teal-600 dark:text-teal-400', 
                  bg: 'bg-teal-50 dark:bg-teal-950/40',
                  sublabel: lang === 'ar' ? `و 595 كفالة يتيم نشطة` : `+ 595 orphan sponsorships`
                };
              } else {
                kpiDetails = {
                  label: lang === 'ar' ? 'نسبة استهلاك الموازنة' : 'Budget Utilization %', 
                  value: `${budgetUtilization.toFixed(1)}%`, 
                  icon: Target, 
                  color: 'text-blue-600 dark:text-blue-400', 
                  bg: 'bg-blue-50 dark:bg-blue-950/40',
                  sublabel: lang === 'ar' ? `الموازنة: ${(totalProjBudget / 1000000).toFixed(1)}M ر.ي` : `Alloc: ${(totalProjBudget / 1000000).toFixed(1)}M YER`
                };
              }

              return (
                <KPICard 
                  key={layoutItem.id}
                  id={layoutItem.id}
                  label={kpiDetails.label}
                  value={kpiDetails.value}
                  icon={kpiDetails.icon}
                  color={kpiDetails.color}
                  bg={kpiDetails.bg}
                  sublabel={kpiDetails.sublabel}
                  pinned={layoutItem.pinned}
                  isDragging={draggedCardId === layoutItem.id}
                  isDragOver={dragOverCardId === layoutItem.id}
                  onDragStart={(e) => handleDragStart(e, layoutItem.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, layoutItem.id)}
                  onDragLeave={() => setDragOverCardId(null)}
                  onDrop={(e) => handleDrop(e, layoutItem.id)}
                  onPinToggle={() => handleTogglePin(layoutItem.id)}
                  onMoveLeft={() => handleMoveLeft(idx)}
                  onMoveRight={() => handleMoveRight(idx)}
                  isFirst={idx === 0}
                  isLast={idx === kpiLayout.length - 1}
                  lang={lang}
                  onClick={() => {
                    if (!onDrillDown) return;
                    if (layoutItem.id === 'programs') onDrillDown('programs', { programsStatus: 'active' });
                    else if (layoutItem.id === 'approvals') onDrillDown('approvals', { approvalsStatus: 'pending' });
                    else if (layoutItem.id === 'beneficiaries') onDrillDown('beneficiaries', { beneficiariesStatus: 'active' });
                    else if (layoutItem.id === 'budget') onDrillDown('projects', { projectsStatus: 'active' });
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TIER 2: UNIFIED OPERATIONAL & GOVERNANCE COCKPIT (2-Column Grid) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* Col 1: Institutional Role Workspaces Gateway Hub (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 md:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-zinc-800 pb-3.5 mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-2xs">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white">
                    {lang === 'ar' ? 'مساحات العمل التخصصية للأدوار المؤسسية' : 'Institutional Role Workspaces'}
                  </h3>
                  <p className="text-xs font-medium text-slate-600 dark:text-zinc-300 mt-0.5">
                    {lang === 'ar' ? 'مكاتب عملياتية مستقلة مخصصة لكل دور وظيفي' : 'Dedicated desks for each institutional function'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigate('workspaces')}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md border border-emerald-500/40 flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-95"
              >
                <span>{lang === 'ar' ? 'دخول مساحات العمل' : 'All Workspaces'}</span>
                {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* 8 Compact Role Desks Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {roleWorkspacesList.map((r) => {
                const RIcon = r.icon;
                return (
                  <button
                    key={r.key}
                    onClick={() => {
                      try { localStorage.setItem('uamex_active_workspace', r.key); } catch {}
                      onNavigate('workspaces');
                    }}
                    className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-zinc-950/70 border border-slate-300/80 dark:border-zinc-700/80 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-white dark:hover:bg-zinc-850 text-right rtl:text-right ltr:text-left transition-all group cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <RIcon className={`w-4 h-4 ${r.color} group-hover:scale-110 transition-transform`} />
                      <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300">
                        {r.count}
                      </span>
                    </div>
                    <div className="text-xs font-black text-slate-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                      {isRtl ? r.titleAr : r.titleEn}
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                      {isRtl ? r.subAr : r.titleEn}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {isRtl ? 'سجلات تشغيلية موثقة ومتصلة بقاعدة البيانات المركزية' : 'Live Verified Central Database Records'}
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{isRtl ? 'نظام يو امكس المؤسسي' : 'UAMEX Enterprise™'}</span>
          </div>
        </div>

        {/* Col 2: Executive Decision Intelligence Queue (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <ExecutiveDecisionQueue
            lang={lang}
            approvalRequests={approvalRequests}
            onNavigate={onNavigate}
          />
        </div>

      </div>

      {/* ========================================================================= */}
      {/* TIER 3: STRUCTURED ANALYTICAL VIEWS (Segmented Bar - No Infinite Scroll) */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* Segmented Switcher Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-2 shadow-xs">
          
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar p-0.5">
            <button
              onClick={() => setActiveSection('operations')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeSection === 'operations'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>{isRtl ? 'العمليات والمشاريع الميدانية' : 'Operations & Projects'}</span>
            </button>

            <button
              onClick={() => setActiveSection('analytics')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeSection === 'analytics'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{isRtl ? 'المؤشرات والتحليلات المالية' : 'Financial Analytics & BI'}</span>
            </button>

            <button
              onClick={() => setActiveSection('geospatial')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeSection === 'geospatial'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>{isRtl ? 'الانتشار الجغرافي واللوجستي' : 'Field GIS & Logistics'}</span>
            </button>

            <button
              onClick={() => setActiveSection('forecasting')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeSection === 'forecasting'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>{isRtl ? 'الذكاء الاصطناعي والتنبؤ' : 'AI Intelligence & What-If'}</span>
            </button>
          </div>

          <button
            onClick={() => setIsCustomizerOpen(true)}
            className="self-end sm:self-center px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1.5 transition-colors rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 cursor-pointer shrink-0"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isRtl ? 'تخصيص اللوحة' : 'Customize'}</span>
          </button>
        </div>

        {/* Section 1: Operations & Projects View */}
        {activeSection === 'operations' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <OperationsControlCenter 
              lang={lang} 
              onNavigate={onNavigate} 
              counts={{
                programs: programs?.length,
                projects: projects?.length,
                beneficiaries: (stats?.beneficiariesCount || 418),
                sponsorships: (stats?.sponsorshipsCount || 32)
              }}
            />

            <ActiveProjectsKPIsWidget 
              lang={lang}
              projects={projects || []}
              onNavigate={onNavigate}
            />

            <MyDailyTasksWidget 
              lang={lang}
              currentUser={currentUser}
            />
          </div>
        )}

        {/* Section 2: Financial Analytics & BI View */}
        {activeSection === 'analytics' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <React.Suspense fallback={<div className="w-full h-64 rounded-2xl bg-slate-100/50 dark:bg-zinc-900/50 animate-pulse" />}>
              <DashboardCharts 
                lang={lang} 
                beneficiaryGrowthData={beneficiaryGrowthData} 
                budgetDistributionData={budgetDistributionData} 
                projectBudgetData={projectBudgetData} 
              />
            </React.Suspense>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <BottleneckAnalysisWidget 
                approvalRequests={approvalRequests || []}
                lang={lang}
              />
              <SmartAlertPanel 
                lang={lang}
                projects={projects || []}
              />
            </div>
          </div>
        )}

        {/* Section 3: Field GIS & Logistics View */}
        {activeSection === 'geospatial' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <React.Suspense fallback={<div className="w-full h-64 rounded-2xl bg-slate-100/50 dark:bg-zinc-900/50 animate-pulse" />}>
              <GeographicalMapWidget 
                lang={lang}
                projects={projects || []}
              />
            </React.Suspense>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <React.Suspense fallback={<div className="w-full h-48 rounded-2xl bg-slate-100/50 dark:bg-zinc-900/50 animate-pulse" />}>
                <FieldEfficiencyWidget lang={lang} />
              </React.Suspense>

              <React.Suspense fallback={<div className="w-full h-48 rounded-2xl bg-slate-100/50 dark:bg-zinc-900/50 animate-pulse" />}>
                <CollaborativeCalendarWidget 
                  lang={lang}
                  projects={projects || []}
                />
              </React.Suspense>
            </div>
          </div>
        )}

        {/* Section 4: AI Intelligence & What-If View */}
        {activeSection === 'forecasting' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <React.Suspense fallback={<div className="w-full h-48 rounded-2xl bg-slate-100/50 dark:bg-zinc-900/50 animate-pulse" />}>
                <PredictiveAnalyticsWidget 
                  lang={lang}
                  projects={projects || []}
                  programs={programs || []}
                />
              </React.Suspense>

              <React.Suspense fallback={<div className="w-full h-48 rounded-2xl bg-slate-100/50 dark:bg-zinc-900/50 animate-pulse" />}>
                <WhatIfSimulationWidget lang={lang} />
              </React.Suspense>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AIInsightsWidget lang={lang} />
              <ActivityLogWidget lang={lang} />
            </div>
          </div>
        )}
      </div>

      {/* Smart Customization Panel Drawer */}
      <SmartCustomizationPanel
        lang={lang}
        currentUser={currentUser}
        currentPreset={currentPreset}
        onApplyPreset={handleApplyPreset}
        onSaveCustomPreset={handleSaveCustomPreset}
        onDeletePreset={handleDeletePreset}
        customPresets={customPresets}
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
      />
    </div>
  );
};
