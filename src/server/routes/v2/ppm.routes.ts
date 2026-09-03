/**
 * NexoraOS™ — NEB-02/03/04/05: PPM Intelligence Routes (v2)
 * Critical Path Method, Portfolio Scorecard, Portfolio Dashboard — live DB backed.
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { successResponse, errorResponse, extractTenantId } from '../../core/helpers';
import { CPMEngine, PortfolioScorecardEngine, PortfolioDashboardEngine } from '../../engines/ppm.intelligence.engine';
import { isValidUUID } from '../../core/helpers';

const router = Router();

// ─── Critical Path Method ───────────────────────────────

// GET /api/v2/ppm/projects/:id/critical-path
router.get('/projects/:id/critical-path', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isValidUUID(req.params.id)) return errorResponse(res, 'Invalid project id', 400);
    const result = await CPMEngine.compute(req.params.id);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message, err.message === 'Project not found' ? 404 : 500);
  }
});

// POST /api/v2/ppm/projects/:id/rebuild-dependencies
// Rebuild dependency_network from project_schedules.predecessor_ids (idempotent).
router.post('/projects/:id/rebuild-dependencies', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isValidUUID(req.params.id)) return errorResponse(res, 'Invalid project id', 400);
    const orgId = extractTenantId(req);
    const result = await CPMEngine.rebuildFromSchedules(req.params.id, orgId);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message, 500);
  }
});

// ─── Portfolio Scorecard ────────────────────────────────

// GET /api/v2/ppm/portfolio/scorecard?projectId=...
// GET /api/v2/ppm/portfolio/scorecard  -> ranks whole portfolio
router.get('/portfolio/scorecard', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const { projectId } = req.query;
    if (projectId) {
      if (!isValidUUID(String(projectId))) return errorResponse(res, 'Invalid project id', 400);
      const score = await PortfolioScorecardEngine.scoreProject(String(projectId));
      return successResponse(res, { project: score });
    }
    const ranked = await PortfolioScorecardEngine.rankPortfolio(orgId);
    successResponse(res, ranked);
  } catch (err: any) {
    errorResponse(res, err.message, 500);
  }
});

// GET /api/v2/ppm/projects/:id/score
router.get('/projects/:id/score', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isValidUUID(req.params.id)) return errorResponse(res, 'Invalid project id', 400);
    const score = await PortfolioScorecardEngine.scoreProject(req.params.id);
    successResponse(res, score);
  } catch (err: any) {
    errorResponse(res, err.message, err.message === 'Project not found' ? 404 : 500);
  }
});

// ─── Portfolio Dashboard (real views) ──────────────────

// GET /api/v2/ppm/portfolio/overview
router.get('/portfolio/overview', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const overview = await PortfolioDashboardEngine.overview(orgId);
    successResponse(res, overview);
  } catch (err: any) {
    errorResponse(res, err.message, 500);
  }
});

export default router;
