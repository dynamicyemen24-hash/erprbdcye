import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, Plus, CheckCircle2, XCircle, Clock, Banknote, RefreshCw,
  FileText, Sparkles, ShieldAlert, Wallet, Loader2, Ban, Send,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────

interface RevenueStream {
  id: string;
  stream_code: string;
  name_ar: string;
  recognition_method: string;
  exchange_type: string;
  is_restricted: boolean;
  default_currency: string;
}

interface RevenueRecord {
  id: string;
  revenue_number: string;
  revenue_type: string;
  status: string;
  counterparty_name: string | null;
  project_name_ar: string | null;
  project_code: string | null;
  amount: string | number;
  collected_amount: string | number;
  amount_base: string | number;
  collected_amount_base: string | number;
  currency_code: string;
  revenue_date: string;
  stream_name_ar: string | null;
  is_restricted?: boolean;
}

interface IntelligenceSnapshot {
  kpis: {
    recordCount: number;
    totalRecognized: number;
    totalCollected: number;
    totalOutstanding: number;
    collectionRatePct: number;
    concentrationTop10Pct: number;
  };
  breakdowns: {
    byType: Array<{ revenue_type: string; record_count: string; total_amount: string; total_collected: string }>;
    byProject: Array<{ project_code: string | null; project_name_ar: string | null; total_amount: string; total_collected: string }>;
  };
  forecast: {
    next: Array<{ month: string; predicted: number }>;
    confidence: string;
    note?: string;
  };
  insights: string[];
}

interface Project { id: string; code?: string; project_code?: string; name_ar: string }

interface UnifiedRevenueEngineTabProps {
  lang: 'ar' | 'en';
  projects: Project[];
}

