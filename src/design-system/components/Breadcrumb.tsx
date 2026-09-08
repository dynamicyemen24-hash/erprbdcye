/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * UAMEX ERP™ — Breadcrumb Component v3.0
 * Navigation breadcrumb with RTL, truncation, and responsive collapse
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { cn } from '../utils/cn';

export interface BreadcrumbItem {
  id: string;
  label: string;
  labelAr?: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  current?: boolean;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  lang?: 'ar' | 'en';
  separator?: React.ReactNode;
  maxItems?: number;
  className?: string;
  onNavigate?: (item: BreadcrumbItem) => void;
}

export function Breadcrumb({
  items,
  lang = 'ar',
  separator,
  maxItems = 4,
  className,
  onNavigate,
}: BreadcrumbProps) {
  const isRtl = lang === 'ar';
  const Separator = separator || (
    <svg className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d={isRtl ? 'M15.75 19.5L8.25 12l7.5-7.5' : 'M8.25 4.5l7.5 7.5-7.5 7.5'} />
    </svg>
  );

  // Collapse middle items if too many
  const displayItems = items.length > maxItems
    ? [...items.slice(0, 1), { id: '...', label: '...', current: false } as BreadcrumbItem, ...items.slice(-maxItems + 2)]
    : items;

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center', className)}>
      <ol className="flex items-center gap-1.5 flex-wrap" role="list">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const displayLabel = lang === 'ar' ? (item.labelAr || item.label) : item.label;

          return (
            <li key={item.id} className="flex items-center gap-1.5">
              {index > 0 && <span className="shrink-0">{Separator}</span>}
              {item.id === '...' ? (
                <span className="px-1 text-sm text-zinc-400 dark:text-zinc-500">...</span>
              ) : isLast || item.current ? (
                <span className="text-sm font-medium text-zinc-900 dark:text-white flex items-center gap-1.5" aria-current="page">
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  {displayLabel}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (item.onClick) item.onClick();
                    else if (onNavigate) onNavigate(item);
                  }}
                  className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
                >
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  {displayLabel}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
