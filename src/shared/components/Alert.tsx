/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * UAMEX ERP™ — Alert Component v3.0
 * Dismissible alert with 5 types, icon, actions, RTL
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import React, { forwardRef, useState } from 'react';
import { cn } from '../../design-system/utils/cn';

export type AlertType = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface AlertAction {
  label: string;
  labelAr?: string;
  onClick: () => void;
}

export interface AlertProps {
  type?: AlertType;
  title?: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  icon?: React.ReactNode;
  actions?: AlertAction[];
  dismissible?: boolean;
  onDismiss?: () => void;
  lang?: 'ar' | 'en';
  className?: string;
  children?: React.ReactNode;
}

const TYPE_STYLES: Record<AlertType, { bg: string; border: string; icon: string; text: string }> = {
  success: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', icon: 'text-emerald-500', text: 'text-emerald-800 dark:text-emerald-200' },
  warning: { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', icon: 'text-amber-500', text: 'text-amber-800 dark:text-amber-200' },
  danger: { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800', icon: 'text-red-500', text: 'text-red-800 dark:text-red-200' },
  info: { bg: 'bg-sky-50 dark:bg-sky-950/30', border: 'border-sky-200 dark:border-sky-800', icon: 'text-sky-500', text: 'text-sky-800 dark:text-sky-200' },
  neutral: { bg: 'bg-zinc-50 dark:bg-zinc-800/50', border: 'border-zinc-200 dark:border-zinc-700', icon: 'text-zinc-500', text: 'text-zinc-700 dark:text-zinc-300' },
};

const DEFAULT_ICONS: Record<AlertType, React.ReactNode> = {
  success: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  warning: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg>,
  danger: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>,
  info: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>,
  neutral: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>,
};

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      type = 'info',
      title,
      titleAr,
      description,
      descriptionAr,
      icon,
      actions,
      dismissible = false,
      onDismiss,
      lang = 'ar',
      className,
      children,
    },
    ref
  ) => {
    const [dismissed, setDismissed] = useState(false);
    if (dismissed) return null;

    const styles = TYPE_STYLES[type];
    const displayTitle = lang === 'ar' ? (titleAr || title) : title;
    const displayDesc = lang === 'ar' ? (descriptionAr || description) : description;

    const handleDismiss = () => {
      setDismissed(true);
      onDismiss?.();
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'relative flex gap-3 p-4 rounded-xl border',
          'animate-in fade-in slide-in-from-top-1 duration-200',
          styles.bg,
          styles.border,
          className
        )}
      >
        <div className={cn('shrink-0 mt-0.5', styles.icon)}>
          {icon || DEFAULT_ICONS[type]}
        </div>
        <div className="flex-1 min-w-0">
          {displayTitle && (
            <h4 className={cn('text-sm font-semibold', styles.text)}>{displayTitle}</h4>
          )}
          {displayDesc && (
            <p className={cn('text-sm mt-1', styles.text, 'opacity-80')}>{displayDesc}</p>
          )}
          {children}
          {actions && actions.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              {actions.map((action, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={action.onClick}
                  className={cn(
                    'px-3 py-1 text-xs font-semibold rounded-lg transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                    i === 0
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100'
                      : 'bg-transparent border border-current/20 hover:bg-current/10'
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
            className={cn('p-1 -m-1 rounded-lg transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500', styles.text, 'opacity-50 hover:opacity-100')}
            aria-label={lang === 'ar' ? 'إغلاق' : 'Dismiss'}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);
Alert.displayName = 'Alert';
