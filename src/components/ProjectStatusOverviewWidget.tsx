import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Coins,
  Info,
  Filter,
  Download,
  Calendar,
  Flag,
  Check,
  Archive,
  Sparkles,
  RefreshCw,
  Activity,
  Settings,
  Scale,
  Users,
  HeartHandshake,
  Smile,
  Plus,
  Minus
} from 'lucide-react';
import { Project, ProjectMilestone } from '../core/types/projects';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import ExportToolsModal from './ExportToolsModal';

interface ProjectStatusOverviewWidgetProps {
  projects: Project[];
  lang: 'ar' | 'en';
  onNavigate: (tab: any) => void;
}

export default function ProjectStatusOverviewWidget({ 
  projects, 
  lang, 
  onNavigate 
}: ProjectStatusOverviewWidgetProps) {
  const isRtl = lang === 'ar';

  const [archivedProjectIds, setArchivedProjectIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nexora_archived_project_ids');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [showArchivedList, setShowArchivedList] = useState<boolean>(false);

  const archiveProject = (projectId: string) => {
    const updated = [...archivedProjectIds, projectId];
    setArchivedProjectIds(updated);
    try {
      localStorage.setItem('nexora_archived_project_ids', JSON.stringify(updated));
    } catch (e) { console.error('[Archive] Failed to save archived project IDs to localStorage:', e); }
  };

  const unarchiveProject = (projectId: string) => {
    const updated = archivedProjectIds.filter(id => id !== projectId);
    setArchivedProjectIds(updated);
    try {
      localStorage.setItem('nexora_archived_project_ids', JSON.stringify(updated));
    } catch (e) { console.error('[Archive] Failed to save archived project IDs to localStorage:', e); }
  };

  const activeDashboardProjects = React.useMemo(() => {
    return projects.filter(p => !archivedProjectIds.includes(p.id));
  }, [projects, archivedProjectIds]);
  
  // Persist collapsible state in localStorage so the user's choice is saved
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('nexora_project_widget_expanded');
      return saved !== 'false'; // Default to expanded
    } catch (e) {
      return true;
    }
  });

  const toggleExpanded = () => {
    const nextState = !isExpanded;
    setIsExpanded(nextState);
    try {
      localStorage.setItem('nexora_project_widget_expanded', String(nextState));
    } catch (e) { console.error('[Widget] Failed to save widget expanded state to localStorage:', e); }
  };

  const [insights, setInsights] = useState<string | null>(() => {
    try {
      return localStorage.getItem('nexora_portfolio_insights');
    } catch (e) {
      return null;
    }
  });
  const [insightsLoading, setInsightsLoading] = useState<boolean>(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  const fetchPortfolioInsights = async (force = false) => {
    if (activeDashboardProjects.length === 0) return;
    
    if (!force && insights) {
      return;
    }

    setInsightsLoading(true);
    setInsightsError(null);

    try {
      const res = await fetch('/api/gemini/portfolio-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projects: activeDashboardProjects,
          lang
        })
      });

      if (!res.ok) {
        throw new Error(lang === 'ar' ? 'فشل الاتصال بخوادم التحليل الذكي' : 'Failed to connect to business intelligence server');
      }

      const data = await res.json();
      if (data.insights) {
        setInsights(data.insights);
        try {
          localStorage.setItem('nexora_portfolio_insights', data.insights);
        } catch (e) { console.error('[Insights] Failed to save portfolio insights to localStorage:', e); }
      } else {
        throw new Error(lang === 'ar' ? 'لم يتم استرجاع أي بيانات تحليلية' : 'No analytical insights were returned');
      }
    } catch (err: any) {
      console.error(err);
      setInsightsError(err.message || (lang === 'ar' ? 'خطأ غير متوقع أثناء تحليل المحفظة' : 'An unexpected error occurred during analysis'));
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded && !insights && activeDashboardProjects.length > 0) {
      fetchPortfolioInsights();
    }
  }, [isExpanded, insights, activeDashboardProjects]);

  const [financialAuditEnabled, setFinancialAuditEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nexora_financial_audit_enabled') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [financialAudits, setFinancialAudits] = useState<Array<{
    projectId: string;
    severity: 'critical' | 'warning' | 'info';
    issueType: 'budget_variance' | 'spending_pattern' | 'burn_rate' | 'accounting_anomaly' | 'stagnation';
    variancePercent: number;
    reasonEn: string;
    reasonAr: string;
    recommendationEn: string;
    recommendationAr: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem('nexora_project_financial_audits');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [financialAuditsLoading, setFinancialAuditsLoading] = useState<boolean>(false);
  const [financialAuditsError, setFinancialAuditsError] = useState<string | null>(null);

  const runFinancialAudit = async (force = false) => {
    if (activeDashboardProjects.length === 0) return;
    setFinancialAuditsLoading(true);
    setFinancialAuditsError(null);

    try {
      const res = await fetch('/api/gemini/financial-audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projects: activeDashboardProjects
        })
      });

      if (!res.ok) {
        throw new Error(lang === 'ar' ? 'فشل الاتصال بخدمة التدقيق المالي بالذكاء الاصطناعي' : 'Failed to connect to the AI Financial Audit service');
      }

      const data = await res.json();
      const audited = data.audits || [];

      // Find newly discovered financial issues to trigger notifications
      const existingIds = new Set(financialAudits.map(a => a.projectId + '-' + a.issueType + '-' + a.severity));
      const newlyDiscovered = audited.filter((a: any) => !existingIds.has(a.projectId + '-' + a.issueType + '-' + a.severity));

      setFinancialAudits(audited);
      try {
        localStorage.setItem('nexora_project_financial_audits', JSON.stringify(audited));
      } catch (e) { console.error('[Audit] Failed to save financial audits to localStorage:', e); }

      // Trigger custom toast events for newly discovered financial issues
      newlyDiscovered.forEach((issue: any) => {
        const proj = activeDashboardProjects.find(p => p.id === issue.projectId);
        if (proj) {
          const message = lang === 'ar'
            ? `💰 [تدقيق مالي]: مشروع "${proj.name_ar}": ${issue.reasonAr}`
            : `💰 [Financial Audit]: Project "${proj.name_en}": ${issue.reasonEn}`;

          window.dispatchEvent(new CustomEvent('nexora-add-toast', {
            detail: {
              message,
              type: issue.severity === 'critical' ? 'critical' : 'anomaly'
            }
          }));
        }
      });
    } catch (err: any) {
      console.error(err);
      setFinancialAuditsError(err.message || (lang === 'ar' ? 'حدث خطأ غير متوقع أثناء التدقيق المالي' : 'An unexpected error occurred during financial audit'));
    } finally {
      setFinancialAuditsLoading(false);
    }
  };

  const handleToggleFinancialAudit = async (enabled: boolean) => {
    setFinancialAuditEnabled(enabled);
    try {
      localStorage.setItem('nexora_financial_audit_enabled', String(enabled));
    } catch (e) { console.error('[Audit] Failed to save financial audit enabled state to localStorage:', e); }

    if (enabled) {
      await runFinancialAudit(true);
    }
  };

  useEffect(() => {
    if (isExpanded && financialAuditEnabled && financialAudits.length === 0 && activeDashboardProjects.length > 0) {
      runFinancialAudit();
    }
  }, [isExpanded, financialAuditEnabled, activeDashboardProjects]);

  const [predictiveImpactEnabled, setPredictiveImpactEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nexora_predictive_impact_enabled') === 'true';
    } catch (e) {
      return false;
    }
  });

  interface PredictiveImpactData {
    quarterlyOverviewEn: string;
    quarterlyOverviewAr: string;
    financialImpactMetricUSD: number;
    socialImpactMetricPeople: number;
    projectBreakdowns: Array<{
      projectId: string;
      socialImpactEn: string;
      socialImpactAr: string;
      financialImpactEn: string;
      financialImpactAr: string;
      successProbability: number;
      impactScore: number;
    }>;
  }

  const [predictiveImpact, setPredictiveImpact] = useState<PredictiveImpactData | null>(() => {
    try {
      const saved = localStorage.getItem('nexora_project_predictive_impact');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [predictiveImpactLoading, setPredictiveImpactLoading] = useState<boolean>(false);
  const [predictiveImpactError, setPredictiveImpactError] = useState<string | null>(null);

  const runPredictiveImpact = async (force = false) => {
    if (activeDashboardProjects.length === 0) return;
    setPredictiveImpactLoading(true);
    setPredictiveImpactError(null);

    try {
      const res = await fetch('/api/gemini/predictive-impact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projects: activeDashboardProjects
        })
      });

      if (!res.ok) {
        throw new Error(lang === 'ar' ? 'فشل الاتصال بخدمة التحليل التنبؤي للأثر' : 'Failed to connect to the Predictive Impact service');
      }

      const data = await res.json() as PredictiveImpactData;
      setPredictiveImpact(data);
      try {
        localStorage.setItem('nexora_project_predictive_impact', JSON.stringify(data));
      } catch (e) { console.error('[PredictiveImpact] Failed to save predictive impact data to localStorage:', e); }

      // Trigger custom toast alerting the user to completed predictive analysis
      const message = lang === 'ar'
        ? `✨ [تحليل الأثر التنبؤي]: تم توليد توقعات الربع القادم بنجاح. الأثر الاجتماعي المتوقع: ${data.socialImpactMetricPeople.toLocaleString()} مستفيد.`
        : `? [Predictive Impact]: Next quarter projections generated. Social Impact forecast: ${data.socialImpactMetricPeople.toLocaleString()} beneficiaries.`;

      window.dispatchEvent(new CustomEvent('nexora-add-toast', {
        detail: {
          message,
          type: 'info'
        }
      }));

    } catch (err: any) {
      console.error(err);
      setPredictiveImpactError(err.message || (lang === 'ar' ? 'حدث خطأ غير متوقع أثناء تحليل الأثر التنبؤي' : 'An unexpected error occurred during predictive impact analysis'));
    } finally {
      setPredictiveImpactLoading(false);
    }
  };

  const handleTogglePredictiveImpact = async (enabled: boolean) => {
    setPredictiveImpactEnabled(enabled);
    try {
      localStorage.setItem('nexora_predictive_impact_enabled', String(enabled));
    } catch (e) { console.error('[PredictiveImpact] Failed to save predictive impact enabled state to localStorage:', e); }

    if (enabled) {
      await runPredictiveImpact(true);
    }
  };

  useEffect(() => {
    if (isExpanded && predictiveImpactEnabled && !predictiveImpact && activeDashboardProjects.length > 0) {
      runPredictiveImpact();
    }
  }, [isExpanded, predictiveImpactEnabled, activeDashboardProjects]);

  const [smartRebalanceEnabled, setSmartRebalanceEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nexora_smart_rebalance_enabled') === 'true';
    } catch (e) {
      return false;
    }
  });

  interface SmartRebalanceData {
    strategicRationaleEn: string;
    strategicRationaleAr: string;
    reallocations: Array<{
      projectId: string;
      projectCode: string;
      originalBudget: number;
      suggestedBudget: number;
      netChange: number;
      justificationEn: string;
      justificationAr: string;
    }>;
  }

  const [smartRebalance, setSmartRebalance] = useState<SmartRebalanceData | null>(() => {
    try {
      const saved = localStorage.getItem('nexora_project_smart_rebalance');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [smartRebalanceLoading, setSmartRebalanceLoading] = useState<boolean>(false);
  const [smartRebalanceError, setSmartRebalanceError] = useState<string | null>(null);

  const runSmartRebalance = async (force = false) => {
    if (activeDashboardProjects.length === 0) return;
    setSmartRebalanceLoading(true);
    setSmartRebalanceError(null);

    try {
      const res = await fetch('/api/gemini/smart-rebalance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projects: activeDashboardProjects
        })
      });

      if (!res.ok) {
        throw new Error(lang === 'ar' ? 'فشل الاتصال بخدمة إعادة التوازن الذكي للميزانية' : 'Failed to connect to the Smart Rebalance service');
      }

      const data = await res.json() as SmartRebalanceData;
      setSmartRebalance(data);
      try {
        localStorage.setItem('nexora_project_smart_rebalance', JSON.stringify(data));
      } catch (e) { console.error('[SmartRebalance] Failed to save smart rebalance data to localStorage:', e); }

      // Trigger custom toast alerting the user
      const message = lang === 'ar'
        ? `⚖️ [إعادة التوازن الذكي]: تم توليد مقترحات إعادة التوازن للميزانيات بنجاح لـ ${data.reallocations.length} مشاريع.`
        : `⚖️ [Smart Rebalance]: Successfully generated budget rebalancing recommendations for ${data.reallocations.length} projects.`;

      window.dispatchEvent(new CustomEvent('nexora-add-toast', {
        detail: {
          message,
          type: 'info'
        }
      }));

    } catch (err: any) {
      console.error(err);
      setSmartRebalanceError(err.message || (lang === 'ar' ? 'حدث خطأ غير متوقع أثناء إعادة التوازن الذكي' : 'An unexpected error occurred during Smart Rebalance analysis'));
    } finally {
      setSmartRebalanceLoading(false);
    }
  };

  const handleToggleSmartRebalance = async (enabled: boolean) => {
    setSmartRebalanceEnabled(enabled);
    try {
      localStorage.setItem('nexora_smart_rebalance_enabled', String(enabled));
    } catch (e) { console.error('[SmartRebalance] Failed to save smart rebalance enabled state to localStorage:', e); }

    if (enabled) {
      await runSmartRebalance(true);
    }
  };

  useEffect(() => {
    if (isExpanded && smartRebalanceEnabled && !smartRebalance && activeDashboardProjects.length > 0) {
      runSmartRebalance();
    }
  }, [isExpanded, smartRebalanceEnabled, activeDashboardProjects]);

  const [anomalyEnabled, setAnomalyEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nexora_anomaly_enabled') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [anomalies, setAnomalies] = useState<Array<{
    projectId: string;
    severity: 'critical' | 'warning';
    reason_en: string;
    reason_ar: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem('nexora_project_anomalies');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [anomaliesLoading, setAnomaliesLoading] = useState<boolean>(false);
  const [anomaliesError, setAnomaliesError] = useState<string | null>(null);

  const runAnomalyDiagnostics = async (force = false) => {
    if (activeDashboardProjects.length === 0) return;
    setAnomaliesLoading(true);
    setAnomaliesError(null);

    try {
      const res = await fetch('/api/gemini/anomaly-detection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projects: activeDashboardProjects
        })
      });

      if (!res.ok) {
        throw new Error(lang === 'ar' ? 'فشل الاتصال بخدمة التحليل المالي والتشغيلي' : 'Failed to connect to the operational auditing service');
      }

      const data = await res.json();
      const detected = data.anomalies || [];

      // Find newly discovered anomalies to trigger notifications
      const existingIds = new Set(anomalies.map(a => a.projectId + '-' + a.severity));
      const newlyDiscovered = detected.filter((a: any) => !existingIds.has(a.projectId + '-' + a.severity));

      setAnomalies(detected);
      try {
        localStorage.setItem('nexora_project_anomalies', JSON.stringify(detected));
      } catch (e) { console.error('[Anomaly] Failed to save anomaly data to localStorage:', e); }

      // Trigger custom toast events for newly discovered anomalies
      newlyDiscovered.forEach((anomaly: any) => {
        const proj = activeDashboardProjects.find(p => p.id === anomaly.projectId);
        if (proj) {
          const message = lang === 'ar'
            ? `🚨 [كشف شذوذ]: مشروع "${proj.name_ar}": ${anomaly.reason_ar}`
            : `🚨 [AI Anomaly]: Project "${proj.name_en}": ${anomaly.reason_en}`;

          window.dispatchEvent(new CustomEvent('nexora-add-toast', {
            detail: {
              message,
              type: 'anomaly'
            }
          }));
        }
      });
    } catch (err: any) {
      console.error(err);
      setAnomaliesError(err.message || (lang === 'ar' ? 'حدث خطأ أثناء فحص وتدقيق البيانات' : 'An error occurred during data verification'));
    } finally {
      setAnomaliesLoading(false);
    }
  };

  const handleToggleAnomaly = async (enabled: boolean) => {
    setAnomalyEnabled(enabled);
    try {
      localStorage.setItem('nexora_anomaly_enabled', String(enabled));
    } catch (e) { console.error('[Anomaly] Failed to save anomaly enabled state to localStorage:', e); }

    if (enabled) {
      await runAnomalyDiagnostics(true);
    }
  };

  useEffect(() => {
    if (isExpanded && anomalyEnabled && anomalies.length === 0 && activeDashboardProjects.length > 0) {
      runAnomalyDiagnostics();
    }
  }, [isExpanded, anomalyEnabled, activeDashboardProjects]);

  const parseBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-black text-slate-800 dark:text-zinc-200">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderMarkdown = (text: string | null) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('### ')) {
        return (
          <h4 key={i} className="text-[11.5px] font-black text-slate-800 dark:text-zinc-200 mt-4 mb-2 flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-900 pb-1 uppercase tracking-wide">
            {trimmed.replace('### ', '')}
          </h4>
        );
      }
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return (
          <p key={i} className="font-extrabold text-[11px] text-slate-700 dark:text-zinc-400 mt-2 mb-1">
            {trimmed.replace(/\*\*/g, '')}
          </p>
        );
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const content = trimmed.substring(2);
        return (
          <div key={i} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-zinc-400 pl-3 py-0.5 leading-relaxed">
            <span className="text-emerald-500 font-bold mt-1 shrink-0">?</span>
            <span className="flex-1">{parseBoldText(content)}</span>
          </div>
        );
      }
      if (trimmed) {
        return (
          <p key={i} className="text-[11px] text-slate-600 dark:text-zinc-400 py-1 leading-relaxed">
            {parseBoldText(trimmed)}
          </p>
        );
      }
      return <div key={i} className="h-1.5" />;
    });
  };

  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);

  useEffect(() => {
    try {
      const STORAGE_KEY = 'nexora_project_milestones_v1';
      const saved = localStorage.getItem(STORAGE_KEY);
      let parsed: ProjectMilestone[] = [];
      if (saved) {
        parsed = JSON.parse(saved);
      }
      
      const existingProjectIds = new Set(parsed.map(m => m.projectId));
      const missingProjects = projects.filter(p => !existingProjectIds.has(p.id));
      
      if (missingProjects.length > 0) {
        const defaultMilestones: ProjectMilestone[] = [];
        missingProjects.forEach(p => {
          const start = p.start_date ? new Date(p.start_date) : new Date('2026-01-01');
          const end = p.end_date ? new Date(p.end_date) : new Date('2026-12-31');
          const startMs = start.getTime();
          const durationMs = Math.max(86400000 * 30, end.getTime() - startMs);

          const m1Date = new Date(startMs + durationMs * 0.15).toISOString().substring(0, 10);
          const m2Date = new Date(startMs + durationMs * 0.40).toISOString().substring(0, 10);
          const m3Date = new Date(startMs + durationMs * 0.70).toISOString().substring(0, 10);
          const m4Date = new Date(startMs + durationMs * 0.95).toISOString().substring(0, 10);

          defaultMilestones.push(
            {
              id: `m-${p.id}-1`,
              projectId: p.id,
              titleAr: 'تأسيس الموقع والمسح الميداني',
              titleEn: 'Site Setup & Baseline Survey',
              date: m1Date,
              status: 'completed'
            },
            {
              id: `m-${p.id}-2`,
              projectId: p.id,
              titleAr: 'التوريد والمشتريات التشغيلية',
              titleEn: 'Procurement & Logistics',
              date: m2Date,
              status: 'in_progress'
            },
            {
              id: `m-${p.id}-3`,
              projectId: p.id,
              titleAr: 'تنفيذ مرحلة العمل الميداني الأساسية',
              titleEn: 'Field Implementation Phase',
              date: m3Date,
              status: 'upcoming'
            },
            {
              id: `m-${p.id}-4`,
              projectId: p.id,
              titleAr: 'التقييم النهائي وتسليم المخرجات',
              titleEn: 'Final Evaluation & Handover',
              date: m4Date,
              status: 'upcoming'
            }
          );
        });
        parsed = [...parsed, ...defaultMilestones];
      }
      setMilestones(parsed);
    } catch (e) {
      console.error('Error loading milestones in status widget:', e);
    }
  }, [projects]);

  const getUpcomingDeadlines = () => {
    const todayStr = new Date().toISOString().substring(0, 10);
    const mapped = milestones.map(m => {
      const proj = projects.find(p => p.id === m.projectId);
      return {
        ...m,
        projectNameAr: proj ? proj.name_ar : '',
        projectNameEn: proj ? (proj.name_en || proj.name_ar) : '',
        projectCode: proj ? proj.code : '',
      };
    });

    let upcoming = mapped.filter(m => m.date >= todayStr);
    if (upcoming.length < 3) {
      const incomplete = mapped.filter(m => m.status !== 'completed' && m.date < todayStr);
      upcoming = [...upcoming, ...incomplete].sort((a, b) => a.date.localeCompare(b.date));
    } else {
      upcoming.sort((a, b) => a.date.localeCompare(b.date));
    }

    return upcoming.slice(0, 3);
  };

  const upcomingDeadlines = getUpcomingDeadlines();

  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);

  const [milestoneViewMode, setMilestoneViewMode] = useState<'gantt' | 'critical_path'>('critical_path');
  const [selectedCriticalPathProjId, setSelectedCriticalPathProjId] = useState<string>('');

  useEffect(() => {
    if (activeDashboardProjects.length > 0 && !selectedCriticalPathProjId) {
      setSelectedCriticalPathProjId(activeDashboardProjects[0].id);
    }
  }, [activeDashboardProjects, selectedCriticalPathProjId]);

  useEffect(() => {
    if (selectedMilestoneId) {
      const selectedM = milestones.find(m => m.id === selectedMilestoneId);
      if (selectedM) {
        setSelectedCriticalPathProjId(selectedM.projectId);
      }
    }
  }, [selectedMilestoneId, milestones]);

  const selectedProjMilestones = React.useMemo(() => {
    return milestones
      .filter(m => m.projectId === selectedCriticalPathProjId)
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [milestones, selectedCriticalPathProjId]);

  const upcomingMilestoneIndex = React.useMemo(() => {
    return selectedProjMilestones.findIndex(m => m.status !== 'completed');
  }, [selectedProjMilestones]);

  const [heatmapSectionTab, setHeatmapSectionTab] = useState<'gantt' | 'heatmap' | 'stakeholders'>('gantt');
  const [heatmapCapacity, setHeatmapCapacity] = useState<number>(30);

  // Stakeholder Heatmap States and Generator
  const generateInitialStakeholderData = (projectsList: Project[]) => {
    const data: Record<string, any[]> = {};
    
    const stakeholderTemplates = [
      {
        groupEn: 'Beneficiary Council',
        groupAr: 'مجلس المستفيدين المحلي',
        roleEn: 'Community Feedback & Needs Assessment',
        roleAr: 'استقصاء الآراء وتحديد الاحتياجات المجتمعية المباشرة',
        channelFrequencies: [8, 5, 9, 3, 4],
        channelSatisfactions: ['delighted', 'satisfied', 'satisfied', 'neutral', 'satisfied']
      },
      {
        groupEn: 'District Local Council',
        groupAr: 'المجلس المحلي للمديرية',
        roleEn: 'Regulatory Permits & Field Coordination',
        roleAr: 'تسهيل الموافقات الإدارية والتراخيص الحكومية الميدانية',
        channelFrequencies: [3, 7, 2, 8, 4],
        channelSatisfactions: ['satisfied', 'satisfied', 'neutral', 'satisfied', 'neutral']
      },
      {
        groupEn: 'Lead Institutional Donor',
        groupAr: 'الجهة المانحة الرئيسية',
        roleEn: 'Financial Oversight & Compliance Audits',
        roleAr: 'الرقابة المالية والامتثال لمعايير المنح والتمويل',
        channelFrequencies: [1, 9, 0, 10, 6],
        channelSatisfactions: ['neutral', 'delighted', 'neutral', 'satisfied', 'satisfied']
      },
      {
        groupEn: 'Field Executive Operations',
        groupAr: 'فرق العمليات والتشغيل الميداني',
        roleEn: 'WBS Task Delivery & Physical Logistics',
        roleAr: 'تسليم حزم مهام WBS والمتابعة اللوجستية اليومية',
        channelFrequencies: [10, 8, 7, 9, 5],
        channelSatisfactions: ['delighted', 'delighted', 'satisfied', 'delighted', 'satisfied']
      },
      {
        groupEn: 'Strategic Audit Board',
        groupAr: 'لجنة الرقابة والشفافية CHS',
        roleEn: 'CHS Standards Compliance & Complaints',
        roleAr: 'تطبيق معايير العمل الإنساني الأساسية والشفافية والشكاوى',
        channelFrequencies: [2, 4, 6, 5, 8],
        channelSatisfactions: ['satisfied', 'neutral', 'satisfied', 'neutral', 'concerned']
      }
    ];

    const channelsTemplate = [
      { id: 'focus', nameEn: 'Focus Groups', nameAr: 'حلقات نقاشية' },
      { id: 'meetings', nameEn: 'Review Meetings', nameAr: 'اجتماعات تنسيقية' },
      { id: 'portal', nameEn: 'Feedback Portals', nameAr: 'بوابة الملاحظات' },
      { id: 'reports', nameEn: 'Progress Reports', nameAr: 'تقارير الإنجاز' },
      { id: 'audits', nameEn: 'Field Audits', nameAr: 'الزيارات التفتيشية' }
    ];

    projectsList.forEach((proj, idx) => {
      data[proj.id] = stakeholderTemplates.map((t, sIdx) => {
        return {
          id: `stk-${proj.id}-${sIdx}`,
          groupEn: t.groupEn,
          groupAr: t.groupAr,
          roleEn: t.roleEn,
          roleAr: t.roleAr,
          channels: channelsTemplate.map((c, cIdx) => {
            let freq = t.channelFrequencies[cIdx];
            let sat = t.channelSatisfactions[cIdx];

            // Project adjustments
            if (proj.status_code === 'delayed') {
              freq = Math.max(1, freq - 1);
              if (sat === 'delighted') sat = 'satisfied';
              else if (sat === 'satisfied') sat = 'neutral';
              else if (sat === 'neutral') sat = 'concerned';
            } else if (proj.status_code === 'completed') {
              freq = Math.min(10, freq + 1);
              if (sat === 'concerned') sat = 'neutral';
              else if (sat === 'neutral') sat = 'satisfied';
            }

            const day = 1 + ((idx * 7 + sIdx * 11 + cIdx * 13) % 28);
            const lastDate = `2026-08-${day < 10 ? '0' + day : day}`;

            return {
              id: c.id,
              nameEn: c.nameEn,
              nameAr: c.nameAr,
              frequency: freq,
              satisfaction: sat,
              lastDate
            };
          })
        };
      });
    });

    return data;
  };

  const [stakeholderData, setStakeholderData] = useState<Record<string, any[]>>(() => {
    return generateInitialStakeholderData(projects);
  });

  interface StakeholderLog {
    id: string;
    type: 'meeting' | 'email';
    sourceEn: string;
    sourceAr: string;
    contentEn: string;
    contentAr: string;
    date: string;
  }

  interface PulseAnalysis {
    pulseScore: number;
    sentimentState: 'delighted' | 'satisfied' | 'neutral' | 'concerned';
    summaryEn: string;
    summaryAr: string;
    keyIssues: Array<{
      issueEn: string;
      issueAr: string;
      impact: 'high' | 'medium' | 'low';
    }>;
  }

  const generateInitialStakeholderLogs = (projectsList: Project[]): Record<string, StakeholderLog[]> => {
    const data: Record<string, StakeholderLog[]> = {};
    
    projectsList.forEach((proj) => {
      const logs: StakeholderLog[] = [];
      const status = proj.status_code?.toLowerCase() || 'active';
      
      if (status === 'delayed' || status === 'at_risk' || status === 'suspended') {
        logs.push({
          id: `log-${proj.id}-1`,
          type: 'meeting',
          sourceEn: 'District Local Council Governor',
          sourceAr: 'محافظ المجلس المحلي بالمديرية',
          contentEn: `Meeting with District Local Council regarding progress of ${proj.name_en || 'the project'}. The Governor expressed frustration about the slow material procurement process, which is delaying the distribution phase. They warned that further delays will negatively affect the refugees in the camp and asked for a daily status report.`,
          contentAr: `اجتماع مع محافظ المجلس المحلي بالمديرية لمناقشة تقدم مشروع (${proj.name_ar || 'المشروع'}). أبدى المحافظ قلقه البالغ من بطء إجراءات توريد المواد الأساسية مما يعيق تدشين التوزيع الميداني. وأكد أن استمرار التأخير سيؤثر سلباً على النازحين في مخيم الاستقبال، وطالب برفع تقرير تقدم يومي.`,
          date: '2026-08-10'
        });
        logs.push({
          id: `log-${proj.id}-2`,
          type: 'email',
          sourceEn: 'Institutional UNHCR Program Officer',
          sourceAr: 'مسؤول برامج المفوضية السامية للاجئين (UNHCR)',
          contentEn: `Official email from UNHCR. They noted a high financial burn rate (nearly 65% budget spent) while the reported progress is stuck at 25%. They requested a formal explanation of the variance and a corrective action plan aligned with Sphere standards.`,
          contentAr: `بريد رسمي من المفوضية السامية للاجئين. تمت الإشارة إلى معدل حرق مالي مرتفع (نحو 65% من الميزانية الملتزم بها) في حين أن نسبة الإنجاز الميداني لا تتعدى 25%. طلبوا إيضاحاً رسمياً للانحراف وخطة تصحيحية عاجلة تتماشى مع معايير إسفير.`,
          date: '2026-08-08'
        });
        logs.push({
          id: `log-${proj.id}-3`,
          type: 'meeting',
          sourceEn: 'Beneficiary Representative Committee',
          sourceAr: 'لجنة ممثلي المستفيدين المحليين',
          contentEn: `Focus group discussion with Al-Mil camp leaders. They expressed concern over the delayed clean water supply installations. Community elders highlighted that women are walking over 3km in extreme heat to fetch water, posing safety and health risks.`,
          contentAr: `جلسة نقاش بؤرية مع وجهاء مخيم الميل. أبدوا استياءهم من تأخر تمديد شبكات المياه الصالحة للشرب، وأشاروا إلى أن النساء يقطعن مسافة تزيد عن 3 كم لجلب المياه في قيظ الصيف، مما يعرضهن لمخاطر صحية وأمنية كبيرة.`,
          date: '2026-08-05'
        });
      } else if (status === 'completed') {
        logs.push({
          id: `log-${proj.id}-1`,
          type: 'meeting',
          sourceEn: 'Ministry of Water & Environment Director',
          sourceAr: 'مدير مكتب وزارة المياه والبيئة',
          contentEn: `Official project handover ceremony and final review meeting. The Ministry director commended Rohama'a Charity for the high quality of dual solar pumps installed, stating it is a benchmark for sustainable clean water projects in the governorate.`,
          contentAr: `مراسم الاستلام الابتدائي للمشروع واجتماع التقييم الختامي. أشاد مدير مكتب الوزارة بجمعية رُحماء بينهم لدقة وجودة المضخات الشمسية الثنائية المستخدمة، معتبراً إياها نموذجاً يحتذى به لمشاريع المياه المستدامة في المحافظة.`,
          date: '2026-08-09'
        });
        logs.push({
          id: `log-${proj.id}-2`,
          type: 'email',
          sourceEn: 'Chief Medical Officer - Al-Razi Hospital',
          sourceAr: 'مدير مستشفى الرازي الميداني',
          contentEn: `Letter of appreciation sent via email. They noted a 40% drop in waterborne diseases in the target community within just three weeks of the water supply system completion, thanking donors and field crews.`,
          contentAr: `رسالة شكر وتقدير عبر البريد الإلكتروني. أشار مدير المستشفى إلى انخفاض بنسبة 40% في أمراض الإسهال المائي بين أفراد المجتمع المحلي خلال ثلاثة أسابيع فقط من تشغيل شبكة المياه النظيفة، معبراً عن امتنانه للفرق الميدانية والداعمين.`,
          date: '2026-08-07'
        });
      } else {
        // Active/On Track
        logs.push({
          id: `log-${proj.id}-1`,
          type: 'meeting',
          sourceEn: 'Rohama\'a Field Operations Manager',
          sourceAr: 'مدير العمليات الميدانية لجمعية رُحماء',
          contentEn: `Weekly field coordination meeting. Team reports high local support. Work is moving on schedule according to WBS guidelines. Recommended setting up community maintenance training for youths next week to ensure project durability.`,
          contentAr: `الاجتماع التنسيقي الأسبوعي للفرق الميدانية. تفيد التقارير بتعاون مجتمعي ممتاز. تسير الأعمال وفق خطة WBS وجداولها الزمنية بشكل دقيق. تقرر الترتيب لورشة تدريب صيانة مجتمعية للشباب لضمان ديمومة المرافق المنجزة.`,
          date: '2026-08-11'
        });
        logs.push({
          id: `log-${proj.id}-2`,
          type: 'email',
          sourceEn: 'World Food Programme (WFP) Coordinator',
          sourceAr: 'منسق برنامج الأغذية العالمي (WFP)',
          contentEn: `Email feedback regarding coordination of food security packages. Requested a slight shift in distribution timing to match local crop harvest schedules, ensuring maximum nutritional impact and minimizing market disruption.`,
          contentAr: `رسالة إلكترونية تنسيقية بشأن توزيع سلال الأمن الغذائي. اقترحوا إزاحة بسيطة في مواعيد التوزيع لتتواءم مع موسم الحصاد المحلي، لضمان تعظيم القيمة الغذائية وتجنب إحداث خلل في الأسعار المحلية.`,
          date: '2026-08-09'
        });
      }

      data[proj.id] = logs;
    });

    return data;
  };

  const generateDefaultPulseAnalysis = (projectsList: Project[]): Record<string, PulseAnalysis> => {
    const data: Record<string, PulseAnalysis> = {};
    
    projectsList.forEach((proj) => {
      const status = proj.status_code?.toLowerCase() || 'active';
      
      if (status === 'delayed' || status === 'at_risk' || status === 'suspended') {
        data[proj.id] = {
          pulseScore: 28,
          sentimentState: 'concerned',
          summaryEn: `High-level friction detected from both the UNHCR Program Officer and the District Local Council Governor regarding the slow material procurement process and high financial burn rate relative to the 25% project progress. Community leaders represent acute concerns over delayed clean water installation.`,
          summaryAr: `تم رصد مستويات قلق مرتفعة من الجهات المانحة والمجلس المحلي نتيجة لبطء توريد المواد والتقدم الميداني البطيء البالغ 25% فقط مقارنة بنسبة الصرف المالي المرتفعة 65%. كما يثير وجهاء المجتمع المحلي شكاوى متكررة حول تأخر تمديد شبكات المياه الصالحة للشرب.`,
          keyIssues: [
            {
              issueEn: "Budget variance of 40% (Spent 65% vs Progress 25%). Urgent financial review is required.",
              issueAr: "انحراف في الميزانية بمقدار 40% (معدل صرف 65% مقابل إنجاز 25%). مراجعة مالية فورية مطلوبة.",
              impact: "high"
            },
            {
              issueEn: "District Council governor demanding daily progress bulletins to secure permits.",
              issueAr: "المجلس المحلي يطالب بتقارير تقدم يومية لتأمين الموافقات والتسهيلات الميدانية.",
              impact: "high"
            },
            {
              issueEn: "Sphere Standard Compliance: Women walking 3km for water. Safety risk de-escalation required.",
              issueAr: "الامتثال لمعايير إسفير: النساء يقطعن 3 كم لجلب المياه. يتطلب تدخلاً عاجلاً لتفادي المخاطر.",
              impact: "medium"
            }
          ]
        };
      } else if (status === 'completed') {
        data[proj.id] = {
          pulseScore: 94,
          sentimentState: 'delighted',
          summaryEn: `Superb partner relationship. The Ministry of Water and Al-Razi hospital both praise the high quality of dual solar pumps installed, reporting a 40% drop in waterborne diseases in the target community within three weeks of hand-over.`,
          summaryAr: `علاقة متميزة وإشادات واسعة من الشركاء والجهات الحكومية والمستشفى الميداني، حيث تم رصد انخفاض بنسبة 40% في أمراض الإسهال المائي خلال 3 أسابيع من تسليم شبكة المياه النظيفة للعمل.`,
          keyIssues: [
            {
              issueEn: "Maintain active communication with Ministry for future joint drilling phases.",
              issueAr: "الحفاظ على تواصل نشط مع الوزارة لمراحل حفر وتمديد مستقبلية مشتركة.",
              impact: "low"
            },
            {
              issueEn: "Document success story for marketing and upcoming funding proposals.",
              issueAr: "توثيق قصة النجاح تسويقياً واستخدامها في ملفات التمويل القادمة.",
              impact: "low"
            }
          ]
        };
      } else {
        data[proj.id] = {
          pulseScore: 75,
          sentimentState: 'satisfied',
          summaryEn: `Healthy operational coordination. WFP and field operations report steady progress on schedule under WBS guidelines, with highly supportive local community committees. Minor shift requested by WFP for food box distribution to match crop harvest seasons.`,
          summaryAr: `تنسيق تشغيلي صحي ومستقر. تفيد تقارير برنامج الأغذية العالمي والعمليات الميدانية بتقدم ثابت وفق خطة WBS وتجاوب ممتاز من اللجان المجتمعية، مع اقتراح تعديل بسيط لمواعيد التوزيع تزامناً مع مواسم الحصاد.`,
          keyIssues: [
            {
              issueEn: "Establish community maintenance committee training next week to sustain the water asset.",
              issueAr: "إنشاء برنامج تدريب للجنة الصيانة المجتمعية الأسبوع القادم لضمان ديمومة المرافق.",
              impact: "medium"
            },
            {
              issueEn: "Adjust food box distribution cycles by 4 days to coordinate with local harvest season.",
              issueAr: "تعديل دورات توزيع السلال الأغذية بمقدار 4 أيام للتنسيق مع موسم الحصاد المحلي.",
              impact: "low"
            }
          ]
        };
      }
    });

    return data;
  };

  const [stakeholderLogs, setStakeholderLogs] = useState<Record<string, StakeholderLog[]>>(() => {
    return generateInitialStakeholderLogs(projects);
  });

  const [pulseAnalysisResult, setPulseAnalysisResult] = useState<Record<string, PulseAnalysis>>(() => {
    return generateDefaultPulseAnalysis(projects);
  });

  const [pulseAnalysisLoading, setPulseAnalysisLoading] = useState<Record<string, boolean>>({});
  const [pulseAnalysisError, setPulseAnalysisError] = useState<Record<string, string | null>>({});

  const handleRunPulseAnalysis = async (projectId: string) => {
    const logs = stakeholderLogs[projectId] || [];
    if (logs.length === 0) return;

    setPulseAnalysisLoading(prev => ({ ...prev, [projectId]: true }));
    setPulseAnalysisError(prev => ({ ...prev, [projectId]: null }));

    try {
      const response = await fetch('/api/gemini/stakeholder-pulse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ logs })
      });

      if (!response.ok) {
        throw new Error(lang === 'ar' ? 'فشل تحليل نبض الشركاء باستخدام الذكاء الاصطناعي' : 'Gemini pulse analysis failed');
      }

      const data = await response.json();
      if (data && data.pulseScore !== undefined) {
        setPulseAnalysisResult(prev => ({
          ...prev,
          [projectId]: data
        }));
      } else {
        throw new Error(lang === 'ar' ? 'استجابة غير صالحة من محرك الذكاء الاصطناعي' : 'Invalid structure from Gemini');
      }
    } catch (error: any) {
      console.error(error);
      setPulseAnalysisError(prev => ({
        ...prev,
        [projectId]: error.message || (lang === 'ar' ? 'خطأ غير متوقع في محرك الذكاء الاصطناعي' : 'Unexpected AI error')
      }));
    } finally {
      setPulseAnalysisLoading(prev => ({ ...prev, [projectId]: false }));
    }
  };

  const [selectedStakeholderProjId, setSelectedStakeholderProjId] = useState<string>('');

  const [newLogSourceEn, setNewLogSourceEn] = useState<string>('');
  const [newLogSourceAr, setNewLogSourceAr] = useState<string>('');
  const [newLogContentEn, setNewLogContentEn] = useState<string>('');
  const [newLogContentAr, setNewLogContentAr] = useState<string>('');
  const [newLogType, setNewLogType] = useState<'meeting' | 'email'>('meeting');
  const [showAddLogForm, setShowAddLogForm] = useState<boolean>(false);

  const handleAddStakeholderLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogSourceEn || !newLogContentEn) return;

    const newLog: StakeholderLog = {
      id: `log-${selectedStakeholderProjId}-${Date.now()}`,
      type: newLogType,
      sourceEn: newLogSourceEn,
      sourceAr: newLogSourceAr || newLogSourceEn,
      contentEn: newLogContentEn,
      contentAr: newLogContentAr || newLogContentEn,
      date: new Date().toISOString().split('T')[0]
    };

    setStakeholderLogs(prev => ({
      ...prev,
      [selectedStakeholderProjId]: [newLog, ...(prev[selectedStakeholderProjId] || [])]
    }));

    // Reset form
    setNewLogSourceEn('');
    setNewLogSourceAr('');
    setNewLogContentEn('');
    setNewLogContentAr('');
    setShowAddLogForm(false);
  };
  
  // Set default selected project for stakeholder tab on load
  useEffect(() => {
    if (activeDashboardProjects.length > 0 && !selectedStakeholderProjId) {
      setSelectedStakeholderProjId(activeDashboardProjects[0].id);
    }
  }, [activeDashboardProjects, selectedStakeholderProjId]);

  // Selected cell for interactive feedback log/details modal in stakeholder heatmap
  const [selectedStkCell, setSelectedStkCell] = useState<{
    stakeholderId: string;
    channelId: string;
    stakeholderName: string;
    channelName: string;
    frequency: number;
    satisfaction: 'delighted' | 'satisfied' | 'neutral' | 'concerned';
    lastDate: string;
  } | null>(null);

  const handleUpdateStkCell = (
    stkId: string, 
    chanId: string, 
    newFreq: number, 
    newSat: 'delighted' | 'satisfied' | 'neutral' | 'concerned',
    newDate: string
  ) => {
    setStakeholderData(prev => {
      const projData = prev[selectedStakeholderProjId] || [];
      const updatedProjData = projData.map(stk => {
        if (stk.id === stkId) {
          return {
            ...stk,
            channels: stk.channels.map((chan: any) => {
              if (chan.id === chanId) {
                return {
                  ...chan,
                  frequency: newFreq,
                  satisfaction: newSat,
                  lastDate: newDate
                };
              }
              return chan;
            })
          };
        }
        return stk;
      });

      return {
        ...prev,
        [selectedStakeholderProjId]: updatedProjData
      };
    });

    // Also update the active selected cell preview to keep it in sync
    setSelectedStkCell(prev => {
      if (!prev) return null;
      return {
        ...prev,
        frequency: newFreq,
        satisfaction: newSat,
        lastDate: newDate
      };
    });
  };

  const months = React.useMemo(() => [
    { nameEn: 'Jan', nameAr: 'يناير', index: 0 },
    { nameEn: 'Feb', nameAr: 'فبراير', index: 1 },
    { nameEn: 'Mar', nameAr: 'مارس', index: 2 },
    { nameEn: 'Apr', nameAr: 'يناير', index: 3 },
    { nameEn: 'May', nameAr: 'مايو', index: 4 },
    { nameEn: 'Jun', nameAr: 'أغسطس', index: 5 },
    { nameEn: 'Jul', nameAr: 'اليوم', index: 6 },
    { nameEn: 'Aug', nameAr: 'ممتاز', index: 7 },
    { nameEn: 'Sep', nameAr: 'مشاريع', index: 8 },
    { nameEn: 'Oct', nameAr: 'مشاريع', index: 9 },
    { nameEn: 'Nov', nameAr: 'مشاريع', index: 10 },
    { nameEn: 'Dec', nameAr: 'مشاريع', index: 11 },
  ], []);

  const resourceHeatmapData = React.useMemo(() => {
    return activeDashboardProjects.map(proj => {
      const start = proj.start_date ? new Date(proj.start_date) : new Date('2026-01-01');
      const end = proj.end_date ? new Date(proj.end_date) : new Date('2026-12-31');
      
      const monthlyDemand = months.map(m => {
        const monthStart = new Date(2026, m.index, 1);
        const monthEnd = new Date(2026, m.index, 28);
        const isActive = monthStart <= end && monthEnd >= start;
        
        let demand = 0;
        if (isActive) {
          let baseWeight = 4.0;
          if (proj.priority_code === 'high') baseWeight = 6.0;
          else if (proj.priority_code === 'low') baseWeight = 2.0;

          const rawBudget = String(proj.budget || '0').replace(/[^0-9.]/g, '');
          const budgetNum = parseFloat(rawBudget) || 0;
          const budgetWeight = Math.min(3.5, (budgetNum / 50000) * 1.0);
          
          let riskWeight = 0.5;
          if (proj.risk_level === 'high') riskWeight = 1.2;
          else if (proj.risk_level === 'medium') riskWeight = 0.7;

          demand = baseWeight + budgetWeight + riskWeight;

          if (proj.status_code === 'delayed') {
            demand *= 1.3; // 30% surge for recovery
          } else if (proj.status_code === 'completed') {
            demand = 0.2; // close out support
          }
        }
        return {
          monthIndex: m.index,
          demand: parseFloat(demand.toFixed(1))
        };
      });

      return {
        projectId: proj.id,
        code: proj.code,
        nameEn: proj.name_en,
        nameAr: proj.name_ar,
        monthlyDemand
      };
    });
  }, [activeDashboardProjects, months]);

  const monthlyTotals = React.useMemo(() => {
    return months.map(m => {
      let totalDemand = 0;
      resourceHeatmapData.forEach(p => {
        totalDemand += p.monthlyDemand[m.index].demand;
      });
      return {
        monthIndex: m.index,
        nameEn: m.nameEn,
        nameAr: m.nameAr,
        totalDemand: parseFloat(totalDemand.toFixed(1))
      };
    });
  }, [resourceHeatmapData, months]);

  // Auto-select first milestone if not selected or if the list changes
  useEffect(() => {
    if (upcomingDeadlines.length > 0) {
      if (!selectedMilestoneId || !upcomingDeadlines.some(m => m.id === selectedMilestoneId)) {
        setSelectedMilestoneId(upcomingDeadlines[0].id);
      }
    } else {
      setSelectedMilestoneId(null);
    }
  }, [upcomingDeadlines, selectedMilestoneId]);

  const handleUpdateMilestoneStatus = (milestoneId: string, newStatus: 'completed' | 'in_progress' | 'upcoming' | 'delayed') => {
    const updated = milestones.map(m => {
      if (m.id === milestoneId) {
        return { ...m, status: newStatus };
      }
      return m;
    });
    setMilestones(updated);
    try {
      localStorage.setItem('nexora_project_milestones_v1', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const ganttScale = React.useMemo(() => {
    if (upcomingDeadlines.length === 0) return null;
    
    const times = upcomingDeadlines.map(m => new Date(m.date).getTime());
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    const dayMs = 86400000;
    // Buffer for left and right margins
    const startRange = minTime - 5 * dayMs;
    const endRange = maxTime + 12 * dayMs;
    const span = Math.max(dayMs * 10, endRange - startRange);
    
    // Generate 4 key markers on the timeline
    const markers = [];
    for (let i = 0; i < 4; i++) {
      const time = startRange + (span * i) / 3;
      const dateObj = new Date(time);
      const label = dateObj.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric'
      });
      markers.push({ time, label });
    }
    
    return {
      startRange,
      endRange,
      span,
      markers
    };
  }, [upcomingDeadlines, isRtl]);

  const getGanttBarCoords = (milestoneDateStr: string, projectId: string) => {
    if (!ganttScale) return { left: 0, width: 0 };
    const { startRange, span } = ganttScale;
    
    const targetTime = new Date(milestoneDateStr).getTime();
    
    // Find project start date to make an actual start for the bar, otherwise default to 15 days before
    const proj = projects.find(p => p.id === projectId);
    let startTime = targetTime - 15 * 86400000; // 15 days default window
    if (proj?.start_date) {
      startTime = new Date(proj.start_date).getTime();
    }
    
    // Ensure startTime is not after targetTime
    if (startTime > targetTime) {
      startTime = targetTime - 7 * 86400000;
    }
    
    // Position of start and end relative to scale range
    const leftRaw = ((startTime - startRange) / span) * 100;
    const rightRaw = ((targetTime - startRange) / span) * 100;
    
    // Clamp to [0, 100]
    const left = Math.max(0, Math.min(92, leftRaw));
    const right = Math.max(8, Math.min(100, rightRaw));
    const width = Math.max(12, right - left);
    
    return { left, width };
  };

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'delayed'>('all');
  const [selectedPriorities, setSelectedPriorities] = useState<('high' | 'medium' | 'low')[]>(['high', 'medium', 'low']);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const getNormalizedPriority = (priorityCode: string | null | undefined): 'high' | 'medium' | 'low' => {
    const code = (priorityCode || '').toLowerCase();
    if (code === 'critical' || code === 'high' || code === 'urgent') return 'high';
    if (code === 'medium' || code === 'normal') return 'medium';
    if (code === 'low') return 'low';
    return 'medium'; // Default fallback
  };

  const handleStatusDrilldown = (status: 'active' | 'pending' | 'completed' | 'delayed') => {
    localStorage.setItem('finance_drilldown_status', status);
    onNavigate('finance');
  };

  const displayedProjects = React.useMemo(() => {
    if (showArchivedList) {
      return projects.filter(p => archivedProjectIds.includes(p.id));
    }
    return activeDashboardProjects;
  }, [projects, activeDashboardProjects, archivedProjectIds, showArchivedList]);

  const filteredProjects = displayedProjects.filter(p => {
    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = p.status_code === 'active' || !p.status_code;
    else if (statusFilter === 'pending') matchesStatus = p.status_code === 'pending' || p.status_code === 'upcoming';
    else if (statusFilter === 'delayed') matchesStatus = p.status_code === 'delayed';

    const normalizedPriority = getNormalizedPriority(p.priority_code);
    const matchesPriority = selectedPriorities.includes(normalizedPriority);

    return matchesStatus && matchesPriority;
  });

  // Calculate live project metrics from state
  const totalCount = activeDashboardProjects.length;
  const activeCount = activeDashboardProjects.filter(p => p.status_code === 'active' || !p.status_code).length;
  const completedCount = activeDashboardProjects.filter(p => p.status_code === 'completed').length;
  const pendingCount = activeDashboardProjects.filter(p => p.status_code === 'pending' || p.status_code === 'upcoming').length;
  const delayedCount = activeDashboardProjects.filter(p => p.status_code === 'delayed').length;

  // Generate deterministic 7-day trend ending exactly at current count
  const get7DayTrend = (count: number, seed: number) => {
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      if (count === 0) {
        trend.push({ day: 6 - i, count: 0 });
        continue;
      }
      const variance = Math.round(Math.sin((i + seed) * 1.5) * Math.min(2, count * 0.3));
      const value = i === 0 ? count : Math.max(0, count - Math.round(i * 0.2) + variance);
      trend.push({ day: 6 - i, count: value });
    }
    return trend;
  };

  const activeTrendData = get7DayTrend(activeCount, 12);
  const pendingTrendData = get7DayTrend(pendingCount, 24);

  // Generate deterministic 30-day trend for Completed vs Delayed projects
  const get30DayTrend = () => {
    const dataPoints = [];
    for (let i = 5; i >= 0; i--) {
      const daysAgo = i * 6;
      let label = '';
      if (daysAgo === 0) {
        label = isRtl ? 'متأخر' : 'Today';
      } else {
        label = isRtl ? `منذ ${daysAgo} ?` : `${daysAgo}d ago`;
      }
      
      // Let's make Completed trend upwards to Today's completedCount
      let compVal = completedCount;
      if (i > 0) {
        compVal = Math.max(0, Math.round(completedCount * (1 - i * 0.16) - Math.sin(i) * 0.5));
      }
      
      // Let's make Delayed fluctuate slightly around delayedCount
      let delVal = delayedCount;
      if (i > 0) {
        const variance = Math.round(Math.cos(i * 1.5) * Math.min(2, delayedCount * 0.3));
        delVal = Math.max(0, delayedCount + variance);
      }
      
      dataPoints.push({
        name: label,
        [isRtl ? 'الكفالات' : 'Completed']: compVal,
        [isRtl ? 'المحافظة' : 'Delayed']: delVal,
      });
    }
    return dataPoints;
  };

  const trendData30Days = get30DayTrend();

  // Dynamic Budget Forecasting and actual spending comparison
  const currencySummaries = React.useMemo(() => {
    const map: Record<string, { planned: number; actual: number }> = {};
    activeDashboardProjects.forEach(p => {
      const currency = p.currency_code || 'USD';
      const planned = parseFloat(p.budget || '0');
      
      const progress = parseFloat(p.progress_percent || '0') / 100;
      let actual = 0;
      if (p.status_code === 'completed') {
        actual = planned * 0.98; // On track or slightly under budget
      } else if (p.status_code === 'delayed') {
        actual = planned * Math.min(1.2, progress + 0.15); // Cost overrun relative to progress
      } else if (p.status_code === 'pending' || p.status_code === 'upcoming') {
        actual = planned * 0.02; // mobilization costs
      } else {
        // active or general
        actual = planned * Math.max(0.05, progress * 0.95);
      }

      if (!map[currency]) {
        map[currency] = { planned: 0, actual: 0 };
      }
      map[currency].planned += planned;
      map[currency].actual += actual;
    });

    return Object.entries(map).map(([currency, data]) => {
      const variance = data.actual - data.planned;
      const variancePercent = data.planned > 0 ? (variance / data.planned) * 100 : 0;
      return {
        currency,
        planned: data.planned,
        actual: data.actual,
        variance,
        variancePercent
      };
    });
  }, [activeDashboardProjects]);

  const portfolioVariancePercent = React.useMemo(() => {
    const totalPlannedBase = currencySummaries.reduce((sum, item) => sum + item.planned, 0);
    if (totalPlannedBase <= 0) return 0;
    const weightedSum = currencySummaries.reduce((sum, item) => sum + (item.variancePercent * item.planned), 0);
    return weightedSum / totalPlannedBase;
  }, [currencySummaries]);

  const varianceTrendData = React.useMemo(() => {
    const currentVar = portfolioVariancePercent;
    const points = [];
    for (let i = 5; i >= 0; i--) {
      const daysAgo = i * 6;
      let label = '';
      if (daysAgo === 0) {
        label = isRtl ? 'إلغاء' : 'Today';
      } else {
        label = isRtl ? `منذ ${daysAgo} ?` : `${daysAgo}d ago`;
      }
      
      // Simulate a stable and realistic variance progression ending at the current variance
      let val = currentVar;
      if (i > 0) {
        val = currentVar - (i * 0.45) + Math.sin(i * 1.5) * 1.3;
      }
      points.push({
        name: label,
        [isRtl ? 'الانحراف المالي (%)' : 'Variance (%)']: parseFloat(val.toFixed(2))
      });
    }
    return points;
  }, [portfolioVariancePercent, isRtl]);

  // Calculate percentage ratios
  const activePercent = totalCount ? Math.round((activeCount / totalCount) * 100) : 0;
  const completedPercent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
  const pendingPercent = totalCount ? Math.round((pendingCount / totalCount) * 100) : 0;
  const delayedPercent = totalCount ? Math.round((delayedCount / totalCount) * 100) : 0;

  // Performance Stability Index (PSI) calculation
  const stabilityIndex = (activeCount + delayedCount) > 0 
    ? Math.round((activeCount / (activeCount + delayedCount)) * 100) 
    : 100;

  const psiRadius = 22;
  const psiStrokeWidth = 4.5;
  const psiCircumference = 2 * Math.PI * psiRadius;
  const psiStrokeDashoffset = psiCircumference - (stabilityIndex / 100) * psiCircumference;

  // Determine PSI styling based on stability index
  let psiStrokeColor = 'stroke-emerald-500';
  let psiStatusBg = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
  let psiStatusText = isRtl ? 'ممتاز' : 'Excellent';

  if (stabilityIndex < 50) {
    psiStrokeColor = 'stroke-rose-500';
    psiStatusBg = 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20';
    psiStatusText = isRtl ? 'ضعيف' : 'Critical';
  } else if (stabilityIndex < 75) {
    psiStrokeColor = 'stroke-amber-500';
    psiStatusBg = 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
    psiStatusText = isRtl ? 'متوسط' : 'Moderate';
  } else if (stabilityIndex < 90) {
    psiStrokeColor = 'stroke-sky-500';
    psiStatusBg = 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20';
    psiStatusText = isRtl ? 'مستقر' : 'Stable';
  }

  return (
    <div 
      id="nexora-project-status-overview-widget"
      className="mb-4 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm transition-all duration-200 overflow-hidden"
    >
      {/* HEADER STRIP */}
      <div 
        onClick={toggleExpanded}
        className="px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>{isRtl ? 'ملخص مؤشرات المشاريع الميدانية 📊' : 'Field Project Status Indicators 📊'}</span>
              <span className="text-[10px] font-black font-mono px-2 py-0.5 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-slate-500 dark:text-zinc-400">
                {totalCount} {isRtl ? 'مشاريع' : 'Projects'}
              </span>
            </h4>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold mt-0.5">
              {isRtl 
                ? 'مراقبة فورية لحالة ومعدلات تقدم المشاريع والمحافظ التشغيلية في الميدان' 
                : 'Real-time monitoring of active portfolios, progress rates, and field execution statuses'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick stats preview when collapsed */}
          {!isExpanded && (
            <div className={`hidden md:flex items-center gap-3 text-[10px] font-black ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{activeCount} {isRtl ? 'نشط / مستمر ميدانياً' : 'Active'}</span>
              </span>
              <span className="text-amber-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{pendingCount} {isRtl ? 'طلبات' : 'Pending'}</span>
              </span>
              <span className="text-slate-500 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{completedCount} {isRtl ? 'منتهي / مغلق' : 'Completed'}</span>
              </span>
            </div>
          )}

          <button 
            type="button"
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* COLLAPSIBLE CONTENTS */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div className="px-5 pb-5 pt-1.5 border-t border-slate-100 dark:border-zinc-900/60 flex flex-col gap-4">
              
              {/* Dynamic segmented progress bar */}
              <div className="w-full">
                <div className="h-2 w-full bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden flex">
                  {activePercent > 0 && (
                    <div 
                      style={{ width: `${activePercent}%` }} 
                      className="bg-emerald-500 h-full transition-all cursor-pointer hover:opacity-80" 
                      title={`${isRtl ? 'نشط' : 'Active'}: ${activePercent}% (${isRtl ? 'انقر لعرض التحليل المالي' : 'Click for financial breakdown'})`}
                      onClick={() => handleStatusDrilldown('active')}
                    />
                  )}
                  {pendingPercent > 0 && (
                    <div 
                      style={{ width: `${pendingPercent}%` }} 
                      className="bg-amber-500 h-full transition-all cursor-pointer hover:opacity-80" 
                      title={`${isRtl ? 'قيد الانتظار' : 'Pending'}: ${pendingPercent}% (${isRtl ? 'انقر لعرض التحليل المالي' : 'Click for financial breakdown'})`}
                      onClick={() => handleStatusDrilldown('pending')}
                    />
                  )}
                  {completedPercent > 0 && (
                    <div 
                      style={{ width: `${completedPercent}%` }} 
                      className="bg-slate-400 dark:bg-zinc-600 h-full transition-all cursor-pointer hover:opacity-80" 
                      title={`${isRtl ? 'مكتمل' : 'Completed'}: ${completedPercent}% (${isRtl ? 'انقر لعرض التحليل المالي' : 'Click for financial breakdown'})`}
                      onClick={() => handleStatusDrilldown('completed')}
                    />
                  )}
                  {delayedPercent > 0 && (
                    <div 
                      style={{ width: `${delayedPercent}%` }} 
                      className="bg-rose-500 h-full transition-all cursor-pointer hover:opacity-80" 
                      title={`${isRtl ? 'متأخر' : 'Delayed'}: ${delayedPercent}% (${isRtl ? 'انقر لعرض التحليل المالي' : 'Click for financial breakdown'})`}
                      onClick={() => handleStatusDrilldown('delayed')}
                    />
                  )}
                </div>
              </div>

              {/* Gemini AI Quick Insights Section */}
              <div className="bg-gradient-to-r from-emerald-500/5 to-amber-500/5 dark:from-emerald-950/10 dark:to-amber-950/10 border border-emerald-500/15 dark:border-emerald-500/10 rounded-2xl p-4 shadow-sm relative overflow-hidden animate-fade-in" id="portfolio-quick-insights">
                {/* Visual decoration */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-2xl -mr-8 -mt-8" />
                
                <div className="flex items-center justify-between gap-3 mb-3 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
                      <Sparkles className="w-4 h-4 animate-pulse text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-[12px] font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 leading-none">
                        {isRtl ? 'بوابة الذكاء الاصطناعي: التحليل الفوري للمحفظة' : 'AI Intelligence Portal: Portfolio Quick Insights'}
                      </h4>
                      <p className="text-[9.5px] text-slate-400 dark:text-zinc-500 font-semibold mt-0.5">
                        {isRtl ? 'تحليل ذكي تلقائي مدعوم بنماذج Gemini لتقييم المخاطر وتوجيه الأثر الميداني' : 'Automated strategic breakdown powered by Gemini models for risks & field impact'}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => fetchPortfolioInsights(true)}
                    disabled={insightsLoading}
                    className="p-1.5 text-slate-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-50 transition-colors rounded-lg bg-white/60 dark:bg-zinc-900/60 border border-slate-200/50 dark:border-zinc-800/80 cursor-pointer shadow-sm flex items-center justify-center"
                    title={isRtl ? 'تحديث التحليل الذكي' : 'Refresh AI Analysis'}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${insightsLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="relative z-10 bg-white/40 dark:bg-zinc-950/20 border border-slate-100/50 dark:border-zinc-900/50 rounded-xl p-3.5">
                  {insightsLoading ? (
                    <div className="space-y-2.5 animate-pulse py-2">
                      <div className="h-4 bg-slate-200/60 dark:bg-zinc-800/60 rounded-md w-1/3" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 bg-slate-200/50 dark:bg-zinc-800/50 rounded-md w-full" />
                        <div className="h-3.5 bg-slate-200/50 dark:bg-zinc-800/50 rounded-md w-11/12" />
                        <div className="h-3.5 bg-slate-200/50 dark:bg-zinc-800/50 rounded-md w-4/5" />
                      </div>
                      <div className="h-4 bg-slate-200/60 dark:bg-zinc-800/60 rounded-md w-1/4 pt-2" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 bg-slate-200/50 dark:bg-zinc-800/50 rounded-md w-full" />
                        <div className="h-3.5 bg-slate-200/50 dark:bg-zinc-800/50 rounded-md w-5/6" />
                      </div>
                    </div>
                  ) : insightsError ? (
                    <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400 py-3 text-xs font-bold justify-center">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{insightsError}</span>
                      <button 
                        onClick={() => fetchPortfolioInsights(true)}
                        className="underline text-[10px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 ml-1.5 font-black cursor-pointer"
                      >
                        {isRtl ? 'إعادة المحاولة' : 'Retry'}
                      </button>
                    </div>
                  ) : insights ? (
                    <div className="space-y-1 divide-y divide-slate-100/40 dark:divide-zinc-900/40 text-slate-700 dark:text-zinc-400">
                      {renderMarkdown(insights)}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold mb-2">
                        {isRtl ? 'اضغط لتشغيل التحليل التلقائي للمحفظة الحالية' : 'Click below to initiate automated portfolio diagnostics'}
                      </p>
                      <button
                        onClick={() => fetchPortfolioInsights(true)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black tracking-wide uppercase transition-all shadow-sm flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'توليد ومضات الذكاء الاصطناعي' : 'Generate AI Insights'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Grid of counters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* 0. Performance Stability Index */}
                <div className="p-3 bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-900 rounded-xl flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold truncate" title={isRtl ? 'مؤشر استقرار الأداء' : 'Performance Stability Index'}>
                      {isRtl ? 'مؤشر استقرار الأداء' : 'Stability Index'}
                    </span>
                    <div className="flex flex-col mt-1 gap-1">
                      <span className="text-xs font-black text-slate-700 dark:text-zinc-300 leading-none truncate">
                        {isRtl ? 'استقرار المحفظة' : 'Portfolio Stability'}
                      </span>
                      <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded border self-start ${psiStatusBg}`}>
                        {psiStatusText}
                      </span>
                    </div>
                  </div>

                  {/* Circular Progress Ring */}
                  <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 52 52">
                      {/* Background circle */}
                      <circle
                        cx="26"
                        cy="26"
                        r={psiRadius}
                        className="stroke-slate-100 dark:stroke-zinc-800"
                        strokeWidth={psiStrokeWidth}
                        fill="transparent"
                      />
                      {/* Foreground progress circle */}
                      <circle
                        cx="26"
                        cy="26"
                        r={psiRadius}
                        className={`transition-all duration-500 ease-out ${psiStrokeColor}`}
                        strokeWidth={psiStrokeWidth}
                        fill="transparent"
                        strokeDasharray={psiCircumference}
                        strokeDashoffset={psiStrokeDashoffset}
                        strokeLinecap="round"
                      />
                    </svg>
                    {/* Inner text */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-black text-slate-800 dark:text-zinc-200">
                        {stabilityIndex}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* 1. Active Projects */}
                <div 
                  onClick={() => handleStatusDrilldown('active')}
                  className="p-3 bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-900 rounded-xl flex items-center justify-between gap-2.5 cursor-pointer hover:bg-emerald-500/5 hover:border-emerald-500/30 hover:scale-[1.01] transition-all group"
                  title={isRtl ? 'انقر لعرض التحليل المالي للمشاريع النشطة في قسم المالية' : 'Click to view financial breakdown for Active projects in Finance'}
                >
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {isRtl ? 'المشاريع النشطة ميدانياً' : 'Active Field Projects'}
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-lg font-black text-slate-900 dark:text-white">
                        {activeCount}
                      </span>
                      <span className="text-[8px] text-slate-400 dark:text-zinc-500 font-medium">
                        {isRtl ? 'اليوم' : 'Today'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Active Projects Sparkline */}
                  <div className="w-14 h-7 shrink-0 overflow-hidden" title={isRtl ? 'اتجاه نشط لـ 7 أيام' : '7-day active trend'}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={activeTrendData} margin={{ top: 2, bottom: 2, left: 2, right: 2 }}>
                        <Line 
                           type="monotone" 
                           dataKey="count" 
                           stroke="#10b981" 
                           strokeWidth={1.5} 
                           dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
 
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    {activePercent}%
                  </div>
                </div>
 
                {/* 2. Pending / Upcoming Projects */}
                <div 
                  onClick={() => handleStatusDrilldown('pending')}
                  className="p-3 bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-900 rounded-xl flex items-center justify-between gap-2.5 cursor-pointer hover:bg-amber-500/5 hover:border-amber-500/30 hover:scale-[1.01] transition-all group"
                  title={isRtl ? 'انقر لعرض التحليل المالي للمشاريع قيد الانتظار في قسم المالية' : 'Click to view financial breakdown for Pending projects in Finance'}
                >
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold truncate group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">
                      {isRtl ? 'المشاريع قيد الانتظار' : 'Pending/Upcoming'}
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-lg font-black text-slate-900 dark:text-white">
                        {pendingCount}
                      </span>
                      <span className="text-[8px] text-slate-400 dark:text-zinc-500 font-medium">
                        {isRtl ? 'اليوم' : 'Today'}
                      </span>
                    </div>
                  </div>
 
                  {/* Pending Projects Sparkline */}
                  <div className="w-14 h-7 shrink-0 overflow-hidden" title={isRtl ? 'اتجاه الانتظار لـ 7 أيام' : '7-day pending trend'}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={pendingTrendData} margin={{ top: 2, bottom: 2, left: 2, right: 2 }}>
                        <Line 
                           type="monotone" 
                           dataKey="count" 
                           stroke="#f59e0b" 
                           strokeWidth={1.5} 
                           dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
 
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-black shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    {pendingPercent}%
                  </div>
                </div>
 
                {/* 3. Completed Projects */}
                <div 
                  onClick={() => handleStatusDrilldown('completed')}
                  className="p-3 bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-900 rounded-xl flex items-center justify-between gap-3 shadow-sm cursor-pointer hover:bg-slate-500/5 hover:border-slate-500/30 hover:scale-[1.01] transition-all group"
                  title={isRtl ? 'انقر لعرض التحليل المالي للمشاريع المكتملة في قسم المالية' : 'Click to view financial breakdown for Completed projects in Finance'}
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold group-hover:text-slate-600 dark:group-hover:text-zinc-400 transition-colors">
                      {isRtl ? 'المشاريع المكتملة' : 'Completed Projects'}
                    </span>
                    <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                      {completedCount}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-slate-500/10 border border-slate-500/20 text-slate-600 dark:text-slate-400 flex items-center justify-center text-xs font-black group-hover:bg-slate-500 group-hover:text-white transition-colors">
                    {completedPercent}%
                  </div>
                </div>
 
                {/* 4. Total Budget Status */}
                <div className="p-3 bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-900 rounded-xl flex items-center justify-between gap-3 shadow-sm sm:max-lg:col-span-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold">
                      {isRtl ? 'معدل الإنجاز العام' : 'Overall Completion Rate'}
                    </span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 shrink-0" />
                      <span>{completedPercent}%</span>
                    </span>
                  </div>
                  <button
                    onClick={() => onNavigate('projects')}
                    className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 transition-all flex items-center justify-center text-slate-500 dark:text-zinc-300 cursor-pointer"
                    title={isRtl ? 'الانتقال لقسم المشاريع' : 'Navigate to Projects'}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 30-Day Completed vs Delayed Trend Chart */}
              <div className="border-t border-slate-100 dark:border-zinc-900/60 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3.5">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1 bg-slate-100 dark:bg-zinc-900 rounded-md">
                      <TrendingUp className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                    </div>
                    <div>
                      <h5 className="text-[11.5px] font-black text-slate-800 dark:text-zinc-300">
                        {isRtl ? 'منحنى أداء المشاريع الميدانية (الأيام الـ 30 الماضية)' : 'Field Project Performance Trend (Last 30 Days)'}
                      </h5>
                      <p className="text-[9.5px] text-slate-400 dark:text-zinc-500 font-semibold mt-0.5">
                        {isRtl ? 'مقارنة تراكمية لحجم المشاريع المكتملة مقابل المتعثرة/المتأخرة بمقاييس الأداء الميداني' : 'Cumulative comparison of completed vs delayed projects'}
                      </p>
                    </div>
                  </div>

                  {/* Summary Legend Stats */}
                  <div className="flex items-center gap-3">
                    <div 
                      onClick={() => handleStatusDrilldown('completed')}
                      className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
                      title={isRtl ? 'انقر لعرض تفاصيل المشاريع المكتملة في المالية' : 'Click to view Completed projects in Finance'}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 border border-emerald-500/30 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] text-slate-600 dark:text-zinc-400 font-black">
                        {isRtl ? `مكتمل (${completedCount})` : `Completed (${completedCount})`}
                      </span>
                    </div>
                    <div 
                      onClick={() => handleStatusDrilldown('delayed')}
                      className="flex items-center gap-1.5 cursor-pointer hover:text-rose-600 dark:hover:text-rose-400 transition-colors group"
                      title={isRtl ? 'انقر لعرض تفاصيل المشاريع المتأخرة في المالية' : 'Click to view Delayed projects in Finance'}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 border border-rose-500/30 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] text-slate-600 dark:text-zinc-400 font-black">
                        {isRtl ? `متأخر (${delayedCount})` : `Delayed (${delayedCount})`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recharts Container */}
                <div className="h-44 w-full bg-slate-50/30 dark:bg-zinc-900/10 border border-slate-100 dark:border-zinc-900/80 rounded-xl p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={trendData30Days}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.12}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                        </linearGradient>
                        <linearGradient id="colorDelayed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.12}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.01}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200/50 dark:text-zinc-800/40" />
                      <XAxis 
                        dataKey="name" 
                        stroke="currentColor" 
                        className="text-slate-400 dark:text-zinc-500 text-[9px] font-bold"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="currentColor" 
                        className="text-slate-400 dark:text-zinc-500 text-[9px] font-bold"
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(9, 13, 22, 0.95)',
                          borderRadius: '12px',
                          border: '1px solid rgba(255,255,255,0.08)',
                          fontSize: '10px',
                          fontWeight: 'bold',
                        }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey={isRtl ? 'المكتملة' : 'Completed'} 
                        stroke="#10b981" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorCompleted)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey={isRtl ? 'متأخر' : 'Delayed'} 
                        stroke="#f43f5e" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorDelayed)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Upcoming Milestones & Resource Heatmap Tracker Section */}
              <div className="border-t border-slate-100 dark:border-zinc-900/60 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5 border-b border-slate-100 dark:border-zinc-900/60 pb-3">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md">
                      <Flag className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h5 className="text-[11.5px] font-black text-slate-800 dark:text-zinc-300">
                        {isRtl ? 'تحليلات المخطط الزمني وموارد المحفظة' : 'Timeline & Resource Analytics'}
                      </h5>
                      <p className="text-[9.5px] text-slate-400 dark:text-zinc-500 font-semibold mt-0.5">
                        {isRtl ? 'متابعة المحطات الحرجة للمشاريع وتحليل خريطة حرارة توزيع الموارد الميدانية' : 'Monitor upcoming project milestones or analyze active human & logistics workloads'}
                      </p>
                    </div>
                  </div>

                  {/* Tab Selector Segmented Control */}
                  <div className="flex bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-slate-200/50 dark:border-zinc-800 self-start sm:self-auto shrink-0 select-none">
                    <button
                      type="button"
                      onClick={() => setHeatmapSectionTab('gantt')}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[9.5px] font-black transition-all cursor-pointer ${
                        heatmapSectionTab === 'gantt'
                          ? 'bg-white dark:bg-zinc-950 text-emerald-600 dark:text-emerald-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                      }`}
                    >
                      <Calendar className="w-3 h-3" />
                      <span>{isRtl ? 'الجدول الزمني (Gantt)' : 'Milestones (Gantt)'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeatmapSectionTab('heatmap')}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[9.5px] font-black transition-all cursor-pointer ${
                        heatmapSectionTab === 'heatmap'
                          ? 'bg-white dark:bg-zinc-950 text-emerald-600 dark:text-emerald-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                      }`}
                    >
                      <Users className="w-3 h-3" />
                      <span>{isRtl ? 'خريطة حرارة الموارد' : 'Resource Heatmap'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeatmapSectionTab('stakeholders')}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[9.5px] font-black transition-all cursor-pointer ${
                        heatmapSectionTab === 'stakeholders'
                          ? 'bg-white dark:bg-zinc-950 text-emerald-600 dark:text-emerald-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                      }`}
                    >
                      <HeartHandshake className="w-3 h-3" />
                      <span>{isRtl ? 'أصحاب المصلحة' : 'Stakeholders'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {heatmapSectionTab === 'heatmap' ? (
                    <div className="bg-slate-50/40 dark:bg-zinc-950/40 border border-slate-200/60 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col gap-4 animate-fade-in">
                      {/* Interactive Controls Header */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-900">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <div>
                            <span className="text-[10px] font-black text-slate-700 dark:text-zinc-300">
                              {isRtl ? 'محاكاة سعة فريق العمل واللوجستيات' : 'Resource Allocation & Capacity Simulator'}
                            </span>
                            <p className="text-[8.5px] text-slate-400 dark:text-zinc-500 font-semibold mt-0.5">
                              {isRtl 
                                ? 'حدد سعة الموارد المتاحة لمحاكاة فترات الذروة واختناقات التوزيع.' 
                                : 'Adjust maximum staff/operational capacity to simulate overload thresholds.'}
                            </p>
                          </div>
                        </div>

                        {/* Capacity selectors */}
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400">
                            {isRtl ? 'سعة الموارد القصوى:' : 'Capacity Max:'}
                          </span>
                          <div className="flex bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-slate-200/50 dark:border-zinc-805">
                            {[20, 35, 50].map((capValue) => (
                              <button
                                key={capValue}
                                type="button"
                                onClick={() => setHeatmapCapacity(capValue)}
                                className={`px-2.5 py-1 rounded text-[8.5px] font-black transition-all cursor-pointer ${
                                  heatmapCapacity === capValue
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                                }`}
                              >
                                {capValue} {isRtl ? 'وحدة' : 'Units'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Heatmap Grid Component */}
                      <div className="overflow-x-auto">
                        <div className="min-w-[760px] space-y-2">
                          {/* Grid Headers */}
                          <div className="grid grid-cols-12 gap-1 text-center text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
                            <div className="col-span-3 text-left pl-2">{isRtl ? 'المشروع النشط' : 'Active Project'}</div>
                            {months.map(m => (
                              <div key={m.index} className="col-span-1">
                                {isRtl ? m.nameAr : m.nameEn}
                              </div>
                            ))}
                          </div>

                          {/* Grid Rows for each Project */}
                          <div className="space-y-1.5">
                            {resourceHeatmapData.map((proj) => (
                              <div key={proj.projectId} className="grid grid-cols-12 gap-1 items-center bg-white/40 dark:bg-zinc-950/20 p-1.5 rounded-lg border border-slate-100/50 dark:border-zinc-900/40 hover:bg-white/60 dark:hover:bg-zinc-900/20 transition-all">
                                <div className="col-span-3 truncate pl-1 flex items-center gap-1.5" title={isRtl ? proj.nameAr : proj.nameEn}>
                                  <span className="font-mono bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 px-1 py-0.5 rounded text-[8.5px] font-bold">
                                    {proj.code}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 truncate">
                                    {isRtl ? proj.nameAr : proj.nameEn}
                                  </span>
                                </div>

                                {proj.monthlyDemand.map((md) => {
                                  // Color code cell
                                  let cellColorClass = 'bg-slate-50 dark:bg-zinc-950/20 border-slate-100 dark:border-zinc-900/10 text-slate-400 dark:text-zinc-600';
                                  let intensityLabel = isRtl ? 'غير نشط' : 'Inactive';
                                  if (md.demand > 0 && md.demand < 3.0) {
                                    cellColorClass = 'bg-sky-50 dark:bg-sky-950/10 border-sky-100 dark:border-sky-900/10 text-sky-600 dark:text-sky-400';
                                    intensityLabel = isRtl ? 'مستقر منخفض' : 'Low demand';
                                  } else if (md.demand >= 3.0 && md.demand < 6.0) {
                                    cellColorClass = 'bg-emerald-50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/10 text-emerald-600 dark:text-emerald-400';
                                    intensityLabel = isRtl ? 'متوازن' : 'Optimal load';
                                  } else if (md.demand >= 6.0 && md.demand < 9.0) {
                                    cellColorClass = 'bg-amber-50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/10 text-amber-600 dark:text-amber-400';
                                    intensityLabel = isRtl ? 'حمل تشغيلي عالٍ' : 'High demand';
                                  } else if (md.demand >= 9.0) {
                                    cellColorClass = 'bg-rose-50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/10 text-rose-600 dark:text-rose-400 font-extrabold';
                                    intensityLabel = isRtl ? 'ذروة تشغيلية حرجة' : 'Peak critical';
                                  }

                                  return (
                                    <div
                                      key={md.monthIndex}
                                      className={`col-span-1 py-2 text-center rounded-md border text-[9.5px] font-mono transition-all group relative cursor-help ${cellColorClass}`}
                                    >
                                      <span>{md.demand > 0 ? md.demand : '-'}</span>

                                      {/* Tooltip */}
                                      <div className="invisible group-hover:visible absolute z-50 bottom-full mb-2 left-1/2 transform -translate-x-1/2 w-48 p-2 bg-slate-900 text-white rounded-lg shadow-xl text-[9px] font-bold leading-normal text-left">
                                        <div className="font-black text-emerald-400 border-b border-white/10 pb-1 mb-1 flex items-center justify-between">
                                          <span>{proj.code}</span>
                                          <span>{months[md.monthIndex].nameEn} 2026</span>
                                        </div>
                                        <p className="text-white/90">
                                          {isRtl ? 'الطلب المقدر للموارد:' : 'Estimated demand:'} <b className="font-black text-white">{md.demand} {isRtl ? 'وحدة وموقع' : 'Units'}</b>
                                        </p>
                                        <p className="text-white/75 mt-0.5">
                                          {isRtl ? 'مستوى الحمل:' : 'Load level:'} <span className="font-extrabold text-amber-300">{intensityLabel}</span>
                                        </p>
                                        <p className="text-[8px] text-white/50 border-t border-white/5 mt-1 pt-1 italic font-medium">
                                          {isRtl ? 'العوامل: الميزانية، الأولوية، المخاطر والجدولة الزمنية.' : 'Factors: priority, budget size, and timeline activity.'}
                                        </p>
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>

                          {/* Divider line before totals */}
                          <div className="border-t border-slate-200/60 dark:border-zinc-900/60 my-2" />

                          {/* Monthly Totals Row */}
                          <div className="grid grid-cols-12 gap-1 items-center bg-slate-100/50 dark:bg-zinc-900/40 p-2 rounded-lg border border-slate-200/40 dark:border-zinc-800">
                            <div className="col-span-3 pl-2 flex flex-col">
                              <span className="text-[10px] font-black text-slate-800 dark:text-zinc-200">
                                {isRtl ? 'إجمالي طلب المحفظة' : 'Total Portfolio Demand'}
                              </span>
                              <span className="text-[8px] text-slate-400 dark:text-zinc-500 font-bold">
                                {isRtl ? `الحد الأقصى للقدرة: ${heatmapCapacity} وحدة` : `Simulated Limit: ${heatmapCapacity} Units`}
                              </span>
                            </div>

                            {monthlyTotals.map((mt) => {
                              const isOverloaded = mt.totalDemand > heatmapCapacity;
                              const isNearLimit = mt.totalDemand >= heatmapCapacity * 0.8 && mt.totalDemand <= heatmapCapacity;

                              let badgeColorClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
                              let badgeLabel = isRtl ? 'تعز' : 'Safe';
                              if (isOverloaded) {
                                badgeColorClass = 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20 font-black animate-pulse';
                                badgeLabel = isRtl ? 'تجاوز السعة!' : 'Overload!';
                              } else if (isNearLimit) {
                                badgeColorClass = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 font-extrabold';
                                badgeLabel = isRtl ? 'قريب من الأقصى' : 'Peak Warning';
                              }

                              return (
                                <div key={mt.monthIndex} className="col-span-1 flex flex-col items-center gap-1">
                                  <span className="text-[10.5px] font-mono font-black text-slate-800 dark:text-zinc-200">
                                    {mt.totalDemand}
                                  </span>
                                  <span className={`text-[7px] px-1 py-0.2 rounded border ${badgeColorClass} scale-90 whitespace-nowrap`} title={badgeLabel}>
                                    {badgeLabel}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Visual Legend & Highlights */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-2 border-t border-slate-100 dark:border-zinc-900/60 text-[10px] font-bold">
                        {/* Legend */}
                        <div className="md:col-span-7 flex flex-wrap items-center gap-3">
                          <span className="text-slate-500 dark:text-zinc-400 text-[9px] uppercase tracking-wider font-extrabold">
                            {isRtl ? 'مؤشر شدة الحمل:' : 'Load Intensity Scale:'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800" />
                            <span className="text-[8.5px] text-slate-500 dark:text-zinc-400">{isRtl ? '0 (غير نشط)' : '0 (Idle)'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded bg-sky-100 dark:bg-sky-950/20 border border-sky-200/40" />
                            <span className="text-[8.5px] text-sky-600 dark:text-sky-400">{isRtl ? '1-3 (منخفض)' : '1-3 (Low)'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded bg-emerald-100 dark:bg-emerald-950/20 border border-emerald-200/40" />
                            <span className="text-[8.5px] text-emerald-600 dark:text-emerald-400">{isRtl ? '3-6 (معتدل)' : '3-6 (Optimal)'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded bg-amber-100 dark:bg-amber-950/20 border border-amber-200/40" />
                            <span className="text-[8.5px] text-amber-600 dark:text-amber-400">{isRtl ? '6-9 (مرتفع)' : '6-9 (High)'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded bg-rose-100 dark:bg-rose-950/20 border border-rose-200/40" />
                            <span className="text-[8.5px] text-rose-600 dark:text-rose-400">{isRtl ? '9+ (حرج)' : '9+ (Peak Surge)'}</span>
                          </div>
                        </div>

                        {/* Peak Demand Analytics Strategic Synthesis */}
                        <div className="md:col-span-5 bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/10 rounded-lg p-2 text-[9.5px] leading-relaxed text-slate-700 dark:text-zinc-300">
                          {(() => {
                            // Find month with highest demand
                            const sortedTotals = [...monthlyTotals].sort((a, b) => b.totalDemand - a.totalDemand);
                            const peakMonthObj = sortedTotals[0];
                            const peakMonthName = isRtl ? peakMonthObj.nameAr : peakMonthObj.nameEn;
                            const isCurrentlyOverloaded = peakMonthObj.totalDemand > heatmapCapacity;

                            if (isRtl) {
                              return (
                                <p>
                                  ?? <b className="font-extrabold text-emerald-700 dark:text-emerald-400">????? ??????? ???????????:</b> ?? ??? ???? ????? ?????? ?? ??? <b className="font-black text-amber-600">{peakMonthName}</b> ??????? <b className="font-black">{peakMonthObj.totalDemand} ????</b>.
                                  {isCurrentlyOverloaded 
                                    ? ` يُوصى بموازنة جدول المهام للمشروعات المتداخلة لتفادي عجز الموارد بنحو ${(peakMonthObj.totalDemand - heatmapCapacity).toFixed(1)} وحدة.`
                                    : ' الحمل التشغيلي للمحفظة يقع حالياً ضمن الحدود الآمنة للقدرة الاستيعابية المتاحة.'}
                                </p>
                              );
                            } else {
                              return (
                                <p>
                                  ?? <b className="font-extrabold text-emerald-700 dark:text-emerald-400">Resource Outlook:</b> Peak workload is projected in <b className="font-black text-amber-500">{peakMonthName}</b> with <b className="font-black">{peakMonthObj.totalDemand} cumulative units</b>.
                                  {isCurrentlyOverloaded 
                                    ? ` Re-scheduling non-critical milestones is advised to shave the projected ${(peakMonthObj.totalDemand - heatmapCapacity).toFixed(1)} unit overload.`
                                    : ' All project timeline load envelopes remain safely buffered within simulated resource envelopes.'}
                                </p>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  ) : heatmapSectionTab === 'stakeholders' ? (
                    <div className="bg-slate-50/40 dark:bg-zinc-950/40 border border-slate-200/60 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col gap-4 animate-fade-in">
                      {/* Project selector & description */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-900">
                        <div className="flex items-center gap-2">
                          <HeartHandshake className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <div>
                            <span className="text-[10px] font-black text-slate-700 dark:text-zinc-300">
                              {isRtl ? 'خريطة تفاعل وتجاوب شركاء المصلحة' : 'Stakeholder Engagement & Satisfaction Matrix'}
                            </span>
                            <p className="text-[8.5px] text-slate-400 dark:text-zinc-500 font-semibold mt-0.5">
                              {isRtl 
                                ? 'استعراض وتحليل مستويات التجاوب الميداني وقنوات التواصل ومؤشر الرضا.' 
                                : 'A comprehensive matrix displaying interaction frequencies and satisfaction states.'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400">
                            {isRtl ? 'المشروع النشط:' : 'Selected Project:'}
                          </span>
                          <select
                            value={selectedStakeholderProjId}
                            onChange={(e) => {
                              setSelectedStakeholderProjId(e.target.value);
                              setSelectedStkCell(null);
                            }}
                            className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-lg text-[9.5px] font-black text-slate-700 dark:text-zinc-300 px-2.5 py-1 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer"
                          >
                            {activeDashboardProjects.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.code} - {isRtl ? p.name_ar : p.name_en}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Matrix Grid layout */}
                      <div className="overflow-x-auto">
                        <div className="min-w-[760px] space-y-2">
                          {/* Grid Headers */}
                          <div className="grid grid-cols-12 gap-1 text-center text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-mono pb-1 border-b border-slate-100 dark:border-zinc-900/60">
                            <div className="col-span-4 text-left pl-2">{isRtl ? 'الفئة وصاحب المصلحة' : 'Stakeholder & Primary Focus'}</div>
                            <div className="col-span-1.5">{isRtl ? 'حلقات نقاشية' : 'Focus Groups'}</div>
                            <div className="col-span-1.5">{isRtl ? 'اجتماعات تنسيقية' : 'Review Mtgs'}</div>
                            <div className="col-span-1.5">{isRtl ? 'بوابة الملاحظات' : 'Feedback Portals'}</div>
                            <div className="col-span-1.5">{isRtl ? 'تقارير الإنجاز' : 'Progress Reps'}</div>
                            <div className="col-span-1.5">{isRtl ? 'الزيارات التفتيشية' : 'Field Audits'}</div>
                          </div>

                          {/* Rows */}
                          <div className="space-y-1.5">
                            {(stakeholderData[selectedStakeholderProjId] || []).map((stk) => (
                              <div key={stk.id} className="grid grid-cols-12 gap-1 items-center bg-white/40 dark:bg-zinc-950/20 p-1.5 rounded-lg border border-slate-100/50 dark:border-zinc-900/40 hover:bg-white/60 dark:hover:bg-zinc-900/20 transition-all">
                                <div className="col-span-4 pl-1 flex flex-col justify-center">
                                  <span className="text-[10px] font-extrabold text-slate-800 dark:text-zinc-200">
                                    {isRtl ? stk.groupAr : stk.groupEn}
                                  </span>
                                  <span className="text-[8.5px] text-slate-400 dark:text-zinc-500 font-semibold truncate mt-0.5">
                                    {isRtl ? stk.roleAr : stk.roleEn}
                                  </span>
                                </div>

                                {stk.channels.map((chan: any) => {
                                  // Color cell background based on frequency
                                  let bgClass = 'bg-slate-50 dark:bg-zinc-950/20 text-slate-300 dark:text-zinc-700 border-slate-100 dark:border-zinc-900/10';
                                  if (chan.frequency > 0 && chan.frequency <= 2) {
                                    bgClass = 'bg-emerald-500/5 dark:bg-emerald-500/2 text-slate-600 dark:text-zinc-400 border-emerald-500/10';
                                  } else if (chan.frequency > 2 && chan.frequency <= 5) {
                                    bgClass = 'bg-emerald-500/15 dark:bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 border-emerald-500/15';
                                  } else if (chan.frequency > 5 && chan.frequency <= 8) {
                                    bgClass = 'bg-emerald-500/30 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/25 font-bold';
                                  } else if (chan.frequency > 8) {
                                    bgClass = 'bg-emerald-600/40 dark:bg-emerald-600/15 text-emerald-900 dark:text-emerald-200 border-emerald-600/30 font-black';
                                  }

                                  // Satisfaction icon indicator and colors
                                  let satColor = 'bg-slate-400';
                                  let satLabelEn = 'N/A';
                                  let satLabelAr = 'غير محدد';
                                  let satEmoji = '😐';
                                  
                                  if (chan.satisfaction === 'delighted') {
                                    satColor = 'bg-emerald-500';
                                    satLabelEn = 'Delighted';
                                    satLabelAr = 'ممتاز / راضٍ تماماً';
                                    satEmoji = '😐';
                                  } else if (chan.satisfaction === 'satisfied') {
                                    satColor = 'bg-sky-500';
                                    satLabelEn = 'Satisfied';
                                    satLabelAr = 'راضٍ / سعيد';
                                    satEmoji = '😟';
                                  } else if (chan.satisfaction === 'neutral') {
                                    satColor = 'bg-amber-500';
                                    satLabelEn = 'Neutral';
                                    satLabelAr = 'مقبول / محايد';
                                    satEmoji = '😟';
                                  } else if (chan.satisfaction === 'concerned') {
                                    satColor = 'bg-rose-500';
                                    satLabelEn = 'Concerned';
                                    satLabelAr = 'قلق / تراجع الرضا';
                                    satEmoji = '⏱️';
                                  }

                                  const isSelected = selectedStkCell && selectedStkCell.stakeholderId === stk.id && selectedStkCell.channelId === chan.id;

                                  return (
                                    <button
                                      key={chan.id}
                                      type="button"
                                      onClick={() => setSelectedStkCell({
                                        stakeholderId: stk.id,
                                        channelId: chan.id,
                                        stakeholderName: isRtl ? stk.groupAr : stk.groupEn,
                                        channelName: isRtl ? chan.nameAr : chan.nameEn,
                                        frequency: chan.frequency,
                                        satisfaction: chan.satisfaction,
                                        lastDate: chan.lastDate
                                      })}
                                      className={`col-span-1.5 py-2.5 rounded-lg border text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all hover:scale-[1.03] active:scale-[0.98] ${bgClass} ${
                                        isSelected 
                                          ? 'ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-zinc-950 border-emerald-500' 
                                          : ''
                                      }`}
                                    >
                                      <span className="text-[11px] font-mono leading-none">
                                        {chan.frequency === 0 ? '-' : `${chan.frequency}x`}
                                      </span>
                                      
                                      {/* Satisfaction Dot indicator */}
                                      {chan.frequency > 0 && (
                                        <div className="flex items-center gap-1 select-none">
                                          <span className={`w-2 h-2 rounded-full ${satColor}`} />
                                          <span className="text-[8px] font-bold text-slate-500 dark:text-zinc-400">{satEmoji}</span>
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Detail / Edit / Simulator Panel (Self-contained Interactive controls) */}
                      <AnimatePresence mode="wait">
                        {selectedStkCell ? (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/20 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-5"
                          >
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 border-b border-emerald-500/10 pb-2">
                                <Smile className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <div className="text-[10px]">
                                  <span className="font-extrabold text-slate-800 dark:text-zinc-200">
                                    {selectedStkCell.stakeholderName}
                                  </span>
                                  <span className="text-slate-400 dark:text-zinc-500 font-bold mx-1.5">|</span>
                                  <span className="font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                    {selectedStkCell.channelName}
                                  </span>
                                </div>
                              </div>

                              {/* Interactive Simulator sliders/buttons */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                                {/* Frequency Counter */}
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[9px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-extrabold">
                                    {isRtl ? 'عدد جلسات التواصل والتفاعل:' : 'Engagement Frequency Count:'}
                                  </label>
                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      disabled={selectedStkCell.frequency <= 0}
                                      onClick={() => {
                                        const newFreq = Math.max(0, selectedStkCell.frequency - 1);
                                        handleUpdateStkCell(
                                          selectedStkCell.stakeholderId,
                                          selectedStkCell.channelId,
                                          newFreq,
                                          selectedStkCell.satisfaction,
                                          selectedStkCell.lastDate
                                        );
                                      }}
                                      className="p-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="text-xs font-mono font-black text-slate-800 dark:text-zinc-200 min-w-8 text-center">
                                      {selectedStkCell.frequency}x
                                    </span>
                                    <button
                                      type="button"
                                      disabled={selectedStkCell.frequency >= 12}
                                      onClick={() => {
                                        const newFreq = Math.min(12, selectedStkCell.frequency + 1);
                                        handleUpdateStkCell(
                                          selectedStkCell.stakeholderId,
                                          selectedStkCell.channelId,
                                          newFreq,
                                          selectedStkCell.satisfaction,
                                          selectedStkCell.lastDate
                                        );
                                      }}
                                      className="p-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Last Touchpoint Date */}
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[9px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-extrabold">
                                    {isRtl ? 'تاريخ آخر تواصل ميداني:' : 'Last Interaction Date:'}
                                  </label>
                                  <input
                                    type="date"
                                    value={selectedStkCell.lastDate}
                                    onChange={(e) => {
                                      handleUpdateStkCell(
                                        selectedStkCell.stakeholderId,
                                        selectedStkCell.channelId,
                                        selectedStkCell.frequency,
                                        selectedStkCell.satisfaction,
                                        e.target.value
                                      );
                                    }}
                                    className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-[9.5px] font-bold text-slate-700 dark:text-zinc-300 px-2 py-1 outline-none"
                                  />
                                </div>
                              </div>

                              {/* Satisfaction Selector */}
                              <div className="flex flex-col gap-1.5 pt-2">
                                <label className="text-[9px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-extrabold">
                                  {isRtl ? 'مستوى رضا وقبول الشريك / صاحب المصلحة:' : 'Stakeholder Satisfaction Level:'}
                                </label>
                                <div className="flex flex-wrap gap-2">
                                  {[
                                    { key: 'concerned', labelEn: 'Concerned', labelAr: 'قلق / تراجع الرضا', colorClass: 'border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10' },
                                    { key: 'neutral', labelEn: 'Neutral', labelAr: 'مقبول / محايد', colorClass: 'border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10' },
                                    { key: 'satisfied', labelEn: 'Satisfied', labelAr: 'راضٍ / جيد', colorClass: 'border-sky-500/20 bg-sky-500/5 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10' },
                                    { key: 'delighted', labelEn: 'Delighted', labelAr: 'سعيد جداً / ممتاز', colorClass: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10' }
                                  ].map((opt) => {
                                    const isActive = selectedStkCell.satisfaction === opt.key;
                                    return (
                                      <button
                                        key={opt.key}
                                        type="button"
                                        onClick={() => {
                                          handleUpdateStkCell(
                                            selectedStkCell.stakeholderId,
                                            selectedStkCell.channelId,
                                            selectedStkCell.frequency,
                                            opt.key as any,
                                            selectedStkCell.lastDate
                                          );
                                        }}
                                        className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-bold transition-all cursor-pointer ${opt.colorClass} ${
                                          isActive 
                                            ? 'ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-zinc-950 border-transparent font-black shadow-sm' 
                                            : 'opacity-60'
                                        }`}
                                      >
                                        {isRtl ? opt.labelAr : opt.labelEn}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Brief Summary Recommendation Box */}
                            <div className="w-full md:w-64 bg-white/40 dark:bg-zinc-950/40 p-3 rounded-xl border border-emerald-500/10 flex flex-col justify-between gap-2.5 text-[9.5px]">
                              <div>
                                <span className="block text-[8px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-extrabold mb-1">
                                  {isRtl ? 'التوصية التلقائية للمسؤول:' : 'Actionable Recommendation:'}
                                </span>
                                <div className="text-slate-700 dark:text-zinc-300 font-bold leading-normal">
                                  {(() => {
                                    if (selectedStkCell.frequency === 0) {
                                      return isRtl 
                                        ? '⚠️ لم يتم تسجيل أي تواصل ميداني عبر هذه القناة لعام 2026. يوصى بجدولة أول جلسة فوراً لتجنب فجوة المعلومات.'
                                        : '⚠️ Zero engagements logged for 2026. Immediate scheduling of a physical or digital touchpoint is advised to avoid data gaps.';
                                    }
                                    if (selectedStkCell.satisfaction === 'concerned') {
                                      return isRtl
                                        ? '🚨 الشريك يظهر مستويات رضا منخفضة. يرجى تكثيف الاجتماعات التنسيقية المباشرة وحل الاعتراضات الميدانية فوراً.'
                                        : '🚨 Stakeholder shows concern. Immediately step up review meetings to resolve friction points and de-escalate.';
                                    }
                                    if (selectedStkCell.satisfaction === 'neutral') {
                                      return isRtl
                                        ? '🧠 العلاقة مستقرة لكنها سلبية نسبياً. يوصى بمشاركة النشرات الدورية المنتظمة لتعزيز الانخراط.'
                                        : '🧠 Stable but passive relationship. Proactively sharing regular progress bulletins is recommended to boost engagement.';
                                    }
                                    return isRtl
                                      ? '✅ الشريك راضٍ تماماً عن مستوى التعاون الميداني ومسار تنفيذ المشروع. حافظ على معدل التواصل الحالي.'
                                      : '? Relationship is in excellent standing. Maintain current interaction schedules and document best practices.';
                                  })()}
                                </div>
                              </div>

                              <div className="flex justify-between items-center text-[8.5px] border-t border-slate-100 dark:border-zinc-900 pt-2 text-slate-400">
                                <span>{isRtl ? 'آخر تفاعل:' : 'Last touch:'}</span>
                                <span className="font-mono font-black text-slate-600 dark:text-zinc-400">{selectedStkCell.lastDate}</span>
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="bg-slate-100/50 dark:bg-zinc-900/30 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl py-4 px-2 text-center text-[9.5px] text-slate-400 dark:text-zinc-500 font-bold select-none">
                            ?? {isRtl ? 'انقر فوق أي خلية في مصفوفة التواصل لاستعراض مؤشرات الرضا التفصيلية والتوصيات ومحاكاة تكرار التفاعل.' : 'Click any cell inside the matrix above to view actionable insights, recommendations, and modify values directly.'}
                          </div>
                        )}
                      </AnimatePresence>

                      {/* Legend scale and color key */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-zinc-900/60 text-[9.5px] font-bold">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-slate-500 dark:text-zinc-400 text-[8px] uppercase tracking-wider font-extrabold">
                            {isRtl ? 'دليل تكرار التواصل (مرات/سنة):' : 'Engagement Scale (times/year):'}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded bg-slate-50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-900/10" />
                            <span className="text-[8px] text-slate-500 dark:text-zinc-400">{isRtl ? '0 (غير متصل)' : '0 (Idle)'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded bg-emerald-500/10 border border-emerald-500/10" />
                            <span className="text-[8px] text-emerald-600">{isRtl ? '1-2 (منخفض)' : '1-2 (Low)'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/15" />
                            <span className="text-[8px] text-emerald-600">{isRtl ? '3-5 (معتدل)' : '3-5 (Medium)'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded bg-emerald-500/35 border border-emerald-500/25" />
                            <span className="text-[8px] text-emerald-700">{isRtl ? '6-8 (مرتفع)' : '6-8 (High)'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded bg-emerald-600/45 border border-emerald-600/35" />
                            <span className="text-[8px] text-emerald-800">{isRtl ? '9+ (مكثف)' : '9+ (Intense)'}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-slate-500 dark:text-zinc-400 text-[8px] uppercase tracking-wider font-extrabold">
                            {isRtl ? 'مؤشر الرضا والقبول:' : 'Satisfaction Levels:'}
                          </span>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 text-[8px] font-extrabold">
                            ?? {isRtl ? 'قلق' : 'Concerned'}
                          </span>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[8px] font-extrabold">
                            ?? {isRtl ? 'محايد' : 'Neutral'}
                          </span>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 text-[8px] font-extrabold">
                            ?? {isRtl ? 'راضٍ' : 'Satisfied'}
                          </span>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[8px] font-extrabold">
                            ?? {isRtl ? 'سعيد جداً' : 'Delighted'}
                          </span>
                        </div>
                      </div>

                      {/* Stakeholder Pulse Analyzer section */}
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-900/60">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                            <div>
                              <span className="text-[10px] font-black text-slate-700 dark:text-zinc-300">
                                {isRtl ? 'تحليل نبض ومشاعر الشركاء بالذكاء الاصطناعي (Stakeholder Pulse)' : 'AI-Powered Stakeholder Pulse Sentiment Analyzer'}
                              </span>
                              <p className="text-[8.5px] text-slate-400 dark:text-zinc-500 font-semibold mt-0.5">
                                {isRtl 
                                  ? 'تحليل دلالي متقدم للمراسلات ومحاضر الاجتماعات للتنبؤ بمستوى الرضا والامتثال لمتطلبات المساءلة.' 
                                  : 'Advanced semantic analysis of communication logs to predict satisfaction and accountability alignment.'}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRunPulseAnalysis(selectedStakeholderProjId)}
                            disabled={pulseAnalysisLoading[selectedStakeholderProjId]}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white rounded-lg text-[9px] font-black shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                          >
                            <RefreshCw className={`w-3 h-3 ${pulseAnalysisLoading[selectedStakeholderProjId] ? 'animate-spin' : ''}`} />
                            {pulseAnalysisLoading[selectedStakeholderProjId]
                              ? (isRtl ? 'جاري تحليل النصوص...' : 'Analyzing semantic logs...')
                              : (isRtl ? 'تحليل النبض بالذكاء الاصطناعي' : 'Run Gemini Sentiment NLP')}
                          </button>
                        </div>

                        {pulseAnalysisError[selectedStakeholderProjId] && (
                          <div className="p-2.5 mb-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[9px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{pulseAnalysisError[selectedStakeholderProjId]}</span>
                          </div>
                        )}

                        {/* Analysis dashboard layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
                          {/* Score and stats card */}
                          <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 flex flex-col justify-between shadow-sm">
                            <div>
                              <span className="text-[8.5px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-extrabold block mb-2">
                                {isRtl ? 'مؤشر رضا الشركاء الكلي (نبض الشركاء):' : 'Overall Stakeholder Pulse Index:'}
                              </span>

                              {(() => {
                                const result = pulseAnalysisResult[selectedStakeholderProjId];
                                if (!result) return null;

                                const score = result.pulseScore;
                                let scoreColor = 'text-rose-500';
                                let progressColor = 'bg-rose-500';
                                let stateLabelAr = 'قلق شديد';
                                let stateLabelEn = 'Highly Concerned';
                                let descriptionAr = 'توجد اعتراضات حاسمة أو انحرافات مالية وتشغيلية تتطلب تدخلاً فورياً من الإدارة.';
                                let descriptionEn = 'Critical de-escalation required. High-impact friction points or severe financial / timeline variances identified.';

                                if (score >= 71) {
                                  scoreColor = 'text-emerald-500 dark:text-emerald-400';
                                  progressColor = 'bg-emerald-500';
                                  stateLabelAr = 'ممتاز / راضٍ تماماً';
                                  stateLabelEn = 'Delighted';
                                  descriptionAr = 'تنسيق ميداني نموذجي، إشادات واسعة من المانحين والجهات الرسمية، ودعم مجتمعي مطلق.';
                                  descriptionEn = 'Excellent ecosystem synergy. Donors and local regulators express absolute satisfaction and praise compliance.';
                                } else if (score >= 36) {
                                  scoreColor = 'text-amber-500';
                                  progressColor = 'bg-amber-500';
                                  stateLabelAr = 'مقبول / محايد';
                                  stateLabelEn = 'Neutral to Satisfied';
                                  descriptionAr = 'العلاقات مستقرة وهادئة ولكن تتطلب قنوات تواصل أكثر فاعلية لتفادي الفجوات المعرفية.';
                                  descriptionEn = 'Stable and collaborative relationship. Proactive regular communication is recommended to address minor challenges.';
                                }

                                return (
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-4">
                                      {/* Radial Score circle */}
                                      <div className="relative w-16 h-16 shrink-0 flex items-center justify-center rounded-full border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/40 shadow-inner">
                                        <div className="text-center">
                                          <span className={`text-xl font-black font-mono tracking-tight ${scoreColor}`}>
                                            {score}
                                          </span>
                                          <span className="text-[7.5px] text-slate-400 block -mt-1 font-mono">/100</span>
                                        </div>
                                      </div>

                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <span className={`w-2 h-2 rounded-full ${progressColor}`} />
                                          <span className="text-[11px] font-black text-slate-800 dark:text-zinc-200">
                                            {isRtl ? stateLabelAr : stateLabelEn}
                                          </span>
                                        </div>
                                        <span className="text-[8px] font-semibold text-slate-400 dark:text-zinc-500 font-mono mt-0.5 block uppercase">
                                          {result.sentimentState}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Progress indicator bar */}
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-[8px] font-mono font-bold text-slate-400">
                                        <span>0%</span>
                                        <span>50%</span>
                                        <span>100%</span>
                                      </div>
                                      <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                        <div 
                                          className={`h-full rounded-full transition-all duration-1000 ${progressColor}`}
                                          style={{ width: `${score}%` }}
                                        />
                                      </div>
                                    </div>

                                    <p className="text-[9px] text-slate-500 dark:text-zinc-400 font-semibold leading-relaxed pt-1.5 border-t border-slate-100 dark:border-zinc-900/60">
                                      {isRtl ? descriptionAr : descriptionEn}
                                    </p>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Self-Correction note */}
                            <div className="text-[8.5px] leading-normal text-amber-600 dark:text-amber-400/90 font-bold bg-amber-500/5 border border-amber-500/10 p-2 rounded-lg mt-3">
                              ??? <b className="font-extrabold">{isRtl ? 'منظور الشفافية والمساءلة:' : 'Transparency & CHS Accountability:'}</b> {isRtl ? 'النبض يتم تحديثه ديناميكياً بناءً على آخر الملاحظات الواردة للامتثال لمتطلبات الرقابة الميدانية.' : 'The pulse updates dynamically based on active feedback logs to satisfy rigorous CHS standard monitoring.'}
                            </div>
                          </div>

                          {/* Executive Summary Card */}
                          <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 shadow-sm flex flex-col justify-between">
                            <div>
                              <span className="text-[8.5px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-extrabold block mb-2">
                                {isRtl ? 'ملخص تحليل التجاوب والتوصيات الاستراتيجية (مستند بالذكاء الاصطناعي):' : 'AI Strategic Response Summary & Sphere/CHS Mapping:'}
                              </span>

                              {(() => {
                                const result = pulseAnalysisResult[selectedStakeholderProjId];
                                if (!result) return null;

                                return (
                                  <div className="space-y-3">
                                    <div className="p-2.5 bg-slate-50 dark:bg-zinc-950/50 border border-slate-100 dark:border-zinc-900 rounded-lg text-[9.5px] leading-relaxed text-slate-700 dark:text-zinc-300 font-semibold">
                                      <b className="font-extrabold text-emerald-600 dark:text-emerald-400 block mb-1">
                                        {isRtl ? 'التحليل التوليدي الكلي للمشاعر:' : 'Generative Synthesis Overview:'}
                                      </b>
                                      {isRtl ? result.summaryAr : result.summaryEn}
                                    </div>

                                    {/* Action items/issues table */}
                                    <div className="space-y-1.5">
                                      <span className="block text-[8px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-extrabold">
                                        {isRtl ? 'النقاط الحرجة وإجراءات الحد من المخاطر ( Sphere Standards ):' : 'Critical Action Items & Mitigation Steps (Sphere Standards):'}
                                      </span>
                                      
                                      <div className="space-y-1">
                                        {result.keyIssues.map((issue, idx) => {
                                          let badgeColor = 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20';
                                          if (issue.impact === 'medium') {
                                            badgeColor = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20';
                                          } else if (issue.impact === 'low') {
                                            badgeColor = 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20';
                                          }

                                          return (
                                            <div 
                                              key={idx}
                                              className="flex items-start justify-between gap-3 p-2 bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-100/50 dark:border-zinc-900/30 rounded-lg text-[9px] font-bold"
                                            >
                                              <span className="text-slate-700 dark:text-zinc-300">
                                                {isRtl ? issue.issueAr : issue.issueEn}
                                              </span>
                                              <span className={`text-[7.5px] px-1.5 py-0.2 rounded border ${badgeColor} shrink-0 uppercase tracking-wider font-extrabold`}>
                                                {issue.impact}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                            <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 dark:text-zinc-500 pt-2 border-t border-slate-100 dark:border-zinc-900/60 mt-2">
                              <span>{isRtl ? 'المحلل المعرفي: Gemini NLP v3.6' : 'Cognitive Engine: Gemini NLP v3.6'}</span>
                              <span>{isRtl ? 'الرابطة التشغيلية الموحدة NexoraOS™' : 'Integrated Operations Engine'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Recent Communication Ledger and Add Log Form */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                          {/* Ledger */}
                          <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 shadow-sm">
                            <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-zinc-900/60 pb-2">
                              <span className="text-[8.5px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-extrabold">
                                {isRtl ? 'سجل المراسلات وجلسات التنسيق الأخيرة للمشروع:' : 'Recent Project Communications & Coordination Ledger:'}
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowAddLogForm(!showAddLogForm)}
                                className="inline-flex items-center gap-1 text-[8.5px] font-black text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                {showAddLogForm 
                                  ? (isRtl ? 'إلغاء الإضافة' : 'Cancel Entry')
                                  : (isRtl ? 'إضافة سجل جديد' : 'Record New Entry')}
                              </button>
                            </div>

                            {/* Add Log Form */}
                            <AnimatePresence>
                              {showAddLogForm && (
                                <motion.form
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  onSubmit={handleAddStakeholderLog}
                                  className="mb-4 p-3 bg-slate-50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-3 overflow-hidden"
                                >
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="flex flex-col gap-1">
                                      <label className="text-[8.5px] text-slate-400 dark:text-zinc-500 font-bold uppercase">
                                        {isRtl ? 'نوع التواصل:' : 'Communication Type:'}
                                      </label>
                                      <select
                                        value={newLogType}
                                        onChange={(e) => setNewLogType(e.target.value as any)}
                                        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-[9.5px] font-bold text-slate-700 dark:text-zinc-300 px-2 py-1 outline-none cursor-pointer"
                                      >
                                        <option value="meeting">{isRtl ? 'اجتماع تنسيقي' : 'Review Meeting'}</option>
                                        <option value="email">{isRtl ? 'بريد إلكتروني' : 'Official Email'}</option>
                                      </select>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                      <label className="text-[8.5px] text-slate-400 dark:text-zinc-500 font-bold uppercase">
                                        {isRtl ? 'الجهة المرسلة / الشريك (إنكليزي):' : 'Stakeholder Source (EN):'}
                                      </label>
                                      <input
                                        type="text"
                                        required
                                        placeholder="e.g. UNICEF Water Engineer"
                                        value={newLogSourceEn}
                                        onChange={(e) => setNewLogSourceEn(e.target.value)}
                                        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-[9.5px] font-bold text-slate-700 dark:text-zinc-300 px-2 py-1 outline-none"
                                      />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                      <label className="text-[8.5px] text-slate-400 dark:text-zinc-500 font-bold uppercase">
                                        {isRtl ? 'الجهة المرسلة / الشريك (عربي):' : 'Stakeholder Source (AR):'}
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="مثال: مهندس مياه اليونيسف"
                                        value={newLogSourceAr}
                                        onChange={(e) => setNewLogSourceAr(e.target.value)}
                                        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-[9.5px] font-bold text-slate-700 dark:text-zinc-300 px-2 py-1 outline-none"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1">
                                      <label className="text-[8.5px] text-slate-400 dark:text-zinc-500 font-bold uppercase">
                                        {isRtl ? 'تفاصيل الملاحظات / المراسلات (إنكليزي):' : 'Communication Content (EN):'}
                                      </label>
                                      <textarea
                                        required
                                        rows={2}
                                        placeholder="Enter the communication details in English..."
                                        value={newLogContentEn}
                                        onChange={(e) => setNewLogContentEn(e.target.value)}
                                        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-[9.5px] font-bold text-slate-700 dark:text-zinc-300 px-2 py-1 outline-none resize-none"
                                      />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                      <label className="text-[8.5px] text-slate-400 dark:text-zinc-500 font-bold uppercase">
                                        {isRtl ? 'تفاصيل الملاحظات / المراسلات (عربي):' : 'Communication Content (AR):'}
                                      </label>
                                      <textarea
                                        rows={2}
                                        placeholder="أدخل تفاصيل التواصل باللغة العربية..."
                                        value={newLogContentAr}
                                        onChange={(e) => setNewLogContentAr(e.target.value)}
                                        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-[9.5px] font-bold text-slate-700 dark:text-zinc-300 px-2 py-1 outline-none resize-none"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex justify-end pt-1">
                                    <button
                                      type="submit"
                                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black shadow-sm cursor-pointer"
                                    >
                                      {isRtl ? 'حفظ وإدراج السجل الميداني' : 'Save & Append Log Entry'}
                                    </button>
                                  </div>
                                </motion.form>
                              )}
                            </AnimatePresence>

                            {/* Ledger list */}
                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                              {(stakeholderLogs[selectedStakeholderProjId] || []).length === 0 ? (
                                <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold py-4 text-center">
                                  {isRtl ? 'لا توجد سجلات تواصل للمشروع المحدد.' : 'No communication logs recorded for this project.'}
                                </p>
                              ) : (
                                (stakeholderLogs[selectedStakeholderProjId] || []).map((log) => (
                                  <div 
                                    key={log.id}
                                    className="p-2.5 bg-slate-50/50 dark:bg-zinc-950/30 border border-slate-100 dark:border-zinc-900 rounded-xl flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-zinc-900/35 transition-all text-[9.5px]"
                                  >
                                    <div className={`p-1.5 rounded-lg border shrink-0 ${
                                      log.type === 'email' 
                                        ? 'bg-sky-500/10 text-sky-600 border-sky-500/15' 
                                        : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/15'
                                    }`}>
                                      <span className="font-extrabold text-[8px] uppercase">{log.type}</span>
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-1">
                                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-900/40 pb-1">
                                        <span className="font-extrabold text-slate-800 dark:text-zinc-200">
                                          {isRtl ? log.sourceAr : log.sourceEn}
                                        </span>
                                        <span className="font-mono text-[8px] text-slate-400 dark:text-zinc-500 font-semibold flex items-center gap-1">
                                          <Calendar className="w-2.5 h-2.5" />
                                          {log.date}
                                        </span>
                                      </div>

                                      <p className="text-slate-600 dark:text-zinc-300 font-bold leading-relaxed whitespace-pre-line">
                                        {isRtl ? log.contentAr : log.contentEn}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Action Recommendation & Sphere standard brief mapping */}
                          <div className="lg:col-span-4 bg-slate-50/40 dark:bg-zinc-950/40 border border-slate-200/60 dark:border-zinc-800 rounded-xl p-3 flex flex-col justify-between shadow-sm">
                            <div className="space-y-3">
                              <span className="text-[8.5px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-extrabold block border-b border-slate-100 dark:border-zinc-900 pb-1.5">
                                {isRtl ? 'تطبيق المساءلة الإنسانية معايير CHS:' : 'CHS Quality & Humanitarian Standards:'}
                              </span>

                              <div className="space-y-2 text-[9.5px] leading-relaxed text-slate-600 dark:text-zinc-400 font-bold">
                                <p>
                                  ?? <b className="text-slate-800 dark:text-zinc-200">{isRtl ? 'المعيار الأساسي 4:' : 'CHS Standard 4:'}</b> {isRtl ? 'المجتمعات المحلية والشركاء يشاركون بنشاط في توجيه وتصميم وتحسين آليات تسليم الخدمات الميدانية.' : 'Humanitarian response is based on communication, participation, and feedback.'}
                                </p>
                                <p>
                                  ?? <b className="text-slate-800 dark:text-zinc-200">{isRtl ? 'المعيار الأساسي 5:' : 'CHS Standard 5:'}</b> {isRtl ? 'يتم الترحيب بالملاحظات والشكاوى والتعامل معها بشفافية وسرية وبطريقة مناسبة تضمن الحماية.' : 'Communities have access to safe, confidential, and effective complaints mechanisms.'}
                                </p>
                              </div>

                              <div className="p-2 bg-emerald-500/5 dark:bg-emerald-950/15 border border-emerald-500/10 rounded-lg text-[9px] font-bold text-emerald-700 dark:text-emerald-400 leading-normal">
                                ?? <b className="font-extrabold">{isRtl ? 'ملاحظة للمستخدم:' : 'User Instruction:'}</b> {isRtl ? 'بإمكانك كتابة وتعديل المراسلات الميدانية، ثم النقر على زر "تحليل النبض" لتقوم Gemini بمعالجة المشاعر اللغوية والالتزام الإنساني بشكل فوري.' : 'You can draft new emails/meeting summaries on the left, then click "Run Gemini Sentiment NLP" to dynamically recalculate the sentiment score.'}
                              </div>
                            </div>

                            <div className="bg-slate-200 dark:bg-zinc-900/60 p-2 rounded-lg text-center text-[8px] font-bold text-slate-500 dark:text-zinc-400">
                              {isRtl ? 'الرابطة التشغيلية الموحدة • رُحماء بينهم' : 'Integrated Platform ? Rohama Charity'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : upcomingDeadlines.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50/30">
                      <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold">
                        {isRtl ? 'لا توجد محطات قادمة حالياً.' : 'No upcoming milestones scheduled currently.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      {/* Gantt / Critical Path Chart Area */}
                      <div className="lg:col-span-7 bg-slate-50/40 dark:bg-zinc-950/40 border border-slate-200/60 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                        <div>
                          {/* Segmented Control Header */}
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-900 pb-2 mb-3">
                            <div className="flex bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-slate-200/50 dark:border-zinc-805 select-none text-[9px] font-black">
                              <button
                                type="button"
                                onClick={() => setMilestoneViewMode('critical_path')}
                                className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                                  milestoneViewMode === 'critical_path'
                                    ? 'bg-white dark:bg-zinc-950 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                                }`}
                              >
                                {isRtl ? 'المسار الحرج للمشروع (SVG)' : 'Critical Path Network'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setMilestoneViewMode('gantt')}
                                className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                                  milestoneViewMode === 'gantt'
                                    ? 'bg-white dark:bg-zinc-950 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                                }`}
                              >
                                {isRtl ? 'عرض الجدول الزمني Gantt' : 'Gantt Timeline'}
                              </button>
                            </div>

                            <div className="flex gap-1.5 items-center">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[8.5px] text-slate-400 dark:text-zinc-500 font-bold">
                                {isRtl ? 'تفاعلي نشط' : 'Active Interactive'}
                              </span>
                            </div>
                          </div>

                          {milestoneViewMode === 'critical_path' ? (
                            /* --- SVG-BASED CRITICAL PATH TIMELINE --- */
                            <div className="space-y-4 animate-fade-in select-none">
                              {/* Inline styles for marching/pulsing dashed lines */}
                              <style dangerouslySetInnerHTML={{ __html: `
                                @keyframes marchDashPath {
                                  to {
                                    stroke-dashoffset: -20;
                                  }
                                }
                                .stroke-active-dependency-link {
                                  stroke-dasharray: 8, 4;
                                  animation: marchDashPath 1.2s linear infinite;
                                }
                              `}} />

                              {/* Project Selection Dropdown */}
                              <div className="flex items-center justify-between gap-2 bg-slate-100/50 dark:bg-zinc-900/30 p-2 rounded-lg border border-slate-200/40 dark:border-zinc-800">
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-black text-slate-700 dark:text-zinc-300">
                                    {isRtl ? 'شبكة اعتماديات المسار الحرج للمشروع' : 'Project Critical Path Dependencies'}
                                  </span>
                                  <span className="text-[8.5px] text-slate-400 dark:text-zinc-500 font-bold mt-0.5">
                                    {isRtl ? 'المحطات المتتالية والروابط الميدانية المعتمدة' : 'Sequential milestones with automated critical line highlights'}
                                  </span>
                                </div>
                                
                                <select
                                  value={selectedCriticalPathProjId}
                                  onChange={(e) => {
                                    setSelectedCriticalPathProjId(e.target.value);
                                    // Focus on first milestone of selected project
                                    const associatedM = milestones.find(m => m.projectId === e.target.value);
                                    if (associatedM) {
                                      setSelectedMilestoneId(associatedM.id);
                                    }
                                  }}
                                  className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-lg text-[9px] font-black text-emerald-600 dark:text-emerald-400 px-2 py-1 outline-none cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                                >
                                  {activeDashboardProjects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.code}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Interactive Path Canvas */}
                              <div className="relative h-24 w-full bg-slate-50/20 dark:bg-zinc-950/10 border border-slate-100 dark:border-zinc-900/50 rounded-xl p-4 overflow-visible flex items-center">
                                {/* SVG Backdrop Connections */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                                  <defs>
                                    <filter id="glow-active-dep" x="-20%" y="-20%" width="140%" height="140%">
                                      <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f59e0b" floodOpacity="0.45" />
                                    </filter>
                                    <filter id="glow-completed-dep" x="-20%" y="-20%" width="140%" height="140%">
                                      <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#10b981" floodOpacity="0.3" />
                                    </filter>
                                  </defs>

                                  {selectedProjMilestones.length === 4 && [0, 1, 2].map((idx) => {
                                    const sourceM = selectedProjMilestones[idx];
                                    const targetM = selectedProjMilestones[idx + 1];
                                    
                                    // Compute centers responsively: m0: 12.5%, m1: 37.5%, m2: 62.5%, m3: 87.5%
                                    const x1 = `${12.5 + idx * 25}%`;
                                    const x2 = `${12.5 + (idx + 1) * 25}%`;
                                    const y = "50%";
                                    
                                    // Highlight link leading up to next upcoming milestone
                                    const isActiveDependency = upcomingMilestoneIndex === idx + 1;
                                    const isCompletedLink = upcomingMilestoneIndex === -1 || upcomingMilestoneIndex > idx + 1;
                                    
                                    let strokeColor = "#cbd5e1"; // Slate-300 default for pending
                                    if (isActiveDependency) {
                                      strokeColor = "#f59e0b"; // Amber for active dependency
                                    } else if (isCompletedLink) {
                                      strokeColor = "#10b981"; // Emerald for completed
                                    } else if (sourceM.status === 'delayed' || targetM.status === 'delayed') {
                                      strokeColor = "#ef4444"; // Red for delayed blockages
                                    }

                                    return (
                                      <g key={idx}>
                                        {/* Thicker backup flow glow ring */}
                                        <line
                                          x1={x1}
                                          y1={y}
                                          x2={x2}
                                          y2={y}
                                          stroke={isActiveDependency ? "#f59e0b" : isCompletedLink ? "#10b981" : "transparent"}
                                          strokeWidth={isActiveDependency ? 7 : isCompletedLink ? 4 : 0}
                                          strokeOpacity={0.15}
                                          filter={isActiveDependency ? "url(#glow-active-dep)" : "url(#glow-completed-dep)"}
                                        />
                                        {/* Main path vector connector */}
                                        <line
                                          x1={x1}
                                          y1={y}
                                          x2={x2}
                                          y2={y}
                                          stroke={strokeColor}
                                          strokeWidth={isActiveDependency ? 3 : 2}
                                          className={isActiveDependency ? "stroke-active-dependency-link" : ""}
                                          strokeDasharray={isActiveDependency ? "8,4" : isCompletedLink ? "none" : "5,5"}
                                        />

                                        {/* Connector Overlay Label */}
                                        {isActiveDependency && (
                                          <foreignObject
                                            x={`calc(${12.5 + idx * 25 + 12.5}% - 35px)`}
                                            y="calc(50% - 9px)"
                                            width="70px"
                                            height="18px"
                                            className="overflow-visible"
                                          >
                                            <div 
                                              className="flex items-center justify-center bg-amber-500 text-white border border-amber-400 shadow-[0_2px_4px_rgba(245,158,11,0.25)] px-1 py-0.5 rounded-full text-[6.5px] font-black uppercase tracking-tight whitespace-nowrap select-none scale-90"
                                              title={isRtl ? 'اعتمادية حاسمة نشطة' : 'Active Critical Dependency'}
                                            >
                                              {isRtl ? 'اعتمادية نشطة' : 'Active Link'}
                                            </div>
                                          </foreignObject>
                                        )}
                                      </g>
                                    );
                                  })}
                                </svg>

                                {/* HTML Nodes overlay */}
                                <div className="absolute inset-0 flex justify-between items-center pointer-events-none">
                                  {selectedProjMilestones.map((m, idx) => {
                                    const isSelected = selectedMilestoneId === m.id;
                                    const isCompleted = m.status === 'completed';
                                    const isInProgress = m.status === 'in_progress';
                                    const isDelayed = m.status === 'delayed';
                                    
                                    // Node visual configuration
                                    let nodeBg = 'bg-slate-50 dark:bg-zinc-800 text-slate-500 border-slate-200 dark:border-zinc-700';
                                    let icon = "⏱️";
                                    
                                    if (isCompleted) {
                                      nodeBg = 'bg-emerald-600 text-white border-emerald-500 shadow-[0_3px_8px_rgba(16,185,129,0.3)]';
                                      icon = "?";
                                    } else if (isDelayed) {
                                      nodeBg = 'bg-rose-600 text-white border-rose-500 shadow-[0_3px_8px_rgba(244,63,94,0.3)] animate-pulse';
                                      icon = "📊";
                                    } else if (isInProgress) {
                                      nodeBg = 'bg-amber-500 text-white border-amber-500 shadow-[0_3px_8px_rgba(245,158,11,0.3)]';
                                      icon = "?";
                                    }

                                    const xPos = `${12.5 + idx * 25}%`;

                                    return (
                                      <div
                                        key={m.id}
                                        className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center group cursor-pointer"
                                        style={{ left: xPos }}
                                        onClick={() => setSelectedMilestoneId(m.id)}
                                      >
                                        {/* Rich Tooltip */}
                                        <div className="absolute bottom-full mb-3.5 hidden group-hover:flex flex-col items-center pointer-events-none z-50 w-44">
                                          <div className="bg-slate-900/95 dark:bg-zinc-950/95 text-white p-2 rounded-lg text-[8px] font-bold text-center leading-normal shadow-xl border border-white/10">
                                            <span className="block font-black text-amber-400 mb-0.5">
                                              {isRtl ? `المحطة الميدانية ${idx + 1}` : `Field Milestone ${idx + 1}`}
                                            </span>
                                            <span className="line-clamp-2">
                                              {isRtl ? m.titleAr : m.titleEn}
                                            </span>
                                            <span className="block text-[7.5px] text-slate-400 mt-1 font-mono">{m.date}</span>
                                          </div>
                                          <div className="border-4 border-transparent border-t-slate-900 dark:border-t-zinc-950 -mt-1" />
                                        </div>

                                        {/* Top Label */}
                                        <span className="absolute bottom-6 text-[8.5px] font-black text-slate-600 dark:text-zinc-400 whitespace-nowrap max-w-[84px] truncate text-center" title={isRtl ? m.titleAr : m.titleEn}>
                                          {isRtl ? m.titleAr : m.titleEn}
                                        </span>

                                        {/* Node circle */}
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all duration-300 ${nodeBg} ${
                                          isSelected ? 'ring-4 ring-emerald-500 scale-110 z-20 border-white dark:border-zinc-950' : 'hover:scale-105 hover:border-slate-400 dark:hover:border-zinc-600'
                                        }`}>
                                          {icon}
                                        </div>

                                        {/* Bottom Date */}
                                        <span className="absolute top-6 text-[7.5px] font-mono text-slate-400 dark:text-zinc-500 font-bold whitespace-nowrap">
                                          {m.date.substring(5)} {/* show MM-DD to fit beautifully */}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* --- TRADITIONAL GANTT CHART VIEW --- */
                            <div className="space-y-3 animate-fade-in">
                              {/* Grid Headers */}
                              <div className="flex items-center text-[8.5px] font-bold text-slate-400 dark:text-zinc-500 mb-2 font-mono">
                                <div className="w-24 sm:w-28 shrink-0">
                                  {isRtl ? 'المحطة / المشروع' : 'Milestone / Project'}
                                </div>
                                <div className="flex-1 relative flex justify-between px-1">
                                  {ganttScale?.markers.map((marker, idx) => (
                                    <span key={idx} className="truncate select-none">
                                      {marker.label}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Gantt Rows */}
                              <div className="flex flex-col gap-3 relative">
                                {/* Today vertical line */}
                                {(() => {
                                  if (!ganttScale) return null;
                                  const todayMs = new Date().getTime();
                                  if (todayMs >= ganttScale.startRange && todayMs <= ganttScale.endRange) {
                                    const leftPercent = ((todayMs - ganttScale.startRange) / ganttScale.span) * 100;
                                    return (
                                      <div 
                                        className="absolute top-0 bottom-0 border-l border-dashed border-rose-400/60 dark:border-rose-500/40 pointer-events-none z-10"
                                        style={{ left: `${leftPercent}%` }}
                                      >
                                        <span className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-rose-500 text-white text-[7px] font-black px-1 py-0.5 rounded shadow-sm scale-90 whitespace-nowrap">
                                          {isRtl ? 'سجلات اليوم' : 'Today'}
                                        </span>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}

                                {upcomingDeadlines.map((milestone) => {
                                  const coords = getGanttBarCoords(milestone.date, milestone.projectId);
                                  const isSelected = selectedMilestoneId === milestone.id;
                                  
                                  let barBg = 'bg-blue-500/90 hover:bg-blue-600';
                                  let borderAccent = 'border-blue-400/30';
                                  if (milestone.status === 'completed') {
                                    barBg = 'bg-emerald-500/95 hover:bg-emerald-600';
                                    borderAccent = 'border-emerald-400/30';
                                  } else if (milestone.status === 'delayed') {
                                    barBg = 'bg-rose-500/95 hover:bg-rose-600';
                                    borderAccent = 'border-rose-400/30';
                                  } else if (milestone.status === 'in_progress') {
                                    barBg = 'bg-amber-500/95 hover:bg-amber-600';
                                    borderAccent = 'border-amber-400/30';
                                  }

                                  return (
                                    <div 
                                      key={milestone.id}
                                      onClick={() => setSelectedMilestoneId(milestone.id)}
                                      className={`flex items-center gap-2 cursor-pointer transition-all duration-200 p-1.5 rounded-lg border ${
                                        isSelected 
                                          ? 'bg-slate-100/80 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800' 
                                          : 'bg-transparent border-transparent hover:bg-slate-50/50 dark:hover:bg-zinc-900/20'
                                      }`}
                                    >
                                      {/* Left Label */}
                                      <div className="w-24 sm:w-28 shrink-0 flex flex-col min-w-0 pr-1 text-right">
                                        <span className="text-[10px] font-black text-slate-700 dark:text-zinc-300 truncate">
                                          {isRtl ? milestone.titleAr : milestone.titleEn}
                                        </span>
                                        <span className="text-[8px] font-mono text-slate-400 dark:text-zinc-500 font-bold uppercase truncate mt-0.5">
                                          {milestone.projectCode || 'NEXORA'}
                                        </span>
                                      </div>

                                      {/* Timeline visual row track */}
                                      <div className="flex-1 h-7 bg-slate-100/40 dark:bg-zinc-900/40 rounded-md relative flex items-center overflow-hidden border border-slate-100 dark:border-zinc-900 px-0.5">
                                        {/* The Gantt Bar */}
                                        <div 
                                          className={`absolute h-4 rounded-md shadow-sm border flex items-center justify-center text-[8.5px] font-black text-white select-none transition-all duration-300 ${barBg} ${borderAccent}`}
                                          style={{ left: `${coords.left}%`, width: `${coords.width}%` }}
                                          title={`${isRtl ? milestone.titleAr : milestone.titleEn} (${milestone.date})`}
                                        >
                                          <span className="truncate px-1 opacity-90 scale-90">
                                            {milestone.status === 'completed' ? '100%' : milestone.status === 'in_progress' ? '50%' : milestone.status === 'delayed' ? '📂' : '0%'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Interactive Hint */}
                        <p className="text-[8.5px] text-slate-400 dark:text-zinc-500 font-bold mt-2 pt-1 border-t border-slate-100 dark:border-zinc-900">
                          ?? {isRtl 
                            ? 'انقر على أي محطة أو ارتباط في شبكة المسار الحرج للتحكم في حالته التشغيلية على الفور.' 
                            : 'Click on any milestone node or link in the critical path to view details and update its status.'}
                        </p>
                      </div>

                      {/* Selected Milestone Detail & Interactive Status Changer */}
                      {(() => {
                        const selectedMilestone = upcomingDeadlines.find(m => m.id === selectedMilestoneId) || upcomingDeadlines[0];
                        if (!selectedMilestone) return null;

                        const isCompleted = selectedMilestone.status === 'completed';
                        const isInProgress = selectedMilestone.status === 'in_progress';
                        const isDelayed = selectedMilestone.status === 'delayed';

                        const statusColor = isCompleted
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : isDelayed
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            : isInProgress
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';

                        const statusLabel = isCompleted
                          ? (isRtl ? 'مكتمل' : 'Completed')
                          : isDelayed
                            ? (isRtl ? 'متأخر' : 'Delayed')
                            : isInProgress
                              ? (isRtl ? 'قيد التنفيذ' : 'In Progress')
                              : (isRtl ? 'قادم' : 'Upcoming');

                        const dueTime = new Date(selectedMilestone.date).getTime();
                        const nowTime = new Date().getTime();
                        const daysDiff = Math.ceil((dueTime - nowTime) / 86400000);

                        return (
                          <div className="lg:col-span-5 bg-slate-50/40 dark:bg-zinc-950/40 border border-slate-200/60 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                            <div className="flex flex-col gap-3 h-full justify-between">
                              <div className="flex flex-col gap-2">
                                {/* Status Header */}
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-900 pb-1.5">
                                  <span className="text-[8px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase">
                                    {selectedMilestone.projectCode || 'NEXORA'}
                                  </span>
                                  <span className={`text-[8.5px] font-black px-2 py-0.5 rounded border ${statusColor}`}>
                                    {statusLabel}
                                  </span>
                                </div>

                                {/* Milestone Title */}
                                <h6 className="text-[11.5px] font-black text-slate-800 dark:text-zinc-200 leading-snug line-clamp-2">
                                  {isRtl ? selectedMilestone.titleAr : selectedMilestone.titleEn}
                                </h6>

                                <div className="flex flex-col gap-1 text-[9px] text-slate-500 dark:text-zinc-400 font-semibold bg-white/50 dark:bg-zinc-900/30 p-2 rounded-lg border border-slate-200 dark:border-zinc-800/60">
                                  <span className="text-slate-400 dark:text-zinc-500 block text-[8px] font-bold uppercase">
                                    {isRtl ? 'المشروع التابع' : 'Associated Project'}
                                  </span>
                                  <span className="line-clamp-1">
                                    {isRtl ? selectedMilestone.projectNameAr : selectedMilestone.projectNameEn}
                                  </span>
                                </div>

                                {/* Days Remaining Counter */}
                                <div className="flex items-center gap-1.5 text-[10px] mt-1 font-bold">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="text-slate-500 dark:text-zinc-400">{isRtl ? 'تاريخ الاستحقاق:' : 'Due Date:'}</span>
                                  <span className="font-mono text-slate-700 dark:text-zinc-300">{selectedMilestone.date}</span>
                                  {daysDiff > 0 ? (
                                    <span className="text-emerald-600 dark:text-emerald-400 text-[9px] px-1.5 py-0.2 bg-emerald-500/10 rounded-full font-black">
                                      ({isRtl ? `متبقي ${daysDiff} ?` : `${daysDiff}d left`})
                                    </span>
                                  ) : daysDiff === 0 ? (
                                    <span className="text-amber-600 dark:text-amber-400 text-[9px] px-1.5 py-0.2 bg-amber-500/10 rounded-full font-black animate-pulse">
                                      ({isRtl ? 'اليوم!' : 'Today!'})
                                    </span>
                                  ) : (
                                    <span className="text-rose-600 dark:text-rose-400 text-[9px] px-1.5 py-0.2 bg-rose-500/10 rounded-full font-black">
                                      ({isRtl ? `متأخر بـ ${Math.abs(daysDiff)} ?` : `${Math.abs(daysDiff)}d overdue`})
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Status Changer Controller Panel */}
                              <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-zinc-900/60 flex flex-col gap-2">
                                <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase">
                                  {isRtl ? 'تحديث الحالة التشغيلية (تفاعلي):' : 'Update Operational Status:'}
                                </span>

                                <div className="grid grid-cols-2 gap-1.5">
                                  <button
                                    onClick={() => handleUpdateMilestoneStatus(selectedMilestone.id, 'completed')}
                                    className={`px-2 py-1.5 rounded-lg border text-[9px] font-black flex items-center justify-center gap-1 cursor-pointer transition-all ${
                                      selectedMilestone.status === 'completed'
                                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                                        : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
                                    }`}
                                  >
                                    ? {isRtl ? 'منتهي / مغلق' : 'Completed'}
                                  </button>
                                  <button
                                    onClick={() => handleUpdateMilestoneStatus(selectedMilestone.id, 'in_progress')}
                                    className={`px-2 py-1.5 rounded-lg border text-[9px] font-black flex items-center justify-center gap-1 cursor-pointer transition-all ${
                                      selectedMilestone.status === 'in_progress'
                                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                        : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
                                    }`}
                                  >
                                    ? {isRtl ? 'قيد التنفيذ' : 'In Progress'}
                                  </button>
                                  <button
                                    onClick={() => handleUpdateMilestoneStatus(selectedMilestone.id, 'delayed')}
                                    className={`px-2 py-1.5 rounded-lg border text-[9px] font-black flex items-center justify-center gap-1 cursor-pointer transition-all ${
                                      selectedMilestone.status === 'delayed'
                                        ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                                        : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
                                    }`}
                                  >
                                    ?? {isRtl ? 'متأخر' : 'Delayed'}
                                  </button>
                                  <button
                                    onClick={() => handleUpdateMilestoneStatus(selectedMilestone.id, 'upcoming')}
                                    className={`px-2 py-1.5 rounded-lg border text-[9px] font-black flex items-center justify-center gap-1 cursor-pointer transition-all ${
                                      selectedMilestone.status === 'upcoming'
                                        ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                                        : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
                                    }`}
                                  >
                                    ?? {isRtl ? 'قادم' : 'Upcoming'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Also keep the three milestone status cards below the Gantt chart for quick visual scan */}
                  {upcomingDeadlines.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                      {upcomingDeadlines.map((milestone) => {
                        const isCompleted = milestone.status === 'completed';
                        const isInProgress = milestone.status === 'in_progress';
                        const isDelayed = milestone.status === 'delayed';
                        const selectedMilestone = upcomingDeadlines.find(m => m.id === selectedMilestoneId) || upcomingDeadlines[0];
                        const isSelected = selectedMilestone?.id === milestone.id;

                        const statusColor = isCompleted
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : isDelayed
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            : isInProgress
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';

                        const statusLabel = isCompleted
                          ? (isRtl ? 'منتهي / مغلق' : 'Completed')
                          : isDelayed
                            ? (isRtl ? 'متأخر' : 'Delayed')
                            : isInProgress
                              ? (isRtl ? 'قيد التنفيذ' : 'In Progress')
                              : (isRtl ? 'قادم' : 'Upcoming');

                        return (
                          <div
                            key={milestone.id}
                            onClick={() => setSelectedMilestoneId(milestone.id)}
                            className={`relative p-3 bg-slate-50/50 dark:bg-zinc-900/20 border rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between gap-2.5 shadow-sm overflow-hidden cursor-pointer ${
                              isSelected 
                                ? 'border-emerald-500/50 dark:border-emerald-500/30 ring-2 ring-emerald-500/10 bg-slate-100/30 dark:bg-zinc-900/40' 
                                : 'border-slate-200/50 dark:border-zinc-800'
                            }`}
                          >
                            <div className={`absolute top-0 left-0 right-0 h-0.5 ${
                              isCompleted ? 'bg-emerald-500/70' :
                              isDelayed ? 'bg-rose-500/70' :
                              isInProgress ? 'bg-amber-500/70' : 'bg-blue-500/70'
                            }`} />

                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[8px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase">
                                  {milestone.projectCode || 'NEXORA'}
                                </span>
                                <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded border ${statusColor}`}>
                                  {statusLabel}
                                </span>
                              </div>

                              <h6 className="text-[10.5px] font-black text-slate-800 dark:text-zinc-200 line-clamp-2 leading-snug">
                                {isRtl ? milestone.titleAr : milestone.titleEn}
                              </h6>
                            </div>

                            <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100 dark:border-zinc-900/60">
                              <span className="text-[9px] text-slate-500 dark:text-zinc-400 font-bold truncate">
                                {isRtl ? milestone.projectNameAr : milestone.projectNameEn}
                              </span>

                              <div className="flex items-center gap-1 text-[9px] text-slate-400 dark:text-zinc-500 font-mono font-bold">
                                <Calendar className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                                <span>{milestone.date}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Budget Forecasting Section */}
              <div className="border-t border-slate-100 dark:border-zinc-900/60 pt-4">
                <div className="flex items-center gap-1.5 mb-3.5">
                  <div className="p-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md">
                    <Coins className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-[11.5px] font-black text-slate-800 dark:text-zinc-300">
                      {isRtl ? 'التنبؤ المالي وتحليل انحراف الموازنة (Budget Forecasting)' : 'Financial Forecasting & Budget Variance'}
                    </h5>
                    <p className="text-[9.5px] text-slate-400 dark:text-zinc-500 font-semibold mt-0.5">
                      {isRtl ? 'مقارنة تراكمية للموازنات المخططة مقابل الصرف الفعلي التقديري للوقوف على كفاءة الإنفاق والانحرافات' : 'Cumulative comparison of planned budgets vs estimated actual spends with variance trend'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Currency Summaries Column */}
                  <div className="lg:col-span-5 flex flex-col gap-3">
                    {currencySummaries.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50/30">
                        <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold">
                          {isRtl ? 'لا تتوفر بيانات مالية حالياً.' : 'No financial data available currently.'}
                        </p>
                      </div>
                    ) : (
                      currencySummaries.map((summary) => {
                        const isOverrun = summary.variancePercent > 0;
                        const isUnder = summary.variancePercent < -2; // significant saving
                        const badgeColor = isOverrun
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                          : isUnder
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-zinc-700';

                        const varianceSign = summary.variance > 0 ? '+' : '';

                        return (
                          <div 
                            key={summary.currency}
                            className="p-3 bg-slate-50/50 dark:bg-zinc-900/20 border border-slate-200/50 dark:border-zinc-800 rounded-xl flex flex-col gap-2.5 shadow-sm"
                          >
                            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-900/60 pb-1.5">
                              <span className="text-[10px] font-black font-mono text-slate-500 dark:text-zinc-400 uppercase bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                                {summary.currency}
                              </span>
                              <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
                                {isRtl ? 'الانحراف المالي' : 'Variance'}: {varianceSign}{summary.variancePercent.toFixed(1)}%
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <span className="text-[8.5px] text-slate-400 dark:text-zinc-500 font-bold block">
                                  {isRtl ? 'الموازنة المقدرة' : 'Planned Budget'}
                                </span>
                                <span className="text-xs font-black text-slate-700 dark:text-zinc-200 mt-0.5 block">
                                  {Math.round(summary.planned).toLocaleString()} {summary.currency}
                                </span>
                              </div>
                              <div>
                                <span className="text-[8.5px] text-slate-400 dark:text-zinc-500 font-bold block">
                                  {isRtl ? 'الإنفاق الفعلي التقديري' : 'Est. Actual Spend'}
                                </span>
                                <span className="text-xs font-black text-slate-700 dark:text-zinc-200 mt-0.5 block">
                                  {Math.round(summary.actual).toLocaleString()} {summary.currency}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[9px] font-bold mt-1 text-slate-500 dark:text-zinc-400 border-t border-slate-100/50 dark:border-zinc-900/40 pt-1.5">
                              <span>{isRtl ? 'حالة التوازن المالي:' : 'Financial Status:'}</span>
                              <span className={isOverrun ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                                {isOverrun 
                                  ? (isRtl ? `تجاوز بنسبة ${summary.variancePercent.toFixed(1)}% ⚠️` : `Overrun by ${summary.variancePercent.toFixed(1)}% ⚠️`)
                                  : (isRtl ? `وفورات مالية بنسبة ${Math.abs(summary.variancePercent).toFixed(1)}% ?` : `Savings of ${Math.abs(summary.variancePercent).toFixed(1)}% ?`)
                                }
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Variance Sparkline Column */}
                  <div className="lg:col-span-7 flex flex-col bg-slate-50/20 dark:bg-zinc-900/10 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 shadow-sm">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        {portfolioVariancePercent > 0 ? (
                          <TrendingUp className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        )}
                        <span className="text-[10px] font-black text-slate-700 dark:text-zinc-300">
                          {isRtl ? 'منحنى تباين الموازنة التراكمي (%)' : 'Portfolio Budget Variance Trend (%)'}
                        </span>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        portfolioVariancePercent > 0 
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' 
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {isRtl ? 'المعدل العام:' : 'Overall:'} {portfolioVariancePercent > 0 ? '+' : ''}{portfolioVariancePercent.toFixed(2)}%
                      </span>
                    </div>

                    <div className="h-32 w-full mt-1.5">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={varianceTrendData}
                          margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorVariance" x1="0" y1="0" x2="0" y2="1">
                              <stop 
                                offset="5%" 
                                stopColor={portfolioVariancePercent > 0 ? '#f43f5e' : '#10b981'} 
                                stopOpacity={0.12}
                              />
                              <stop 
                                offset="95%" 
                                stopColor={portfolioVariancePercent > 0 ? '#f43f5e' : '#10b981'} 
                                stopOpacity={0.01}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200/50 dark:text-zinc-800/40" />
                          <XAxis 
                            dataKey="name" 
                            stroke="currentColor" 
                            className="text-slate-400 dark:text-zinc-500 text-[8.5px] font-bold"
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis 
                            stroke="currentColor" 
                            className="text-slate-400 dark:text-zinc-500 text-[8.5px] font-bold"
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `${v}%`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(9, 13, 22, 0.95)',
                              borderRadius: '12px',
                              border: '1px solid rgba(255,255,255,0.08)',
                              fontSize: '10px',
                              fontWeight: 'bold',
                            }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                          />
                          <ReferenceLine 
                            y={0} 
                            stroke="#94a3b8" 
                            strokeDasharray="3 3" 
                            strokeWidth={1.2}
                            label={{ 
                              value: isRtl ? 'الكفالات والأيتام' : 'Balanced', 
                              position: 'top', 
                              fill: '#94a3b8', 
                              fontSize: 8,
                              fontWeight: 'bold'
                            }} 
                          />
                          <Area 
                            type="monotone" 
                            dataKey={isRtl ? 'الانحراف المالي (%)' : 'Variance (%)'} 
                            stroke={portfolioVariancePercent > 0 ? '#f43f5e' : '#10b981'} 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorVariance)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter and Project List Section */}
              <div className="border-t border-slate-100 dark:border-zinc-900/60 pt-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowArchivedList(false)}
                      className={`px-3 py-1.5 text-[11px] font-black rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                        !showArchivedList 
                          ? 'bg-emerald-600 dark:bg-emerald-600 text-white shadow-sm shadow-emerald-500/10' 
                          : 'bg-slate-50 dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <Filter className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'المشاريع الجارية' : 'Active Projects'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowArchivedList(true)}
                      className={`px-3 py-1.5 text-[11px] font-black rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                        showArchivedList 
                          ? 'bg-amber-600 dark:bg-amber-600 text-white shadow-sm shadow-amber-500/10' 
                          : 'bg-slate-50 dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>{isRtl ? `الأرشيف (${archivedProjectIds.length})` : `Archived (${archivedProjectIds.length})`}</span>
                    </button>
                  </div>

                  {/* Dropdown Component */}
                  <div className="relative flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold hidden sm:inline">
                      {isRtl ? 'تصفية حسب:' : 'Filter status:'}
                    </span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] font-black rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="all">{isRtl ? 'كل الحالات التشغيلية' : 'All Statuses'}</option>
                      <option value="active">{isRtl ? 'نشط / مستمر ميدانياً' : 'Active'}</option>
                      <option value="pending">{isRtl ? 'طلبات' : 'Pending'}</option>
                      <option value="delayed">{isRtl ? 'متأخر' : 'Delayed'}</option>
                    </select>

                    {/* Priority Multi-Select Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsPriorityDropdownOpen(!isPriorityDropdownOpen)}
                        className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] font-black rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-colors"
                      >
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold">
                          {isRtl ? 'الأولوية:' : 'Priority:'}
                        </span>
                        <span className="text-slate-700 dark:text-zinc-200">
                          {
                            selectedPriorities.length === 3 
                              ? (isRtl ? 'الكل' : 'All') 
                              : selectedPriorities.length === 0 
                              ? (isRtl ? 'بلا' : 'None') 
                              : selectedPriorities.map(p => {
                                  if (p === 'high') return isRtl ? 'موقوف' : 'High';
                                  if (p === 'medium') return isRtl ? 'الحالة' : 'Medium';
                                  return isRtl ? 'الجودة' : 'Low';
                                }).join(', ')
                          }
                        </span>
                        <ChevronDown className={`w-3 h-3 transition-transform text-slate-400 ${isPriorityDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isPriorityDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setIsPriorityDropdownOpen(false)} 
                          />
                          <div className={`absolute z-50 mt-1 w-44 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl p-2 flex flex-col gap-1 ${isRtl ? 'left-0' : 'right-0'}`}>
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-900 pb-1.5 mb-1 px-1">
                              <span className="text-[9.5px] text-slate-400 dark:text-zinc-500 font-black">
                                {isRtl ? 'تصفية الأولوية:' : 'Drill down Priority:'}
                              </span>
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedPriorities(['high', 'medium', 'low'])}
                                  className="text-[9px] text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-extrabold cursor-pointer"
                                >
                                  {isRtl ? 'الكل' : 'All'}
                                </button>
                                <span className="text-[9px] text-slate-300 dark:text-zinc-700">|</span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedPriorities([])}
                                  className="text-[9px] text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 font-extrabold cursor-pointer"
                                >
                                  {isRtl ? 'سليم' : 'Clear'}
                                </button>
                              </div>
                            </div>

                            {/* Options */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPriorities(prev => 
                                  prev.includes('high') 
                                    ? prev.filter(x => x !== 'high') 
                                    : [...prev, 'high']
                                );
                              }}
                              className="flex items-center gap-2 w-full text-right px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900/60 cursor-pointer select-none text-xs font-bold text-slate-700 dark:text-zinc-300"
                            >
                              <div className={`w-3.5 h-3.5 border rounded-md flex items-center justify-center transition-colors ${
                                selectedPriorities.includes('high')
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-300 dark:border-zinc-700'
                              }`}>
                                {selectedPriorities.includes('high') && <Check className="w-2.5 h-2.5" />}
                              </div>
                              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                              <span>{isRtl ? 'عالية جداً' : 'High / Critical'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPriorities(prev => 
                                  prev.includes('medium') 
                                    ? prev.filter(x => x !== 'medium') 
                                    : [...prev, 'medium']
                                );
                              }}
                              className="flex items-center gap-2 w-full text-right px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900/60 cursor-pointer select-none text-xs font-bold text-slate-700 dark:text-zinc-300"
                            >
                              <div className={`w-3.5 h-3.5 border rounded-md flex items-center justify-center transition-colors ${
                                selectedPriorities.includes('medium')
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-300 dark:border-zinc-700'
                              }`}>
                                {selectedPriorities.includes('medium') && <Check className="w-2.5 h-2.5" />}
                              </div>
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                              <span>{isRtl ? 'متوسطة' : 'Medium / Normal'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPriorities(prev => 
                                  prev.includes('low') 
                                    ? prev.filter(x => x !== 'low') 
                                    : [...prev, 'low']
                                );
                              }}
                              className="flex items-center gap-2 w-full text-right px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900/60 cursor-pointer select-none text-xs font-bold text-slate-700 dark:text-zinc-300"
                            >
                              <div className={`w-3.5 h-3.5 border rounded-md flex items-center justify-center transition-colors ${
                                selectedPriorities.includes('low')
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-300 dark:border-zinc-700'
                              }`}>
                                {selectedPriorities.includes('low') && <Check className="w-2.5 h-2.5" />}
                              </div>
                              <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-zinc-500 rounded-full" />
                              <span>{isRtl ? 'عادية' : 'Low'}</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => setIsExportOpen(true)}
                      className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-2.5 py-1.5 text-[11px] font-black transition-colors cursor-pointer shadow-sm shrink-0"
                      title={isRtl ? 'تصدير هذه البيانات' : 'Export this data'}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'تصدير' : 'Export'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleAnomaly(!anomalyEnabled)}
                      disabled={anomaliesLoading}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer shadow-sm shrink-0 border ${
                        anomalyEnabled
                          ? 'bg-violet-600 border-violet-600 text-white shadow-violet-500/15 border-violet-500'
                          : 'bg-slate-50 dark:bg-zinc-900 border-slate-200/50 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                      title={isRtl ? 'تدقيق وتنبيهات الفروقات الذكية' : 'Smart Discrepancy Diagnostics'}
                    >
                      <Activity className={`w-3.5 h-3.5 ${anomaliesLoading ? 'animate-pulse text-violet-300' : ''}`} />
                      <span>{isRtl ? 'تدقيق الملاحظات' : 'Review Alerts'}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${anomalyEnabled ? 'bg-white animate-ping' : 'bg-slate-400 dark:bg-zinc-600'}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleFinancialAudit(!financialAuditEnabled)}
                      disabled={financialAuditsLoading}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer shadow-sm shrink-0 border ${
                        financialAuditEnabled
                          ? 'bg-amber-600 border-amber-600 text-white shadow-amber-500/15 border-amber-500'
                          : 'bg-slate-50 dark:bg-zinc-900 border-slate-200/50 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                      title={isRtl ? 'التدقيق المالي بالذكاء الاصطناعي' : 'AI Financial Audit'}
                    >
                      <Coins className={`w-3.5 h-3.5 ${financialAuditsLoading ? 'animate-spin' : ''}`} />
                      <span>{isRtl ? 'التدقيق المالي' : 'Financial Audit'}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${financialAuditEnabled ? 'bg-white animate-ping' : 'bg-slate-400 dark:bg-zinc-600'}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTogglePredictiveImpact(!predictiveImpactEnabled)}
                      disabled={predictiveImpactLoading}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer shadow-sm shrink-0 border ${
                        predictiveImpactEnabled
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-500/15 border-emerald-500'
                          : 'bg-slate-50 dark:bg-zinc-900 border-slate-200/50 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                      title={isRtl ? 'الأثر التنبؤي الذكي للربع القادم' : 'Predictive Impact Forecast'}
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${predictiveImpactLoading ? 'animate-pulse text-emerald-300' : ''}`} />
                      <span>{isRtl ? 'الأثر التنبؤي' : 'Predictive Impact'}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${predictiveImpactEnabled ? 'bg-white animate-ping' : 'bg-slate-400 dark:bg-zinc-600'}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleSmartRebalance(!smartRebalanceEnabled)}
                      disabled={smartRebalanceLoading}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer shadow-sm shrink-0 border ${
                        smartRebalanceEnabled
                          ? 'bg-teal-600 border-teal-600 text-white shadow-teal-500/15 border-teal-500'
                          : 'bg-slate-50 dark:bg-zinc-900 border-slate-200/50 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                      title={isRtl ? 'موازنة الميزانية الذكية' : 'Smart Budget Rebalance'}
                    >
                      <Scale className={`w-3.5 h-3.5 ${smartRebalanceLoading ? 'animate-spin text-teal-300' : ''}`} />
                      <span>{isRtl ? 'إعادة التوازن الذكي' : 'Smart Rebalance'}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${smartRebalanceEnabled ? 'bg-white animate-ping' : 'bg-slate-400 dark:bg-zinc-600'}`} />
                    </button>
                  </div>
                </div>

                {/* Grid List of Projects */}
                <div>
                  {smartRebalanceEnabled && (smartRebalance || smartRebalanceLoading || smartRebalanceError) && (
                    <div className="mb-4 p-4 bg-teal-500/5 dark:bg-teal-950/10 border border-teal-200/30 dark:border-teal-900/40 rounded-xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-2 border-b border-teal-200/20 dark:border-teal-900/20 animate-fade-in">
                        <div className="flex items-center gap-2">
                          <Scale className={`w-5 h-5 text-teal-600 dark:text-teal-500 ${smartRebalanceLoading ? 'animate-spin' : ''}`} />
                          <div>
                            <h4 className="text-xs font-black text-teal-800 dark:text-teal-300">
                              {isRtl ? 'خطة إعادة توازن الميزانية الذكية من NexoraOS™' : 'NexoraOS? Smart Budget Rebalancing Plan'}
                            </h4>
                            <p className="text-[10px] text-teal-600/80 dark:text-teal-400/80 font-bold">
                              {isRtl 
                                ? 'تحليل تلقائي متطور لإعادة توزيع التمويل بناءً على الأداء الفعلي ونسب التقدم ومعدلات الصرف.' 
                                : 'Automated dynamic budget reallocation based on real-world milestones, spending speeds, and ROI.'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => runSmartRebalance(true)}
                          disabled={smartRebalanceLoading}
                          className="text-[10px] font-black bg-teal-600 hover:bg-teal-700 text-white px-2.5 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer shrink-0 flex items-center gap-1 border border-teal-500/30"
                        >
                          <RefreshCw className={`w-3 h-3 ${smartRebalanceLoading ? 'animate-spin' : ''}`} />
                          <span>{isRtl ? 'إعادة حساب الموازنة' : 'Recalculate Rebalances'}</span>
                        </button>
                      </div>

                      {smartRebalanceLoading ? (
                        <div className="flex items-center gap-2 py-4 justify-center">
                          <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                          <span className="text-[11px] text-teal-700 dark:text-teal-400 font-extrabold animate-pulse">
                            {isRtl ? 'جاري تحليل الأداء وحساب نسب التوزيع المثلى للميزانيات...' : 'Analyzing performance signals & mapping optimal budget reallocations...'}
                          </span>
                        </div>
                      ) : smartRebalanceError ? (
                        <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-lg text-[10px] font-bold">
                          {smartRebalanceError}
                        </div>
                      ) : smartRebalance ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in">
                            <div className="bg-white/60 dark:bg-zinc-950/40 p-2.5 rounded-lg border border-teal-200/30 dark:border-teal-900/20">
                              <span className="text-[9px] text-teal-600/80 dark:text-teal-400/80 block font-bold">
                                {isRtl ? 'المشاريع الخاضعة للتحليل' : 'Analyzed Projects'}
                              </span>
                              <span className="text-sm font-black text-teal-800 dark:text-teal-300 font-mono">
                                {smartRebalance.reallocations.length}
                              </span>
                            </div>
                            <div className="bg-white/60 dark:bg-zinc-950/40 p-2.5 rounded-lg border border-teal-200/30 dark:border-teal-900/20">
                              <span className="text-[9px] text-teal-600/80 dark:text-teal-400/80 block font-bold">
                                {isRtl ? 'إجمالي المبالغ المعاد توجيهها' : 'Total Value Reallocated'}
                              </span>
                              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                ${smartRebalance.reallocations
                                  .filter(r => r.netChange > 0)
                                  .reduce((sum, r) => sum + r.netChange, 0)
                                  .toLocaleString()}
                              </span>
                            </div>
                            <div className="bg-white/60 dark:bg-zinc-950/40 p-2.5 rounded-lg border border-teal-200/30 dark:border-teal-900/20">
                              <span className="text-[9px] text-teal-600/80 dark:text-teal-400/80 block font-bold">
                                {isRtl ? 'صافي التغير في محفظة التمويل' : 'Net Budget Adjustment'}
                              </span>
                              <span className="text-sm font-black text-teal-600 dark:text-teal-400 font-mono">
                                ${smartRebalance.reallocations.reduce((sum, r) => sum + r.netChange, 0).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="p-3 bg-teal-500/5 dark:bg-teal-950/5 border border-teal-200/20 dark:border-teal-900/10 rounded-lg text-[10.5px] leading-relaxed text-slate-700 dark:text-zinc-300 font-bold animate-fade-in">
                            <span className="block text-[8px] font-black uppercase text-teal-600 dark:text-teal-400 mb-0.5">
                              {isRtl ? 'مبررات وتوصيات التوزيع الاستراتيجي للمحفظة:' : 'Portfolio Reallocation Strategic Rationale:'}
                            </span>
                            {isRtl ? smartRebalance.strategicRationaleAr : smartRebalance.strategicRationaleEn}
                          </div>

                          {/* Reallocations breakdown list */}
                          <div className="border border-teal-200/20 dark:border-teal-900/25 rounded-lg overflow-hidden bg-white/40 dark:bg-zinc-950/20 text-[10px]">
                            <div className="grid grid-cols-5 gap-2 bg-teal-500/10 dark:bg-teal-950/35 p-2 font-black text-teal-800 dark:text-teal-300 uppercase tracking-wider text-[9px] border-b border-teal-200/25 dark:border-teal-900/25">
                              <div className="col-span-1">{isRtl ? 'المشروع' : 'Project'}</div>
                              <div className="text-right">{isRtl ? 'الميزانية الحالية' : 'Current Budget'}</div>
                              <div className="text-right">{isRtl ? 'الميزانية المقترحة' : 'Suggested'}</div>
                              <div className="text-right">{isRtl ? 'صافي التعديل' : 'Net Change'}</div>
                              <div className="col-span-1 pl-2">{isRtl ? 'السبب الموجز' : 'Justification'}</div>
                            </div>
                            <div className="divide-y divide-teal-200/10 dark:divide-teal-900/10">
                              {smartRebalance.reallocations.map((r, idx) => {
                                const matchedProj = activeDashboardProjects.find(p => p.id === r.projectId);
                                const projName = matchedProj 
                                  ? (isRtl ? matchedProj.name_ar : matchedProj.name_en) 
                                  : r.projectCode;

                                return (
                                  <div key={idx} className="grid grid-cols-5 gap-2 p-2 hover:bg-teal-500/5 dark:hover:bg-teal-950/10 transition-colors font-bold items-center">
                                    <div className="col-span-1 truncate" title={projName}>
                                      <span className="font-mono bg-teal-500/10 text-teal-600 dark:text-teal-400 px-1 py-0.5 rounded mr-1 text-[8.5px]">
                                        {r.projectCode}
                                      </span>
                                      <span className="text-[9.5px] text-slate-700 dark:text-zinc-300">{projName}</span>
                                    </div>
                                    <div className="text-right font-mono text-slate-500">${r.originalBudget.toLocaleString()}</div>
                                    <div className="text-right font-mono text-teal-700 dark:text-teal-400 font-extrabold">${r.suggestedBudget.toLocaleString()}</div>
                                    <div className={`text-right font-mono font-black ${
                                      r.netChange > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                                      r.netChange < 0 ? 'text-rose-600 dark:text-rose-400' :
                                      'text-slate-400'
                                    }`}>
                                      {r.netChange > 0 ? '+' : ''}${r.netChange.toLocaleString()}
                                    </div>
                                    <div className="col-span-1 pl-2 truncate text-slate-600 dark:text-zinc-400 text-[9px]" title={isRtl ? r.justificationAr : r.justificationEn}>
                                      {isRtl ? r.justificationAr : r.justificationEn}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {predictiveImpactEnabled && (predictiveImpact || predictiveImpactLoading || predictiveImpactError) && (
                    <div className="mb-4 p-4 bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-200/30 dark:border-emerald-900/40 rounded-xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-2 border-b border-emerald-200/20 dark:border-emerald-900/20 animate-fade-in">
                        <div className="flex items-center gap-2">
                          <Sparkles className={`w-5 h-5 text-emerald-600 dark:text-emerald-500 ${predictiveImpactLoading ? 'animate-pulse' : ''}`} />
                          <div>
                            <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300">
                              {isRtl ? 'توقعات الأثر الإستراتيجي الذكي من NexoraOS™' : 'NexoraOS? Strategic Predictive Impact Forecast'}
                            </h4>
                            <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-bold">
                              {isRtl 
                                ? 'تحليل ذكاء اصطناعي للأثر المالي والاجتماعي المحتمل للمشاريع للربع القادم.' 
                                : 'Forward-looking AI-driven projections of social & financial outcomes for the next quarter.'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => runPredictiveImpact(true)}
                          disabled={predictiveImpactLoading}
                          className="text-[10px] font-black bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer shrink-0 flex items-center gap-1 border border-emerald-500/30"
                        >
                          <RefreshCw className={`w-3 h-3 ${predictiveImpactLoading ? 'animate-spin' : ''}`} />
                          <span>{isRtl ? 'تحديث التوقعات' : 'Recalculate Projections'}</span>
                        </button>
                      </div>

                      {predictiveImpactLoading ? (
                        <div className="flex items-center gap-2 py-4 justify-center">
                          <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-extrabold animate-pulse">
                            {isRtl ? 'جاري حساب وتقدير مؤشرات الأثر التنموي والتوقعات المالية...' : 'Calculating impact indexes & future social-financial returns...'}
                          </span>
                        </div>
                      ) : predictiveImpactError ? (
                        <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-lg text-[10px] font-bold">
                          {predictiveImpactError}
                        </div>
                      ) : predictiveImpact ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-fade-in">
                            <div className="bg-white/60 dark:bg-zinc-950/40 p-2.5 rounded-lg border border-emerald-200/30 dark:border-emerald-900/20">
                              <span className="text-[9px] text-emerald-600/80 dark:text-emerald-400/80 block font-bold">
                                {isRtl ? 'إجمالي الأثر الاجتماعي المتوقع' : 'Projected Social Impact'}
                              </span>
                              <span className="text-sm font-black text-emerald-800 dark:text-emerald-300 font-mono">
                                {predictiveImpact.socialImpactMetricPeople.toLocaleString()} {isRtl ? 'مستفيد مباشر' : 'Direct Beneficiaries'}
                              </span>
                            </div>
                            <div className="bg-white/60 dark:bg-zinc-950/40 p-2.5 rounded-lg border border-emerald-200/30 dark:border-emerald-900/20">
                              <span className="text-[9px] text-emerald-600/80 dark:text-emerald-400/80 block font-bold">
                                {isRtl ? 'مؤشر كفاءة التمويل المالي' : 'Projected Value Generated / USD'}
                              </span>
                              <span className="text-sm font-black text-amber-600 dark:text-amber-500 font-mono">
                                ${predictiveImpact.financialImpactMetricUSD.toLocaleString()}
                              </span>
                            </div>
                            <div className="bg-white/60 dark:bg-zinc-950/40 p-2.5 rounded-lg border border-emerald-200/30 dark:border-amber-900/20 md:col-span-1">
                              <span className="text-[9px] text-emerald-600/80 dark:text-emerald-400/80 block font-bold">
                                {isRtl ? 'متوسط درجة الأثر التنموي' : 'Avg Portfolio Impact Score'}
                              </span>
                              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                {(predictiveImpact.projectBreakdowns.reduce((sum, b) => sum + b.impactScore, 0) / Math.max(1, predictiveImpact.projectBreakdowns.length)).toFixed(1)} / 10
                              </span>
                            </div>
                          </div>

                          <div className="p-3 bg-emerald-500/5 dark:bg-emerald-950/5 border border-emerald-200/20 dark:border-emerald-900/10 rounded-lg text-[10.5px] leading-relaxed text-slate-700 dark:text-zinc-300 font-bold animate-fade-in">
                            <span className="block text-[8px] font-black uppercase text-emerald-600 dark:text-emerald-400 mb-0.5">
                              {isRtl ? 'الملخص الاستراتيجي للربع القادم:' : 'Upcoming Quarter Strategic Synthesis:'}
                            </span>
                            {isRtl ? predictiveImpact.quarterlyOverviewAr : predictiveImpact.quarterlyOverviewEn}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {financialAuditEnabled && (financialAudits.length > 0 || financialAuditsLoading || financialAuditsError) && (
                    <div className="mb-4 p-4 bg-amber-500/5 dark:bg-amber-950/10 border border-amber-200/30 dark:border-amber-900/40 rounded-xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-2 border-b border-amber-200/20 dark:border-amber-900/20 animate-fade-in">
                        <div className="flex items-center gap-2">
                          <Coins className={`w-5 h-5 text-amber-600 dark:text-amber-500 ${financialAuditsLoading ? 'animate-spin' : ''}`} />
                          <div>
                            <h4 className="text-xs font-black text-amber-800 dark:text-amber-300">
                              {isRtl ? 'تقرير التدقيق المالي الذكي من NexoraOS™' : 'NexoraOS? AI Financial Audit Report'}
                            </h4>
                            <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-bold">
                              {isRtl 
                                ? 'تحليل تلقائي متقدم للانحرافات ومعدلات حرق الميزانية استناداً إلى معايير المجال الإنساني.' 
                                : 'Advanced automated variance & burn-rate audit benchmarked against Sphere humanitarian standards.'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => runFinancialAudit(true)}
                          disabled={financialAuditsLoading}
                          className="text-[10px] font-black bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer shrink-0 flex items-center gap-1 border border-amber-500/30"
                        >
                          <RefreshCw className={`w-3 h-3 ${financialAuditsLoading ? 'animate-spin' : ''}`} />
                          <span>{isRtl ? 'إعادة الفحص المالي' : 'Re-run Financial Audit'}</span>
                        </button>
                      </div>

                      {financialAuditsLoading ? (
                        <div className="flex items-center gap-2 py-4 justify-center">
                          <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                          <span className="text-[11px] text-amber-700 dark:text-amber-400 font-extrabold animate-pulse">
                            {isRtl ? 'جاري إجراء التدقيق المالي والتحري المالي الجنائي الذكي...' : 'Performing deep AI forensic financial auditing...'}
                          </span>
                        </div>
                      ) : financialAuditsError ? (
                        <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-lg text-[10px] font-bold">
                          {financialAuditsError}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-white/60 dark:bg-zinc-950/40 p-2.5 rounded-lg border border-amber-200/30 dark:border-amber-900/20">
                            <span className="text-[9px] text-amber-600/80 dark:text-amber-400/80 block font-bold">
                              {isRtl ? 'المشاريع المفحوصة' : 'Audited Projects'}
                            </span>
                            <span className="text-sm font-black text-amber-800 dark:text-amber-300 font-mono">
                              {activeDashboardProjects.length}
                            </span>
                          </div>
                          <div className="bg-white/60 dark:bg-zinc-950/40 p-2.5 rounded-lg border border-amber-200/30 dark:border-amber-900/20">
                            <span className="text-[9px] text-amber-600/80 dark:text-amber-400/80 block font-bold">
                              {isRtl ? 'المخاطر الحرجة' : 'Critical Risks'}
                            </span>
                            <span className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono">
                              {financialAudits.filter(a => a.severity === 'critical').length}
                            </span>
                          </div>
                          <div className="bg-white/60 dark:bg-zinc-950/40 p-2.5 rounded-lg border border-amber-200/30 dark:border-amber-900/20">
                            <span className="text-[9px] text-amber-600/80 dark:text-amber-400/80 block font-bold">
                              {isRtl ? 'التنبيهات والتحذيرات' : 'Warnings & Flags'}
                            </span>
                            <span className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">
                              {financialAudits.filter(a => a.severity === 'warning').length}
                            </span>
                          </div>
                          <div className="bg-white/60 dark:bg-zinc-950/40 p-2.5 rounded-lg border border-amber-200/30 dark:border-amber-900/20">
                            <span className="text-[9px] text-amber-600/80 dark:text-amber-400/80 block font-bold">
                              {isRtl ? 'معدل الامتثال المالي' : 'Compliance Rate'}
                            </span>
                            <span className={`text-sm font-black font-mono ${
                              financialAudits.length === 0 ? 'text-emerald-600 dark:text-emerald-400' :
                              financialAudits.filter(a => a.severity === 'critical').length > 0 ? 'text-rose-600 dark:text-rose-400' :
                              'text-amber-600 dark:text-amber-400'
                            }`}>
                              {Math.max(0, Math.min(100, Math.round(100 - (financialAudits.length / Math.max(1, activeDashboardProjects.length)) * 100)))}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {filteredProjects.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50/40 dark:bg-zinc-900/10 border border-dashed border-slate-200/60 dark:border-zinc-800/60 rounded-xl">
                      <p className="text-xs text-slate-400 dark:text-zinc-500 font-bold">
                        {isRtl ? 'لا توجد مشاريع مطابقة لخيارات التصفية.' : 'No projects matching current filter criteria.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredProjects.map((proj) => {
                        const isProjCompleted = proj.status_code === 'completed';
                        const statusColor = proj.status_code === 'active' || !proj.status_code ? 'emerald' :
                                            proj.status_code === 'delayed' ? 'rose' :
                                            proj.status_code === 'pending' || proj.status_code === 'upcoming' ? 'amber' : 'slate';
                        const statusLabel = isRtl 
                          ? (proj.status_code === 'active' || !proj.status_code ? 'نشط' : 
                             proj.status_code === 'delayed' ? 'متأخر' : 
                             proj.status_code === 'pending' || proj.status_code === 'upcoming' ? 'قيد الانتظار' : 
                             proj.status_code === 'completed' ? 'مكتمل' : 'غير مدخل')
                          : (proj.status_code === 'active' || !proj.status_code ? 'Active' : 
                             proj.status_code === 'delayed' ? 'Delayed' : 
                             proj.status_code === 'pending' || proj.status_code === 'upcoming' ? 'Pending' : 
                             proj.status_code === 'completed' ? 'Completed' : 'Unknown');
                        const projectAnomaly = anomalyEnabled ? anomalies.find(a => a.projectId === proj.id) : null;
                        const projectAudit = financialAuditEnabled ? financialAudits.find(a => a.projectId === proj.id) : null;
                        const projectPredictive = predictiveImpactEnabled && predictiveImpact ? predictiveImpact.projectBreakdowns.find(pb => pb.projectId === proj.id) : null;
                        const projectSmartRebalance = smartRebalanceEnabled && smartRebalance ? smartRebalance.reallocations.find(r => r.projectId === proj.id) : null;

                        return (
                          <div 
                            key={proj.id}
                            className={`p-3 bg-white dark:bg-zinc-950 border rounded-xl hover:border-slate-300 dark:hover:border-zinc-800 transition-all flex flex-col justify-between gap-2 shadow-sm ${
                              projectAnomaly 
                                ? 'border-violet-500/30 shadow-[0_0_12px_rgba(139,92,246,0.06)] dark:shadow-[0_0_12px_rgba(139,92,246,0.03)]' 
                                : projectAudit
                                  ? 'border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.06)] dark:shadow-[0_0_12px_rgba(245,158,11,0.03)]'
                                  : projectPredictive
                                    ? 'border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.06)] dark:shadow-[0_0_12px_rgba(16,185,129,0.03)]'
                                    : projectSmartRebalance
                                      ? 'border-teal-500/30 shadow-[0_0_12px_rgba(20,184,166,0.06)] dark:shadow-[0_0_12px_rgba(20,184,166,0.03)]'
                                      : 'border-slate-200/60 dark:border-zinc-900'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                                  {projectAnomaly && <Activity className="w-3 h-3 text-violet-500 animate-pulse" />}
                                  {projectAudit && <Coins className="w-3 h-3 text-amber-500 animate-pulse" />}
                                  {projectPredictive && <Sparkles className="w-3 h-3 text-emerald-500 animate-pulse" />}
                                  {projectSmartRebalance && <Scale className="w-3 h-3 text-teal-500 animate-pulse" />}
                                  <span>{proj.code}</span>
                                </span>
                                <h5 className="text-[11px] font-black text-slate-800 dark:text-zinc-200 truncate mt-0.5">
                                  {isRtl ? proj.name_ar : (proj.name_en || proj.name_ar)}
                                </h5>
                              </div>
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border shrink-0 ${
                                statusColor === 'emerald'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                  : statusColor === 'rose'
                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                  : statusColor === 'amber'
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                    : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
                              }`}>
                                {statusLabel}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex justify-between items-center text-[9px] text-slate-400 dark:text-zinc-500 mb-0.5 font-bold">
                                  <span>{isRtl ? 'نسبة الإنجاز' : 'Progress'}</span>
                                  <span>{proj.progress_percent}%</span>
                                </div>
                                <div className="w-full h-1 bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${
                                      statusColor === 'emerald' ? 'bg-emerald-500' :
                                      statusColor === 'rose' ? 'bg-rose-500' :
                                      statusColor === 'amber' ? 'bg-amber-500' : 'bg-slate-400'
                                    }`}
                                    style={{ width: `${proj.progress_percent}%` }}
                                  />
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-[8px] text-slate-400 dark:text-zinc-500 block font-bold">
                                  {isRtl ? 'الميزانية' : 'Budget'}
                                </span>
                                <span className="text-[10px] font-black text-slate-700 dark:text-zinc-300 font-mono">
                                  {parseFloat(proj.budget || '0').toLocaleString()} {proj.currency_code}
                                </span>
                              </div>
                            </div>

                            {projectAnomaly && (
                              <div className="mt-1 p-2 bg-violet-500/5 dark:bg-violet-950/10 border border-violet-500/25 dark:border-violet-500/10 rounded-xl flex items-start gap-1.5">
                                <Activity className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5 animate-pulse" />
                                <div className="text-[9.5px] font-black text-violet-700 dark:text-violet-300 leading-snug">
                                  <span className="font-extrabold text-[8px] uppercase tracking-wide bg-violet-500/15 text-violet-600 px-1 py-0.5 rounded mr-1 select-none">
                                    {isRtl ? 'شذوذ ذكي' : 'AI ANOMALY'}
                                  </span>
                                  {isRtl ? projectAnomaly.reason_ar : projectAnomaly.reason_en}
                                </div>
                              </div>
                            )}

                            {projectAudit && (
                              <div className="mt-1 p-2 bg-amber-500/5 dark:bg-amber-950/10 border border-amber-500/25 dark:border-amber-500/10 rounded-xl flex flex-col gap-1.5 animate-fade-in">
                                <div className="flex items-start gap-1.5">
                                  <Coins className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                  <div className="text-[9.5px] font-black text-amber-700 dark:text-amber-300 leading-snug">
                                    <span className="font-extrabold text-[8px] uppercase tracking-wide bg-amber-500/15 text-amber-600 px-1 py-0.5 rounded mr-1 select-none">
                                      {isRtl ? 'تدقيق مالي' : 'FINANCIAL AUDIT'}
                                    </span>
                                    <span className="text-[8px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded select-none mr-1 inline-block uppercase tracking-wider">
                                      {projectAudit.issueType.replace('_', ' ')}
                                    </span>
                                    {isRtl ? projectAudit.reasonAr : projectAudit.reasonEn}
                                  </div>
                                </div>
                                <div className="text-[9px] text-amber-600/90 dark:text-amber-400/90 pl-5 leading-normal border-t border-amber-500/10 pt-1.5 mt-1 font-bold flex flex-col gap-0.5">
                                  <span className="font-black text-amber-800 dark:text-amber-300 uppercase tracking-wide text-[8px]">
                                    {isRtl ? 'التوصية المقترحة من النظام:' : 'Mitigation Action / Recommendation:'}
                                  </span>
                                  <span>{isRtl ? projectAudit.recommendationAr : projectAudit.recommendationEn}</span>
                                </div>
                              </div>
                            )}

                            {projectPredictive && (
                              <div className="mt-1 p-2 bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/25 dark:border-emerald-500/10 rounded-xl flex flex-col gap-1.5 animate-fade-in text-[10px]">
                                <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-emerald-500/10 mb-1.5 font-bold">
                                  <div className="flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    <span className="font-extrabold text-[8px] uppercase tracking-wide bg-emerald-500/15 text-emerald-600 px-1 py-0.5 rounded select-none">
                                      {isRtl ? 'أثر الربع القادم' : 'NEXT Q IMPACT'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[9px] font-mono">
                                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400">
                                      {isRtl ? 'النجاح:' : 'Success:'} <b className="font-black">{projectPredictive.successProbability}%</b>
                                    </span>
                                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400">
                                      {isRtl ? 'الأثر:' : 'Impact:'} <b className="font-black">{projectPredictive.impactScore}/10</b>
                                    </span>
                                  </div>
                                </div>
                                <div className="text-[9.5px] font-bold text-emerald-800 dark:text-emerald-300 leading-snug">
                                  <span className="block text-[8px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-extrabold mb-0.5">
                                    {isRtl ? 'التأثير المجتمعي والتنموي المتوقع:' : 'Estimated Community Social Impact:'}
                                  </span>
                                  {isRtl ? projectPredictive.socialImpactAr : projectPredictive.socialImpactEn}
                                </div>
                                <div className="text-[9.5px] font-bold text-amber-700 dark:text-amber-400 leading-snug pt-1 border-t border-emerald-500/5 mt-1">
                                  <span className="block text-[8px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-extrabold mb-0.5">
                                    {isRtl ? 'التأثير والاستدامة المالية:' : 'Estimated Financial Returns & Sustainability:'}
                                  </span>
                                  {isRtl ? projectPredictive.financialImpactAr : projectPredictive.financialImpactEn}
                                </div>
                              </div>
                            )}

                            {projectSmartRebalance && (
                              <div className="mt-1 p-2 bg-teal-500/5 dark:bg-teal-950/10 border border-teal-500/25 dark:border-teal-500/10 rounded-xl flex flex-col gap-1.5 animate-fade-in text-[10px]">
                                <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-teal-500/10 mb-1.5 font-bold">
                                  <div className="flex items-center gap-1">
                                    <Scale className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                                    <span className="font-extrabold text-[8px] uppercase tracking-wide bg-teal-500/15 text-teal-600 px-1 py-0.5 rounded select-none">
                                      {isRtl ? 'إعادة التوازن الذكي' : 'SMART REBALANCE'}
                                    </span>
                                  </div>
                                  <div className={`font-mono font-black ${
                                    projectSmartRebalance.netChange > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                                    projectSmartRebalance.netChange < 0 ? 'text-rose-600 dark:text-rose-400' :
                                    'text-slate-400'
                                  }`}>
                                    {projectSmartRebalance.netChange > 0 ? '+' : ''}${projectSmartRebalance.netChange.toLocaleString()}
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[9px] font-mono mb-1 bg-white/40 dark:bg-zinc-950/40 p-1.5 rounded border border-teal-500/5">
                                  <div>
                                    <span className="text-slate-400 dark:text-zinc-500 text-[8px] block">{isRtl ? 'الميزانية الأصلية' : 'ORIGINAL'}</span>
                                    <span className="font-bold text-slate-700 dark:text-zinc-300">${projectSmartRebalance.originalBudget.toLocaleString()}</span>
                                  </div>
                                  <div>
                                    <span className="text-teal-500 dark:text-teal-400 text-[8px] block">{isRtl ? 'المقترحة الجديدة' : 'PROPOSED NEW'}</span>
                                    <span className="font-black text-teal-600 dark:text-teal-400">${projectSmartRebalance.suggestedBudget.toLocaleString()}</span>
                                  </div>
                                </div>
                                <div className="text-[9.5px] font-bold text-teal-800 dark:text-teal-300 leading-snug">
                                  <span className="block text-[8px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-extrabold mb-0.5">
                                    {isRtl ? 'مبررات التعديل المالي:' : 'Adjustment Justification:'}
                                  </span>
                                  {isRtl ? projectSmartRebalance.justificationAr : projectSmartRebalance.justificationEn}
                                </div>
                              </div>
                            )}

                            {/* Archive / Unarchive Actions */}
                            {(isProjCompleted || archivedProjectIds.includes(proj.id)) && (
                              <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-zinc-900/60 pt-2 mt-1">
                                {archivedProjectIds.includes(proj.id) ? (
                                  <button
                                    onClick={() => unarchiveProject(proj.id)}
                                    className="flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-black rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 cursor-pointer transition-all border border-emerald-500/10"
                                    title={isRtl ? 'استعادة المشروع إلى القائمة النشطة' : 'Restore project to active list'}
                                  >
                                    <Layers className="w-3 h-3" />
                                    <span>{isRtl ? 'استعادة النشاط' : 'Restore Active'}</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => archiveProject(proj.id)}
                                    className="flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-black rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 cursor-pointer transition-all border border-amber-500/10"
                                    title={isRtl ? 'نقل المشروع إلى الأرشيف لتنظيف اللوحة' : 'Move to archive to clean the dashboard'}
                                  >
                                    <Archive className="w-3 h-3" />
                                    <span>{isRtl ? 'نقل للأرشيف' : 'Archive Project'}</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Informative text & quick tips */}
              <div className="flex items-start gap-2 text-[10px] bg-slate-50/70 dark:bg-zinc-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-900">
                <Info className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-zinc-500 mt-0.5" />
                <p className="text-slate-500 dark:text-zinc-400 leading-relaxed font-semibold">
                  {isRtl 
                    ? `يتكامل هذا الشريط تلقائياً مع نظام استيراد البيانات وقاعدة البيانات اللحظية. متبقي عدد ${pendingCount} مشاريع قيد الاعتماد والدعم لإطلاقها ميدانياً.` 
                    : `This indicator dynamically aggregates real-time records. There are currently ${pendingCount} pending portfolios awaiting board authorization and allocation.`}
                </p>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Tools Suite Modal */}
      <ExportToolsModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        titleAr={`تصدير قائمة المشاريع - تصفية: ${
          statusFilter === 'all' ? 'بريد إلكتروني' :
          statusFilter === 'active' ? 'النشطة' :
          statusFilter === 'pending' ? 'قيد الانتظار' : 'الالتزام'
        }`}
        titleEn={`Export Projects List - Filter: ${
          statusFilter === 'all' ? 'All' :
          statusFilter === 'active' ? 'Active' :
          statusFilter === 'pending' ? 'Pending' : 'Delayed'
        }`}
        data={filteredProjects.map(proj => {
          return isRtl ? {
            'نوع الإيراد': proj.code || '',
            'قيد التنفيذ': proj.name_ar || '',
            'عالية': proj.description || '',
            'متوسطة': proj.status_code === 'active' || !proj.status_code ? 'حرج' : 
                      proj.status_code === 'delayed' ? 'تحذير' : 
                      proj.status_code === 'pending' || proj.status_code === 'upcoming' ? 'نسخ المسارات' : 
                      proj.status_code === 'completed' ? 'تعميد' : 'ربع سنوي',
            'نسبة التقدم (%)': `${proj.progress_percent || '0'}%`,
            'مستخدمين معتمدين': `${parseFloat(proj.budget || '0').toLocaleString()} ${proj.currency_code}`,
            'الكمية المطلوبة': proj.location_name || '',
            'المستخدمون والصلاحيات': proj.target_beneficiaries || 0,
            'المستخدمون والكوادر': proj.actual_beneficiaries || 0,
            'إقليم إغاثي': proj.start_date ? new Date(proj.start_date).toLocaleDateString('ar-YE') : '',
            'تعليم وتجهيزات': proj.end_date ? new Date(proj.end_date).toLocaleDateString('ar-YE') : '',
            'منصور العولقي': proj.risk_level || 'NORMAL',
            'تحديث البيانات': proj.priority_code || 'NORMAL'
          } : {
            'Project Code': proj.code || '',
            'Project Name': proj.name_en || proj.name_ar || '',
            'Description': proj.description || '',
            'Status': proj.status_code === 'active' || !proj.status_code ? 'Active' : 
                      proj.status_code === 'delayed' ? 'Delayed' : 
                      proj.status_code === 'pending' || proj.status_code === 'upcoming' ? 'Pending' : 
                      proj.status_code === 'completed' ? 'Completed' : 'Unknown',
            'Progress (%)': `${proj.progress_percent || '0'}%`,
            'Estimated Budget': `${parseFloat(proj.budget || '0').toLocaleString()} ${proj.currency_code}`,
            'Location': proj.location_name || '',
            'Target Beneficiaries': proj.target_beneficiaries || 0,
            'Actual Beneficiaries': proj.actual_beneficiaries || 0,
            'Start Date': proj.start_date ? new Date(proj.start_date).toLocaleDateString('en-US') : '',
            'End Date': proj.end_date ? new Date(proj.end_date).toLocaleDateString('en-US') : '',
            'Risk Level': proj.risk_level || 'NORMAL',
            'Priority Level': proj.priority_code || 'NORMAL'
          };
        })}
        fileName={`NexoraOS_Projects_${statusFilter}_Report`}
        lang={lang}
      />
    </div>
  );
}
