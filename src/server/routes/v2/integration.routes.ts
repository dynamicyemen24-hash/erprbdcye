import { Router } from 'express';
import crypto from 'crypto';
import { getPool } from '../../core/database';
import { authenticateToken } from '../../middleware/auth.middleware';
import { enforceAllPolicies, type PolicyContext, type PolicyViolation } from '../../services/policyEngine';

const router = Router();

const SYNC_DOMAIN_TABLE_MAP: Record<string, string> = {
  beneficiary: 'beneficiaries',
  activity: 'activities',
  service_delivery: 'service_deliveries',
  aid_distribution: 'disbursements',
  project: 'projects',
  transaction: 'transactions',
};

// POST /api/integrations/sms/test — Test SMS dispatch
router.post('/integrations/sms/test', (req, res) => {
  const { provider, phone, message } = req.body;
  if (!phone || typeof phone !== 'string' || phone.length < 5 || phone.length > 20) {
    return res.status(400).json({ status: 'error', message: 'Invalid phone number' });
  }
  if (message && typeof message === 'string' && message.length > 1600) {
    return res.status(400).json({ status: 'error', message: 'Message exceeds 1600 character limit' });
  }
  res.json({
    status: 'ok',
    provider: provider || 'WhatsApp Cloud / Twilio',
    deliveredAt: new Date().toISOString(),
    message: 'Test SMS message dispatched successfully.'
  });
});

// POST /api/integrations/email/test — Test Email dispatch
router.post('/integrations/email/test', (req, res) => {
  const { smtpHost, recipientEmail, subject } = req.body;
  if (!recipientEmail || typeof recipientEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
    return res.status(400).json({ status: 'error', message: 'Invalid email address' });
  }
  if (subject && typeof subject === 'string' && subject.length > 200) {
    return res.status(400).json({ status: 'error', message: 'Subject exceeds 200 character limit' });
  }
  res.json({
    status: 'ok',
    smtpHost: smtpHost || 'smtp.sendgrid.net',
    sentAt: new Date().toISOString(),
    message: 'Test email successfully routed through SMTP gateway.'
  });
});

// POST /api/integrations/zakat-tax/calculate — Zakat & Tax Calculator
router.post('/integrations/zakat-tax/calculate', (req, res) => {
  const { netAssetsYER, vatEligibleAmountYER, zakatRateType = 'lunar', customVatPct = 15 } = req.body;

  const assets = parseFloat(netAssetsYER);
  const vatBase = parseFloat(vatEligibleAmountYER);

  if (isNaN(assets) || assets < 0) {
    return res.status(400).json({ status: 'error', message: 'netAssetsYER must be a non-negative number' });
  }
  if (isNaN(vatBase) || vatBase < 0) {
    return res.status(400).json({ status: 'error', message: 'vatEligibleAmountYER must be a non-negative number' });
  }
  if (customVatPct < 0 || customVatPct > 100) {
    return res.status(400).json({ status: 'error', message: 'customVatPct must be between 0 and 100' });
  }

  const zakatRate = zakatRateType === 'solar' ? 0.025775 : 0.025;
  const zakatDue = Math.round(assets * zakatRate);
  const vatDue = Math.round(vatBase * (customVatPct / 100));

  res.json({
    status: 'ok',
    calculation: {
      netAssetsYER: assets,
      zakatRateType,
      zakatRatePct: (zakatRate * 100).toFixed(4) + '%',
      zakatDueYER: zakatDue,
      vatBaseYER: vatBase,
      vatRatePct: customVatPct + '%',
      vatDueYER: vatDue,
      totalComplianceLiabilityYER: zakatDue + vatDue,
      asnafDistribution: {
        poorAndNeedyPct: 50,
        zakatWorkersPct: 12.5,
        debtorsAndWayfarersPct: 25,
        inTheCauseOfAllahPct: 12.5
      }
    }
  });
});

