
import React, { useState } from 'react';
import { Microscope, Loader2, Play } from 'lucide-react';
import { runSimulation } from '../core/services/scenarioSimulator';

interface ScenarioSimulatorViewProps {
  historicalData: any[];
  lang: 'ar' | 'en';
}

export default function ScenarioSimulatorView({ historicalData, lang }: ScenarioSimulatorViewProps) {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fundingChange, setFundingChange] = useState(0);

  const handleRun = async () => {
    setLoading(true);
    try {
      const result = await runSimulation(historicalData, { fundingChange });
      setReport(result);
    } catch (error) {
      console.error('Simulation failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
        <Microscope className="w-5 h-5 text-emerald-500" />
        {lang === 'ar' ? 'محاكي السيناريوهات (AI)' : 'AI Scenario Simulator'}
      </h3>
      
      <div className="space-y-4 mb-6">
        <label className="text-xs font-bold block">{lang === 'ar' ? 'تغيير التمويل (%)' : 'Funding Change (%)'}</label>
        <input 
          type="range" 
          min="-50" 
          max="100" 
          value={fundingChange} 
          onChange={(e) => setFundingChange(Number(e.target.value))}
          className="w-full"
        />
        <div className="text-xs text-zinc-500">{fundingChange}%</div>
      </div>

      <button 
        onClick={handleRun}
        disabled={loading}
        className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center gap-2"
      >
        {loading && <Loader2 className="w-3 h-3 animate-spin" />}
        {!loading && <Play className="w-3 h-3" />}
        {lang === 'ar' ? 'تشغيل المحاكاة' : 'Run Simulation'}
      </button>

      {report && (
        <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {report}
        </div>
      )}
    </div>
  );
}
