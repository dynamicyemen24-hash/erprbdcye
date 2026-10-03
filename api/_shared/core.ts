import pg from 'pg';
import jwt from 'jsonwebtoken';
import { applySecurityHeaders, resolveCorsOrigin } from './security-headers.js';

const { Pool } = pg;
const g = globalThis as any;

/** Shared hardened Neon pool (warm reuse across invocations). */
export function getPool(): pg.Pool | null {
  if (!g.__nexora_shared_pool) {
    if (process.env.DATABASE_URL) {
      g.__nexora_shared_pool = new Pool({
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
      g.__nexora_shared_pool.on('error', (err: any) => {
        console.error('[API/Core] Pool error:', err.message);
      });
    }
  }
  return g.__nexora_shared_pool || null;
}

export function requireSecret(name: 'JWT_SECRET' | 'JWT_REFRESH_SECRET'): string {
  const s = process.env[name];
  if (!s) throw new Error(`[API/Core] ${name} is required - refusing insecure fallback`);
  return s;
}

/** CORS + OWASP security headers shared by every new handler. */
export function applyBaseSecurity(req: any, res: any): void {
  const origin = resolveCorsOrigin(req.headers?.origin);
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  applySecurityHeaders(res);
}

export function readBearer(req: any): string | null {
  const h = req.headers?.authorization || req.headers?.Authorization;
  if (typeof h !== 'string' || !h) return null;
  const token = h.startsWith('Bearer ') ? h.slice(7) : h;
  return token || null;
}

export function verifyAccess(req: any): { ok: boolean; payload?: any; error?: string } {
  const token = readBearer(req);
  if (!token) return { ok: false, error: 'Authentication required' };
  try {
    const payload: any = jwt.verify(token, requireSecret('JWT_SECRET'), { algorithms: ['HS256'] });
    if (!payload || typeof payload !== 'object') return { ok: false, error: 'Invalid token' };
    return { ok: true, payload };
  } catch {
    return { ok: false, error: 'Invalid or expired token' };
  }
}

/**
 * SECURITY: tenant identity comes ONLY from signed token claims.
 * Header-based tenant selection is a known cross-tenant spoofing vector and
 * is deliberately not honored (mismatch => fail closed, same as /api/v2 shims).
 */
export function resolveOrgFromClaims(req: any, payload: any): string {
  const presentHeader = req.headers?.['x-organization-id'] || req.headers?.['x-org-id'];
  const claimOrg = payload?.organization_id || payload?.org_id || payload?.org || null;
  if (presentHeader && claimOrg && String(presentHeader) !== String(claimOrg)) {
    const e: any = new Error('Cross-tenant header mismatch: header org does not match token org');
    e.status = 403;
    throw e;
  }
  if (claimOrg) return String(claimOrg);
  const e: any = new Error('Token carries no organization claim - tenant access denied');
  e.status = 403;
  throw e;
}

export function authContext(req: any): { payload: any; orgId: string } {
  const auth = verifyAccess(req);
  if (!auth.ok) {
    const e: any = new Error(auth.error || 'Authentication required');
    e.status = 401;
    throw e;
  }
  return { payload: auth.payload, orgId: resolveOrgFromClaims(req, auth.payload) };
}

export function fail(res: any, status: number, error: string) {
  return res.status(status).json({ success: false, error, timestamp: new Date().toISOString() });
}

export function clientIp(req: any): string {
  const fwd = req.headers?.['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip || 'unknown';
}
