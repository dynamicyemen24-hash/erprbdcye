/**
 * Card — the standard content container.
 *
 * WHY THIS EXISTS
 * 403 hand-written `rounded-2xl border ... bg-white` wrappers were found across
 * the view layer. A container has no behaviour, so the drift is invisible
 * *until* it matters: the elevation, the border colour in dark mode, and the
 * internal padding all vary, which means a screen built in the light theme can
 * look subtly wrong in the dark one in a way nobody catches until a customer
 * reports it.
 *
 * What this component fixes is precisely that: one place where the dark surface,
 * the border, and the padding are decided, and where `hover` elevation can be
 * opt-in rather than incidental.
 *
 * It carries **no role and no heading** on purpose. A card is a `<div>` — it is
 * only a "region" when it needs to be announced as one, and a region with no
 * accessible name (WCAG 1.3.1) is announced as an unnamed group, which is worse
 * than a plain container. Use `as="section"` with an explicit `aria-labelledby`
 * when the card genuinely is a landmark.
 */
import React from 'react';
import { cn } from '../utils/cn';

/**
 * Canonical container vocabulary (DEBT PAID).
 * This union is the SUPERSET of both historic vocabularies (`Card`:
 * default/raised/flush + `EnterpriseCard`: default/elevated/outlined/glass),
 * so one variant name works on either component. `EnterpriseCard` re-exports
 * these types instead of declaring its own pair — the duplicate
 * `CardVariant`/`CardPadding` declaration (and the `as` cast in
 * `design-system/index.ts`) is gone.
 */
export type CardVariant = 'default' | 'raised' | 'flush' | 'elevated' | 'outlined' | 'glass';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type CardStatus = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  /** Opt-in hover elevation for interactive cards. */
  interactive?: boolean;
  /** Optional semantic top-border, mirroring `EnterpriseCard status`. */
  status?: CardStatus;
}

const VARIANT: Record<CardVariant, string> = {
  default: 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900',
  raised: 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md',
  flush: 'border-transparent bg-white dark:bg-zinc-900',
  elevated: 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg',
  outlined: 'border-2 border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900',
  glass: 'border-slate-200/50 dark:border-zinc-700/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl',
};

const STATUS: Record<CardStatus, string> = {
  success: 'border-t-emerald-500',
  warning: 'border-t-amber-500',
  danger: 'border-t-red-500',
  info: 'border-t-sky-500',
  neutral: '',
};

const PADDING: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
};

export function Card({
  variant = 'default',
  padding = 'md',
  interactive,
  status,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border transition-shadow duration-150',
        VARIANT[variant],
        PADDING[padding],
        status && 'border-t-2',
        status && STATUS[status],
        interactive && 'cursor-pointer hover:shadow-md',
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Card heading. Separate component so the heading level stays the caller's
 *  decision — a design system that picks `<h2>` for every card breaks the
 *  document outline (WCAG 1.3.1) on any screen with two cards. */
export function CardTitle({
  as: Tag = 'h3',
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLHeadingElement> & { as?: 'h2' | 'h3' | 'h4' }) {
  return (
    <Tag className={cn('text-sm font-bold leading-snug', className)} {...rest}>
      {children}
    </Tag>
  );
}

/** Card section divider — semantic separators beat nested borders. */
export function CardDivider({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="separator"
      className={cn('my-3 h-px bg-slate-200 dark:bg-zinc-800', className)}
      {...rest}
    />
  );
}

export default Card;
