/**
 * NexoraOS™ — Procurement API Routes (v2)
 * RFQs, Vendor Bids, Purchase Orders, 3-Way Match, Vendor Performance
 */

import { Router, Response } from 'express';
import {
  RFQEngine, VendorBidEngine, PurchaseOrderEngine,
  ThreeWayMatchEngine, VendorPerformanceEngine
} from '../../engines/procurement.engine';
import { TenderEngine, AuctionEngine } from '../../engines/tender.engine';
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
    const rfq = await RFQEngine.getById(extractTenantId(req), req.params.id);
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

// ─── Tenders (المناقصات — دورة حياة كاملة) ─────────────────────

router.get('/tenders', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await TenderEngine.list(orgId, {
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

router.get('/tenders/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tender = await TenderEngine.getById(extractTenantId(req), req.params.id);
    if (!tender) return errorResponse(res, 'المناقصة غير موجودة', 404);
    successResponse(res, tender);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/tenders', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = { userId: req.user!.id, email: req.user!.email, role: req.user!.role, orgId: extractTenantId(req), securityLevel: req.user!.security_level || 5 };
    const tender = await TenderEngine.create({ organizationId: extractTenantId(req), ...req.body }, auth);
    successResponse(res, tender, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/tenders/:id/transition', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = { userId: req.user!.id, email: req.user!.email, role: req.user!.role, orgId: extractTenantId(req), securityLevel: req.user!.security_level || 5 };
    const result = await TenderEngine.transitionTender(req.params.id, req.body.targetStatus, auth);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/tenders/:id/bids', async (req: AuthenticatedRequest, res: Response) => {
  try {

// ─── Auctions (المزايدات الإلكترونية) ───────────────────────────

router.get('/auctions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await AuctionEngine.list(orgId, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
    }, { status: req.query.status as string });
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.get('/auctions/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auction = await AuctionEngine.getById(req.params.id);
    successResponse(res, auction);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/auctions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = { userId: req.user!.id, email: req.user!.email, role: req.user!.role, orgId: extractTenantId(req), securityLevel: req.user!.security_level || 5 };
    const auction = await AuctionEngine.create({ organizationId: extractTenantId(req), ...req.body }, auth);
    successResponse(res, auction, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/auctions/:id/open', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = { userId: req.user!.id, email: req.user!.email, role: req.user!.role, orgId: extractTenantId(req), securityLevel: req.user!.security_level || 5 };
    const result = await AuctionEngine.openLive(req.params.id, auth);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/auctions/:id/close', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = { userId: req.user!.id, email: req.user!.email, role: req.user!.role, orgId: extractTenantId(req), securityLevel: req.user!.security_level || 5 };
    const result = await AuctionEngine.close(req.params.id, auth);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/auctions/:id/bids', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = { userId: req.user!.id, email: req.user!.email, role: req.user!.role, orgId: extractTenantId(req), securityLevel: req.user!.security_level || 5 };
    const bid = await AuctionEngine.placeBid(req.params.id, req.body, auth);
    successResponse(res, bid, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/auctions/:id/award', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = { userId: req.user!.id, email: req.user!.email, role: req.user!.role, orgId: extractTenantId(req), securityLevel: req.user!.security_level || 5 };
    const result = await AuctionEngine.award(req.params.id, auth);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

    const auth = { userId: req.user!.id, email: req.user!.email, role: req.user!.role, orgId: extractTenantId(req), securityLevel: req.user!.security_level || 5 };
    const bid = await TenderEngine.submitBid(req.params.id, { ...req.body, vendorId: req.body.vendorId }, auth);
    successResponse(res, bid, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/tenders/bids/:bidId/evaluate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = { userId: req.user!.id, email: req.user!.email, role: req.user!.role, orgId: extractTenantId(req), securityLevel: req.user!.security_level || 5 };
    const bid = await TenderEngine.evaluateBid(req.params.bidId, req.body, auth);
    successResponse(res, bid);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.get('/tenders/:id/evaluation', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const summary = await TenderEngine.getEvaluationSummary(req.params.id);
    successResponse(res, summary);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/tenders/:id/award', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = { userId: req.user!.id, email: req.user!.email, role: req.user!.role, orgId: extractTenantId(req), securityLevel: req.user!.security_level || 5 };
    const result = await TenderEngine.awardTender(req.params.id, req.body.winningBidId, auth);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});


export default router;
