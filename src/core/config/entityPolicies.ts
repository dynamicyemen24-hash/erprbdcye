/**
 * NexoraOS™ — Comprehensive Entity Policy Registry
 * Centralized definition of ALL entity types, subtypes, and their operational policies.
 * This is the single source of truth for entity-level governance.
 */

// ═══════════════════════════════════════════════════════════════
// 1. BENEFICIARY ENTITY POLICIES
// ═══════════════════════════════════════════════════════════════

export type BeneficiaryCategory =
  | 'ORPHAN'
  | 'POOR_FAMILY'
  | 'DISABLED'
  | 'WIDOW'
  | 'SICK'
  | 'IDP'
  | 'WIDOW_FAMILY'
  | 'DISABLED_POOR'
  | 'ELDERLY'
  | 'CHILD_HEADED_HOUSEHOLD'
  | 'PREGNANT_WOMAN'
  | 'CHRONIC_ILLNESS';

export type VulnerabilityStatus = 'NORMAL' | 'HIGH' | 'CRITICAL';
export type GenderCode = 'MALE' | 'FEMALE';

export interface BeneficiaryTypePolicy {
  category: BeneficiaryCategory;
  labelAr: string;
  labelEn: string;
  requiresNationalId: boolean;
  allowsDeduplication: boolean;
  maxFamilyMembers?: number;
  reassessmentDays: number;
  requiresBiometric: boolean;
  requiresGuardianConsent: boolean;
  maxAidAmountYer?: number;
  requiresVulnerabilityAssessment: boolean;
  allowedAidTypes: string[];
  disbursementMethods: string[];
  requiresFieldVisit: boolean;
  fieldVisitFrequencyDays?: number;
  requiresPhotoDocumentation: boolean;
  dataRetentionYears: number;
  canBeSponsored: boolean;
  sponsorshipTypes: string[];
  autoEscalateOnMissedVisit: boolean;
  requiresExitInterview: boolean;
  maxContinuousAidMonths?: number;
}

export const BENEFICIARY_POLICIES: Record<BeneficiaryCategory, BeneficiaryTypePolicy> = {
  ORPHAN: {
    category: 'ORPHAN',
    labelAr: 'يتيم',
    labelEn: 'Orphan',
    requiresNationalId: true,
    allowsDeduplication: true,
    maxFamilyMembers: 1,
    reassessmentDays: 90,
    requiresBiometric: true,
    requiresGuardianConsent: true,
    maxAidAmountYer: 75000,
    requiresVulnerabilityAssessment: true,
    allowedAidTypes: ['CASH', 'IN_KIND', 'EDUCATION', 'HEALTH'],
    disbursementMethods: ['BIOMETRIC', 'BANK_TRANSFER', 'CASH_VOUCHER'],
    requiresFieldVisit: true,
    fieldVisitFrequencyDays: 30,
    requiresPhotoDocumentation: true,
    dataRetentionYears: 15,
    canBeSponsored: true,
    sponsorshipTypes: ['ORPHAN', 'EDUCATION', 'HEALTH'],
    autoEscalateOnMissedVisit: true,
    requiresExitInterview: true,
    maxContinuousAidMonths: 60,
  },
  POOR_FAMILY: {
    category: 'POOR_FAMILY',
    labelAr: 'أسرة فقيرة',
    labelEn: 'Poor Family',
    requiresNationalId: true,
    allowsDeduplication: true,
    maxFamilyMembers: 20,
    reassessmentDays: 180,
    requiresBiometric: false,
    requiresGuardianConsent: false,
    maxAidAmountYer: 500000,
    requiresVulnerabilityAssessment: true,
    allowedAidTypes: ['CASH', 'IN_KIND', 'FOOD', 'SHELTER'],
    disbursementMethods: ['CASH', 'BANK_TRANSFER', 'CASH_VOUCHER', 'IN_KIND'],
    requiresFieldVisit: true,
    fieldVisitFrequencyDays: 60,
    requiresPhotoDocumentation: true,
    dataRetentionYears: 10,
    canBeSponsored: true,
    sponsorshipTypes: ['FAMILY', 'FOOD_SECURITY'],
    autoEscalateOnMissedVisit: false,
    requiresExitInterview: false,
    maxContinuousAidMonths: 24,
  },
  DISABLED: {
    category: 'DISABLED',
    labelAr: 'ذوي الاحتياجات الخاصة',
    labelEn: 'Person with Disabilities',
    requiresNationalId: true,
    allowsDeduplication: true,
    maxFamilyMembers: 1,
    reassessmentDays: 120,
    requiresBiometric: true,
    requiresGuardianConsent: true,
    maxAidAmountYer: 100000,
    requiresVulnerabilityAssessment: true,
    allowedAidTypes: ['CASH', 'IN_KIND', 'HEALTH', 'REHABILITATION'],
    disbursementMethods: ['BIOMETRIC', 'BANK_TRANSFER', 'CASH_VOUCHER'],
    requiresFieldVisit: true,
    fieldVisitFrequencyDays: 45,
    requiresPhotoDocumentation: true,
    dataRetentionYears: 15,
    canBeSponsored: true,
    sponsorshipTypes: ['DISABILITY', 'HEALTH', 'EDUCATION'],
    autoEscalateOnMissedVisit: true,
    requiresExitInterview: true,
    maxContinuousAidMonths: 36,
  },
  WIDOW: {
    category: 'WIDOW',
    labelAr: 'أرملة',
    labelEn: 'Widow',
    requiresNationalId: true,
    allowsDeduplication: true,
    maxFamilyMembers: 10,
    reassessmentDays: 180,
    requiresBiometric: false,
    requiresGuardianConsent: false,
    maxAidAmountYer: 150000,
    requiresVulnerabilityAssessment: true,
    allowedAidTypes: ['CASH', 'IN_KIND', 'EDUCATION', 'ECONOMIC'],
    disbursementMethods: ['CASH', 'BANK_TRANSFER', 'CASH_VOUCHER'],
    requiresFieldVisit: true,
    fieldVisitFrequencyDays: 60,
    requiresPhotoDocumentation: true,
    dataRetentionYears: 10,
    canBeSponsored: true,
    sponsorshipTypes: ['FAMILY', 'EDUCATION'],
    autoEscalateOnMissedVisit: false,
    requiresExitInterview: false,
    maxContinuousAidMonths: 36,
  },
  SICK: {
    category: 'SICK',
    labelAr: 'مريض مزمن',
    labelEn: 'Chronically Ill',
    requiresNationalId: true,
    allowsDeduplication: true,
    maxFamilyMembers: 1,
    reassessmentDays: 60,
    requiresBiometric: true,
    requiresGuardianConsent: false,
    maxAidAmountYer: 200000,
    requiresVulnerabilityAssessment: true,
    allowedAidTypes: ['CASH', 'HEALTH', 'MEDICAL', 'NUTRITION'],
    disbursementMethods: ['BIOMETRIC', 'BANK_TRANSFER', 'CASH_VOUCHER'],
    requiresFieldVisit: true,
    fieldVisitFrequencyDays: 30,
    requiresPhotoDocumentation: false,
    dataRetentionYears: 20,
    canBeSponsored: true,
    sponsorshipTypes: ['HEALTH', 'MEDICAL'],
    autoEscalateOnMissedVisit: true,
    requiresExitInterview: true,
    maxContinuousAidMonths: 48,
  },
  IDP: {
    category: 'IDP',
    labelAr: 'نازح داخلي',
    labelEn: 'Internally Displaced Person',
    requiresNationalId: false,
    allowsDeduplication: true,
    maxFamilyMembers: 20,
    reassessmentDays: 90,
    requiresBiometric: false,
    requiresGuardianConsent: false,
    maxAidAmountYer: 300000,
    requiresVulnerabilityAssessment: true,
    allowedAidTypes: ['CASH', 'IN_KIND', 'FOOD', 'SHELTER', 'NFI', 'WASH'],
    disbursementMethods: ['CASH', 'CASH_VOUCHER', 'IN_KIND', 'DISTRIBUTION'],
    requiresFieldVisit: true,
    fieldVisitFrequencyDays: 30,
    requiresPhotoDocumentation: true,
    dataRetentionYears: 7,
    canBeSponsored: false,
    sponsorshipTypes: [],
    autoEscalateOnMissedVisit: true,
    requiresExitInterview: false,
    maxContinuousAidMonths: 12,
  },
  WIDOW_FAMILY: {
    category: 'WIDOW_FAMILY',
    labelAr: 'أسرة أرملة',
    labelEn: 'Widow Family',
    requiresNationalId: true,
    allowsDeduplication: true,
    maxFamilyMembers: 10,
    reassessmentDays: 180,
    requiresBiometric: false,
    requiresGuardianConsent: false,
    maxAidAmountYer: 200000,
    requiresVulnerabilityAssessment: true,
    allowedAidTypes: ['CASH', 'IN_KIND', 'EDUCATION', 'FOOD'],
    disbursementMethods: ['CASH', 'BANK_TRANSFER', 'CASH_VOUCHER'],
    requiresFieldVisit: true,
    fieldVisitFrequencyDays: 60,
    requiresPhotoDocumentation: true,
    dataRetentionYears: 10,
    canBeSponsored: true,
    sponsorshipTypes: ['FAMILY', 'EDUCATION'],
    autoEscalateOnMissedVisit: false,
    requiresExitInterview: false,
    maxContinuousAidMonths: 36,
  },
  DISABLED_POOR: {
    category: 'DISABLED_POOR',
    labelAr: 'فقير ذوي الاحتياجات',
    labelEn: 'Disabled & Impoverished',
    requiresNationalId: true,
    allowsDeduplication: true,
    maxFamilyMembers: 5,
    reassessmentDays: 90,
    requiresBiometric: true,
    requiresGuardianConsent: true,
    maxAidAmountYer: 120000,
    requiresVulnerabilityAssessment: true,
    allowedAidTypes: ['CASH', 'IN_KIND', 'HEALTH', 'REHABILITATION', 'EDUCATION'],
    disbursementMethods: ['BIOMETRIC', 'BANK_TRANSFER', 'CASH_VOUCHER'],
    requiresFieldVisit: true,
    fieldVisitFrequencyDays: 30,
    requiresPhotoDocumentation: true,
    dataRetentionYears: 15,
    canBeSponsored: true,
    sponsorshipTypes: ['DISABILITY', 'HEALTH', 'EDUCATION'],
    autoEscalateOnMissedVisit: true,
    requiresExitInterview: true,
    maxContinuousAidMonths: 48,
  },
  ELDERLY: {
    category: 'ELDERLY',
    labelAr: 'مسن',
    labelEn: 'Elderly',
    requiresNationalId: true,
    allowsDeduplication: true,
    maxFamilyMembers: 3,
    reassessmentDays: 120,
    requiresBiometric: false,
    requiresGuardianConsent: false,
    maxAidAmountYer: 80000,
    requiresVulnerabilityAssessment: true,
    allowedAidTypes: ['CASH', 'IN_KIND', 'HEALTH', 'NUTRITION'],
    disbursementMethods: ['CASH', 'BANK_TRANSFER', 'CASH_VOUCHER'],
    requiresFieldVisit: true,
    fieldVisitFrequencyDays: 45,
    requiresPhotoDocumentation: false,
    dataRetentionYears: 10,
    canBeSponsored: true,
    sponsorshipTypes: ['ELDERLY_CARE', 'HEALTH'],
    autoEscalateOnMissedVisit: true,
    requiresExitInterview: false,
    maxContinuousAidMonths: 60,
  },
  CHILD_HEADED_HOUSEHOLD: {
    category: 'CHILD_HEADED_HOUSEHOLD',
    labelAr: ' أسرة يرأسها طفل',
    labelEn: 'Child-Headed Household',
    requiresNationalId: true,
    allowsDeduplication: true,
    maxFamilyMembers: 8,
    reassessmentDays: 60,
    requiresBiometric: true,
    requiresGuardianConsent: true,
    maxAidAmountYer: 150000,
    requiresVulnerabilityAssessment: true,
    allowedAidTypes: ['CASH', 'IN_KIND', 'FOOD', 'EDUCATION', 'SHELTER'],
    disbursementMethods: ['BIOMETRIC', 'BANK_TRANSFER', 'CASH_VOUCHER'],
    requiresFieldVisit: true,
    fieldVisitFrequencyDays: 14,
    requiresPhotoDocumentation: true,
    dataRetentionYears: 15,
    canBeSponsored: true,
    sponsorshipTypes: ['ORPHAN', 'EDUCATION', 'FAMILY'],
    autoEscalateOnMissedVisit: true,
    requiresExitInterview: true,
    maxContinuousAidMonths: 60,
  },
  PREGNANT_WOMAN: {
    category: 'PREGNANT_WOMAN',
    labelAr: 'حامل',
    labelEn: 'Pregnant Woman',
    requiresNationalId: true,
    allowsDeduplication: true,
    maxFamilyMembers: 1,
    reassessmentDays: 30,
    requiresBiometric: false,
    requiresGuardianConsent: false,
    maxAidAmountYer: 100000,
    requiresVulnerabilityAssessment: true,
    allowedAidTypes: ['HEALTH', 'NUTRITION', 'CASH'],
    disbursementMethods: ['CASH', 'BANK_TRANSFER', 'CASH_VOUCHER'],
    requiresFieldVisit: true,
    fieldVisitFrequencyDays: 14,
    requiresPhotoDocumentation: false,
    dataRetentionYears: 10,
    canBeSponsored: false,
    sponsorshipTypes: [],
    autoEscalateOnMissedVisit: true,
    requiresExitInterview: false,
    maxContinuousAidMonths: 9,
  },
  CHRONIC_ILLNESS: {
    category: 'CHRONIC_ILLNESS',
    labelAr: 'مرض مزمن',
    labelEn: 'Chronic Illness',
    requiresNationalId: true,
    allowsDeduplication: true,
    maxFamilyMembers: 1,
    reassessmentDays: 60,
    requiresBiometric: true,
    requiresGuardianConsent: false,
    maxAidAmountYer: 200000,
    requiresVulnerabilityAssessment: true,
    allowedAidTypes: ['HEALTH', 'MEDICAL', 'NUTRITION', 'CASH'],
    disbursementMethods: ['BIOMETRIC', 'BANK_TRANSFER', 'CASH_VOUCHER'],
    requiresFieldVisit: true,
    fieldVisitFrequencyDays: 30,
    requiresPhotoDocumentation: false,
    dataRetentionYears: 20,
    canBeSponsored: true,
    sponsorshipTypes: ['HEALTH', 'MEDICAL'],
    autoEscalateOnMissedVisit: true,
    requiresExitInterview: true,
    maxContinuousAidMonths: 60,
  },
};

