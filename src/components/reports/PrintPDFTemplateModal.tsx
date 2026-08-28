import React, { useState, useMemo } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Eye, 
  Sliders, 
  Check, 
  Building2, 
  ShieldCheck, 
  Palette, 
  FileText,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { 
  buildProjectReportHTML, 
  buildFinancialStatementPDFHTML, 
  buildExecutiveReportPDFHTML,
  buildBeneficiaryReportPDFHTML,
  buildPredictiveReportPDFHTML,
  buildEvaluationReportPDFHTML,
  buildInterconnectedReportPDFHTML,
  buildStrategyReportPDFHTML,
  buildProgramsReportPDFHTML,
  buildActivitiesReportPDFHTML,
  buildStaffReportPDFHTML,
  buildOperationalManualPDFHTML,
  buildUserManualPDFHTML,
  buildProcurementReportPDFHTML,
  buildInventoryReportPDFHTML,
  buildSponsorshipReportPDFHTML,
  buildRevenueInvestmentReportPDFHTML,
  buildAuditReportPDFHTML,
  buildOfficialPaymentVoucherPDFHTML,
  buildOfficialReceiptVoucherPDFHTML,
  buildOfficialJournalVoucherPDFHTML,
  buildOfficialGoodsReceiptIssuePDFHTML,
  buildOfficialPurchaseOrderPDFHTML,
  buildOfficialBeneficiaryAidCardPDFHTML,
  generateAndDownloadPDF, 
  printPDFHTML,
  safeArray 
} from '../../lib/pdfReportGenerator';
import { useEnterprise } from '../../core/context/EnterpriseContext';
import { sanitizeHtml } from '../../lib/htmlSanitizer';

interface PrintPDFTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
  type: 'project' | 'financial' | 'executive' | 'beneficiary' | 'predictive' | 'evaluation' | 'interconnected' | 'strategy' | 'programs' | 'projects' | 'activities' | 'staff' | 'operational_manual' | 'user_manual' | 'procurement' | 'inventory' | 'sponsorship' | 'revenue_investments' | 'audit_trail' | 'payment_voucher' | 'receipt_voucher' | 'journal_voucher' | 'goods_voucher' | 'purchase_order' | 'beneficiary_aid_card';
  data: {
    projects?: any[];
    programs?: any[];
    beneficiaries?: any[];
    sponsorships?: any[];
    accounts?: any[];
    plans?: any[];
    goals?: any[];
    activities?: any[];
    users?: any[];
    orders?: any[];
    vendors?: any[];
    inventoryItems?: any[];
    warehouses?: any[];
    invoices?: any[];
    investments?: any[];
    auditLogs?: any[];
    financialType?: 'trial' | 'income' | 'balance_sheet' | 'cash_flow';
    title?: string;
    subtitle?: string;
    voucherNumber?: string;
    payeeName?: string;
    amountYer?: number;
    donorName?: string;
    programName?: string;
    paymentMethodAr?: string;
    bankReference?: string;
    purposeAr?: string;
    collectorName?: string;
    voucherTypeAr?: string;
    voucherType?: 'receipt' | 'issue';
    memoAr?: string;
    lines?: any[];
    warehouseName?: string;
    supplierOrReceiver?: string;
    referencePO?: string;
    items?: any[];
    poNumber?: string;
    vendorName?: string;
    tenderReference?: string;
    deliveryPeriodDays?: number;
    deliveryLocation?: string;
    cardNumber?: string;
    beneficiaryName?: string;
    nationalIdOrSurvey?: string;
    governorate?: string;
    district?: string;
    village?: string;
    familyMembersCount?: number;
    vulnerabilityCategory?: string;
    reliefPackageAr?: string;
    distributorName?: string;
    dateGregorian?: string;
    dateHijri?: string;
    projectName?: string;
    projectCode?: string;
    costCenter?: string;
    referenceDocNumber?: string;
    descriptionAr?: string;
    preparedBy?: string;
  };
}

