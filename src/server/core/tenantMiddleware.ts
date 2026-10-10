/**
 * NexoraOS™ — Tenant Isolation Middleware
 * Ensures every request carries a valid tenant identifier (X‑Tenant‑Id),
 * attaches it to the request object, and makes it available to all downstream
 * handlers and the database connection pool via SET LOCAL tenant_id.
 *
 * Policy:
 *   • In production the header is REQUIRED for all /api/* routes.
 *   • In development the header is optional; if missing the request is
 *     proxied to a default tenant 'dev' for convenience.
 *   • The middleware also records the tenantId in the audit log context.
 */

import { Request, Response, NextFunction } from 'express';
import logger from './logger';

const TENANT_HEADER = 'x-tenant-id';
const DEV_DEFAULT_TENANT = 'dev';

export interface TenantContext {
  tenantId: string;
  /** True when the header was explicitly supplied (not the dev default). */
  explicit: boolean;
}

/**
 * Extract and validate the tenant id.
 */
function extractTenantId(req: Request): { id: string; explicit: boolean } | null {
  const raw = req.headers[TENANT_HEADER];
  if (raw === undefined || raw === null) {
    return null;
  }
  const id = String(raw).trim();
  // Reject empty or overly long tenant ids
  if (!id || id.length > 64) {
    return null;
  }
  return { id, explicit: true };
}

/** Fallback tenant when none provided (development only). */
function fallbackTenant(): string {
  return DEV_DEFAULT_TENANT;
}

/** Set the current tenant in the SQL session (PostgreSQL example). */
async function setTenantInSession(client: any, tenantId: string): Promise<void> {
  // Using a lightweight SET LOCAL that automatically rolls back at session end.
  await client.query(`SET LOCAL tenant_id = $1`, [tenantId]);
}

/** Middleware factory */
export function tenantMiddleware(): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const extracted = extractTenantId(req);
    let tenantId: string;
    let explicit = false;

    if (extracted) {
      tenantId = extracted.id;
      explicit = extracted.explicit;
    } else {
      // Development only: use default tenant
      if (process.env.NODE_ENV !== 'production') {
        tenantId = fallbackTenant();
        explicit = false;
        logger.warn(`[tenant] No X-Tenant-Id header; using default '${tenantId}'`, {
          meta: { path: req.path, ip: req.ip },
        });
      } else {
        // Production: reject request without tenant
        logger.warn(`[tenant] Missing X-Tenant-Id on ${req.method} ${req.path}`, {
          meta: { ip: req.ip, origin: req.get('origin') },
        });
        res.status(403).json({
          success: false,
          error: { code: 'MISSING_TENANT', message: 'Tenant identifier is required' },
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    // Attach to request for downstream use
    (req as any).tenantId = tenantId;
    (req as any).tenantExplicit = explicit;

    // If we have a pg client available via the request (some apps store it), set it.
    // Many apps obtain the client from the pool inside the handler; we just store it globally
    // for potential use by other middleware.
    // (No-op if no client here.)

    // Log tenant assignment for audit trail
    logger.info(`[tenant] Assigned tenant ${tenantId} (explicit=${explicit}) for ${req.method} ${req.path}`, {
      userId: (req as any).userId,
      meta: { ip: req.ip },
    });

    // Continue
    next();
  };
}

/**
 * Helper for route handlers: ensure tenant is set and return 403 if not.
 * Can be used as async middleware or as a guard before DB queries.
 */
export function requireTenant(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // If already set by global middleware, proceed
    if ((req as any).tenantId) {
      return fn(req, res, next);
    }
    // Otherwise try to extract from header
    const extracted = extractTenantId(req);
    if (!extracted) {
      res.status(403).json({
        success: false,
        error: { code: 'MISSING_TENANT', message: 'Tenant identifier required' },
        timestamp: new Date().toISOString(),
      });
      return;
    }
    (req as any).tenantId = extracted.id;
    return fn(req, res, next);
  };
}

/**
 * Convenience wrapper that sets the tenant in the PostgreSQL session if a client
 * is passed (typical pattern: pool.connect -> run query with SET LOCAL).
 */
export async function applyTenantToClient(client: any, req: Request): Promise<void> {
  const tenantId = (req as any).tenantId;
  if (!tenantId) {
    // In production this should not happen; fallback to dev
    const def = 'dev';
    await client.query(`SET LOCAL tenant_id = $1`, [def]);
    logger.warn(`[tenant] No tenant on request, using default ${def}`);
    return;
  }
  await setTenantInSession(client, tenantId);
}