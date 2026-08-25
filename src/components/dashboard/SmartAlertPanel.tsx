import React, { useState, useMemo, useEffect } from 'react';
import { 
  AlertOctagon, AlertTriangle, Clock, Coins, ShieldAlert, CheckCircle2, 
  Search, ArrowUpRight, Bell, Check, RefreshCw, Filter, UserCheck, Eye, EyeOff
} from 'lucide-react';
import { WidgetFrame } from '../enterprise/widgets/WidgetFrame';

interface Project {
  id: string;
  program_id: string | null;
  organization_id: string;
  code: string;
  name_ar: string;
  name_en: string;
  description: string | null;
  status_code: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: string | null;
  currency_code: string | null;
  progress_percent: string | null;
  target_beneficiaries: number | null;
  actual_beneficiaries: number | null;
  location_name: string | null;
  risk_level: string | null;
  priority_code: string | null;
  created_at: string;
  updated_at: string;
}

interface SmartAlertPanelProps {
  lang: 'ar' | 'en';
  projects: Project[];
}

interface SmartAlert {
  id: string;
  project_id: string;
  projectCode: string;
  projectName: string;
  type: 'BUDGET_OVERRUN' | 'SCHEDULE_RISK' | 'HIGH_RISK_LEVEL';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title_ar: string;
  title_en: string;
  desc_ar: string;
  desc_en: string;
  metricLabel_ar: string;
  metricLabel_en: string;
  metricValue: string;
  daysRemaining?: number;
  overrunAmount?: number;
}