export default function PrintPDFTemplateModal({
  isOpen,
  onClose,
  lang,
  type,
  data
}: PrintPDFTemplateModalProps) {
  const { activeOrg, orgName } = useEnterprise();
  const isRtl = lang === 'ar';

  // State customization
  const getDefaultTitle = () => {
    if (type === 'payment_voucher') return isRtl ? 'سند صرف مالي رسمي معتمد' : 'Official Payment Voucher';
    if (type === 'receipt_voucher') return isRtl ? 'سند قبض وتبرعات مالي معتمد' : 'Official Receipt Voucher';
    if (type === 'journal_voucher') return isRtl ? 'سند قيد يومية محاسبي وتسوية معتمدة' : 'Official Journal Voucher';
    if (type === 'goods_voucher') return isRtl ? 'سند استلام وصرف مواد مخزنية معتمد' : 'Goods Receipt & Issue Voucher';
    if (type === 'purchase_order') return isRtl ? 'أمر شراء وتوريد رسمي معتمد' : 'Official Purchase Order';
    if (type === 'beneficiary_aid_card') return isRtl ? 'سند تسليم مساعدات إغاثية وبطاقة صرف معتمدة' : 'Beneficiary Aid Delivery Card';
    if (type === 'procurement') return isRtl ? 'تقرير المشتريات والمناقصات وسلاسل الإمداد المعتمد' : 'Certified Procurement & Supply Chain Report';
    if (type === 'inventory') return isRtl ? 'تقرير المخزون والمستودعات المركزية المعتمد' : 'Certified Inventory & Central Warehouses Report';
    if (type === 'sponsorship') return isRtl ? 'تقرير كفالات الأيتام والرعاية التكافلية المعتمد' : 'Certified Orphans Sponsorships & Social Care Report';
    if (type === 'revenue_investments') return isRtl ? 'تقرير تنمية الموارد والمشاريع الاستثمارية والوقفية' : 'Resource Mobilization & Endowment Investments Report';
    if (type === 'audit_trail') return isRtl ? 'تقرير سجلات التدقيق الأمني والرقابي المعتمد' : 'Certified Security Audit Trail & Compliance Report';
    if (type === 'project' || type === 'projects') return isRtl ? 'تقرير الأداء التنفيذي للمشاريع الميدانية' : 'Field Projects Executive Performance Report';
    if (type === 'programs') return isRtl ? 'تقرير أداء البرامج التنموية الاستراتيجية' : 'Development Programs Strategic Performance Report';
    if (type === 'activities') return isRtl ? 'سجل الأنشطة والمتابعة الميدانية المعيارية' : 'Field Activities & WBS Operational Registry';
    if (type === 'staff') return isRtl ? 'كشف سجل كوادر المؤسسة والفرق الميدانية' : 'Official HR Staff & Field Personnel Registry';
    if (type === 'beneficiary') return isRtl ? 'تقرير المستفيدين والرعاية الاجتماعية الموحد' : 'Unified Beneficiaries & Social Care Report';
    if (type === 'strategy') return isRtl ? 'وثيقة الخطة الاستراتيجية المعتمدة (2026 - 2031)' : 'Official Strategic Plan Document (2026 - 2031)';
    if (type === 'executive') return isRtl ? 'التقرير التنفيذي الموحد المتكامل (15 باباً معمارياً)' : 'Executive Integrated Intelligence Report';
    return isRtl ? 'القوائم المالية والختامية المعيارية' : 'Standard Financial Statements';
  };

  const getDefaultSubtitle = () => {
    if (data.subtitle) return data.subtitle;
    if (type === 'payment_voucher') return isRtl ? 'معتمد وفق نظام الرقابة والتدقيق الداخلي ومعايير IPSAS' : 'IPSAS Double-Entry Compliance Verified';
    if (type === 'receipt_voucher') return isRtl ? 'توثيق الإيداعات والتبرعات الموجهة وفق لوائح الحوكمة المالية' : 'Official Donor Deposit & Earmarked Fund Receipt';
    if (type === 'journal_voucher') return isRtl ? 'سند قيود الأستاذ العام والتسويات المحاسبية المتزنة' : 'Balanced Double-Entry Journal Entry';
    if (type === 'goods_voucher') return isRtl ? 'فحص واستلام وصرف المواد والمستلزمات الإغاثية المستودعية' : 'Warehouse Stock In/Out Verification';
    if (type === 'purchase_order') return isRtl ? 'أمر تعميد شراء وتوريد ملزم قانونياً وفق محضر المناقصات' : 'Legally Binding Purchase Order & Supplier Contract';
    if (type === 'beneficiary_aid_card') return isRtl ? 'توثيق تسليم الحصص الإغاثية الميدانية وفق معايير ميثاق إسفير الدولي' : 'Field Aid Dispatch & Sphere Compliance Verification';
    if (type === 'procurement') return isRtl ? 'سجل أوامر الشراء P2P، تقييم الموردين، والمطابقة المحاسبية الثلاثية' : 'P2P Purchase Orders, Vendor Vetting & 3-Way Match Audit';
    if (type === 'inventory') return isRtl ? 'حركة المواد الإغاثية، الطاقة الاستيعابية للمستودعات، وتقييم المخزون المتاح' : 'Relief Stock Balances, Warehouse Capacities & Stock Valuation';
    if (type === 'sponsorship') return isRtl ? 'سجل الحالات المكفولة، المخصصات الشهرية، وبيانات المتابعة التعليمية والصحية' : 'Sponsored Orphans Dossier, Monthly Stipends, Health & Education Welfare';
    if (type === 'revenue_investments') return isRtl ? 'عوائد التمويل الذاتي، الفواتير المحصلة، واستدامة المحافظ الاستثمارية التنموية' : 'Self-Financing Yields, Revenue Invoicing & Endowment Sustainability Portfolios';
    if (type === 'audit_trail') return isRtl ? 'تتبع وتدقيق العمليات الحساسة، التعديلات المالية، والتحقق المشفر SHA-256' : 'Sensitive Operations Log, Mutation Audit & SHA-256 Cryptographic Verification';
    if (type === 'project' || type === 'projects') return isRtl ? 'متابعة نسبة الإنجاز والموازنات والمستفيدين' : 'Tracking progress, budgets and beneficiaries';
    return isRtl ? 'معدة وفق معايير IPSAS والمعايير الدولية المحاسبية' : 'Prepared according to IPSAS standards';
  };

  const [reportTitle, setReportTitle] = useState(getDefaultTitle());
  const [reportSubtitle, setReportSubtitle] = useState(getDefaultSubtitle());

  const [accentColor, setAccentColor] = useState('#059669'); // Primary Emerald
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeRiskMatrix, setIncludeRiskMatrix] = useState(type === 'project');
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [classification, setClassification] = useState<'OFFICIAL' | 'CONFIDENTIAL' | 'PUBLIC'>('OFFICIAL');
  const [isGenerating, setIsGenerating] = useState(false);

  const generatedHTML = useMemo(() => {
    if (type === 'project' || type === 'projects') {
      return buildProjectReportHTML({
        projects: safeArray(data.projects),
        programs: safeArray(data.programs),
        title: reportTitle,
        subtitle: reportSubtitle,
        lang,
        accentColor,
        includeSummary,
        includeRiskMatrix,
        includeSignatures,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    } else if (type === 'strategy') {
      return buildStrategyReportPDFHTML({
        plans: safeArray(data.plans),
        goals: safeArray(data.goals),
        title: reportTitle,
        subtitle: reportSubtitle,
        lang,
        accentColor,
        includeSummary,
        includeSignatures,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    } else if (type === 'programs') {
      return buildProgramsReportPDFHTML({
        programs: safeArray(data.programs),
        title: reportTitle,
        subtitle: reportSubtitle,
        lang,
        accentColor,
        includeSummary,
        includeSignatures,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    } else if (type === 'activities') {
      return buildActivitiesReportPDFHTML({
        activities: safeArray(data.activities),
        title: reportTitle,
        subtitle: reportSubtitle,
        lang,
        accentColor,
        includeSummary,
        includeSignatures,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    } else if (type === 'executive') {
      return buildExecutiveReportPDFHTML({
        projects: safeArray(data.projects),
        programs: safeArray(data.programs),
        title: reportTitle,
        subtitle: reportSubtitle,
        lang,
        accentColor,
        includeSummary,
        includeSignatures,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    } else if (type === 'beneficiary') {
      return buildBeneficiaryReportPDFHTML({
        beneficiaries: safeArray(data.beneficiaries),
        sponsorships: safeArray(data.sponsorships),
        title: reportTitle,
        subtitle: reportSubtitle,
        lang,
        accentColor,
        includeSummary,
        includeSignatures,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    } else if (type === 'predictive') {
      return buildPredictiveReportPDFHTML({
        projects: safeArray(data.projects),
        programs: safeArray(data.programs),
        title: reportTitle,
        subtitle: reportSubtitle,
        lang,
        accentColor,
        includeSummary,
        includeSignatures,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    } else if (type === 'evaluation') {
      return buildEvaluationReportPDFHTML({
        projects: safeArray(data.projects),
        programs: safeArray(data.programs),
        title: reportTitle,
        subtitle: reportSubtitle,
        lang,
        accentColor,
        includeSummary,
        includeSignatures,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    } else if (type === 'staff') {
      return buildStaffReportPDFHTML({
        users: safeArray(data.users),
        title: reportTitle,
        subtitle: reportSubtitle,
        lang,
        accentColor,
        includeSummary,
        includeSignatures,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    } else if (type === 'operational_manual') {
      return buildOperationalManualPDFHTML({
        title: reportTitle,
        subtitle: reportSubtitle,
        lang,
        accentColor,
        includeSignatures,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    } else if (type === 'user_manual') {
      return buildUserManualPDFHTML({
        title: reportTitle,
        subtitle: reportSubtitle,
        lang,
        accentColor,
        includeSignatures,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    } else if (type === 'procurement') {
      return buildProcurementReportPDFHTML({
        orders: safeArray(data.orders),
        vendors: safeArray(data.vendors),
        title: reportTitle,
        subtitle: reportSubtitle,
        lang,
        accentColor,
        includeSummary,
        includeSignatures,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    } else if (type === 'inventory') {
      return buildInventoryReportPDFHTML({
        inventoryItems: safeArray(data.inventoryItems),
        warehouses: safeArray(data.warehouses),
        title: reportTitle,
        subtitle: reportSubtitle,
        lang,
        accentColor,
        includeSummary,
        includeSignatures,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    } else if (type === 'sponsorship') {
      return buildSponsorshipReportPDFHTML({
        sponsorships: safeArray(data.sponsorships),
        title: reportTitle,
        subtitle: reportSubtitle,
        lang,
        accentColor,
        includeSummary,
        includeSignatures,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    } else if (type === 'revenue_investments') {
      return buildRevenueInvestmentReportPDFHTML({
        invoices: safeArray(data.invoices),
        investments: safeArray(data.investments),
        title: reportTitle,
        subtitle: reportSubtitle,
        lang,
        accentColor,
        includeSummary,
        includeSignatures,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    } else if (type === 'audit_trail') {
      return buildAuditReportPDFHTML({
        auditLogs: safeArray(data.auditLogs),
        title: reportTitle,
        subtitle: reportSubtitle,
        lang,
        accentColor,
        includeSummary,
        includeSignatures,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    } else if (type === 'interconnected') {
      return buildInterconnectedReportPDFHTML({
        projects: safeArray(data.projects),
        programs: safeArray(data.programs),
        title: reportTitle,
        subtitle: reportSubtitle,
        lang,
        accentColor,
        includeSummary,
        includeSignatures,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    } else if (type === 'payment_voucher') {
      return buildOfficialPaymentVoucherPDFHTML({
        voucherNumber: data.voucherNumber,
        payeeName: data.payeeName,
        amountYer: data.amountYer,
        dateGregorian: data.dateGregorian,
        dateHijri: data.dateHijri,
        projectName: data.projectName,
        projectCode: data.projectCode,
        costCenter: data.costCenter,
        paymentMethodAr: data.paymentMethodAr,
        referenceDocNumber: data.referenceDocNumber,
        descriptionAr: data.descriptionAr,
        preparedBy: data.preparedBy,
        lines: data.lines,
        accentColor,
        orgNameAr: activeOrg?.name_ar || orgName
      });
    } else if (type === 'receipt_voucher') {
      return buildOfficialReceiptVoucherPDFHTML({
        receiptNumber: data.voucherNumber,
        donorName: data.donorName,
        amountYer: data.amountYer,
        dateGregorian: data.dateGregorian,
        dateHijri: data.dateHijri,
        programName: data.programName,
        paymentMethodAr: data.paymentMethodAr,
        bankReference: data.bankReference,
        purposeAr: data.purposeAr,
        collectorName: data.collectorName,
        accentColor,
        orgNameAr: activeOrg?.name_ar || orgName
      });
    } else if (type === 'journal_voucher') {
      return buildOfficialJournalVoucherPDFHTML({
        voucherNumber: data.voucherNumber,
        dateGregorian: data.dateGregorian,
        voucherTypeAr: data.voucherTypeAr,
        memoAr: data.memoAr,
        preparedBy: data.preparedBy,
        lines: data.lines,
        accentColor,
        orgNameAr: activeOrg?.name_ar || orgName
      });
    } else if (type === 'goods_voucher') {
      return buildOfficialGoodsReceiptIssuePDFHTML({
        voucherNumber: data.voucherNumber,
        voucherType: data.voucherType || 'receipt',
        warehouseName: data.warehouseName,
        projectName: data.projectName,
        dateGregorian: data.dateGregorian,
        supplierOrReceiver: data.supplierOrReceiver,
        referencePO: data.referencePO,
        items: data.items,
        accentColor,
        orgNameAr: activeOrg?.name_ar || orgName
      });
    } else if (type === 'purchase_order') {
      return buildOfficialPurchaseOrderPDFHTML({
        poNumber: data.poNumber,
        vendorName: data.vendorName,
        dateGregorian: data.dateGregorian,
        tenderReference: data.tenderReference,
        projectName: data.projectName,
        deliveryPeriodDays: data.deliveryPeriodDays,
        deliveryLocation: data.deliveryLocation,
        items: data.items,
        accentColor,
        orgNameAr: activeOrg?.name_ar || orgName
      });
    } else if (type === 'beneficiary_aid_card') {
      return buildOfficialBeneficiaryAidCardPDFHTML({
        cardNumber: data.cardNumber,
        beneficiaryName: data.beneficiaryName,
        nationalIdOrSurvey: data.nationalIdOrSurvey,
        governorate: data.governorate,
        district: data.district,
        village: data.village,
        familyMembersCount: data.familyMembersCount,
        vulnerabilityCategory: data.vulnerabilityCategory,
        reliefPackageAr: data.reliefPackageAr,
        dateGregorian: data.dateGregorian,
        distributorName: data.distributorName,
        accentColor,
        orgNameAr: activeOrg?.name_ar || orgName
      });
    } else {
      return buildFinancialStatementPDFHTML({
        statementType: data.financialType || 'income',
        accounts: safeArray(data.accounts),
        title: reportTitle,
        lang,
        accentColor,
        includeSignatures,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    }
  }, [type, data, reportTitle, reportSubtitle, lang, accentColor, includeSummary, includeRiskMatrix, includeSignatures, activeOrg, orgName]);

  if (!isOpen) return null;

  const handlePrint = () => {
    printPDFHTML(generatedHTML);
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    const cleanFileName = reportTitle.replace(/[^a-zA-Z0-9آ-ي]/g, '_') || 'NexoraOS_Report';
    await generateAndDownloadPDF(generatedHTML, cleanFileName);
    setIsGenerating(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-zinc-900 text-white p-4 sm:px-6 flex justify-between items-center border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>{isRtl ? 'مصمم ومُولد تقارير PDF المعتمدة' : 'Official PDF Report & Print Generator'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                  A4 / Print Ready
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400 font-semibold mt-0.5">
                {isRtl ? 'تخصيص القوالب والترويسة الرسمية للتصدير والطباعة الخارجية' : 'Customize layout, branding header, signatures and export to PDF.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          {/* Controls Panel */}
          <div className="lg:col-span-4 p-5 bg-slate-50 border-r border-slate-200 overflow-y-auto space-y-5 text-xs">
            <div className="flex items-center gap-2 text-slate-800 font-black border-b border-slate-200 pb-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>{isRtl ? 'خيارات تخصيص التقرير' : 'Report Customization Options'}</span>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {isRtl ? 'عنوان التقرير الرئيسي:' : 'Report Title:'}
                </label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {isRtl ? 'العنوان الفرعي:' : 'Subtitle:'}
                </label>
                <input
                  type="text"
                  value={reportSubtitle}
                  onChange={(e) => setReportSubtitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>
            </div>

            {/* Accent Color Palette */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-500" />
                <span>{isRtl ? 'اللون الرئيسي للترويسة:' : 'Header Accent Color:'}</span>
              </label>
              <div className="flex gap-2">
                {[
                  { name: 'زمردي', hex: '#059669' },
                  { name: 'كحلي', hex: '#1e3a8a' },
                  { name: 'عنابي', hex: '#991b1b' },
                  { name: 'ذهبي', hex: '#d97706' },
                  { name: 'داكن', hex: '#0f172a' }
                ].map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => setAccentColor(color.hex)}
                    className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${
                      accentColor === color.hex ? 'border-slate-900 scale-110 shadow-md' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                    {accentColor === color.hex && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Sections Toggle */}
            <div className="space-y-2 border-t border-slate-200 pt-3">
              <label className="block text-[11px] font-bold text-slate-700 mb-2">
                {isRtl ? 'مكونات المستند والقطاعات:' : 'Document Sections & Components:'}
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 hover:text-slate-900">
                <input
                  type="checkbox"
                  checked={includeSummary}
                  onChange={(e) => setIncludeSummary(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span>{isRtl ? 'تضمين بطاقات المؤشرات الموحدة' : 'Include KPI Summary Cards'}</span>
              </label>

              {type === 'project' && (
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={includeRiskMatrix}
                    onChange={(e) => setIncludeRiskMatrix(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span>{isRtl ? 'تضمين مصفوفة المخاطر والتخفيض' : 'Include Risk Mitigation Matrix'}</span>
                </label>
              )}

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 hover:text-slate-900">
                <input
                  type="checkbox"
                  checked={includeSignatures}
                  onChange={(e) => setIncludeSignatures(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span>{isRtl ? 'تضمين مربع التوقيعات والختم الرسمي' : 'Include Official Signatures & Stamp'}</span>
              </label>
            </div>

            {/* Governance Badge Info */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-[11px] text-emerald-900 font-semibold space-y-1">
              <div className="flex items-center gap-1.5 font-black text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{isRtl ? 'مطابقة معايير الحوكمة والطباعة' : 'Compliant with Print & Governance'}</span>
              </div>
              <p className="text-[10px] text-emerald-700">
                {isRtl
                  ? 'المستند يحتوي على الترويسة المؤسسية الرسمية المعتمدة لجمعية رُحماء بينهم ومناسب للطباعة والتصدير المعياري.'
                  : 'Document contains certified Rohamā\'a Baynahum Charity Foundation headers and is print-ready.'}
              </p>
            </div>
          </div>

          {/* Live A4 Page Preview Panel */}
          <div className="lg:col-span-8 p-6 bg-slate-200/80 overflow-y-auto flex flex-col items-center">
            <div className="w-full max-w-[760px] bg-white shadow-2xl rounded-sm border border-slate-300 p-2 min-h-[800px] overflow-x-auto">
              {/* Dynamic HTML Output Preview */}
              <div 
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(generatedHTML) }} 
                className="w-full text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:px-6 flex flex-wrap justify-between items-center gap-3">
          <div className="text-xs text-slate-500 font-semibold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>{isRtl ? 'نظام تشغيل المؤسسات الموحد - NexoraOS™' : 'NexoraOS™ Unified Operating System'}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>{isRtl ? 'طباعة المستند / PDF المباشر' : 'Print Document / Direct PDF'}</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition-all cursor-pointer flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              {isGenerating ? (
                <span>{isRtl ? 'جاري توليد ملف PDF...' : 'Generating PDF...'}</span>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{isRtl ? 'تحميل ملف PDF' : 'Download PDF File'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
