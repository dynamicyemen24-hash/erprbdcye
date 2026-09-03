# UAMEX ERP™ — UnifiedRevenueEngine™ Data Models
## Complete TypeScript Type Definitions

---

## Overview
This document contains comprehensive TypeScript type definitions for the UnifiedRevenueEngine™ (NEB-15), covering all 12 revenue types, batch processing, workflows, and analytics.

---

## 1. Enumerations & Type Aliases

```typescript
// ═══════════════════════════════════════════════════════════════════
// UAMEX ERP™ — UnifiedRevenueEngine™ — Type Definitions
// Domain: NEB-15 Sales, Revenue & Fundraising OS
// Compliance: IPSAS 23, ASC 958, IFRS 15, Sphere/CHS Standards
// ═══════════════════════════════════════════════════════════════════

// ─── Revenue Type Enumeration ──────────────────────────────────────
export type RevenueTypeCode =
  | 'CASH_DON'           // تبرعات نقدية
  | 'INKIND_DON'         // تبرعات عينية
  | 'GRANT'              // منح ومخصصات
  | 'INVEST_REV'         // إيرادات استثمارية
  | 'ENDOW_REV'          // إيرادات وقفية
  | 'SERVICE_FEE'        // رسوم خدمات
  | 'MEMBERSHIP'         // اشتراكات عضوية
  | 'PROFIT_SHARE'       // حصص أرباح
  | 'PROGRAM_REV'        // إيرادات برامج
  | 'COND_FUND'          // تمويل مشروط
  | 'PARTIAL_FUND'       // تمويل جزئي
  | 'MULTIYEAR_FUND';    // تمويل متعدد السنوات

// ─── Revenue Lifecycle States ──────────────────────────────────────
export type RevenueStatus =
  | 'DRAFT'                     // مسودة
  | 'PENDING_APPROVAL'          // بانتظار الاعتماد
  | 'APPROVED'                  // معتمد
  | 'POSTED'                    // مرحّل للقيود
  | 'PARTIALLY_COLLECTED'       // محصّل جزئياً
  | 'COLLECTED'                 // محصّل بالكامل
  | 'REJECTED'                  // مرفوض
  | 'VOIDED'                    // ملغى
  | 'EXPIRED'                   // منتهي الصلاحية
  | 'CONDITIONALLY_COMPLETED';  // مكتمل بشروط

// ─── Accounting Recognition Methods ────────────────────────────────
export type RecognitionMethod =
  | 'CASH'             // الأساس النقدي
  | 'ACCRUAL'          // أساس الاستحقاق
  | 'DEFERRED'         // مؤجل
  | 'PROPORTIONAL'     // تناسبي
  | 'STRAIGHT_LINE';   // قسط ثابت

// ─── Exchange Type (IPSAS 9/23 Classification) ─────────────────────
export type ExchangeType = 'EXCHANGE' | 'NON_EXCHANGE';

// ─── Fund Restriction Levels (ASC 958) ──────────────────────────────
export type RestrictionLevel =
  | 'UNRESTRICTED'              // غير مقيد
  | 'TEMPORARILY_RESTRICTED'    // مقيد مؤقتاً
  | 'PERMANENTLY_RESTRICTED';   // مقيد دائماً

// ─── Funding Schedule Types ────────────────────────────────────────
export type FundingScheduleType =
  | 'ONE_TIME'           // دفعة واحدة
  | 'INSTALLMENT'        // أقساط
  | 'CONTINGENT'         // مشروط
  | 'MILESTONE_BASED';   // مبني على المعالم

// ─── Counterparty Types ────────────────────────────────────────────
export type CounterpartyType =
  | 'INDIVIDUAL'      // فرد
  | 'ORGANIZATION'    // منظمة
  | 'GOVERNMENT'      // حكومة
  | 'CORPORATE'       // شركة
  | 'FOUNDATION'      // مؤسسة
  | 'NGO'             // منظمة غير حكومية
  | 'MULTILATERAL'    // منظمة متعددة الأطراف
  | 'BILATERAL'       // منظمة ثنائية
  | 'UNKNOWN';

// ─── Collection Status ─────────────────────────────────────────────
export type CollectionStatus =
  | 'PENDING'
  | 'DUE'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

// ─── Payment Methods ───────────────────────────────────────────────
export type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'CHECK'
  | 'MOBILE_WALLET'
  | 'CREDIT_CARD'
  | 'CARD'
  | 'IN_KIND'
  | 'OTHER';

// ─── Approval Actions ──────────────────────────────────────────────
export type ApprovalAction = 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'DELEGATE' | 'ESCALATE';

// ─── Report Types ──────────────────────────────────────────────────
export type ReportType =
  | 'DETAILED'
  | 'SUMMARY'
  | 'ANALYTICAL'
  | 'EVALUATIVE'
  | 'BI_DASHBOARD';

// ─── Anomaly Severity ──────────────────────────────────────────────
export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// ─── Forecast Confidence ───────────────────────────────────────────
export type ForecastConfidence = 'HIGH' | 'MEDIUM' | 'LOW';
```

---

## 2. Core Revenue Entities

