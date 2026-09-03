/**
 * UAMEX_ERP™ Premium MetricCard — Deep Analytics KPI Tile
 * Advanced KPI card with animated counters, sparklines, drill-down, and breakdowns.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  ChevronRight,
  DollarSign,
  Download,
  Eye,
  Gauge,
  Hash,
  LineChart as LineChartIcon,
  Loader2,
  Minus,
  MoreVertical,
  RefreshCw,
  Settings,
  Share2,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';

export type MetricFormat = 'currency' | 'percentage' | 'number' | 'compact' | 'duration' | 'raw';
export type MetricVariant = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type MetricSize = 'compact' | 'comfortable' | 'hero';
export type MetricTrendDirection = 'up' | 'down' | 'flat';

export interface MetricPoint {
  label: string;
  value: number;
}

export interface MetricBreakdown {
  labelAr: string;
  labelEn: string;
  value: number;
  percentage: number;
  color?: string;
}

export interface MetricSubMetric {
  id: string;
  labelAr: string;
  labelEn: string;
  value: number;
  format?: MetricFormat;
  trend?: MetricTrendDirection;
  delta?: number;
  unit?: string;
}

export interface MetricCardData {
  id: string;
  titleAr: string;
  titleEn: string;
  subtitleAr?: string;
  subtitleEn?: string;
  value: number;
  previousValue?: number;
  targetValue?: number;
  format: MetricFormat;
  unit?: string;
  currency?: string;
  locale?: string;
  variant?: MetricVariant;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: number[];
  trendDirection?: MetricTrendDirection;
  status?: 'healthy' | 'warning' | 'critical' | 'neutral';
  breakdown?: MetricBreakdown[];
  subMetrics?: MetricSubMetric[];
  lastUpdated?: string;
  changeLabelAr?: string;
  changeLabelEn?: string;
  contextAr?: string;
  contextEn?: string;
  benchmarkAr?: string;
  benchmarkEn?: string;
}

export interface PremiumMetricCardProps {
  lang: 'ar' | 'en';
  data: MetricCardData;
  size?: MetricSize;
  loading?: boolean;
  animated?: boolean;
  onRefresh?: () => void;
  onDrillDown?: (data: MetricCardData) => void;
  onExport?: (data: MetricCardData) => void;
  onShare?: (data: MetricCardData) => void;
  onConfigure?: (data: MetricCardData) => void;
  showActions?: boolean;
  showSparkline?: boolean;
  showBreakdown?: boolean;
  className?: string;
}

const t = (ar: string, en: string, lang: 'ar' | 'en') => (lang === 'ar' ? ar : en);

function formatValue(value: number, format: MetricFormat, currency = 'SAR', locale?: string): string {
  const loc = locale || (typeof window !== 'undefined' ? (document.documentElement.lang || 'en') : 'en');
  const fmt = loc.startsWith('ar') ? 'ar-SA' : 'en-US';
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat(fmt, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'compact':
      return new Intl.NumberFormat(fmt, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
    case 'duration':
      if (value < 60) return `${Math.round(value)}s`;
      if (value < 3600) return `${Math.round(value / 60)}m`;
      if (value < 86400) return `${Math.round(value / 3600)}h`;
      return `${Math.round(value / 86400)}d`;
    case 'number':
      return new Intl.NumberFormat(fmt).format(value);
    case 'raw':
    default:
      return String(value);
  }
}

function useCountUp(target: number, duration = 900, active = true): number {
  const [value, setValue] = useState(target);
  useEffect(() => {
    if (!active) return;
    let raf: number;
    const start = performance.now();
    const initial = value;
    const delta = target - initial;
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(initial + delta * eased);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, active]);
  return value;
}

function Sparkline({ data, variant, width = 80, height = 28 }: { data: number[]; variant: MetricVariant; width?: number; height?: number }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  const variantColor: Record<MetricVariant, string> = {
    primary: '#059669', accent: '#d97706', success: '#10b981', warning: '#f59e0b', danger: '#ef4444', info: '#0ea5e9', neutral: '#71717a',
  };

  const last = data[data.length - 1];
  const minV = Math.min(...data);
  const maxV = Math.max(...data);
  const rangeV = maxV - minV || 1;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-grad-${variant}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={variantColor[variant]} stopOpacity={0.3} />
          <stop offset="100%" stopColor={variantColor[variant]} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${points} ${width},${height}`} fill={`url(#spark-grad-${variant})`} />
      <polyline points={points} fill="none" stroke={variantColor[variant]} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width} cy={height - ((last - minV) / rangeV) * (height - 4) - 2} r={2.5} fill={variantColor[variant]} />
    </svg>
  );
}

function DonutBreakdown({ data, size = 140 }: { data: MetricBreakdown[]; size?: number }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  let cumulative = 0;
  const segments = data.map((d) => {
    const pct = total > 0 ? d.value / total : 0;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const offset = cumulative;
    cumulative += dash;
    return { ...d, pct, dash, gap, offset };
  });

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="currentColor" strokeWidth={14} className="text-slate-100 dark:text-zinc-800" />
        {segments.map((seg, i) => (
          <circle key={i} cx={center} cy={center} r={radius} fill="none" stroke={seg.color || '#059669'} strokeWidth={14}
            strokeDasharray={`${seg.dash} ${seg.gap}`} strokeDashoffset={-seg.offset} className="transition-all duration-700" />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-black text-slate-900 dark:text-zinc-100 tabular-nums">
          {new Intl.NumberFormat('en', { notation: 'compact' }).format(total)}
        </div>
        <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Total</div>
      </div>
    </div>
  );
}

export function PremiumMetricCard({
  lang, data, size = 'comfortable', loading = false, animated = true,
  onRefresh, onDrillDown, onExport, onShare, onConfigure,
  showActions = true, showSparkline = true, showBreakdown = false, className = '',
}: PremiumMetricCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showDrillDown, setShowDrillDown] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const animatedValue = useCountUp(data.value, 900, animated && !loading);
  const variant = data.variant || 'primary';

  const variantConfig: Record<MetricVariant, { gradient: string; textClass: string; bgClass: string; ringClass: string; light: string; iconBg: string }> = {
    primary: { gradient: 'from-emerald-600 via-emerald-500 to-teal-500', textClass: 'text-emerald-700 dark:text-emerald-400', bgClass: 'bg-emerald-50 dark:bg-emerald-500/10', ringClass: 'ring-emerald-500/30', light: 'bg-emerald-500', iconBg: 'bg-gradient-to-br from-emerald-600 to-emerald-500' },
    accent: { gradient: 'from-amber-600 via-amber-500 to-orange-500', textClass: 'text-amber-700 dark:text-amber-400', bgClass: 'bg-amber-50 dark:bg-amber-500/10', ringClass: 'ring-amber-500/30', light: 'bg-amber-500', iconBg: 'bg-gradient-to-br from-amber-600 to-amber-500' },
    success: { gradient: 'from-emerald-600 to-green-500', textClass: 'text-emerald-700 dark:text-emerald-400', bgClass: 'bg-emerald-50 dark:bg-emerald-500/10', ringClass: 'ring-emerald-500/30', light: 'bg-emerald-500', iconBg: 'bg-gradient-to-br from-emerald-600 to-emerald-500' },
    warning: { gradient: 'from-amber-500 to-yellow-500', textClass: 'text-amber-700 dark:text-amber-400', bgClass: 'bg-amber-50 dark:bg-amber-500/10', ringClass: 'ring-amber-500/30', light: 'bg-amber-500', iconBg: 'bg-gradient-to-br from-amber-500 to-amber-400' },
    danger: { gradient: 'from-red-600 to-rose-500', textClass: 'text-red-700 dark:text-red-400', bgClass: 'bg-red-50 dark:bg-red-500/10', ringClass: 'ring-red-500/30', light: 'bg-red-500', iconBg: 'bg-gradient-to-br from-red-600 to-red-500' },
    info: { gradient: 'from-sky-600 to-cyan-500', textClass: 'text-sky-700 dark:text-sky-400', bgClass: 'bg-sky-50 dark:bg-sky-500/10', ringClass: 'ring-sky-500/30', light: 'bg-sky-500', iconBg: 'bg-gradient-to-br from-sky-600 to-sky-500' },
    neutral: { gradient: 'from-zinc-600 to-zinc-500', textClass: 'text-zinc-700 dark:text-zinc-400', bgClass: 'bg-zinc-50 dark:bg-zinc-500/10', ringClass: 'ring-zinc-500/30', light: 'bg-zinc-500', iconBg: 'bg-gradient-to-br from-zinc-600 to-zinc-500' },
  };

  const sizeConfig = useMemo(() => {
    if (size === 'compact') return { container: 'p-3', iconBox: 'w-9 h-9', iconSize: 'w-4 h-4', valueSize: 'text-xl', titleSize: 'text-[10px]', spacing: 'gap-2' };
    if (size === 'hero') return { container: 'p-6', iconBox: 'w-14 h-14', iconSize: 'w-7 h-7', valueSize: 'text-4xl', titleSize: 'text-sm', spacing: 'gap-4' };
    return { container: 'p-4', iconBox: 'w-11 h-11', iconSize: 'w-5 h-5', valueSize: 'text-2xl', titleSize: 'text-xs', spacing: 'gap-3' };
  }, [size]);

  const cfg = variantConfig[variant];
  const delta = useMemo(() => {
    if (data.previousValue == null) return null;
    const diff = data.value - data.previousValue;
    const pct = data.previousValue !== 0 ? (diff / Math.abs(data.previousValue)) * 100 : 0;
    return { diff, pct, direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat' as MetricTrendDirection };
  }, [data.value, data.previousValue]);

  const targetProgress = useMemo(() => {
    if (data.targetValue == null) return null;
    return Math.min(100, (data.value / data.targetValue) * 100);
  }, [data.value, data.targetValue]);

  const statusConfig = useMemo(() => {
    if (data.status === 'healthy') return { color: 'bg-emerald-500', icon: Sparkles, label: t('ممتاز', 'Excellent', lang) };
    if (data.status === 'warning') return { color: 'bg-amber-500', icon: AlertTriangle, label: t('يحتاج انتباه', 'Attention', lang) };
    if (data.status === 'critical') return { color: 'bg-red-500', icon: AlertTriangle, label: t('حرج', 'Critical', lang) };
    return null;
  }, [data.status, lang]);

  if (loading) {
    return (
      <div className={`${sizeConfig.container} bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-lg shadow-emerald-500/5 ${className}`}>
        <div className="flex items-center gap-3">
          <div className={`${sizeConfig.iconBox} rounded-xl bg-slate-200 dark:bg-zinc-800 animate-pulse`} />
          <div className="flex-1 space-y-2">
            <div className="h-2 rounded bg-slate-200 dark:bg-zinc-800 animate-pulse w-1/3" />
            <div className="h-6 rounded bg-slate-200 dark:bg-zinc-800 animate-pulse w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  const Icon = data.icon || Gauge;
  const TrendIcon = delta?.direction === 'up' ? ArrowUpRight : delta?.direction === 'down' ? ArrowDownRight : Minus;

  return (
    <>
      <div
        className={`group relative ${sizeConfig.container} bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-lg shadow-emerald-500/5 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 overflow-hidden ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setShowMenu(false); }}
      >
        <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${cfg.gradient}`} />

        <div className={`relative flex items-start ${sizeConfig.spacing}`}>
          <div className={`shrink-0 ${sizeConfig.iconBox} rounded-xl ${cfg.iconBg} flex items-center justify-center shadow-lg ring-1 ring-white/20 dark:ring-black/20 transition-transform group-hover:scale-110 group-hover:rotate-3 duration-500`}>
            <Icon className={`${sizeConfig.iconSize} text-white drop-shadow`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="min-w-0 flex-1">
                <div className={`${sizeConfig.titleSize} font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider truncate`}>
                  {lang === 'ar' ? data.titleAr : data.titleEn}
                </div>
                {(data.subtitleAr || data.subtitleEn) && (
                  <div className="text-[10px] text-slate-500 dark:text-zinc-500 mt-0.5 truncate">
                    {lang === 'ar' ? data.subtitleAr : data.subtitleEn}
                  </div>
                )}
              </div>

              {showActions && (
                <div className="flex items-center gap-0.5">
                  {data.status && statusConfig && (
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full ${cfg.bgClass}`}>
                      <statusConfig.icon className={`w-2.5 h-2.5 ${cfg.textClass}`} />
                      <span className={`text-[9px] font-bold ${cfg.textClass}`}>{statusConfig.label}</span>
                    </div>
                  )}
                  <div className="relative">
                    <button onClick={() => setShowMenu((p) => !p)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-500 transition-all"
                      aria-label={t('المزيد', 'More', lang)}>
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                    {showMenu && (
                      <div className="absolute top-full mt-1 end-0 z-30 w-40 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-2xl shadow-emerald-500/10 py-1 animate-fade-in">
                        {onDrillDown && <button onClick={() => { setShowDrillDown(true); onDrillDown(data); }}
                          className="w-full px-3 py-1.5 text-start text-[11px] font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2">
                          <Eye className="w-3 h-3" /> {t('تحليل معمق', 'Drill down', lang)}
                        </button>}
                        {onRefresh && <button onClick={onRefresh}
                          className="w-full px-3 py-1.5 text-start text-[11px] font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2">
                          <RefreshCw className="w-3 h-3" /> {t('تحديث', 'Refresh', lang)}
                        </button>}
                        {onExport && <button onClick={() => onExport(data)}
                          className="w-full px-3 py-1.5 text-start text-[11px] font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2">
                          <Download className="w-3 h-3" /> {t('تصدير', 'Export', lang)}
                        </button>}
                        {onShare && <button onClick={() => onShare(data)}
                          className="w-full px-3 py-1.5 text-start text-[11px] font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2">
                          <Share2 className="w-3 h-3" /> {t('مشاركة', 'Share', lang)}
                        </button>}
                        {onConfigure && <button onClick={() => onConfigure(data)}
                          className="w-full px-3 py-1.5 text-start text-[11px] font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2">
                          <Settings className="w-3 h-3" /> {t('تكوين', 'Configure', lang)}
                        </button>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-end gap-2 mb-1.5">
              <div className={`${sizeConfig.valueSize} font-black ${cfg.textClass} tabular-nums leading-none`}>
                {formatValue(animatedValue, data.format, data.currency, data.locale)}
              </div>
              {data.unit && <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-500 mb-1">{data.unit}</div>}
            </div>

            {delta && (
              <div className="flex items-center gap-1.5">
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  delta.direction === 'up' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  : delta.direction === 'down' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                }`}>
                  <TrendIcon className="w-2.5 h-2.5" />
                  <span className="tabular-nums">{Math.abs(delta.pct).toFixed(1)}%</span>
                </div>
                {(data.changeLabelAr || data.changeLabelEn) && (
                  <span className="text-[10px] text-slate-500 dark:text-zinc-500 truncate">
                    {lang === 'ar' ? data.changeLabelAr : data.changeLabelEn}
                  </span>
                )}
              </div>
            )}

            {targetProgress != null && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 dark:text-zinc-500 mb-1">
                  <span>{t('الهدف', 'Target', lang)}</span>
                  <span className="tabular-nums">{targetProgress.toFixed(0)}%</span>
                </div>
                <div className="h-1 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                  <div className={`h-full rounded-full ${cfg.light} transition-all duration-700`} style={{ width: `${targetProgress}%` }} />
                </div>
              </div>
            )}
          </div>

          {showSparkline && data.trend && data.trend.length >= 2 && (
            <div className="shrink-0">
              <Sparkline data={data.trend} variant={variant} width={size === 'hero' ? 100 : 80} height={size === 'hero' ? 36 : 28} />
            </div>
          )}
        </div>

        {data.subMetrics && data.subMetrics.length > 0 && size !== 'compact' && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800 grid grid-cols-3 gap-1">
            {data.subMetrics.slice(0, 3).map((sm) => (
              <div key={sm.id} className="text-center">
                <div className="text-[9px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider truncate">
                  {lang === 'ar' ? sm.labelAr : sm.labelEn}
                </div>
                <div className="text-xs font-black text-slate-700 dark:text-zinc-300 tabular-nums mt-0.5">
                  {formatValue(sm.value, sm.format || 'number')}
                </div>
                {sm.delta != null && (
                  <div className={`text-[9px] font-bold ${sm.delta > 0 ? 'text-emerald-600' : sm.delta < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                    {sm.delta > 0 ? '+' : ''}{sm.delta.toFixed(1)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {isHovered && onDrillDown && (
          <button onClick={() => setShowDrillDown(true)}
            className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent dark:from-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2"
            aria-label={t('تحليل معمق', 'Drill down', lang)}>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 dark:bg-zinc-900/90 text-[10px] font-bold text-slate-700 dark:text-zinc-300 shadow-lg backdrop-blur">
              <ChevronRight className="w-3 h-3 rtl:rotate-180" />
              {t('تحليل معمق', 'Drill down', lang)}
            </span>
          </button>
        )}
      </div>

      {showDrillDown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowDrillDown(false)}>
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}>
            <div className={`relative ${sizeConfig.container} bg-gradient-to-r ${cfg.gradient}`}>
              <div className="flex items-start justify-between gap-3 text-white">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold uppercase tracking-wider opacity-80">
                      {lang === 'ar' ? data.titleAr : data.titleEn}
                    </div>
                    <div className="text-3xl font-black tabular-nums mt-1">
                      {formatValue(data.value, data.format, data.currency, data.locale)}
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowDrillDown(false)}
                  className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                  aria-label={t('إغلاق', 'Close', lang)}>
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {data.previousValue != null && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                    <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {t('الفترة السابقة', 'Previous Period', lang)}
                    </div>
                    <div className="text-lg font-black text-slate-700 dark:text-zinc-300 tabular-nums mt-1">
                      {formatValue(data.previousValue, data.format, data.currency, data.locale)}
                    </div>
                  </div>
                )}
                {data.targetValue != null && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
                    <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                      <Target className="w-3 h-3" /> {t('الهدف', 'Target', lang)}
                    </div>
                    <div className="text-lg font-black text-emerald-700 dark:text-emerald-300 tabular-nums mt-1">
                      {formatValue(data.targetValue, data.format, data.currency, data.locale)}
                    </div>
                  </div>
                )}
                {delta && (
                  <div className={`p-3 rounded-xl border ${delta.direction === 'up' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' : delta.direction === 'down' ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30' : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'}`}>
                    <div className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${delta.direction === 'up' ? 'text-emerald-700 dark:text-emerald-300' : delta.direction === 'down' ? 'text-red-700 dark:text-red-300' : 'text-slate-500 dark:text-zinc-500'}`}>
                      <Activity className="w-3 h-3" /> {t('التغيير', 'Change', lang)}
                    </div>
                    <div className={`text-lg font-black tabular-nums mt-1 ${delta.direction === 'up' ? 'text-emerald-700 dark:text-emerald-300' : delta.direction === 'down' ? 'text-red-700 dark:text-red-300' : 'text-slate-700 dark:text-zinc-300'}`}>
                      {delta.direction === 'up' ? '+' : ''}{delta.pct.toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>

              {data.breakdown && data.breakdown.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 mb-3 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5" /> {t('التوزيع التفصيلي', 'Detailed Breakdown', lang)}
                  </h4>
                  <div className="flex items-center gap-6">
                    <DonutBreakdown data={data.breakdown} size={140} />
                    <div className="flex-1 space-y-1.5">
                      {data.breakdown.map((b, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color || '#059669' }} />
                            <span className="text-xs font-medium text-slate-700 dark:text-zinc-300 truncate">
                              {lang === 'ar' ? b.labelAr : b.labelEn}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold tabular-nums text-slate-700 dark:text-zinc-300">
                              {formatValue(b.value, data.format, data.currency, data.locale)}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 tabular-nums w-12 text-end">
                              {b.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {data.subMetrics && data.subMetrics.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 mb-3 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" /> {t('المقاييس الفرعية', 'Sub-Metrics', lang)}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {data.subMetrics.map((sm) => (
                      <div key={sm.id} className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                        <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">
                          {lang === 'ar' ? sm.labelAr : sm.labelEn}
                        </div>
                        <div className="text-lg font-black text-slate-700 dark:text-zinc-300 tabular-nums mt-1">
                          {formatValue(sm.value, sm.format || 'number')}
                          {sm.unit && <span className="text-xs text-slate-500 ms-1">{sm.unit}</span>}
                        </div>
                        {sm.delta != null && (
                          <div className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${sm.delta > 0 ? 'text-emerald-600' : sm.delta < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                            {sm.delta > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : sm.delta < 0 ? <TrendingDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                            {sm.delta > 0 ? '+' : ''}{sm.delta.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.trend && data.trend.length >= 2 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 mb-3 flex items-center gap-1.5">
                    <LineChartIcon className="w-3.5 h-3.5" /> {t('الاتجاه التاريخي', 'Historical Trend', lang)}
                  </h4>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                    <Sparkline data={data.trend} variant={variant} width={520} height={80} />
                  </div>
                </div>
              )}

              {(data.contextAr || data.benchmarkAr) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.contextAr && (
                    <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30">
                      <div className="text-[10px] font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider mb-1">
                        {t('السياق', 'Context', lang)}
                      </div>
                      <div className="text-xs text-sky-800 dark:text-sky-200">
                        {lang === 'ar' ? data.contextAr : data.contextEn}
                      </div>
                    </div>
                  )}
                  {data.benchmarkAr && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
                      <div className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-1">
                        {t('المعيار المرجعي', 'Benchmark', lang)}
                      </div>
                      <div className="text-xs text-amber-800 dark:text-amber-200">
                        {lang === 'ar' ? data.benchmarkAr : data.benchmarkEn}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {data.lastUpdated && (
                <div className="text-[10px] text-slate-500 dark:text-zinc-500 text-center pt-2 border-t border-slate-100 dark:border-zinc-800">
                  {t('آخر تحديث:', 'Last updated:', lang)} {new Date(data.lastUpdated).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function PremiumMetricCardDemo({ lang }: { lang: 'ar' | 'en' }) {
  const sampleData: MetricCardData = useMemo(() => ({
    id: 'demo', titleAr: 'إجمالي المشاريع النشطة', titleEn: 'Total Active Projects',
    subtitleAr: 'محدث لحظياً', subtitleEn: 'Live updating',
    value: 247, previousValue: 198, targetValue: 300,
    format: 'number', variant: 'primary', icon: Zap, status: 'healthy',
    trend: [180, 192, 188, 205, 212, 220, 215, 232, 240, 247],
    breakdown: [
      { labelAr: 'البنية التحتية', labelEn: 'Infrastructure', value: 92, percentage: 37.2, color: '#059669' },
      { labelAr: 'التعليم', labelEn: 'Education', value: 68, percentage: 27.5, color: '#d97706' },
      { labelAr: 'الصحة', labelEn: 'Health', value: 45, percentage: 18.2, color: '#dc2626' },
      { labelAr: 'الطوارئ', labelEn: 'Emergency', value: 28, percentage: 11.3, color: '#f59e0b' },
      { labelAr: 'الحوكمة', labelEn: 'Governance', value: 14, percentage: 5.7, color: '#6366f1' },
    ],
    subMetrics: [
      { id: 's1', labelAr: 'منجزة', labelEn: 'Completed', value: 87, delta: 12.5, format: 'number' },
      { id: 's2', labelAr: 'قيد التنفيذ', labelEn: 'In Progress', value: 132, delta: 8.3, format: 'number' },
      { id: 's3', labelAr: 'متأخرة', labelEn: 'Delayed', value: 28, delta: -5.2, format: 'number' },
    ],
    lastUpdated: new Date().toISOString(),
    changeLabelAr: 'مقارنة بالشهر الماضي', changeLabelEn: 'vs last month',
    contextAr: 'زيادة بنسبة 24.7% عن نفس الفترة من العام الماضي', contextEn: '24.7% increase vs same period last year',
    benchmarkAr: 'ضمن معايير Sphere الدولية للمشاريع الإنسانية', benchmarkEn: 'Within Sphere International Humanitarian Standards',
  }), []);

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-emerald-50/30 dark:from-zinc-950 dark:to-emerald-950/10 min-h-screen">
      <h2 className="text-base font-black text-slate-900 dark:text-zinc-100 mb-4">
        {t('بطاقة المؤشر المتقدمة', 'Premium MetricCard', lang)}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <PremiumMetricCard lang={lang} data={sampleData} size="hero" />
        <PremiumMetricCard lang={lang} data={{ ...sampleData, id: 'demo-2', titleAr: 'الميزانية المنفقة', titleEn: 'Budget Spent', value: 8420000, format: 'currency', variant: 'accent', icon: DollarSign, status: 'warning' }} />
        <PremiumMetricCard lang={lang} data={{ ...sampleData, id: 'demo-3', titleAr: 'معدل النجاح', titleEn: 'Success Rate', value: 94.2, format: 'percentage', variant: 'success', icon: Target, status: 'healthy' }} />
      </div>
    </div>
  );
}

export default PremiumMetricCard;