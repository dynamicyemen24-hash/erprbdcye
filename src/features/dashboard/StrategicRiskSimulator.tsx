import React, { useState } from 'react';
import { AlertTriangle, Loader2, BarChart } from 'lucide-react';

export default function StrategicRiskSimulator({ lang }: { lang: 'ar' | 'en' }) {
  const [riskData, setRiskData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runRiskAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/gemini/strategic-risk-simulator', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: 'next-quarter' })
      });
      const data = await response.json();
      setRiskData(data);
    } catch (err) {
      console.error('Risk analysis failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
        <AlertTriangle className="w-5 h-5 text-rose-500" />
        {lang === 'ar' ? 'محاكي المخاطر الاستراتيجية' : 'Strategic Risk Simulator'}
      </h3>
      
      <button 
        onClick={runRiskAnalysis}
        disabled={loading}
        className="w-full py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart className="w-4 h-4" />}
        {lang === 'ar' ? 'تشغيل محاكاة المخاطر' : 'Run Risk Simulation'}
      </button>

      {riskData && (
        <div className="mt-6 p-4 bg-rose-50 dark:bg-rose-950/20 rounded-xl space-y-2">
          <p className="text-xs font-bold text-rose-900 dark:text-rose-100">{lang === 'ar' ? 'فئات الميزانية عالية المخاطر:' : 'High-Risk Budget Categories:'}</p>
          <ul className="list-disc pl-4 text-[10px] text-rose-800 dark:text-rose-200">
            {riskData.categories.map((cat: string, i: number) => <li key={i}>{cat}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