// ═══════════════════════════════════════════════════════════════
// 2. ACTIVITY SECTOR POLICIES
// ═══════════════════════════════════════════════════════════════

export type ActivitySector =
  | 'EDUCATION_QURAN'
  | 'RELIEF_HUMANITARIAN'
  | 'HEALTH_MEDICAL'
  | 'WASH_INFRASTRUCTURE'
  | 'ORPHAN_CARE'
  | 'ECONOMIC_EMPOWERMENT';

export type ActivitySubType =
  | 'QURAN_MEMORIZATION'
  | 'LITERACY_EDUCATION'
  | 'VOCATIONAL_TRAINING'
  | 'STUDENT_SCHOLARSHIP'
  | 'RELIEF_FOOD_BASKET'
  | 'RELIEF_EVOUCHER'
  | 'EMERGENCY_SHELTER'
  | 'HEALTH_MOBILE_CLINIC'
  | 'HEALTH_NUTRITION'
  | 'SURGICAL_CAMPAIGN'
  | 'WASH_WELL_DRILLING'
  | 'WASH_INFRASTRUCTURE'
  | 'ORPHAN_STIPEND_DELIVERY'
  | 'PSYCHOSOCIAL_SUPPORT'
  | 'MICRO_PROJECT_TRANSFER';

export interface ActivityTypePolicy {
  sector: ActivitySector;
  subTypes: { code: ActivitySubType; labelAr: string; labelEn: string }[];
  requiresGPS: boolean;
  requiresPhotoProof: boolean;
  requiresBeneficiarySignature: boolean;
  signatureType: 'MANUAL' | 'DIGITAL' | 'BIOMETRIC';
  requiresDailyLog: boolean;
  requiresExpenseReport: boolean;
  maxBudgetPerActivityYer?: number;
  requiresDonorApproval: boolean;
  allowedDisbursementMethods: string[];
  requiresThreeWayMatch: boolean;
  requiresFieldSupervisor: boolean;
  gpsGeofenceRadiusMeters: number;
  requiresAttendanceSheet: boolean;
  maxBeneficiariesPerActivity?: number;
  requiresPostDistributionMonitoring: boolean;
  pdmDaysAfterDistribution: number;
  requiresEndlineSurvey: boolean;
  dataRetentionYears: number;
}

