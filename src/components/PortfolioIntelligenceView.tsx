/**
 * NexoraOS™ — NEB-02/03/04: Portfolio Intelligence View
 *
 * The unified, engine-backed PPM cockpit. This is the single source of truth
 * for portfolio oversight: it reads REAL records from the live Neon PostgreSQL
 * database through the V2 engine routes (v_* analytical views + CPM + EVM +
 * Balanced-Scorecard). No static snapshot is ever shown — errors surface
 * visibly so operators always see live truth.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers, Target, TrendingUp, ShieldAlert, Gauge, GitBranch,
  AlertTriangle, RefreshCw, Activity as ActivityIcon, CheckCircle2, Brain
} from 'lucide-react';
import { ModuleShell } from './enterprise/ModuleShell';
import { ErrorBoundary } from '../app/components/ErrorBoundary';
import { ppmApi } from '../core/ppm/ppmData';

interface PortfolioIntelligenceViewProps {
  lang: 'ar' | 'en';
  onNavigate?: (tab: string) => void;
}

interface ScorecardRow {
  projectId?: string;
  projectName?: string;
  totalScore?: number;
  rating?: string;
  dimensions?: Array<{ dimension: string; weight: number; score: number; detail: Record<string, any> }>;
}

interface CpmTask {
  id: string;
  name: string;
  type: string;
  is_critical: boolean;
  is_milestone: boolean;
  progress_percent: number;
  es?: number | null;
  ef?: number | null;
  ls?: number | null;
  lf?: number | null;
  slack?: number | null;
}

function fmtNum(v: any, digits = 0): string {
  const n = Number(v ?? 0);
  return n.toLocaleString('en-US', { maximumFractionDigits: digits });
}

function ratingColor(rating?: string): string {
  switch (rating) {
    case 'EXCELLENT': return 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40';
    case 'GOOD': return 'text-teal-600 dark:text-teal-400 border-teal-500/30 bg-teal-50 dark:bg-teal-950/40';
    case 'FAIR': return 'text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-50 dark:bg-amber-950/40';
    default: return 'text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-50 dark:bg-rose-950/40';
  }
}

const dimensionLabels: Record<string, { ar: string; en: string }> = {
  financial: { ar: 'المالي', en: 'Financial' },
  beneficiary: { ar: 'أثر المستفيدين', en: 'Beneficiary' },
  delivery: { ar: 'التنفيذ', en: 'Delivery' },
  risk: { ar: 'المخاطر', en: 'Risk' },
};

export default function PortfolioIntelligenceView({ lang, onNavigate }: PortfolioIntelligenceViewProps) {
  const isAr = lang === 'ar';

  const [ranking, setRanking] = useState<ScorecardRow[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [cpm, setCpm] = useState<any>(null);
  const [evm, setEvm] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [scoreRes, overviewRes] = await Promise.all([
      ppmApi.getScorecard(),
      ppmApi.getPortfolioOverview(),
    ]);
    if (scoreRes.ok) {
      setRanking(scoreRes.data);
    } else {
      setError(scoreRes.error || 'Scorecard unavailable');
    }
    if (overviewRes.ok) {
      setOverview(overviewRes.data);
      if (!selectedProjectId && overviewRes.data.projects && overviewRes.data.projects.length > 0) {
        setSelectedProjectId(overviewRes.data.projects[0].project_id || overviewRes.data.projects[0].id || '');
      }
    }
    setLoading(false);
  }, [selectedProjectId]);

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const loadDetail = useCallback(async (projectId: string) => {
    if (!projectId) return;
    setDetailLoading(true);
    setDetailError(null);
    const [cpmRes, evmRes] = await Promise.all([
      ppmApi.getCriticalPath(projectId),
      ppmApi.getEVM(projectId),
    ]);
    setCpm(cpmRes.ok ? cpmRes.data : (cpmRes.error ? null : null));
    setEvm(evmRes.ok ? evmRes.data : null);
    if (!cpmRes.ok) setDetailError(cpmRes.error || null);
    setDetailLoading(false);
  }, []);

  useEffect(() => {
    if (selectedProjectId) loadDetail(selectedProjectId);
  }, [selectedProjectId, loadDetail]);

  const projects = overview?.projects || [];
  const avgScore = ranking.length
    ? Math.round(ranking.reduce((s, r) => s + Number(r.totalScore || 0), 0) / ranking.length)
    : 0;

  const criticalTasks = (cpm?.network || []).filter((t: CpmTask) => t.is_critical);
  const nextProject = ranking.find((r) => r.projectId === selectedProjectId);
  const evmSource = evm?.source === 'earned_value_metrics' ? (isAr ? 'سجلّ EVM موثّق' : 'Verified EVM ledger') : (isAr ? 'محسوب' : 'computed');

  return (
    <ErrorBoundary domainName="PortfolioIntelligenceView" lang={lang || 'ar'}>
      <ModuleShell
        titleAr="ذكاء المحفظة المشروعية (PPM)"
        titleEn="Portfolio Intelligence (PPM)"
        descAr="لوحة موحّدة تعتمد على المحرك وتقرأ بيانات حقيقية: تصنيف متوازن، مسار حرج، وتخطيط قيمة مكتسب"
        descEn="Engine-backed cockpit reading real data: Balanced Scorecard ranking, Critical Path, and Earned Value"
        domainCode="NEB-02"
        icon={Layers}
        accent="emerald"
        lang={lang}
        onRefresh={load}
        onNavigate={onNavigate}
        recordCount={ranking.length}
        isLoading={loading}
        actions={
          <button onClick={load} className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" /> {isAr ? 'تحديث' : 'Refresh'}
          </button>
        }
      >
        {error && (
          <div className="mb-4 px-4 py-3 rounded-2xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{isAr ? 'تعذّر جلب البيانات الحيّة من المحرك.' : 'Failed to fetch live data from engine.'} {error}</span>
          </div>
        )}

        {/* Executive summary strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: isAr ? 'مشاريع' : 'Projects', value: fmtNum(overview?.summary?.totalProjects ?? ranking.length), icon: <Layers className="w-4 h-4" />, color: 'from-slate-900 to-emerald-900' },
            { label: isAr ? 'برامج' : 'Programs', value: fmtNum(overview?.summary?.totalPrograms), icon: <Target className="w-4 h-4" />, color: 'from-emerald-900 to-teal-900' },
            { label: isAr ? 'متوسط النقاط' : 'Avg Score', value: `${avgScore}/100`, icon: <Gauge className="w-4 h-4" />, color: 'from-teal-900 to-cyan-900' },
            { label: isAr ? 'في خطر' : 'At Risk', value: fmtNum(overview?.summary?.atRiskProjects), icon: <ShieldAlert className="w-4 h-4" />, color: 'from-rose-800 to-rose-950' },
          ].map((k, i) => (
            <div key={i} className={`rounded-2xl bg-gradient-to-br ${k.color} p-4 text-white shadow-lg border border-white/10`}>
              <div className="flex items-center gap-2 text-white/70 text-[10px] font-bold mb-2">{k.icon}{k.label}</div>
              <div className="text-2xl font-black">{k.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Scorecard ranking */}
          <div className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3 text-sm font-black text-slate-800 dark:text-zinc-100">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              {isAr ? 'تصنيف الصحة الاستراتيجي (Balanced Scorecard)' : 'Strategic Health Ranking (Balanced Scorecard)'}
            </div>
            {ranking.length === 0 ? (
              <div className="py-8 text-center text-xs font-bold text-slate-400">
                {isAr ? 'لا مشاريع مصنّفة بعد.' : 'No ranked projects yet.'}
              </div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {ranking.map((r, i) => (
                  <button
                    key={r.projectId || i}
                    onClick={() => setSelectedProjectId(r.projectId || '')}
                    className={`w-full text-left flex items-center justify-between gap-2 p-3 rounded-2xl border cursor-pointer transition
                      ${selectedProjectId === r.projectId ? 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/40' : 'border-slate-100 dark:border-zinc-800 hover:border-emerald-300'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 shrink-0 rounded-lg bg-slate-900 text-white text-[10px] font-black flex items-center justify-center">{i + 1}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-800 dark:text-zinc-100 truncate">{r.projectName}</div>
                        <div className="text-[10px] font-bold text-slate-400">{isAr ? 'النقاط' : 'Score'}: {fmtNum(r.totalScore)}/100</div>
                      </div>
                    </div>
                    <span className={`shrink-0 text-[9px] font-black px-2 py-1 rounded-lg border ${ratingColor(r.rating)}`}>
                      {r.rating}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Selected project intelligence */}
          <div className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3 text-sm font-black text-slate-800 dark:text-zinc-100">
              <Brain className="w-4 h-4 text-emerald-600" />
              {isAr ? 'تحليل المشروع: المسار الحرج و EVM' : 'Project Analysis: Critical Path & EVM'}
            </div>

            {detailLoading ? (
              <div className="py-8 text-center text-xs font-bold text-slate-400">{isAr ? 'جارِ التحليل...' : 'Analyzing...'}</div>
            ) : (!selectedProjectId && !detailError) ? (
              <div className="py-8 text-center text-xs font-bold text-slate-400">{isAr ? 'اختر مشروعًا من التصنيف لعرض تحليله.' : 'Select a project from the ranking to analyze.'}</div>
            ) : (
              <div className="space-y-3">
                {detailError && (
                  <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> {detailError}
                  </div>
                )}

                {/* Dimension bars of the selected project */}
                {nextProject && nextProject.dimensions && (
                  <div className="space-y-2">
                    {nextProject.dimensions.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                        <span className="w-20 shrink-0">{isAr ? dimensionLabels[d.dimension]?.ar : dimensionLabels[d.dimension]?.en}</span>
                        <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, d.score ?? 0)}%` }} />
                        </div>
                        <span className="w-8 text-right">{fmtNum(d.score)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* EVM panel */}
                {evm && (
                  <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                        <ActivityIcon className="w-3.5 h-3.5" /> {isAr ? 'التخطيط المكتسب (EVM)' : 'Earned Value (EVM)'}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 px-1.5 py-0.5 rounded-md">{evmSource}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { l: 'CPI', v: evm.cpi, c: 'text-emerald-700 dark:text-emerald-300' },
                        { l: 'SPI', v: evm.spi, c: 'text-cyan-700 dark:text-cyan-300' },
                        { l: 'EAC', v: fmtNum(evm.eac), c: 'text-amber-700 dark:text-amber-300' },
                        { l: 'ETC', v: fmtNum(evm.etc), c: 'text-slate-700 dark:text-zinc-200' },
                        { l: 'VAC', v: fmtNum(evm.vac), c: 'text-rose-700 dark:text-rose-300' },
                        { l: 'TCPI', v: evm.tcpi ?? '-', c: 'text-violet-700 dark:text-violet-300' },
                      ].map((m, i) => (
                        <div key={i} className="rounded-xl bg-white dark:bg-zinc-900 border border-emerald-100 dark:border-zinc-800 p-2">
                          <div className={`text-sm font-black ${m.c}`}>{m.v}</div>
                          <div className="text-[9px] font-bold text-slate-400">{m.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CPM network */}
                {cpm && (
                  <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/50 p-3">
                    <div className="flex items-center gap-1.5 mb-2 text-[10px] font-black text-slate-700 dark:text-zinc-200">
                      <GitBranch className="w-3.5 h-3.5 text-emerald-600" />
                      {isAr
                        ? `المسار الحرج (${cpm.criticalPath?.length ?? 0} مهام — ${fmtNum(cpm.criticalPathLengthDays)} يوم)`
                        : `Critical Path (${cpm.criticalPath?.length ?? 0} tasks — ${fmtNum(cpm.criticalPathLengthDays)} days)`}
                      {cpm.isCyclic && (
                        <span className="ml-auto text-[9px] font-bold text-rose-600">! {isAr ? 'دورة في الشبكة' : 'cycle detected'}</span>
                      )}
                      {cpm.derivedChain && (
                        <span className="ml-auto text-[9px] font-bold text-amber-600">
                          {isAr ? 'ترتيب افتراضي (لا روابط صريحة)' : 'derived chain (no explicit links)'}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {(criticalTasks.length ? criticalTasks : cpm.network || []).map((t: CpmTask) => (
                        <div key={t.id} className="flex items-center justify-between gap-2 text-[10px] font-bold">
                          <div className="flex items-center gap-2 min-w-0">
                            {t.is_milestone ? <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" /> : null}
                            <span className={`truncate ${t.is_critical ? 'text-slate-900 dark:text-zinc-100' : 'text-slate-500 dark:text-zinc-400'}`}>{t.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {t.slack !== null && t.slack !== undefined && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${Number(t.slack) <= 0 ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'}`}>
                                {isAr ? 'مؤجل' : 'float'}: {fmtNum(t.slack)}
                              </span>
                            )}
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${t.is_critical ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'}`}>
                              {t.is_critical ? (isAr ? 'حاسم' : 'CRITICAL') : fmtNum(t.progress_percent) + '%'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </ModuleShell>
    </ErrorBoundary>
  );
}
