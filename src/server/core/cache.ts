/**
 * NexoraOS™ — Caching Layer
 * In-memory LRU cache with TTL, stats, and pattern invalidation
 */

import { LRUCache } from 'lru-cache';
import logger from './logger';

interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
  hits: number;
  createdAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  size: number;
}

interface CacheConfig {
  maxEntries: number;
  defaultTtlMs: number;
  enableStats: boolean;
  evictionPolicy: 'lru' | 'lfu' | 'fifo';
}

class NexoraCache {
  private store = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private stats: CacheStats = { hits: 0, misses: 0, sets: 0, deletes: 0, evictions: 0, size: 0 };
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxEntries: parseInt(process.env.CACHE_MAX_ENTRIES || '10000'),
      defaultTtlMs: parseInt(process.env.CACHE_TTL_MS || '300000'), // 5 min
      enableStats: process.env.CACHE_STATS !== 'false',
      evictionPolicy: (process.env.CACHE_EVICTION as any) || 'lru',
      ...config,
    };
    // Cleanup expired entries every 60 seconds
    this.cleanupTimer = setInterval(() => this.cleanup(), 60000);
  }

  get<T = any>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) { this.stats.misses++; return undefined; }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.stats.misses++;
      this.stats.size = this.store.size;
      return undefined;
    }
    entry.hits++;
    this.stats.hits++;
    return entry.value;
  }

  set<T = any>(key: string, value: T, ttlMs?: number): void {
    if (this.store.size >= this.config.maxEntries) this.evict();
    const ttl = ttlMs || this.config.defaultTtlMs;
    this.store.set(key, { value, expiresAt: Date.now() + ttl, hits: 0, createdAt: Date.now() });
    this.stats.sets++;
    this.stats.size = this.store.size;
  }

  delete(key: string): boolean {
    const deleted = this.store.delete(key);
    if (deleted) { this.stats.deletes++; this.stats.size = this.store.size; }
    return deleted;
  }

  invalidatePattern(pattern: string): number {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    let count = 0;
    for (const key of this.store.keys()) {
      if (regex.test(key)) { this.store.delete(key); count++; }
    }
    this.stats.size = this.store.size;
    if (count > 0) logger.info(`Cache invalidation: pattern=${pattern}, removed=${count}`, { context: 'cache' });
    return count;
  }

  invalidateNamespace(namespace: string): number {
    return this.invalidatePattern(`^${namespace}:`);
  }

  clear(): void {
    this.store.clear();
    this.stats.size = 0;
    logger.info('Cache cleared', { context: 'cache' });
  }

  getStats(): CacheStats & { hitRate: string } {
    const total = this.stats.hits + this.stats.misses;
    return { ...this.stats, hitRate: total > 0 ? `${((this.stats.hits / total) * 100).toFixed(1)}%` : '0%' };
  }

  private evict(): void {
    if (this.store.size === 0) return;
    const entries = Array.from(this.store.entries());
    if (this.config.evictionPolicy === 'lru') {
      entries.sort((a, b) => a[1].hits - b[1].hits || a[1].createdAt - b[1].createdAt);
    } else if (this.config.evictionPolicy === 'fifo') {
      entries.sort((a, b) => a[1].createdAt - b[1].createdAt);
    }
    const evictCount = Math.max(1, Math.floor(this.config.maxEntries * 0.1));
    for (let i = 0; i < evictCount && i < entries.length; i++) {
      this.store.delete(entries[i][0]);
      this.stats.evictions++;
    }
    this.stats.size = this.store.size;
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) { this.store.delete(key); cleaned++; }
    }
    if (cleaned > 0) { this.stats.size = this.store.size; }
  }

  destroy(): void {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    this.store.clear();
  }
}

// ─── Cache-aside Helpers ───────────────────────────────

export async function cached<T>(
  cache: NexoraCache,
  key: string,
  ttlMs: number | undefined,
  fetcher: () => Promise<T>
): Promise<T> {
  const hit = cache.get<T>(key);
  if (hit !== undefined) return hit;
  const value = await fetcher();
  cache.set(key, value, ttlMs);
  return value;
}

// ─── Tenant-aware key builder ──────────────────────────

export function cacheKey(tenantId: string, namespace: string, ...parts: (string | number)[]): string {
  return `${tenantId}:${namespace}:${parts.join(':')}`;
}

// ─── Singleton ─────────────────────────────────────────

export const cache = new NexoraCache();
export default cache;

// ─── LRU Cache for High-Frequency Dashboard Endpoints ──

export const apiCache = new LRUCache<string, any>({
  max: 500,
  ttl: 1000 * 30, // 30 seconds TTL for fast-moving dashboard data
  allowStale: true,
  updateAgeOnGet: false,
  updateAgeOnHas: false
});
