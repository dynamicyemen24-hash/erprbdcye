import React, { useEffect, useMemo, useState } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Globe, Database } from 'lucide-react';

interface GlobalKPITrendViewProps {
  lang: 'ar' | 'en';
  projects?: any[];
}

/**
 * Real regional KPI intelligence — aggregates ACTUAL project records by governorate.
 * KPI = verified average field progress. Spending = total approved budget.
 * No fabricated regions or synthetic scores.
 */
export default function GlobalKPITrendView({ lang, projects }: GlobalKPITrendViewProps) {
  const [fetchedProjects, setFetchedProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const regionalData = useMemo(() => {
    const byRegion = new Map<string, { progressSum: number; progressCount: number; spending: number }>();
    source.forEach(p => {
      const region = p.governorate || p.region || (lang === 'ar' ? 'غير محدد' : 'Unassigned');
      const entry = byRegion.get(region) || { progressSum: 0, progressCount: 0, spending: 0 };
      const progress = parseFloat(p.progress_percent || '0');
      if (!isNaN(progress) && progress > 0) {
        entry.progressSum += progress;
        entry.progressCount += 1;
      }
      entry.spending += parseFloat(p.budget || '0') || 0;
      byRegion.set(region, entry);
    });
    return Array.from(byRegion.entries())
      .map(([region, e]) => ({
        region,
        kpi: e.progressCount > 0 ? Math.round(e.progressSum / e.progressCount) : 0,
        spending: Math.round(e.spending)
      }))
      .sort((a, b) => b.spending - a.spending)
      .slice(0, 8);
  }, [source, lang]);

  const isRtl = lang === 'ar';

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <Globe className="w-5 h-5 text-purple-500" />
          {isRtl ? 'مؤشرات الأداء الميدانية حسب المحافظة' : 'Field KPI by Governorate'}
        </h3>
        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
          <Database className="w-3 h-3" />
          {isRtl ? 'بيانات مباشرة من قاعدة المشاريع' : 'Live project database'}
        </span>
      </div>

      {regionalData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2 text-center">
          <Database className="w-8 h-8 text-slate-300 dark:text-zinc-600" />
          <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">
            {isRtl
              ? (isLoading ? 'جاري جلب بيانات المشاريع...' : 'لا توجد مشاريع مسجلة بعد لعرض مؤشرات الأداء.')
              : (isLoading ? 'Loading project data...' : 'No registered projects yet to compute KPIs.')}
          </p>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={regionalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="region" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip formatter={(val: any, name: string) => name.includes('Spending') || name.includes('الإنفاق') ? `${Number(val).toLocaleString()} YER` : `${val}%`} />
              <Legend />
              <Bar yAxisId="right" dataKey="spending" fill="#8884d8" name={isRtl ? 'الموازنة المعتمدة' : 'Approved Budget'} radius={[4, 4, 0, 0]} />
              <Line yAxisId="left" type="monotone" dataKey="kpi" stroke="#059669" strokeWidth={2} name={isRtl ? 'متوسط الإنجاز %' : 'Avg Progress %'} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
