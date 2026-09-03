// ═══════════════════════════════════════════════════════════════════════════════
// UAMEX ERP™ — AI Intelligence Insights Panel (NEB-13)
// Gemini AI + Sphere/CHS Impact Analysis
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles, Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Lightbulb, Zap, BarChart3, PieChart, Activity, Target, Users, DollarSign,
  Heart, Briefcase, Calendar, Clock, ArrowUpRight, ArrowDownRight,
  ChevronRight, RefreshCw, ExternalLink, MessageSquare, BrainCircuit,
  Layers, Shield, Award, Cpu, Database, Globe, Sun, Moon
} from 'lucide-react';
import { Badge } from '../../shared/components';

type Lang = 'ar' | 'en';
type Theme = 'light' | 'dark';
type InsightType = 'opportunity' | 'risk' | 'recommendation' | 'trend' | 'anomaly';

export interface AIInsight {
  id: string;
  type: InsightType;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  confidence: number; // 0-100
  impact: 'low' | 'medium' | 'high' | 'critical';
  domain: string; // NEB code
  actions?: { labelAr: string; labelEn: string; onClick: () => void }[];
  timestamp: Date;
  source: 'gemini' | 'sphere' | 'chs' | 'ipsas';
  metrics?: { labelAr: string; labelEn: string; value: string; change?: number }[];
}

export interface AIInsightsPanelProps {
  lang: Lang;
  theme: Theme;
  insights: AIInsight[];
  loading?: boolean;
  onRefresh?: () => void;
  onInsightClick?: (insight: AIInsight) => void;
  onGeminiQuery?: (query: string) => Promise<string>;
  compact?: boolean;
}

const TYPE_CONFIG: Record<InsightType, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; labelAr: string; labelEn: string }> = {
  opportunity: {
    icon: Lightbulb,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-950/30',
    labelAr: 'فرصة',
    labelEn: 'Opportunity',
  },
  risk: {
    icon: AlertTriangle,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-100 dark:bg-rose-950/30',
    labelAr: 'مخاطرة',
    labelEn: 'Risk',
  },
  recommendation: {
    icon: Sparkles,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-950/30',
    labelAr: 'توصية',
    labelEn: 'Recommendation',
  },
  trend: {
    icon: TrendingUp,
    color: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-100 dark:bg-sky-950/30',
    labelAr: 'اتجاه',
    labelEn: 'Trend',
  },
  anomaly: {
    icon: Activity,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-100 dark:bg-violet-950/30',
    labelAr: 'شذوذ',
    labelEn: 'Anomaly',
  },
};

const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  gemini: { label: 'Gemini AI', color: 'text-blue-600 dark:text-blue-400' },
  sphere: { label: 'Sphere', color: 'text-emerald-600 dark:text-emerald-400' },
  chs: { label: 'CHS', color: 'text-amber-600 dark:text-amber-400' },
  ipsas: { label: 'IPSAS', color: 'text-slate-600 dark:text-slate-400' },
};

