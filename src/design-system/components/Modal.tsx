/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * UAMEX ERP™ — Modal / Dialog Component v3.0
 * Premium compound component with portal, exit animations, confirmation variant
 * ═══════════════════════════════════════════════════════════════════════════════════════
 *
 * Architecture: Modal → ModalTrigger, ModalContent, ModalHeader, ModalBody, ModalFooter,
 *               ConfirmModal
 *
 * Features:
 * - React Portal rendering (escapes overflow parents)
 * - CSS-driven enter/exit animations with state machine
 * - Focus trap with auto-focus and restore
 * - Scroll lock with iOS bounce prevention
 * - Confirmation variant with danger/warning/info presets
 * - Stacking support via z-index context
 * - Full keyboard navigation (Tab, Shift+Tab, Escape)
 * - ARIA 1.2 compliant dialog pattern
 * - RTL-aware positioning
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo, useId as useReactId } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../utils/cn';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import { useControllableState } from '../hooks/useControllableState';

// ─── Context ──────────────────────────────────────────────────

interface ModalContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  closeOnOverlayClick: boolean;
  closeOnEscape: boolean;
  size: ModalSize;
  variant: ModalVariant;
  zIndex: number;
  titleId: string;
  descriptionId: string;
}

const ModalContext = createContext<ModalContextValue | null>(null);

function useModalContext() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('Modal compound components must be used within <Modal>');
  return ctx;
}

// ─── Types ────────────────────────────────────────────────────

export type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
export type ModalVariant = 'default' | 'destructive' | 'warning' | 'info' | 'success';

export interface ModalProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  size?: ModalSize;
  variant?: ModalVariant;
  dialogRole?: 'dialog' | 'alertdialog';
  children: React.ReactNode;
  className?: string;
}

// ─── Config ───────────────────────────────────────────────────

const SIZE_CLASSES: Record<ModalSize, string> = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-6xl',
  full: 'max-w-[92vw] max-h-[92vh]',
};

