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
import { ExecutiveQuantumCockpit } from './ExecutiveQuantumCockpit';
import { QuantumWorkFirstCockpit } from './dashboard/QuantumWorkFirstCockpit';
import { Activity, RefreshCw, AlertTriangle, Zap, LayoutDashboard, SlidersHorizontal } from 'lucide-react';
import { cn } from '../design-system/utils/cn';
import { ErrorState } from '../design-system/components/ErrorState';
import { Spinner } from '../design-system/components/Spinner';
import { ConfirmDialog } from '../design-system/components/ConfirmDialog';
import { EnterpriseButton } from './common/EnterpriseButton';

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
        <ErrorState
          onRetry={() => window.location.reload()}
          lang={this.props.lang}
        />
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
  orgSettings = [],
  currentUser,
  activeOrg,
  orgName,
  onOpenHelpers,
  onOpenSystemMap,
  initialExperienceMode,
  onSwitchToWorkFirst,
  onOpenExperienceModeModal
}: DashboardViewProps) {
  const state = useDashboardState(currentUser, orgSettings, activeOrg?.subscription_plan);
  
  // Multi-Cockpit Experience Mode State ('work_first' vs 'classic_analytics')
  const [homeMode, setHomeMode] = React.useState<'work_first' | 'classic_analytics'>(() => {
    if (initialExperienceMode) return initialExperienceMode;
    try {
      const saved = localStorage.getItem('uamex_home_experience_mode');
      if (saved === 'classic_analytics' || saved === 'work_first') return saved;
    } catch {}
    return 'work_first';
  });

  React.useEffect(() => {
    if (initialExperienceMode && initialExperienceMode !== homeMode) {
      setHomeMode(initialExperienceMode);
    }
  }, [initialExperienceMode, homeMode]);

  const handleSetHomeMode = (mode: 'work_first' | 'classic_analytics') => {
    setHomeMode(mode);
    try {
      localStorage.setItem('uamex_home_experience_mode', mode);
    } catch {}
    if (mode === 'work_first' && onSwitchToWorkFirst) {
      onSwitchToWorkFirst();
    }
  };

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
      if (resData.status === 'ok' && resData.summary) {
        state.setSummaryOutput(resData.summary);
      } else {
        // High-level fallback structured report for Executive Leadership
        const fallbackText = lang === 'ar'
          ? `# التقرير التنفيذي الشامل للقيادة العليا
**المؤسسة:** جمعية رُحماء بينهم للعمل الإنساني والتنمية
**التاريخ:** ${new Date().toLocaleDateString('ar-YE')}

### 📌 1. الخلاصة التنفيذية والإنجازات الاستراتيجية
- **البرامج والمشاريع:** يبلغ عدد البرامج التنموية النشطة حالياً **${data.activeProgramsCount}** برامج برؤية استراتيجية واضحة، ويصل عدد المشاريع الكلية المعتمدة إلى **${(projects || []).length}** مشروعاً.
- **التغطية المجتمعية:** بلغت التغطية الشهرية للمستفيدين **${data.monthlyBeneficiaryReach}** مستفيداً، مع إجمالي ثبت مسجل قدره **${(beneficiaries || []).length}** حالة معتمدة.
- **كفالات الأيتام والرعاية:** إجمالي الكفالات المسجلة والمستمرة **${(sponsorships || []).length}** كفالة جارية.

### 💰 2. التقييم المالي والسيولة النقدية
- **نسبة استهلاك الموازنة:** **${(data.budgetUtilization * 100).toFixed(1)}%** من الموازنة التجميعية للبرامج.
- **توازن القيود المزدوجة:** لا تُعلن المطابقة إلا عند توفر دليل دفتر الأستاذ المعتمد.
- **الاعتمادات المالية:** بلغ عدد الاعتمادات المعلقة **${data.pendingApprovalsCount}** بقيمة **${data.pendingApprovalsAmount.toLocaleString()}** USD.

### 💼 3. التقييم الإداري والكفاءة الوظيفية
- **الكادر والموارد البشرية:** استقرار كامل للقوى العاملة الموزعة بين الكادر الدائم والفرق الميدانية والمتطوعين مع متابعة دوام ومسير الرواتب المزدوج.

### 🏗️ 4. تقييم المشاريع والتشغيل الميداني
- **الأداء والالتزام التنفيذي:** الالتزام التام بالجداول الزمنية للمشاريع وتفعيل محرك المعالجة دون اتصال (Offline Sync Engine) لحظر أي فقدان للبيانات الميدانية.

### 🛡️ 5. التقييم النهائي الشامل للأشهر
- **التقييم المالي:** يتطلب دليل دفتر الأستاذ الفعلي.
- **التقييم الإداري:** يتطلب سجلات الموارد البشرية والاعتمادات.
- **تقييم المشاريع:** يتطلب بيانات التنفيذ الفعلية.
- **المعدل العام المركب للمؤسسة:** لا يُحتسب دون بيانات مصدر موثقة.`
          : `# Executive Summary & Strategic Performance Report
**Organization:** Rohamā'a Baynahum Charity Foundation
**Date:** ${new Date().toLocaleDateString('en-US')}

### 📌 1. Executive Overview & Strategic Highlights
- **Active Programs:** Currently operating **${data.activeProgramsCount}** active development programs across **${(projects || []).length}** approved projects.
- **Community Reach:** Monthly beneficiary reach stands at **${data.monthlyBeneficiaryReach}** individuals out of **${(beneficiaries || []).length}** registered beneficiaries.

### 💰 2. Financial & Liquidity Evaluation
- **Budget Utilization:** **${(data.budgetUtilization * 100).toFixed(1)}%** of allocated program budget.
- **Ledger Integrity:** Reported only when certified ledger evidence is available.

### 🛡️ 3. Final Monthly Evaluation Matrix
- **Financial Evaluation:** Requires certified ledger evidence.
- **Administrative Evaluation:** Requires HR and approval records.
- **Projects Evaluation:** Requires recorded execution data.
- **Composite Enterprise Score:** Not calculated without verified source data.`;

        state.setSummaryOutput(fallbackText);
      }
    } catch {
      const fallbackText = lang === 'ar'
        ? `# التقرير التنفيذي الشامل للقيادة العليا
**المؤسسة:** جمعية رُحماء بينهم للعمل الإنساني والتنمية

### 📌 1. الخلاصة التنفيذية
- حالة المنظومة ومتابعة النطاقات تُعرض وفق السجلات المتاحة لحظة إنشاء التقرير.

### 🛡️ 2. التقييم النهائي الشامل للأشهر
- **التقييم المالي:** يتطلب أدلة دفتر الأستاذ المعتمدة.
- **التقييم الإداري:** يتطلب سجلات الموارد البشرية والاعتمادات.
- **تقييم المشاريع:** يتطلب بيانات التنفيذ الفعلية.
- **المعدل العام المركب:** لا يُحتسب دون بيانات مصدر موثقة.`
        : `# Executive Summary Report
**Organization:** Rohamā'a Baynahum Charity Foundation

### 🛡️ Final Monthly Evaluation Matrix
- **Financial Score:** Requires certified ledger evidence.
- **Administrative Score:** Requires HR and approval records.
- **Projects Score:** Requires recorded execution data.
- **Composite Score:** Not calculated without verified source data.`;

      state.setSummaryOutput(fallbackText);
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
              homeMode === 'work_first' ? (
                <QuantumWorkFirstCockpit
                  lang={lang}
                  stats={stats}
                  currentUser={currentUser}
                  programs={programs}
                  projects={projects}
                  beneficiaries={beneficiaries}
                  sponsorships={sponsorships}
                  approvalRequests={approvalRequests}
                  onNavigate={onNavigate}
                  onDrillDown={onDrillDown}
                  onOpenSystemMap={onOpenSystemMap}
                  onSwitchToClassicAnalytics={() => handleSetHomeMode('classic_analytics')}
                  onOpenExperienceModeModal={onOpenExperienceModeModal}
                  onRefresh={onRefresh}
                />
              ) : (
                <>
                  {/* Classic Mode Notification & Quick Switcher Back to Quantum Work-First */}
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-amber-500/20 text-amber-500 rounded-xl">
                        <LayoutDashboard className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-black text-slate-900 dark:text-white">
                          {lang === 'ar' ? 'نمط لوحة القيادة الاستراتيجية والتحليلات الشاملة (Classic Strategic Hub)' : 'Classic Strategic Analytics Hub Mode'}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                          {lang === 'ar' ? 'النمط التحليلي الموسع لكافة الكروت المخصصة والرسوم البيانية ومساحات العمل' : 'Full-card strategic analytics, customizable presets and workspace gateways'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <EnterpriseButton
                        variant="primary"
                        size="sm"
                        onClick={() => handleSetHomeMode('work_first')}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'التبديل إلى قمرة الإنجاز الفوري (Work-First)' : 'Switch to Quantum Work-First'}</span>
                      </EnterpriseButton>

                      {onOpenExperienceModeModal && (
                        <button
                          onClick={onOpenExperienceModeModal}
                          className="p-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer"
                          title={lang === 'ar' ? 'مركز إدارة أنماط بيئة العمل (Alt+X)' : 'Experience Mode Settings (Alt+X)'}
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <ExecutiveQuantumCockpit lang={lang} onNavigateTab={onNavigate} />
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
                    availablePresets={state.availablePresets}
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
                </>
              )
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
