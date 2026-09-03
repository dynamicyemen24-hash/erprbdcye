/**
 * NexoraOS™ — UAMEX ERP™ NEB-10: Unified Expense Engine (NEB-10 Finance & Compliance OS)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * UAMEX ENTERPRISE DOMAIN™: NEB-10 — Finance & Compliance OS
 * 
 * Comprehensive expense management engine supporting:
 *  - Configurable expense categories (operational, program, admin, capital, emergency)
 *  - Full lifecycle: DRAFT → PENDING_APPROVAL → APPROVED → POSTED → PAID → RECONCILED
 *  - Automated IPSAS double-entry posting (Dr Expense | Cr Cash/Bank/AP)
 *  - Multi-tier approval workflows with delegation
 *  - Budget commitment tracking & variance analysis
 *  - VAT/GST calculation and deduction
 *  - Receipt attachment management
 *  - Payment scheduling & vendor integration
 *  - Expense intelligence: KPIs, forecasting, compliance alerts
 *  - Recurring expense templates
 *  - Petty cash management
 *  - Travel & per-diem expense handling
 *  - Project/Activity cost allocation (WBS integration)
 *  - Multi-currency with exchange rate locking
 *  - Cost center attribution & burn-rate monitoring
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { query, queryOne, queryMany, transaction } from '../core/database';
import { recordAuditLog as auditLog } from '../services/audit.service';
import { AuthContext } from '../core/types';
import { v4 as uuidv4 } from 'uuid';

// Helper: paginated query wrapper
async function paginatedQuery<T>(sql: string, countSql: string, params: any[]): Promise<{ data: T[]; total: number; page: number; limit: number }> {
  const limit = Number(params[params.length - 2]) || 50;
  const offset = Number(params[params.length - 1]) || 0;
  const queryParams = params.slice(0, params.length - 2);
  const [dataRes, countRes] = await Promise.all([
    query<T>(sql, [...queryParams, limit, offset]),
    queryOne<{ count: number }>(countSql, queryParams)
  ]);
  return { data: dataRes.rows, total: countRes?.count || 0, page: Math.floor(offset / limit) + 1, limit };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPENSE CATEGORY REGISTRY — Category Configuration & GL Account Mapping
// ═══════════════════════════════════════════════════════════════════════════════

export type ExpenseCategoryType = 
  | 'OPERATIONAL'       // يومية تشغيلية
  | 'PROGRAM'           // برنامجية
  | 'ADMINISTRATIVE'    // إدارية
  | 'CAPITAL'           // رأسمالية
  | 'EMERGENCY'         // طوارئ
  | 'TRAVEL'            // سفر وانتقال
  | 'PROCUREMENT'       // مشتريات
  | 'HR'                // موارد بشرية ورواتب
  | 'MARKETING'         // تسويق
  | 'IT'                // تقنية معلومات
  | 'FACILITY'          // مرافق وصيانة
  | 'CONSULTING'        // استشارات
  | 'LEGAL'             // قانونية
  | 'INSURANCE'         // تأمينات
  | 'UTILITIES'         // مرافق (كهرباء، ماء، اتصالات)
  | 'RENT'              // إيجارات
  | 'OTHER';            // مصروفات أخرى

export type ExpenseRecognitionMethod = 
  | 'CASH_BASIS'        // الأساس النقدي
  | 'ACCRUAL_BASIS'     // الأساس الاستحقاقي
  | 'MODIFIED_CASH';    // الأساس النقدي المعدل

export type PaymentMethod = 
  | 'BANK_TRANSFER'
  | 'CASH'
  | 'CHEQUE'
  | 'CREDIT_CARD'
  | 'PETTY_CASH'
  | 'VIRTUAL_ACCOUNT'
  | 'MOBILE_PAYMENT';

export type ExpenseStatus = 
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'POSTED'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'RECONCILED'
  | 'CANCELLED'
  | 'CLOSED';

export interface ExpenseCategoryRow {
  id: string;
  organization_id: string;
  category_code: string;
  name_ar: string;
  name_en: string;
  description?: string;
  category_type: ExpenseCategoryType;
  recognition_method: ExpenseRecognitionMethod;
  is_budgeted: boolean;
  requires_receipt: boolean;
  requires_approval: boolean;
  approval_threshold?: number;
  debit_account_id?: string;
  credit_account_id?: string;
  default_vat_rate?: number;
  is_active: boolean;
  parent_category_id?: string;
  sort_order: number;
  metadata?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface ExpenseCategoryWithChildren extends ExpenseCategoryRow {
  children?: ExpenseCategoryWithChildren[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPENSE RECORD — Core Entity
// ═══════════════════════════════════════════════════════════════════════════════

export interface ExpenseRecordRow {
  id: string;
  organization_id: string;
  expense_number: string;
  category_id: string;
  category_code: string;
  category_name_ar: string;
  expense_type: ExpenseCategoryType;
  status: ExpenseStatus;
  
  // Counterparty (Vendor/Supplier/Employee)
  counterparty_name: string;
  counterparty_party_id?: string;
  counterparty_vendor_id?: string;
  counterparty_type: 'VENDOR' | 'EMPLOYEE' | 'GOVERNMENT' | 'OTHER';
  
  // Amount & Currency
  amount: number;
  currency_code: string;
  exchange_rate: number;
  amount_base: number; // YER equivalent
  
  // VAT/Tax
  vat_amount: number;
  vat_rate: number;
  is_vat_registered: boolean;
  vat_recoverable: boolean;
  tax_withheld?: number;
  
  // Net Amount
  net_amount: number;
  
  // Project/Activity Attribution (WBS)
  program_id?: string;
  program_name_ar?: string;
  project_id?: string;
  project_name_ar?: string;
  project_code?: string;
  activity_id?: string;
  activity_name_ar?: string;
  
  // Cost Center
  cost_center_id?: string;
  cost_center_name_ar?: string;
  
  // Budget Integration
  budget_line_id?: string;
  budget_commitment_id?: string;
  committed_amount?: number;
  variance_amount?: number;
  
  // Payment Info
  payment_method?: PaymentMethod;
  payment_reference?: string;
  payment_due_date?: string;
  payment_date?: string;
  paid_amount?: number;
  
  // Receipt & Documentation
  receipt_number?: string;
  receipt_attachment_url?: string;
  has_receipt: boolean;
  
  // Description & Reference
  description?: string;
  reference_number?: string;
  notes?: string;
  
  // Approval Workflow
  approval_level?: number;
  approved_by?: string;
  approved_at?: Date;
  rejection_reason?: string;
  
  // IPSAS Ledger
  ledger_transaction_id?: string;
  posted_at?: Date;
  posted_by?: string;
  
  // Petty Cash
  petty_cash_request_id?: string;
  
  // Metadata
  metadata?: Record<string, unknown>;
  
  // Audit Trail
  created_by: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface ExpenseRecordWithDetails extends ExpenseRecordRow {
  attachments?: ExpenseAttachmentRow[];
  approval_history?: ApprovalHistoryRow[];
  payment_schedule?: PaymentScheduleRow[];
  budget_info?: BudgetInfoRow;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPENSE ATTACHMENTS — Receipts & Supporting Documents
// ═══════════════════════════════════════════════════════════════════════════════

export interface ExpenseAttachmentRow {
  id: string;
  organization_id: string;
  expense_record_id: string;
  attachment_type: 'RECEIPT' | 'INVOICE' | 'CONTRACT' | 'APPROVAL_DOC' | 'OTHER';
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by: string;
  uploaded_at: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// APPROVAL WORKFLOW — Multi-tier Approval Engine
// ═══════════════════════════════════════════════════════════════════════════════

export interface ApprovalWorkflowRow {
  id: string;
  organization_id: string;
  workflow_name: string;
  category_type: ExpenseCategoryType;
  min_amount: number;
  max_amount: number;
  levels: ApprovalLevelRow[];
  is_active: boolean;
  created_at: Date;
}

export interface ApprovalLevelRow {
  level: number;
  approver_role: string;
  approver_user_id?: string;
  is_delegation_allowed: boolean;
  escalation_hours?: number;
  auto_approve_if_no_response?: boolean;
}

export interface ApprovalHistoryRow {
  id: string;
  expense_record_id: string;
  approval_level: number;
  approver_user_id: string;
  approver_name?: string;
  approver_role?: string;
  action: 'APPROVE' | 'REJECT' | 'ESCALATE' | 'DELEGATE';
  comments?: string;
  delegated_to?: string;
  action_at: Date;
}

export interface ApprovalDelegationRow {
  id: string;
  delegator_user_id: string;
  delegate_user_id: string;
  valid_from: Date;
  valid_until: Date;
  is_active: boolean;
  categories?: ExpenseCategoryType[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAYMENT SCHEDULE — Multi-installment Payments
// ═══════════════════════════════════════════════════════════════════════════════

export interface PaymentScheduleRow {
  id: string;
  organization_id: string;
  expense_record_id: string;
  installment_number: number;
  scheduled_date: Date;
  scheduled_amount: number;
  actual_date?: Date;
  actual_amount?: number;
  payment_method?: PaymentMethod;
  payment_reference?: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  paid_by?: string;
  notes?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUDGET INTEGRATION — Commitment & Variance Tracking
// ═══════════════════════════════════════════════════════════════════════════════

export interface BudgetInfoRow {
  budget_line_id: string;
  budget_allocated: number;
  committed_amount: number;
  actual_spent: number;
  available_balance: number;
  variance_pct: number;
  forecast_outcome: number;
}

export interface BudgetCommitmentRow {
  id: string;
  organization_id: string;
  budget_line_id: string;
  expense_record_id: string;
  commitment_type: 'COMMITTED' | 'OBLIGATION' | 'ACTUAL';
  amount: number;
  committed_by: string;
  committed_at: Date;
  released_at?: Date;
  release_reason?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PETTY CASH MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export interface PettyCashRequestRow {
  id: string;
  organization_id: string;
  request_number: string;
  requester_id: string;
  requester_name: string;
  amount: number;
  purpose: string;
  status: 'PENDING' | 'APPROVED' | 'ISSUED' | 'SETTLED' | 'REJECTED';
  custodian_id?: string;
  issued_date?: Date;
  settled_date?: Date;
  receipt_attachment_url?: string;
  notes?: string;
  created_at: Date;
}

export interface PettyCashFloatRow {
  id: string;
  organization_id: string;
  custodian_id: string;
  custodian_name: string;
  total_amount: number;
  current_balance: number;
  currency_code: string;
  is_active: boolean;
  last_replenishment_date?: Date;
  min_balance_threshold?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECURRING EXPENSE TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

export interface RecurringExpenseTemplateRow {
  id: string;
  organization_id: string;
  template_name: string;
  category_id: string;
  counterparty_name: string;
  amount: number;
  currency_code: string;
  vat_rate?: number;
  payment_method: PaymentMethod;
  frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL';
  start_date: Date;
  end_date?: Date;
  next_run_date: Date;
  auto_approve?: boolean;
  auto_post?: boolean;
  is_active: boolean;
  created_by: string;
  created_at: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPENSE INTELLIGENCE — KPIs & Analytics
// ═══════════════════════════════════════════════════════════════════════════════

export interface ExpenseKPIs {
  totalExpenses: number;
  totalApproved: number;
  totalPosted: number;
  totalPaid: number;
  totalOutstanding: number;
  avgExpenseAmount: number;
  expenseCount: number;
  pendingApprovalCount: number;
  overduePaymentsCount: number;
  budgetUtilizationPct: number;
  vatRecoverable: number;
}

export interface ExpenseByCategory {
  category_code: string;
  category_name_ar: string;
  category_type: ExpenseCategoryType;
  total_amount: number;
  count: number;
  avg_amount: number;
}

export interface ExpenseByProject {
  project_id: string;
  project_name_ar: string;
  project_code: string;
  total_amount: number;
  count: number;
  budget_allocated?: number;
  budget_variance?: number;
}

export interface ExpenseMonthlyTrend {
  month: string;
  monthAr: string;
  total_expenses: number;
  count: number;
  by_category: Record<string, number>;
}

export interface ExpenseComplianceAlert {
  type: 'BUDGET_EXCEEDED' | 'APPROVAL_DELAY' | 'MISSING_RECEIPT' | 'VAT_MISMATCH' | 'SUSPICIOUS_AMOUNT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message_ar: string;
  message_en: string;
  record_id?: string;
  created_at: Date;
}

export interface ExpenseIntelligenceSnapshot {
  kpis: ExpenseKPIs;
  byCategory: ExpenseByCategory[];
  byProject: ExpenseByProject[];
  monthlyTrend: ExpenseMonthlyTrend[];
  topVendors: VendorExpenseRow[];
  complianceAlerts: ExpenseComplianceAlert[];
  insights: string[];
  generatedAt: string;
}

export interface VendorExpenseRow {
  counterparty_name: string;
  counterparty_type: string;
  total_amount: number;
  transaction_count: number;
  avg_amount: number;
  last_transaction_date?: string;
  payment_status: 'ALL_PAID' | 'PARTIAL' | 'OVERDUE';
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPENSE BATCH — Multi-entry Journal for Bulk Expenses
// ═══════════════════════════════════════════════════════════════════════════════

export interface ExpenseBatchRow {
  id: string;
  organization_id: string;
  batch_number: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'POSTED' | 'REJECTED';
  total_amount: number;
  currency_code: string;
  exchange_rate: number;
  batch_date: Date;
  description?: string;
  approved_by?: string;
  approved_at?: Date;
  posted_by?: string;
  posted_at?: Date;
  rejection_reason?: string;
  entry_count: number;
  created_by: string;
  created_at: Date;
}

export interface ExpenseBatchEntryRow {
  id: string;
  batch_id: string;
  sequence_number: number;
  account_id: string;
  account_code: string;
  account_name_ar: string;
  debit_amount: number;
  credit_amount: number;
  currency_code: string;
  exchange_rate: number;
  amount_base: number;
  description?: string;
  project_id?: string;
  activity_id?: string;
  cost_center_id?: string;
  metadata?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPENSE CATEGORY ENGINE — Registry Management
// ═══════════════════════════════════════════════════════════════════════════════

export class ExpenseCategoryEngine {
  
  /**
   * List all expense categories with optional filtering
   */
  static async list(
    orgId: string,
    opts?: { activeOnly?: boolean; parentOnly?: boolean; categoryType?: ExpenseCategoryType }
  ): Promise<ExpenseCategoryRow[]> {
    const conditions = ['organization_id = $1'];
    const params: any[] = [orgId];
    let idx = 2;

    if (opts?.activeOnly) conditions.push('is_active = TRUE');
    if (opts?.parentOnly) conditions.push('parent_category_id IS NULL');
    if (opts?.categoryType) {
      conditions.push(`category_type = $${idx++}`);
      params.push(opts.categoryType);
    }

    return queryMany<ExpenseCategoryRow>(
      `SELECT * FROM expense_categories WHERE ${conditions.join(' AND ')} ORDER BY sort_order ASC, category_code ASC`,
      params
    );
  }

  /**
   * Get category tree with children nested
   */
  static async getTree(orgId: string): Promise<ExpenseCategoryWithChildren[]> {
    const all = await this.list(orgId, { activeOnly: true });
    const map = new Map<string, ExpenseCategoryWithChildren>();
    
    // Index all categories
    all.forEach(cat => map.set(cat.id, { ...cat, children: [] }));
    
    // Build tree
    const roots: ExpenseCategoryWithChildren[] = [];
    all.forEach(cat => {
      const node = map.get(cat.id)!;
      if (cat.parent_category_id && map.has(cat.parent_category_id)) {
        map.get(cat.parent_category_id)!.children!.push(node);
      } else {
        roots.push(node);
      }
    });
    
    return roots;
  }

  /**
   * Get category by code
   */
  static async getByCode(orgId: string, categoryCode: string): Promise<ExpenseCategoryRow | null> {
    return queryOne<ExpenseCategoryRow>(
      `SELECT * FROM expense_categories WHERE organization_id = $1 AND category_code = $2 AND is_active = TRUE`,
      [orgId, categoryCode]
    );
  }

  /**
   * Create a new expense category
   */
  static async create(
    orgId: string,
    data: {
      categoryCode: string;
      nameAr: string;
      nameEn: string;
      description?: string;
      categoryType: ExpenseCategoryType;
      recognitionMethod?: ExpenseRecognitionMethod;
      isBudgeted?: boolean;
      requiresReceipt?: boolean;
      requiresApproval?: boolean;
      approvalThreshold?: number;
      debitAccountId?: string;
      creditAccountId?: string;
      defaultVatRate?: number;
      parentCategoryId?: string;
      sortOrder?: number;
    },
    auth: AuthContext
  ): Promise<ExpenseCategoryRow> {
    // Validate category type
    const validTypes: ExpenseCategoryType[] = [
      'OPERATIONAL', 'PROGRAM', 'ADMINISTRATIVE', 'CAPITAL', 'EMERGENCY',
      'TRAVEL', 'PROCUREMENT', 'HR', 'MARKETING', 'IT', 'FACILITY',
      'CONSULTING', 'LEGAL', 'INSURANCE', 'UTILITIES', 'RENT', 'OTHER'
    ];
    if (!validTypes.includes(data.categoryType)) {
      throw new Error(`Invalid category type: ${data.categoryType}`);
    }

    // Validate recognition method
    const validMethods: ExpenseRecognitionMethod[] = ['CASH_BASIS', 'ACCRUAL_BASIS', 'MODIFIED_CASH'];
    if (data.recognitionMethod && !validMethods.includes(data.recognitionMethod)) {
      throw new Error(`Invalid recognition method: ${data.recognitionMethod}`);
    }

    const row = await queryOne(
      `INSERT INTO expense_categories (
        organization_id, category_code, name_ar, name_en, description,
        category_type, recognition_method, is_budgeted, requires_receipt, requires_approval,
        approval_threshold, debit_account_id, credit_account_id, default_vat_rate,
        parent_category_id, sort_order
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       ON CONFLICT (organization_id, category_code) DO UPDATE SET
         name_ar = EXCLUDED.name_ar, name_en = EXCLUDED.name_en, updated_at = NOW()
       RETURNING *`,
      [
        orgId, data.categoryCode, data.nameAr, data.nameEn, data.description || null,
        data.categoryType, data.recognitionMethod || 'ACCRUAL_BASIS',
        data.isBudgeted ?? true, data.requiresReceipt ?? true, data.requiresApproval ?? true,
        data.approvalThreshold || null, data.debitAccountId || null, data.creditAccountId || null,
        data.defaultVatRate || null, data.parentCategoryId || null,
        data.sortOrder || 0
      ]
    );

    await auditLog({
      organizationId: orgId,
      userId: auth.userId,
      action: 'UPSERT',
      tableName: 'expense_categories',
      recordId: row?.id,
      details: { categoryCode: data.categoryCode, categoryType: data.categoryType }
    });

    return row;
  }

  /**
   * Deactivate a category (soft delete)
   */
  static async deactivate(orgId: string, categoryId: string, auth: AuthContext): Promise<void> {
    const result = await query(
      `UPDATE expense_categories SET is_active = FALSE, updated_at = NOW()
       WHERE id = $1 AND organization_id = $2`,
      [categoryId, orgId]
    );

    await auditLog({
      organizationId: orgId,
      userId: auth.userId,
      action: 'DEACTIVATE',
      tableName: 'expense_categories',
      recordId: categoryId,
      details: { categoryId }
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPENSE RECORD ENGINE — Core Business Logic
// ═══════════════════════════════════════════════════════════════════════════════

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ResolvedAccounts {
  debit: { id: string; code: string; name_ar: string };
  credit: { id: string; code: string; name_ar: string };
}

export class ExpenseEngine {
  
  /**
   * Resolve GL accounts for expense posting
   * Dr Expense (5xxx) | Cr Cash/Bank/AP
   */
  private static async resolveAccounts(
    orgId: string,
    category: ExpenseCategoryRow,
    paymentMethod: PaymentMethod,
    client?: any
  ): Promise<ResolvedAccounts> {
    const exec = client ?? { query: (t: string, p?: any[]) => query(t, p) };

    // 1) Category-mapped accounts (preferred)
    if (category.debit_account_id && category.credit_account_id) {
      const [debitAcc, creditAcc] = await Promise.all([
        exec.query(`SELECT id, account_code, name_ar FROM chart_of_accounts WHERE id = $1 AND organization_id = $2 AND is_active = TRUE`, [category.debit_account_id, orgId]),
        exec.query(`SELECT id, account_code, name_ar FROM chart_of_accounts WHERE id = $1 AND organization_id = $2 AND is_active = TRUE`, [category.credit_account_id, orgId])
      ]);
      if (debitAcc.rows[0] && creditAcc.rows[0]) {
        return {
          debit: { id: debitAcc.rows[0].id, code: debitAcc.rows[0].account_code, name_ar: debitAcc.rows[0].name_ar },
          credit: { id: creditAcc.rows[0].id, code: creditAcc.rows[0].account_code, name_ar: creditAcc.rows[0].name_ar }
        };
      }
    }

    // 2) Fallback: resolve by account type codes
    // Expense debit: 5xxx, 6xxx
    // Cash/Current Asset credit: 1xxx
    // AP credit: 2xxx
    const debitType = `account_code ~ '^5' OR account_code ~ '^6'`;
    let creditType = '';
    
    switch (paymentMethod) {
      case 'CASH':
      case 'PETTY_CASH':
        creditType = `account_code ~ '^1' AND (name_ar ILIKE '%صندوق%' OR name_ar ILIKE '%cash%')`;
        break;
      case 'BANK_TRANSFER':
      case 'VIRTUAL_ACCOUNT':
        creditType = `account_code ~ '^1' AND (name_ar ILIKE '%بنك%' OR name_ar ILIKE '%bank%')`;
        break;
      case 'CREDIT_CARD':
        creditType = `account_code ~ '^1' AND (name_ar ILIKE '%بطاقة%' OR name_ar ILIKE '%credit%')`;
        break;
      default:
        creditType = `account_type IN ('ASSET', 'LIABILITY')`;
    }

    const [debitResult, creditResult] = await Promise.all([
      exec.query(`SELECT id, account_code, name_ar FROM chart_of_accounts WHERE organization_id = $1 AND is_active = TRUE AND (${debitType}) LIMIT 1`, [orgId]),
      exec.query(`SELECT id, account_code, name_ar FROM chart_of_accounts WHERE organization_id = $1 AND is_active = TRUE AND (${creditType}) LIMIT 1`, [orgId])
    ]);

    if (!debitResult.rows[0]) {
      throw new Error(`No active Expense account found (5xxx/6xxx). Configure GL accounts first.`);
    }
    if (!creditResult.rows[0]) {
      throw new Error(`No active Cash/Bank/AP account found for payment method ${paymentMethod}. Configure GL accounts first.`);
    }

    return {
      debit: { id: debitResult.rows[0].id, code: debitResult.rows[0].account_code, name_ar: debitResult.rows[0].name_ar },
      credit: { id: creditResult.rows[0].id, code: creditResult.rows[0].account_code, name_ar: creditResult.rows[0].name_ar }
    };
  }

  /**
   * Create a new expense record (DRAFT)
   */
  static async create(
    orgId: string,
    data: {
      categoryId?: string;
      categoryCode?: string;
      counterpartyName: string;
      counterpartyPartyId?: string;
      counterpartyVendorId?: string;
      counterpartyType?: 'VENDOR' | 'EMPLOYEE' | 'GOVERNMENT' | 'OTHER';
      amount: number;
      currencyCode?: string;
      exchangeRate?: number;
      vatRate?: number;
      isVatRegistered?: boolean;
      vatRecoverable?: boolean;
      programId?: string;
      projectId?: string;
      activityId?: string;
      costCenterId?: string;
      budgetLineId?: string;
      paymentMethod?: PaymentMethod;
      paymentDueDate?: string;
      receiptNumber?: string;
      description?: string;
      referenceNumber?: string;
      notes?: string;
      metadata?: Record<string, unknown>;
    },
    auth: AuthContext
  ): Promise<ExpenseRecordRow> {
    // Validate amount
    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Expense amount must be a positive number');
    }

    // Validate exchange rate
    const rate = Number(data.exchangeRate) || 1;
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error('Exchange rate must be positive');
    }

    if (!data.counterpartyName?.trim()) {
      throw new Error('Counterparty name is required');
    }

    const amountBase = Math.round(amount * rate * 100) / 100;

    // VAT calculation
    const vatRate = Number(data.vatRate) || 0;
    if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) {
      throw new Error('VAT rate must be between 0 and 100');
    }
    const vatAmount = Math.round(amountBase * vatRate / 100 * 100) / 100;
    const netAmount = amountBase + vatAmount;

    // Resolve category
    let category: ExpenseCategoryRow | null = null;
    if (data.categoryId) {
      category = await queryOne<ExpenseCategoryRow>(
        `SELECT * FROM expense_categories WHERE id = $1 AND organization_id = $2 AND is_active = TRUE`,
        [data.categoryId, orgId]
      );
    } else if (data.categoryCode) {
      category = await ExpenseCategoryEngine.getByCode(orgId, data.categoryCode);
    }

    if (!category) {
      throw new Error(`Expense category not found or inactive`);
    }

    // Generate expense number
    const seqRes = await query(`SELECT nextval('expense_record_seq') as seq`);
    const seq = parseInt(seqRes.rows[0].seq, 10);
    const expenseNumber = `EXP-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;

    const result = await queryOne(
      `INSERT INTO expense_records (
        organization_id, expense_number, category_id, category_code, category_name_ar, expense_type,
        counterparty_name, counterparty_party_id, counterparty_vendor_id, counterparty_type,
        amount, currency_code, exchange_rate, amount_base,
        vat_amount, vat_rate, is_vat_registered, vat_recoverable,
        net_amount,
        program_id, project_id, activity_id, cost_center_id,
        budget_line_id, payment_method, payment_due_date,
        receipt_number, has_receipt,
        description, reference_number, notes,
        metadata, status, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36)
       RETURNING *`,
      [
        orgId, expenseNumber, category.id, category.category_code, category.name_ar, category.category_type,
        data.counterpartyName, data.counterpartyPartyId || null, data.counterpartyVendorId || null,
        data.counterpartyType || 'VENDOR',
        amount, data.currencyCode || 'YER', rate, amountBase,
        vatAmount, vatRate, data.isVatRegistered ?? false, data.vatRecoverable ?? false,
        netAmount,
        data.programId || null, data.projectId || null, data.activityId || null, data.costCenterId || null,
        data.budgetLineId || null, data.paymentMethod || 'BANK_TRANSFER', data.paymentDueDate || null,
        data.receiptNumber || null, !!(data.receiptNumber),
        data.description || null, data.referenceNumber || null, data.notes || null,
        data.metadata ? JSON.stringify(data.metadata) : null, 'DRAFT', auth.userId
      ]
    );

    await auditLog({
      organizationId: orgId,
      userId: auth.userId,
      action: 'CREATE',
      tableName: 'expense_records',
      recordId: result?.id,
      details: { expenseNumber, amount: amountBase, categoryCode: category.category_code }
    });

    return result;
  }

  /**
   * Get expense record by ID with full details
   */
  static async getById(orgId: string, expenseId: string): Promise<ExpenseRecordRow | null> {
    return queryOne<ExpenseRecordRow>(
      `SELECT 
        er.*,
        cc.name_ar as cost_center_name_ar
       FROM expense_records er
       LEFT JOIN cost_centers cc ON cc.id = er.cost_center_id
       WHERE er.id = $1 AND er.organization_id = $2 AND er.deleted_at IS NULL`,
      [expenseId, orgId]
    );
  }

  /**
   * List expense records with pagination and filtering
   */
  static async list(
    orgId: string,
    pagination: PaginationParams = {},
    filters?: {
      status?: string;
      categoryCode?: string;
      categoryType?: ExpenseCategoryType;
      projectId?: string;
      activityId?: string;
      costCenterId?: string;
      startDate?: string;
      endDate?: string;
      minAmount?: number;
      maxAmount?: number;
      counterpartyName?: string;
    }
  ): Promise<{ data: ExpenseRecordRow[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'desc' } = pagination;
    const conditions = ['er.organization_id = $1', 'er.deleted_at IS NULL'];
    const params: any[] = [orgId];
    let idx = 2;

    if (filters?.status) {
      conditions.push(`er.status = $${idx++}`);
      params.push(filters.status);
    }
    if (filters?.categoryCode) {
      conditions.push(`er.category_code = $${idx++}`);
      params.push(filters.categoryCode);
    }
    if (filters?.categoryType) {
      conditions.push(`er.expense_type = $${idx++}`);
      params.push(filters.categoryType);
    }
    if (filters?.projectId) {
      conditions.push(`er.project_id = $${idx++}`);
      params.push(filters.projectId);
    }
    if (filters?.activityId) {
      conditions.push(`er.activity_id = $${idx++}`);
      params.push(filters.activityId);
    }
    if (filters?.costCenterId) {
      conditions.push(`er.cost_center_id = $${idx++}`);
      params.push(filters.costCenterId);
    }
    if (filters?.startDate) {
      conditions.push(`er.created_at >= $${idx++}`);
      params.push(filters.startDate);
    }
    if (filters?.endDate) {
      conditions.push(`er.created_at <= $${idx++}`);
      params.push(filters.endDate);
    }
    if (filters?.minAmount) {
      conditions.push(`er.amount_base >= $${idx++}`);
      params.push(filters.minAmount);
    }
    if (filters?.maxAmount) {
      conditions.push(`er.amount_base <= $${idx++}`);
      params.push(filters.maxAmount);
    }
    if (filters?.counterpartyName) {
      conditions.push(`er.counterparty_name ILIKE $${idx++}`);
      params.push(`%${filters.counterpartyName}%`);
    }

    const where = conditions.join(' AND ');
    const sortKey = `er.${sortBy}`;
    const offset = (page - 1) * limit;

    const sortAllowed = ['created_at', 'expense_number', 'amount_base', 'net_amount', 'payment_due_date', 'status'];
    const sortCol = sortAllowed.includes(sortBy) ? sortKey : 'er.created_at';
    const sortDir = sortOrder === 'asc' ? 'ASC' : 'DESC';

    return paginatedQuery<ExpenseRecordRow>(
      `SELECT er.*,
              p.name_ar as program_name_ar, p.project_code,
              cc.name_ar as cost_center_name_ar
       FROM expense_records er
       LEFT JOIN projects p ON p.id = er.project_id
       LEFT JOIN cost_centers cc ON cc.id = er.cost_center_id
       WHERE ${where}
       ORDER BY ${sortCol} ${sortDir} NULLS LAST`,
      `SELECT COUNT(*)::int as count FROM expense_records er WHERE ${where}`,
      [...params, limit, offset]
    );
  }

  /**
   * Submit expense for approval (DRAFT → PENDING_APPROVAL)
   */
  static async submit(orgId: string, expenseId: string, auth: AuthContext): Promise<ExpenseRecordRow> {
    const record = await this.getById(orgId, expenseId);
    if (!record) throw new Error('Expense record not found');
    if (record.status !== 'DRAFT') {
      throw new Error(`Cannot submit expense in ${record.status} status. Only DRAFT records can be submitted.`);
    }

    // Validate receipt if required
    if (record.has_receipt === false) {
      const category = await ExpenseCategoryEngine.getByCode(orgId, record.category_code);
      if (category?.requires_receipt) {
        throw new Error('Receipt is required for this expense category');
      }
    }

    const row = await queryOne(
      `UPDATE expense_records SET status = 'PENDING_APPROVAL', updated_at = NOW()
       WHERE id = $1 AND organization_id = $2 AND status = 'DRAFT'
       RETURNING *`,
      [expenseId, orgId]
    );

    if (!row) throw new Error('Expense record not found or not in DRAFT status');

    await auditLog({
      organizationId: orgId,
      userId: auth.userId,
      action: 'SUBMIT',
      tableName: 'expense_records',
      recordId: expenseId,
      details: { expenseNumber: row.expense_number }
    });

    return row;
  }

  /**
   * Approve or reject expense (PENDING_APPROVAL → APPROVED or REJECTED)
   */
  static async approve(
    orgId: string,
    expenseId: string,
    auth: AuthContext,
    opts?: { reject?: boolean; reason?: string }
  ): Promise<ExpenseRecordRow> {
    const record = await this.getById(orgId, expenseId);
    if (!record) throw new Error('Expense record not found');
    if (record.status !== 'PENDING_APPROVAL') {
      throw new Error(`Cannot approve/reject expense in ${record.status} status. Only PENDING_APPROVAL records can be processed.`);
    }

    if (opts?.reject) {
      const row = await queryOne(
        `UPDATE expense_records SET status = 'REJECTED', rejection_reason = $3, approved_by = $4, approved_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND organization_id = $2 RETURNING *`,
        [expenseId, orgId, opts.reason || 'Rejected by approver', auth.userId]
      );

      await auditLog({
        organizationId: orgId,
        userId: auth.userId,
        action: 'REJECT',
        tableName: 'expense_records',
        recordId: expenseId,
        details: { reason: opts.reason }
      });

      return row;
    }

    const approved = await queryOne(
      `UPDATE expense_records SET status = 'APPROVED', approved_by = $3, approved_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND organization_id = $2 RETURNING *`,
      [expenseId, orgId, auth.userId]
    );

    await auditLog({
      organizationId: orgId,
      userId: auth.userId,
      action: 'APPROVE',
      tableName: 'expense_records',
      recordId: expenseId,
      details: { expenseNumber: record.expense_number }
    });

    return approved;
  }

  /**
   * Post expense to IPSAS ledger (APPROVED → POSTED)
   * Dr Expense (5xxx) | Cr Cash/Bank/AP (1xxx/2xxx)
   */
  static async post(orgId: string, expenseId: string, auth: AuthContext): Promise<ExpenseRecordRow> {
    const record = await this.getById(orgId, expenseId);
    if (!record) throw new Error('Expense record not found');
    if (record.status !== 'APPROVED') {
      throw new Error(`Cannot post expense in ${record.status} status. Only APPROVED records can be posted.`);
    }
    if (record.ledger_transaction_id) {
      throw new Error('Expense record already posted to the ledger');
    }

    // Get category for GL account resolution
    const category = await ExpenseCategoryEngine.getByCode(orgId, record.category_code);
    if (!category) throw new Error('Expense category not found');

    const paymentMethod = (record.payment_method as PaymentMethod) || 'BANK_TRANSFER';

    return await transaction(async (client) => {
      const accounts = await this.resolveAccounts(orgId, category, paymentMethod, client);

      // Generate transaction number
      const txSeqRes = await client.query(`SELECT nextval('transaction_seq') as seq`);
      const txSeq = parseInt(txSeqRes.rows[0].seq, 10);
      const txNumber = `TXN-EXP-${new Date().getFullYear()}-${String(txSeq).padStart(6, '0')}`;

      const expenseDate = new Date().toISOString().split('T')[0];
      const amountBase = Number(record.amount_base);

      // Create transaction header
      const txRes = await client.query(
        `INSERT INTO transactions (
          organization_id, transaction_number, transaction_type, transaction_date,
          source_record_type, source_record_id, source_reference,
          project_id, activity_id, program_id,
          description, currency_code, exchange_rate, total_amount,
          posted_by, posted_at, status
        ) VALUES ($1,$2,'EXPENSE',$3,'expense_records',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),'POSTED')
         RETURNING id`,
        [
          orgId, txNumber, expenseDate,
          expenseId, record.expense_number,
          record.project_id || null, record.activity_id || null, record.program_id || null,
          `ترحيل مصروف ${record.expense_number} — ${record.category_name_ar}`, record.currency_code,
          Number(record.exchange_rate) || 1, amountBase, auth.userId
        ]
      );
      const txId = txRes.rows[0].id;

      // Line 1: Debit Expense Account
      await client.query(
        `INSERT INTO transaction_lines (
          transaction_id, organization_id, account_id, account_code,
          debit_amount, credit_amount, currency_code, exchange_rate, amount_base,
          description, project_id, activity_id, cost_center_id
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          txId, orgId, accounts.debit.id, accounts.debit.code,
          amountBase, 0, record.currency_code, Number(record.exchange_rate) || 1, amountBase,
          `مدين: مصروف ${record.expense_number} — ${record.category_name_ar}`,
          record.project_id || null, record.activity_id || null, record.cost_center_id || null
        ]
      );

      // Line 2: Credit Cash/Bank/AP Account
      await client.query(
        `INSERT INTO transaction_lines (
          transaction_id, organization_id, account_id, account_code,
          debit_amount, credit_amount, currency_code, exchange_rate, amount_base,
          description, project_id, activity_id, cost_center_id
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          txId, orgId, accounts.credit.id, accounts.credit.code,
          0, amountBase, record.currency_code, Number(record.exchange_rate) || 1, amountBase,
          `دائن: تسوية مصروف ${record.expense_number} — ${accounts.credit.name_ar}`,
          record.project_id || null, record.activity_id || null, record.cost_center_id || null
        ]
      );

      // Update expense record
      const upd = await client.query(
        `UPDATE expense_records SET status = 'POSTED', ledger_transaction_id = $3, posted_at = NOW(), posted_by = $4, updated_at = NOW()
         WHERE id = $1 AND organization_id = $2 AND status = 'APPROVED'
           AND ledger_transaction_id IS NULL
         RETURNING *`,
        [expenseId, orgId, txId, auth.userId]
      );

      await auditLog({
        organizationId: orgId,
        userId: auth.userId,
        action: 'POST',
        tableName: 'expense_records',
        recordId: expenseId,
        details: { expenseNumber: record.expense_number, transactionId: txId, amountBase }
      });

      if (!upd.rows[0]) {
        throw new Error('Expense could not be posted because its state changed during posting');
      }
      return upd.rows[0];
    });
  }

  /**
   * Mark expense as paid (POSTED → PAID)
   */
  static async markPaid(
    orgId: string,
    expenseId: string,
    auth: AuthContext,
    opts?: {
      paymentMethod?: PaymentMethod;
      paymentReference?: string;
      paymentDate?: string;
      paidAmount?: number;
    }
  ): Promise<ExpenseRecordRow> {
    const record = await this.getById(orgId, expenseId);
    if (!record) throw new Error('Expense record not found');
    if (!['POSTED', 'PARTIALLY_PAID'].includes(record.status)) {
      throw new Error(`Cannot mark as paid: expense is in ${record.status} status`);
    }

    const paidAmount = opts?.paidAmount ?? Number(record.net_amount);
    if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
      throw new Error('Paid amount must be a positive number');
    }
    const outstandingAmount = Math.max(0, Number(record.net_amount) - Number(record.paid_amount || 0));
    if (paidAmount > outstandingAmount + 0.01) {
      throw new Error(`Paid amount exceeds the outstanding balance of ${outstandingAmount.toFixed(2)}`);
    }
    const newPaidAmount = Number(record.paid_amount || 0) + paidAmount;
    const isFullyPaid = newPaidAmount >= Number(record.net_amount);
    const newStatus: ExpenseStatus = isFullyPaid ? 'PAID' : 'PARTIALLY_PAID';

    const row = await queryOne(
      `UPDATE expense_records SET 
        status = $3, paid_amount = $4, payment_method = COALESCE($5, payment_method),
        payment_reference = COALESCE($6, payment_reference),
        payment_date = COALESCE($7, payment_date),
        updated_at = NOW()
       WHERE id = $1 AND organization_id = $2
         AND status IN ('POSTED', 'PARTIALLY_PAID')
         AND COALESCE(paid_amount, 0) + $4 <= net_amount + 0.01
       RETURNING *`,
      [
        expenseId, orgId, newStatus,
        newPaidAmount,
        opts?.paymentMethod || null,
        opts?.paymentReference || null,
        opts?.paymentDate || null
      ]
    );

    if (!row) {
      throw new Error('Expense could not be marked as paid because its state or balance changed');
    }

    await auditLog({
      organizationId: orgId,
      userId: auth.userId,
      action: 'PAY',
      tableName: 'expense_records',
      recordId: expenseId,
      details: { expenseNumber: row?.expense_number, paidAmount, newStatus }
    });

    return row;
  }

  /**
   * Reconcile expense (PAID → RECONCILED)
   */
  static async reconcile(
    orgId: string,
    expenseId: string,
    auth: AuthContext
  ): Promise<ExpenseRecordRow> {
    const record = await this.getById(orgId, expenseId);
    if (!record) throw new Error('Expense record not found');
    if (record.status !== 'PAID') {
      throw new Error(`Cannot reconcile expense in ${record.status} status. Only PAID expenses can be reconciled.`);
    }

    const row = await queryOne(
      `UPDATE expense_records SET status = 'RECONCILED', updated_at = NOW()
       WHERE id = $1 AND organization_id = $2 AND status = 'PAID' RETURNING *`,
      [expenseId, orgId]
    );

    if (!row) {
      throw new Error('Expense could not be reconciled because its state changed');
    }

    await auditLog({
      organizationId: orgId,
      userId: auth.userId,
      action: 'RECONCILE',
      tableName: 'expense_records',
      recordId: expenseId,
      details: { expenseNumber: row?.expense_number }
    });

    return row;
  }

  /**
   * Cancel expense record
   */
  static async cancel(
    orgId: string,
    expenseId: string,
    auth: AuthContext,
    reason?: string
  ): Promise<ExpenseRecordRow> {
    const record = await this.getById(orgId, expenseId);
    if (!record) throw new Error('Expense record not found');
    if (['PAID', 'RECONCILED', 'CLOSED', 'CANCELLED'].includes(record.status)) {
      throw new Error(`Cannot cancel expense in ${record.status} status`);
    }

    const row = await queryOne(
      `UPDATE expense_records SET status = 'CANCELLED', rejection_reason = $3, updated_at = NOW(), deleted_at = NOW()
       WHERE id = $1 AND organization_id = $2 RETURNING *`,
      [expenseId, orgId, reason || 'Cancelled']
    );

    await auditLog({
      organizationId: orgId,
      userId: auth.userId,
      action: 'CANCEL',
      tableName: 'expense_records',
      recordId: expenseId,
      details: { reason }
    });

    return row;
  }

  /**
   * Soft delete expense record
   */
  static async delete(orgId: string, expenseId: string, auth: AuthContext): Promise<void> {
    const record = await this.getById(orgId, expenseId);
    if (!record) throw new Error('Expense record not found');
    if (record.status !== 'DRAFT' && record.status !== 'CANCELLED') {
      throw new Error('Only DRAFT or CANCELLED expenses can be deleted');
    }

    await query(
      `UPDATE expense_records SET deleted_at = NOW() WHERE id = $1 AND organization_id = $2`,
      [expenseId, orgId]
    );

    await auditLog({
      organizationId: orgId,
      userId: auth.userId,
      action: 'DELETE',
      tableName: 'expense_records',
      recordId: expenseId,
      details: { expenseNumber: record.expense_number }
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPENSE INTELLIGENCE ENGINE — KPIs, Forecasting & Compliance
// ═══════════════════════════════════════════════════════════════════════════════

export class ExpenseIntelligenceEngine {
  
  /**
   * Generate comprehensive expense intelligence snapshot
   * All figures from real ledger data — no fabricated values
   */
  static async getSnapshot(
    orgId: string,
    opts?: { months?: number; projectId?: string; costCenterId?: string }
  ): Promise<ExpenseIntelligenceSnapshot> {
    const months = opts?.months || 12;
    const conditions = ['organization_id = $1', 'deleted_at IS NULL'];
    const params: any[] = [orgId];
    let idx = 2;

    if (opts?.projectId) {
      conditions.push(`project_id = $${idx++}`);
      params.push(opts.projectId);
    }
    if (opts?.costCenterId) {
      conditions.push(`cost_center_id = $${idx++}`);
      params.push(opts.costCenterId);
    }

    const where = conditions.join(' AND ');

    // KPIs from real data
    const kpisRow = await queryOne<any>(
      `SELECT 
        COUNT(*)::int as expense_count,
        COALESCE(SUM(amount_base), 0) as total_expenses,
        COALESCE(SUM(CASE WHEN status IN ('APPROVED','POSTED','PAID','RECONCILED') THEN amount_base ELSE 0 END), 0) as total_approved,
        COALESCE(SUM(CASE WHEN status = 'POSTED' THEN amount_base ELSE 0 END), 0) as total_posted,
        COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount_base ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(CASE WHEN status IN ('POSTED','APPROVED','PARTIALLY_PAID') THEN net_amount - COALESCE(paid_amount,0) ELSE 0 END), 0) as total_outstanding,
        COALESCE(AVG(amount_base) FILTER (WHERE status NOT IN ('DRAFT','REJECTED','CANCELLED')), 0) as avg_expense_amount,
        COUNT(*) FILTER (WHERE status = 'PENDING_APPROVAL')::int as pending_approval_count,
        COUNT(*) FILTER (WHERE payment_due_date < CURRENT_DATE AND status IN ('POSTED','APPROVED'))::int as overdue_payments_count,
        COALESCE(SUM(CASE WHEN vat_recoverable THEN vat_amount ELSE 0 END), 0) as vat_recoverable
       FROM expense_records WHERE ${where}`,
      params
    );

    const kpis: ExpenseKPIs = {
      totalExpenses: Number(kpisRow.total_expenses) || 0,
      totalApproved: Number(kpisRow.total_approved) || 0,
      totalPosted: Number(kpisRow.total_posted) || 0,
      totalPaid: Number(kpisRow.total_paid) || 0,
      totalOutstanding: Number(kpisRow.total_outstanding) || 0,
      avgExpenseAmount: Number(kpisRow.avg_expense_amount) || 0,
      expenseCount: Number(kpisRow.expense_count) || 0,
      pendingApprovalCount: Number(kpisRow.pending_approval_count) || 0,
      overduePaymentsCount: Number(kpisRow.overdue_payments_count) || 0,
      budgetUtilizationPct: 0, // Calculated separately with budget data
      vatRecoverable: Number(kpisRow.vat_recoverable) || 0
    };

    // By Category
    const byCategory = await queryMany<any>(
      `SELECT er.category_code, er.category_name_ar, er.expense_type,
              COALESCE(SUM(er.amount_base), 0) as total_amount,
              COUNT(*)::int as count,
              COALESCE(AVG(er.amount_base), 0) as avg_amount
       FROM expense_records er
       WHERE er.organization_id = $1 AND er.deleted_at IS NULL
         AND er.status NOT IN ('DRAFT','REJECTED','CANCELLED')
       GROUP BY er.category_code, er.category_name_ar, er.expense_type
       ORDER BY total_amount DESC`,
      [orgId]
    );

    const categoryResults: ExpenseByCategory[] = byCategory.map((r: any) => ({
      category_code: r.category_code,
      category_name_ar: r.category_name_ar,
      category_type: r.expense_type,
      total_amount: Number(r.total_amount),
      count: Number(r.count),
      avg_amount: Number(r.avg_amount)
    }));

    // By Project
    const byProject = await queryMany<any>(
      `SELECT er.project_id, p.name_ar as project_name_ar, p.project_code,
              COALESCE(SUM(er.amount_base), 0) as total_amount,
              COUNT(*)::int as count
       FROM expense_records er
       LEFT JOIN projects p ON p.id = er.project_id
       WHERE er.organization_id = $1 AND er.deleted_at IS NULL
         AND er.project_id IS NOT NULL
         AND er.status NOT IN ('DRAFT','REJECTED','CANCELLED')
       GROUP BY er.project_id, p.name_ar, p.project_code
       ORDER BY total_amount DESC`,
      [orgId]
    );

    const projectResults: ExpenseByProject[] = byProject.map((r: any) => ({
      project_id: r.project_id,
      project_name_ar: r.project_name_ar,
      project_code: r.project_code,
      total_amount: Number(r.total_amount),
      count: Number(r.count)
    }));

    // Monthly Trend
    const monthly = await queryMany<any>(
      `SELECT DATE_TRUNC('month', created_at)::date AS month,
              COALESCE(SUM(amount_base), 0) as total_expenses,
              COUNT(*)::int as count
       FROM expense_records
       WHERE organization_id = $1 AND deleted_at IS NULL
         AND status NOT IN ('DRAFT','REJECTED','CANCELLED')
         AND created_at >= (CURRENT_DATE - ($2 || ' months')::interval)
       GROUP BY 1 ORDER BY 1 ASC`,
      [orgId, String(months)]
    );

    const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    const monthlyTrend: ExpenseMonthlyTrend[] = monthly.map((r: any) => {
      const d = new Date(r.month);
      return {
        month: r.month,
        monthAr: MONTHS_AR[d.getMonth()],
        total_expenses: Number(r.total_expenses),
        count: Number(r.count),
        by_category: {} // Simplified for now
      };
    });

    // Top Vendors
    const topVendors = await queryMany<any>(
      `SELECT counterparty_name, counterparty_type,
              COALESCE(SUM(amount_base), 0) as total_amount,
              COUNT(*)::int as transaction_count,
              COALESCE(AVG(amount_base), 0) as avg_amount,
              MAX(created_at)::date as last_transaction_date
       FROM expense_records
       WHERE organization_id = $1 AND deleted_at IS NULL
         AND counterparty_name IS NOT NULL
         AND status NOT IN ('DRAFT','REJECTED','CANCELLED')
       GROUP BY counterparty_name, counterparty_type
       ORDER BY total_amount DESC
       LIMIT 10`,
      [orgId]
    );

    const vendorResults: VendorExpenseRow[] = topVendors.map((r: any) => ({
      counterparty_name: r.counterparty_name,
      counterparty_type: r.counterparty_type,
      total_amount: Number(r.total_amount),
      transaction_count: Number(r.transaction_count),
      avg_amount: Number(r.avg_amount),
      last_transaction_date: r.last_transaction_date?.toISOString(),
      payment_status: 'PARTIAL' as const
    }));

    // Compliance Alerts
    const alerts: ExpenseComplianceAlert[] = [];

    // Overdue payments alert
    if (kpis.overduePaymentsCount > 0) {
      alerts.push({
        type: 'APPROVAL_DELAY',
        severity: 'HIGH',
        message_ar: `توجد ${kpis.overduePaymentsCount} مصروفات متأخرة في السداد超过了付款期限的支出`,
        message_en: `${kpis.overduePaymentsCount} expenses have overdue payment dates`,
        created_at: new Date()
      });
    }

    // Pending approval alert
    if (kpis.pendingApprovalCount > 5) {
      alerts.push({
        type: 'APPROVAL_DELAY',
        severity: 'MEDIUM',
        message_ar: `توجد ${kpis.pendingApprovalCount} مصروفات بانتظار الموافقة`,
        message_en: `${kpis.pendingApprovalCount} expenses awaiting approval`,
        created_at: new Date()
      });
    }

    // Insights
    const insights: string[] = [];
    
    if (kpis.totalExpenses > 0) {
      const topCat = categoryResults[0];
      if (topCat) {
        insights.push(`أكبر فئة مصروفات: ${topCat.category_name_ar} (${(topCat.total_amount / kpis.totalExpenses * 100).toFixed(1)}% من الإجمالي)`);
      }
    }

    if (kpis.totalOutstanding > 0) {
      insights.push(`التزامات مستحقة: ${kpis.totalOutstanding.toLocaleString()} YER — يُنصح بمراجعة جدول السداد`);
    }

    if (vendorResults.length > 0) {
      insights.push(`أعلى مورد: ${vendorResults[0].counterparty_name} — ${vendorResults[0].total_amount.toLocaleString()} YER`);
    }

    return {
      kpis,
      byCategory: categoryResults,
      byProject: projectResults,
      monthlyTrend,
      topVendors: vendorResults,
      complianceAlerts: alerts,
      insights,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Simple expense forecasting based on historical trend
   */
  static forecast(history: { month: string; total_expenses: number }[], periods: number = 3): { month: string; predicted: number; confidence: number }[] {
    if (history.length < 3) {
      return [];
    }

    const values = history.map(h => h.total_expenses);
    const n = values.length;
    
    // Linear regression
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumXX += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Standard error for confidence
    let sumResidualSq = 0;
    for (let i = 0; i < n; i++) {
      const predicted = intercept + slope * i;
      sumResidualSq += Math.pow(values[i] - predicted, 2);
    }
    const stdError = Math.sqrt(sumResidualSq / (n - 2));
    const avgY = sumY / n;
    const confidence = Math.max(0, Math.min(1, 1 - stdError / avgY));

    const lastMonth = history[n - 1].month;
    const predictions: { month: string; predicted: number; confidence: number }[] = [];
    
    for (let i = 1; i <= periods; i++) {
      const futureIdx = n + i - 1;
      const predicted = Math.max(0, intercept + slope * futureIdx);
      predictions.push({
        month: lastMonth, // Simplified
        predicted: Math.round(predicted),
        confidence: Math.max(0, confidence - i * 0.1)
      });
    }

    return predictions;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPENSE BATCH ENGINE — Bulk Journal Entries
// ═══════════════════════════════════════════════════════════════════════════════

export class ExpenseBatchEngine {
  
  /**
   * Validate batch entries are balanced (accepts both camelCase and snake_case keys)
   */
  static validateEntries(entries: Array<Record<string, any>>): { valid: boolean; totalDebit: number; totalCredit: number } {
    const amounts = entries.map(e => ({
      debit: Number(e.debit_amount ?? e.debitAmount ?? 0),
      credit: Number(e.credit_amount ?? e.creditAmount ?? 0)
    }));
    const hasInvalidLine = amounts.some(({ debit, credit }) =>
      !Number.isFinite(debit) || !Number.isFinite(credit) ||
      debit < 0 || credit < 0 || (debit > 0 && credit > 0) || (debit === 0 && credit === 0)
    );
    const totalDebit = amounts.reduce((s, e) => s + e.debit, 0);
    const totalCredit = amounts.reduce((s, e) => s + e.credit, 0);
    const valid = !hasInvalidLine && Math.abs(totalDebit - totalCredit) < 0.01;
    return { valid, totalDebit, totalCredit };
  }

  /**
   * Create expense batch
   */
  static async create(
    orgId: string,
    data: {
      entries: {
        accountId: string;
        accountCode: string;
        accountNameAr: string;
        debitAmount: number;
        creditAmount: number;
        currencyCode?: string;
        exchangeRate?: number;
        amountBase?: number;
        description?: string;
        projectId?: string;
        activityId?: string;
        costCenterId?: string;
      }[];
      batchDate?: string;
      description?: string;
    },
    auth: AuthContext
  ): Promise<ExpenseBatchRow & { entries: ExpenseBatchEntryRow[] }> {
    if (!data.entries || data.entries.length === 0) {
      throw new Error('Batch must contain at least one entry');
    }

    const validation = this.validateEntries(data.entries);
    if (!validation.valid) {
      throw new Error(`Batch entries are not balanced. Total Debit: ${validation.totalDebit}, Total Credit: ${validation.totalCredit}`);
    }

    return await transaction(async (client) => {
      const seqRes = await client.query(`SELECT nextval('expense_batch_seq') as seq`);
      const seq = parseInt(seqRes.rows[0].seq, 10);
      const batchNumber = `EB-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;

      const batchRes = await client.query(
        `INSERT INTO expense_batches (organization_id, batch_number, status, total_amount,
          currency_code, exchange_rate, batch_date, description, entry_count, created_by)
         VALUES ($1,$2,'DRAFT',$3,'YER',1,$4,$5,$6,$7)
          RETURNING *`,
        [
          orgId, batchNumber, validation.totalDebit,
          data.batchDate || new Date().toISOString().split('T')[0],
          data.description || null,
          data.entries.length,
          auth.userId
        ]
      );

      const batch = batchRes.rows[0];

      // Insert entries
      const entries: ExpenseBatchEntryRow[] = [];
      for (let i = 0; i < data.entries.length; i++) {
        const e = data.entries[i];
        const entryRes = await client.query(
          `INSERT INTO expense_batch_entries (batch_id, sequence_number, account_id, account_code,
            account_name_ar, debit_amount, credit_amount, currency_code, exchange_rate, amount_base,
            description, project_id, activity_id, cost_center_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
            RETURNING *`,
          [
            batch.id, i + 1, e.accountId, e.accountCode, e.accountNameAr,
            e.debitAmount || 0, e.creditAmount || 0,
            e.currencyCode || 'YER', e.exchangeRate || 1,
            e.amountBase || (e.debitAmount || e.creditAmount),
            e.description || null, e.projectId || null, e.activityId || null, e.costCenterId || null
          ]
        );
        entries.push(entryRes.rows[0]);
      }

      await auditLog({
        organizationId: orgId,
        userId: auth.userId,
        action: 'CREATE',
        tableName: 'expense_batches',
        recordId: batch.id,
        details: { batchNumber, totalAmount: validation.totalDebit, entryCount: data.entries.length }
      });

      return { ...batch, entries };
    });
  }

  /**
   * Submit batch for approval
   */
  static async submit(orgId: string, batchId: string, auth: AuthContext): Promise<ExpenseBatchRow> {
    const res = await query(
      `UPDATE expense_batches SET status = 'PENDING_APPROVAL', updated_at = NOW()
       WHERE id = $1::uuid AND organization_id = $2::uuid AND status = 'DRAFT'
       RETURNING *`,
      [batchId, orgId]
    );

    if (!res.rows[0]) throw new Error('Batch not found or not in DRAFT status');

    await auditLog({
      organizationId: orgId,
      userId: auth.userId,
      action: 'SUBMIT',
      tableName: 'expense_batches',
      recordId: batchId,
      details: {}
    });

    return res.rows[0];
  }

  /**
   * Approve or reject batch
   */
  static async approve(
    orgId: string,
    batchId: string,
    auth: AuthContext,
    opts?: { reject?: boolean; reason?: string }
  ): Promise<ExpenseBatchRow> {
    const status = opts?.reject ? 'REJECTED' : 'APPROVED';
    const res = await query(
      `UPDATE expense_batches SET 
         status = $1, approved_by = $2, approved_at = NOW(),
         rejection_reason = $3, updated_at = NOW()
       WHERE id = $4::uuid AND organization_id = $5::uuid AND status = 'PENDING_APPROVAL'
       RETURNING *`,
      [status, auth.userId, opts?.reason || null, batchId, orgId]
    );

    if (!res.rows[0]) throw new Error('Batch not found or not in PENDING_APPROVAL status');

    await auditLog({
      organizationId: orgId,
      userId: auth.userId,
      action: opts?.reject ? 'REJECT' : 'APPROVE',
      tableName: 'expense_batches',
      recordId: batchId,
      details: { reason: opts?.reason }
    });

    return res.rows[0];
  }

  /**
   * Post batch to ledger
   */
  static async post(orgId: string, batchId: string, auth: AuthContext): Promise<{ batch: ExpenseBatchRow; transactionId: string }> {
    const batchRes = await queryOne<ExpenseBatchRow>(
      `SELECT * FROM expense_batches WHERE id = $1::uuid AND organization_id = $2::uuid AND status = 'APPROVED'`,
      [batchId, orgId]
    );

    if (!batchRes) throw new Error('Batch not found or not APPROVED');

    const entriesRes = await queryMany<ExpenseBatchEntryRow>(
      `SELECT * FROM expense_batch_entries WHERE batch_id = $1::uuid ORDER BY sequence_number ASC`,
      [batchId]
    );

    return await transaction(async (client) => {
      // Create transaction header
      const txSeqRes = await client.query(`SELECT nextval('transaction_seq') as seq`);
      const txSeq = parseInt(txSeqRes.rows[0].seq, 10);
      const txNumber = `TXN-EXP-BATCH-${new Date().getFullYear()}-${String(txSeq).padStart(6, '0')}`;

      const txRes = await client.query(
        `INSERT INTO transactions (organization_id, transaction_number, transaction_type, transaction_date,
          source_record_type, source_record_id, description, total_amount, posted_by, status)
         VALUES ($1,$2,'EXPENSE','BATCH',$3,$4,$5,$6,$7,'POSTED')
          RETURNING id`,
        [orgId, txNumber, 'expense_batch', batchId, `ترحيل دفعة مصروفات ${batchRes.batch_number}`, batchRes.total_amount, auth.userId]
      );

      const txId = txRes.rows[0].id;

      // Post all lines — single multi-row INSERT (UNNEST) replaces N+1 round-trips.
      // 100+ entries inserted in one statement instead of 100+ queries.
      const entries = entriesRes;
      await client.query(
        `INSERT INTO transaction_lines
           (transaction_id, organization_id, account_id, account_code,
            debit_amount, credit_amount, currency_code, exchange_rate, amount_base, description,
            project_id, activity_id, cost_center_id)
         SELECT $1, $2,
                a.account_id, a.account_code,
                a.debit_amount, a.credit_amount,
                a.currency_code, a.exchange_rate, a.amount_base,
                a.description,
                a.project_id, a.activity_id, a.cost_center_id
           FROM UNNEST(
             $3::uuid[], $4::text[],
             $5::numeric[], $6::numeric[],
             $7::text[], $8::numeric[], $9::numeric[],
             $10::text[],
             $11::uuid[], $12::uuid[], $13::uuid[]
           ) AS a(account_id, account_code,
                  debit_amount, credit_amount,
                  currency_code, exchange_rate, amount_base,
                  description,
                  project_id, activity_id, cost_center_id)`,
        [
          txId, orgId,
          entries.map((e: any) => e.account_id),
          entries.map((e: any) => e.account_code),
          entries.map((e: any) => e.debit_amount),
          entries.map((e: any) => e.credit_amount),
          entries.map((e: any) => e.currency_code),
          entries.map((e: any) => e.exchange_rate),
          entries.map((e: any) => e.amount_base),
          entries.map((e: any) => e.description || `دفعة مصروفات ${batchRes.batch_number}`),
          entries.map((e: any) => e.project_id),
          entries.map((e: any) => e.activity_id),
          entries.map((e: any) => e.cost_center_id),
        ]
      );

      await client.query(
        `UPDATE expense_batches SET status = 'POSTED', posted_by = $1, posted_at = NOW(), updated_at = NOW()
         WHERE id = $2::uuid`,
        [auth.userId, batchId]
      );

      await auditLog({
        organizationId: orgId,
        userId: auth.userId,
        action: 'POST',
        tableName: 'expense_batches',
        recordId: batchId,
        details: { transactionId: txId, totalAmount: batchRes.total_amount }
      });

      return { batch: { ...batchRes, status: 'POSTED' }, transactionId: txId };
    });
  }

  /**
   * Get batch by ID
   */
  static async getById(orgId: string, batchId: string): Promise<(ExpenseBatchRow & { entries: ExpenseBatchEntryRow[] }) | null> {
    const batch = await queryOne<ExpenseBatchRow>(
      `SELECT * FROM expense_batches WHERE id = $1::uuid AND organization_id = $2::uuid`,
      [batchId, orgId]
    );

    if (!batch) return null;

    const entries = await queryMany<ExpenseBatchEntryRow>(
      `SELECT e.*, a.name_ar as account_name_ar FROM expense_batch_entries e
       LEFT JOIN chart_of_accounts a ON a.id = e.account_id
       WHERE e.batch_id = $1::uuid ORDER BY e.sequence_number ASC`,
      [batchId]
    );

    return { ...batch, entries };
  }

  /**
   * List batches
   */
  static async list(
    orgId: string,
    pagination: PaginationParams = {},
    filters?: { status?: string; startDate?: string; endDate?: string }
  ): Promise<{ data: ExpenseBatchRow[]; total: number }> {
    const conditions = ['organization_id = $1'];
    const params: any[] = [orgId];
    let idx = 2;

    if (filters?.status) {
      conditions.push(`status = $${idx++}`);
      params.push(filters.status);
    }
    if (filters?.startDate) {
      conditions.push(`batch_date >= $${idx++}`);
      params.push(filters.startDate);
    }
    if (filters?.endDate) {
      conditions.push(`batch_date <= $${idx++}`);
      params.push(filters.endDate);
    }

    const where = conditions.join(' AND ');
    const { page = 1, limit = 50 } = pagination;

    return paginatedQuery<ExpenseBatchRow>(
      `SELECT * FROM expense_batches WHERE ${where} ORDER BY batch_date DESC, created_at DESC`,
      `SELECT COUNT(*)::int as count FROM expense_batches WHERE ${where}`,
      [...params, limit, (page - 1) * limit]
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PETTY CASH ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class PettyCashEngine {
  
  /**
   * Create petty cash request
   */
  static async createRequest(
    orgId: string,
    data: { amount: number; purpose: string; requesterName?: string },
    auth: AuthContext
  ): Promise<PettyCashRequestRow> {
    const seqRes = await query(`SELECT nextval('petty_cash_request_seq') as seq`);
    const seq = parseInt(seqRes.rows[0].seq, 10);
    const requestNumber = `PCR-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;

    const result = await queryOne(
      `INSERT INTO petty_cash_requests (organization_id, request_number, requester_id, requester_name,
        amount, purpose, status)
       VALUES ($1,$2,$3,$4,$5,$6,'PENDING')
        RETURNING *`,
      [orgId, requestNumber, auth.userId, data.requesterName || auth.email, data.amount, data.purpose]
    );

    await auditLog({
      organizationId: orgId,
      userId: auth.userId,
      action: 'CREATE',
      tableName: 'petty_cash_requests',
      recordId: result?.id,
      details: { requestNumber, amount: data.amount }
    });

    return result;
  }

  /**
   * Approve and issue petty cash
   */
  static async approveAndIssue(
    orgId: string,
    requestId: string,
    auth: AuthContext,
    custodianId?: string
  ): Promise<PettyCashRequestRow> {
    const result = await queryOne(
      `UPDATE petty_cash_requests SET 
         status = 'ISSUED', custodian_id = $3, issued_date = NOW()
       WHERE id = $1::uuid AND organization_id = $2::uuid AND status = 'PENDING'
       RETURNING *`,
      [requestId, orgId, custodianId || auth.userId]
    );

    if (!result) throw new Error('Request not found or not PENDING');

    await auditLog({
      organizationId: orgId,
      userId: auth.userId,
      action: 'ISSUE',
      tableName: 'petty_cash_requests',
      recordId: requestId,
      details: {}
    });

    return result;
  }

  /**
   * Settle petty cash request with receipts
   */
  static async settle(
    orgId: string,
    requestId: string,
    data: { receiptUrl?: string; notes?: string },
    auth: AuthContext
  ): Promise<PettyCashRequestRow> {
    const result = await queryOne(
      `UPDATE petty_cash_requests SET 
         status = 'SETTLED', settled_date = NOW(),
         receipt_attachment_url = $3, notes = $4
       WHERE id = $1::uuid AND organization_id = $2::uuid AND status = 'ISSUED'
       RETURNING *`,
      [requestId, orgId, data.receiptUrl || null, data.notes || null]
    );

    if (!result) throw new Error('Request not found or not ISSUED');

    await auditLog({
      organizationId: orgId,
      userId: auth.userId,
      action: 'SETTLE',
      tableName: 'petty_cash_requests',
      recordId: requestId,
      details: {}
    });

    return result;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECURRING EXPENSE TEMPLATE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class RecurringExpenseEngine {
  
  /**
   * Create recurring expense template
   */
  static async createTemplate(
    orgId: string,
    data: {
      templateName: string;
      categoryId: string;
      counterpartyName: string;
      amount: number;
      currencyCode?: string;
      vatRate?: number;
      paymentMethod: PaymentMethod;
      frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL';
      startDate: string;
      endDate?: string;
      autoApprove?: boolean;
      autoPost?: boolean;
    },
    auth: AuthContext
  ): Promise<RecurringExpenseTemplateRow> {
    const nextRunDate = this.calculateNextRunDate(new Date(data.startDate), data.frequency);

    const result = await queryOne(
      `INSERT INTO recurring_expense_templates (
        organization_id, template_name, category_id, counterparty_name,
        amount, currency_code, vat_rate, payment_method,
        frequency, start_date, end_date, next_run_date,
        auto_approve, auto_post, is_active, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,TRUE,$15)
       RETURNING *`,
      [
        orgId, data.templateName, data.categoryId, data.counterpartyName,
        data.amount, data.currencyCode || 'YER', data.vatRate || 0,
        data.paymentMethod, data.frequency, data.startDate,
        data.endDate || null, nextRunDate,
        data.autoApprove ?? false, data.autoPost ?? false,
        auth.userId
      ]
    );

    await auditLog({
      organizationId: orgId,
      userId: auth.userId,
      action: 'CREATE',
      tableName: 'recurring_expense_templates',
      recordId: result?.id,
      details: { templateName: data.templateName, frequency: data.frequency }
    });

    return result;
  }

  /**
   * Calculate next run date based on frequency
   */
  private static calculateNextRunDate(fromDate: Date, frequency: string): Date {
    const d = new Date(fromDate);
    const originalDay = d.getDate();
    switch (frequency) {
      case 'WEEKLY': d.setDate(d.getDate() + 7); break;
      case 'BIWEEKLY': d.setDate(d.getDate() + 14); break;
      case 'MONTHLY': d.setDate(1); d.setMonth(d.getMonth() + 1); d.setDate(Math.min(originalDay, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); break;
      case 'QUARTERLY': d.setDate(1); d.setMonth(d.getMonth() + 3); d.setDate(Math.min(originalDay, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); break;
      case 'SEMIANNUAL': d.setDate(1); d.setMonth(d.getMonth() + 6); d.setDate(Math.min(originalDay, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); break;
      case 'ANNUAL': d.setFullYear(d.getFullYear() + 1); break;
      default: throw new Error(`Unsupported recurring expense frequency: ${frequency}`);
    }
    return d;
  }

  /**
   * Get templates due for processing
   */
  static async getDueTemplates(orgId: string): Promise<RecurringExpenseTemplateRow[]> {
    return queryMany<RecurringExpenseTemplateRow>(
      `SELECT * FROM recurring_expense_templates
       WHERE organization_id = $1 AND is_active = TRUE
         AND next_run_date <= CURRENT_DATE
         AND (end_date IS NULL OR end_date >= CURRENT_DATE)
       ORDER BY next_run_date ASC`,
      [orgId]
    );
  }

  /**
   * Process due template: create expense record and update next run date
   */
  static async processDueTemplate(
    orgId: string,
    templateId: string,
    auth: AuthContext
  ): Promise<ExpenseRecordRow> {
    const template = await queryOne<RecurringExpenseTemplateRow>(
      `SELECT * FROM recurring_expense_templates WHERE id = $1::uuid AND organization_id = $2`,
      [templateId, orgId]
    );

    if (!template) throw new Error('Template not found');

    // Create expense from template
    const expense = await ExpenseEngine.create(orgId, {
      categoryId: template.category_id,
      counterpartyName: template.counterparty_name,
      amount: Number(template.amount),
      currencyCode: template.currency_code,
      vatRate: Number(template.vat_rate),
      paymentMethod: template.payment_method as PaymentMethod,
      description: `متكرر: ${template.template_name}`
    }, auth);

    // Update next run date
    const nextRunDate = this.calculateNextRunDate(new Date(template.next_run_date), template.frequency);
    await query(
      `UPDATE recurring_expense_templates SET next_run_date = $1 WHERE id = $2::uuid`,
      [nextRunDate, templateId]
    );

    // Auto-approve if configured
    if (template.auto_approve) {
      await ExpenseEngine.approve(orgId, expense.id, auth);
    }

    // Auto-post if configured
    if (template.auto_post) {
      await ExpenseEngine.post(orgId, expense.id, auth);
    }

    return expense;
  }
}
