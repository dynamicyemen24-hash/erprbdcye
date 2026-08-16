import React from 'react';
import { WorkspaceShell } from './enterprise/WorkspaceShell';
import PerformanceMetricsView from './dashboard/PerformanceMetricsView';
import { SystemReadinessView } from './dashboard/SystemReadinessView';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { DashboardOverviewTab } from './dashboard/DashboardOverviewTab';
import { ExecutiveSummaryModal } from './dashboard/ExecutiveSummaryModal';
import { useDashboardState } from './dashboard/useDashboardState';
import { useDashboardData } from './dashboard/useDashboardData';
import { DashboardViewProps } from './dashboard/types';

import { Building2, Target, ShieldCheck } from 'lucide-react';

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
  // Use extracted state manager hook
  const state = useDashboardState(currentUser);

  // Use extracted data manager hook
  const data = useDashboardData({
    stats,
    lang,
    programs,
    projects,
    beneficiaries,
    sponsorships,
    approvalRequests
  });

  // Handler for triggering Gemini AI Executive Summary
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
    } catch (err: any) {
      console.error('Error generating summary:', err);
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
      <WorkspaceShell header={headerContent}>
        <div id="dashboard-content" className="flex flex-col gap-6 animate-fade-in pb-8">
          
          {state.activeSubTab === 'overview' ? (
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

      {/* AI Executive Summary Modal */}
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
