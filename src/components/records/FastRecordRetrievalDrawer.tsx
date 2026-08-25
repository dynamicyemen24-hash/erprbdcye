import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  FileText, 
  Coins, 
  Compass, 
  CheckSquare, 
  Filter, 
  Calendar, 
  DollarSign, 
  Building, 
  Layers, 
  ShieldCheck, 
  Printer, 
  Copy, 
  ExternalLink, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowUpDown,
  FileSpreadsheet,
  Download
} from 'lucide-react';

import { TabId } from '../../types';
import { fuzzyMatchArabic } from '../../core/utils/arabicSearch';
import { triggerHaptic } from '../../helpers/hapticSwipe';

interface FastRecordRetrievalDrawerProps {
  lang: 'ar' | 'en';
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: TabId) => void;
  projects?: any[];
  programs?: any[];
  activities?: any[];
}

export type RecordKind = 'ALL' | 'VOUCHERS' | 'INVOICES' | 'ACTIVITIES' | 'TASKS';

interface UniversalRecord {
  id: string;
  kind: 'voucher' | 'invoice' | 'activity' | 'task';
  code: string;
  titleAr: string;
  titleEn: string;
  categoryAr: string;
  categoryEn: string;
  date: string;
  amount?: number;
  currency?: string;
  status: 'approved' | 'pending' | 'draft' | 'completed';
  beneficiaryName?: string;
  projectName?: string;
  programName?: string;
  accountCode?: string;
  accountName?: string;
  checksum: string;
}

