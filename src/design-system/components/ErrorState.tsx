/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * UAMEX ERP™ — ErrorState Component v3.0
 * Specialized error display with retry, details expansion, and error reporting
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { cn } from '../utils/cn';

export interface ErrorStateProps {
  title?: string;
  titleAr?: string;
  message?: string;
  messageAr?: string;
  code?: string | number;
  stack?: string;
  onRetry?: () => void;
  onReport?: () => void;
  retryLabel?: string;
  retryLabelAr?: string;
  lang?: 'ar' | 'en';
  className?: string;
}

export function ErrorState({
  title,
  titleAr,
  message,
  messageAr,
  code,
  stack,
  onRetry,
  onReport,
  retryLabel,
  retryLabelAr,
  lang = 'ar',
  className,
}: ErrorStateProps) {
  const [showDetails, setShowDetails] = useState(false);

  const displayTitle = lang === 'ar' ? (titleAr || 'حدث خطأ غير متوقع') : (title || 'An unexpected error occurred');
  const displayMessage = lang === 'ar' ? (messageAr || 'يرجى المحاولة مرة أخرى أو الاتصال بالدعم الفني') : (message || 'Please try again or contact support');
  const displayRetry = lang === 'ar' ? (retryLabelAr || 'إعادة المحاولة') : (retryLabel || 'Try again');

  return (
    <div
      role="alert"
      aria-label={displayTitle}
      className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}
    >
      {/* Error icon with pulse ring */}
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        {code && (
          <div className="absolute -top-2 -end-2 px-2 py-0.5 text-[10px] font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full">
            {code}
          </div>
        )}
      </div>

      <h3 className="text-base font-semibold text-zinc-900 dark:text-white">{displayTitle}</h3>
      <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">{displayMessage}</p>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-5">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className={cn(
              'px-4 py-2 text-sm font-semibold rounded-xl',
              'bg-emerald-600 text-white hover:bg-emerald-700',
              'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2'
            )}
          >
            {displayRetry}
          </button>
        )}
        {onReport && (
          <button
            type="button"
            onClick={onReport}
            className={cn(
              'px-4 py-2 text-sm font-semibold rounded-xl',
              'border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300',
              'hover:bg-zinc-100 dark:hover:bg-zinc-800',
              'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2'
            )}
          >
            {lang === 'ar' ? 'الإبلاغ عن المشكلة' : 'Report issue'}
          </button>
        )}
      </div>

      {/* Technical details (expandable) */}
      {stack && (
        <div className="mt-6 w-full max-w-md">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors flex items-center gap-1 mx-auto"
          >
            <svg className={cn('w-3 h-3 transition-transform', showDetails && 'rotate-90')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            {lang === 'ar' ? 'التفاصيل التقنية' : 'Technical details'}
          </button>
          {showDetails && (
            <pre className="mt-2 p-3 text-xs text-left text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-x-auto whitespace-pre-wrap break-all">
              {stack}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
