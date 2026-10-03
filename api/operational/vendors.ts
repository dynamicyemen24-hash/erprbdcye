import { applyBaseSecurity, authContext, fail, getPool } from '../_shared/core.js';

/**
 * GET /api/operational/vendors - Vercel serverless shim.
 * Mirrors operationalDomainRouter.get('/vendors') (org-scoped, active only).
 * Envelope: { success, data } - ProcurementWorkspaceView reads json?.data.
 */

export default async function handler(req: any, res: any) {
  applyBaseSecurity(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return fail(res, 405, 'Method Not Allowed');

  try {
    const { orgId } = authContext(req);
    const pool = getPool();
    if (!pool) return fail(res, 503, 'Database unavailable');

    const result = await pool.query(
      `SELECT v.*, p.name_ar AS party_name_ar, p.name_en AS party_name_en
       FROM vendors v
       LEFT JOIN parties p ON v.party_id = p.id
       WHERE v.organization_id = $1 AND v.deleted_at IS NULL AND v.blacklisted = false
       ORDER BY v.performance_score DESC, v.created_at DESC`,
      [orgId]
    );
    return res.status(200).json({ success: true, data: result.rows, timestamp: new Date().toISOString() });
  } catch (err: any) {
    const status = err.status || 500;
    console.error('[API/Vendors] handler error:', err.message);
    return fail(res, status, status === 500 ? 'Internal server error' : err.message);
  }
}
