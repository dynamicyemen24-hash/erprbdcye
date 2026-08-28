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
import { enterpriseTokens } from '../../core/theme/enterpriseDesignTokens';
import { EnterpriseButton } from './EnterpriseButton';

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
  danger:  { Icon: ShieldAlert,  theme: enterpriseTokens.status.danger,  confirmVariant: 'danger' as const },
  warning: { Icon: AlertTriangle,theme: enterpriseTokens.status.warning, confirmVariant: 'accent' as const },
  info:    { Icon: Info,         theme: enterpriseTokens.status.info,    confirmVariant: 'primary' as const },
  success: { Icon: CheckCircle2, theme: enterpriseTokens.status.success, confirmVariant: 'primary' as const },
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
  const { Icon, theme, confirmVariant } = VARIANT_CONFIG[variant];

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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
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
        className={`relative ${enterpriseTokens.surfaces.modal} w-full max-w-sm p-6 ${enterpriseTokens.animation.scaleIn} shadow-2xl`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onCancel}
          className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} ${enterpriseTokens.buttons.iconOnly}`}
          aria-label={isRtl ? 'إغلاق' : 'Close'}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon Header */}
        <div className={`inline-flex p-3 rounded-2xl ${theme.bg} ${theme.border} border mb-4`}>
          <Icon className={`w-6 h-6 ${theme.iconClass}`} aria-hidden="true" />
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

        {/* Actions */}
        <div className={`flex items-center gap-2.5 ${isRtl ? 'flex-row-reverse' : 'flex-row'} justify-end`}>
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
