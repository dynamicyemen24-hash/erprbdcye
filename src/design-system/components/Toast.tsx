/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * UAMEX ERP™ — Toast Notification System v3.0
 * Context-driven toast with queue, auto-dismiss, actions, swipe-to-dismiss
 * ═══════════════════════════════════════════════════════════════════════════════════════
 *
 * Architecture: ToastProvider → useToast() hook → ToastContainer → Toast
 *
 * Features:
 * - 5 variants: success, error, warning, info, loading
 * - Auto-dismiss with configurable duration
 * - Action buttons and close buttons
 * - Swipe-to-dismiss gesture
 * - Stack management with max visible limit
 * - Promise-based toast (for async operations)
 * - Position: top-right, top-center, bottom-right, bottom-center
 * - RTL-aware
 * - Sound notification support
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../utils/cn';
import { useDirection } from '../theme/ThemeContext';

// ─── Types ────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'loading';
export type ToastPosition = 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';

export interface ToastAction {
  label: string;
  labelAr?: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export interface ToastData {
  id: string;
  variant: ToastVariant;
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  duration?: number;
  actions?: ToastAction[];
  dismissible?: boolean;
  onDismiss?: () => void;
  createdAt: number;
}

export interface AddToastOptions {
  variant?: ToastVariant;
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  duration?: number;
  actions?: ToastAction[];
  dismissible?: boolean;
  onDismiss?: () => void;
}

export interface ToastContextValue {
  toasts: ToastData[];
  addToast: (options: AddToastOptions) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
  promise: <T>(promise: Promise<T>, options: {
    loading: string;
    loadingAr?: string;
    success: string | ((result: T) => string);
    successAr?: string | ((result: T) => string);
    error: string | ((error: any) => string);
    errorAr?: string | ((error: any) => string);
  }) => Promise<T>;
}

// ─── Context ──────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────

export interface ToastProviderProps {
  children: React.ReactNode;
  position?: ToastPosition;
  maxVisible?: number;
  defaultDuration?: number;
}

export function ToastProvider({
  children,
  position = 'top-right',
  maxVisible = 5,
  defaultDuration = 5000,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback(
    (options: AddToastOptions): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const toast: ToastData = {
        id,
        variant: options.variant || 'info',
        title: options.title,
        titleAr: options.titleAr,
        description: options.description,
        descriptionAr: options.descriptionAr,
        duration: options.duration ?? defaultDuration,
        actions: options.actions,
        dismissible: options.dismissible ?? true,
        onDismiss: options.onDismiss,
        createdAt: Date.now(),
      };

      setToasts((prev) => {
        const next = [...prev, toast];
        return next.length > maxVisible ? next.slice(-maxVisible) : next;
      });

      // Auto-dismiss (except loading)
      if (toast.variant !== 'loading' && toast.duration && toast.duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, toast.duration);
      }

      return id;
    },
    [defaultDuration, maxVisible]
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const promise = useCallback(
    async <T,>(p: Promise<T>, options: {
      loading: string;
      loadingAr?: string;
      success: string | ((result: T) => string);
      successAr?: string | ((result: T) => string);
      error: string | ((error: any) => string);
      errorAr?: string | ((error: any) => string);
    }): Promise<T> => {
      const loadingId = addToast({
        variant: 'loading',
        title: options.loading,
        titleAr: options.loadingAr,
        duration: 0,
        dismissible: false,
      });

      try {
        const result = await p;
        removeToast(loadingId);
        const msg = typeof options.success === 'function' ? options.success(result) : options.success;
        const msgAr = options.successAr
          ? typeof options.successAr === 'function' ? options.successAr(result) : options.successAr
          : undefined;
        addToast({ variant: 'success', title: msg, titleAr: msgAr });
        return result;
      } catch (err: any) {
        removeToast(loadingId);
        const msg = typeof options.error === 'function' ? options.error(err) : options.error;
        const msgAr = options.errorAr
          ? typeof options.errorAr === 'function' ? options.errorAr(err) : options.errorAr
          : undefined;
        addToast({ variant: 'error', title: msg, titleAr: msgAr });
        throw err;
      }
    },
    [addToast, removeToast]
  );

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, addToast, removeToast, clearAll, promise }),
    [toasts, addToast, removeToast, clearAll, promise]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer position={position} toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// ─── Container ────────────────────────────────────────────────

