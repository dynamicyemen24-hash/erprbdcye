/**
 * NexoraOS™ — NEB-15: Revenue Advanced Tab
 * Batch Revenue · Funding Caps · Revenue Schedules
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers, Shield, CalendarClock, Plus, CheckCircle2, XCircle, Clock,
  AlertTriangle, ChevronRight, RefreshCw, Loader2, BarChart3, TrendingUp, Send
} from 'lucide-react';
import { showToast } from '../enterprise/EnterpriseToastContainer';
import { Spinner } from '../../design-system/components/Spinner';

// ─── Types ─────────────────────────────────────────────────────────────

interface RevenueBatch {
  id: string; batch_number: string; status: string;
  total_amount: string | number; currency_code: string;
  batch_date: string; description?: string;
  created_at: string; updated_at: string;
  entries?: RevenueBatchEntry[];
  cap_remaining_before?: string | number;
}

interface RevenueBatchEntry {
  id: string; sequence_number: number; account_code: string;
  account_name_ar?: string; debit_amount: number; credit_amount: number;
  project_id?: string; activity_id?: string; description?: string;
}

interface FundingCap {
  id: string; cap_code: string; cap_name_ar: string; cap_type: string;
  total_cap_amount: string | number; used?: number; remaining?: number;
  utilization_pct?: number; currency_code: string;
  start_date: string; end_date?: string;
  applicable_types: string[]; status: string;
}

interface FundingCapUtilization {
  cap: FundingCap; used: number; remaining: number; utilization_pct: number;
}

interface RevenueSchedule {
  id: string; schedule_number: string; revenue_type: string;
  counterparty_name: string; total_amount: string | number;
  currency_code: string; schedule_type: string; frequency: string;
  installments_count: number; installment_amount?: string | number;
  start_date: string; next_due_date?: string; status: string;
  installments?: ScheduleInstallment[];
}

interface ScheduleInstallment {
  id: string; installment_number: number; due_date: string;
  amount: number; status: string; collected_date?: string;
  collected_amount?: number;
}

interface RevenueScheduleInstallmentRow {
  installment_number: number; due_date: string; amount: string | number;
  status: string; collected_date?: string; collected_amount?: string | number;
}

interface RevenueAdvancedTabProps {
  lang: 'ar' | 'en';
  apiBase?: string;
  orgId?: string;
}

const fmt = (v: string | number | undefined | null) =>
  Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleDateString('ar-EG'); } catch { return d; }
};

const STATUS_META: Record<string, { ar: string; cls: string }> = {
  DRAFT: { ar: 'مسودة', cls: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
  PENDING_APPROVAL: { ar: 'بانتظار الاعتماد', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  APPROVED: { ar: 'معتمد', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  POSTED: { ar: 'مرحّل', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  PARTIALLY_POSTED: { ar: 'مرحّل جزئياً', cls: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' },
  REJECTED: { ar: 'مرفوض', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
  VOIDED: { ar: 'ملغى', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
  ACTIVE: { ar: 'نشط', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  PAUSED: { ar: 'موقف', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  COMPLETED: { ar: 'مكتمل', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  CANCELLED: { ar: 'ملغى', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
  EXPIRED: { ar: 'منتهي', cls: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500' },
  PENDING: { ar: 'معلق', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  DUE: { ar: 'مستحق', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  OVERDUE: { ar: 'متأخر', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
  COLLECTED: { ar: 'محصّل', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
};

// ─── Batches Panel ────────────────────────────────────────────────────

function BatchRevenuePanel({ lang, apiBase }: { lang: 'ar' | 'en'; apiBase?: string }) {
  const isAr = lang === 'ar';
  const [batches, setBatches] = useState<RevenueBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<RevenueBatch | null>(null);
  const [busyId, setBusyId] = useState('');

  const fetchBatches = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${apiBase || '/api'}/v2/revenue/batches?limit=50`);
      const json = await res.json();
      if (json.success) setBatches(json.data?.data || json.data || []);
      else setError(json.message || 'Failed to load batches');
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [apiBase]);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  const doAction = async (id: string, action: 'submit' | 'approve' | 'post') => {
    setBusyId(id);
    try {
      const res = await fetch(`${apiBase || '/api'}/v2/revenue/batches/${id}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const json = await res.json();
      if (json.success) { await fetchBatches(); setSelectedBatch(null); }
      else showToast({ type: 'error', title: 'خطأ', message: json.message || 'Action failed' });
    } catch (e: any) { showToast({ type: 'error', title: 'خطأ', message: e.message }); }
    setBusyId('');
  };

  const totalDebit = (selectedBatch?.entries || []).reduce((s, e) => s + Number(e.debit_amount || 0), 0);
  const totalCredit = (selectedBatch?.entries || []).reduce((s, e) => s + Number(e.credit_amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-700 dark:text-zinc-200">{isAr ? 'التوريد الجماعي للايرادات' : 'Revenue Batch Entries'}</h4>
        <div className="flex gap-2">
          <button onClick={fetchBatches} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 cursor-pointer" title={isAr ? 'تحديث' : 'Refresh'}>
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowCreate(true)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> {isAr ? 'إنشاء دفعة' : 'New Batch'}
          </button>
        </div>
      </div>

      {error && <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-8"><Spinner size="md" variant="primary" /></div>
      ) : batches.length === 0 ? (
        <div className="text-center py-8 text-slate-400 dark:text-zinc-500 text-sm">{isAr ? 'لا توجد دفعات' : 'No batches found'}</div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {(batches as RevenueBatch[]).map((b) => {
            const meta = STATUS_META[b.status] || { ar: b.status, cls: 'bg-slate-100 text-slate-600' };
            return (
              <div key={b.id} onClick={() => setSelectedBatch(selectedBatch?.id === b.id ? null : b)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedBatch?.id === b.id ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-700 bg-white dark:bg-zinc-900'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-zinc-200">{b.batch_number}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${meta.cls}`}>{meta.ar}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-600 dark:text-zinc-300">{fmt(b.total_amount)} {b.currency_code}</span>
                    <span className="text-xs text-slate-400">{fmtDate(b.batch_date)}</span>
                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${selectedBatch?.id === b.id ? 'rotate-90' : ''}`} />
                  </div>
                </div>
                {selectedBatch?.id === b.id && (
                  <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800 space-y-3">
                    {(selectedBatch.entries || []).map((e) => (
                      <div key={e.id} className="flex items-center justify-between text-xs px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-xs font-bold text-emerald-700">{e.sequence_number}</span>
                          <div>
                            <span className="font-mono font-bold text-slate-600 dark:text-zinc-300">{e.account_code}</span>
                            <span className="text-slate-400 mr-2">{e.account_name_ar || ''}</span>
                          </div>
                        </div>
                        <div className="flex gap-4 font-bold">
                          <span className="text-emerald-600">{Number(e.debit_amount || 0).toLocaleString()}</span>
                          <span className="text-rose-600">{Number(e.credit_amount || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-3 py-2 bg-emerald-100 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{isAr ? 'الإجمالي' : 'Total'}</span>
                      <div className="flex gap-4 font-black">
                        <span className="text-emerald-700">{totalDebit.toLocaleString()}</span>
                        <span className="text-rose-700">{totalCredit.toLocaleString()}</span>
                      </div>
                    </div>
                    {selectedBatch.cap_remaining_before && (
                      <div className="text-xs text-amber-600 dark:text-amber-400 px-3">
                        {isAr ? 'السقف المتبقي قبل الترحيل:' : 'Cap remaining before posting:'} {fmt(selectedBatch.cap_remaining_before)}
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      {b.status === 'DRAFT' && (
                        <button onClick={() => doAction(b.id, 'submit')} disabled={busyId === b.id}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                          {busyId === b.id ? <Spinner size="xs" /> : <Send className="w-3.5 h-3.5" />}
                          {isAr ? 'تقديم للاعتماد' : 'Submit for Approval'}
                        </button>
                      )}
                      {b.status === 'PENDING_APPROVAL' && (
                        <>
                          <button onClick={() => doAction(b.id, 'approve')} disabled={busyId === b.id}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {isAr ? 'اعتماد' : 'Approve'}
                          </button>
                          <button onClick={() => doAction(b.id, 'approve')} disabled={busyId === b.id}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                            <XCircle className="w-3.5 h-3.5" /> {isAr ? 'رفض' : 'Reject'}
                          </button>
                        </>
                      )}
                      {b.status === 'APPROVED' && (
                        <button onClick={() => doAction(b.id, 'post')} disabled={busyId === b.id}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                          {busyId === b.id ? <Spinner size="xs" /> : <Layers className="w-3.5 h-3.5" />}
                          {isAr ? 'ترحيل للغة الأستاذ' : 'Post to Ledger'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Funding Caps Panel ───────────────────────────────────────────────

function FundingCapsPanel({ lang, apiBase }: { lang: 'ar' | 'en'; apiBase?: string }) {
  const isAr = lang === 'ar';
  const [caps, setCaps] = useState<FundingCap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState('');

  const fetchCaps = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${apiBase || '/api'}/v2/revenue/funding-caps`);
      const json = await res.json();
      if (json.success) setCaps(json.data || []);
      else setError(json.message || 'Failed to load funding caps');
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [apiBase]);

  useEffect(() => { fetchCaps(); }, [fetchCaps]);

  const getUtilization = async (capId: string) => {
    try {
      const res = await fetch(`${apiBase || '/api'}/v2/revenue/funding-caps/${capId}/utilization`);
      const json = await res.json();
      if (json.success) {
        const util: FundingCapUtilization = json.data;
        setCaps(prev => prev.map(c => c.id === capId ? {
          ...c, used: util.used, remaining: util.remaining, utilization_pct: util.utilization_pct
        } : c));
      }
    } catch { /* silent */ }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-700 dark:text-zinc-200">{isAr ? 'أسقف التمويل والمراقبة' : 'Funding Caps & Monitoring'}</h4>
        <button onClick={fetchCaps} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 cursor-pointer">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 rounded-lg text-xs text-rose-700">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-8"><Spinner size="md" variant="primary" /></div>
      ) : caps.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">{isAr ? 'لا توجد أسقف تمويل' : 'No funding caps found'}</div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {caps.map((cap) => {
            const pct = Number(cap.utilization_pct || 0);
            const barColor = pct >= 100 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500';
            const meta = STATUS_META[cap.status] || { ar: cap.status, cls: 'bg-slate-100 text-slate-600' };
            return (
              <div key={cap.id} onClick={() => { setExpandedId(expandedId === cap.id ? '' : cap.id); if (!cap.used) getUtilization(cap.id); }}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${expandedId === cap.id ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/20' : 'border-slate-200 dark:border-zinc-800 hover:border-amber-300 bg-white dark:bg-zinc-900'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-mono font-bold">{cap.cap_code}</span>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">{cap.cap_name_ar}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${meta.cls}`}>{meta.ar}</span>
                    {cap.cap_type === 'HARD' && <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded text-xs font-bold">HARD</span>}
                  </div>
                  <span className="text-xs font-bold text-slate-600 dark:text-zinc-300">{fmt(cap.total_cap_amount)} {cap.currency_code}</span>
                </div>
                {pct > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>{isAr ? 'المستخدم' : 'Used'}: {fmt(cap.used || 0)}</span>
                      <span>{isAr ? 'المتبقي' : 'Remaining'}: {fmt(cap.remaining || 0)}</span>
                      <span className="font-bold">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full ${barColor} transition-all rounded-full`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                )}
                {expandedId === cap.id && (
                  <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800 space-y-1">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-slate-400">{isAr ? 'تاريخ البدء' : 'Start Date'}:</span> <span className="font-bold">{fmtDate(cap.start_date)}</span></div>
                      <div><span className="text-slate-400">{isAr ? 'تاريخ الانتهاء' : 'End Date'}:</span> <span className="font-bold">{cap.end_date ? fmtDate(cap.end_date) : '—'}</span></div>
                      <div className="col-span-2"><span className="text-slate-400">{isAr ? 'الأنواع المطبقة' : 'Applicable Types'}:</span> <span className="font-bold">{(cap.applicable_types || []).join(', ')}</span></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Revenue Schedules Panel ───────────────────────────────────────────

function RevenueSchedulesPanel({ lang, apiBase }: { lang: 'ar' | 'en'; apiBase?: string }) {
  const isAr = lang === 'ar';
  const [schedules, setSchedules] = useState<RevenueSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState('');

  const fetchSchedules = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${apiBase || '/api'}/v2/revenue/schedules`);
      const json = await res.json();
      if (json.success) setSchedules(json.data || []);
      else setError(json.message || 'Failed to load schedules');
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [apiBase]);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  const fetchDetail = async (id: string) => {
    try {
      const res = await fetch(`${apiBase || '/api'}/v2/revenue/schedules/${id}`);
      const json = await res.json();
      if (json.success) setSchedules(prev => prev.map(s => s.id === id ? { ...s, installments: json.data?.installments || [] } : s));
    } catch { /* silent */ }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-700 dark:text-zinc-200">{isAr ? 'جدولة الإيرادات المستقبلية' : 'Revenue Schedules'}</h4>
        <button onClick={fetchSchedules} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 cursor-pointer">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-8"><Spinner size="md" variant="primary" /></div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">{isAr ? 'لا توجد جداول' : 'No schedules found'}</div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {schedules.map((s) => {
            const meta = STATUS_META[s.status] || { ar: s.status, cls: 'bg-slate-100 text-slate-600' };
            const completedInst = (s.installments || []).filter((i: any) => i.status === 'COLLECTED').length;
            return (
              <div key={s.id} onClick={() => { setExpandedId(expandedId === s.id ? '' : s.id); if (!s.installments) fetchDetail(s.id); }}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${expandedId === s.id ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/20' : 'border-slate-200 dark:border-zinc-800 hover:border-indigo-300 bg-white dark:bg-zinc-900'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-mono font-bold">{s.schedule_number}</span>
                    <span className="text-xs text-slate-500">{s.counterparty_name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${meta.cls}`}>{meta.ar}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-600 dark:text-zinc-300">{fmt(s.total_amount)} {s.currency_code}</span>
                    <span className="text-xs text-slate-400">{completedInst}/{s.installments_count}</span>
                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expandedId === s.id ? 'rotate-90' : ''}`} />
                  </div>
                </div>
                {expandedId === s.id && s.installments && (
                  <div className="mt-3 pt-3 border-t border-indigo-200 dark:border-indigo-800 space-y-1">
                    {(s.installments as RevenueScheduleInstallmentRow[]).map((inst) => {
                      const im = STATUS_META[inst.status] || { ar: inst.status, cls: 'bg-slate-100 text-slate-600' };
                      return (
                        <div key={inst.installment_number} className="flex items-center justify-between text-xs px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-700">{inst.installment_number}</span>
                            <span className="text-slate-500">{fmtDate(inst.due_date)}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${im.cls}`}>{im.ar}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold">{fmt(inst.amount)}</span>
                            {inst.collected_date && <span className="text-emerald-600 text-xs">{fmtDate(inst.collected_date)}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────

export default function RevenueAdvancedTab({ lang, apiBase }: RevenueAdvancedTabProps) {
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<'batches' | 'caps' | 'schedules'>('batches');

  const tabs = [
    { id: 'batches' as const, label: isAr ? 'التوريد الجماعي' : 'Batch Revenue', icon: Layers },
    { id: 'caps' as const, label: isAr ? 'أسقف التمويل' : 'Funding Caps', icon: Shield },
    { id: 'schedules' as const, label: isAr ? 'جدولة الإيرادات' : 'Revenue Schedules', icon: CalendarClock },
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-zinc-800 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100">
              {isAr ? 'محركات الإيرادات المتقدمة — توريد جماعي · أسقف · جدولة' : 'Advanced Revenue Engine — Batch · Caps · Schedules'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {isAr ? 'قيود محاسبية جماعية متعددة الحسابات · مراقبة أسقف التمويل · جدولة إيرادات مستقبلية' : 'Multi-account journal entries · Funding cap monitoring · Future-dated revenue scheduling'}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-zinc-800">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold transition-all cursor-pointer border-b-2 ${
                activeTab === t.id
                  ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:text-zinc-300 dark:hover:bg-zinc-800'
              }`}>
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-5">
        {activeTab === 'batches' && <BatchRevenuePanel lang={lang} apiBase={apiBase} />}
        {activeTab === 'caps' && <FundingCapsPanel lang={lang} apiBase={apiBase} />}
        {activeTab === 'schedules' && <RevenueSchedulesPanel lang={lang} apiBase={apiBase} />}
      </div>
    </div>
  );
}
