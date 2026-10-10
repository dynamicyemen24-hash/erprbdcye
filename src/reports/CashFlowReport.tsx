import React from 'react';
import { formatCurrency } from '../shared/utils/formatters';

export interface CashFlowPeriod {
  period: string;
  income: number;
  expenses: number;
  balance: number;
}

export interface CashFlowReportProps {
  periods: CashFlowPeriod[];
  /**
   * Currency of every amount. Defaults to YER because the ledger's base
   * currency is YER — but it is a PROP, not a constant: the same report is
   * rendered for an organisation whose books are in SAR or USD, and printing a
   * hardcoded `€` next to a YER KPI is a misrepresentation of the books
   * (ISO 4217 / IPSAS), not a cosmetic bug.
   */
  currency?: 'YER' | 'SAR' | 'USD';
  lang?: 'ar' | 'en';
}

const COPY = {
  ar: {
    title: 'التدفق النقدي',
    period: 'الفترة',
    income: 'الوارد',
    expenses: 'المصروف',
    balance: 'الرصيد',
  },
  en: {
    title: 'Cash Flow Overview',
    period: 'Period',
    income: 'Income',
    expenses: 'Expenses',
    balance: 'Balance',
  },
} as const;

/**
 * Cash flow table.
 *
 * Accessibility contract:
 *   - WCAG 1.3.1: a `<caption>` names the table, so a screen reader announces
 *     "التدفق النقدي, جدول" before the header row rather than "table, 4 columns".
 *   - WCAG 1.4.3: amounts use the locale-aware `formatCurrency`, which places
 *     the currency symbol consistently for both reading directions.
 */
export const CashFlowReport: React.FC<CashFlowReportProps> = ({
  periods,
  currency = 'YER',
  lang = 'ar',
}) => {
  if (periods.length === 0) return null;

  const t = COPY[lang];
  const locale = lang === 'ar' ? 'ar-YE' : 'en-GB';
  const money = (amount: number) => formatCurrency(amount, currency, locale);

  return (
    <div>
      <h3 className="mb-4 text-sm font-black text-zinc-900 dark:text-white">{t.title}</h3>
      <table className="min-w-full divide-y divide-slate-200 dark:divide-zinc-800">
        <caption className="sr-only">{t.title}</caption>
        <thead>
          <tr>
            <th scope="col" className="p-3 text-start text-xs font-bold text-zinc-600 dark:text-zinc-300">
              {t.period}
            </th>
            <th scope="col" className="p-3 text-start text-xs font-bold text-zinc-600 dark:text-zinc-300">
              {t.income}
            </th>
            <th scope="col" className="p-3 text-start text-xs font-bold text-zinc-600 dark:text-zinc-300">
              {t.expenses}
            </th>
            <th scope="col" className="p-3 text-start text-xs font-bold text-zinc-600 dark:text-zinc-300">
              {t.balance}
            </th>
          </tr>
        </thead>
        <tbody>
          {periods.map((p) => (
            <tr key={p.period} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
              <td className="p-3 text-sm text-zinc-700 dark:text-zinc-200">{p.period}</td>
              <td className="p-3 text-sm tabular-nums text-emerald-700 dark:text-emerald-400">
                {money(p.income)}
              </td>
              <td className="p-3 text-sm tabular-nums text-rose-700 dark:text-rose-400">
                {money(p.expenses)}
              </td>
              <td
                className={`p-3 text-sm font-bold tabular-nums ${
                  p.balance >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
              >
                {money(p.balance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CashFlowReport;