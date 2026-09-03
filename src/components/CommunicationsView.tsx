import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileText, Plus, Search, RefreshCw, Printer, Send, CheckCircle2, XCircle,
  ShieldCheck, Clock, AlertTriangle, Eye, Mail, Upload, Layers,
  Filter, ChevronLeft, ChevronRight, Building2, User, Tag, Calendar,
  FileCheck2, CheckCheck, BellRing, ArrowRight, ArrowLeft
} from 'lucide-react';
import { printHTML } from '../lib/printUtils';
import { buildOfficialArabicMemoPDFHTML } from '../lib/pdfReportGenerator';
import { ActiveTab } from '../core/types/dashboard';

interface CommsViewProps {
  lang: 'ar' | 'en';
  currentUser?: any;
  projects?: any[];
  programs?: any[];
  onNavigate?: (tab: ActiveTab) => void;
}

type DocType = 'MEMO' | 'CIRCULAR' | 'DIRECTIVE' | 'ANNOUNCEMENT' | 'REPLY';
type CommStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'ISSUED' | 'DISTRIBUTED' | 'CLOSED' | 'REJECTED';
type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

interface Communication {
  id: string;
  doc_number?: string;
  doc_type?: DocType;
  subject_ar?: string;
  subject_en?: string;
  body_ar?: string;
  priority?: Priority;
  classification?: string;
  author_name_ar?: string;
  from_entity?: string;
  to_entity?: string;
  linked_entity_type?: string;
  linked_entity_id?: string;
  linked_entity_name?: string;
  status?: CommStatus;
  recipient_count?: number;
  ack_count?: number;
  created_at?: string;
  issue_date?: string;
  references_ar?: string;
  attachments_ar?: string;
  recipients?: any[];
}

interface CommsOverview {
  total?: number;
  pendingApproval?: number;
  urgent?: number;
  byStatus?: Record<string, number>;
  byPriority?: Record<string, number>;
}

const DOC_TYPE_LABELS: Record<DocType, string> = {
  MEMO: 'مذكرة',
  CIRCULAR: 'تعميم',
  DIRECTIVE: 'توجيه',
  ANNOUNCEMENT: 'إعلان',
  REPLY: 'رد رسمي',
};

const DOC_TYPE_EN: Record<DocType, string> = {
  MEMO: 'Memo',
  CIRCULAR: 'Circular',
  DIRECTIVE: 'Directive',
  ANNOUNCEMENT: 'Announcement',
  REPLY: 'Official Reply',
};

