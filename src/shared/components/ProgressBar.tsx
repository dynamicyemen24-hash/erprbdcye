// ═══════════════════════════════════════════════════════════════════════════════
// UAMEX ERP™ — Enhanced Progress Bar Component
// Premium Design System Component v2.0
// ═══════════════════════════════════════════════════════════════════════════════
//
// © 2026 Rohamaa Baynahum Charity Foundation - UAMEX ERP™
// One Platform. One Organization. One Vision.
//
// Advanced progress bar with:
// - Multiple variants (linear, circular, segmented, stepped)
// - Color-coded progress (red/yellow/green thresholds)
// - Animated transitions
// - Bilingual support
// - Accessibility (WCAG 2.1 AAA)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export type ProgressVariant = 'linear' | 'circular' | 'segmented' | 'stepped';
export type ProgressStatus = 'success' | 'warning' | 'danger' | 'neutral';

export interface ProgressBarProps {
  /** Current value (0-100) */
  value: number;
  /** Maximum value (default 100) */
  max?: number;
  /** Visual variant */
  variant?: ProgressVariant;
  /** Color status - auto-determined by value if not provided */
  status?: ProgressStatus;
  /** Show percentage label */
  showLabel?: boolean;
  /** Show value as fraction */
  showFraction?: boolean;
  /** Bar height in pixels (linear variant) */
  height?: number;
  /** Bar width */
  width?: string;
  /** Animated transition */
  animated?: boolean;
  /** Animation duration in ms */
  animationMs?: number;
  /** Label (Arabic) */
  labelAr?: string;
  /** Label (English) */
  labelEn?: string;
  /** Language */
  lang: 'ar' | 'en';
  /** Size class */
  size?: 'sm' | 'md' | 'lg';
  /** Sub-label text */
  subLabel?: string;
  /** Striped pattern */
  striped?: boolean;
  /** Show status icon */
  showIcon?: boolean;
  /** ARIA label override */
  ariaLabel?: string;
}

const STATUS_THRESHOLDS = {
  success: 75,
  warning: 40,
};

function determineStatus(value: number, max: number): ProgressStatus {
  const pct = (value / max) * 100;
  if (pct >= COLORS.success) return 'success';
  if (pct >= COLORS.warning) return 'warning';
  return 'danger';
}

const COLORS = {
  success: 75,
  warning: 40,
};

const STATUS_STYLES: Record<ProgressStatus, {
  bg: string;
  fill: string;
  text: string;
  ring: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  success: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    fill: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
    text: 'text-emerald-700 dark:text-emerald-400',
    ring: 'stroke-emerald-500',
    icon: CheckCircle2,
  },
  warning: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    fill: 'bg-gradient-to-r from-amber-500 to-amber-600',
    text: 'text-amber-700 dark:text-amber-400',
    ring: 'stroke-amber-500',
    icon: AlertTriangle,
  },
  danger: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    fill: 'bg-gradient-to-r from-red-500 to-red-600',
    text: 'text-red-700 dark:text-red-400',
    ring: 'stroke-red-500',
    icon: XCircle,
  },
  neutral: {
    bg: 'bg-slate-200 dark:bg-zinc-700',
    fill: 'bg-gradient-to-r from-slate-500 to-slate-600',
    text: 'text-slate-700 dark:text-zinc-300',
    ring: 'stroke-slate-500',
    icon: CheckCircle2,
  },
};

/**
 * Linear Progress Bar
 */
