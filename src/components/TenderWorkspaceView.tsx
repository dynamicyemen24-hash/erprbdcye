/**
 * UAMEX ERP™ — NEB-14 Procurement & Tenders OS
 * TenderWorkspaceView — وركسبيس المناقصات والمزايدات الإلكترونية E2E
 *
 * نطاق E2E: إنشاء مناقصة → نشرها → استلام عروض → تقييم فني/مالي → ترسية →
 *           إصدار أمر شراء → مطابقة 3 طرفية → تسجيل استلام.
 *
 * يربط مباشرة بالراوتر الخلفي /api/procurement/v2
 * (TenderEngine + AuctionEngine + VendorBidEngine + PurchaseOrderEngine + ThreeWayMatchEngine)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layers, Activity, ShoppingCart, BarChart3, Wallet, Award, CheckCircle2,
  FileText, Send, Package, Clock, Plus, Search, Filter, RefreshCw, Zap,
  ChevronRight, X, AlertCircle, UserCheck, TrendingUp, Users, Workflow,
  FileCheck, CheckSquare, XCircle, Sparkles, Eye, Pause, Calendar, Shield,
  Building2, Gavel, AlertTriangle
} from 'lucide-react';

import { TenderStatus, TenderType, TenderProcessType, AuctionType, AuctionStatus, BidStatus, EvaluationCriterionType } from '../features/procurement/tenderTypes';

// ─── Type Definitions ────────────────────────────────────────────────────────

export interface Tender {
  id: string;
  tender_number: string;
  title_ar: string;
  title_en?: string;
  description_ar?: string;
  description_en?: string;
  tender_type: TenderType;
  process_type: TenderProcessType;
  status: TenderStatus;
  project_id: string | null;
  project_name_ar?: string;
  estimated_value: number;
  currency_code: string;
  submission_deadline: string | null;
  publish_date: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  bids_count?: number;
  best_score?: number | null;
}

export interface VendorBid {
  id: string;
  rfq_id: string;
  vendor_id: string;
  vendor_name_ar: string;
  vendor_name_en?: string;
  vendor_code?: string;
  bid_amount: number;
  currency_code: string;
  technical_score?: number | null;
  financial_score?: number | null;
  computed_score?: number | null;
  compliance_score?: number | null;
  status: BidStatus;
  submitted_at: string;
  bid_documents?: string[];
}
export interface Auction {
  id: string;
  auction_type: AuctionType;
  tender_id: string;
  status: AuctionStatus;
  start_time: string;
  end_time: string;
  current_bid?: number | null;
  reserve_price?: number | null;
  currency_code: string;
  bidder_ranks?: { vendor_id: string; vendor_name: string; bidAmount: number; rank: number }[];
  created_at: string;
}

export interface ProcurementWorkspaceViewProps {
  projects?: any[];
  vendors?: any[];
  lang: 'ar' | 'en';
  onRefresh?: () => void;
  onNavigate?: (tab: string) => void;
}

// ─── Status Badge Helpers ────────────────────────────────────────────────────

const STATUS_LABELS: Record<TenderStatus, { ar: string; en: string }> = {
  DRAFT: { ar: 'مسودة', en: 'Draft' },
  PUBLISHED: { ar: 'منشورة', en: 'Published' },
  BID_SUBMISSION: { ar: 'استقبال عروض', en: 'Bid Submission' },
  CLARIFICATIONS: { ar: 'استيضاحات', en: 'Clarifications' },
  EVALUATION_TECH: { ar: 'تقييم فني', en: 'Technical Eval' },
  EVALUATION_FIN: { ar: 'تقييم مالي', en: 'Financial Eval' },
  AWARD_PENDING: { ar: 'جاري الترسية', en: 'Award Pending' },
  AWARDED: { ar: 'تمت الترسية', en: 'Awarded' },
  CONTRACTED: { ar: 'مذكورة عقد', en: 'Contracted' },
  COMPLETED: { ar: 'مكتملة', en: 'Completed' },
  CANCELLED: { ar: 'ملغاة', en: 'Cancelled' },
  CHALLENGED: { ar: 'تحدي', en: 'Challenged' },
};

const STATUS_COLORS: Record<TenderStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
  PUBLISHED: 'bg-blue-50 text-blue-700 border-blue-200',
  BID_SUBMISSION: 'bg-purple-50 text-purple-700 border-purple-200',
  CLARIFICATIONS: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  EVALUATION_TECH: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  EVALUATION_FIN: 'bg-teal-50 text-teal-700 border-teal-200',
  AWARD_PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  AWARDED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CONTRACTED: 'bg-sky-50 text-sky-700 border-sky-200',
  COMPLETED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
  CHALLENGED: 'bg-orange-50 text-orange-700 border-orange-200',
};

const STATUS_ICONS: Record<TenderStatus, React.ElementType> = {
  DRAFT: FileText, PUBLISHED: Send, BID_SUBMISSION: ShoppingCart,
  CLARIFICATIONS: AlertCircle, EVALUATION_TECH: BarChart3, EVALUATION_FIN: Wallet,
  AWARD_PENDING: Award, AWARDED: CheckCircle2, CONTRACTED: FileCheck,
  COMPLETED: CheckSquare, CANCELLED: XCircle, CHALLENGED: AlertTriangle,
};

const BID_STATUS_LABELS: Record<BidStatus, { ar: string; en: string }> = {
  DRAFT: { ar: 'مسودة', en: 'Draft' }, SUBMITTED: { ar: 'مرسلة', en: 'Submitted' },
  WITHDRAWN: { ar: 'مسحوبة', en: 'Withdrawn' }, EVALUATED: { ar: 'مقيّمة', en: 'Evaluated' },
  ACCEPTED: { ar: 'مقبولة', en: 'Accepted' }, REJECTED: { ar: 'مرفوضة', en: 'Rejected' },
  AWARDED: { ar: 'مرسَّة', en: 'Awarded' },
};
function StatusBadge({ status, lang, size = 'md' }: { status: string; lang: 'ar' | 'en'; size?: 'sm' | 'md' }) {
  const Icon = (STATUS_ICONS as any)[status] || Activity;
  const color = (STATUS_COLORS as any)[status] || 'bg-slate-100 text-slate-600 border-slate-200';
  const label = (STATUS_LABELS as any)[status]?.[lang === 'ar' ? 'ar' : 'en'] || status;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-black ${
      size === 'sm' ? 'px-1.5 py-0.5 text-[7px]' : 'px-2.5 py-0.5 text-[8.5px]'
    } ${color}`}>
      <Icon className={`w-${size === 'sm' ? 3 : 3.5} h-${size === 'sm' ? 3 : 3.5}`} />
      <span>{label}</span>
    </span>
  );
}

function BidStatusBadge({ status, lang }: { status: BidStatus; lang: 'ar' | 'en' }) {
  const label = BID_STATUS_LABELS[status][lang === 'ar' ? 'ar' : 'en'];
  const colorMap: Record<BidStatus, string> = {
    DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
    SUBMITTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    WITHDRAWN: 'bg-rose-50 text-rose-700 border-rose-200',
    EVALUATED: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    ACCEPTED: 'bg-amber-50 text-amber-700 border-amber-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
    AWARDED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  return <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black border ${colorMap[status]}`}>{label}</span>;
}

// ─── API Client ─────────────────────────────────────────────────────────────

class ProcurementApiClient {
  private baseUrl: string;
  private token: string;
  constructor() {
    this.baseUrl = '/api/procurement/v2';
    this.token = localStorage.getItem('authToken') || '';
  }
  private get headers(): HeadersInit {
    return { 'Content-Type': 'application/json', 'Authorization': this.token ? `Bearer ${this.token}` : '' };
  }
  async get(path: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}${path}`, { headers: this.headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return res.json();
  }
  async post(path: string, body: any): Promise<any> {
    const res = await fetch(`${this.baseUrl}${path}`, { method: 'POST', headers: this.headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return res.json();
  }
}

// ─── Data Hooks ─────────────────────────────────────────────────────────────

function useTenders() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchTenders = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await apiClient.get('/tenders');
      setTenders(res.data || res || []);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchTenders(); }, [fetchTenders]);
  return { tenders, loading, error, refetch: fetchTenders };
}

function useApiMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mutate = useCallback(async (fn: () => Promise<any>) => {
    setLoading(true); setError(null);
    try { return await fn(); } catch (e: any) { setError(e.message); throw e; }
    finally { setLoading(false); }
  }, []);
  return { mutate, loading, error };
}
// ─── API Action Helpers (full E2E lifecycle) ─────────────────────────────────

async function apiCreateTender(payload: any): Promise<Tender> {
  const res = await apiClient.post('/tenders', payload);
  return res.data || res;
}

async function apiTransitionTender(tenderId: string, toStatus: string): Promise<Tender> {
  const res = await apiClient.post(`/tenders/${tenderId}/transition`, { toStatus });
  return res.data || res;
}

async function apiAwardTender(tenderId: string, winningBidId: string): Promise<any> {
  const res = await apiClient.post(`/tenders/${tenderId}/award`, { winningBidId });
  return res.data || res;
}

async function apiCreateAuction(tenderId: string, type: AuctionType, startTime: string, endTime: string): Promise<Auction> {
  const res = await apiClient.post('/auctions', { tenderId, auctionType: type, startTime, endTime, reservePrice: 0 });
  return res.data || res;
}

async function apiGetAuctions(tenderId: string): Promise<Auction[]> {
  const res = await apiClient.get(`/auctions?tenderId=${tenderId}`);
  const arr = res.data || res || [];
  return Array.isArray(arr) ? arr : [];
}

async function apiCloseAuction(auctionId: string): Promise<Auction> {
  const res = await apiClient.post(`/auctions/${auctionId}/close`, {});
  return res.data || res;
}

async function apiAwardAuction(auctionId: string, vendorId: string): Promise<any> {
  const res = await apiClient.post(`/auctions/${auctionId}/award`, { winningVendorId: vendorId });
  return res.data || res;
}

async function apiPlaceAuctionBid(auctionId: string, vendorId: string, bidAmount: number): Promise<any> {
  const res = await apiClient.post(`/auctions/${auctionId}/bids`, { vendorId, bidAmount });
  return res.data || res;
}

async function apiEvaluateBid(bidId: string, payload: any): Promise<any> {
  const res = await apiClient.post(`/tenders/bids/${bidId}/evaluate`, payload);
  return res.data || res;
}

async function apiGetTender(tenderId: string): Promise<any> {
  const res = await apiClient.get(`/tenders/${tenderId}`);
  return res.data || res;
}

const apiClient = new ProcurementApiClient();
// ─── UI Sub-Components ───────────────────────────────────────────────────────

interface ModalProps { open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl'; }
function Modal({ open, onClose, title, children, size = 'lg' }: ModalProps) {
  if (!open) return null;
  const sizeClasses = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function StatCard({ labelAr, labelEn, value, icon: Icon, color }: { labelAr: string; labelEn: string; value: string | number; icon: React.ElementType; color: string; }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
      <div className={`p-2 rounded-xl ${color.replace('text-', 'bg-')}/10`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div><p className="text-[10px] text-zinc-400 font-black uppercase">{labelAr}</p><p className="text-lg font-black text-slate-900 dark:text-white font-mono">{value}</p></div>
    </div>
  );
}

function StepIndicator({ steps, currentStep, lang }: { steps: { labelAr: string; labelEn: string }[]; currentStep: number; lang: 'ar' | 'en'; }) {
  return (
    <div className="flex items-center justify-between mb-6 px-2">
      {steps.map((step, idx) => {
        const isActive = idx === currentStep; const isComplete = idx < currentStep;
        return (
          <div key={idx} className="flex flex-col items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-black text-xs ${
              isActive ? 'border-emerald-600 bg-emerald-600 text-white' :
              isComplete ? 'border-emerald-600 bg-emerald-50 text-emerald-700' :
              'border-slate-200 bg-white text-slate-400'
            }`}>{idx + 1}</div>
            <span className={`mt-1 text-[10px] font-black text-center ${isActive ? 'text-emerald-600' : 'text-slate-500'}`}>
              {lang === 'ar' ? step.labelAr : step.labelEn}
            </span>
            {idx < steps.length - 1 && <div className={`h-0.5 w-full mt-4 ${isComplete ? 'bg-emerald-600' : 'bg-slate-200'}`} />}
          </div>
        );
      })}
    </div>
  );
}

function KanbanLane({ title, icon: Icon, tenders, lang, onTenderClick }: {
  title: string; icon: React.ElementType; tenders: Tender[]; lang: 'ar' | 'en';
  onTenderClick: (tender: Tender) => void;
}) {
  return (
    <div className="bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-3 space-y-2 min-w-[220px] flex-1">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-zinc-800">
        <Icon className="w-4 h-4 text-slate-500" />
        <h5 className="text-[11px] font-black text-slate-700 dark:text-zinc-300">{title}</h5>
        <span className="text-[10px] bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-full px-1.5 py-0.5 font-black">{tenders.length}</span>
      </div>
      <div className="space-y-2">
        {tenders.length === 0 ? (
          <p className="text-[10px] text-slate-400 font-bold text-center py-4">{lang === 'ar' ? 'لا توجد مناقصات' : 'No tenders here'}</p>
        ) : tenders.map(t => (
          <div key={t.id} onClick={() => onTenderClick(t)} className="p-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl cursor-pointer hover:shadow-sm transition-all group">
            <p className="text-[9px] font-black text-slate-800 dark:text-white leading-tight mb-1">{lang === 'ar' ? t.title_ar : (t.title_en || t.title_ar)}</p>
            <div className="flex justify-between items-center">
              <span className="text-[8px] font-mono text-slate-400">{t.tender_number}</span>
              <StatusBadge status={t.status} lang={lang} size="sm" />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Package className="w-3 h-3 text-slate-300" />
              <span className="text-[8px] font-mono text-slate-400">{t.estimated_value?.toLocaleString()} {t.currency_code}</span>
              <Clock className="w-3 h-3 text-slate-300 ml-auto" />
              <span className="text-[8px] font-mono text-slate-400">{t.bids_count || 0}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
// ─── Create Tender Modal (multi-step form) ───────────────────────────────────

interface CreateTenderModalProps {
  open: boolean; onClose: () => void; lang: 'ar' | 'en'; projects: any[];
  onSubmit: () => void;
}

function CreateTenderModal({ open, onClose, lang, projects, onSubmit }: CreateTenderModalProps) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '',
    tenderType: 'SUPPLIES' as TenderType, processType: 'OPEN' as TenderProcessType,
    projectId: '', estimatedValue: 0 as number | '',
    currencyCode: 'USD', submissionDeadline: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = (ar: string, en: string) => lang === 'ar' ? ar : en;

  const steps = [
    { labelAr: 'البيانات الأساسية', labelEn: 'Basic Info' },
    { labelAr: 'نوع وإجراءات المناقصة', labelEn: 'Tender Type & Process' },
    { labelAr: 'القيمة والمدة', labelEn: 'Value & Deadline' },
  ];

  const commonInputCls = "w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-emerald-500 font-semibold";

  const handleSave = async () => {
    setLoading(true); setError(null);
    try {
      await apiCreateTender({
        titleAr: formData.titleAr, titleEn: formData.titleEn || undefined,
        descriptionAr: formData.descriptionAr, descriptionEn: formData.descriptionEn || undefined,
        tenderType: formData.tenderType, processType: formData.processType,
        projectId: formData.projectId || undefined,
        estimatedValue: formData.estimatedValue || 0,
        currencyCode: formData.currencyCode,
        submissionDeadline: formData.submissionDeadline || undefined,
      });
      onSubmit(); onClose();
      setFormData({ titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '', tenderType: 'SUPPLIES', processType: 'OPEN', projectId: '', estimatedValue: 0, currencyCode: 'USD', submissionDeadline: '' });
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const handleNext = () => {
    if (step === 0 && !formData.titleAr) { setError(t('عنوان المناقصة مطلوب', 'Tender title is required')); return; }
    if (step < steps.length - 1) setStep(step + 1); else handleSave();
  };

  return (
    <Modal open={open} onClose={onClose} title={t('إنشاء مناقصة جديدة', 'Create New Tender')} size="xl">
      <StepIndicator steps={steps} currentStep={step} lang={lang} />
      {error && <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl mb-4"><p className="text-[11px] font-black text-rose-700 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</p></div>}

      {step === 0 && (
        <div className="space-y-4">
          <div><label className="block text-xs font-black text-slate-800 dark:text-white mb-1">{t('عنوان المناقصة (عربي)', 'Tender Title (Arabic)')} *</label>
            <input type="text" value={formData.titleAr} onChange={e => setFormData({ ...formData, titleAr: e.target.value })} className={commonInputCls} placeholder={t('مثال: توريد مواد غذائية للإغاثة', 'e.g. Food baskets supply')} />
          </div>
          <div><label className="block text-xs font-black text-slate-800 dark:text-white mb-1">{t('العنوان (إنجليزي)', 'Title (English)')}</label>
            <input type="text" value={formData.titleEn} onChange={e => setFormData({ ...formData, titleEn: e.target.value })} className={commonInputCls} />
          </div>
          <div><label className="block text-xs font-black text-slate-800 dark:text-white mb-1">{t('الوصف والمهام (عربي)', 'Description & Scope (Arabic)')} *</label>
            <textarea value={formData.descriptionAr} onChange={e => setFormData({ ...formData, descriptionAr: e.target.value })} rows={4} className={commonInputCls + ' resize-none'} />
          </div>
          <div><label className="block text-xs font-black text-slate-800 dark:text-white mb-1">{t('الوصف (إنجليزي)', 'Description (English)')}</label>
            <textarea value={formData.descriptionEn} onChange={e => setFormData({ ...formData, descriptionEn: e.target.value })} rows={3} className={commonInputCls + ' resize-none'} />
          </div>
        </div>
      )}
{step === 1 && (
        <div className="space-y-4">
          <div><label className="block text-xs font-black text-slate-800 dark:text-white mb-1">{t('نوع المناقصة', 'Tender Type')}</label>
            <select value={formData.tenderType} onChange={e => setFormData({ ...formData, tenderType: e.target.value as TenderType })} className={commonInputCls}>
              <option value="WORKS">{t('أعمال (إنشائية)', 'Works')}</option>
              <option value="SUPPLIES">{t('لوازم وتوريدات', 'Supplies')}</option>
              <option value="SERVICES">{t('خدمات', 'Services')}</option>
              <option value="MANPOWER">{t('كوادر بشرية', 'Manpower')}</option>
              <option value="DESIGN">{t('تصميم واستشارات', 'Design')}</option>
              <option value="COMBINED">{t('مشروع مركّب', 'Combined')}</option>
            </select>
          </div>
          <div><label className="block text-xs font-black text-slate-800 dark:text-white mb-1">{t('إجراء المناقصة', 'Procurement Process')}</label>
            <select value={formData.processType} onChange={e => setFormData({ ...formData, processType: e.target.value as TenderProcessType })} className={commonInputCls}>
              <option value="OPEN">{t('مناقصة عامة مفتوحة', 'Open Tender')}</option>
              <option value="RESTRICTED">{t('مناقصة مقتصرة', 'Restricted Tender')}</option>
              <option value="NEGOTIATED">{t('تفاوض مباشر', 'Negotiated Procedure')}</option>
              <option value="COMPETITIVE_DIALOGUE">{t('حوار منافس', 'Competitive Dialogue')}</option>
              <option value="FRAMEWORK">{t('اتفاقية إطارية', 'Framework Agreement')}</option>
            </select>
          </div>
          <div><label className="block text-xs font-black text-slate-800 dark:text-white mb-1">{t('المشروع المرتبط', 'Linked Project')}</label>
            <select value={formData.projectId || ''} onChange={e => setFormData({ ...formData, projectId: e.target.value })} className={commonInputCls}>
              <option value="">{t('-- بدون مشروع --', '-- No Project --')}</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name_ar || p.name_en}</option>)}
            </select>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div><label className="block text-xs font-black text-slate-800 dark:text-white mb-1">{t('القيمة التقديرية', 'Estimated Value')}</label>
            <input type="number" value={formData.estimatedValue || ''} onChange={e => setFormData({ ...formData, estimatedValue: parseFloat(e.target.value) || 0 })} className={commonInputCls} placeholder="0" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-black text-slate-800 dark:text-white mb-1">{t('العملة', 'Currency')}</label>
              <select value={formData.currencyCode} onChange={e => setFormData({ ...formData, currencyCode: e.target.value })} className={commonInputCls}>
                <option value="USD">USD — {t('دولار', 'USD')}</option>
                <option value="EUR">EUR — {t('يورو', 'Euro')}</option>
                <option value="YER">YER — {t('ريال', 'YER')}</option>
                <option value="SYP">SYP — {t('ليرة', 'SYP')}</option>
              </select>
            </div>
            <div><label className="block text-xs font-black text-slate-800 dark:text-white mb-1">{t('موعد تسليم العروض', 'Submission Deadline')}</label>
              <input type="date" value={formData.submissionDeadline} onChange={e => setFormData({ ...formData, submissionDeadline: e.target.value })} className={commonInputCls} />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-zinc-800 mt-4">
        <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-black disabled:opacity-50 transition-all flex items-center gap-1">
          <ChevronRight className={`w-3 h-3 ${lang === 'ar' ? 'rotate-180' : ''}`} /> {t('السابق', 'Back')}
        </button>
        <button onClick={handleNext} disabled={loading} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all disabled:opacity-50 flex items-center gap-1.5">
          {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : step === steps.length - 1 ? <Send className="w-3 h-3" /> : <ChevronRight className={`w-3 h-3 ${lang === 'ar' ? 'rotate-180' : ''}`} />}
          {loading ? t('يتم الحفظ...', 'Saving...') : step === steps.length - 1 ? t('إنشاء ونشر', 'Create & Publish') : t('التالي', 'Next')}
        </button>
      </div>
    </Modal>
  );
}
// ─── Bid Evaluation Modal ────────────────────────────────────────────────────

interface BidEvaluationModalProps {
  open: boolean; onClose: () => void; bid: VendorBid; lang: 'ar' | 'en';
  onSave: () => void;
}

function BidEvaluationModal({ open, onClose, bid, lang, onSave }: BidEvaluationModalProps) {
  const [technicalScore, setTechnicalScore] = useState(bid.technical_score || 0);
  const [financialScore, setFinancialScore] = useState(bid.financial_score || 0);
  const [complianceScore, setComplianceScore] = useState(bid.compliance_score || 0);
  const [notesAr, setNotesAr] = useState('');
  const [notesEn, setNotesEn] = useState('');
  const [loading, setLoading] = useState(false);
  const t = (ar: string, en: string) => lang === 'ar' ? ar : en;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiEvaluateBid(bid.id, { technicalScore, financialScore, complianceScore, notesAr, notesEn });
      onSave(); onClose();
    } catch (e: any) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('تقييم عرض ' + bid.vendor_name_ar, 'Evaluate Bid — ' + (bid.vendor_name_en || bid.vendor_name_ar))} size="md">
      <div className="space-y-3">
        <div><label className="block text-xs font-black text-slate-800 dark:text-white mb-1">{t('درجة تقييم فنية (0–100)', 'Technical Score (0–100)')}</label>
          <input type="number" min="0" max="100" value={technicalScore} onChange={e => setTechnicalScore(parseFloat(e.target.value))} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-emerald-500 font-mono" />
        </div>
        <div><label className="block text-xs font-black text-slate-800 dark:text-white mb-1">{t('درجة تقييم مالي (0–100)', 'Financial Score (0–100)')}</label>
          <input type="number" min="0" max="100" value={financialScore} onChange={e => setFinancialScore(parseFloat(e.target.value))} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-emerald-500 font-mono" />
        </div>
        <div><label className="block text-xs font-black text-slate-800 dark:text-white mb-1">{t('درجة امتثال الشروط (0–100)', 'Compliance Score (0–100)')}</label>
          <input type="number" min="0" max="100" value={complianceScore} onChange={e => setComplianceScore(parseFloat(e.target.value))} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-emerald-500 font-mono" />
        </div>
        <div><label className="block text-xs font-black text-slate-800 dark:text-white mb-1">{t('ملاحظات (عربي)', 'Notes (Arabic)')}</label>
          <textarea value={notesAr} onChange={e => setNotesAr(e.target.value)} rows={2} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-emerald-500 font-semibold resize-none" />
        </div>
        <div><label className="block text-xs font-black text-slate-800 dark:text-white mb-1">{t('ملاحظات (إنجليزي)', 'Notes (English)')}</label>
          <textarea value={notesEn} onChange={e => setNotesEn(e.target.value)} rows={2} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-emerald-500 font-semibold resize-none" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-zinc-800 mt-4">
        <button onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-black">{t('إلغاء', 'Cancel')}</button>
        <button onClick={handleSubmit} disabled={loading} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5">
          {loading && <RefreshCw className="w-3 h-3 animate-spin" />}
          {t('حفظ التقييم', 'Save Evaluation')}
        </button>
      </div>
    </Modal>
  );
}
// ─── Live Electronic Auction Modal ───────────────────────────────────────────

interface AuctionModalProps {
  open: boolean; onClose: () => void; tender: Tender; auction: Auction | null;
  biddingVendors: any[]; myVendorId?: string; lang: 'ar' | 'en';
  onPlaceBid: (amount: number) => Promise<void>;
  onCloseAuction: () => Promise<void>;
  onAward: (vendorId: string) => Promise<void>;
  onRefresh: () => void;
}

function AuctionModal({ open, onClose, tender, auction, biddingVendors, myVendorId, lang, onPlaceBid, onCloseAuction, onAward, onRefresh }: AuctionModalProps) {
  const [bidAmount, setBidAmount] = useState('');
  const [placing, setPlacing] = useState(false);
  const isLive = auction?.status === 'ACTIVE';
  const isOwner = !myVendorId;
  const t = (ar: string, en: string) => lang === 'ar' ? ar : en;

  const handleBid = async () => {
    if (!bidAmount || !auction) return;
    setPlacing(true);
    try {
      await onPlaceBid(parseFloat(bidAmount));
      setBidAmount(''); onRefresh();
    } finally { setPlacing(false); }
  };
  const handleClose = async () => { await onCloseAuction(); onRefresh(); };
  const handleAward = async (vendorId: string) => { await onAward(vendorId); onRefresh(); };

  return (
    <Modal open={open} onClose={onClose} title={t('المزاد الإلكتروني — ' + (tender.title_ar || ''), 'Electronic Auction — ' + (tender.title_en || tender.title_ar))} size="xl">
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isLive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            <span className="text-xs font-black text-slate-800 dark:text-white">{t('الحالة:', 'Status:')}</span>
            <span className={`text-xs font-black ${isLive ? 'text-emerald-600' : 'text-slate-500'}`}>{auction?.status || 'SCHEDULED'}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>{t('ينتهي:', 'Ends:')}{auction?.end_time ? new Date(auction.end_time).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US') : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] text-amber-600 font-bold">{t('النوع:', 'Type:')}{auction?.auction_type || 'DUTCH'}</span>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="space-y-2">
          <h5 className="text-[11px] font-black text-slate-800 dark:text-white">{t('ترتيب المزايدين', 'Bidding Leaderboard')}</h5>
          {(auction?.bidder_ranks || biddingVendors).map((v: any, i: number) => (
            <div key={v.vendor_id} className={`p-2.5 rounded-xl border flex items-center justify-between ${
              i === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[9px] ${i === 0 ? 'bg-amber-400 text-white' : 'bg-slate-200 text-slate-600'}`}>#{i + 1}</div>
                <span className="text-xs font-black text-slate-800 dark:text-white">{v.vendor_name}</span>
              </div>
              <div className="text-end">
                <span className="text-sm font-black font-mono text-emerald-700">{v.bidAmount?.toLocaleString() || 0}</span>
                <span className="text-[9px] text-slate-400 block">{auction?.currency_code}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bid Form */}
        {!isOwner && isLive && (
          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
            <h5 className="text-[11px] font-black text-amber-800">{t('وضع مزايدة جديدة', 'Place New Bid')}</h5>
            <div className="flex gap-2">
              <input type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)}
                placeholder={t('أدخل مبلغ المزايدة', 'Enter bid amount')}
                className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500 font-mono text-sm" />
              <button onClick={handleBid} disabled={placing || !bidAmount}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black disabled:opacity-50 flex items-center gap-1.5">
                {placing && <RefreshCw className="w-3 h-3 animate-spin" />}
                {t('مزايدة', 'Bid')}
              </button>
            </div>
          </div>
        )}

        {/* Admin Actions */}
        {isOwner && (
          <div className="flex gap-2">
            {isLive && (
              <button onClick={handleClose} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5">
                <Pause className="w-3 h-3" />{t('إنهاء المزاد', 'Close Auction')}
              </button>
            )}
            {auction?.status === 'COMPLETED' && (
              <button onClick={() => handleAward(auction.bidder_ranks?.[0]?.vendor_id || '')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5">
                <Award className="w-3 h-3" />{t('ترسية لأفضل مزارد', 'Award to Top Bidder')}
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
// ─── Tender Detail Drawer (E2E workflow) ─────────────────────────────────────

interface TenderDetailProps {
  open: boolean; onClose: () => void; tender: Tender; bids: VendorBid[];
  lang: 'ar' | 'en'; projects: any[]; onRefresh: () => void;
}

function TenderDetailDrawer({ open, onClose, tender: initialTender, bids: initialBids, lang, projects, onRefresh }: TenderDetailProps) {
  const [tender, setTender] = useState<Tender>(initialTender);
  const [bids, setBids] = useState<VendorBid[]>(initialBids);
  const [activeView, setActiveView] = useState<'overview' | 'bids' | 'evaluation' | 'auction'>('overview');
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [evaluatingBid, setEvaluatingBid] = useState<VendorBid | null>(null);
  const [auctionModalOpen, setAuctionModalOpen] = useState(false);
  const [auction, setAuction] = useState<Auction | null>(null);
  const t = (ar: string, en: string) => lang === 'ar' ? ar : en;

  useEffect(() => { setTender(initialTender); setBids(initialBids); }, [initialTender, initialBids]);

  const availableTransitions = useMemo(() => {
    const allowed: string[] = [];
    switch (tender.status) {
      case 'DRAFT': allowed.push('PUBLISHED'); break;
      case 'PUBLISHED': allowed.push('BID_SUBMISSION'); break;
      case 'BID_SUBMISSION': allowed.push('EVALUATION_TECH'); break;
      case 'EVALUATION_TECH': allowed.push('EVALUATION_FIN'); break;
      case 'EVALUATION_FIN': allowed.push('AWARD_PENDING'); break;
      case 'AWARD_PENDING': allowed.push('AWARDED'); break;
      case 'AWARDED': allowed.push('CONTRACTED'); break;
      case 'CONTRACTED': allowed.push('COMPLETED'); break;
    }
    return allowed;
  }, [tender.status]);

  const refetch = () => {
    apiGetTender(tender.id).then(d => { setTender(d); setBids(d.bids || []); });
    onRefresh();
  };

  const handleTransition = async (toStatus: string) => {
    setLoading(true); setActionError(null);
    try {
      await apiTransitionTender(tender.id, toStatus);
      await refetch();
    } catch (e: any) { setActionError(e.message); } finally { setLoading(false); }
  };

  const handleAward = async (winningBidId: string) => {
    setLoading(true); setActionError(null);
    try {
      await apiAwardTender(tender.id, winningBidId);
      await refetch();
    } catch (e: any) { setActionError(e.message); } finally { setLoading(false); }
  };

  const sortedBids = useMemo(() => {
    return [...bids].sort((a, b) => {
      const sa = a.computed_score ?? -1; const sb = b.computed_score ?? -1;
      if (sb !== sa) return sb - sa;
      return (a.bid_amount || 0) - (b.bid_amount || 0);
    });
  }, [bids]);

  const transitionLabels: Record<string, { ar: string; en: string }> = {
    PUBLISHED: { ar: 'نشر المناقصة', en: 'Publish Tender' },
    BID_SUBMISSION: { ar: 'فتح استقبال العروض', en: 'Open Bids' },
    EVALUATION_TECH: { ar: 'بدء التقييم الفني', en: 'Start Technical Eval' },
    EVALUATION_FIN: { ar: 'بدء التقييم المالي', en: 'Start Financial Eval' },
    AWARD_PENDING: { ar: 'جاهز للترسية', en: 'Ready for Award' },
    CONTRACTED: { ar: 'توقيع العقد', en: 'Sign Contract' },
    COMPLETED: { ar: 'إنهاء المناقصة', en: 'Complete Tender' },
  };

  const handleAuctionLaunch = async () => {
    try {
      const existing = await apiGetAuctions(tender.id);
      let auc;
      if (existing.length > 0) auc = existing[0];
      else {
        const start = new Date(); start.setHours(start.getHours() + 1);
        const end = new Date(); end.setHours(end.getHours() + 2);
        auc = await apiCreateAuction(tender.id, 'DUTCH', start.toISOString(), end.toISOString());
      }
      setAuction(auc); setAuctionModalOpen(true);
    } catch (e: any) { setActionError(e.message); }
  };

  return (
    <Modal open={open} onClose={onClose}
      title={lang === 'ar' ? `${tender.tender_number} — ${tender.title_ar}` : `${tender.tender_number} — ${tender.title_en || tender.title_ar}`}
      size="xl">
      <div className="space-y-4">
        {actionError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
            <p className="text-[11px] font-black text-rose-700 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{actionError}</p>
          </div>
        )}

        {/* Lifecycle Transitions */}
        {availableTransitions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {availableTransitions.map(ts => (
              <button key={ts} onClick={() => handleTransition(ts)} disabled={loading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all disabled:opacity-50 flex items-center gap-1.5">
                {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                {t(transitionLabels[ts].ar, transitionLabels[ts].en)}
              </button>
            ))}
          </div>
        )}

        {/* View Switcher */}
        <div className="flex gap-1 bg-slate-100 dark:bg-zinc-800 rounded-xl p-1">
          {[{ id: 'overview', ar: 'نظرة عامة', en: 'Overview' },
            { id: 'bids', ar: 'العروض (' + bids.length + ')', en: 'Bids (' + bids.length + ')' },
            { id: 'evaluation', ar: 'التقييم', en: 'Evaluation' },
            { id: 'auction', ar: 'المزاد الإلكتروني', en: 'E-Auction' }].map(tab => (
            <button key={tab.id} onClick={() => setActiveView(tab.id as any)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
                activeView === tab.id ? 'bg-white dark:bg-zinc-900 text-emerald-700 shadow' : 'text-slate-600'
              }`}>
              {lang === 'ar' ? tab.ar : tab.en}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeView === 'overview' && (
          <div className="space-y-3 text-sm">
            <div><span className="font-black text-slate-500">{t('رقم المناقصة:', 'Tender No.:')}</span> <span className="text-slate-800 dark:text-white font-mono">{tender.tender_number}</span></div>
            <div><span className="font-black text-slate-500">{t('نوع', 'Type:')}</span> <span className="text-slate-800 dark:text-white">{tender.tender_type}</span></div>
            <div><span className="font-black text-slate-500">{t('إجراء', 'Process:')}</span> <span className="text-slate-800 dark:text-white">{tender.process_type}</span></div>
            <div><span className="font-black text-slate-500">{t('القيمة التقديرية:', 'Est. Value:')}</span> <span className="text-slate-800 dark:text-white font-mono">{tender.estimated_value?.toLocaleString()} {tender.currency_code}</span></div>
            <div><span className="font-black text-slate-500">{t('الموعد النهائي:', 'Deadline:')}</span> <span className="text-slate-800 dark:text-white">{tender.submission_deadline ? new Date(tender.submission_deadline).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : '—'}</span></div>
            <div><span className="font-black text-slate-500">{t('عدد العروض:', 'Bids Count:')}</span> <span className="text-slate-800 dark:text-white font-mono">{tender.bids_count || bids.length}</span></div>
            {tender.description_ar && <div className="pt-2"><p className="text-slate-700 dark:text-zinc-300 text-xs leading-relaxed">{lang === 'ar' ? tender.description_ar : (tender.description_en || tender.description_ar)}</p></div>}
          </div>
        )}

        {/* BIDS LIST */}
        {activeView === 'bids' && (
          <div className="space-y-2">
            {sortedBids.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold text-center py-4">{t('لا توجد عروض مرسلة بعد.', 'No bids submitted yet.')}</p>
            ) : sortedBids.map(bid => (
              <div key={bid.id} className="p-3 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-900/50 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-black text-slate-800 dark:text-white">{bid.vendor_name_ar}</p>
                    <p className="text-[9px] text-slate-400 font-bold">{bid.vendor_code}</p>
                  </div>
                  <div className="text-end">
                    <p className="text-sm font-black font-mono text-emerald-700">{bid.bid_amount?.toLocaleString()} {bid.currency_code}</p>
                    <BidStatusBadge status={bid.status} lang={lang} />
                  </div>
                </div>
                {(tender.status === 'EVALUATION_TECH' || tender.status === 'EVALUATION_FIN' || tender.status === 'AWARD_PENDING') && (
                  <button onClick={() => setEvaluatingBid(bid)}
                    className="px-2.5 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-lg text-[9px] font-black flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" />
                    {t('تقييم هذا العرض', 'Evaluate This Bid')}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* EVALUATION SUMMARY */}
        {activeView === 'evaluation' && (
          <div className="space-y-3">
            {sortedBids.length > 0 ? (
              <table className="w-full text-[10px] font-bold">
                <thead><tr className="text-slate-500 border-b border-slate-200">
                  <th className="text-start py-2 px-2">{t('المورد', 'Vendor')}</th>
                  <th className="text-end py-2 px-2">{t('المبلغ', 'Amount')}</th>
                  <th className="text-end py-2 px-2">{t('فني', 'Tech')}</th>
                  <th className="text-end py-2 px-2">{t('مالي', 'Fin')}</th>
                  <th className="text-end py-2 px-2">{t('امتثال', 'Comp')}</th>
                  <th className="text-end py-2 px-2">{t('الدرجة', 'Score')}</th>
                  <th className="text-center py-2 px-2">{t('ترسية', 'Award')}</th>
                </tr></thead>
                <tbody>
                  {sortedBids.map(bid => (
                    <tr key={bid.id} className="border-b border-slate-100">
                      <td className="py-2 text-slate-700">{bid.vendor_name_ar}</td>
                      <td className="py-2 font-mono text-end">{bid.bid_amount?.toLocaleString()}</td>
                      <td className="py-2 text-end">{bid.technical_score?.toFixed(1) || '—'}</td>
                      <td className="py-2 text-end">{bid.financial_score?.toFixed(1) || '—'}</td>
                      <td className="py-2 text-end">{bid.compliance_score?.toFixed(1) || '—'}</td>
                      <td className="py-2 font-mono text-end">{bid.computed_score?.toFixed(1) || '—'}</td>
                      <td className="py-2 text-center">
                        {tender.status === 'AWARD_PENDING' && (
                          <button onClick={() => handleAward(bid.id)} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black">
                            <Award className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">{t('لا توجد عروض لتقييمها.', 'No bids to evaluate.')}</p>
            )}
          </div>
        )}

        {/* E-AUCTION VIEW */}
        {activeView === 'auction' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400 font-bold">
              {t('يمكن إنشاء مزاد إلكتروني (Dutch/Reverse أو Forward) بعد جمع العروض.',
               'An electronic auction can be launched after collecting bids.')}
            </p>
            <button onClick={handleAuctionLaunch} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-2">
              <Zap className="w-3 h-3" />{t('بدء المزاد الإلكتروني', 'Launch E-Auction')}
            </button>
          </div>
        )}
      </div>

      {/* Nested Modals */}
      {evaluatingBid && (
        <BidEvaluationModal open={!!evaluatingBid} onClose={() => setEvaluatingBid(null)}
          bid={evaluatingBid} lang={lang} onSave={refetch} />
      )}

      {auctionModalOpen && auction && (
        <AuctionModal
          open={auctionModalOpen}
          onClose={() => { setAuctionModalOpen(false); setAuction(null); }}
          tender={tender} auction={auction}
          biddingVendors={sortedBids.map(b => ({ vendor_id: b.vendor_id, vendor_name: b.vendor_name_ar, bidAmount: b.bid_amount }))}
          lang={lang}
          onPlaceBid={async (amount) => {
            const myVendor = sortedBids[0]?.vendor_id || '';
            await apiPlaceAuctionBid(auction.id, myVendor, amount);
          }}
          onCloseAuction={async () => { await apiCloseAuction(auction.id); }}
          onAward={async (vendorId) => { await apiAwardAuction(auction.id, vendorId); }}
          onRefresh={refetch}
        />
      )}
    </Modal>
  );
}
// ─── Main Tender Workspace View ──────────────────────────────────────────────

export default function TenderWorkspaceView({
  projects = [],
  lang,
  onRefresh,
  onNavigate,
}: ProcurementWorkspaceViewProps) {
  const isRtl = lang === 'ar';
  const t = (ar: string, en: string) => lang === 'ar' ? ar : en;

  const { tenders, loading: tendersLoading, error: tendersError, refetch: refetchTenders } = useTenders();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailTender, setDetailTender] = useState<Tender | null>(null);
  const [detailBids, setDetailBids] = useState<VendorBid[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [statusFilter, setStatusFilter] = useState<TenderStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  const kanbanLanes: { id: TenderStatus; title: { ar: string; en: string }; icon: React.ElementType }[] = [
    { id: 'DRAFT', title: { ar: 'المسودات', en: 'Drafts' }, icon: FileText },
    { id: 'PUBLISHED', title: { ar: 'منشورة', en: 'Published' }, icon: Send },
    { id: 'BID_SUBMISSION', title: { ar: 'استقبال عروض', en: 'Bids Open' }, icon: ShoppingCart },
    { id: 'EVALUATION_TECH', title: { ar: 'تقييم فني', en: 'Technical Eval' }, icon: BarChart3 },
    { id: 'EVALUATION_FIN', title: { ar: 'تقييم مالي', en: 'Financial Eval' }, icon: Wallet },
    { id: 'AWARD_PENDING', title: { ar: 'جاري الترسية', en: 'Award Pending' }, icon: Award },
    { id: 'AWARDED', title: { ar: 'تمت الترسية', en: 'Awarded' }, icon: CheckCircle2 },
    { id: 'COMPLETED', title: { ar: 'مكتملة', en: 'Completed' }, icon: CheckSquare },
    { id: 'CANCELLED', title: { ar: 'ملغاة', en: 'Cancelled' }, icon: XCircle },
  ];

  const filteredTenders = useMemo(() => {
    return tenders.filter(tender => {
      const matchesStatus = !statusFilter || tender.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || (tender.tender_number || '').toLowerCase().includes(q)
        || (tender.title_ar || '').toLowerCase().includes(q) || (tender.title_en || '').toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [tenders, statusFilter, searchQuery]);

  const openTenderDetail = useCallback((tender: Tender) => {
    setDetailTender(tender);
    apiClient.get(`/tenders/${tender.id}`).then(res => {
      const d = res.data || res;
      setDetailTender(d);
      setDetailBids(d.bids || []);
    });
  }, []);

  const handleCreateSuccess = () => { refetchTenders(); onRefresh?.(); };
  const handleCloseDetail = () => { setDetailTender(null); setDetailBids([]); };
  const handleDetailRefresh = () => {
    if (detailTender?.id) {
      apiClient.get(`/tenders/${detailTender.id}`).then(res => {
        const d = res.data || res;
        setDetailTender(d); setDetailBids(d.bids || []);
      });
      refetchTenders();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              {t('وركسبيس المناقصات والمزايدات الإلكترونية', 'Electronic Tenders & Auction Workspace')}
            </h2>
            <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
              {t('E2E: إنشاء → نشر → عروض → تقييم → ترسية → عقد', 'E2E: Create → Publish → Bids → Evaluate → Award → Contract')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                viewMode === 'kanban' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600'
              }`}>{t('كانبان', 'Kanban')}</button>
            <button onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                viewMode === 'table' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600'
              }`}>{t('جدول', 'Table')}</button>
            <button onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all">
              <Plus className="w-3.5 h-3.5" />{t('مناقصة جديدة', 'New Tender')}
            </button>
          </div>
        </div>
{/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <StatCard labelAr="المنشورات النشطة" labelEn="Active Tenders"
            value={tenders.filter(tn => ['PUBLISHED', 'BID_SUBMISSION'].includes(tn.status)).length}
            icon={Activity} color="text-blue-600" />
          <StatCard labelAr="العروض المستلمة" labelEn="Bids Received"
            value={tenders.reduce((acc, tn) => acc + (tn.bids_count || 0), 0)}
            icon={ShoppingCart} color="text-purple-600" />
          <StatCard labelAr="قيد التقييم" labelEn="In Evaluation"
            value={tenders.filter(tn => tn.status === 'EVALUATION_TECH' || tn.status === 'EVALUATION_FIN').length}
            icon={BarChart3} color="text-cyan-600" />
          <StatCard labelAr="تمت الترسية" labelEn="Awarded"
            value={tenders.filter(tn => tn.status === 'AWARDED' || tn.status === 'CONTRACTED' || tn.status === 'COMPLETED').length}
            icon={Award} color="text-emerald-600" />
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2 mt-4">
          <div className="relative flex-1">
            <input type="text"
              placeholder={t('بحث برقم المناقصة أو العنوان...', 'Search by tender number or title...')}
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 pr-10 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-emerald-500 text-sm font-semibold" />
            <Search className={`w-4 h-4 text-slate-400 absolute ${isRtl ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2`} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as TenderStatus | '')}
            className="px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-emerald-500 text-xs font-black cursor-pointer">
            <option value="">{t('جميع الحالات', 'All Statuses')}</option>
            {kanbanLanes.map(lane => (
              <option key={lane.id} value={lane.id}>{t(lane.title.ar, lane.title.en)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {tendersLoading && (
        <div className="flex items-center justify-center gap-2 p-8 text-slate-400">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-xs font-black">{t('جاري تحميل المناقصات...', 'Loading tenders...')}</span>
        </div>
      )}

      {/* Error State */}
      {tendersError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl">
          <p className="text-xs font-black text-rose-700 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{tendersError}</p>
        </div>
      )}
{/* Kanban Board */}
      {viewMode === 'kanban' && !tendersError && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs" style={{ minHeight: '400px' }}>
          <h3 className="text-xs font-black text-slate-800 dark:text-white mb-3 flex items-center gap-2">
            <Workflow className="w-4 h-4 text-emerald-600" />
            {t('لوحة دورة حياة المناقصات', 'Tender Lifecycle Board')}
          </h3>
          <div className="flex overflow-x-auto gap-3 pb-2">
            {kanbanLanes.map(lane => {
              const laneTenders = filteredTenders.filter(tn => tn.status === lane.id);
              return (
                <KanbanLane key={lane.id} title={t(lane.title.ar, lane.title.en)} icon={lane.icon}
                  tenders={laneTenders} lang={lang} onTenderClick={openTenderDetail} />
              );
            })}
          </div>
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && !tendersError && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs overflow-x-auto">
          <h3 className="text-xs font-black text-slate-800 dark:text-white mb-3">{t('جدول المناقصات', 'Tenders Registry')}</h3>
          {filteredTenders.length === 0 ? (
            <p className="text-[11px] text-slate-400 font-bold text-center py-6">{t('لا توجد مناقصات مطابقة لمعايير البحث.', 'No tenders match your search.')}</p>
          ) : (
            <table className="w-full text-[10px] font-bold">
              <thead>
                <tr className="text-slate-400 border-b border-slate-200">
                  <th className="text-start py-2 px-2">{t('رقم المناقصة', 'Tender No.')}</th>
                  <th className="text-start py-2 px-2">{t('العنوان', 'Title')}</th>
                  <th className="text-start py-2 px-2">{t('نوع', 'Type')}</th>
                  <th className="text-start py-2 px-2">{t('إجراء', 'Process')}</th>
                  <th className="text-end py-2 px-2">{t('القيمة', 'Value')}</th>
                  <th className="text-end py-2 px-2">{t('العروض', 'Bids')}</th>
                  <th className="text-center py-2 px-2">{t('الحالة', 'Status')}</th>
                  <th className="text-center py-2 px-2">{t('إجراءات', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenders.map(tnd => (
                  <tr key={tnd.id} className="border-b border-slate-100 hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                    <td className="py-2 px-2 font-mono text-slate-600">{tnd.tender_number}</td>
                    <td className="py-2 px-2 text-slate-800 dark:text-white max-w-[200px] truncate">{lang === 'ar' ? tnd.title_ar : (tnd.title_en || tnd.title_ar)}</td>
                    <td className="py-2 px-2">{tnd.tender_type}</td>
                    <td className="py-2 px-2">{tnd.process_type}</td>
                    <td className="py-2 px-2 text-end font-mono">{tnd.estimated_value?.toLocaleString()} {tnd.currency_code}</td>
                    <td className="py-2 px-2 text-end font-mono text-slate-600">{tnd.bids_count || 0}</td>
                    <td className="py-2 px-2 text-center"><StatusBadge status={tnd.status} lang={lang} size="sm" /></td>
                    <td className="py-2 px-2 text-center">
                      <button onClick={() => openTenderDetail(tnd)}
                        className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateTenderModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        lang={lang} projects={projects}
        onSubmit={handleCreateSuccess}
      />

      {detailTender && (
        <TenderDetailDrawer
          open={!!detailTender}
          onClose={handleCloseDetail}
          tender={detailTender}
          bids={detailBids}
          lang={lang}
          projects={projects}
          onRefresh={handleDetailRefresh}
        />
      )}
    </div>
  );
}