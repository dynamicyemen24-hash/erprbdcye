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
      min: parseInt(process.env.DB_POOL_MIN || '5'),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      statement_timeout: 30000,
      query_timeout: 30000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: true, ca: process.env.DB_SSL_CA }
        : { rejectUnauthorized: false },
    });

    _pool.on('connect', () => {
      logger.debug('[DB Pool] New client connected', { context: 'db' });
    });

    _pool.on('remove', () => {
      logger.debug('[DB Pool] Client removed from pool', { context: 'db' });
    });

    _pool.on('error', (err) => {
      logger.error('[DB Pool] Unexpected idle client error', { context: 'db', error: err });
      if (err.message.includes('closed') || err.message.includes('terminated')) {
        _pool = null;
      }
    });
  }
  return _pool;
}

export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  const pool = getPool();
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      logger.warn(`[DB] Slow query (${duration}ms): ${text.substring(0, 100)}`, { context: 'db' });
    }
    return result;
  } catch (err: any) {
    logger.error(`[DB] Query error: ${err.message} | SQL: ${text.substring(0, 200)}`, { context: 'db' });
    throw err;
  }
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
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
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
  transaction,
  closePool,
  initDatabase,
  queryWithRetry,
  getTableSchemaInfo,
};
