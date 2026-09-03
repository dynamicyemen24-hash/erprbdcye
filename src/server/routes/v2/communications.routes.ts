/**
 * NexoraOS™ — Intelligent Administrative Communications API Routes (v2)
 * NEB-11: Memoranda, circulars, directives, announcements with approval
 * workflow, distribution registry and cross-unit linking.
 */

import { Router, Response } from 'express';
import { CommunicationsEngine, CommunicationCreate } from '../../engines/communications.engine';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { successResponse, errorResponse, extractTenantId } from '../../core/helpers';

const router = Router();

// ─── List + Overview ─────────────────────────────────────────

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await CommunicationsEngine.list(orgId, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      status: req.query.status as string,
      docType: req.query.docType as string,
      priority: req.query.priority as string,
      search: req.query.search as string,
      linkedEntityType: req.query.linkedEntityType as string,
      linkedEntityId: req.query.linkedEntityId as string,
      authorUserId: req.query.authorUserId as string,
    });
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.get('/overview', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const overview = await CommunicationsEngine.overview(orgId);
    successResponse(res, overview);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const comm = await CommunicationsEngine.getById(orgId, req.params.id);
    if (!comm) return errorResponse(res, 'Communication not found', 404);
    successResponse(res, comm);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ─── Create ──────────────────────────────────────────────────

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const auth = {
      userId: req.user!.id,
      name: (req.user as any)?.name_ar || (req.user as any)?.name || req.user!.email,
      securityLevel: req.user!.security_level || 1,
    };
    const result = await CommunicationsEngine.create(orgId, auth, req.body as CommunicationCreate);
    successResponse(res, result, 201);
  } catch (err: any) {
    errorResponse(res, err.message, 400);
  }
});

// ─── Workflow transitions ───────────────────────────────────

router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await CommunicationsEngine.update(orgId, req.params.id, req.body as Partial<CommunicationCreate>);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message, 400);
  }
});

router.post('/:id/submit', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await CommunicationsEngine.submit(orgId, req.params.id, req.user!.id);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message, 400);
  }
});

router.post('/:id/approve', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await CommunicationsEngine.approve(orgId, req.params.id, req.user!.id, req.body?.note);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message, 400);
  }
});

router.post('/:id/reject', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await CommunicationsEngine.reject(orgId, req.params.id, req.user!.id, req.body?.note);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message, 400);
  }
});

router.post('/:id/issue', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await CommunicationsEngine.issue(orgId, req.params.id, req.body?.signedBy);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message, 400);
  }
});

router.post('/:id/distribute', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await CommunicationsEngine.distribute(orgId, req.params.id);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message, 400);
  }
});

router.post('/:id/acknowledge', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await CommunicationsEngine.acknowledge(orgId, req.params.id, req.user!.id, req.body?.note);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message, 400);
  }
});

router.post('/:id/close', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await CommunicationsEngine.close(orgId, req.params.id);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message, 400);
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await CommunicationsEngine.remove(orgId, req.params.id, req.user!.id);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message, 400);
  }
});

export default router;
