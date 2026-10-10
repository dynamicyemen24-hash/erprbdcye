/**
 * NexoraOS™ — NEB-09/AA: Fixed Assets Lifecycle OS
 * Register → Depreciation → Physical audit → Maintenance (IPSAS 17)
 * APIs: GET /api/v2/domains/assets[/dashboard|/depreciation], POST /assets,
 *       POST /assets/:id/lifecycle, POST /api/operations/asset-depreciation-run
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Building2, Plus, RefreshCw, Printer, Play, Wrench, ClipboardCheck, BarChart3 } from 'lucide-react';
import { printHTML } from '../lib/printUtils';
import { cn } from '../design-system/utils/cn';
import { EmptyState } from '../design-system/components/EmptyState';
import { ErrorState } from '../design-system/components/ErrorState';
import { Spinner } from '../design-system/components/Spinner';
import { EnterpriseButton } from './common/EnterpriseButton';
import { useTrainingWriteGuard } from '../core/context/EnvironmentModeContext';

interface Props { lang: 'ar' | 'en'; onNavigate?: (tab: string) => void; }
type SubTab = 'dashboard' | 'register' | 'depreciation' | 'lifecycle';

function headers(): Record<string, string> {
  const t = (() => { try { return localStorage.getItem('rbd_token'); } catch { return null; } })();
  let tenant = 'demo';
  try { tenant = localStorage.getItem('uamex_tenant_id') || 'demo'; } catch { /* ignore */ }
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}), 'X-Tenant-Id': tenant };
}
async function get<T = any>(path: string): Promise<T> {
  const r = await fetch(path, { headers: headers() });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(j?.error?.message || j?.error || `HTTP ${r.status}`);
  return (j && typeof j === 'object' && 'data' in j ? (j as any).data : j) as T;
}
async function post<T = any>(path: string, body?: any): Promise<T> {
  const r = await fetch(path, { method: 'POST', headers: headers(), body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => null);
  if (!r.ok || j?.success === false) throw new Error(j?.error?.message || j?.error || `HTTP ${r.status}`);
  return (j && typeof j === 'object' && 'data' in j ? (j as any).data : j ?? {}) as T;
}
const norm = (v: any): any[] => (Array.isArray(v) ? v : v?.data && Array.isArray(v.data) ? v.data : v?.items && Array.isArray(v.items) ? v.items : []);
const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const fmt = (v: any) => nf.format(Number(v || 0));
const INPUT = 'w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40';
const LABEL = 'block text-[11px] font-black text-slate-500 dark:text-zinc-400 mb-1';
const BTN = 'px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer disabled:opacity-50';
const TH = 'px-3 py-2.5 text-[11px] font-black text-slate-500 text-right whitespace-nowrap';
const TD = 'px-3 py-2.5 text-xs whitespace-nowrap';

export default function AssetsWorkspaceView({ lang, onNavigate }: Props) {
  const isRtl = lang === 'ar';
  const training = useTrainingWriteGuard(lang);
  const [tab, setTab] = useState<SubTab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [depr, setDepr] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [form, setForm] = useState({ asset_code: '', name_ar: '', name_en: '', category: 'EQUIPMENT', purchase_cost: '', purchase_date: new Date().toISOString().slice(0, 10), useful_life_months: '60', location_name: '' });
  const [running, setRunning] = useState(false);
  const [lifecycleAssetId, setLifecycleAssetId] = useState('');
  const [lifecycleForm, setLifecycleForm] = useState({ event_type: 'AUDIT', notes: '' });

  const fetchAll = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const [a, d, dp] = await Promise.all([
        get<any[]>('/api/v2/domains/assets?limit=200').catch(() => []),
        get<any>('/api/v2/domains/assets/dashboard').catch(() => null),
        get<any[]>('/api/v2/domains/assets/depreciation').catch(() => []),
      ]);
      setAssets(norm(a)); setDashboard(d); setDepr(norm(dp));
    } catch (e: any) { setErr(e?.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = useMemo(() => {
    if (!search) return assets;
    const q = search.toLowerCase();
    return assets.filter((a) => `${a.name_ar || ''} ${a.name_en || ''} ${a.asset_code || ''}`.toLowerCase().includes(q));
  }, [assets, search]);

  const totals = useMemo(() => {
    const cost = assets.reduce((s, a) => s + Number(a.purchase_cost || 0), 0);
    const cur = assets.reduce((s, a) => s + Number(a.current_value ?? a.purchase_cost ?? 0), 0);
    return { cost, cur, depr: cost - cur, count: assets.length };
  }, [assets]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!training.guard()) { setErr(training.blockMessage); return; }
    if (!form.name_ar.trim() || !form.asset_code.trim()) { setFormErr(isRtl ? 'الكود والاسم مطلوبان' : 'Code and name are required'); return; }
    setSaving(true); setFormErr(null);
    try {
      await post('/api/v2/domains/assets', {
        assetCode: form.asset_code, nameAr: form.name_ar, nameEn: form.name_en || undefined,
        category: form.category, purchaseCost: Number(form.purchase_cost || 0),
        purchaseDate: form.purchase_date, usefulLifeMonths: Number(form.useful_life_months || 60),
        locationName: form.location_name || undefined,
      });
      setShowModal(false);
      setForm({ asset_code: '', name_ar: '', name_en: '', category: 'EQUIPMENT', purchase_cost: '', purchase_date: new Date().toISOString().slice(0, 10), useful_life_months: '60', location_name: '' });
      await fetchAll();
    } catch (e: any) { setFormErr(e?.message); } finally { setSaving(false); }
  };

  const handleRun = async () => {
    if (!training.guard()) { setErr(training.blockMessage); return; }
    setRunning(true);
    try { await post('/api/operations/asset-depreciation-run', {}); await fetchAll(); }
    catch (e: any) { setErr(e?.message); } finally { setRunning(false); }
  };

  const handleLifecycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!training.guard()) { setErr(training.blockMessage); return; }
    if (!lifecycleAssetId) return;
    setSaving(true);
    try {
      await post(`/api/v2/domains/assets/${lifecycleAssetId}/lifecycle`, { eventType: lifecycleForm.event_type, notes: lifecycleForm.notes || undefined });
      setLifecycleForm({ event_type: 'AUDIT', notes: '' });
      await fetchAll();
    } catch (e: any) { setErr(e?.message); } finally { setSaving(false); }
  };

  const handlePrint = () => {
    const rows = filtered.map((a: any, i: number) => `<tr style="background:${i % 2 ? '#f8fafc' : '#fff'};text-align:center"><td style="padding:6px;border:1px solid #cbd5e1;font-family:monospace">${a.asset_code || ''}</td><td style="padding:6px;border:1px solid #cbd5e1;text-align:right">${a.name_ar || ''}</td><td style="padding:6px;border:1px solid #cbd5e1;font-family:monospace">${fmt(a.purchase_cost)}</td><td style="padding:6px;border:1px solid #cbd5e1;font-family:monospace">${fmt(a.current_value ?? a.purchase_cost)}</td><td style="padding:6px;border:1px solid #cbd5e1">${a.status_code || a.status || ''}</td></tr>`).join('');
    printHTML(`<html dir="${isRtl ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"/><title>${isRtl ? 'سجل الأصول' : 'Asset Register'}</title><style>@page{size:A4 landscape;margin:12mm}body{font-family:Tahoma}table{width:100%;border-collapse:collapse;font-size:10px}th{background:#0f172a;color:#fff;padding:7px}</style></head><body><h2>${isRtl ? 'سجل الأصول الثابتة (NEB-09 / AA — IPSAS 17)' : 'Fixed Asset Register (NEB-09 / AA — IPSAS 17)'}</h2><table><tr><th>Code</th><th>Name</th><th>Cost</th><th>Net</th><th>Status</th></tr>${rows}</table></body></html>`);
  };

  const TABS: { id: SubTab; ar: string; en: string }[] = [
    { id: 'dashboard', ar: 'اللوحة', en: 'Dashboard' },
    { id: 'register', ar: 'السجل', en: 'Register' },
    { id: 'depreciation', ar: 'الإهلاك', en: 'Depreciation' },
    { id: 'lifecycle', ar: 'الحركة والجرد', en: 'Lifecycle & Audit' },
  ];

  if (loading) return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>;
  if (err) return <div className="p-4"><ErrorState title="Load failed" message={err} onRetry={fetchAll} /></div>;

  return (
    <div className="space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-gradient-to-r from-stone-900 via-zinc-950 to-slate-900 border border-stone-500/30 rounded-2xl p-5 text-white flex flex-col md:flex-row justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-stone-500/20 text-stone-300 rounded-xl border border-stone-500/40"><Building2 className="w-7 h-7" /></div>
          <div>
            <span className="px-2 py-0.5 bg-stone-500/30 rounded text-[10px] font-black font-mono">NEB-09 • AA • IPSAS 17</span>
            <h2 className="text-lg font-black">{isRtl ? 'الأصول الثابتة ودورة حياتها' : 'Fixed Assets Lifecycle'}</h2>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <EnterpriseButton variant="primary" size="sm" onClick={handlePrint}><Printer className="w-3.5 h-3.5" /><span>{isRtl ? 'طباعة السجل' : 'Print register'}</span></EnterpriseButton>
          {onNavigate && <EnterpriseButton variant="secondary" size="sm" onClick={() => onNavigate('business_intelligence')}><BarChart3 className="w-3.5 h-3.5" /><span>{isRtl ? 'الصيانة التنبؤية' : 'Predictive maintenance'}</span></EnterpriseButton>}
        </div>
      </div>

      {training.isTrainingMode && (
        <div className="text-[11px] font-black text-amber-700 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
          {training.blockMessage}
        </div>
      )}

      <div className="flex gap-1.5 bg-white dark:bg-zinc-900 border rounded-2xl p-2 w-fit">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn('px-4 py-2 rounded-xl text-[11px] font-black cursor-pointer', tab === t.id ? 'bg-stone-800 text-white' : 'text-slate-500 hover:bg-slate-100')}>{isRtl ? t.ar : t.en}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[['الأصول', totals.count, ''], ['التكلفة', fmt(totals.cost), ''], ['الصافي', fmt(totals.cur), ''], ['المجمع', fmt(totals.depr), '']].map(([t, v, s], i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border p-4"><div className="text-[11px] font-black text-slate-500">{t}</div><div className="text-xl font-black font-mono">{v}</div>{s ? <div className="text-[10px] text-slate-400">{s}</div> : null}{dashboard ? <div className="text-[10px] text-slate-400 truncate">{typeof dashboard === 'object' ? JSON.stringify(dashboard).slice(0, 60) : ''}</div> : null}</div>
          ))}
        </div>
      )}

      {tab === 'register' && (
        <div className="bg-white dark:bg-zinc-900 border rounded-2xl p-4 space-y-3">
          <div className="flex gap-2 flex-wrap">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isRtl ? 'بحث...' : 'Search...'} className={cn(INPUT, 'flex-1 min-w-[200px]')} />
            <button onClick={() => setShowModal(true)} className={BTN}><Plus className="w-4 h-4" />{isRtl ? 'أصل جديد' : 'New asset'}</button>
          </div>
          {filtered.length === 0 ? <EmptyState title={isRtl ? 'لا توجد أصول' : 'No assets'} description={isRtl ? 'سجل أول أصل ثابت' : 'Register the first fixed asset'} /> : (
            <div className="overflow-x-auto rounded-xl border"><table className="w-full"><thead className="bg-slate-50"><tr><th className={TH}>Code</th><th className={TH}>{isRtl ? 'الاسم' : 'Name'}</th><th className={TH}>{isRtl ? 'التكلفة' : 'Cost'}</th><th className={TH}>{isRtl ? 'الصافي' : 'Net'}</th><th className={TH}>%</th></tr></thead>
              <tbody>{filtered.map((a: any) => (<tr key={a.id} className="border-t"><td className={cn(TD, 'font-mono font-bold')}>{a.asset_code || '—'}</td><td className={TD}>{a.name_ar || '—'}</td><td className={cn(TD, 'font-mono')}>{fmt(a.purchase_cost)}</td><td className={cn(TD, 'font-mono')}>{fmt(a.current_value ?? a.purchase_cost)}</td><td className={cn(TD, 'font-mono')}>{Number(a.depreciation_pct || 0).toFixed(1)}%</td></tr>))}</tbody></table></div>
          )}
        </div>
      )}

      {tab === 'depreciation' && (
        <div className="bg-white dark:bg-zinc-900 border rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-black">{isRtl ? `بنود الإهلاك (${depr.length})` : `Depreciation lines (${depr.length})`}</h3>
            <button onClick={handleRun} disabled={running} className={BTN}><Play className="w-4 h-4" />{running ? (isRtl ? 'جارٍ الترحيل...' : 'Posting...') : (isRtl ? 'ترحيل الإهلاك الآلي' : 'Run auto-depreciation')}</button>
          </div>
          {depr.length === 0 ? <EmptyState title={isRtl ? 'لا توجد بنود' : 'No lines'} description={isRtl ? 'رحّل الإهلاك لاحتساب القسط الشهري' : 'Run depreciation to compute the monthly charge'} /> : (
            <div className="overflow-x-auto rounded-xl border"><table className="w-full"><thead className="bg-slate-50"><tr><th className={TH}>Asset</th><th className={TH}>Amount</th><th className={TH}>%</th></tr></thead>
              <tbody>{depr.slice(0, 50).map((d: any, i: number) => (<tr key={i} className="border-t"><td className={TD}>{d.asset_code || d.name_ar || d.id || '—'}</td><td className={cn(TD, 'font-mono')}>{fmt(d.depreciation_amount ?? d.amount)}</td><td className={cn(TD, 'font-mono')}>{Number(d.depreciation_pct ?? 0).toFixed(1)}%</td></tr>))}</tbody></table></div>
          )}
        </div>
      )}

      {tab === 'lifecycle' && (
        <form onSubmit={handleLifecycle} className="bg-white dark:bg-zinc-900 border rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-black flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-emerald-600" />{isRtl ? 'حركة دورة الحياة / جرد مادي' : 'Lifecycle movement / physical audit'}</h3>
          <div><label className={LABEL}>{isRtl ? 'الأصل' : 'Asset'}</label>
            <select value={lifecycleAssetId} onChange={(e) => setLifecycleAssetId(e.target.value)} className={INPUT}><option value="">—</option>{assets.map((a) => <option key={a.id} value={a.id}>{a.asset_code} — {a.name_ar}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={LABEL}>{isRtl ? 'الحدث' : 'Event'}</label>
              <select value={lifecycleForm.event_type} onChange={(e) => setLifecycleForm({ ...lifecycleForm, event_type: e.target.value })} className={INPUT}>
                <option value="AUDIT">AUDIT</option><option value="MAINTENANCE">MAINTENANCE</option><option value="TRANSFER">TRANSFER</option><option value="DISPOSAL">DISPOSAL</option>
              </select></div>
            <div><label className={LABEL}>{isRtl ? 'ملاحظات' : 'Notes'}</label><input value={lifecycleForm.notes} onChange={(e) => setLifecycleForm({ ...lifecycleForm, notes: e.target.value })} className={INPUT} /></div>
          </div>
          <button type="submit" disabled={saving || !lifecycleAssetId} className={BTN}><Wrench className="w-4 h-4" />{isRtl ? 'توثيق الحركة' : 'Record movement'}</button>
        </form>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="bg-white dark:bg-zinc-900 rounded-2xl p-5 w-full max-w-md space-y-3 max-h-[90vh] overflow-y-auto">
            <h3 className="font-black text-sm">{isRtl ? 'أصل ثابت جديد' : 'New fixed asset'}</h3>
            {formErr && <div className="text-[11px] font-bold text-rose-600">{formErr}</div>}
            <div className="grid grid-cols-2 gap-2">
              <div><label className={LABEL}>Code *</label><input value={form.asset_code} onChange={(e) => setForm({ ...form, asset_code: e.target.value })} className={INPUT} placeholder="AST-2026-001" /></div>
              <div><label className={LABEL}>{isRtl ? 'الفئة' : 'Category'}</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={INPUT}><option value="EQUIPMENT">EQUIPMENT</option><option value="VEHICLE">VEHICLE</option><option value="BUILDING">BUILDING</option><option value="FURNITURE">FURNITURE</option><option value="IT">IT</option></select></div>
            </div>
            <div><label className={LABEL}>{isRtl ? 'الاسم *' : 'Name *'}</label><input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} className={INPUT} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={LABEL}>{isRtl ? 'التكلفة' : 'Cost'}</label><input type="number" min="0" value={form.purchase_cost} onChange={(e) => setForm({ ...form, purchase_cost: e.target.value })} className={INPUT} /></div>
              <div><label className={LABEL}>{isRtl ? 'العمر (شهر)' : 'Life (mo)'}</label><input type="number" min="1" value={form.useful_life_months} onChange={(e) => setForm({ ...form, useful_life_months: e.target.value })} className={INPUT} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={LABEL}>{isRtl ? 'تاريخ الشراء' : 'Purchase date'}</label><input type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} className={INPUT} /></div>
              <div><label className={LABEL}>{isRtl ? 'الموقع' : 'Location'}</label><input value={form.location_name} onChange={(e) => setForm({ ...form, location_name: e.target.value })} className={INPUT} /></div>
            </div>
            <div className="flex gap-2"><button type="submit" disabled={saving} className={BTN}>{saving ? <Spinner size="sm" /> : <Plus className="w-4 h-4" />}{isRtl ? 'حفظ' : 'Save'}</button>
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 bg-slate-100 rounded-xl text-xs font-bold cursor-pointer">{isRtl ? 'إلغاء' : 'Cancel'}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
