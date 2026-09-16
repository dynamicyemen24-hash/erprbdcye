import pg from 'pg';
import jwt from 'jsonwebtoken';
import { applySecurityHeaders, resolveCorsOrigin } from '../_shared/security-headers';

const { Pool } = pg;

// ─────────────────────────────────────────────
// Hardened Neon pool (Vercel serverless contract)
// ● statement/query timeouts bound cold&warm invocations
// ● generous connect timeout for Neon scale-to-zero
// ● keepAlive to survive idle → warm reuse
// ─────────────────────────────────────────────
let pool: any = null;
const globalAny = global as any;
if (!globalAny.__nexora_tables_pool) {
  if (process.env.DATABASE_URL) {
    globalAny.__nexora_tables_pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: parseInt(process.env.DB_POOL_MAX_SERVERLESS || '3', 10),
      min: 0,
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_MS || '15000', 10),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '15000', 10),
      statement_timeout: 15000,
      query_timeout: 15000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      ssl: process.env.DB_SSL_CA
        ? { rejectUnauthorized: true, ca: process.env.DB_SSL_CA }
        : { rejectUnauthorized: process.env.DB_SSL_STRICT === 'true' },
    });
    globalAny.__nexora_tables_pool.on('error', (err: any) => {
      console.error('[API/Tables] Pool error:', err.message);
    });
  }
}
pool = globalAny.__nexora_tables_pool || null;

const jwtSecret: string = (() => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('[API/Tables] JWT_SECRET is required — refusing to start with an insecure fallback');
  return s;
})();

/**
 * Allowed schemas: every core UAMEX ERP™ table.
 * Any value not in this allowlist is rejected outright.
 *
 * SECURITY NOTE:
 * - `users` is intentionally excluded: it holds password hashes and PII.
 * - `audit_logs` is intentionally excluded: it holds sensitive governance trails.
 * Both are reachable through their dedicated scoped API routes instead.
 */
const ALLOWED_TABLES = new Set([
  'organizations', 'programs', 'projects', 'activities', 'milestones',
  'project_schedules', 'project_tasks', 'dependency_network', 'earned_value_metrics',
  'risks', 'budget_lines', 'parties', 'beneficiaries', 'sponsorships', 'donations',
  'grants', 'donors', 'hr_staff', 'volunteers', 'departments', 'positions',
  'chart_of_accounts', 'journal_entries', 'journal_items', 'vouchers', 'invoices',
  'procurements', 'purchase_orders', 'rfqs', 'vendors', 'inventory_items',
  'warehouses', 'stock_movements', 'assets', 'documents', 'knowledge_articles',
  'settings', 'exchange_rates', 'backups', 'approvals',
  'official_communications', 'official_communication_recipients',
  'commitments', 'obligations', 'commitment_payments', 'obligation_payments', 'commitment_documents',
]);

/**
 * Tables without an `organization_id` column are either global reference data
 * (safe to read across orgs) or single-org bootstrap tables. They are still
 * authorized by a valid token and never contain per-tenant secrets.
 */
const NON_TENANT_TABLES = new Set([
  'organizations', 'exchange_rates', 'departments', 'positions', 'settings',
]);

/** Columns that must never be exposed through the generic dump endpoint. */
const BLOCKED_COLUMNS = new Set([
  'password_hash', 'password', 'password_salt', 'refresh_token',
  'otp_secret', 'totp_secret', 'api_key', 'stripe_secret', 'private_key',
]);

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

/** Resolve the tenant id exclusively from token claims (never from headers). */
function resolveTenantId(payload: any): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const org = payload.organization_id || payload.org_id || payload.org;
  return org ? String(org) : null;
}

export default async function handler(req: any, res: any) {
  const corsOrigin = resolveCorsOrigin(req.headers?.origin);
  if (corsOrigin) {
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-environment-mode');
  applySecurityHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // ── Security: Bearer JWT required (same secret as the Express API) ──
  const auth = verifyToken(req.headers?.authorization);
  if (!auth.ok) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(401).json({ error: 'Access Denied: Missing or invalid authentication token' });
  }

  // Read-only contract: only GET leaves this function.
  if (req.method !== 'GET') {
    res.setHeader('Cache-Control', 'no-store');
    return res.setHeader('Allow', 'GET, OPTIONS').status(405).json({ error: 'Method Not Allowed' });
  }

  const { table, limit } = req.query;
  const tableName = Array.isArray(table) ? table[0] : table;
  const name = String(tableName || '').replace(/["';`]/g, '').trim();

  if (!name || !/^[a-zA-Z0-9_]+$/.test(name) || !ALLOWED_TABLES.has(name)) {
    return res.status(400).json({ error: 'Invalid or unauthorized table name' });
  }

  if (!pool) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  res.setHeader('Cache-Control', 'no-store');

  const maxRows = Math.min(Math.max(parseInt(String(limit || ''), 10) || 500, 1), 1000);
  const tenantId = resolveTenantId(auth.payload);
  const isTenantTable = !NON_TENANT_TABLES.has(name);

  // Cross-tenant data isolation: a valid token without an org claim must never
  // read tenant tables. The org id comes ONLY from the signed token payload.
  if (isTenantTable && !tenantId) {
    return res.status(403).json({ error: 'Access Denied: token has no organization claim; cross-tenant reads are blocked' });
  }

  try {
    // Resolve allowed columns once per table (information_schema query) so that
    // credential-like columns are never projected into the response.
    const colsRes = await pool.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_schema='public' AND table_name=$1`,
      [name]
    );
    const safeColumns = (colsRes.rows as any[])
      .map((r: any) => String(r.column_name))
      .filter((c: string) => !BLOCKED_COLUMNS.has(c.toLowerCase()));

    if (safeColumns.length === 0) {
      return res.status(403).json({ error: 'No safe columns are exposed for this table' });
    }

    const colList = safeColumns.map((c) => `"${c.replace(/[^a-zA-Z0-9_]/g, '')}"`).join(',');
    const lower = new Set(safeColumns.map((c) => c.toLowerCase()));
    const hasOrg = lower.has('organization_id');
    const hasDeleted = lower.has('deleted_at');
    const hasCreated = lower.has('created_at');

    let dbRes;
    if (isTenantTable) {
      // A tenant table without organization_id cannot be scoped — fail closed.
      if (!hasOrg) {
        return res.status(403).json({ error: 'Table is not tenant-isolated' });
      }
      const where = hasDeleted
        ? 'WHERE organization_id = $1 AND deleted_at IS NULL'
        : 'WHERE organization_id = $1';
      const order = hasCreated ? 'ORDER BY created_at DESC NULLS LAST' : '';
      dbRes = await pool.query(
        `SELECT ${colList} FROM "${name}" ${where} ${order} LIMIT $2`,
        [tenantId, maxRows]
      );
    } else if (name === 'organizations' && tenantId) {
      // Global reference table, but an org's own row only — never the directory.
      dbRes = await pool.query(`SELECT ${colList} FROM "organizations" WHERE id = $1 LIMIT 1`, [tenantId]);
    } else {
      const order = hasCreated ? 'ORDER BY created_at DESC NULLS LAST' : '';
      dbRes = await pool.query(`SELECT ${colList} FROM "${name}" ${order} LIMIT $1`, [maxRows]);
    }
    return res.status(200).json(dbRes.rows);
  } catch (err: any) {
    // Log server-side only — never leak DB error details to the client
    console.warn(`[API] Neon query failed for ${name}:`, err.message);
    return res.status(502).json({ error: 'Database query failed' });
  }
}