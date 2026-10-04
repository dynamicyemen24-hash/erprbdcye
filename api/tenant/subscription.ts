import { applyBaseSecurity, authContext, fail, getPool } from '../_shared/core.js';
import { canManageTenantSettings, resolveSubscriptionPlan } from '../../src/server/tenant/tenantSettings.shared.js';

/**
 * GET  /api/tenant/subscription -> current plan + quota limits
 * PUT  /api/tenant/subscription -> switch plan (body: { plan: <catalog key> })
 *
 * Limits are resolved from the server-side catalog only; the client submits
 * a plan key and can never push its own max_users / max_storage_gb values.
 */
export default async function handler(req: any, res: any) {
  applyBaseSecurity(req, res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  let orgId: string;
  let payload: any;
  try {
    const ctx = authContext(req);
    orgId = ctx.orgId;
    payload = ctx.payload;
  } catch (e: any) {
    fail(res, e.status || 401, e.message || 'Authentication required');
    return;
  }

  if (!canManageTenantSettings(payload)) {
    fail(res, 403, 'Insufficient security level to manage the subscription');
    return;
  }

  const pool = getPool();
  if (!pool) {
    fail(res, 503, 'Database unavailable');
    return;
  }

  try {
    if (req.method === 'GET') {
      const result = await pool.query(
        'SELECT subscription_plan, max_users, max_storage_gb FROM organizations WHERE id = $1',
        [orgId]
      );
      const row = result.rows[0];
      if (!row) {
        fail(res, 404, 'Organization not found');
        return;
      }
      res.status(200).json({
        success: true,
        data: {
          plan: row.subscription_plan,
          maxUsers: row.max_users,
          maxStorageGb: row.max_storage_gb,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const planKey = (req.body as any)?.plan;
      const plan = resolveSubscriptionPlan(planKey);
      if (!plan) {
        fail(res, 400, 'Unknown subscription plan');
        return;
      }
      const result = await pool.query(
        `UPDATE organizations
            SET subscription_plan = $1,
                max_users = $2,
                max_storage_gb = $3,
                updated_at = NOW()
          WHERE id = $4
          RETURNING subscription_plan, max_users, max_storage_gb`,
        [plan.plan, plan.maxUsers, plan.maxStorageGb, orgId]
      );
      const row = result.rows[0];
      if (!row) {
        fail(res, 404, 'Organization not found');
        return;
      }
      res.status(200).json({
        success: true,
        data: { plan: row.subscription_plan, maxUsers: row.max_users, maxStorageGb: row.max_storage_gb },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    fail(res, 405, 'Method not allowed');
  } catch (error: any) {
    console.error('[API/Tenant/Subscription] error:', error?.message);
    fail(res, 500, 'Failed to update subscription');
  }
}
