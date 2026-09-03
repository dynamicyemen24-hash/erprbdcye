/**
 * NexoraOS™ — Unified Revenue API Routes (v2) — NEB-15
 * Full lifecycle for ANY revenue type tied to projects & WBS activities:
 * streams registry, records, approval, IPSAS posting, collections, intelligence
 * Batch revenue, schedules, and funding caps
 */

import { Router, Response } from 'express';
import { RevenueStreamEngine, RevenueEngine, RevenueIntelligenceEngine, RevenueBatchEngine, FundingCapEngine, RevenueScheduleEngine } from '../../engines/revenue.engine';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { requireFinancePolicy } from '../../middleware/policy.middleware';
import { successResponse, errorResponse, extractTenantId, isValidUUID } from '../../core/helpers';

const router = Router();

/** Build engine AuthContext from the authenticated request (v2 convention). */
function authOf(req: AuthenticatedRequest) {
  return {
    userId: req.user!.id,
    email: req.user!.email,
    role: req.user!.role,
    orgId: extractTenantId(req),
    securityLevel: req.user!.security_level || 5,
  };
}

// ─── Revenue Streams Registry ──────────────────────────

router.get('/streams', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const streams = await RevenueStreamEngine.list(orgId, { activeOnly: req.query.activeOnly === 'true' });
    successResponse(res, streams);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/streams', requireFinancePolicy('CREATE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const stream = await RevenueStreamEngine.create(orgId, req.body, authOf(req));
    successResponse(res, stream, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ─── Revenue Records (Unified Lifecycle) ───────────────

router.get('/records', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await RevenueEngine.list(orgId, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
    }, {
      status: req.query.status as string,
      revenueType: req.query.revenueType as string,
      streamCode: req.query.streamCode as string,
      projectId: req.query.projectId as string,
      activityId: req.query.activityId as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    });
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.get('/records/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    if (!isValidUUID(req.params.id)) return errorResponse(res, 'Invalid revenue record id', 400);
    const record = await RevenueEngine.getById(orgId, req.params.id);
    if (!record) return errorResponse(res, 'Revenue record not found', 404);
    successResponse(res, record);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/records', requireFinancePolicy('CREATE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const record = await RevenueEngine.create(orgId, req.body, authOf(req));
    successResponse(res, record, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/records/:id/submit', requireFinancePolicy('CREATE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const record = await RevenueEngine.submit(orgId, req.params.id, authOf(req));
    successResponse(res, record);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/records/:id/approve', requireFinancePolicy('APPROVE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const record = await RevenueEngine.approve(orgId, req.params.id, authOf(req), {
      reject: req.body?.reject === true,
      reason: req.body?.reason,
    });
    successResponse(res, record);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/records/:id/post', requireFinancePolicy('APPROVE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const record = await RevenueEngine.post(orgId, req.params.id, authOf(req));
    successResponse(res, record);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/records/:id/collect', requireFinancePolicy('APPROVE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    if (!isValidUUID(req.params.id)) return errorResponse(res, 'Invalid revenue record id', 400);
    const result = await RevenueEngine.collect(orgId, req.params.id, req.body, authOf(req));
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.get('/records/:id/collections', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    if (!isValidUUID(req.params.id)) return errorResponse(res, 'Invalid revenue record id', 400);
    const collections = await RevenueEngine.getCollections(orgId, req.params.id);
    successResponse(res, collections);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/records/:id/void', requireFinancePolicy('APPROVE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const record = await RevenueEngine.void(orgId, req.params.id, authOf(req), req.body?.reason);
    successResponse(res, record);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ─── Revenue Intelligence ──────────────────────────────

router.get('/intelligence/snapshot', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const snapshot = await RevenueIntelligenceEngine.getSnapshot(orgId, {
      months: Number(req.query.months) || 12,
    });
    successResponse(res, snapshot);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

export default router;

// ═══════════════════════════════════════════════════════════════════════
// EXTENDED: Revenue Batch Routes — NEB-15 Batch Processing
// ═══════════════════════════════════════════════════════════════════════

router.get('/batches', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await RevenueBatchEngine.list(orgId, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
    }, {
      status: req.query.status as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    });
    successResponse(res, result);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.get('/batches/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    if (!isValidUUID(req.params.id)) return errorResponse(res, 'Invalid batch id', 400);
    const batch = await RevenueBatchEngine.getById(orgId, req.params.id);
    if (!batch) return errorResponse(res, 'Batch not found', 404);
    successResponse(res, batch);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.post('/batches', requireFinancePolicy('CREATE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const batch = await RevenueBatchEngine.create(orgId, req.body, authOf(req));
    successResponse(res, batch, 201);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.post('/batches/:id/submit', requireFinancePolicy('CREATE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const batch = await RevenueBatchEngine.submit(orgId, req.params.id, authOf(req));
    successResponse(res, batch);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.post('/batches/:id/approve', requireFinancePolicy('APPROVE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const batch = await RevenueBatchEngine.approve(orgId, req.params.id, authOf(req), {
      reject: req.body?.reject === true,
      reason: req.body?.reason,
    });
    successResponse(res, batch);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.post('/batches/:id/post', requireFinancePolicy('APPROVE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await RevenueBatchEngine.post(orgId, req.params.id, authOf(req));
    successResponse(res, result);
  } catch (err: any) { errorResponse(res, err.message); }
});

// ═══════════════════════════════════════════════════════════════════════
// EXTENDED: Funding Cap Routes — NEB-15 Ceiling Enforcement
// ═══════════════════════════════════════════════════════════════════════

router.get('/funding-caps', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const caps = await FundingCapEngine.list(orgId, { activeOnly: req.query.activeOnly === 'true' });
    successResponse(res, caps);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.get('/funding-caps/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    if (!isValidUUID(req.params.id)) return errorResponse(res, 'Invalid cap id', 400);
    const cap = await FundingCapEngine.getById(orgId, req.params.id);
    if (!cap) return errorResponse(res, 'Funding cap not found', 404);
    successResponse(res, cap);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.get('/funding-caps/:id/utilization', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    if (!isValidUUID(req.params.id)) return errorResponse(res, 'Invalid cap id', 400);
    const utilization = await FundingCapEngine.getUtilization(orgId, req.params.id);
    successResponse(res, utilization);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.post('/funding-caps', requireFinancePolicy('CREATE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const cap = await FundingCapEngine.create(orgId, req.body, authOf(req));
    successResponse(res, cap, 201);
  } catch (err: any) { errorResponse(res, err.message); }
});

// ═══════════════════════════════════════════════════════════════════════
// EXTENDED: Revenue Schedule Routes — NEB-15 Future-Dated Revenue
// ═══════════════════════════════════════════════════════════════════════

router.get('/schedules', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const schedules = await RevenueScheduleEngine.list(orgId, {
      status: req.query.status as string,
    });
    successResponse(res, schedules);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.get('/schedules/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    if (!isValidUUID(req.params.id)) return errorResponse(res, 'Invalid schedule id', 400);
    const schedule = await RevenueScheduleEngine.getById(orgId, req.params.id);
    if (!schedule) return errorResponse(res, 'Schedule not found', 404);
    successResponse(res, schedule);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.post('/schedules', requireFinancePolicy('CREATE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const schedule = await RevenueScheduleEngine.create(orgId, req.body, authOf(req));
    successResponse(res, schedule, 201);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.post('/schedules/:id/installments/:instNumber/collect', requireFinancePolicy('APPROVE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    if (!isValidUUID(req.params.id)) return errorResponse(res, 'Invalid schedule id', 400);
    const instNumber = parseInt(req.params.instNumber, 10);
    const { recordId, collectedAmount } = req.body;
    if (!recordId) return errorResponse(res, 'recordId is required', 400);
    if (!collectedAmount || Number(collectedAmount) <= 0) return errorResponse(res, 'collectedAmount must be positive', 400);
    const result = await RevenueScheduleEngine.markInstallmentCollected(
      orgId, req.params.id, instNumber, recordId, Number(collectedAmount), authOf(req)
    );
    successResponse(res, result);
  } catch (err: any) { errorResponse(res, err.message); }
});