```typescript
// ─── Revenue Stream (Master Classification) ────────────────────────
export interface RevenueStream {
  id: string;
  organizationId: string;
  streamCode: string;                    // e.g., 'REV-CASH-001'
  nameAr: string;
  nameEn?: string;
  description?: string;
  
  // Type Configuration
  revenueType: RevenueTypeCode;
  recognitionMethod: RecognitionMethod;
  exchangeType: ExchangeType;
  restrictionLevel: RestrictionLevel;
  
  // Default Accounts
  defaultCurrency: string;               // e.g., 'YER', 'USD'
  defaultDebitAccountId?: string;        // Cash/Bank Account
  defaultCreditAccountId?: string;       // Revenue Account
  deferredAccountId?: string;            // For conditional/multi-year
  
  // Control Rules
  isActive: boolean;
  allowBatch: boolean;
  requiresApproval: boolean;
  minAmount?: number;
  maxAmount?: number;
  
  // Display & Behavior
  displayOrder?: number;
  iconCode?: string;                     // e.g., 'Banknote', 'Gift'
  colorCode?: string;                    // e.g., 'emerald', 'amber'
  
  // Extensibility
  metadata: RevenueStreamMetadata;
  
  // Audit
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface RevenueStreamMetadata {
  customFields?: Record<string, any>;
  [key: string]: any;
}

// ─── Single Revenue Record (Main Entity) ───────────────────────────
export interface RevenueRecord {
  id: string;
  organizationId: string;
  revenueNumber: string;                 // e.g., 'REV-2026-00001'
  
  // Classification
  revenueType: RevenueTypeCode;
  streamId?: string;
  
  // Lifecycle State
  status: RevenueStatus;
  recognitionMethod: RecognitionMethod;
  restrictionLevel: RestrictionLevel;
  
  // Counterparty (Source of Revenue)
  counterpartyType: CounterpartyType;
  counterpartyId?: string;
  counterpartyName: string;
  counterpartyEmail?: string;
  counterpartyPhone?: string;
  counterpartyCountry?: string;
  counterpartyTaxId?: string;
  
  // Project & Cost Allocation
  projectId?: string;
  activityId?: string;
  costCenterId?: string;
  wbsCode?: string;
  
  // Funding Source
  fundingScheduleType?: FundingScheduleType;
  fundingSourceId?: string;              // Grant/Donor ID
  grantId?: string;
  endowmentId?: string;
  programId?: string;
  
  // Financial Amounts
  amount: number;                        // Original currency
  amountBase: number;                    // Base currency
  collectedAmount: number;
  collectedAmountBase: number;
  outstandingAmount: number;             // Computed
  currencyCode: string;
  exchangeRate: number;
  
  // Deferred Revenue
  deferredAmount: number;                // Total deferred
  recognizedAmount: number;              // Recognized so far
  remainingDeferredAmount: number;       // Still deferred
  
  // Key Dates
  revenueDate: string;                   // When revenue occurred
  recognitionDate?: string;              // When recognized
  collectionDueDate?: string;            // Expected collection
  actualCollectionDate?: string;         // Last collection
  expirationDate?: string;               // For conditional/timed
  
  // References
  referenceNumber?: string;              // Internal reference
  externalReference?: string;            // External (e.g., bank ref)
  bankReference?: string;
  contractNumber?: string;
  
  // Description
  description?: string;
  notes?: string;
  attachments: RevenueAttachment[];
  
  // Conditional Funding Fields
  conditionsMet: boolean;
  conditionsDetails?: string;
  milestoneProgress: number;             // 0-100
  
  // Batch Linkage
  batchId?: string;
  batchSequence?: number;
  
  // Restrictions (IPSAS 23)
  restrictionPurpose?: string;
  donorImposedRestrictions?: string;
  
  // In-Kind Specific
  inKindDetails?: InKindDetails;
  
  // Investment Specific
  investmentDetails?: InvestmentDetails;
  
  // Program Revenue Specific
  programRevenueDetails?: ProgramRevenueDetails;
  
  // Recurring Fields
  isRecurring: boolean;
  recurringFrequency?: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
  parentRecordId?: string;               // For recurring instances
  
  // Metadata
  metadata: RevenueMetadata;
  
  // Approval Info
  approvalWorkflowId?: string;
  approvalLog: ApprovalLogEntry[];
  
  // Sync Status
  syncStatus: RevenueSyncStatus;
  
  // Audit
  createdById: string;
  approvedById?: string;
  postedById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RevenueAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  uploadedById: string;
  uploadedAt: string;
}

// ─── In-Kind Donation Details ──────────────────────────────────────
export interface InKindDetails {
  itemType: string;                      // e.g., 'FOOD', 'MEDICINE', 'EQUIPMENT'
  itemDescription: string;
  quantity: number;
  unitOfMeasure: string;
  estimatedValue: number;
  estimatedValueBase: number;
  valuationMethod: 'MARKET_VALUE' | 'APPRAISAL' | 'CARRYING_VALUE';
  donorSource: string;
  receivedDate: string;
  condition?: 'NEW' | 'USED' | 'REFURBISHED';
  locationStored?: string;
  expirationDate?: string;
}

// ─── Investment Revenue Details ────────────────────────────────────
export interface InvestmentDetails {
  investmentType: 'INTEREST' | 'DIVIDEND' | 'CAPITAL_GAIN' | 'RENTAL' | 'ROYALTY' | 'OTHER';
  instrumentCode?: string;               // Stock/bond code
  instrumentName?: string;
  investmentDate?: string;
  maturityDate?: string;
  principalAmount?: number;
  yieldRate?: number;
  custodian?: string;
  brokerAccount?: string;
}

// ─── Program Revenue Details ───────────────────────────────────────
export interface ProgramRevenueDetails {
  programId: string;
  programName?: string;
  serviceType: string;
  beneficiaryCount?: number;
  unitPrice?: number;
  costRecoveryMethod?: 'FULL' | 'PARTIAL' | 'SUBSIDIZED';
  servicePeriod?: {
    fromDate: string;
    toDate: string;
  };
}
```

---

## 3. Batch Revenue Entities