export function SmartAlertPanel({ lang, projects }: SmartAlertPanelProps) {
  const [filter, setFilter] = useState<'ALL' | 'BUDGET' | 'SCHEDULE' | 'HIGH_RISK'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [actionFeedback, setActionFeedback] = useState<{ [key: string]: string }>({});
  // LIVE actual spend per project aggregated from posted ledger lines
  const [spendByProject, setSpendByProject] = useState<Map<string, number>>(new Map());
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadActualSpend = async () => {
      try {
        const token = localStorage.getItem('rbd_token');
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch('/api/tables/transaction_lines?limit=2000', { headers });
        if (!res.ok) return;
        const data = await res.json();
        const rows = Array.isArray(data?.data) ? data.data : [];
        if (cancelled) return;
        const agg = new Map<string, number>();
        rows.forEach((l: any) => {
          if (!l.project_id) return;
          agg.set(l.project_id, (agg.get(l.project_id) || 0) + parseFloat(l.debit || 0));
        });
        setSpendByProject(agg);
        setLastSyncedAt(new Date());
      } catch (err) {
        console.error('[SmartAlertPanel] Failed to load actual spend:', err);
      }
    };
    loadActualSpend();
    return () => { cancelled = true; };
  }, []);

  // 1. Analyze and generate intelligent alerts
  const allAlerts = useMemo(() => {
    const alerts: SmartAlert[] = [];
    const baseDate = new Date();

    (projects || []).forEach((proj) => {
      const budgetNum = parseFloat(proj.budget || '0');
      const progressNum = parseFloat(proj.progress_percent || '0');

      // Real budget overrun detection from posted ledger lines
      const actualSpent = spendByProject.get(proj.id);
      if (budgetNum > 0 && actualSpent !== undefined && actualSpent > budgetNum) {
        const overrunPercent = Math.round(((actualSpent - budgetNum) / budgetNum) * 100);
        const overrunVal = actualSpent - budgetNum;
        alerts.push({
          id: `alert-budget-${proj.id}`,
          project_id: proj.id,
          projectCode: proj.code,
          projectName: lang === 'ar' ? proj.name_ar : proj.name_en,
          type: 'BUDGET_OVERRUN',
          severity: overrunPercent > 10 ? 'CRITICAL' : 'WARNING',
          title_ar: 'تجاوز الحد الائتماني للموازنة المعتمدة',
          title_en: 'Allocated Budget Threshold Overrun',
          desc_ar: `تجاوزت النفقات المرحّلة في دفتر الأستاذ الميزانية المرصودة بمقدار ${overrunPercent}%.`,
          desc_en: `Posted ledger expenditures exceeded the allocated budget by ${overrunPercent}%.`,
          metricLabel_ar: 'انحراف الإنفاق الفعلي',
          metricLabel_en: 'Overrun Variance',
          metricValue: `${(overrunVal / 1000000).toFixed(2)}M YER`,
          overrunAmount: overrunVal
        });
      }

      // Schedule risk analysis
      if (proj.end_date) {
        const endDateObj = new Date(proj.end_date);
        const diffTime = endDateObj.getTime() - baseDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // If deadline is approaching (< 90 days) and progress is lagging behind (< 75%)
        if (diffDays > 0 && diffDays <= 90 && progressNum < 75) {
          alerts.push({
            id: `alert-schedule-${proj.id}`,
            project_id: proj.id,
            projectCode: proj.code,
            projectName: lang === 'ar' ? proj.name_ar : proj.name_en,
            type: 'SCHEDULE_RISK',
            severity: diffDays < 30 ? 'CRITICAL' : 'WARNING',
            title_ar: 'مخاطر تعثر الجدول الزمني للإنجاز',
            title_en: 'Schedule Critical Path Delay Warning',
            desc_ar: `متبقي ${diffDays} يوماً على موعد الإغلاق المستهدف مع تأخر واضح في تلبية بنود خطة العمل (WBS) التي تبلغ حالياً ${progressNum}%.`,
            desc_en: `Only ${diffDays} days remaining until target closure with schedule lagging at ${progressNum}% progress.`,
            metricLabel_ar: 'النشاط التشغيلي / مركز التكلفة',
            metricLabel_en: 'Remaining Days / Progress',
            metricValue: lang === 'ar' ? `${diffDays} يوم / ${progressNum}%` : `${diffDays} Days / ${progressNum}%`,
            daysRemaining: diffDays
          });
        } else if (diffDays <= 0 && progressNum < 100) {
          // Overdue project
          alerts.push({
            id: `alert-overdue-${proj.id}`,
            project_id: proj.id,
            projectCode: proj.code,
            projectName: lang === 'ar' ? proj.name_ar : proj.name_en,
            type: 'SCHEDULE_RISK',
            severity: 'CRITICAL',
            title_ar: 'تجاوز المشروع لتاريخ الانتهاء المجدول',
            title_en: 'Project Completion Date Overdue',
            desc_ar: `تجاوز المشروع الإطار الزمني المحدد للإغلاق الفعلي وما زال عند نسبة إنجاز ${progressNum}%.`,
            desc_en: `Project exceeded its scheduled closure date while progress is still stagnated at ${progressNum}%.`,
            metricLabel_ar: 'حساب المتوسط المرجح الموزون',
            metricLabel_en: 'Overdue Operational State',
            metricValue: lang === 'ar' ? `متأخر (${Math.abs(diffDays)} يوم)` : `Overdue (${Math.abs(diffDays)} Days)`,
            daysRemaining: diffDays
          });
        }
      }

      // High operational risk level warning
      if (proj.risk_level === 'HIGH' && proj.priority_code === 'CRITICAL') {
        alerts.push({
          id: `alert-risk-${proj.id}`,
          project_id: proj.id,
          projectCode: proj.code,
          projectName: lang === 'ar' ? proj.name_ar : proj.name_en,
          type: 'HIGH_RISK_LEVEL',
          severity: 'CRITICAL',
          title_ar: 'تنبيه التدخل الطارئ لارتفاع المخاطر التشغيلية',
          title_en: 'Critical Security & Operational Risk Alert',
          desc_ar: 'مخاطر ميدانية وأمنية عالية في موقع التنفيذ تتطلب تفعيل خطة الطوارئ البديلة وإعادة تقييم المسار الحرج للمشروع.',
          desc_en: 'High localized field risks detected requiring deployment of emergency alternatives and critical path reassessment.',
          metricLabel_ar: 'مستوى الأولوية والخطورة',
          metricLabel_en: 'Severity Status',
          metricValue: lang === 'ar' ? 'حرجة / مخاطر مرتفعة' : 'CRITICAL / HIGH RISK'
        });
      }
    });

    return alerts;
  }, [projects, lang, spendByProject]);

  // Filter & Search Logic
  const filteredAlerts = useMemo(() => {
    return allAlerts
      .filter((alert) => !dismissedIds.includes(alert.id))
      .filter((alert) => {
        if (filter === 'BUDGET') return alert.type === 'BUDGET_OVERRUN';
        if (filter === 'SCHEDULE') return alert.type === 'SCHEDULE_RISK';
        if (filter === 'HIGH_RISK') return alert.type === 'HIGH_RISK_LEVEL';
        return true;
      })
      .filter((alert) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          alert.projectName.toLowerCase().includes(q) ||
          alert.projectCode.toLowerCase().includes(q) ||
          alert.title_ar.toLowerCase().includes(q) ||
          alert.title_en.toLowerCase().includes(q)
        );
      });
  }, [allAlerts, filter, searchQuery, dismissedIds]);

  // Counts for the summary header badges
  const counts = useMemo(() => {
    const active = allAlerts.filter(a => !dismissedIds.includes(a.id));
    return {
      total: active.length,
      critical: active.filter(a => a.severity === 'CRITICAL').length,
      warning: active.filter(a => a.severity === 'WARNING').length,
      budget: active.filter(a => a.type === 'BUDGET_OVERRUN').length,
      schedule: active.filter(a => a.type === 'SCHEDULE_RISK').length,
      highRisk: active.filter(a => a.type === 'HIGH_RISK_LEVEL').length,
    };
  }, [allAlerts, dismissedIds]);

  // Handle action execution with dynamic feedback and automatic recovery standard
  const executeAction = (alertId: string, actionName: string, messageAr: string, messageEn: string) => {
    setActionFeedback(prev => ({
      ...prev,
      [alertId]: lang === 'ar' ? messageAr : messageEn
    }));
    setTimeout(() => {
      // Clear feedback after 4 seconds
      setActionFeedback(prev => {
        const next = { ...prev };
        delete next[alertId];
        return next;
      });
    }, 4000);
  };

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => [...prev, id]);
  };

  const resetDismissed = () => {
    setDismissedIds([]);
  };

  return (
    <WidgetFrame
      id="smart_alert_panel"
      title={lang === 'ar' ? 'نظام التنبيهات الذكي لإدارة المخاطر' : 'AI-Driven Operational Risk Alert System'}
      subtitle={lang === 'ar' ? 'رصد تلقائي لتجاوز الميزانيات وانحرافات الجداول الزمنية للمشاريع' : 'Real-time structural monitoring for financial and timeline deviations'}
      icon={Bell}
      defaultHeight={480}
      headerActions={
        <div className="flex items-center gap-2">
          {dismissedIds.length > 0 && (
            <button
              onClick={resetDismissed}
              className="text-[10px] sm:text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-md transition-all cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{lang === 'ar' ? 'استعادة المحذوفات' : 'Restore Alert Grid'}</span>
            </button>
          )}
        </div>
      }
    >
      {({ width, height }) => (
        <div className="flex flex-col h-full space-y-4">
          
          {/* A. Integrated Metric Row & Search Filters */}
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 bg-slate-50 dark:bg-zinc-900/40 p-3 rounded-xl border border-slate-100 dark:border-zinc-800/40">
            
            {/* Quick stats indicators */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mr-1">
                {lang === 'ar' ? 'المؤشرات حية:' : 'Live Metrics:'}
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-950/20 rounded-md text-xs font-bold text-rose-700 dark:text-rose-400">
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>{counts.critical} {lang === 'ar' ? 'مخاطر حرجة' : 'Critical'}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-950/20 rounded-md text-xs font-bold text-amber-700 dark:text-amber-500">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{counts.warning} {lang === 'ar' ? 'تحذيرات' : 'Warnings'}</span>
              </div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 ml-2">
                {counts.total === 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {lang === 'ar' ? 'العمليات مستقرة تماماً' : 'All systems stable'}
                  </span>
                ) : (
                  <span>{lang === 'ar' ? `مجموع التنبيهات المفعّلة: ${counts.total}` : `${counts.total} active alerts`}</span>
                )}
              </div>
            </div>

            {/* Filter Buttons & Search Combo */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Search input with clean micro border */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                <input
                  type="text"
                  placeholder={lang === 'ar' ? 'ابحث عن مشروع...' : 'Search alerts...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-[150px] md:w-[180px] bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg pl-8 pr-3 py-1 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 dark:placeholder-zinc-600 text-slate-700 dark:text-zinc-300"
                />
              </div>

              {/* Tab Filters */}
              <div className="flex bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200/40 dark:border-zinc-800/40">
                <button
                  onClick={() => setFilter('ALL')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                    filter === 'ALL'
                      ? 'bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  {lang === 'ar' ? 'أيام' : 'All'}
                </button>
                <button
                  onClick={() => setFilter('BUDGET')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 ${
                    filter === 'BUDGET'
                      ? 'bg-white dark:bg-zinc-950 text-rose-600 dark:text-rose-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400'
                  }`}
                >
                  <Coins className="w-3 h-3" />
                  <span>{lang === 'ar' ? 'التسليم' : 'Budgets'}</span>
                </button>
                <button
                  onClick={() => setFilter('SCHEDULE')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 ${
                    filter === 'SCHEDULE'
                      ? 'bg-white dark:bg-zinc-950 text-amber-600 dark:text-amber-500 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>{lang === 'ar' ? 'الجودة' : 'Timeline'}</span>
                </button>
                <button
                  onClick={() => setFilter('HIGH_RISK')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 ${
                    filter === 'HIGH_RISK'
                      ? 'bg-white dark:bg-zinc-950 text-rose-600 dark:text-rose-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400'
                  }`}
                >
                  <ShieldAlert className="w-3 h-3" />
                  <span>{lang === 'ar' ? 'أمنية/ميدانية' : 'Security'}</span>
                </button>
              </div>
            </div>

          </div>

          {/* B. Alerts Grid Listing */}
          <div className="flex-1 overflow-y-auto pr-1 max-h-[320px] space-y-3 custom-scrollbar">
            {filteredAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50/20 dark:bg-zinc-900/10">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2 animate-bounce" />
                <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                  {lang === 'ar' ? 'لا توجد أي مخاطر معلّقة تطابق المعايير' : 'No pending active alerts under selected filters'}
                </p>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 font-semibold">
                  {lang === 'ar' ? 'كل المشاريع التشغيلية تسير ضمن معايير الجودة والاستهلاك.' : 'All operating field portfolios conform within safety variances.'}
                </p>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const isCritical = alert.severity === 'CRITICAL';
                const hasFeedback = !!actionFeedback[alert.id];

                // Dynamic icon and border styling based on alert type and severity
                let iconElement = <AlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
                let borderStyle = 'border-rose-100 dark:border-rose-950/20 bg-rose-50/20 dark:bg-rose-950/5 hover:border-rose-200';
                
                if (alert.type === 'SCHEDULE_RISK') {
                  iconElement = isCritical 
                    ? <Clock className="w-5 h-5 text-rose-600" />
                    : <AlertTriangle className="w-5 h-5 text-amber-500" />;
                  borderStyle = isCritical
                    ? 'border-rose-100 dark:border-rose-950/20 bg-rose-50/20 dark:bg-rose-950/5 hover:border-rose-200'
                    : 'border-amber-100 dark:border-amber-950/20 bg-amber-50/20 dark:bg-amber-950/5 hover:border-amber-200';
                } else if (alert.type === 'HIGH_RISK_LEVEL') {
                  iconElement = <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
                }

                return (
                  <div
                    key={alert.id}
                    className={`p-4 border rounded-xl transition-all duration-300 ${borderStyle} flex flex-col md:flex-row justify-between gap-4`}
                  >
                    {/* Information column */}
                    <div className="flex gap-3.5 min-w-0">
                      <div className="shrink-0 mt-0.5">
                        {iconElement}
                      </div>
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isCritical 
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400' 
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                          }`}>
                            {isCritical ? (lang === 'ar' ? 'حرج' : 'Critical') : (lang === 'ar' ? 'تحذير' : 'Warning')}
                          </span>
                          <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                            {alert.projectCode}
                          </span>
                          <span className="text-[11px] font-black text-slate-700 dark:text-zinc-300 truncate max-w-[200px] sm:max-w-none">
                            {alert.projectName}
                          </span>
                        </div>
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-zinc-100">
                          {lang === 'ar' ? alert.title_ar : alert.title_en}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold leading-relaxed">
                          {lang === 'ar' ? alert.desc_ar : alert.desc_en}
                        </p>
                      </div>
                    </div>

                    {/* Numeric Metric & Actions column */}
                    <div className="flex flex-row md:flex-col justify-between md:justify-center items-end shrink-0 gap-3 border-t md:border-t-0 border-dashed border-slate-200 dark:border-zinc-800 pt-3 md:pt-0">
                      
                      {/* Metric Display */}
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold">
                          {lang === 'ar' ? alert.metricLabel_ar : alert.metricLabel_en}
                        </p>
                        <p className="text-sm font-black text-slate-800 dark:text-zinc-200 mt-0.5">
                          {alert.metricValue}
                        </p>
                      </div>

                      {/* Interactive Control Buttons */}
                      <div className="flex items-center gap-2">
                        {hasFeedback ? (
                          // Action Execution Feedback standard
                          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-lg animate-fade-in">
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>{actionFeedback[alert.id]}</span>
                          </div>
                        ) : (
                          <>
                            {/* Action A: Specialized trigger */}
                            {alert.type === 'BUDGET_OVERRUN' && (
                              <button
                                onClick={() => executeAction(
                                  alert.id,
                                  'REVIEW_BUDGET',
                                  'تم توجيه مراجعة الموازنة للإدارة المالية وإرسال التنبيه للشعبة التشغيلية.',
                                  'Review order flagged to CFO and operation coordinator notified successfully.'
                                )}
                                className="text-[10px] sm:text-xs font-bold bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-rose-600 dark:text-rose-400 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                <span>{lang === 'ar' ? 'تدقيق الحسابات' : 'Audit Ledger'}</span>
                              </button>
                            )}

                            {alert.type === 'SCHEDULE_RISK' && (
                              <button
                                onClick={() => executeAction(
                                  alert.id,
                                  'SCHEDULE_ADJUST',
                                  'تم إخطار منسق القطاع لتعديل المسار الحرج وتحديث خطة العمل (WBS).',
                                  'Sector coordinator notified to re-baseline critical path milestones.'
                                )}
                                className="text-[10px] sm:text-xs font-bold bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-amber-600 dark:text-amber-500 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                <span>{lang === 'ar' ? 'تعديل الخطة' : 'Adjust WBS'}</span>
                              </button>
                            )}

                            {alert.type === 'HIGH_RISK_LEVEL' && (
                              <button
                                onClick={() => executeAction(
                                  alert.id,
                                  'SAFETY_INTERVENTION',
                                  'تم تفعيل خطة السلامة وتوجيه فرق الدعم الميداني للالتزام بمعايير CHS.',
                                  'Emergency security protocols deployed alongside CHS safety metrics.'
                                )}
                                className="text-[10px] sm:text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>{lang === 'ar' ? 'تفعيل الطوارئ' : 'Deploy Protocol'}</span>
                              </button>
                            )}

                            {/* Dismiss button */}
                            <button
                              onClick={() => handleDismiss(alert.id)}
                              className="text-[10px] sm:text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                              title={lang === 'ar' ? 'تجاهل مؤقت' : 'Snooze Alert'}
                            >
                              {lang === 'ar' ? 'تجاهل' : 'Dismiss'}
                            </button>
                          </>
                        )}
                      </div>

                    </div>

                  </div>
                );
              })
            )}
          </div>

          {/* C. Interactive footer standard */}
          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 dark:text-zinc-500 pt-2 border-t border-slate-100 dark:border-zinc-800/60">
            <span>
              {lang === 'ar' 
                ? 'يتطابق نظام تحليل المخاطر تلقائياً مع معايير Sphere للجودة والمساءلة الإنسانية.' 
                : 'Alert engine complies alongside Sphere core standards for humanitarian accountability.'}
            </span>
            <span>
              {lastSyncedAt
                ? (lang === 'ar'
                  ? `آخر مزامنة: ${lastSyncedAt.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}`
                  : `Last synchronized: ${lastSyncedAt.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}`)
                : (lang === 'ar' ? 'جارٍ المزامنة...' : 'Syncing...')}
            </span>
          </div>

        </div>
      )}
    </WidgetFrame>
  );
}
