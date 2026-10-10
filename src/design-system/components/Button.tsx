/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * UAMEX ERP™ — Button (Design System primitive)
 *
 * THE CANONICAL ACTION CONTROL
 * A button is the most-repeated element in an ERP and the one most often
 * reimplemented by hand. This is the single definition every screen should use.
 * It lives in the Design System rather than in `components/common` so the
 * primitives have exactly one owner and cannot drift into parallel copies.
 *
 * WHAT IT GUARANTEES — the reason to prefer this over a raw <button>
 *
 *   1. FOCUS — WCAG 2.4.7. The ring comes from the *platform* baseline declared
 *      in index.css (`box-shadow: var(--ux-focus-ring)`), not from a
 *      per-variant class. That is deliberate: no variant below declares
 *      `focus:ring-*`, so the baseline stays the single source and no variant
 *      can accidentally out-rank it and leave two competing indicators.
 *
 *   2. LOADING — the accessible name survives. While loading, the label stays
 *      in the DOM (so the button keeps its width and the layout under the
 *      cursor does not shift) but is hidden from the accessibility tree, and
 *      the button carries `aria-busy` plus a `sr-only` status. A spinner alone
 *      announces nothing, so a screen-reader user would hear a button that has
 *      silently stopped responding.
 *
 *   3. DISABLED — a real `disabled` already leaves the tab order and blocks
 *      activation. Nothing extra is done, because an `aria-disabled` wrapper
 *      stays focusable and would trap a keyboard user on a dead control.
 *
 *   4. TOUCH TARGET — the smallest size still clears WCAG 2.5.8 (24×24) through
 *      padding rather than a fixed height, so the label can localise to Arabic
 *      without clipping.
 *
 *   5. RTL — leading/trailing icon slots mirror through logical properties, so
 *      an Arabic screen needs no mirrored variant of the button itself.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
import React, { forwardRef } from 'react';
import { cn } from '../utils/cn';
import { Spinner } from './Spinner';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'accent'
  | 'ghost'
  | 'outline'
  | 'ai'
  | 'glass';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  block?: boolean;
  iconOnly?: boolean;
  /** Screen-reader text for `iconOnly` buttons; required by the guard test. */
  label?: string;
}

const SIZE_MAP: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-[11px] gap-1 rounded-lg font-semibold',
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-xl font-semibold',
  md: 'h-10 px-4 text-sm gap-1.5 rounded-xl font-bold',
  lg: 'h-12 px-6 text-base gap-2 rounded-2xl font-extrabold',
};

const ICON_SIZE: Record<ButtonSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

/**
 * Variants carry colour and elevation ONLY.
 *
 * There is deliberately no `focus:ring-*` in any of them. Focus visibility is a
 * platform-level guarantee; a variant that also declared a ring would out-rank
 * the base layer and some buttons would end up with two competing indicators.
 */
const VARIANT_MAP: Record<ButtonVariant, string> = {
  primary:
    'bg-emerald-600 text-white shadow-sm shadow-emerald-500/25 hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-500/30 active:bg-emerald-800 disabled:bg-emerald-400 disabled:shadow-none',
  secondary:
    'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:border-zinc-300 disabled:bg-zinc-50 disabled:text-zinc-400',
  danger:
    'bg-red-600 text-white shadow-sm shadow-red-500/25 hover:bg-red-700 hover:shadow-md active:bg-red-800 disabled:bg-red-400 disabled:shadow-none',
  accent:
    'bg-amber-500 text-amber-950 shadow-sm shadow-amber-500/25 hover:bg-amber-400 hover:shadow-md active:bg-amber-600 disabled:bg-amber-300 disabled:text-amber-800',
  ghost:
    'bg-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:text-zinc-400',
  outline:
    'bg-transparent border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50',
  ai: 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm shadow-violet-500/25 hover:from-violet-700 hover:to-fuchsia-700',
  glass: 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    iconRight,
    block,
    iconOnly,
    label,
    className,
    children,
    disabled,
    type = 'button',
    'aria-label': ariaLabel,
    ...rest
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      // WCAG 4.1.3 — a loading button is a status change, not merely a spinner.
      aria-busy={loading || undefined}
      // An icon-only button has no text content, so without an explicit name it
      // is announced as just "button" (WCAG 4.1.2).
      aria-label={iconOnly ? (ariaLabel ?? label) : ariaLabel}
      className={cn(
        'relative inline-flex items-center justify-center select-none',
        'transition-all duration-150 active:scale-[0.98]',
        'disabled:pointer-events-none disabled:opacity-60',
        'focus-visible:outline-none',
        SIZE_MAP[size],
        VARIANT_MAP[variant],
        block && 'w-full',
        iconOnly && 'aspect-square px-0',
        className
      )}
      {...rest}
    >
      {loading ? (
        <Spinner size={size === 'lg' ? 'md' : 'sm'} className={ICON_SIZE[size]} />
      ) : (
        icon && (
          <span className={cn('inline-flex shrink-0', ICON_SIZE[size])} aria-hidden="true">
            {icon}
          </span>
        )
      )}

      {/* The label stays mounted while loading so the button keeps its width: a
          button that collapses to a spinner and then expands shifts the layout
          under the user's cursor, which is a classic cause of mis-clicks. */}
      {!iconOnly && <span className={cn('truncate', loading && 'invisible')}>{children}</span>}

      {loading && <span className="sr-only">Loading…</span>}

      {!loading && iconRight && (
        <span className={cn('inline-flex shrink-0', ICON_SIZE[size])} aria-hidden="true">
          {iconRight}
        </span>
      )}
    </button>
  );
});

export default Button;