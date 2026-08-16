import React, { useState, useEffect } from 'react';
import { User, Award, CheckCircle2, BarChart2, Star, Layers, TrendingUp } from 'lucide-react';

interface EmployeeContributionViewProps {
  employeeId: string;
  lang: 'ar' | 'en';
}

export default function EmployeeContributionView({ employeeId, lang }: EmployeeContributionViewProps) {
  const isRtl = lang === 'ar';
  const [contributions, setContributions] = useState<any[]>([]);

  useEffect(() => {
    // Linked employee field tasks to review metrics
    setContributions([
      { task: 'تقييم احتياج سلة إغاثية - تعز', domain: isRtl ? 'الميدان' : 'Field', date: '2026-07-15', rating: 96, status: 'مكتمل وموثق' },
      { task: 'إشراف على حفر بئر مياه - عدن', domain: isRtl ? 'المشاريع' : 'Projects', date: '2026-06-20', rating: 92, status: 'مكتمل وموثق' },
      { task: 'توزيع كفالات الأيتام - صنعاء', domain: isRtl ? 'الرعاية' : 'Welfare', date: '2026-05-10', rating: 94, status: 'مكتمل وموثق' },
    ]);
  }, [employeeId, isRtl]);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span>{isRtl ? 'سجل المساهمات والإنجازات الميدانية' : 'Employee Field Contribution Review'}</span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            {isRtl ? 'ربط نتائج المهام الميدانية بتقييم الأداء والمكافآت الإضافية' : 'Linking field task execution metrics to performance appraisal & bonuses.'}
          </p>
        </div>

        <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-mono font-bold flex items-center gap-1">
          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          <span>{isRtl ? 'متوسط الجودة 94%' : '94% Quality Score'}</span>
        </div>
      </div>

      <div className="space-y-2.5">
        {contributions.map((c, i) => (
          <div key={i} className="p-3.5 border border-slate-200 dark:border-zinc-800 rounded-xl flex items-center justify-between bg-slate-50 dark:bg-zinc-950/60">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">{c.task}</span>
                  <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-600 font-mono text-[9px] font-bold rounded">{c.domain}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">{c.date} • {c.status}</p>
              </div>
            </div>
            <span className="text-xs font-black font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              {c.rating}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
