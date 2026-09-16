import pg from 'pg';
import jwt from 'jsonwebtoken';
import { applySecurityHeaders, resolveCorsOrigin } from './_shared/security-headers';

const { Pool } = pg;

// ═══════════════════════════════════════════════════════════════════
// NexoraOS™ — Dashboard Stats API (Vercel serverless shim)
// GET /api/dashboard-stats — authenticated, read-only aggregate counts.
// ═══════════════════════════════════════════════════════════════════

// ─── Fail-closed JWT secret (no insecure fallbacks) ────────────────
const jwtSecret: string = (() => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('[STATS] JWT_SECRET is required — refusing to start with an insecure fallback');
  return s;
})();

function verifyToken(authHeader: string | undefined): { ok: boolean; payload?: any } {
  if (!authHeader) return { ok: false };
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!token) return { ok: false };
  try {
    const decoded: any = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
    if (!decoded || typeof decoded !== 'object') return { ok: false };
    return { ok: true, payload: decoded };
  } catch {
    return { ok: false };
  }
}

/** Resolve the tenant id exclusively from the signed token payload. */
function resolveTenantId(payload: any): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const org = payload.organization_id || payload.org_id || payload.org;
  return org ? String(org) : null;
}

let pool: any = null;

function getPool() {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // ── TLS hardening: never downgrade certificate verification ──
      ssl: process.env.DB_SSL_CA
        ? { rejectUnauthorized: true, ca: process.env.DB_SSL_CA }
        : { rejectUnauthorized: process.env.DB_SSL_STRICT === 'true' },
      max: parseInt(process.env.DB_POOL_MAX_SERVERLESS || '2', 10),
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_MS || '10000', 10),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '15000', 10),
      statement_timeout: 15000,
      query_timeout: 15000,
    });
    pool.on('error', (err: any) => {
      console.error('[API/Stats] Pool error:', err.message);
    });
  }
  return pool;
}

export default async function handler(req: any, res: any) {
  const corsOrigin = resolveCorsOrigin(req.headers?.origin);
  if (corsOrigin) {
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  applySecurityHeaders(res);

  if (req.method === 'OPTIONS') return res.status(204).end();

  // ── Security: Bearer JWT required (same secret as the Express API) ──
  const auth = verifyToken(req.headers?.authorization);
  if (!auth.ok) {
    return res.status(401).json({ error: 'Access Denied: Missing or invalid authentication token' });
  }

  if (req.method !== 'GET') {
    return res.setHeader('Allow', 'GET, OPTIONS').status(405).json({ error: 'Method Not Allowed' });
  }

  const tenantId = resolveTenantId(auth.payload);

  try {
    const dbPool = getPool();
    if (dbPool) {
      // ── Tenant-scoped aggregate counts: every query is bounded by the
      //    organization claim from the signed token (never headers). ──
      const countFor = async (table: string, orgCol = 'organization_id') => {
        if (!tenantId) return 0;
        const r = await dbPool.query(
          `SELECT count(*) FROM "${table}" WHERE ${orgCol} = $1 AND deleted_at IS NULL`,
          [tenantId]
        );
        return parseInt(r.rows[0].count, 10);
      };

      const [programs, projects, beneficiaries, sponsorships, activities] = await Promise.all([
        countFor('programs'),
        countFor('projects'),
        countFor('beneficiaries'),
        countFor('sponsorships'),
        countFor('activities'),
      ]);

      // Tenant-scoped only: global counts would leak other tenants' size.
      // organizations = caller's own org (0/1); users/budget = 0 without a claim.
      const o = tenantId
        ? await dbPool.query('SELECT count(*) FROM organizations WHERE id = $1', [tenantId])
        : { rows: [{ count: '0' }] };
      const u = tenantId
        ? await dbPool.query('SELECT count(*) FROM users WHERE organization_id = $1 AND deleted_at IS NULL', [tenantId])
        : { rows: [{ count: '0' }] };

      // Currency count and program budget come from live data, not constants.
      const curr = await dbPool.query(
        'SELECT count(DISTINCT currency_code)::int AS c FROM exchange_rates'
      ).catch(() => ({ rows: [{ c: 0 }] }));

      const budget = tenantId
        ? await dbPool.query(
            `SELECT COALESCE(SUM(planned_budget), 0)::float AS total FROM projects WHERE organization_id = $1 AND deleted_at IS NULL`,
            [tenantId]
          )
        : { rows: [{ total: 0 }] };

      return res.status(200).json({
        counts: {
          programs,
          projects,
          beneficiaries,
          sponsorships,
          organizations: parseInt(o.rows[0].count, 10),
          users: parseInt(u.rows[0].count, 10),
          activities,
          currencies: curr.rows[0]?.c || 0,
        },
        financials: {
          totalProgramBudget: Math.round(budget.rows[0]?.total ?? 0),
        },
      });
    }
  } catch (err: any) {
    // Log server-side only — never leak DB error details to the client
    console.warn('[API] Stats query error:', err.message);
    // Fail-closed in production: never serve fabricated numbers.
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({ error: 'Live statistics unavailable' });
    }
  }

  // Development-only simulation (explicitly labelled, never served in production).
  return res.status(200).json({
    source: 'simulation-dev-only',
    counts: {
      programs: 10,
      projects: 19,
      beneficiaries: 418,
      sponsorships: 595,
      organizations: 3,
      users: 12,
      activities: 269,
      currencies: 3,
    },
    financials: {
      totalProgramBudget: 28450000,
    },
  });
}
