/**
 * NexoraOS™ — Consolidated Database Service
 * Single source of truth for all database connections
 * Replaces dual-pool architecture with unified singleton
 */

import pg from 'pg';
import { serverConfig } from '../config/index';

const { Pool } = pg;

let _pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: serverConfig.databaseUrl,
      max: 20,
      min: 2,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 15000,
      statement_timeout: 30000,
      query_timeout: 30000,
      ssl: { rejectUnauthorized: false },
    });

    _pool.on('error', (err) => {
      console.error('[DB Pool] Unexpected idle client error:', err.message);
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
      console.warn(`[DB] Slow query (${duration}ms):`, text.substring(0, 100));
    }
    return result;
  } catch (err: any) {
    console.error('[DB] Query error:', err.message, '\nSQL:', text.substring(0, 200));
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

export { pg };
