import React, { useState, useEffect } from 'react';
import { Zap, Loader2, BarChart3, TrendingUp, Sparkles, Download, Layers } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function HRIntelligenceAnalyticsView({ lang }: { lang: 'ar' | 'en' }) {
  const isRtl = lang === 'ar';
  const [data, setData] = useState<any[]>([
    { name: 'م. أحمد المعمري', training: 42, performance: 96, completion: 98, role: 'مدير مشاريع' },
    { name: 'أ. ياسر باوزير', training: 36, performance: 92, completion: 95, role: 'مسؤول مالية' },
    { name: 'د. خالد العماري', training: 28, performance: 89, completion: 90, role: 'منسق ميداني' },
    { name: 'سارة العريقي', training: 50, performance: 98, completion: 100, role: 'أخصائية موارد' },
    { name: 'م. علي الجائفي', training: 20, performance: 84, completion: 86, role: 'مهندس إغَاثي' },
  ]);
  const [loading, setLoading] = useState(false);

  const runAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/gemini/hr-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: 'correlation-analysis' })
      });
      const result = await response.json();
      if (result.data && Array.isArray(result.data)) {
        setData(result.data);
      }
    } catch (err) {
      console.warn('AI Analytics endpoint using cached intelligence dataset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-500" />
            <span>{isRtl ? 'تحليلات الموارد البشرية والذكاء التنبؤي' : 'HR Intelligence & Correlation Engine'}</span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            {isRtl ? 'تحليل العلاقة بين ساعات التدريب الإنساني، معدل إنجاز المهام الميدانية، وتقييم الأداء' : 'Correlation between L&D training hours, WBS task velocity & appraisal ratings.'}
          </p>
        </div>

        <button 
          onClick={runAnalytics}
          disabled={loading}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-emerald-950/20 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          <span>{isRtl ? 'تحديث التحليلات' : 'Run AI Analysis'}</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs font-mono pt-2">
        <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800">
          <span className="text-[10px] text-slate-400 block">{isRtl ? 'معامل الارتباط (R²)' : 'Correlation Index R²'}</span>
          <span className="text-base font-black text-emerald-600 dark:text-emerald-400">0.895</span>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800">
          <span className="text-[10px] text-slate-400 block">{isRtl ? 'متوسط ساعات التدريب' : 'Avg Training Hours'}</span>
          <span className="text-base font-black text-slate-900 dark:text-white">35.2 hrs</span>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800">
          <span className="text-[10px] text-slate-400 block">{isRtl ? 'أثر التدريب على الأداء' : 'L&D Impact Yield'}</span>
          <span className="text-base font-black text-blue-600 dark:text-blue-400">+14.2%</span>
        </div>
      </div>

      <div className="h-60 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis type="number" dataKey="training" name="Training Hours" unit="h" stroke="#94a3b8" fontSize={10} />
            <YAxis type="number" dataKey="performance" name="Performance Score" stroke="#94a3b8" fontSize={10} domain={[60, 100]} />
            <ZAxis type="number" dataKey="completion" range={[60, 300]} name="Task Completion" />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }} 
              contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', color: '#fff', borderRadius: '12px', fontSize: '11px' }} 
            />
            <Scatter name="Staff Analysis" data={data} fill="#059669">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#059669' : '#d97706'} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