export const ACTIVITY_SECTOR_POLICIES: Record<ActivitySector, ActivityTypePolicy> = {
  EDUCATION_QURAN: {
    sector: 'EDUCATION_QURAN',
    subTypes: [
      { code: 'QURAN_MEMORIZATION', labelAr: 'حلقة تحفيظ القرآن الكريم', labelEn: 'Quran Memorization Circle' },
      { code: 'LITERACY_EDUCATION', labelAr: 'صف محو الأمية', labelEn: 'Literacy Education' },
      { code: 'VOCATIONAL_TRAINING', labelAr: 'دورة تأهيل مهني', labelEn: 'Vocational Training' },
      { code: 'STUDENT_SCHOLARSHIP', labelAr: 'مشروع الحقيبة الطلابية', labelEn: 'Student Scholarship' },
    ],
    requiresGPS: true,
    requiresPhotoProof: true,
    requiresBeneficiarySignature: true,
    signatureType: 'DIGITAL',
    requiresDailyLog: true,
    requiresExpenseReport: true,
    maxBudgetPerActivityYer: 5000000,
    requiresDonorApproval: false,
    allowedDisbursementMethods: ['IN_KIND', 'CASH_VOUCHER'],
    requiresThreeWayMatch: false,
    requiresFieldSupervisor: true,
    gpsGeofenceRadiusMeters: 500,
    requiresAttendanceSheet: true,
    maxBeneficiariesPerActivity: 200,
    requiresPostDistributionMonitoring: true,
    pdmDaysAfterDistribution: 30,
    requiresEndlineSurvey: true,
    dataRetentionYears: 5,
  },
  RELIEF_HUMANITARIAN: {
    sector: 'RELIEF_HUMANITARIAN',
    subTypes: [
      { code: 'RELIEF_FOOD_BASKET', labelAr: 'توزيع السلل الإغاثية', labelEn: 'Food Basket Distribution' },
      { code: 'RELIEF_EVOUCHER', labelAr: 'قسائم رقمية E-Vouchers', labelEn: 'E-Voucher Distribution' },
      { code: 'EMERGENCY_SHELTER', labelAr: 'إغاثة الإيواء العاجل', labelEn: 'Emergency Shelter' },
    ],
    requiresGPS: true,
    requiresPhotoProof: true,
    requiresBeneficiarySignature: true,
    signatureType: 'BIOMETRIC',
    requiresDailyLog: true,
    requiresExpenseReport: true,
    maxBudgetPerActivityYer: 20000000,
    requiresDonorApproval: true,
    allowedDisbursementMethods: ['CASH', 'IN_KIND', 'CASH_VOUCHER', 'DISTRIBUTION', 'E_VOUCHER'],
    requiresThreeWayMatch: true,
    requiresFieldSupervisor: true,
    gpsGeofenceRadiusMeters: 1000,
    requiresAttendanceSheet: true,
    maxBeneficiariesPerActivity: 1000,
    requiresPostDistributionMonitoring: true,
    pdmDaysAfterDistribution: 14,
    requiresEndlineSurvey: false,
    dataRetentionYears: 7,
  },
  HEALTH_MEDICAL: {
    sector: 'HEALTH_MEDICAL',
    subTypes: [
      { code: 'HEALTH_MOBILE_CLINIC', labelAr: 'قافلة طبية ميدانية', labelEn: 'Mobile Health Clinic' },
      { code: 'HEALTH_NUTRITION', labelAr: 'برنامج التغذية', labelEn: 'Nutrition Program' },
      { code: 'SURGICAL_CAMPAIGN', labelAr: 'حملة عمليات جراحية', labelEn: 'Surgical Campaign' },
    ],
    requiresGPS: true,
    requiresPhotoProof: false,
    requiresBeneficiarySignature: true,
    signatureType: 'DIGITAL',
    requiresDailyLog: true,
    requiresExpenseReport: true,
    maxBudgetPerActivityYer: 15000000,
    requiresDonorApproval: true,
    allowedDisbursementMethods: ['IN_KIND', 'CASH', 'BANK_TRANSFER'],
    requiresThreeWayMatch: true,
    requiresFieldSupervisor: true,
    gpsGeofenceRadiusMeters: 500,
    requiresAttendanceSheet: true,
    maxBeneficiariesPerActivity: 500,
    requiresPostDistributionMonitoring: true,
    pdmDaysAfterDistribution: 7,
    requiresEndlineSurvey: true,
    dataRetentionYears: 20,
  },
  WASH_INFRASTRUCTURE: {
    sector: 'WASH_INFRASTRUCTURE',
    subTypes: [
      { code: 'WASH_WELL_DRILLING', labelAr: 'حفر بئر ومنظومة شمسية', labelEn: 'Well Drilling & Solar' },
      { code: 'WASH_INFRASTRUCTURE', labelAr: 'ترميم مدرسة/مسكن/شبكة مياه', labelEn: 'Infrastructure Rehabilitation' },
    ],
    requiresGPS: true,
    requiresPhotoProof: true,
    requiresBeneficiarySignature: false,
    signatureType: 'MANUAL',
    requiresDailyLog: true,
    requiresExpenseReport: true,
    maxBudgetPerActivityYer: 50000000,
    requiresDonorApproval: true,
    allowedDisbursementMethods: ['BANK_TRANSFER', 'CASH'],
    requiresThreeWayMatch: true,
    requiresFieldSupervisor: true,
    gpsGeofenceRadiusMeters: 200,
    requiresAttendanceSheet: false,
    maxBeneficiariesPerActivity: 5000,
    requiresPostDistributionMonitoring: true,
    pdmDaysAfterDistribution: 90,
    requiresEndlineSurvey: true,
    dataRetentionYears: 10,
  },
  ORPHAN_CARE: {
    sector: 'ORPHAN_CARE',
    subTypes: [
      { code: 'ORPHAN_STIPEND_DELIVERY', labelAr: 'تسليم كفالات الأيتام', labelEn: 'Orphan Stipend Delivery' },
      { code: 'PSYCHOSOCIAL_SUPPORT', labelAr: 'الدعم النفسي والأنشطة', labelEn: 'Psychosocial Support' },
    ],
    requiresGPS: true,
    requiresPhotoProof: true,
    requiresBeneficiarySignature: true,
    signatureType: 'BIOMETRIC',
    requiresDailyLog: true,
    requiresExpenseReport: true,
    maxBudgetPerActivityYer: 10000000,
    requiresDonorApproval: false,
    allowedDisbursementMethods: ['BIOMETRIC', 'BANK_TRANSFER', 'CASH_VOUCHER'],
    requiresThreeWayMatch: false,
    requiresFieldSupervisor: true,
    gpsGeofenceRadiusMeters: 500,
    requiresAttendanceSheet: true,
    maxBeneficiariesPerActivity: 100,
    requiresPostDistributionMonitoring: true,
    pdmDaysAfterDistribution: 7,
    requiresEndlineSurvey: false,
    dataRetentionYears: 15,
  },
  ECONOMIC_EMPOWERMENT: {
    sector: 'ECONOMIC_EMPOWERMENT',
    subTypes: [
      { code: 'MICRO_PROJECT_TRANSFER', labelAr: 'تمليك مشروع صغير', labelEn: 'Micro-Project Transfer' },
    ],
    requiresGPS: true,
    requiresPhotoProof: true,
    requiresBeneficiarySignature: true,
    signatureType: 'DIGITAL',
    requiresDailyLog: false,
    requiresExpenseReport: true,
    maxBudgetPerActivityYer: 30000000,
    requiresDonorApproval: true,
    allowedDisbursementMethods: ['BANK_TRANSFER', 'CASH'],
    requiresThreeWayMatch: true,
    requiresFieldSupervisor: true,
    gpsGeofenceRadiusMeters: 200,
    requiresAttendanceSheet: false,
    maxBeneficiariesPerActivity: 50,
    requiresPostDistributionMonitoring: true,
    pdmDaysAfterDistribution: 60,
    requiresEndlineSurvey: true,
    dataRetentionYears: 10,
  },
};

// ═══════════════════════════════════════════════════════════════
// 3. SPONSORSHIP TYPE POLICIES
// ═══════════════════════════════════════════════════════════════

export type SponsorshipType =
  | 'ORPHAN'
  | 'FAMILY'
  | 'EDUCATION'
  | 'HEALTH'
  | 'DISABILITY'
  | 'ELDERLY_CARE'
  | 'FOOD_SECURITY'
  | 'MEDICAL'
  | 'WATER_WELL';

export interface SponsorshipTypePolicy {
  type: SponsorshipType;
  labelAr: string;
  labelEn: string;
  minMonthlyAmountYer: number;
  maxMonthlyAmountYer: number;
  currencyCode: string;
  paymentFrequency: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
  requiresGuardian: boolean;
  requiresSchoolEnrollment: boolean;
  requiresHealthCheckup: boolean;
  requiresPeriodicReport: boolean;
  reportFrequencyDays: number;
  allowsPaymentMethods: string[];
  requiresDonorReceipt: boolean;
  autoGenerateReceipt: boolean;
  maxSponsorshipDurationMonths?: number;
  requiresExitReview: boolean;
  allowsRenewal: boolean;
  maxRenewals?: number;
  requiresFieldVerification: boolean;
  quarterlyBreakdownRequired: boolean;
}

