/**
 * NexoraOS™ — Redis Session Store
 * Distributed session management with expiry, concurrent limits, and invalidation
 */

import { getClient, isRedisReady } from './client';
import logger from '../core/logger';

// ─── Configuration ──────────────────────────────────────

interface SessionConfig {
  maxConcurrentPerUser: number;
  sessionTtlSeconds: number;
  prefix: string;
}

const DEFAULT_CONFIG: SessionConfig = {
  maxConcurrentPerUser: 5,
  sessionTtlSeconds: 3600, // 1 hour
  prefix: 'nexora:session',
};

// ─── In-Memory Session Store (Fallback) ─────────────────

interface MemorySession {
  data: Record<string, any>;
  userId: string;
  expiresAt: number;
}

const memorySessions = new Map<string, MemorySession>();

// Cleanup every 5 minutes
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, session] of memorySessions.entries()) {
    if (now > session.expiresAt) {
      memorySessions.delete(key);
    }
  }
}, 300000);

if (typeof cleanupInterval.unref === 'function') cleanupInterval.unref();

// ─── Session Store ──────────────────────────────────────

export interface SessionData {
  userId: string;
  sessionId: string;
  createdAt: number;
  expiresAt: number;
  ip?: string;
  userAgent?: string;
  [key: string]: any;
}

export interface SessionStore {
  create(userId: string, data: Record<string, any>, meta?: { ip?: string; userAgent?: string }): Promise<string>;
  get(sessionId: string): Promise<SessionData | null>;
  update(sessionId: string, data: Record<string, any>): Promise<void>;
  destroy(sessionId: string): Promise<void>;
  destroyAllForUser(userId: string, exceptSessionId?: string): Promise<number>;
  getActiveSessionsForUser(userId: string): Promise<SessionData[]>;
  countActiveSessions(userId: string): Promise<number>;
  isValid(sessionId: string): Promise<boolean>;
  touch(sessionId: string): Promise<void>;
  destroyAll(): Promise<number>;
}

function buildSessionKey(sessionId: string): string {
  return `${DEFAULT_CONFIG.prefix}:${sessionId}`;
}

function buildUserSessionsKey(userId: string): string {
  return `${DEFAULT_CONFIG.prefix}:user:${userId}`;
}

// ─── Redis-Backed Implementation ────────────────────────