const STATUS_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  DRAFT: { ar: 'مسودة', en: 'Draft', color: 'bg-slate-100 text-slate-600 dark:bg-zinc-700 dark:text-zinc-300' },
  SUBMITTED: { ar: 'بإنتظار الإعتماد', en: 'Pending Approval', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
  APPROVED: { ar: 'معتمد', en: 'Approved', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
  ISSUED: { ar: 'صادر', en: 'Issued', color: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400' },
  DISTRIBUTED: { ar: 'موزّع', en: 'Distributed', color: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400' },
  CLOSED: { ar: 'مغلق', en: 'Closed', color: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300' },
  REJECTED: { ar: 'مرفوض', en: 'Rejected', color: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400' },
  VOIDED: { ar: 'ملغى', en: 'Voided', color: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400' },
};

const PRIORITY_LABELS: Record<Priority, { ar: string; en: string; color: string }> = {
  LOW: { ar: 'منخفضة', en: 'Low', color: 'text-slate-500' },
  NORMAL: { ar: 'عادية', en: 'Normal', color: 'text-emerald-600' },
  HIGH: { ar: 'عالية', en: 'High', color: 'text-amber-600' },
  URGENT: { ar: 'عاجلة', en: 'Urgent', color: 'text-rose-600' },
};

function authFetch(input: string, init?: RequestInit): Promise<Response> {
  const token = (typeof window !== 'undefined' && (window as any).__uamex_token) || '';
  const orgId = (typeof window !== 'undefined' && (window as any).__uamex_org) || '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (orgId) headers['x-organization-id'] = String(orgId);
  return fetch(input, { ...init, headers });
}

async function safeJson(res: Response, fallback: any): Promise<any> {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : fallback;
  } catch {
    return fallback;
  }
}

const t = (lang: 'ar' | 'en', ar: string, en: string) => (lang === 'ar' ? ar : en);

export const CommunicationsView: React.FC<CommsViewProps> = ({
  lang,
  currentUser,
  projects = [],
  programs = [],
  onNavigate,
}) => {
  const [comms, setComms] = useState<Communication[]>([]);
  const [overview, setOverview] = useState<CommsOverview>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showComposer, setShowComposer] = useState(false);
  const [selected, setSelected] = useState<Communication | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [toast, setToast] = useState('');

  // Composer state
  const emptyForm = () => ({
    docType: 'MEMO' as DocType,
    subjectAr: '',
    subjectEn: '',
    bodyAr: '',
    priority: 'NORMAL' as Priority,
    classification: 'OFFICIAL' as string,
    fromEntity: currentUser?.name_ar || currentUser?.full_name_ar || 'الإدارة العامة',
    toEntity: '',
    ccEntities: '',
    linkedEntityType: '',
    linkedEntityId: '',
    linkedEntityName: '',
    referencesAr: '',
    recipientsText: '',
    routeTo: 'approval',
  });
  const [form, setForm] = useState(emptyForm());

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  };

  const loadOverview = useCallback(async () => {
    try {
      const res = await authFetch('/api/v2/communications/overview');
      if (!res.ok) return;
      const payload = await safeJson(res, null);
      const body = payload?.data ?? payload;
      if (body) setOverview(body);
    } catch {
      /* non-fatal */
    }
  }, []);

  const load = useCallback(async (p = page, reset = false) => {
    setLoading(true);
    setError('');
    try {
      const q = new URLSearchParams();
      q.set('page', String(p));
      q.set('limit', String(limit));
      if (search.trim()) q.set('search', search.trim());
      if (statusFilter) q.set('status', statusFilter);
      const res = await authFetch(`/api/v2/communications?${q.toString()}`);
      if (!res.ok) {
        setError(`HTTP ${res.status}`);
        return;
      }
      const payload = await safeJson(res, null);
      const body = payload?.data ?? payload;
      const rows = body?.data ?? [];
      setComms(rows);
      setTotal(body?.pagination?.total ?? rows.length);
      setTotalPages(body?.pagination?.totalPages ?? 1);
      setPage(p);
    } catch (err: any) {
      setError(err?.message || 'load failed');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    loadOverview();
    load(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!showComposer && !selected) {
      const timer = window.setTimeout(() => setStatusFilter(''), 0);
      return () => window.clearTimeout(timer);
    }
  }, [showComposer, selected]);

  const slug = (s: string) => s?.toLowerCase()?.replace(/\s+/g, '') || '';
  const isLinkedToProject = (c: Communication) => slug(c.linked_entity_type || '') === 'project';
  const isLinkedToProgram = (c: Communication) => slug(c.linked_entity_type || '') === 'program';

  const linkedProjectName = (id: string) => projects.find(p => String(p.id) === String(id))?.name_en
    || projects.find(p => String(p.id) === String(id))?.name_ar
    || '';
  const linkedProgramName = (id: string) => programs.find(p => String(p.id) === String(id))?.name_ar
    || programs.find(p => String(p.id) === String(id))?.name_en
    || '';

  const displayName = (c: Communication) => {
    if (isLinkedToProject(c)) return (linkedProjectName(c.linked_entity_id || '') || c.linked_entity_name || '');
    if (isLinkedToProgram(c)) return (linkedProgramName(c.linked_entity_id || '') || c.linked_entity_name || '');
    return c.linked_entity_name || '';
  };

  const linkedTarget = (c: Communication): ActiveTab | null => {
    if (isLinkedToProject(c)) return 'projects';
    if (isLinkedToProgram(c)) return 'programs';
    return null;
  };

  const openDetail = async (c: Communication) => {
    setSelected(c);
    setDetailLoading(true);
    try {
      const res = await authFetch(`/api/v2/communications/${c.id}`);
      const payload = await safeJson(res, null);
      const body = payload?.data ?? payload;
      if (body && body.id) setSelected(body);
    } catch {
      /* keep cached */
    } finally {
      setDetailLoading(false);
    }
  };

  const runAction = async (id: string, action: 'submit' | 'approve' | 'reject' | 'issue' | 'distribute' | 'close' | 'acknowledge' | 'delete', note?: string) => {
    setBusyId(id);
    try {
      const method = action === 'delete' ? 'DELETE' : 'POST';
      const body = action === 'reject' || action === 'approve' ? JSON.stringify({ note }) : action === 'issue' ? JSON.stringify({ signedBy: currentUser?.name_ar || currentUser?.full_name_ar }) : undefined;
      const res = await authFetch(`/api/v2/communications/${id}${action === 'delete' ? '' : `/${action}`}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body,
      });
      const payload = await safeJson(res, null);
      if (!res.ok) {
        showToast(payload?.error || `Action failed (${res.status})`);
        return;
      }
      const updated = payload?.data ?? payload;
      if (updated?.id) setSelected(updated);
      showToast(t(lang, 'تم تنفيذ الإجراء بنجاح', 'Action completed'));
      loadOverview();
      await load(page);
    } catch (err: any) {
      showToast(err?.message || 'Action failed');
    } finally {
      setBusyId('');
    }
  };

  const openComposer = () => {
    setForm({
      ...emptyForm(),
      recipientsText: '',
    });
    setShowComposer(true);
  };

  const handleCreate = async () => {
    if (!form.subjectAr.trim()) {
      showToast(t(lang, 'الموضوع مطلوب', 'Subject is required'));
      return;
    }
    if (!form.fromEntity.trim()) {
      showToast(t(lang, 'الجهة المصدرة مطلوبة', 'From entity is required'));
      return;
    }
    setBusyId('create');
    try {
      const recipients = form.recipientsText
        .split('\n')
        .map(x => x.trim())
        .filter(Boolean)
        .map(line => ({
          recipientType: 'DEPARTMENT',
          recipientEntity: line,
          recipientUserId: null,
        }));

      const body = {
        docType: form.docType,
        subjectAr: form.subjectAr,
        subjectEn: form.subjectEn || undefined,
        bodyAr: form.bodyAr || undefined,
        priority: form.priority,
        classification: form.classification,
        fromEntity: form.fromEntity,
        toEntity: form.toEntity || undefined,
        ccEntities: form.ccEntities || undefined,
        referencesAr: form.referencesAr || undefined,
        linkedEntityType: form.linkedEntityType || undefined,
        linkedEntityId: form.linkedEntityId || undefined,
        linkedEntityName: displayNameFromForm(),
        recipients: recipients.length ? recipients : undefined,
        routeTo: form.routeTo,
      };
      const res = await authFetch('/api/v2/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await safeJson(res, null);
      if (!res.ok) {
        showToast(payload?.error || 'Creation failed');
        return;
      }
      const created = payload?.data ?? payload;
      setShowComposer(false);
      showToast(t(lang, 'تم إنشاء المراسلة', 'Communication created'));
      loadOverview();
      await load(1, true);
      if (created?.id) openDetail(created);
    } catch (err: any) {
      showToast(err?.message || 'Creation failed');
    } finally {
      setBusyId('');
    }
  };

  const displayNameFromForm = () => {
    if (form.linkedEntityType === 'project') return form.linkedEntityName.split('::')[1] || form.linkedEntityName;
    if (form.linkedEntityType === 'program') return form.linkedEntityName.split('::')[1] || form.linkedEntityName;
    return '';
  };

  const handlePrintMemo = (c: Communication) => {
    const html = buildOfficialArabicMemoPDFHTML({
      memoNumber: c.doc_number,
      subjectAr: c.subject_ar,
      bodyAr: (c.body_ar || '').split('\n').filter(Boolean),
      fromAr: c.from_entity,
      toAr: c.to_entity,
      referencesAr: c.references_ar,
      preparedBy: c.author_name_ar,
      approvedBy: c.status === 'APPROVED' || c.status === 'ISSUED' || c.status === 'DISTRIBUTED' ? c.author_name_ar : undefined,
      dateGregorian: c.issue_date ? new Date(c.issue_date).toISOString().split('T')[0] : undefined,
    });
    printHTML(html);
  };

  const filteredForTable = useMemo(() => comms, [comms]);

  const kpi = (label: string, value: number | undefined, icon: React.ReactNode, color: string) => (
    <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <div className="text-lg font-extrabold text-slate-800 dark:text-zinc-100 leading-none">{value ?? 0}</div>
        <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">{label}</div>
      </div>
    </div>
  );

  const statusBadge = (s?: string) => {
    const meta = STATUS_LABELS[s || ''] || STATUS_LABELS.DRAFT;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${meta.color}`}>
        {lang === 'ar' ? meta.ar : meta.en}
      </span>
    );
  };

  const priorityBadge = (p?: Priority) => {
    const meta = PRIORITY_LABELS[p || 'NORMAL'];
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${meta.color}`}>
        <AlertTriangle size={12} />
        {lang === 'ar' ? meta.ar : meta.en}
      </span>
    );
  };

  const actionButtons = (c: Communication) => {
    const st = c.status || 'DRAFT';
    const btn = (action: string, label: string, icon: React.ReactNode, cls: string) => (
      <button
        key={action}
        onClick={() => runAction(c.id, action as any)}
        disabled={busyId === c.id}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition disabled:opacity-50 ${cls}`}
      >
        {icon}{label}
      </button>
    );
    return (
      <div className="flex flex-wrap gap-1.5 items-center">
        {st === 'DRAFT' && btn('submit', t(lang, 'إرسال للإعتماد', 'Submit'), <Send size={12} />, 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20')}
        {st === 'SUBMITTED' && (
          <>
            {btn('approve', t(lang, 'إعتماد', 'Approve'), <CheckCircle2 size={12} />, 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20')}
            {btn('reject', t(lang, 'رفض', 'Reject'), <XCircle size={12} />, 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20')}
          </>
        )}
        {st === 'APPROVED' && btn('issue', t(lang, 'إصدار', 'Issue'), <FileCheck2 size={12} />, 'bg-sky-500/10 text-sky-600 hover:bg-sky-500/20')}
        {st === 'ISSUED' && btn('distribute', t(lang, 'توزيع', 'Distribute'), <Upload size={12} />, 'bg-violet-500/10 text-violet-600 hover:bg-violet-500/20')}
        {st === 'DISTRIBUTED' && btn('close', t(lang, 'إغلاق', 'Close'), <CheckCheck size={12} />, 'bg-zinc-500/10 text-zinc-600 hover:bg-zinc-500/20')}
        {(st === 'DRAFT' || st === 'REJECTED') && btn('delete', t(lang, 'حذف', 'Delete'), <XCircle size={12} />, 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20')}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-5 h-full overflow-y-auto bg-slate-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-800 dark:text-zinc-100">
              {t(lang, 'نظام الاتصال الإداري الذكي', 'Intelligent Administrative Communications')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {t(lang, 'NEB-11 · مراسلات ومذكرات وتعميمات وتوجيهات بوحدة اعتماد وتوزيع مترابطة', 'NEB-11 · Memoranda & directives with approval and distribution registry')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { loadOverview(); load(page); }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800">
            <RefreshCw size={14} /> {t(lang, 'تحديث', 'Refresh')}
          </button>
          <button onClick={openComposer} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20">
            <Plus size={15} /> {t(lang, 'مراسلة جديدة', 'New Communication')}
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpi(t(lang, 'إجمالي المراسلات', 'Total'), overview.total, <Mail size={16} />, 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15')}
        {kpi(t(lang, 'بإنتظار الإعتماد', 'Pending Approval'), overview.pendingApproval, <Clock size={16} />, 'bg-amber-100 text-amber-600 dark:bg-amber-500/15')}
        {kpi(t(lang, 'عاجلة', 'Urgent'), overview.urgent, <AlertTriangle size={16} />, 'bg-rose-100 text-rose-600 dark:bg-rose-500/15')}
        {kpi(t(lang, 'موزّعة', 'Distributed'), overview.byStatus?.DISTRIBUTED, <Upload size={16} />, 'bg-violet-100 text-violet-600 dark:bg-violet-500/15')}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            onKeyDown={e => { if (e.key === 'Enter') { setPage(1); load(1); } }}
            placeholder={t(lang, 'بحث بالرقم أو الموضوع أو الجهة...', 'Search by number, subject or entity...')}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 outline-none"
        >
          <option value="">{t(lang, 'كل الحالات', 'All statuses')}</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{lang === 'ar' ? v.ar : v.en}</option>
          ))}
        </select>
        <button onClick={() => { setPage(1); load(1); }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800">
          <Filter size={14} /> {t(lang, 'تصفية', 'Filter')}
        </button>
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">...</div>
        ) : filteredForTable.length === 0 ? (
          <div className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-500 mb-3">
              <Mail size={24} />
            </div>
            <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400">
              {t(lang, 'لا توجد مراسلات بعد — أنشئ أول مراسلة', 'No communications yet — create your first one')}
            </p>
          </div>
        ) : (
          filteredForTable.map(c => {
            const st = STATUS_LABELS[c.status || 'DRAFT'];
            const target = linkedTarget(c);
            const linkName = displayName(c);
            return (
              <div key={c.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-4 shadow-sm hover:shadow-md transition cursor-pointer"
                onClick={() => openDetail(c)}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${st.color} text-xs font-black`}>
                      {(DOC_TYPE_LABELS[c.doc_type || 'MEMO']||'م').slice(0,1)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 truncate">
                          {c.subject_ar || c.subject_en}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{c.doc_number}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
                        <span className="inline-flex items-center gap-1">
                          <Building2 size={11} /> {c.from_entity}
                        </span>
                        {c.to_entity && <span>→ {c.to_entity}</span>}
                        {linkName && target && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold">
                            <Layers size={11} />
                            {linkName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-2">
                      {statusBadge(c.status)}
                    </div>
                    {priorityBadge(c.priority)}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Upload size={11} /> {c.recipient_count ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CheckCheck size={11} /> {c.ack_count ?? 0}
                    </span>
                    {c.issue_date && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={11} /> {new Date(c.issue_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div onClick={e => e.stopPropagation()} className="flex items-center gap-2">
                    <button onClick={() => handlePrintMemo(c)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700">
                      <Printer size={12} /> PDF
                    </button>
                    {actionButtons(c)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">{t(lang, 'إجمالي', 'Total')}: {total}</span>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => load(page - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 disabled:opacity-40">
              <ChevronLeft size={15} />
            </button>
            <span className="px-3 text-xs text-slate-500">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => load(page + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 disabled:opacity-40">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Summary footer */}
      <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-2.5 flex flex-wrap items-center gap-3 text-[11px]">
        <span className="font-semibold text-slate-400">{t(lang, 'أنواع المستندات', 'Doc types')}:</span>
        {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
          <span key={k} className="text-slate-600 dark:text-zinc-300">{lang === 'ar' ? v : DOC_TYPE_EN[k as DocType]}</span>
        ))}
      </div>

      {/* Composer Modal */}
      {showComposer && (
        <ModalWrapper onClose={() => setShowComposer(false)} title={t(lang, 'إنشاء مراسلة رسمية', 'New Official Communication')}>
          <div className="space-y-3">
            <FieldRow label={t(lang, 'نوع المستند', 'Document type')}>
              <select value={form.docType} onChange={e => setForm({ ...form, docType: e.target.value as DocType })}
                className="comm-input">
                {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{lang === 'ar' ? v : DOC_TYPE_EN[k as DocType]}</option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label={`${t(lang, 'الموضوع', 'Subject')} *`}>
              <input value={form.subjectAr} onChange={e => setForm({ ...form, subjectAr: e.target.value })} className="comm-input"
                placeholder={t(lang, 'موضوع المراسلة بالعربية', 'Subject (Arabic)')} />
            </FieldRow>
            <FieldRow label={t(lang, 'الموضوع (إنجليزي)', 'Subject (English)')}>
              <input value={form.subjectEn} onChange={e => setForm({ ...form, subjectEn: e.target.value })} className="comm-input"
                placeholder="Subject (optional)" dir="ltr" />
            </FieldRow>
            <FieldRow label={t(lang, 'نص المراسلة', 'Body')}>
              <textarea value={form.bodyAr} onChange={e => setForm({ ...form, bodyAr: e.target.value })} rows={4} className="comm-input"
                placeholder={t(lang, 'محتوى المراسلة...', 'Communication body...')} />
            </FieldRow>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FieldRow label={t(lang, 'الجهة المصدرة', 'From entity')}>
                <input value={form.fromEntity} onChange={e => setForm({ ...form, fromEntity: e.target.value })} className="comm-input" />
              </FieldRow>
              <FieldRow label={t(lang, 'الجهة المستهدفة', 'To entity')}>
                <input value={form.toEntity} onChange={e => setForm({ ...form, toEntity: e.target.value })} className="comm-input" />
              </FieldRow>
            </div>
            <FieldRow label={t(lang, 'مستندات مرجعية', 'References')}>
              <input value={form.referencesAr} onChange={e => setForm({ ...form, referencesAr: e.target.value })} className="comm-input" />
            </FieldRow>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FieldRow label={t(lang, 'الأولوية', 'Priority')}>
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Priority })} className="comm-input">
                  {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{lang === 'ar' ? v.ar : v.en}</option>
                  ))}
                </select>
              </FieldRow>
              <FieldRow label={t(lang, 'التصنيف', 'Classification')}>
                <select value={form.classification} onChange={e => setForm({ ...form, classification: e.target.value })} className="comm-input">
                  <option value="OFFICIAL">{t(lang, 'رسمي', 'Official')}</option>
                  <option value="CONFIDENTIAL">{t(lang, 'سري', 'Confidential')}</option>
                  <option value="RESTRICTED">{t(lang, 'مقيد', 'Restricted')}</option>
                  <option value="PUBLIC">{t(lang, 'عام', 'Public')}</option>
                </select>
              </FieldRow>
            </div>
            {/* Cross-unit link */}
            <FieldRow label={t(lang, 'الربط التكاملي (وحدة/مشروع)', 'Cross-unit link (program/project)')}>
              <select
                value={`${form.linkedEntityType}::${form.linkedEntityId || ''}`}
                onChange={e => {
                  const [type, id] = e.target.value.split('::');
                  setForm({ ...form, linkedEntityType: type === 'NONE' ? '' : type, linkedEntityId: id || '' });
                }}
                className="comm-input"
              >
                <option value="NONE::">{t(lang, 'بدون ربط', 'No link')}</option>
                <optgroup label={t(lang, 'البرامج', 'Programs')}>
                  {programs.map(p => (
                    <option key={p.id} value={`program::${p.id}::${p.name_ar || p.name_en || ''}`}>
                      {p.name_ar || p.name_en}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={t(lang, 'المشاريع', 'Projects')}>
                  {projects.map(p => (
                    <option key={p.id} value={`project::${p.id}::${p.name_en || p.name_ar || ''}`}>
                      {p.name_en || p.name_ar}
                    </option>
                  ))}
                </optgroup>
              </select>
            </FieldRow>
            <FieldRow label={t(lang, 'جهات التوزيع (سطر لكل جهة)', 'Distribution list (one per line)')}>
              <textarea value={form.recipientsText} onChange={e => setForm({ ...form, recipientsText: e.target.value })} rows={2} className="comm-input"
                placeholder={t(lang, 'إدارة المشاريع\nالفرق الميدانية - تعز', 'Projects Dept.\nField Teams - Taiz')} />
            </FieldRow>
            <FieldRow label={t(lang, 'مسار الإرسال', 'Send route')}>
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-300">
                <input type="checkbox" checked={form.routeTo === 'approval'}
                  onChange={e => setForm({ ...form, routeTo: e.target.checked ? 'approval' : 'draft' })} />
                {t(lang, 'إرسال مباشرة لوحدة الاعتماد', 'Route straight to approval')}
              </label>
            </FieldRow>
          </div>
          <div className="flex items-center justify-end gap-2 mt-4">
            <button onClick={() => setShowComposer(false)} className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
              {t(lang, 'إلغاء', 'Cancel')}
            </button>
            <button onClick={handleCreate} disabled={busyId === 'create'}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50">
              <Send size={14} /> {t(lang, 'إنشاء', 'Create')}
            </button>
          </div>
        </ModalWrapper>
      )}

      {/* Detail Modal */}
      {selected && (
        <ModalWrapper onClose={() => setSelected(null)} title={`${DOC_TYPE_LABELS[selected.doc_type || 'MEMO']} — ${selected.doc_number || ''}`}>
          {detailLoading ? (
            <div className="py-10 text-center text-slate-400">...</div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {statusBadge(selected.status)}
                {priorityBadge(selected.priority)}
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-[11px] text-slate-500">
                  {selected.classification}
                </span>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-zinc-100">{selected.subject_ar || selected.subject_en}</h3>
                {selected.subject_en && <p className="text-xs text-slate-400 mt-0.5">{selected.subject_en}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <InfoItem label={t(lang, 'من', 'From')} value={selected.from_entity} icon={<Building2 size={12} />} />
                <InfoItem label={t(lang, 'إلى', 'To')} value={selected.to_entity} icon={<Building2 size={12} />} />
                <InfoItem label={t(lang, 'الرقم المرجعي', 'Reference')} value={selected.doc_number} icon={<Tag size={12} />} />
                <InfoItem label={t(lang, 'تاريخ الإصدار', 'Issue date')} value={selected.issue_date ? new Date(selected.issue_date).toLocaleDateString() : '—'} icon={<Calendar size={12} />} />
              </div>

              {displayName(selected) && linkedTarget(selected) && (
                <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20">
                  <span className="text-xs text-sky-700 dark:text-sky-400 font-semibold inline-flex items-center gap-2">
                    <Layers size={13} /> {t(lang, 'مربوطة بـ', 'Linked to')}: {displayName(selected)}
                  </span>
                  <button onClick={() => { onNavigate?.(linkedTarget(selected)!); setSelected(null); }}
                    className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1">
                    {t(lang, 'فتح الوحدة', 'Open unit')} {lang === 'ar' ? <ArrowLeft size={12} /> : <ArrowRight size={12} />}
                  </button>
                </div>
              )}

              {selected.body_ar && (
                <div className="px-3 py-3 rounded-lg bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 text-sm text-slate-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {selected.body_ar}
                </div>
              )}

              {selected.references_ar && (
                <p className="text-[11px] text-slate-400">
                  <strong>{t(lang, 'مراجع:', 'Refs:')}</strong> {selected.references_ar}
                </p>
              )}

              {/* Recipients */}
              <div>
                <div className="text-xs font-bold text-slate-600 dark:text-zinc-300 mb-2">
                  {t(lang, 'سجل التوزيع', 'Distribution registry')} ({selected.recipients?.length || 0})
                </div>
                {selected.recipients && selected.recipients.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selected.recipients.map(r => (
                      <div key={r.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                        <User size={13} className="text-slate-400 shrink-0" />
                        <span className="text-xs text-slate-700 dark:text-zinc-200 flex-1">{r.recipient_entity}</span>
                        <span className={`text-[10px] font-semibold ${r.status === 'ACKNOWLEDGED' ? 'text-emerald-500' : r.status === 'DELIVERED' ? 'text-violet-500' : 'text-slate-400'}`}>
                          {r.status || 'PENDING'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">{t(lang, 'لا توجد جهات توزيع مسجلة', 'No distribution entries')}</p>
                )}
              </div>

              <div onClick={e => e.stopPropagation()} className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button onClick={() => handlePrintMemo(selected)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800">
                  <Printer size={14} /> PDF
                </button>
                {actionButtons(selected)}
              </div>
            </div>
          )}
        </ModalWrapper>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[100] px-4 py-3 rounded-lg bg-emerald-600 text-white text-sm font-semibold shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
};

const ModalWrapper: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[90] flex items-start justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
    <div className="w-full max-w-2xl my-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-zinc-800">
        <h2 className="text-sm font-extrabold text-slate-800 dark:text-zinc-100">{title}</h2>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800">
          <XCircle size={16} />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

const FieldRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">{label}</label>
    {children}
  </div>
);

const InfoItem: React.FC<{ label: string; value?: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
    <span className="text-slate-400">{icon}</span>
    <span className="text-slate-400">{label}:</span>
    <span className="text-slate-700 dark:text-zinc-200 font-semibold flex-1">{value || '—'}</span>
  </div>
);

export default CommunicationsView;
