import React, { useState } from 'react';
import { BrainCircuit, Loader2 } from 'lucide-react';

interface ImpactProjectionViewProps {
  portfolioData: any[];
  beneficiaryData: any[];
  lang: 'ar' | 'en';
}

export default function ImpactProjectionView({ portfolioData, beneficiaryData, lang }: ImpactProjectionViewProps) {
  const [projection, setProjection] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const generateProjection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/gemini/impact-projection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioData, beneficiaryData }),
      });
      const data = await response.json();
      setProjection(data.projection);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Impact projection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
        <BrainCircuit className="w-5 h-5 text-indigo-500" />
        {lang === 'ar' ? 'توقعات الأثر الاستراتيجي (AI)' : 'Strategic Impact Projection (AI)'}
      </h3>
      <button 
        onClick={generateProjection}
        disabled={loading}
        className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg flex items-center gap-2"
      >
        {loading && <Loader2 className="w-3 h-3 animate-spin" />}
        {lang === 'ar' ? 'بدء محاكاة الأثر' : 'Run Impact Simulation'}
      </button>

      {loading && !projection && (
        <div className="mt-6 flex flex-col items-center justify-center py-8 gap-3">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {lang === 'ar' ? 'جارٍ إنشاء توقعات الأثر...' : 'Generating impact projection...'}
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg flex items-center justify-between">
          <span className="text-xs text-red-700 dark:text-red-300">{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700 text-xs font-bold">✕</button>
        </div>
      )}

      {projection && (
        <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {projection}
        </div>
      )}
    </div>
  );
}
