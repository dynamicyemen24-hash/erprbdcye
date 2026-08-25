import React, { useState, useEffect } from 'react';
import { Wrench, Calendar, AlertTriangle, Loader2 } from 'lucide-react';

interface MaintenanceForecast {
  id: string;
  assetCode: string;
  name: string;
  purchasedAt: string | null;
  lastServiced: string | null;
  nextSuggestedService: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export default function PredictiveMaintenanceView({ lang }: { lang: 'ar' | 'en' }) {
  const [forecasts, setForecasts] = useState<MaintenanceForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('rbd_token');
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch('/api/tables/assets', { headers });
        if (!res.ok) throw new Error(`assets: ${res.status}`);
        const data = await res.json();
        const rows = Array.isArray(data?.data) ? data.data : [];
        if (cancelled) return;

        // Rule-based service schedule derived from REAL asset records:
        // annual service cycle anchored on the last recorded audit (or purchase date).
        const now = new Date();
        const items: MaintenanceForecast[] = rows
          .filter((a: any) => a.status !== 'DISPOSED')
          .map((a: any) => {
            const anchorRaw = a.last_audit_at || a.purchase_date;
            const anchor = anchorRaw ? new Date(anchorRaw) : null;
            const base = anchor && !isNaN(anchor.getTime()) ? anchor : null;
            let next: Date;
            if (base) {
              next = new Date(base);
              next.setFullYear(next.getFullYear() + 1);
              // If the anniversary already passed, roll forward one cycle
              if (next < now) next.setFullYear(next.getFullYear() + 1);
            } else {
              next = new Date(now);
              next.setMonth(next.getMonth() + 1); // unknown history → schedule soon
            }

            const ageYears = a.purchase_date
              ? (now.getTime() - new Date(a.purchase_date).getTime()) / (365.25 * 24 * 3600 * 1000)
              : 0;
            const overdueDays = Math.floor((now.getTime() - next.getTime()) / (24 * 3600 * 1000));
            const riskLevel: 'low' | 'medium' | 'high'
              = overdueDays > 0 || ageYears > 7 ? 'high'
              : overdueDays > -30 || ageYears > 4 ? 'medium'
              : 'low';

            return {
              id: a.id,
              assetCode: a.asset_code || '-',
              name: a.name_ar || a.name_en || '',
              purchasedAt: a.purchase_date || null,
              lastServiced: a.last_audit_at ? String(a.last_audit_at).slice(0, 10) : null,
              nextSuggestedService: next.toISOString().slice(0, 10),
              riskLevel
            };
          })
          .sort((x: MaintenanceForecast, y: MaintenanceForecast) =>
            x.nextSuggestedService.localeCompare(y.nextSuggestedService))
          .slice(0, 20);

        setForecasts(items);
      } catch (err) {
        console.error('[PredictiveMaintenance] Failed to load:', err);
        if (!cancelled) setError(lang === 'ar' ? 'تعذر تحميل بيانات الأصول.' : 'Failed to load asset data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [lang]);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-1">
        <Wrench className="w-5 h-5 text-indigo-500" />
        {lang === 'ar' ? 'جدول الصيانة الوقائية' : 'Preventive Maintenance Schedule'}
      </h3>
      <p className="text-[10px] text-zinc-500 font-semibold mb-6">
        {lang === 'ar'
          ? 'مبني على قاعدة دورة صيانة سنوية من سجل الأصول الفعلي وتواريخ آخر تدقيق.'
          : 'Rule-based annual service cycle computed from the live asset register and last audit dates.'}
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-xs font-bold">{lang === 'ar' ? 'جارٍ التحميل...' : 'Loading...'}</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="text-xs font-bold">{error}</span>
        </div>
      ) : forecasts.length === 0 ? (
        <p className="text-xs text-zinc-500 text-center py-8">
          {lang === 'ar' ? 'لا توجد أصول مسجلة بعد.' : 'No asset records yet.'}
        </p>
      ) : (
        <div className="space-y-4">
          {forecasts.map((f) => (
            <div key={f.id} className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold">{f.assetCode} — {f.name}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${f.riskLevel === 'high' ? 'bg-rose-100 text-rose-800' : f.riskLevel === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {f.riskLevel.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-500">
                <p>{lang === 'ar' ? 'آخر توثيق/صيانة:' : 'Last Service/Audit:'} {f.lastServiced || (lang === 'ar' ? 'غير مسجل' : 'Not recorded')}</p>
                <p className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {lang === 'ar' ? 'الصيانة المقترحة:' : 'Suggested Service:'}
                  <span className="font-bold text-indigo-600">{f.nextSuggestedService}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
