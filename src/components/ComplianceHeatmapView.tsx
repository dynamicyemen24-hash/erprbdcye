import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface DepartmentCompliance {
  name: string;
  score: number; // 0-100
}

interface ComplianceHeatmapViewProps {
  lang: 'ar' | 'en';
  scores?: DepartmentCompliance[];
  loading?: boolean;
}

const FALLBACK_AR: DepartmentCompliance[] = [
  { name: 'المالية', score: 95 },
  { name: 'المشتريات', score: 65 },
  { name: 'الموارد البشرية', score: 80 },
  { name: 'العمليات', score: 40 },
  { name: 'المشاريع', score: 75 },
];

const FALLBACK_EN: DepartmentCompliance[] = [
  { name: 'Finance', score: 95 },
  { name: 'Procurement', score: 65 },
  { name: 'HR', score: 80 },
  { name: 'Operations', score: 40 },
  { name: 'Projects', score: 75 },
];

export default function ComplianceHeatmapView({ lang, scores, loading = false }: ComplianceHeatmapViewProps) {
  const departments = scores ?? (lang === 'ar' ? FALLBACK_AR : FALLBACK_EN);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
        <ShieldCheck className="w-5 h-5 text-emerald-500" />
        {lang === 'ar' ? 'خريطة الامتثال المؤسسي والمعايير المعتمدة' : 'Compliance & Governance Heatmap'}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {loading
          ? departments.map((d) => (
              <div key={d.name} className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 animate-pulse">
                <div className="h-3 w-20 rounded bg-slate-200 dark:bg-zinc-700 mb-2" />
                <div className="h-6 w-12 rounded bg-slate-200 dark:bg-zinc-700" />
              </div>
            ))
          : departments.map((d) => (
            <div key={d.name} className={`p-4 rounded-xl border ${d.score < 50 ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' : d.score < 80 ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800' : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'}`}>
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{d.name}</p>
              <p className={`text-xl font-black ${d.score < 50 ? 'text-red-700 dark:text-red-300' : d.score < 80 ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}`}>{d.score}%</p>
            </div>
          ))}
      </div>
    </div>
  );
}
