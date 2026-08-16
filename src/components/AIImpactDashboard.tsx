import React, { useState, useEffect, useRef } from 'react';
import { Target, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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

export default function AIImpactDashboard({ projects, lang }: AIImpactDashboardProps) {
  const isRtl = lang === 'ar';
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [strategicAnomalies, setStrategicAnomalies] = useState<StrategicAnomaly[]>([]);
  const prevAnomaliesRef = useRef<string[]>([]);
  const { panels, visible } = useDashboardLayout();
  
  // Simulated ledger data
  const [ledgerEntries] = useState([
    { id: 'tx-1', amount: 5000 },
    { id: 'tx-2', amount: 15000 },
    { id: 'tx-3', amount: 8000 },
    { id: 'tx-4', amount: 25000 },
  ]);

  useEffect(() => {
    const detected = detectAnomalies(ledgerEntries as any);
    setAnomalies(detected);
    
    // Trigger notifications for new anomalies
    detected.forEach(anomaly => {
      if (!prevAnomaliesRef.current.includes(anomaly.entryId)) {
        window.dispatchEvent(new CustomEvent('nexora-inventory-alert', {
          detail: {
            title: lang === 'ar' ? '🚨 تنبيه: معاملة مالية غير طبيعية' : '🚨 Alert: Irregular Transaction',
            body: `${anomaly.reason} (ID: ${anomaly.entryId})`,
            type: 'critical'
          }
        }));
      }
    });
    prevAnomaliesRef.current = detected.map(a => a.entryId);

    // Strategic Anomaly Monitor
    checkStrategicAnomalies(ledgerEntries as any, projects, []).then(setStrategicAnomalies);
  }, [ledgerEntries, projects, lang]);
  
  const data = projects.map(p => ({
    ...p,
    name: p.name_ar || p.name,
    spend: parseFloat(p.budget_spent || 0),
    budget: parseFloat(p.budget || 1),
    impact: (parseInt(p.beneficiaries_count || 0) * 1.5),
  })).map(p => ({
    ...p,
    ratio: p.spend > 0 ? (p.impact / p.spend) : 0,
    deviation: (p.spend / p.budget) > 0.9 ? 'high' : 'normal'
  }));

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      setSelectedProject(data.activePayload[0].payload);
    }
  };

  const renderPanel = (panel: string) => {
    switch (panel) {
      case 'anomalies': return visible.anomalies && (
        <AnomalyAlertDock anomalies={anomalies} lang={lang} onReview={(id) => console.log('Reviewing anomaly:', id)} />
      );
      case 'strategic': return visible.strategic && strategicAnomalies.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-6">
          <h3 className="text-sm font-black text-red-900 dark:text-red-100 mb-4">{lang === 'ar' ? 'تنبيهات وملاحظات المراجعة' : 'Review Alerts & Discrepancies'}</h3>
          <div className="space-y-2">
            {strategicAnomalies.map(a => (
              <div key={a.id} className="p-3 bg-white dark:bg-zinc-900 rounded-lg text-xs">{a.title}: {a.description}</div>
            ))}
          </div>
        </div>
      );
      case 'projection': return visible.projection && <ImpactProjectionView portfolioData={projects} beneficiaryData={[]} lang={lang} />;
      case 'budgeting': return visible.budgeting && <PredictiveBudgetingView ledgerEntries={ledgerEntries} lang={lang} />;
      case 'simulation': return visible.simulation && <ScenarioSimulatorView historicalData={projects} lang={lang} />;
      case 'compliance': return visible.compliance && <ComplianceHeatmapView lang={lang} />;
      case 'audit': return visible.audit && <AssetAuditView lang={lang} />;
      case 'lifecycle': return visible.lifecycle && <AssetLifecycleManagementView lang={lang} />;
      case 'vendor': return visible.vendor && <VendorPerformanceAnalyticsView lang={lang} />;
      case 'briefing': return visible.briefing && <ProactiveBriefingView anomalies={anomalies} lang={lang} />;
      case 'forensic': return visible.forensic && <ForensicAuditView lang={lang} />;
      case 'sync': return visible.sync && <OfflineSyncView lang={lang} />;
      case 'yoy': return visible.yoy && <YoYPerformanceView lang={lang} />;
      case 'risk': return visible.risk && <StrategicRiskSimulator lang={lang} />;
      case 'global_kpi': return visible.global_kpi && <GlobalKPITrendView lang={lang} />;
      case 'branch_kpi': return visible.branch_kpi && <GlobalBranchKPIComparisonView lang={lang} />;
      case 'ipsas_audit': return visible.ipsas_audit && <IPSASComplianceAuditLedger lang={lang} />;
      case 'maintenance': return visible.maintenance && <PredictiveMaintenanceView lang={lang} />;
      case 'optimizer': return visible.optimizer && <AIResourceOptimizer lang={lang} />;
      case 'vendor_engine': return visible.vendor_engine && <VendorRecommendationEngineView lang={lang} />;
      case 'procurement': return visible.procurement && <ProcurementForecastingView lang={lang} />;
      case 'workload': return visible.workload && <AIWorkloadBalancerView lang={lang} />;
      case 'stakeholder': return visible.stakeholder && <StakeholderEngagementView lang={lang} />;
      case 'hr': return visible.hr && <EmployeeContributionView employeeId="current-user" lang={lang} />;
      case 'analysis': return visible.analysis && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-amber-500" />
            {isRtl ? 'تحليل العائد على الأثر الإنساني والمصروفات' : 'Impact-to-Spend Ratio Analysis'}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} onClick={handleBarClick}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" hide />
                <YAxis />
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="ratio" cursor="pointer">
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.deviation === 'high' ? '#e11d48' : '#059669'} 
                      stroke={selectedProject?.name === entry.name ? '#000' : 'none'}
                      strokeWidth={2}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {panels.map(p => renderPanel(p))}
      
      {selectedProject && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-4 text-sm">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-amber-900 dark:text-amber-100">{selectedProject.name}</h4>
            {selectedProject.deviation === 'high' && (
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-bold">
                <AlertTriangle className="w-4 h-4" /> {isRtl ? 'تنبيه ميزانية' : 'Budget Alert'}
              </span>
            )}
          </div>
          <p className="text-amber-800 dark:text-amber-200">
            {isRtl ? `المصروفات: ${selectedProject.spend} | الأثر: ${selectedProject.impact}` : `Spend: ${selectedProject.spend} | Impact: ${selectedProject.impact}`}
          </p>
        </div>
      )}
    </div>
  );
}
