/**
 * NexoraOS™ — Engine Enhancement Layer
 * Wraps all engines with caching, validation, logging, and webhook emission
 */

import { cache, cacheKey } from './cache';
import { logger } from './logger';
import { validate, Schema, Schemas } from './validation';
import webhookService, { WebhookEvents } from './webhooks';

// ─── Cache-Enhanced Query Helper ───────────────────────

export async function cachedQuery<T>(
  tenantId: string,
  namespace: string,
  cacheKeyParts: (string | number)[],
  ttlMs: number | undefined,
  fetcher: () => Promise<T>
): Promise<T> {
  const key = cacheKey(tenantId, namespace, ...cacheKeyParts);
  const hit = cache.get<T>(key);
  if (hit !== undefined) {
    logger.debug(`Cache hit: ${key}`, { context: 'engine-cache' });
    return hit;
  }
  const value = await fetcher();
  cache.set(key, value, ttlMs);
  return value;
}

// ─── Cache Invalidation Helpers ────────────────────────

export function invalidateFinanceCache(tenantId: string): void {
  cache.invalidatePattern(`^${tenantId}:finance:`);
  cache.invalidatePattern(`^${tenantId}:ledger:`);
  cache.invalidatePattern(`^${tenantId}:budget:`);
  logger.debug(`Finance cache invalidated for tenant ${tenantId}`, { context: 'engine-cache' });
}

export function invalidateProjectCache(tenantId: string): void {
  cache.invalidatePattern(`^${tenantId}:project:`);
  cache.invalidatePattern(`^${tenantId}:milestone:`);
  cache.invalidatePattern(`^${tenantId}:schedule:`);
  logger.debug(`Project cache invalidated for tenant ${tenantId}`, { context: 'engine-cache' });
}

export function invalidateServiceCache(tenantId: string): void {
  cache.invalidatePattern(`^${tenantId}:beneficiary:`);
  cache.invalidatePattern(`^${tenantId}:service-delivery:`);
  cache.invalidatePattern(`^${tenantId}:aid:`);
  logger.debug(`Service cache invalidated for tenant ${tenantId}`, { context: 'engine-cache' });
}

export function invalidateProcurementCache(tenantId: string): void {
  cache.invalidatePattern(`^${tenantId}:rfq:`);
  cache.invalidatePattern(`^${tenantId}:vendor-bid:`);
  cache.invalidatePattern(`^${tenantId}:purchase-order:`);
  logger.debug(`Procurement cache invalidated for tenant ${tenantId}`, { context: 'engine-cache' });
}

export function invalidateFundingCache(tenantId: string): void {
  cache.invalidatePattern(`^${tenantId}:donor:`);
  cache.invalidatePattern(`^${tenantId}:grant:`);
  cache.invalidatePattern(`^${tenantId}:proposal:`);
  logger.debug(`Funding cache invalidated for tenant ${tenantId}`, { context: 'engine-cache' });
}

export function invalidateAllCache(tenantId: string): void {
  cache.invalidatePattern(`^${tenantId}:`);
  logger.info(`All cache invalidated for tenant ${tenantId}`, { context: 'engine-cache' });
}

// ─── Validation Helpers ────────────────────────────────

export function validateRequest<T extends Record<string, any>>(
  data: T,
  schema: Schema,
  operation: string
): T {
  const result = validate(schema, data);
  if (!result.valid) {
    const errorMessages = result.errors.map(e => e.message).join('; ');
    logger.warn(`Validation failed for ${operation}: ${errorMessages}`, { context: 'engine-validation' });
    throw new Error(`Validation failed: ${errorMessages}`);
  }
  return result.sanitized as T;
}

// ─── Audit & Webhook Helper ────────────────────────────

export async function auditAndNotify(
  tenantId: string,
  userId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  tableName: string,
  recordId: string,
  details: Record<string, any>,
  webhookEvent?: string
): Promise<void> {
  // Audit log
  try {
    const { query } = await import('./database');
    await query(
      `INSERT INTO audit_logs (organization_id, user_id, action, table_name, record_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [tenantId, userId, action, tableName, recordId, JSON.stringify(details)]
    );
  } catch { /* graceful */ }

  // Webhook emission
  if (webhookEvent) {
    try {
      await webhookService.emit(webhookEvent, tenantId, {
        action, tableName, recordId, details, userId,
      });
    } catch { /* graceful */ }
  }
}

// ─── Engine Timing Decorator ───────────────────────────

export function timed<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  operationName: string
): T {
  return (async (...args: any[]) => {
    const start = Date.now();
    try {
      const result = await fn(...args);
      const duration = Date.now() - start;
      if (duration > 1000) {
        logger.warn(`Slow operation: ${operationName} took ${duration}ms`, { context: 'engine-perf', duration });
      } else {
        logger.debug(`Operation: ${operationName} completed in ${duration}ms`, { context: 'engine-perf', duration });
      }
      return result;
    } catch (error: any) {
      const duration = Date.now() - start;
      logger.error(`Operation failed: ${operationName} (${duration}ms): ${error.message}`, {
        context: 'engine-perf', duration, error,
      });
      throw error;
    }
  }) as T;
}

// ─── Cache TTL Constants ───────────────────────────────

export const CACHE_TTL = {
  SHORT: 30_000,        // 30 seconds
  MEDIUM: 5 * 60_000,   // 5 minutes
  LONG: 30 * 60_000,    // 30 minutes
  VERY_LONG: 60 * 60_000, // 1 hour
  DASHBOARD: 2 * 60_000, // 2 minutes
  REFERENCE: 10 * 60_000, // 10 minutes (for dropdowns, lookups)
} as const;

// ─── Export All Helpers ─────────────────────────────────

export {
  cacheKey,
  cache,
  logger,
  validate,
  Schemas,
  webhookService,
};
