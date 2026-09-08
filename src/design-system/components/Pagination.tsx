/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * UAMEX ERP™ — Pagination Component v3.0
 * Smart pagination with page numbers, ellipsis, first/last navigation
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { cn } from '../utils/cn';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  lang?: 'ar' | 'en';
  showFirstLast?: boolean;
  showInfo?: boolean;
  totalItems?: number;
  pageSize?: number;
  className?: string;
}

function generatePageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [];
  pages.push(1);
  if (current > 3) pages.push('...');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  lang = 'ar',
  showFirstLast = true,
  showInfo = true,
  totalItems,
  pageSize,
  className,
}: PaginationProps) {
  const isRtl = lang === 'ar';
  const pages = generatePageNumbers(currentPage, totalPages);

  const displayFrom = totalItems && pageSize ? (currentPage - 1) * pageSize + 1 : undefined;
  const displayTo = totalItems && pageSize ? Math.min(currentPage * pageSize, totalItems) : undefined;

  const prevLabel = isRtl ? 'السابق' : 'Previous';
  const nextLabel = isRtl ? 'التالي' : 'Next';

  return (
    <nav aria-label="Pagination" className={cn('flex items-center justify-between gap-4', className)}>
      {/* Info */}
      {showInfo && displayFrom !== undefined && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 shrink-0">
          {isRtl ? `عرض ${displayFrom}-${displayTo} من ${totalItems}` : `Showing ${displayFrom}–${displayTo} of ${totalItems}`}
        </p>
      )}

      {/* Pages */}
      <div className="flex items-center gap-1">
        {/* Previous */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
            'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500'
          )}
        >
          {isRtl ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          )}
          <span className="hidden sm:inline">{prevLabel}</span>
        </button>

        {/* Page Numbers */}
        {pages.map((page, index) =>
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-2 py-1.5 text-sm text-zinc-400 dark:text-zinc-500">
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={cn(
                'min-w-[36px] h-9 flex items-center justify-center text-sm font-medium rounded-lg transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                page === currentPage
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              )}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}

        {/* Next */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
            'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500'
          )}
        >
          <span className="hidden sm:inline">{nextLabel}</span>
          {isRtl ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          )}
        </button>
      </div>
    </nav>
  );
}
