/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * UAMEX ERP™ — Skeleton Component v3.0
 * Consistent loading placeholder with shimmer, pulse, and wave animations
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { cn } from '../utils/cn';

export type SkeletonVariant = 'shimmer' | 'pulse' | 'wave';
export type SkeletonShape = 'text' | 'circular' | 'rectangular' | 'rounded';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: SkeletonVariant;
  shape?: SkeletonShape;
  lines?: number;
  className?: string;
}

const VARIANT_CLASSES: Record<SkeletonVariant, string> = {
  shimmer: 'animate-pulse bg-zinc-200 dark:bg-zinc-700',
  pulse: 'animate-pulse bg-zinc-200 dark:bg-zinc-700',
  wave: 'bg-zinc-200 dark:bg-zinc-700',
};

const SHAPE_CLASSES: Record<SkeletonShape, string> = {
  text: 'rounded',
  circular: 'rounded-full',
  rectangular: 'rounded-none',
  rounded: 'rounded-xl',
};

function SkeletonLine({ width, height, variant, shape, className }: Omit<SkeletonProps, 'lines'>) {
  return (
    <div
      className={cn(
        VARIANT_CLASSES[variant || 'shimmer'],
        SHAPE_CLASSES[shape || 'text'],
        className
      )}
      style={{
        width: width || '100%',
        height: height || '1rem',
      }}
    />
  );
}

export function Skeleton({
  width,
  height,
  variant = 'shimmer',
  shape = 'text',
  lines = 1,
  className,
}: SkeletonProps) {
  if (lines === 1) {
    return <SkeletonLine width={width} height={height} variant={variant} shape={shape} className={className} />;
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine
          key={i}
          width={i === lines - 1 ? '70%' : width}
          height={height}
          variant={variant}
          shape={shape}
        />
      ))}
    </div>
  );
}

// ─── Preset Skeletons ────────────────────────────────────────

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900', className)}>
      <div className="flex items-center gap-3 mb-3">
        <Skeleton shape="circular" width={40} height={40} />
        <div className="flex-1">
          <Skeleton width="60%" height={16} className="mb-2" />
          <Skeleton width="40%" height={12} />
        </div>
      </div>
      <Skeleton lines={3} className="mb-3" />
      <div className="flex gap-2">
        <Skeleton width={80} height={32} shape="rounded" />
        <Skeleton width={80} height={32} shape="rounded" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      <div className="flex gap-4 mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-700">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} width="15%" height={14} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              width={colIdx === 0 ? '25%' : colIdx === cols - 1 ? '10%' : `${60 / (cols - 1)}%`}
              height={14}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonKPI({ className }: { className?: string }) {
  return (
    <div className={cn('p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900', className)}>
      <Skeleton width="40%" height={12} className="mb-2" />
      <Skeleton width="70%" height={28} className="mb-2" />
      <Skeleton width="50%" height={12} />
    </div>
  );
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn('p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900', className)}>
      <Skeleton width="30%" height={16} className="mb-4" />
      <div className="flex items-end gap-2 h-32">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            width="100%"
            height={`${30 + (i * 7) % 70}%`}
            shape="rounded"
          />
        ))}
      </div>
    </div>
  );
}
