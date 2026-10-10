/**
 * NexoraOS™ — NEB-06/CRM: Service Delivery Recording OS
 * Deliveries (sessions) → per-beneficiary aid distributions → Sphere compliance.
 * Backend existed (serviceDelivery.routes + engines) but every POST threw at SQL
 * level (missing columns — since aligned) and no UI ever recorded a delivery.
 * APIs: GET/POST /api/v2/services/service-deliveries[/sphere-compliance],
 *       GET/POST /api/v2/services/aid-distributions[/dashboard],
 *       GET /api/v2/services/beneficiaries (select source).
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Truck, Plus, RefreshCw, Users, HandHeart, BarChart3, ShieldCheck, Printer } from 'lucide-react';
import { printHTML } from '../lib/printUtils';
import { cn } from '../design-system/utils/cn';
import { EmptyState } from '../design-system/components/EmptyState';
import { ErrorState } from '../design-system/components/ErrorState';
import { Spinner } from '../design-system/components/Spinner';
import { EnterpriseButton } from './common/EnterpriseButton';
import { useTrainingWriteGuard } from '../core/context/EnvironmentModeContext';

interface Props { lang: 'ar' | 'en'; onNavigate?: (tab: string) => void; }
type SubTab = 'dashboard' | 'deliveries' | 'distributions' | 'sphere';

const SERVICE_TYPES = ['FOOD', 'WATER', 'HEALTH', 'SHELTER', 'EDUCATION', 'CASH', 'NFI', 'PSYCHOSOCIAL'];
const AID_TYPES = ['CASH', 'IN_KIND', 'SERVICE', 'VOUCHER'];

function headers(): Record<string, string> {
  const t = (() => { try { return localStorage.getItem('rbd_token') || sessionStorage.getItem('rbd_token'); } catch { return null; } })();
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
async function post<T = any>(path: string, body: any): Promise<T> {
  const r = await fetch(path, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
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

export default function ServiceDeliveryWorkspaceView({ lang, onNavigate }: Props) {
  const isRtl = lang === 'ar';
  const training = useTrainingWriteGuard(lang);
  const [tab, setTab] = useState<SubTab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [distributions, setDistributions] = useState<any[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [distDashboard, setDistDashboard] = useState<any>(null);
  const [sphere, setSphere] = useState<any>(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showDistModal, setShowDistModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [delForm, setDelForm] = useState({ service_type: 'FOOD', delivery_date: new Date().toISOString().slice(0, 10), location: '', officer_name: '', beneficiary_count: '1', beneficiary_id: '', notes: '' });
  const [distForm, setDistForm] = useState({ beneficiary_id: '', aid_type: 'IN_KIND', amount: '', distribution_date: new Date().toISOString().slice(0, 10), description: '' });

  const fetchAll = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const [del, dis, ben, dash, sph] = await Promise.all([
        get<any[]>('/api/v2/services/service-deliveries?limit=100').catch(() => []),
        get<any[]>('/api/v2/services/aid-distributions?limit=200').catch(() => []),
        get<any[]>('/api/v2/services/beneficiaries?limit=500').catch(() => []),
        get<any>('/api/v2/services/aid-distributions/dashboard').catch(() => null),
        get<any>('/api/v2/services/service-deliveries/sphere-compliance').catch(() => null),
      ]);
      setDeliveries(norm(del)); setDistributions(norm(dis)); setBeneficiaries(norm(ben));
      setDistDashboard(dash); setSphere(sph);
    } catch (e: any) { setErr(e?.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const stats = useMemo(() => {
    const s = distDashboard?.statistics || {};
    return {
      total: Number(s.total_distributions || distributions.length),
      value: Number(s.total_value || 0),
      reached: (sphere?.metrics?.total_reached ?? deliveries.reduce((x, d: any) => x + Number(d.beneficiaries_reached || 0), 0)),
    };
  }, [distDashboard, distributions, sphere, deliveries]);

  const guardTraining = (setE: (m: string | null) => void): boolean => {
    if (training.guard()) return true;
    setE(training.blockMessage);
    return false;
  };

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardTraining(setFormErr)) return;
    if (!delForm.service_type || !delForm.delivery_date) { setFormErr(isRtl ? 'النوع والتاريخ مطلوبان' : 'Type and date are required'); return; }
    setSaving(true); setFormErr(null);
    try {
      await post('/api/v2/services/service-deliveries', {
        serviceType: delForm.service_type,
        deliveryDate: delForm.delivery_date,
        location: delForm.location || undefined,
        officerName: delForm.officer_name || undefined,
        beneficiaryCount: Number(delForm.beneficiary_count || 1),
        beneficiaryId: delForm.beneficiary_id || undefined,
        notes: delForm.notes || undefined,
      });
      setShowDeliveryModal(false);
      setDelForm({ service_type: 'FOOD', delivery_date: new Date().toISOString().slice(0, 10), location: '', officer_name: '', beneficiary_count: '1', beneficiary_id: '', notes: '' });
      await fetchAll();
    } catch (e: any) { setFormErr(e?.message); } finally { setSaving(false); }
  };

  const handleCreateDistribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardTraining(setFormErr)) return;
    if (!distForm.beneficiary_id) { setFormErr(isRtl ? 'اختر المستفيد' : 'Select a beneficiary'); return; }
    if (!distForm.distribution_date) { setFormErr(isRtl ? 'التاريخ مطلوب' : 'Date is required'); return; }
    setSaving(true); setFormErr(null);
    try {
      await post('/api/v2/services/aid-distributions', {
        beneficiaryId: distForm.beneficiary_id,
        aidType: distForm.aid_type,
        amount: Number(distForm.amount || 0),
        distributionDate: distForm.distribution_date,
        description: distForm.description || undefined,
        receiptConfirmed: false,
      });
      setShowDistModal(false);
      setDistForm({ beneficiary_id: '', aid_type: 'IN_KIND', amount: '', distribution_date: new Date().toISOString().slice(0, 10), description: '' });
      await fetchAll();
    } catch (e: any) { setFormErr(e?.message); } finally { setSaving(false); }
  };

  const handlePrint = () => {
    const rows = deliveries.map((d: any, i: number) => `<tr style="background:${i % 2 ? '#f8fafc' : '#fff'};text-align:center"><td style="padding:6px;border:1px solid #cbd5e1">${d.service_number || d.serviceNumber || '—'}</td><td style="padding:6px;border:1px solid #cbd5e1">${d.service_type || ''}</td><td style="padding:6px;border:1px solid #cbd5e1">${d.delivery_date || ''}</td><td style="padding:6px;border:1px solid #cbd5e1;font-family:monospace">${fmt(d.beneficiaries_reached)}</td><td style="padding:6px;border:1px solid #cbd5e1">${d.status || ''}</td></tr>`).join('');
    printHTML(`<html dir="${isRtl ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"/><title>${isRtl ? 'سجل تسليم الخدمات' : 'Service Delivery Register'}</title><style>@page{size:A4 landscape;margin:12mm}body{font-family:Tahoma}table{width:100%;border-collapse:collapse;font-size:10px}th{background:#0f172a;color:#fff;padding:7px}</style></head><body><h2>${isRtl ? 'سجل تسليم الخدمات (NEB-06)' : 'Service Delivery Register (NEB-06)'}</h2><table><tr><th>No</th><th>Type</th><th>Date</th><th>Reached</th><th>Status</th></tr>${rows}</table></body></html>`);
  };

  const TABS: { id: SubTab; ar: string; en: string }[] = [
    { id: 'dashboard', ar: 'اللوحة', en: 'Dashboard' },
    { id: 'deliveries', ar: 'جلسات التسليم', en: 'Delivery Sessions' },
    { id: 'distributions', ar: 'توزيعات المستفيدين', en: 'Distributions' },
    { id: 'sphere', ar: 'امتثال Sphere', en: 'Sphere Compliance' },
  ];

  if (loading) return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>;
  if (err) return <div className="p-4"><ErrorState title="Load failed" message={err} onRetry={fetchAll} /></div>;

  return (
    <div className="space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-gradient-to-r from-teal-950 via-zinc-950 to-slate-900 border border-teal-500/30 rounded-2xl p-5 text-white flex flex-col md:flex-row justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-500/20 text-teal-300 rounded-xl border border-teal-500/40"><Truck className="w-7 h-7" /></div>
          <div>
            <span className="px-2 py-0.5 bg-teal-500/30 rounded text-[10px] font-black font-mono">NEB-06 • CRM</span>
            <h2 className="text-lg font-black">{isRtl ? 'تسليم الخدمات والتوزيع الميداني' : 'Service Delivery & Field Distribution'}</h2>
            <p className="text-[11px] text-zinc-400">{isRtl ? 'جلسة تسليم ← توزيع لكل مستفيد بسند ← امتثال Sphere' : 'Delivery session → per-beneficiary vouchered distribution → Sphere compliance'}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <EnterpriseButton variant="primary" size="sm" onClick={handlePrint}><Printer className="w-3.5 h-3.5" /><span>{isRtl ? 'طباعة السجل' : 'Print register'}</span></EnterpriseButton>
          {onNavigate && <EnterpriseButton variant="secondary" size="sm" onClick={() => onNavigate('beneficiaries')}><Users className="w-3.5 h-3.5" /><span>{isRtl ? 'سجل المستفيدين' : 'Beneficiaries'}</span></EnterpriseButton>}
        </div>
      </div>

      {training.isTrainingMode && (
        <div className="text-[11px] font-black text-amber-700 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">{training.blockMessage}</div>
      )}

      <div className="flex gap-1.5 bg-white dark:bg-zinc-900 border rounded-2xl p-2 w-fit overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn('px-4 py-2 rounded-xl text-[11px] font-black cursor-pointer whitespace-nowrap', tab === t.id ? 'bg-teal-600 text-white' : 'text-slate-500 hover:bg-slate-100')}>{isRtl ? t.ar : t.en}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[[isRtl ? 'الجلسات' : 'Sessions', deliveries.length], [isRtl ? 'التوزيعات' : 'Distributions', stats.total], [isRtl ? 'القيمة' : 'Value', fmt(stats.value)], [isRtl ? 'مستفيدون وُصلوا' : 'Reached', fmt(stats.reached)]].map(([t, v], i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border p-4"><div className="text-[11px] font-black text-slate-500">{t}</div><div className="text-xl font-black font-mono">{v}</div></div>
          ))}
        </div>
      )}

      {tab === 'deliveries' && (
        <div className="bg-white dark:bg-zinc-900 border rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black">{isRtl ? `جلسات التسليم (${deliveries.length})` : `Delivery sessions (${deliveries.length})`}</h3>
            <button onClick={() => { setFormErr(null); setShowDeliveryModal(true); }} className={BTN}><Plus className="w-4 h-4" />{isRtl ? 'جلسة جديدة' : 'New session'}</button>
          </div>
          {deliveries.length === 0 ? <EmptyState title={isRtl ? 'لا توجد جلسات' : 'No sessions'} description={isRtl ? 'سجل أول جلسة تسليم ميدانية' : 'Record the first field delivery session'} /> : (
            <div className="overflow-x-auto rounded-xl border"><table className="w-full"><thead className="bg-slate-50"><tr><th className={TH}>No</th><th className={TH}>{isRtl ? 'النوع' : 'Type'}</th><th className={TH}>{isRtl ? 'التاريخ' : 'Date'}</th><th className={TH}>{isRtl ? 'الموقع' : 'Location'}</th><th className={TH}>{isRtl ? 'وُصلوا' : 'Reached'}</th></tr></thead>
              <tbody>{deliveries.map((d: any) => (<tr key={d.id} className="border-t"><td className={cn(TD, 'font-mono')}>{d.service_number || '—'}</td><td className={TD}>{d.service_type || ''}</td><td className={TD}>{d.delivery_date || ''}</td><td className={TD}>{d.location || d.delivery_location || ''}</td><td className={cn(TD, 'font-mono')}>{fmt(d.beneficiaries_reached)}</td></tr>))}</tbody></table></div>
          )}
        </div>
      )}

      {tab === 'distributions' && (
        <div className="bg-white dark:bg-zinc-900 border rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black">{isRtl ? `توزيعات المستفيدين (${distributions.length})` : `Distributions (${distributions.length})`}</h3>
            <button onClick={() => { setFormErr(null); setShowDistModal(true); }} className={BTN} disabled={beneficiaries.length === 0}><Plus className="w-4 h-4" />{isRtl ? 'توزيع جديد' : 'New distribution'}</button>
          </div>
          {distributions.length === 0 ? <EmptyState title={isRtl ? 'لا توجد توزيعات' : 'No distributions'} description={isRtl ? 'وزع أول مساعدة بسند على مستفيد' : 'Record the first vouchered distribution to a beneficiary'} /> : (
            <div className="overflow-x-auto rounded-xl border"><table className="w-full"><thead className="bg-slate-50"><tr><th className={TH}>No</th><th className={TH}>{isRtl ? 'المستفيد' : 'Beneficiary'}</th><th className={TH}>{isRtl ? 'النوع' : 'Type'}</th><th className={TH}>{isRtl ? 'القيمة' : 'Value'}</th><th className={TH}>{isRtl ? 'التاريخ' : 'Date'}</th></tr></thead>
              <tbody>{distributions.map((d: any) => (<tr key={d.id} className="border-t"><td className={cn(TD, 'font-mono')}>{d.distribution_number || '—'}</td><td className={TD}>{d.beneficiary_name_ar || '—'}</td><td className={TD}>{d.aid_type || ''}</td><td className={cn(TD, 'font-mono')}>{fmt(d.amount ?? d.total_value_yer)}</td><td className={TD}>{d.distribution_date || ''}</td></tr>))}</tbody></table></div>
          )}
        </div>
      )}

      {tab === 'sphere' && (
        <div className="bg-white dark:bg-zinc-900 border rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-black flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-600" />{isRtl ? 'امتثال Sphere' : 'Sphere compliance'}</h3>
          {!sphere ? <EmptyState title={isRtl ? 'لا توجد بيانات' : 'No data'} description={isRtl ? 'سجل جلسات تسليم لاحتساب مؤشرات Sphere' : 'Record delivery sessions to compute Sphere indicators'} /> : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[[isRtl ? 'الجلسات' : 'Sessions', sphere?.metrics?.total_services ?? 0], [isRtl ? 'مستفيدون فريدون' : 'Unique', sphere?.metrics?.unique_beneficiaries ?? 0], [isRtl ? 'إجمالي الوصول' : 'Reached', sphere?.metrics?.total_reached ?? 0], [isRtl ? 'تنوع الخدمات' : 'Diversity', sphere?.metrics?.service_diversity ?? 0]].map(([t, v], i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border text-center"><div className="text-[10px] font-bold text-slate-500">{t}</div><div className="text-xl font-black font-mono">{v}</div></div>
              ))}
            </div>
          )}
          {(sphere?.byServiceType || []).length > 0 && (
            <div className="overflow-x-auto rounded-xl border"><table className="w-full"><thead className="bg-slate-50"><tr><th className={TH}>{isRtl ? 'النوع' : 'Type'}</th><th className={TH}>{isRtl ? 'الجلسات' : 'Sessions'}</th><th className={TH}>{isRtl ? 'الوصول' : 'Reached'}</th></tr></thead>
              <tbody>{sphere.byServiceType.map((r: any, i: number) => (<tr key={i} className="border-t"><td className={TD}>{r.service_type}</td><td className={cn(TD, 'font-mono')}>{r.count}</td><td className={cn(TD, 'font-mono')}>{fmt(r.reached)}</td></tr>))}</tbody></table></div>
          )}
        </div>
      )}

      {showDeliveryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateDelivery} className="bg-white dark:bg-zinc-900 rounded-2xl p-5 w-full max-w-md space-y-3 max-h-[90vh] overflow-y-auto">
            <h3 className="font-black text-sm">{isRtl ? 'جلسة تسليم جديدة' : 'New delivery session'}</h3>
            {formErr && <div className="text-[11px] font-bold text-rose-600">{formErr}</div>}
            <div className="grid grid-cols-2 gap-2">
              <div><label className={LABEL}>{isRtl ? 'النوع *' : 'Type *'}</label><select value={delForm.service_type} onChange={(e) => setDelForm({ ...delForm, service_type: e.target.value })} className={INPUT}>{SERVICE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div><label className={LABEL}>{isRtl ? 'التاريخ *' : 'Date *'}</label><input type="date" value={delForm.delivery_date} onChange={(e) => setDelForm({ ...delForm, delivery_date: e.target.value })} className={INPUT} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={LABEL}>{isRtl ? 'الموقع' : 'Location'}</label><input value={delForm.location} onChange={(e) => setDelForm({ ...delForm, location: e.target.value })} className={INPUT} /></div>
              <div><label className={LABEL}>{isRtl ? 'الضابط الميداني' : 'Field officer'}</label><input value={delForm.officer_name} onChange={(e) => setDelForm({ ...delForm, officer_name: e.target.value })} className={INPUT} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={LABEL}>{isRtl ? 'عدد المستهدفين' : 'Targeted count'}</label><input type="number" min="1" value={delForm.beneficiary_count} onChange={(e) => setDelForm({ ...delForm, beneficiary_count: e.target.value })} className={INPUT} /></div>
              <div><label className={LABEL}>{isRtl ? 'مستفيد مرتبط' : 'Linked beneficiary'}</label><select value={delForm.beneficiary_id} onChange={(e) => setDelForm({ ...delForm, beneficiary_id: e.target.value })} className={INPUT}><option value="">—</option>{beneficiaries.slice(0, 200).map((b: any) => <option key={b.id} value={b.id}>{b.full_name_ar || b.full_name_en || b.id?.slice(0, 8)}</option>)}</select></div>
            </div>
            <div><label className={LABEL}>{isRtl ? 'ملاحظات' : 'Notes'}</label><input value={delForm.notes} onChange={(e) => setDelForm({ ...delForm, notes: e.target.value })} className={INPUT} /></div>
            <div className="flex gap-2"><button type="submit" disabled={saving} className={BTN}>{saving ? <Spinner size="sm" /> : <Plus className="w-4 h-4" />}{isRtl ? 'حفظ' : 'Save'}</button>
              <button type="button" onClick={() => setShowDeliveryModal(false)} className="px-4 py-2.5 bg-slate-100 rounded-xl text-xs font-bold cursor-pointer">{isRtl ? 'إلغاء' : 'Cancel'}</button></div>
          </form>
        </div>
      )}

      {showDistModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateDistribution} className="bg-white dark:bg-zinc-900 rounded-2xl p-5 w-full max-w-md space-y-3 max-h-[90vh] overflow-y-auto">
            <h3 className="font-black text-sm">{isRtl ? 'توزيع جديد بسند' : 'New vouchered distribution'}</h3>
            {formErr && <div className="text-[11px] font-bold text-rose-600">{formErr}</div>}
            <div><label className={LABEL}>{isRtl ? 'المستفيد *' : 'Beneficiary *'}</label><select value={distForm.beneficiary_id} onChange={(e) => setDistForm({ ...distForm, beneficiary_id: e.target.value })} className={INPUT}><option value="">—</option>{beneficiaries.slice(0, 500).map((b: any) => <option key={b.id} value={b.id}>{b.full_name_ar || b.full_name_en || b.id?.slice(0, 8)}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={LABEL}>{isRtl ? 'النوع' : 'Type'}</label><select value={distForm.aid_type} onChange={(e) => setDistForm({ ...distForm, aid_type: e.target.value })} className={INPUT}>{AID_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}</select></div>
              <div><label className={LABEL}>{isRtl ? 'القيمة' : 'Amount'}</label><input type="number" min="0" step="0.01" value={distForm.amount} onChange={(e) => setDistForm({ ...distForm, amount: e.target.value })} className={INPUT} /></div>
            </div>
            <div><label className={LABEL}>{isRtl ? 'التاريخ *' : 'Date *'}</label><input type="date" value={distForm.distribution_date} onChange={(e) => setDistForm({ ...distForm, distribution_date: e.target.value })} className={INPUT} /></div>
            <div><label className={LABEL}>{isRtl ? 'الوصف' : 'Description'}</label><input value={distForm.description} onChange={(e) => setDistForm({ ...distForm, description: e.target.value })} className={INPUT} /></div>
            <div className="flex gap-2"><button type="submit" disabled={saving} className={BTN}>{saving ? <Spinner size="sm" /> : <HandHeart className="w-4 h-4" />}{isRtl ? 'حفظ التوزيع' : 'Save distribution'}</button>
              <button type="button" onClick={() => setShowDistModal(false)} className="px-4 py-2.5 bg-slate-100 rounded-xl text-xs font-bold cursor-pointer">{isRtl ? 'إلغاء' : 'Cancel'}</button></div>
          </form>
        </div>
      )}

      <p className="text-[10px] text-slate-400 flex items-center gap-1"><BarChart3 className="w-3 h-3" />{isRtl ? 'التوزيع لكل مستفيد بسند وتأكيد استلام' : 'Per-beneficiary vouchered distribution with receipt confirmation'}</p>
    </div>
  );
}