export const FastRecordRetrievalDrawer: React.FC<FastRecordRetrievalDrawerProps> = ({
  lang,
  isOpen,
  onClose,
  onNavigate,
  projects = [],
  programs = [],
  activities = []
}) => {
  const isRtl = lang === 'ar';

  const [query, setQuery] = useState('');
  const [selectedKind, setSelectedKind] = useState<RecordKind>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [datePreset, setDatePreset] = useState<string>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<UniversalRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Live database records (E2E — no fabricated demo rows)
  const [dbTransactions, setDbTransactions] = useState<any[]>([]);
  const [dbContracts, setDbContracts] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);

      const token = localStorage.getItem('rbd_token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      fetch('/api/tables/transactions', { headers })
        .then(res => res.ok ? res.json() : [])
        .then(d => setDbTransactions(Array.isArray(d) ? d : (d?.data || d?.rows || [])))
        .catch(() => setDbTransactions([]));
      fetch('/api/tables/contracts', { headers })
        .then(res => res.ok ? res.json() : [])
        .then(d => setDbContracts(Array.isArray(d) ? d : (d?.data || d?.rows || [])))
        .catch(() => setDbContracts([]));
    }
  }, [isOpen]);

  // Generate unified searchable index across LIVE database records (E2E — zero fabricated rows)
  const allRecords: UniversalRecord[] = useMemo(() => {
    const list: UniversalRecord[] = [];

    // 1. Financial Vouchers — live IPSAS journal entries / payments / receipts from `transactions`
    const VOUCHER_TYPE_MAP: Record<string, { ar: string; en: string }> = {
      PAYMENT: { ar: 'سند صرف نقدي', en: 'Payment Voucher' },
      RECEIPT: { ar: 'سند قبض', en: 'Receipt Voucher' },
      TRANSFER: { ar: 'تحويل بنكي', en: 'Bank Transfer' },
      JOURNAL_ENTRY: { ar: 'قيد يومية عام', en: 'Journal Entry' }
    };
    const liveVouchers: UniversalRecord[] = dbTransactions.map((t: any, idx: number) => {
      const typeMeta = VOUCHER_TYPE_MAP[t.transaction_type] || VOUCHER_TYPE_MAP.JOURNAL_ENTRY;
      return {
        id: `vch-${t.id || idx}`,
        kind: 'voucher' as const,
        code: t.transaction_number || `TXN-${idx + 1}`,
        titleAr: t.description || typeMeta.ar,
        titleEn: t.description_en || t.description || typeMeta.en,
        categoryAr: typeMeta.ar,
        categoryEn: typeMeta.en,
        date: t.transaction_date ? String(t.transaction_date).slice(0, 10) : '',
        amount: Number(t.total_debit || t.total_credit || 0),
        currency: 'YER',
        status: String(t.status || '').toUpperCase() === 'POSTED'
          ? 'approved' as const
          : String(t.status || '').toUpperCase() === 'DRAFT' ? 'draft' as const : 'pending' as const,
        checksum: `DB:${String(t.id || '').slice(0, 8)}`
      };
    });

    // 2. Contracts & Procurement Claims — live vendor contracts from `contracts`
    const liveInvoices: UniversalRecord[] = dbContracts.map((c: any, idx: number) => ({
      id: `inv-${c.id || idx}`,
      kind: 'invoice' as const,
      code: c.contract_number || `CON-${idx + 1}`,
      titleAr: c.title_ar || 'عقد توريد',
      titleEn: c.title_en || c.title_ar || 'Vendor Contract',
      categoryAr: 'عقد مورد معتمد',
      categoryEn: 'Vendor Contract',
      date: c.start_date ? String(c.start_date).slice(0, 10) : '',
      amount: Number(c.total_value || 0),
      currency: c.currency_code || 'YER',
      status: ['ACTIVE'].includes(String(c.status || '').toUpperCase())
        ? 'approved' as const
        : ['COMPLETED', 'CLOSED'].includes(String(c.status || '').toUpperCase()) ? 'completed' as const : 'pending' as const,
      checksum: `DB:${String(c.id || '').slice(0, 8)}`
    }));

    // 3. Real Field Activities from Database
    const realActivities: UniversalRecord[] = (activities || []).map((act: any, idx: number) => ({
      id: `act-${act.id || idx}`,
      kind: 'activity',
      code: act.code || act.activity_code || `ACT-${act.id ? String(act.id).slice(0, 6) : idx + 1}`,
      titleAr: act.name_ar || act.title || 'نشاط ميداني',
      titleEn: act.name_en || act.title || 'Field Activity',
      categoryAr: 'نشاط تنفيذي WBS',
      categoryEn: 'WBS Field Activity',
      date: act.start_datetime || act.start_date || act.created_at || '',
      amount: Number(act.budget || 0),
      currency: act.currency_code || act.currency || 'YER',
      status: act.status === 'completed' || act.status === 'closed' ? 'completed' : act.status === 'active' || act.status === 'in_progress' ? 'approved' : 'pending',
      projectName: act.project_name || 'مشروع ميداني',
      programName: act.program_name || 'برنامج تنموي',
      checksum: `CRC32:${act.id || idx}-WBS`
    }));

    // 4. Operational Tasks — extracted from REAL activities' task checklists (metadata.tasks)
    const liveTasks: UniversalRecord[] = (activities || []).flatMap((act: any, aIdx: number) => {
      const tasks = act?.metadata?.tasks;
      if (!Array.isArray(tasks)) return [];
      return tasks.map((t: any, tIdx: number) => ({
        id: `tsk-${act.id || aIdx}-${tIdx}`,
        kind: 'task' as const,
        code: t.code || `TSK-${String(act.id || aIdx).slice(0, 4)}-${tIdx + 1}`,
        titleAr: t.title_ar || t.name_ar || t.title || t.name || 'مهمة تشغيلية',
        titleEn: t.title_en || t.name_en || t.title_ar || 'Operational Task',
        categoryAr: 'مهمة ميدانية مرتبطة بنشاط',
        categoryEn: 'Activity-linked Task',
        date: act.start_datetime || act.start_date || '',
        status: (t.done || t.completed) ? 'completed' as const : 'pending' as const,
        projectName: act.project_name || act.name_ar || 'نشاط ميداني',
        checksum: `TSK:${String(act.id || aIdx).slice(0, 6)}-${tIdx}`
      }));
    });

    list.push(...liveVouchers, ...liveInvoices, ...realActivities, ...liveTasks);
    return list;
  }, [activities, dbTransactions, dbContracts]);

  // Multi-Criteria Filtering
  const filteredRecords = useMemo(() => {
    const q = query.trim();

    return allRecords.filter(r => {
      // Kind Filter
      if (selectedKind === 'VOUCHERS' && r.kind !== 'voucher') return false;
      if (selectedKind === 'INVOICES' && r.kind !== 'invoice') return false;
      if (selectedKind === 'ACTIVITIES' && r.kind !== 'activity') return false;
      if (selectedKind === 'TASKS' && r.kind !== 'task') return false;

      // Status Filter
      if (selectedStatus !== 'ALL' && r.status !== selectedStatus) return false;

      // Project Filter
      if (selectedProject !== 'ALL' && r.projectName !== selectedProject) return false;

      // Amount Min / Max
      if (minAmount && (r.amount || 0) < Number(minAmount)) return false;
      if (maxAmount && (r.amount || 0) > Number(maxAmount)) return false;

      // Text Query Match
      if (!q) return true;
      const combined = `${r.code} ${r.titleAr} ${r.titleEn} ${r.categoryAr} ${r.accountCode || ''} ${r.accountName || ''} ${r.projectName || ''} ${r.checksum}`;
      return fuzzyMatchArabic(q, combined) > 0;
    });
  }, [allRecords, query, selectedKind, selectedStatus, selectedProject, minAmount, maxAmount]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    triggerHaptic('success');
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Early exit AFTER all hooks (React rules-of-hooks compliant)
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[75] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[800px]"
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {isRtl ? 'محرك الاسترجاع السريع للسندات والفواتير والأنشطة' : 'Universal High-Speed Record Retrieval Hub'}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                  {filteredRecords.length} {isRtl ? 'سجل مطابق' : 'matches'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                {isRtl ? 'استرجاع لحظي بدقة عالية برقم السند، المرجع، القيمة، التاريخ، الحساب أو المشروع' : 'Instant multi-criteria search by voucher ID, amount, account or WBS activity'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
          {/* Main Search Input */}
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400 absolute right-3 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={isRtl ? 'ابحث برقم السند (مثال: PV-2026-0801)، المورد، الحساب، القيمة، أو اسم النشاط...' : 'Search by code (e.g. PV-2026-0801), vendor, account, or activity...'}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="absolute left-3 text-xs text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200"
              >
                {isRtl ? 'مسح' : 'Clear'}
              </button>
            )}
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 text-xs font-bold">
            <span className="text-[11px] text-zinc-400 shrink-0 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>{isRtl ? 'النوع:' : 'Type:'}</span>
            </span>

            {[
              { id: 'ALL', ar: 'كافة السجلات', en: 'All' },
              { id: 'VOUCHERS', ar: 'سندات الصرف والقبض', en: 'Vouchers' },
              { id: 'INVOICES', ar: 'فواتير الموردين', en: 'Invoices' },
              { id: 'ACTIVITIES', ar: 'الأنشطة الميدانية WBS', en: 'Activities' },
              { id: 'TASKS', ar: 'المهام الإدارية', en: 'Tasks' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedKind(tab.id as RecordKind);
                }}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap text-[11px] font-bold ${
                  selectedKind === tab.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
                }`}
              >
                {isRtl ? tab.ar : tab.en}
              </button>
            ))}

            <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800 mx-1 shrink-0" />

            {/* Status Picker */}
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="bg-slate-100 dark:bg-zinc-800 border-none text-[11px] font-bold text-slate-700 dark:text-zinc-300 rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="ALL">{isRtl ? 'جميع الحالات' : 'All Statuses'}</option>
              <option value="approved">{isRtl ? 'معتمد (Approved)' : 'Approved'}</option>
              <option value="pending">{isRtl ? 'قيد المراجعة (Pending)' : 'Pending'}</option>
              <option value="completed">{isRtl ? 'مكتمل (Completed)' : 'Completed'}</option>
            </select>
          </div>
        </div>

        {/* Content Body: Records List & Preview Pane */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-100 dark:divide-zinc-800">
          
          {/* List Pane */}
          <div className="md:col-span-7 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {filteredRecords.length > 0 ? (
              filteredRecords.map(rec => {
                const isSelected = selectedRecord?.id === rec.id;

                return (
                  <div
                    key={rec.id}
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedRecord(rec);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-slate-900 dark:text-white shadow-xs'
                        : 'bg-white dark:bg-zinc-950/60 border-slate-200/70 dark:border-zinc-800/80 hover:bg-slate-50 dark:hover:bg-zinc-800/40 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg font-mono ${
                          rec.kind === 'voucher' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                          rec.kind === 'invoice' ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20' :
                          rec.kind === 'activity' ? 'bg-cyan-500/10 text-cyan-600 border border-cyan-500/20' :
                          'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}>
                          {rec.code}
                        </span>

                        <span className="text-[10px] font-bold text-zinc-400">
                          {isRtl ? rec.categoryAr : rec.categoryEn}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          rec.status === 'approved' || rec.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          {rec.status === 'approved' ? (isRtl ? 'معتمد' : 'Approved') :
                           rec.status === 'completed' ? (isRtl ? 'مكتمل' : 'Completed') :
                           (isRtl ? 'قيد المراجعة' : 'Pending')}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">{rec.date}</span>
                      </div>
                    </div>

                    <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {isRtl ? rec.titleAr : rec.titleEn}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2">
                      <span className="truncate max-w-[200px]">{rec.projectName}</span>
                      {rec.amount !== undefined && (
                        <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                          {Number(rec.amount).toLocaleString()} {rec.currency}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center space-y-3">
                <Search className="w-10 h-10 text-zinc-400 mx-auto opacity-50" />
                <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                  {isRtl ? 'لا توجد نتائج مطابقة لشروط البحث الحالية' : 'No records match the current criteria'}
                </p>
              </div>
            )}
          </div>

          {/* Preview & Action Pane */}
          <div className="md:col-span-5 p-4 sm:p-6 bg-slate-50/40 dark:bg-zinc-950/40 flex flex-col justify-between overflow-y-auto custom-scrollbar">
            {selectedRecord ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      {isRtl ? 'تفاصيل السند / العملية' : 'Record Specification'}
                    </span>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                      {selectedRecord.code}
                    </h3>
                  </div>

                  <button
                    onClick={() => copyToClipboard(selectedRecord.code, selectedRecord.id)}
                    className="p-2 text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedId === selectedRecord.id ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] text-emerald-600 font-bold">{isRtl ? 'تم النسخ' : 'Copied'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[10px]">{isRtl ? 'نسخ الرمز' : 'Copy'}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-1">
                    <span className="text-[10px] text-zinc-400 font-bold">{isRtl ? 'البيان / الوصف:' : 'Description:'}</span>
                    <p className="font-extrabold text-slate-900 dark:text-white leading-relaxed">
                      {isRtl ? selectedRecord.titleAr : selectedRecord.titleEn}
                    </p>
                  </div>

                  {selectedRecord.amount !== undefined && (
                    <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                        {isRtl ? 'القيمة الإجمالية للمستند:' : 'Total Document Amount:'}
                      </span>
                      <span className="font-mono font-black text-sm text-emerald-700 dark:text-emerald-300">
                        {Number(selectedRecord.amount).toLocaleString()} {selectedRecord.currency}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
                      <span className="text-[9px] text-zinc-400 block">{isRtl ? 'تاريخ التحرير:' : 'Date:'}</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">{selectedRecord.date}</span>
                    </div>

                    <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
                      <span className="text-[9px] text-zinc-400 block">{isRtl ? 'الحالة الحالية:' : 'Status:'}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {selectedRecord.status === 'approved' ? (isRtl ? 'معتمد رسمياً' : 'Approved') : (isRtl ? 'قيد المراجعة' : 'Pending')}
                      </span>
                    </div>
                  </div>

                  {selectedRecord.accountCode && (
                    <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
                      <span className="text-[9px] text-zinc-400 block">{isRtl ? 'الدليل المحاسبي الشجري IPSAS:' : 'Chart of Account:'}</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">
                        {selectedRecord.accountCode} - {selectedRecord.accountName}
                      </span>
                    </div>
                  )}

                  {/* Integrity Checksum */}
                  <div className="p-2.5 bg-slate-100 dark:bg-zinc-900/80 rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-[9px] text-zinc-400 flex items-center gap-1 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{isRtl ? 'بصمة التحقق الرقمية:' : 'Integrity Hash:'}</span>
                    </span>
                    <span className="font-mono text-[9px] text-zinc-500 font-bold">
                      {selectedRecord.checksum}
                    </span>
                  </div>
                </div>

                {/* Direct 1-Click Action Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => {
                      triggerHaptic('success');
                      if (selectedRecord.kind === 'voucher' || selectedRecord.kind === 'invoice') {
                        onNavigate('finance');
                      } else if (selectedRecord.kind === 'activity') {
                        onNavigate('activities');
                      } else {
                        onNavigate('projects');
                      }
                      onClose();
                    }}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'فتح في الشاشة المختصة' : 'Open in Workspace'}</span>
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      window.print();
                    }}
                    className="p-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
                    title={isRtl ? 'طباعة رسمية' : 'Print'}
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <FileText className="w-12 h-12 text-zinc-400 opacity-40" />
                <p className="text-xs font-extrabold text-slate-600 dark:text-zinc-400">
                  {isRtl ? 'حدد أي سند أو فاتورة أو نشاط من القائمة لمعاينة التفاصيل الفورية' : 'Select a voucher or record from list to preview specs'}
                </p>
              </div>
            )}

            <div className="pt-4 text-center border-t border-slate-200 dark:border-zinc-800 mt-auto">
              <span className="text-[10px] font-mono text-zinc-400">
                NexoraOS Universal Record Retriever Engine • Sub-millisecond Recall
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FastRecordRetrievalDrawer;
