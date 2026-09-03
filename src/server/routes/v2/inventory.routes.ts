/**
 * UAMEX ERP™ — NEB-05/NEB-09: Inventory & Warehouse OS API Routes (v2)
 * مسارات وحدة المخازن: مدخلات أساسية، عمليات، مستندات، تقارير، سياسات
 */

import { Router, Response } from 'express';
import {
  InventoryPolicyEngine, ItemEngine, CategoryEngine, UomEngine,
  WarehouseEngine, StockMovementEngine, TransferEngine,
  AdjustmentEngine, StocktakeEngine, InventoryAnalyticsEngine,
  assertInventoryPermission,
} from '../../engines/inventory.engine';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { successResponse, errorResponse, extractTenantId } from '../../core/helpers';
import type { AuthContext } from '../../core/helpers';

const router = Router();

/** بناء سياق المصادقة المعياري */
function buildAuth(req: AuthenticatedRequest): AuthContext {
  return {
    userId: req.user!.id,
    email: req.user!.email,
    role: req.user!.role,
    orgId: extractTenantId(req),
    securityLevel: (req.user as any)?.security_level || 5,
  };
}

function pagination(req: AuthenticatedRequest) {
  return {
    page: Number(req.query.page) || 1,
    limit: Math.min(Number(req.query.limit) || 50, 200),
  };
}

// ─── لوحة القيادة وذكاء الأعمال ────────────────────────────

router.get('/dashboard', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const policy = await InventoryPolicyEngine.get(orgId);
    const data = await InventoryAnalyticsEngine.dashboard(orgId, policy);
    successResponse(res, data);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ─── السياسات والإعدادات ──────────────────────────────────

router.get('/policies', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    successResponse(res, await InventoryPolicyEngine.get(orgId));
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.put('/policies', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await InventoryPolicyEngine.update(orgId, req.body, buildAuth(req));
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ─── دليل الأصناف ─────────────────────────────────────────

router.get('/items', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await ItemEngine.list(orgId, pagination(req), {
      status: req.query.status as string,
      categoryId: req.query.categoryId as string,
      itemType: req.query.itemType as string,
      search: req.query.search as string,
    });
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.get('/items/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const item = await ItemEngine.getById(orgId, req.params.id);
    if (!item) return errorResponse(res, 'الصنف غير موجود', 404);
    successResponse(res, item);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/items', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const item = await ItemEngine.create(orgId, req.body, buildAuth(req));
    successResponse(res, item, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.put('/items/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const item = await ItemEngine.update(orgId, req.params.id, req.body, buildAuth(req));
    successResponse(res, item);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ─── الفئات ووحدات القياس ─────────────────────────────────

router.get('/categories', async (req: AuthenticatedRequest, res: Response) => {
  try {
    successResponse(res, await CategoryEngine.list(extractTenantId(req)));
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/categories', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    successResponse(res, await CategoryEngine.create(orgId, req.body, buildAuth(req)), 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.get('/uoms', async (req: AuthenticatedRequest, res: Response) => {
  try {
    successResponse(res, await UomEngine.list(extractTenantId(req)));
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/uoms', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    successResponse(res, await UomEngine.create(orgId, req.body, buildAuth(req)), 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ─── المخازن ──────────────────────────────────────────────

router.get('/warehouses', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await WarehouseEngine.list(orgId, pagination(req), {
      status: req.query.status as string,
      search: req.query.search as string,
    });
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/warehouses', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    successResponse(res, await WarehouseEngine.create(orgId, req.body, buildAuth(req)), 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ─── الأرصدة الحالية ──────────────────────────────────────

router.get('/balances', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await StockMovementEngine.listBalances(orgId, pagination(req), {
      warehouseId: req.query.warehouseId as string,
      itemId: req.query.itemId as string,
      categoryId: req.query.categoryId as string,
      belowReorder: req.query.belowReorder === 'true',
      nearExpiryDays: req.query.nearExpiryDays ? Number(req.query.nearExpiryDays) : undefined,
      search: req.query.search as string,
    });
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ─── دفتر الحركات والترحيل المباشر ────────────────────────

router.get('/movements', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await StockMovementEngine.list(orgId, pagination(req), {
      movementType: req.query.movementType as string,
      warehouseId: req.query.warehouseId as string,
      itemId: req.query.itemId as string,
      status: req.query.status as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      search: req.query.search as string,
    });
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/movements/post', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const movement = await StockMovementEngine.postMovement(orgId, req.body, buildAuth(req));
    successResponse(res, movement, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ─── أوامر التحويل ────────────────────────────────────────

router.get('/transfers', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await TransferEngine.list(orgId, pagination(req), {
      status: req.query.status as string,
      warehouseId: req.query.warehouseId as string,
      search: req.query.search as string,
    });
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/transfers', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const transfer = await TransferEngine.create(orgId, req.body, buildAuth(req));
    successResponse(res, transfer, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/transfers/:id/transition', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await TransferEngine.transition(orgId, req.params.id, req.body.targetStatus, buildAuth(req));
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ─── التسويات ─────────────────────────────────────────────

router.get('/adjustments', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await AdjustmentEngine.list(orgId, pagination(req), {
      status: req.query.status as string,
      warehouseId: req.query.warehouseId as string,
      reasonCode: req.query.reasonCode as string,
      search: req.query.search as string,
    });
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/adjustments', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const adjustment = await AdjustmentEngine.create(orgId, req.body, buildAuth(req));
    successResponse(res, adjustment, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/adjustments/:id/transition', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await AdjustmentEngine.transition(orgId, req.params.id, req.body.targetStatus, buildAuth(req));
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ─── الجرد الفعلي ─────────────────────────────────────────

router.get('/stocktakes', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await StocktakeEngine.list(orgId, pagination(req), {
      status: req.query.status as string,
      warehouseId: req.query.warehouseId as string,
      search: req.query.search as string,
    });
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.get('/stocktakes/:id/lines', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    successResponse(res, await StocktakeEngine.getLines(orgId, req.params.id));
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/stocktakes', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const stocktake = await StocktakeEngine.create(orgId, req.body, buildAuth(req));
    successResponse(res, stocktake, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/stocktakes/:id/counts', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await StocktakeEngine.submitCounts(orgId, req.params.id, req.body.counts || [], buildAuth(req));
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/stocktakes/:id/transition', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await StocktakeEngine.transition(orgId, req.params.id, req.body.targetStatus, buildAuth(req));
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

export default router;
