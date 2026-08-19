import React, { Component, ErrorInfo, ReactNode } from 'react';
import { WorkspaceShell } from './enterprise/WorkspaceShell';
import PerformanceMetricsView from './dashboard/PerformanceMetricsView';
import { SystemReadinessView } from './dashboard/SystemReadinessView';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { DashboardOverviewTab } from './dashboard/DashboardOverviewTab';
import { ExecutiveSummaryModal } from './dashboard/ExecutiveSummaryModal';
import { useDashboardState } from './dashboard/useDashboardState';
import { useDashboardData } from './dashboard/useDashboardData';
import { DashboardViewProps } from './dashboard/types';
import { Activity, RefreshCw, AlertTriangle } from 'lucide-react';

// Error Boundary for graceful crash recovery
class DashboardErrorBoundary extends Component<
  { children: ReactNode; lang: 'ar' | 'en' },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: ReactNode; lang: 'ar' | 'en' }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Dashboard Error]:', error, info.componentStack);
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 rounded-2xl flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white mb-2">
            {this.props.lang === 'ar' ? 'حدث خطأ غير متوقع' : 'An Unexpected Error Occurred'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4 max-w-md">
            {this.props.lang === 'ar'
              ? 'تعذر تحميل لوحة القيادة. يرجى إعادة المحاولة أو العودة للصفحة الرئيسية.'
              : 'Failed to load the dashboard. Please try again or return to the home page.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {this.props.lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Skeleton loader for initial dashboard load
function DashboardSkeleton({ lang }: { lang: 'ar' | 'en' }) {
  return (
    <div className="w-full flex flex-col gap-4 animate-pulse">
      {/* Header skeleton */}
      <div className="h-14 bg-slate-200 dark:bg-zinc-800 rounded-2xl" />
      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 bg-slate-200 dark:bg-zinc-800 rounded-2xl" />
        ))}
      </div>
      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-64 bg-slate-200 dark:bg-zinc-800 rounded-2xl" />
        <div className="h-64 bg-slate-200 dark:bg-zinc-800 rounded-2xl" />
      </div>
      {/* Table skeleton */}
      <div className="h-48 bg-slate-200 dark:bg-zinc-800 rounded-2xl" />
    </div>
  );
}

