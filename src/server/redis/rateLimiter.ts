/**
 * NexoraOS™ — Distributed Rate Limiting
 * Sliding window algorithm with Redis backing and in-memory fallback
 */

import { Request, Response, NextFunction } from 'express';
import { getClient, isRedisReady } from './client';
import logger from '../core/logger';
import type { AuthContext } from '../core/types';

// ─── Configuration ──────────────────────────────────────

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  message?: { ar: string; en: string };
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  blockDuration?: number;
  keyPrefix?: string;
}

// ─── In-Memory Sliding Window (Fallback) ────────────────

interface MemoryEntry {
  timestamps: number[];
}

const memoryStore = new Map<string, MemoryEntry>();

// Cleanup every 5 minutes
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    entry.timestamps = entry.timestamps.filter(t => t > now - 600000);
    if (entry.timestamps.length === 0) memoryStore.delete(key);
  }
}, 300000);

if (typeof cleanupInterval.unref === 'function') cleanupInterval.unref();

// ─── Sliding Window (Redis) ─────────────────────────────

async function slidingWindowCheck(
  key: string,
  windowMs: number,
  maxRequests: number,
  blockDuration?: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number; total: number }> {
  const client = getClient();
  if (!client) return slidingWindowCheckMemory(key, windowMs, maxRequests);

  const now = Date.now();
  const windowStart = now - windowMs;
  const resetAt = now + windowMs;

  try {
    const pipeline = client.pipeline();
    // Remove expired entries
    pipeline.zremrangebyscore(key, 0, windowStart);
    // Add current request
    pipeline.zadd(key, now.toString(), `${now}:${Math.random().toString(36).slice(2, 8)}`);
    // Count requests in window
    pipeline.zcard(key);
    // Set expiry
    pipeline.pexpire(key, windowMs);

    const results = await pipeline.exec();
    if (!results) return slidingWindowCheckMemory(key, windowMs, maxRequests);

    const count = (results[2][1] as number) || 0;
    const remaining = Math.max(0, maxRequests - count);

    // Check block duration
    if (blockDuration && count > maxRequests) {
      const blockKey = `block:${key}`;
      const isBlocked = await client.get(blockKey);
      if (!isBlocked) {
        await client.setex(blockKey, Math.ceil(blockDuration / 1000), '1');
      }
      return { allowed: false, remaining: 0, resetAt, total: maxRequests };
    }

    return {
      allowed: count <= maxRequests,
      remaining,
      resetAt,
      total: maxRequests,
    };
  } catch (err: any) {
    logger.warn(`[Redis RateLimit] Error: ${err.message}, falling back to memory`);
    return slidingWindowCheckMemory(key, windowMs, maxRequests);
  }
}

function slidingWindowCheckMemory(
  key: string,
  windowMs: number,
  maxRequests: number
): { allowed: boolean; remaining: number; resetAt: number; total: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  let entry = memoryStore.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    memoryStore.set(key, entry);
  }

  entry.timestamps = entry.timestamps.filter(t => t > windowStart);
  entry.timestamps.push(now);

  const count = entry.timestamps.length;
  const remaining = Math.max(0, maxRequests - count);

  return {
    allowed: count <= maxRequests,
    remaining,
    resetAt: now + windowMs,
    total: maxRequests,
  };
}

// ─── Rate Limiter Factory ───────────────────────────────

const DEFAULT_MESSAGE = {
  ar: 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.',
  en: 'Too many requests. Please try again later.',
};

export function createDistributedRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = DEFAULT_MESSAGE,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    blockDuration,
    keyPrefix = 'rl',
  } = config;

  const keyGenerator = config.keyGenerator || ((req: Request) => {
    const userId = (req as any).user?.id;
    if (userId) return `${keyPrefix}:user:${userId}`;
    return `${keyPrefix}:ip:${req.ip || req.socket?.remoteAddress || 'unknown'}`;
  });

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);

    try {
      const result = await slidingWindowCheck(key, windowMs, maxRequests, blockDuration);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', result.total);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000));

      if (!result.allowed) {
        const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
        res.setHeader('Retry-After', retryAfter);

        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message,
            retryAfter,
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Track response for skip logic
      if (skipSuccessfulRequests || skipFailedRequests) {
        const originalEnd = res.end.bind(res);
        res.end = function (this: Response, ...args: any[]) {
          const statusCode = res.statusCode;
          if (skipSuccessfulRequests && statusCode >= 200 && statusCode < 400) {
            decrementKey(key, windowMs);
          } else if (skipFailedRequests && statusCode >= 400) {
            decrementKey(key, windowMs);
          }
          return (originalEnd as any)(...args);
        } as any;
      }

      next();
    } catch (err: any) {
      logger.warn(`[RateLimit] Middleware error: ${err.message}`);
      next(); // Fail open — don't block on rate limiter errors
    }
  };
}

