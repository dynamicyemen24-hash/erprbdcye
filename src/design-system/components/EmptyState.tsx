/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * UAMEX ERP™ — EmptyState Component v3.0
 * Pattern component for empty, error, and offlinestates
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { cn } from '../utils/cn';

export type EmptyStateVariant = 'empty' | 'error' | 'offline' | 'permission' | 'search' | 'maintenance';

export interface EmptyStateAction {
  label: string;
  labelAr?: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  icon?: React.ReactNode;
  actions?: EmptyStateAction[];
  lang?: 'ar' | 'en';
  className?: string;
}

const VARIANT_CONFIG: Record<EmptyStateVariant, { defaultTitle: string; defaultTitleAr: string; defaultDesc: string; defaultDescAr: string; bgClass: string; iconClass: string }> = {
  empty: {
    defaultTitle: 'No data',
    defaultTitleAr: 'لا توجد بيانات',
    defaultDesc: 'No results found. Try adjusting your search or filters.',
    defaultDescAr: 'لم يتم العثور على نتائج. حاول تعديل البحث أو الفلاتر.',
    bgClass: 'bg-zinc-100 dark:bg-zinc-800',
    iconClass: 'text-zinc-400',
  },
  error: {
    defaultTitle: 'Something went wrong',
    defaultTitleAr: 'حدث خطأ ما',
    defaultDesc: 'An unexpected error occurred. Please try again.',
    defaultDescAr: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    iconClass: 'text-red-400',
  },
  offline: {
    defaultTitle: 'You\'re offline',
    defaultTitleAr: 'أنت غير متصل بالإنترنت',
    defaultDesc: 'Check your internet connection and try again.',
    defaultDescAr: 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى.',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    iconClass: 'text-amber-400',
  },
  permission: {
    defaultTitle: 'Access denied',
    defaultTitleAr: 'الوصول مرفوض',
    defaultDesc: 'You don\'t have permission to access this resource.',
    defaultDescAr: 'ليس لديك صلاحية الوصول إلى هذا المورد.',
    bgClass: 'bg-orange-100 dark:bg-orange-900/30',
    iconClass: 'text-orange-400',
  },
  search: {
    defaultTitle: 'No search results',
    defaultTitleAr: 'لا توجد نتائج بحث',
    defaultDesc: 'Try different keywords or remove search filters.',
    defaultDescAr: 'جرب كلمات مفتاحية مختلفة أو أزل فلاتر البحث.',
    bgClass: 'bg-sky-100 dark:bg-sky-900/30',
    iconClass: 'text-sky-400',
  },
  maintenance: {
    defaultTitle: 'Under maintenance',
    defaultTitleAr: 'قيد الصيانة',
    defaultDesc: 'This feature is temporarily unavailable. Please check back later.',
    defaultDescAr: 'هذه الميزة غير متاحة مؤقتاً. يرجى المحاولة لاحقاً.',
    bgClass: 'bg-violet-100 dark:bg-violet-900/30',
    iconClass: 'text-violet-400',
  },
};

const DEFAULT_ICONS: Record<EmptyStateVariant, React.ReactNode> = {
  empty: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  ),
  error: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  ),
  offline: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.242 2.829a5 5 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
    </svg>
  ),
  permission: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  ),
  search: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  ),
  maintenance: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.1-5.1m0 0L3.34 8.66a4.5 4.5 0 016.36-6.36l.42.42m5.04 5.04l.42-.42a4.5 4.5 0 016.36 6.36l-.42.42m-11.54-5.04l5.1 5.1" />
    </svg>
  ),
};

export function EmptyState({
  variant = 'empty',
  title,
  titleAr,
  description,
  descriptionAr,
  icon,
  actions,
  lang = 'ar',
  className,
}: EmptyStateProps) {
  const config = VARIANT_CONFIG[variant];
  const displayTitle = lang === 'ar' ? (titleAr || title || config.defaultTitleAr) : (title || config.defaultTitle);
  const displayDesc = lang === 'ar' ? (descriptionAr || description || config.defaultDescAr) : (description || config.defaultDesc);

  return (
    <div
      role="status"
      aria-label={displayTitle}
      className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}
    >
      <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center mb-4', config.bgClass, config.iconClass)}>
        {icon || DEFAULT_ICONS[variant]}
      </div>
      <h3 className="text-base font-semibold text-zinc-900 dark:text-white">{displayTitle}</h3>
      {displayDesc && (
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">{displayDesc}</p>
      )}
      {actions && actions.length > 0 && (
        <div className="flex items-center gap-3 mt-5">
          {actions.map((action, i) => (
            <button
              key={i}
              type="button"
              onClick={action.onClick}
              className={cn(
                'px-4 py-2 text-sm font-semibold rounded-xl transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
                (action.variant === 'secondary' || (!action.variant && i > 0))
                  ? 'border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              )}
            >
              {lang === 'ar' ? (action.labelAr || action.label) : action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
