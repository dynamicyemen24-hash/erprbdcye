/**
 * NexoraOS™ — Reporting & Analytics API Routes (v2)
 * KPIs, Views, Report Export
 */

import { Router, Response } from 'express';
import { KPIEngine, ViewEngine, ReportExportEngine } from '../../engines/reporting.engine';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { successResponse, errorResponse, extractTenantId } from '../../core/helpers';

const router = Router();

// ─── KPIs ──────────────────────────────────────────────

router.get('/kpis/consolidated', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const kpis = await KPIEngine.getConsolidatedKPIs(orgId);
    successResponse(res, kpis);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.get('/kpis/strategic', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const kpis = await KPIEngine.getStrategicKPIs(orgId);
    successResponse(res, kpis);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.get('/kpis/trends', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const months = Number(req.query.months) || 12;
    const trends = await KPIEngine.getMonthlyTrends(orgId, months);
    successResponse(res, trends);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ─── Database Views ────────────────────────────────────

router.get('/views', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const views = await ViewEngine.listAvailableViews(orgId);
    successResponse(res, views);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.get('/views/:viewName', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await ViewEngine.executeView(req.params.viewName, orgId);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ─── Report Export ─────────────────────────────────────

router.get('/export/:reportType', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const report = await ReportExportEngine.generateReport(orgId, req.params.reportType, {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      projectId: req.query.projectId as string,
    });
    successResponse(res, report);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.get('/export/:reportType/pdf', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const report = await ReportExportEngine.generateReport(orgId, req.params.reportType, {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      projectId: req.query.projectId as string,
    });

    // Return report data for client-side PDF generation
    successResponse(res, {
      ...report,
      exportFormat: 'pdf',
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.get('/export/:reportType/excel', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const report = await ReportExportEngine.generateReport(orgId, req.params.reportType, {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      projectId: req.query.projectId as string,
    });

    successResponse(res, {
      ...report,
      exportFormat: 'excel',
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

export default router;
