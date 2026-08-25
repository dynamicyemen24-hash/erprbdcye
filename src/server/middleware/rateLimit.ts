/**
 * NexoraOS™ — Advanced Rate Limiting System
 * Tiered rate limiting with Redis-backed sliding window for production
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../core/logger';

// ─── In-Memory Sliding Window Rate Limiter ─────────────

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}, 300000);

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  keyPrefix?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  handler?: (req: Request, res: Response) => void;
}

export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    max,
    message = 'Too many requests. Please try again later.',
    keyPrefix = 'rl',
    skipSuccessfulRequests = false,
    handler,
  } = config;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${keyPrefix}:${req.ip || req.connection?.remoteAddress || 'unknown'}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create entry
    let entry = store.get(key);

    if (!entry || now > entry.resetTime) {
      entry = { count: 1, resetTime: now + windowMs };
      store.set(key, entry);
      res.setHeader('RateLimit-Limit', max);
      res.setHeader('RateLimit-Remaining', max - 1);
      res.setHeader('RateLimit-Reset', Math.ceil(entry.resetTime / 1000));
      return next();
    }

    // Increment counter
    entry.count++;

    // Set headers
    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', Math.max(0, max - entry.count));
    res.setHeader('RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

    if (entry.count > max) {
      if (handler) {
        return handler(req, res);
      }
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        },
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
}

/**
 * Pre-configured Rate Limiters (with defaults, to be overridden by server config)
 * These are provided as defaults; server.ts will create instances using config values.
 */

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many authentication attempts. Please wait 15 minutes.',
  keyPrefix: 'rl:auth',
});

export const apiReadRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'API read rate limit exceeded.',
  keyPrefix: 'rl:read',
});

export const apiWriteRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'API write rate limit exceeded. Max 50 writes per 15 minutes.',
  keyPrefix: 'rl:write',
});

export const sensitiveOpsRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Sensitive operation rate limit exceeded.',
  keyPrefix: 'rl:sensitive',
});

export const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'AI request rate limit exceeded. Max 10 per minute.',
  keyPrefix: 'rl:ai',
});

// ─── Dynamic Rate Limiter by Role ──────────────────────

export function dynamicRateLimiter(req: Request, res: Response, next: NextFunction) {
  const userRole = (req as any).user?.role || 'GUEST';
  const limits: Record<string, number> = {
    'ADMIN': 500,
    'MANAGER': 300,
    'MEMBER': 200,
    'VIEWER': 100,
    'GUEST': 50,
  };

  const max = limits[userRole] || 200;
  const key = `rl:dynamic:${req.ip}:${userRole}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;

  let entry = store.get(key);
  if (!entry || now > entry.resetTime) {
    entry = { count: 1, resetTime: now + windowMs };
    store.set(key, entry);
    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', max - 1);
    return next();
  }

  entry.count++;
  res.setHeader('RateLimit-Limit', max);
  res.setHeader('RateLimit-Remaining', Math.max(0, max - entry.count));

  if (entry.count > max) {
    return res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMIT_EXCEEDED', message: `Rate limit exceeded for role: ${userRole}` },
    });
  }

  next();
}

// ─── Redis-Backed Rate Limiting for Production ──────────

let redisClient: any = null;

async function getRedisClient(): Promise<any> {
  if (process.env.NODE_ENV !== 'production') return null;
  if (redisClient) return redisClient;

  try {
    const { default: Redis } = await import('ioredis');
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
      lazyConnect: true,
    });
    redisClient.on('error', () => {});
    await redisClient.connect();
    return redisClient;
  } catch {
    return null;
  }
}

export interface ProductionRateLimitOptions {
  windowMs?: number;
  max?: number;
  keyPrefix?: string;
}

export async function createProductionRateLimiter(options: ProductionRateLimitOptions = {}) {
  const client = await getRedisClient();
  if (!client) {
    return createRateLimiter({
      windowMs: options.windowMs || 15 * 60 * 1000,
      max: options.max || 100,
      keyPrefix: options.keyPrefix || 'rl:prod',
    });
  }

  const windowMs = options.windowMs || 15 * 60 * 1000;
  const max = options.max || 100;
  const keyPrefix = options.keyPrefix || 'rl:prod';

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `${keyPrefix}:${req.ip || 'unknown'}`;
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs);
    const redisKey = `${key}:${windowStart}`;

    try {
      const count = await client.incr(redisKey);
      if (count === 1) {
        await client.pexpire(redisKey, windowMs);
      }

      res.setHeader('RateLimit-Limit', max);
      res.setHeader('RateLimit-Remaining', Math.max(0, max - count));
      res.setHeader('RateLimit-Reset', Math.ceil((windowStart * windowMs + windowMs) / 1000));

      if (count > max) {
        const retryAfter = Math.ceil((windowStart * windowMs + windowMs - now) / 1000);
        return res.status(429).json({
          success: false,
          error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later.', retryAfter },
          timestamp: new Date().toISOString(),
        });
      }

      next();
    } catch {
      return createRateLimiter({ windowMs, max, keyPrefix })(req, res, next);
    }
  };
}