const IMPACT_BORDER: Record<string, string> = {
  low: 'border-slate-300 dark:border-zinc-700',
  medium: 'border-amber-400 dark:border-amber-600',
  high: 'border-rose-400 dark:border-rose-600',
  critical: 'border-rose-600 dark:border-rose-400 animate-pulse',
};

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
  lang,
  theme,
  insights,
  loading = false,
  onRefresh,
  onInsightClick,
  onGeminiQuery,
  compact = false,
}) => {
  const [activeFilter, setActiveFilter] = useState<InsightType | 'all'>('all');
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);
  const [chatQuery, setChatQuery] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const filteredInsights = useMemo(() => {
    if (activeFilter === 'all') return insights;
    return insights.filter(i => i.type === activeFilter);
  }, [insights, activeFilter]);

  const stats = useMemo(() => {
    const critical = insights.filter(i => i.impact === 'critical').length;
    const high = insights.filter(i => i.impact === 'high').length;
    const avgConfidence = insights.length > 0
      ? Math.round(insights.reduce((s, i) => s + i.confidence, 0) / insights.length)
      : 0;
    return { critical, high, avgConfidence, total: insights.length };
  }, [insights]);

  const handleChat = async () => {
    if (!chatQuery || !onGeminiQuery) return;
    setChatLoading(true);
    setChatResponse('');
    try {
      const resp = await onGeminiQuery(chatQuery);
      setChatResponse(resp);
    } catch (e) {
      setChatResponse(t('حدث خطأ في المعالجة', 'An error occurred'));
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              {t('الرؤى الذكية', 'AI Insights')}
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold">
              {t('NEB-13 | الذكاء الاصطناعي والتحليلات', 'NEB-13 | AI Intelligence & Analytics')}
            </p>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label={t('تحديث', 'Refresh')}
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 dark:text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: t('حرجة', 'Critical'), value: stats.critical, tone: 'rose' as const, icon: AlertTriangle },
          { label: t('عالية', 'High'), value: stats.high, tone: 'amber' as const, icon: TrendingUp },
          { label: t('متوسط الثقة', 'Avg Confidence'), value: `${stats.avgConfidence}%`, tone: 'sky' as const, icon: Brain },
          { label: t('الإجمالي', 'Total'), value: stats.total, tone: 'emerald' as const, icon: Layers },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <stat.icon className={`w-3 h-3 ${
                stat.tone === 'rose' ? 'text-rose-600' :
                stat.tone === 'amber' ? 'text-amber-600' :
                stat.tone === 'sky' ? 'text-sky-600' : 'text-emerald-600'
              }`} />
              <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-500">{stat.label}</span>
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-zinc-800/50 rounded-xl overflow-x-auto">
        {[
          { id: 'all', label: t('الكل', 'All'), count: insights.length },
          ...Object.entries(TYPE_CONFIG).map(([id, cfg]) => ({
            id,
            label: lang === 'ar' ? cfg.labelAr : cfg.labelEn,
            count: insights.filter(i => i.type === id).length,
          })),
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id as any)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-black flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeFilter === filter.id
                ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700'
            }`}
          >
            {filter.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${
              activeFilter === filter.id
                ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-500'
            }`}>
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Insights list */}
      <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-4 animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-2/3 mb-2" />
                <div className="h-3 bg-slate-100 dark:bg-zinc-800/50 rounded w-full mb-1" />
                <div className="h-3 bg-slate-100 dark:bg-zinc-800/50 rounded w-4/5" />
              </div>
            ))}
          </div>
        ) : filteredInsights.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-700 mb-2" />
            <p className="text-xs font-bold text-slate-500 dark:text-zinc-500">
              {t('لا توجد رؤى حالياً', 'No insights available')}
            </p>
          </div>
        ) : (
          filteredInsights.map(insight => (
            <InsightCard
              key={insight.id}
              insight={insight}
              lang={lang}
              expanded={selectedInsight?.id === insight.id}
              onToggle={() => setSelectedInsight(
                selectedInsight?.id === insight.id ? null : insight
              )}
              onClick={() => onInsightClick?.(insight)}
            />
          ))
        )}
      </div>

      {/* AI Chat */}
      {onGeminiQuery && (
        <div className="bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-950/20 dark:to-violet-950/20 rounded-2xl border border-blue-200 dark:border-blue-900 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-black text-slate-900 dark:text-white">
              {t('اسأل المساعد الذكي', 'Ask AI Assistant')}
            </h3>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={chatQuery}
              onChange={e => setChatQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleChat()}
              placeholder={t('اسأل عن الأداء أو البيانات...', 'Ask about performance or data...')}
              className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-800 text-xs outline-none focus:border-blue-500 transition-colors"
            />
            <button
              onClick={handleChat}
              disabled={chatLoading || !chatQuery}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-xs font-black disabled:opacity-50 flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t('سؤال', 'Ask')}
            </button>
          </div>

          {chatLoading && (
            <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-bold">
              <div className="flex gap-1">
                {[0, 150, 300].map(d => (
                  <span key={d} className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
              {t('Gemini يفكر...', 'Gemini is thinking...')}
            </div>
          )}

          {chatResponse && (
            <div className="mt-3 p-3 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">
                {chatResponse}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const InsightCard: React.FC<{
  insight: AIInsight;
  lang: Lang;
  expanded: boolean;
  onToggle: () => void;
  onClick: () => void;
}> = ({ insight, lang, expanded, onToggle, onClick }) => {
  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const cfg = TYPE_CONFIG[insight.type];
  const Icon = cfg.icon;
  const ImpactIcon = insight.impact === 'critical' ? AlertTriangle :
    insight.impact === 'high' ? TrendingUp :
    insight.impact === 'medium' ? Activity : CheckCircle2;

  return (
    <div
      className={`bg-white dark:bg-zinc-900 rounded-2xl border-2 transition-all cursor-pointer ${
        IMPACT_BORDER[insight.impact]
      } ${expanded ? 'shadow-lg' : 'shadow-sm hover:shadow-md hover:-translate-y-0.5'}`}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-4.5 h-4.5 ${cfg.color}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                {t(insight.titleAr, insight.titleEn)}
              </h4>
              <Badge
                variant={insight.type === 'risk' ? 'danger' : insight.type === 'opportunity' ? 'warning' : 'success'}
                size="xs"
                lang={lang}
              >
                {lang === 'ar' ? cfg.labelAr : cfg.labelEn}
              </Badge>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed line-clamp-2">
              {t(insight.descriptionAr, insight.descriptionEn)}
            </p>

            {/* Metrics */}
            {insight.metrics && insight.metrics.length > 0 && (
              <div className="flex items-center gap-3 mt-2">
                {insight.metrics.map((m, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500 font-bold">{lang === 'ar' ? m.labelAr : m.labelEn}:</span>
                    <span className="text-[10px] font-black text-slate-900 dark:text-white">{m.value}</span>
                    {m.change !== undefined && (
                      m.change >= 0
                        ? <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />
                        : <TrendingDown className="w-2.5 h-2.5 text-rose-500" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black ${SOURCE_CONFIG[insight.source].color}`}>
                  {SOURCE_CONFIG[insight.source].label}
                </span>
                <span className="text-[10px] text-slate-400">
                  {Math.round(insight.confidence)}%
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <ImpactIcon className={`w-3 h-3 ${
                  insight.impact === 'critical' ? 'text-rose-600' :
                  insight.impact === 'high' ? 'text-amber-600' :
                  insight.impact === 'medium' ? 'text-sky-600' : 'text-emerald-600'
                }`} />
                <span className={`text-[9px] font-black uppercase ${
                  insight.impact === 'critical' ? 'text-rose-600' :
                  insight.impact === 'high' ? 'text-amber-600' :
                  insight.impact === 'medium' ? 'text-sky-600' : 'text-emerald-600'
                }`}>
                  {insight.impact}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); onToggle(); }}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded transition-colors"
                >
                  <ChevronRight className={`w-3 h-3 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded actions */}
      {expanded && insight.actions && insight.actions.length > 0 && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            {insight.actions.map((action, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); action.onClick(); }}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-black hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex items-center gap-1.5"
              >
                {t(action.labelAr, action.labelEn)}
                <ArrowUpRight className="w-3 h-3" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsightsPanel;
