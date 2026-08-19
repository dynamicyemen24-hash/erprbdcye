/**
 * NexoraOS™ — Finance API Routes (v2)
 * Chart of Accounts, Transactions, Trial Balance, Balance Sheet, Income Statement, Budgets
 */

import { Router, Response } from 'express';
import {
  ChartOfAccountsService, LedgerEngine, FiscalYearService,
  BudgetService, CurrencyService
} from '../../engines/finance.engine';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { successResponse, errorResponse, extractTenantId } from '../../core/helpers';

const router = Router();

// ─── Chart of Accounts ─────────────────────────────────

router.get('/chart-of-accounts', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await ChartOfAccountsService.list(orgId, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 100,
      search: req.query.search as string,
    });
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.get('/chart-of-accounts/tree', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const tree = await ChartOfAccountsService.getTree(orgId);
    successResponse(res, tree);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.get('/chart-of-accounts/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const account = await ChartOfAccountsService.getById(req.params.id);
    if (!account) return errorResponse(res, 'Account not found', 404);
    successResponse(res, account);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/chart-of-accounts', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const account = await ChartOfAccountsService.create(orgId, req.body);
    successResponse(res, account, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.put('/chart-of-accounts/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const account = await ChartOfAccountsService.update(req.params.id, req.body);
    if (!account) return errorResponse(res, 'Account not found', 404);
    successResponse(res, account);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.delete('/chart-of-accounts/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ChartOfAccountsService.delete(req.params.id);
    successResponse(res, { message: 'Account deleted' });
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ─── Transactions ──────────────────────────────────────

router.post('/transactions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const auth = {
      userId: req.user!.id,
      email: req.user!.email,
      role: req.user!.role,
      orgId,
      securityLevel: req.user!.security_level || 5,
    };

    const result = await LedgerEngine.postVoucher({
      organizationId: orgId,
      transactionNumber: req.body.transactionNumber,
      transactionType: req.body.transactionType || 'JOURNAL_ENTRY',
      description: req.body.description || '',
      referenceNumber: req.body.referenceNumber,
      projectId: req.body.projectId,
      lines: req.body.lines || [],
    }, auth);

    successResponse(res, result, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.get('/transactions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await LedgerEngine.listTransactions(orgId, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
    }, {
      type: req.query.type as string,
      status: req.query.status as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    });
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.get('/transactions/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tx = await LedgerEngine.getTransactionDetail(req.params.id);
    if (!tx) return errorResponse(res, 'Transaction not found', 404);
    successResponse(res, tx);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/transactions/:id/reverse', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const auth = {
      userId: req.user!.id,
      email: req.user!.email,
      role: req.user!.role,
      orgId,
      securityLevel: req.user!.security_level || 5,
    };

    const result = await LedgerEngine.reverseVoucher(
      req.params.id,
      req.body.reason || 'Reversal requested',
      auth
    );
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ─── Financial Statements ──────────────────────────────

router.get('/trial-balance', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await LedgerEngine.getTrialBalance(orgId, req.query.fiscalYearId as string);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.get('/balance-sheet', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await LedgerEngine.getBalanceSheet(orgId, req.query.asOfDate as string);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.get('/income-statement', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await LedgerEngine.getIncomeStatement(orgId);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ─── Fiscal Years ──────────────────────────────────────

router.get('/fiscal-years', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const years = await FiscalYearService.list(orgId);
    successResponse(res, years);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/fiscal-years', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const year = await FiscalYearService.create(orgId, req.body);
    successResponse(res, year, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/fiscal-years/:id/close', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const auth = {
      userId: req.user!.id,
      email: req.user!.email,
      role: req.user!.role,
      orgId,
      securityLevel: req.user!.security_level || 5,
    };

    const result = await FiscalYearService.close(req.params.id, auth);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ─── Budgets ───────────────────────────────────────────

router.get('/budgets', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const budgets = await BudgetService.list(orgId, req.query.fiscalYearId as string);
    successResponse(res, budgets);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/budgets', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const budget = await BudgetService.create(orgId, req.body);
    successResponse(res, budget, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.get('/budget-variance', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const fiscalYearId = req.query.fiscalYearId as string;
    if (!fiscalYearId) return errorResponse(res, 'fiscalYearId is required', 400);

    const variance = await BudgetService.getVariance(orgId, fiscalYearId);
    successResponse(res, variance);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ─── Currency ──────────────────────────────────────────

router.get('/currencies', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currencies = await CurrencyService.list(extractTenantId(req));
    successResponse(res, currencies);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.get('/exchange-rate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return errorResponse(res, 'from and to currencies required', 400);

    const rate = await CurrencyService.getExchangeRate(extractTenantId(req), from as string, to as string);
    successResponse(res, rate);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/exchange-rate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fromCurrency, toCurrency, rate } = req.body;
    const result = await CurrencyService.updateRate(extractTenantId(req), fromCurrency, toCurrency, rate);
    successResponse(res, result, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

export default router;
