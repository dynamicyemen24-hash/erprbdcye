/**
 * NexoraOS™ — NEB-08: Partnerships & Donor Grants OS
 * Funding Workspace View — وركسبيس التمويل والمانحين (Production-Grade E2E)
 *
 * SAP parity: GM (Grants Management)
 * Flow: Donors → Grants → Installments → Proposals → Donor Reports → Partner Agreements → Utilization/IATI
 * APIs: V2 domains (donors/grants/proposals/utilization) + V1 funding router + generic tables (whitelisted)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Handshake, Users, FileText, Coins, CalendarClock, BarChart3,
  Plus, Search, RefreshCw, Printer, AlertTriangle, CheckCircle2,
  Clock, XCircle, Send, Download, TrendingUp, ShieldCheck, Globe,
} from 'lucide-react';
import { printHTML } from '../lib/printUtils';
import { cn } from '../design-system/utils/cn';
import { EmptyState } from '../design-system/components/EmptyState';
import { ErrorState } from '../design-system/components/ErrorState';
import { Spinner } from '../design-system/components/Spinner';
import { EnterpriseButton } from './common/EnterpriseButton';
import { useTrainingWriteGuard } from '../core/context/EnvironmentModeContext';
import type { ActiveTab } from '../core/types/dashboard';

interface FundingWorkspaceViewProps {
  lang: 'ar' | 'en';
  currentUser?: any;
  onNavigate?: (tab: ActiveTab) => void;
}

type SubTab = 'dashboard' | 'donors' | 'grants' | 'installments' | 'proposals' | 'reports' | 'agreements' | 'compliance' | 'utilization';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('rbd_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'X-Tenant-Id': localStorage.getItem('uamex_tenant_id') || 'demo',
  };
}

async function apiGet<T = any>(path: string): Promise<T> {
  const res = await fetch(path, { headers: getAuthHeaders() });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error?.message || json?.error || json?.message || `HTTP ${res.status}`);
  // V2 domains → { success, data }; V1 funding → { status:'ok', data }; tables → { data } or array
  if (json && typeof json === 'object' && 'data' in json) return (json as any).data as T;
  return json as T;
}

async function apiPost<T = any>(path: string, body: any): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || json?.success === false)
    throw new Error(json?.error?.message || json?.error || json?.message || `HTTP ${res.status}`);
  if (json && typeof json === 'object' && 'data' in json) return (json as any).data as T;
  return (json ?? {}) as T;
}

const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const fmtMoney = (v: any) => nf.format(Number(v || 0));

const INPUT_CLS =
  'w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40';
const LABEL_CLS = 'block text-[11px] font-black text-slate-500 dark:text-zinc-400 mb-1';
const BTN_PRIMARY =
  'px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-sm shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed';
const TH_CLS = 'px-3 py-2.5 text-[11px] font-black text-slate-500 dark:text-zinc-400 text-right whitespace-nowrap';
const TD_CLS = 'px-3 py-2.5 text-xs text-slate-700 dark:text-zinc-200 whitespace-nowrap';

function StatusBadge({ status }: { status: string }) {
  const s = String(status || '').toUpperCase();
  const tone =
    s === 'ACTIVE' || s === 'RECEIVED' || s === 'APPROVED' || s === 'SUBMITTED'
      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
      : s === 'PENDING' || s === 'DRAFT' || s === 'UNDER_REVIEW'
        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
        : s === 'OVERDUE' || s === 'REJECTED' || s === 'CANCELLED'
          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
          : 'bg-slate-500/15 text-slate-600 dark:text-zinc-300 border-slate-500/30';
  return <span className={cn('px-2 py-0.5 rounded-lg border text-[10px] font-black', tone)}>{status || '—'}</span>;
}

function KpiCard({ icon: Icon, title, value, sub, tone }: { icon: any; title: string; value: string; sub?: string; tone: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-4 flex items-start gap-3">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', tone)}>
        <Icon size={20} strokeWidth={2.2} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-black text-slate-500 dark:text-zinc-400">{title}</div>
        <div className="text-xl font-black text-slate-800 dark:text-zinc-100 tabular-nums truncate">{value}</div>
        {sub && <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold">{sub}</div>}
      </div>
    </div>
  );
}

export default function FundingWorkspaceView({ lang, onNavigate }: FundingWorkspaceViewProps) {
  const isRtl = lang === 'ar';
  const training = useTrainingWriteGuard(lang);
  const blockIfTraining = (): boolean => {
    if (training.guard()) return false;
    setFormError(training.blockMessage);
    return true;
  };
  const [subTab, setSubTab] = useState<SubTab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [donors, setDonors] = useState<any[]>([]);
  const [grants, setGrants] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [donorReports, setDonorReports] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [utilization, setUtilization] = useState<any[]>([]);
  const [compliance, setCompliance] = useState<any[]>([]);
  const [exportingIati, setExportingIati] = useState(false);

  const [showDonorModal, setShowDonorModal] = useState(false);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [receivingId, setReceivingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [donorForm, setDonorForm] = useState({ name_ar: '', name_en: '', donor_type: 'INSTITUTIONAL', country: '' });
  const [grantForm, setGrantForm] = useState({ donor_id: '', grant_number: '', title_ar: '', title_en: '', total_amount: '', currency_code: 'USD', start_date: '', end_date: '' });
  const [proposalForm, setProposalForm] = useState({ donor_id: '', title_ar: '', title_en: '', proposed_amount: '', currency_code: 'USD' });
  const [installmentForm, setInstallmentForm] = useState({ grant_id: '', installment_number: '1', due_date: '', expected_amount: '', currency_code: 'USD' });
  const [receiveForm, setReceiveForm] = useState({ received_amount: '', received_date: new Date().toISOString().slice(0, 10), bank_reference: '' });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [d, g, p, u] = await Promise.all([
        apiGet<any[]>('/api/v2/domains/donors?limit=200').catch(() => []),
        apiGet<any[]>('/api/v2/domains/grants?limit=200').catch(() => []),
        apiGet<any[]>('/api/v2/domains/proposals?limit=200').catch(() => []),
        apiGet<any[]>('/api/v2/domains/utilization').catch(() => []),
      ]);
      const norm = (v: any): any[] => (Array.isArray(v) ? v : (v?.data && Array.isArray(v.data) ? v.data : (v?.items && Array.isArray(v.items) ? v.items : [])));
      setDonors(norm(d));
      setGrants(norm(g));
      setProposals(norm(p));
      setUtilization(norm(u));
      // Whitelisted generic tables (idempotent, never fatal)
      const [ag, rep, inst, comp] = await Promise.all([
        apiGet<any[]>('/api/tables/partner_agreements?limit=100').catch(() => []),
        apiGet<any[]>('/api/tables/donor_reports?limit=100').catch(() => []),
        apiGet<any[]>('/api/tables/grant_installments?limit=200').catch(() => []),
        apiGet<any[]>('/api/tables/donor_compliance_requirements?limit=200').catch(() => []),
      ]);
      setAgreements(norm(ag));
      setDonorReports(norm(rep));
      setInstallments(norm(inst));
      setCompliance(norm(comp));
    } catch (e: any) {
      setFetchError(e?.message || (isRtl ? 'تعذر تحميل بيانات التمويل' : 'Failed to load funding data'));
    } finally {
      setLoading(false);
    }
  }, [isRtl]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const stats = useMemo(() => {
    const totalCommitted = grants.reduce((s, g) => s + Number(g.total_amount || 0), 0);
    const totalSpent = grants.reduce((s, g) => s + Number(g.spent_amount || 0), 0);
    const activeGrants = grants.filter((g) => String(g.status || '').toUpperCase() === 'ACTIVE').length;
    const pendingProposals = proposals.filter((p) => ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'].includes(String(p.status || '').toUpperCase())).length;
    const overdue = installments.filter((i) => String(i.status || '').toUpperCase() === 'OVERDUE').length;
    const util = totalCommitted > 0 ? (totalSpent / totalCommitted) * 100 : 0;
    return { totalCommitted, totalSpent, activeGrants, pendingProposals, overdue, util };
  }, [grants, proposals, installments]);

  const filteredDonors = useMemo(() => {
    if (!search) return donors;
    const q = search.toLowerCase();
    return donors.filter((d) => `${d.name_ar || ''} ${d.name_en || ''} ${d.donor_code || ''}`.toLowerCase().includes(q));
  }, [donors, search]);

  const handleCreateDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blockIfTraining()) return;
    if (!donorForm.name_ar.trim()) { setFormError(isRtl ? 'اسم المانح مطلوب' : 'Donor name is required'); return; }
    setSaving(true); setFormError(null);
    try {
      await apiPost('/api/v2/domains/donors', { ...donorForm });
      setShowDonorModal(false);
      setDonorForm({ name_ar: '', name_en: '', donor_type: 'INSTITUTIONAL', country: '' });
      await fetchAll();
    } catch (e: any) { setFormError(e?.message); } finally { setSaving(false); }
  };

  const handleCreateGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blockIfTraining()) return;
    if (!grantForm.title_ar.trim() || !grantForm.grant_number.trim()) {
      setFormError(isRtl ? 'رقم المنحة وعنوانها مطلوبان' : 'Grant number and title are required'); return;
    }
    setSaving(true); setFormError(null);
    try {
      await apiPost('/api/v2/domains/grants', {
        ...grantForm,
        donorId: grantForm.donor_id || undefined,
        totalAmount: Number(grantForm.total_amount || 0),
      });
      setShowGrantModal(false);
      setGrantForm({ donor_id: '', grant_number: '', title_ar: '', title_en: '', total_amount: '', currency_code: 'USD', start_date: '', end_date: '' });
      await fetchAll();
    } catch (e: any) { setFormError(e?.message); } finally { setSaving(false); }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blockIfTraining()) return;
    if (!proposalForm.title_ar.trim()) { setFormError(isRtl ? 'عنوان المقترح مطلوب' : 'Proposal title is required'); return; }
    setSaving(true); setFormError(null);
    try {
      await apiPost('/api/v2/domains/proposals', {
        ...proposalForm,
        donorId: proposalForm.donor_id || undefined,
        proposedAmount: Number(proposalForm.proposed_amount || 0),
      });
      setShowProposalModal(false);
      setProposalForm({ donor_id: '', title_ar: '', title_en: '', proposed_amount: '', currency_code: 'USD' });
      await fetchAll();
    } catch (e: any) { setFormError(e?.message); } finally { setSaving(false); }
  };

  const handleCreateInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blockIfTraining()) return;
    if (!installmentForm.grant_id) { setFormError(isRtl ? 'اختر المنحة' : 'Select a grant'); return; }
    if (!installmentForm.due_date) { setFormError(isRtl ? 'تاريخ الاستحقاق مطلوب' : 'Due date is required'); return; }
    setSaving(true); setFormError(null);
    try {
      await apiPost(`/api/v2/domains/grants/${installmentForm.grant_id}/installments`, {
        installmentNumber: Number(installmentForm.installment_number || 1),
        dueDate: installmentForm.due_date,
        expectedAmount: Number(installmentForm.expected_amount || 0),
        currencyCode: installmentForm.currency_code,
      });
      setShowInstallmentModal(false);
      setInstallmentForm({ grant_id: '', installment_number: '1', due_date: '', expected_amount: '', currency_code: 'USD' });
      await fetchAll();
    } catch (e: any) { setFormError(e?.message); } finally { setSaving(false); }
  };

  const handleReceiveInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blockIfTraining()) return;
    if (!receivingId) return;
    if (!receiveForm.received_amount || Number(receiveForm.received_amount) <= 0) {
      setFormError(isRtl ? 'مبلغ التحصيل مطلوب' : 'Received amount is required'); return;
    }
    setSaving(true); setFormError(null);
    try {
      await apiPost(`/api/v2/domains/installments/${receivingId}/receive`, {
        receivedAmount: Number(receiveForm.received_amount),
        receivedDate: receiveForm.received_date,
        bankReference: receiveForm.bank_reference || undefined,
      });
      setReceivingId(null);
      setReceiveForm({ received_amount: '', received_date: new Date().toISOString().slice(0, 10), bank_reference: '' });
      await fetchAll();
    } catch (e: any) { setFormError(e?.message); } finally { setSaving(false); }
  };

  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [complianceForm, setComplianceForm] = useState({ grant_id: '', requirement_type: 'FINANCIAL_REPORT', description_ar: '', due_date: '' });

  const handleCreateCompliance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blockIfTraining()) return;
    if (!complianceForm.grant_id || !complianceForm.description_ar.trim() || !complianceForm.due_date) {
      setFormError(isRtl ? 'المنحة والوصف والاستحقاق مطلوبة' : 'Grant, description and due date are required'); return;
    }
    setSaving(true); setFormError(null);
    try {
      const res = await fetch('/api/tables/donor_compliance_requirements', {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({
          grant_id: complianceForm.grant_id,
          requirement_type: complianceForm.requirement_type,
          description_ar: complianceForm.description_ar.trim(),
          due_date: complianceForm.due_date,
          frequency: 'ONE_TIME', status: 'PENDING',
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message || json?.error || `HTTP ${res.status}`);
      setShowComplianceModal(false);
      setComplianceForm({ grant_id: '', requirement_type: 'FINANCIAL_REPORT', description_ar: '', due_date: '' });
      await fetchAll();
    } catch (e: any) { setFormError(e?.message); } finally { setSaving(false); }
  };

  const handleCompleteCompliance = async (id: string) => {
    if (blockIfTraining()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tables/donor_compliance_requirements/${id}`, {
        method: 'PUT', headers: getAuthHeaders(),
        body: JSON.stringify({ status: 'COMPLETED', completed_date: new Date().toISOString().slice(0, 10) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchAll();
    } catch (e: any) { setFormError(e?.message); } finally { setSaving(false); }
  };

  const handleIatiExport = async () => {
    setExportingIati(true); setFormError(null);
    try {
      const res = await fetch('/api/operations/iati-export', { headers: getAuthHeaders() });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      const blob = new Blob([typeof json === 'string' ? json : JSON.stringify(json, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `iati-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click(); URL.revokeObjectURL(url);
    } catch (e: any) { setFormError(e?.message); } finally { setExportingIati(false); }
  };

  const handlePrintUtilization = () => {
    const rows = (utilization.length > 0 ? utilization : grants).map((g: any, i: number) => `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'};text-align:center">
        <td style="padding:6px;border:1px solid #cbd5e1;font-weight:bold">${g.grant_number || g.grantNumber || '—'}</td>
        <td style="padding:6px;border:1px solid #cbd5e1;text-align:right">${g.title_ar || g.titleAr || ''}</td>
        <td style="padding:6px;border:1px solid #cbd5e1;font-family:monospace">${fmtMoney(g.total_amount ?? g.totalAmount)} ${g.currency_code || ''}</td>
        <td style="padding:6px;border:1px solid #cbd5e1;font-family:monospace;color:#059669">${fmtMoney(g.spent_amount ?? g.spentAmount)}</td>
        <td style="padding:6px;border:1px solid #cbd5e1;font-weight:bold">${g.utilization_pct ?? g.utilizationPct ?? '—'}%</td>
        <td style="padding:6px;border:1px solid #cbd5e1">${g.status || ''}</td>
      </tr>`).join('');
    printHTML(`<html dir="${isRtl ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"/><title>${isRtl ? 'تقرير استخدام المنح' : 'Grant Utilization'}</title>
      <style>@page{size:A4 landscape;margin:12mm}body{font-family:Tahoma,sans-serif;color:#0f172a}table{width:100%;border-collapse:collapse;font-size:10px}th{background:#0f172a;color:#fff;padding:7px;border:1px solid #334155}</style></head>
      <body><h2>${isRtl ? 'تقرير استخدام المنح (NEB-08 / GM)' : 'Grant Utilization Report (NEB-08 / GM)'}</h2>
      <table><tr><th>${isRtl ? 'رقم المنحة' : 'Grant No'}</th><th>${isRtl ? 'العنوان' : 'Title'}</th><th>${isRtl ? 'المعتمد' : 'Committed'}</th><th>${isRtl ? 'المنصرف' : 'Spent'}</th><th>%</th><th>${isRtl ? 'الحالة' : 'Status'}</th></tr>${rows}</table></body></html>`);
  };

  const TABS: { id: SubTab; ar: string; en: string; icon: any }[] = [
    { id: 'dashboard', ar: 'لوحة التمويل', en: 'Dashboard', icon: BarChart3 },
    { id: 'donors', ar: 'المانحون', en: 'Donors', icon: Users },
    { id: 'grants', ar: 'المنح', en: 'Grants', icon: Coins },
    { id: 'installments', ar: 'الأقساط والتحصيل', en: 'Installments', icon: CalendarClock },
    { id: 'proposals', ar: 'مقترحات التمويل', en: 'Proposals', icon: Send },
    { id: 'reports', ar: 'تقارير المانحين', en: 'Donor Reports', icon: FileText },
    { id: 'agreements', ar: 'اتفاقيات الشراكة', en: 'Agreements', icon: Handshake },
    { id: 'compliance', ar: 'متطلبات الامتثال', en: 'Compliance', icon: ShieldCheck },
    { id: 'utilization', ar: 'الاستخدام وIATI', en: 'Utilization & IATI', icon: Globe },
  ];

  if (loading) return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>;
  if (fetchError) return <div className="p-4"><ErrorState title={isRtl ? 'تعذر التحميل' : 'Load failed'} message={fetchError} onRetry={fetchAll} /></div>;

  return (
    <div className="space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-zinc-950 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/40">
            <Handshake className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-200 rounded text-[10px] font-black font-mono">NEB-08 • GM</span>
              <span className="text-xs text-zinc-300">{isRtl ? 'مانحون → منح → أقساط → تقارير → IATI' : 'Donors → Grants → Installments → Reports → IATI'}</span>
            </div>
            <h2 className="text-lg font-black">{isRtl ? 'وركسبيس الشراكات والتمويل والمانحين' : 'Partnerships & Donor Grants Workspace'}</h2>
            <p className="text-[11px] text-zinc-400">{isRtl ? 'دورة التمويل الكاملة End-to-End بامتثال IPSAS وIATI' : 'Full funding lifecycle e2e with IPSAS & IATI compliance'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <EnterpriseButton variant="primary" size="sm" onClick={handlePrintUtilization}>
            <Printer className="w-3.5 h-3.5" /><span>{isRtl ? 'طباعة استخدام المنح' : 'Print utilization'}</span>
          </EnterpriseButton>
          <EnterpriseButton variant="secondary" size="sm" onClick={fetchAll}>
            <RefreshCw className="w-3.5 h-3.5" /><span>{isRtl ? 'تحديث' : 'Refresh'}</span>
          </EnterpriseButton>
          {onNavigate && (
            <EnterpriseButton variant="secondary" size="sm" onClick={() => onNavigate('reports')}>
              <BarChart3 className="w-3.5 h-3.5" /><span>{isRtl ? 'مركز التقارير' : 'Reports center'}</span>
            </EnterpriseButton>
          )}
        </div>
      </div>

      {training.isTrainingMode && (
        <div className="text-[11px] font-black text-amber-700 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
          {training.blockMessage}
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1.5 overflow-x-auto bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = subTab === t.id;
          return (
            <button key={t.id} onClick={() => setSubTab(t.id)}
              className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black whitespace-nowrap transition-all cursor-pointer border',
                active ? 'bg-emerald-600 text-white border-emerald-500 shadow' : 'bg-slate-50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-100')}>
              <Icon className="w-3.5 h-3.5" />
              {isRtl ? t.ar : t.en}
            </button>
          );
        })}
      </div>

      {/* Dashboard */}
      {subTab === 'dashboard' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            <KpiCard icon={Users} title={isRtl ? 'المانحون' : 'Donors'} value={String(donors.length)} tone="bg-sky-500/10 text-sky-600" />
            <KpiCard icon={Coins} title={isRtl ? 'المنح النشطة' : 'Active grants'} value={String(stats.activeGrants)} sub={`${grants.length} total`} tone="bg-emerald-500/10 text-emerald-600" />
            <KpiCard icon={TrendingUp} title={isRtl ? 'المعتمد' : 'Committed'} value={fmtMoney(stats.totalCommitted)} tone="bg-indigo-500/10 text-indigo-600" />
            <KpiCard icon={BarChart3} title={isRtl ? 'الاستخدام' : 'Utilization'} value={`${stats.util.toFixed(1)}%`} sub={`${fmtMoney(stats.totalSpent)} spent`} tone="bg-amber-500/10 text-amber-600" />
            <KpiCard icon={Send} title={isRtl ? 'مقترحات معلقة' : 'Pending proposals'} value={String(stats.pendingProposals)} tone="bg-purple-500/10 text-purple-600" />
            <KpiCard icon={CalendarClock} title={isRtl ? 'أقساط متأخرة' : 'Overdue'} value={String(stats.overdue)} sub={`${installments.length} installments`} tone="bg-rose-500/10 text-rose-600" />
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4">
            <h3 className="text-sm font-black mb-3 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-600" />{isRtl ? 'تنبيهات الامتثال' : 'Compliance alerts'}</h3>
            {stats.overdue === 0 && stats.pendingProposals === 0 ? (
              <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold"><CheckCircle2 className="w-4 h-4" />{isRtl ? 'لا توجد تنبيهات حرجة — المحفظة التمويلية سليمة' : 'No critical alerts — funding portfolio is healthy'}</div>
            ) : (
              <div className="space-y-2 text-xs">
                {stats.overdue > 0 && <div className="flex items-center gap-2 text-rose-600 font-bold"><AlertTriangle className="w-4 h-4" />{isRtl ? `${stats.overdue} أقساط متأخرة تتطلب المتابعة` : `${stats.overdue} overdue installments need follow-up`}</div>}
                {stats.pendingProposals > 0 && <div className="flex items-center gap-2 text-amber-600 font-bold"><Clock className="w-4 h-4" />{isRtl ? `${stats.pendingProposals} مقترحات بانتظار القرار` : `${stats.pendingProposals} proposals awaiting decision`}</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Donors */}
      {subTab === 'donors' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isRtl ? 'بحث في المانحين...' : 'Search donors...'} className={cn(INPUT_CLS, 'pr-9')} />
            </div>
            <button onClick={() => { setFormError(null); setShowDonorModal(true); }} className={BTN_PRIMARY}><Plus className="w-4 h-4" />{isRtl ? 'مانح جديد' : 'New donor'}</button>
          </div>
          {filteredDonors.length === 0 ? (
            <EmptyState title={isRtl ? 'لا يوجد مانحون' : 'No donors'} description={isRtl ? 'سجل أول مانح لبدء دورة التمويل' : 'Register the first donor to start the funding cycle'} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-zinc-950"><tr>
                  <th className={TH_CLS}>{isRtl ? 'المانح' : 'Donor'}</th>
                  <th className={TH_CLS}>{isRtl ? 'النوع' : 'Type'}</th>
                  <th className={TH_CLS}>{isRtl ? 'الدولة' : 'Country'}</th>
                  <th className={TH_CLS}>{isRtl ? 'الحالة' : 'Status'}</th>
                </tr></thead>
                <tbody>
                  {filteredDonors.map((d) => (
                    <tr key={d.id} className="border-t border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-950/50">
                      <td className={TD_CLS}><div className="font-black">{d.name_ar || d.name_en || '—'}</div><div className="text-[10px] text-slate-400 font-mono">{d.donor_code || d.code || ''}</div></td>
                      <td className={TD_CLS}>{d.donor_type || d.donorType || '—'}</td>
                      <td className={TD_CLS}>{d.country || d.party_country || '—'}</td>
                      <td className={TD_CLS}><StatusBadge status={d.status || 'ACTIVE'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Grants */}
      {subTab === 'grants' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black">{isRtl ? `المنح (${grants.length})` : `Grants (${grants.length})`}</h3>
            <button onClick={() => { setFormError(null); setShowGrantModal(true); }} className={BTN_PRIMARY}><Plus className="w-4 h-4" />{isRtl ? 'منحة جديدة' : 'New grant'}</button>
          </div>
          {grants.length === 0 ? (
            <EmptyState title={isRtl ? 'لا توجد منح' : 'No grants'} description={isRtl ? 'وثق أول منحة واربطها بمانح ومشروع' : 'Record the first grant linked to a donor and project'} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-zinc-950"><tr>
                  <th className={TH_CLS}>{isRtl ? 'الرقم' : 'Number'}</th>
                  <th className={TH_CLS}>{isRtl ? 'العنوان' : 'Title'}</th>
                  <th className={TH_CLS}>{isRtl ? 'المعتمد' : 'Committed'}</th>
                  <th className={TH_CLS}>{isRtl ? 'المنصرف' : 'Spent'}</th>
                  <th className={TH_CLS}>{isRtl ? 'الحالة' : 'Status'}</th>
                </tr></thead>
                <tbody>
                  {grants.map((g) => (
                    <tr key={g.id} className="border-t border-slate-100 dark:border-zinc-800">
                      <td className={cn(TD_CLS, 'font-mono font-bold')}>{g.grant_number || g.grantNumber || '—'}</td>
                      <td className={TD_CLS}>{g.title_ar || g.titleAr || g.title_en || '—'}</td>
                      <td className={cn(TD_CLS, 'font-mono')}>{fmtMoney(g.total_amount ?? g.totalAmount)} {g.currency_code || ''}</td>
                      <td className={cn(TD_CLS, 'font-mono text-emerald-600')}>{fmtMoney(g.spent_amount ?? g.spentAmount)}</td>
                      <td className={TD_CLS}><StatusBadge status={g.status || 'ACTIVE'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Installments — grant → installment → receive (e2e closure) */}
      {subTab === 'installments' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-black">{isRtl ? `الأقساط والتحصيل (${installments.length})` : `Installments & collections (${installments.length})`}</h3>
            <button onClick={() => { setFormError(null); setShowInstallmentModal(true); }} className={BTN_PRIMARY} disabled={grants.length === 0}>
              <Plus className="w-4 h-4" />{isRtl ? 'قسط جديد' : 'New installment'}
            </button>
          </div>
          {formError && subTab === 'installments' && (
            <div className="text-[11px] font-bold text-rose-600 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" />{formError}</div>
          )}
          {installments.length === 0 ? (
            <EmptyState title={isRtl ? 'لا توجد أقساط' : 'No installments'} description={isRtl ? 'أنشئ قسطاً لمنحة ثم حصّله عند الاستلام البنكي' : 'Create an installment for a grant, then collect it on bank receipt'} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-zinc-950"><tr>
                  <th className={TH_CLS}>{isRtl ? 'القسط' : 'No'}</th>
                  <th className={TH_CLS}>{isRtl ? 'الاستحقاق' : 'Due'}</th>
                  <th className={TH_CLS}>{isRtl ? 'المتوقع' : 'Expected'}</th>
                  <th className={TH_CLS}>{isRtl ? 'المحصل' : 'Received'}</th>
                  <th className={TH_CLS}>{isRtl ? 'الحالة' : 'Status'}</th>
                  <th className={TH_CLS}>{isRtl ? 'إجراء' : 'Action'}</th>
                </tr></thead>
                <tbody>
                  {installments.map((ins: any) => {
                    const received = String(ins.status || '').toUpperCase() === 'RECEIVED';
                    return (
                      <tr key={ins.id} className="border-t border-slate-100 dark:border-zinc-800">
                        <td className={cn(TD_CLS, 'font-mono font-bold')}>#{ins.installment_number ?? ins.installmentNumber ?? '—'}</td>
                        <td className={TD_CLS}>{ins.due_date || ins.planned_date || ins.dueDate || '—'}</td>
                        <td className={cn(TD_CLS, 'font-mono')}>{fmtMoney(ins.expected_amount ?? ins.planned_amount ?? ins.amount)} {ins.currency_code || ''}</td>
                        <td className={cn(TD_CLS, 'font-mono text-emerald-600')}>{fmtMoney(ins.received_amount ?? ins.receivedAmount)}</td>
                        <td className={TD_CLS}><StatusBadge status={ins.status || 'PENDING'} /></td>
                        <td className={TD_CLS}>
                          {!received && (
                            <button onClick={() => { setReceivingId(ins.id); setFormError(null); setReceiveForm({ received_amount: String(ins.expected_amount ?? ins.planned_amount ?? ''), received_date: new Date().toISOString().slice(0, 10), bank_reference: '' }); }} className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black cursor-pointer">
                              {isRtl ? 'تحصيل' : 'Collect'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Proposals */}
      {subTab === 'proposals' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black">{isRtl ? `مقترحات التمويل (${proposals.length})` : `Funding proposals (${proposals.length})`}</h3>
            <button onClick={() => { setFormError(null); setShowProposalModal(true); }} className={BTN_PRIMARY}><Plus className="w-4 h-4" />{isRtl ? 'مقترح جديد' : 'New proposal'}</button>
          </div>
          {proposals.length === 0 ? (
            <EmptyState title={isRtl ? 'لا توجد مقترحات' : 'No proposals'} description={isRtl ? 'أنشئ مقترح تمويل واربطه بمانح' : 'Create a funding proposal linked to a donor'} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-zinc-950"><tr>
                  <th className={TH_CLS}>{isRtl ? 'العنوان' : 'Title'}</th>
                  <th className={TH_CLS}>{isRtl ? 'المانح' : 'Donor'}</th>
                  <th className={TH_CLS}>{isRtl ? 'المبلغ' : 'Amount'}</th>
                  <th className={TH_CLS}>{isRtl ? 'الحالة' : 'Status'}</th>
                </tr></thead>
                <tbody>
                  {proposals.map((p) => (
                    <tr key={p.id} className="border-t border-slate-100 dark:border-zinc-800">
                      <td className={TD_CLS}>{p.title_ar || p.titleAr || '—'}</td>
                      <td className={TD_CLS}>{p.donor_name_ar || p.donorName || '—'}</td>
                      <td className={cn(TD_CLS, 'font-mono')}>{fmtMoney(p.proposed_amount ?? p.requested_amount ?? p.requestedAmount)}</td>
                      <td className={TD_CLS}><StatusBadge status={p.status || 'DRAFT'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Donor reports */}
      {subTab === 'reports' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-black">{isRtl ? `تقارير المانحين (${donorReports.length})` : `Donor reports (${donorReports.length})`}</h3>
          {donorReports.length === 0 ? (
            <div className="space-y-2">
              <EmptyState title={isRtl ? 'لا توجد تقارير بعد' : 'No reports yet'} description={isRtl ? 'تقارير المانحين تُنشأ من شاشة العقود أو عبر API التقارير المؤسسية' : 'Donor reports are created from contracts or the institutional reports API'} />
              {onNavigate && (
                <button onClick={() => onNavigate('reports')} className="text-[11px] font-black text-emerald-600 hover:underline cursor-pointer">
                  {isRtl ? '→ فتح مركز التقارير المؤسسية' : '→ Open institutional reports center'}
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-zinc-950"><tr>
                  <th className={TH_CLS}>{isRtl ? 'التقرير' : 'Report'}</th>
                  <th className={TH_CLS}>{isRtl ? 'النوع' : 'Type'}</th>
                  <th className={TH_CLS}>{isRtl ? 'الفترة' : 'Period'}</th>
                  <th className={TH_CLS}>{isRtl ? 'الحالة' : 'Status'}</th>
                </tr></thead>
                <tbody>
                  {donorReports.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100 dark:border-zinc-800">
                      <td className={TD_CLS}>{r.report_code || r.reportCode || r.id?.slice(0, 8) || '—'}</td>
                      <td className={TD_CLS}>{r.report_type || '—'}</td>
                      <td className={TD_CLS}>{r.reporting_period_start || ''} → {r.reporting_period_end || ''}</td>
                      <td className={TD_CLS}><StatusBadge status={r.status || 'PENDING'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Agreements */}
      {subTab === 'agreements' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-black">{isRtl ? `اتفاقيات الشراكة (${agreements.length})` : `Partner agreements (${agreements.length})`}</h3>
          {agreements.length === 0 ? (
            <div className="space-y-2">
              <EmptyState title={isRtl ? 'لا توجد اتفاقيات' : 'No agreements'} description={isRtl ? 'الاتفاقيات تُدار من شاشة العقود — مربوطة هنا تلقائياً' : 'Agreements are managed in Contracts — auto-linked here'} />
              {onNavigate && (
                <button onClick={() => onNavigate('contracts')} className="text-[11px] font-black text-emerald-600 hover:underline cursor-pointer">
                  {isRtl ? '→ فتح شاشة العقود' : '→ Open contracts screen'}
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-zinc-950"><tr>
                  <th className={TH_CLS}>{isRtl ? 'الاتفاقية' : 'Agreement'}</th>
                  <th className={TH_CLS}>{isRtl ? 'النوع' : 'Type'}</th>
                  <th className={TH_CLS}>{isRtl ? 'القيمة' : 'Value'}</th>
                  <th className={TH_CLS}>{isRtl ? 'الحالة' : 'Status'}</th>
                </tr></thead>
                <tbody>
                  {agreements.map((a) => (
                    <tr key={a.id} className="border-t border-slate-100 dark:border-zinc-800">
                      <td className={TD_CLS}>{a.title_ar || a.agreement_code || '—'}</td>
                      <td className={TD_CLS}>{a.agreement_type || '—'}</td>
                      <td className={cn(TD_CLS, 'font-mono')}>{fmtMoney(a.value_usd ?? a.total_value ?? a.totalValue)}</td>
                      <td className={TD_CLS}><StatusBadge status={a.status || 'ACTIVE'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Compliance requirements — donor conditions with due dates & evidence */}
      {subTab === 'compliance' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-black">{isRtl ? `متطلبات الامتثال (${compliance.length})` : `Compliance requirements (${compliance.length})`}</h3>
            <button onClick={() => { setFormError(null); setShowComplianceModal(true); }} className={BTN_PRIMARY} disabled={grants.length === 0}>
              <Plus className="w-4 h-4" />{isRtl ? 'متطلب جديد' : 'New requirement'}
            </button>
          </div>
          {formError && (
            <div className="text-[11px] font-bold text-rose-600 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" />{formError}</div>
          )}
          {compliance.length === 0 ? (
            <EmptyState title={isRtl ? 'لا توجد متطلبات' : 'No requirements'} description={isRtl ? 'وثق شروط المانح (تقارير/تدقيق/زيارات) بتواريخ استحقاق' : 'Record donor conditions (reports/audits/visits) with due dates'} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-zinc-950"><tr>
                  <th className={TH_CLS}>{isRtl ? 'المتطلب' : 'Requirement'}</th>
                  <th className={TH_CLS}>{isRtl ? 'النوع' : 'Type'}</th>
                  <th className={TH_CLS}>{isRtl ? 'الاستحقاق' : 'Due'}</th>
                  <th className={TH_CLS}>{isRtl ? 'الحالة' : 'Status'}</th>
                  <th className={TH_CLS}>{isRtl ? 'إجراء' : 'Action'}</th>
                </tr></thead>
                <tbody>
                  {compliance.map((c: any) => {
                    const done = String(c.status || '').toUpperCase() === 'COMPLETED';
                    const overdue = !done && c.due_date && new Date(c.due_date) < new Date(new Date().toDateString());
                    return (
                      <tr key={c.id} className="border-t border-slate-100 dark:border-zinc-800">
                        <td className={TD_CLS}>{c.description_ar || c.description_en || '—'}</td>
                        <td className={TD_CLS}>{c.requirement_type || '—'}</td>
                        <td className={cn(TD_CLS, 'font-mono', overdue ? 'text-rose-600 font-black' : '')}>{c.due_date || '—'}</td>
                        <td className={TD_CLS}><StatusBadge status={c.status || 'PENDING'} /></td>
                        <td className={TD_CLS}>
                          {!done && (
                            <button onClick={() => handleCompleteCompliance(c.id)} disabled={saving} className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black cursor-pointer disabled:opacity-50">
                              {isRtl ? 'إنجاز' : 'Complete'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Utilization */}
      {subTab === 'utilization' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black">{isRtl ? 'استخدام المنح وIATI' : 'Grant utilization & IATI'}</h3>
            <div className="flex gap-2 flex-wrap">
              <button onClick={handlePrintUtilization} className="px-3 py-2 bg-slate-100 dark:bg-zinc-800 rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"><Printer className="w-3.5 h-3.5" />{isRtl ? 'طباعة' : 'Print'}</button>
              <button onClick={handleIatiExport} disabled={exportingIati} className="px-3 py-2 bg-slate-100 dark:bg-zinc-800 rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"><Download className="w-3.5 h-3.5" />{exportingIati ? (isRtl ? 'جارٍ التصدير...' : 'Exporting...') : 'IATI'}</button>
            </div>
          </div>
          {(utilization.length > 0 ? utilization : grants).length === 0 ? (
            <EmptyState title={isRtl ? 'لا توجد بيانات استخدام' : 'No utilization data'} description={isRtl ? 'سجل منحاً ومصروفات لاحتساب نسب الاستخدام' : 'Record grants and spend to compute utilization'} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-zinc-950"><tr>
                  <th className={TH_CLS}>{isRtl ? 'المنحة' : 'Grant'}</th>
                  <th className={TH_CLS}>{isRtl ? 'المعتمد' : 'Committed'}</th>
                  <th className={TH_CLS}>{isRtl ? 'المنصرف' : 'Spent'}</th>
                  <th className={TH_CLS}>%</th>
                  <th className={TH_CLS}>{isRtl ? 'التقارير' : 'Reports'}</th>
                </tr></thead>
                <tbody>
                  {(utilization.length > 0 ? utilization : grants).map((g: any) => (
                    <tr key={g.grant_id || g.id} className="border-t border-slate-100 dark:border-zinc-800">
                      <td className={TD_CLS}>{g.grant_number || g.grantNumber || g.title_ar || '—'}</td>
                      <td className={cn(TD_CLS, 'font-mono')}>{fmtMoney(g.total_amount ?? g.totalAmount)}</td>
                      <td className={cn(TD_CLS, 'font-mono text-emerald-600')}>{fmtMoney(g.spent_amount ?? g.spentAmount ?? g.total_spent ?? 0)}</td>
                      <td className={cn(TD_CLS, 'font-mono font-black')}>{Number(g.utilization_pct ?? g.utilizationPct ?? 0).toFixed(1)}%</td>
                      <td className={TD_CLS}>{g.reports_count ?? g.reportsCount ?? donorReports.filter((r) => r.grant_id === (g.grant_id || g.id)).length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showDonorModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateDonor} className="bg-white dark:bg-zinc-900 rounded-2xl p-5 w-full max-w-md space-y-3">
            <h3 className="font-black text-sm">{isRtl ? 'مانح جديد' : 'New donor'}</h3>
            {formError && <div className="text-[11px] font-bold text-rose-600 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" />{formError}</div>}
            <div><label className={LABEL_CLS}>{isRtl ? 'الاسم (عربي) *' : 'Name (AR) *'}</label><input value={donorForm.name_ar} onChange={(e) => setDonorForm({ ...donorForm, name_ar: e.target.value })} className={INPUT_CLS} /></div>
            <div><label className={LABEL_CLS}>{isRtl ? 'الاسم (إنجليزي)' : 'Name (EN)'}</label><input value={donorForm.name_en} onChange={(e) => setDonorForm({ ...donorForm, name_en: e.target.value })} className={INPUT_CLS} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={LABEL_CLS}>{isRtl ? 'النوع' : 'Type'}</label>
                <select value={donorForm.donor_type} onChange={(e) => setDonorForm({ ...donorForm, donor_type: e.target.value })} className={INPUT_CLS}>
                  <option value="INSTITUTIONAL">INSTITUTIONAL</option><option value="GOVERNMENT">GOVERNMENT</option>
                  <option value="CORPORATE">CORPORATE</option><option value="INDIVIDUAL">INDIVIDUAL</option>
                </select></div>
              <div><label className={LABEL_CLS}>{isRtl ? 'الدولة' : 'Country'}</label><input value={donorForm.country} onChange={(e) => setDonorForm({ ...donorForm, country: e.target.value })} className={INPUT_CLS} /></div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className={BTN_PRIMARY}>{saving ? <Spinner size="sm" /> : <Plus className="w-4 h-4" />}{isRtl ? 'حفظ' : 'Save'}</button>
              <button type="button" onClick={() => setShowDonorModal(false)} className="px-4 py-2.5 bg-slate-100 dark:bg-zinc-800 rounded-xl text-xs font-bold cursor-pointer">{isRtl ? 'إلغاء' : 'Cancel'}</button>
            </div>
          </form>
        </div>
      )}
      {showGrantModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateGrant} className="bg-white dark:bg-zinc-900 rounded-2xl p-5 w-full max-w-md space-y-3 max-h-[90vh] overflow-y-auto">
            <h3 className="font-black text-sm">{isRtl ? 'منحة جديدة' : 'New grant'}</h3>
            {formError && <div className="text-[11px] font-bold text-rose-600 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" />{formError}</div>}
            <div><label className={LABEL_CLS}>{isRtl ? 'المانح' : 'Donor'}</label>
              <select value={grantForm.donor_id} onChange={(e) => setGrantForm({ ...grantForm, donor_id: e.target.value })} className={INPUT_CLS}>
                <option value="">—</option>{donors.map((d) => <option key={d.id} value={d.id}>{d.name_ar || d.name_en}</option>)}
              </select></div>
            <div><label className={LABEL_CLS}>{isRtl ? 'رقم المنحة *' : 'Grant number *'}</label><input value={grantForm.grant_number} onChange={(e) => setGrantForm({ ...grantForm, grant_number: e.target.value })} className={INPUT_CLS} placeholder="GR-2026-001" /></div>
            <div><label className={LABEL_CLS}>{isRtl ? 'العنوان *' : 'Title *'}</label><input value={grantForm.title_ar} onChange={(e) => setGrantForm({ ...grantForm, title_ar: e.target.value })} className={INPUT_CLS} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={LABEL_CLS}>{isRtl ? 'المبلغ' : 'Amount'}</label><input type="number" min="0" step="0.01" value={grantForm.total_amount} onChange={(e) => setGrantForm({ ...grantForm, total_amount: e.target.value })} className={INPUT_CLS} /></div>
              <div><label className={LABEL_CLS}>{isRtl ? 'العملة' : 'Currency'}</label>
                <select value={grantForm.currency_code} onChange={(e) => setGrantForm({ ...grantForm, currency_code: e.target.value })} className={INPUT_CLS}>
                  <option value="USD">USD</option><option value="YER">YER</option><option value="SAR">SAR</option><option value="EUR">EUR</option>
                </select></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={LABEL_CLS}>{isRtl ? 'البداية' : 'Start'}</label><input type="date" value={grantForm.start_date} onChange={(e) => setGrantForm({ ...grantForm, start_date: e.target.value })} className={INPUT_CLS} /></div>
              <div><label className={LABEL_CLS}>{isRtl ? 'النهاية' : 'End'}</label><input type="date" value={grantForm.end_date} onChange={(e) => setGrantForm({ ...grantForm, end_date: e.target.value })} className={INPUT_CLS} /></div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className={BTN_PRIMARY}>{saving ? <Spinner size="sm" /> : <Plus className="w-4 h-4" />}{isRtl ? 'حفظ' : 'Save'}</button>
              <button type="button" onClick={() => setShowGrantModal(false)} className="px-4 py-2.5 bg-slate-100 dark:bg-zinc-800 rounded-xl text-xs font-bold cursor-pointer">{isRtl ? 'إلغاء' : 'Cancel'}</button>
            </div>
          </form>
        </div>
      )}
      {showProposalModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateProposal} className="bg-white dark:bg-zinc-900 rounded-2xl p-5 w-full max-w-md space-y-3">
            <h3 className="font-black text-sm">{isRtl ? 'مقترح تمويل جديد' : 'New funding proposal'}</h3>
            {formError && <div className="text-[11px] font-bold text-rose-600 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" />{formError}</div>}
            <div><label className={LABEL_CLS}>{isRtl ? 'المانح' : 'Donor'}</label>
              <select value={proposalForm.donor_id} onChange={(e) => setProposalForm({ ...proposalForm, donor_id: e.target.value })} className={INPUT_CLS}>
                <option value="">—</option>{donors.map((d) => <option key={d.id} value={d.id}>{d.name_ar || d.name_en}</option>)}
              </select></div>
            <div><label className={LABEL_CLS}>{isRtl ? 'العنوان *' : 'Title *'}</label><input value={proposalForm.title_ar} onChange={(e) => setProposalForm({ ...proposalForm, title_ar: e.target.value })} className={INPUT_CLS} /></div>
            <div><label className={LABEL_CLS}>{isRtl ? 'المبلغ المطلوب' : 'Requested amount'}</label><input type="number" min="0" step="0.01" value={proposalForm.proposed_amount} onChange={(e) => setProposalForm({ ...proposalForm, proposed_amount: e.target.value })} className={INPUT_CLS} /></div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className={BTN_PRIMARY}>{saving ? <Spinner size="sm" /> : <Plus className="w-4 h-4" />}{isRtl ? 'حفظ' : 'Save'}</button>
              <button type="button" onClick={() => setShowProposalModal(false)} className="px-4 py-2.5 bg-slate-100 dark:bg-zinc-800 rounded-xl text-xs font-bold cursor-pointer">{isRtl ? 'إلغاء' : 'Cancel'}</button>
            </div>
          </form>
        </div>
      )}
      {showInstallmentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateInstallment} className="bg-white dark:bg-zinc-900 rounded-2xl p-5 w-full max-w-md space-y-3">
            <h3 className="font-black text-sm">{isRtl ? 'قسط منحة جديد' : 'New grant installment'}</h3>
            {formError && <div className="text-[11px] font-bold text-rose-600 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" />{formError}</div>}
            <div><label className={LABEL_CLS}>{isRtl ? 'المنحة *' : 'Grant *'}</label>
              <select value={installmentForm.grant_id} onChange={(e) => setInstallmentForm({ ...installmentForm, grant_id: e.target.value })} className={INPUT_CLS}>
                <option value="">—</option>{grants.map((g) => <option key={g.id} value={g.id}>{g.grant_number || g.title_ar || g.id?.slice(0, 8)}</option>)}
              </select></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={LABEL_CLS}>{isRtl ? 'رقم القسط' : 'Number'}</label><input type="number" min="1" value={installmentForm.installment_number} onChange={(e) => setInstallmentForm({ ...installmentForm, installment_number: e.target.value })} className={INPUT_CLS} /></div>
              <div><label className={LABEL_CLS}>{isRtl ? 'الاستحقاق *' : 'Due date *'}</label><input type="date" value={installmentForm.due_date} onChange={(e) => setInstallmentForm({ ...installmentForm, due_date: e.target.value })} className={INPUT_CLS} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={LABEL_CLS}>{isRtl ? 'المبلغ المتوقع' : 'Expected'}</label><input type="number" min="0" step="0.01" value={installmentForm.expected_amount} onChange={(e) => setInstallmentForm({ ...installmentForm, expected_amount: e.target.value })} className={INPUT_CLS} /></div>
              <div><label className={LABEL_CLS}>{isRtl ? 'العملة' : 'Currency'}</label>
                <select value={installmentForm.currency_code} onChange={(e) => setInstallmentForm({ ...installmentForm, currency_code: e.target.value })} className={INPUT_CLS}>
                  <option value="USD">USD</option><option value="YER">YER</option><option value="SAR">SAR</option><option value="EUR">EUR</option>
                </select></div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className={BTN_PRIMARY}>{saving ? <Spinner size="sm" /> : <Plus className="w-4 h-4" />}{isRtl ? 'حفظ' : 'Save'}</button>
              <button type="button" onClick={() => setShowInstallmentModal(false)} className="px-4 py-2.5 bg-slate-100 dark:bg-zinc-800 rounded-xl text-xs font-bold cursor-pointer">{isRtl ? 'إلغاء' : 'Cancel'}</button>
            </div>
          </form>
        </div>
      )}
      {receivingId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleReceiveInstallment} className="bg-white dark:bg-zinc-900 rounded-2xl p-5 w-full max-w-md space-y-3">
            <h3 className="font-black text-sm">{isRtl ? 'تحصيل قسط (استلام بنكي)' : 'Collect installment (bank receipt)'}</h3>
            {formError && <div className="text-[11px] font-bold text-rose-600 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" />{formError}</div>}
            <div><label className={LABEL_CLS}>{isRtl ? 'المبلغ المحصل *' : 'Received amount *'}</label><input type="number" min="0" step="0.01" value={receiveForm.received_amount} onChange={(e) => setReceiveForm({ ...receiveForm, received_amount: e.target.value })} className={INPUT_CLS} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={LABEL_CLS}>{isRtl ? 'تاريخ الاستلام' : 'Receipt date'}</label><input type="date" value={receiveForm.received_date} onChange={(e) => setReceiveForm({ ...receiveForm, received_date: e.target.value })} className={INPUT_CLS} /></div>
              <div><label className={LABEL_CLS}>{isRtl ? 'مرجع البنك' : 'Bank ref'}</label><input value={receiveForm.bank_reference} onChange={(e) => setReceiveForm({ ...receiveForm, bank_reference: e.target.value })} className={INPUT_CLS} placeholder="TRX-…" /></div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className={BTN_PRIMARY}>{saving ? <Spinner size="sm" /> : <CheckCircle2 className="w-4 h-4" />}{isRtl ? 'تأكيد التحصيل' : 'Confirm collection'}</button>
              <button type="button" onClick={() => setReceivingId(null)} className="px-4 py-2.5 bg-slate-100 dark:bg-zinc-800 rounded-xl text-xs font-bold cursor-pointer">{isRtl ? 'إلغاء' : 'Cancel'}</button>
            </div>
          </form>
        </div>
      )}
      {showComplianceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateCompliance} className="bg-white dark:bg-zinc-900 rounded-2xl p-5 w-full max-w-md space-y-3">
            <h3 className="font-black text-sm">{isRtl ? 'متطلب امتثال جديد' : 'New compliance requirement'}</h3>
            {formError && <div className="text-[11px] font-bold text-rose-600 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" />{formError}</div>}
            <div><label className={LABEL_CLS}>{isRtl ? 'المنحة *' : 'Grant *'}</label>
              <select value={complianceForm.grant_id} onChange={(e) => setComplianceForm({ ...complianceForm, grant_id: e.target.value })} className={INPUT_CLS}>
                <option value="">—</option>{grants.map((g) => <option key={g.id} value={g.id}>{g.grant_number || g.title_ar || g.id?.slice(0, 8)}</option>)}
              </select></div>
            <div><label className={LABEL_CLS}>{isRtl ? 'النوع' : 'Type'}</label>
              <select value={complianceForm.requirement_type} onChange={(e) => setComplianceForm({ ...complianceForm, requirement_type: e.target.value })} className={INPUT_CLS}>
                <option value="FINANCIAL_REPORT">FINANCIAL_REPORT</option><option value="NARRATIVE_REPORT">NARRATIVE_REPORT</option>
                <option value="AUDIT">AUDIT</option><option value="VISIT">VISIT</option><option value="OTHER">OTHER</option>
              </select></div>
            <div><label className={LABEL_CLS}>{isRtl ? 'الوصف *' : 'Description *'}</label><input value={complianceForm.description_ar} onChange={(e) => setComplianceForm({ ...complianceForm, description_ar: e.target.value })} className={INPUT_CLS} /></div>
            <div><label className={LABEL_CLS}>{isRtl ? 'الاستحقاق *' : 'Due date *'}</label><input type="date" value={complianceForm.due_date} onChange={(e) => setComplianceForm({ ...complianceForm, due_date: e.target.value })} className={INPUT_CLS} /></div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className={BTN_PRIMARY}>{saving ? <Spinner size="sm" /> : <Plus className="w-4 h-4" />}{isRtl ? 'حفظ' : 'Save'}</button>
              <button type="button" onClick={() => setShowComplianceModal(false)} className="px-4 py-2.5 bg-slate-100 dark:bg-zinc-800 rounded-xl text-xs font-bold cursor-pointer">{isRtl ? 'إلغاء' : 'Cancel'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