```typescript
// ─── Revenue Batch (Multi-Entry Group) ─────────────────────────────
export interface RevenueBatch {
  id: string;
  organizationId: string;
  batchNumber: string;                   // e.g., 'BATCH-REV-2026-001'
  
  // Lifecycle
  status: BatchStatus;
  
  // Financial Summary
  totalDebit: number;
  totalCredit: number;
  difference: number;                    // Should be 0
  isBalanced: boolean;                   // Validation flag
  entryCount: number;
  
  // Currency
  currencyCode: string;
  exchangeRate: number;
  totalAmountBase: number;
  
  // Dates
  batchDate: string;
  postedDate?: string;
  
  // Workflow
  approvalWorkflowId?: string;
  requiredApprovers: BatchApprover[];
  currentApproverLevel: number;
  approvalStatus: 'PENDING' | 'PARTIAL' | 'FULL' | 'REJECTED';
  
  // Funding Cap Linkage
  appliesFundingCap: boolean;
  fundingCapId?: string;
  capCheckResult?: CapCheckResult;
  
  // Source Information
  sourceType: 'MANUAL' | 'IMPORT' | 'API' | 'SCHEDULED';
  sourceReference?: string;
  
  // Description
  description?: string;
  notes?: string;
  
  // Validation Errors (if any)
  validationErrors: ValidationError[];
  
  // Generated Journal Entry
  journalEntryId?: string;
  journalEntryNumber?: string;
  
  // Audit
  createdById: string;
  approvedById?: string;
  postedById?: string;
  createdAt: string;
  updatedAt: string;
}

export type BatchStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'POSTED'
  | 'PARTIALLY_POSTED'
  | 'REJECTED'
  | 'VOIDED';

export interface BatchApprover {
  level: number;
  approverId: string;
  approverName: string;
  roleId: string;
  roleNameAr: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';
  approvedAt?: string;
  comments?: string;
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
  entryIndex?: number;
}

// ─── Batch Entry (Line Item) ───────────────────────────────────────
export interface RevenueBatchEntry {
  id: string;
  batchId: string;
  sequenceNumber: number;
  
  // Account
  accountId: string;
  accountCode: string;
  accountNameAr: string;
  accountNameEn?: string;
  accountType: string;
  
  // Amount (debit OR credit, not both)
  debit: number;
  credit: number;
  currencyCode: string;
  exchangeRate: number;
  amountBase: number;                    // Computed
  
  // Project/Cost Allocation
  projectId?: string;
  projectCode?: string;
  projectNameAr?: string;
  activityId?: string;
  costCenterId?: string;
  wbsCode?: string;
  
  // Counterparty
  counterpartyId?: string;
  counterpartyName?: string;
  
  // Revenue Link
  revenueRecordId?: string;
  revenueNumber?: string;
  
  // Description
  lineDescription?: string;
  
  // Tax (if applicable)
  taxCodeId?: string;
  taxAmount?: number;
  
  // Analytics Dimensions
  dimensions: {
    region?: string;
    department?: string;
    product?: string;
    channel?: string;
    [key: string]: any;
  };
  
  createdAt: string;
}
```

---

## 4. Schedule & Installment Entities

```typescript
// ─── Revenue Schedule (Installments/Conditional) ──────────────────
export interface RevenueSchedule {
  id: string;
  revenueRecordId: string;
  scheduleNumber: number;                // 1, 2, 3...
  
  // Scheduled
  scheduledDate: string;
  scheduledAmount: number;
  scheduledAmountBase: number;
  currencyCode: string;
  
  // Actual (when received)
  actualDate?: string;
  actualAmount?: number;
  actualAmountBase?: number;
  
  // Status
  status: ScheduleStatus;
  daysOverdue: number;                   // Computed
  
  // Payment Reference
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  bankTransactionId?: string;
  receiptNumber?: string;
  
  // Condition (for milestone-based)
  conditionType?: 'MILESTONE' | 'DELIVERABLE' | 'PERIODIC' | 'ONE_TIME';
  conditionDescription?: string;
  conditionMet: boolean;
  conditionVerifiedById?: string;
  conditionVerifiedAt?: string;
  conditionEvidenceUrl?: string;
  
  // Recognition
  isRecognized: boolean;
  recognizedDate?: string;
  journalEntryId?: string;
  
  // Notifications
  reminderSent: boolean;
  reminderSentAt?: string;
  escalationLevel: number;
  
  createdAt: string;
  updatedAt: string;
}

export type ScheduleStatus =
  | 'PENDING'              // Not yet due
  | 'DUE'                  // Due within threshold
  | 'PARTIALLY_PAID'       // Partial collection
  | 'PAID'                 // Fully collected
  | 'OVERDUE'              // Past due date
  | 'CANCELLED'            // Cancelled
  | 'CONDITIONAL'          // Awaiting condition verification
  | 'EXPIRED';             // Past expiration without payment

// ─── Milestone (for Conditional Funding) ───────────────────────────
export interface RevenueMilestone {
  id: string;
  revenueRecordId: string;
  milestoneNumber: number;
  title: string;
  description?: string;
  
  // Target
  targetDate: string;
  targetAmount: number;                  // Amount to recognize on completion
  targetPercentage: number;              // % of total
  currencyCode: string;
  
  // Status
  status: 'PENDING' | 'IN_PROGRESS' | 'ACHIEVED' | 'PARTIAL' | 'NOT_ACHIEVED' | 'CANCELLED';
  achievementPercentage: number;         // 0-100
  
  // Actual
  achievedDate?: string;
  verifiedAmount?: number;
  verifiedById?: string;
  verifiedAt?: string;
  
  // Evidence
  evidenceDocuments: string[];
  
  // Notes
  notes?: string;
  
  createdAt: string;
  updatedAt: string;
}
```

---

## 5. Funding Cap Entities

```typescript
// ─── Funding Cap (Ceiling) ─────────────────────────────────────────
export interface FundingCap {
  id: string;
  organizationId: string;
  capNumber: string;                     // e.g., 'CAP-2026-001'
  
  // Scope (any of these can be set)
  fundingSourceId?: string;
  fundingSourceName?: string;
  donorId?: string;
  donorName?: string;
  projectId?: string;
  projectCode?: string;
  activityId?: string;
  revenueType?: RevenueTypeCode;
  restrictionLevel?: RestrictionLevel;
  
  // Limits
  totalCapAmount: number;
  totalCapAmountBase: number;
  currencyCode: string;
  spentAmount: number;
  spentAmountBase: number;
  reservedAmount: number;                // Soft reservations
  availableAmount: number;               // Computed
  utilizationPercent: number;            // Computed
  
  // Validity Period
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
  
  // Alert Configuration
  alertThresholdPercent: number;         // e.g., 80
  alertRecipients: string[];
  
  // Restrictions
  allowsOverrun: boolean;
  overrunRequiresApprovalLevel?: number;
  
  // Audit
  createdById: string;
  approvedById?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Cap Check Result ──────────────────────────────────────────────
export interface CapCheckResult {
  withinCap: boolean;
  capId: string;
  requested: number;
  available: number;
  remaining: number;
  exceededBy: number;
  utilizationAfter: number;
  alertTriggered: boolean;
  alertMessage?: string;
  requiresApproval: boolean;
  reason?: string;
}

// ─── Cap Reservation (Soft Hold) ───────────────────────────────────
export interface FundingCapReservation {
  id: string;
  capId: string;
  reservationAmount: number;
  reservationType: 'HARD' | 'SOFT';
  reservedById: string;
  relatedRecordType: 'REVENUE' | 'BATCH' | 'GRANT';
  relatedRecordId: string;
  expiresAt: string;
  status: 'ACTIVE' | 'CONFIRMED' | 'RELEASED' | 'EXPIRED';
  createdAt: string;
}
```

