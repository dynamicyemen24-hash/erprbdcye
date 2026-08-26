import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  SlidersHorizontal, 
  X, 
  Check, 
  Edit, 
  Trash2, 
  DollarSign, 
  User, 
  Calendar, 
  Heart, 
  TrendingUp, 
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Phone,
  Printer
} from 'lucide-react';
import { Program, Currency } from '../types';
import { printHTML, createPrintDocument } from '../lib/printUtils';
import { enterpriseBus } from '../lib/enterpriseNotificationBus';
import { ModuleShell } from './enterprise/ModuleShell';
import { generateNumericCode } from '../lib/idGenerator';


interface SponsorshipsViewProps {
  sponsorships: any[];
  beneficiaries: any[];
  programs: Program[];
  currencies: Currency[];
  loading: boolean;
  onRefresh: () => void;
  lang: 'ar' | 'en';
  onNavigate?: (tab: string) => void;
}

export default function SponsorshipsView({ 
  sponsorships, 
  beneficiaries, 
  programs, 
  currencies, 
  loading, 
  onRefresh, 
  lang,
  onNavigate 
}: SponsorshipsViewProps) {
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('ALL');
  const [filterDeliveryStatus, setFilterDeliveryStatus] = useState('ALL');
  const [filterCurrency, setFilterCurrency] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);

  // Modal and Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSponsorship, setSelectedSponsorship] = useState<any | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorNameAr, setSponsorNameAr] = useState('');
  const [beneficiaryId, setBeneficiaryId] = useState('');
  const [programId, setProgramId] = useState('');
  const [currencyCode, setCurrencyCode] = useState('YER');
  const [monthlyAmount, setMonthlyAmount] = useState('50');
  const [totalAmount, setTotalAmount] = useState('600');
  const [paidAmount, setPaidAmount] = useState('0');
  const [paymentStatus, setPaymentStatus] = useState('unpaid');
  const [deliveryStatus, setDeliveryStatus] = useState('pending');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [fieldAgentName, setFieldAgentName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [notes, setNotes] = useState('');

  // Detailed view
  const [viewingSponsorship, setViewingSponsorship] = useState<any | null>(null);

  // Helper functions to resolve relationships
  const getBeneficiaryName = (id: string) => {
    const match = beneficiaries.find(b => b.id === id);
    return match ? match.full_name_ar : (lang === 'ar' ? 'مستفيد غير مسجل' : 'Unknown Beneficiary');
  };

  const getBeneficiaryCode = (id: string) => {
    const match = beneficiaries.find(b => b.id === id);
    return match ? match.beneficiary_code : 'BEN-???';
  };

  const getProgramName = (id: string) => {
    const match = programs.find(p => p.id === id);
    if (!match) return lang === 'ar' ? 'البرنامج العام' : 'General Relief';
    return lang === 'ar' ? (match.name_ar || match.name_en) : (match.name_en || match.name_ar);
  };

  const handlePrintStipendReceipt = (sponsorship: any) => {
    const benName = getBeneficiaryName(sponsorship.beneficiary_id);
    const progName = getProgramName(sponsorship.program_id);

    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>سند وتعهد تسليم كفالة نقدية ميدانية - ${sponsorship.sponsor_name_ar || sponsorship.sponsor_name}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; color: #1e293b; background: #fff; line-height: 1.6; }
          .header { display: flex; justify-content: space-between; align-items: center; border-b: 3px solid #059669; padding-bottom: 15px; margin-bottom: 20px; }
          .logo { height: 60px; }
          .title-box { text-align: center; }
          .title-box h2 { margin: 0; color: #059669; font-size: 18px; font-weight: 900; }
          .title-box p { margin: 2px 0 0 0; font-size: 11px; color: #64748b; }
          .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 12px; }
          .info-item span { font-weight: bold; color: #475569; display: block; font-size: 10px; uppercase; }
          .info-item strong { color: #0f172a; font-size: 12px; }
          .stamp-box { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 15px; border-top: 2px dashed #cbd5e1; text-align: center; font-size: 11px; font-weight: bold; }
          .stamp-circle { border: 2px dashed #d97706; padding: 10px; border-radius: 50%; width: 90px; height: 90px; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: #d97706; font-size: 9px; font-weight: 900; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/UAMEX_ERPLOGO.png" class="logo" alt="UAMEX ERP Logo" onerror="this.src='/LogoRohamaab.png'" />
          <div class="title-box">
            <h2>جمعية رُحماء بينهم للعمل الإنساني والتنمية</h2>
            <p>UAMEX ERP™ Sponsorships Management - سند استلام كفالة يتيم / أسرة معتمدة</p>
          </div>
          <div style="text-align: left; font-size: 10px; font-family: monospace;">
            <div><strong>رقم الكفالة:</strong> ${sponsorship.id}</div>
            <div><strong>تاريخ التسليم:</strong> ${new Date().toLocaleDateString('ar-EG')}</div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-item"><span>اسم المستفيد / اليتيم</span><strong>${benName}</strong></div>
          <div class="info-item"><span>الكافل / الجهة المانحة</span><strong>${sponsorship.sponsor_name_ar || sponsorship.sponsor_name || 'فاعل خير'}</strong></div>
          <div class="info-item"><span>البرنامج التنموي</span><strong>${progName}</strong></div>
          <div class="info-item"><span>مبلغ الكفالة الشهري</span><strong>${sponsorship.monthly_amount} ${sponsorship.currency_code}</strong></div>
          <div class="info-item"><span>إجمالي المبلغ المسلم</span><strong>${sponsorship.paid_amount || sponsorship.total_amount} ${sponsorship.currency_code}</strong></div>
          <div class="info-item"><span>اسم المستلم / الولي</span><strong>${sponsorship.receiver_name || benName}</strong></div>
          <div class="info-item"><span>هاتف المستلم</span><strong>${sponsorship.receiver_phone || 'غير مدخل'}</strong></div>
          <div class="info-item"><span>الأخصائي الميداني</span><strong>${sponsorship.field_agent_name || 'مسؤول الكفالات'}</strong></div>
          <div class="info-item"><span>حالة التسليم</span><strong>تم التسليم والتوثيق بنجاح</strong></div>
        </div>

        <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 12px; border-radius: 10px; font-size: 11px; margin-bottom: 20px;">
          <strong>تعهد واعتراف بالاستلام:</strong> أقر أنا المستلم المذكور أعلاه باستلام مبلغ الكفالة المحددة بالكامل من جمعية رُحماء بينهم للعمل الإنساني والتنمية، وأتعهد بصرفها في رعاية وتأهيل المكفول.
        </div>

        <div class="stamp-box">
          <div>
            <p>توقيع وبصمة المستلم / الولي</p>
            <p style="margin-top: 25px;">___________________</p>
          </div>
          <div>
            <div class="stamp-circle">
              اعتماد الكفالات<br>رُحماء بينهم<br>APPROVED
            </div>
          </div>
          <div>
            <p>اعتماد أخصائي الكفالات الميداني</p>
            <p style="margin-top: 25px;">___________________</p>
          </div>
        </div>
      </body>
      </html>
    `;

    printHTML(printContent);
  };

  const handleDisburseStipend = async (sponsorship: any) => {
    const benName = getBeneficiaryName(sponsorship.beneficiary_id);
    const amountNum = parseFloat(sponsorship.monthly_amount || '50000') || 50000;

    const voucherRecord = {
      id: `SPONS-PAY-2026-${generateNumericCode(1000, 9999)}`,
      sponsorshipId: sponsorship.id,
      beneficiaryId: sponsorship.beneficiary_id,
      beneficiaryName: benName,
      sponsorName: sponsorship.sponsor_name_ar || sponsorship.sponsor_name,
      amount: amountNum,
      currency: sponsorship.currency_code || 'YER',
      receiverName: sponsorship.receiver_name || benName,
      status: 'PAID',
      createdAt: new Date().toISOString()
    };

    enterpriseBus.notifyStateSync('NEB-08_SPONSORSHIPS', 'STIPEND_DISBURSED', voucherRecord);
    enterpriseBus.notifyToast({
      type: 'success',
      title: 'تم صرف وتسليم الكفالة الميدانية 🤍',
      message: `تم اعتماد وتسليم كفالة المبلغ (${amountNum.toLocaleString()} ${voucherRecord.currency}) لصالح المكفول ${benName}.`
    });

    handlePrintStipendReceipt(sponsorship);
    onRefresh();
  };

  const handlePrintSponsorship = (sp: any) => {
    // Resilient print writer — popup window when allowed, sandbox-safe iframe fallback
    const printDoc = createPrintDocument();

    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    const titleText = lang === 'ar' ? 'سند إثبات وتسليم كفالة يتيم' : 'Sponsorship & Delivery Voucher';
    const beneficiaryName = getBeneficiaryName(sp.beneficiary_id);
    const beneficiaryCode = getBeneficiaryCode(sp.beneficiary_id);
    const programName = getProgramName(sp.program_id);

    printDoc.write(`
      <!DOCTYPE html>
      <html lang="${lang}" dir="${dir}">
      <head>
        <meta charset="UTF-8">
        <title>${titleText} - ${beneficiaryCode}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Tajawal:wght@400;500;700;900&display=swap');
          body {
            font-family: ${lang === 'ar' ? "'Tajawal', sans-serif" : "'Plus Jakarta Sans', sans-serif"};
          }
          @media print {
            .no-print { display: none !important; }
            body { background-color: white !important; color: black !important; }
            @page { size: A4; margin: 15mm; }
          }
        </style>
      </head>
      <body class="bg-slate-50 text-slate-900 p-8">
        <!-- Floating Action Row -->
        <div class="max-w-4xl mx-auto mb-6 flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm no-print">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-500">${lang === 'ar' ? 'تأكيد طباعة بطاقة ومستند الكفالة والتسليم' : 'Ready to print official sponsorship voucher'}</span>
          </div>
          <button onclick="window.print()" class="px-5 py-2.5 bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer hover:bg-amber-700 transition-all">
            ${lang === 'ar' ? 'إطلاق أمر الطباعة 🖨️' : 'Print Document 🖨️'}
          </button>
        </div>

        <!-- Printable Document Container -->
        <div class="max-w-4xl mx-auto bg-white border border-slate-300 rounded-xl p-10 shadow-lg relative min-h-[297mm]">
          
          <!-- Official Header Letterhead -->
          <div class="flex justify-between items-start pb-6 border-b-2 border-slate-900 gap-6">
            <div class="text-right space-y-1">
              <h1 class="font-black text-lg text-slate-900">مؤسسة رحماء الخيرية للتنمية</h1>
              <p class="text-xs font-bold text-slate-500">إدارة الرعاية الاجتماعية والضمان</p>
              <p class="text-[10px] text-slate-400">صنعاء - الجمهورية اليمنية</p>
            </div>
            <div class="text-center shrink-0">
              <div class="border-2 border-slate-900 px-3 py-1.5 rounded-xl font-black text-sm tracking-widest bg-emerald-50">
                NexoraOS™
              </div>
              <p class="text-[9px] font-bold text-slate-400 mt-1">قسم كفالة الأيتام والأسر</p>
            </div>
            <div class="text-left space-y-1">
              <h1 class="font-black text-lg text-slate-900">Rohamaa Charity Foundation</h1>
              <p class="text-xs font-bold text-slate-500">Social Welfare & Security Dept</p>
              <p class="text-[10px] text-slate-400">Sanaa, Republic of Yemen</p>
            </div>
          </div>

          <!-- Title of Document -->
          <div class="my-8 text-center">
            <h2 class="text-lg font-black text-slate-900 border-2 border-slate-900 bg-amber-500/10 px-6 py-2 rounded-xl inline-block uppercase tracking-wide">
              ${lang === 'ar' ? 'مستند إثبات وتسليم كفالة اليتيم الميدانية' : 'Official Orphan Sponsorship Delivery slip'}
            </h2>
          </div>

          <!-- Document Content Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-xs font-semibold">
            <!-- Sponsor & Beneficiary Card Info -->
            <div class="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
              <h3 class="text-slate-900 font-black border-b border-slate-200 pb-2 flex justify-between items-center text-xs">
                <span>${lang === 'ar' ? '1. تفاصيل الكفالة واليتيم' : '1. Sponsorship & Orphan Details'}</span>
                <span class="font-mono text-[10px] bg-amber-100 text-amber-700 px-1.5 rounded font-bold">${beneficiaryCode}</span>
              </h3>
              
              <div class="space-y-2">
                <div>
                  <p class="text-slate-400 text-[10px]">${lang === 'ar' ? 'اسم الكفيل / المتبرع:' : 'Sponsor Name:'}</p>
                  <p class="text-slate-900 font-black text-sm">${sp.sponsor_name_ar || sp.sponsor_name}</p>
                </div>
                <div>
                  <p class="text-slate-400 text-[10px]">${lang === 'ar' ? 'اليتيم أو الأسرة المكفولة:' : 'Sponsored Beneficiary:'}</p>
                  <p class="text-amber-800 font-black text-sm">${beneficiaryName}</p>
                </div>
                <div>
                  <p class="text-slate-400 text-[10px]">${lang === 'ar' ? 'البرنامج التنموي المرتبط:' : 'Linked Development Program:'}</p>
                  <p class="text-slate-800 font-extrabold">${programName}</p>
                </div>
              </div>
            </div>

            <!-- Financials and Custodian Receiver Info -->
            <div class="p-5 border border-slate-200 rounded-xl bg-amber-50/20 space-y-3">
              <h3 class="text-slate-900 font-black border-b border-slate-200 pb-2 text-xs">
                ${lang === 'ar' ? '2. تفاصيل الصرف الميداني والوكيل المستلم' : '2. Field Disbursal & Custodian Receiver'}
              </h3>
              
              <div class="space-y-2">
                <div>
                  <p class="text-slate-400 text-[10px]">${lang === 'ar' ? 'الوكيل المستلم للمبالغ ميدانياً:' : 'Custodian Receiver Name:'}</p>
                  <p class="text-slate-900 font-black text-sm">${sp.receiver_name || '-'}</p>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <p class="text-slate-400 text-[10px]">${lang === 'ar' ? 'هاتف الوكيل المستلم:' : 'Receiver Phone:'}</p>
                    <p class="font-mono text-slate-800">${sp.receiver_phone || '-'}</p>
                  </div>
                  <div>
                    <p class="text-slate-400 text-[10px]">${lang === 'ar' ? 'المندوب الميداني المسلم:' : 'Field Agent in Charge:'}</p>
                    <p class="text-slate-800">${sp.field_agent_name || '-'}</p>
                  </div>
                </div>
                <div>
                  <p class="text-slate-400 text-[10px]">${lang === 'ar' ? 'تاريخ الكفالة واستحقاق بدء الصرف:' : 'Commencement Date:'}</p>
                  <p class="font-mono text-slate-800">${sp.start_date ? sp.start_date.substring(0, 10) : '-'}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Financial Settlement Box -->
          <div class="border border-slate-300 rounded-xl overflow-hidden mb-8 text-xs font-semibold">
            <div class="bg-slate-900 text-white p-3 font-extrabold text-[10px] uppercase tracking-wider">
              ${lang === 'ar' ? '3. الموقف المالي وحساب الكفالة' : '3. Financial Status & Settlement Statement'}
            </div>
            <div class="grid grid-cols-3 divide-x divide-slate-200 text-center">
              <div class="p-4 space-y-1">
                <p class="text-slate-400 text-[10px]">${lang === 'ar' ? 'مبلغ الالتزام المالي الكلي' : 'Total Pledge Volume'}</p>
                <p class="font-mono text-base font-black text-slate-900">${parseFloat(sp.total_amount).toLocaleString()} ${sp.currency_code}</p>
              </div>
              <div class="p-4 space-y-1 border-r border-slate-200">
                <p class="text-slate-400 text-[10px]">${lang === 'ar' ? 'المبلغ المحصل والمسلّم فعلياً' : 'Total Disbursed to Date'}</p>
                <p class="font-mono text-base font-black text-emerald-600">${parseFloat(sp.paid_amount).toLocaleString()} ${sp.currency_code}</p>
              </div>
              <div class="p-4 space-y-1 border-r border-slate-200">
                <p class="text-slate-400 text-[10px]">${lang === 'ar' ? 'الرصيد المتبقي المستحق' : 'Outstanding Balance Due'}</p>
                <p class="font-mono text-base font-black text-rose-600">${parseFloat(sp.remaining_amount).toLocaleString()} ${sp.currency_code}</p>
              </div>
            </div>
          </div>

          <!-- Status Indicators -->
          <div class="grid grid-cols-2 gap-4 text-xs font-semibold mb-8">
            <div class="p-3.5 border border-slate-200 rounded-xl flex justify-between items-center bg-slate-50">
              <span class="text-slate-500">${lang === 'ar' ? 'حالة سداد التبرعات من الكفيل:' : 'Sponsor payment status:'}</span>
              <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                sp.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' :
                sp.payment_status === 'partial' ? 'bg-amber-50 text-amber-700 border border-amber-200/50' :
                'bg-rose-50 text-rose-700 border border-rose-200/50'
              }">
                ${sp.payment_status === 'paid' ? (lang === 'ar' ? 'مسدد بالكامل' : 'Paid') :
                  sp.payment_status === 'partial' ? (lang === 'ar' ? 'مسدد جزئياً' : 'Partial') :
                  (lang === 'ar' ? 'غير مسدد' : 'Unpaid')}
              </span>
            </div>
            <div class="p-3.5 border border-slate-200 rounded-xl flex justify-between items-center bg-slate-50">
              <span class="text-slate-500">${lang === 'ar' ? 'حالة تسليم الدعم المالي ميدانياً للمستلم:' : 'Field delivery validation:'}</span>
              <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                sp.delivery_status === 'delivered' ? 'bg-sky-50 text-sky-700 border border-sky-200/50' : 'bg-slate-100 text-slate-500 border border-slate-200'
              }">
                ${sp.delivery_status === 'delivered' ? (lang === 'ar' ? 'تم التسليم والتحقق الميداني' : 'Delivered & Validated') : (lang === 'ar' ? 'قيد الانتظار والترحيل الميداني' : 'Pending Field disburse')}
              </span>
            </div>
          </div>

          <!-- Endorsement Note -->
          <div class="p-4 border border-slate-200 rounded-xl bg-amber-500/5 text-xs text-slate-700 font-bold mb-12 leading-relaxed">
            <p class="text-slate-400 font-bold mb-1">${lang === 'ar' ? 'ملاحظات وبنود إقرار الكفالة الميدانية والاجتماعية:' : 'Sponsorship Endorsement notes & field guidelines:'}</p>
            <p class="text-slate-800 text-[11px] leading-relaxed">
              ${sp.notes || (lang === 'ar' 
                ? 'تلتزم مؤسسة رحماء الخيرية للتنمية ممثلة بقسم الرعاية الاجتماعية بإيصال كافة مخصصات الكفالة الشهرية ليد الوكيل المستلم المعمد في الكفالة وإجراء المتابعة الدورية لمستوى التحصيل العلمي والمعيشي لليتيم وتوثيقها.'
                : 'Rohamā\'a Baynahum Foundation pledges to deliver full welfare disbursements to the designated custodian. Operational and educational follow-ups will be documented regularly.')}
            </p>
          </div>

          <!-- Signatures block -->
          <div class="absolute bottom-10 left-10 right-10 grid grid-cols-4 gap-4 text-center text-[10px] font-bold text-slate-700">
            <div class="space-y-12">
              <p class="border-b border-slate-400 pb-1">${lang === 'ar' ? 'الوكيل المستلم الميداني' : 'Custodian Receiver'}</p>
              <p class="text-[9px] text-slate-400">التوقيع أو بصمة الإبهام</p>
            </div>
            <div class="space-y-12">
              <p class="border-b border-slate-400 pb-1">${lang === 'ar' ? 'المندوب الميداني المسلم' : 'Field Agent Delivered By'}</p>
              <p class="text-[9px] text-slate-400">التوقيع والتاريخ</p>
            </div>
            <div class="space-y-12">
              <p class="border-b border-slate-400 pb-1">${lang === 'ar' ? 'المنسق الاجتماعي للفرع' : 'Welfare Coordinator'}</p>
              <p class="text-[9px] text-slate-400">التوقيع والتاريخ</p>
            </div>
            <div class="space-y-12">
              <p class="border-b border-slate-400 pb-1">${lang === 'ar' ? 'الختم الرسمي للمؤسسة' : 'Rohamā\'a Foundation Seal'}</p>
              <p class="text-[9px] text-slate-400">الاعتماد النهائي</p>
            </div>
          </div>

        </div>
      </body>
      </html>
    `);
    printDoc.close();
  };

  // Filter list
  const filteredList = sponsorships.filter(s => {
    const beneficiaryName = getBeneficiaryName(s.beneficiary_id);
    const sponsorNameVal = s.sponsor_name_ar || s.sponsor_name || '';
    const receiverNameVal = s.receiver_name || '';

    const matchesSearch = 
      beneficiaryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sponsorNameVal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receiverNameVal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.receiver_phone || '').includes(searchTerm);

    const matchesPayment = filterPaymentStatus === 'ALL' || s.payment_status === filterPaymentStatus;
    const matchesDelivery = filterDeliveryStatus === 'ALL' || s.delivery_status === filterDeliveryStatus;
    const matchesCurrency = filterCurrency === 'ALL' || s.currency_code === filterCurrency;

    return matchesSearch && matchesPayment && matchesDelivery && matchesCurrency;
  });

  const openFormModal = (sponsorship: any | null = null) => {
    setSelectedSponsorship(sponsorship);
    setFormError(null);
    if (sponsorship) {
      setSponsorName(sponsorship.sponsor_name || '');
      setSponsorNameAr(sponsorship.sponsor_name_ar || '');
      setBeneficiaryId(sponsorship.beneficiary_id || '');
      setProgramId(sponsorship.program_id || '');
      setCurrencyCode(sponsorship.currency_code || 'YER');
      setMonthlyAmount(String(sponsorship.monthly_amount || ''));
      setTotalAmount(String(sponsorship.total_amount || ''));
      setPaidAmount(String(sponsorship.paid_amount || ''));
      setPaymentStatus(sponsorship.payment_status || 'unpaid');
      setDeliveryStatus(sponsorship.delivery_status || 'pending');
      setReceiverName(sponsorship.receiver_name || '');
      setReceiverPhone(sponsorship.receiver_phone || '');
      setFieldAgentName(sponsorship.field_agent_name || '');
      setStartDate(sponsorship.start_date ? sponsorship.start_date.substring(0, 10) : '');
      setNotes(sponsorship.notes || '');
    } else {
      setSponsorName('');
      setSponsorNameAr('');
      setBeneficiaryId(beneficiaries[0]?.id || '');
      setProgramId(programs[0]?.id || '');
      setCurrencyCode(currencies[0]?.code || 'YER');
      setMonthlyAmount('60.00');
      setTotalAmount('720.00');
      setPaidAmount('0.00');
      setPaymentStatus('unpaid');
      setDeliveryStatus('pending');
      setReceiverName('');
      setReceiverPhone('');
      setFieldAgentName('أحمد الريسي');
      setStartDate(new Date().toISOString().substring(0, 10));
      setNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    // Calculate remaining amount
    const totalNum = parseFloat(totalAmount || '0');
    const paidNum = parseFloat(paidAmount || '0');
    const remainingNum = Math.max(0, totalNum - paidNum);

    // Auto-update status
    let statusVal = paymentStatus;
    if (paidNum >= totalNum) {
      statusVal = 'paid';
    } else if (paidNum > 0) {
      statusVal = 'partial';
    } else {
      statusVal = 'unpaid';
    }

    const payload = {
      sponsor_name: sponsorName || sponsorNameAr,
      sponsor_name_ar: sponsorNameAr || sponsorName,
      beneficiary_id: beneficiaryId || null,
      program_id: programId || null,
      currency_code: currencyCode,
      monthly_amount: parseFloat(monthlyAmount),
      total_amount: totalNum,
      paid_amount: paidNum,
      remaining_amount: remainingNum,
      payment_status: statusVal,
      delivery_status: deliveryStatus,
      receiver_name: receiverName,
      receiver_phone: receiverPhone,
      field_agent_name: fieldAgentName,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      status_code: 'active',
      notes,
    };

    try {
      const url = selectedSponsorship 
        ? `/api/tables/sponsorships/${selectedSponsorship.id}` 
        : `/api/tables/sponsorships`;
      
      const response = await fetch(url, {
        method: selectedSponsorship ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to save sponsorship record.');
      }

      onRefresh();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmation = lang === 'ar'
      ? 'هل أنت متأكد من حذف هذه الكفالة؟'
      : 'Are you sure you want to delete this sponsorship card?';

    if (!window.confirm(confirmation)) return;

    try {
      const response = await fetch(`/api/tables/sponsorships/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete.');
      onRefresh();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Financial summary numbers (Calculated dynamically)
  // Let's group sums by currency
  const currencySums = sponsorships.reduce((sums: any, s) => {
    const curr = s.currency_code || 'YER';
    const total = parseFloat(s.total_amount || '0');
    const paid = parseFloat(s.paid_amount || '0');
    const remain = parseFloat(s.remaining_amount || '0');

    if (!sums[curr]) {
      sums[curr] = { total: 0, paid: 0, remain: 0 };
    }
    sums[curr].total += total;
    sums[curr].paid += paid;
    sums[curr].remain += remain;
    return sums;
  }, {});

  // Primary display sums (using YER or first found currency)
  const displayCurrency = currencies[0]?.code || 'YER';
  const totalsForPrimary = currencySums[displayCurrency] || { total: 0, paid: 0, remain: 0 };
  const pendingDeliveries = sponsorships.filter(s => s.delivery_status === 'pending').length;

  return (
    <ModuleShell
      titleAr="نظام الكفالات والرعاية الاجتماعية"
      titleEn="Sponsorships & Welfare OS"
      descAr="برامج كفالات الأيتام، الأسر المحتاجة، الرعاية التعليمية"
      descEn="Sponsorship programs, orphan registries, monthly distribution auditing"
      domainCode="NEB-07"
      icon={Heart}
      accent="rose"
      lang={lang}
      onRefresh={onRefresh}
      onNavigate={onNavigate}
      isLoading={loading}
      recordCount={sponsorships.length}
      breadcrumbs={[
        { label: lang === 'ar' ? 'الرئيسية' : 'Home', onClick: () => onNavigate?.('dashboard') },
        { label: lang === 'ar' ? 'الكفالات' : 'Sponsorships' }
      ]}
    >
    <div className="space-y-6">
      
      {/* Title & Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {lang === 'ar' ? 'إدارة كفالات الأيتام ورعاية الأسر' : 'Orphan & Family Sponsorships Ledger'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'ar' ? 'متابعة الدعم المالي والغذائي الدوري للأيتام والربط بالمانحين ومندوبي التوزيع' : 'Track monthly financial pledges, donor assignments, and delivery handovers'}
          </p>
        </div>
        
        <button
          onClick={() => openFormModal(null)}
          className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md hover:shadow-amber-600/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'ar' ? 'إضافة كفالة جديدة' : 'Add New Pledge'}</span>
        </button>
      </div>

      {/* Financial Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-bold block uppercase">{lang === 'ar' ? 'حجم الالتزامات الكلي' : 'Total Pledge Volume'}</span>
            <span className="text-sm font-black text-slate-900 font-mono">
              {loading ? '...' : `${totalsForPrimary.total.toLocaleString(undefined, {maximumFractionDigits:0})} ${displayCurrency}`}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-bold block uppercase">{lang === 'ar' ? 'إجمالي المبالغ المحصلة' : 'Collected / Received'}</span>
            <span className="text-sm font-black text-slate-900 font-mono">
              {loading ? '...' : `${totalsForPrimary.paid.toLocaleString(undefined, {maximumFractionDigits:0})} ${displayCurrency}`}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-bold block uppercase">{lang === 'ar' ? 'المستحقات المتبقية' : 'Due / Remaining'}</span>
            <span className="text-sm font-black text-slate-900 font-mono">
              {loading ? '...' : `${totalsForPrimary.remain.toLocaleString(undefined, {maximumFractionDigits:0})} ${displayCurrency}`}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 bg-sky-50 rounded-xl text-sky-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-bold block uppercase">{lang === 'ar' ? 'تسليمات ميدانية قيد الانتظار' : 'Pending Handovers'}</span>
            <span className="text-sm font-black text-slate-900 font-mono">
              {loading ? '...' : `${pendingDeliveries} ${lang === 'ar' ? 'تسليماً' : 'Cases'}`}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Options */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400"
                  style={lang === 'ar' ? { left: 'auto', right: '0', paddingRight: '12px' } : {}}
            >
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text" 
              placeholder={lang === 'ar' ? 'البحث عن طريق الكفيل، المستفيد، الوكيل المستلم، الهاتف...' : 'Search by sponsor name, beneficiary, receiver, phone...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500/50 rounded-xl py-2 px-4 text-xs focus:outline-none transition-all"
              style={lang === 'ar' ? { paddingRight: '36px', paddingLeft: '16px' } : { paddingLeft: '36px', paddingRight: '16px' }}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                showFilters || filterPaymentStatus !== 'ALL' || filterDeliveryStatus !== 'ALL' || filterCurrency !== 'ALL'
                  ? 'bg-amber-50 border-amber-200 text-amber-700' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-zinc-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'تصفية الالتزامات' : 'Filters'}</span>
            </button>

            {(searchTerm || filterPaymentStatus !== 'ALL' || filterDeliveryStatus !== 'ALL' || filterCurrency !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterPaymentStatus('ALL');
                  setFilterDeliveryStatus('ALL');
                  setFilterCurrency('ALL');
                }}
                className="text-xs font-bold text-zinc-400 hover:text-rose-600 transition-all cursor-pointer px-2"
              >
                {lang === 'ar' ? 'إعادة تعيين' : 'Reset'}
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-100 animate-slide-down">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-zinc-400 uppercase">{lang === 'ar' ? 'حالة السداد للمحاسبة' : 'Payment Status'}</label>
              <select
                value={filterPaymentStatus}
                onChange={(e) => setFilterPaymentStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none"
              >
                <option value="ALL">{lang === 'ar' ? 'الكل' : 'All Payments'}</option>
                <option value="paid">{lang === 'ar' ? 'مكفول بالكامل (Paid)' : 'Fully Paid'}</option>
                <option value="partial">{lang === 'ar' ? 'دفع جزئي (Partial)' : 'Partially Paid'}</option>
                <option value="unpaid">{lang === 'ar' ? 'متعثر / غير مدفوع (Unpaid)' : 'Unpaid'}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-zinc-400 uppercase">{lang === 'ar' ? 'حالة التسليم الميداني' : 'Delivery Status'}</label>
              <select
                value={filterDeliveryStatus}
                onChange={(e) => setFilterDeliveryStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none"
              >
                <option value="ALL">{lang === 'ar' ? 'الكل' : 'All Deliveries'}</option>
                <option value="delivered">{lang === 'ar' ? 'تم التسليم والمطابقة (Delivered)' : 'Delivered'}</option>
                <option value="pending">{lang === 'ar' ? 'قيد الانتظار ميدانياً (Pending)' : 'Pending'}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-zinc-400 uppercase">{lang === 'ar' ? 'عملة الكفالة' : 'Currency'}</label>
              <select
                value={filterCurrency}
                onChange={(e) => setFilterCurrency(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none"
              >
                <option value="ALL">{lang === 'ar' ? 'الكل' : 'All Currencies'}</option>
                {currencies.map(c => (
                  <option key={c.code} value={c.code}>{c.code} ({c.name_ar})</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Grid of sponsorships */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 font-bold text-xs space-y-3">
            <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p>{lang === 'ar' ? 'جاري جلب سجلات الكفالة ومطابقتها سحابياً...' : 'Connecting to remote Neon ledger...'}</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <p className="text-zinc-300 text-3xl font-bold">💳</p>
            <p className="text-xs font-black text-zinc-400">{lang === 'ar' ? 'لم يتم العثور على أي بطاقات كفالة تطابق شروط التصفية' : 'No sponsorship cards matching criteria.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right" style={lang === 'en' ? { textAlign: 'left' } : {}}>
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider">
                <tr>
                  <th className="px-6 py-3">{lang === 'ar' ? 'الكفيل والوسيط' : 'Sponsor'}</th>
                  <th className="px-6 py-3">{lang === 'ar' ? 'اليتيم / المستفيد' : 'Beneficiary'}</th>
                  <th className="px-6 py-3">{lang === 'ar' ? 'مبلغ الكفالة الشهري' : 'Commitment'}</th>
                  <th className="px-6 py-3">{lang === 'ar' ? 'المبلغ الكلي / المدفوع' : 'Total vs Paid'}</th>
                  <th className="px-6 py-3">{lang === 'ar' ? 'حالة السداد' : 'Payment'}</th>
                  <th className="px-6 py-3">{lang === 'ar' ? 'حالة التسليم الميداني' : 'Delivery'}</th>
                  <th className="px-6 py-3">{lang === 'ar' ? 'الوكيل المستلم' : 'Receiver'}</th>
                  <th className="px-6 py-3 text-center">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filteredList.map((sp) => {
                  const bName = getBeneficiaryName(sp.beneficiary_id);
                  const bCode = getBeneficiaryCode(sp.beneficiary_id);
                  const progName = getProgramName(sp.program_id);
                  const total = parseFloat(sp.total_amount || '0');
                  const paid = parseFloat(sp.paid_amount || '0');
                  const progress = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

                  return (
                    <tr key={sp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-extrabold text-slate-800">{sp.sponsor_name_ar || sp.sponsor_name || '-'}</p>
                          {sp.mediator_name && (
                            <span className="text-[9px] text-zinc-400 font-bold block mt-0.5">
                              {lang === 'ar' ? `بوساطة: ${sp.mediator_name}` : `Mediator: ${sp.mediator_name}`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <button
                            onClick={() => setViewingSponsorship(sp)}
                            className="font-extrabold text-amber-700 hover:text-amber-800 text-right block font-sans cursor-pointer"
                          >
                            {bName}
                          </button>
                          <span className="font-mono text-[9px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded mt-0.5 inline-block font-bold">
                            {bCode}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {parseFloat(sp.monthly_amount || '0').toLocaleString(undefined, {maximumFractionDigits:2})} {sp.currency_code}
                        <span className="text-[9px] text-zinc-400 font-sans block font-semibold">{lang === 'ar' ? 'شهرياً' : 'monthly'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 max-w-[120px]">
                          <div className="flex justify-between text-[10px] font-mono font-bold text-slate-600">
                            <span>{paid.toLocaleString()}</span>
                            <span className="text-zinc-300">/</span>
                            <span>{total.toLocaleString()} {sp.currency_code}</span>
                          </div>
                          {/* Minimal progress bar */}
                          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${progress === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          sp.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                          sp.payment_status === 'partial' ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {sp.payment_status === 'paid' ? (lang === 'ar' ? 'مدفوع كاملاً' : 'Paid') :
                           sp.payment_status === 'partial' ? (lang === 'ar' ? 'جزئي' : 'Partial') :
                           (lang === 'ar' ? 'غير مسدد' : 'Unpaid')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          sp.delivery_status === 'delivered' ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {sp.delivery_status === 'delivered' ? (lang === 'ar' ? 'تم التسليم والمطابقة' : 'Delivered') : (lang === 'ar' ? 'قيد الانتظار' : 'Pending')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-700">{sp.receiver_name || '-'}</p>
                          {sp.receiver_phone && (
                            <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">{sp.receiver_phone}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => handlePrintSponsorship(sp)}
                            className="p-1 bg-slate-50 border border-slate-200 rounded text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-all cursor-pointer"
                            title={lang === 'ar' ? 'طباعة بطاقة الكفالة والتسليم' : 'Print Sponsorship Card'}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openFormModal(sp)}
                            className="p-1 bg-slate-50 border border-slate-200 rounded text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-all cursor-pointer"
                            title={lang === 'ar' ? 'تعديل الكفالة' : 'Edit'}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(sp.id)}
                            className="p-1 bg-slate-50 border border-slate-200 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                            title={lang === 'ar' ? 'حذف الكفالة' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail viewer */}
      {viewingSponsorship && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full overflow-hidden shadow-2xl animate-scale-up">
            <div className="px-6 py-4 bg-zinc-900 text-white flex justify-between items-center">
              <h3 className="font-black text-sm">{lang === 'ar' ? 'تفاصيل سجل كفالة اليتيم' : 'Sponsorship Registry Details'}</h3>
              <button 
                onClick={() => setViewingSponsorship(null)}
                className="p-1 hover:bg-zinc-800 rounded-full border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-1">
                <p className="text-[10px] text-zinc-400 font-extrabold uppercase">{lang === 'ar' ? 'الكفيل والوسيط الراعي' : 'Sponsor details'}</p>
                <p className="text-base font-black text-slate-900">{viewingSponsorship.sponsor_name_ar || viewingSponsorship.sponsor_name}</p>
                {viewingSponsorship.mediator_name && (
                  <p className="text-xs text-slate-500 font-semibold">بواسطة المندوب: {viewingSponsorship.mediator_name}</p>
                )}
              </div>

              <div className="border-t border-b border-slate-100 py-4 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-zinc-400 font-bold mb-0.5">{lang === 'ar' ? 'اليتيم المكفول' : 'Sponsored Orphan'}</p>
                  <p className="font-extrabold text-amber-800">{getBeneficiaryName(viewingSponsorship.beneficiary_id)}</p>
                </div>
                <div>
                  <p className="text-zinc-400 font-bold mb-0.5">{lang === 'ar' ? 'رقم ملف اليتيم' : 'Beneficiary Code'}</p>
                  <p className="font-mono font-extrabold text-slate-800">{getBeneficiaryCode(viewingSponsorship.beneficiary_id)}</p>
                </div>
                <div>
                  <p className="text-zinc-400 font-bold mb-0.5">{lang === 'ar' ? 'البرنامج الموجه' : 'Program Link'}</p>
                  <p className="font-extrabold text-slate-800">{getProgramName(viewingSponsorship.program_id)}</p>
                </div>
                <div>
                  <p className="text-zinc-400 font-bold mb-0.5">{lang === 'ar' ? 'مندوب الاستلام والتسليم' : 'Field Agent'}</p>
                  <p className="font-extrabold text-slate-800">{viewingSponsorship.field_agent_name || '-'}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-2 border border-slate-100 text-xs">
                <div className="flex justify-between font-bold text-slate-500">
                  <span>{lang === 'ar' ? 'الالتزام الكلي للكفالة' : 'Total volume pledge'}</span>
                  <span className="font-mono text-slate-800 font-extrabold">{parseFloat(viewingSponsorship.total_amount).toLocaleString()} {viewingSponsorship.currency_code}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-500">
                  <span>{lang === 'ar' ? 'المبلغ المحصل فعلياً' : 'Amount paid to date'}</span>
                  <span className="font-mono text-emerald-600 font-extrabold">{parseFloat(viewingSponsorship.paid_amount).toLocaleString()} {viewingSponsorship.currency_code}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-500 border-t border-slate-200/60 pt-2">
                  <span>{lang === 'ar' ? 'المبلغ المتبقي المعلق' : 'Remaining balance due'}</span>
                  <span className="font-mono text-rose-600 font-extrabold">{parseFloat(viewingSponsorship.remaining_amount).toLocaleString()} {viewingSponsorship.currency_code}</span>
                </div>
              </div>

              <div className="text-xs space-y-1.5">
                <p className="text-zinc-400 font-bold">{lang === 'ar' ? 'الوكيل المستلم ميدانياً للمبالغ' : 'Field receiver details'}</p>
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="font-extrabold text-slate-800">{viewingSponsorship.receiver_name || '-'}</p>
                    <p className="font-mono text-slate-500 mt-0.5 text-[10px]">{viewingSponsorship.receiver_phone || '-'}</p>
                  </div>
                  {viewingSponsorship.receiver_phone && (
                    <a href={`tel:${viewingSponsorship.receiver_phone}`} className="p-2 bg-white rounded-full border border-slate-200 text-amber-600 hover:bg-amber-50 transition-all">
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => handlePrintSponsorship(viewingSponsorship)}
                className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5 shrink-0" />
                <span>{lang === 'ar' ? 'طباعة بطاقة الكفالة' : 'Print Card'}</span>
              </button>
              <button
                onClick={() => {
                  setViewingSponsorship(null);
                  openFormModal(viewingSponsorship);
                }}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                {lang === 'ar' ? 'تعديل الكفالة' : 'Edit Pledge'}
              </button>
              <button
                onClick={() => setViewingSponsorship(null)}
                className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 max-w-xl w-full overflow-hidden shadow-2xl animate-scale-up">
            
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">
                  {selectedSponsorship 
                    ? (lang === 'ar' ? 'تعديل بطاقة الكفالة' : 'Edit Sponsorship Card')
                    : (lang === 'ar' ? 'إنشاء بطاقة كفالة يتيم جديدة' : 'Establish New Sponsorship Pledge')}
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {lang === 'ar' ? 'أدخل معلومات الكفيل المانح، واليتيم المكفول، والمستحقات المالية الدورية.' : 'Link a donor pledge to an active orphan card in the system.'}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 bg-white hover:bg-slate-100 rounded-full border border-slate-200 text-zinc-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="m-4 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs font-bold flex items-center gap-2">
                <span>⚠️</span>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="p-6 max-h-[400px] overflow-y-auto space-y-4">
                
                {/* Section: Names */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'اسم الكفيل / المتبرع (بالعربية)' : 'Sponsor Name (Arabic)'}</label>
                    <input 
                      type="text" 
                      required 
                      value={sponsorNameAr}
                      onChange={(e) => setSponsorNameAr(e.target.value)}
                      placeholder="مثال: أم عبدالعزيز العمران"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold focus:outline-none" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'اسم الكفيل / المتبرع (بالإنجليزي)' : 'Sponsor Name (English)'}</label>
                    <input 
                      type="text" 
                      value={sponsorName}
                      onChange={(e) => setSponsorName(e.target.value)}
                      placeholder="e.g. Om Abdulaziz"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold focus:outline-none" 
                    />
                  </div>
                </div>

                {/* Section: Beneficiary & Program resolution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'اليتيم أو الأسرة المستفيدة' : 'Orphan Beneficiary'}</label>
                    <select
                      required
                      value={beneficiaryId}
                      onChange={(e) => setBeneficiaryId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold focus:outline-none"
                    >
                      <option value="">{lang === 'ar' ? 'اختر اليتيم...' : 'Select Beneficiary...'}</option>
                      {beneficiaries.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.full_name_ar} ({b.beneficiary_code || 'No Code'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'البرنامج المالي والغذائي' : 'Corporate Program'}</label>
                    <select
                      value={programId}
                      onChange={(e) => setProgramId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold focus:outline-none"
                    >
                      {programs.map(p => (
                        <option key={p.id} value={p.id}>
                          {lang === 'ar' ? (p.name_ar || p.name_en) : (p.name_en || p.name_ar)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Section: Financial allocations */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-b border-slate-100 py-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase">{lang === 'ar' ? 'العملة المالية' : 'Currency'}</label>
                    <select
                      value={currencyCode}
                      onChange={(e) => setCurrencyCode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold focus:outline-none"
                    >
                      {currencies.map(c => (
                        <option key={c.code} value={c.code}>{c.code}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase">{lang === 'ar' ? 'الكفالة الشهرية' : 'Monthly Pledge'}</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={monthlyAmount}
                      onChange={(e) => setMonthlyAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-mono font-bold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase">{lang === 'ar' ? 'التزام الفترة الكلي' : 'Total Amount'}</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-mono font-bold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase">{lang === 'ar' ? 'المبلغ المحصل فعلياً' : 'Amount Paid'}</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-mono font-bold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Section: Receivers and Agents */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'اسم الوكيل المستلم (الأم/الولي)' : 'Receiver Name'}</label>
                    <input 
                      type="text" 
                      required 
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      placeholder="مثال: ياسمين أحمد القاضي"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold focus:outline-none" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'هاتف المستلم للمطابقة' : 'Receiver Phone'}</label>
                    <input 
                      type="text" 
                      required 
                      value={receiverPhone}
                      onChange={(e) => setReceiverPhone(e.target.value)}
                      placeholder="77XXXXXXX"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono font-bold focus:outline-none" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'المندوب الميداني المسؤول' : 'Field Agent'}</label>
                    <input 
                      type="text" 
                      required 
                      value={fieldAgentName}
                      onChange={(e) => setFieldAgentName(e.target.value)}
                      placeholder="أحمد الريسي"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold focus:outline-none" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'تاريخ بدء سريان الكفالة' : 'Start Date'}</label>
                    <input 
                      type="date" 
                      required 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono font-bold focus:outline-none" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'حالة التسليم الميداني الحالي' : 'Delivery Status'}</label>
                    <select
                      value={deliveryStatus}
                      onChange={(e) => setDeliveryStatus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold focus:outline-none"
                    >
                      <option value="pending">{lang === 'ar' ? 'معلق قيد التجهيز (Pending)' : 'Pending'}</option>
                      <option value="delivered">{lang === 'ar' ? 'تم التسليم والمطابقة (Delivered)' : 'Delivered'}</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'تعليمات الصرف والملاحظات' : 'Special Instructions'}</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="شروط خاصة كصرف الكفالة عيناً مواد غذائية أو تسليمها يداً بيد للجدة..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold focus:outline-none h-16 resize-none" 
                  />
                </div>

              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1 transition-all cursor-pointer"
                >
                  {formSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{lang === 'ar' ? 'حفظ بطاقة الكفالة' : 'Establish Pledge'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
    </ModuleShell>
  );
}
