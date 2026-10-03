import { applyBaseSecurity, authContext, fail, getPool } from '../../_shared/core.js';

/**
 * GET /api/v2/communications/overview - Vercel serverless shim.
 * Mirrors CommunicationsEngine.overview (status/type/priority rollups).
 * Envelope: { success, data } - CommunicationsView reads ovJson?.data.
 */

export default async function handler(req: any, res: any) {
  applyBaseSecurity(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return fail(res, 405, 'Method Not Allowed');

  try {
    const { orgId } = authContext(req);
    const pool = getPool();
    if (!pool) return fail(res, 503, 'Database unavailable');

    const [byStatus, byType, byPriority, pendingApproval, urgent] = await Promise.all([
      pool.query(
        `SELECT status, COUNT(*)::int AS count FROM official_communications
         WHERE organization_id = $1 AND deleted_at IS NULL GROUP BY status`,
        [orgId]
      ),
      pool.query(
        `SELECT doc_type, COUNT(*)::int AS count FROM official_communications
         WHERE organization_id = $1 AND deleted_at IS NULL GROUP BY doc_type`,
        [orgId]
      ),
      pool.query(
        `SELECT priority, COUNT(*)::int AS count FROM official_communications
         WHERE organization_id = $1 AND deleted_at IS NULL GROUP BY priority`,
        [orgId]
      ),
      pool.query(
        `SELECT COUNT(*) AS c FROM official_communications
         WHERE organization_id = $1 AND status = 'SUBMITTED' AND deleted_at IS NULL`,
        [orgId]
      ),
      pool.query(
        `SELECT COUNT(*) AS c FROM official_communications
         WHERE organization_id = $1 AND priority = 'URGENT' AND deleted_at IS NULL
           AND status NOT IN ('CLOSED','VOIDED','REJECTED')`,
        [orgId]
      ),
    ]);

    const countMap = (rows: any[]) =>
      rows.reduce((m, r) => ({ ...m, [r.status || r.doc_type || r.priority]: r.count }), {});

    const data = {
      total: byStatus.rows.reduce((s: number, r: any) => s + (r.count || 0), 0),
      byStatus: countMap(byStatus.rows),
      byType: countMap(byType.rows),
      byPriority: countMap(byPriority.rows),
      pendingApproval: parseInt(pendingApproval.rows[0]?.c || '0', 10),
      urgent: parseInt(urgent.rows[0]?.c || '0', 10),
    };

    return res.status(200).json({ success: true, data, timestamp: new Date().toISOString() });
  } catch (err: any) {
    const status = err.status || (err.message?.includes('Authentication') ? 401 : 500);
    console.error('[API/CommsOverview] handler error:', err.message);
    return fail(res, status, status === 500 ? 'Internal server error' : err.message);
  }
}
