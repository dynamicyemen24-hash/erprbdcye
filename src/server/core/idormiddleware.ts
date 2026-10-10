/**
 * NexoraOS™ — IDOR Middleware
 * Ensures that any resource identifier present in the request params / query
 * belongs to the authenticated tenant (req.tenantId). If the ID does not belong
 * to the tenant the request is rejected with 403.
 *
 * Usage:
 *   app.use('/api/projects/:projectId', idormiddleware);
 *   app.use('/api/approvals/:approvalId', idormiddleware);
 */

import { Request, Response, NextFunction } from 'express';
import logger from './logger';

export function idormiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      // Should not happen because tenantMiddleware runs first, but guard anyway
      return res.status(403).json({
        success: false,
        error: { code: 'MISSING_TENANT', message: 'Tenant not set' },
        timestamp: new Date().toISOString(),
      });
    }

    // Collect possible identifier keys: :id, :projectId, :approvalId, etc.
    // We look at route params and query string for known resource identifiers.
    const possibleIds: string[] = [];

    // 1. route params
    if (req.params && typeof req.params === 'object') {
      for (const key of Object.keys(req.params)) {
        const val = req.params[key];
        if (typeof val === 'string' && val.length > 0) {
          possibleIds.push(val);
        }
      }
    }

    // 2. query string
    if (req.query && typeof req.query === 'object') {
      for (const key of Object.keys(req.query)) {
        const val = req.query[key];
        if (typeof val === 'string' && val.length > 0) {
          possibleIds.push(val);
        }
      }
    }

    // If there are no identifiers we simply allow the request (e.g. list endpoints)
    if (possibleIds.length === 0) {
      return next();
    }

    // Simple check: the identifier must start with the tenant prefix we store.
    // In this demo we assume identifiers are stored as "tenantId:resourceId"
    // or we just verify that the resource exists for this tenant via a DB query.
    // Here we perform a lightweight heuristic: the first part before ':' must equal tenantId.
    for (const id of possibleIds) {
      // Heuristic: if id contains a colon, split; else treat whole as resourceId
      const maybeTenant = id.split(':')[0];
      if (maybeTenant !== tenantId) {
        logger.warn(`[IDOR] Identifier ${id} does not belong to tenant ${tenantId}`, {
          tenantId,
          meta: { path: req.path, ip: req.ip },
        });
        return res.status(403).json({
          success: false,
          error: { code: 'IDOR_DETECTED', message: 'Resource does not belong to your tenant' },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // If we reach here the identifiers appear to belong to the tenant – proceed.
    // In a production system you would also perform an explicit DB lookup
    // (e.g. `SELECT * FROM projects WHERE id = $1 AND tenant_id = $2`) here.
    next();
  };
}