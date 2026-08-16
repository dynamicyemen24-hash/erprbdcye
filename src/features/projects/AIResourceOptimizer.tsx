import React, { useState } from 'react';
import { Calendar, Users, Loader2, Zap } from 'lucide-react';

export default function AIResourceOptimizer({ lang }: { lang: 'ar' | 'en' }) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const getSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/gemini/resource-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: 'optimize-schedule' })
      });
      const data = await response.json();
      setSuggestions(data.suggestions);
    } catch (err) {
      console.error('Optimization failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
        <Zap className="w-5 h-5 text-purple-500" />
        {lang === 'ar' ? 'مُحسِّن الموارد الذكي (AI)' : 'AI Resource Optimizer'}
      </h3>
      
      <button 
        onClick={getSuggestions}
        disabled={loading}
        className="w-full py-3 bg-purple-600 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
        {lang === 'ar' ? 'توليد اقتراحات الجدولة' : 'Generate Scheduling Suggestions'}
      </button>

      <div className="mt-6 space-y-3">
        {suggestions.map((s, i) => (
          <div 
            key={i} 
            draggable 
            onDragStart={(e) => handleDragStart(e, s.id)}
            className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-grab bg-zinc-50 dark:bg-zinc-800"
          >
            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{s.activity}</p>
            <p className="text-[10px] text-zinc-500">{lang === 'ar' ? 'الموظف المقترح:' : 'Suggested Staff:'} {s.staff}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
