/**
 * NexoraOS™ — Project Management API Routes (v2)
 * Projects, Milestones, Schedules, EVM, Gantt
 */

import { Router, Response } from 'express';
import { ProjectEngine, MilestoneEngine, ScheduleEngine } from '../../engines/project.engine';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { successResponse, errorResponse, extractTenantId } from '../../core/helpers';

const router = Router();

// ─── Projects ──────────────────────────────────────────

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await ProjectEngine.list(orgId, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
    }, {
      status: req.query.status as string,
      programId: req.query.programId as string,
      search: req.query.search as string,
    });
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.get('/dashboard', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const dashboard = await ProjectEngine.getDashboard(orgId);
    successResponse(res, dashboard);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const project = await ProjectEngine.getById(req.params.id);
    if (!project) return errorResponse(res, 'Project not found', 404);
    successResponse(res, project);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const auth = {
      userId: req.user!.id,
      email: req.user!.email,
      role: req.user!.role,
      orgId,
      securityLevel: req.user!.security_level || 5,
    };

    const project = await ProjectEngine.create({
      organizationId: orgId,
      ...req.body,
    }, auth);

    successResponse(res, project, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = {
      userId: req.user!.id,
      email: req.user!.email,
      role: req.user!.role,
      orgId: extractTenantId(req),
      securityLevel: req.user!.security_level || 5,
    };

    const project = await ProjectEngine.update(req.params.id, req.body, auth);
    if (!project) return errorResponse(res, 'Project not found', 404);
    successResponse(res, project);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = {
      userId: req.user!.id,
      email: req.user!.email,
      role: req.user!.role,
      orgId: extractTenantId(req),
      securityLevel: req.user!.security_level || 5,
    };

    await ProjectEngine.delete(req.params.id, auth);
    successResponse(res, { message: 'Project deleted' });
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ─── EVM ───────────────────────────────────────────────

router.get('/:id/evm', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const evm = await ProjectEngine.calculateEVM(req.params.id);
    if (!evm) return errorResponse(res, 'Project not found', 404);
    successResponse(res, evm);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ─── Gantt ─────────────────────────────────────────────

router.get('/:id/gantt', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const gantt = await ProjectEngine.getGanttData(req.params.id);
    successResponse(res, gantt);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ─── Milestones ────────────────────────────────────────

router.get('/:projectId/milestones', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const milestones = await MilestoneEngine.listByProject(req.params.projectId);
    successResponse(res, milestones);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/:projectId/milestones', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = {
      userId: req.user!.id,
      email: req.user!.email,
      role: req.user!.role,
      orgId: extractTenantId(req),
      securityLevel: req.user!.security_level || 5,
    };

    const milestone = await MilestoneEngine.create({
      projectId: req.params.projectId,
      ...req.body,
    }, auth);

    successResponse(res, milestone, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.put('/milestones/:milestoneId/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = {
      userId: req.user!.id,
      email: req.user!.email,
      role: req.user!.role,
      orgId: extractTenantId(req),
      securityLevel: req.user!.security_level || 5,
    };

    const milestone = await MilestoneEngine.updateStatus(
      req.params.milestoneId,
      req.body.status,
      auth
    );
    successResponse(res, milestone);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ─── Schedules ─────────────────────────────────────────

router.get('/:projectId/schedules', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schedules = await ScheduleEngine.listByProject(req.params.projectId);
    successResponse(res, schedules);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/:projectId/schedules', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schedule = await ScheduleEngine.create({
      projectId: req.params.projectId,
      ...req.body,
    });
    successResponse(res, schedule, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.put('/schedules/:scheduleId/progress', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schedule = await ScheduleEngine.updateProgress(
      req.params.scheduleId,
      req.body.progressPct
    );
    successResponse(res, schedule);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

export default router;