export const SPONSORSHIP_POLICIES: Record<SponsorshipType, SponsorshipTypePolicy> = {
  ORPHAN: {
    type: 'ORPHAN',
    labelAr: 'كفاية يتيم',
    labelEn: 'Orphan Sponsorship',
    minMonthlyAmountYer: 25000,
    maxMonthlyAmountYer: 150000,
    currencyCode: 'YER',
    paymentFrequency: 'MONTHLY',
    requiresGuardian: true,
    requiresSchoolEnrollment: true,
    requiresHealthCheckup: true,
    requiresPeriodicReport: true,
    reportFrequencyDays: 90,
    allowsPaymentMethods: ['BANK_TRANSFER', 'CASH_VOUCHER', 'BIOMETRIC'],
    requiresDonorReceipt: true,
    autoGenerateReceipt: true,
    maxSponsorshipDurationMonths: 60,
    requiresExitReview: true,
    allowsRenewal: true,
    maxRenewals: 3,
    requiresFieldVerification: true,
    quarterlyBreakdownRequired: true,
  },
  FAMILY: {
    type: 'FAMILY',
    labelAr: 'كفاية أسرية',
    labelEn: 'Family Sponsorship',
    minMonthlyAmountYer: 50000,
    maxMonthlyAmountYer: 300000,
    currencyCode: 'YER',
    paymentFrequency: 'MONTHLY',
    requiresGuardian: false,
    requiresSchoolEnrollment: false,
    requiresHealthCheckup: false,
    requiresPeriodicReport: true,
    reportFrequencyDays: 90,
    allowsPaymentMethods: ['BANK_TRANSFER', 'CASH_VOUCHER', 'CASH'],
    requiresDonorReceipt: true,
    autoGenerateReceipt: true,
    maxSponsorshipDurationMonths: 24,
    requiresExitReview: true,
    allowsRenewal: true,
    maxRenewals: 2,
    requiresFieldVerification: true,
    quarterlyBreakdownRequired: true,
  },
  EDUCATION: {
    type: 'EDUCATION',
    labelAr: 'كفاية تعليمية',
    labelEn: 'Education Sponsorship',
    minMonthlyAmountYer: 15000,
    maxMonthlyAmountYer: 100000,
    currencyCode: 'YER',
    paymentFrequency: 'QUARTERLY',
    requiresGuardian: true,
    requiresSchoolEnrollment: true,
    requiresHealthCheckup: false,
    requiresPeriodicReport: true,
    reportFrequencyDays: 90,
    allowsPaymentMethods: ['BANK_TRANSFER', 'CASH_VOUCHER'],
    requiresDonorReceipt: true,
    autoGenerateReceipt: true,
    maxSponsorshipDurationMonths: 120,
    requiresExitReview: false,
    allowsRenewal: true,
    maxRenewals: 10,
    requiresFieldVerification: true,
    quarterlyBreakdownRequired: true,
  },
  HEALTH: {
    type: 'HEALTH',
    labelAr: 'كفاية صحية',
    labelEn: 'Health Sponsorship',
    minMonthlyAmountYer: 30000,
    maxMonthlyAmountYer: 500000,
    currencyCode: 'YER',
    paymentFrequency: 'MONTHLY',
    requiresGuardian: false,
    requiresSchoolEnrollment: false,
    requiresHealthCheckup: true,
    requiresPeriodicReport: true,
    reportFrequencyDays: 30,
    allowsPaymentMethods: ['BANK_TRANSFER', 'CASH_VOUCHER'],
    requiresDonorReceipt: true,
    autoGenerateReceipt: true,
    maxSponsorshipDurationMonths: 36,
    requiresExitReview: true,
    allowsRenewal: true,
    maxRenewals: 3,
    requiresFieldVerification: true,
    quarterlyBreakdownRequired: false,
  },
  DISABILITY: {
    type: 'DISABILITY',
    labelAr: 'كفاية ذوي الإعاقة',
    labelEn: 'Disability Sponsorship',
    minMonthlyAmountYer: 30000,
    maxMonthlyAmountYer: 200000,
    currencyCode: 'YER',
    paymentFrequency: 'MONTHLY',
    requiresGuardian: true,
    requiresSchoolEnrollment: false,
    requiresHealthCheckup: true,
    requiresPeriodicReport: true,
    reportFrequencyDays: 60,
    allowsPaymentMethods: ['BANK_TRANSFER', 'CASH_VOUCHER', 'BIOMETRIC'],
    requiresDonorReceipt: true,
    autoGenerateReceipt: true,
    maxSponsorshipDurationMonths: 60,
    requiresExitReview: true,
    allowsRenewal: true,
    maxRenewals: 5,
    requiresFieldVerification: true,
    quarterlyBreakdownRequired: true,
  },
  ELDERLY_CARE: {
    type: 'ELDERLY_CARE',
    labelAr: 'رعاية مسن',
    labelEn: 'Elderly Care',
    minMonthlyAmountYer: 20000,
    maxMonthlyAmountYer: 100000,
    currencyCode: 'YER',
    paymentFrequency: 'MONTHLY',
    requiresGuardian: false,
    requiresSchoolEnrollment: false,
    requiresHealthCheckup: true,
    requiresPeriodicReport: true,
    reportFrequencyDays: 60,
    allowsPaymentMethods: ['BANK_TRANSFER', 'CASH_VOUCHER'],
    requiresDonorReceipt: true,
    autoGenerateReceipt: true,
    maxSponsorshipDurationMonths: 60,
    requiresExitReview: true,
    allowsRenewal: true,
    maxRenewals: 5,
    requiresFieldVerification: true,
    quarterlyBreakdownRequired: false,
  },
  FOOD_SECURITY: {
    type: 'FOOD_SECURITY',
    labelAr: 'أمن غذائي',
    labelEn: 'Food Security',
    minMonthlyAmountYer: 40000,
    maxMonthlyAmountYer: 200000,
    currencyCode: 'YER',
    paymentFrequency: 'MONTHLY',
    requiresGuardian: false,
    requiresSchoolEnrollment: false,
    requiresHealthCheckup: false,
    requiresPeriodicReport: true,
    reportFrequencyDays: 30,
    allowsPaymentMethods: ['CASH', 'CASH_VOUCHER', 'IN_KIND', 'DISTRIBUTION'],
    requiresDonorReceipt: true,
    autoGenerateReceipt: true,
    maxSponsorshipDurationMonths: 12,
    requiresExitReview: false,
    allowsRenewal: true,
    maxRenewals: 6,
    requiresFieldVerification: true,
    quarterlyBreakdownRequired: false,
  },
  MEDICAL: {
    type: 'MEDICAL',
    labelAr: 'رعاية طبية',
    labelEn: 'Medical Care',
    minMonthlyAmountYer: 50000,
    maxMonthlyAmountYer: 1000000,
    currencyCode: 'YER',
    paymentFrequency: 'MONTHLY',
    requiresGuardian: false,
    requiresSchoolEnrollment: false,
    requiresHealthCheckup: true,
    requiresPeriodicReport: true,
    reportFrequencyDays: 15,
    allowsPaymentMethods: ['BANK_TRANSFER', 'CASH_VOUCHER'],
    requiresDonorReceipt: true,
    autoGenerateReceipt: true,
    maxSponsorshipDurationMonths: 24,
    requiresExitReview: true,
    allowsRenewal: true,
    maxRenewals: 2,
    requiresFieldVerification: true,
    quarterlyBreakdownRequired: false,
  },
  WATER_WELL: {
    type: 'WATER_WELL',
    labelAr: 'كفاية بئر ماء',
    labelEn: 'Water Well Sponsorship',
    minMonthlyAmountYer: 100000,
    maxMonthlyAmountYer: 500000,
    currencyCode: 'YER',
    paymentFrequency: 'QUARTERLY',
    requiresGuardian: false,
    requiresSchoolEnrollment: false,
    requiresHealthCheckup: false,
    requiresPeriodicReport: true,
    reportFrequencyDays: 90,
    allowsPaymentMethods: ['BANK_TRANSFER'],
    requiresDonorReceipt: true,
    autoGenerateReceipt: true,
    maxSponsorshipDurationMonths: 36,
    requiresExitReview: true,
    allowsRenewal: true,
    maxRenewals: 2,
    requiresFieldVerification: true,
    quarterlyBreakdownRequired: true,
  },
};

// ═══════════════════════════════════════════════════════════════
// 4. DISBURSEMENT METHOD POLICIES
// ═══════════════════════════════════════════════════════════════

export type DisbursementMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'CASH_VOUCHER'
  | 'E_VOUCHER'
  | 'IN_KIND'
  | 'DISTRIBUTION'
  | 'BIOMETRIC'
  | 'CHECK'
  | 'CARD';

export interface DisbursementMethodPolicy {
  method: DisbursementMethod;
  labelAr: string;
  labelEn: string;
  requiresApproval: boolean;
  approvalLevel: number;
  requiresReceipt: boolean;
  requiresWitness: boolean;
  witnessCount: number;
  requiresPhoto: boolean;
  requiresGPS: boolean;
  maxAmountPerTransactionYer: number;
  requiresReconciliation: boolean;
  reconciliationDays: number;
  requiresAuditTrail: boolean;
  requiresBeneficiaryConfirmation: boolean;
  confirmationMethod: 'SIGNATURE' | 'BIOMETRIC' | 'PIN' | 'OTP';
  requiresDonorReport: boolean;
  bankAccountRequired: boolean;
  merchantIdRequired: boolean;
  eVoucherProviderRequired: boolean;
  requiresThreeWayMatch: boolean;
  maxDailyDisbursementYer: number;
  requiresSegregationOfDuties: boolean;
}

