/**
 * NexoraOS™ — Redis Module Public API
 * Centralized exports for Redis client, rate limiting, caching, and session management
 */

export { getClient as redisClient, connectRedis, disconnectRedis, isRedisReady, healthCheck, getClient } from './client';
export {
  authLimiter,
  apiLimiter,
  strictLimiter,
  aiLimiter,
  uploadLimiter,
  exportLimiter,
  createDistributedRateLimiter,
} from './rateLimiter';
export type { RateLimitConfig } from './rateLimiter';

export {
  shortCache,
  mediumCache,
  longCache,
  userCache,
  cache,
  createCacheMiddleware,
  cacheInvalidationMiddleware,
} from './cache';
export type { CacheConfig, CacheInstance } from './cache';

export { sessionStore } from './sessionStore';
export type { SessionData, SessionStore } from './sessionStore';
