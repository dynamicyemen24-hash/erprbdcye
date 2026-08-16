// Procurement, Vendor & Partnerships Domain Types for NexoraOS™

export interface ContractAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: 'PDF' | 'DOCX' | 'IMAGE';
  uploadDate: string;
  category: 'SIGNED_CONTRACT' | 'BANK_GUARANTEE' | 'AMENDMENT' | 'INVOICE';
  url: string;
}

export interface PaymentMilestone {
  id: string;
  titleAr: string;
  titleEn: string;
  amountYer: number;
  dueDate: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  procurementRef?: string;
}

export interface SupplierContract {
  id: string;
  contractCode: string; // e.g. CNT-2026-089
  titleAr: string;
  titleEn: string;
  vendorNameAr: string;
  vendorNameEn: string;
  vendorTaxId: string;
  contractType: 'SUPPLIER' | 'CONTRACTOR' | 'SERVICE_SLA' | 'LEASE';
  projectId: string;
  projectNameAr: string;
  projectNameEn: string;
  budgetlineCode: string; // e.g. BGT-RELIEF-2026-4.1
  totalValueYer: number;
  paidValueYer: number;
  startDate: string;
  endDate: string;
  renewalAlertDays: number;
  autoRenew: boolean;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'RENEWED' | 'COMPLETED' | 'TERMINATED';
  procurementPoRef: string; // e.g. PO-YEM-2026-112
  attachments: ContractAttachment[];
  milestones: PaymentMilestone[];
  notes?: string;
}

export interface PurchaseRequisition {
  id: string;
  reqCode: string; // e.g. PR-2026-081
  titleAr: string;
  titleEn: string;
  projectId: string;
  projectNameAr: string;
  wbsActivityId: string;
  wbsActivityNameAr: string;
  requesterName: string;
  category: 'FOOD_AID' | 'MEDICAL_EQUIPMENT' | 'CONSTRUCTION_MATERIALS' | 'RENTAL_MACHINERY' | 'LOGISTICS_SERVICE';
  estimatedCostYer: number;
  approvalStatus: 'PENDING_DEPT' | 'APPROVED_CFO' | 'PO_ISSUED' | 'REJECTED';
  urgency: 'NORMAL' | 'URGENT' | 'EMERGENCY';
  createdDate: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // e.g. PO-YEM-2026-044
  requisitionRef: string;
  vendorNameAr: string;
  projectId: string;
  projectNameAr: string;
  wbsActivityId: string;
  wbsActivityNameAr: string;
  totalAmountYer: number;
  deliveryStatus: 'ISSUED' | 'IN_TRANSIT' | 'DELIVERED_FULL' | 'INSPECTED_ACCEPTED';
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'FULLY_PAID';
  autoActivityUpdate: boolean;
  expectedDeliveryDate: string;
}

export interface SalesOrderInvoice {
  id: string;
  invoiceCode: string; // e.g. INV-SLS-2026-102
  clientOrDonorNameAr: string;
  invoiceType: 'DONOR_PLEDGE' | 'ENDOWMENT_RENT' | 'PROJECT_SERVICE_FEE' | 'PRODUCT_SALE';
  projectId: string;
  projectNameAr: string;
  wbsActivityId: string;
  wbsActivityNameAr: string;
  totalAmountYer: number;
  paidAmountYer: number;
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  invoiceDate: string;
  dueDate: string;
  shariahCompliant: boolean;
}

export interface ActivityProcurementLink {
  activityId: string;
  activityCode: string;
  activityNameAr: string;
  projectNameAr: string;
  budgetAllocatedYer: number;
  committedProcurementYer: number;
  actualSpentYer: number;
  generatedRevenueYer: number;
  procurementPOs: string[];
  salesInvoices: string[];
  varianceStatus: 'UNDER_BUDGET' | 'ON_TRACK' | 'OVER_BUDGET';
}

// ==================== PARTNERSHIP & DONOR OS TYPES (NEB-08) ====================

