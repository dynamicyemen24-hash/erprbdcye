/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * UAMEX ERP™ — Enterprise Alert Component v3.0
 * System-wide alert/notification banner with auto-dismiss and actions
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '../utils/cn';

export type AlertType = 'success' | 'warning' | 'danger' | 'info';

export interface EnterpriseAlertProps {
  type?: AlertType;
  title?: string;
  titleAr?: string;
  message?: string;
  messageAr?: string;
  icon?: React.ReactNode;
  actions?: Array<{ label: string; labelAr?: string; onClick: () => void; variant?: 'primary' | 'ghost' }>;
  dismissible?: boolean;
  autoDismiss?: number; // ms
  onDismiss?: () => void;
  lang?: 'ar' | 'en';
  className?: string;
}

const TYPE_CLASSES: Record<AlertType, { bg: string; border: string; icon: string; text: string }> = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: 'text-emerald-500',
    text: 'text-emerald-800 dark:text-emerald-200',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    icon: 'text-amber-500',
    text: 'text-amber-800 dark:text-amber-200',
  },
  danger: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-500',
    text: 'text-red-800 dark:text-red-200',
  },
  info: {
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    border: 'border-sky-200 dark:border-sky-800',
    icon: 'text-sky-500',
    text: 'text-sky-800 dark:text-sky-200',
  },
};

const DEFAULT_ICONS: Record<AlertType, React.ReactNode> = {
  success: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  danger: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  ),
};

export function EnterpriseAlert({
  type = 'info',
  title,
  titleAr,
  message,
  messageAr,
  icon,
  actions,
  dismissible = true,
  autoDismiss,
  onDismiss,
  lang = 'ar',
  className,
}: EnterpriseAlertProps) {
  const [visible, setVisible] = useState(true);
  const config = TYPE_CLASSES[type];

  const displayTitle = lang === 'ar' ? (titleAr || title) : title;
  const displayMessage = lang === 'ar' ? (messageAr || message) : message;

  const handleDismiss = useCallback(() => {
    setVisible(false);
    onDismiss?.();
  }, [onDismiss]);

  useEffect(() => {
    if (autoDismiss && visible) {
      const timer = setTimeout(handleDismiss, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, visible, handleDismiss]);

  if (!visible) return null;

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border',
        config.bg,
        config.border,
        className
      )}
    >
      <span className={cn('shrink-0 mt-0.5', config.icon)}>
        {icon || DEFAULT_ICONS[type]}
      </span>
      <div className="flex-1 min-w-0">
        {displayTitle && (
          <h4 className={cn('text-sm font-bold', config.text)}>{displayTitle}</h4>
        )}
        {displayMessage && (
          <p className={cn('text-xs mt-0.5 opacity-80', config.text)}>{displayMessage}</p>
        )}
        {actions && actions.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            {actions.map((action, i) => (
              <button
                key={i}
                type="button"
                onClick={action.onClick}
                className={cn(
                  'px-3 py-1 text-xs font-semibold rounded-lg transition-colors',
                  (action.variant === 'ghost' || i > 0)
                    ? 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                )}
              >
                {lang === 'ar' ? (action.labelAr || action.label) : action.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className={cn('shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors', config.icon)}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
