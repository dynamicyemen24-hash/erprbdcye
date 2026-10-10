import React, { useCallback, useEffect, useState } from 'react';
import { Download, RefreshCw, X } from 'lucide-react';
import { checkForUpdate, type UpdateCheckOutcome } from '../core/updates';
import { APP_VERSION_LABEL } from '../core/version';
import { cn } from '../design-system/utils/cn';

interface UpdateBannerProps {
  autoCheck?: boolean;
  onDismiss?: () => void;
  lang?: 'ar' | 'en';
  className?: string;
  /** Override the manifest URL (tests, enterprise mirrors). */
  manifestUrl?: string;
}

/**
 * ══════════════════════════════════════════════════════════════════════════
 * RENDERS ONLY WHEN AN UPDATE ACTUALLY EXISTS.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * The previous version called `setShow(true)` unconditionally after the check
 * resolved and rendered `hasUpdate ? … : "You're up to date"`. Because the
 * check always failed against a placeholder URL, the result was a permanent
 * `fixed top-0 … z-50` strip in English, stacked over the application header,
 * on every session in every language — and its dismiss button was wired to a
 * no-op, so it could not be closed.
 *
 * The rules this component now follows:
 *   1. 'disabled' and 'failed'  → render NOTHING (absence is not news),
 *   2. 'up-to-date'              → render nothing ("no news" is not a message),
 *   3. 'update-available'        → render, bilingual, dismissible for the session.
 *
 * WCAG 4.1.3: the region is `role="status"`/`aria-live="polite"` because it
 * appears asynchronously; it is never `assertive`, since an available update
 * is not an emergency and must not interrupt a screen reader mid-sentence.
 */
export function UpdateBanner({
  autoCheck = true,
  onDismiss,
  lang = 'ar',
  className,
  manifestUrl,
}: UpdateBannerProps) {
  const [outcome, setOutcome] = useState<UpdateCheckOutcome | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const isRtl = lang === 'ar';

  useEffect(() => {
    if (!autoCheck) return;
    let active = true;

    checkForUpdate(manifestUrl).then((o) => {
      if (active) setOutcome(o);
    });

    return () => {
      active = false;
    };
  }, [autoCheck, manifestUrl]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    onDismiss?.();
  }, [onDismiss]);

  // Nothing to say: no manifest, unreachable manifest, or already current.
  if (outcome?.status !== 'update-available') return null;
  if (dismissed) return null;

  const { latest } = outcome.result;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="update-banner"
      className={cn(
        'flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10',
        'px-4 py-3 text-xs font-semibold',
        'text-amber-800 dark:text-amber-200',
        className
      )}
    >
      <Download className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />

      <span className="min-w-0">
        {isRtl
          ? `يتوفر إصدار جديد (${APP_VERSION_LABEL} ← v${latest})`
          : `A new version is available (${APP_VERSION_LABEL} → v${latest})`}
      </span>

      <a
        href="/settings?tab=updates"
        className="shrink-0 underline underline-offset-2 hover:no-underline"
      >
        {isRtl ? 'التفاصيل' : 'Details'}
      </a>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label={isRtl ? 'إخفاء إشعار التحديث' : 'Dismiss update notice'}
        className="ms-auto shrink-0 rounded-lg p-1 transition-colors hover:bg-amber-500/20"
      >
        <X className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

export default UpdateBanner;

/** Re-exported so callers can surface a manual re-check affordance. */
export { RefreshCw };