export default function DashboardView({
  stats,
  loading,
  onNavigate,
  onDrillDown,
  lang,
  onRefresh,
  programs = [],
  projects = [],
  beneficiaries = [],
  sponsorships = [],
  approvalRequests = [],
  currentUser,
  activeOrg,
  orgName,
  onOpenHelpers
}: DashboardViewProps) {
  const state = useDashboardState(currentUser);

  const data = useDashboardData({
    stats,
    lang,
    programs,
    projects,
    beneficiaries,
    sponsorships,
    approvalRequests
  });

  const handleGenerateSummary = async () => {
    state.setIsSummaryLoading(true);
    state.setSummaryError(null);
    state.setIsSummaryModalOpen(true);
    state.setSummaryOutput(null);

    const activeAlerts = data.compileAlertsForSummary();

    const metricsPayload = {
      activeProgramsCount: data.activeProgramsCount,
      pendingApprovalsCount: data.pendingApprovalsCount,
      pendingApprovalsAmount: data.pendingApprovalsAmount,
      monthlyBeneficiaryReach: data.monthlyBeneficiaryReach,
      budgetUtilization: `${(data.budgetUtilization * 100).toFixed(1)}%`,
      totalProgramBudget: stats?.financials?.totalProgramBudget || 0,
      totalProjectsCount: (projects || []).length,
      totalBeneficiariesCount: (beneficiaries || []).length,
      totalSponsorshipsCount: (sponsorships || []).length
    };

    try {
      const response = await fetch('/api/gemini/executive-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metrics: metricsPayload,
          alerts: activeAlerts,
          language: lang
        })
      });

      const resData = await response.json();
      if (resData.status === 'ok') {
        state.setSummaryOutput(resData.summary);
      } else {
        state.setSummaryError(
          lang === 'ar'
            ? 'تعذّر إنشاء التقرير التنفيذي. يُرجى التحقق من البيانات وإعادة المحاولة.'
            : 'Failed to generate the executive report. Please verify your data and try again.'
        );
      }
    } catch {
      state.setSummaryError(
        lang === 'ar'
          ? 'حدث خطأ غير متوقع أثناء تحليل البيانات. يُرجى إعادة المحاولة لاحقاً.'
          : 'An unexpected error occurred while generating the report. Please try again later.'
      );
    } finally {
      state.setIsSummaryLoading(false);
    }
  };

  const headerContent = (
    <DashboardHeader
      lang={lang}
      activeSubTab={state.activeSubTab}
      setActiveSubTab={state.setActiveSubTab}
      isViewDropdownOpen={state.isViewDropdownOpen}
      setIsViewDropdownOpen={state.setIsViewDropdownOpen}
      isMoreDropdownOpen={state.isMoreDropdownOpen}
      setIsMoreDropdownOpen={state.setIsMoreDropdownOpen}
      setIsCustomizerOpen={state.setIsCustomizerOpen}
      handleGenerateSummary={handleGenerateSummary}
      onRefresh={onRefresh}
      onNavigate={onNavigate}
      handleResetLayout={state.handleResetLayout}
      programs={programs}
      projects={projects}
      approvalRequests={approvalRequests}
    />
  );

  return (
    <div id="main-dashboard-view" className="w-full flex flex-col gap-4">
      <DashboardErrorBoundary lang={lang}>
        <WorkspaceShell header={headerContent}>
          <div id="dashboard-content" className="flex flex-col gap-6 animate-fade-in pb-8">
            {loading ? (
              <DashboardSkeleton lang={lang} />
            ) : state.activeSubTab === 'overview' ? (
              <DashboardOverviewTab
                lang={lang}
                stats={stats}
                onRefresh={onRefresh}
                onNavigate={onNavigate}
                onDrillDown={onDrillDown}
                approvalRequests={approvalRequests}
                programs={programs}
                projects={projects}
                currentUser={currentUser}
                orgName={orgName}
                onOpenHelpers={onOpenHelpers}
                currentPreset={state.currentPreset}
                customPresets={state.customPresets}
                getSpacingClass={state.getSpacingClass}
                isCustomizerOpen={state.isCustomizerOpen}
                setIsCustomizerOpen={state.setIsCustomizerOpen}
                handleApplyPreset={state.handleApplyPreset}
                handleSaveCustomPreset={state.handleSaveCustomPreset}
                handleDeletePreset={state.handleDeletePreset}
                kpiLayout={state.kpiLayout}
                draggedCardId={state.draggedCardId}
                dragOverCardId={state.dragOverCardId}
                setDragOverCardId={state.setDragOverCardId}
                handleDragStart={state.handleDragStart}
                handleDragEnd={state.handleDragEnd}
                handleDragOver={state.handleDragOver}
                handleDrop={state.handleDrop}
                handleTogglePin={state.handleTogglePin}
                handleMoveLeft={state.handleMoveLeft}
                handleMoveRight={state.handleMoveRight}
                activeProgramsCount={data.activeProgramsCount}
                pendingApprovalsCount={data.pendingApprovalsCount}
                pendingApprovalsAmount={data.pendingApprovalsAmount}
                monthlyBeneficiaryReach={data.monthlyBeneficiaryReach}
                budgetUtilization={data.budgetUtilization}
                totalProjBudget={data.totalProjBudget}
                beneficiaryGrowthData={data.beneficiaryGrowthData}
                budgetDistributionData={data.budgetDistributionData}
                projectBudgetData={data.projectBudgetData}
                healthMetrics={data.healthMetrics}
              />
            ) : state.activeSubTab === 'performance' ? (
              <div className="animate-fade-in">
                <PerformanceMetricsView 
                  lang={lang}
                  projects={projects}
                  onRefresh={onRefresh}
                  orgName={orgName}
                />
              </div>
            ) : (
              <div className="animate-fade-in">
                <SystemReadinessView 
                  lang={lang}
                  orgName={orgName}
                />
              </div>
            )}
          </div>
        </WorkspaceShell>
      </DashboardErrorBoundary>

      <ExecutiveSummaryModal
        isOpen={state.isSummaryModalOpen}
        isLoading={state.isSummaryLoading}
        error={state.summaryError}
        summaryOutput={state.summaryOutput}
        lang={lang}
        orgName={orgName}
        onClose={() => state.setIsSummaryModalOpen(false)}
        onRetry={handleGenerateSummary}
      />
    </div>
  );
}
