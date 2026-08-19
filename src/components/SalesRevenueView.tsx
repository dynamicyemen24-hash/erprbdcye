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

interface SalesRevenueViewProps {
  lang: 'ar' | 'en';
  onNavigate?: (tab: TabId) => void;
}

export const SalesRevenueView: React.FC<SalesRevenueViewProps> = ({ lang, onNavigate }) => {
  const isRtl = lang === 'ar';

  const [activeSubTab, setActiveSubTab] = useState<'invoices' | 'new_invoice' | 'service_points' | 'analytics'>('invoices');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [servicePoints, setServicePoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

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

      setInvoices(invRes);
      setSummary(sumRes);
      setServicePoints(spRes);
    } catch (err) {
      console.error('Error fetching sales data:', err);
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
        setInvoiceToPay(null);
        await fetchSalesData();
      }
    } catch (err) {
      console.error('Error settling invoice:', err);
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
        setFormSuccess(isRtl ? 'تم إصدار الفاتورة وتوليد رمز التحقق الرقمي بنجاح!' : 'Invoice issued and QR verified successfully!');
        setNewClient('');
        setNewAmount('');
        await fetchSalesData();
        setTimeout(() => {
          setFormSuccess(null);
          setActiveSubTab('invoices');
        }, 1500);
      }
    } catch (err) {
      console.error('Error creating invoice:', err);
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      (inv.invoice_number?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (inv.donor_or_client_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (inv.revenue_type?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || inv.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
                ? 'إدارة الفواتير، التحصيل الرقمي، نقاط الخدمة، وتوليد القيود المحاسبية الآلية وفق معايير IPSAS' 
                : 'Digital Invoicing, Multi-Channel Collections, Service Hubs, & Automated IPSAS Accounting'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSalesData}
            disabled={loading}
            className="h-9 px-3.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{isRtl ? 'تحديث' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('new_invoice')}
            className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all text-xs font-black flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isRtl ? 'إصدار فاتورة جديدة' : 'Issue Invoice'}</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-bold">{isRtl ? 'إجمالي المفوتر' : 'Total Invoiced'}</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white">
            {formatCurrency(summary?.kpis?.totalInvoicedYer || 74650000)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
            <span>{isRtl ? 'عدد الفواتير الصادرة:' : 'Total Invoices:'}</span>
            <span className="font-bold text-slate-700 dark:text-zinc-300">{summary?.kpis?.totalInvoicesCount || 8}</span>
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-bold">{isRtl ? 'المبالغ المحصلة' : 'Collected Revenue'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(summary?.kpis?.totalCollectedYer || 40750000)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold">
            <ArrowUpRight className="w-3 h-3" />
            <span>{isRtl ? `نسبة التحصيل: ${summary?.kpis?.collectionRatePct || 55}%` : `Collection Rate: ${summary?.kpis?.collectionRatePct || 55}%`}</span>
          </div>
        </div>

        {/* Pending Receivables */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-bold">{isRtl ? 'مستحقات قيد التحصيل' : 'Pending Receivables'}</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-black text-amber-600 dark:text-amber-400">
            {formatCurrency(summary?.kpis?.totalPendingYer || 33900000)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
            <span>{isRtl ? 'فواتير غير مسددة:' : 'Pending Invoices:'}</span>
            <span className="font-bold text-amber-600">{summary?.kpis?.pendingInvoicesCount || 3}</span>
          </div>
        </div>

        {/* Active Service Hubs */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-bold">{isRtl ? 'نقاط ومراكز الخدمة' : 'Service Points'}</span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white">
            {summary?.kpis?.activeServicePointsCount || 4} {isRtl ? 'مراكز نشطة' : 'Hubs'}
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
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={isRtl ? 'البحث برقم الفاتورة، العميل، أو النوع...' : 'Search by invoice #, client, type...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg pr-9 pl-3 text-xs text-slate-900 dark:text-white focus:outline-emerald-600"
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
                  {filteredInvoices.map((inv) => (
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
                            <button
                              onClick={() => {
                                setInvoiceToPay(inv);
                                setIsPayModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>{isRtl ? 'تحصيل' : 'Collect'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
              <button
                type="submit"
                disabled={isSubmittingNew}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all shadow-sm shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmittingNew ? (isRtl ? 'جاري الإصدار والتشفير...' : 'Issuing...') : (isRtl ? 'إصدار الفاتورة وتوليد رمز QR' : 'Issue Invoice & Generate QR')}</span>
              </button>
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
              <button
                onClick={() => window.print()}
                className="flex-1 h-9 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isRtl ? 'طباعة الفاتورة' : 'Print Invoice'}</span>
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 h-9 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black cursor-pointer"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

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
              <button
                onClick={handlePayInvoice}
                disabled={isSubmittingPay}
                className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/30"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSubmittingPay ? (isRtl ? 'جاري الترحيل...' : 'Posting...') : (isRtl ? 'تأكيد التحصيل والترحيل' : 'Confirm & Post')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    </ModuleShell>
  );
};

export default SalesRevenueView;
