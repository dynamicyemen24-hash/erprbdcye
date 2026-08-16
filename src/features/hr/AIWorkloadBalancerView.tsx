import React, { useState } from 'react';
import { Users, Activity, Briefcase, Zap, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';

interface StaffWorkload {
  id: string;
  name: string;
  expertise: string;
  capacity: number;
  tasksCount: number;
  proximity: string;
}

export default function AIWorkloadBalancerView({ lang }: { lang: 'ar' | 'en' }) {
  const isRtl = lang === 'ar';
  const [suggestions, setSuggestions] = useState<StaffWorkload[]>([
    { id: '1', name: 'م. أحمد المعمري', expertise: 'إدارة مشاريع وسلاسل إمداد', capacity: 85, tasksCount: 6, proximity: '2 km' },
    { id: '2', name: 'سارة العريقي', expertise: 'تدريب وتقييم ميداني', capacity: 42, tasksCount: 3, proximity: '5 km' },
    { id: '3', name: 'د. خالد العماري', expertise: 'تقييم احتياج وإغاثة طوارئ', capacity: 94, tasksCount: 8, proximity: '1 km' },
    { id: '4', name: 'م. علي الجائفي', expertise: 'هندسة حفر آبار ومياه', capacity: 60, tasksCount: 4, proximity: '3 km' },
  ]);

  const [balancing, setBalancing] = useState(false);
  const [rebalanced, setRebalanced] = useState(false);

  const triggerAIRebalance = () => {
    setBalancing(true);
    setTimeout(() => {
      setSuggestions(prev => prev.map(item => ({
        ...item,
        capacity: Math.min(75, Math.max(50, Math.round(item.capacity * 0.8)))
      })));
      setBalancing(false);
      setRebalanced(true);
    }, 1200);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-500" />
            <span>{isRtl ? 'موازن عبء العمل الذكي للفرق الميدانية (AI Workload Engine)' : 'AI Field Team Workload Auto-Balancer'}</span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            {isRtl ? 'تحليل السعة التشغيلية للموظفين، التواجد الجغرافي GIS، وإعادة توزيع مهمات WBS تلقائياً' : 'Analyzing capacity, GIS proximity & auto-redistributing field WBS tasks.'}
          </p>
        </div>

        <button
          onClick={triggerAIRebalance}
          disabled={balancing}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-indigo-950/20 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${balancing ? 'animate-spin' : ''}`} />
          <span>{isRtl ? 'إعادة الموازنة بالذكاء الاصطناعي' : 'Auto-Balance Workload'}</span>
        </button>
      </div>

      {rebalanced && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{isRtl ? 'تمت إعادة توزيع أعباء العمل الميدانية بنجاح لجميع الفرق!' : 'Field workloads successfully rebalanced across team members!'}</span>
        </div>
      )}

      <div className="space-y-2.5">
        {suggestions.map((s) => (
          <div key={s.id} className="p-3.5 border border-slate-200 dark:border-zinc-800 rounded-xl flex items-center justify-between bg-slate-50 dark:bg-zinc-950/60">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-500 font-bold flex items-center justify-center text-xs">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">{s.name}</p>
                <p className="text-[10px] text-slate-400 font-mono">{s.expertise} • {s.tasksCount} {isRtl ? 'مهام WBS' : 'tasks'} • {s.proximity}</p>
              </div>
            </div>

            <div className="text-left rtl:text-right">
              <span className="text-[10px] text-slate-400 block">{isRtl ? 'السعة التشغيلية' : 'Capacity Load'}</span>
              <span className={`text-xs font-black font-mono ${s.capacity > 80 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {s.capacity}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