---

## 6. Workflow Entities

```typescript
// ─── Approval Workflow Configuration ───────────────────────────────
export interface ApprovalWorkflow {
  id: string;
  organizationId: string;
  nameAr: string;
  nameEn: string;
  description?: string;
  
  // Triggers (when this workflow applies)
  triggers: WorkflowTrigger[];
  
  // Approval Chain
  approvalChain: ApprovalStep[];
  
  // Rules
  allowBypass: boolean;
  bypassRoleIds: string[];
  allowDelegation: boolean;
  defaultDelegationRoleId?: string;
  
  // Time Limits
  escalationHours?: number;
  expiryHours?: number;
  
  // Notifications
  notifyOnSubmit: boolean;
  notifyOnApprove: boolean;
  notifyOnReject: boolean;
  
  isActive: boolean;
  priority: number;
  
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowTrigger {
  triggerType: 'REVENUE_TYPE' | 'AMOUNT_RANGE' | 'RESTRICTION' | 'CURRENCY' | 'FUNDING_SOURCE';
  revenueTypes?: RevenueTypeCode[];
  minAmount?: number;
  maxAmount?: number;
  restrictionLevels?: RestrictionLevel[];
  currencyCodes?: string[];
  fundingSourceIds?: string[];
  operator: 'AND' | 'OR';
}

export interface ApprovalStep {
  level: number;
  roleId: string;
  roleNameAr: string;
  roleNameEn: string;
  
  // Conditions
  minAmount?: number;
  maxAmount?: number;
  requiresAllApprovers?: boolean;
  approverCount?: number;
  
  // Time
  timeLimitHours?: number;
  escalationRoleId?: string;
  
  // Delegation
  allowsDelegation: boolean;
  delegationRoleIds: string[];
  
  // Notifications
  notificationTemplate?: string;
}

// ─── Approval Log Entry ───────────────────────────────────────────
export interface ApprovalLogEntry {
  id: string;
  revenueRecordId: string;
  workflowId?: string;
  
  // Action
  action: ApprovalAction;
  level: number;
  
  // Approver
  approverId: string;
  approverName: string;
  delegatedFromId?: string;
  delegatedFromName?: string;
  
  // Details
  comments?: string;
  rejectionReason?: string;
  ipAddress?: string;
  userAgent?: string;
  
  // Timing
  submittedAt: string;
  respondedAt: string;
  responseTimeHours: number;
  
  // State After Action
  newStatus: RevenueStatus;
}

// ─── Dual Signature Rule ───────────────────────────────────────────
export interface DualSignatureRule {
  id: string;
  organizationId: string;
  ruleName: string;
  
  // Conditions
  conditions: {
    amountThreshold: number;
    revenueTypes?: RevenueTypeCode[];
    isRestricted?: boolean;
    fundingSourceTypes?: string[];
  };
  
  // Required Signers
  signers: Array<{
    roleId: string;
    roleNameAr: string;
    roleNameEn: string;
    cannotBeSamePersonAs?: string;
    minSecurityLevel?: number;
  }>;
  
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

## 7. Analytics & Intelligence Entities

```typescript
// ─── Revenue KPI (Computed) ────────────────────────────────────────
export interface RevenueKPI {
  // Volume Metrics
  recordCount: number;
  totalRecognized: number;
  totalCollected: number;
  totalOutstanding: number;
  totalDeferred: number;
  totalRecognizedBase: number;
  totalCollectedBase: number;
  
  // Rates
  collectionRatePct: number;             // collected / recognized
  recognitionRatePct: number;            // recognized / scheduled
  outstandingRatePct: number;            // outstanding / recognized
  
  // Quality Metrics
  concentrationTop10Pct: number;         // Top 10 counterparties %
  averageTransactionSize: number;
  medianTransactionSize: number;
  
  // Recurring Metrics
  recurringRevenuePct: number;
  newRevenuePct: number;
  retentionRate: number;
  
  // Time-Based
  avgDaysToCollect: number;
  avgDaysToRecognize: number;
  onTimeCollectionPct: number;
  
  // Diversity
  revenueTypeCount: number;
  activeCounterpartyCount: number;
  activeProjectCount: number;
  currencyCount: number;
}

// ─── Revenue Breakdown (Grouped Analytics) ─────────────────────────
export interface RevenueBreakdown {
  byType: Array<TypeBreakdown>;
  byProject: Array<ProjectBreakdown>;
  byCounterparty: Array<CounterpartyBreakdown>;
  byRestriction: Array<RestrictionBreakdown>;
  byCurrency: Array<CurrencyBreakdown>;
  byMonth: Array<MonthlyBreakdown>;
  byFundingSource: Array<FundingSourceBreakdown>;
}

export interface TypeBreakdown {
  revenueType: RevenueTypeCode;
  typeNameAr: string;
  typeNameEn: string;
  recordCount: number;
  totalAmount: number;
  totalAmountBase: number;
  totalCollected: number;
  collectionRate: number;
  percentageOfTotal: number;
  growthPct: number;                     // vs previous period
}

