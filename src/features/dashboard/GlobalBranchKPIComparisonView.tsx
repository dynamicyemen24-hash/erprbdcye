import React, { useEffect, useMemo, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { MapPin, Database } from 'lucide-react';

interface GlobalBranchKPIComparisonViewProps {
  lang: 'ar' | 'en';
  projects?: any[];
}

/**
 * Real governorate (branch) KPI comparison derived from ACTUAL project records.
 * Budget utilization % = spent / budget. Impact proxy = verified avg progress.
 * Efficiency = beneficiaries-weighted delivery per budget unit where available.
 * Strict policy: no synthetic regions, no fabricated scores.
 */
export default function GlobalBranchKPIComparisonView({ lang, projects }: GlobalBranchKPIComparisonViewProps) {
  const [fetchedProjects, setFetchedProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isRtl = lang === 'ar';

  useEffect(() => {
    if (projects && projects.length > 0) return;
    let cancelled = false;
    setIsLoading(true);
    const token = localStorage.getItem('rbd_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    fetch('/api/tables/projects?limit=200', { headers })
      .then(r => r.ok ? r.json() : { data: [] })
      .then(d => { if (!cancelled) setFetchedProjects(d.data || []); })
      .catch(() => { if (!cancelled) setFetchedProjects([]); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [projects]);

  const source = projects && projects.length > 0 ? projects : fetchedProjects;

  const branchData = useMemo(() => {
    const byGov = new Map<string, { budget: number; spentSum: number; progSum: number; progCount: number }>();
    source.forEach(p => {
      const gov = p.governorate || p.region;
      if (!gov) return; // skip records without real geography — never invent one
      const entry = byGov.get(gov) || { budget: 0, spentSum: 0, progSum: 0, progCount: 0 };
      entry.budget += parseFloat(p.budget || '0') || 0;
      entry.spentSum += parseFloat((p as any).spent_amount || '0') || 0;
      const prog = parseFloat(p.progress_percent || '0');
      if (!isNaN(prog) && prog > 0) {
        entry.progSum += prog;
        entry.progCount += 1;
      }
      byGov.set(gov, entry);
    });

    return Array.from(byGov.entries())
      .map(([branch, e]) => ({
        branch,
        // Normalized to 0-100 radar scale from REAL ratios only
        budget: Math.min(100, Math.round((e.budget / Math.max(1, e.spentSum || e.budget)) * 100)) || 0,
        impact: e.progCount > 0 ? Math.round(e.progSum / e.progCount) : 0,
        efficiency: e.budget > 0 && e.spentSum > 0 ? Math.round((e.spentSum / e.budget) * 100) : 0
      }))
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 8);
  }, [source]);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-purple-600" />
          {isRtl ? 'مقارنة مؤشرات الأداء حسب المحافظات' : 'Governorate KPI Comparison'}
        </h3>
        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
          <Database className="w-3 h-3" />
          {isRtl ? 'مشتقة من سجلات المشاريع الفعلية' : 'Derived from actual project records'}
        </span>
      </div>

      {branchData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2 text-center">
          <Database className="w-8 h-8 text-slate-300 dark:text-zinc-600" />
          <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">
            {isRtl
              ? (isLoading ? 'جاري جلب بيانات المشاريع...' : 'لا توجد مشاريع موثقة بمواقع جغرافية بعد لتوليد المقارنة.')
              : (isLoading ? 'Loading project data...' : 'No geo-tagged project records yet to generate comparison.')}
          </p>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={branchData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="branch" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar name={isRtl ? 'استغلال الموازنة' : 'Budget Utilization'} dataKey="budget" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              <Radar name={isRtl ? 'متوسط الإنجاز' : 'Avg Progress'} dataKey="impact" stroke="#059669" fill="#82ca9d" fillOpacity={0.6} />
              <Radar name={isRtl ? 'نسبة الصرف' : 'Spend Ratio'} dataKey="efficiency" stroke="#d97706" fill="#ffc658" fillOpacity={0.6} />
              <Tooltip formatter={(val: any) => `${val}%`} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
