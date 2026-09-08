import { showToast } from './enterprise/EnterpriseToastContainer';
import React, { useState, useMemo } from 'react';
import {
  Plus, Search, SlidersHorizontal, X, Check, Edit, Trash2,
  DollarSign, Calendar, AlertTriangle, RefreshCw,
  FileText, TrendingUp, Clock, Download, Printer, BarChart3,
  AlertCircle, CheckCircle2, Eye, Handshake, Target, Repeat
} from 'lucide-react';
import { ModuleShell } from './enterprise/ModuleShell';
import { generateNumericCode, generateShortId } from '../lib/idGenerator';
import { Spinner } from '../design-system/components/Spinner';
import { printHTML } from '../lib/printUtils';
import { cn } from '../design-system/utils/cn';
import { ConfirmDialog } from '../design-system/components/ConfirmDialog';
import { EnterpriseButton } from './common/EnterpriseButton';

const COMMITMENT_TYPES = [
  { value: 'BUDGET', labelAr: 'تعهد ميزانيي', labelEn: 'Budget Commitment' },
  { value: 'DONOR', labelAr: 'تعهد منحة', labelEn: 'Donor Commitment' },
  { value: 'CONTRACTUAL', labelAr: 'تعهد تعاقدي', labelEn: 'Contractual' },
  { value: 'SPONSORSHIP', labelAr: 'تعهد كفالة', labelEn: 'Sponsorship' },
  { value: 'INTER_ORG', labelAr: 'تعهد بين مؤسسي', labelEn: 'Inter-Organization' },
  { value: 'GRANT', labelAr: 'تعهد منحة دولية', labelEn: 'Grant' },
  { value: 'OTHER', labelAr: 'تعهد آخر', labelEn: 'Other' },
];

const OBLIGATION_TYPES = [
  { value: 'RECURRING', labelAr: 'التزام دوري', labelEn: 'Recurring' },
  { value: 'CONTRACTUAL', labelAr: 'التزام تعاقدي', labelEn: 'Contractual' },
  { value: 'REGULATORY', labelAr: 'التزام قانوني', labelEn: 'Regulatory' },
  { value: 'BENEFICIARY', labelAr: 'التزام تجاه المستفيدين', labelEn: 'Beneficiary' },
  { value: 'DONOR', labelAr: 'التزام تجاه المانحين', labelEn: 'Donor' },
  { value: 'OTHER', labelAr: 'التزام آخر', labelEn: 'Other' },
];

const PERIODICITY_OPTIONS = [
  { value: 'ONE_TIME', labelAr: 'مرة واحدة', labelEn: 'One Time' },
  { value: 'MONTHLY', labelAr: 'شهري', labelEn: 'Monthly' },
  { value: 'QUARTERLY', labelAr: 'ربع سنوي', labelEn: 'Quarterly' },
  { value: 'SEMESTER', labelAr: 'نصف سنوي', labelEn: 'Semi-Annual' },
  { value: 'ANNUAL', labelAr: 'سنوي', labelEn: 'Annual' },
  { value: 'CUSTOM', labelAr: 'مخصص', labelEn: 'Custom' },
];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300',
  SUBMITTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  APPROVED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  PARTIALLY_FULFILLED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  PARTIALLY_PAID: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  FULFILLED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  PAID: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  CLOSED: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  CANCELLED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  SUSPENDED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

interface CommitmentsObligationsViewProps {
  commitments?: any[];
  obligations?: any[];
  programs?: any[];
  projects?: any[];
  currencies?: any[];
  beneficiaries?: any[];
  loading?: boolean;
  onRefresh?: () => void;
  lang: 'ar' | 'en';
  onNavigate?: (tab: string) => void;
}

