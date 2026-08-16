import React, { useState } from 'react';
import { ShoppingCart, Loader2, Award, Zap } from 'lucide-react';

export default function VendorRecommendationEngineView({ lang }: { lang: 'ar' | 'en' }) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const getRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/gemini/vendor-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: 'upcoming-construction-project' })
      });
      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (err) {
      console.error('Recommendation failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
        <Zap className="w-5 h-5 text-amber-500" />
        {lang === 'ar' ? 'محرك توصية الموردين الذكي (AI)' : 'AI-Driven Vendor Recommendation Engine'}
      </h3>
      
      <button 
        onClick={getRecommendations}
        disabled={loading}
        className="w-full py-3 bg-amber-600 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
        {lang === 'ar' ? 'الحصول على توصيات' : 'Get Recommendations'}
      </button>

      <div className="mt-6 space-y-3">
        {recommendations.map((r, i) => (
          <div key={i} className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold">{r.vendorName}</p>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-[10px] text-zinc-500">{lang === 'ar' ? 'موثوقية:' : 'Reliability:'} {r.reliabilityScore}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
