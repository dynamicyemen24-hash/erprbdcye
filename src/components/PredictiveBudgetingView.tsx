import React, { useState } from 'react';
import { TrendingDown, Loader2, DollarSign } from 'lucide-react';
import { getBudgetForecast, BudgetForecast } from '../core/services/predictiveBudgeting';

interface PredictiveBudgetingViewProps {
  ledgerEntries: any[];
  lang: 'ar' | 'en';
}

export default function PredictiveBudgetingView({ ledgerEntries, lang }: PredictiveBudgetingViewProps) {
  const [forecast, setForecast] = useState<BudgetForecast | null>(null);
  const [loading, setLoading] = useState(false);

  const runForecast = async () => {
    setLoading(true);
    try {
      // Integrate stakeholder data
      const stakeholders = [{ id: 'S-001', sentimentScore: 88, supportRequests: 2 }];
      const result = await getBudgetForecast(ledgerEntries, stakeholders);
      setForecast(result);
    } catch (error) {
      console.error('Forecast failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
        <TrendingDown className="w-5 h-5 text-emerald-500" />
        {lang === 'ar' ? 'الميزانية التنبؤية (AI)' : 'AI-Driven Predictive Budgeting'}
      </h3>
      <button 
        onClick={runForecast}
        disabled={loading}
        className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center gap-2"
      >
        {loading && <Loader2 className="w-3 h-3 animate-spin" />}
        {lang === 'ar' ? 'تشغيل التوقعات' : 'Run Forecast'}
      </button>

      {forecast && (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
            <p className="text-[10px] text-emerald-800 dark:text-emerald-200 font-bold mb-1">
              {lang === 'ar' ? 'الميزانية المتوقعة للربع القادم' : 'Projected Budget for Next Quarter'}
            </p>
            <p className="text-xl font-black text-emerald-900 dark:text-emerald-100">
              <DollarSign className="w-4 h-4 inline" /> {forecast.projectedAmount.toLocaleString()}
            </p>
          </div>
          {forecast.cashFlowGap > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-xl">
              <p className="text-[10px] text-red-800 dark:text-red-200 font-bold mb-1">
                {lang === 'ar' ? 'فجوة التدفق النقدي المتوقعة' : 'Potential Cash-Flow Gap'}
              </p>
              <p className="text-xl font-black text-red-900 dark:text-red-100">
                <DollarSign className="w-4 h-4 inline" /> {forecast.cashFlowGap.toLocaleString()}
              </p>
            </div>
          )}
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
            "{forecast.recommendation}"
          </p>
        </div>
      )}
    </div>
  );
}
