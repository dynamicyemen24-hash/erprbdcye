/**
 * NexoraOS™ — Server-Side Idempotency for Mutations
 * Replays the stored response when a client retries with the same
 * X-Idempotency-Key. Backed by Redis (shared across replicas) with an
 * in-memory fallback for single-instance / Redis-down operation.
 *
 * Scope: organization + method + path + key. Only active when the client
 * sends X-Idempotency-Key on POST/PUT/PATCH/DELETE — no behavior change
 * for requests without the header.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { getClient } from '../redis/client';
import logger from '../core/logger';

const IDEM_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
const TTL_SECONDS = parseInt(process.env.IDEMPOTENCY_TTL_SECONDS || '86400', 10); // 24h
const PREFIX = 'nexora:idem:';

interface StoredResponse {
  status: number;
  body: any;
  payloadHash: string;
}

// ─── In-memory fallback ────────────────────────────────────
const memoryStore = new Map<string, { value: StoredResponse; expiresAt: number }>();
const memSweep = setInterval(() => {
  const now = Date.now();
  for (const [k, v] of memoryStore.entries()) {
    if (v.expiresAt <= now) memoryStore.delete(k);
  }
}, 60000);
if (typeof memSweep.unref === 'function') memSweep.unref();

async function storeGet(key: string): Promise<StoredResponse | null> {
  const client = getClient();
  if (client) {
    try {
      const raw = await client.get(PREFIX + key);
      return raw ? (JSON.parse(raw) as StoredResponse) : null;
    } catch (err: any) {
      logger.warn(`[Idempotency] Redis GET failed, using memory: ${err.message}`);
    }
  }
  const entry = memoryStore.get(key);
  if (entry && entry.expiresAt > Date.now()) return entry.value;
  return null;
}

async function storeSet(key: string, value: StoredResponse): Promise<void> {
  const client = getClient();
  if (client) {
    try {
      await client.setex(PREFIX + key, TTL_SECONDS, JSON.stringify(value));
      return;
    } catch (err: any) {
      logger.warn(`[Idempotency] Redis SET failed, using memory: ${err.message}`);
    }
  }
  memoryStore.set(key, { value, expiresAt: Date.now() + TTL_SECONDS * 1000 });
}

function payloadHash(req: Request): string {
  const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? '');
  return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 32);
}

function scopeOf(req: Request): string {
  const tenant =
    (req as any).user?.org_id || (req as any).user?.orgId || (req as any).userContext?.organizationId || 'global';
  return `${tenant}:${req.method}:${req.path}`;
}

export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!IDEM_METHODS.includes(req.method)) return next();
  const key = req.headers['x-idempotency-key'] as string | undefined;
  if (!key || key.length < 8 || key.length > 128) return next();

  const storeKey = `${scopeOf(req)}:${key}`;
  const hash = payloadHash(req);

  storeGet(storeKey)
    .then((stored) => {
      if (stored) {
        if (stored.payloadHash !== hash) {
          res.status(422).json({
            success: false,
            error: {
              code: 'IDEMPOTENCY_KEY_REUSE',
              message: 'Idempotency key already used with a different payload',
            },
          });
          return;
        }
        res.setHeader('X-Idempotent-Replayed', 'true');
        res.status(stored.status).json(stored.body);
        return;
      }

      // Capture the response for future replays.
      const originalJson = res.json.bind(res);
      res.json = ((body: any) => {
        // Only cache definitive outcomes, not 5xx (safe to retry server errors).
        if (res.statusCode < 500) {
          storeSet(storeKey, { status: res.statusCode, body, payloadHash: hash }).catch(() => {});
        }
        res.setHeader('X-Idempotent-Replayed', 'false');
        return originalJson(body);
      }) as any;
      next();
    })
    .catch(() => next()); // Fail open — never block mutations on idempotency errors
}

export default idempotencyMiddleware;
