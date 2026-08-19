import React, { useState } from 'react';
import { Zap, Loader2, BarChart2, Award, Sparkles, UserCheck } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ReferenceLine, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';

export default function HRPerformanceMatrixView({ lang }: { lang: 'ar' | 'en' }) {
  const isRtl = lang === 'ar';
  const [data, setData] = useState<any[]>([
    { name: 'م. أحمد المعمري', performance: 92, potential: 88, size: 200, category: 'High Potential / Top Performer' },
    { name: 'أ. ياسر باوزير', performance: 88, potential: 82, size: 180, category: 'High Performer' },
    { name: 'د. خالد العماري', performance: 85, potential: 90, size: 210, category: 'Key Talent' },
    { name: 'سارة العريقي', performance: 95, potential: 95, size: 250, category: 'Star Player' },
    { name: 'م. علي الجائفي', performance: 78, potential: 75, size: 150, category: 'Core Contributor' },
  ]);
  const [loading, setLoading] = useState(false);

  const runMatrix = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/gemini/hr-performance-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: 'performance-quadrant' })
      });
      const result = await response.json();
      if (result.data && Array.isArray(result.data)) {
        setData(result.data);
      }
    } catch (err) {
      // Fallback to cached data
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span>{isRtl ? 'مصفوفة أداء وتقييم الكادر (9-Box Grid Matrix)' : 'HR 9-Box Performance & Potential Matrix'}</span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            {isRtl ? 'تقييم كفاءة الكادر الوظيفي وربط الأداء الفعلي بالقدرات القيادية المستقبلية' : '9-Box Grid Mapping performance appraisal vs leadership potential.'}
          </p>
        </div>

        <button 
          onClick={runMatrix}
          disabled={loading}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-emerald-950/20 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BarChart2 className="w-3.5 h-3.5" />}
          <span>{isRtl ? 'توليد المصفوفة' : 'Generate 9-Box Grid'}</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs font-mono pt-2">
        <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800">
          <span className="text-[10px] text-slate-400 block">{isRtl ? 'النجوم والموهوبين (Stars)' : 'Star Performers'}</span>
          <span className="text-base font-black text-amber-500">40%</span>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800">
          <span className="text-[10px] text-slate-400 block">{isRtl ? 'المساهمون الأساسيون' : 'Core Contributors'}</span>
          <span className="text-base font-black text-emerald-600 dark:text-emerald-400">55%</span>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800">
          <span className="text-[10px] text-slate-400 block">{isRtl ? 'مخاطر الحاجة للدعم' : 'Development Needed'}</span>
          <span className="text-base font-black text-rose-500">5%</span>
        </div>
      </div>

      <div className="relative h-60 pt-2">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm rounded-xl z-10 gap-3">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {isRtl ? 'جارٍ إنشاء المصفوفة...' : 'Generating 9-Box grid...'}
            </p>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 15, right: 15, bottom: 15, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis type="number" dataKey="performance" name="Performance" stroke="#94a3b8" fontSize={10} domain={[50, 100]} />
            <YAxis type="number" dataKey="potential" name="Potential" stroke="#94a3b8" fontSize={10} domain={[50, 100]} />
            <ZAxis type="number" dataKey="size" range={[80, 250]} />
            <ReferenceLine x={75} stroke="#d97706" strokeDasharray="3 3" />
            <ReferenceLine y={75} stroke="#d97706" strokeDasharray="3 3" />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', color: '#fff', borderRadius: '12px', fontSize: '11px' }} 
            />
            <Scatter name="Employees" data={data} fill="#059669" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
