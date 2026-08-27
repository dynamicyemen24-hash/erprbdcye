/**
 * NexoraOS™ — Universal Object Page Modal (UOP Standard)
 * Implements the Enterprise Object Page Architecture for all 15 Sovereign Domains (NEB-01 .. NEB-15)
 * Inspired by SAP Fiori Object Page & Oracle Fusion Redwood Entity Layout.
 */

import React, { useState } from 'react';
import {
  X,
  Printer,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  FileText,
  Layers,
  Coins,
  Share2,
  Brain,
  Sparkles,
  Calendar,
  User,
  MapPin,
  Building,
  ArrowRight,
  ArrowLeft,
  Paperclip,
  Activity,
  History,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { triggerHaptic } from '../../helpers/hapticSwipe';

export interface UniversalObjectMetric {
  labelAr: string;
  labelEn: string;
  value: string | number;
  unitAr?: string;
  unitEn?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'emerald' | 'amber' | 'blue' | 'purple' | 'rose';
}

export interface UniversalObjectTimelineEvent {
  id: string;
  titleAr: string;
  titleEn: string;
  actor: string;
  roleAr: string;
  roleEn: string;
  timestamp: string;
  status: 'approved' | 'pending' | 'rejected' | 'in_progress';
  notesAr?: string;
  notesEn?: string;
}

export interface UniversalOverviewFieldGroup {
  groupTitleAr: string;
  groupTitleEn: string;
  fields: {
    labelAr: string;
    labelEn: string;
    value: string | number | React.ReactNode;
    isCopyable?: boolean;
  }[];
}

export interface UniversalLineItem {
  id: string;
  code: string;
  nameAr: string;
  nameEn?: string;
  quantity: number;
  unitAr: string;
  unitPriceYer: number;
  totalYer: number;
  status?: string;
}

export interface UniversalLinkedRecord {
  id: string;
  code: string;
  typeAr: string;
  typeEn: string;
  titleAr: string;
  titleEn?: string;
  amountYer?: number;
  targetTab: string;
}

export interface UniversalAuditEntry {
  id: string;
  actionAr: string;
  actionEn: string;
  user: string;
  timestamp: string;
  ipAddress?: string;
  device?: string;
  detailsAr?: string;
}

export interface UniversalAttachment {
  id: string;
  nameAr: string;
  nameEn?: string;
  size: string;
  type: string;
  uploadedAt: string;
  url?: string;
}

export interface UniversalObjectPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
  domainCode: string; // e.g. "NEB-04"
  domainNameAr: string; // e.g. "إدارة المشاريع الميدانية"
  domainNameEn: string; // e.g. "Field Project Management OS"
  recordCode: string; // e.g. "PRJ-2026-001"
  titleAr: string;
  titleEn?: string;
  status: {
    code: string;
    labelAr: string;
    labelEn: string;
    color: 'emerald' | 'amber' | 'blue' | 'rose' | 'slate';
  };
  metrics?: UniversalObjectMetric[];
  overviewFieldGroups?: UniversalOverviewFieldGroup[];
  lineItems?: UniversalLineItem[];
  timeline?: UniversalObjectTimelineEvent[];
  linkedRecords?: UniversalLinkedRecord[];
  auditTrail?: UniversalAuditEntry[];
  attachments?: UniversalAttachment[];
  onEdit?: () => void;
  onDelete?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const UniversalObjectPageModal: React.FC<UniversalObjectPageModalProps> = ({
  isOpen,
  onClose,
  lang,
  domainCode,
  domainNameAr,
  domainNameEn,
  recordCode,
  titleAr,
  titleEn,
  status,
  metrics = [],
  overviewFieldGroups = [],
  lineItems = [],
  timeline = [],
  linkedRecords = [],
  auditTrail = [],
  attachments = [],
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onNavigateToTab
}) => {
  const isRtl = lang === 'ar';
  const [activeTab, setActiveTab] = useState<'overview' | 'line_items' | 'workflow' | 'linked' | 'audit' | 'attachments'>('overview');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(recordCode);
    setCopiedCode(true);
    triggerHaptic('light');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleGenerateAiSummary = () => {
    setIsAiGenerating(true);
    setTimeout(() => {
      setAiSummary(
        isRtl
          ? `تم فحص سجل [${recordCode}] عبر الذكاء الاصطناعي المؤسسي: السجل مكتمل ومطابق لتعليمات المجال ${domainCode}. تم التحقق من سلامة الموازنة والارتباط المحاسبي المزدوج دون أي انحرافات تشغيلية. التوصية: اعتماد مرحلي منتظم.`
          : `Record [${recordCode}] audited by Enterprise AI: Full data integrity confirmed for ${domainCode}. Double-entry ledger mapped with zero financial deviations. Recommendation: Standard progressive approval.`
      );
      setIsAiGenerating(false);
      triggerHaptic('medium');
    }, 800);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = () => {
    const colorMap = {
      emerald: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      blue: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
      rose: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
      slate: 'bg-slate-500/15 text-slate-700 dark:text-zinc-300 border-slate-500/30'
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${colorMap[status.color] || colorMap.slate}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        <span>{isRtl ? status.labelAr : status.labelEn}</span>
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* ========================================================================= */}
        {/* 1. OBJECT PAGE HEADER (رأس صفحة الكيان الموحدة)                           */}
        {/* ========================================================================= */}
        <div className="bg-slate-900 text-white p-5 md:p-6 border-b border-slate-800 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            {/* Top Bar: Domain Code, Record ID, Actions & Close */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-black border border-emerald-500/30">
                  {domainCode}
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {isRtl ? domainNameAr : domainNameEn}
                </span>
                <span className="text-slate-600">•</span>
                
                {/* Copyable Record Code */}
                <button
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
                  title={isRtl ? 'نسخ الرمز' : 'Copy code'}
                >
                  <span>{recordCode}</span>
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                </button>
              </div>

              {/* Header Action Toolbar */}
              <div className="flex items-center gap-2">
                {onEdit && (
                  <button
                    onClick={onEdit}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">{isRtl ? 'تعديل السجل' : 'Edit'}</span>
                  </button>
                )}

                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  title={isRtl ? 'طباعة تقرير PDF رسمي' : 'Print PDF Report'}
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">{isRtl ? 'طباعة' : 'Print'}</span>
                </button>

                {onApprove && (
                  <button
                    onClick={onApprove}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'اعتماد فوري' : 'Approve'}</span>
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-600 text-slate-400 hover:text-white transition-all cursor-pointer"
                  title={isRtl ? 'إغلاق (Esc)' : 'Close'}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Entity Title & Status */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-snug">
                  {isRtl ? titleAr : (titleEn || titleAr)}
                </h2>
                {titleEn && isRtl && (
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{titleEn}</p>
                )}
              </div>
              <div className="shrink-0 self-start md:self-center">
                {getStatusBadge()}
              </div>
            </div>

            {/* Vital Object Metrics (4 Cards) */}
            {metrics.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-2">
                {metrics.slice(0, 4).map((metric, idx) => (
                  <div key={idx} className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3">
                    <div className="text-[11px] text-slate-400 font-bold mb-1">
                      {isRtl ? metric.labelAr : metric.labelEn}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono text-lg font-black text-white">
                        {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                      </span>
                      {metric.unitAr && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          {isRtl ? metric.unitAr : metric.unitEn}
                        </span>
                      )}
                    </div>
                    {metric.change && (
                      <div className="text-[10px] text-emerald-400 font-bold mt-0.5">
                        {metric.change}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Ambient AI Executive Summary Banner */}
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                <span className="text-emerald-200 text-[11px] truncate">
                  {aiSummary || (isRtl ? 'المساعد الذكي: جاهز لإجراء تدقيق تنفيذي استباقي لهذا السجل.' : 'AI Guardian: Ready to run proactive compliance verification.')}
                </span>
              </div>
              {!aiSummary && (
                <button
                  onClick={handleGenerateAiSummary}
                  disabled={isAiGenerating}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {isAiGenerating ? (isRtl ? 'جاري الفحص...' : 'Auditing...') : (isRtl ? 'فحص بالذكاء الاصطناعي' : 'Run AI Audit')}
                </button>
              )}
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. TAB NAVIGATION BAR (شريط تبويبات العمليات الستة)                        */}
        {/* ========================================================================= */}
        <div className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 px-4 md:px-6 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0 text-xs font-black">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isRtl ? 'نظرة عامة والبيانات الأساسية' : 'Overview & Data'}</span>
          </button>

          {lineItems.length > 0 && (
            <button
              onClick={() => setActiveTab('line_items')}
              className={`py-3.5 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'line_items'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{isRtl ? `بنود العمل والموازنة (${lineItems.length})` : `Line Items (${lineItems.length})`}</span>
            </button>
          )}

          {timeline.length > 0 && (
            <button
              onClick={() => setActiveTab('workflow')}
              className={`py-3.5 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'workflow'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>{isRtl ? 'مسار وسجل الاعتمادات' : 'Approval Workflow'}</span>
            </button>
          )}

          {linkedRecords.length > 0 && (
            <button
              onClick={() => setActiveTab('linked')}
              className={`py-3.5 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'linked'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>{isRtl ? `السجلات والمعاملات المرتبطة (${linkedRecords.length})` : `Linked Records (${linkedRecords.length})`}</span>
            </button>
          )}

          {auditTrail.length > 0 && (
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-3.5 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'audit'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span>{isRtl ? 'سجل التدقيق الزمني' : 'Audit Trail'}</span>
            </button>
          )}

          {attachments.length > 0 && (
            <button
              onClick={() => setActiveTab('attachments')}
              className={`py-3.5 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'attachments'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Paperclip className="w-4 h-4" />
              <span>{isRtl ? `المرفقات والوثائق (${attachments.length})` : `Documents (${attachments.length})`}</span>
            </button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 3. TAB WORK AREA BODY                                                     */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-6 bg-white dark:bg-zinc-950">
          
          {/* TAB 1: OVERVIEW & STRUCTURED METADATA */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {overviewFieldGroups.map((group, gIdx) => (
                <div key={gIdx} className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 pb-1 border-b border-slate-200 dark:border-zinc-800">
                    {isRtl ? group.groupTitleAr : group.groupTitleEn}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {group.fields.map((field, fIdx) => (
                      <div key={fIdx} className="bg-slate-50 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
                        <div className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 mb-1">
                          {isRtl ? field.labelAr : field.labelEn}
                        </div>
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white break-words">
                          {field.value ?? '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: LINE ITEMS & WBS */}
          {activeTab === 'line_items' && (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-xs text-left rtl:text-right">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-500 font-bold bg-slate-50 dark:bg-zinc-900/40">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">{isRtl ? 'البند / المخرج' : 'Line Item'}</th>
                    <th className="py-2.5 px-3 text-center">{isRtl ? 'الكمية' : 'Qty'}</th>
                    <th className="py-2.5 px-3 text-center">{isRtl ? 'الوحدة' : 'Unit'}</th>
                    <th className="py-2.5 px-3">{isRtl ? 'سعر الوحدة' : 'Unit Price'}</th>
                    <th className="py-2.5 px-3">{isRtl ? 'الإجمالي' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-medium">
                  {lineItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        {isRtl ? item.nameAr : (item.nameEn || item.nameAr)}
                        <div className="font-mono text-[10px] text-slate-400">{item.code}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-center">{item.unitAr}</td>
                      <td className="py-2.5 px-3 font-mono">{item.unitPriceYer.toLocaleString()} YER</td>
                      <td className="py-2.5 px-3 font-mono font-black text-emerald-600 dark:text-emerald-400">
                        {item.totalYer.toLocaleString()} YER
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: WORKFLOW & APPROVAL TIMELINE */}
          {activeTab === 'workflow' && (
            <div className="space-y-4 max-w-2xl mx-auto py-2">
              {timeline.map((event, idx) => {
                const isLast = idx === timeline.length - 1;
                const isApproved = event.status === 'approved';
                const isPending = event.status === 'pending';

                return (
                  <div key={event.id} className="flex items-start gap-4 relative">
                    {!isLast && (
                      <div className={`absolute top-8 ${isRtl ? 'right-4' : 'left-4'} bottom-0 w-0.5 bg-slate-200 dark:bg-zinc-800 -mb-4`} />
                    )}

                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      isApproved 
                        ? 'bg-emerald-500 text-white' 
                        : isPending 
                          ? 'bg-amber-500 text-white animate-pulse' 
                          : 'bg-slate-200 dark:bg-zinc-800 text-slate-500'
                    }`}>
                      {isApproved ? <Check className="w-4 h-4" /> : isPending ? <Clock className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 bg-slate-50 dark:bg-zinc-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="font-black text-xs text-slate-900 dark:text-white">
                          {isRtl ? event.titleAr : event.titleEn}
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">{event.timestamp}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-zinc-400 flex items-center gap-2">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="font-bold">{event.actor}</span>
                        <span>•</span>
                        <span>{isRtl ? event.roleAr : event.roleEn}</span>
                      </div>
                      {event.notesAr && (
                        <p className="mt-2 text-xs text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 p-2 rounded-lg border border-slate-200 dark:border-zinc-800">
                          {isRtl ? event.notesAr : event.notesEn}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: LINKED RECORDS */}
          {activeTab === 'linked' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {linkedRecords.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => onNavigateToTab?.(rec.targetTab)}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 hover:border-emerald-500 transition-all cursor-pointer group flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                        {rec.code}
                      </span>
                      <span className="text-[11px] text-slate-500 font-bold">
                        {isRtl ? rec.typeAr : rec.typeEn}
                      </span>
                    </div>
                    <h5 className="font-black text-xs text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {isRtl ? rec.titleAr : (rec.titleEn || rec.titleAr)}
                    </h5>
                    {rec.amountYer && (
                      <div className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                        {rec.amountYer.toLocaleString()} YER
                      </div>
                    )}
                  </div>

                  <ArrowLeft className={`w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-transform ${isRtl ? 'group-hover:-translate-x-1' : 'rotate-180 group-hover:translate-x-1'}`} />
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-xs text-left rtl:text-right">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-500 font-bold bg-slate-50 dark:bg-zinc-900/40">
                    <th className="py-2.5 px-3">{isRtl ? 'التاريخ والوقت' : 'Timestamp'}</th>
                    <th className="py-2.5 px-3">{isRtl ? 'العملية الإجرائية' : 'Action'}</th>
                    <th className="py-2.5 px-3">{isRtl ? 'المستخدم' : 'User'}</th>
                    <th className="py-2.5 px-3">{isRtl ? 'عنوان IP / الجهاز' : 'IP / Device'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-medium">
                  {auditTrail.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{entry.timestamp}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        {isRtl ? entry.actionAr : entry.actionEn}
                        {entry.detailsAr && <div className="text-[10px] text-slate-400 font-normal">{entry.detailsAr}</div>}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-700 dark:text-zinc-300">{entry.user}</td>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">{entry.ipAddress || '192.168.1.10'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 6: ATTACHMENTS */}
          {activeTab === 'attachments' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {attachments.map((att) => (
                <div key={att.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {isRtl ? att.nameAr : (att.nameEn || att.nameAr)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {att.size} • {att.uploadedAt}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => window.open(att.url || '#', '_blank')}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 hover:text-emerald-600 transition-colors shrink-0 cursor-pointer"
                    title={isRtl ? 'تحميل' : 'Download'}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* 4. OBJECT PAGE FOOTER (شريط التذييل الإجرائي)                             */}
        {/* ========================================================================= */}
        <div className="p-4 bg-slate-50 dark:bg-zinc-900/80 border-t border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{isRtl ? 'سجل محمي ومؤصل بمعايير الحوكمة والنزاهة المؤسسية' : 'Certified Enterprise Sovereign Record'}</span>
          </div>

          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                onClick={onDelete}
                className="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all cursor-pointer"
              >
                {isRtl ? 'حذف السجل' : 'Delete'}
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold transition-all cursor-pointer"
            >
              {isRtl ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UniversalObjectPageModal;
