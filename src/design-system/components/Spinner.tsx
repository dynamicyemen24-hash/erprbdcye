/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * UAMEX ERP™ — Spinner Component v3.0
 * Loading indicator with multiple sizes, variants, and optional text
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { cn } from '../../design-system/utils/cn';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'default' | 'primary' | 'accent' | 'white';

export interface SpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  label?: string;
  labelAr?: string;
  lang?: 'ar' | 'en';
  className?: string;
}

const SIZE_MAP: Record<SpinnerSize, string> = {
  xs: 'w-3 h-3 border',
  sm: 'w-4 h-4 border-[1.5px]',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-[3px]',
  xl: 'w-12 h-12 border-4',
};

const VARIANT_MAP: Record<SpinnerVariant, string> = {
  default: 'border-zinc-300 dark:border-zinc-600 border-t-zinc-600 dark:border-t-zinc-200',
  primary: 'border-emerald-300 dark:border-emerald-700 border-t-emerald-600 dark:border-t-emerald-400',
  accent: 'border-amber-300 dark:border-amber-700 border-t-amber-600 dark:border-t-amber-400',
  white: 'border-white/30 border-t-white',
};

export function Spinner({
  size = 'md',
  variant = 'default',
  label = 'Loading...',
  labelAr = 'جاري التحميل...',
  lang = 'ar',
  className,
}: SpinnerProps) {
  const displayLabel = lang === 'ar' ? labelAr : label;
  return (
    <div className={cn('inline-flex items-center gap-2', className)} role="status" aria-label={displayLabel}>
      <div className={cn('rounded-full animate-spin', SIZE_MAP[size], VARIANT_MAP[variant])} />
    </div>
  );
}

// ─── SpinnerOverlay ───────────────────────────────────────────

export interface SpinnerOverlayProps extends SpinnerProps {
  visible?: boolean;
  backdrop?: boolean;
}

export function SpinnerOverlay({ visible = true, backdrop = false, size = 'lg', ...props }: SpinnerOverlayProps) {
  if (!visible) return null;
  return (
    <div className={cn(
      'absolute inset-0 z-40 flex items-center justify-center',
      backdrop && 'bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm',
      !backdrop && 'pointer-events-none'
    )}>
      <div className="flex flex-col items-center gap-3">
        <Spinner size={size} {...props} />
        {(props.label || props.labelAr) && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
            {props.lang === 'ar' ? (props.labelAr || props.label) : (props.label || props.labelAr)}
          </p>
        )}
      </div>
    </div>
  );
}