export type PartnershipType = 
  | 'UN_AGENCY'                 // وكالات الأمم المتحدة (UNOCHA, WFP, UNICEF, UNHCR, WHO, UNDP)
  | 'INTERNATIONAL_DONOR'       // المانحون الدوليون والإقليميون (USAID, ECHO, UKAID, GIZ, KSrelief, Qatar Charity)
  | 'CSR_CORPORATE'             // القطاع الخاص والمسؤولية المجتمعية (البنوك، الاتصالات، الشركات)
  | 'CONSORTIUM'                // تحالفات المنظمات والمكونات الميدانية (Consortiums & Joint Ventures)
  | 'LOCAL_NGO'                 // المنظمات المحلية والمجتمع المدني (Sub-granting & CSOs)
  | 'GOVERNMENT_MOU'            // الوزارات والجهات الحكومية (NAMCHA, MOPIC, الصحة, المياه)
  | 'ACADEMIC_TECHNICAL'        // الجامعات والمراكز الأكاديمية وهيئات المعايير (Sphere, CHS, IATI)
  | 'PHILANTHROPIC_ENDOWMENT';  // الأوقاف الخيرية والمؤسسات العائلية والداعمون الكبار

export type PartnershipAgreementType = 
  | 'MOU'                      // مذكرة تفاهم إستراتيجية
  | 'PCA'                      // اتفاقية تعاون مشروع (Project Cooperation Agreement)
  | 'GRANT_AGREEMENT'          // عقد اتفاقية منحة تمويلية
  | 'SUB_GRANT'                // عقد منح فرعي لمنظمة تنفيذية محلية
  | 'CONSORTIUM_CHARTER'       // ميثاق التحالف التشغيلي
  | 'SLA'                      // اتفاقية مستوى الخدمة الشريكة
  | 'TRIPARTITE';              // اتفاقية ثلاثية الأطراف (مانح + مؤسسة + وزارة)

export type PartnershipLifecycleStage = 
  | 'DUE_DILIGENCE'            // الاستكشاف والفحص النافي للجهالة KYC/AML
  | 'PCA_ASSESSMENT'           // تقييم القدرات المؤسسية PCA
  | 'CO_DESIGN'                // إعداد المقترح والتعاون الفني
  | 'AGREEMENT_DRAFTING'       // صياغة ومراجعة الاتفاقية والشروط
  | 'ACTIVE_EXECUTION'         // التنفيذ النشط وصرف الدفعات
  | 'REPORTING_AUDIT'          // رفع التقارير والتدقيق المالي IATI
  | 'COMPLETED_RENEWAL';       // مكتملة / خاضعة للتجديد

export interface PartnershipTranche {
  id: string;
  trancheNo: number;
  titleAr: string;
  titleEn: string;
  amountYer: number;
  amountUsd?: number;
  dueDate: string;
  disbursementStatus: 'DISBURSED' | 'PENDING' | 'UNDER_REVIEW' | 'ON_HOLD';
  conditionsCleared: boolean;
  disbursementRef?: string;
}

export interface PartnershipRecord {
  id: string;
  partnershipCode: string; // e.g. PRT-2026-UNOCHA-01
  titleAr: string;
  titleEn: string;
  partnerNameAr: string;
  partnerNameEn: string;
  partnerType: PartnershipType;
  agreementType: PartnershipAgreementType;
  lifecycleStage: PartnershipLifecycleStage;
  projectId?: string;
  projectNameAr?: string;
  totalGrantYer: number;
  totalGrantUsd: number;
  receivedAmountYer: number;
  matchFundingYer: number; // Co-financing requirement
  matchFundingPercent: number; // e.g. 10%
  startDate: string;
  endDate: string;
  pcaScore: number; // 0-100%
  focalPersonName: string;
  focalPersonEmail: string;
  focalPersonPhone: string;
  complianceStandards: string[];
  iatiActivityId?: string;
  tranches: PartnershipTranche[];
  notes?: string;
  documentsCount: number;
}

