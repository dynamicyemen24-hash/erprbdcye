import express from 'express';
import logger, { toLogMeta } from '../core/logger';
import { MasterOperationalOrchestratorService } from '../services/operational_orchestrator.service';
import { recordAuditLog } from '../services/audit.service';
import { extractTenantId } from '../core/helpers';

export const masterOperationsRouter = express.Router();

// GET /api/operations/master-matrix (Consolidated 15-Domain Matrix)
masterOperationsRouter.get('/master-matrix', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const matrix = await MasterOperationalOrchestratorService.getMasterOperationalMatrix(orgId);
    res.json(matrix);
  } catch (err: any) {
    logger.error('Error fetching master operational matrix:', { meta: toLogMeta(err.message) });
    res.status(500).json({ error: 'Failed to fetch operational matrix' });
  }
});

// GET /api/operations/evm-analytics (Earned Value Management)
masterOperationsRouter.get('/evm-analytics', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const evm = await MasterOperationalOrchestratorService.calculateEarnedValueManagement(orgId);
    res.json(evm);
  } catch (err: any) {
    logger.error('Error fetching EVM analytics:', { meta: toLogMeta(err.message) });
    res.status(500).json({ error: 'Failed to calculate EVM analytics' });
  }
});

// GET /api/operations/vulnerability-index (MPI Social Registry)
masterOperationsRouter.get('/vulnerability-index', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const mpi = await MasterOperationalOrchestratorService.calculateBeneficiaryVulnerabilityIndex(orgId);
    res.json(mpi);
  } catch (err: any) {
    logger.error('Error fetching vulnerability index:', { meta: toLogMeta(err.message) });
    res.status(500).json({ error: 'Failed to calculate vulnerability index' });
  }
});

// POST /api/operations/asset-depreciation-run (Execute Automated Depreciation)
masterOperationsRouter.post('/asset-depreciation-run', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const result = await MasterOperationalOrchestratorService.executeAssetDepreciationRun(orgId);
    
    await recordAuditLog({
      organizationId: orgId,
      userId: req.user?.id,
      action: 'EXECUTE',
      tableName: 'fixed_assets',
      details: { totalDepreciationYer: result.totalDepreciationPostedYer }
    });

    res.json(result);
  } catch (err: any) {
    logger.error('Error executing asset depreciation run:', { meta: toLogMeta(err.message) });
    res.status(500).json({ error: 'Failed to execute depreciation run' });
  }
});

// GET /api/operations/sphere-chs-audit (Sphere & CHS Compliance)
masterOperationsRouter.get('/sphere-chs-audit', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const audit = await MasterOperationalOrchestratorService.evaluateSphereAndChsCompliance(orgId);
    res.json(audit);
  } catch (err: any) {
    logger.error('Error fetching Sphere/CHS audit:', { meta: toLogMeta(err.message) });
    res.status(500).json({ error: 'Failed to evaluate Sphere/CHS compliance' });
  }
});

// GET /api/operations/iati-export (IATI Transparency Standard)
masterOperationsRouter.get('/iati-export', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const iati = await MasterOperationalOrchestratorService.generateIatiActivityStandardExport(orgId);
    res.json(iati);
  } catch (err: any) {
    logger.error('Error exporting IATI standard data:', { meta: toLogMeta(err.message) });
    res.status(500).json({ error: 'Failed to generate IATI export' });
  }
});
