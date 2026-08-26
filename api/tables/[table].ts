import pg from 'pg';

const { Pool } = pg;
let pool: any = null;

function getPool() {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 2,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 4000
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

  try {
    const dbPool = getPool();
    if (dbPool) {
      const dbRes = await dbPool.query(`SELECT * FROM "${tableName}" LIMIT 500`);
      return res.status(200).json(dbRes.rows);
    }
  } catch (err: any) {
    console.warn(`[API] Neon query failed for ${tableName}:`, err.message);
  }

  return res.status(200).json([]);
}
