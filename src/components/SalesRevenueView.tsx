import { printHTML } from '../lib/printUtils';
import PrintPDFTemplateModal from './reports/PrintPDFTemplateModal';
import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Plus, 
  CheckCircle2, 
  Clock, 
  QrCode, 
  Printer, 
  CreditCard, 
  Building2, 
  MapPin, 
  Phone, 
  User, 
  TrendingUp, 
  Wallet, 
  RefreshCw, 
  Search, 
  Filter,
  ArrowUpRight,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import { TabId } from '../types';
import { ModuleShell } from './enterprise/ModuleShell';
import { cn } from '../design-system/utils/cn';
import { EmptyState } from '../design-system/components/EmptyState';
import { ErrorState } from '../design-system/components/ErrorState';
import { Spinner } from '../design-system/components/Spinner';
import { ConfirmDialog } from '../design-system/components/ConfirmDialog';
import { Pagination } from '../design-system/components/Pagination';
import { EnterpriseSkeletonTable } from './common/EnterpriseSkeletonTable';
import { showToast } from './enterprise/EnterpriseToastContainer';
import { useDebouncedValue } from '../design-system/hooks/useDebouncedValue';
import { EnterpriseButton } from './common/EnterpriseButton';

interface SalesRevenueViewProps {
  lang: 'ar' | 'en';
  onNavigate?: (tab: TabId) => void;
}