async function decrementKey(key: string, windowMs: number): Promise<void> {
  const client = getClient();
  if (!client) {
    const entry = memoryStore.get(key);
    if (entry && entry.timestamps.length > 0) {
      entry.timestamps.pop();
    }
    return;
  }

  try {
    const now = Date.now();
    const windowStart = now - windowMs;
    await client.zremrangebyscore(key, 0, windowStart);
    // Remove the most recent entry (the one we just added)
    const last = await client.zrange(key, -1, -1);
    if (last.length > 0) {
      await client.zrem(key, last[0]);
    }
  } catch {
    // Silent fail for decrement
  }
}

// ─── Pre-Configured Rate Limiters ───────────────────────

export const authLimiter = createDistributedRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  keyPrefix: 'rl:auth',
  blockDuration: 15 * 60 * 1000,
  message: {
    ar: 'تم تجاوز محاولات تسجيل الدخول. يرجى الانتظار 15 دقيقة.',
    en: 'Too many login attempts. Please wait 15 minutes.',
  },
});

export const apiLimiter = createDistributedRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100,
  keyPrefix: 'rl:api',
  message: {
    ar: 'تم تجاوز حد الطلبات العامة. يرجى المحاولة لاحقاً.',
    en: 'API rate limit exceeded. Please try again later.',
  },
});

export const strictLimiter = createDistributedRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 5,
  keyPrefix: 'rl:strict',
  blockDuration: 5 * 60 * 1000,
  message: {
    ar: 'تم تجاوز حد العمليات الحساسة.',
    en: 'Sensitive operation rate limit exceeded.',
  },
});

export const aiLimiter = createDistributedRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 20,
  keyPrefix: 'rl:ai',
  message: {
    ar: 'تم تجاوز حد طلبات الذكاء الاصطناعي.',
    en: 'AI request rate limit exceeded.',
  },
});

export const uploadLimiter = createDistributedRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 10,
  keyPrefix: 'rl:upload',
  message: {
    ar: 'تم تجاوز حد رفع الملفات.',
    en: 'File upload rate limit exceeded.',
  },
});

export const exportLimiter = createDistributedRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 5,
  keyPrefix: 'rl:export',
  message: {
    ar: 'تم تجاوز حد تصدير البيانات.',
    en: 'Data export rate limit exceeded.',
  },
});

// ─── Adaptive Tenant-Aware Rate Limiter (Token Bucket) ────
/**
 * Creates a tenant-aware rate limiter with adaptive limits based on tenant tier.
 * Uses token bucket algorithm for smooth rate limiting with burst allowance.
 */
export interface TenantRateLimitConfig {
  windowMs: number;
  baseMaxRequests: number;
  burstMultiplier?: number; // Allow bursts up to baseMaxRequests * burstMultiplier
  keyPrefix?: string;
  message?: { ar: string; en: string };
}

interface TokenBucketEntry {
  tokens: number;
  lastRefill: number;
}

const tenantMemoryStore = new Map<string, TokenBucketEntry>();
const tenantRedisPrefix = 'tb:tenant:';

