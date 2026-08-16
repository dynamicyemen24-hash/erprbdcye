import React from 'react';
import { 
  Building2, AlertTriangle, Users, Target, Sliders, Calculator, Sparkles 
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

const PredictiveAnalyticsWidget = React.lazy(() => import('./PredictiveAnalyticsWidget').then(m => ({ default: m.PredictiveAnalyticsWidget })));
const WhatIfSimulationWidget = React.lazy(() => import('./WhatIfSimulationWidget').then(m => ({ default: m.WhatIfSimulationWidget })));
const DashboardCharts = React.lazy(() => import('./DashboardCharts').then(m => ({ default: m.DashboardCharts })));
const CollaborativeCalendarWidget = React.lazy(() => import('./CollaborativeCalendarWidget').then(m => ({ default: m.CollaborativeCalendarWidget })));
const GeographicalMapWidget = React.lazy(() => import('./GeographicalMapWidget').then(m => ({ default: m.GeographicalMapWidget })));
const FieldEfficiencyWidget = React.lazy(() => import('./FieldEfficiencyWidget').then(m => ({ default: m.FieldEfficiencyWidget })));

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
  return (
    <div className={`flex flex-col ${getSpacingClass()} animate-fade-in nexora-cards-${currentPreset.cardStyle}`}>
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

      {/* Layer 1: Executive Command Strip (Enterprise Health Index & Strategic Alignment) */}
      <div className="w-full">
        <ExecutiveCommandStrip
          lang={lang}
          onNavigate={onNavigate}
          healthMetrics={healthMetrics}
        />
      </div>

      {/* Layer 2: Executive Decision Intelligence Queue (MY DECISIONS) */}
      <div className="w-full">
        <ExecutiveDecisionQueue
          lang={lang}
          approvalRequests={approvalRequests}
          onNavigate={onNavigate}
        />
      </div>

      {/* Institutional Performance Linkage Banner */}
      <PerformanceLinkageBanner lang={lang} stats={stats} />

      {/* KPI Bento Grid with custom layouts */}
      {currentPreset.visibleWidgets.kpiCards && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {kpiLayout.map((layoutItem, idx) => {
              let kpiDetails;
              if (layoutItem.id === 'programs') {
                kpiDetails = {
                  label: lang === 'ar' ? 'البرامج النشطة' : 'Total Active Programs', 
                  value: activeProgramsCount, 
                  icon: Building2, 
                  color: 'text-emerald-600 dark:text-emerald-400', 
                  bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                  sublabel: lang === 'ar' ? `من أصل ${programs.length || 4} برامج جارية` : `Out of ${programs.length || 4} total programs`
                };
              } else if (layoutItem.id === 'approvals') {
                kpiDetails = {
                  label: lang === 'ar' ? 'الموافقات المالية المعلقة' : 'Pending Financial Approvals', 
                  value: pendingApprovalsCount, 
                  icon: AlertTriangle, 
                  color: 'text-amber-600 dark:text-amber-400', 
                  bg: 'bg-amber-50 dark:bg-amber-900/20',
                  sublabel: lang === 'ar' ? `بقيمة ${(pendingApprovalsAmount / 1000000).toFixed(1)} مليون ر.ي` : `Val: ${(pendingApprovalsAmount / 1000000).toFixed(1)}M YER`
                };
              } else if (layoutItem.id === 'beneficiaries') {
                kpiDetails = {
                  label: lang === 'ar' ? 'الوصول الشهري للمستفيدين' : 'Monthly Beneficiary Reach', 
                  value: monthlyBeneficiaryReach, 
                  icon: Users, 
                  color: 'text-emerald-600 dark:text-emerald-400', 
                  bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                  sublabel: lang === 'ar' ? 'مستهدف قاعدة البيانات 8.1K' : 'Targeting 8.1K database cases'
                };
              } else {
                kpiDetails = {
                  label: lang === 'ar' ? 'نسبة استهلاك الموازنة' : 'Budget Utilization %', 
                  value: `${budgetUtilization.toFixed(1)}%`, 
                  icon: Target, 
                  color: 'text-amber-600 dark:text-amber-400', 
                  bg: 'bg-amber-50 dark:bg-amber-900/20',
                  sublabel: lang === 'ar' ? `مخصصة: ${(totalProjBudget / 1000000).toFixed(0)} مليون ر.ي` : `Allocated: ${(totalProjBudget / 1000000).toFixed(0)}M YER`
                };
              }

              return (
                <React.Fragment key={layoutItem.id}>
                  <KPICard 
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
                      if (layoutItem.id === 'programs') {
                        onDrillDown('programs', { programsStatus: 'active' });
                      } else if (layoutItem.id === 'approvals') {
                        onDrillDown('approvals', { approvalsStatus: 'pending' });
                      } else if (layoutItem.id === 'beneficiaries') {
                        onDrillDown('beneficiaries', { beneficiariesStatus: 'active' });
                      } else if (layoutItem.id === 'budget') {
                        onDrillDown('projects', { projectsStatus: 'active' });
                      }
                    }}
                  />
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {!currentPreset.visibleWidgets.kpiCards && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 dark:bg-zinc-900/40 px-4 py-3 rounded-xl border border-slate-200/60 dark:border-zinc-800 gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 animate-pulse"></span>
            </span>
            <span className="text-[11px] font-black uppercase text-slate-500 dark:text-zinc-400">
              {lang === 'ar' 
                ? 'مؤشرات الأداء مخفية في هذا التخطيط. يمكنك فتح لوحة التخصيص الذكي لتعديل الإعدادات.' 
                : 'KPI Cards are hidden in this layout preset. Open the Smart Customization panel to configure.'
              }
            </span>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsCustomizerOpen(true)}
              className="text-[10px] font-black text-slate-700 hover:text-emerald-600 dark:text-zinc-200 dark:hover:text-emerald-400 flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 cursor-pointer shadow-3xs hover:border-emerald-500/20"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
              <span>{lang === 'ar' ? 'التخصيص الذكي للوحة' : 'Smart Customization'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Operations Control Center (6 Direct Daily Actions & Clean Categorized Modules) */}
      {(currentPreset.visibleWidgets.operationsCenter || currentPreset.visibleWidgets.domainOverview) && (
        <div className="w-full">
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
        </div>
      )}

      {/* My Daily Tasks Interactive Kanban Board */}
      <div className="w-full">
        <MyDailyTasksWidget 
          lang={lang}
          currentUser={currentUser}
        />
      </div>

      {/* Smart Alert Panel for Risk Management */}
      {currentPreset.visibleWidgets.smartAlerts && (
        <div className="w-full">
          <SmartAlertPanel 
            lang={lang}
            projects={projects || []}
          />
        </div>
      )}

      {/* Operational Bottleneck SLA Analysis Dashboard */}
      {currentPreset.visibleWidgets.bottleneckAnalysis && (
        <div className="w-full">
          <BottleneckAnalysisWidget 
            approvalRequests={approvalRequests || []}
            lang={lang}
          />
        </div>
      )}

      {/* Active Projects Real-Time Recharts Performance KPIs */}
      {currentPreset.visibleWidgets.charts && (
        <div className="w-full">
          <ActiveProjectsKPIsWidget 
            lang={lang}
            projects={projects || []}
            onNavigate={onNavigate}
          />
        </div>
      )}

      {/* AI Predictive Analytics & Forecasting Engine */}
      {currentPreset.visibleWidgets.aiInsights && (
        <div className="w-full">
          <React.Suspense fallback={<div className="w-full h-32 rounded-2xl bg-slate-100/50 dark:bg-zinc-900/50 animate-pulse" />}>
            <PredictiveAnalyticsWidget 
              lang={lang}
              projects={projects || []}
              programs={programs || []}
            />
          </React.Suspense>
        </div>
      )}

      {/* Strategic What-If Simulation Engine */}
      {currentPreset.visibleWidgets.aiInsights && (
        <div className="w-full">
          <React.Suspense fallback={<div className="w-full h-32 rounded-2xl bg-slate-100/50 dark:bg-zinc-900/50 animate-pulse" />}>
            <WhatIfSimulationWidget 
              lang={lang}
            />
          </React.Suspense>
        </div>
      )}

      {/* Charts and Operational Widgets Row */}
      {(currentPreset.visibleWidgets.charts || currentPreset.visibleWidgets.activityLog || currentPreset.visibleWidgets.aiInsights) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {currentPreset.visibleWidgets.charts && (
            <div className={
              (currentPreset.visibleWidgets.activityLog || currentPreset.visibleWidgets.aiInsights) 
                ? "lg:col-span-2" 
                : "lg:col-span-3"
            }>
              <React.Suspense fallback={<div className="w-full h-64 rounded-2xl bg-slate-100/50 dark:bg-zinc-900/50 animate-pulse" />}>
                <DashboardCharts 
                  lang={lang} 
                  beneficiaryGrowthData={beneficiaryGrowthData} 
                  budgetDistributionData={budgetDistributionData} 
                  projectBudgetData={projectBudgetData} 
                />
              </React.Suspense>
            </div>
          )}
          {(currentPreset.visibleWidgets.activityLog || currentPreset.visibleWidgets.aiInsights) && (
            <div className={
              currentPreset.visibleWidgets.charts 
                ? "lg:col-span-1 flex flex-col gap-6" 
                : "lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6"
            }>
              {currentPreset.visibleWidgets.activityLog && <ActivityLogWidget lang={lang} />}
              {currentPreset.visibleWidgets.aiInsights && <AIInsightsWidget lang={lang} />}
            </div>
          )}
        </div>
      )}

      {/* Collaborative Operations Calendar Row */}
      {currentPreset.visibleWidgets.calendar && (
        <div className="w-full">
          <React.Suspense fallback={<div className="w-full h-32 rounded-2xl bg-slate-100/50 dark:bg-zinc-900/50 animate-pulse" />}>
            <CollaborativeCalendarWidget 
              lang={lang}
              projects={projects || []}
            />
          </React.Suspense>
        </div>
      )}

      {/* Geographical Operations Map Row */}
      {currentPreset.visibleWidgets.geoMap && (
        <div className="w-full">
          <React.Suspense fallback={<div className="w-full h-48 rounded-2xl bg-slate-100/50 dark:bg-zinc-900/50 animate-pulse" />}>
            <GeographicalMapWidget 
              lang={lang}
              projects={projects || []}
            />
          </React.Suspense>
        </div>
      )}

      {/* Field Coverage & Visit Efficiency Row */}
      {currentPreset.visibleWidgets.fieldEfficiency && (
        <div className="w-full">
          <React.Suspense fallback={<div className="w-full h-32 rounded-2xl bg-slate-100/50 dark:bg-zinc-900/50 animate-pulse" />}>
            <FieldEfficiencyWidget 
              lang={lang}
            />
          </React.Suspense>
        </div>
      )}

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
