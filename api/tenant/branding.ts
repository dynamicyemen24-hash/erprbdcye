import { applyBaseSecurity, authContext, fail, getPool } from '../_shared/core.js';
import {
  BRAND_THEME_KEYS,
  canManageTenantSettings,
  validateBrandThemeBody,
} from '../../src/server/tenant/tenantSettings.shared.js';

/**
 * GET  /api/tenant/branding  -> current tenant brand theme colors
 * PUT  /api/tenant/branding  -> merge validated colors into organizations.settings
 *
 * Tenant id comes ONLY from signed JWT claims (authContext); the body is
 * a color whitelist, so nothing but the four theme keys can ever be written.
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
    fail(res, 403, 'Insufficient security level to manage tenant branding');
    return;
  }

  const pool = getPool();
  if (!pool) {
    fail(res, 503, 'Database unavailable');
    return;
  }

  try {
    if (req.method === 'GET') {
      const result = await pool.query('SELECT settings FROM organizations WHERE id = $1', [orgId]);
      const row = result.rows[0];
      if (!row) {
        fail(res, 404, 'Organization not found');
        return;
      }
      const settings = row.settings || {};
      const branding: Record<string, string | null> = {};
      for (const key of BRAND_THEME_KEYS) {
        branding[key] = typeof settings[key] === 'string' ? settings[key] : null;
      }
      res.status(200).json({ success: true, data: { branding }, timestamp: new Date().toISOString() });
      return;
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const validation = validateBrandThemeBody(req.body);
      if (!validation.ok) {
        fail(res, 400, validation.error || 'Invalid theme payload');
        return;
      }
      const result = await pool.query(
        `UPDATE organizations
            SET settings = COALESCE(settings, '{}'::jsonb) || $1::jsonb,
                updated_at = NOW()
          WHERE id = $2
          RETURNING settings`,
        [JSON.stringify(validation.patch), orgId]
      );
      const row = result.rows[0];
      if (!row) {
        fail(res, 404, 'Organization not found');
        return;
      }
      res.status(200).json({ success: true, data: { settings: row.settings }, timestamp: new Date().toISOString() });
      return;
    }

    fail(res, 405, 'Method not allowed');
  } catch (error: any) {
    console.error('[API/Tenant/Branding] error:', error?.message);
    fail(res, 500, 'Failed to read tenant branding');
  }
}
