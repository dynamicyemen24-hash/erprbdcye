/**
 * NexoraOS™ — Core Domain Types
 * Shared type definitions for all operational engines
 */

// ─── Pagination ────────────────────────────────────────
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ─── API Response ──────────────────────────────────────
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// ─── Auth Context ──────────────────────────────────────
export interface AuthContext {
  userId: string;
  email: string;
  role: string;
  orgId: string;
  securityLevel: number;
}

// ─── Finance Types ─────────────────────────────────────
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type TransactionType = 'JOURNAL_ENTRY' | 'PAYMENT' | 'RECEIPT' | 'TRANSFER' | 'ADJUSTMENT';
export type TransactionStatus = 'DRAFT' | 'POSTED' | 'REVERSED' | 'VOIDED';
export type FiscalYearStatus = 'OPEN' | 'CLOSING' | 'CLOSED';

export interface LedgerLine {
  accountId: string;
  accountCode?: string;
  debit: number;
  credit: number;
  description?: string;
  projectId?: string;
  activityId?: string;
  partyId?: string;
  currencyCode?: string;
  exchangeRate?: number;
}

export interface VoucherEntry {
  organizationId: string;
  transactionNumber: string;
  transactionType: TransactionType;
  description: string;
  referenceNumber?: string;
  projectId?: string;
  fiscalYearId?: string;
  lines: LedgerLine[];
}

export interface TrialBalanceEntry {
  accountId: string;
  accountCode: string;
  nameAr: string;
  nameEn: string;
  accountType: AccountType;
  totalDebit: number;
  totalCredit: number;
  netBalance: number;
}

export interface FinancialStatement {
  status: string;
  standard: string;
  organizationId: string;
  generatedAt: string;
  accounts: TrialBalanceEntry[];
}

// ─── Project Types ─────────────────────────────────────
export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';

export interface ProjectCreate {
  organizationId: string;
  programId?: string;
  projectCode: string;
  nameAr: string;
  nameEn: string;
  statusCode?: ProjectStatus;
  budget?: number;
  startDate?: string;
  endDate?: string;
}

export interface MilestoneCreate {
  organizationId: string;
  projectId: string;
  titleAr: string;
  titleEn?: string;
  targetDate?: string;
  status?: MilestoneStatus;
}

export interface EVMData {
  project: any;
  pv: number;  // Planned Value
  ev: number;  // Earned Value
  ac: number;  // Actual Cost
  cpi: number; // Cost Performance Index
  spi: number; // Schedule Performance Index
  eac: number; // Estimate at Completion
  etc: number; // Estimate to Complete
  vac: number; // Variance at Completion
  percentComplete: number;
}

// ─── Procurement Types ─────────────────────────────────
export type RFQStatus = 'DRAFT' | 'OPEN' | 'EVALUATING' | 'AWARDED' | 'CLOSED' | 'CANCELLED';
export type POStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CLOSED' | 'CANCELLED';
export type BidStatus = 'SUBMITTED' | 'EVALUATING' | 'ACCEPTED' | 'REJECTED';

export interface RFQCreate {
  organizationId: string;
  titleAr: string;
  titleEn?: string;
  projectId?: string;
  estimatedValue?: number;
  currencyCode?: string;
  submissionDeadline?: string;
}

export interface VendorBidCreate {
  rfqId: string;
  vendorId: string;
  quotedAmount: number;
  currencyCode?: string;
  technicalScore?: number;
  deliveryDays?: number;
  notes?: string;
}

// ─── Service Delivery Types ────────────────────────────
export type ServiceType = 'EDUCATION' | 'HEALTH' | 'FOOD' | 'SHELTER' | 'LIVELIHOOD' | 'PROTECTION' | 'WASH' | 'OTHER';
export type AidType = 'CASH' | 'IN_KIND' | 'SERVICE' | 'VOUCHER';

export interface BeneficiaryCreate {
  organizationId: string;
  fullNameAr: string;
  fullNameEn?: string;
  gender?: string;
  birthDate?: string;
  familyMembersCount?: number;
  vulnerabilityStatus?: string;
  governorate?: string;
  district?: string;
}

export interface ServiceDeliveryCreate {
  organizationId: string;
  projectId?: string;
  serviceType: ServiceType;
  beneficiaryCount: number;
  deliveryDate: string;
  location?: string;
  officerName?: string;
  notes?: string;
}

// ─── Audit Types ───────────────────────────────────────
export interface AuditLogEntry {
  organizationId: string;
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT' | 'LOGIN' | 'LOGOUT';
  tableName: string;
  recordId?: string;
  ipAddress?: string;
  details?: Record<string, any>;
}
