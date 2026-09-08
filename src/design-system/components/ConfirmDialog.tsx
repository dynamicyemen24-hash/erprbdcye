/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * UAMEX ERP™ — ConfirmDialog Component v3.0
 * Replaces browser confirm/alert with styled modal dialogs
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useId as useReactId } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, type ModalVariant } from './Modal';
import { cn } from '../utils/cn';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: ModalVariant;
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  confirmLabel?: string;
  confirmLabelAr?: string;
  cancelLabel?: string;
  cancelLabelAr?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  lang?: 'ar' | 'en';
  icon?: React.ReactNode;
}

const VARIANT_BUTTON: Record<string, string> = {
  destructive: 'bg-red-600 hover:bg-red-700 text-white',
  warning: 'bg-amber-600 hover:bg-amber-700 text-white',
  info: 'bg-sky-600 hover:bg-sky-700 text-white',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  default: 'bg-emerald-600 hover:bg-emerald-700 text-white',
};

export function ConfirmDialog({
  open,
  onOpenChange,
  variant = 'default',
  title,
  titleAr,
  description,
  descriptionAr,
  confirmLabel,
  confirmLabelAr,
  cancelLabel,
  cancelLabelAr = 'إلغاء',
  onConfirm,
  onCancel,
  loading: externalLoading,
  lang = 'ar',
  icon,
}: ConfirmDialogProps) {
  const id = useReactId();
  const titleId = `${id}-confirm-title`;
  const descId = `${id}-confirm-desc`;
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = externalLoading || internalLoading;

  const displayTitle = lang === 'ar' ? (titleAr || title) : title;
  const displayDesc = lang === 'ar' ? (descriptionAr || description) : description;
  const displayConfirm = lang === 'ar'
    ? (confirmLabelAr || confirmLabel || (variant === 'destructive' ? 'حذف' : 'تأكيد'))
    : (confirmLabel || (variant === 'destructive' ? 'Delete' : 'Confirm'));
  const displayCancel = lang === 'ar' ? cancelLabelAr : (cancelLabel || 'Cancel');

  const handleConfirm = async () => {
    setInternalLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // Keep dialog open on error
    } finally {
      setInternalLoading(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="sm" variant={variant} dialogRole="alertdialog">
      <ModalHeader subtitle={displayDesc}>
        <div id={titleId} className="flex items-center gap-3">
          {icon}
          {displayTitle}
        </div>
      </ModalHeader>
      {displayDesc && (
        <ModalBody padded={false}>
          <p id={descId} className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">{displayDesc}</p>
        </ModalBody>
      )}
      <ModalFooter>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isLoading}
          className={cn(
            'px-4 py-2 text-sm font-semibold rounded-xl',
            'border border-zinc-300 dark:border-zinc-600',
            'text-zinc-700 dark:text-zinc-300',
            'hover:bg-zinc-100 dark:hover:bg-zinc-800',
            'transition-colors disabled:opacity-50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2'
          )}
        >
          {displayCancel}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isLoading}
          className={cn(
            'px-4 py-2 text-sm font-semibold rounded-xl transition-colors',
            'disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
            VARIANT_BUTTON[variant]
          )}
        >
          {isLoading && (
            <svg className="w-4 h-4 me-2 animate-spin inline" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {displayConfirm}
        </button>
      </ModalFooter>
    </Modal>
  );
}
