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
      console.error('Projection failed', error);
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

      {projection && (
        <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {projection}
        </div>
      )}
    </div>
  );
}