const LinearProgress: React.FC<{
  pct: number;
  status: ProgressStatus;
  height: number;
  animated: boolean;
  striped: boolean;
  showLabel: boolean;
  label: string | undefined;
  showIcon: boolean;
  subLabel: string | undefined;
  size: 'sm' | 'md' | 'lg';
}> = ({ pct, status, height, animated, striped, showLabel, label, showIcon, subLabel, size }) => {
  const styles = STATUS_STYLES[status];
  const StatusIcon = styles.icon;

  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';

  return (
    <div className="w-full">
      {(label || showLabel) && (
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            {showIcon && <StatusIcon className={`w-3 h-3 ${styles.text}`} />}
            {label && <span className={`text-[10px] font-bold ${styles.text}`}>{label}</span>}
          </div>
          {showLabel && (
            <span className={`text-[10px] font-black tabular-nums ${styles.text}`}>
              {Math.round(pct)}%
            </span>
          )}
        </div>
      )}

      <div
        className={`relative ${heightClass} w-full ${styles.bg} rounded-full overflow-hidden`}
        style={{ height: `${height}px` }}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`
            absolute inset-y-0 left-0 ${styles.fill} rounded-full
            ${animated ? 'transition-all duration-700 ease-out' : ''}
            ${striped ? 'bg-stripes' : ''}
          `}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        >
          {animated && pct > 0 && pct < 100 && (
            <div className="absolute inset-0 animate-shimmer-sweep bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          )}
        </div>
      </div>

      {subLabel && (
        <p className="text-[9px] font-medium text-slate-500 dark:text-zinc-400 mt-1">{subLabel}</p>
      )}
    </div>
  );
};

/**
 * Circular Progress
 */
const CircularProgress: React.FC<{
  pct: number;
  status: ProgressStatus;
  size: 'sm' | 'md' | 'lg';
  showLabel: boolean;
}> = ({ pct, status, size, showLabel }) => {
  const styles = STATUS_STYLES[status];
  const dim = size === 'sm' ? 40 : size === 'lg' ? 80 : 56;
  const stroke = size === 'sm' ? 3 : size === 'lg' ? 6 : 4;
  const radius = (dim - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: dim, height: dim }}>
      <svg width={dim} height={dim} className="-rotate-90">
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-slate-200 dark:text-zinc-800"
        />
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${styles.ring} transition-all duration-700 ease-out`}
        />
      </svg>
      {showLabel && (
        <span className={`absolute text-[10px] font-black tabular-nums ${styles.text}`}>
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
};

/**
 * Segmented Progress
 */
const SegmentedProgress: React.FC<{
  pct: number;
  status: ProgressStatus;
  segments?: number;
}> = ({ pct, status, segments = 10 }) => {
  const styles = STATUS_STYLES[status];
  const filled = Math.round((pct / 100) * segments);

  return (
    <div className="flex gap-1 w-full" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          className={`flex-1 h-2 rounded-sm transition-all duration-300 ${
            i < filled ? styles.fill : styles.bg
          }`}
        />
      ))}
    </div>
  );
};

/**
 * Stepped Progress (for milestones)
 */
const SteppedProgress: React.FC<{
  pct: number;
  status: ProgressStatus;
  totalSteps?: number;
}> = ({ pct, status, totalSteps = 5 }) => {
  const styles = STATUS_STYLES[status];
  const currentStep = Math.round((pct / 100) * totalSteps);

  return (
    <div className="flex items-center justify-between w-full" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <React.Fragment key={i}>
          <div
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black
              transition-all duration-300
              ${i < currentStep ? styles.fill + ' text-white' :
                i === currentStep ? styles.bg + ' ' + styles.text + ' ring-2 ' + styles.ring.replace('stroke-', 'ring-') :
                styles.bg + ' text-slate-400 dark:text-zinc-500'}
            `}
          >
            {i < currentStep ? '✓' : i + 1}
          </div>
          {i < totalSteps - 1 && (
            <div
              className={`flex-1 h-1 mx-1 rounded ${i < currentStep ? styles.fill : styles.bg}`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

/**
 * Main ProgressBar Component
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = 'linear',
  status,
  showLabel = true,
  showFraction = false,
  height = 8,
  width,
  animated = true,
  animationMs = 700,
  labelAr,
  labelEn,
  lang,
  size = 'md',
  subLabel,
  striped = false,
  showIcon = false,
  ariaLabel,
}) => {
  const isRtl = lang === 'ar';
  const label = isRtl ? labelAr : labelEn;

  // Animate value
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    if (!animated) {
      setAnimatedValue(value);
      return;
    }

    const start = animatedValue;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(start + (value - start) * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [value, animated, animationMs]);

  const pct = Math.min(100, Math.max(0, (animatedValue / max) * 100));
  const computedStatus = status ?? determineStatus(value, max);

  const commonProps = {
    pct,
    status: computedStatus,
  };

  return (
    <div className={width ? '' : 'w-full'} style={{ width }}>
      {variant === 'linear' && (
        <LinearProgress
          {...commonProps}
          height={height}
          animated={animated}
          striped={striped}
          showLabel={showLabel}
          label={label}
          showIcon={showIcon}
          subLabel={subLabel}
          size={size}
        />
      )}
      {variant === 'circular' && (
        <CircularProgress {...commonProps} size={size} showLabel={showLabel} />
      )}
      {variant === 'segmented' && <SegmentedProgress {...commonProps} />}
      {variant === 'stepped' && <SteppedProgress {...commonProps} />}
    </div>
  );
};

export default ProgressBar;