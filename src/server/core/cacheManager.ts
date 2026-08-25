/**
 * NexoraOS™ — Advanced Cache Manager
 * Multi-tier cache with LRU eviction, tag-based invalidation, and statistics
 */

import logger from './logger';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
  tags: string[];
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
}

export class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private stats: CacheStats = { hits: 0, misses: 0, evictions: 0, size: 0 };
  private maxSize: number;
  private defaultTTL: number;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(options: { maxSize?: number; defaultTTL?: number; cleanupIntervalMs?: number } = {}) {
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.defaultTTL || 60000; // 1 minute
    this.cleanupInterval = setInterval(() => this.cleanup(), options.cleanupIntervalMs || 30000);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttl?: number, tags: string[] = []) {
    // Evict if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evict();
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttl || this.defaultTTL),
      accessCount: 0,
      lastAccessed: Date.now(),
      tags,
    });
    this.stats.size = this.cache.size;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    this.stats.size = this.cache.size;
    return deleted;
  }

  invalidateByTag(tag: string): number {
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        count++;
      }
    }
    this.stats.size = this.cache.size;
    if (count > 0) {
      logger.info(`CacheManager tag invalidation: tag=${tag}, removed=${count}`, { context: 'cache' });
    }
    return count;
  }

  invalidateByPattern(pattern: string): number {
    const regex = new RegExp(pattern);
    let count = 0;
    for (const [key] of this.cache.entries()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    this.stats.size = this.cache.size;
    if (count > 0) {
      logger.info(`CacheManager pattern invalidation: pattern=${pattern}, removed=${count}`, { context: 'cache' });
    }
    return count;
  }

  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  private evict(): void {
    // LRU eviction: remove least recently accessed
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      this.stats.size = this.cache.size;
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
    this.stats.size = this.cache.size;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? this.stats.hits / total : 0;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Singleton instances for different cache tiers
export const apiCache = new CacheManager({ maxSize: 500, defaultTTL: 30000 }); // 30s
export const queryCache = new CacheManager({ maxSize: 200, defaultTTL: 60000 }); // 1m
export const sessionCache = new CacheManager({ maxSize: 1000, defaultTTL: 3600000 }); // 1h
