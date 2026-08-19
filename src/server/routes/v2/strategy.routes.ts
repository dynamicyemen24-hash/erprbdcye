/**
 * NexoraOS™ — V2 Routes: Strategy & Performance (NEB-01)
 */

import { Router, Response } from 'express';
import { StrategicPlanEngine, StrategicGoalEngine, KPIEngine2, SWOTEngine, StrategicAlignmentEngine } from '../../engines/strategy.engine';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { successResponse, errorResponse, extractTenantId } from '../../core/helpers';

const router = Router();

// ─── Strategic Plans ───────────────────────────────────

router.get('/plans', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await StrategicPlanEngine.list(extractTenantId(req), {
      page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 50,
    }, { status: req.query.status as string, year: Number(req.query.year) || undefined });
    successResponse(res, result);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.get('/plans/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const plan = await StrategicPlanEngine.getById(req.params.id);
    if (!plan) return errorResponse(res, 'Plan not found', 404);
    successResponse(res, plan);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.post('/plans', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = { userId: req.user!.id, email: req.user!.email, role: req.user!.role, orgId: extractTenantId(req), securityLevel: req.user!.security_level || 5 };
    const plan = await StrategicPlanEngine.create({ organizationId: auth.orgId, ...req.body }, auth);
    successResponse(res, plan, 201);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.put('/plans/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const plan = await StrategicPlanEngine.update(req.params.id, req.body);
    if (!plan) return errorResponse(res, 'Plan not found', 404);
    successResponse(res, plan);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.delete('/plans/:id', async (req: AuthenticatedRequest, res: Response) => {
  try { await StrategicPlanEngine.delete(req.params.id); successResponse(res, { message: 'Deleted' }); }
  catch (err: any) { errorResponse(res, err.message); }
});

// ─── Strategic Goals ───────────────────────────────────

router.get('/plans/:planId/goals', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await StrategicGoalEngine.listByPlan(req.params.planId)); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.post('/plans/:planId/goals', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = { userId: req.user!.id, email: req.user!.email, role: req.user!.role, orgId: extractTenantId(req), securityLevel: req.user!.security_level || 5 };
    const goal = await StrategicGoalEngine.create({ planId: req.params.planId, ...req.body }, auth);
    successResponse(res, goal, 201);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.put('/goals/:goalId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const goal = await StrategicGoalEngine.update(req.params.goalId, req.body);
    if (!goal) return errorResponse(res, 'Goal not found', 404);
    successResponse(res, goal);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.delete('/goals/:goalId', async (req: AuthenticatedRequest, res: Response) => {
  try { await StrategicGoalEngine.delete(req.params.goalId); successResponse(res, { message: 'Deleted' }); }
  catch (err: any) { errorResponse(res, err.message); }
});

// ─── KPIs ──────────────────────────────────────────────

router.get('/kpis', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await KPIEngine2.list(extractTenantId(req), {
      page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 50,
    }, { category: req.query.category as string, planId: req.query.planId as string, goalId: req.query.goalId as string, status: req.query.status as string });
    successResponse(res, result);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.post('/kpis', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = { userId: req.user!.id, email: req.user!.email, role: req.user!.role, orgId: extractTenantId(req), securityLevel: req.user!.security_level || 5 };
    const kpi = await KPIEngine2.create({ organizationId: auth.orgId, ...req.body }, auth);
    successResponse(res, kpi, 201);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.put('/kpis/:kpiId/value', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const kpi = await KPIEngine2.updateValue(req.params.kpiId, req.body.currentValue);
    successResponse(res, kpi);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.delete('/kpis/:kpiId', async (req: AuthenticatedRequest, res: Response) => {
  try { await KPIEngine2.delete(req.params.kpiId); successResponse(res, { message: 'Deleted' }); }
  catch (err: any) { errorResponse(res, err.message); }
});

// ─── SWOT ──────────────────────────────────────────────

router.get('/swot', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await SWOTEngine.getMatrix(extractTenantId(req), req.query.planId as string)); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.post('/swot', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = { userId: req.user!.id, email: req.user!.email, role: req.user!.role, orgId: extractTenantId(req), securityLevel: req.user!.security_level || 5 };
    const item = await SWOTEngine.create({ organizationId: auth.orgId, ...req.body }, auth);
    successResponse(res, item, 201);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.delete('/swot/:id', async (req: AuthenticatedRequest, res: Response) => {
  try { await SWOTEngine.delete(req.params.id); successResponse(res, { message: 'Deleted' }); }
  catch (err: any) { errorResponse(res, err.message); }
});

// ─── Alignment ─────────────────────────────────────────

router.get('/alignment/:planId', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await StrategicAlignmentEngine.getAlignment(extractTenantId(req), req.params.planId)); }
  catch (err: any) { errorResponse(res, err.message); }
});

export default router;
