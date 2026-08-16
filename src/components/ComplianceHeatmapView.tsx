import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';

interface DepartmentCompliance {
  name: string;
  score: number; // 0-100
}

export default function ComplianceHeatmapView({ lang }: { lang: 'ar' | 'en' }) {
  const departments: DepartmentCompliance[] = [
    { name: lang === 'ar' ? 'المالية' : 'Finance', score: 95 },
    { name: lang === 'ar' ? 'المشتريات' : 'Procurement', score: 65 },
    { name: lang === 'ar' ? 'الموارد البشرية' : 'HR', score: 80 },
    { name: lang === 'ar' ? 'العمليات' : 'Operations', score: 40 },
    { name: lang === 'ar' ? 'المشاريع' : 'Projects', score: 75 },
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
        <ShieldCheck className="w-5 h-5 text-emerald-500" />
        {lang === 'ar' ? 'خريطة الامتثال (IPSAS)' : 'Compliance Heatmap (IPSAS)'}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {departments.map(d => (
          <div key={d.name} className={`p-4 rounded-xl border ${d.score < 50 ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' : d.score < 80 ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800' : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'}`}>
            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{d.name}</p>
            <p className={`text-xl font-black ${d.score < 50 ? 'text-red-700 dark:text-red-300' : d.score < 80 ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}`}>{d.score}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