export interface ProjectBreakdown {
  projectId: string;
  projectCode: string;
  projectNameAr: string;
  projectNameEn?: string;
  totalAmount: number;
  totalCollected: number;
  recordCount: number;
  percentageOfTotal: number;
}

export interface CounterpartyBreakdown {
  counterpartyId: string;
  counterpartyName: string;
  counterpartyType: CounterpartyType;
  totalAmount: number;
  totalCollected: number;
  recordCount: number;
  percentageOfTotal: number;
  firstTransactionDate: string;
  lastTransactionDate: string;
  isRecurring: boolean;
}

export interface RestrictionBreakdown {
  restrictionLevel: RestrictionLevel;
  totalAmount: number;
  recordCount: number;
  percentageOfTotal: number;
}

export interface CurrencyBreakdown {
  currencyCode: string;
  totalAmount: number;
  exchangeRateAvg: number;
  percentageOfTotal: number;
}

export interface MonthlyBreakdown {
  month: string;                         // 'YYYY-MM'
  totalAmount: number;
  totalCollected: number;
  recordCount: number;
  growthPct: number;
  cumulativeAmount: number;
}

export interface FundingSourceBreakdown {
  fundingSourceId: string;
  fundingSourceName: string;
  totalAmount: number;
  utilizationPct: number;
  remainingCap?: number;
}

// ─── Revenue Forecast (AI-Powered) ─────────────────────────────────
export interface RevenueForecast {
  // Historical Basis
  historicalPeriodMonths: number;
  
  // Forecast Periods
  periods: ForecastPeriod[];
  
  // Aggregate
  totalPredicted: number;
  totalPredictedBase: number;
  
  // Confidence
  confidence: ForecastConfidence;
  confidenceScore: number;               // 0-1
  
  // Methodology
  methodology: 'LINEAR_REGRESSION' | 'EXPONENTIAL_SMOOTHING' | 'SEASONAL_DECOMPOSITION' | 'ARIMA';
  
  // Factors
  factors: {
    seasonality: boolean;
    trend: 'INCREASING' | 'DECREASING' | 'STABLE';
    cyclicality: 'NONE' | 'WEAK' | 'STRONG';
  };
  
  // Variance
  stdDeviation: number;
  
  // Notes
  note?: string;
  warnings?: string[];
  
  generatedAt: string;
}

export interface ForecastPeriod {
  period: string;                        // 'YYYY-MM'
  predicted: number;
  predictedBase: number;
  confidenceLow: number;
  confidenceHigh: number;
  confidenceLowBase: number;
  confidenceHighBase: number;
  isActual: boolean;                     // true if past, false if future
  actualAmount?: number;
}

// ─── Revenue Anomaly (AI-Detected Issues) ──────────────────────────
export interface RevenueAnomaly {
  id: string;
  organizationId: string;
  
  // Classification
  type: AnomalyType;
  severity: AnomalySeverity;
  category: 'AMOUNT' | 'TIMING' | 'COUNTERPARTY' | 'PATTERN' | 'COMPLIANCE';
  
  // Description
  title: string;
  description: string;
  recommendation?: string;
  
  // Affected Records
  affectedRevenueIds: string[];
  affectedPeriod?: {
    fromDate: string;
    toDate: string;
  };
  
  // Metrics
  expectedValue?: number;
  actualValue?: number;
  deviationPct?: number;
  
  // Detection
  detectedAt: string;
  detectionMethod: 'STATISTICAL' | 'ML_MODEL' | 'RULE_BASED';
  confidenceScore: number;
  
  // Status
  status: 'NEW' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE' | 'DISMISSED';
  assignedToId?: string;
  
  // Resolution
  acknowledged: boolean;
  acknowledgedById?: string;
  acknowledgedAt?: string;
  resolution?: string;
  resolvedById?: string;
  resolvedAt?: string;
}

export type AnomalyType =
  | 'CONCENTRATION_RISK'         // Too much from one source
  | 'UNUSUAL_AMOUNT'             // Amount significantly different
  | 'DELAYED_COLLECTION'         // Collection overdue
  | 'AMOUNT_SPIKE'               // Sudden increase
  | 'AMOUNT_DROP'                // Sudden decrease
  | 'DUPLICATE_PAYMENT'          // Possible duplicate
  | 'UNUSUAL_COUNTERPARTY'       // New/suspicious counterparty
  | 'CURRENCY_MISMATCH'          // Currency anomaly
  | 'PATTERN_BREAK'              // Pattern deviation
  | 'MISSING_DOCUMENTATION'      // Required docs missing
  | 'COMPLIANCE_VIOLATION'       // Rule violation
  | 'FUNDING_CAP_BREACH';        // Cap exceeded

// ─── Intelligence Snapshot (Complete Picture) ─────────────────────
export interface IntelligenceSnapshot {
  organizationId: string;
  snapshotDate: string;
  
  kpis: RevenueKPI;
  breakdowns: RevenueBreakdown;
  forecast: RevenueForecast;
  anomalies: RevenueAnomaly[];
  insights: AIInsight[];
  
  // Top Performers
  topCounterparties: CounterpartyBreakdown[];
  topProjects: ProjectBreakdown[];
  topRevenueTypes: TypeBreakdown[];
  
  // Alerts
  urgentAlerts: AnomalyAlert[];
  
  generatedAt: string;
  expiresAt: string;
}

export interface AIInsight {
  id: string;
  category: 'OPPORTUNITY' | 'RISK' | 'TREND' | 'RECOMMENDATION';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  actionItems?: string[];
  relatedRevenueIds?: string[];
  generatedAt: string;
}

export interface AnomalyAlert {
  anomalyId: string;
  severity: AnomalySeverity;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
}
```

---

## 8. Report Configuration Entities

```typescript
// ─── Report Configuration (Saved Templates) ────────────────────────
export interface RevenueReportConfig {
  id: string;
  organizationId: string;
  nameAr: string;
  nameEn: string;
  description?: string;
  
  // Type
  type: ReportType;
  
  // Data Filters
  filters: ReportFilters;
  
