import React from 'react';

export interface ProfitabilityReportProps {
  revenue: number | null;
  expenses: number | null;
  netMargin: number | null; // in percent
}

export const ProfitabilityReport: React.FC<ProfitabilityReportProps> = ({
  revenue,
  expenses,
  netMargin,
}) => {
  const hasData = revenue != null || expenses != null;
  if (!hasData) return null;

  const marginPct = netMargin != null ? `${Number(netMargin).toFixed(1)} %` : '–';

  return (
    <div className="p-6 space-y-4">
      <h3 className="mb-3">Profitability Overview</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <div className="font-bold text-sm text-slate-700">Revenue</div>
          <div className="font-mono text-sm">{revenue != null ? `${revenue.toLocaleString()} €` : '–'}</div>
        </div>
        <div>
          <div className="font-bold text-sm text-slate-700">Expenses</div>
          <div className="font-mono text-sm">
            {expenses != null ? `${expenses.toLocaleString()} €` : '–'}
          </div>
        </div>
        <div>
          <div className="font-bold text-sm text-slate-700">Net Margin</div>
          <div className="font-mono text-sm">{marginPct}</div>
        </div>
      </div>
    </div>
  );
};