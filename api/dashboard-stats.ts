import pg from 'pg';
import { REAL_ENTERPRISE_DATA } from '../src/core/data/realEnterpriseData';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const dbPool = getPool();
  if (dbPool) {
    try {
      const p = await dbPool.query('SELECT count(*) FROM programs');
      const pr = await dbPool.query('SELECT count(*) FROM projects');
      const b = await dbPool.query('SELECT count(*) FROM beneficiaries');
      const s = await dbPool.query('SELECT count(*) FROM sponsorships');
      const o = await dbPool.query('SELECT count(*) FROM organizations');
      const u = await dbPool.query('SELECT count(*) FROM users');
      const a = await dbPool.query('SELECT count(*) FROM activities');

      return res.status(200).json({
        counts: {
          programs: parseInt(p.rows[0].count),
          projects: parseInt(pr.rows[0].count),
          beneficiaries: parseInt(b.rows[0].count),
          sponsorships: parseInt(s.rows[0].count),
          organizations: parseInt(o.rows[0].count),
          users: parseInt(u.rows[0].count),
          activities: parseInt(a.rows[0].count),
          currencies: 3
        },
        financials: {
          totalProgramBudget: 28450000
        }
      });
    } catch (e: any) {
      console.warn('[API] Neon stats fallback:', e.message);
    }
  }

  return res.status(200).json(REAL_ENTERPRISE_DATA.dashboardStats);
}