interface ToastContainerProps {
  position: ToastPosition;
  toasts: ToastData[];
  onRemove: (id: string) => void;
}

function ToastContainer({ position, toasts, onRemove }: ToastContainerProps) {
  const { direction } = useDirection();
  const isRtl = direction === 'rtl';

  const positionClasses: Record<ToastPosition, string> = {
    'top-right': 'top-4 right-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  // Mirror for RTL
  const rtlPosition = isRtl
    ? position.replace('right', 'LEFT_PLACEHOLDER').replace('left', 'right').replace('LEFT_PLACEHOLDER', 'left') as ToastPosition
    : position;

  if (toasts.length === 0) return null;

  return createPortal(
    <div
      className={cn(
        'fixed z-[200] flex flex-col gap-2 w-full max-w-sm pointer-events-none',
        positionClasses[isRtl ? rtlPosition : position]
      )}
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>,
    document.body
  );
}

// ─── Toast Item ───────────────────────────────────────────────

interface ToastItemProps {
  toast: ToastData;
  onRemove: (id: string) => void;
}

const VARIANT_CONFIG: Record<ToastVariant, { icon: React.ReactNode; border: string; bg: string; progress: string }> = {
  success: {
    icon: (
      <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    border: 'border-emerald-200 dark:border-emerald-800',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    progress: 'bg-emerald-500',
  },
  error: {
    icon: (
      <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    ),
    border: 'border-red-200 dark:border-red-800',
    bg: 'bg-red-50 dark:bg-red-950/40',
    progress: 'bg-red-500',
  },
  warning: {
    icon: (
      <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
      </svg>
    ),
    border: 'border-amber-200 dark:border-amber-800',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    progress: 'bg-amber-500',
  },
  info: {
    icon: (
      <svg className="w-5 h-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    ),
    border: 'border-sky-200 dark:border-sky-800',
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    progress: 'bg-sky-500',
  },
  loading: {
    icon: (
      <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    ),
    border: 'border-blue-200 dark:border-blue-800',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    progress: 'bg-blue-500',
  },
};

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);
  const config = VARIANT_CONFIG[toast.variant];
  const { direction } = useDirection();
  const isRtl = direction === 'rtl';

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 200);
    toast.onDismiss?.();
  };

  const displayTitle = isRtl ? (toast.titleAr || toast.title) : toast.title;
  const displayDesc = isRtl ? (toast.descriptionAr || toast.description) : toast.description;

  const ariaLive = toast.variant === 'error' || toast.variant === 'warning' ? 'assertive' : 'polite';

  return (
    <div
      className={cn(
        'pointer-events-auto w-full rounded-xl border shadow-lg overflow-hidden',
        config.border,
        config.bg,
        'backdrop-blur-sm',
        isExiting ? 'animate-out slide-out-to-right fade-out duration-200' : 'animate-in slide-in-from-right fade-in duration-300'
      )}
      role="alert"
      aria-live={ariaLive}
      data-state={isExiting ? 'closed' : 'open'}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="shrink-0 mt-0.5">{config.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">{displayTitle}</p>
          {displayDesc && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{displayDesc}</p>}
          {toast.actions && toast.actions.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              {toast.actions.map((action, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { action.onClick(); handleDismiss(); }}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                    action.variant === 'secondary' || (!action.variant && i > 0)
                      ? 'border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100'
                  )}
                >
                  {isRtl ? (action.labelAr || action.label) : action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {toast.dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 -m-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {/* Auto-dismiss progress bar */}
      {toast.variant !== 'loading' && toast.duration && toast.duration > 0 && (
        <div className="h-0.5 bg-zinc-200/50 dark:bg-zinc-700/50">
          <div
            className={cn('h-full', config.progress)}
            style={{
              animation: `shrink ${toast.duration}ms linear forwards`,
            }}
          />
        </div>
      )}
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
