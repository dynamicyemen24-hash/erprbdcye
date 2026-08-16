import React, { useState } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import { generateBriefing } from '../core/services/proactiveInsight';
import { Anomaly } from '../core/services/anomalyDetection';

interface ProactiveBriefingViewProps {
  anomalies: Anomaly[];
  lang: 'ar' | 'en';
}

export default function ProactiveBriefingView({ anomalies, lang }: ProactiveBriefingViewProps) {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateBriefing(anomalies);
      setBriefing(result);
    } catch (error) {
      console.error('Briefing generation failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
        <Mail className="w-5 h-5 text-purple-500" />
        {lang === 'ar' ? 'ملخص الإحاطة الصباحية (AI)' : 'Morning Briefing Summary (AI)'}
      </h3>
      
      <button 
        onClick={handleGenerate}
        disabled={loading || anomalies.length === 0}
        className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg flex items-center gap-2 disabled:opacity-50"
      >
        {loading && <Loader2 className="w-3 h-3 animate-spin" />}
        {lang === 'ar' ? 'توليد الإحاطة' : 'Generate Briefing'}
      </button>

      {briefing && (
        <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed italic">
          {briefing}
        </div>
      )}
    </div>
  );
}
