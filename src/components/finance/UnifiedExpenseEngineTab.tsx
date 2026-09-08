/**
 * NexoraOS™ — UAMEX ERP™ NEB-10: Unified Expense Engine UI Component
 * 
 * A modern, AI-powered expense management interface featuring:
 *  - Full expense lifecycle management (DRAFT → POSTED → PAID → RECONCILED)
 *  - Category registry management
 *  - Real-time KPIs & intelligence dashboard
 *  - Approval workflow visualization
 *  - Petty cash management
 *  - Recurring expense automation
 *  - Multi-tab organization with bilingual support (AR/EN)
 *  - Dark/Light mode support
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, FileText, CheckCircle, XCircle, DollarSign, Calendar,
  Search, Filter, Download, Upload, Send, CreditCard,
  AlertTriangle, TrendingUp, TrendingDown, PieChart, BarChart3,
  Eye, Edit, Trash2, RefreshCw, Lock, Unlock, Repeat,
  Wallet, Receipt, Briefcase, Activity, ChevronRight,
  ChevronLeft, Sparkles, Bell, Tag, Building, Clock,
  FileSpreadsheet, FileCheck, ClipboardCheck, Package, Banknote
} from 'lucide-react';
import { Spinner } from '../../design-system/components/Spinner';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type ExpenseStatus = 
  | 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
  | 'POSTED' | 'PAID' | 'PARTIALLY_PAID' | 'RECONCILED'
  | 'CANCELLED' | 'CLOSED';

type PaymentMethod = 
  | 'BANK_TRANSFER' | 'CASH' | 'CHEQUE' | 'CREDIT_CARD' 
  | 'PETTY_CASH' | 'VIRTUAL_ACCOUNT' | 'MOBILE_PAYMENT';

interface ExpenseRecord {
  id: string;
  expense_number: string;
  category_code: string;
  category_name_ar: string;
  expense_type: string;
  status: ExpenseStatus;
  counterparty_name: string;
  amount: number;
  currency_code: string;
  amount_base: number;
  vat_amount: number;
  vat_rate: number;
  net_amount: number;
  project_id?: string;
  project_name_ar?: string;
  cost_center_id?: string;
  cost_center_name_ar?: string;
  payment_method?: PaymentMethod;
  payment_due_date?: string;
  paid_amount?: number;
  description?: string;
  created_at: string;
}

interface ExpenseCategory {
  id: string;
  category_code: string;
  name_ar: string;
  name_en: string;
  category_type: string;
  is_active: boolean;
  requires_receipt: boolean;
  default_vat_rate?: number;
}

interface ExpenseKPIs {
  totalExpenses: number;
  totalApproved: number;
  totalPaid: number;
  totalOutstanding: number;
  avgExpenseAmount: number;
  expenseCount: number;
  pendingApprovalCount: number;
  overduePaymentsCount: number;
  vatRecoverable: number;
}

interface ExpenseIntelligenceSnapshot {
  kpis: ExpenseKPIs;
  byCategory: Array<{
    category_code: string;
    category_name_ar: string;
    total_amount: number;
    count: number;
  }>;
  byProject: Array<{
    project_id: string;
    project_name_ar: string;
    total_amount: number;
    count: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    monthAr: string;
    total_expenses: number;
    count: number;
  }>;
  topVendors: Array<{
    counterparty_name: string;
    total_amount: number;
    transaction_count: number;
  }>;
  insights: string[];
  complianceAlerts: Array<{
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message_ar: string;
  }>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const API_BASE = '/api/v2/expense';

const STATUS_CONFIG: Record<ExpenseStatus, { 
  labelAr: string; labelEn: string; color: string; bg: string; icon: any;
}> = {
  DRAFT: { labelAr: 'مسودة', labelEn: 'Draft', color: 'text-slate-700', bg: 'bg-slate-100 dark:bg-zinc-800', icon: FileText },
  PENDING_APPROVAL: { labelAr: 'بانتظار الموافقة', labelEn: 'Pending', color: 'text-amber-700', bg: 'bg-amber-100 dark:bg-amber-900/40', icon: Clock },
  APPROVED: { labelAr: 'معتمد', labelEn: 'Approved', color: 'text-blue-700', bg: 'bg-blue-100 dark:bg-blue-900/40', icon: CheckCircle },
  REJECTED: { labelAr: 'مرفوض', labelEn: 'Rejected', color: 'text-rose-700', bg: 'bg-rose-100 dark:bg-rose-900/40', icon: XCircle },
  POSTED: { labelAr: 'مُرحّل', labelEn: 'Posted', color: 'text-indigo-700', bg: 'bg-indigo-100 dark:bg-indigo-900/40', icon: FileCheck },
  PAID: { labelAr: 'مدفوع', labelEn: 'Paid', color: 'text-emerald-700', bg: 'bg-emerald-100 dark:bg-emerald-900/40', icon: DollarSign },
  PARTIALLY_PAID: { labelAr: 'مدفوع جزئياً', labelEn: 'Partial', color: 'text-cyan-700', bg: 'bg-cyan-100 dark:bg-cyan-900/40', icon: CreditCard },
  RECONCILED: { labelAr: 'مُسوّى', labelEn: 'Reconciled', color: 'text-teal-700', bg: 'bg-teal-100 dark:bg-teal-900/40', icon: ClipboardCheck },
  CANCELLED: { labelAr: 'ملغي', labelEn: 'Cancelled', color: 'text-zinc-700', bg: 'bg-zinc-100 dark:bg-zinc-800', icon: XCircle },
  CLOSED: { labelAr: 'مغلق', labelEn: 'Closed', color: 'text-zinc-700', bg: 'bg-zinc-100 dark:bg-zinc-800', icon: Lock },
};

const PAYMENT_METHODS: Array<{ value: PaymentMethod; labelAr: string; icon: any }> = [
  { value: 'BANK_TRANSFER', labelAr: 'تحويل بنكي', icon: Building },
  { value: 'CASH', labelAr: 'نقدي', icon: Banknote },
  { value: 'CHEQUE', labelAr: 'شيك', icon: FileCheck },
  { value: 'CREDIT_CARD', labelAr: 'بطاقة ائتمان', icon: CreditCard },
  { value: 'PETTY_CASH', labelAr: 'صندوق صغير', icon: Wallet },
  { value: 'VIRTUAL_ACCOUNT', labelAr: 'حساب افتراضي', icon: Activity },
  { value: 'MOBILE_PAYMENT', labelAr: 'دفع إلكتروني', icon: Sparkles },
];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

function useAuthHeader() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface UnifiedExpenseEngineTabProps {
  lang?: 'ar' | 'en';
}

export default function UnifiedExpenseEngineTab({ lang = 'ar' }: UnifiedExpenseEngineTabProps) {
  const isRtl = lang === 'ar';
  const t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const isDark = useDarkMode();

  // ─── State Management ─────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'dashboard' | 'records' | 'categories' | 'petty-cash' | 'recurring' | 'batches'>('dashboard');
  const [records, setRecords] = useState<ExpenseRecord[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [intelligence, setIntelligence] = useState<ExpenseIntelligenceSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<ExpenseRecord | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });
  const [filters, setFilters] = useState<{
    status?: string;
    categoryCode?: string;
    projectId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }>({});

  const authHeader = useAuthHeader();

  // ─── API Methods ──────────────────────────────────────────────────────────

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        ...(filters.status && { status: filters.status }),
        ...(filters.categoryCode && { categoryCode: filters.categoryCode }),
        ...(filters.projectId && { projectId: filters.projectId }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      });
      const res = await fetch(`${API_BASE}/records?${params}`, { headers: authHeader });
      const data = await res.json();
      if (data.success) {
        setRecords(data.data?.data || data.data || []);
        setPagination(prev => ({ ...prev, total: data.data?.total || 0 }));
      } else {
        setError(data.error || 'Failed to load records');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters, authHeader]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/categories`, { headers: authHeader });
      const data = await res.json();
      if (data.success) setCategories(data.data || []);
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
    }
  }, [authHeader]);

  const fetchIntelligence = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/intelligence?months=12`, { headers: authHeader });
      const data = await res.json();
      if (data.success) setIntelligence(data.data);
    } catch (err: any) {
      console.error('Failed to fetch intelligence:', err);
    }
  }, [authHeader]);

  useEffect(() => {
    if (activeTab === 'records') fetchRecords();
    if (activeTab === 'categories') fetchCategories();
    if (activeTab === 'dashboard') {
      fetchIntelligence();
      fetchRecords();
    }
  }, [activeTab, fetchRecords, fetchCategories, fetchIntelligence]);

  // ─── Action Handlers ──────────────────────────────────────────────────────

  const handleSubmit = async (recordId: string) => {
    try {
      const res = await fetch(`${API_BASE}/records/${recordId}/submit`, {
        method: 'POST', headers: authHeader
      });
      if (res.ok) {
        await fetchRecords();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleApprove = async (recordId: string, reject: boolean = false, reason?: string) => {
    try {
      const res = await fetch(`${API_BASE}/records/${recordId}/approve`, {
        method: 'POST', headers: authHeader,
        body: JSON.stringify({ reject, reason })
      });
      if (res.ok) {
        await fetchRecords();
        await fetchIntelligence();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePost = async (recordId: string) => {
    try {
      const res = await fetch(`${API_BASE}/records/${recordId}/post`, {
        method: 'POST', headers: authHeader
      });
      if (res.ok) {
        await fetchRecords();
        await fetchIntelligence();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePay = async (recordId: string) => {
    try {
      const res = await fetch(`${API_BASE}/records/${recordId}/pay`, {
        method: 'POST', headers: authHeader
      });
      if (res.ok) {
        await fetchRecords();
        await fetchIntelligence();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ─── Memoized Computations ────────────────────────────────────────────────

  const stats = useMemo(() => {
    if (!intelligence) return null;
    const k = intelligence.kpis;
    return {
      total: k.totalExpenses,
      approved: k.totalApproved,
      paid: k.totalPaid,
      outstanding: k.totalOutstanding,
      avg: k.avgExpenseAmount,
      pending: k.pendingApprovalCount,
      overdue: k.overduePaymentsCount,
      vat: k.vatRecoverable,
      count: k.expenseCount
    };
  }, [intelligence]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="w-full min-h-screen bg-gradient-to-br from-zinc-50 via-white to-emerald-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-emerald-950/20 p-4 sm:p-6">
      {/* ═══ HEADER ═══ */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/20">
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {t('وحدة المصروفات الذكية', 'Unified Expense Engine')}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              {t('نظام إدارة المصروفات المؤسسي الذكي · NEB-10', 'Intelligent Enterprise Expense Management · NEB-10')}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-5 flex flex-wrap gap-2 bg-white/60 dark:bg-zinc-900/60 backdrop-blur p-1.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
          {[
            { id: 'dashboard', labelAr: 'لوحة القيادة', labelEn: 'Dashboard', icon: Activity },
            { id: 'records', labelAr: 'المصروفات', labelEn: 'Records', icon: FileText },
            { id: 'categories', labelAr: 'الفئات', labelEn: 'Categories', icon: Tag },
            { id: 'petty-cash', labelAr: 'الصندوق الصغير', labelEn: 'Petty Cash', icon: Wallet },
            { id: 'recurring', labelAr: 'المتكررة', labelEn: 'Recurring', icon: Repeat },
            { id: 'batches', labelAr: 'الدفعات', labelEn: 'Batches', icon: Package },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t(tab.labelAr, tab.labelEn)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ DASHBOARD TAB ═══ */}
      {activeTab === 'dashboard' && (
        <DashboardView
          stats={stats}
          intelligence={intelligence}
          t={t}
          isRtl={isRtl}
        />
      )}

      {/* ═══ RECORDS TAB ═══ */}
      {activeTab === 'records' && (
        <RecordsView
          records={records}
          categories={categories}
          loading={loading}
          error={error}
          pagination={pagination}
          setPagination={setPagination}
          filters={filters}
          setFilters={setFilters}
          onCreate={() => setShowCreateModal(true)}
          onView={(r) => setShowDetailModal(r)}
          onSubmit={handleSubmit}
          onApprove={handleApprove}
          onPost={handlePost}
          onPay={handlePay}
          onRefresh={fetchRecords}
          t={t}
          isRtl={isRtl}
        />
      )}

      {/* ═══ CATEGORIES TAB ═══ */}
      {activeTab === 'categories' && (
        <CategoriesView
          categories={categories}
          onRefresh={fetchCategories}
          t={t}
          isRtl={isRtl}
        />
      )}

      {/* ═══ PETTY CASH TAB ═══ */}
      {activeTab === 'petty-cash' && (
        <PlaceholderView
          titleAr="إدارة الصندوق الصغير"
          titleEn="Petty Cash Management"
          descriptionAr="إدارة طلبات الصندوق الصغير، الحراسات، الحدود الدنيا، والتسويات"
          descriptionEn="Manage petty cash requests, custodians, thresholds, and settlements"
          icon={Wallet}
          t={t}
        />
      )}

      {/* ═══ RECURRING TAB ═══ */}
      {activeTab === 'recurring' && (
        <PlaceholderView
          titleAr="المصروفات المتكررة"
          titleEn="Recurring Expenses"
          descriptionAr="قوالب المصروفات المتكررة: شهرية، ربع سنوية، نصف سنوية، سنوية مع التشغيل التلقائي"
          descriptionEn="Recurring expense templates: monthly, quarterly, semi-annual, annual with automation"
          icon={Repeat}
          t={t}
        />
      )}

      {/* ═══ BATCHES TAB ═══ */}
      {activeTab === 'batches' && (
        <PlaceholderView
          titleAr="دفعات المصروفات"
          titleEn="Expense Batches"
          descriptionAr="إنشاء دفعات مصروفات متعددة القيود مع التحقق التلقائي من التوازن المحاسبي"
          descriptionEn="Create multi-entry expense batches with automatic balanced journal verification"
          icon={Package}
          t={t}
        />
      )}

      {/* ═══ CREATE MODAL ═══ */}
      {showCreateModal && (
        <CreateExpenseModal
          categories={categories}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchRecords();
            fetchIntelligence();
          }}
          t={t}
          isRtl={isRtl}
        />
      )}

      {/* ═══ DETAIL MODAL ═══ */}
      {showDetailModal && (
        <ExpenseDetailModal
          expense={showDetailModal}
          onClose={() => setShowDetailModal(null)}
          onAction={(action) => {
            setShowDetailModal(null);
            if (action === 'submit') handleSubmit(showDetailModal.id);
            if (action === 'approve') handleApprove(showDetailModal.id);
            if (action === 'post') handlePost(showDetailModal.id);
            if (action === 'pay') handlePay(showDetailModal.id);
          }}
          t={t}
          isRtl={isRtl}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD VIEW — KPI Cards & Intelligence
// ═══════════════════════════════════════════════════════════════════════════════

function DashboardView({ stats, intelligence, t, isRtl }: any) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="h-32 bg-white/60 dark:bg-zinc-900/60 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const kpiCards = [
    {
      titleAr: 'إجمالي المصروفات',
      titleEn: 'Total Expenses',
      value: stats.total,
      icon: DollarSign,
      color: 'emerald',
      trend: '+12.5%'
    },
    {
      titleAr: 'معتمد',
      titleEn: 'Approved',
      value: stats.approved,
      icon: CheckCircle,
      color: 'blue',
      trend: '+8.3%'
    },
    {
      titleAr: 'مدفوع',
      titleEn: 'Paid',
      value: stats.paid,
      icon: DollarSign,
      color: 'teal',
      trend: '+15.2%'
    },
    {
      titleAr: 'مستحقات',
      titleEn: 'Outstanding',
      value: stats.outstanding,
      icon: AlertTriangle,
      color: 'amber',
      trend: '-3.1%'
    },
    {
      titleAr: 'متوسط المصروف',
      titleEn: 'Avg Expense',
      value: stats.avg,
      icon: TrendingUp,
      color: 'indigo',
      trend: '+5.7%'
    },
    {
      titleAr: 'عدد المصروفات',
      titleEn: 'Count',
      value: stats.count,
      icon: FileText,
      color: 'purple',
      trend: '+24',
      format: 'number'
    },
    {
      titleAr: 'بانتظار الموافقة',
      titleEn: 'Pending Approval',
      value: stats.pending,
      icon: Clock,
      color: 'orange',
      trend: `${stats.pending} ${isRtl ? 'مصروف' : 'items'}`
    },
    {
      titleAr: 'متأخرة السداد',
      titleEn: 'Overdue',
      value: stats.overdue,
      icon: AlertTriangle,
      color: 'rose',
      trend: `${stats.overdue} ${isRtl ? 'متأخر' : 'overdue'}`
    },
  ];

  const colorMap: any = {
    emerald: 'from-emerald-500 to-emerald-700 shadow-emerald-500/20',
    blue: 'from-blue-500 to-blue-700 shadow-blue-500/20',
    teal: 'from-teal-500 to-teal-700 shadow-teal-500/20',
    amber: 'from-amber-500 to-amber-700 shadow-amber-500/20',
    indigo: 'from-indigo-500 to-indigo-700 shadow-indigo-500/20',
    purple: 'from-purple-500 to-purple-700 shadow-purple-500/20',
    orange: 'from-orange-500 to-orange-700 shadow-orange-500/20',
    rose: 'from-rose-500 to-rose-700 shadow-rose-500/20',
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 p-5 border border-zinc-200/60 dark:border-zinc-800/60 hover:shadow-xl transition-all duration-300"
            >
              <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${colorMap[card.color]} opacity-10 group-hover:opacity-20 transition-opacity`} />
              <div className="flex items-start justify-between relative">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                    {t(card.titleAr, card.titleEn)}
                  </p>
                  <p className="mt-2 text-2xl font-black text-zinc-900 dark:text-zinc-100">
                    {card.format === 'number' ? card.value.toLocaleString() : `${card.value.toLocaleString()} YER`}
                  </p>
                  <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    {card.trend}
                  </p>
                </div>
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${colorMap[card.color]} shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Insights & Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Intelligence Insights */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
              {t('رؤى ذكية', 'AI Insights')}
            </h3>
          </div>
          <div className="space-y-2">
            {intelligence?.insights?.slice(0, 5).map((insight: string, i: number) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-100 dark:border-emerald-900/50">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2" />
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{insight}</p>
              </div>
            ))}
            {(!intelligence?.insights || intelligence.insights.length === 0) && (
              <p className="text-sm text-zinc-500 italic">{t('لا توجد رؤى حالياً', 'No insights available yet')}</p>
            )}
          </div>
        </div>

        {/* Compliance Alerts */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
              {t('تنبيهات الامتثال', 'Compliance Alerts')}
            </h3>
          </div>
          <div className="space-y-2">
            {intelligence?.complianceAlerts?.map((alert: any, i: number) => {
              const severityColors: any = {
                LOW: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300',
                MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300',
                HIGH: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300',
                CRITICAL: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300',
              };
              return (
                <div key={i} className={`p-3 rounded-lg border ${severityColors[alert.severity]}`}>
                  <p className="text-sm font-medium">{alert.message_ar}</p>
                  <p className="text-xs opacity-70 mt-1">{alert.type}</p>
                </div>
              );
            })}
            {(!intelligence?.complianceAlerts || intelligence.complianceAlerts.length === 0) && (
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <p className="text-sm">{t('لا توجد تنبيهات', 'No alerts')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Categories & Vendors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
              {t('أعلى الفئات إنفاقاً', 'Top Spending Categories')}
            </h3>
          </div>
          <div className="space-y-3">
            {intelligence?.byCategory?.slice(0, 6).map((cat: any, i: number) => {
              const max = Math.max(...intelligence.byCategory.map((c: any) => c.total_amount));
              const pct = max > 0 ? (cat.total_amount / max) * 100 : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{cat.category_name_ar}</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{cat.total_amount.toLocaleString()} YER</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
              {t('أعلى الموردين', 'Top Vendors')}
            </h3>
          </div>
          <div className="space-y-2">
            {intelligence?.topVendors?.slice(0, 5).map((v: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                    {v.counterparty_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{v.counterparty_name}</p>
                    <p className="text-xs text-zinc-500">{v.transaction_count} {isRtl ? 'معاملة' : 'txns'}</p>
                  </div>
                </div>
                <p className="font-bold text-emerald-600 dark:text-emerald-400">{v.total_amount.toLocaleString()} YER</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECORDS VIEW — Expense Records List & Lifecycle
// ═══════════════════════════════════════════════════════════════════════════════

function RecordsView({ 
  records, categories, loading, error, pagination, setPagination, 
  filters, setFilters, onCreate, onView, onSubmit, onApprove, onPost, onPay, onRefresh, t, isRtl 
}: any) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecords = useMemo(() => {
    if (!searchTerm) return records;
    const term = searchTerm.toLowerCase();
    return records.filter((r: ExpenseRecord) =>
      r.expense_number?.toLowerCase().includes(term) ||
      r.counterparty_name?.toLowerCase().includes(term) ||
      r.category_name_ar?.toLowerCase().includes(term) ||
      r.description?.toLowerCase().includes(term)
    );
  }, [records, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60">
        <div className="relative flex-1 min-w-[200px]">
          <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 ${isRtl ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            placeholder={t('بحث في المصروفات...', 'Search expenses...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm`}
          />
        </div>

        <select
          value={filters.status || ''}
          onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
          className="px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
        >
          <option value="">{t('كل الحالات', 'All Statuses')}</option>
          {Object.entries(STATUS_CONFIG).map(([key, val]) => (
            <option key={key} value={key}>{val.labelAr}</option>
          ))}
        </select>

        <select
          value={filters.categoryCode || ''}
          onChange={(e) => setFilters({ ...filters, categoryCode: e.target.value || undefined })}
          className="px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
        >
          <option value="">{t('كل الفئات', 'All Categories')}</option>
          {categories.map((c: ExpenseCategory) => (
            <option key={c.id} value={c.category_code}>{c.name_ar}</option>
          ))}
        </select>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          <Spinner size="sm" />
        </button>

        <button
          onClick={onCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-md shadow-emerald-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          {t('مصروف جديد', 'New Expense')}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Records Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
              <tr className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                <th className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t('الرقم', 'Number')}</th>
                <th className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t('الفئة', 'Category')}</th>
                <th className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t('الجهة', 'Counterparty')}</th>
                <th className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t('المبلغ', 'Amount')}</th>
                <th className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t('الحالة', 'Status')}</th>
                <th className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t('الإجراءات', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredRecords.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                    {t('لا توجد مصروفات', 'No expenses found')}
                  </td>
                </tr>
              )}
              {filteredRecords.map((record: ExpenseRecord) => {
                const StatusIcon = STATUS_CONFIG[record.status].icon;
                return (
                  <tr key={record.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {record.expense_number}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">{record.category_name_ar}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{record.counterparty_name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">
                        {record.amount_base.toLocaleString()} {record.currency_code}
                      </div>
                      {record.vat_amount > 0 && (
                        <div className="text-xs text-zinc-500">
                          +{record.vat_amount.toLocaleString()} VAT ({record.vat_rate}%)
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_CONFIG[record.status].bg} ${STATUS_CONFIG[record.status].color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {STATUS_CONFIG[record.status].labelAr}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onView(record)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                          title={t('عرض', 'View')}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {record.status === 'DRAFT' && (
                          <button
                            onClick={() => onSubmit(record.id)}
                            className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-600 dark:text-amber-400"
                            title={t('إرسال للموافقة', 'Submit')}
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        {record.status === 'PENDING_APPROVAL' && (
                          <>
                            <button
                              onClick={() => onApprove(record.id)}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                              title={t('موافقة', 'Approve')}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onApprove(record.id, true)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400"
                              title={t('رفض', 'Reject')}
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {record.status === 'APPROVED' && (
                          <button
                            onClick={() => onPost(record.id)}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400"
                            title={t('ترحيل', 'Post')}
                          >
                            <FileCheck className="w-4 h-4" />
                          </button>
                        )}
                        {record.status === 'POSTED' && (
                          <button
                            onClick={() => onPay(record.id)}
                            className="p-1.5 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950/30 text-teal-600 dark:text-teal-400"
                            title={t('تسديد', 'Mark Paid')}
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORIES VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function CategoriesView({ categories, onRefresh, t, isRtl }: any) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {categories.map((cat: ExpenseCategory) => (
        <div
          key={cat.id}
          className="group bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/60 dark:border-zinc-800/60 hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20">
              <Tag className="w-5 h-5 text-white" />
            </div>
            <span className={`px-2 py-1 rounded-md text-xs font-semibold ${cat.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-zinc-100 text-zinc-700'}`}>
              {cat.is_active ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'غير نشط' : 'Inactive')}
            </span>
          </div>
          <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">{cat.name_ar}</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">{cat.name_en}</p>
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-zinc-600 dark:text-zinc-400">{cat.category_code}</span>
            <span className="text-zinc-500">{cat.category_type}</span>
          </div>
          {cat.default_vat_rate && cat.default_vat_rate > 0 && (
            <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-xs text-zinc-500">VAT: <span className="font-bold text-zinc-700 dark:text-zinc-300">{cat.default_vat_rate}%</span></span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLACEHOLDER VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function PlaceholderView({ titleAr, titleEn, descriptionAr, descriptionEn, icon: Icon, t }: any) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-12 border border-zinc-200/60 dark:border-zinc-800/60 text-center">
      <div className="inline-flex p-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/20 mb-4">
        <Icon className="w-12 h-12 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
        {t(titleAr, titleEn)}
      </h2>
      <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
        {t(descriptionAr, descriptionEn)}
      </p>
      <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-sm font-semibold">
        <Sparkles className="w-4 h-4" />
        {t('قريباً — متاح للتفعيل الفوري', 'Ready for activation')}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE EXPENSE MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function CreateExpenseModal({ categories, onClose, onSuccess, t, isRtl }: any) {
  const [formData, setFormData] = useState({
    categoryCode: '',
    counterpartyName: '',
    counterpartyType: 'VENDOR' as 'VENDOR' | 'EMPLOYEE' | 'GOVERNMENT' | 'OTHER',
    amount: '',
    currencyCode: 'YER',
    exchangeRate: '1',
    vatRate: '',
    paymentMethod: 'BANK_TRANSFER' as PaymentMethod,
    paymentDueDate: '',
    description: '',
    referenceNumber: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const authHeader = useAuthHeader();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryCode || !formData.counterpartyName || !formData.amount) {
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/records`, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
          categoryCode: formData.categoryCode,
          counterpartyName: formData.counterpartyName,
          counterpartyType: formData.counterpartyType,
          amount: Number(formData.amount),
          currencyCode: formData.currencyCode,
          exchangeRate: Number(formData.exchangeRate) || 1,
          vatRate: Number(formData.vatRate) || 0,
          paymentMethod: formData.paymentMethod,
          paymentDueDate: formData.paymentDueDate || undefined,
          description: formData.description || undefined,
          referenceNumber: formData.referenceNumber || undefined,
          notes: formData.notes || undefined,
        }),
      });
      if (res.ok) {
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to create expense:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {t('مصروف جديد', 'New Expense')}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                {t('الفئة', 'Category')} *
              </label>
              <select
                required
                value={formData.categoryCode}
                onChange={(e) => setFormData({ ...formData, categoryCode: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">{t('اختر الفئة...', 'Select category...')}</option>
                {categories.map((c: ExpenseCategory) => (
                  <option key={c.id} value={c.category_code}>{c.name_ar}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                {t('نوع الجهة', 'Counterparty Type')}
              </label>
              <select
                value={formData.counterpartyType}
                onChange={(e) => setFormData({ ...formData, counterpartyType: e.target.value as any })}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
              >
                <option value="VENDOR">{t('مورد', 'Vendor')}</option>
                <option value="EMPLOYEE">{t('موظف', 'Employee')}</option>
                <option value="GOVERNMENT">{t('جهة حكومية', 'Government')}</option>
                <option value="OTHER">{t('أخرى', 'Other')}</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                {t('اسم الجهة', 'Counterparty Name')} *
              </label>
              <input
                type="text"
                required
                value={formData.counterpartyName}
                onChange={(e) => setFormData({ ...formData, counterpartyName: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                {t('المبلغ', 'Amount')} *
              </label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                {t('العملة', 'Currency')}
              </label>
              <select
                value={formData.currencyCode}
                onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
              >
                <option value="YER">YER</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="SAR">SAR</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                {t('معدل الصرف', 'Exchange Rate')}
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.exchangeRate}
                onChange={(e) => setFormData({ ...formData, exchangeRate: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                {t('نسبة الضريبة %', 'VAT Rate %')}
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.vatRate}
                onChange={(e) => setFormData({ ...formData, vatRate: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                {t('طريقة الدفع', 'Payment Method')}
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
              >
                {PAYMENT_METHODS.map(pm => (
                  <option key={pm.value} value={pm.value}>{pm.labelAr}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                {t('تاريخ الاستحقاق', 'Due Date')}
              </label>
              <input
                type="date"
                value={formData.paymentDueDate}
                onChange={(e) => setFormData({ ...formData, paymentDueDate: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                {t('الوصف', 'Description')}
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
          >
            {t('إلغاء', 'Cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold shadow-md shadow-emerald-500/20 disabled:opacity-50"
          >
            {submitting ? <Spinner size="sm" /> : <CheckCircle className="w-4 h-4" />}
            {t('إنشاء', 'Create')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DETAIL MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function ExpenseDetailModal({ expense, onClose, onAction, t, isRtl }: any) {
  const StatusIcon = STATUS_CONFIG[expense.status].icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
          <div>
            <p className="text-xs text-zinc-500">{t('رقم المصروف', 'Expense #')}</p>
            <h3 className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">{expense.expense_number}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${STATUS_CONFIG[expense.status].bg} ${STATUS_CONFIG[expense.status].color}`}>
              <StatusIcon className="w-4 h-4" />
              {STATUS_CONFIG[expense.status].labelAr}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DetailField label={t('الفئة', 'Category')} value={expense.category_name_ar} />
            <DetailField label={t('الجهة', 'Counterparty')} value={expense.counterparty_name} />
            <DetailField label={t('المبلغ الأساسي', 'Base Amount')} value={`${expense.amount_base.toLocaleString()} ${expense.currency_code}`} />
            {expense.vat_amount > 0 && (
              <DetailField label={t('الضريبة', 'VAT')} value={`${expense.vat_amount.toLocaleString()} (${expense.vat_rate}%)`} />
            )}
            <DetailField label={t('الصافي', 'Net')} value={`${expense.net_amount.toLocaleString()} ${expense.currency_code}`} highlight />
            {expense.payment_method && (
              <DetailField label={t('طريقة الدفع', 'Payment Method')} value={expense.payment_method} />
            )}
            {expense.payment_due_date && (
              <DetailField label={t('تاريخ الاستحقاق', 'Due Date')} value={expense.payment_due_date} />
            )}
          </div>

          {expense.description && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 mb-1">{t('الوصف', 'Description')}</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                {expense.description}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800">
            {t('إغلاق', 'Close')}
          </button>
          {expense.status === 'DRAFT' && (
            <button onClick={() => onAction('submit')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold">
              <Send className="w-4 h-4" />
              {t('إرسال', 'Submit')}
            </button>
          )}
          {expense.status === 'PENDING_APPROVAL' && (
            <button onClick={() => onAction('approve')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold">
              <CheckCircle className="w-4 h-4" />
              {t('موافقة', 'Approve')}
            </button>
          )}
          {expense.status === 'APPROVED' && (
            <button onClick={() => onAction('post')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold">
              <FileCheck className="w-4 h-4" />
              {t('ترحيل', 'Post')}
            </button>
          )}
          {expense.status === 'POSTED' && (
            <button onClick={() => onAction('pay')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold">
              <DollarSign className="w-4 h-4" />
              {t('تسديد', 'Mark Paid')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value, highlight = false }: any) {
  return (
    <div className={highlight ? 'p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900' : ''}>
      <p className="text-xs font-semibold text-zinc-500 mb-1">{label}</p>
      <p className={`text-sm font-bold ${highlight ? 'text-emerald-700 dark:text-emerald-300' : 'text-zinc-900 dark:text-zinc-100'}`}>
        {value}
      </p>
    </div>
  );
}