export default function CommitmentsObligationsView({
  commitments = [],
  obligations = [],
  programs = [],
  projects = [],
  currencies = [],
  beneficiaries = [],
  loading = false,
  onRefresh = () => {},
  lang,
  onNavigate
}: CommitmentsObligationsViewProps) {
  const isRtl = lang === 'ar';
  const [activeSubTab, setActiveSubTab] = useState<'commitments' | 'obligations' | 'reports' | 'analytics'>('commitments');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [modalMode, setModalMode] = useState<'commitment' | 'obligation'>('commitment');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<any | null>(null);
  const [paymentMode, setPaymentMode] = useState<'commitment' | 'obligation'>('commitment');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ item: any; mode: 'commitment' | 'obligation' } | null>(null);

  const [formData, setFormData] = useState({
    titleAr: '', titleEn: '', description: '',
    commitmentType: 'BUDGET', obligationType: 'RECURRING',
    totalAmount: '', currencyCode: 'YER', periodicity: 'ONE_TIME',
    priority: 'NORMAL', startDate: '', endDate: '', nextDueDate: '',
    committedBy: '', referenceDocument: '', internalNotes: '',
    projectId: '', programId: '',
  });

  const filteredCommitments = useMemo(() => {
    return commitments.filter((c: any) => {
      const matchSearch = !searchTerm ||
        c.title_ar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.commitment_number?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'ALL' || c.status === filterStatus;
      const matchType = filterType === 'ALL' || c.commitment_type === filterType;
      return matchSearch && matchStatus && matchType;
    });
  }, [commitments, searchTerm, filterStatus, filterType]);

  const filteredObligations = useMemo(() => {
    return obligations.filter((o: any) => {
      const matchSearch = !searchTerm ||
        o.title_ar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.obligation_number?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'ALL' || o.status === filterStatus;
      const matchType = filterType === 'ALL' || o.obligation_type === filterType;
      return matchSearch && matchStatus && matchType;
    });
  }, [obligations, searchTerm, filterStatus, filterType]);

  const analyticsData = useMemo(() => {
    const totalCommitmentAmount = commitments.reduce((sum: number, c: any) => sum + parseFloat(c.total_amount || '0'), 0);
    const totalSpentAmount = commitments.reduce((sum: number, c: any) => sum + parseFloat(c.spent_amount || '0'), 0);
    const totalObligationAmount = obligations.reduce((sum: number, o: any) => sum + parseFloat(o.total_amount || '0'), 0);
    const totalPaidAmount = obligations.reduce((sum: number, o: any) => sum + parseFloat(o.paid_amount || '0'), 0);
    const overdueObligations = obligations.filter((o: any) =>
      o.status === 'OVERDUE' || (o.next_due_date && new Date(o.next_due_date) < new Date() && ['ACTIVE', 'PARTIALLY_PAID'].includes(o.status))
    ).length;
    return {
      totalCommitmentAmount, totalSpentAmount, totalObligationAmount, totalPaidAmount,
      commitmentFulfillmentPct: totalCommitmentAmount > 0 ? ((totalSpentAmount / totalCommitmentAmount) * 100).toFixed(1) : '0',
      obligationPaymentPct: totalObligationAmount > 0 ? ((totalPaidAmount / totalObligationAmount) * 100).toFixed(1) : '0',
      overdueObligations, totalCommitments: commitments.length, totalObligations: obligations.length,
    };
  }, [commitments, obligations]);

  const getProjectName = (id: string) => {
    if (!id) return isRtl ? 'غير مرتبط' : 'Unlinked';
    const match = projects.find((p: any) => p.id === id);
    return match ? (isRtl ? (match.title_ar || match.name_ar) : (match.title_en || match.name_en)) : isRtl ? 'غير معروف' : 'Unknown';
  };

  const getProgramName = (id: string) => {
    if (!id) return isRtl ? 'غير مرتبط' : 'Unlinked';
    const match = programs.find((p: any) => p.id === id);
    return match ? (isRtl ? (match.name_ar || match.name_en) : (match.name_en || match.name_ar)) : isRtl ? 'غير معروف' : 'Unknown';
  };

  const getCurrencySymbol = (code: string) => {
    if (code === 'YER') return isRtl ? 'ر.ي' : 'YER';
    if (code === 'USD') return '$';
    return code;
  };

  const formatAmount = (amount: string | number) =>
    parseFloat(amount as string || '0').toLocaleString(isRtl ? 'ar-YE' : 'en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const getTypeLabel = (type: string, forCommitment: boolean) => {
    const list = forCommitment ? COMMITMENT_TYPES : OBLIGATION_TYPES;
    const match = list.find(t => t.value === type);
    return match ? (isRtl ? match.labelAr : match.labelEn) : type;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      DRAFT: { ar: 'مسودة', en: 'Draft' }, SUBMITTED: { ar: 'مقدم', en: 'Submitted' },
      APPROVED: { ar: 'معتمد', en: 'Approved' }, ACTIVE: { ar: 'نشط', en: 'Active' },
      PARTIALLY_FULFILLED: { ar: 'منجز جزئياً', en: 'Partially Fulfilled' },
      PARTIALLY_PAID: { ar: 'مدفوع جزئياً', en: 'Partially Paid' },
      FULFILLED: { ar: 'منجز', en: 'Fulfilled' }, PAID: { ar: 'مدفوع', en: 'Paid' },
      CLOSED: { ar: 'مغلق', en: 'Closed' }, CANCELLED: { ar: 'ملغي', en: 'Cancelled' },
      SUSPENDED: { ar: 'معلق', en: 'Suspended' }, OVERDUE: { ar: 'متأخر', en: 'Overdue' },
    };
    const l = labels[status] || { ar: status, en: status };
    return isRtl ? l.ar : l.en;
  };

  const openAddModal = (mode: 'commitment' | 'obligation') => {
    setEditingItem(null);
    setModalMode(mode);
    setFormData({ titleAr: '', titleEn: '', description: '', commitmentType: 'BUDGET', obligationType: 'RECURRING', totalAmount: '', currencyCode: 'YER', periodicity: 'ONE_TIME', priority: 'NORMAL', startDate: '', endDate: '', nextDueDate: '', committedBy: '', referenceDocument: '', internalNotes: '', projectId: '', programId: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (item: any, mode: 'commitment' | 'obligation') => {
    setEditingItem(item);
    setModalMode(mode);
    setFormData({
      titleAr: item.title_ar || '', titleEn: item.title_en || '', description: item.description || '',
      commitmentType: item.commitment_type || 'BUDGET', obligationType: item.obligation_type || 'RECURRING',
      totalAmount: item.total_amount || '', currencyCode: item.currency_code || 'YER',
      periodicity: item.periodicity || 'ONE_TIME', priority: item.priority || 'NORMAL',
      startDate: item.start_date ? item.start_date.split('T')[0] : '',
      endDate: item.end_date ? item.end_date.split('T')[0] : '',
      nextDueDate: item.next_due_date ? item.next_due_date.split('T')[0] : '',
      committedBy: item.committed_by || item.created_by || '',
      referenceDocument: item.reference_document || '', internalNotes: item.internal_notes || '',
      projectId: item.project_id || '', programId: item.program_id || '',
    });
    setIsModalOpen(true);
  };

  const openPaymentModal = (item: any, mode: 'commitment' | 'obligation') => {
    setPaymentTarget(item);
    setPaymentMode(mode);
    setIsPaymentModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.titleAr.trim()) { showToast({ type: 'error', title: isRtl ? 'خطأ' : 'Error', message: isRtl ? 'الرجاء إدخال العنوان' : 'Title is required' }); return; }
    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) { showToast({ type: 'error', title: isRtl ? 'خطأ' : 'Error', message: isRtl ? 'الرجاء إدخال المبلغ' : 'Amount is required' }); return; }
    setFormSubmitting(true);
    try {
      const endpoint = modalMode === 'commitment' ? 'commitments' : 'obligations';
      const payload: any = {
        title_ar: formData.titleAr, title_en: formData.titleEn, description: formData.description,
        total_amount: formData.totalAmount, currency_code: formData.currencyCode,
        periodicity: formData.periodicity, priority: formData.priority,
        start_date: formData.startDate || null, end_date: formData.endDate || null,
        next_due_date: formData.nextDueDate || null, committed_by: formData.committedBy,
        reference_document: formData.referenceDocument, internal_notes: formData.internalNotes,
        project_id: formData.projectId || null, program_id: formData.programId || null,
        status: editingItem ? editingItem.status : 'ACTIVE',
        is_periodic: formData.periodicity !== 'ONE_TIME',
      };
      if (modalMode === 'commitment') {
        payload.commitment_type = formData.commitmentType;
        payload.commitment_number = editingItem?.commitment_number || `COM-${new Date().getFullYear()}-${generateShortId()}`;
      } else {
        payload.obligation_type = formData.obligationType;
        payload.obligation_number = editingItem?.obligation_number || `OBL-${new Date().getFullYear()}-${generateShortId()}`;
      }
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem ? `/api/tables/${endpoint}/${editingItem.id}` : `/api/tables/${endpoint}`;
      const token = localStorage.getItem('nexora_auth_token');
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Save failed');
      showToast({ type: 'success', title: isRtl ? 'نجاح' : 'Success', message: editingItem ? (isRtl ? 'تم التحديث بنجاح' : 'Updated successfully') : (isRtl ? 'تم الإنشاء بنجاح' : 'Created successfully') });
      setIsModalOpen(false);
      onRefresh();
    } catch { showToast({ type: 'error', title: isRtl ? 'خطأ' : 'Error', message: isRtl ? 'خطأ أثناء الحفظ' : 'Error saving record' }); }
    finally { setFormSubmitting(false); }
  };

  const handleDelete = async (item: any, mode: 'commitment' | 'obligation') => {
    setDeleteTarget({ item, mode });
    setConfirmDelete(true);
  };

  const confirmDeleteAction = async () => {
    if (!deleteTarget) return;
    const { item, mode } = deleteTarget;
    try {
      const endpoint = mode === 'commitment' ? 'commitments' : 'obligations';
      const token = localStorage.getItem('nexora_auth_token');
      const res = await fetch(`/api/tables/${endpoint}/${item.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error('Delete failed');
      showToast({ type: 'success', title: isRtl ? 'نجاح' : 'Success', message: isRtl ? 'تم الحذف بنجاح' : 'Deleted successfully' });
      onRefresh();
    } catch { showToast({ type: 'error', title: isRtl ? 'خطأ' : 'Error', message: isRtl ? 'خطأ أثناء الحذف' : 'Error deleting record' }); }
    setConfirmDelete(false);
    setDeleteTarget(null);
  };

  const handleRecordPayment = async (amount: string, method: string, notes: string) => {
    if (!paymentTarget || !amount || parseFloat(amount) <= 0) return;
    try {
      const endpoint = paymentMode === 'commitment' ? 'commitment_payments' : 'obligation_payments';
      const paymentNumber = `PAY-${new Date().getFullYear()}-${generateShortId()}`;
      const token = localStorage.getItem('nexora_auth_token');
      const res = await fetch(`/api/tables/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          [paymentMode === 'commitment' ? 'commitment_id' : 'obligation_id']: paymentTarget.id,
          payment_number: paymentNumber,
          payment_amount: amount,
          currency_code: paymentTarget.currency_code,
          payment_date: new Date().toISOString(),
          payment_method: method,
          notes,
          status: 'COMPLETED',
        }),
      });
      if (!res.ok) throw new Error('Payment failed');
      const parentEndpoint = paymentMode === 'commitment' ? 'commitments' : 'obligations';
      const currentSpent = parseFloat(paymentMode === 'commitment' ? paymentTarget.spent_amount : paymentTarget.paid_amount || '0');
      const totalAmount = parseFloat(paymentTarget.total_amount || '0');
      const newSpent = currentSpent + parseFloat(amount);
      const newStatus = newSpent >= totalAmount
        ? (paymentMode === 'commitment' ? 'FULFILLED' : 'PAID')
        : (paymentMode === 'commitment' ? 'PARTIALLY_FULFILLED' : 'PARTIALLY_PAID');
      await fetch(`/api/tables/${parentEndpoint}/${paymentTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          [paymentMode === 'commitment' ? 'spent_amount' : 'paid_amount']: newSpent.toString(),
          status: newStatus,
        }),
      });
      showToast({ type: 'success', title: isRtl ? 'نجاح' : 'Success', message: isRtl ? 'تم تسجيل الدفعة' : 'Payment recorded' });
      setIsPaymentModalOpen(false);
      onRefresh();
    } catch {
      showToast({ type: 'error', title: isRtl ? 'خطأ' : 'Error', message: isRtl ? 'خطأ في تسجيل الدفعة' : 'Error recording payment' });
    }
  };

  const handlePrint = (item: any, mode: 'commitment' | 'obligation') => {
    const isCommitment = mode === 'commitment';
    const total = parseFloat(item.total_amount || '0');
    const spent = parseFloat(isCommitment ? item.spent_amount : item.paid_amount || '0');
    const remaining = total - spent;
    const pct = total > 0 ? ((spent / total) * 100).toFixed(1) : '0';
    const num = isCommitment ? item.commitment_number : item.obligation_number;
    const title = isCommitment ? (isRtl ? 'سند تعهد' : 'Commitment') : (isRtl ? 'سند التزام' : 'Obligation');

    printHTML(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>${title} - ${num}</title>
      <style>body{font-family:'Segoe UI',Tahoma,sans-serif;padding:25px;color:#1e293b;line-height:1.6;}
      .header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #059669;padding-bottom:15px;margin-bottom:20px;}
      .logo{height:60px;}.title-box{text-align:center;}.title-box h2{margin:0;color:#059669;font-size:18px;font-weight:900;}
      .title-box p{margin:2px 0 0;font-size:11px;color:#64748b;}
      .info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;background:#f8fafc;padding:15px;border-radius:12px;border:1px solid #e2e8f0;font-size:12px;}
      .info-item span{font-weight:bold;color:#475569;display:block;font-size:10px;text-transform:uppercase;}
      .info-item strong{color:#0f172a;font-size:12px;}</style></head><body>
      <div class="header"><img src="/UAMEX_ERPLOGO.png" class="logo" alt="Logo" onerror="this.src='/LogoRohamaab.png'" />
      <div class="title-box"><h2>جمعية رُحماء بينهم</h2><p>UAMEX ERP™ ${title} — ${num}</p></div>
      <div style="text-align:left;font-size:10px;font-family:monospace;"><div><strong>رقم:</strong> ${num}</div><div><strong>التاريخ:</strong> ${new Date().toLocaleDateString('ar-EG')}</div></div></div>
      <div class="info-grid">
        <div class="info-item"><span>النوع</span><strong>${getTypeLabel(isCommitment ? item.commitment_type : item.obligation_type, isCommitment)}</strong></div>
        <div class="info-item"><span>العنوان</span><strong>${item.title_ar}</strong></div>
        <div class="info-item"><span>الأولوية</span><strong>${item.priority}</strong></div>
        <div class="info-item"><span>المبلغ الإجمالي</span><strong>${formatAmount(total)} ${getCurrencySymbol(item.currency_code)}</strong></div>
        <div class="info-item"><span>${isCommitment ? 'المصروف' : 'المدفوع'}</span><strong>${formatAmount(spent)}</strong></div>
        <div class="info-item"><span>المتبقي</span><strong>${formatAmount(remaining)}</strong></div>
        <div class="info-item"><span>الحالة</span><strong>${getStatusLabel(item.status)}</strong></div>
        <div class="info-item"><span>النسبة</span><strong>${pct}%</strong></div>
      </div></body></html>`);
  };

  const subTabs = [
    { id: 'commitments' as const, labelAr: 'التعهدات', labelEn: 'Commitments', icon: Handshake },
    { id: 'obligations' as const, labelAr: 'الالتزامات', labelEn: 'Obligations', icon: Target },
    { id: 'reports' as const, labelAr: 'التقارير', labelEn: 'Reports', icon: BarChart3 },
    { id: 'analytics' as const, labelAr: 'التحليليات', labelEn: 'Analytics', icon: TrendingUp },
  ];

  return (
    <ModuleShell
      titleAr="نظام التعهدات والالتزامات الدورية"
      titleEn="Commitments & Periodic Obligations OS"
      descAr="إدارة التعهدات المالية والالتزامات الدورية مع التقارير والتحليليات والمستندات"
      descEn="Manage financial commitments and periodic obligations with reports, analytics, and documents"
      domainCode="NEB-08/NEB-10"
      icon={Handshake}
      accent="emerald"
      lang={lang}
      breadcrumbs={[
        { label: isRtl ? 'لوحة التحكم' : 'Dashboard', onClick: () => onNavigate?.('dashboard') },
        { label: isRtl ? 'التعهدات والالتزامات' : 'Commitments & Obligations' },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={onRefresh} className="h-8 px-3 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all text-[10px] font-bold flex items-center gap-1.5 cursor-pointer">
            <Spinner size="xs" />{isRtl ? 'تحديث' : 'Refresh'}
          </button>
          <EnterpriseButton variant="primary" size="xs" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => openAddModal('commitment')}>
            {isRtl ? 'تعهد جديد' : 'New Commitment'}
          </EnterpriseButton>
          <EnterpriseButton variant="accent" size="xs" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => openAddModal('obligation')}>
            {isRtl ? 'التزام جديد' : 'New Obligation'}
          </EnterpriseButton>
        </div>
      }
      filters={
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5">
            {subTabs.map(tab => (
              <button key={tab.id} onClick={() => { setActiveSubTab(tab.id); setModalMode(tab.id === 'commitments' || tab.id === 'reports' || tab.id === 'analytics' ? 'commitment' : 'obligation'); }}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${activeSubTab === tab.id ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700'}`}>
                <tab.icon className="w-3 h-3" />{isRtl ? tab.labelAr : tab.labelEn}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder={isRtl ? 'بحث...' : 'Search...'}
              className="w-full h-8 pl-9 pr-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs text-slate-700 dark:text-zinc-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`h-8 px-3 rounded-lg border text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${showFilters ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 border-emerald-300' : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'}`}>
            <SlidersHorizontal className="w-3.5 h-3.5" />{isRtl ? 'فلاتر' : 'Filters'}
          </button>
          {showFilters && (<>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-8 px-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-[10px] font-bold text-slate-700 dark:text-zinc-300">
              <option value="ALL">{isRtl ? 'كل الحالات' : 'All Status'}</option>
              {['DRAFT','ACTIVE','PARTIALLY_FULFILLED','FULFILLED','CLOSED','CANCELLED','OVERDUE'].map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="h-8 px-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-[10px] font-bold text-slate-700 dark:text-zinc-300">
              <option value="ALL">{isRtl ? 'كل الأنواع' : 'All Types'}</option>
              {(activeSubTab === 'commitments' ? COMMITMENT_TYPES : OBLIGATION_TYPES).map(t => <option key={t.value} value={t.value}>{isRtl ? t.labelAr : t.labelEn}</option>)}
            </select>
          </>)}
        </div>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400">{isRtl ? 'إجمالي التعهدات' : 'Total Commitments'}</span>
            <Handshake className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-800 dark:text-emerald-200">{analyticsData.totalCommitments}</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">{formatAmount(analyticsData.totalCommitmentAmount)} {getCurrencySymbol('YER')}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400">{isRtl ? 'إجمالي الالتزامات' : 'Total Obligations'}</span>
            <Target className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-800 dark:text-amber-200">{analyticsData.totalObligations}</p>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">{formatAmount(analyticsData.totalObligationAmount)} {getCurrencySymbol('YER')}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400">{isRtl ? 'نسبة الإنجاز' : 'Fulfillment'}</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-800 dark:text-blue-200">{analyticsData.commitmentFulfillmentPct}%</p>
          <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-1.5 mt-2">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, parseFloat(analyticsData.commitmentFulfillmentPct))}%` }} />
          </div>
        </div>
        <div className={`bg-gradient-to-br rounded-xl p-4 border ${analyticsData.overdueObligations > 0 ? 'from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-950/30 border-red-200/60 dark:border-red-800/40' : 'from-slate-50 to-slate-100/50 dark:from-zinc-800/50 dark:to-zinc-900/50 border-slate-200/60 dark:border-zinc-700/40'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[9px] font-black uppercase ${analyticsData.overdueObligations > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500'}`}>{isRtl ? 'متأخرة' : 'Overdue'}</span>
            <AlertCircle className={`w-4 h-4 ${analyticsData.overdueObligations > 0 ? 'text-red-500' : 'text-slate-400'}`} />
          </div>
          <p className={`text-2xl font-black ${analyticsData.overdueObligations > 0 ? 'text-red-800 dark:text-red-200' : 'text-slate-700 dark:text-zinc-200'}`}>{analyticsData.overdueObligations}</p>
        </div>
      </div>

      {/* Commitments Table */}
      {activeSubTab === 'commitments' && (
        <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
                  {['رقم التعهد','النوع','العنوان','المبلغ','المصروف','النسبة','الحالة','الأولوية','إجراءات'].map(h => (
                    <th key={h} className="px-4 py-3 text-right font-black text-slate-600 dark:text-zinc-300 uppercase text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                {filteredCommitments.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <Handshake className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-bold">{isRtl ? 'لا توجد تعهدات' : 'No commitments'}</p>
                  </td></tr>
                ) : filteredCommitments.map((item: any) => {
                  const total = parseFloat(item.total_amount || '0');
                  const spent = parseFloat(item.spent_amount || '0');
                  const pct = total > 0 ? Math.min(100, (spent / total) * 100) : 0;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-zinc-300">{item.commitment_number}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded text-[10px] font-bold text-slate-600 dark:text-zinc-400">{getTypeLabel(item.commitment_type, true)}</span></td>
                      <td className="px-4 py-3 max-w-[200px] truncate font-bold text-slate-800 dark:text-zinc-200">{item.title_ar}</td>
                      <td className="px-4 py-3 font-bold text-slate-700 dark:text-zinc-300">{formatAmount(total)} <span className="text-[9px] text-slate-400">{getCurrencySymbol(item.currency_code)}</span></td>
                      <td className="px-4 py-3 font-bold text-slate-700 dark:text-zinc-300">{formatAmount(spent)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 dark:bg-zinc-700 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[9px] font-bold text-slate-500 w-8 text-left">{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[item.status] || STATUS_COLORS.DRAFT}`}>{getStatusLabel(item.status)}</span></td>
                      <td className="px-4 py-3 text-[10px] font-bold text-slate-600 dark:text-zinc-400">{item.priority}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEditModal(item, 'commitment')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"><Edit className="w-3.5 h-3.5 text-blue-500" /></button>
                          <button onClick={() => openPaymentModal(item, 'commitment')} className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg cursor-pointer"><DollarSign className="w-3.5 h-3.5 text-emerald-500" /></button>
                          <button onClick={() => handlePrint(item, 'commitment')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"><Printer className="w-3.5 h-3.5 text-slate-500" /></button>
                          <button onClick={() => handleDelete(item, 'commitment')} className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg cursor-pointer"><Trash2 className="w-3.5 h-3.5 text-rose-500" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Obligations Table */}
      {activeSubTab === 'obligations' && (
        <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
                  {['رقم الالتزام','النوع','العنوان','المبلغ','المدفوع','الدورية','الحالة','الاستحقاق','إجراءات'].map(h => (
                    <th key={h} className="px-4 py-3 text-right font-black text-slate-600 dark:text-zinc-300 uppercase text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                {filteredObligations.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-bold">{isRtl ? 'لا توجد التزامات' : 'No obligations'}</p>
                  </td></tr>
                ) : filteredObligations.map((item: any) => {
                  const total = parseFloat(item.total_amount || '0');
                  const paid = parseFloat(item.paid_amount || '0');
                  const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
                  const isOverdue = item.next_due_date && new Date(item.next_due_date) < new Date() && ['ACTIVE', 'PARTIALLY_PAID'].includes(item.status);
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors ${isOverdue ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                      <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-zinc-300">{item.obligation_number}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded text-[10px] font-bold text-slate-600 dark:text-zinc-400">{getTypeLabel(item.obligation_type, false)}</span></td>
                      <td className="px-4 py-3 max-w-[200px] truncate font-bold text-slate-800 dark:text-zinc-200">{item.title_ar}</td>
                      <td className="px-4 py-3 font-bold text-slate-700 dark:text-zinc-300">{formatAmount(total)} <span className="text-[9px] text-slate-400">{getCurrencySymbol(item.currency_code)}</span></td>
                      <td className="px-4 py-3 font-bold text-slate-700 dark:text-zinc-300">{formatAmount(paid)}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 rounded text-[10px] font-bold text-blue-600 dark:text-blue-400">{PERIODICITY_OPTIONS.find(p => p.value === item.periodicity)?.[isRtl ? 'labelAr' : 'labelEn'] || item.periodicity}</span></td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[item.status] || STATUS_COLORS.DRAFT}`}>{getStatusLabel(item.status)}</span></td>
                      <td className={`px-4 py-3 text-[10px] font-bold ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-zinc-400'}`}>
                        {item.next_due_date ? new Date(item.next_due_date).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US') : '-'}
                        {isOverdue && <span className="mr-1 text-red-500">&#9888;</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEditModal(item, 'obligation')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"><Edit className="w-3.5 h-3.5 text-blue-500" /></button>
                          <button onClick={() => openPaymentModal(item, 'obligation')} className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg cursor-pointer"><DollarSign className="w-3.5 h-3.5 text-emerald-500" /></button>
                          <button onClick={() => handlePrint(item, 'obligation')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"><Printer className="w-3.5 h-3.5 text-slate-500" /></button>
                          <button onClick={() => handleDelete(item, 'obligation')} className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg cursor-pointer"><Trash2 className="w-3.5 h-3.5 text-rose-500" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reports */}
      {activeSubTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-6">
            <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />{isRtl ? 'ملخص التعهدات' : 'Commitments Summary'}
            </h3>
            <div className="space-y-3">
              {COMMITMENT_TYPES.map(type => {
                const items = commitments.filter((c: any) => c.commitment_type === type.value);
                if (items.length === 0) return null;
                const total = items.reduce((s: number, c: any) => s + parseFloat(c.total_amount || '0'), 0);
                return (
                  <div key={type.value} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-zinc-400">{isRtl ? type.labelAr : type.labelEn}</span>
                    <span className="font-bold text-slate-700 dark:text-zinc-300">{items.length} | {formatAmount(total)} {getCurrencySymbol('YER')}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-6">
            <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-500" />{isRtl ? 'ملخص الالتزامات' : 'Obligations Summary'}
            </h3>
            <div className="space-y-3">
              {PERIODICITY_OPTIONS.map(per => {
                const items = obligations.filter((o: any) => o.periodicity === per.value);
                if (items.length === 0) return null;
                const total = items.reduce((s: number, o: any) => s + parseFloat(o.total_amount || '0'), 0);
                const paid = items.reduce((s: number, o: any) => s + parseFloat(o.paid_amount || '0'), 0);
                return (
                  <div key={per.value} className="text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-600 dark:text-zinc-400">{isRtl ? per.labelAr : per.labelEn}</span>
                      <span className="font-bold text-slate-700 dark:text-zinc-300">{formatAmount(paid)}/{formatAmount(total)}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-zinc-700 rounded-full h-1.5">
                      <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${total > 0 ? (paid / total) * 100 : 0}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Analytics */}
      {activeSubTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-6">
            <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200 mb-4">{isRtl ? 'تحليل التعهدات' : 'Commitment Analysis'}</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="text-slate-500">{isRtl ? 'المنجز' : 'Spent'}</span><span className="font-bold">{formatAmount(analyticsData.totalSpentAmount)}</span></div>
                <div className="w-full bg-slate-200 dark:bg-zinc-700 rounded-full h-3">
                  <div className="bg-emerald-500 h-3 rounded-full flex items-center justify-center text-[8px] text-white font-black" style={{ width: `${Math.min(100, parseFloat(analyticsData.commitmentFulfillmentPct))}%` }}>{analyticsData.commitmentFulfillmentPct}%</div>
                </div>
              </div>
              <div className="text-center pt-4 border-t border-slate-100 dark:border-zinc-800">
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{formatAmount(analyticsData.totalCommitmentAmount)}</p>
                <p className="text-[10px] text-slate-500">{isRtl ? 'إجمالي التعهدات' : 'Total Commitments'} ({getCurrencySymbol('YER')})</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-6">
            <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200 mb-4">{isRtl ? 'تحليل الالتزامات' : 'Obligation Analysis'}</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="text-slate-500">{isRtl ? 'المدفوع' : 'Paid'}</span><span className="font-bold">{formatAmount(analyticsData.totalPaidAmount)}</span></div>
                <div className="w-full bg-slate-200 dark:bg-zinc-700 rounded-full h-3">
                  <div className="bg-amber-500 h-3 rounded-full flex items-center justify-center text-[8px] text-white font-black" style={{ width: `${Math.min(100, parseFloat(analyticsData.obligationPaymentPct))}%` }}>{analyticsData.obligationPaymentPct}%</div>
                </div>
              </div>
              <div className="text-center pt-4 border-t border-slate-100 dark:border-zinc-800">
                <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{formatAmount(analyticsData.totalObligationAmount)}</p>
                <p className="text-[10px] text-slate-500">{isRtl ? 'إجمالي الالتزامات' : 'Total Obligations'} ({getCurrencySymbol('YER')})</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-6">
            <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200 mb-4">{isRtl ? 'مؤشرات الأداء' : 'Performance KPIs'}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-900 rounded-lg">
                <span className="text-xs text-slate-600 dark:text-zinc-400">{isRtl ? 'التعهدات النشطة' : 'Active Commitments'}</span>
                <span className="text-lg font-black text-emerald-600">{commitments.filter((c: any) => c.status === 'ACTIVE').length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-900 rounded-lg">
                <span className="text-xs text-slate-600 dark:text-zinc-400">{isRtl ? 'الالتزامات النشطة' : 'Active Obligations'}</span>
                <span className="text-lg font-black text-amber-600">{obligations.filter((o: any) => ['ACTIVE', 'PARTIALLY_PAID'].includes(o.status)).length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                <span className="text-xs text-slate-600 dark:text-zinc-400">{isRtl ? 'متأخرات' : 'Overdue'}</span>
                <span className="text-lg font-black text-red-600">{analyticsData.overdueObligations}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200">
                {editingItem ? (isRtl ? 'تعديل' : 'Edit') : (isRtl ? 'إضافة' : 'Add')} {modalMode === 'commitment' ? (isRtl ? 'تعهد' : 'Commitment') : (isRtl ? 'التزام' : 'Obligation')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'العنوان بالعربية *' : 'Title (Ar) *'}</label>
                  <input type="text" value={formData.titleAr} onChange={e => setFormData({ ...formData, titleAr: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/30 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'العنوان بالإنجليزية' : 'Title (En)'}</label>
                  <input type="text" value={formData.titleEn} onChange={e => setFormData({ ...formData, titleEn: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/30 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'الوصف' : 'Description'}</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/30 focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'النوع *' : 'Type *'}</label>
                  <select value={modalMode === 'commitment' ? formData.commitmentType : formData.obligationType}
                    onChange={e => modalMode === 'commitment' ? setFormData({ ...formData, commitmentType: e.target.value }) : setFormData({ ...formData, obligationType: e.target.value })}
                    className="w-full h-9 px-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs">
                    {(modalMode === 'commitment' ? COMMITMENT_TYPES : OBLIGATION_TYPES).map(t => <option key={t.value} value={t.value}>{isRtl ? t.labelAr : t.labelEn}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'المبلغ الإجمالي *' : 'Total Amount *'}</label>
                  <input type="number" value={formData.totalAmount} onChange={e => setFormData({ ...formData, totalAmount: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/30 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'العملة' : 'Currency'}</label>
                  <select value={formData.currencyCode} onChange={e => setFormData({ ...formData, currencyCode: e.target.value })}
                    className="w-full h-9 px-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs">
                    <option value="YER">YER</option><option value="USD">USD</option><option value="SAR">SAR</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'الدورية' : 'Periodicity'}</label>
                  <select value={formData.periodicity} onChange={e => setFormData({ ...formData, periodicity: e.target.value })}
                    className="w-full h-9 px-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs">
                    {PERIODICITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{isRtl ? p.labelAr : p.labelEn}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'الأولوية' : 'Priority'}</label>
                  <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full h-9 px-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs">
                    <option value="LOW">{isRtl ? 'منخفضة' : 'Low'}</option><option value="NORMAL">{isRtl ? 'عادية' : 'Normal'}</option>
                    <option value="HIGH">{isRtl ? 'عالية' : 'High'}</option><option value="URGENT">{isRtl ? 'عاجلة' : 'Urgent'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'تاريخ البدء' : 'Start Date'}</label>
                  <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full h-9 px-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'تاريخ الاستحقاق' : 'Next Due Date'}</label>
                  <input type="date" value={formData.nextDueDate} onChange={e => setFormData({ ...formData, nextDueDate: e.target.value })}
                    className="w-full h-9 px-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'المرجع' : 'Reference'}</label>
                  <input type="text" value={formData.referenceDocument} onChange={e => setFormData({ ...formData, referenceDocument: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/30 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'ملاحظات داخلية' : 'Internal Notes'}</label>
                <textarea value={formData.internalNotes} onChange={e => setFormData({ ...formData, internalNotes: e.target.value })} rows={2}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/30 focus:outline-none resize-none" />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-end gap-2 rounded-b-2xl">
              <EnterpriseButton variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>{isRtl ? 'إلغاء' : 'Cancel'}</EnterpriseButton>
              <EnterpriseButton
                variant="primary"
                size="sm"
                icon={formSubmitting ? <Spinner size="xs" /> : <Check className="w-3.5 h-3.5" />}
                loading={formSubmitting}
                onClick={handleSave}
              >
                {isRtl ? 'حفظ' : 'Save'}
              </EnterpriseButton>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && paymentTarget && (
        <PaymentModal
          isRtl={isRtl}
          target={paymentTarget}
          mode={paymentMode}
          onClose={() => setIsPaymentModalOpen(false)}
          onRecord={handleRecordPayment}
          getCurrencySymbol={getCurrencySymbol}
        />
      )}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        variant="destructive"
        title="Confirm Delete"
        titleAr="تأكيد الحذف"
        description="This action cannot be undone."
        descriptionAr="لا يمكن التراجع عن هذا الإجراء."
        confirmLabelAr="حذف"
        cancelLabelAr="إلغاء"
        onConfirm={confirmDeleteAction}
        lang={isRtl ? 'ar' : 'en'}
      />
    </ModuleShell>
  );
}

function PaymentModal({ isRtl, target, mode, onClose, onRecord, getCurrencySymbol }: {
  isRtl: boolean; target: any; mode: 'commitment' | 'obligation';
  onClose: () => void; onRecord: (amount: string, method: string, notes: string) => void;
  getCurrencySymbol: (code: string) => string;
}) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('BANK_TRANSFER');
  const [notes, setNotes] = useState('');
  const total = parseFloat(target.total_amount || '0');
  const spent = parseFloat(mode === 'commitment' ? target.spent_amount : target.paid_amount || '0');
  const remaining = total - spent;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200">{isRtl ? 'تسجيل دفعة' : 'Record Payment'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 dark:bg-zinc-800 rounded-lg p-3 text-xs space-y-1">
            <div className="flex justify-between"><span className="text-slate-500">{isRtl ? 'الرقم' : 'Number'}</span><span className="font-bold">{mode === 'commitment' ? target.commitment_number : target.obligation_number}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">{isRtl ? 'المتبقي' : 'Remaining'}</span><span className="font-bold text-emerald-600">{formatAmount2(remaining)} {getCurrencySymbol(target.currency_code)}</span></div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'مبلغ الدفعة *' : 'Payment Amount *'}</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} max={remaining}
              className="w-full h-9 px-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/30 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'طريقة الدفع' : 'Payment Method'}</label>
            <select value={method} onChange={e => setMethod(e.target.value)}
              className="w-full h-9 px-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs">
              <option value="BANK_TRANSFER">{isRtl ? 'تحويل بنكي' : 'Bank Transfer'}</option>
              <option value="CASH">{isRtl ? 'نقداً' : 'Cash'}</option>
              <option value="CHECK">{isRtl ? 'شيك' : 'Check'}</option>
              <option value="MOBILE_PAYMENT">{isRtl ? 'دفع إلكتروني' : 'Mobile Payment'}</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'ملاحظات' : 'Notes'}</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full h-9 px-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/30 focus:outline-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end gap-2">
          <EnterpriseButton variant="ghost" size="sm" onClick={onClose}>{isRtl ? 'إلغاء' : 'Cancel'}</EnterpriseButton>
          <EnterpriseButton
            variant="primary"
            size="sm"
            onClick={() => onRecord(amount, method, notes)}
            disabled={!amount || parseFloat(amount) <= 0}
          >
            {isRtl ? 'تسجيل' : 'Record'}
          </EnterpriseButton>
        </div>
      </div>
    </div>
  );
}

function formatAmount2(amount: string | number) {
  return parseFloat(amount as string || '0').toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