  // Grouping & Sorting
  groupBy?: ReportGroupBy;
  sortBy?: ReportSortBy;
  sortOrder?: 'ASC' | 'DESC';
  
  // Display
  columns: string[];
  showTotals: boolean;
  showSubtotals: boolean;
  showComparisons: boolean;
  comparisonPeriod?: 'PREVIOUS_PERIOD' | 'PREVIOUS_YEAR' | 'CUSTOM';
  
  // Output Format
  format: ReportFormat;
  includeCharts: boolean;
  chartTypes?: string[];
  
  // Scheduling
  isScheduled: boolean;
  scheduleCron?: string;                 // e.g., '0 0 1 * *' (monthly)
  recipients: string[];
  deliveryMethods: Array<'EMAIL' | 'DASHBOARD' | 'WEBHOOK'>;
  
  // Sharing
  isPublic: boolean;
  sharedWithUserIds: string[];
  sharedWithRoleIds: string[];
  
  // Cache
  cacheEnabled: boolean;
  cacheDurationMinutes?: number;
  
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportFilters {
  dateRange: {
    fromDate: string;
    toDate: string;
  };
  revenueTypes?: RevenueTypeCode[];
  projectIds?: string[];
  activityIds?: string[];
  counterpartyIds?: string[];
  statusFilter?: RevenueStatus[];
  currencyCodes?: string[];
  restrictionLevels?: RestrictionLevel[];
  minAmount?: number;
  maxAmount?: number;
  isRestricted?: boolean;
  isRecurring?: boolean;
  fundingSourceIds?: string[];
  customFilters?: Array<{
    field: string;
    operator: 'EQ' | 'NEQ' | 'GT' | 'LT' | 'GTE' | 'LTE' | 'IN' | 'CONTAINS';
    value: any;
  }>;
}

export type ReportGroupBy =
  | 'REVENUE_TYPE'
  | 'PROJECT'
  | 'COUNTERPARTY'
  | 'CURRENCY'
  | 'RESTRICTION'
  | 'MONTH'
  | 'QUARTER'
  | 'YEAR'
  | 'STATUS'
  | 'FUNDING_SOURCE';

export type ReportSortBy =
  | 'AMOUNT'
  | 'DATE'
  | 'COUNTERPARTY'
  | 'PROJECT'
  | 'COLLECTION_RATE'
  | 'OUTSTANDING';

export type ReportFormat = 'TABLE' | 'PIVOT' | 'CHART' | 'CSV' | 'EXCEL' | 'PDF' | 'JSON';

// ─── Report Execution Result ───────────────────────────────────────
export interface ReportExecutionResult {
  reportId: string;
  executionId: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  
  // Data
  data: any[];
  summary?: {
    totalAmount: number;
    totalCount: number;
    [key: string]: any;
  };
  
  // Metadata
  rowCount: number;
  executionTimeMs: number;
  
  // Output
  downloadUrl?: string;
  expiresAt?: string;
  
  // Errors
  error?: string;
  warnings?: string[];
  
  generatedAt: string;
}
```

---

## 9. Sync & Integration Entities

```typescript
// ─── Revenue Sync Status ───────────────────────────────────────────
export interface RevenueSyncStatus {
  revenueRecordId: string;
  
  // Ledger Sync
  ledgerSynced: boolean;
  ledgerEntryId?: string;
  ledgerEntryNumber?: string;
  ledgerSyncAt?: string;
  ledgerSyncError?: string;
  
  // Budget Sync
  budgetSynced: boolean;
  budgetLineId?: string;
  budgetSyncAt?: string;
  budgetSyncError?: string;
  
  // Grant Sync
  grantSynced: boolean;
  grantDisbursementId?: string;
  grantSyncAt?: string;
  grantSyncError?: string;
  
  // Endowment Sync
  endowmentSynced: boolean;
  endowmentDistributionId?: string;
  endowmentSyncAt?: string;
  endowmentSyncError?: string;
  
  // Program Sync
  programSynced: boolean;
  programAllocationId?: string;
  programSyncAt?: string;
  programSyncError?: string;
  
  // Overall
  allSynced: boolean;
  lastSyncAttemptAt?: string;
  retryCount: number;
  nextRetryAt?: string;
  lastError?: string;
}

// ─── Ledger Link (Revenue-to-Journal Mapping) ──────────────────────
export interface RevenueLedgerLink {
  id: string;
  revenueRecordId: string;
  journalEntryId: string;
  journalEntryLineId?: string;
  
  // Mapping Details
  amount: number;
  amountType: 'RECOGNITION' | 'COLLECTION' | 'DEFERRAL' | 'ADJUSTMENT';
  
  postedAt: string;
  postedById: string;
}

// ─── Grant Link ────────────────────────────────────────────────────
export interface RevenueGrantLink {
  id: string;
  revenueRecordId: string;
  grantId: string;
  grantDisbursementId?: string;
  
  // Allocation
  allocatedAmount: number;
  allocatedAmountBase: number;
  currencyCode: string;
  
  // Utilization
  utilizedAmount: number;
  remainingAmount: number;
  utilizationPct: number;
  
  createdAt: string;
  updatedAt: string;
}

// ─── Endowment Link ────────────────────────────────────────────────
export interface RevenueEndowmentLink {
  id: string;
  revenueRecordId: string;
  endowmentId: string;
  distributionId?: string;
  
  // Distribution Type
  distributionType: 'INCOME' | 'CAPITAL' | 'PRINCIPAL_REPAYMENT';
  amount: number;
  amountBase: number;
  currencyCode: string;
  
  // Allocation
  allocatedToActivityId?: string;
  allocationPurpose?: string;
  
  createdAt: string;
}

// ─── Budget Link ───────────────────────────────────────────────────
export interface RevenueBudgetLink {
  id: string;
  revenueRecordId: string;
  budgetLineId: string;
  
  // Budget Impact
  budgetCategory: 'CAPITAL' | 'OPERATIONAL' | 'RESERVE' | 'EMERGENCY';
  impactAmount: number;
  impactAmountBase: number;
  currencyCode: string;
  
