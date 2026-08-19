/**
 * NexoraOS™ — Procurement API Routes (v2)
 * RFQs, Vendor Bids, Purchase Orders, 3-Way Match, Vendor Performance
 */

import { Router, Response } from 'express';
import {
  RFQEngine, VendorBidEngine, PurchaseOrderEngine,
  ThreeWayMatchEngine, VendorPerformanceEngine
} from '../../engines/procurement.engine';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { successResponse, errorResponse, extractTenantId } from '../../core/helpers';

const router = Router();

// ─── RFQs ──────────────────────────────────────────────

router.get('/rfqs', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await RFQEngine.list(orgId, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
    }, {
      status: req.query.status as string,
      projectId: req.query.projectId as string,
      search: req.query.search as string,
    });
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.get('/rfqs/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rfq = await RFQEngine.getById(req.params.id);
    if (!rfq) return errorResponse(res, 'RFQ not found', 404);
    successResponse(res, rfq);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/rfqs', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const auth = {
      userId: req.user!.id,
      email: req.user!.email,
      role: req.user!.role,
      orgId,
      securityLevel: req.user!.security_level || 5,
    };

    const rfq = await RFQEngine.create({ organizationId: orgId, ...req.body }, auth);
    successResponse(res, rfq, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/rfqs/:id/award', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = {
      userId: req.user!.id,
      email: req.user!.email,
      role: req.user!.role,
      orgId: extractTenantId(req),
      securityLevel: req.user!.security_level || 5,
    };

    const result = await RFQEngine.award(req.params.id, req.body.winningBidId, auth);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ─── Vendor Bids ───────────────────────────────────────

router.post('/bids', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = {
      userId: req.user!.id,
      email: req.user!.email,
      role: req.user!.role,
      orgId: extractTenantId(req),
      securityLevel: req.user!.security_level || 5,
    };

    const bid = await VendorBidEngine.submit(req.body, auth);
    successResponse(res, bid, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/bids/:id/evaluate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = {
      userId: req.user!.id,
      email: req.user!.email,
      role: req.user!.role,
      orgId: extractTenantId(req),
      securityLevel: req.user!.security_level || 5,
    };

    const bid = await VendorBidEngine.evaluate(req.params.id, req.body, auth);
    successResponse(res, bid);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ─── Purchase Orders ───────────────────────────────────

router.get('/purchase-orders', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await PurchaseOrderEngine.list(orgId, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
    }, {
      status: req.query.status as string,
      vendorId: req.query.vendorId as string,
    });
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/purchase-orders/:id/approve', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = {
      userId: req.user!.id,
      email: req.user!.email,
      role: req.user!.role,
      orgId: extractTenantId(req),
      securityLevel: req.user!.security_level || 5,
    };

    const po = await PurchaseOrderEngine.approve(req.params.id, auth);
    successResponse(res, po);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/purchase-orders/:id/receive', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = {
      userId: req.user!.id,
      email: req.user!.email,
      role: req.user!.role,
      orgId: extractTenantId(req),
      securityLevel: req.user!.security_level || 5,
    };

    const result = await PurchaseOrderEngine.confirmReceipt(req.params.id, req.body, auth);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ─── 3-Way Match ───────────────────────────────────────

router.post('/three-way-match', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = {
      userId: req.user!.id,
      email: req.user!.email,
      role: req.user!.role,
      orgId: extractTenantId(req),
      securityLevel: req.user!.security_level || 5,
    };

    const result = await ThreeWayMatchEngine.performMatch(req.body.poId, req.body, auth);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.get('/three-way-match/:poId/history', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const history = await ThreeWayMatchEngine.getMatchHistory(req.params.poId);
    successResponse(res, history);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ─── Vendor Performance ────────────────────────────────

router.get('/vendors/:id/performance', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await VendorPerformanceEngine.getVendorStats(req.params.id);
    successResponse(res, stats);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.get('/vendors/top', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const limit = Number(req.query.limit) || 10;
    const vendors = await VendorPerformanceEngine.getTopVendors(orgId, limit);
    successResponse(res, vendors);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

export default router;
