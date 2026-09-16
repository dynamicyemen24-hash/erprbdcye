/**
 * NexoraOS™ — Consolidated Database Service
 * Single source of truth for all database connections
 * Replaces dual-pool architecture with unified singleton
 */

import pg from 'pg';
import { serverConfig } from '../config/index';
import logger from './logger';

const { Pool } = pg;

let _pool: pg.Pool | null = null;

function isConnectionError(error: Error): boolean {
  const connectionErrorCodes = [
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    'EPIPE',
    '57P01', // admin_shutdown
    '57P02', // crash_shutdown
    '57P03', // cannot_connect_now
    '08000', // connection_exception
    '08003', // connection_does_not_exist
    '08006', // connection_failure
  ];

  return connectionErrorCodes.some(code =>
    error.message.includes(code) || (error as any).code === code
  );
}

export function getPool(): pg.Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: serverConfig.databaseUrl,
      max: parseInt(process.env.DB_POOL_MAX || '20'),
      // Neon scales to zero: keeping min idle clients causes stale/dead
      // connections to accumulate. Start from zero and grow on demand.
      min: parseInt(process.env.DB_POOL_MIN || '0'),
      // Recycle idle connections quickly so Neon-killed sockets are replaced.
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_MS || '15000'),
      // Neon scale-to-zero cold start can take 15-20s; allow generous connect
      // timeout (configurable) so the first request after idle succeeds.
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '30000'),
      statement_timeout: 30000,
      query_timeout: 30000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      application_name: 'nexoraos-api',
      ssl: process.env.DB_SSL_CA
        ? { rejectUnauthorized: true, ca: process.env.DB_SSL_CA }
        // Strict TLS verification by default in production (Neon serves valid certs).
        // Override explicitly with DB_SSL_STRICT=false for private CAs.
        : {
            rejectUnauthorized: process.env.DB_SSL_STRICT
              ? process.env.DB_SSL_STRICT === 'true'
              : process.env.NODE_ENV === 'production',
          },
    });

    _pool.on('connect', () => {
      logger.debug('[DB Pool] New client connected', { context: 'db' });
    });

    _pool.on('remove', () => {
      logger.debug('[DB Pool] Client removed from pool', { context: 'db' });
    });

    _pool.on('error', (err) => {
      // pg removes the errored client from the pool automatically; we only
      // log. Nulling the whole pool here would race with in-flight queries
      // and leak the previous pool's clients.
      logger.error('[DB Pool] Unexpected idle client error (client removed by pg)', { context: 'db', error: err });
    });
  }
  return _pool;
}

export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[],
  retries = 3
): Promise<pg.QueryResult<T>> {
  const pool = getPool();
  const start = Date.now();
  let lastError: any = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = await pool.query<T>(text, params);
      const duration = Date.now() - start;
      if (duration > 1000) {
        logger.warn(`[DB] Slow query (${duration}ms): ${text.substring(0, 100)}`, { context: 'db' });
      }
      return result;
    } catch (err: any) {
      lastError = err;
      if (!isConnectionError(err) || attempt === retries - 1) {
        logger.error(`[DB] Query error: ${err.message} | SQL: ${text.substring(0, 200)}`, { context: 'db' });
        throw err;
      }
      logger.warn(`[DB] Transient connection error on attempt ${attempt + 1}/${retries}: ${err.message}. Retrying...`, { context: 'db' });
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 150));
    }
  }
  throw lastError;
}

export async function queryOne<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] ?? null;
}

export async function queryMany<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const result = await query<T>(text, params);
  return result.rows;
}

export async function transaction<T>(
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();
  let deadClient = false;
  try {
    await client.query('BEGIN');
    // Defense-in-depth tenant isolation: scope FORCE RLS policies to the
    // current request's organization (propagated via AsyncLocalStorage).
    // SET LOCAL auto-resets on COMMIT/ROLLBACK — never leaks across checkouts.
    try {
      const { getTenantOrgId } = await import('../tenantContext');
      const orgId = getTenantOrgId();
      if (orgId) {
        await client.query(`SELECT set_config('app.current_org', $1, true)`, [orgId]);
      }
    } catch { /* tenant scoping is best-effort here */ }
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr: any) {
      logger.warn(`[DB] Rollback failed (connection likely terminated): ${rollbackErr?.message || rollbackErr}`, { context: 'db' });
      // Signal pg to destroy this dead client instead of recycling it.
      deadClient = true;
    }
    throw err;
  } finally {
    if (deadClient) {
      client.release(new Error('connection terminated during transaction rollback'));
    } else {
      client.release();
    }
  }
}

/**
 * Single tenant-scoped query: runs in its own transaction with
 * app.current_org set so FORCE RLS policies enforce isolation even for
 * ad-hoc reads. Prefer this over raw query() for tenant data access.
 */
export async function queryTenant<T extends pg.QueryResultRow = any>(
  orgId: string,
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  return transaction(async (client) => {
    await client.query(`SELECT set_config('app.current_org', $1, true)`, [orgId]);
    return client.query<T>(text, params);
  });
}

export async function closePool(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
}

/**
 * Initialize the database connection pool and run initial health check.
 * Called during server startup to ensure database connectivity.
 */
export async function initDatabase(): Promise<void> {
  try {
    const pool = getPool();
    await pool.query('SELECT 1 as ping');
    logger.info('[DB] Database connection initialized and verified.', { context: 'db' });
  } catch (err: any) {
    logger.error(`[DB] Database initialization failed: ${err.message}`, { context: 'db' });
    throw err;
  }
}

/**
 * Enterprise Database Query Execution with Exponential Backoff Resilience
 * Handles Neon cold-starts & transient connection drops
 */
export async function queryWithRetry(sql: string, params: any[] = [], retries = 3): Promise<pg.QueryResult> {
  const dbPool = getPool();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await dbPool.query(sql, params);
    } catch (err: any) {
      lastError = err;
      if (!isConnectionError(err) || attempt === retries - 1) {
        throw err;
      }
      logger.warn(`[DB] Query failed, retrying (${attempt + 1}/${retries}). Error: ${err.message}`, { context: 'db' });
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
    }
  }

  throw lastError || new Error('Database query failed after retries');
}

// ─── Table Schema Info Cache ──────────────────────────────

export interface TableSchemaInfo {
  hasOrgCol: boolean;
  hasDeletedAt: boolean;
  hasCreatedAt: boolean;
}

export const tableSchemaCache = new Map<string, TableSchemaInfo>();

export async function getTableSchemaInfo(dbPool: pg.Pool, table: string): Promise<TableSchemaInfo> {
  const cached = tableSchemaCache.get(table);
  if (cached) return cached;

  const [hasOrgColRes, hasDeletedAtRes, hasCreatedAtRes] = await Promise.all([
    dbPool.query(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name='organization_id')`, [table]),
    dbPool.query(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name='deleted_at')`, [table]),
    dbPool.query(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name='created_at')`, [table])
  ]);

  const info: TableSchemaInfo = {
    hasOrgCol: hasOrgColRes.rows[0].exists,
    hasDeletedAt: hasDeletedAtRes.rows[0].exists,
    hasCreatedAt: hasCreatedAtRes.rows[0].exists
  };

  tableSchemaCache.set(table, info);
  return info;
}

export { pg };

export default {
  getPool,
  query,
  queryOne,
  queryMany,
  queryTenant,
  transaction,
  closePool,
  initDatabase,
  queryWithRetry,
  getTableSchemaInfo,
};
