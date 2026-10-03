/**
 * NexoraOS™ — Institutional Reports API Routes (v2)
 * Budget variance, donor stewardship, cash flow, trial balance,
 * executive brief, audit activity. Read-only analytics surface.
 */

import { Router, Response, NextFunction } from 'express';
import { InstitutionalReportsEngine } from '../../engines/institutional-reports.engine';
import { getPeriodCloseChecklist } from '../../services/period-close.service';
import {
  getAccountLedger,
  getUnpostedWorklist,
  getVendorAging,
  getGrantReceivablesFollowUp,
} from '../../services/accountant-workbench.service';
import { auditNebCoverage } from '../../governance/neb-registry';
import { getDatabasePool } from '../../services/db.service';
import { AuthenticatedRequest, requirePermission } from '../../middleware/auth.middleware';
import { PERMISSIONS } from '../../../shared/permissions/permission-map';

/** Financial reads are permission-scoped (shared matrix drives the UI gates too). */
const requireFinanceRead = requirePermission(PERMISSIONS.FINANCE_READ);
import { successResponse, errorResponse, extractTenantId } from '../../core/helpers';

const router = Router();

export interface BranchScope {
  userBranch: string | null;
  requested: string | null;
  effective: string | null;
  restricted: boolean;
}

const UNRESTRICTED_BRANCHES = new Set(['', 'HQ', 'ALL']);

export async function resolveBranchScope(
  orgId: string,
  userId: string | undefined,
  requested: string | null
): Promise<BranchScope> {
  let userBranch: string | null = null;
  if (userId) {
    try {
      const row = await getDatabasePool().query(
        `SELECT branch_code FROM users WHERE id = $1 AND organization_id = $2`,
        [userId, orgId]
      ).then((r) => r.rows[0] as Record<string, unknown> | undefined);
      if (row?.branch_code) userBranch = String(row.branch_code).toUpperCase();
    } catch {
      userBranch = null;
    }
  }
  const restricted = userBranch !== null && !UNRESTRICTED_BRANCHES.has(userBranch);
  if (restricted && requested && requested.toUpperCase() !== userBranch) {
    throw Object.assign(new Error('Branch access denied for this user'), { statusCode: 403 });
  }
  return {
    userBranch,
    requested,
    effective: requested ?? (restricted ? userBranch : null),
    restricted,
  };
}

function requestedBranchOf(req: AuthenticatedRequest): string | null {
  const raw = (req.query.branchCode as string | undefined) ?? (req.query.branch_code as string | undefined);
  return raw ? raw.toUpperCase() : null;
}

router.use(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    (req as AuthenticatedRequest & { branchScope?: BranchScope }).branchScope = await resolveBranchScope(
      extractTenantId(req),
      req.user?.id,
      requestedBranchOf(req)
    );
    next();
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number }).statusCode ?? 400;
    errorResponse(res, (err as Error).message, statusCode);
  }
});

function effectiveBranchOf(req: AuthenticatedRequest): string | null {
  return (req as AuthenticatedRequest & { branchScope?: BranchScope }).branchScope?.effective ?? requestedBranchOf(req);
}

function filtersOf(req: AuthenticatedRequest) {
  return {
    startDate: req.query.startDate as string | undefined,
    endDate: req.query.endDate as string | undefined,
    projectId: req.query.projectId as string | undefined,
    programId: req.query.programId as string | undefined,
    activityId: req.query.activityId as string | undefined,
    fiscalYearId: req.query.fiscalYearId as string | undefined,
    currency: req.query.currency as string | undefined,
    lang: req.query.lang as string | undefined,
    branchCode: effectiveBranchOf(req) ?? undefined,
  };
}

router.get('/budget-variance', requireFinanceRead, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const report = await InstitutionalReportsEngine.generateBudgetVarianceReport(extractTenantId(req), filtersOf(req));
    successResponse(res, report);
  } catch (err: unknown) {
    errorResponse(res, (err as Error).message);
  }
});

