// ═══════════════════════════════════════════════════════════════════════════════
// UAMEX ERP™ — Skeleton Loading Components
// Premium Design System Component v2.0
// ═══════════════════════════════════════════════════════════════════════════════
//
// © 2026 Rohamaa Baynahum Charity Foundation - UAMEX ERP™
// One Platform. One Organization. One Vision.
//
// Advanced skeleton loading components with:
// - Multiple variants (card, list, table, chart)
// - Shimmer animation
// - Bilingual support
// - Accessibility (ARIA labels)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';

export type SkeletonVariant = 'text' | 'circle' | 'rect' | 'card' | 'list' | 'table' | 'chart';
export type SkeletonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  size?: SkeletonSize;
  width?: string | number;
  height?: string | number;
  count?: number;
  className?: string;
  /** Animation type */
  animation?: 'shimmer' | 'pulse' | 'wave';
  /** Label for accessibility */
  label?: string;
  /** Number of lines for text variant */
  lines?: number;
}

const SIZE_CLASSES: Record<SkeletonSize, string> = {
  xs: 'h-2',
  sm: 'h-3',
  md: 'h-4',
  lg: 'h-6',
  xl: 'h-8',
};

const ANIMATION_CLASSES: Record<'shimmer' | 'pulse' | 'wave', string> = {
  shimmer: 'animate-shimmer',
  pulse: 'animate-pulse',
  wave: 'animate-wave',
};

/**
 * Generate stable random widths for skeleton lines
 */
function useStableWidths(count: number, seed = 'skeleton'): number[] {
  return useMemo(() => {
    const widths: number[] = [];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0;
    }
    for (let i = 0; i < count; i++) {
      hash = (hash * 9301 + 49297) % 233280;
      const width = 60 + (hash / 233280) * 40;
      widths.push(Math.round(width));
    }
    return widths;
  }, [count, seed]);
}

/**
 * Base Skeleton primitive
 */
const SkeletonBase: React.FC<{
  className?: string;
  animation: 'shimmer' | 'pulse' | 'wave';
  style?: React.CSSProperties;
  label?: string;
}> = ({ className = '', animation, style, label }) => (
  <div
    className={`
      relative overflow-hidden bg-slate-200 dark:bg-zinc-800 rounded
      ${ANIMATION_CLASSES[animation]}
      ${className}
    `}
    style={style}
    role="status"
    aria-label={label ?? 'Loading...'}
  >
    {animation === 'shimmer' && (
      <div className="absolute inset-0 -translate-x-full animate-shimmer-sweep bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" />
    )}
  </div>
);

/**
 * Enhanced Skeleton Component
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  size = 'md',
  width,
  height,
  count = 1,
  className = '',
  animation = 'shimmer',
  label,
  lines = 1,
}) => {
  const widths = useStableWidths(Math.max(lines, count));

  // Text variant - multiple lines
  if (variant === 'text') {
    return (
      <div className="space-y-2" aria-label={label}>
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonBase
            key={i}
            animation={animation}
            className={`${SIZE_CLASSES[size]} ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
            style={{ width: i === lines - 1 ? '66%' : '100%' }}
            label={i === 0 ? label : undefined}
          />
        ))}
      </div>
    );
  }

  // Circle variant
  if (variant === 'circle') {
    const sizeMap = { xs: 'w-4 h-4', sm: 'w-6 h-6', md: 'w-8 h-8', lg: 'w-12 h-12', xl: 'w-16 h-16' };
    return (
      <SkeletonBase
        animation={animation}
        className={`${sizeMap[size]} rounded-full ${className}`}
        label={label}
      />
    );
  }

  // Card variant
  if (variant === 'card') {
    return (
      <div
        className={`rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3 ${className}`}
        aria-label={label ?? 'Loading card'}
      >
        <div className="flex items-center gap-3">
          <Skeleton variant="circle" size="md" animation={animation} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" size="sm" animation={animation} lines={2} />
          </div>
        </div>
        <Skeleton variant="text" size="md" animation={animation} lines={3} />
        <div className="flex gap-2 pt-2">
          <Skeleton variant="rect" size="sm" animation={animation} width={80} />
          <Skeleton variant="rect" size="sm" animation={animation} width={60} />
        </div>
      </div>
    );
  }

  // List variant
  if (variant === 'list') {
    return (
      <div className={`space-y-3 ${className}`} aria-label={label ?? 'Loading list'}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton variant="circle" size="sm" animation={animation} />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" size="sm" animation={animation} lines={1} />
              <Skeleton variant="text" size="xs" animation={animation} lines={1} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Table variant
  if (variant === 'table') {
    const cols = 4;
    return (
      <div className={`space-y-2 ${className}`} aria-label={label ?? 'Loading table'}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex gap-4 p-2">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton
                key={j}
                variant="text"
                size="sm"
                animation={animation}
                className="flex-1"
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Chart variant
  if (variant === 'chart') {
    return (
      <div
        className={`rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 ${className}`}
        aria-label={label ?? 'Loading chart'}
      >
        <div className="flex items-end justify-between gap-1 h-32">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonBase
              key={i}
              animation={animation}
              className="flex-1 rounded-t"
              style={{ height: `${30 + (widths[i % widths.length] % 70)}%` }}
            />
          ))}
        </div>
        <div className="mt-3">
          <Skeleton variant="text" size="sm" animation={animation} lines={1} />
        </div>
      </div>
    );
  }

  // Rect variant (default)
  return (
    <SkeletonBase
      animation={animation}
      className={`${SIZE_CLASSES[size]} ${className}`}
      style={{
        width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
      }}
      label={label}
    />
  );
};

export default Skeleton;