export const DISBURSEMENT_POLICIES: Record<DisbursementMethod, DisbursementMethodPolicy> = {
  CASH: {
    method: 'CASH',
    labelAr: 'نقدي',
    labelEn: 'Cash',
    requiresApproval: true,
    approvalLevel: 3,
    requiresReceipt: true,
    requiresWitness: true,
    witnessCount: 2,
    requiresPhoto: true,
    requiresGPS: true,
    maxAmountPerTransactionYer: 5000000,
    requiresReconciliation: true,
    reconciliationDays: 1,
    requiresAuditTrail: true,
    requiresBeneficiaryConfirmation: true,
    confirmationMethod: 'SIGNATURE',
    requiresDonorReport: true,
    bankAccountRequired: false,
    merchantIdRequired: false,
    eVoucherProviderRequired: false,
    requiresThreeWayMatch: false,
    maxDailyDisbursementYer: 20000000,
    requiresSegregationOfDuties: true,
  },
  BANK_TRANSFER: {
    method: 'BANK_TRANSFER',
    labelAr: 'تحويل بنكي',
    labelEn: 'Bank Transfer',
    requiresApproval: true,
    approvalLevel: 4,
    requiresReceipt: true,
    requiresWitness: false,
    witnessCount: 0,
    requiresPhoto: false,
    requiresGPS: false,
    maxAmountPerTransactionYer: 100000000,
    requiresReconciliation: true,
    reconciliationDays: 3,
    requiresAuditTrail: true,
    requiresBeneficiaryConfirmation: false,
    confirmationMethod: 'OTP',
    requiresDonorReport: true,
    bankAccountRequired: true,
    merchantIdRequired: false,
    eVoucherProviderRequired: false,
    requiresThreeWayMatch: true,
    maxDailyDisbursementYer: 500000000,
    requiresSegregationOfDuties: true,
  },
  CASH_VOUCHER: {
    method: 'CASH_VOUCHER',
    labelAr: 'قسائم نقدية',
    labelEn: 'Cash Voucher',
    requiresApproval: true,
    approvalLevel: 3,
    requiresReceipt: true,
    requiresWitness: true,
    witnessCount: 1,
    requiresPhoto: true,
    requiresGPS: true,
    maxAmountPerTransactionYer: 2000000,
    requiresReconciliation: true,
    reconciliationDays: 7,
    requiresAuditTrail: true,
    requiresBeneficiaryConfirmation: true,
    confirmationMethod: 'SIGNATURE',
    requiresDonorReport: true,
    bankAccountRequired: false,
    merchantIdRequired: true,
    eVoucherProviderRequired: false,
    requiresThreeWayMatch: false,
    maxDailyDisbursementYer: 10000000,
    requiresSegregationOfDuties: true,
  },
  E_VOUCHER: {
    method: 'E_VOUCHER',
    labelAr: 'قسائم إلكترونية',
    labelEn: 'E-Voucher',
    requiresApproval: true,
    approvalLevel: 3,
    requiresReceipt: true,
    requiresWitness: false,
    witnessCount: 0,
    requiresPhoto: false,
    requiresGPS: true,
    maxAmountPerTransactionYer: 1000000,
    requiresReconciliation: true,
    reconciliationDays: 14,
    requiresAuditTrail: true,
    requiresBeneficiaryConfirmation: true,
    confirmationMethod: 'OTP',
    requiresDonorReport: true,
    bankAccountRequired: false,
    merchantIdRequired: false,
    eVoucherProviderRequired: true,
    requiresThreeWayMatch: false,
    maxDailyDisbursementYer: 5000000,
    requiresSegregationOfDuties: false,
  },
  IN_KIND: {
    method: 'IN_KIND',
    labelAr: 'عيني',
    labelEn: 'In-Kind',
    requiresApproval: true,
    approvalLevel: 3,
    requiresReceipt: true,
    requiresWitness: true,
    witnessCount: 2,
    requiresPhoto: true,
    requiresGPS: true,
    maxAmountPerTransactionYer: 10000000,
    requiresReconciliation: true,
    reconciliationDays: 3,
    requiresAuditTrail: true,
    requiresBeneficiaryConfirmation: true,
    confirmationMethod: 'SIGNATURE',
    requiresDonorReport: true,
    bankAccountRequired: false,
    merchantIdRequired: false,
    eVoucherProviderRequired: false,
    requiresThreeWayMatch: true,
    maxDailyDisbursementYer: 30000000,
    requiresSegregationOfDuties: true,
  },
  DISTRIBUTION: {
    method: 'DISTRIBUTION',
    labelAr: 'توزيع ميداني',
    labelEn: 'Field Distribution',
    requiresApproval: true,
    approvalLevel: 3,
    requiresReceipt: true,
    requiresWitness: true,
    witnessCount: 2,
    requiresPhoto: true,
    requiresGPS: true,
    maxAmountPerTransactionYer: 50000000,
    requiresReconciliation: true,
    reconciliationDays: 1,
    requiresAuditTrail: true,
    requiresBeneficiaryConfirmation: true,
    confirmationMethod: 'BIOMETRIC',
    requiresDonorReport: true,
    bankAccountRequired: false,
    merchantIdRequired: false,
    eVoucherProviderRequired: false,
    requiresThreeWayMatch: true,
    maxDailyDisbursementYer: 100000000,
    requiresSegregationOfDuties: true,
  },
  BIOMETRIC: {
    method: 'BIOMETRIC',
    labelAr: 'بصمة إلكترونية',
    labelEn: 'Biometric',
    requiresApproval: true,
    approvalLevel: 3,
    requiresReceipt: true,
    requiresWitness: false,
    witnessCount: 0,
    requiresPhoto: false,
    requiresGPS: true,
    maxAmountPerTransactionYer: 2000000,
    requiresReconciliation: true,
    reconciliationDays: 1,
    requiresAuditTrail: true,
    requiresBeneficiaryConfirmation: true,
    confirmationMethod: 'BIOMETRIC',
    requiresDonorReport: true,
    bankAccountRequired: false,
    merchantIdRequired: false,
    eVoucherProviderRequired: false,
    requiresThreeWayMatch: false,
    maxDailyDisbursementYer: 10000000,
    requiresSegregationOfDuties: false,
  },
  CHECK: {
    method: 'CHECK',
    labelAr: 'شيك',
    labelEn: 'Check',
    requiresApproval: true,
    approvalLevel: 4,
    requiresReceipt: true,
    requiresWitness: true,
    witnessCount: 1,
    requiresPhoto: false,
    requiresGPS: false,
    maxAmountPerTransactionYer: 50000000,
    requiresReconciliation: true,
    reconciliationDays: 7,
    requiresAuditTrail: true,
    requiresBeneficiaryConfirmation: false,
    confirmationMethod: 'SIGNATURE',
    requiresDonorReport: true,
    bankAccountRequired: true,
    merchantIdRequired: false,
    eVoucherProviderRequired: false,
    requiresThreeWayMatch: true,
    maxDailyDisbursementYer: 100000000,
    requiresSegregationOfDuties: true,
  },
  CARD: {
    method: 'CARD',
    labelAr: 'بطاقة إلكترونية',
    labelEn: 'Card',
    requiresApproval: true,
    approvalLevel: 3,
    requiresReceipt: true,
    requiresWitness: false,
    witnessCount: 0,
    requiresPhoto: false,
    requiresGPS: false,
    maxAmountPerTransactionYer: 5000000,
    requiresReconciliation: true,
    reconciliationDays: 3,
    requiresAuditTrail: true,
    requiresBeneficiaryConfirmation: true,
    confirmationMethod: 'PIN',
    requiresDonorReport: true,
    bankAccountRequired: true,
    merchantIdRequired: true,
    eVoucherProviderRequired: false,
    requiresThreeWayMatch: true,
    maxDailyDisbursementYer: 20000000,
    requiresSegregationOfDuties: false,
  },
};

// ═══════════════════════════════════════════════════════════════
// 5. PROJECT TYPE POLICIES
// ═══════════════════════════════════════════════════════════════

export type ProjectType =
  | 'EMERGENCY_RELIEF'
  | 'DEVELOPMENT'
  | 'CAPACITY_BUILDING'
  | 'RESEARCH'
  | 'ADVOCACY'
  | 'INFRASTRUCTURE'
  | 'HEALTH_PROGRAM'
  | 'EDUCATION_PROGRAM'
  | 'WASH_PROGRAM'
  | 'LIVELIHOOD';

export interface ProjectTypePolicy {
  type: ProjectType;
  labelAr: string;
  labelEn: string;
  requiresMAndEPlan: boolean;
  requiresLogFrame: boolean;
  requiresBudgetBreakdown: boolean;
  requiresRiskRegister: boolean;
  requiresStakeholderMap: boolean;
  requiresProcurementPlan: boolean;
  requiresExitStrategy: boolean;
  requiresBaselineStudy: boolean;
  requiresEndlineStudy: boolean;
  requiresPostProjectEvaluation: boolean;
  maxDurationMonths: number;
  minBudgetYer: number;
  maxBudgetYer: number;
  requiresDonorApproval: boolean;
  requiresBoardApproval: boolean;
  requiresQuarterlyReport: boolean;
  requiresFinancialReport: boolean;
  requiresNarrativeReport: boolean;
  reportFrequencyDays: number;
  requiresGPSMapping: boolean;
  requiresBeneficiaryCount: boolean;
  requiresPhotoDocumentation: boolean;
  requiresVideoDocumentation: boolean;
  dataRetentionYears: number;
}