export const SalesRevenueView: React.FC<SalesRevenueViewProps> = ({ lang, onNavigate }) => {
  const isRtl = lang === 'ar';
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);

  const handlePrintSingleInvoice = (inv: any) => {
    if (!inv) return;
    const accentColor = '#059669';
    const amountYer = parseFloat(String(inv.total_amount || 0));

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="${isRtl ? 'rtl' : 'ltr'}">
        <head>
          <meta charset="utf-8" />
          <title>${isRtl ? 'فاتورة إيراد رسمية معتمدة' : 'Official Revenue Invoice'}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; color: #0f172a; background: #fff; }
            @page { size: A4 portrait; margin: 15mm; }
          </style>
        </head>
        <body>
          <div style="max-width: 780px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px double ${accentColor}; padding-bottom: 20px; margin-bottom: 25px;">
              <div style="display: flex; align-items: center; gap: 15px;">
                <img src="/UAMEX_ERPLOGO.png" style="height: 55px; object-fit: contain;" alt="UAMEX ERP" />
                <img src="/LogoRohamaab.png" style="height: 55px; object-fit: contain;" alt="Logo Rohamaab" />
                <div>
                  <h2 style="margin: 0; color: #0f172a; font-size: 16px; font-weight: 900;">جمعية رُحماء بينهم للعمل الإنساني والتنمية</h2>
                  <p style="margin: 3px 0 0 0; color: ${accentColor}; font-size: 11px; font-weight: 700;">نظام يو امكس المؤسسي الشامل - UAMEX ERP™</p>
                  <p style="margin: 2px 0 0 0; color: #64748b; font-size: 10px;">إدارة الموارد المالية والمشاريع الاستثمارية (NEB-15)</p>
                </div>
              </div>
              <div style="text-align: ${isRtl ? 'left' : 'right'};">
                <span style="display: inline-block; padding: 4px 12px; background: #ecfdf5; border: 1px solid #10b981; color: #065f46; font-weight: 900; border-radius: 6px; font-size: 11px;">
                  ${inv.payment_status === 'paid' || inv.payment_status === 'PAID' ? (isRtl ? 'فاتورة مسددة ومحصلة' : 'Paid & Settled') : (isRtl ? 'فاتورة مستحقة' : 'Pending Payment')}
                </span>
                <p style="margin: 8px 0 0 0; font-size: 11px; font-family: monospace; font-weight: 700; color: #334155;">${inv.invoice_number || 'INV-2026-001'}</p>
                <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b;">${isRtl ? 'التاريخ:' : 'Date:'} ${inv.issued_date || new Date().toISOString().slice(0,10)}</p>
              </div>
            </div>

            <!-- Customer Details Card -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 25px; font-size: 11px;">
              <table style="width: 100%;">
                <tr>
                  <td style="width: 20%; font-weight: bold; color: #64748b;">${isRtl ? 'الجهة / العميل / المانح:' : 'Payer / Donor:'}</td>
                  <td style="font-weight: 900; font-size: 13px; color: #0f172a;">${inv.customer_name || inv.donor_name || (isRtl ? 'فاعل خير - مساهمة وقفية' : 'Donor')}</td>
                  <td style="width: 20%; font-weight: bold; color: #64748b;">${isRtl ? 'طريقة السداد:' : 'Payment Method:'}</td>
                  <td style="font-weight: bold;">${inv.payment_method || (isRtl ? 'تحويل بنكي / نقدي' : 'Bank Transfer')}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold; color: #64748b; padding-top: 8px;">${isRtl ? 'البيان والوصف:' : 'Description:'}</td>
                  <td colspan="3" style="padding-top: 8px; color: #334155;">${inv.description || (isRtl ? 'مساهمة في دعم المشاريع التنموية وكفالات الأيتام' : 'Contribution')}</td>
                </tr>
              </table>
            </div>

            <!-- Signatures & Stamp -->
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1;">
              <div style="text-align: center; flex: 1;">
                <div style="font-size: 10px; font-weight: bold; color: #475569;">${isRtl ? 'المحاسب المسؤول' : 'Accountant'}</div>
                <div style="margin-top: 30px; border-top: 1px solid #94a3b8; width: 60%; margin-left: auto; margin-right: auto;"></div>
                <div style="font-size: 9px; color: #94a3b8; margin-top: 4px;">${isRtl ? 'التوقيع' : 'Signature'}</div>
              </div>
              <div style="text-align: center; flex: 1;">
                <div style="width: 70px; height: 70px; border: 2px dashed ${accentColor}; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: ${accentColor}; font-size: 8px; font-weight: 900;">
                  ${isRtl ? 'ختم الجمعية المعتمد' : 'Official Stamp'}
                </div>
              </div>
              <div style="text-align: center; flex: 1;">
                <div style="font-size: 10px; font-weight: bold; color: #475569;">${isRtl ? 'المدير المالي والتنفيذي' : 'Financial Director'}</div>
                <div style="margin-top: 30px; border-top: 1px solid #94a3b8; width: 60%; margin-left: auto; margin-right: auto;"></div>
                <div style="font-size: 9px; color: #94a3b8; margin-top: 4px;">${isRtl ? 'الاعتماد' : 'Approval'}</div>
              </div>
            </div>

          </div>
        </body>
      </html>
    `;

    printHTML(htmlContent);
  };

  const [activeSubTab, setActiveSubTab] = useState<'invoices' | 'new_invoice' | 'service_points' | 'analytics'>('invoices');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [servicePoints, setServicePoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  // Debounced invoice search — table re-filters 300ms after typing stops
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  // Invoices pagination (10 rows/page)
  const [invoicesPage, setInvoicesPage] = useState(1);
  const INVOICES_PAGE_SIZE = 10;

  // Modal State for Invoice Details & Print
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [invoiceToPay, setInvoiceToPay] = useState<any | null>(null);
  const [payGateway, setPayGateway] = useState('BANK_TRANSFER');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);

  // New Invoice Form State
  const [newClient, setNewClient] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newRevenueType, setNewRevenueType] = useState('CHARITY_PRODUCTS_SALES');
  const [newCurrency, setNewCurrency] = useState('YER');
  const [newGateway, setNewGateway] = useState('BANK_TRANSFER');
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchSalesData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [invRes, sumRes, spRes] = await Promise.all([
        fetch('/api/sales/invoices', { headers }).then(r => r.ok ? r.json() : []),
        fetch('/api/sales/summary', { headers }).then(r => r.ok ? r.json() : null),
        fetch('/api/sales/service-points', { headers }).then(r => r.ok ? r.json() : [])
      ]);

      setInvoices(Array.isArray(invRes) ? invRes : []);
      setSummary(sumRes);
      setServicePoints(Array.isArray(spRes) ? spRes : []);
      setInvoicesPage(1);
    } catch (err: any) {
      setFetchError(err?.message || (isRtl ? 'فشل تحميل بيانات المبيعات' : 'Failed to load sales data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  const handlePayInvoice = async () => {
    if (!invoiceToPay) return;
    setIsSubmittingPay(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/sales/invoices/${invoiceToPay.id}/pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paymentGateway: payGateway })
      });

      if (res.ok) {
        setIsPayModalOpen(false);
        showToast({
          type: 'success',
          title: isRtl ? 'تحصيل الفواتير' : 'Invoice collection',
          message: isRtl
            ? `تم تحصيل الفاتورة ${invoiceToPay.invoice_number} وترحيل القيد المحاسبي`
            : `Invoice ${invoiceToPay.invoice_number} collected and posted`,
        });
        setInvoiceToPay(null);
        await fetchSalesData();
      } else {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || (isRtl ? 'فشل تحصيل الفاتورة' : 'Failed to collect invoice'));
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: isRtl ? 'تحصيل الفواتير' : 'Invoice collection',
        message: err.message,
      });
    } finally {
      setIsSubmittingPay(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient || !newAmount) return;
    setIsSubmittingNew(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/sales/invoices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          donorOrClientName: newClient,
          totalAmount: parseFloat(newAmount),
          revenueType: newRevenueType,
          currencyCode: newCurrency,
          paymentGateway: newGateway
        })
      });

      if (res.ok) {
        const created = await res.json().catch(() => ({}));
        setFormSuccess(isRtl ? 'تم إصدار الفاتورة وتوليد رمز التحقق الرقمي بنجاح!' : 'Invoice issued and QR verified successfully!');
        showToast({
          type: 'success',
          title: isRtl ? 'إصدار الفواتير' : 'Invoice issued',
          message: isRtl
            ? `تم إصدار فاتورة ${created.invoice_number || ''} بنجاح`
            : `Invoice ${created.invoice_number || ''} issued successfully`,
        });
        setNewClient('');
        setNewAmount('');
        await fetchSalesData();
        setTimeout(() => {
          setFormSuccess(null);
          setActiveSubTab('invoices');
        }, 1500);
      } else {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || (isRtl ? 'فشل إصدار الفاتورة' : 'Failed to issue invoice'));
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: isRtl ? 'إصدار الفواتير' : 'Issue invoice',
        message: err.message,
      });
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const q = debouncedSearchQuery.toLowerCase();
    const matchesSearch =
      (inv.invoice_number?.toLowerCase() || '').includes(q) ||
      (inv.donor_or_client_name?.toLowerCase() || '').includes(q) ||
      (inv.revenue_type?.toLowerCase() || '').includes(q);

    const matchesStatus = statusFilter === 'ALL' || inv.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Paged slice (clamps when filters shrink the list)
  const invoicesTotalPages = Math.max(1, Math.ceil(filteredInvoices.length / INVOICES_PAGE_SIZE));
  const safeInvoicesPage = Math.min(invoicesPage, invoicesTotalPages);
  const pagedInvoices = filteredInvoices.slice(
    (safeInvoicesPage - 1) * INVOICES_PAGE_SIZE,
    safeInvoicesPage * INVOICES_PAGE_SIZE
  );

  const formatCurrency = (val: number, cur: string = 'YER') => {
    return `${Number(val || 0).toLocaleString()} ${cur}`;
  };

  return (
    <ModuleShell titleAr="نظام المبيعات والإيرادات" titleEn="Sales, Revenue & Fundraising OS" domainCode="NEB-15" icon={Receipt} accent="emerald" lang={lang}>
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                NEB-15
              </span>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                {isRtl ? 'بوابة المبيعات والإيرادات وتنمية الموارد' : 'Sales, Revenue & Fundraising Engine'}
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              {isRtl 
                ? 'إدارة الفواتير، التحصيل الرقمي، نقاط الخدمة، وتوليد القيود المحاسبية الآلية المعتمدة' 
                : 'Digital Invoicing, Multi-Channel Collections, Service Hubs, & Automated Certified Accounting'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <EnterpriseButton
            variant="secondary"
            size="sm"
            onClick={fetchSalesData}
            loading={loading}
            icon={!loading ? <RefreshCw className="w-3.5 h-3.5" /> : undefined}
          >
            <span>{isRtl ? 'تحديث' : 'Refresh'}</span>
          </EnterpriseButton>

          <EnterpriseButton
            variant="primary"
            size="sm"
            onClick={() => setActiveSubTab('new_invoice')}
            icon={<Plus className="w-4 h-4" />}
          >
            <span>{isRtl ? 'إصدار فاتورة جديدة' : 'Issue Invoice'}</span>
          </EnterpriseButton>
        </div>
      </div>

      {fetchError && invoices.length === 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/50 rounded-2xl overflow-hidden">
          <ErrorState
            titleAr="تعذر تحميل بيانات المبيعات"
            title="Failed to load sales data"
            messageAr={fetchError}
            message={fetchError}
            onRetry={fetchSalesData}
            lang={lang}
          />
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-bold">{isRtl ? 'إجمالي المفوتر' : 'Total Invoiced'}</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white">
            {loading ? (
              <span className="inline-block h-6 w-28 animate-pulse bg-slate-200 dark:bg-zinc-700 rounded" />
            ) : (
              formatCurrency(summary?.kpis?.totalInvoicedYer || 0)
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
            <span>{isRtl ? 'عدد الفواتير الصادرة:' : 'Total Invoices:'}</span>
            <span className="font-bold text-slate-700 dark:text-zinc-300">{summary?.kpis?.totalInvoicesCount ?? '—'}</span>
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-bold">{isRtl ? 'المبالغ المحصلة' : 'Collected Revenue'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
            {loading ? (
              <span className="inline-block h-6 w-28 animate-pulse bg-slate-200 dark:bg-zinc-700 rounded" />
            ) : (
              formatCurrency(summary?.kpis?.totalCollectedYer || 0)
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold">
            <ArrowUpRight className="w-3 h-3" />
            <span>{isRtl ? `نسبة التحصيل: ${summary?.kpis?.collectionRatePct ?? '—'}%` : `Collection Rate: ${summary?.kpis?.collectionRatePct ?? '—'}%`}</span>
          </div>
        </div>

        {/* Pending Receivables */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-bold">{isRtl ? 'مستحقات قيد التحصيل' : 'Pending Receivables'}</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-black text-amber-600 dark:text-amber-400">
            {loading ? (
              <span className="inline-block h-6 w-28 animate-pulse bg-slate-200 dark:bg-zinc-700 rounded" />
            ) : (
              formatCurrency(summary?.kpis?.totalPendingYer || 0)
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
            <span>{isRtl ? 'فواتير غير مسددة:' : 'Pending Invoices:'}</span>
            <span className="font-bold text-amber-600">{summary?.kpis?.pendingInvoicesCount ?? '—'}</span>
          </div>
        </div>

        {/* Active Service Hubs */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-bold">{isRtl ? 'نقاط ومراكز الخدمة' : 'Service Points'}</span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white">
            {loading ? (
              <span className="inline-block h-6 w-20 animate-pulse bg-slate-200 dark:bg-zinc-700 rounded" />
            ) : (
              <>{summary?.kpis?.activeServicePointsCount ?? servicePoints.length ?? 0} {isRtl ? 'مراكز نشطة' : 'Hubs'}</>
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>{isRtl ? 'تغطية 4 محافظات' : '4 Governorates Covered'}</span>
          </div>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION */}
      <div className="flex border-b border-slate-200 dark:border-zinc-800 gap-2">
        <button
          onClick={() => setActiveSubTab('invoices')}
          className={`pb-3 px-4 text-xs font-black border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'invoices'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {isRtl ? '📋 فواتير المبيعات والإيرادات' : 'Sales & Revenue Invoices'}
        </button>

        <button
          onClick={() => setActiveSubTab('service_points')}
          className={`pb-3 px-4 text-xs font-black border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'service_points'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {isRtl ? '🏢 نقاط الخدمة ومراكز التبرع' : 'Service Points & Donation Hubs'}
        </button>

        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`pb-3 px-4 text-xs font-black border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'analytics'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {isRtl ? '📊 تحليلات مصادر الإيرادات' : 'Revenue Analytics & Streams'}
        </button>

        <button
          onClick={() => setActiveSubTab('new_invoice')}
          className={`pb-3 px-4 text-xs font-black border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'new_invoice'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {isRtl ? '➕ إصدار فاتورة جديدة' : 'Issue New Invoice'}
        </button>
      </div>

      {/* TAB 1: INVOICES LIST */}
      {activeSubTab === 'invoices' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
            <div className="relative w-full sm:w-80">
              <Search className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 text-slate-400 ${isRtl ? 'right-3' : 'left-3'}`} aria-hidden="true" />
              <input
                type="text"
                placeholder={isRtl ? 'البحث برقم الفاتورة، العميل، أو النوع...' : 'Search by invoice #, client, type...'}
                aria-label={isRtl ? 'بحث الفواتير' : 'Search invoices'}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setInvoicesPage(1); }}
                className={`w-full h-9 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-emerald-600 ${isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 text-xs font-bold text-slate-700 dark:text-zinc-300"
              >
                <option value="ALL">{isRtl ? 'جميع الحالات' : 'All Statuses'}</option>
                <option value="PAID">{isRtl ? 'مسددة (PAID)' : 'Paid'}</option>
                <option value="PENDING">{isRtl ? 'قيد الانتظار (PENDING)' : 'Pending'}</option>
              </select>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead className="bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-black">
                  <tr>
                    <th className="py-3 px-4 text-start">{isRtl ? 'رقم الفاتورة' : 'Invoice #'}</th>
                    <th className="py-3 px-4 text-start">{isRtl ? 'الجهة / العميل' : 'Client / Donor'}</th>
                    <th className="py-3 px-4 text-start">{isRtl ? 'نوع الإيراد' : 'Revenue Stream'}</th>
                    <th className="py-3 px-4 text-start">{isRtl ? 'المبلغ' : 'Amount'}</th>
                    <th className="py-3 px-4 text-start">{isRtl ? 'قناة التحصيل' : 'Gateway'}</th>
                    <th className="py-3 px-4 text-start">{isRtl ? 'حالة السداد' : 'Status'}</th>
                    <th className="py-3 px-4 text-start">{isRtl ? 'تاريخ الإصدار' : 'Date'}</th>
                    <th className="py-3 px-4 text-center">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-0">
                        <EnterpriseSkeletonTable rows={6} columns={8} colWidths={['w-24', 'w-32', 'w-24', 'w-24', 'w-20', 'w-20', 'w-20', 'w-24']} />
                      </td>
                    </tr>
                  ) : filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-0">
                        <EmptyState
                          variant={searchQuery || statusFilter !== 'ALL' ? 'search' : 'empty'}
                          titleAr="لا توجد فواتير مطابقة"
                          title="No matching invoices"
                          descriptionAr="جرب كلمات مختلفة أو أزل الفلاتر — أو أصدر فاتورة جديدة"
                          description="Try different keywords or clear filters — or issue a new invoice"
                          actions={[
                            {
                              label: 'Clear filters',
                              labelAr: 'مسح الفلاتر',
                              variant: 'secondary',
                              onClick: () => { setSearchQuery(''); setStatusFilter('ALL'); },
                            },
                            {
                              label: 'Issue invoice',
                              labelAr: 'إصدار فاتورة',
                              onClick: () => setActiveSubTab('new_invoice'),
                            },
                          ]}
                          lang={lang}
                        />
                      </td>
                    </tr>
                  ) : (
                  pagedInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-black text-slate-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{inv.invoice_number}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-zinc-200">
                        {inv.donor_or_client_name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold text-slate-600 dark:text-zinc-400">
                          {inv.revenue_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-black text-slate-900 dark:text-white">
                        {formatCurrency(inv.total_amount, inv.currency_code)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-zinc-400 font-bold text-[11px]">
                        {inv.payment_gateway}
                      </td>
                      <td className="py-3 px-4">
                        {inv.payment_status === 'PAID' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            {isRtl ? 'مسددة' : 'Paid'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-black flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3" />
                            {isRtl ? 'قيد الانتظار' : 'Pending'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-zinc-400 text-[11px]">
                        {inv.issued_date || inv.created_at?.split('T')[0]}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition-all cursor-pointer"
                            title={isRtl ? 'عرض الفاتورة ورمز QR' : 'View Invoice & QR'}
                          >
                            <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                          </button>

                          {inv.payment_status === 'PENDING' && (
                            <EnterpriseButton
                              variant="primary"
                              size="xs"
                              onClick={() => {
                                setInvoiceToPay(inv);
                                setIsPayModalOpen(true);
                              }}
                              icon={<CreditCard className="w-3 h-3" />}
                            >
                              <span>{isRtl ? 'تحصيل' : 'Collect'}</span>
                            </EnterpriseButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
            {invoicesTotalPages > 1 && (
              <div className="px-4 py-3 border-t border-slate-200 dark:border-zinc-800">
                <Pagination
                  currentPage={safeInvoicesPage}
                  totalPages={invoicesTotalPages}
                  totalItems={filteredInvoices.length}
                  pageSize={INVOICES_PAGE_SIZE}
                  onPageChange={setInvoicesPage}
                  lang={lang}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SERVICE POINTS & HUBS */}
      {activeSubTab === 'service_points' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {servicePoints.map((sp) => (
            <div key={sp.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {isRtl ? sp.name_ar : (sp.name_en || sp.name_ar)}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {sp.point_type}
                    </span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 text-[10px] font-black">
                  {isRtl ? 'نشط' : 'Active'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-zinc-400 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{sp.address}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{sp.contact_person}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{sp.contact_phone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isRtl ? `السعة: ${sp.capacity_per_day}/يوم` : `Cap: ${sp.capacity_per_day}/day`}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: REVENUE ANALYTICS */}
      {activeSubTab === 'analytics' && summary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Stream */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>{isRtl ? 'توزيع الإيرادات حسب القناة والمصدر' : 'Revenue by Stream'}</span>
            </h3>
            <div className="space-y-3">
              {Object.entries(summary.breakdowns?.byRevenueType || {}).map(([key, val]: any) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-zinc-300">
                    <span>{key}</span>
                    <span className="font-mono">{formatCurrency(val)}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                    <div 
                      className="h-full bg-emerald-600 rounded-full" 
                      style={{ width: `${Math.min(100, Math.round((val / (summary.kpis?.totalInvoicedYer || 1)) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue by Gateway */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>{isRtl ? 'توزيع التحصيل حسب بوابات الدفع' : 'Collections by Payment Gateway'}</span>
            </h3>
            <div className="space-y-3">
              {Object.entries(summary.breakdowns?.byGateway || {}).map(([key, val]: any) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-zinc-300">
                    <span>{key}</span>
                    <span className="font-mono">{formatCurrency(val)}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full" 
                      style={{ width: `${Math.min(100, Math.round((val / (summary.kpis?.totalInvoicedYer || 1)) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ISSUE NEW INVOICE FORM */}
      {activeSubTab === 'new_invoice' && (
        <div className="max-w-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl shadow-xs">
          <h3 className="text-base font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <span>{isRtl ? 'إصدار فاتورة مبيعات / إيراد / تبرع جديدة' : 'Issue New Sales & Revenue Invoice'}</span>
          </h3>

          {formSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{formSuccess}</span>
            </div>
          )}

          <form onSubmit={handleCreateInvoice} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                {isRtl ? 'اسم العميل / المانح / الجهة *' : 'Client / Donor / Organization Name *'}
              </label>
              <input
                type="text"
                required
                value={newClient}
                onChange={(e) => setNewClient(e.target.value)}
                placeholder={isRtl ? 'مثال: شركة يمن للاتصالات / مؤسسة صلة...' : 'e.g. Acme Corp / Donor Name'}
                className="w-full h-10 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 text-xs text-slate-900 dark:text-white focus:outline-emerald-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  {isRtl ? 'المبلغ الإجمالي *' : 'Total Amount *'}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="5000000"
                  className="w-full h-10 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 text-xs font-mono text-slate-900 dark:text-white focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  {isRtl ? 'العملة' : 'Currency'}
                </label>
                <select
                  value={newCurrency}
                  onChange={(e) => setNewCurrency(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="YER">YER (ريال يمني)</option>
                  <option value="USD">USD ($)</option>
                  <option value="SAR">SAR (ريال سعودي)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  {isRtl ? 'نوع الإيراد' : 'Revenue Type'}
                </label>
                <select
                  value={newRevenueType}
                  onChange={(e) => setNewRevenueType(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="CHARITY_PRODUCTS_SALES">{isRtl ? 'مبيعات منتجات خيرية' : 'Charity Products Sales'}</option>
                  <option value="GRANT_INVOICE">{isRtl ? 'مطالبة منحة مانحين' : 'Grant Invoice'}</option>
                  <option value="COMMERCIAL_DONATION">{isRtl ? 'تبرعات تجارية ومؤسسية' : 'Commercial Donation'}</option>
                  <option value="CORPORATE_SPONSORSHIP">{isRtl ? 'رعاية شركات' : 'Corporate Sponsorship'}</option>
                  <option value="SERVICE_FEES">{isRtl ? 'رسوم خدمات إنسانية' : 'Service Fees'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  {isRtl ? 'قناة التحصيل المقترحة' : 'Payment Gateway'}
                </label>
                <select
                  value={newGateway}
                  onChange={(e) => setNewGateway(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="BANK_TRANSFER">{isRtl ? 'حوالة بنكية مباشرة' : 'Bank Transfer'}</option>
                  <option value="KURAYMI_PAY">{isRtl ? 'الكريمي إكسبرس (Kuraymi)' : 'Kuraymi Pay'}</option>
                  <option value="ONE_CASH">{isRtl ? 'ون كاش (OneCash)' : 'OneCash'}</option>
                  <option value="POS_CASH">{isRtl ? 'نقدي في نقطة الخدمة' : 'POS Cash'}</option>
                  <option value="POS_CARD">{isRtl ? 'بطاقة بنكية POS' : 'POS Card'}</option>
                </select>
              </div>
            </div>

            <div className="pt-3">
              <EnterpriseButton
                variant="primary"
                size="md"
                block
                type="submit"
                loading={isSubmittingNew}
                icon={!isSubmittingNew ? <Check className="w-4 h-4" /> : undefined}
              >
                <span>{isSubmittingNew ? (isRtl ? 'جاري الإصدار والتشفير...' : 'Issuing...') : (isRtl ? 'إصدار الفاتورة وتوليد رمز QR' : 'Issue Invoice & Generate QR')}</span>
              </EnterpriseButton>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: INVOICE DETAILS & QR PREVIEW */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {selectedInvoice.invoice_number}
                </h3>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-center space-y-2">
              <div className="w-24 h-24 bg-white p-2 rounded-xl border border-slate-200 mx-auto flex items-center justify-center shadow-xs">
                <QrCode className="w-20 h-20 text-slate-900" />
              </div>
              <div className="text-[10px] font-mono text-slate-400 truncate max-w-xs mx-auto">
                SHA256: {selectedInvoice.qr_hash || 'verified-hash-key'}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-zinc-800">
                <span className="text-slate-500">{isRtl ? 'العميل / الجهة:' : 'Client:'}</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedInvoice.donor_or_client_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-zinc-800">
                <span className="text-slate-500">{isRtl ? 'المبلغ الإجمالي:' : 'Total Amount:'}</span>
                <span className="font-mono font-black text-emerald-600">{formatCurrency(selectedInvoice.total_amount, selectedInvoice.currency_code)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-zinc-800">
                <span className="text-slate-500">{isRtl ? 'حالة السداد:' : 'Payment Status:'}</span>
                <span className="font-bold">{selectedInvoice.payment_status}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">{isRtl ? 'تاريخ الفاتورة:' : 'Date:'}</span>
                <span className="font-mono">{selectedInvoice.issued_date || selectedInvoice.created_at?.split('T')[0]}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <EnterpriseButton
                variant="secondary"
                size="sm"
                onClick={() => handlePrintSingleInvoice(selectedInvoice)}
                icon={<Printer className="w-3.5 h-3.5" />}
                className="flex-1"
              >
                <span>{isRtl ? 'طباعة الفاتورة' : 'Print Invoice'}</span>
              </EnterpriseButton>
              <EnterpriseButton
                variant="primary"
                size="sm"
                onClick={() => setSelectedInvoice(null)}
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </EnterpriseButton>
            </div>
          </div>
        </div>
      )}

      {/* CERTIFIED REVENUE REPORT MODAL */}
      <PrintPDFTemplateModal
        isOpen={isPDFModalOpen}
        onClose={() => setIsPDFModalOpen(false)}
        lang={lang}
        type="revenue_investments"
        data={{
          invoices,
          title: isRtl ? 'تقرير تنمية الموارد والمشاريع الاستثمارية والوقفية' : 'Resource Mobilization & Endowment Investments Report',
          subtitle: isRtl ? 'عوائد التمويل الذاتي، الفواتير المحصلة، واستدامة المحافظ الاستثمارية التنموية' : 'Self-Financing Yields, Revenue Invoicing & Endowment Sustainability Portfolios'
        }}
      />

      {/* MODAL: PAY INVOICE (ATOMIC IPSAS SETTLEMENT) */}
      {isPayModalOpen && invoiceToPay && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {isRtl ? `تحصيل الفاتورة ${invoiceToPay.invoice_number}` : `Collect ${invoiceToPay.invoice_number}`}
                </h3>
              </div>
              <button onClick={() => setIsPayModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs space-y-1">
              <div className="text-slate-500 dark:text-zinc-400">{isRtl ? 'المبلغ المستحق للتحصيل:' : 'Amount Due:'}</div>
              <div className="text-base font-black font-mono text-emerald-600">
                {formatCurrency(invoiceToPay.total_amount, invoiceToPay.currency_code)}
              </div>
              <div className="text-[10px] text-slate-500">
                {isRtl ? 'سيتم ترحيل قيد يومية مزدوج متوازن آلياً إلى دفتر الأستاذ العام IPSAS فور التأكيد' : 'Auto-posts a balanced IPSAS journal voucher on confirmation'}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                {isRtl ? 'طريقة / قناة الاستلام:' : 'Payment Gateway:'}
              </label>
              <select
                value={payGateway}
                onChange={(e) => setPayGateway(e.target.value)}
                className="w-full h-10 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="BANK_TRANSFER">{isRtl ? 'حوالة مصرفية (Bank Transfer)' : 'Bank Transfer'}</option>
                <option value="KURAYMI_PAY">{isRtl ? 'الكريمي إكسبرس (Kuraymi)' : 'Kuraymi Pay'}</option>
                <option value="ONE_CASH">{isRtl ? 'ون كاش (OneCash)' : 'OneCash'}</option>
                <option value="POS_CASH">{isRtl ? 'نقدي في الصندوق (Cash)' : 'Cash'}</option>
                <option value="POS_CARD">{isRtl ? 'بطاقة مدى / فيزا (POS Card)' : 'POS Card'}</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="flex-1 h-9 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <EnterpriseButton
                variant="primary"
                size="sm"
                onClick={handlePayInvoice}
                loading={isSubmittingPay}
                icon={!isSubmittingPay ? <Check className="w-3.5 h-3.5" /> : undefined}
                className="flex-1"
              >
                <span>{isSubmittingPay ? (isRtl ? 'جاري الترحيل...' : 'Posting...') : (isRtl ? 'تأكيد التحصيل والترحيل' : 'Confirm & Post')}</span>
              </EnterpriseButton>
            </div>
          </div>
        </div>
      )}

    </div>
    </ModuleShell>
  );
};

export default SalesRevenueView;