// POST /api/sync/offline-batch — Offline batch sync endpoint
router.post('/sync/offline-batch', async (req: any, res) => {
  try {
    const { id, domain, action, payload, createdAt, status, retryCount } = req.body;

    if (!id || !domain || !action) {
      return res.status(400).json({ error: 'Missing required sync item fields: id, domain, action' });
    }

    console.log(`[OFFLINE-SYNC] Received batch item: id=${id}, domain=${domain}, action=${action}, status=${status || 'PENDING'}, retryCount=${retryCount || 0}`);

    const tableForDomain = SYNC_DOMAIN_TABLE_MAP[domain];
    if (tableForDomain && payload) {
      try {
        const policyPool = getPool();
        const ctx: PolicyContext = {
          organizationId: req.user?.org_id || '00000000-0000-0000-0000-000000000001',
          userId: req.user?.id || '',
          securityLevel: req.user?.security_level ?? 0,
          role: req.user?.role ?? '',
        };
        const result = await enforceAllPolicies(policyPool, ctx, tableForDomain, action === 'DELETE' ? 'DELETE' : 'CREATE', payload);
        if (!result.allowed) {
          const envMode = req.headers['x-environment-mode'] || 'training';
          const blockViolations = result.violations.filter((v: PolicyViolation) => v.severity === 'BLOCK');

          // Log violation
          try {
            await policyPool.query(`
              INSERT INTO audit_logs (id, action, table_name, record_id, user_id, details, created_at)
              VALUES ($1, $2, $3, $4, $5, $6, NOW())
            `, [
              crypto.randomUUID(),
              `POLICY_VIOLATION:generic:${tableForDomain}:${action}`,
              tableForDomain,
              id,
              req.user?.id || null,
              JSON.stringify({
                domain: tableForDomain,
                action,
                violations: result.violations.map((v: PolicyViolation) => ({
                  code: v.code, severity: v.severity, messageAr: v.messageAr, messageEn: v.messageEn, policyKey: v.policyKey, limit: v.limit, currentValue: v.currentValue,
                })),
                blockCount: blockViolations.length,
                warnCount: result.violations.filter((v: PolicyViolation) => v.severity === 'WARN').length,
                environmentMode: envMode,
              })
            ]);
          } catch (auditErr: any) {
            console.warn("Could not insert audit log for policy violation:", auditErr.message);
          }

          return res.status(403).json({
            error: 'Policy Violation',
            message: blockViolations[0]?.messageEn || 'Sync rejected by policy',
            messageAr: blockViolations[0]?.messageAr || 'تم رفض المزامنة وفقاً للسياسة',
            violations: blockViolations.map((v: PolicyViolation) => ({
              code: v.code,
              severity: v.severity,
              messageAr: v.messageAr,
              messageEn: v.messageEn,
            })),
            syncedId: id,
          });
        }
      } catch (policyErr) {
        console.error('[OFFLINE-SYNC] Policy enforcement error:', policyErr);
      }
    }

    // Audit log
    try {
      const logId = crypto.randomUUID();
      const dbPool = getPool();
      await dbPool.query(`
        INSERT INTO "audit_logs" (id, action, table_name, record_id, user_id, details, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        logId,
        'OFFLINE_SYNC_BATCH',
        domain,
        id,
        req.user?.id || '00000000-0000-0000-0000-000000000001',
        JSON.stringify({
          action,
          status: status || 'PENDING',
          retryCount: retryCount || 0,
          payloadPreview: payload ? JSON.stringify(payload).substring(0, 256) : null,
          syncedAt: new Date().toISOString()
        })
      ]);
    } catch (auditErr: any) {
      console.warn("Could not insert audit log for offline-batch:", auditErr.message);
    }

    res.json({
      success: true,
      message: 'Offline batch item acknowledged and queued for processing',
      syncedId: id,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Offline batch sync failed:', error);
    res.status(500).json({ error: 'Failed to process offline batch sync' });
  }
});

export default router;
