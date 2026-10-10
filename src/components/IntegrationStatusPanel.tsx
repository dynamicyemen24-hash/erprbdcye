/**
 * NexoraOS™ — NEB-12/BASIS: live integration status (sync, webhooks, devices, IATI)
 * Small live panel embedded in the integration workspace canvas.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Wifi, Webhook, Smartphone, Globe } from 'lucide-react';
import { Spinner } from '../design-system/components/Spinner';

function headers(): Record<string, string> {
  const t = (() => { try { return localStorage.getItem('rbd_token'); } catch { return null; } })();
  let tenant = 'demo';
  try { tenant = localStorage.getItem('uamex_tenant_id') || 'demo'; } catch { /* ignore */ }
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}), 'X-Tenant-Id': tenant };
}
async function count(path: string): Promise<number | null> {
  try {
    const r = await fetch(path, { headers: headers() });
    const j = await r.json().catch(() => null);
    if (!r.ok) return null;
    const d = j && typeof j === 'object' && 'data' in j ? (j as any).data : j;
    if (Array.isArray(d)) return d.length;
    if (d && typeof d === 'object' && Array.isArray((d as any).data)) return (d as any).data.length;
    if (typeof d?.count === 'number') return d.count;
    if (typeof d?.pending === 'number') return d.pending;
    return null;
  } catch { return null; }
}

export default function IntegrationStatusPanel({ lang }: { lang: 'ar' | 'en' }) {
  const isRtl = lang === 'ar';
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ queue: number | null; webhooks: number | null; devices: number | null; iati: number | null }>({
    queue: null, webhooks: null, devices: null, iati: null,
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    const [queue, webhooks, devices, iati] = await Promise.all([
      count('/api/tables/sync_queue?limit=1'),
      count('/api/tables/webhook_subscriptions?limit=100'),
      count('/api/tables/field_devices?limit=100'),
      count('/api/tables/iati_activities?limit=100'),
    ]);
    setStats({ queue, webhooks, devices, iati });
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const cell = (icon: any, label: string, v: number | null) => {
    const Icon = icon;
    return (
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-center">
        <Icon className="w-4 h-4 mx-auto mb-1.5 text-sky-600" />
        <div className="text-[10px] font-bold text-slate-500">{label}</div>
        <div className="text-lg font-black font-mono">{loading ? '…' : v === null ? '—' : v}</div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black text-slate-500">{isRtl ? 'الحالة الحية للربط' : 'Live connectivity status'}</span>
        <button onClick={refresh} disabled={loading} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer disabled:opacity-50">
          {loading ? <Spinner size="sm" /> : <RefreshCw className="w-3.5 h-3.5 text-slate-500" />}
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {cell(Wifi, isRtl ? 'طابور المزامنة' : 'Sync queue', stats.queue)}
        {cell(Webhook, 'Webhooks', stats.webhooks)}
        {cell(Smartphone, isRtl ? 'الأجهزة الميدانية' : 'Field devices', stats.devices)}
        {cell(Globe, 'IATI', stats.iati)}
      </div>
    </div>
  );
}
