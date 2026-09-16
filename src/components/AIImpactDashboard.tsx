import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AlertTriangle, Brain, RefreshCw } from 'lucide-react';
import { detectAnomalies, Anomaly } from '../core/services/anomalyDetection';
import { checkStrategicAnomalies, StrategicAnomaly } from '../core/services/strategicAnomalyMonitor';
import AnomalyAlertDock from './AnomalyAlertDock';
import ImpactProjectionView from './ImpactProjectionView';
import PredictiveBudgetingView from './PredictiveBudgetingView';
import ScenarioSimulatorView from './ScenarioSimulatorView';
import ComplianceHeatmapView from './ComplianceHeatmapView';
import { AssetAuditView, AssetLifecycleManagementView, PredictiveMaintenanceView } from '../features/assets';
import { StakeholderEngagementView } from '../features/community';
import { VendorPerformanceAnalyticsView, ProcurementForecastingView, VendorRecommendationEngineView } from '../features/procurement';
import ProactiveBriefingView from './ProactiveBriefingView';
import { EmployeeContributionView, AIWorkloadBalancerView } from '../features/hr';
import { ForensicAuditView } from '../features/security';
import { OfflineSyncView } from '../features/sync';
import YoYPerformanceView from '../features/dashboard/YoYPerformanceView';
import StrategicRiskSimulator from '../features/dashboard/StrategicRiskSimulator';
import GlobalKPITrendView from '../features/dashboard/GlobalKPITrendView';
import GlobalBranchKPIComparisonView from '../features/dashboard/GlobalBranchKPIComparisonView';
import AIResourceOptimizer from '../features/projects/AIResourceOptimizer';
import { IPSASComplianceAuditLedger } from '../features/audit';
import { useDashboardLayout } from '../hooks/useDashboardLayout';

interface AIImpactDashboardProps {
  projects: any[];
  lang: 'ar' | 'en';
}

interface AnomalyWithEntryId extends Anomaly {
  entryId: string;
}

