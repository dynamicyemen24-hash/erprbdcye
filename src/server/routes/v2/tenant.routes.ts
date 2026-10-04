/**
 * NexoraOS - Tenant SaaS settings routes (Express runtime / local dev).
 * Production twin: api/tenant/branding.ts + api/tenant/subscription.ts.
 * Both use the shared validation + plan catalog so behavior is identical.
 */

import { Router } from 'express';
import { getPool } from '../../core/database';
import { authenticateToken } from '../../middleware/auth.middleware';
import {
  BRAND_THEME_KEYS,
  canManageTenantSettings,
  resolveSubscriptionPlan,
  validateBrandThemeBody,
} from '../../tenant/tenantSettings.shared';

const router = Router();

function reject(res: any, status: number, error: string) {
  res.status(status).json({ success: false, error, timestamp: new Date().toISOString() });
}

function authorize(req: any, res: any): boolean {
  if (!req.user) {
    reject(res, 401, 'Authentication required');
    return false;
  }
  if (!canManageTenantSettings(req.user)) {
    reject(res, 403, 'Insufficient security level to manage tenant settings');
    return false;
  }
  return true;
}

router.get('/branding', authenticateToken, async (req: any, res: any) => {
  if (!authorize(req, res)) return;
  try {
    const pool = getPool();
    const result = await pool.query('SELECT settings FROM organizations WHERE id = $1', [req.user.org_id]);
    const row = result.rows[0];
    if (!row) {
      reject(res, 404, 'Organization not found');
      return;
    }
    const settings = row.settings || {};
    const branding: Record<string, string | null> = {};
    for (const key of BRAND_THEME_KEYS) {
      branding[key] = typeof settings[key] === 'string' ? settings[key] : null;
    }
    res.status(200).json({ success: true, data: { branding }, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error('[Tenant/Branding] GET error:', error?.message);
    reject(res, 500, 'Failed to read tenant branding');
  }
});

router.put('/branding', authenticateToken, async (req: any, res: any) => {
  if (!authorize(req, res)) return;
  try {
    const validation = validateBrandThemeBody(req.body);
    if (!validation.ok) {
      reject(res, 400, validation.error || 'Invalid theme payload');
      return;
    }
    const pool = getPool();
    const result = await pool.query(
      `UPDATE organizations
          SET settings = COALESCE(settings, '{}'::jsonb) || $1::jsonb,
              updated_at = NOW()
        WHERE id = $2
        RETURNING settings`,
      [JSON.stringify(validation.patch), req.user.org_id]
    );
    const row = result.rows[0];
    if (!row) {
      reject(res, 404, 'Organization not found');
      return;
    }
    res.status(200).json({ success: true, data: { settings: row.settings }, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error('[Tenant/Branding] PUT error:', error?.message);
    reject(res, 500, 'Failed to update tenant branding');
  }
});

router.get('/subscription', authenticateToken, async (req: any, res: any) => {
  if (!authorize(req, res)) return;
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT subscription_plan, max_users, max_storage_gb FROM organizations WHERE id = $1',
      [req.user.org_id]
    );
    const row = result.rows[0];
    if (!row) {
      reject(res, 404, 'Organization not found');
      return;
    }
    res.status(200).json({
      success: true,
      data: { plan: row.subscription_plan, maxUsers: row.max_users, maxStorageGb: row.max_storage_gb },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Tenant/Subscription] GET error:', error?.message);
    reject(res, 500, 'Failed to read subscription');
  }
});

router.put('/subscription', authenticateToken, async (req: any, res: any) => {
  if (!authorize(req, res)) return;
  try {
    const plan = resolveSubscriptionPlan(req.body?.plan);
    if (!plan) {
      reject(res, 400, 'Unknown subscription plan');
      return;
    }
    const pool = getPool();
    const result = await pool.query(
      `UPDATE organizations
          SET subscription_plan = $1,
              max_users = $2,
              max_storage_gb = $3,
              updated_at = NOW()
        WHERE id = $4
        RETURNING subscription_plan, max_users, max_storage_gb`,
      [plan.plan, plan.maxUsers, plan.maxStorageGb, req.user.org_id]
    );
    const row = result.rows[0];
    if (!row) {
      reject(res, 404, 'Organization not found');
      return;
    }
    res.status(200).json({
      success: true,
      data: { plan: row.subscription_plan, maxUsers: row.max_users, maxStorageGb: row.max_storage_gb },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Tenant/Subscription] PUT error:', error?.message);
    reject(res, 500, 'Failed to update subscription');
  }
});

export default router;
