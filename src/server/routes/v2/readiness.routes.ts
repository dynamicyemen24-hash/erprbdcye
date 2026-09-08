/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NexoraOS™ — Readiness Dashboard API
 * Serves the operational readiness report as a JSON API endpoint
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Router } from 'express';
import { READINESS_REPORT, calculateOverallScore } from '../../core/readinessReport';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/readiness — Full readiness report (admin only)
 */
router.get('/', authenticateToken, (req: any, res) => {
  if ((req.user?.security_level || 0) < 3) {
    return res.status(403).json({ error: 'Insufficient security level' });
  }

  res.json({
    status: 'success',
    data: {
      ...READINESS_REPORT,
      overall: {
        ...READINESS_REPORT.overall,
        score: calculateOverallScore(),
        calculatedAt: new Date().toISOString(),
      },
      generatedAt: new Date().toISOString(),
    },
  });
});

/**
 * GET /api/readiness/scores — Quick scores summary
 */
router.get('/scores', authenticateToken, (req: any, res) => {
  if ((req.user?.security_level || 0) < 3) {
    return res.status(403).json({ error: 'Insufficient security level' });
  }

  const dims = READINESS_REPORT.dimensions as Record<string, { label: string; labelEn: string; score: number; components: Record<string, { score: number; detail: string }> }>;
  const scores = Object.entries(dims).map(([key, dim]) => ({
    key,
    label: dim.label,
    labelEn: dim.labelEn,
    score: dim.score,
  }));

  res.json({
    status: 'success',
    data: {
      dimensions: scores,
      overall: calculateOverallScore(),
      grade: READINESS_REPORT.overall.grade,
    },
  });
});

/**
 * GET /api/readiness/domain/:code — Score for specific NEB domain
 */
router.get('/domain/:code', authenticateToken, (req: any, res) => {
  const { code } = req.params;
  const fr = READINESS_REPORT.dimensions.functionalRequirements.components;
  const key = `neb${code.replace('NEB-', '').replace('-', '').toLowerCase()}`;
  const match = Object.entries(fr).find(([k]) => k.startsWith(key));

  if (!match) {
    return res.status(404).json({ error: `Domain ${code} not found` });
  }

  res.json({
    status: 'success',
    data: { domain: code, ...match[1] },
  });
});

/**
 * GET /api/readiness/security — Security audit summary
 */
router.get('/security', authenticateToken, (req: any, res) => {
  if ((req.user?.security_level || 0) < 4) {
    return res.status(403).json({ error: 'Insufficient security level' });
  }

  res.json({
    status: 'success',
    data: {
      audit: READINESS_REPORT.securityAudit,
      securityScore: READINESS_REPORT.dimensions.security.score,
      protectionScore: READINESS_REPORT.dimensions.protection.score,
    },
  });
});

/**
 * GET /api/readiness/compliance — Compliance mapping
 */
router.get('/compliance', authenticateToken, (req: any, res) => {
  if ((req.user?.security_level || 0) < 4) {
    return res.status(403).json({ error: 'Insufficient security level' });
  }

  res.json({
    status: 'success',
    data: READINESS_REPORT.compliance,
  });
});

/**
 * GET /api/readiness/health — Public health check with readiness status
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'operational',
    system: 'UAMEX ERP™',
    version: '0.0.0',
    readiness: 'institutional-grade',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