export function createTenantRateLimiter(config: TenantRateLimitConfig) {
  const {
    windowMs,
    baseMaxRequests,
    burstMultiplier = 2,
    keyPrefix = 'rl:tenant',
    message = {
      ar: 'تم تجاوز حد الطلبات للمؤسسة. يرجى المحاولة لاحقاً.',
      en: 'Tenant rate limit exceeded. Please try again later.',
    },
  } = config;

  const maxTokens = baseMaxRequests * burstMultiplier;
  const refillRate = baseMaxRequests / (windowMs / 1000); // tokens per second

  async function checkTenantLimit(
    tenantId: string,
    req: Request & { user?: AuthContext }
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number; total: number; retryAfter?: number }> {
    const now = Date.now();
    const redisKey = `${tenantRedisPrefix}${tenantId}`;
    const maxAllowed = maxTokens;

    // Try Redis first
    const client = getClient();
    if (client && client.status === 'ready') {
      try {
        const luaScript = `
          local key = KEYS[1]
          local now = tonumber(ARGV[1])
          local window = tonumber(ARGV[2])
          local max_tokens = tonumber(ARGV[3])
          local refill_rate = tonumber(ARGV[4])
          local requested = tonumber(ARGV[5])

          local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
          local tokens = tonumber(bucket[1])
          local last_refill = tonumber(bucket[2])

          if tokens == nil then
            tokens = max_tokens
            last_refill = now
          else
            local elapsed = (now - last_refill) / 1000
            local refill = elapsed * refill_rate
            tokens = math.min(max_tokens, tokens + refill)
            last_refill = now
          end

          local allowed = false
          local remaining = 0
          if tokens >= requested then
            tokens = tokens - requested
            allowed = true
            remaining = math.floor(tokens)
          else
            remaining = math.floor(tokens)
          end

          redis.call('HMSET', key, 'tokens', tokens, 'last_refill', last_refill)
          redis.call('PEXPIRE', key, window)

          return {allowed and 1 or 0, remaining, max_tokens}
        `;

        const result = await client.eval(luaScript, 1, redisKey, now.toString(), windowMs.toString(), maxAllowed.toString(), refillRate.toString(), '1');

        const allowed = result[0] === 1;
        const remaining = result[1];
        const resetAt = now + windowMs;

        return {
          allowed,
          remaining,
          resetAt,
          total: maxAllowed,
          retryAfter: allowed ? undefined : Math.ceil((1 - result[2]) / refillRate * 1000),
        };
      } catch (err: any) {
        logger.warn(`[Tenant RateLimit] Redis error: ${err.message}, falling back to memory`);
      }
    }

    // In-memory fallback
    let entry = tenantMemoryStore.get(tenantId);
    if (!entry) {
      entry = { tokens: maxTokens, lastRefill: now };
      tenantMemoryStore.set(tenantId, entry);
    }

    const elapsed = (now - entry.lastRefill) / 1000;
    const refill = elapsed * refillRate;
    entry.tokens = Math.min(maxTokens, entry.tokens + refill);
    entry.lastRefill = now;

    if (entry.tokens >= 1) {
      entry.tokens -= 1;
      return {
        allowed: true,
        remaining: Math.floor(entry.tokens),
        resetAt: now + windowMs,
        total: maxAllowed,
      };
    } else {
      const retryAfter = Math.ceil((1 - entry.tokens) / refillRate * 1000);
      return {
        allowed: false,
        remaining: 0,
        resetAt: now + windowMs,
        total: maxAllowed,
        retryAfter,
      };
    }
}

return async (req: Request & { user?: AuthContext }, res: Response, next: NextFunction) => {
  const tenantId = req.user?.orgId || req.headers['x-organization-id'];
  if (!tenantId) {
    // No tenant context — apply global fallback
    return next();
  }

  const result = await checkTenantLimit(String(tenantId), req);

    res.setHeader('X-RateLimit-Limit', result.total);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000));

    if (!result.allowed) {
      if (result.retryAfter) {
        res.setHeader('Retry-After', Math.ceil(result.retryAfter / 1000));
      }
      return res.status(429).json({
        success: false,
        error: message,
        retryAfter: result.retryAfter ? Math.ceil(result.retryAfter / 1000) : undefined,
      });
    }

    next();
  };
}

// Export pre-configured tenant limiters
export const tenantApiLimiter = createTenantRateLimiter({
  windowMs: 60 * 1000,
  baseMaxRequests: 300, // 300 req/min base, burst to 600
  burstMultiplier: 2,
  keyPrefix: 'rl:tenant:api',
  message: {
    ar: 'تم تجاوز حد طلبات المؤسسة. يرجى المحاولة لاحقاً.',
    en: 'Tenant API rate limit exceeded. Please try again later.',
  },
});

export const tenantStrictLimiter = createTenantRateLimiter({
  windowMs: 60 * 1000,
  baseMaxRequests: 30,
  burstMultiplier: 1.5,
  keyPrefix: 'rl:tenant:strict',
  message: {
    ar: 'تم تجاوز حد العمليات الحساسة للمؤسسة.',
    en: 'Tenant sensitive operation rate limit exceeded.',
  },
});

// ─── Cleanup on shutdown ────────────────────────────────
process.on('SIGTERM', () => clearInterval(cleanupInterval));
process.on('SIGINT', () => clearInterval(cleanupInterval));