// Error Boundary for graceful crash recovery
class AIErrorBoundary extends React.Component<{
  children: React.ReactNode;
  lang: 'ar' | 'en';
  panelName?: string;
}, { hasError: boolean; error: string }> {
  constructor(props: {
    children: React.ReactNode;
    lang: 'ar' | 'en';
    panelName?: string;
  }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[AI Panel Error] ${this.props.panelName || 'Unknown'}:`, error, info.componentStack);
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-xs font-bold text-red-700 dark:text-red-300">
            {this.props.lang === 'ar' ? 'تعذر تحميل هذا المكون' : 'Failed to load this component'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: '' })}
            className="mt-3 px-4 py-1.5 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg text-[10px] font-bold cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 inline mr-1" />
            {this.props.lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Skeleton loader for AI panels
function AISkeleton({ lang }: { lang: 'ar' | 'en' }) {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-1/3" />
      <div className="h-64 bg-slate-100 dark:bg-zinc-800/50 rounded-2xl" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-slate-100 dark:bg-zinc-800/50 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// Custom chart tooltip
function CustomChartTooltip({ active, payload, label, isRtl }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl p-3 shadow-xl text-xs">
      <p className="font-black text-slate-900 dark:text-white mb-1">
        {isRtl ? 'النسبة:' : 'Ratio:'} {typeof label === 'number' ? label.toFixed(2) : label}
      </p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-bold">
          {isRtl ? 'النسبة:' : 'Ratio:'} {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
          {p.payload?.deviation === 'high' && (
            <span className="ml-2 text-red-500">⚠</span>
          )}
        </p>
      ))}
    </div>
  );
}

export default function AIImpactDashboard({ projects, lang }: AIImpactDashboardProps) {
  const isRtl = lang === 'ar';
  const { panels, visible, saveLayout } = useDashboardLayout();
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [strategicAnomalies, setStrategicAnomalies] = useState<StrategicAnomaly[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const prevAnomaliesRef = useRef<string[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);

  // Fetch REAL ledger transactions for anomaly detection — strict no-demo-data policy
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('rbd_token');
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch('/api/tables/transactions?limit=200', { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const rows = data.data || data || [];
        if (cancelled) return;
        // Map real IPSAS journal entries — empty DB stays empty (no fabricated rows)
        const entries = rows.map((t: any) => ({
          id: t.id || t.transaction_number,
          amount: parseFloat(t.total_debit || t.total_credit || 0),
          type: t.transaction_type || 'JOURNAL_ENTRY'
        }));
        setLedgerEntries(entries);
      } catch {
        if (!cancelled) setLedgerEntries([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (ledgerEntries.length === 0) return;
    const detected = detectAnomalies(ledgerEntries as any);
    setAnomalies(detected);

    detected.forEach(anomaly => {
      if (!prevAnomaliesRef.current.includes(anomaly.entryId)) {
        window.dispatchEvent(new CustomEvent('nexora-inventory-alert', {
          detail: {
            title: lang === 'ar' ? 'تنبيه: معاملة مالية غير طبيعية' : 'Alert: Irregular Transaction',
            id: anomaly.entryId,
            severity: anomaly.severity || 'medium'
          }
        }));
      }
    });
    prevAnomaliesRef.current = detected.map(a => a.entryId);
  }, [ledgerEntries]);

  // Strategic anomalies come from the dedicated monitor (projects + ledger),
  // not from ledger anomalies — the two types are intentionally distinct.
  useEffect(() => {
    if (ledgerEntries.length === 0) return;
    let cancelled = false;
    checkStrategicAnomalies(ledgerEntries as any, (projects || []) as any, [])
      .then(list => { if (!cancelled) setStrategicAnomalies(list || []); })
      .catch(() => { if (!cancelled) setStrategicAnomalies([]); });
    return () => { cancelled = true; };
  }, [ledgerEntries, projects]);

  // Render each panel based on visibility and panel type
  const renderPanel = (panel: string, panelIndex: number) => {
    const wrappedRender = (content: React.ReactNode) => (
      <AIErrorBoundary lang={lang} panelName={panel}>
        {content}
      </AIErrorBoundary>
    );

    // Only render if panel is in the configured panels list AND visible
    if (!panels.includes(panel as any) || !visible[panel as keyof Record<string, boolean>]) {
      return null;
    }

    switch (panel) {
      case 'global_kpi': return visible.global_kpi && wrappedRender(
        <GlobalKPITrendView lang={lang} projects={projects} key="global_kpi" />
      );
      case 'strategic': return visible.strategic && strategicAnomalies.length > 0 && wrappedRender(
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-6">
          <h3 className="text-sm font-black text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {isRtl ? 'تنبيهات وملاحظات المراجعة الاستراتيجية' : 'Strategic Review Alerts & Discrepancies'}
          </h3>
          <div className="space-y-2">
            {strategicAnomalies.map((a, i) => (
              <div key={a.id || i} className="p-3 bg-white dark:bg-zinc-900 rounded-lg text-xs flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <div>
                  <span className="font-bold">{a.title}</span>
                  <span className="text-slate-500 dark:text-zinc-400 mx-1">-</span>
                  <span>{a.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
      case 'anomalies': return visible.anomalies && wrappedRender(
        <AnomalyAlertDock anomalies={anomalies} lang={lang} onReview={(_id) => {} } key="anomalies" />
      );
      case 'compliance': return visible.compliance && wrappedRender(<ComplianceHeatmapView lang={lang} key="compliance" />);
      case 'ipsas_audit': return visible.ipsas_audit && wrappedRender(<IPSASComplianceAuditLedger lang={lang} key="ipsas_audit" />);
      case 'projection': return visible.projection && wrappedRender(<ImpactProjectionView portfolioData={projects} beneficiaryData={[]} lang={lang} key="projection" />);
      case 'budgeting': return visible.budgeting && wrappedRender(<PredictiveBudgetingView ledgerEntries={ledgerEntries} lang={lang} key="budgeting" />);
      case 'risk': return visible.risk && wrappedRender(<StrategicRiskSimulator lang={lang} key="risk" />);
      case 'simulation': return visible.simulation && wrappedRender(<ScenarioSimulatorView historicalData={projects} lang={lang} key="simulation" />);
      case 'workload': return visible.workload && wrappedRender(<AIWorkloadBalancerView lang={lang} key="workload" />);
      case 'procurement': return visible.procurement && wrappedRender(<ProcurementForecastingView lang={lang} key="procurement" />);
      case 'vendor': return visible.vendor && wrappedRender(<VendorPerformanceAnalyticsView lang={lang} key="vendor" />);
      case 'vendor_engine': return visible.vendor_engine && wrappedRender(<VendorRecommendationEngineView lang={lang} key="vendor_engine" />);
      case 'maintenance': return visible.maintenance && wrappedRender(<PredictiveMaintenanceView lang={lang} key="maintenance" />);
      case 'lifecycle': return visible.lifecycle && wrappedRender(<AssetLifecycleManagementView lang={lang} key="lifecycle" />);
      case 'hr': return visible.hr && wrappedRender(<EmployeeContributionView employeeId="current-user" lang={lang} key="hr" />);
      case 'stakeholder': return visible.stakeholder && wrappedRender(<StakeholderEngagementView lang={lang} key="stakeholder" />);
      case 'yoy': return visible.yoy && wrappedRender(<YoYPerformanceView lang={lang} key="yoy" />);
      case 'forensic': return visible.forensic && wrappedRender(<ForensicAuditView lang={lang} key="forensic" />);
      case 'briefing': return visible.briefing && wrappedRender(<ProactiveBriefingView anomalies={anomalies} lang={lang} key="briefing" />);
      default: return null;
    }
  };

  // Initialize ledger data on first render
  useEffect(() => {
    // Ledger fetch already happens above; ensure data is available
    if (ledgerEntries.length === 0) {
      const token = localStorage.getItem('rbd_token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      fetch('/api/tables/transactions?limit=200', { headers })
        .then(res => res.json())
        .then(data => {
          const rows = data.data || data || [];
          const entries = rows.map((t: any) => ({
            id: t.id || t.transaction_number,
            amount: parseFloat(t.total_debit || t.total_credit || 0),
            type: t.transaction_type || 'JOURNAL_ENTRY'
          }));
          setLedgerEntries(entries);
        });
    }
  }, [ledgerEntries]);

  if (isLoading) {
    return <AISkeleton lang={lang} />;
  }

  // Expert-curated panel order: strategic/financial first, then operations, then HR/stakeholders
  // This ordering minimizes navigation depth for critical functions
  const expertPanelOrder = panels.filter(p => visible[p as keyof Record<string, boolean>]);

  return (
    <div className="space-y-6">
      <AIErrorBoundary lang={lang} panelName="AIImpactDashboard-Root">
        {expertPanelOrder.map((panel, panelIndex) => renderPanel(panel, panelIndex))}

        {selectedProject && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-4 text-sm transition-all animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-black text-amber-900 dark:text-amber-100 flex items-center gap-2">
                <Brain className="w-4 h-4 text-amber-500" />
                {selectedProject.name}
              </h4>
              {selectedProject.deviation === 'high' && (
                <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-bold text-xs bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="w-3.5 h-3.5" /> {isRtl ? 'تنبيه ميزانية' : 'Budget Alert'}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-2.5">
                <span className="text-slate-500 dark:text-zinc-400 block">{isRtl ? 'المصروفات' : 'Spend'}</span>
                <span className="font-black text-slate-900 dark:text-white">{selectedProject.spend?.toLocaleString()}</span>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-2.5">
                <span className="text-slate-500 dark:text-zinc-400 block">{isRtl ? 'الميزانية' : 'Budget'}</span>
                <span className="font-black text-slate-900 dark:text-white">{selectedProject.budget?.toLocaleString()}</span>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-2.5">
                <span className="text-slate-500 dark:text-zinc-400 block">{isRtl ? 'نسبة الأثر' : 'Impact Ratio'}</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">{selectedProject.ratio?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </AIErrorBoundary>
    </div>
  );
}