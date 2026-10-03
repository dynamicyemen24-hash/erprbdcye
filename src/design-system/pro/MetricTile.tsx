import React, { useId, useMemo } from 'react';
import { cn } from '../utils/cn';
import { SkeletonKPI } from '../components/Skeleton';

/**
 * MetricTile — the canonical KPI tile.
 *
 * One component replaces the copy-pasted dashboard cards: label, formatted
 * value, period delta with semantic tone, optional sparkline, freshness state
 * (live/stale/error) and a loading skeleton. Values are always supplied by the
 * caller from live data — this component never invents a number.
 */

export type MetricTone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral';
export type MetricFreshness = 'live' | 'stale' | 'error';

export interface MetricTileProps {
  label: string;
  labelEn?: string;
  value: string | number;
  unit?: string;
  /** Percent change vs the previous period (e.g. 12.4 => +12.4%). */
  delta?: number;
  deltaLabel?: string;
  /** Which direction is good for this metric: costs improve when they fall. */
  goodDirection?: 'up' | 'down' | 'neutral';
  /** Sparkline series (≥2 points), oldest → newest. */
  trend?: number[];
  tone?: MetricTone;
  freshness?: MetricFreshness;
  icon?: React.ReactNode;
  caption?: string;
  loading?: boolean;
  onClick?: () => void;
  lang?: 'ar' | 'en';
  className?: string;
}

const TONE_STROKE: Record<MetricTone, string> = {
  brand: 'stroke-emerald-500',
  success: 'stroke-emerald-500',
  warning: 'stroke-amber-500',
  danger: 'stroke-red-500',
  neutral: 'stroke-zinc-400',
};

const FRESHNESS_DOT: Record<MetricFreshness, string> = {
  live: 'bg-emerald-500 animate-pulse',
  stale: 'bg-amber-500',
  error: 'bg-red-500',
};

const FRESHNESS_AR: Record<MetricFreshness, string> = {
  live: 'محدّث مباشرة',
  stale: 'بيانات قديمة',
  error: 'تعذّر التحديث',
};
const FRESHNESS_EN: Record<MetricFreshness, string> = {
  live: 'Live',
  stale: 'Stale',
  error: 'Update failed',
};

function Sparkline({ series, tone }: { series: number[]; tone: MetricTone }) {
  const width = 96;
  const height = 28;
  const pad = 3;
  const points = useMemo(() => {
    const min = Math.min(...series);
    const max = Math.max(...series);
    const span = max - min || 1;
    const step = series.length > 1 ? (width - pad * 2) / (series.length - 1) : 0;
    return series
      .map((v, i) => {
        const x = pad + i * step;
        const y = height - pad - ((v - min) / span) * (height - pad * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [series]);
  const area = `${pad},${height - pad} ${points} ${width - pad},${height - pad}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-24 h-7 shrink-0"
      aria-hidden="true"
      preserveAspectRatio="none"
      data-testid="metric-sparkline"
    >
      <polyline points={area} fill="currentColor" opacity="0.12" />
      <polyline
        points={points}
        fill="none"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        className={TONE_STROKE[tone]}
      />
    </svg>
  );
}

function DeltaChip({
  delta,
  goodDirection,
  lang,
}: {
  delta: number;
  goodDirection: 'up' | 'down' | 'neutral';
  lang: 'ar' | 'en';
}) {
  const rising = delta > 0;
  const flat = delta === 0;
  const good =
    flat || goodDirection === 'neutral'
      ? 'neutral'
      : (rising && goodDirection === 'up') || (!rising && goodDirection === 'down')
        ? 'good'
        : 'bad';
  const toneClass =
    good === 'good'
      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
      : good === 'bad'
        ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
        : 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800';
  const sign = flat ? '' : rising ? '+' : '−';
  const abs = Math.abs(delta);

  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums', toneClass)}
      data-testid="metric-delta"
    >
      {!flat && (
        <svg viewBox="0 0 8 8" className="w-2 h-2" aria-hidden="true">
          <path d={rising ? 'M4 1 L7 6 L1 6 Z' : 'M4 7 L1 2 L7 2 Z'} fill="currentColor" />
        </svg>
      )}
      {sign}
      {abs.toLocaleString(undefined, { maximumFractionDigits: 1 })}%
      <span className="sr-only">
        {lang === 'ar' ? (rising ? 'ارتفاع' : flat ? 'ثابت' : 'انخفاض') : rising ? 'up' : flat ? 'flat' : 'down'}
      </span>
    </span>
  );
}

export function MetricTile({
  label,
  labelEn,
  value,
  unit,
  delta,
  deltaLabel,
  goodDirection = 'up',
  trend,
  tone = 'brand',
  freshness,
  icon,
  caption,
  loading,
  onClick,
  lang = 'ar',
  className,
}: MetricTileProps) {
  const titleId = useId();
  const displayLabel = lang === 'ar' ? label : labelEn || label;
  const displayValue =
    typeof value === 'number' ? value.toLocaleString() : value;

  if (loading) {
    return <SkeletonKPI className={className} />;
  }

  const rootClass = cn(
    'flex flex-col gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-900 p-4 text-start',
    'transition-colors',
    onClick &&
      'cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ux-primary)]',
    className
  );
  const ariaLabel = [displayLabel, displayValue, unit].filter(Boolean).join(' ');

  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span id={titleId} className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 truncate">
          {displayLabel}
        </span>
        <span className="flex items-center gap-1.5 shrink-0">
          {freshness && (
            <span
              className={cn('inline-block w-1.5 h-1.5 rounded-full', FRESHNESS_DOT[freshness])}
              title={lang === 'ar' ? FRESHNESS_AR[freshness] : FRESHNESS_EN[freshness]}
            />
          )}
          {icon && <span className="text-zinc-400 [&>svg]:w-4 [&>svg]:h-4">{icon}</span>}
        </span>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-white truncate">
          {displayValue}
          {unit && (
            <span className="ms-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">{unit}</span>
          )}
        </div>
        {trend && trend.length > 1 && <Sparkline series={trend} tone={tone} />}
      </div>

      <div className="flex items-center justify-between gap-2 min-h-[20px]">
        {delta !== undefined && <DeltaChip delta={delta} goodDirection={goodDirection} lang={lang} />}
        {caption && (
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate ms-auto">{caption}</span>
        )}
        {delta !== undefined && deltaLabel && !caption && (
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate ms-auto">{deltaLabel}</span>
        )}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-label={ariaLabel} className={rootClass}>
        {content}
      </button>
    );
  }

  return (
    <div role="group" aria-label={ariaLabel} className={rootClass}>
      {content}
    </div>
  );
}
