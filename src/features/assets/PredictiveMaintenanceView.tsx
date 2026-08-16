import React, { useState, useEffect } from 'react';
import { Wrench, Calendar, Zap } from 'lucide-react';

interface MaintenanceForecast {
  assetCode: string;
  lastServiced: string;
  nextSuggestedService: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export default function PredictiveMaintenanceView({ lang }: { lang: 'ar' | 'en' }) {
  const [forecasts, setForecasts] = useState<MaintenanceForecast[]>([]);

  useEffect(() => {
    // Simulated AI-driven maintenance forecast
    setForecasts([
      { assetCode: 'AST-001', lastServiced: '2026-05-15', nextSuggestedService: '2026-08-30', riskLevel: 'high' },
      { assetCode: 'AST-002', lastServiced: '2026-06-20', nextSuggestedService: '2026-09-20', riskLevel: 'medium' },
    ]);
  }, []);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
        <Wrench className="w-5 h-5 text-indigo-500" />
        {lang === 'ar' ? 'الصيانة الوقائية الذكية (AI)' : 'AI Predictive Maintenance'}
      </h3>
      <div className="space-y-4">
        {forecasts.map((f, i) => (
          <div key={i} className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold">{f.assetCode}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${f.riskLevel === 'high' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                {f.riskLevel.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-500">
              <p>{lang === 'ar' ? 'آخر صيانة:' : 'Last Serviced:'} {f.lastServiced}</p>
              <p>{lang === 'ar' ? 'الصيانة المقترحة:' : 'Suggested Service:'} <span className="font-bold text-indigo-600">{f.nextSuggestedService}</span></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
