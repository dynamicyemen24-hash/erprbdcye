/**
 * NexoraOS™ — UAMEX ERP™ NEB-10: Unified Expense API Routes (v2)
 * ============================================================================
 * Full lifecycle for expense management tied to projects & WBS activities:
 *  - Expense Categories Registry
 *  - Expense Records (DRAFT→POSTED→PAID→RECONCILED)
 *  - Approval Workflows
 *  - Payment Management
 *  - Petty Cash
 *  - Recurring Expenses
 *  - Expense Intelligence (KPIs, Analytics)
 *  - Batch Journal Entries
 * ============================================================================
 */

import { Router, Response } from 'express';
import {
  ExpenseCategoryEngine,
  ExpenseEngine,
  ExpenseIntelligenceEngine,
  ExpenseBatchEngine,
  PettyCashEngine,
  RecurringExpenseEngine
} from '../../engines/expense.engine';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { successResponse, errorResponse, extractTenantId, isValidUUID } from '../../core/helpers';

const router = Router();

/** Build engine AuthContext from the authenticated request */
function authOf(req: AuthenticatedRequest) {
  return {
    userId: req.user!.id,
    email: req.user!.email,
    role: req.user!.role,
    orgId: extractTenantId(req),
    securityLevel: req.user!.security_level || 5,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPENSE CATEGORIES REGISTRY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v2/expense/categories
 * List all expense categories
 */
router.get('/categories', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const categories = await ExpenseCategoryEngine.list(orgId, {
      activeOnly: req.query.activeOnly === 'true',
      parentOnly: req.query.parentOnly === 'true',
      categoryType: req.query.categoryType as any
    });
    successResponse(res, categories);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

/**
 * GET /api/v2/expense/categories/tree
 * Get expense category tree structure
 */
router.get('/categories/tree', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const tree = await ExpenseCategoryEngine.getTree(orgId);
    successResponse(res, tree);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

/**
 * GET /api/v2/expense/categories/:code
 * Get category by code
 */
router.get('/categories/:code', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const category = await ExpenseCategoryEngine.getByCode(orgId, req.params.code);
    if (!category) return errorResponse(res, 'Category not found', 404);
    successResponse(res, category);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

/**
 * POST /api/v2/expense/categories
 * Create a new expense category
 */
router.post('/categories', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const category = await ExpenseCategoryEngine.create(orgId, req.body, authOf(req));
    successResponse(res, category, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

/**
 * DELETE /api/v2/expense/categories/:id
 * Deactivate an expense category
 */
router.delete('/categories/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    if (!isValidUUID(req.params.id)) return errorResponse(res, 'Invalid category id', 400);
    await ExpenseCategoryEngine.deactivate(orgId, req.params.id, authOf(req));
    successResponse(res, { message: 'Category deactivated' });
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXPENSE RECORDS — Core Lifecycle
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v2/expense/records
 * List expense records with pagination and filters
 */
router.get('/records', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await ExpenseEngine.list(orgId, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
    }, {
      status: req.query.status as string,
      categoryCode: req.query.categoryCode as string,
      categoryType: req.query.categoryType as any,
      projectId: req.query.projectId as string,
      activityId: req.query.activityId as string,
      costCenterId: req.query.costCenterId as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      minAmount: req.query.minAmount ? Number(req.query.minAmount) : undefined,
      maxAmount: req.query.maxAmount ? Number(req.query.maxAmount) : undefined,
      counterpartyName: req.query.counterpartyName as string,
    });
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

/**
 * GET /api/v2/expense/records/:id
 * Get expense record by ID
 */
router.get('/records/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    if (!isValidUUID(req.params.id)) return errorResponse(res, 'Invalid expense record id', 400);
    const record = await ExpenseEngine.getById(orgId, req.params.id);
    if (!record) return errorResponse(res, 'Expense record not found', 404);
    successResponse(res, record);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

/**
 * POST /api/v2/expense/records
 * Create a new expense record (DRAFT)
 */
router.post('/records', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const record = await ExpenseEngine.create(orgId, req.body, authOf(req));
    successResponse(res, record, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

/**
 * POST /api/v2/expense/records/:id/submit
 * Submit expense for approval (DRAFT → PENDING_APPROVAL)
 */
router.post('/records/:id/submit', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    if (!isValidUUID(req.params.id)) return errorResponse(res, 'Invalid expense record id', 400);
    const record = await ExpenseEngine.submit(orgId, req.params.id, authOf(req));
    successResponse(res, record);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

/**
 * POST /api/v2/expense/records/:id/approve
 * Approve or reject expense (PENDING_APPROVAL → APPROVED/REJECTED)
 */
router.post('/records/:id/approve', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    if (!isValidUUID(req.params.id)) return errorResponse(res, 'Invalid expense record id', 400);
    const record = await ExpenseEngine.approve(orgId, req.params.id, authOf(req), {
      reject: req.body?.reject === true,
      reason: req.body?.reason,
    });
    successResponse(res, record);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

/**
 * POST /api/v2/expense/records/:id/post
 * Post expense to IPSAS ledger (APPROVED → POSTED)
 */
router.post('/records/:id/post', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    if (!isValidUUID(req.params.id)) return errorResponse(res, 'Invalid expense record id', 400);
    const record = await ExpenseEngine.post(orgId, req.params.id, authOf(req));
    successResponse(res, record);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

/**
 * POST /api/v2/expense/records/:id/pay
 * Mark expense as paid (POSTED → PAID)
 */
router.post('/records/:id/pay', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    if (!isValidUUID(req.params.id)) return errorResponse(res, 'Invalid expense record id', 400);
    const record = await ExpenseEngine.markPaid(orgId, req.params.id, authOf(req), {
      paymentMethod: req.body?.paymentMethod,
      paymentReference: req.body?.paymentReference,
      paymentDate: req.body?.paymentDate,
      paidAmount: req.body?.paidAmount ? Number(req.body.paidAmount) : undefined,
    });
    successResponse(res, record);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

/**
 * POST /api/v2/expense/records/:id/reconcile
 * Reconcile expense (PAID → RECONCILED)
 */
router.post('/records/:id/reconcile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    if (!isValidUUID(req.params.id)) return errorResponse(res, 'Invalid expense record id', 400);
    const record = await ExpenseEngine.reconcile(orgId, req.params.id, authOf(req));
    successResponse(res, record);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

/**
 * POST /api/v2/expense/records/:id/cancel
 * Cancel expense record
 */
router.post('/records/:id/cancel', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    if (!isValidUUID(req.params.id)) return errorResponse(res, 'Invalid expense record id', 400);
    const record = await ExpenseEngine.cancel(orgId, req.params.id, authOf(req), req.body?.reason);
    successResponse(res, record);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

/**
 * DELETE /api/v2/expense/records/:id
 * Soft delete expense record
 */
router.delete('/records/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    if (!isValidUUID(req.params.id)) return errorResponse(res, 'Invalid expense record id', 400);
    await ExpenseEngine.delete(orgId, req.params.id, authOf(req));
    successResponse(res, { message: 'Expense record deleted' });
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXPENSE INTELLIGENCE — KPIs & Analytics
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v2/expense/intelligence
 * Get comprehensive expense intelligence snapshot
 */
router.get('/intelligence', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const snapshot = await ExpenseIntelligenceEngine.getSnapshot(orgId, {
      months: Number(req.query.months) || 12,
      projectId: req.query.projectId as string,
      costCenterId: req.query.costCenterId as string,
    });
    successResponse(res, snapshot);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

/**
 * GET /api/v2/expense/forecast
 * Get expense forecast based on historical trends
 */
router.get('/forecast', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const months = Number(req.query.months) || 12;
    const periods = Number(req.query.periods) || 3;
    
    // Get historical data
    const snapshot = await ExpenseIntelligenceEngine.getSnapshot(orgId, { months });
    const forecast = ExpenseIntelligenceEngine.forecast(
      snapshot.monthlyTrend.map(m => ({ month: m.month, total_expenses: m.total_expenses })),
      periods
    );
    
    successResponse(res, { forecast, historical: snapshot.monthlyTrend });
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PETTY CASH MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/v2/expense/petty-cash/requests
 * Create petty cash request
 */
router.post('/petty-cash/requests', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const request = await PettyCashEngine.createRequest(orgId, req.body, authOf(req));
    successResponse(res, request, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

/**
 * POST /api/v2/expense/petty-cash/requests/:id/issue
 * Approve and issue petty cash
 */
router.post('/petty-cash/requests/:id/issue', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    if (!isValidUUID(req.params.id)) return errorResponse(res, 'Invalid request id', 400);
    const request = await PettyCashEngine.approveAndIssue(orgId, req.params.id, authOf(req));
    successResponse(res, request);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

/**
 * POST /api/v2/expense/petty-cash/requests/:id/settle
 * Settle petty cash with receipts
 */
router.post('/petty-cash/requests/:id/settle', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    if (!isValidUUID(req.params.id)) return errorResponse(res, 'Invalid request id', 400);
    const request = await PettyCashEngine.settle(orgId, req.params.id, req.body, authOf(req));
    successResponse(res, request);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// RECURRING EXPENSE TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/v2/expense/recurring/templates
 * Create recurring expense template
 */
router.post('/recurring/templates', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const template = await RecurringExpenseEngine.createTemplate(orgId, req.body, authOf(req));
    successResponse(res, template, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

/**
 * GET /api/v2/expense/recurring/due
 * Get templates due for processing
 */
router.get('/recurring/due', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const templates = await RecurringExpenseEngine.getDueTemplates(orgId);
    successResponse(res, templates);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

/**
 * POST /api/v2/expense/recurring/templates/:id/process
 * Process a due recurring template
 */
router.post('/recurring/templates/:id/process', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    if (!isValidUUID(req.params.id)) return errorResponse(res, 'Invalid template id', 400);
    const expense = await RecurringExpenseEngine.processDueTemplate(orgId, req.params.id, authOf(req));
    successResponse(res, expense);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXPENSE BATCH — Bulk Journal Entries
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v2/expense/batches
 * List expense batches
 */
router.get('/batches', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await ExpenseBatchEngine.list(orgId, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
    }, {
      status: req.query.status as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    });
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

/**
 * GET /api/v2/expense/batches/:id
 * Get batch by ID with entries
 */
router.get('/batches/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    if (!isValidUUID(req.params.id)) return errorResponse(res, 'Invalid batch id', 400);
    const batch = await ExpenseBatchEngine.getById(orgId, req.params.id);
    if (!batch) return errorResponse(res, 'Batch not found', 404);
    successResponse(res, batch);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

/**
 * POST /api/v2/expense/batches
 * Create expense batch
 */
router.post('/batches', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const batch = await ExpenseBatchEngine.create(orgId, req.body, authOf(req));
    successResponse(res, batch, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

/**
 * POST /api/v2/expense/batches/:id/submit
 * Submit batch for approval
 */
router.post('/batches/:id/submit', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    if (!isValidUUID(req.params.id)) return errorResponse(res, 'Invalid batch id', 400);
    const batch = await ExpenseBatchEngine.submit(orgId, req.params.id, authOf(req));
    successResponse(res, batch);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

/**
 * POST /api/v2/expense/batches/:id/approve
 * Approve or reject batch
 */
router.post('/batches/:id/approve', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    if (!isValidUUID(req.params.id)) return errorResponse(res, 'Invalid batch id', 400);
    const batch = await ExpenseBatchEngine.approve(orgId, req.params.id, authOf(req), {
      reject: req.body?.reject === true,
      reason: req.body?.reason,
    });
    successResponse(res, batch);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

/**
 * POST /api/v2/expense/batches/:id/post
 * Post batch to ledger
 */
router.post('/batches/:id/post', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    if (!isValidUUID(req.params.id)) return errorResponse(res, 'Invalid batch id', 400);
    const result = await ExpenseBatchEngine.post(orgId, req.params.id, authOf(req));
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

export default router;
