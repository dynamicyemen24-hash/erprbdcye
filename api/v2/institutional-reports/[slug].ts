import { applyBaseSecurity, authContext, fail, getPool } from '../../_shared/core.js';
import { can, PERMISSIONS } from '../../../src/shared/permissions/permission-map.js';

/**
 * GET /api/v2/institutional-reports/:slug - Vercel serverless shim.
 * Mirrors src/server/routes/v2/institutional-reports.routes.ts dispatch:
 * - Bearer auth + org claim (fail closed in production)
 * - finance:read permission gate on the 7 finance-scoped reports (shared matrix)
 * - HQ/unrestricted branch reads; restricted users locked to their branch
 * - Envelope { success, data } consumed by useLiveReport/unwrap.
 * Engines are imported lazily so cold starts stay small and a missing
 * module degrades to 503 instead of crashing the function.
 */

const FINANCE_READ_SLUGS = new Set([
  'budget-variance',
  'cash-flow',
  'trial-balance',
  'ledger',
  'unposted-worklist',
  'vendor-aging',
  'finance-scorecard',
]);

const UNRESTRICTED_BRANCHES = new Set(['', 'HQ', 'ALL']);

interface Filters {
  startDate?: string;
  endDate?: string;
  projectId?: string;
  programId?: string;
  activityId?: string;
  fiscalYearId?: string;
  currency?: string;
  lang?: string;
  branchCode?: string;
}

async function resolveBranchScope(
  pool: any,
  orgId: string,
  userId: string | undefined,
  requested: string | null
): Promise<string | null> {
  let userBranch: string | null = null;
  if (userId) {
    try {
      const r = await pool.query(
        `SELECT branch_code FROM users WHERE id = $1 AND organization_id = $2`,
        [userId, orgId]
      );
      if (r.rows[0]?.branch_code) userBranch = String(r.rows[0].branch_code).toUpperCase();
    } catch {
      userBranch = null;
    }
  }
  const restricted = userBranch !== null && !UNRESTRICTED_BRANCHES.has(userBranch);
  if (restricted && requested && requested.toUpperCase() !== userBranch) {
    const e: any = new Error('Branch access denied for this user');
    e.status = 403;
    throw e;
  }
  return requested ?? (restricted ? userBranch : null);
}

export default async function handler(req: any, res: any) {
  applyBaseSecurity(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return fail(res, 405, 'Method Not Allowed');

  try {
    const { payload, orgId } = authContext(req);

    if (FINANCE_READ_SLUGS.has(String(req.query.slug))) {
      const subject = { role: payload.role ?? null, security_level: payload.security_level ?? null };
      if (!can(subject, PERMISSIONS.FINANCE_READ)) {
        return fail(res, 403, 'Insufficient permissions for financial reports');
      }
    }

    const pool = getPool();
    if (!pool) return fail(res, 503, 'Database unavailable');

    const q = req.query || {};
    const slug = String(q.slug || '');
    const requestedRaw = (q.branchCode as string | undefined) ?? (q.branch_code as string | undefined);
    const requested = requestedRaw ? requestedRaw.toUpperCase() : null;
    const effectiveBranch = await resolveBranchScope(pool, orgId, payload.id, requested);

    const filters: Filters = {
      startDate: q.startDate as string | undefined,
      endDate: q.endDate as string | undefined,
      projectId: q.projectId as string | undefined,
      programId: q.programId as string | undefined,
      activityId: q.activityId as string | undefined,
      fiscalYearId: q.fiscalYearId as string | undefined,
      currency: q.currency as string | undefined,
      lang: q.lang as string | undefined,
      branchCode: effectiveBranch ?? undefined,
    };

    let data: unknown;

    switch (slug) {
      case 'budget-variance':
      case 'donor-report':
      case 'cash-flow':
      case 'trial-balance':
      case 'executive-brief':
      case 'audit-activity':
      case 'finance-scorecard': {
        const { InstitutionalReportsEngine } = await import(
          '../../../src/server/engines/institutional-reports.engine.js'
        );
        const fnMap: Record<string, (org: string, f: Filters) => Promise<unknown>> = {
          'budget-variance': (o, f) => InstitutionalReportsEngine.generateBudgetVarianceReport(o, f),
          'donor-report': (o, f) => InstitutionalReportsEngine.generateDonorReport(o, f),
          'cash-flow': (o, f) => InstitutionalReportsEngine.generateCashFlowReport(o, f),
          'trial-balance': (o, f) => InstitutionalReportsEngine.generateTrialBalanceReport(o, f),
          'executive-brief': (o, f) => InstitutionalReportsEngine.generateExecutiveBrief(o, f),
          'audit-activity': (o, f) => InstitutionalReportsEngine.generateAuditActivityReport(o, f),
          'finance-scorecard': (o, f) => InstitutionalReportsEngine.generateFinanceScorecard(o, f),
        };
        data = await fnMap[slug](orgId, filters);
        break;
      }

      case 'period-close': {
        const fiscalYearId = q.fiscalYearId as string | undefined;
        if (!fiscalYearId) return fail(res, 400, 'fiscalYearId query parameter is required');
        const { getPeriodCloseChecklist } = await import(
          '../../../src/server/services/period-close.service.js'
        );
        data = await getPeriodCloseChecklist(orgId, fiscalYearId);
        break;
      }

      case 'neb-coverage': {
        const { auditNebCoverage } = await import('../../../src/server/governance/neb-registry.js');
        data = auditNebCoverage();
        break;
      }

      case 'ledger': {
        const accountId = q.accountId as string | undefined;
        if (!accountId) return fail(res, 400, 'accountId query parameter is required');
        const { getAccountLedger } = await import(
          '../../../src/server/services/accountant-workbench.service.js'
        );
        data = await getAccountLedger(orgId, accountId, {
          startDate: q.startDate as string | undefined,
          endDate: q.endDate as string | undefined,
          status: (q.status as string | undefined) ?? 'POSTED',
          branchCode: effectiveBranch ?? undefined,
          projectId: q.projectId as string | undefined,
          activityId: q.activityId as string | undefined,
        });
        break;
      }

      case 'unposted-worklist': {
        const { getUnpostedWorklist } = await import(
          '../../../src/server/services/accountant-workbench.service.js'
        );
        data = await getUnpostedWorklist(orgId, {
          fiscalYearId: q.fiscalYearId as string | undefined,
          branchCode: effectiveBranch ?? undefined,
        });
        break;
      }

      case 'vendor-aging': {
        const { getVendorAging } = await import(
          '../../../src/server/services/accountant-workbench.service.js'
        );
        data = await getVendorAging(orgId);
        break;
      }

      case 'grant-receivables': {
        const { getGrantReceivablesFollowUp } = await import(
          '../../../src/server/services/accountant-workbench.service.js'
        );
        const dueSoonDays = Number(q.dueSoonDays) || 45;
        data = await getGrantReceivablesFollowUp(orgId, dueSoonDays);
        break;
      }

      default:
        return fail(res, 404, `Unknown report: ${slug}`);
    }

    return res.status(200).json({ success: true, data, timestamp: new Date().toISOString() });
  } catch (err: any) {
    const status = err.status || 400;
    const degraded = String(err.message || '').includes('Cannot find module');
    console.error('[API/InstitutionalReports] handler error:', err.message);
    if (degraded) return fail(res, 503, 'Report engine unavailable');
    return fail(res, status, status >= 500 ? 'Internal server error' : err.message || 'Report failed');
  }
}