function createStore(): SessionStore {
  async function create(
    userId: string,
    data: Record<string, any>,
    meta?: { ip?: string; userAgent?: string }
  ): Promise<string> {
    const sessionId = generateSessionId();
    const now = Date.now();
    const sessionData: SessionData = {
      userId,
      sessionId,
      createdAt: now,
      expiresAt: now + DEFAULT_CONFIG.sessionTtlSeconds * 1000,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      ...data,
    };

    const client = getClient();
    if (client) {
      try {
        // Check concurrent session limit
        const existingSessions = await client.smembers(buildUserSessionsKey(userId));
        if (existingSessions.length >= DEFAULT_CONFIG.maxConcurrentPerUser) {
          // Remove oldest session
          let oldest: SessionData | null = null;
          let oldestId = '';
          for (const sid of existingSessions) {
            const s = await client.get(buildSessionKey(sid));
            if (s) {
              const parsed: SessionData = JSON.parse(s);
              if (!oldest || parsed.createdAt < oldest.createdAt) {
                oldest = parsed;
                oldestId = sid;
              }
            }
          }
          if (oldestId) {
            await client.del(buildSessionKey(oldestId));
            await client.srem(buildUserSessionsKey(userId), oldestId);
          }
        }

        await client.setex(buildSessionKey(sessionId), DEFAULT_CONFIG.sessionTtlSeconds, JSON.stringify(sessionData));
        await client.sadd(buildUserSessionsKey(userId), sessionId);
        await client.expire(buildUserSessionsKey(userId), DEFAULT_CONFIG.sessionTtlSeconds + 60);
        return sessionId;
      } catch (err: any) {
        logger.warn(`[Session Redis] Create error: ${err.message}`);
      }
    }

    // Memory fallback
    memorySessions.set(buildSessionKey(sessionId), {
      data: sessionData,
      userId,
      expiresAt: sessionData.expiresAt,
    });
    return sessionId;
  }

  async function get(sessionId: string): Promise<SessionData | null> {
    const client = getClient();
    if (client) {
      try {
        const data = await client.get(buildSessionKey(sessionId));
        if (data) {
          const parsed: SessionData = JSON.parse(data);
          if (Date.now() > parsed.expiresAt) {
            await destroy(sessionId);
            return null;
          }
          return parsed;
        }
        return null;
      } catch (err: any) {
        logger.warn(`[Session Redis] Get error: ${err.message}`);
      }
    }

    // Memory fallback
    const entry = memorySessions.get(buildSessionKey(sessionId));
    if (entry && Date.now() < entry.expiresAt) {
      return entry.data as SessionData;
    }
    if (entry) memorySessions.delete(buildSessionKey(sessionId));
    return null;
  }

  async function update(sessionId: string, data: Record<string, any>): Promise<void> {
    const existing = await get(sessionId);
    if (!existing) return;

    const updated = { ...existing, ...data };
    const client = getClient();
    if (client) {
      try {
        const ttl = await client.ttl(buildSessionKey(sessionId));
        await client.setex(buildSessionKey(sessionId), Math.max(ttl, 60), JSON.stringify(updated));
        return;
      } catch (err: any) {
        logger.warn(`[Session Redis] Update error: ${err.message}`);
      }
    }

    memorySessions.set(buildSessionKey(sessionId), {
      data: updated,
      userId: existing.userId,
      expiresAt: existing.expiresAt,
    });
  }

  async function destroy(sessionId: string): Promise<void> {
    const client = getClient();
    if (client) {
      try {
        const data = await client.get(buildSessionKey(sessionId));
        if (data) {
          const parsed: SessionData = JSON.parse(data);
          await client.srem(buildUserSessionsKey(parsed.userId), sessionId);
        }
        await client.del(buildSessionKey(sessionId));
        return;
      } catch (err: any) {
        logger.warn(`[Session Redis] Destroy error: ${err.message}`);
      }
    }

    const entry = memorySessions.get(buildSessionKey(sessionId));
    memorySessions.delete(buildSessionKey(sessionId));
  }

  async function destroyAllForUser(userId: string, exceptSessionId?: string): Promise<number> {
    let count = 0;
    const client = getClient();
    if (client) {
      try {
        const sessions = await client.smembers(buildUserSessionsKey(userId));
        for (const sid of sessions) {
          if (exceptSessionId && sid === exceptSessionId) continue;
          await client.del(buildSessionKey(sid));
          count++;
        }
        if (exceptSessionId) {
          await client.srem(buildUserSessionsKey(userId), ...sessions.filter(s => s !== exceptSessionId));
        } else {
          await client.del(buildUserSessionsKey(userId));
        }
        return count;
      } catch (err: any) {
        logger.warn(`[Session Redis] DestroyAllForUser error: ${err.message}`);
      }
    }

    // Memory fallback
    for (const [key, entry] of memorySessions.entries()) {
      if (entry.userId === userId) {
        const sid = key.split(':').pop();
        if (exceptSessionId && sid === exceptSessionId) continue;
        memorySessions.delete(key);
        count++;
      }
    }
    return count;
  }

  async function getActiveSessionsForUser(userId: string): Promise<SessionData[]> {
    const sessions: SessionData[] = [];
    const client = getClient();
    if (client) {
      try {
        const sessionIds = await client.smembers(buildUserSessionsKey(userId));
        for (const sid of sessionIds) {
          const data = await client.get(buildSessionKey(sid));
          if (data) {
            sessions.push(JSON.parse(data));
          } else {
            await client.srem(buildUserSessionsKey(userId), sid);
          }
        }
        return sessions;
      } catch (err: any) {
        logger.warn(`[Session Redis] GetActive error: ${err.message}`);
      }
    }

    for (const entry of memorySessions.values()) {
      if (entry.userId === userId && Date.now() < entry.expiresAt) {
        sessions.push(entry.data as SessionData);
      }
    }
    return sessions;
  }

  async function countActiveSessions(userId: string): Promise<number> {
    const sessions = await getActiveSessionsForUser(userId);
    return sessions.length;
  }

  async function isValid(sessionId: string): Promise<boolean> {
    const session = await get(sessionId);
    return session !== null && Date.now() < session.expiresAt;
  }

  async function touch(sessionId: string): Promise<void> {
    const client = getClient();
    if (client) {
      try {
        const key = buildSessionKey(sessionId);
        const data = await client.get(key);
        if (data) {
          const parsed: SessionData = JSON.parse(data);
          parsed.expiresAt = Date.now() + DEFAULT_CONFIG.sessionTtlSeconds * 1000;
          await client.setex(key, DEFAULT_CONFIG.sessionTtlSeconds, JSON.stringify(parsed));
        }
        return;
      } catch (err: any) {
        logger.warn(`[Session Redis] Touch error: ${err.message}`);
      }
    }

    const entry = memorySessions.get(buildSessionKey(sessionId));
    if (entry) {
      entry.expiresAt = Date.now() + DEFAULT_CONFIG.sessionTtlSeconds * 1000;
    }
  }

  async function destroyAll(): Promise<number> {
    let count = 0;
    const client = getClient();
    if (client) {
      try {
        const keys = await client.keys(`${DEFAULT_CONFIG.prefix}:*`);
        if (keys.length > 0) {
          await client.del(...keys);
          count = keys.length;
        }
        return count;
      } catch (err: any) {
        logger.warn(`[Session Redis] DestroyAll error: ${err.message}`);
      }
    }

    count = memorySessions.size;
    memorySessions.clear();
    return count;
  }

  return { create, get, update, destroy, destroyAllForUser, getActiveSessionsForUser, countActiveSessions, isValid, touch, destroyAll };
}

// ─── Helpers ────────────────────────────────────────────

function generateSessionId(): string {
  const array = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < 32; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Export ─────────────────────────────────────────────

export const sessionStore = createStore();

// Cleanup on shutdown
process.on('SIGTERM', () => {
  clearInterval(cleanupInterval);
  sessionStore.destroyAll().catch(() => {});
});
process.on('SIGINT', () => {
  clearInterval(cleanupInterval);
  sessionStore.destroyAll().catch(() => {});
});
