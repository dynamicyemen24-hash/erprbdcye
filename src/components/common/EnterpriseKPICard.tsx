/**
 * UAMEX ERP™ — Enterprise KPI Card 4.0
 *
 * Advanced metric visualization card with:
 * — Trend indicators (up / down / stable)
 * — Progress bar (optional)
 * — Currency / numeric formatting (tabular-nums)
 * — Comparison period label
 * — Contextual semantic color (success / warning / danger / neutral)
 * — Skeleton loading state
 * — RTL-aware layout
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react';
import { cn } from '../../design-system/utils/cn';

/**
 * Specialty KPI card (DEBT PAID): kept for its full contract — unit,
 * trend value + label split, progress bar, footer slot, `ai` tone, skeleton
 * loading — none of which the canonical `EnterpriseStat`/`MetricTile`
 * cover together. Palette is now a CLOSED LOCAL MAP (no third token
 * vocabulary); the loading shimmer is the canonical `animate-shimmer`.
 */

export interface EnterpriseKPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  trendLabel?: string;
  progress?: number;          // 0–100
  progressColor?: 'emerald' | 'amber' | 'rose' | 'sky' | 'violet';
  variant?: 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'ai';
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  lang?: 'ar' | 'en';
}

const TREND_ICON = {
  up:     TrendingUp,
  down:   TrendingDown,
  stable: Minus,
};

const TREND_COLOR = {
  up:     'text-emerald-600 dark:text-emerald-400',
  down:   'text-rose-600 dark:text-rose-400',
  stable: 'text-slate-500 dark:text-zinc-400',
};

const PROGRESS_BAR: Record<string, string> = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  sky: 'bg-sky-500',
  violet: 'bg-violet-500',
};

const TONE: Record<NonNullable<EnterpriseKPICardProps['variant']>, { bg: string; border: string; iconClass: string }> = {
  success: { bg: 'bg-emerald-50 dark:bg-emerald-950/60', border: 'border-emerald-200 dark:border-emerald-800/80', iconClass: 'text-emerald-600 dark:text-emerald-400' },
  warning: { bg: 'bg-amber-50 dark:bg-amber-950/60',     border: 'border-amber-200 dark:border-amber-800/80',     iconClass: 'text-amber-600 dark:text-amber-400' },
  danger:  { bg: 'bg-rose-50 dark:bg-rose-950/60',       border: 'border-rose-200 dark:border-rose-800/80',       iconClass: 'text-rose-600 dark:text-rose-400' },
  neutral: { bg: 'bg-slate-100 dark:bg-zinc-800',        border: 'border-slate-200 dark:border-zinc-700',        iconClass: 'text-slate-500 dark:text-zinc-400' },
  info:    { bg: 'bg-sky-50 dark:bg-sky-950/60',         border: 'border-sky-200 dark:border-sky-800/80',         iconClass: 'text-sky-600 dark:text-sky-400' },
  ai:      { bg: 'bg-violet-50 dark:bg-violet-950/60',   border: 'border-violet-200 dark:border-violet-800/80',   iconClass: 'text-violet-600 dark:text-violet-400' },
};

export const EnterpriseKPICard: React.FC<EnterpriseKPICardProps> = ({
  title,
  value,
  unit,
  trend,
  trendValue,
  trendLabel,
  progress,
  progressColor = 'emerald',
  variant = 'neutral',
  icon,
  footer,
  loading = false,
  onClick,
  className = '',
  lang = 'ar',
}) => {
  const tone = TONE[variant] ?? TONE.neutral;
  const TrendIcon = trend ? TREND_ICON[trend] : null;
  const trendColorClass = trend ? TREND_COLOR[trend] : '';
  const isClickable = !!onClick;

  if (loading) {
    return (
      <div className={cn('bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-xs p-4 space-y-3', className)} role="status" aria-label="Loading metric">
        <div className="flex items-center justify-between">
          <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded-full w-24 animate-shimmer" />
          <div className="h-8 w-8 bg-slate-200 dark:bg-zinc-800 rounded-xl animate-shimmer" />
        </div>
        <div className="h-7 bg-slate-200 dark:bg-zinc-800 rounded-full w-32 animate-shimmer" />
        <div className="h-2 bg-slate-200 dark:bg-zinc-800 rounded-full w-full animate-shimmer" />
        <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded-full w-16 animate-shimmer" />
      </div>
    );
  }

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={isClickable ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
      className={cn(
        'bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-xs',
        'p-4 relative overflow-hidden transition-all duration-200 group',
        isClickable && 'cursor-pointer hover:shadow-md hover:border-emerald-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900',
        className
      )}
    >
      {/* Ambient accent glow on hover */}
      {isClickable && (
        <div className={cn('absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl', tone.bg)} />
      )}

      <div className="relative z-10">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 leading-tight">
            {title}
          </span>
          {icon && (
            <span className={cn('shrink-0 p-1.5 rounded-xl border', tone.bg, tone.iconClass, tone.border)}>
              {icon}
            </span>
          )}
        </div>

        {/* Main Value */}
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="text-2xl font-mono font-black tabular-nums text-slate-900 dark:text-white leading-none">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {unit && (
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-bold">{unit}</span>
          )}
        </div>

        {/* Progress Bar */}
        {progress !== undefined && (
          <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5 mt-2.5 mb-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${PROGRESS_BAR[progressColor]}`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        )}

        {/* Trend Row */}
        {(TrendIcon || trendLabel) && (
          <div className={`flex items-center gap-1 text-[11px] font-bold mt-1 ${trendColorClass}`}>
            {TrendIcon && <TrendIcon className="w-3.5 h-3.5" aria-hidden="true" />}
            {trendValue && <span>{trendValue}</span>}
            {trendLabel && <span className="text-slate-400 dark:text-zinc-500 font-medium">{trendLabel}</span>}
          </div>
        )}

        {/* Navigate Chevron */}
        {isClickable && (
          <ArrowUpRight className="absolute bottom-3 end-3 w-3.5 h-3.5 text-slate-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}

        {/* Footer Slot */}
        {footer && <div className="mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800/80">{footer}</div>}
      </div>
    </div>
  );
};

export default EnterpriseKPICard;
