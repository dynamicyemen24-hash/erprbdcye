export interface CashFlowPeriod {
  period: string;
  income: number;
  expenses: number;
  balance: number;
}

export interface CashFlowReportProps {
  periods: CashFlowPeriod[];
}

export const CashFlowReport: React.FC<CashFlowReportProps> = ({ periods }) => {
  const hasData = periods.length > 0;
  if (!hasData) return null;

  return (
    <div className="p-6">
      <h3 className="mb-4">Cash Flow Overview</h3>
      <table className="min-w-full divide-y divide-slate-200">
        <thead>
          <tr>
            <th scope="col" className="p-3">Period</th>
            <th scope="col" className="p-3">Income</th>
            <th scope="col" className="p-3">Expenses</th>
            <th scope="col" className="p-3">Balance</th>
          </tr>
        </thead>
        <tbody>
          {periods.map((p) => (
            <tr key={p.period} className="hover:bg-slate-50">
              <td className="p-3">{p.period}</td>
              <td className="p-3">{p.income.toLocaleString()} €</td>
              <td className="p-3">{p.expenses.toLocaleString()} €</td>
              <td className="p-3">
                {p.balance > 0 ? `+${p.balance.toLocaleString()} €` : `-${Math.abs(p.balance).toLocaleString()} €`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};