export const PROJECT_TYPE_POLICIES: Record<ProjectType, ProjectTypePolicy> = {
  EMERGENCY_RELIEF: {
    type: 'EMERGENCY_RELIEF',
    labelAr: 'إغاثة طارئة',
    labelEn: 'Emergency Relief',
    requiresMAndEPlan: false,
    requiresLogFrame: false,
    requiresBudgetBreakdown: true,
    requiresRiskRegister: true,
    requiresStakeholderMap: false,
    requiresProcurementPlan: false,
    requiresExitStrategy: true,
    requiresBaselineStudy: false,
    requiresEndlineStudy: false,
    requiresPostProjectEvaluation: true,
    maxDurationMonths: 6,
    minBudgetYer: 1000000,
    maxBudgetYer: 500000000,
    requiresDonorApproval: true,
    requiresBoardApproval: false,
    requiresQuarterlyReport: false,
    requiresFinancialReport: true,
    requiresNarrativeReport: true,
    reportFrequencyDays: 30,
    requiresGPSMapping: true,
    requiresBeneficiaryCount: true,
    requiresPhotoDocumentation: true,
    requiresVideoDocumentation: false,
    dataRetentionYears: 7,
  },
  DEVELOPMENT: {
    type: 'DEVELOPMENT',
    labelAr: 'تنموي',
    labelEn: 'Development',
    requiresMAndEPlan: true,
    requiresLogFrame: true,
    requiresBudgetBreakdown: true,
    requiresRiskRegister: true,
    requiresStakeholderMap: true,
    requiresProcurementPlan: true,
    requiresExitStrategy: true,
    requiresBaselineStudy: true,
    requiresEndlineStudy: true,
    requiresPostProjectEvaluation: true,
    maxDurationMonths: 60,
    minBudgetYer: 5000000,
    maxBudgetYer: 1000000000,
    requiresDonorApproval: true,
    requiresBoardApproval: true,
    requiresQuarterlyReport: true,
    requiresFinancialReport: true,
    requiresNarrativeReport: true,
    reportFrequencyDays: 90,
    requiresGPSMapping: true,
    requiresBeneficiaryCount: true,
    requiresPhotoDocumentation: true,
    requiresVideoDocumentation: true,
    dataRetentionYears: 10,
  },
  CAPACITY_BUILDING: {
    type: 'CAPACITY_BUILDING',
    labelAr: 'بناء قدرات',
    labelEn: 'Capacity Building',
    requiresMAndEPlan: true,
    requiresLogFrame: false,
    requiresBudgetBreakdown: true,
    requiresRiskRegister: false,
    requiresStakeholderMap: false,
    requiresProcurementPlan: false,
    requiresExitStrategy: false,
    requiresBaselineStudy: false,
    requiresEndlineStudy: true,
    requiresPostProjectEvaluation: true,
    maxDurationMonths: 24,
    minBudgetYer: 1000000,
    maxBudgetYer: 100000000,
    requiresDonorApproval: false,
    requiresBoardApproval: false,
    requiresQuarterlyReport: true,
    requiresFinancialReport: true,
    requiresNarrativeReport: true,
    reportFrequencyDays: 90,
    requiresGPSMapping: false,
    requiresBeneficiaryCount: true,
    requiresPhotoDocumentation: true,
    requiresVideoDocumentation: false,
    dataRetentionYears: 5,
  },
  RESEARCH: {
    type: 'RESEARCH',
    labelAr: 'بحثي',
    labelEn: 'Research',
    requiresMAndEPlan: true,
    requiresLogFrame: false,
    requiresBudgetBreakdown: true,
    requiresRiskRegister: false,
    requiresStakeholderMap: false,
    requiresProcurementPlan: false,
    requiresExitStrategy: false,
    requiresBaselineStudy: false,
    requiresEndlineStudy: true,
    requiresPostProjectEvaluation: false,
    maxDurationMonths: 36,
    minBudgetYer: 500000,
    maxBudgetYer: 50000000,
    requiresDonorApproval: false,
    requiresBoardApproval: false,
    requiresQuarterlyReport: true,
    requiresFinancialReport: true,
    requiresNarrativeReport: true,
    reportFrequencyDays: 90,
    requiresGPSMapping: false,
    requiresBeneficiaryCount: false,
    requiresPhotoDocumentation: false,
    requiresVideoDocumentation: false,
    dataRetentionYears: 15,
  },
  ADVOCACY: {
    type: 'ADVOCACY',
    labelAr: 'مناصرة',
    labelEn: 'Advocacy',
    requiresMAndEPlan: true,
    requiresLogFrame: false,
    requiresBudgetBreakdown: true,
    requiresRiskRegister: true,
    requiresStakeholderMap: true,
    requiresProcurementPlan: false,
    requiresExitStrategy: true,
    requiresBaselineStudy: true,
    requiresEndlineStudy: false,
    requiresPostProjectEvaluation: false,
    maxDurationMonths: 36,
    minBudgetYer: 1000000,
    maxBudgetYer: 100000000,
    requiresDonorApproval: false,
    requiresBoardApproval: false,
    requiresQuarterlyReport: true,
    requiresFinancialReport: true,
    requiresNarrativeReport: true,
    reportFrequencyDays: 90,
    requiresGPSMapping: false,
    requiresBeneficiaryCount: false,
    requiresPhotoDocumentation: true,
    requiresVideoDocumentation: true,
    dataRetentionYears: 10,
  },
  INFRASTRUCTURE: {
    type: 'INFRASTRUCTURE',
    labelAr: 'بنية تحتية',
    labelEn: 'Infrastructure',
    requiresMAndEPlan: true,
    requiresLogFrame: true,
    requiresBudgetBreakdown: true,
    requiresRiskRegister: true,
    requiresStakeholderMap: true,
    requiresProcurementPlan: true,
    requiresExitStrategy: true,
    requiresBaselineStudy: true,
    requiresEndlineStudy: true,
    requiresPostProjectEvaluation: true,
    maxDurationMonths: 36,
    minBudgetYer: 10000000,
    maxBudgetYer: 2000000000,
    requiresDonorApproval: true,
    requiresBoardApproval: true,
    requiresQuarterlyReport: true,
    requiresFinancialReport: true,
    requiresNarrativeReport: true,
    reportFrequencyDays: 30,
    requiresGPSMapping: true,
    requiresBeneficiaryCount: true,
    requiresPhotoDocumentation: true,
    requiresVideoDocumentation: true,
    dataRetentionYears: 20,
  },
  HEALTH_PROGRAM: {
    type: 'HEALTH_PROGRAM',
    labelAr: 'برنامج صحي',
    labelEn: 'Health Program',
    requiresMAndEPlan: true,
    requiresLogFrame: true,
    requiresBudgetBreakdown: true,
    requiresRiskRegister: true,
    requiresStakeholderMap: true,
    requiresProcurementPlan: true,
    requiresExitStrategy: true,
    requiresBaselineStudy: true,
    requiresEndlineStudy: true,
    requiresPostProjectEvaluation: true,
    maxDurationMonths: 60,
    minBudgetYer: 5000000,
    maxBudgetYer: 500000000,
    requiresDonorApproval: true,
    requiresBoardApproval: true,
    requiresQuarterlyReport: true,
    requiresFinancialReport: true,
    requiresNarrativeReport: true,
    reportFrequencyDays: 30,
    requiresGPSMapping: true,
    requiresBeneficiaryCount: true,
    requiresPhotoDocumentation: true,
    requiresVideoDocumentation: false,
    dataRetentionYears: 20,
  },
  EDUCATION_PROGRAM: {
    type: 'EDUCATION_PROGRAM',
    labelAr: 'برنامج تعليمي',
    labelEn: 'Education Program',
    requiresMAndEPlan: true,
    requiresLogFrame: true,
    requiresBudgetBreakdown: true,
    requiresRiskRegister: false,
    requiresStakeholderMap: true,
    requiresProcurementPlan: false,
    requiresExitStrategy: true,
    requiresBaselineStudy: true,
    requiresEndlineStudy: true,
    requiresPostProjectEvaluation: true,
    maxDurationMonths: 60,
    minBudgetYer: 2000000,
    maxBudgetYer: 300000000,
    requiresDonorApproval: false,
    requiresBoardApproval: false,
    requiresQuarterlyReport: true,
    requiresFinancialReport: true,
    requiresNarrativeReport: true,
    reportFrequencyDays: 90,
    requiresGPSMapping: true,
    requiresBeneficiaryCount: true,
    requiresPhotoDocumentation: true,
    requiresVideoDocumentation: true,
    dataRetentionYears: 10,
  },
  WASH_PROGRAM: {
    type: 'WASH_PROGRAM',
    labelAr: 'برنامج مياه وصرف صحي',
    labelEn: 'WASH Program',
    requiresMAndEPlan: true,
    requiresLogFrame: true,
    requiresBudgetBreakdown: true,
    requiresRiskRegister: true,
    requiresStakeholderMap: true,
    requiresProcurementPlan: true,
    requiresExitStrategy: true,
    requiresBaselineStudy: true,
    requiresEndlineStudy: true,
    requiresPostProjectEvaluation: true,
    maxDurationMonths: 36,
    minBudgetYer: 5000000,
    maxBudgetYer: 500000000,
    requiresDonorApproval: true,
    requiresBoardApproval: true,
    requiresQuarterlyReport: true,
    requiresFinancialReport: true,
    requiresNarrativeReport: true,
    reportFrequencyDays: 30,
    requiresGPSMapping: true,
    requiresBeneficiaryCount: true,
    requiresPhotoDocumentation: true,
    requiresVideoDocumentation: false,
    dataRetentionYears: 15,
  },
  LIVELIHOOD: {
    type: 'LIVELIHOOD',
    labelAr: 'سلسلة قيمة معيشية',
    labelEn: 'Livelihood',
    requiresMAndEPlan: true,
    requiresLogFrame: true,
    requiresBudgetBreakdown: true,
    requiresRiskRegister: true,
    requiresStakeholderMap: false,
    requiresProcurementPlan: true,
    requiresExitStrategy: true,
    requiresBaselineStudy: true,
    requiresEndlineStudy: true,
    requiresPostProjectEvaluation: true,
    maxDurationMonths: 36,
    minBudgetYer: 3000000,
    maxBudgetYer: 200000000,
    requiresDonorApproval: true,
    requiresBoardApproval: true,
    requiresQuarterlyReport: true,
    requiresFinancialReport: true,
    requiresNarrativeReport: true,
    reportFrequencyDays: 90,
    requiresGPSMapping: true,
    requiresBeneficiaryCount: true,
    requiresPhotoDocumentation: true,
    requiresVideoDocumentation: false,
    dataRetentionYears: 10,
  },
};

// ═══════════════════════════════════════════════════════════════
// 6. DONOR TYPE POLICIES
// ═══════════════════════════════════════════════════════════════

export type DonorType =
  | 'INSTITUTIONAL'
  | 'UN_AGENCY'
  | 'INDIVIDUAL'
  | 'GOVERNMENT'
  | 'CSR_CORPORATE'
  | 'FOUNDATION'
  | 'Islamic_BANK'
  | 'DIASPORA';

export interface DonorTypePolicy {
  type: DonorType;
  labelAr: string;
  labelEn: string;
  requiresDueDiligence: boolean;
  dueDiligenceLevel: 'BASIC' | 'STANDARD' | 'ENHANCED';
  requiresAgreement: boolean;
  agreementType: string;
  requiresKYC: boolean;
  requiresBackgroundCheck: boolean;
  requiresFinancialStatement: boolean;
  requiresAuditReport: boolean;
  requiresBoardResolution: boolean;
  maxGrantWithoutApprovalYer: number;
  requiresInstallmentPlan: boolean;
  installmentFrequency: string;
  requiresDonorReport: boolean;
  reportFrequency: string;
  requiresIATIReporting: boolean;
  requiresSphereCompliance: boolean;
  requiresCHSCompliance: boolean;
  dataRetentionYears: number;
  requiresAntiMoneyLaundering: boolean;
  requiresSourceOfFunds: boolean;
}

