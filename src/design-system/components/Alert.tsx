/**
 * Alert — an inline, persistent message attached to a region of the page.
 *
 * DISTINGUISHED FROM TOAST ON PURPOSE
 * The two are routinely confused and the confusion has an accessibility cost:
 *
 *   Alert  — belongs to the content. It is in the DOM before the user acts, it
 *            persists, and it is announced when it appears. Use it for a
 *            validation summary, a failed load, a quota warning.
 *   Toast  — transient feedback about an action. Appears, disappears, and must
 *            never carry information the user still needs.
 *
 * Putting a persistent message in a toast means a screen-reader user who looks
 * away for a moment has lost it permanently, because the live region has
 * already fired. This component therefore owns the `role="alert"` and does not
 * let a caller remove it.
 *
 * WCAG notes: 1.4.3 (the palette pairs text with its own surface so the
 * contrast requirement is met by construction) and 4.1.3 (status messages must
 * be announced, which is what `role="alert"` does).
 */
import React from 'react';
import { cn } from '../utils/cn';
import { Button } from './Button';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  /** Optional single action. Alerts that need several belong in a dialog. */
  action?: React.ReactNode;
  onDismiss?: () => void;
  /**
   * The dismiss control's accessible name. Icons render as an SVG with no text,
   * so without this the button is announced only as "button" (WCAG 4.1.2).
   */
  dismissLabel?: string;
}

const WRAP: Record<AlertVariant, string> = {
  info: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-100',
  success:
    'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100',
  warning:
    'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100',
  danger: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100',
};

const ICON_WRAP: Record<AlertVariant, string> = {
  info: 'bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-300',
  success: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300',
  warning: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300',
  danger: 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300',
};

/** Glyphs rather than an icon dependency: a status must not depend on a
 *  library load, and these are decorative next to their own text. */
const GLYPH: Record<AlertVariant, string> = {
  info: 'i',
  success: '✓',
  warning: '!',
  danger: '×',
};

export function Alert({
  variant = 'info',
  title,
  action,
  onDismiss,
  dismissLabel = 'Dismiss',
  className,
  children,
  ...rest
}: AlertProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border p-3.5 text-sm',
        WRAP[variant],
        className
      )}
      {...rest}
      // Spread FIRST, then the role. A caller passing `role="presentation"`
      // would otherwise silently strip the live-region semantics that are the
      // entire reason this component exists. The role is not the caller's to
      // change — if a message should not be announced, it should not be an
      // Alert in the first place.
      role="alert"
    >
      <span
        aria-hidden="true"
        className={cn(
          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-black',
          ICON_WRAP[variant]
        )}
      >
        {GLYPH[variant]}
      </span>

      <div className="min-w-0 flex-1">
        {title && <p className="text-sm font-bold leading-snug">{title}</p>}
        {children && <div className={cn('text-xs leading-relaxed', title && 'mt-0.5')}>{children}</div>}
        {action && <div className="mt-2 flex gap-2">{action}</div>}
      </div>

      {onDismiss && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          label={dismissLabel}
          aria-label={dismissLabel}
          className="-m-1 h-auto shrink-0 p-1 text-current opacity-60 hover:opacity-100"
        >
          <span aria-hidden="true">×</span>
        </Button>
      )}
    </div>
  );
}

export default Alert;
