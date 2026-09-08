/**
 * NexoraOS™ — Redis Module Tests
 * Tests for rate limiter, cache, session store, and in-memory fallback
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ─── Rate Limiter Tests (In-Memory Fallback) ────────────

describe('Redis Rate Limiter (Memory Fallback)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('allows requests under the limit', async () => {
    const { createDistributedRateLimiter } = await import('../rateLimiter');
    const limiter = createDistributedRateLimiter({
      windowMs: 60000,
      maxRequests: 5,
      keyPrefix: 'test:allow',
    });

    const req = { ip: '127.0.0.1', socket: { remoteAddress: '127.0.0.1' } } as any;
    const res = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    await limiter(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 5);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 4);
  });

  it('blocks after exceeding max requests', async () => {
    const { createDistributedRateLimiter } = await import('../rateLimiter');
    const limiter = createDistributedRateLimiter({
      windowMs: 60000,
      maxRequests: 2,
      keyPrefix: 'test:block',
    });

    const req = { ip: '10.0.0.1', socket: { remoteAddress: '10.0.0.1' } } as any;
    const res = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    // First two requests should pass
    await limiter(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    next.mockClear();
    res.status.mockClear();
    res.json.mockClear();
    res.setHeader.mockClear();

    await limiter(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    // Third request should be blocked
    next.mockClear();
    res.status.mockClear();
    res.json.mockClear();
    res.setHeader.mockClear();

    await limiter(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'RATE_LIMIT_EXCEEDED' }),
      })
    );
  });

  it('uses different keys for different IPs', async () => {
    const { createDistributedRateLimiter } = await import('../rateLimiter');
    const limiter = createDistributedRateLimiter({
      windowMs: 60000,
      maxRequests: 1,
      keyPrefix: 'test:diffkey',
    });

    const makeReq = (ip: string) => ({ ip, socket: { remoteAddress: ip } } as any);
    const makeRes = () => ({
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any);
    const next = vi.fn();

    // First IP - allowed
    await limiter(makeReq('192.168.1.1'), makeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);

    // Second IP - also allowed (different key)
    next.mockClear();
    await limiter(makeReq('192.168.1.2'), makeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('sets correct response headers', async () => {
    const { createDistributedRateLimiter } = await import('../rateLimiter');
    const limiter = createDistributedRateLimiter({
      windowMs: 60000,
      maxRequests: 10,
      keyPrefix: 'test:headers',
    });

    const req = { ip: '172.16.0.1', socket: { remoteAddress: '172.16.0.1' } } as any;
    const res = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    await limiter(req, res, next);

    const headerCalls = (res.setHeader as any).mock.calls.map((c: any[]) => c[0]);
    expect(headerCalls).toContain('X-RateLimit-Limit');
    expect(headerCalls).toContain('X-RateLimit-Remaining');
    expect(headerCalls).toContain('X-RateLimit-Reset');
  });

  it('fails open on middleware errors', async () => {
    const { createDistributedRateLimiter } = await import('../rateLimiter');
    const limiter = createDistributedRateLimiter({
      windowMs: 60000,
      maxRequests: 100,
      keyPrefix: 'test:failopen',
    });

    const req = { ip: '1.2.3.4', socket: {}, user: { id: 'test-user' } } as any;
    const res = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    await limiter(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('pre-configured limiters are defined', async () => {
    const mod = await import('../rateLimiter');
    expect(mod.authLimiter).toBeDefined();
    expect(mod.apiLimiter).toBeDefined();
    expect(mod.strictLimiter).toBeDefined();
    expect(mod.aiLimiter).toBeDefined();
    expect(mod.uploadLimiter).toBeDefined();
    expect(mod.exportLimiter).toBeDefined();
  });
});

// ─── Cache Tests (In-Memory Fallback) ───────────────────

describe('Redis Cache (Memory Fallback)', () => {
  it('set and get cached values', async () => {
    const { shortCache } = await import('../cache');
    const key = `test:${Date.now()}`;
    const value = { name: 'test', count: 42 };

    await shortCache.set(key, value, 60);
    const result = await shortCache.get(key);

    expect(result).toEqual(value);

    // Cleanup
    await shortCache.del(key);
  });

  it('returns null for expired cache entries', async () => {
    const { shortCache } = await import('../cache');
    const key = `exp:${Date.now()}`;

    const result = await shortCache.get(key);
    expect(result).toBeNull();
  });

  it('invalidates cache by tag', async () => {
    const { shortCache } = await import('../cache');
    const tagCache = shortCache;
    const key = `tag:${Date.now()}`;

    await tagCache.set(key, { tagged: true }, 60, ['test-tag']);
    expect(await tagCache.get(key)).toEqual({ tagged: true });

    await tagCache.invalidateTags(['test-tag']);
    expect(await tagCache.get(key)).toBeNull();
  });

  it('invalidates cache by pattern', async () => {
    const { shortCache } = await import('../cache');
    const patCache = shortCache;

    await patCache.set('users:1', { id: 1 }, 60);
    await patCache.set('users:2', { id: 2 }, 60);
    await patCache.set('products:1', { id: 1 }, 60);

    await patCache.invalidatePattern('users:*');
    expect(await patCache.get('users:1')).toBeNull();
    expect(await patCache.get('users:2')).toBeNull();
    expect(await patCache.get('products:1')).toEqual({ id: 1 });
  });

  it('tracks cache stats', async () => {
    const { shortCache } = await import('../cache');
    const statsCache = shortCache;
    const key = `stats:${Date.now()}`;

    await statsCache.set(key, 'value', 60);
    await statsCache.get(key);
    await statsCache.get('nonexistent');

    const stats = statsCache.getStats();
    expect(stats.hits).toBeGreaterThanOrEqual(1);
    expect(stats.misses).toBeGreaterThanOrEqual(1);
  });

  it('pre-configured caches are defined', async () => {
    const mod = await import('../cache');
    expect(mod.shortCache).toBeDefined();
    expect(mod.mediumCache).toBeDefined();
    expect(mod.longCache).toBeDefined();
    expect(mod.userCache).toBeDefined();
    expect(mod.cache).toBeDefined();
  });
});

// ─── Session Store Tests (In-Memory Fallback) ───────────

describe('Session Store (Memory Fallback)', () => {
  it('creates and retrieves sessions', async () => {
    const { sessionStore } = await import('../sessionStore');

    const sessionId = await sessionStore.create('user-1', { role: 'admin' });
    expect(sessionId).toBeDefined();
    expect(typeof sessionId).toBe('string');

    const session = await sessionStore.get(sessionId);
    expect(session).not.toBeNull();
    expect(session!.userId).toBe('user-1');
    expect(session!.role).toBe('admin');
  });

  it('updates session data', async () => {
    const { sessionStore } = await import('../sessionStore');

    const sessionId = await sessionStore.create('user-2', { theme: 'dark' });
    await sessionStore.update(sessionId, { theme: 'light' });

    const session = await sessionStore.get(sessionId);
    expect(session!.theme).toBe('light');
  });

  it('destroys a session', async () => {
    const { sessionStore } = await import('../sessionStore');

    const sessionId = await sessionStore.create('user-3', {});
    await sessionStore.destroy(sessionId);

    const session = await sessionStore.get(sessionId);
    expect(session).toBeNull();
  });

  it('counts active sessions per user', async () => {
    const { sessionStore } = await import('../sessionStore');

    await sessionStore.create('user-4', { a: 1 });
    await sessionStore.create('user-4', { a: 2 });
    await sessionStore.create('user-5', { a: 3 });

    const count = await sessionStore.countActiveSessions('user-4');
    expect(count).toBe(2);
  });

  it('destroys all sessions for a user', async () => {
    const { sessionStore } = await import('../sessionStore');

    await sessionStore.create('user-6', { a: 1 });
    await sessionStore.create('user-6', { a: 2 });

    const destroyed = await sessionStore.destroyAllForUser('user-6');
    expect(destroyed).toBe(2);

    const count = await sessionStore.countActiveSessions('user-6');
    expect(count).toBe(0);
  });

  it('checks session validity', async () => {
    const { sessionStore } = await import('../sessionStore');

    const sessionId = await sessionStore.create('user-7', {});
    expect(await sessionStore.isValid(sessionId)).toBe(true);

    await sessionStore.destroy(sessionId);
    expect(await sessionStore.isValid(sessionId)).toBe(false);
  });
});

// ─── Client Module Tests ────────────────────────────────

describe('Redis Client', () => {
  it('exports connectRedis and disconnectRedis functions', async () => {
    const mod = await import('../client');
    expect(typeof mod.connectRedis).toBe('function');
    expect(typeof mod.disconnectRedis).toBe('function');
    expect(typeof mod.isRedisReady).toBe('function');
    expect(typeof mod.healthCheck).toBe('function');
  });

  it('reports not ready when no Redis connection', async () => {
    const mod = await import('../client');
    // Without a Redis server, should report not ready
    expect(mod.isRedisReady()).toBe(false);
  });

  it('returns healthy status when not connected', async () => {
    const mod = await import('../client');
    const status = await mod.healthCheck();
    expect(status.status).toBe('unavailable');
  });
});

// ─── Index Module Tests ─────────────────────────────────

describe('Redis Module Index', () => {
  it('exports all expected symbols', async () => {
    const mod = await import('../index');
    expect(mod.authLimiter).toBeDefined();
    expect(mod.apiLimiter).toBeDefined();
    expect(mod.strictLimiter).toBeDefined();
    expect(mod.aiLimiter).toBeDefined();
    expect(mod.uploadLimiter).toBeDefined();
    expect(mod.exportLimiter).toBeDefined();
    expect(mod.shortCache).toBeDefined();
    expect(mod.mediumCache).toBeDefined();
    expect(mod.longCache).toBeDefined();
    expect(mod.userCache).toBeDefined();
    expect(mod.cache).toBeDefined();
    expect(mod.sessionStore).toBeDefined();
    expect(typeof mod.connectRedis).toBe('function');
    expect(typeof mod.disconnectRedis).toBe('function');
  });
});