export const DONOR_TYPE_POLICIES: Record<DonorType, DonorTypePolicy> = {
  INSTITUTIONAL: {
    type: 'INSTITUTIONAL',
    labelAr: 'جهة مؤسسية',
    labelEn: 'Institutional Donor',
    requiresDueDiligence: true,
    dueDiligenceLevel: 'STANDARD',
    requiresAgreement: true,
    agreementType: 'GRANT_AGREEMENT',
    requiresKYC: true,
    requiresBackgroundCheck: false,
    requiresFinancialStatement: true,
    requiresAuditReport: true,
    requiresBoardResolution: false,
    maxGrantWithoutApprovalYer: 100000000,
    requiresInstallmentPlan: true,
    installmentFrequency: 'QUARTERLY',
    requiresDonorReport: true,
    reportFrequency: 'QUARTERLY',
    requiresIATIReporting: true,
    requiresSphereCompliance: true,
    requiresCHSCompliance: true,
    dataRetentionYears: 10,
    requiresAntiMoneyLaundering: false,
    requiresSourceOfFunds: false,
  },
  UN_AGENCY: {
    type: 'UN_AGENCY',
    labelAr: 'وكالة أممية',
    labelEn: 'UN Agency',
    requiresDueDiligence: true,
    dueDiligenceLevel: 'ENHANCED',
    requiresAgreement: true,
    agreementType: 'PCA',
    requiresKYC: true,
    requiresBackgroundCheck: false,
    requiresFinancialStatement: true,
    requiresAuditReport: true,
    requiresBoardResolution: false,
    maxGrantWithoutApprovalYer: 500000000,
    requiresInstallmentPlan: true,
    installmentFrequency: 'QUARTERLY',
    requiresDonorReport: true,
    reportFrequency: 'MONTHLY',
    requiresIATIReporting: true,
    requiresSphereCompliance: true,
    requiresCHSCompliance: true,
    dataRetentionYears: 10,
    requiresAntiMoneyLaundering: false,
    requiresSourceOfFunds: false,
  },
  INDIVIDUAL: {
    type: 'INDIVIDUAL',
    labelAr: ' kişi/-function',
    labelEn: 'Individual Donor',
    requiresDueDiligence: false,
    dueDiligenceLevel: 'BASIC',
    requiresAgreement: false,
    agreementType: '',
    requiresKYC: true,
    requiresBackgroundCheck: false,
    requiresFinancialStatement: false,
    requiresAuditReport: false,
    requiresBoardResolution: false,
    maxGrantWithoutApprovalYer: 10000000,
    requiresInstallmentPlan: false,
    installmentFrequency: '',
    requiresDonorReport: false,
    reportFrequency: '',
    requiresIATIReporting: false,
    requiresSphereCompliance: false,
    requiresCHSCompliance: false,
    dataRetentionYears: 7,
    requiresAntiMoneyLaundering: true,
    requiresSourceOfFunds: true,
  },
  GOVERNMENT: {
    type: 'GOVERNMENT',
    labelAr: 'جهة حكومية',
    labelEn: 'Government',
    requiresDueDiligence: true,
    dueDiligenceLevel: 'STANDARD',
    requiresAgreement: true,
    agreementType: 'MOU',
    requiresKYC: true,
    requiresBackgroundCheck: false,
    requiresFinancialStatement: true,
    requiresAuditReport: true,
    requiresBoardResolution: false,
    maxGrantWithoutApprovalYer: 1000000000,
    requiresInstallmentPlan: true,
    installmentFrequency: 'QUARTERLY',
    requiresDonorReport: true,
    reportFrequency: 'QUARTERLY',
    requiresIATIReporting: true,
    requiresSphereCompliance: true,
    requiresCHSCompliance: true,
    dataRetentionYears: 15,
    requiresAntiMoneyLaundering: false,
    requiresSourceOfFunds: false,
  },
  CSR_CORPORATE: {
    type: 'CSR_CORPORATE',
    labelAr: 'مسؤولية اجتماعية مؤسسية',
    labelEn: 'CSR Corporate',
    requiresDueDiligence: true,
    dueDiligenceLevel: 'STANDARD',
    requiresAgreement: true,
    agreementType: 'PARTNERSHIP',
    requiresKYC: true,
    requiresBackgroundCheck: true,
    requiresFinancialStatement: true,
    requiresAuditReport: false,
    requiresBoardResolution: true,
    maxGrantWithoutApprovalYer: 50000000,
    requiresInstallmentPlan: false,
    installmentFrequency: '',
    requiresDonorReport: true,
    reportFrequency: 'QUARTERLY',
    requiresIATIReporting: false,
    requiresSphereCompliance: false,
    requiresCHSCompliance: false,
    dataRetentionYears: 7,
    requiresAntiMoneyLaundering: false,
    requiresSourceOfFunds: false,
  },
  FOUNDATION: {
    type: 'FOUNDATION',
    labelAr: 'مؤسسة',
    labelEn: 'Foundation',
    requiresDueDiligence: true,
    dueDiligenceLevel: 'STANDARD',
    requiresAgreement: true,
    agreementType: 'GRANT_AGREEMENT',
    requiresKYC: true,
    requiresBackgroundCheck: false,
    requiresFinancialStatement: true,
    requiresAuditReport: true,
    requiresBoardResolution: false,
    maxGrantWithoutApprovalYer: 100000000,
    requiresInstallmentPlan: true,
    installmentFrequency: 'SEMI_ANNUAL',
    requiresDonorReport: true,
    reportFrequency: 'QUARTERLY',
    requiresIATIReporting: true,
    requiresSphereCompliance: true,
    requiresCHSCompliance: true,
    dataRetentionYears: 10,
    requiresAntiMoneyLaundering: false,
    requiresSourceOfFunds: false,
  },
  Islamic_BANK: {
    type: 'Islamic_BANK',
    labelAr: 'بنك إسلامي',
    labelEn: 'Islamic Bank',
    requiresDueDiligence: true,
    dueDiligenceLevel: 'ENHANCED',
    requiresAgreement: true,
    agreementType: 'SUPPLIER_PURCHASE',
    requiresKYC: true,
    requiresBackgroundCheck: true,
    requiresFinancialStatement: true,
    requiresAuditReport: true,
    requiresBoardResolution: true,
    maxGrantWithoutApprovalYer: 200000000,
    requiresInstallmentPlan: true,
    installmentFrequency: 'MONTHLY',
    requiresDonorReport: true,
    reportFrequency: 'MONTHLY',
    requiresIATIReporting: false,
    requiresSphereCompliance: false,
    requiresCHSCompliance: false,
    dataRetentionYears: 10,
    requiresAntiMoneyLaundering: true,
    requiresSourceOfFunds: true,
  },
  DIASPORA: {
    type: 'DIASPORA',
    labelAr: 'الشتات',
    labelEn: 'Diaspora',
    requiresDueDiligence: false,
    dueDiligenceLevel: 'BASIC',
    requiresAgreement: false,
    agreementType: '',
    requiresKYC: true,
    requiresBackgroundCheck: false,
    requiresFinancialStatement: false,
    requiresAuditReport: false,
    requiresBoardResolution: false,
    maxGrantWithoutApprovalYer: 5000000,
    requiresInstallmentPlan: false,
    installmentFrequency: '',
    requiresDonorReport: false,
    reportFrequency: '',
    requiresIATIReporting: false,
    requiresSphereCompliance: false,
    requiresCHSCompliance: false,
    dataRetentionYears: 7,
    requiresAntiMoneyLaundering: true,
    requiresSourceOfFunds: true,
  },
};

// ═══════════════════════════════════════════════════════════════
// 7. TRANSACTION TYPE POLICIES
// ═══════════════════════════════════════════════════════════════

export type TransactionType =
  | 'JOURNAL_ENTRY'
  | 'PAYMENT'
  | 'RECEIPT'
  | 'TRANSFER'
  | 'DEBIT_NOTE'
  | 'CREDIT_NOTE'
  | 'CLOSING';

export interface TransactionTypePolicy {
  type: TransactionType;
  labelAr: string;
  labelEn: string;
  requiresDoubleEntry: boolean;
  requiresApproval: boolean;
  approvalLevel: number;
  requiresDescription: boolean;
  requiresReferenceNo: boolean;
  requiresProjectLink: boolean;
  requiresActivityLink: boolean;
  requiresPartyLink: boolean;
  maxAmountYer: number;
  requiresReceipt: boolean;
  requiresBankReconciliation: boolean;
  autoGenerateNumber: boolean;
  numberPrefix: string;
  allowsBackdating: boolean;
  maxBackdatingDays: number;
  requiresPeriodClose: boolean;
  canBeReversed: boolean;
  reversalRequiresApproval: boolean;
}

