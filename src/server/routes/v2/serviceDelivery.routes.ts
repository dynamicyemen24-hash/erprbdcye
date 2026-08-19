/**
 * NexoraOS™ — Service Delivery & Beneficiary API Routes (v2)
 * Beneficiaries, Service Deliveries, Aid Distributions, Sponsorships
 */

import { Router, Response } from 'express';
import {
  BeneficiaryEngine, ServiceDeliveryEngine,
  AidDistributionEngine, SponsorshipEngine
} from '../../engines/serviceDelivery.engine';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { successResponse, errorResponse, extractTenantId } from '../../core/helpers';

const router = Router();

// ─── Beneficiaries ─────────────────────────────────────

router.get('/beneficiaries', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await BeneficiaryEngine.list(orgId, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
      sortBy: req.query.sortBy as string,
    }, {
      status: req.query.status as string,
      gender: req.query.gender as string,
      governorate: req.query.governorate as string,
      vulnerabilityStatus: req.query.vulnerabilityStatus as string,
      search: req.query.search as string,
    });
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.get('/beneficiaries/dashboard', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const dashboard = await BeneficiaryEngine.getDashboard(orgId);
    successResponse(res, dashboard);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.get('/beneficiaries/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const beneficiary = await BeneficiaryEngine.getById(req.params.id);
    if (!beneficiary) return errorResponse(res, 'Beneficiary not found', 404);
    successResponse(res, beneficiary);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/beneficiaries', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const auth = {
      userId: req.user!.id,
      email: req.user!.email,
      role: req.user!.role,
      orgId,
      securityLevel: req.user!.security_level || 5,
    };

    const beneficiary = await BeneficiaryEngine.create({ organizationId: orgId, ...req.body }, auth);
    successResponse(res, beneficiary, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.put('/beneficiaries/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = {
      userId: req.user!.id,
      email: req.user!.email,
      role: req.user!.role,
      orgId: extractTenantId(req),
      securityLevel: req.user!.security_level || 5,
    };

    const beneficiary = await BeneficiaryEngine.update(req.params.id, req.body, auth);
    if (!beneficiary) return errorResponse(res, 'Beneficiary not found', 404);
    successResponse(res, beneficiary);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/beneficiaries/check-duplicates', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await BeneficiaryEngine.checkDuplicates(
      orgId,
      req.body.nationalId,
      req.body.name,
      req.body.phone
    );
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ─── Service Deliveries ────────────────────────────────

router.get('/service-deliveries', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await ServiceDeliveryEngine.list(orgId, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
    }, {
      serviceType: req.query.serviceType as string,
      projectId: req.query.projectId as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    });
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.get('/service-deliveries/sphere-compliance', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await ServiceDeliveryEngine.checkSphereCompliance(
      orgId,
      req.query.projectId as string
    );
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/service-deliveries', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const auth = {
      userId: req.user!.id,
      email: req.user!.email,
      role: req.user!.role,
      orgId,
      securityLevel: req.user!.security_level || 5,
    };

    const delivery = await ServiceDeliveryEngine.create({ organizationId: orgId, ...req.body }, auth);
    successResponse(res, delivery, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ─── Aid Distributions ─────────────────────────────────

router.get('/aid-distributions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await AidDistributionEngine.list(orgId, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
    }, {
      aidType: req.query.aidType as string,
      beneficiaryId: req.query.beneficiaryId as string,
      projectId: req.query.projectId as string,
    });
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.get('/aid-distributions/dashboard', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const dashboard = await AidDistributionEngine.getDashboard(orgId);
    successResponse(res, dashboard);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/aid-distributions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const auth = {
      userId: req.user!.id,
      email: req.user!.email,
      role: req.user!.role,
      orgId,
      securityLevel: req.user!.security_level || 5,
    };

    const distribution = await AidDistributionEngine.create({ organizationId: orgId, ...req.body }, auth);
    successResponse(res, distribution, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

// ─── Sponsorships ──────────────────────────────────────

router.get('/sponsorships', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const result = await SponsorshipEngine.list(orgId, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
    }, {
      status: req.query.status as string,
      type: req.query.type as string,
    });
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

router.post('/sponsorships/:id/payments', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = {
      userId: req.user!.id,
      email: req.user!.email,
      role: req.user!.role,
      orgId: extractTenantId(req),
      securityLevel: req.user!.security_level || 5,
    };

    const payment = await SponsorshipEngine.recordPayment(req.params.id, req.body, auth);
    successResponse(res, payment, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
});

export default router;