  // Budget Period
  budgetPeriodId: string;
  fiscalYearId: string;
  
  createdAt: string;
}
```

---

## 10. Permission & Security Entities

```typescript
// ─── User Permission (Revenue Module) ──────────────────────────────
export interface RevenuePermission {
  id: string;
  code: PermissionCode;
  nameAr: string;
  nameEn: string;
  description: string;
  category: PermissionCategory;
}

export type PermissionCode =
  // Record Operations
  | 'REVENUE_CREATE'
  | 'REVENUE_READ'
  | 'REVENUE_READ_OWN'
  | 'REVENUE_READ_TEAM'
  | 'REVENUE_EDIT'
  | 'REVENUE_EDIT_OWN'
  | 'REVENUE_DELETE'
  | 'REVENUE_VOID'
  | 'REVENUE_COLLECT'
  | 'REVENUE_EXPORT'
  
  // Batch Operations
  | 'BATCH_CREATE'
  | 'BATCH_READ'
  | 'BATCH_EDIT'
  | 'BATCH_POST'
  | 'BATCH_VOID'
  | 'BATCH_IMPORT'
  
  // Approval Operations
  | 'REVENUE_APPROVE'
  | 'REVENUE_APPROVE_LOW_VALUE'
  | 'REVENUE_APPROVE_HIGH_VALUE'
  | 'REVENUE_REJECT'
  | 'REVENUE_BYPASS_APPROVAL'
  
  // Schedule Operations
  | 'SCHEDULE_CREATE'
  | 'SCHEDULE_EDIT'
  | 'SCHEDULE_VERIFY_CONDITION'
  | 'SCHEDULE_PROCESS_PAYMENT'
  
  // Cap Operations
  | 'FUNDING_CAP_VIEW'
  | 'FUNDING_CAP_CREATE'
  | 'FUNDING_CAP_EDIT'
  | 'FUNDING_CAP_DELETE'
  | 'FUNDING_CAP_BYPASS'
  
  // Report Operations
  | 'REPORT_REVENUE_BASIC'
  | 'REPORT_REVENUE_ADVANCED'
  | 'REPORT_REVENUE_CONFIDENTIAL'
  | 'REPORT_REVENUE_FINANCIAL'
  | 'REPORT_REVENUE_EXECUTIVE'
  
  // Admin Operations
  | 'REVENUE_ADMIN'
  | 'WORKFLOW_CONFIGURE'
  | 'PERMISSION_GRANT'
  | 'AUDIT_LOG_VIEW'
  | 'INTELLIGENCE_VIEW'
  | 'ANOMALY_INVESTIGATE';

export type PermissionCategory =
  | 'RECORD'
  | 'BATCH'
  | 'APPROVAL'
  | 'SCHEDULE'
  | 'CAP'
  | 'REPORT'
  | 'ADMIN';

// ─── Role Permission Mapping ──────────────────────────────────────
export interface RolePermissionMap {
  id: string;
  roleId: string;
  roleCode: string;                       // e.g., 'FINANCE_OFFICER'
  roleNameAr: string;
  roleNameEn: string;
  
  permissions: PermissionCode[];
  
  // Activity-Level Scoping
  activityScopes: Array<{
    activityId: string;
    permissions: PermissionCode[];
  }>;
  
  // Account-Level Scoping
  accountScopes: Array<{
    accountId: string;
    accountCode: string;
    permissions: PermissionCode[];
  }>;
  
  // Project-Level Scoping
  projectScopes: Array<{
    projectId: string;
    projectCode: string;
    permissions: PermissionCode[];
  }>;
  
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Activity-Level Permission ────────────────────────────────────
export interface ActivityPermission {
  id: string;
  userId: string;
  roleId: string;
  activityId: string;
  activityCode: string;
  
  permissions: PermissionCode[];
  validFrom: string;
  validTo?: string;
  
  grantedById: string;
  grantedAt: string;
}

// ─── Account-Level Permission ──────────────────────────────────────
export interface AccountPermission {
  id: string;
  userId: string;
  roleId: string;
  accountId: string;
  accountCode: string;
  
  permissions: PermissionCode[];
  accessLevel: 'READ' | 'WRITE' | 'APPROVE' | 'FULL';
  validFrom: string;
  validTo?: string;
  
  grantedById: string;
  grantedAt: string;
}
```

---

## 11. Audit & Activity Log

```typescript
// ─── Revenue Activity Log ──────────────────────────────────────────
export interface RevenueActivityLog {
  id: string;
  organizationId: string;
  
  // What changed
  entityType: 'REVENUE_RECORD' | 'BATCH' | 'SCHEDULE' | 'CAP' | 'WORKFLOW';
  entityId: string;
  entityNumber: string;                  // e.g., 'REV-2026-00001'
  
  // Action
  action: ActivityAction;
  actionLabel: string;                   // Human-readable
  
  // Changes
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    fieldLabel: string;
  }>;
  
  // Context
  userId: string;
  userName: string;
  userRole: string;
  
  // Technical
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  
  // Additional Data
  metadata: Record<string, any>;
  
  createdAt: string;
}

export type ActivityAction =
  | 'CREATED'
  | 'UPDATED'
  | 'DELETED'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'POSTED'
  | 'COLLECTED'
  | 'PARTIALLY_COLLECTED'
  | 'RECOGNIZED'
  | 'VOIDED'
  | 'CONDITIONS_MET'
  | 'CONDITIONS_FAILED'
  | 'BATCH_CREATED'
  | 'BATCH_POSTED'
  | 'BATCH_VOIDED'
  | 'SCHEDULE_CREATED'
  | 'SCHEDULE_PROCESSED'
  | 'CAP_CREATED'
  | 'CAP_UPDATED'
  | 'CAP_BREACHED'
  | 'WORKFLOW_TRIGGERED'
  | 'EXPORTED'
  | 'PRINTED'
  | 'EMAIL_SENT'
  | 'LOGIN'
  | 'PERMISSION_GRANTED'
  | 'PERMISSION_REVOKED';
```

---

## 12. Metadata Type Extensions

```typescript
// ─── Revenue Metadata (Extensible) ─────────────────────────────────
export interface RevenueMetadata {
  // Donor Information
  donorSegment?: string;                 // e.g., 'MAJOR_DONOR', 'REGULAR', 'OCCASIONAL'
  donorAcquisitionChannel?: string;      // e.g., 'WEBSITE', 'EVENT', 'REFERRAL'
  donorLifetimeValue?: number;
  donorFirstGiftDate?: string;
  donorLargestGiftAmount?: number;
  
