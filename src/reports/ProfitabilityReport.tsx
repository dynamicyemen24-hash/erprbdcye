import React from 'react';
import { formatCurrency } from '../shared/utils/formatters';

export interface ProfitabilityReportProps {
  revenue: number | null;
  expenses: number | null;
  netMargin: number | null; // in percent
  /** See CashFlowReport — a prop, not a hardcoded symbol. */
  currency?: 'YER' | 'SAR' | 'USD';
  lang?: 'ar' | 'en';
}

const COPY = {
  ar: {
    title: 'نظرة على الربحية',
    revenue: 'الإيرادات',
    expenses: 'المصروفات',
    margin: 'هامش الربح',
    unavailable: 'غير متوفر',
  },
  en: {
    title: 'Profitability Overview',
    revenue: 'Revenue',
    expenses: 'Expenses',
    margin: 'Net Margin',
    unavailable: 'Not available',
  },
} as const;

/**
 * Profitability summary.
 *
 * Every figure here is rendered through `formatCurrency`, so the unit always
 * matches the unit used by the KPI tiles and the cash-flow table above it. A
 * report that prints `€` while the dashboard says `ر.ي` is a false statement
 * about the organisation's books.
 *
 * When a value is missing it renders an explicit em-dash — never a zero, and
 * never a silent blank cell.
 */
export const ProfitabilityReport: React.FC<ProfitabilityReportProps> = ({
  revenue,
  expenses,
  netMargin,
  currency = 'YER',
  lang = 'ar',
}) => {
  const hasData = revenue != null || expenses != null;
  if (!hasData) return null;

  const t = COPY[lang];
  const locale = lang === 'ar' ? 'ar-YE' : 'en-GB';
  const marginPct = netMargin != null ? `${Number(netMargin).toFixed(1)}%` : '—';

  const moneyOrDash = (value: number | null) =>
    value == null ? '—' : formatCurrency(value, currency, locale);

  return (
    <div>
      <h3 className="mb-3 text-sm font-black text-zinc-900 dark:text-white">{t.title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        {[
          { key: 'revenue', label: t.revenue, value: moneyOrDash(revenue) },
          { key: 'expenses', label: t.expenses, value: moneyOrDash(expenses) },
          { key: 'margin', label: t.margin, value: marginPct },
        ].map((cell) => (
          <div key={cell.key} className="rounded-lg border border-zinc-200 dark:border-zinc-700/60 p-3">
            <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              {cell.label}
            </div>
            <div className="mt-1 font-bold tabular-nums text-zinc-900 dark:text-white">{cell.value}</div>
          </div>
        ))}
      </div>
      <p className="sr-only">
        {t.revenue}: {revenue ?? t.unavailable}. {t.expenses}: {expenses ?? t.unavailable}.{' '}
        {t.margin}: {netMargin != null ? `${netMargin}%` : t.unavailable}.
      </p>
    </div>
  );
};

export default ProfitabilityReport;