/**
 * NexoraOS™ — Distributed Response Caching
 * Cache-aside pattern with Redis backing, tag-based invalidation,
 * stale-while-revalidate, and in-memory fallback
 */

import { Request, Response, NextFunction } from 'express';
import { getClient, isRedisReady } from './client';
import logger from '../core/logger';
import { LRUCache } from 'lru-cache';

// ─── Configuration ──────────────────────────────────────

export interface CacheConfig {
  ttl: number;
  prefix: string;
  invalidateOn?: string[];
  varyBy?: string[];
  staleWhileRevalidate?: number;
  maxEntries?: number;
}

// ─── In-Memory Cache (Fallback) ─────────────────────────

const memoryCache = new LRUCache<string, { value: any; expiresAt: number; tags: string[] }>({
  max: 5000,
  ttl: 1000 * 60 * 60, // 1 hour default max
});

// ─── Cache Instance ─────────────────────────────────────

export interface CacheInstance {
  get<T = any>(key: string): Promise<T | null>;
  set(key: string, value: any, ttlSeconds?: number, tags?: string[]): Promise<void>;
  del(key: string): Promise<void>;
  invalidateTags(tags: string[]): Promise<void>;
  invalidatePattern(pattern: string): Promise<void>;
  clear(): Promise<void>;
  getStats(): { hits: number; misses: number; size: number; redis: boolean };
}

function createCacheInstance(config: CacheConfig): CacheInstance {
  let hits = 0;
  let misses = 0;

  function buildKey(key: string): string {
    return `${config.prefix}:${key}`;
  }

  async function get<T = any>(key: string): Promise<T | null> {
    const redisKey = buildKey(key);
    const client = getClient();

    // Try Redis first
    if (client) {
      try {
        const data = await client.get(redisKey);
        if (data) {
          hits++;
          const parsed = JSON.parse(data);
          return parsed.value as T;
        }
        misses++;
        return null;
      } catch (err: any) {
        logger.warn(`[Cache Redis] GET error: ${err.message}`);
      }
    }

    // Fallback to memory
    const entry = memoryCache.get(redisKey);
    if (entry && entry.expiresAt > Date.now()) {
      hits++;
      return entry.value as T;
    }
    misses++;
    return null;
  }

  async function set(key: string, value: any, ttlSeconds?: number, tags: string[] = []): Promise<void> {
    const ttl = ttlSeconds || config.ttl;
    const redisKey = buildKey(key);
    const client = getClient();
    const payload = JSON.stringify({ value, tags, createdAt: Date.now() });

    // Store in Redis
    if (client) {
      try {
        await client.setex(redisKey, ttl, payload);

        // Index by tags for invalidation
        for (const tag of tags) {
          await client.sadd(`${config.prefix}:tag:${tag}`, redisKey);
          await client.expire(`${config.prefix}:tag:${tag}`, ttl + 60);
        }
        return;
      } catch (err: any) {
        logger.warn(`[Cache Redis] SET error: ${err.message}`);
      }
    }

    // Fallback to memory
    memoryCache.set(redisKey, {
      value,
      expiresAt: Date.now() + ttl * 1000,
      tags,
    }, { ttl: ttl * 1000 });
  }

  async function del(key: string): Promise<void> {
    const redisKey = buildKey(key);
    const client = getClient();

    if (client) {
      try {
        // Get tags before deleting for cleanup
        const data = await client.get(redisKey);
        if (data) {
          const parsed = JSON.parse(data);
          for (const tag of (parsed.tags || [])) {
            await client.srem(`${config.prefix}:tag:${tag}`, redisKey);
          }
        }
        await client.del(redisKey);
        return;
      } catch (err: any) {
        logger.warn(`[Cache Redis] DEL error: ${err.message}`);
      }
    }

    memoryCache.delete(redisKey);
  }

  async function invalidateTags(tags: string[]): Promise<void> {
    const client = getClient();

    if (client) {
      try {
        for (const tag of tags) {
          const tagKey = `${config.prefix}:tag:${tag}`;
          const keys = await client.smembers(tagKey);
          if (keys.length > 0) {
            await client.del(...keys);
          }
          await client.del(tagKey);
        }
        return;
      } catch (err: any) {
        logger.warn(`[Cache Redis] InvalidateTags error: ${err.message}`);
      }
    }

    // Memory fallback: scan and delete
    for (const tag of tags) {
      for (const [cacheKey, entry] of memoryCache.entries()) {
        if (entry.tags.includes(tag)) {
          memoryCache.delete(cacheKey);
        }
      }
    }
  }

  async function invalidatePattern(pattern: string): Promise<void> {
    const client = getClient();

    if (client) {
      try {
        const keys = await client.keys(`${config.prefix}:${pattern}`);
        if (keys.length > 0) {
          await client.del(...keys);
        }
        return;
      } catch (err: any) {
        logger.warn(`[Cache Redis] InvalidatePattern error: ${err.message}`);
      }
    }

    // Memory fallback
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const key of memoryCache.keys()) {
      if (regex.test(key)) {
        memoryCache.delete(key);
      }
    }
  }

  async function clear(): Promise<void> {
    const client = getClient();

    if (client) {
      try {
        const keys = await client.keys(`${config.prefix}:*`);
        if (keys.length > 0) {
          await client.del(...keys);
        }
        return;
      } catch (err: any) {
        logger.warn(`[Cache Redis] Clear error: ${err.message}`);
      }
    }

    memoryCache.clear();
  }

  return { get, set, del, invalidateTags, invalidatePattern, clear, getStats: () => ({ hits, misses, size: memoryCache.size, redis: isRedisReady() }) };
}

// ─── Pre-Configured Caches ──────────────────────────────

export const shortCache = createCacheInstance({ ttl: 60, prefix: 'nexora:cache:short', staleWhileRevalidate: 30 });
export const mediumCache = createCacheInstance({ ttl: 300, prefix: 'nexora:cache:med', staleWhileRevalidate: 60 });
export const longCache = createCacheInstance({ ttl: 3600, prefix: 'nexora:cache:long', staleWhileRevalidate: 300 });
export const userCache = createCacheInstance({ ttl: 1800, prefix: 'nexora:cache:user', invalidateOn: ['user:update', 'user:delete'], staleWhileRevalidate: 300 });
export const cache = mediumCache; // Default alias

// ─── Cache Middleware ───────────────────────────────────

export function createCacheMiddleware(config: CacheConfig) {
  const instance = createCacheInstance(config);

  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') return next();

    const varyParts: string[] = [req.originalUrl];
    for (const h of (config.varyBy || [])) {
      varyParts.push(`${h}:${req.headers[h.toLowerCase()] || ''}`);
    }
    const cacheKey = varyParts.join(':');

    // Check stale-while-revalidate
    const cached = await instance.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-TTL', String(config.ttl));
      return res.json(cached);
    }

    // Capture response
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        instance.set(cacheKey, body, config.ttl);
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
}

// ─── Cache Invalidation on Mutations ────────────────────

export function cacheInvalidationMiddleware(invalidatePatterns: string[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      for (const pattern of invalidatePatterns) {
        await cache.invalidatePattern(pattern).catch(() => {});
      }
    }
    next();
  };
}
