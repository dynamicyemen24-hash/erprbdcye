// NEB-13: AI Intelligence & Impact OS - Predictive Budgeting Service
import { LedgerEntry } from '../ledger/types';

export interface BudgetForecast {
  projectedAmount: number;
  cashFlowGap: number;
  recommendation: string;
}

export async function getBudgetForecast(entries: LedgerEntry[], stakeholders: any[]): Promise<BudgetForecast> {
  const response = await fetch('/api/gemini/predictive-budgeting', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entries, stakeholders }),
  });
  const data = await response.json();
  return data.forecast;
}
