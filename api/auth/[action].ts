import pg from 'pg';
import jwt from 'jsonwebtoken';

const { Pool } = pg;

// ═══════════════════════════════════════════════════════════════════
// NexoraOS™ — NEB-12: Auth Refresh Endpoint (Vercel serverless shim)
// POST /api/auth/refresh → exchanges a signed refresh token for a
// fresh access token. Mirrors src/server/routes/v2/auth-inline.routes.ts.
// ═══════════════════════════════════════════════════════════════════

// ─── Fail-closed secrets (no insecure fallbacks) ────────────────────
const jwtSecret = process.env.JWT_SECRET;
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('[AUTH] JWT_SECRET is required — refusing to start with an insecure fallback');
}

// ─── CORS origin allowlist (serverless-safe, self-contained) ───────
function resolveCorsOrigin(reqOrigin: string | undefined): string | null {
  const raw = process.env.CORS_ORIGINS || process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN || '';
  const allowlist = raw.split(',').map(o => o.trim()).filter(Boolean);
  if (allowlist.length === 0) {
    // No allowlist configured: only safe for uncredentialed same-origin calls.
    // Allow '*' only in non-production, otherwise deny cross-origin entirely.
    return process.env.NODE_ENV === 'production' ? null : '*';
  }
  if (!reqOrigin) return allowlist[0]; // non-browser client (curl, mobile) — default origin
  return allowlist.includes(reqOrigin) ? reqOrigin : null;
}

// ─── Hardened Neon pool (same contract as the rest of /api) ────────
let pool: any = null;
const globalAny = global as any;
if (!globalAny.__nexora_auth_pool) {
  if (process.env.DATABASE_URL) {
    globalAny.__nexora_auth_pool = new Pool({
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
    globalAny.__nexora_auth_pool.on('error', (err: any) => {
      console.error('[API/Auth] Pool error:', err.message);
    });
  }
}
pool = globalAny.__nexora_auth_pool || null;

// ─── Refresh rate limiting (memory-lean, IP-keyed window) ─────────────
const refreshAttempts = new Map<string, { count: number; resetAt: number }>();
const REFRESH_WINDOW_MS = 60 * 1000; // 1 minute
const REFRESH_MAX_ATTEMPTS = 10;

function refreshRateLimit(req: any): boolean {
  const ip = (req.headers?.['x-forwarded-for']?.split(',')[0]?.trim()) || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = refreshAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    refreshAttempts.set(ip, { count: 1, resetAt: now + REFRESH_WINDOW_MS });
    return true;
  }
  entry.count += 1;
  // Prune the map occasionally to avoid unbounded growth.
  if (refreshAttempts.size > 10_000) {
    for (const [k, v] of refreshAttempts) {
      if (now > v.resetAt) refreshAttempts.delete(k);
    }
  }
  return entry.count <= REFRESH_MAX_ATTEMPTS;
}

export default async function handler(req: any, res: any) {
  const corsOrigin = resolveCorsOrigin(req.headers?.origin);
  if (corsOrigin) {
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const { action } = req.query;
  const actionName = Array.isArray(action) ? action[0] : action;

  if (req.method !== 'POST' || actionName !== 'refresh') {
    return res.status(404).json({ error: 'Not Found' });
  }

  // ─── Refresh-token rate limiting (memory-lean, IP-keyed, 10/min) ─────
  if (!refreshRateLimit(req)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: 'Too many refresh attempts. Please try again later.' });
  }

  const { refreshToken } = req.body || {};
  if (!refreshToken || typeof refreshToken !== 'string') {
    return res.status(400).json({ error: 'Refresh token is required' });
  }
  if (!jwtRefreshSecret) {
    return res.status(503).json({ error: 'Authentication service not configured' });
  }

  // In production the auth service must be fully configured.
  if (process.env.NODE_ENV === 'production' && !pool) {
    return res.status(503).json({ error: 'Authentication service not configured' });
  }

  return jwt.verify(refreshToken, jwtRefreshSecret, async (err: any, decoded: any) => {
    if (err || !decoded || typeof decoded !== 'object' || decoded.type !== 'refresh') {
      return res.status(403).json({ error: 'Invalid or expired refresh token' });
    }

    try {
      let u: any = null;
      if (pool && decoded.id) {
        const userRes = await pool.query(
          'SELECT id, email, name_ar, name, department_code, position_code, security_level, can_approve, max_approval_amount, branch_code, organization_id FROM users WHERE id = $1 AND deleted_at IS NULL',
          [decoded.id],
        );
        u = userRes.rows[0] || null;
      }

      // Revoked / deleted / deactivated users must NOT receive a fresh token.
      // The refresh token alone is no longer enough when we can check the DB.
      if (pool && !u) {
        return res.status(401).json({ error: 'Account no longer active. Please sign in again.' });
      }

      const claims = u
        ? {
            id: u.id,
            email: u.email,
            role: u.department_code || decoded.role,
            org_id: u.organization_id || decoded.org_id,
            security_level: u.security_level || decoded.security_level,
          }
        : {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            org_id: decoded.org_id,
            security_level: decoded.security_level,
          };

      const newToken = jwt.sign(claims, jwtSecret as string, { expiresIn: '8h' });
      return res.status(200).json({ status: 'success', token: newToken, expiresIn: 8 * 60 * 60 });
    } catch (e: any) {
      console.error('[API/Auth] refresh error:', e.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}
