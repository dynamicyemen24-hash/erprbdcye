import React, { useState } from 'react';
import { AlertTriangle, Loader2, BarChart } from 'lucide-react';

export default function StrategicRiskSimulator({ lang }: { lang: 'ar' | 'en' }) {
  const [riskData, setRiskData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      setErrorMessage(err instanceof Error ? err.message : 'Risk simulation failed');
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

      {loading && !riskData && (
        <div className="mt-6 flex flex-col items-center justify-center py-8 gap-3">
          <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {lang === 'ar' ? 'جارٍ تشغيل محاكاة المخاطر...' : 'Running risk simulation...'}
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg flex items-center justify-between">
          <span className="text-xs text-red-700 dark:text-red-300">{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700 text-xs font-bold">✕</button>
        </div>
      )}

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