  // Campaign Information
  campaignCode?: string;
  campaignName?: string;
  appealsCode?: string;
  appealName?: string;
  mailingCode?: string;
  
  // Tax & Compliance
  giftAidEligible?: boolean;
  giftAidAmount?: number;
  taxReceiptNumber?: string;
  taxReceiptIssued?: boolean;
  taxReceiptIssuedAt?: string;
  taxDeductibleAmount?: number;
  
  // Payment Processing
  paymentProcessor?: string;             // e.g., 'STRIPE', 'PAYPAL'
  paymentProcessorFee?: number;
  netAmount?: number;
  
  // Recurring
  recurringStartDate?: string;
  recurringEndDate?: string;
  recurringInstallmentNumber?: number;
  recurringTotalInstallments?: number;
  
  // Gift Type
  isTributeGift?: boolean;
  tributeType?: 'IN_HONOR' | 'IN_MEMORY';
  tributeHonoreeName?: string;
  tributeNotifyRecipient?: boolean;
  tributeRecipientName?: string;
  tributeRecipientContact?: string;
  
  // Matching Gifts
  matchingGiftEligible?: boolean;
  matchingGiftProvider?: string;
  matchingGiftAmount?: number;
  matchingGiftStatus?: 'PENDING' | 'SUBMITTED' | 'RECEIVED' | 'DENIED';
  
  // Anonymous/Privacy
  anonymousDonation?: boolean;
  publicRecognitionAllowed?: boolean;
  
  // Endowments
  endowmentPurpose?: string;
  endowmentSpendable?: boolean;
  endowmentSpendableAmount?: number;
  
  // Programs
  programServiceArea?: string;
  beneficiaryDemographics?: Record<string, any>;
  
  // Custom Fields
  customFields?: Record<string, any>;
  
  // Tags
  tags?: string[];
  
  // Integration IDs
  externalSystemId?: string;
  externalSystemName?: string;
  lastSyncAt?: string;
  
  // Allow any additional custom data
  [key: string]: any;
}
```

---

## 13. Validation Schemas (Zod-like Examples)

```typescript
// ─── Create Revenue Record Schema ──────────────────────────────────
export const CreateRevenueRecordSchema = {
  revenueType: 'RevenueTypeCode',
  counterpartyName: 'string (required, 1-255)',
  counterpartyType: 'CounterpartyType',
  amount: 'number (positive, max 18 digits)',
  currencyCode: 'string (3 chars, valid currency code)',
  revenueDate: 'date (ISO 8601, not future)',
  
  // Optional
  streamId: 'UUID (optional)',
  projectId: 'UUID (optional)',
  activityId: 'UUID (optional)',
  costCenterId: 'UUID (optional)',
  
  // For grants
  grantId: 'UUID (optional)',
  fundingScheduleType: 'FundingScheduleType (optional)',
  
  // For conditional
  conditionsDetails: 'string (optional, max 2000)',
  
  // References
  referenceNumber: 'string (optional, max 100)',
  description: 'string (optional, max 1000)',
  
  // Metadata
  metadata: 'RevenueMetadata (optional)',
};

// ─── Create Batch Schema ───────────────────────────────────────────
export const CreateBatchSchema = {
  batchDate: 'date (required)',
  currencyCode: 'string (required, 3 chars)',
  
  entries: 'Array<BatchEntry> (required, min 2)',
  
  // Entry structure
  entry: {
    accountId: 'UUID (required, valid chart_of_accounts id)',
    debit: 'number (optional, positive)',
    credit: 'number (optional, positive)',
    projectId: 'UUID (optional)',
    description: 'string (optional, max 500)',
  },
  
  // Validation
  validation: {
    entries: 'must have at least 2 entries',
    balanced: 'totalDebit must equal totalCredit',
    accounts: 'all accountIds must exist and be active',
    amounts: 'at least one of debit/credit must be > 0',
  },
  
  // Optional
  description: 'string (optional, max 500)',
  applyFundingCap: 'boolean (optional, default false)',
  fundingCapId: 'UUID (optional, required if applyFundingCap)',
};
```

---

**Document Version**: 1.0.0  
**Last Updated**: 2026-08-30  
**Total Interfaces**: 50+  
**Total Type Aliases**: 15+  
**Compliance**: IPSAS 23, ASC 958, IFRS 15, Sphere/CHS

---

## Quick Reference Index

| # | Entity | Purpose |
|---|--------|---------|
| 1 | `RevenueStream` | Master classification of revenue types |
| 2 | `RevenueRecord` | Single revenue transaction (main entity) |
| 3 | `RevenueBatch` | Multi-entry journal batch |
| 4 | `RevenueBatchEntry` | Line item in a batch |
| 5 | `RevenueSchedule` | Installments/conditional payments |
| 6 | `RevenueMilestone` | Milestones for conditional funding |
| 7 | `FundingCap` | Ceiling caps for funding sources |
| 8 | `ApprovalWorkflow` | Multi-level approval config |
| 9 | `RevenueKPI` | Computed metrics |
| 10 | `RevenueBreakdown` | Grouped analytics |
| 11 | `RevenueForecast` | AI-powered predictions |
| 12 | `RevenueAnomaly` | AI-detected issues |
| 13 | `IntelligenceSnapshot` | Complete picture |
| 14 | `RevenueReportConfig` | Saved report templates |
| 15 | `RevenuePermission` | RBAC permissions |
| 16 | `RevenueActivityLog` | Complete audit trail |
