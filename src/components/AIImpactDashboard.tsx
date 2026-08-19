import React, { useState, useEffect, useRef, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { Target, TrendingUp, AlertTriangle, ArrowRight, Brain, Activity, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
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
import { YoYPerformanceView, StrategicRiskSimulator, GlobalKPITrendView, GlobalBranchKPIComparisonView } from '../features/dashboard';
import { AIResourceOptimizer } from '../features/projects';
import { IPSASComplianceAuditLedger } from '../features/audit';
import { useDashboardLayout } from '../hooks/useDashboardLayout';

interface AIImpactDashboardProps {
  projects: any[];
  lang: 'ar' | 'en';
}

// Error Boundary for graceful crash recovery
class AIErrorBoundary extends Component<{ children: ReactNode; lang: 'ar' | 'en'; panelName?: string }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode; lang: 'ar' | 'en'; panelName?: string }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
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
      <p className="font-black text-slate-900 dark:text-white mb-1">{label}</p>
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
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [strategicAnomalies, setStrategicAnomalies] = useState<StrategicAnomaly[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const prevAnomaliesRef = useRef<string[]>([]);
  const { panels, visible } = useDashboardLayout();

  // Fetch real ledger data instead of hardcoded mocks
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('rbd_token');
        if (token) {
          const res = await fetch('/api/tables/chart_of_accounts?limit=50', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const entries = (data.data || data || []).map((e: any) => ({
              id: e.id || `tx-${Math.random().toString(36).substr(2, 6)}`,
              amount: parseFloat(e.current_balance || e.opening_balance || 0),
              type: e.account_type || 'ASSET'
            }));
            setLedgerEntries(entries.length > 0 ? entries : [
              { id: 'tx-demo-1', amount: 5000, type: 'EXPENSE' },
              { id: 'tx-demo-2', amount: 15000, type: 'REVENUE' },
              { id: 'tx-demo-3', amount: 8000, type: 'EXPENSE' },
            ]);
          }
        }
      } catch {
        // Fallback to minimal demo data
        setLedgerEntries([
          { id: 'tx-demo-1', amount: 5000, type: 'EXPENSE' },
          { id: 'tx-demo-2', amount: 15000, type: 'REVENUE' },
        ]);
      }
      setIsLoading(false);
    };
    fetchData();
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
            body: `${anomaly.reason} (ID: ${anomaly.entryId})`,
            type: 'critical'
          }
        }));
      }
    });
    prevAnomaliesRef.current = detected.map(a => a.entryId);

    checkStrategicAnomalies(ledgerEntries as any, projects, []).then(setStrategicAnomalies);
  }, [ledgerEntries, projects, lang]);

  const data = useMemo(() => projects.map(p => ({
    ...p,
    name: p.name_ar || p.name || 'N/A',
    shortName: (p.name_ar || p.name || 'N/A').substring(0, 15) + ((p.name_ar || p.name || '').length > 15 ? '...' : ''),
    spend: parseFloat(p.budget_spent || 0),
    budget: parseFloat(p.budget || 1),
    impact: (parseInt(p.beneficiaries_count || 0) * 1.5),
  })).map(p => ({
    ...p,
    ratio: p.spend > 0 ? (p.impact / p.spend) : 0,
    deviation: (p.spend / p.budget) > 0.9 ? 'high' : 'normal'
  })), [projects]);

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      setSelectedProject(data.activePayload[0].payload);
    }
  };

  const renderPanel = (panel: string) => {
    const wrappedRender = (content: React.ReactNode) => (
      <AIErrorBoundary lang={lang} panelName={panel}>
        {content}
      </AIErrorBoundary>
    );

    switch (panel) {
      case 'anomalies': return visible.anomalies && wrappedRender(
        <AnomalyAlertDock anomalies={anomalies} lang={lang} onReview={(_id) => {}} />
      );
      case 'strategic': return visible.strategic && strategicAnomalies.length > 0 && wrappedRender(
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-6">
          <h3 className="text-sm font-black text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {isRtl ? 'تنبيهات وملاحظات المراجعة الاستراتيجية' : 'Strategic Review Alerts & Discrepancies'}
          </h3>
          <div className="space-y-2">
            {strategicAnomalies.map(a => (
              <div key={a.id} className="p-3 bg-white dark:bg-zinc-900 rounded-lg text-xs flex items-start gap-2">
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
      case 'projection': return visible.projection && wrappedRender(<ImpactProjectionView portfolioData={projects} beneficiaryData={[]} lang={lang} />);
      case 'budgeting': return visible.budgeting && wrappedRender(<PredictiveBudgetingView ledgerEntries={ledgerEntries} lang={lang} />);
      case 'simulation': return visible.simulation && wrappedRender(<ScenarioSimulatorView historicalData={projects} lang={lang} />);
      case 'compliance': return visible.compliance && wrappedRender(<ComplianceHeatmapView lang={lang} />);
      case 'audit': return visible.audit && wrappedRender(<AssetAuditView lang={lang} />);
      case 'lifecycle': return visible.lifecycle && wrappedRender(<AssetLifecycleManagementView lang={lang} />);
      case 'vendor': return visible.vendor && wrappedRender(<VendorPerformanceAnalyticsView lang={lang} />);
      case 'briefing': return visible.briefing && wrappedRender(<ProactiveBriefingView anomalies={anomalies} lang={lang} />);
      case 'forensic': return visible.forensic && wrappedRender(<ForensicAuditView lang={lang} />);
      case 'sync': return visible.sync && wrappedRender(<OfflineSyncView lang={lang} />);
      case 'yoy': return visible.yoy && wrappedRender(<YoYPerformanceView lang={lang} />);
      case 'risk': return visible.risk && wrappedRender(<StrategicRiskSimulator lang={lang} />);
      case 'global_kpi': return visible.global_kpi && wrappedRender(<GlobalKPITrendView lang={lang} />);
      case 'branch_kpi': return visible.branch_kpi && wrappedRender(<GlobalBranchKPIComparisonView lang={lang} />);
      case 'ipsas_audit': return visible.ipsas_audit && wrappedRender(<IPSASComplianceAuditLedger lang={lang} />);
      case 'maintenance': return visible.maintenance && wrappedRender(<PredictiveMaintenanceView lang={lang} />);
      case 'optimizer': return visible.optimizer && wrappedRender(<AIResourceOptimizer lang={lang} />);
      case 'vendor_engine': return visible.vendor_engine && wrappedRender(<VendorRecommendationEngineView lang={lang} />);
      case 'procurement': return visible.procurement && wrappedRender(<ProcurementForecastingView lang={lang} />);
      case 'workload': return visible.workload && wrappedRender(<AIWorkloadBalancerView lang={lang} />);
      case 'stakeholder': return visible.stakeholder && wrappedRender(<StakeholderEngagementView lang={lang} />);
      case 'hr': return visible.hr && wrappedRender(<EmployeeContributionView employeeId="current-user" lang={lang} />);
      case 'analysis': return visible.analysis && wrappedRender(
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-amber-500" />
            {isRtl ? 'تحليل العائد على الأثر الإنساني والمصروفات' : 'Impact-to-Spend Ratio Analysis'}
          </h3>
          {data.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} onClick={handleBarClick} margin={{ top: 5, right: 20, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-zinc-700" />
                  <XAxis
                    dataKey="shortName"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    angle={-35}
                    textAnchor="end"
                    height={60}
                    label={{ value: isRtl ? 'المشاريع' : 'Projects', position: 'insideBottom', offset: -15, fontSize: 11, fill: '#94a3b8' }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    label={{ value: isRtl ? 'نسبة الأثر' : 'Impact Ratio', angle: -90, position: 'insideLeft', offset: 5, fontSize: 11, fill: '#94a3b8' }}
                  />
                  <Tooltip content={<CustomChartTooltip isRtl={isRtl} />} />
                  <Legend
                    verticalAlign="top"
                    height={30}
                    formatter={(value: string) => isRtl ? 'نسبة الأثر على المصروفات' : 'Impact / Spend Ratio'}
                  />
                  <Bar dataKey="ratio" cursor="pointer" radius={[4, 4, 0, 0]} name={isRtl ? 'نسبة الأثر' : 'Impact Ratio'}>
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.deviation === 'high' ? '#e11d48' : '#059669'}
                        stroke={selectedProject?.name === entry.name ? '#1e293b' : 'none'}
                        strokeWidth={selectedProject?.name === entry.name ? 2 : 0}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 dark:text-zinc-500 text-xs">
              <Activity className="w-4 h-4 mr-2 animate-pulse" />
              {isRtl ? 'جاري تحميل بيانات المشاريع...' : 'Loading project data...'}
            </div>
          )}
        </div>
      );
      default: return null;
    }
  };

  if (isLoading) {
    return <AISkeleton lang={lang} />;
  }

  return (
    <div className="space-y-6">
      <AIErrorBoundary lang={lang} panelName="AIImpactDashboard-Root">
        {panels.map(p => renderPanel(p))}

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
