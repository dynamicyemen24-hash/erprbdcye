/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * UAMEX ERP™ — Page Layout Components v3.0
 * Standardized page structure: PageHeader, PageSection, PageActions
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { cn } from '../utils/cn';

// ─── Page ─────────────────────────────────────────────────────

export interface PageProps {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}

export function Page({ children, className, padded = true }: PageProps) {
  return (
    <div className={cn('min-h-screen', padded && 'p-4 sm:p-6 lg:p-8', className)}>
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
}

// ─── PageHeader ───────────────────────────────────────────────

export interface PageHeaderProps {
  title: string;
  titleAr?: string;
  subtitle?: string;
  subtitleAr?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; labelAr?: string; onClick?: () => void }>;
  lang?: 'ar' | 'en';
  className?: string;
}

export function PageHeader({
  title,
  titleAr,
  subtitle,
  subtitleAr,
  icon,
  badge,
  actions,
  breadcrumbs,
  lang = 'ar',
  className,
}: PageHeaderProps) {
  const displayTitle = lang === 'ar' ? (titleAr || title) : title;
  const displaySubtitle = lang === 'ar' ? (subtitleAr || subtitle) : subtitle;
  const isRtl = lang === 'ar';

  return (
    <div className={cn('mb-6', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 mb-3" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <svg className={cn('w-3.5 h-3.5 text-zinc-400', isRtl && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              )}
              {crumb.onClick ? (
                <button type="button" onClick={crumb.onClick} className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
                  {lang === 'ar' ? (crumb.labelAr || crumb.label) : crumb.label}
                </button>
              ) : (
                <span className="text-xs font-medium text-zinc-900 dark:text-white">
                  {lang === 'ar' ? (crumb.labelAr || crumb.label) : crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Header Row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          {icon && (
            <div className="shrink-0 w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white truncate">{displayTitle}</h1>
              {badge}
            </div>
            {displaySubtitle && (
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{displaySubtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}

// ─── PageSection ──────────────────────────────────────────────

export interface PageSectionProps {
  title?: string;
  titleAr?: string;
  subtitle?: string;
  subtitleAr?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  lang?: 'ar' | 'en';
  className?: string;
  bordered?: boolean;
}

export function PageSection({
  title,
  titleAr,
  subtitle,
  subtitleAr,
  actions,
  children,
  lang = 'ar',
  className,
  bordered = true,
}: PageSectionProps) {
  const displayTitle = lang === 'ar' ? (titleAr || title) : title;
  const displaySubtitle = lang === 'ar' ? (subtitleAr || subtitle) : subtitle;

  return (
    <section className={cn('mb-6', className)}>
      {(displayTitle || actions) && (
        <div className={cn(
          'flex items-center justify-between gap-4 mb-4',
          bordered && 'pb-3 border-b border-zinc-200 dark:border-zinc-700/50'
        )}>
          <div>
            {displayTitle && (
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white">{displayTitle}</h2>
            )}
            {displaySubtitle && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{displaySubtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

// ─── PageActions ──────────────────────────────────────────────

export interface PageActionsProps {
  children: React.ReactNode;
  className?: string;
  sticky?: boolean;
}

export function PageActions({ children, className, sticky = false }: PageActionsProps) {
  return (
    <div className={cn(
      'flex items-center gap-3 flex-wrap',
      sticky && 'sticky bottom-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border-t border-zinc-200 dark:border-zinc-700/50 px-6 py-4 -mx-4 sm:-mx-6 lg:-mx-8',
      className
    )}>
      {children}
    </div>
  );
}

// ─── PageGrid ─────────────────────────────────────────────────

export interface PageGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
  gap?: string;
  className?: string;
}

export function PageGrid({ children, cols = 3, gap = 'gap-4', className }: PageGridProps) {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={cn('grid', colClasses[cols], gap, className)}>
      {children}
    </div>
  );
}
