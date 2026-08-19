import pg from 'pg';
import { serverConfig } from '../config/index';

let pool: pg.Pool | null = null;

export function getDatabasePool(): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: serverConfig.databaseUrl,
      max: 15,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 30000,
      statement_timeout: 30000,
      ssl: { rejectUnauthorized: false }
    });

    pool.on('error', (err: any) => {
      console.error('Unexpected error on idle PostgreSQL client pool:', err.message);
      if (err.message.includes('closed') || err.message.includes('terminated')) {
        pool = null;
      }
    });
  }
  return pool;
}

export async function withTransaction<T>(
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const dbPool = getDatabasePool();
  const client = await dbPool.connect();
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

export async function closeDatabasePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
