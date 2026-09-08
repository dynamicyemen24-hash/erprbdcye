/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * UAMEX ERP™ — ProgressRing Component v3.0
 * Circular progress indicator with SVG, animated value, label
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { cn } from '../../design-system/utils/cn';

export type ProgressRingSize = 'sm' | 'md' | 'lg' | 'xl';
export type ProgressRingVariant = 'primary' | 'accent' | 'success' | 'danger' | 'info';

export interface ProgressRingProps {
  value: number; // 0-100
  size?: ProgressRingSize;
  variant?: ProgressRingVariant;
  strokeWidth?: number;
  showLabel?: boolean;
  label?: string;
  labelAr?: string;
  lang?: 'ar' | 'en';
  animated?: boolean;
  className?: string;
}

const SIZE_MAP: Record<ProgressRingSize, { container: string; fontSize: string }> = {
  sm: { container: 'w-12 h-12', fontSize: 'text-[10px]' },
  md: { container: 'w-16 h-16', fontSize: 'text-xs' },
  lg: { container: 'w-24 h-24', fontSize: 'text-sm' },
  xl: { container: 'w-32 h-32', fontSize: 'text-base' },
};

const STROKE_MAP: Record<ProgressRingSize, number> = {
  sm: 3,
  md: 4,
  lg: 6,
  xl: 8,
};

const COLOR_MAP: Record<ProgressRingVariant, { stroke: string; text: string; track: string }> = {
  primary: { stroke: '#059669', text: 'text-emerald-600 dark:text-emerald-400', track: '#d1fae5' },
  accent: { stroke: '#d97706', text: 'text-amber-600 dark:text-amber-400', track: '#fef3c7' },
  success: { stroke: '#10b981', text: 'text-emerald-600 dark:text-emerald-400', track: '#d1fae5' },
  danger: { stroke: '#ef4444', text: 'text-red-600 dark:text-red-400', track: '#fee2e2' },
  info: { stroke: '#3b82f6', text: 'text-blue-600 dark:text-blue-400', track: '#dbeafe' },
};

export function ProgressRing({
  value,
  size = 'md',
  variant = 'primary',
  strokeWidth: customStroke,
  showLabel = true,
  label,
  labelAr,
  lang = 'ar',
  animated = true,
  className,
}: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const sizeConfig = SIZE_MAP[size];
  const stroke = customStroke || STROKE_MAP[size];
  const colors = COLOR_MAP[variant];

  // SVG circle math
  const containerSize = size === 'sm' ? 48 : size === 'md' ? 64 : size === 'lg' ? 96 : 128;
  const radius = (containerSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', sizeConfig.container, className)}>
      <svg
        className="w-full h-full -rotate-90"
        viewBox={`0 0 ${containerSize} ${containerSize}`}
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        role="progressbar"
        aria-label={lang === 'ar' ? (labelAr || `${clamped}%`) : (label || `${clamped}%`)}
      >
        {/* Track */}
        <circle
          cx={containerSize / 2}
          cy={containerSize / 2}
          r={radius}
          fill="none"
          stroke={colors.track}
          strokeWidth={stroke}
        />
        {/* Value */}
        <circle
          cx={containerSize / 2}
          cy={containerSize / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={animated ? 'transition-all duration-700 ease-out' : ''}
        />
      </svg>

      {/* Center Label */}
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold tabular-nums text-zinc-900 dark:text-white', sizeConfig.fontSize)}>
            {Math.round(clamped)}%
          </span>
        </div>
      )}
    </div>
  );
}
