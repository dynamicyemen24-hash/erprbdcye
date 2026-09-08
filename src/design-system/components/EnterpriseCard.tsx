/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * UAMEX ERP™ — Enterprise Card Component v3.0
 * Reusable card with header, body, footer, and status indicators
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { cn } from '../utils/cn';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'glass';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface EnterpriseCardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  status?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  onClick?: () => void;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/50 shadow-sm',
  elevated: 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/50 shadow-lg',
  outlined: 'bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700',
  glass: 'bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm',
};

const PADDING_CLASSES: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const STATUS_CLASSES: Record<string, string> = {
  success: 'border-t-emerald-500',
  warning: 'border-t-amber-500',
  danger: 'border-t-red-500',
  info: 'border-t-sky-500',
  neutral: '',
};

export function EnterpriseCard({
  children,
  variant = 'default',
  padding = 'md',
  header,
  footer,
  status,
  onClick,
  className,
  headerClassName,
  bodyClassName,
  footerClassName,
}: EnterpriseCardProps) {
  const isClickable = !!onClick;

  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden transition-all',
        VARIANT_CLASSES[variant],
        status && 'border-t-2',
        status && STATUS_CLASSES[status],
        isClickable && 'cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-[0.99]',
        className
      )}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
    >
      {header && (
        <div className={cn('px-4 py-3 border-b border-zinc-100 dark:border-zinc-800', headerClassName)}>
          {header}
        </div>
      )}
      <div className={cn(PADDING_CLASSES[padding], bodyClassName)}>
        {children}
      </div>
      {footer && (
        <div className={cn('px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50', footerClassName)}>
          {footer}
        </div>
      )}
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────

export interface EnterpriseStatProps {
  label: string;
  labelAr?: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  suffix?: string;
  lang?: 'ar' | 'en';
  className?: string;
}

export function EnterpriseStat({
  label,
  labelAr,
  value,
  icon,
  trend,
  suffix,
  lang = 'ar',
  className,
}: EnterpriseStatProps) {
  const displayLabel = lang === 'ar' ? (labelAr || label) : label;

  return (
    <EnterpriseCard variant="default" padding="md" className={className}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">{displayLabel}</p>
          <div className="flex items-baseline gap-1.5">
            <p className="text-2xl font-extrabold text-zinc-900 dark:text-white">{value}</p>
            {suffix && <span className="text-xs font-medium text-zinc-400">{suffix}</span>}
          </div>
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-1 text-xs font-semibold',
              trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            )}>
              <svg className={cn('w-3 h-3', !trend.isPositive && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
              </svg>
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        {icon && (
          <div className="shrink-0 w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            {icon}
          </div>
        )}
      </div>
    </EnterpriseCard>
  );
}
