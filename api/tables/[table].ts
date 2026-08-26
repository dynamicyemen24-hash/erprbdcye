import pg from 'pg';
import { REAL_ENTERPRISE_DATA } from '../../src/core/data/realEnterpriseData';

const { Pool } = pg;
let pool: pg.Pool | null = null;

function getPool() {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 2,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 3000
    });
  }
  return pool;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { table } = req.query;
  const tableName = Array.isArray(table) ? table[0] : table;

  if (!tableName || !/^[a-zA-Z0-9_]+$/.test(tableName)) {
    return res.status(400).json({ error: 'Invalid table name' });
  }

  // First try Neon PostgreSQL live query
  const dbPool = getPool();
  if (dbPool) {
    try {
      const dbRes = await dbPool.query(`SELECT * FROM "${tableName}" LIMIT 500`);
      return res.status(200).json(dbRes.rows);
    } catch (err: any) {
      console.warn('[API] Neon live query fallback:', err.message);
    }
  }

  // Graceful fallback to verified institutional snapshot
  const snapshotData = (REAL_ENTERPRISE_DATA as any)[tableName];
  if (snapshotData && Array.isArray(snapshotData)) {
    return res.status(200).json(snapshotData);
  }

  return res.status(200).json([]);
}