const STATUS_META: Record<string, { ar: string; cls: string }> = {
  DRAFT: { ar: 'مسودة', cls: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
  PENDING_APPROVAL: { ar: 'بانتظار الاعتماد', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  APPROVED: { ar: 'معتمد', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  POSTED: { ar: 'مرحّل للقيود', cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
  PARTIALLY_COLLECTED: { ar: 'محصّل جزئياً', cls: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' },
  COLLECTED: { ar: 'محصّل بالكامل', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  REJECTED: { ar: 'مرفوض', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
  VOIDED: { ar: 'ملغى', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
};

const fmt = (v: string | number | undefined | null) =>
  Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

export default function UnifiedRevenueEngineTab({ lang, projects }: UnifiedRevenueEngineTabProps) {
  const isAr = lang === 'ar';
  const [streams, setStreams] = useState<RevenueStream[]>([]);
  const [records, setRecords] = useState<RevenueRecord[]>([]);
  const [snapshot, setSnapshot] = useState<IntelligenceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [collectFor, setCollectFor] = useState<RevenueRecord | null>(null);

  // Create form state
  const [form, setForm] = useState({
    streamCode: '', revenueType: '', counterpartyName: '', projectId: '', activityId: '',
    amount: '', currencyCode: 'YER', revenueDate: new Date().toISOString().split('T')[0],
    description: '', referenceNumber: '',
  });

  // Collect form state
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMethod, setCollectMethod] = useState('CASH');

  const api = useCallback(async (path: string, init?: RequestInit) => {
    const res = await fetch(path, { credentials: 'include', ...init });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error || json?.message || `HTTP ${res.status}`);
    return json?.data ?? json;
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, r, intel] = await Promise.all([
        api('/api/v2/revenue/streams?activeOnly=true'),
        api(`/api/v2/revenue/records?limit=100${statusFilter ? `&status=${statusFilter}` : ''}`),
        api('/api/v2/revenue/intelligence/snapshot'),
      ]);
      setStreams(Array.isArray(s) ? s : []);
      setRecords(Array.isArray(r?.items) ? r.items : Array.isArray(r) ? r : []);
      setSnapshot(intel || null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [api, statusFilter]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const action = async (id: string, verb: string, body?: any) => {
    setBusyId(id + verb);
    setError('');
    try {
      await api(`/api/v2/revenue/records/${id}/${verb}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
      });
      await loadAll();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyId('');
    }
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api('/api/v2/revenue/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamCode: form.streamCode || undefined,
          revenueType: form.revenueType || undefined,
          counterpartyName: form.counterpartyName || undefined,
          projectId: form.projectId || undefined,
          activityId: form.activityId || undefined,
          amount: Number(form.amount),
          currencyCode: form.currencyCode,
          revenueDate: form.revenueDate,
          description: form.description || undefined,
          referenceNumber: form.referenceNumber || undefined,
        }),
      });
      setShowCreate(false);
      setForm({ streamCode: '', revenueType: '', counterpartyName: '', projectId: '', activityId: '', amount: '', currencyCode: 'YER', revenueDate: new Date().toISOString().split('T')[0], description: '', referenceNumber: '' });
      await loadAll();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const submitCollect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectFor) return;
    setError('');
    try {
      await api(`/api/v2/revenue/records/${collectFor.id}/collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(collectAmount), paymentMethod: collectMethod }),
      });
      setCollectFor(null);
      setCollectAmount('');
      await loadAll();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const k = snapshot?.kpis;
  const inputCls = 'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-slate-800 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 outline-none';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800 dark:text-zinc-100">
              {isAr ? 'محرك الإيرادات الموحد — NEB-15' : 'Unified Revenue Engine — NEB-15'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              {isAr ? 'أي نوع إيراد لأي مشروع أو نشاط — دورة حياة كاملة، ترحيل IPSAS آلي، ذكاء مالي' : 'Any revenue type, any project — full lifecycle, automated IPSAS posting, financial intelligence'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadAll} className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 flex items-center gap-1.5 cursor-pointer">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> {isAr ? 'تحديث' : 'Refresh'}
          </button>
          <button onClick={() => setShowCreate(v => !v)} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer">
            <Plus className="w-4 h-4" /> {isAr ? 'إيراد جديد' : 'New Revenue'}
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* KPI Cards */}
      {k && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {[
            { label: isAr ? 'إجمالي الإيرادات' : 'Total Recognized', value: fmt(k.totalRecognized), icon: TrendingUp, cls: 'text-emerald-600' },
            { label: isAr ? 'المحصّل' : 'Collected', value: fmt(k.totalCollected), icon: Banknote, cls: 'text-sky-600' },
            { label: isAr ? 'المستحق المتبقي' : 'Outstanding', value: fmt(k.totalOutstanding), icon: Clock, cls: 'text-amber-600' },
            { label: isAr ? 'معدل التحصيل' : 'Collection Rate', value: `${k.collectionRatePct}%`, icon: CheckCircle2, cls: 'text-emerald-600' },
            { label: isAr ? 'تركّز أكبر 10 جهات' : 'Top-10 Concentration', value: `${k.concentrationTop10Pct}%`, icon: ShieldAlert, cls: 'text-rose-600' },
            { label: isAr ? 'عدد المستندات' : 'Record Count', value: String(k.recordCount), icon: FileText, cls: 'text-slate-600' },
          ].map((c, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase">{c.label}</span>
                <c.icon className={`w-4 h-4 ${c.cls}`} />
              </div>
              <span className="text-lg font-black text-slate-800 dark:text-zinc-100">{c.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* AI Insights + Forecast */}
      {snapshot && (
        <div className="grid md:grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-black">{isAr ? 'رؤى الذكاء المالي' : 'Financial Intelligence Insights'}</span>
            </div>
            {(snapshot.insights || []).length === 0 ? (
              <p className="text-[11px] opacity-90">{isAr ? 'لا توجد تنبيهات ذكية حالياً.' : 'No intelligent alerts at the moment.'}</p>
            ) : (
              <ul className="space-y-1.5">
                {snapshot.insights.map((ins: string, i: number) => (
                  <li key={i} className="text-[11px] leading-relaxed opacity-90 flex gap-1.5"><span>•</span><span>{ins}</span></li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-black text-slate-700 dark:text-zinc-200">{isAr ? 'توقع الإيرادات (انحدار خطي)' : 'Revenue Forecast (Linear Regression)'}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${snapshot.forecast.confidence === 'HIGH' ? 'bg-emerald-100 text-emerald-700' : snapshot.forecast.confidence === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-600'}`}>
                {snapshot.forecast.confidence}
              </span>
            </div>
            {!snapshot.forecast.next || snapshot.forecast.next.length === 0 ? (
              <p className="text-[11px] text-slate-400 dark:text-zinc-500">{snapshot.forecast.note || (isAr ? 'بيانات غير كافية للتنبؤ' : 'Insufficient data to forecast')}</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {snapshot.forecast.next.map((f, i) => (
                  <div key={i} className="rounded-xl bg-slate-50 dark:bg-zinc-800 p-2 text-center">
                    <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold">{f.month}</div>
                    <div className="text-sm font-black text-slate-700 dark:text-zinc-200">{fmt(f.predicted)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
{/* Create form */}
      {showCreate && (
        <form onSubmit={submitCreate} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-4 space-y-3">
          <h4 className="text-xs font-black text-slate-700 dark:text-zinc-200">{isAr ? 'تسجيل إيراد جديد (يبدأ كمسودة)' : 'Register New Revenue (starts as DRAFT)'}</h4>
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'المسار الإيرادي' : 'Revenue Stream'}</label>
              <select value={form.streamCode} onChange={e => setForm(f => ({ ...f, streamCode: e.target.value, currencyCode: streams.find(s => s.stream_code === e.target.value)?.default_currency || f.currencyCode }))} className={inputCls}>
                <option value="">{isAr ? '— اختر المسار —' : '— Select stream —'}</option>
                {streams.map(s => <option key={s.id} value={s.stream_code}>{s.name_ar} ({s.stream_code})</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'الجهة / الممول' : 'Counterparty / Funder'}</label>
              <input value={form.counterpartyName} onChange={e => setForm(f => ({ ...f, counterpartyName: e.target.value }))} className={inputCls} placeholder={isAr ? 'اسم الجهة' : 'Party name'} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'المشروع' : 'Project'}</label>
              <select value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))} className={inputCls}>
                <option value="">{isAr ? '— بدون مشروع —' : '— No project —'}</option>
                {projects.map(p => <option key={p.id} value={p.id}>{(p.project_code || p.code || '')} — {p.name_ar}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'المبلغ' : 'Amount'} *</label>
              <input required type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'العملة' : 'Currency'}</label>
              <select value={form.currencyCode} onChange={e => setForm(f => ({ ...f, currencyCode: e.target.value }))} className={inputCls}>
                {['YER', 'USD', 'SAR', 'EUR', 'AED'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'تاريخ الإيراد' : 'Revenue Date'}</label>
              <input type="date" value={form.revenueDate} onChange={e => setForm(f => ({ ...f, revenueDate: e.target.value }))} className={inputCls} />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'الوصف' : 'Description'}</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'المرجع' : 'Reference'}</label>
              <input value={form.referenceNumber} onChange={e => setForm(f => ({ ...f, referenceNumber: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer">{isAr ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer">{isAr ? 'حفظ كمسودة' : 'Save as Draft'}</button>
          </div>
        </form>
      )}
{/* Records table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-zinc-800">
          <h4 className="text-xs font-black text-slate-700 dark:text-zinc-200">{isAr ? 'سجل الإيرادات الموحد' : 'Unified Revenue Records'}</h4>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[11px] font-bold text-slate-600 dark:text-zinc-300">
            <option value="">{isAr ? 'كل الحالات' : 'All statuses'}</option>
            {Object.entries(STATUS_META).map(([k2, v]) => <option key={k2} value={k2}>{v.ar}</option>)}
          </select>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : records.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-zinc-500">{isAr ? 'لا توجد إيرادات مسجلة — ابدأ بتسجيل إيراد جديد' : 'No revenue records yet'}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-800/60 text-slate-400 dark:text-zinc-500 text-[10px] uppercase">
                  <th className="px-4 py-2.5 text-start font-black">{isAr ? 'الرقم' : 'Number'}</th>
                  <th className="px-4 py-2.5 text-start font-black">{isAr ? 'النوع' : 'Type'}</th>
                  <th className="px-4 py-2.5 text-start font-black">{isAr ? 'الجهة' : 'Counterparty'}</th>
                  <th className="px-4 py-2.5 text-start font-black">{isAr ? 'المشروع' : 'Project'}</th>
                  <th className="px-4 py-2.5 text-end font-black">{isAr ? 'المبلغ' : 'Amount'}</th>
                  <th className="px-4 py-2.5 text-end font-black">{isAr ? 'المحصّل' : 'Collected'}</th>
                  <th className="px-4 py-2.5 text-center font-black">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="px-4 py-2.5 text-center font-black">{isAr ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
{records.map(r => {
                  const meta = STATUS_META[r.status] || STATUS_META.DRAFT;
                  const outstanding = Number(r.amount) - Number(r.collected_amount);
                  const canSubmit = r.status === 'DRAFT';
                  const canApprove = r.status === 'PENDING_APPROVAL';
                  const canPost = r.status === 'APPROVED' || r.status === 'PENDING_APPROVAL';
                  const canCollect = ['POSTED', 'APPROVED', 'PARTIALLY_COLLECTED'].includes(r.status) && outstanding > 0.001;
                  const canVoid = !['COLLECTED', 'VOIDED', 'REJECTED'].includes(r.status) && Number(r.collected_amount) === 0;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40">
                      <td className="px-4 py-2.5 font-black text-emerald-700 dark:text-emerald-400">{r.revenue_number}</td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-zinc-300">
                        {r.stream_name_ar || r.revenue_type}
                        {r.is_restricted && <span className="ms-1.5 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[9px] font-black">{isAr ? 'مقيد' : 'RESTRICTED'}</span>}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 dark:text-zinc-400">{r.counterparty_name || '—'}</td>
                      <td className="px-4 py-2.5 text-slate-500 dark:text-zinc-400">{r.project_code ? `${r.project_code} — ${r.project_name_ar || ''}` : '—'}</td>
                      <td className="px-4 py-2.5 text-end font-black text-slate-700 dark:text-zinc-200">{fmt(r.amount)} <span className="text-[9px] text-slate-400">{r.currency_code}</span></td>
                      <td className="px-4 py-2.5 text-end font-bold text-sky-600">{fmt(r.collected_amount)}</td>
                      <td className="px-4 py-2.5 text-center"><span className={`px-2 py-1 rounded-full text-[10px] font-black ${meta.cls}`}>{meta.ar}</span></td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          {canSubmit && (
                            <button title={isAr ? 'إرسال للاعتماد' : 'Submit'} onClick={() => action(r.id, 'submit')} disabled={busyId === r.id + 'submit'} className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 disabled:opacity-40 cursor-pointer"><Send className="w-3.5 h-3.5" /></button>
                          )}
                          {canApprove && (
                            <>
                              <button title={isAr ? 'اعتماد' : 'Approve'} onClick={() => action(r.id, 'approve')} disabled={busyId === r.id + 'approve'} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-40 cursor-pointer"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                              <button title={isAr ? 'رفض' : 'Reject'} onClick={() => action(r.id, 'approve', { reject: true, reason: isAr ? 'مرفوض من الشاشة' : 'Rejected from UI' })} disabled={busyId === r.id + 'approve'} className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 disabled:opacity-40 cursor-pointer"><XCircle className="w-3.5 h-3.5" /></button>
                            </>
                          )}
                          {canPost && (
                            <button title={isAr ? 'ترحيل للقيود (IPSAS)' : 'Post to Ledger (IPSAS)'} onClick={() => action(r.id, 'post')} disabled={busyId === r.id + 'post'} className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 disabled:opacity-40 cursor-pointer"><FileText className="w-3.5 h-3.5" /></button>
                          )}
                          {canCollect && (
                            <button title={isAr ? 'تحصيل' : 'Collect'} onClick={() => { setCollectFor(r); setCollectAmount(String(outstanding)); }} className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 cursor-pointer"><Banknote className="w-3.5 h-3.5" /></button>
                          )}
                          {canVoid && (
                            <button title={isAr ? 'إلغاء' : 'Void'} onClick={() => action(r.id, 'void', { reason: isAr ? 'إلغاء من الشاشة' : 'Voided from UI' })} disabled={busyId === r.id + 'void'} className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 cursor-pointer"><Ban className="w-3.5 h-3.5" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
</tbody>
            </table>
          </div>
        )}
      </div>

      {/* Collect modal */}
      {collectFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setCollectFor(null)}>
          <form onSubmit={submitCollect} onClick={e => e.stopPropagation()} className="bg-white dark:bg-zinc-900 rounded-3xl p-5 w-full max-w-md space-y-3 shadow-2xl">
            <div className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-sky-600" />
              <h4 className="text-sm font-black text-slate-800 dark:text-zinc-100">{isAr ? `تحصيل — ${collectFor.revenue_number}` : `Collect — ${collectFor.revenue_number}`}</h4>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              {isAr ? 'المتبقي:' : 'Outstanding:'} <b>{fmt(Number(collectFor.amount) - Number(collectFor.collected_amount))} {collectFor.currency_code}</b>
            </p>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'المبلغ المحصّل' : 'Collection Amount'} *</label>
              <input required type="number" min="0.01" step="0.01" value={collectAmount} onChange={e => setCollectAmount(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'طريقة الدفع' : 'Payment Method'}</label>
              <select value={collectMethod} onChange={e => setCollectMethod(e.target.value)} className={inputCls}>
                <option value="CASH">{isAr ? 'نقداً' : 'Cash'}</option>
                <option value="BANK_TRANSFER">{isAr ? 'حوالة بنكية' : 'Bank Transfer'}</option>
                <option value="CHECK">{isAr ? 'شيك' : 'Check'}</option>
                <option value="MOBILE">{isAr ? 'محفظة إلكترونية' : 'Mobile Wallet'}</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setCollectFor(null)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer">{isAr ? 'إلغاء' : 'Cancel'}</button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black cursor-pointer">{isAr ? 'تأكيد التحصيل' : 'Confirm Collection'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
