import React, { useState, useEffect } from 'react';
import { Package, Calendar, AlertTriangle, Zap } from 'lucide-react';

interface ForecastData {
  item: string;
  predictedStockOut: string; // Date
  suggestedOrderDate: string; // Date
  historicalLeadTimeDays: number;
}

export default function ProcurementForecastingView({ lang }: { lang: 'ar' | 'en' }) {
  const [forecasts, setForecasts] = useState<ForecastData[]>([]);

  useEffect(() => {
    // Simulated AI-driven forecasting
    setForecasts([
      { item: 'Cement Bags', predictedStockOut: '2026-08-25', suggestedOrderDate: '2026-08-15', historicalLeadTimeDays: 10 },
      { item: 'Steel Bars', predictedStockOut: '2026-09-05', suggestedOrderDate: '2026-08-20', historicalLeadTimeDays: 16 },
    ]);
  }, []);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
        <Zap className="w-5 h-5 text-indigo-500" />
        {lang === 'ar' ? 'تنبؤ المشتريات الذكي (AI)' : 'AI-Driven Procurement Forecasting'}
      </h3>
      <div className="space-y-4">
        {forecasts.map((f, i) => (
          <div key={i} className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-indigo-500" />
              <p className="text-xs font-bold">{f.item}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-500">
              <p>{lang === 'ar' ? 'تاريخ النفاذ المتوقع:' : 'Predicted Stock-out:'} <span className="font-bold text-red-500">{f.predictedStockOut}</span></p>
              <p>{lang === 'ar' ? 'تاريخ الطلب المقترح:' : 'Suggested Order Date:'} <span className="font-bold text-emerald-500">{f.suggestedOrderDate}</span></p>
              <p>{lang === 'ar' ? 'متوسط زمن التوريد:' : 'Avg Lead Time:'} {f.historicalLeadTimeDays} {lang === 'ar' ? 'أيام' : 'days'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
