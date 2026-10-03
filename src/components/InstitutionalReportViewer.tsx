import React, { useMemo } from 'react';
import { X, RefreshCw, FileText } from 'lucide-react';
import InstitutionalReportHeader, { type InstitutionalHeaderData } from './InstitutionalReportHeader';
import { useLiveReport } from '../shared/hooks/useInstitutionalReports';

type ReportLang = 'ar' | 'en';

interface InstitutionalReportViewerProps {
  endpoint: string;
  lang: ReportLang;
  onClose: () => void;
}

const META_KEYS = new Set([
  'title', 'titleAr', 'titleEn', 'header', 'lang', 'dir',
  'generatedAt', 'compliance', 'dataQuality', 'standard', 'organizationId',
]);

const MAX_ROWS = 25;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function cellText(v: unknown): string {
  if (v == null) return '—';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  return JSON.stringify(v);
}

function DataTable({ rows }: { rows: Record<string, unknown>[] }) {
  const columns = useMemo(() => {
    const cols: string[] = [];
    for (const r of rows.slice(0, 10)) {
      for (const k of Object.keys(r)) {
        if (!cols.includes(k)) cols.push(k);
        if (cols.length >= 8) break;
      }
      if (cols.length >= 8) break;
    }
    return cols;
  }, [rows]);
  const shown = rows.slice(0, MAX_ROWS);
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 dark:bg-zinc-800">
            {columns.map((c) => (
              <th key={c} scope="col" className="px-3 py-2 text-start font-bold text-slate-500 dark:text-zinc-400 whitespace-nowrap">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((r, i) => (
            <tr key={i} className="border-t border-slate-100 dark:border-zinc-800">
              {columns.map((c) => (
                <td key={c} className="px-3 py-2 text-slate-700 dark:text-zinc-300 max-w-[240px] truncate">{cellText(r[c])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > MAX_ROWS && (
        <p className="px-3 py-2 text-[11px] text-slate-400">+{rows.length - MAX_ROWS} rows</p>
      )}
    </div>
  );
}

function KeyValues({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([, v]) => !isPlainObject(v) && !Array.isArray(v));
  if (entries.length === 0) return null;
  return (
    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {entries.map(([k, v]) => (
        <div key={k} className="rounded-xl bg-slate-50 dark:bg-zinc-800 p-3">
          <dt className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 mb-1">{k}</dt>
          <dd className="text-sm font-black text-slate-900 dark:text-zinc-100">{cellText(v)}</dd>
        </div>
      ))}
    </dl>
  );
}

function sectionTitle(key: string, lang: ReportLang): string {
  const map: Record<string, [string, string]> = {
    totals: ['الإجماليات', 'Totals'],
    summary: ['الملخص', 'Summary'],
    lines: ['البنود', 'Lines'],
    months: ['الشهور', 'Months'],
    accounts: ['الحسابات', 'Accounts'],
    pillars: ['الركائز', 'Pillars'],
    vendors: ['الموردون', 'Vendors'],
    grants: ['المنح', 'Grants'],
    campaigns: ['الحملات', 'Campaigns'],
    donors: ['المانحون', 'Donors'],
    overdue: ['متأخرة', 'Overdue'],
    dueSoon: ['مستحقة قريباً', 'Due soon'],
    upcoming: ['قادمة', 'Upcoming'],
    byAction: ['حسب الإجراء', 'By action'],
    latest: ['الأحدث', 'Latest'],
    items: ['البنود', 'Items'],
    kpis: ['المؤشرات', 'KPIs'],
    budget: ['الموازنة', 'Budget'],
  };
  const pair = map[key];
  return pair ? (lang === 'ar' ? pair[0] : pair[1]) : key;
}

export function InstitutionalReportViewer({ endpoint, lang, onClose }: InstitutionalReportViewerProps) {
  const { data, loading, error, retry } = useLiveReport<Record<string, unknown>>(endpoint);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const sections = useMemo(() => {
    if (!data) return [];
    return Object.entries(data).filter(([k]) => !META_KEYS.has(k));
  }, [data]);

  const title = typeof data?.title === 'string' ? data.title : lang === 'ar' ? 'تقرير' : 'Report';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir={dir} role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-50 dark:bg-zinc-950 p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-zinc-100">
            <FileText className="w-4 h-4 text-emerald-500" />
            {endpoint}
          </p>
          <button onClick={onClose} aria-label={lang === 'ar' ? 'إغلاق' : 'Close'} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading && (
          <div className="space-y-3 animate-pulse" aria-label={lang === 'ar' ? 'جار التحميل' : 'Loading'}>
            <div className="h-24 rounded-2xl bg-slate-200 dark:bg-zinc-800" />
            <div className="h-40 rounded-2xl bg-slate-200 dark:bg-zinc-800" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-5 text-center">
            <p className="text-sm font-bold text-red-700 dark:text-red-300">{error}</p>
            <button onClick={retry} className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold">
              <RefreshCw className="w-3 h-3" />{lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {isPlainObject(data.header) ? (
              <InstitutionalReportHeader
                title={title}
                titleSecondary={typeof data.titleEn === 'string' && lang === 'ar' ? data.titleEn : undefined}
                lang={lang}
                dir={dir}
                header={data.header as unknown as InstitutionalHeaderData}
              />
            ) : (
              <h2 className="text-lg font-black text-slate-900 dark:text-zinc-100">{title}</h2>
            )}

            {sections.map(([key, value]) => (
              <section key={key} className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 mb-3">{sectionTitle(key, lang)}</h3>
                {Array.isArray(value) && value.length > 0 && isPlainObject(value[0]) ? (
                  <DataTable rows={value as Record<string, unknown>[]} />
                ) : Array.isArray(value) ? (
                  <p className="text-xs text-slate-500">{value.map(cellText).join('، ') || '—'}</p>
                ) : isPlainObject(value) ? (
                  <KeyValues data={value} />
                ) : (
                  <p className="text-sm font-black">{cellText(value)}</p>
                )}
              </section>
            ))}

            <p className="text-[11px] text-slate-400 dark:text-zinc-500">
              {typeof data.compliance === 'string' ? data.compliance : ''}
              {typeof data.generatedAt === 'string' ? ` • ${data.generatedAt.slice(0, 19).replace('T', ' ')}` : ''}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default InstitutionalReportViewer;
