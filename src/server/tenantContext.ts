/**
 * NexoraOS™ — Request Tenant Context (AsyncLocalStorage)
 * Propagates the authenticated organization id through the async call chain
 * so the database layer can SET LOCAL app.current_org (FORCE RLS policies)
 * without threading orgId through every function signature.
 *
 * The org id comes ONLY from the verified JWT (never headers/body).
 */

import { AsyncLocalStorage } from 'async_hooks';
import { Request, Response, NextFunction } from 'express';

interface TenantStore {
  orgId: string;
  userId?: string;
}

const storage = new AsyncLocalStorage<TenantStore>();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidOrgId(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

/** Current request's organization id, or null outside a tenant context. */
export function getTenantOrgId(): string | null {
  return storage.getStore()?.orgId ?? null;
}

/** Current request's user id, or null. */
export function getTenantUserId(): string | null {
  return storage.getStore()?.userId ?? null;
}

export function runWithTenant<T>(orgId: string, fn: () => T, userId?: string): T {
  return storage.run({ orgId, userId }, fn);
}

/**
 * Express middleware — must run AFTER authentication (req.user populated).
 * Requests without a tenant claim pass through untouched (public routes).
 */
export function tenantContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const orgId = (req as any).user?.org_id || (req as any).user?.orgId || (req as any).userContext?.organizationId;
  if (!orgId || !isValidOrgId(orgId)) return next();
  const userId = (req as any).user?.id;
  runWithTenant(orgId, () => next(), typeof userId === 'string' ? userId : undefined);
}
