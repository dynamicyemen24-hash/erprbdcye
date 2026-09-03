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
  buildOfficialArabicMemoPDFHTML,
  buildOfficialCompletionCertificatePDFHTML,
  buildOfficialDonationAcknowledgmentPDFHTML,
  buildOfficialVolunteerAppreciationPDFHTML,
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
  type: 'project' | 'financial' | 'executive' | 'beneficiary' | 'predictive' | 'evaluation' | 'interconnected' | 'strategy' | 'programs' | 'projects' | 'activities' | 'staff' | 'operational_manual' | 'user_manual' | 'procurement' | 'inventory' | 'sponsorship' | 'revenue_investments' | 'audit_trail' | 'payment_voucher' | 'receipt_voucher' | 'journal_voucher' | 'goods_voucher' | 'purchase_order' | 'beneficiary_aid_card' | 'official_memo' | 'completion_certificate' | 'donation_acknowledgment' | 'volunteer_appreciation';
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
    approvedBy?: string;
    memoNumber?: string;
    fromAr?: string;
    toAr?: string;
    subjectAr?: string;
    bodyAr?: string[];
    referencesAr?: string;
    attachmentsAr?: string;
    certificateNumber?: string;
    entityNameAr?: string;
    classification?: 'OFFICIAL' | 'CONFIDENTIAL' | 'PUBLIC';
    acknowledgmentNumber?: string;
    donorNameAr?: string;
    channelAr?: string;
    campaignAr?: string;
    initiativeAr?: string;
    hoursServed?: number;
    periodAr?: string;
    excellenceAr?: string;
    volunteerNameAr?: string;
    startDate?: string;
    endDate?: string;
    locationAr?: string;
    issuedBy?: string;
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
    if (type === 'official_memo') return isRtl ? 'مذكرة رسمية داخلية معتمدة' : 'Official Internal Memo';
    if (type === 'completion_certificate') return isRtl ? 'شهادة إنجاز رسمية معتمدة' : 'Official Certificate of Completion';
    if (type === 'donation_acknowledgment') return isRtl ? 'خطاب شكر وتأكيد تبرع معتمد' : 'Official Donation Acknowledgment';
    if (type === 'volunteer_appreciation') return isRtl ? 'شهادة شكر وتقدير للمتطوعين' : 'Volunteer Appreciation Certificate';
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
    if (type === 'official_memo') return isRtl ? 'مستند رسمي صادر من الإدارة المختصة وفق لوائح الحوكمة المؤسسية' : 'Official letterhead document governed by institutional policies';
    if (type === 'completion_certificate') return isRtl ? 'توثيق استلام الأعمال المنفذة وقيمتها المالية بالتفقيط' : 'Verified acceptance of executed works with tafqeet amount';
    if (type === 'donation_acknowledgment') return isRtl ? 'إقرار استلام التبرعات وتوجيهها محاسبياً وفق IPSAS' : 'Donation receipt & IPSAS-compliant fund allocation';
    if (type === 'volunteer_appreciation') return isRtl ? 'تكريم العطاء التطوعي وفق منظومة المجتمع والعضوية NEB-07' : 'Community & Membership (NEB-07) volunteer recognition';
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

  const [memoFields, setMemoFields] = useState({
    fromAr: data.fromAr || '',
    toAr: data.toAr || '',
    subjectAr: data.subjectAr || '',
    bodyAr: (data.bodyAr || []).join('\n'),
    referencesAr: data.referencesAr || '',
    attachmentsAr: data.attachmentsAr || ''
  });

  const [certFields, setCertFields] = useState({
    entityNameAr: data.entityNameAr || '',
    projectName: data.projectName || '',
    projectCode: data.projectCode || '',
    descriptionAr: data.descriptionAr || '',
    amountYer: data.amountYer || '',
    startDate: data.startDate || '',
    endDate: data.endDate || '',
    locationAr: data.locationAr || '',
    issuedBy: data.issuedBy || ''
  });

  const [donationFields, setDonationFields] = useState({
    donorNameAr: data.donorNameAr || '',
    amountYer: data.amountYer || '',
    campaignAr: data.campaignAr || '',
    channelAr: data.channelAr || '',
    purposeAr: data.purposeAr || ''
  });

  const [volunteerFields, setVolunteerFields] = useState({
    volunteerNameAr: data.volunteerNameAr || '',
    initiativeAr: data.initiativeAr || '',
    hoursServed: data.hoursServed || '',
    periodAr: data.periodAr || '',
    excellenceAr: data.excellenceAr || ''
  });

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
    } else if (type === 'official_memo') {
      return buildOfficialArabicMemoPDFHTML({
        memoNumber: data.memoNumber || data.voucherNumber,
        classification: memoFields.subjectAr ? classification : 'OFFICIAL',
        dateGregorian: data.dateGregorian,
        fromAr: memoFields.fromAr,
        toAr: memoFields.toAr,
        subjectAr: memoFields.subjectAr,
        bodyAr: memoFields.bodyAr.split('\n').filter(l => l.trim().length > 0),
        referencesAr: memoFields.referencesAr,
        attachmentsAr: memoFields.attachmentsAr,
        preparedBy: data.preparedBy,
        approvedBy: data.approvedBy,
        accentColor,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    } else if (type === 'completion_certificate') {
      return buildOfficialCompletionCertificatePDFHTML({
        certificateNumber: data.certificateNumber || data.voucherNumber,
        entityNameAr: certFields.entityNameAr,
        projectName: certFields.projectName,
        projectCode: certFields.projectCode,
        descriptionAr: certFields.descriptionAr || data.purposeAr,
        amountYer: certFields.amountYer ? Number(certFields.amountYer) : undefined,
        startDate: certFields.startDate,
        endDate: certFields.endDate,
        locationAr: certFields.locationAr || data.deliveryLocation,
        issuedBy: certFields.issuedBy || data.collectorName,
        accentColor,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    } else if (type === 'donation_acknowledgment') {
      return buildOfficialDonationAcknowledgmentPDFHTML({
        acknowledgmentNumber: data.acknowledgmentNumber || data.voucherNumber,
        donorNameAr: donationFields.donorNameAr,
        amountYer: donationFields.amountYer ? Number(donationFields.amountYer) : undefined,
        campaignAr: donationFields.campaignAr,
        channelAr: donationFields.channelAr,
        dateGregorian: data.dateGregorian,
        purposeAr: donationFields.purposeAr,
        receivedBy: data.collectorName,
        approvedBy: data.approvedBy,
        accentColor,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    } else if (type === 'volunteer_appreciation') {
      return buildOfficialVolunteerAppreciationPDFHTML({
        certificateNumber: data.certificateNumber || data.voucherNumber,
        volunteerNameAr: volunteerFields.volunteerNameAr,
        initiativeAr: volunteerFields.initiativeAr,
        hoursServed: volunteerFields.hoursServed ? Number(volunteerFields.hoursServed) : undefined,
        periodAr: volunteerFields.periodAr,
        excellenceAr: volunteerFields.excellenceAr,
        dateGregorian: data.dateGregorian,
        issuedBy: data.issuedBy || data.preparedBy,
        accentColor,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
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

            {/* Official Memo Fields Editor */}
            {type === 'official_memo' && (
              <div className="space-y-3 border-t border-slate-200 pt-3">
                <label className="block text-[11px] font-bold text-slate-700 mb-2">
                  {isRtl ? 'بيانات المذكرة الرسمية:' : 'Official Memo Details:'}
                </label>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'من (جهة الإصدار):' : 'From (Sender):'}</label>
                  <input type="text" value={memoFields.fromAr} onChange={(e) => setMemoFields(f => ({ ...f, fromAr: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 text-xs" dir="rtl" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'إلى (جهة الإحالة):' : 'To (Recipient):'}</label>
                  <input type="text" value={memoFields.toAr} onChange={(e) => setMemoFields(f => ({ ...f, toAr: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 text-xs" dir="rtl" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'الموضوع:' : 'Subject:'}</label>
                  <input type="text" value={memoFields.subjectAr} onChange={(e) => setMemoFields(f => ({ ...f, subjectAr: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 text-xs" dir="rtl" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'نص الموضوع (كل سطر فقرة):' : 'Body (one line per paragraph):'}</label>
                  <textarea rows={5} value={memoFields.bodyAr} onChange={(e) => setMemoFields(f => ({ ...f, bodyAr: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 text-xs" dir="rtl" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'المراجع/المرفقات:' : 'References & Attachments:'}</label>
                  <input type="text" value={memoFields.referencesAr} onChange={(e) => setMemoFields(f => ({ ...f, referencesAr: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 text-xs" dir="rtl" />
                </div>
              </div>
            )}

            {/* Completion Certificate Fields Editor */}
            {type === 'completion_certificate' && (
              <div className="space-y-3 border-t border-slate-200 pt-3">
                <label className="block text-[11px] font-bold text-slate-700 mb-2">
                  {isRtl ? 'بيانات شهادة الإنجاز:' : 'Certificate of Completion Details:'}
                </label>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'الجهة المقبلة (المستلم):' : 'Receiving Entity:'}</label>
                  <input type="text" value={certFields.entityNameAr} onChange={(e) => setCertFields(f => ({ ...f, entityNameAr: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 text-xs" dir="rtl" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'المشروع/المهمة:' : 'Project / Task:'}</label>
                  <input type="text" value={certFields.projectName} onChange={(e) => setCertFields(f => ({ ...f, projectName: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 text-xs" dir="rtl" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'القيمة المالية (ريال يمني):' : 'Monetary Amount (YER):'}</label>
                  <input type="number" value={certFields.amountYer} onChange={(e) => setCertFields(f => ({ ...f, amountYer: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 text-xs" dir="ltr" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'تاريخ البدء:' : 'Start Date:'}</label>
                    <input type="date" value={certFields.startDate} onChange={(e) => setCertFields(f => ({ ...f, startDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'تاريخ الانتهاء:' : 'End Date:'}</label>
                    <input type="date" value={certFields.endDate} onChange={(e) => setCertFields(f => ({ ...f, endDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 text-xs" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'المكان:' : 'Location:'}</label>
                  <input type="text" value={certFields.locationAr} onChange={(e) => setCertFields(f => ({ ...f, locationAr: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 text-xs" dir="rtl" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'مسؤول الإصدار/الاعتماد:' : 'Issued / Authorized By:'}</label>
                  <input type="text" value={certFields.issuedBy} onChange={(e) => setCertFields(f => ({ ...f, issuedBy: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 text-xs" dir="rtl" />
                </div>
              </div>
            )}

            {/* Donation Acknowledgment Fields Editor */}
            {type === 'donation_acknowledgment' && (
              <div className="space-y-3 border-t border-slate-200 pt-3">
                <label className="block text-[11px] font-bold text-slate-700 mb-2">
                  {isRtl ? 'بيانات تأكيد التبرع:' : 'Donation Acknowledgment Details:'}
                </label>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'اسم المتبرع / الجهة:' : 'Donor Name / Entity:'}</label>
                  <input type="text" value={donationFields.donorNameAr} onChange={(e) => setDonationFields(f => ({ ...f, donorNameAr: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 text-xs" dir="rtl" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'المبلغ (ريال يمني):' : 'Amount (YER):'}</label>
                  <input type="number" value={donationFields.amountYer} onChange={(e) => setDonationFields(f => ({ ...f, amountYer: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 text-xs" dir="ltr" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'الحملة / الصندوق:' : 'Campaign / Fund:'}</label>
                  <input type="text" value={donationFields.campaignAr} onChange={(e) => setDonationFields(f => ({ ...f, campaignAr: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 text-xs" dir="rtl" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'وسيلة السداد:' : 'Payment Channel:'}</label>
                  <input type="text" value={donationFields.channelAr} onChange={(e) => setDonationFields(f => ({ ...f, channelAr: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 text-xs" dir="rtl" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'الغرض / التوجيه:' : 'Purpose / Allocation:'}</label>
                  <input type="text" value={donationFields.purposeAr} onChange={(e) => setDonationFields(f => ({ ...f, purposeAr: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 text-xs" dir="rtl" />
                </div>
              </div>
            )}

            {/* Volunteer Appreciation Fields Editor */}
            {type === 'volunteer_appreciation' && (
              <div className="space-y-3 border-t border-slate-200 pt-3">
                <label className="block text-[11px] font-bold text-slate-700 mb-2">
                  {isRtl ? 'بيانات شهادة التقدير:' : 'Appreciation Details:'}
                </label>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'اسم المتطوع/ة:' : 'Volunteer Name:'}</label>
                  <input type="text" value={volunteerFields.volunteerNameAr} onChange={(e) => setVolunteerFields(f => ({ ...f, volunteerNameAr: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 text-xs" dir="rtl" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'المبادرة / النشاط:' : 'Initiative / Activity:'}</label>
                  <input type="text" value={volunteerFields.initiativeAr} onChange={(e) => setVolunteerFields(f => ({ ...f, initiativeAr: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 text-xs" dir="rtl" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'ساعات العمل:' : 'Hours Served:'}</label>
                    <input type="number" value={volunteerFields.hoursServed} onChange={(e) => setVolunteerFields(f => ({ ...f, hoursServed: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 text-xs" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'الفترة:' : 'Period:'}</label>
                    <input type="text" value={volunteerFields.periodAr} onChange={(e) => setVolunteerFields(f => ({ ...f, periodAr: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 text-xs" dir="rtl" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">{isRtl ? 'أسباب التقدير:' : 'Reason for Recognition:'}</label>
                  <textarea rows={3} value={volunteerFields.excellenceAr} onChange={(e) => setVolunteerFields(f => ({ ...f, excellenceAr: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 text-xs" dir="rtl" />
                </div>
              </div>
            )}

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
