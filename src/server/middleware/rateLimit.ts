/**
 * NexoraOS™ — Advanced Rate Limiting System
 * Tiered rate limiting with Redis-style sliding window
 */

import { Request, Response, NextFunction } from 'express';

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

// ─── Pre-configured Rate Limiters ──────────────────────

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
  const userRole = req.user?.role || 'GUEST';
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
