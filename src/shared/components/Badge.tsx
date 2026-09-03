// ═══════════════════════════════════════════════════════════════════════════════
// UAMEX ERP™ — Badge Component
// Premium Design System Component v2.0
// ═══════════════════════════════════════════════════════════════════════════════
//
// © 2026 Rohamaa Baynahum Charity Foundation - UAMEX ERP™
// One Platform. One Organization. One Vision.
//
// Advanced badge with:
// - Multiple variants and sizes
// - Status indicators
// - Count animations
// - Bilingual support
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { type LucideIcon } from 'lucide-react';

export type BadgeVariant = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

export interface BadgeProps {
  /** Badge content */
  children?: React.ReactNode;
  /** Text content */
  text?: string;
  /** Badge variant */
  variant?: BadgeVariant;
  /** Size */
  size?: BadgeSize;
  /** Icon */
  icon?: LucideIcon;
  /** Show pulse animation */
  pulse?: boolean;
  /** Show dot indicator */
  dot?: boolean;
  /** Outline style */
  outline?: boolean;
  /** Rounded pill style */
  pill?: boolean;
  /** Count (for notification badges) */
  count?: number;
  /** Max count to display */
  maxCount?: number;
  /** Language */
  lang: 'ar' | 'en';
  /** ARIA label */
  ariaLabel?: string;
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string; border: string; dot: string }> = {
  primary: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-300 dark:border-emerald-700',
    dot: 'bg-emerald-500',
  },
  accent: {
    bg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-300 dark:border-amber-700',
    dot: 'bg-amber-500',
  },
  success: {
    bg: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-300 dark:border-green-700',
    dot: 'bg-green-500',
  },
  warning: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-300 dark:border-yellow-700',
    dot: 'bg-yellow-500',
  },
  danger: {
    bg: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-300 dark:border-red-700',
    dot: 'bg-red-500',
  },
  info: {
    bg: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-300 dark:border-sky-700',
    dot: 'bg-sky-500',
  },
  neutral: {
    bg: 'bg-slate-100 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700',
    text: 'text-slate-500 dark:text-zinc-400',
    border: 'border-slate-300 dark:border-zinc-600',
    dot: 'bg-slate-400',
  },
};

const SIZE_STYLES: Record<BadgeSize, string> = {
  xs: 'text-[9px] px-1.5 py-0.5 gap-0.5',
  sm: 'text-[10px] px-2 py-0.5 gap-1',
  md: 'text-xs px-2.5 py-1 gap-1',
  lg: 'text-sm px-3 py-1.5 gap-1.5',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  text,
  variant = 'primary',
  size = 'sm',
  icon: Icon,
  pulse = false,
  dot = false,
  outline = false,
  pill = false,
  count,
  maxCount = 99,
  lang,
  ariaLabel,
}) => {
  const styles = VARIANT_STYLES[variant];
  const sizeClass = SIZE_STYLES[size];

  // Count badge
  if (count !== undefined) {
    const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
    return (
      <span
        className={`
          inline-flex items-center justify-center
          ${pill ? 'rounded-full' : 'rounded-md'}
          ${outline
            ? `bg-transparent border ${styles.border} ${styles.text}`
            : `${styles.bg} border ${styles.border}`
          }
          min-w-[1.25rem] h-5 px-1.5 text-[10px] font-black tabular-nums
          ${pulse ? 'animate-pulse' : ''}
        `}
        role="status"
        aria-label={ariaLabel ?? `Count: ${count}`}
      >
        {displayCount}
      </span>
    );
  }

  // Dot indicator
  if (dot) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 ${sizeClass} ${pill ? 'rounded-full' : 'rounded-md'} ${outline ? `bg-transparent border ${styles.border} ${styles.text}` : `${styles.bg} border ${styles.border}`}`}
        role="status"
        aria-label={ariaLabel}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${styles.dot} ${pulse ? 'animate-pulse' : ''}`} />
        {(text || children) && (text ?? children)}
      </span>
    );
  }

  // Icon badge
  if (Icon) {
    return (
      <span
        className={`
          inline-flex items-center ${sizeClass}
          ${pill ? 'rounded-full' : 'rounded-md'}
          ${outline ? `bg-transparent border ${styles.border} ${styles.text}` : `${styles.bg} border ${styles.border}`}
          ${pulse ? 'animate-pulse' : ''}
        `}
        role="status"
        aria-label={ariaLabel ?? text}
      >
        <Icon className={size === 'xs' ? 'w-2.5 h-2.5' : size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        {(text || children) && <span>{(text ?? children)}</span>}
      </span>
    );
  }

  // Standard badge
  return (
    <span
      className={`
        inline-flex items-center ${sizeClass}
        ${pill ? 'rounded-full' : 'rounded-md'}
        ${outline ? `bg-transparent border ${styles.border} ${styles.text}` : `${styles.bg} border ${styles.border}`}
        ${pulse ? 'animate-pulse' : ''}
      `}
      role="status"
      aria-label={ariaLabel ?? text}
    >
      {text ?? children}
    </span>
  );
};

export default Badge;