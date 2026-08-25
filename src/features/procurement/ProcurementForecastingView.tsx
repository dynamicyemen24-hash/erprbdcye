import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, Loader2, Zap } from 'lucide-react';

interface ReorderAlert {
  id: string;
  item: string;
  warehouse: string;
  quantity: number;
  reorderLevel: number;
  unit: string;
}

export default function ProcurementForecastingView({ lang }: { lang: 'ar' | 'en' }) {
  const [alerts, setAlerts] = useState<ReorderAlert[]>([]);
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
        const getRows = async (table: string) => {
          const res = await fetch(`/api/tables/${table}`, { headers });
          if (!res.ok) throw new Error(`${table}: ${res.status}`);
          const data = await res.json();
          const rows = data?.data ?? data;
          return Array.isArray(rows) ? rows : [];
        };

        const [inventory, warehouses] = await Promise.all([getRows('inventory'), getRows('warehouses')]);
        if (cancelled) return;

        const whNames = new Map<string, string>();
        warehouses.forEach((w: any) => whNames.set(w.id, w.name_ar || w.name_en || '-'));

        // Real reorder detection from the live inventory register
        const items: ReorderAlert[] = inventory
          .map((it: any) => ({
            id: it.id,
            item: it.item_name_ar || it.item_name_en || it.item_code || '-',
            warehouse: whNames.get(it.warehouse_id) || '-',
            quantity: parseFloat(it.quantity || 0),
            reorderLevel: parseFloat(it.reorder_level || 0),
            unit: it.unit || ''
          }))
          .filter((it: ReorderAlert) => it.reorderLevel > 0 && it.quantity <= it.reorderLevel * 1.25)
          .sort((a: ReorderAlert, b: ReorderAlert) =>
            (a.quantity / a.reorderLevel) - (b.quantity / b.reorderLevel))
          .slice(0, 20);

        setAlerts(items);
      } catch (err) {
        console.error('[ProcurementForecasting] Failed to load:', err);
        if (!cancelled) setError(lang === 'ar' ? 'تعذر تحميل بيانات المخزون.' : 'Failed to load inventory data.');
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
        <Zap className="w-5 h-5 text-indigo-500" />
        {lang === 'ar' ? 'تنبيهات إعادة الطلب' : 'Reorder Alerts'}
      </h3>
      <p className="text-[10px] text-zinc-500 font-semibold mb-6">
        {lang === 'ar'
          ? 'محسوبة من سجل المخزون الفعلي مقابل حدود إعادة الطلب المسجلة.'
          : 'Computed from the live inventory register against recorded reorder levels.'}
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
      ) : alerts.length === 0 ? (
        <p className="text-xs text-zinc-500 text-center py-8">
          {lang === 'ar' ? 'جميع الأصناف فوق حدود إعادة الطلب.' : 'All items are above their reorder levels.'}
        </p>
      ) : (
        <div className="space-y-4">
          {alerts.map((f) => {
            const critical = f.quantity <= f.reorderLevel;
            return (
              <div key={f.id} className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-500" />
                    <p className="text-xs font-bold">{f.item}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${critical ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                    {critical
                      ? (lang === 'ar' ? 'أعد الطلب الآن' : 'REORDER NOW')
                      : (lang === 'ar' ? 'راجع قريباً' : 'REVIEW SOON')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-500">
                  <p>{lang === 'ar' ? 'الكمية الحالية:' : 'Current Qty:'}
                    <span className={`font-bold ${critical ? 'text-red-500' : 'text-amber-600'}`}>
                      {' '}{f.quantity.toLocaleString()} {f.unit}
                    </span>
                  </p>
                  <p>{lang === 'ar' ? 'حد إعادة الطلب:' : 'Reorder Level:'} {f.reorderLevel.toLocaleString()} {f.unit}</p>
                  <p className="col-span-2">{lang === 'ar' ? 'المخزن:' : 'Warehouse:'} {f.warehouse}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