router.get('/donor-report', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const report = await InstitutionalReportsEngine.generateDonorReport(extractTenantId(req), filtersOf(req));
    successResponse(res, report);
  } catch (err: unknown) {
    errorResponse(res, (err as Error).message);
  }
});

router.get('/cash-flow', requireFinanceRead, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const report = await InstitutionalReportsEngine.generateCashFlowReport(extractTenantId(req), filtersOf(req));
    successResponse(res, report);
  } catch (err: unknown) {
    errorResponse(res, (err as Error).message);
  }
});

router.get('/trial-balance', requireFinanceRead, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const report = await InstitutionalReportsEngine.generateTrialBalanceReport(extractTenantId(req), filtersOf(req));
    successResponse(res, report);
  } catch (err: unknown) {
    errorResponse(res, (err as Error).message);
  }
});

router.get('/executive-brief', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const report = await InstitutionalReportsEngine.generateExecutiveBrief(extractTenantId(req), filtersOf(req));
    successResponse(res, report);
  } catch (err: unknown) {
    errorResponse(res, (err as Error).message);
  }
});

router.get('/audit-activity', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const report = await InstitutionalReportsEngine.generateAuditActivityReport(extractTenantId(req), filtersOf(req));
    successResponse(res, report);
  } catch (err: unknown) {
    errorResponse(res, (err as Error).message);
  }
});

router.get('/period-close', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const fiscalYearId = req.query.fiscalYearId as string | undefined;
    if (!fiscalYearId) {
      errorResponse(res, 'fiscalYearId query parameter is required', 400);
      return;
    }
    const checklist = await getPeriodCloseChecklist(extractTenantId(req), fiscalYearId);
    successResponse(res, checklist);
  } catch (err: unknown) {
    errorResponse(res, (err as Error).message);
  }
});

router.get('/neb-coverage', async (req: AuthenticatedRequest, res: Response) => {
  try {
    successResponse(res, auditNebCoverage());
  } catch (err: unknown) {
    errorResponse(res, (err as Error).message);
  }
});

router.get('/ledger', requireFinanceRead, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const accountId = req.query.accountId as string | undefined;
    if (!accountId) {
      errorResponse(res, 'accountId query parameter is required', 400);
      return;
    }
    const ledger = await getAccountLedger(extractTenantId(req), accountId, {
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      status: (req.query.status as string | undefined) ?? 'POSTED',
      branchCode: effectiveBranchOf(req) ?? undefined,
      projectId: req.query.projectId as string | undefined,
      activityId: req.query.activityId as string | undefined,
    });
    successResponse(res, ledger);
  } catch (err: unknown) {
    errorResponse(res, (err as Error).message);
  }
});

router.get('/unposted-worklist', requireFinanceRead, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await getUnpostedWorklist(extractTenantId(req), {
      fiscalYearId: req.query.fiscalYearId as string | undefined,
      branchCode: effectiveBranchOf(req) ?? undefined,
    });
    successResponse(res, list);
  } catch (err: unknown) {
    errorResponse(res, (err as Error).message);
  }
});

router.get('/vendor-aging', requireFinanceRead, async (req: AuthenticatedRequest, res: Response) => {
  try {
    successResponse(res, await getVendorAging(extractTenantId(req)));
  } catch (err: unknown) {
    errorResponse(res, (err as Error).message);
  }
});

router.get('/grant-receivables', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dueSoonDays = Number(req.query.dueSoonDays) || 45;
    successResponse(res, await getGrantReceivablesFollowUp(extractTenantId(req), dueSoonDays));
  } catch (err: unknown) {
    errorResponse(res, (err as Error).message);
  }
});

router.get('/finance-scorecard', requireFinanceRead, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const report = await InstitutionalReportsEngine.generateFinanceScorecard(extractTenantId(req), filtersOf(req));
    successResponse(res, report);
  } catch (err: unknown) {
    errorResponse(res, (err as Error).message);
  }
});

export default router;
