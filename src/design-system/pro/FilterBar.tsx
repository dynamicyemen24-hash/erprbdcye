import React from 'react';
import { cn } from '../utils/cn';

/**
 * FilterBar — the canonical search + filter toolbar for list screens.
 *
 * Owns the search field, clear control and result count (aria-live), while
 * caller-supplied filter controls slot in between. Keeps every list screen's
 * toolbar structurally identical instead of re-copying markup.
 */

export interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  searchPlaceholderEn?: string;
  onClear?: () => void;
  /** Number of rows currently shown; announced politely to screen readers. */
  resultCount?: number;
  resultLabel?: string;
  loading?: boolean;
  /** Extra filter controls (selects, date pickers, chips…). */
  children?: React.ReactNode;
  lang?: 'ar' | 'en';
  className?: string;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchPlaceholderEn,
  onClear,
  resultCount,
  resultLabel,
  loading,
  children,
  lang = 'ar',
  className,
}: FilterBarProps) {
  const isRtl = lang === 'ar';
  const placeholder =
    searchPlaceholder || (lang === 'ar' ? 'بحث…' : searchPlaceholderEn || 'Search…');

  return (
    <div
      role="search"
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-900 p-2.5',
        className
      )}
    >
      <div className="relative min-w-[200px] flex-1">
        <svg
          className={cn('pointer-events-none absolute top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400', isRtl ? 'right-2.5' : 'left-2.5')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
        </svg>
        <input
          type="search"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className={cn(
            'w-full rounded-lg border border-transparent bg-zinc-50 dark:bg-zinc-800 py-2 text-sm text-zinc-900 dark:text-zinc-100',
            'placeholder:text-zinc-400 focus:border-zinc-300 dark:focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-[var(--ux-primary)]',
            isRtl ? 'pe-3 ps-8' : 'ps-8 pe-3'
          )}
        />
      </div>

      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}

      <div className="flex items-center gap-2 ms-auto">
        {resultCount !== undefined && (
          <span
            aria-live="polite"
            className={cn('text-xs text-zinc-500 dark:text-zinc-400 tabular-nums', loading && 'opacity-60')}
          >
            {loading ? (isRtl ? 'جارٍ التحميل…' : 'Loading…') : resultCount.toLocaleString()}
            {resultLabel ? ` ${resultLabel}` : ''}
          </span>
        )}
        {searchValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            aria-label={isRtl ? 'مسح البحث' : 'Clear search'}
            className="rounded-md p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ux-primary)]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
