/**
 * NexoraOS™ — V2 Routes: Portfolio, Programs, Operations, Community,
 *              Funding, Assets, HR, Knowledge, AI, Sales
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { successResponse, errorResponse, extractTenantId } from '../../core/helpers';
import { enforceOwnership } from '../../tenantSecurity';

// Import all engines
import { PortfolioEngine, ProgramEngine } from '../../engines/portfolio.engine';
import { ActivityEngine, ResourceAllocationEngine, GeospatialEngine, TaskEngine } from '../../engines/operations.engine';
import { VolunteerEngine, CommitteeEngine, MembershipEngine } from '../../engines/community.engine';
import { DonorEngine, GrantEngine, GrantInstallmentEngine, ProposalEngine, PartnerAgreementEngine, UtilizationReportEngine } from '../../engines/funding.engine';
import { AssetEngine, InventoryEngine, WarehouseEngine } from '../../engines/assets.engine';
import { HREngine, AttendanceEngine, LeaveEngine } from '../../engines/hr.engine';
import { KnowledgeArticleEngine } from '../../engines/knowledge.engine';
import { AIEngine } from '../../engines/ai.engine';
import { DonationEngine, InvoiceEngine, CampaignEngine, InvestmentEngine } from '../../engines/sales.engine';

const router = Router();

// Helper
const auth = (req: AuthenticatedRequest) => ({
  userId: req.user!.id, email: req.user!.email, role: req.user!.role,
  orgId: extractTenantId(req), securityLevel: req.user!.security_level || 5,
});

// IDOR defense-in-depth: every /:id route below is gated on record-level
// tenant ownership BEFORE reaching engines (most engine getById/update/
// delete methods filter by id only). Tables without organization_id
// (or missing tables) pass through inside enforceOwnership.
router.use('/programs/:id', enforceOwnership('programs'));
router.use('/activities/:id', enforceOwnership('activities'));
router.use('/volunteers/:id', enforceOwnership('volunteers'));
router.use('/donors/:id', enforceOwnership('donors'));
router.use('/grants/:id', enforceOwnership('grants'));
router.use('/assets/:id', enforceOwnership('fixed_assets'));
router.use('/membership/:id', enforceOwnership('memberships'));

// ═══════════════════════════════════════════════════════════
// NEB-02: Portfolio Management
// ═══════════════════════════════════════════════════════════

router.get('/portfolio/overview', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await PortfolioEngine.getOverview(extractTenantId(req))); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.get('/portfolio/health', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await PortfolioEngine.getHealthScore(extractTenantId(req))); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.get('/portfolio/timeline', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await PortfolioEngine.getTimeline(extractTenantId(req))); }
  catch (err: any) { errorResponse(res, err.message); }
});

// ═══════════════════════════════════════════════════════════
// NEB-03: Programs
// ═══════════════════════════════════════════════════════════

router.get('/programs', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await ProgramEngine.list(extractTenantId(req), {
      page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 50,
    }, { search: req.query.search as string, categoryCode: req.query.categoryCode as string });
    successResponse(res, result);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.get('/programs/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const program = await ProgramEngine.getById(req.params.id);
    if (!program) return errorResponse(res, 'Program not found', 404);
    successResponse(res, program);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.post('/programs', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await ProgramEngine.create({ organizationId: extractTenantId(req), ...req.body }, auth(req)), 201); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.put('/programs/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const program = await ProgramEngine.update(req.params.id, req.body);
    if (!program) return errorResponse(res, 'Program not found', 404);
    successResponse(res, program);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.delete('/programs/:id', async (req: AuthenticatedRequest, res: Response) => {
  try { await ProgramEngine.delete(req.params.id); successResponse(res, { message: 'Deleted' }); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.post('/programs/:id/objectives', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await ProgramEngine.createObjective({ programId: req.params.id, ...req.body }), 201); }
  catch (err: any) { errorResponse(res, err.message); }
});

// ═══════════════════════════════════════════════════════════
// NEB-05: Operations & Field
// ═══════════════════════════════════════════════════════════

router.get('/activities', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await ActivityEngine.list(extractTenantId(req), {
      page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 50,
    }, { projectId: req.query.projectId as string, status: req.query.status as string, search: req.query.search as string });
    successResponse(res, result);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.get('/activities/:id/wbs', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await ActivityEngine.getWBS(req.params.id)); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.post('/activities', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await ActivityEngine.create({ organizationId: extractTenantId(req), ...req.body }, auth(req)), 201); }
  catch (err: any) { errorResponse(res, err.message); }
});

/**
 * PUT /api/v2/domains/activities/:id/progress
 * INTELLIGENT: Update activity progress with automatic project progress recalculation
 */