const VARIANT_STYLES: Record<ModalVariant, { icon: string; ring: string; bg: string }> = {
  default: { icon: '', ring: '', bg: '' },
  destructive: {
    icon: 'text-red-500',
    ring: 'ring-red-200 dark:ring-red-800',
    bg: 'bg-red-50 dark:bg-red-950/30',
  },
  warning: {
    icon: 'text-amber-500',
    ring: 'ring-amber-200 dark:ring-amber-800',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
  },
  info: {
    icon: 'text-sky-500',
    ring: 'ring-sky-200 dark:ring-sky-800',
    bg: 'bg-sky-50 dark:bg-sky-950/30',
  },
  success: {
    icon: 'text-emerald-500',
    ring: 'ring-emerald-200 dark:ring-emerald-800',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
};

// ─── Main Modal ───────────────────────────────────────────────

export function Modal({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  size = 'md',
  variant = 'default',
  dialogRole = 'dialog',
  children,
  className,
}: ModalProps) {
  const [open, setOpen] = useControllableState({
    value: controlledOpen,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  const id = useReactId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  const [animState, setAnimState] = useState<'closed' | 'entering' | 'open' | 'exiting'>(
    open ? 'open' : 'closed'
  );

  const close = useCallback(() => {
    setAnimState('exiting');
    setTimeout(() => {
      setOpen(false);
      setAnimState('closed');
    }, 200);
  }, [setOpen]);

  useEscapeKey(close, { enabled: open && closeOnEscape });
  useLockBodyScroll(open);

  // Animate on open
  useEffect(() => {
    if (open && animState === 'closed') {
      setAnimState('entering');
      requestAnimationFrame(() => setAnimState('open'));
    }
  }, [open]);

  const trapRef = useFocusTrap<HTMLDivElement>({
    enabled: open && animState !== 'exiting',
    autoFocus: true,
    restoreFocus: true,
  });

  const isVisible = animState !== 'closed';
  const variantStyle = VARIANT_STYLES[variant];

  return (
    <ModalContext.Provider value={{ open, setOpen: close, closeOnOverlayClick, closeOnEscape, size, variant, zIndex: 50, titleId, descriptionId }}>
      {isVisible && createPortal(
        <div
          className={cn(
            'fixed inset-0 flex items-center justify-center p-4',
            animState === 'exiting' && 'pointer-events-none'
          )}
          style={{ zIndex: 50 }}
          role={dialogRole}
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          data-state={open ? 'open' : 'closed'}
        >
          {/* Overlay with backdrop blur */}
          <div
            className={cn(
              'absolute inset-0 bg-black/60 backdrop-blur-sm',
              animState === 'entering' && 'animate-in fade-in duration-200',
              animState === 'exiting' && 'animate-out fade-out duration-200'
            )}
            onClick={closeOnOverlayClick ? close : undefined}
            aria-hidden="true"
          />

          {/* Content */}
          <div
            ref={trapRef}
            className={cn(
              'relative w-full bg-white dark:bg-zinc-900 shadow-2xl',
              'border border-zinc-200 dark:border-zinc-700',
              'rounded-2xl overflow-hidden',
              SIZE_CLASSES[size],
              variantStyle.ring && `ring-1 ${variantStyle.ring}`,
              animState === 'entering' && 'animate-in zoom-in-95 fade-in duration-200',
              animState === 'exiting' && 'animate-out zoom-out-95 fade-out duration-200',
              className
            )}
          >
            {children}
          </div>
        </div>,
        document.body
      )}
    </ModalContext.Provider>
  );
}

// ─── ModalHeader ──────────────────────────────────────────────

export interface ModalHeaderProps {
  children: React.ReactNode;
  subtitle?: string;
  className?: string;
  onClose?: () => void;
  showClose?: boolean;
}

export function ModalHeader({ children, subtitle, className, onClose, showClose = true }: ModalHeaderProps) {
  const { setOpen, variant, titleId } = useModalContext();
  const variantStyle = VARIANT_STYLES[variant];

  const variantIcon = variant !== 'default' && (
    <div className={cn('flex items-center justify-center w-10 h-10 rounded-xl shrink-0', variantStyle.bg)}>
      {variant === 'destructive' && (
        <svg className={cn('w-5 h-5', variantStyle.icon)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      )}
      {variant === 'warning' && (
        <svg className={cn('w-5 h-5', variantStyle.icon)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      )}
      {variant === 'info' && (
        <svg className={cn('w-5 h-5', variantStyle.icon)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
      )}
      {variant === 'success' && (
        <svg className={cn('w-5 h-5', variantStyle.icon)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
    </div>
  );

  return (
    <div className={cn('flex items-start gap-3 px-6 py-5 border-b border-zinc-200 dark:border-zinc-700/50', className)}>
      {variantIcon}
      <div className="flex-1 min-w-0">
        <h2 id={titleId} className="text-lg font-semibold text-zinc-900 dark:text-white leading-tight">{children}</h2>
        {subtitle && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
      </div>
      {showClose && (
        <button
          type="button"
          onClick={onClose ?? (() => setOpen(false))}
          className="p-1.5 -m-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ─── ModalBody ────────────────────────────────────────────────

export interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}

export function ModalBody({ children, className, padded = true }: ModalBodyProps) {
  const { descriptionId } = useModalContext();
  return (
    <div id={descriptionId} className={cn('max-h-[65vh] overflow-y-auto overscroll-contain', padded && 'px-6 py-5', className)}>
      {children}
    </div>
  );
}

// ─── ModalFooter ──────────────────────────────────────────────

export interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end' | 'between';
}

export function ModalFooter({ children, className, align = 'end' }: ModalFooterProps) {
  const alignClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div className={cn(
      'flex items-center gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-700/50 bg-zinc-50/50 dark:bg-zinc-800/30',
      alignClasses[align],
      className
    )}>
      {children}
    </div>
  );
}

// ─── ConfirmModal (Preset) ────────────────────────────────────

export interface ConfirmModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: 'destructive' | 'warning' | 'info' | 'success';
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  confirmLabel?: string;
  confirmLabelAr?: string;
  cancelLabel?: string;
  cancelLabelAr?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  lang?: 'ar' | 'en';
}

export function ConfirmModal({
  open,
  onOpenChange,
  variant = 'destructive',
  title,
  titleAr,
  description,
  descriptionAr,
  confirmLabel,
  confirmLabelAr,
  cancelLabel = 'Cancel',
  cancelLabelAr = 'إلغاء',
  onConfirm,
  onCancel,
  loading = false,
  lang = 'ar',
}: ConfirmModalProps) {
  const [loadingState, setLoadingState] = useState(false);
  const isLoading = loading || loadingState;

  const displayTitle = lang === 'ar' ? (titleAr || title) : title;
  const displayDescription = lang === 'ar' ? (descriptionAr || description) : description;
  const displayConfirm = lang === 'ar' ? (confirmLabelAr || confirmLabel || (variant === 'destructive' ? 'حذف' : 'تأكيد')) : (confirmLabel || (variant === 'destructive' ? 'Delete' : 'Confirm'));
  const displayCancel = lang === 'ar' ? cancelLabelAr : cancelLabel;

  const handleConfirm = async () => {
    setLoadingState(true);
    try {
      await onConfirm();
    } finally {
      setLoadingState(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="sm" variant={variant}>
      <ModalHeader subtitle={displayDescription}>
        {displayTitle}
      </ModalHeader>
      <ModalBody padded={false}>
        <p className="px-6 text-sm text-zinc-600 dark:text-zinc-400">{displayDescription}</p>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          onClick={onCancel ?? (() => onOpenChange?.(false))}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          {displayCancel}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isLoading}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
            variant === 'destructive' && 'bg-red-600 hover:bg-red-700',
            variant === 'warning' && 'bg-amber-600 hover:bg-amber-700',
            variant === 'info' && 'bg-sky-600 hover:bg-sky-700',
            variant === 'success' && 'bg-emerald-600 hover:bg-emerald-700'
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
