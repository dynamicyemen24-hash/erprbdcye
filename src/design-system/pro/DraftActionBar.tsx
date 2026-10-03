import React from 'react';
import { cn } from '../utils/cn';
import { Button } from '../components/Button';
import { PageActions } from '../components/Page';

/**
 * DraftActionBar — sticky form footer wired to useDraftVault state.
 *
 * Makes autosave *visible*: whether a draft exists, when it was last written,
 * and whether a save is in flight. Submit stays disabled until the form is
 * dirty so a pristine form can never fire a no-op mutation.
 */

export interface DraftActionBarProps {
  onSubmit?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  /** Debounced draft write in progress (useDraftVault.isSaving). */
  isSaving?: boolean;
  /** A persisted draft exists (useDraftVault.hasDraft). */
  hasDraft?: boolean;
  lastSavedTime?: Date | null;
  /** Caller-tracked "form differs from its initial values". */
  dirty?: boolean;
  submitting?: boolean;
  submitDisabled?: boolean;
  lang?: 'ar' | 'en';
  className?: string;
}

export function DraftActionBar({
  onSubmit,
  onCancel,
  submitLabel,
  cancelLabel,
  isSaving,
  hasDraft,
  lastSavedTime,
  dirty = false,
  submitting = false,
  submitDisabled = false,
  lang = 'ar',
  className,
}: DraftActionBarProps) {
  const isRtl = lang === 'ar';
  const status = isSaving
    ? isRtl ? 'جارٍ الحفظ التلقائي…' : 'Saving draft…'
    : hasDraft && lastSavedTime
      ? `${isRtl ? 'مسودة محفوظة' : 'Draft saved'} ${lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : dirty
        ? isRtl ? 'تغييرات غير محفوظة' : 'Unsaved changes'
        : '';

  return (
    <PageActions sticky className={cn('rounded-b-xl', className)}>
      <p aria-live="polite" className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        {isSaving && (
          <span
            className="inline-block w-3 h-3 rounded-full border-2 border-zinc-300 border-t-zinc-700 dark:border-zinc-600 dark:border-t-zinc-200 animate-spin"
            aria-hidden="true"
          />
        )}
        {status}
      </p>
      <div className={cn('flex items-center gap-2', isRtl ? 'ms-auto' : 'ms-auto')}>
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
            {cancelLabel || (isRtl ? 'إلغاء' : 'Cancel')}
          </Button>
        )}
        {onSubmit && (
          <Button
            variant="primary"
            size="sm"
            onClick={onSubmit}
            loading={submitting}
            disabled={submitDisabled || submitting || !dirty}
          >
            {submitLabel || (isRtl ? 'حفظ' : 'Save')}
          </Button>
        )}
      </div>
    </PageActions>
  );
}