router.put('/activities/:id/progress', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const progressPct = Number(req.body.progressPct);
    if (Number.isNaN(progressPct)) return errorResponse(res, 'progressPct must be a number', 400);
    const result = await ActivityEngine.updateProgress(req.params.id, progressPct, auth(req));
    successResponse(res, result);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.put('/activities/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const activity = await ActivityEngine.update(req.params.id, req.body);
    if (!activity) return errorResponse(res, 'Activity not found', 404);
    successResponse(res, activity);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.delete('/activities/:id', async (req: AuthenticatedRequest, res: Response) => {
  try { await ActivityEngine.delete(req.params.id); successResponse(res, { message: 'Deleted' }); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.get('/geospatial/areas', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await GeospatialEngine.listAreas(extractTenantId(req))); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.get('/geospatial/projects', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await GeospatialEngine.getProjectLocations(extractTenantId(req))); }
  catch (err: any) { errorResponse(res, err.message); }
});

// ═══════════════════════════════════════════════════════════
// NEB-07: Community & Membership
// ═══════════════════════════════════════════════════════════

router.get('/volunteers', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await VolunteerEngine.list(extractTenantId(req), {
      page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 50,
    }, { status: req.query.status as string, field: req.query.field as string, search: req.query.search as string });
    successResponse(res, result);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.get('/volunteers/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const v = await VolunteerEngine.getById(req.params.id);
    if (!v) return errorResponse(res, 'Volunteer not found', 404);
    successResponse(res, v);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.post('/volunteers', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await VolunteerEngine.create({ organizationId: extractTenantId(req), ...req.body }, auth(req)), 201); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.get('/volunteers/hours-report', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await VolunteerEngine.getHoursReport(extractTenantId(req), req.query.startDate as string, req.query.endDate as string)); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.get('/committees', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await CommitteeEngine.list(extractTenantId(req))); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.post('/committees', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await CommitteeEngine.create({ organizationId: extractTenantId(req), ...req.body }, auth(req)), 201); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.get('/membership', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await MembershipEngine.list(extractTenantId(req), {
      page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 50,
    }, { status: req.query.status as string });
    successResponse(res, result);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.post('/membership', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await MembershipEngine.create({ organizationId: extractTenantId(req), ...req.body }, auth(req)), 201); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.post('/membership/:id/review', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await MembershipEngine.review(req.params.id, req.body.decision, req.body.notes);
    successResponse(res, result);
  } catch (err: any) { errorResponse(res, err.message); }
});

// ═══════════════════════════════════════════════════════════
// NEB-08: Partnership & Funding
// ═══════════════════════════════════════════════════════════

router.get('/donors', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await DonorEngine.list(extractTenantId(req), {
      page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 50,
    }, { donorType: req.query.donorType as string, search: req.query.search as string });
    successResponse(res, result);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.get('/donors/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const donor = await DonorEngine.getById(req.params.id);
    if (!donor) return errorResponse(res, 'Donor not found', 404);
    successResponse(res, donor);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.post('/donors', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await DonorEngine.create({ organizationId: extractTenantId(req), ...req.body }, auth(req)), 201); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.get('/grants', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await GrantEngine.list(extractTenantId(req), {
      page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 50,
    }, { status: req.query.status as string, donorId: req.query.donorId as string, projectId: req.query.projectId as string });
    successResponse(res, result);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.get('/grants/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const grant = await GrantEngine.getById(req.params.id);
    if (!grant) return errorResponse(res, 'Grant not found', 404);
    successResponse(res, grant);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.post('/grants', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await GrantEngine.create({ organizationId: extractTenantId(req), ...req.body }, auth(req)), 201); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.get('/proposals', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await ProposalEngine.list(extractTenantId(req), {
      page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 50,
    }, { status: req.query.status as string });
    successResponse(res, result);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.post('/proposals', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await ProposalEngine.create({ organizationId: extractTenantId(req), ...req.body }, auth(req)), 201); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.get('/utilization', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await UtilizationReportEngine.generate(extractTenantId(req), req.query.grantId as string)); }
  catch (err: any) { errorResponse(res, err.message); }
});

// ═══════════════════════════════════════════════════════════
// NEB-09: Resources & Assets
// ═══════════════════════════════════════════════════════════

router.get('/assets', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await AssetEngine.list(extractTenantId(req), {
      page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 50,
    }, { category: req.query.category as string, status: req.query.status as string, search: req.query.search as string });
    successResponse(res, result);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.get('/assets/dashboard', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await AssetEngine.getDashboard(extractTenantId(req))); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.get('/assets/depreciation', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await AssetEngine.calculateDepreciation(extractTenantId(req))); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.post('/assets', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await AssetEngine.create({ organizationId: extractTenantId(req), ...req.body }, auth(req)), 201); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.post('/assets/:id/lifecycle', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await AssetEngine.recordLifecycleEvent({ assetId: req.params.id, ...req.body }), 201); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.get('/inventory', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await InventoryEngine.list(extractTenantId(req), {
      page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 50,
    }, { category: req.query.category as string, warehouseId: req.query.warehouseId as string, search: req.query.search as string });
    successResponse(res, result);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.post('/inventory', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await InventoryEngine.create({ organizationId: extractTenantId(req), ...req.body }, auth(req)), 201); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.get('/warehouses', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await WarehouseEngine.list(extractTenantId(req))); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.post('/warehouses', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await WarehouseEngine.create({ organizationId: extractTenantId(req), ...req.body }, auth(req)), 201); }
  catch (err: any) { errorResponse(res, err.message); }
});

// ═══════════════════════════════════════════════════════════
// NEB-09: Human Resources
// ═══════════════════════════════════════════════════════════

router.get('/hr/staff', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await HREngine.listStaff(extractTenantId(req), {
      page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 50,
    }, { department: req.query.department as string, status: req.query.status as string, search: req.query.search as string });
    successResponse(res, result);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.get('/hr/dashboard', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await HREngine.getDashboard(extractTenantId(req))); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.post('/hr/staff', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await HREngine.createStaff({ organizationId: extractTenantId(req), ...req.body }, auth(req)), 201); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.put('/hr/staff/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const staff = await HREngine.updateStaff(req.params.id, req.body);
    if (!staff) return errorResponse(res, 'Staff not found', 404);
    successResponse(res, staff);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.delete('/hr/staff/:id', async (req: AuthenticatedRequest, res: Response) => {
  try { await HREngine.deleteStaff(req.params.id); successResponse(res, { message: 'Terminated' }); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.get('/hr/staff/:id/attendance', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await AttendanceEngine.getStaffAttendance(req.params.id, req.query.startDate as string, req.query.endDate as string)); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.post('/hr/staff/:id/clock-in', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await AttendanceEngine.clockIn(req.params.id, req.body), 201); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.get('/hr/leaves/:staffId', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await LeaveEngine.getStaffLeaves(req.params.staffId)); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.post('/hr/leaves', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await LeaveEngine.requestLeave(req.body), 201); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.post('/hr/leaves/:id/approve', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await LeaveEngine.approveLeave(req.params.id, req.user!.id, req.body.notes)); }
  catch (err: any) { errorResponse(res, err.message); }
});

// ═══════════════════════════════════════════════════════════
// NEB-11: Knowledge & Documents
// ═══════════════════════════════════════════════════════════

router.get('/knowledge', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await KnowledgeArticleEngine.list(extractTenantId(req), {
      page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 50,
    }, { category: req.query.category as string, status: req.query.status as string, search: req.query.search as string });
    successResponse(res, result);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.get('/knowledge/search', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await KnowledgeArticleEngine.search(extractTenantId(req), req.query.q as string || '')); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.get('/knowledge/categories', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await KnowledgeArticleEngine.getCategories(extractTenantId(req))); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.post('/knowledge', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await KnowledgeArticleEngine.create({ organizationId: extractTenantId(req), ...req.body }, auth(req)), 201); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.put('/knowledge/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const article = await KnowledgeArticleEngine.update(req.params.id, req.body);
    if (!article) return errorResponse(res, 'Article not found', 404);
    successResponse(res, article);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.delete('/knowledge/:id', async (req: AuthenticatedRequest, res: Response) => {
  try { await KnowledgeArticleEngine.delete(req.params.id); successResponse(res, { message: 'Deleted' }); }
  catch (err: any) { errorResponse(res, err.message); }
});

// ═══════════════════════════════════════════════════════════
// NEB-13: AI Intelligence
// ═══════════════════════════════════════════════════════════

router.get('/ai/insights', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await AIEngine.getInsights(extractTenantId(req), req.query.domain as string)); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.get('/ai/predictive-budget', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await AIEngine.predictiveBudgetAnalysis(extractTenantId(req))); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.get('/ai/anomalies', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await AIEngine.detectAnomalies(extractTenantId(req))); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.get('/ai/impact', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await AIEngine.impactAssessment(extractTenantId(req))); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.get('/ai/executive-summary', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await AIEngine.executiveSummary(extractTenantId(req))); }
  catch (err: any) { errorResponse(res, err.message); }
});

// ═══════════════════════════════════════════════════════════
// NEB-15: Sales, Revenue & Fundraising
// ═══════════════════════════════════════════════════════════

router.get('/donations', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await DonationEngine.list(extractTenantId(req), {
      page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 50,
    }, { status: req.query.status as string, paymentMethod: req.query.paymentMethod as string, startDate: req.query.startDate as string, endDate: req.query.endDate as string });
    successResponse(res, result);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.get('/donations/dashboard', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await DonationEngine.getDashboard(extractTenantId(req))); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.post('/donations', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await DonationEngine.create({ organizationId: extractTenantId(req), ...req.body }, auth(req)), 201); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.get('/invoices', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await InvoiceEngine.list(extractTenantId(req), {
      page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 50,
    }, { status: req.query.status as string, projectId: req.query.projectId as string });
    successResponse(res, result);
  } catch (err: any) { errorResponse(res, err.message); }
});

router.post('/invoices', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await InvoiceEngine.create({ organizationId: extractTenantId(req), ...req.body }, auth(req)), 201); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.post('/invoices/:id/pay', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await InvoiceEngine.recordPayment(req.params.id, req.body, extractTenantId(req))); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.get('/campaigns', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await CampaignEngine.list(extractTenantId(req))); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.post('/campaigns', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await CampaignEngine.create({ organizationId: extractTenantId(req), ...req.body }, auth(req)), 201); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.get('/investments', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await InvestmentEngine.list(extractTenantId(req))); }
  catch (err: any) { errorResponse(res, err.message); }
});

router.post('/investments', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await InvestmentEngine.create({ organizationId: extractTenantId(req), ...req.body }, auth(req)), 201); }
  catch (err: any) { errorResponse(res, err.message); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// NEB-04/05: PROJECT TASKS (WBS Level 3+)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v2/domains/activities/:activityId/tasks
 * List all tasks belonging to an activity
 */
router.get('/activities/:activityId/tasks', async (req: AuthenticatedRequest, res: Response) => {
  try { successResponse(res, await TaskEngine.listByActivity(req.params.activityId)); }
  catch (err: any) { errorResponse(res, err.message); }
});

/**
 * POST /api/v2/domains/activities/:activityId/tasks
 * Create a new task under an activity
 */
router.post('/activities/:activityId/tasks', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const task = await TaskEngine.create({ activityId: req.params.activityId, ...req.body }, auth(req));
    successResponse(res, task, 201);
  } catch (err: any) { errorResponse(res, err.message); }
});

/**
 * PUT /api/v2/domains/tasks/:taskId/progress
 * INTELLIGENT: Update task progress — cascades to activity + project
 */
router.put('/tasks/:taskId/progress', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const progressPct = Number(req.body.progressPct);
    if (Number.isNaN(progressPct)) return errorResponse(res, 'progressPct must be a number', 400);
    const task = await TaskEngine.updateProgress(req.params.taskId, progressPct, auth(req));
    successResponse(res, task);
  } catch (err: any) { errorResponse(res, err.message); }
});

/**
 * DELETE /api/v2/domains/tasks/:taskId
 * Delete a task
 */
router.delete('/tasks/:taskId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await TaskEngine.delete(req.params.taskId);
    successResponse(res, { message: 'Task deleted' });
  } catch (err: any) { errorResponse(res, err.message); }
});

export default router;