export const TRANSACTION_TYPE_POLICIES: Record<TransactionType, TransactionTypePolicy> = {
  JOURNAL_ENTRY: {
    type: 'JOURNAL_ENTRY',
    labelAr: 'قيد يومية',
    labelEn: 'Journal Entry',
    requiresDoubleEntry: true,
    requiresApproval: true,
    approvalLevel: 3,
    requiresDescription: true,
    requiresReferenceNo: false,
    requiresProjectLink: false,
    requiresActivityLink: false,
    requiresPartyLink: false,
    maxAmountYer: 100000000,
    requiresReceipt: false,
    requiresBankReconciliation: false,
    autoGenerateNumber: true,
    numberPrefix: 'JV-',
    allowsBackdating: true,
    maxBackdatingDays: 30,
    requiresPeriodClose: true,
    canBeReversed: true,
    reversalRequiresApproval: true,
  },
  PAYMENT: {
    type: 'PAYMENT',
    labelAr: 'صرف',
    labelEn: 'Payment',
    requiresDoubleEntry: true,
    requiresApproval: true,
    approvalLevel: 4,
    requiresDescription: true,
    requiresReferenceNo: true,
    requiresProjectLink: false,
    requiresActivityLink: false,
    requiresPartyLink: true,
    maxAmountYer: 500000000,
    requiresReceipt: true,
    requiresBankReconciliation: true,
    autoGenerateNumber: true,
    numberPrefix: 'PAY-',
    allowsBackdating: false,
    maxBackdatingDays: 0,
    requiresPeriodClose: true,
    canBeReversed: true,
    reversalRequiresApproval: true,
  },
  RECEIPT: {
    type: 'RECEIPT',
    labelAr: 'قبض',
    labelEn: 'Receipt',
    requiresDoubleEntry: true,
    requiresApproval: true,
    approvalLevel: 3,
    requiresDescription: true,
    requiresReferenceNo: true,
    requiresProjectLink: false,
    requiresActivityLink: false,
    requiresPartyLink: true,
    maxAmountYer: 500000000,
    requiresReceipt: false,
    requiresBankReconciliation: true,
    autoGenerateNumber: true,
    numberPrefix: 'RCT-',
    allowsBackdating: false,
    maxBackdatingDays: 0,
    requiresPeriodClose: true,
    canBeReversed: true,
    reversalRequiresApproval: true,
  },
  TRANSFER: {
    type: 'TRANSFER',
    labelAr: 'تحويل',
    labelEn: 'Transfer',
    requiresDoubleEntry: true,
    requiresApproval: true,
    approvalLevel: 4,
    requiresDescription: true,
    requiresReferenceNo: true,
    requiresProjectLink: false,
    requiresActivityLink: false,
    requiresPartyLink: false,
    maxAmountYer: 1000000000,
    requiresReceipt: true,
    requiresBankReconciliation: true,
    autoGenerateNumber: true,
    numberPrefix: 'TRF-',
    allowsBackdating: false,
    maxBackdatingDays: 0,
    requiresPeriodClose: true,
    canBeReversed: true,
    reversalRequiresApproval: true,
  },
  DEBIT_NOTE: {
    type: 'DEBIT_NOTE',
    labelAr: 'إشعار مدين',
    labelEn: 'Debit Note',
    requiresDoubleEntry: true,
    requiresApproval: true,
    approvalLevel: 3,
    requiresDescription: true,
    requiresReferenceNo: true,
    requiresProjectLink: false,
    requiresActivityLink: false,
    requiresPartyLink: true,
    maxAmountYer: 50000000,
    requiresReceipt: false,
    requiresBankReconciliation: false,
    autoGenerateNumber: true,
    numberPrefix: 'DN-',
    allowsBackdating: true,
    maxBackdatingDays: 15,
    requiresPeriodClose: true,
    canBeReversed: true,
    reversalRequiresApproval: true,
  },
  CREDIT_NOTE: {
    type: 'CREDIT_NOTE',
    labelAr: 'إشعار دائن',
    labelEn: 'Credit Note',
    requiresDoubleEntry: true,
    requiresApproval: true,
    approvalLevel: 3,
    requiresDescription: true,
    requiresReferenceNo: true,
    requiresProjectLink: false,
    requiresActivityLink: false,
    requiresPartyLink: true,
    maxAmountYer: 50000000,
    requiresReceipt: false,
    requiresBankReconciliation: false,
    autoGenerateNumber: true,
    numberPrefix: 'CN-',
    allowsBackdating: true,
    maxBackdatingDays: 15,
    requiresPeriodClose: true,
    canBeReversed: true,
    reversalRequiresApproval: true,
  },
  CLOSING: {
    type: 'CLOSING',
    labelAr: 'إقفال',
    labelEn: 'Closing',
    requiresDoubleEntry: true,
    requiresApproval: true,
    approvalLevel: 5,
    requiresDescription: true,
    requiresReferenceNo: false,
    requiresProjectLink: false,
    requiresActivityLink: false,
    requiresPartyLink: false,
    maxAmountYer: 0,
    requiresReceipt: false,
    requiresBankReconciliation: true,
    autoGenerateNumber: true,
    numberPrefix: 'CLS-',
    allowsBackdating: false,
    maxBackdatingDays: 0,
    requiresPeriodClose: false,
    canBeReversed: false,
    reversalRequiresApproval: false,
  },
};

// ═══════════════════════════════════════════════════════════════
// 8. MASTER POLICY REGISTRY
// ═══════════════════════════════════════════════════════════════

export const ENTITY_POLICY_REGISTRY = {
  beneficiaries: BENEFICIARY_POLICIES,
  activities: ACTIVITY_SECTOR_POLICIES,
  sponsorships: SPONSORSHIP_POLICIES,
  disbursements: DISBURSEMENT_POLICIES,
  projects: PROJECT_TYPE_POLICIES,
  donors: DONOR_TYPE_POLICIES,
  transactions: TRANSACTION_TYPE_POLICIES,
} as const;

export type EntityTypeKey = keyof typeof ENTITY_POLICY_REGISTRY;

/**
 * Get the policy for a specific entity type and subtype.
 */
export function getEntityPolicy(entityType: EntityTypeKey, subtype: string): any {
  const registry = ENTITY_POLICY_REGISTRY[entityType];
  if (!registry) return null;
  return (registry as any)[subtype] || null;
}

/**
 * Validate an entity against its type-specific policies.
 * Returns violations that need to be enforced.
 */
export function validateEntityPolicy(
  entityType: EntityTypeKey,
  subtype: string,
  entityData: Record<string, any>
): Array<{ code: string; severity: 'BLOCK' | 'WARN'; messageAr: string; messageEn: string }> {
  const policy = getEntityPolicy(entityType, subtype);
  if (!policy) return [];

  const violations: Array<{ code: string; severity: 'BLOCK' | 'WARN'; messageAr: string; messageEn: string }> = [];

  if (entityType === 'beneficiaries') {
    const p = policy as BeneficiaryTypePolicy;
    if (p.requiresNationalId && !entityData.national_id) {
      violations.push({
        code: 'NATIONAL_ID_REQUIRED',
        severity: 'BLOCK',
        messageAr: `رقم الهوية الوطنية مطلوب لفئة ${p.labelAr}`,
        messageEn: `National ID is required for ${p.labelEn} category`,
      });
    }
    if (p.maxFamilyMembers && entityData.family_members_count > p.maxFamilyMembers) {
      violations.push({
        code: 'MAX_FAMILY_MEMBERS_EXCEEDED',
        severity: 'WARN',
        messageAr: `عدد أفراد الأسرة ${entityData.family_members_count} يتجاوز الحد ${p.maxFamilyMembers}`,
        messageEn: `Family members count ${entityData.family_members_count} exceeds limit ${p.maxFamilyMembers}`,
      });
    }
    if (p.maxAidAmountYer && entityData.aid_amount > p.maxAidAmountYer) {
      violations.push({
        code: 'MAX_AID_AMOUNT_EXCEEDED',
        severity: 'BLOCK',
        messageAr: `مبلغ المساعدة ${entityData.aid_amount} يتجاوز الحد ${p.maxAidAmountYer}`,
        messageEn: `Aid amount ${entityData.aid_amount} exceeds limit ${p.maxAidAmountYer}`,
      });
    }
  }

  if (entityType === 'sponsorships') {
    const p = policy as SponsorshipTypePolicy;
    if (entityData.monthly_amount < p.minMonthlyAmountYer) {
      violations.push({
        code: 'MIN_SPONSORSHIP_AMOUNT',
        severity: 'BLOCK',
        messageAr: `المبلغ الشهري ${entityData.monthly_amount} أقل من الحد الأدنى ${p.minMonthlyAmountYer}`,
        messageEn: `Monthly amount ${entityData.monthly_amount} is below minimum ${p.minMonthlyAmountYer}`,
      });
    }
    if (entityData.monthly_amount > p.maxMonthlyAmountYer) {
      violations.push({
        code: 'MAX_SPONSORSHIP_AMOUNT',
        severity: 'BLOCK',
        messageAr: `المبلغ الشهري ${entityData.monthly_amount} يتجاوز الحد الأقصى ${p.maxMonthlyAmountYer}`,
        messageEn: `Monthly amount ${entityData.monthly_amount} exceeds maximum ${p.maxMonthlyAmountYer}`,
      });
    }
    if (p.requiresSchoolEnrollment && !entityData.school_enrollment) {
      violations.push({
        code: 'SCHOOL_ENROLLMENT_REQUIRED',
        severity: 'BLOCK',
        messageAr: 'التسجيل في المدرسة مطلوب لهذا النوع من الكفالة',
        messageEn: 'School enrollment is required for this sponsorship type',
      });
    }
  }

  if (entityType === 'disbursements') {
    const p = policy as DisbursementMethodPolicy;
    if (entityData.amount > p.maxAmountPerTransactionYer) {
      violations.push({
        code: 'DISBURSEMENT_MAX_EXCEEDED',
        severity: 'BLOCK',
        messageAr: `مبلغ الصرف ${entityData.amount} يتجاوز الحد ${p.maxAmountPerTransactionYer}`,
        messageEn: `Disbursement amount ${entityData.amount} exceeds limit ${p.maxAmountPerTransactionYer}`,
      });
    }
    if (p.requiresWitness && entityData.witness_count < p.witnessCount) {
      violations.push({
        code: 'INSUFFICIENT_WITNESSES',
        severity: 'BLOCK',
        messageAr: `عدد الشهود ${entityData.witness_count} أقل من المطلوب ${p.witnessCount}`,
        messageEn: `Witness count ${entityData.witness_count} is below required ${p.witnessCount}`,
      });
    }
    if (p.requiresGPS && (!entityData.latitude || !entityData.longitude)) {
      violations.push({
        code: 'GPS_REQUIRED',
        severity: 'BLOCK',
        messageAr: 'إحداثيات GPS مطلوبة لهذا النوع من الصرف',
        messageEn: 'GPS coordinates are required for this disbursement method',
      });
    }
    if (p.requiresPhoto && !entityData.photo_url) {
      violations.push({
        code: 'PHOTO_REQUIRED',
        severity: 'BLOCK',
        messageAr: 'صورة مطلوبة لهذا النوع من الصرف',
        messageEn: 'Photo documentation is required for this disbursement method',
      });
    }
  }

  return violations;
}
