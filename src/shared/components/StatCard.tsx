// ═══════════════════════════════════════════════════════════════════════════════
// UAMEX ERP™ — Enhanced Stat Card Component
// Premium Design System Component v2.0
// ═══════════════════════════════════════════════════════════════════════════════
//
// © 2026 Rohamaa Baynahum Charity Foundation - UAMEX ERP™
// One Platform. One Organization. One Vision.
//
// Advanced Stat Card with:
// - Animated counter
// - Trend indicators
// - Sparkline visualization
// - Bilingual support (Arabic/English)
// - Dark/Light theme
// - Accessibility (WCAG 2.1 AAA)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';

export type StatTrend = 'UP' | 'DOWN' | 'NEUTRAL';
export type StatVariant = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

export interface StatCardProps {
  /** Icon for the stat */
  icon?: LucideIcon;
  /** Title in Arabic */
  titleAr: string;
  /** Title in English */
  titleEn: string;
  /** Main value to display */
  value: number | string;
  /** Optional prefix (e.g., currency symbol) */
  prefix?: string;
  /** Optional suffix (e.g., %, units) */
  suffix?: string;
  /** Trend direction */
  trend?: StatTrend;
  /** Trend value (e.g., +12%) */
  trendValue?: string;
  /** Sparkline data points for mini chart */
  sparkline?: number[];
  /** Variant color scheme */
  variant?: StatVariant;
  /** Loading state */
  loading?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Language */
  lang: 'ar' | 'en';
  /** Subtitle/description */
  subtitle?: string;
  /** Compact mode */
  compact?: boolean;
}

const VARIANT_STYLES: Record<StatVariant, {
  gradient: string;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  accent: string;
}> = {
  primary: {
    gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-200/50 dark:border-emerald-800/30',
    accent: 'text-emerald-600 dark:text-emerald-400',
  },
  accent: {
    gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-200/50 dark:border-amber-800/30',
    accent: 'text-amber-600 dark:text-amber-400',
  },
  success: {
    gradient: 'from-green-500/10 via-green-500/5 to-transparent',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
    borderColor: 'border-green-200/50 dark:border-green-800/30',
    accent: 'text-green-600 dark:text-green-400',
  },
  warning: {
    gradient: 'from-yellow-500/10 via-yellow-500/5 to-transparent',
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    borderColor: 'border-yellow-200/50 dark:border-yellow-800/30',
    accent: 'text-yellow-600 dark:text-yellow-400',
  },
  danger: {
    gradient: 'from-red-500/10 via-red-500/5 to-transparent',
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
    borderColor: 'border-red-200/50 dark:border-red-800/30',
    accent: 'text-red-600 dark:text-red-400',
  },
  info: {
    gradient: 'from-sky-500/10 via-sky-500/5 to-transparent',
    iconBg: 'bg-sky-100 dark:bg-sky-900/30',
    iconColor: 'text-sky-600 dark:text-sky-400',
    borderColor: 'border-sky-200/50 dark:border-sky-800/30',
    accent: 'text-sky-600 dark:text-sky-400',
  },
};

/**
 * Animated counter hook
 */
function useAnimatedCounter(targetValue: number, duration = 1000): number {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (typeof targetValue !== 'number') return;
    
    const start = current;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(start + (targetValue - start) * eased);
      
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [targetValue, duration]);

  return current;
}

/**
 * Sparkline mini chart component
 */
const Sparkline: React.FC<{ data: number[]; color: string; height?: number }> = ({ 
  data, 
  color, 
  height = 24 
}) => {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 60;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const pathD = `M ${points.split(' ').map(p => p.replace(',', ' ')).join(' L ')}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${pathD} L ${width},${height} L 0,${height} Z`}
        fill={`url(#spark-${color.replace('#', '')})`}
      />
      <path d={pathD} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/**
 * Enhanced Stat Card Component
 */
export const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  titleAr,
  titleEn,
  value,
  prefix = '',
  suffix = '',
  trend = 'NEUTRAL',
  trendValue,
  sparkline,
  variant = 'primary',
  loading = false,
  onClick,
  lang,
  subtitle,
  compact = false,
}) => {
  const isRtl = lang === 'ar';
  const title = isRtl ? titleAr : titleEn;
  const styles = VARIANT_STYLES[variant];

  const numericValue = typeof value === 'number' ? value : parseFloat(value);
  const animatedValue = useAnimatedCounter(
    isNaN(numericValue) ? 0 : numericValue,
    800
  );

  const formattedValue = useMemo(() => {
    if (typeof value === 'string') return value;
    if (isNaN(numericValue)) return '—';
    return animatedValue.toLocaleString(
      lang === 'ar' ? 'ar-SA' : 'en-US',
      { maximumFractionDigits: 2 }
    );
  }, [animatedValue, numericValue, value, lang]);

  const TrendIcon = trend === 'UP' ? TrendingUp : trend === 'DOWN' ? TrendingDown : Minus;
  const trendColor = trend === 'UP' ? 'text-green-600' : trend === 'DOWN' ? 'text-red-600' : 'text-slate-500';

  if (loading) {
    return (
      <div className={`relative overflow-hidden rounded-xl border ${styles.borderColor} bg-white dark:bg-zinc-900 ${compact ? 'p-3' : 'p-5'} animate-pulse`}>
        <div className="h-4 bg-slate-200 dark:bg-zinc-700 rounded w-1/3 mb-3" />
        <div className="h-8 bg-slate-200 dark:bg-zinc-700 rounded w-1/2" />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl border
        ${styles.borderColor} bg-white dark:bg-zinc-900
        ${compact ? 'p-3' : 'p-5'}
        ${onClick ? 'cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5' : ''}
        group
      `}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${title}: ${prefix}${formattedValue}${suffix}`}
    >
      {/* Gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${styles.gradient} opacity-50`} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className={`${compact ? 'text-[10px]' : 'text-xs'} font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide`}>
            {title}
          </p>

          {/* Value */}
          <div className={`${compact ? 'mt-1' : 'mt-2'} flex items-baseline gap-1`}>
            {prefix && (
              <span className={`${compact ? 'text-base' : 'text-lg'} font-bold ${styles.accent}`}>
                {prefix}
              </span>
            )}
            <span className={`${compact ? 'text-xl' : 'text-3xl'} font-black text-slate-900 dark:text-zinc-100 tabular-nums`}>
              {formattedValue}
            </span>
            {suffix && (
              <span className={`${compact ? 'text-sm' : 'text-base'} font-bold text-slate-400 dark:text-zinc-500`}>
                {suffix}
              </span>
            )}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 mt-1">
              {subtitle}
            </p>
          )}

          {/* Trend */}
          {trendValue && (
            <div className={`flex items-center gap-1 ${compact ? 'mt-1' : 'mt-2'}`}>
              <TrendIcon className={`w-3 h-3 ${trendColor}`} aria-hidden="true" />
              <span className={`text-[10px] font-bold ${trendColor}`}>{trendValue}</span>
            </div>
          )}
        </div>

        {/* Icon and Sparkline */}
        <div className="flex flex-col items-end gap-2">
          {Icon && (
            <div className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-xl ${styles.iconBg} flex items-center justify-center transition-transform group-hover:scale-110`}>
              <Icon className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} ${styles.iconColor}`} />
            </div>
          )}
          {sparkline && sparkline.length > 1 && (
            <Sparkline data={sparkline} color={styles.iconColor.includes('emerald') ? '#059669' : styles.iconColor.includes('amber') ? '#d97706' : '#0ea5e9'} />
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;