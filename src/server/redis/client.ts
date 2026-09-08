/**
 * NexoraOS™ — Redis Client with Connection Pooling & Graceful Degradation
 * Lazy-connect, automatic reconnection, fallback to in-memory if Redis unavailable
 */

import Redis from 'ioredis';
import logger from '../core/logger';

// ─── Configuration ──────────────────────────────────────

interface RedisClientConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
  maxRetriesPerRequest: number;
  retryStrategy(times: number): number;
  enableReadyCheck: boolean;
  lazyConnect: boolean;
}

function buildConfig(): RedisClientConfig {
  const host = process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const password = process.env.REDIS_PASSWORD || undefined;
  const db = parseInt(process.env.REDIS_DB || '0', 10);

  return {
    host,
    port,
    password,
    db,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'nexora:',
    maxRetriesPerRequest: 3,
    retryStrategy(times: number): number {
      if (times > 10) return -1; // stop retrying
      const delay = Math.min(times * 200, 3000);
      return delay;
    },
    enableReadyCheck: true,
    lazyConnect: true,
  };
}

// ─── Connection Pool ────────────────────────────────────

const MAX_POOL_SIZE = 10;
const connections: Redis[] = [];
let primaryClient: Redis | null = null;
let isRedisAvailable = false;
let connecting = false;

function createRedisInstance(config?: Partial<RedisClientConfig>): Redis {
  const fullConfig = { ...buildConfig(), ...config };
  const opts: any = {
    host: fullConfig.host,
    port: fullConfig.port,
    db: fullConfig.db,
    keyPrefix: fullConfig.keyPrefix,
    maxRetriesPerRequest: fullConfig.maxRetriesPerRequest,
    retryStrategy: fullConfig.retryStrategy,
    enableReadyCheck: fullConfig.enableReadyCheck,
    lazyConnect: fullConfig.lazyConnect,
  };
  if (fullConfig.password) opts.password = fullConfig.password;
  return new Redis(opts);
}

// ─── Primary Client ─────────────────────────────────────

function getPrimaryClient(): Redis {
  if (!primaryClient) {
    primaryClient = createRedisInstance();
    primaryClient.on('error', (err: Error) => {
      if (isRedisAvailable) {
        logger.warn(`[Redis] Primary client error: ${err.message}`);
      }
      isRedisAvailable = false;
    });
    primaryClient.on('connect', () => {
      isRedisAvailable = true;
    });
    primaryClient.on('close', () => {
      isRedisAvailable = false;
    });
  }
  return primaryClient;
}

// ─── Connection Pool ────────────────────────────────────

function getConnectionFromPool(): Redis | null {
  if (!isRedisAvailable) return null;
  if (connections.length < MAX_POOL_SIZE) {
    const client = createRedisInstance();
    connections.push(client);
    return client;
  }
  // Return least-used connection
  return connections[0] || null;
}

function releaseConnection(client: Redis): void {
  const idx = connections.indexOf(client);
  if (idx >= 0) {
    connections.splice(idx, 1);
    client.quit().catch(() => client.disconnect());
  }
}

// ─── Public API ─────────────────────────────────────────

export async function connectRedis(): Promise<boolean> {
  if (connecting) return isRedisAvailable;
  connecting = true;

  try {
    const client = getPrimaryClient();
    await client.connect();
    isRedisAvailable = true;
    logger.info('[Redis] Connected successfully');
    return true;
  } catch (err: any) {
    isRedisAvailable = false;
    logger.warn(`[Redis] Connection failed: ${err.message}. Falling back to in-memory.`);
    return false;
  } finally {
    connecting = false;
  }
}

export async function disconnectRedis(): Promise<void> {
  try {
    if (primaryClient) {
      await primaryClient.quit();
      primaryClient = null;
    }
    for (const conn of connections) {
      conn.disconnect();
    }
    connections.length = 0;
    isRedisAvailable = false;
    logger.info('[Redis] Disconnected');
  } catch (err: any) {
    logger.warn(`[Redis] Disconnect error: ${err.message}`);
  }
}

export function isRedisReady(): boolean {
  return isRedisAvailable && primaryClient !== null;
}

export async function healthCheck(): Promise<{ status: string; latencyMs?: number }> {
  if (!isRedisReady()) return { status: 'unavailable' };
  try {
    const start = Date.now();
    await primaryClient!.ping();
    return { status: 'healthy', latencyMs: Date.now() - start };
  } catch {
    return { status: 'unhealthy' };
  }
}

// Get a Redis client for operations — returns primary or null if unavailable
export function getClient(): Redis | null {
  return isRedisReady() ? primaryClient : null;
}

// Get pool connection for batched operations
export async function getPoolConnection(): Promise<{ client: Redis; release: () => void } | null> {
  const client = getConnectionFromPool();
  if (!client) return null;
  try {
    await client.connect();
    return { client, release: () => releaseConnection(client) };
  } catch {
    client.disconnect();
    return null;
  }
}

// Shutdown hook for graceful cleanup
process.on('SIGTERM', () => disconnectRedis());
process.on('SIGINT', () => disconnectRedis());

export { getPrimaryClient, createRedisInstance };
