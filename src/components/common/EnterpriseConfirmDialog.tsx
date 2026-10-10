/**
 * UAMEX ERP™ — Enterprise Confirmation Dialog 4.0
 *
 * Semantic modal for destructive/important actions:
 * — Danger / Warning / Info / Success variants
 * — Accessible focus trap and ARIA roles
 * — Confirm and cancel callbacks
 * — RTL-aware layout
 * — Keyboard ESC to cancel
 */

import React, { useEffect, useRef } from 'react';
import { ShieldAlert, AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';
import { EnterpriseButton } from './EnterpriseButton';

/**
 * Specialty confirm dialog (DEBT PAID): kept for its `open` + explicit
 * `onConfirm`/`onCancel` contract (the canonical `ConfirmDialog` closes
 * through `onOpenChange`, different dismissal semantics). Palette is now a
 * CLOSED LOCAL MAP — no third token vocabulary; surfaces match the Design
 * System modal scale verbatim.
 */

export interface EnterpriseConfirmDialogProps {
  open: boolean;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  description: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  lang?: 'ar' | 'en';
}

const VARIANT_CONFIG = {
  danger:  { Icon: ShieldAlert,   chip: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/80 text-rose-600 dark:text-rose-400',       confirmVariant: 'danger' as const },
  warning: { Icon: AlertTriangle, chip: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/80 text-amber-600 dark:text-amber-400', confirmVariant: 'accent' as const },
  info:    { Icon: Info,          chip: 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800/80 text-sky-600 dark:text-sky-400',             confirmVariant: 'primary' as const },
  success: { Icon: CheckCircle2,  chip: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/80 text-emerald-600 dark:text-emerald-400', confirmVariant: 'primary' as const },
};

export const EnterpriseConfirmDialog: React.FC<EnterpriseConfirmDialogProps> = ({
  open,
  variant = 'danger',
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  loading = false,
  lang = 'ar',
}) => {
  const isRtl = lang === 'ar';
  const dialogRef = useRef<HTMLDivElement>(null);
  const { Icon, chip, confirmVariant } = VARIANT_CONFIG[variant];

  const defaultConfirm = isRtl ? 'تأكيد' : 'Confirm';
  const defaultCancel  = isRtl ? 'إلغاء' : 'Cancel';

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  // Focus trap
  useEffect(() => {
    if (open && dialogRef.current) {
      const firstFocusable = dialogRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-dialog flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog Panel */}
      <div
        ref={dialogRef}
        className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 fade-in duration-150"
      >
        {/* Close Button */}
        <EnterpriseButton
          variant="ghost"
          size="sm"
          iconOnly
          label={isRtl ? 'إغلاق' : 'Close'}
          onClick={onCancel}
          className="absolute top-4 end-4"
        >
          <X className="w-4 h-4" />
        </EnterpriseButton>

        {/* Icon Header */}
        <div className={`inline-flex p-3 rounded-2xl border mb-4 ${chip}`}>
          <Icon className="w-6 h-6" aria-hidden="true" />
        </div>

        {/* Title */}
        <h2
          id="confirm-dialog-title"
          className="text-base font-black text-slate-900 dark:text-white mb-2 leading-snug"
        >
          {title}
        </h2>

        {/* Description */}
        <div className="text-xs text-slate-600 dark:text-zinc-300 font-medium leading-relaxed mb-5">
          {description}
        </div>

        {/* Actions — order follows `dir` (no reverse hack) */}
        <div className="flex items-center gap-2.5 flex-row justify-end">
          <EnterpriseButton
            variant="secondary"
            size="md"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel ?? defaultCancel}
          </EnterpriseButton>
          <EnterpriseButton
            variant={confirmVariant}
            size="md"
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel ?? defaultConfirm}
          </EnterpriseButton>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseConfirmDialog;
