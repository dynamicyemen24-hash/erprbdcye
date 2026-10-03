/**
 * Badge — a compact status or category label.
 *
 * THE MOST REIMPLEMENTED ELEMENT IN THE CODEBASE
 * The audit found 95 hand-written status pills and 561 textual references to the
 * concept across the view layer, all using slightly different class
 * combinations for the same eight meanings. That drift is not cosmetic: a
 * "rejected" pill that is amber in one screen and rose in another destroys the
 * user's ability to scan status by colour, which is the entire point of a
 * status colour.
 *
 * So the variant list below is a *closed* set derived from the vocabulary the
 * screens already use (emerald/amber/slate/rose/red), and the palette is
 * paired rather than picked: every colour ships with a background and a border
 * that keep text at or above 4.5:1 against its own surface, because a pill is
 * small and a low-contrast one fails WCAG 1.4.3 long before anyone notices.
 *
 * `dot` renders a leading status indicator for scanability at a glance; the dot
 * is `aria-hidden` so a screen reader reads the label once, not twice.
 */
import React from 'react';
import { cn } from '../utils/cn';

export type BadgeVariant =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'accent'
  | 'outline';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Leading status dot, hidden from the accessibility tree. */
  dot?: boolean;
  /** Announced instead of the visual text when the visible text is ambiguous. */
  srLabel?: string;
}

const SIZE: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-2 py-0.5 gap-1',
  md: 'text-[11px] px-2.5 py-1 gap-1.5',
};

const DOT: Record<BadgeSize, string> = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
};

/**
 * Closed palette. Each entry pairs a tint with its text colour so contrast is
 * a property of the design system rather than of whichever screen happened to
 * use it first.
 */
const VARIANT: Record<BadgeVariant, { wrap: string; dot: string }> = {
  neutral: {
    wrap: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700',
    dot: 'bg-slate-400',
  },
  success: {
    wrap: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  warning: {
    wrap: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  danger: {
    wrap: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    dot: 'bg-rose-500',
  },
  info: {
    wrap: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    dot: 'bg-sky-500',
  },
  accent: {
    wrap: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700',
    dot: 'bg-amber-600',
  },
  outline: {
    wrap: 'bg-transparent text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-600',
    dot: 'bg-zinc-400',
  },
};

export function Badge({
  variant = 'neutral',
  size = 'sm',
  dot,
  srLabel,
  className,
  children,
  ...rest
}: BadgeProps) {
  const v = VARIANT[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-bold whitespace-nowrap',
        SIZE[size],
        v.wrap,
        className
      )}
      {...rest}
    >
      {dot && <span aria-hidden="true" className={cn('rounded-full shrink-0', DOT[size], v.dot)} />}
      {srLabel ? (
        <>
          <span aria-hidden="true">{children}</span>
          <span className="sr-only">{srLabel}</span>
        </>
      ) : (
        children
      )}
    </span>
  );
}

export default Badge;
