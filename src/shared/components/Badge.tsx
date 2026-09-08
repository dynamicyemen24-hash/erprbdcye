/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * UAMEX ERP™ — Badge Component v3.0
 * Multi-variant badge with count, dot, icon, pulse, outline, RTL
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import React, { forwardRef } from 'react';
import { cn } from '../../design-system/utils/cn';

export type BadgeVariant = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  pulse?: boolean;
  dot?: boolean;
  outline?: boolean;
  pill?: boolean;
  count?: number;
  maxCount?: number;
  lang?: 'ar' | 'en';
}

const SIZE_MAP: Record<BadgeSize, string> = {
  xs: 'px-1.5 py-0.5 text-[10px] gap-0.5',
  sm: 'px-2 py-0.5 text-[11px] gap-1',
  md: 'px-2.5 py-1 text-xs gap-1',
  lg: 'px-3 py-1 text-sm gap-1.5',
};

const ICON_SIZE: Record<BadgeSize, string> = {
  xs: 'w-2.5 h-2.5',
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
};

const VARIANT_MAP: Record<BadgeVariant, { solid: string; outline: string; dot: string }> = {
  primary: { solid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', outline: 'border-emerald-400 text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  accent: { solid: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800', outline: 'border-amber-400 text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  success: { solid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', outline: 'border-emerald-400 text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  warning: { solid: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800', outline: 'border-amber-400 text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  danger: { solid: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800', outline: 'border-red-400 text-red-600 dark:text-red-400', dot: 'bg-red-500' },
  info: { solid: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200 dark:border-sky-800', outline: 'border-sky-400 text-sky-600 dark:text-sky-400', dot: 'bg-sky-500' },
  neutral: { solid: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700', outline: 'border-zinc-400 text-zinc-600 dark:text-zinc-400', dot: 'bg-zinc-400' },
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'neutral',
      size = 'sm',
      icon,
      pulse = false,
      dot = false,
      outline = false,
      pill = true,
      count,
      maxCount = 99,
      children,
      className,
      lang = 'ar',
      ...props
    },
    ref
  ) => {
    const styles = VARIANT_MAP[variant];
    const displayCount = count !== undefined ? (count > maxCount ? `${maxCount}+` : String(count)) : null;

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-bold select-none border',
          pill ? 'rounded-full' : 'rounded-md',
          SIZE_MAP[size],
          outline ? styles.outline : styles.solid,
          className
        )}
        {...props}
      >
        {dot && (
          <span className="relative flex">
            <span className={cn('w-1.5 h-1.5 rounded-full', styles.dot)} />
            {pulse && (
              <span className={cn('absolute inset-0 w-1.5 h-1.5 rounded-full animate-ping', styles.dot)} />
            )}
          </span>
        )}
        {icon && <span className={cn('shrink-0', ICON_SIZE[size])}>{icon}</span>}
        {displayCount && <span className="tabular-nums">{displayCount}</span>}
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';
