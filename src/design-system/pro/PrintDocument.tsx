import React from 'react';
import { cn } from '../utils/cn';
import { Button } from '../components/Button';

/**
 * PrintDocument — the canonical A4 official document shell.
 *
 * One header (logo + organization + title + meta), one body slot, one footer,
 * brand accent from the tenant --brand-* tokens, and print CSS that hides the
 * action bar. Replaces the copy-pasted standalone print-window HTML strings
 * that were duplicated across ~28 screens.
 *
 * Rendered in-document (unlike the legacy raw-HTML windows), so tenant brand
 * variables resolve and the same component works on screen and in print.
 */

export interface PrintDocumentProps {
  title: string;
  subtitle?: string;
  organizationName?: string;
  logoSrc?: string;
  /** Key/value pairs shown at the header end (doc number, date, status…). */
  meta?: Array<{ label: string; value: string }>;
  footer?: string;
  /** Toolbar above the sheet; defaults to a print button. */
  actions?: React.ReactNode;
  children: React.ReactNode;
  lang?: 'ar' | 'en';
  className?: string;
}

export function PrintDocument({
  title,
  subtitle,
  organizationName,
  logoSrc = '/UAMEX_ERPLOGO.png',
  meta,
  footer,
  actions,
  children,
  lang = 'ar',
  className,
}: PrintDocumentProps) {
  const isRtl = lang === 'ar';

  return (
    <div className={cn('print-document', className)}>
      <style>{`
        @media print {
          .print-document__actions { display: none !important; }
          .print-document__sheet { box-shadow: none !important; border: 0 !important; margin: 0 !important; }
        }
        @page { size: A4; margin: 14mm; }
      `}</style>

      <div className="print-document__actions no-print mb-4 flex items-center justify-end gap-2">
        {actions ?? (
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            {isRtl ? 'طباعة' : 'Print'}
          </Button>
        )}
      </div>

      <article
        className="print-document__sheet rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white p-6 sm:p-8 text-zinc-900 shadow-sm"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <header
          className="mb-6 flex items-start justify-between gap-4 border-b-2 pb-4"
          style={{ borderColor: 'var(--brand-primary)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <img src={logoSrc} alt="" className="h-12 w-12 shrink-0 object-contain" />
            <div className="min-w-0">
              {organizationName && (
                <div className="truncate text-sm font-bold" style={{ color: 'var(--brand-primary)' }}>
                  {organizationName}
                </div>
              )}
              <h1 className="truncate text-lg font-extrabold text-zinc-900">{title}</h1>
              {subtitle && <p className="truncate text-xs text-zinc-500">{subtitle}</p>}
            </div>
          </div>
          {meta && meta.length > 0 && (
            <dl className="shrink-0 space-y-1 text-xs text-zinc-600">
              {meta.map((m) => (
                <div key={m.label} className={cn('flex gap-2', isRtl ? 'justify-start' : 'justify-end')}>
                  <dt className="text-zinc-400">{m.label}:</dt>
                  <dd className="font-semibold tabular-nums">{m.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </header>

        <div className="print-document__body">{children}</div>

        <footer className="mt-8 border-t border-zinc-200 pt-3 text-center text-[11px] text-zinc-400">
          {footer ?? organizationName ?? title}
        </footer>
      </article>
    </div>
  );
}
