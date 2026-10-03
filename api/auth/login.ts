import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { applyBaseSecurity, clientIp, getPool, requireSecret } from '../_shared/core.js';

/**
 * POST /api/auth/login - Vercel serverless shim.
 * Mirrors src/server/routes/v2/auth-inline.routes.ts (offline-first login):
 * DB credential check -> optional TOTP step-up -> signed access/refresh pair.
 * Response is FLAT (status/token/refreshToken/user) because LoginView reads
 * data.token directly off response.json().
 */

const ACCESS_EXPIRY = (process.env.JWT_ACCESS_EXPIRES || '1h') as any;
const REFRESH_EXPIRY = (process.env.JWT_REFRESH_EXPIRES || '7d') as any;

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60 * 1000;
const MAX_ATTEMPTS = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || entry.resetAt <= now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  if (loginAttempts.size > 10_000) {
    for (const [k, v] of loginAttempts) if (v.resetAt <= now) loginAttempts.delete(k);
  }
  return entry.count > MAX_ATTEMPTS;
}

function recordFailure(ip: string) {
  const entry = loginAttempts.get(ip);
  if (entry) entry.count += 1;
}

const USER_SQL = `
  SELECT u.id, u.email, u.name, u.name_ar, u.password_hash, u.department_code, u.position_code,
         u.security_level, u.can_approve, u.max_approval_amount, u.branch_code, u.organization_id,
         u.status, u.last_login_at, u.created_at, o.name_ar AS org_name_ar, o.id AS org_code
  FROM users u
  LEFT JOIN organizations o ON o.id = u.organization_id
  WHERE LOWER(u.email) = LOWER($1) AND u.deleted_at IS NULL`;

export default async function handler(req: any, res: any) {
  applyBaseSecurity(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const ip = clientIp(req);
    if (isRateLimited(ip)) {
      res.setHeader('Retry-After', '60');
      return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
    }

    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const pool = getPool();
    if (!pool) return res.status(503).json({ error: 'Database unavailable. Please try again later.' });

    // Dev-only admin bypass (never active in production/staging/test).
    if (process.env.NODE_ENV === 'development') {
      const devEmail = process.env.DEV_ADMIN_EMAIL;
      const devPassword = process.env.DEV_ADMIN_PASSWORD;
      if (devEmail && devPassword && String(email).toLowerCase() === devEmail && password === devPassword) {
        const orgId = process.env.DEFAULT_ORG_ID || '00000000-0000-0000-0000-000000000001';
        const jti = crypto.randomUUID();
        const token = jwt.sign(
          { id: crypto.randomUUID(), email: devEmail, role: 'Administrator', org_id: orgId, security_level: 5, mfa: true, jti, iss: 'nexoraos', aud: 'nexoraos-api' },
          requireSecret('JWT_SECRET'),
          { expiresIn: ACCESS_EXPIRY }
        );
        const refreshToken = jwt.sign(
          { id: 'dev-admin', email: devEmail, role: 'Administrator', org_id: orgId, security_level: 5, mfa: true, type: 'refresh', jti: crypto.randomUUID(), iss: 'nexoraos', aud: 'nexoraos-api' },
          process.env.JWT_REFRESH_SECRET || requireSecret('JWT_SECRET'),
          { expiresIn: REFRESH_EXPIRY }
        );
        return res.json({
          status: 'success',
          token,
          refreshToken,
          offlineMode: true,
          user: { id: 'dev-admin', email: devEmail, name: 'Local Administrator', role: 'Administrator', organization_id: orgId },
        });
      }
    }

    const result = await pool.query(USER_SQL, [email]);
    const user = result.rows[0];
    if (!user) {
      recordFailure(ip);
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }
    if (user.status && user.status !== 'active') {
      recordFailure(ip);
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    let isValid = false;
    if (user.password_hash) {
      try {
        isValid = await bcrypt.compare(password, user.password_hash);
      } catch {
        isValid = false;
      }
    }
    if (!isValid) {
      recordFailure(ip);
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const userSession = {
      id: user.id,
      email: user.email,
      name: user.name_ar || user.name || user.email,
      name_ar: user.name_ar || user.name,
      name_en: user.name,
      role: user.department_code || 'Administrator',
      department_code: user.department_code || 'ADMIN',
      position_code: user.position_code || 'CHIEF',
      security_level: user.security_level || 3,
      can_approve: !!user.can_approve,
      max_approval_amount: user.max_approval_amount || '0',
      branch_code: user.branch_code || 'HQ',
      organization_id: user.organization_id || '',
      organization_name: user.org_name_ar || 'جمعية رُحماء بينهم للعمل الإنساني والتنمية',
      organization_code: user.org_code || 'ROH-001',
    };

    const jwtSecret = requireSecret('JWT_SECRET');
    const refreshSecret = process.env.JWT_REFRESH_SECRET || jwtSecret;
    const token = jwt.sign(
      { id: userSession.id, email: userSession.email, role: userSession.role, org_id: userSession.organization_id, security_level: userSession.security_level, mfa: true, jti: crypto.randomUUID(), iss: 'nexoraos', aud: 'nexoraos-api' },
      jwtSecret,
      { expiresIn: ACCESS_EXPIRY }
    );
    const refreshToken = jwt.sign(
      { id: userSession.id, email: userSession.email, role: userSession.role, org_id: userSession.organization_id, security_level: userSession.security_level, mfa: true, type: 'refresh', jti: crypto.randomUUID(), iss: 'nexoraos', aud: 'nexoraos-api' },
      refreshSecret,
      { expiresIn: REFRESH_EXPIRY }
    );

    // Server-enforced MFA: accounts with TOTP enabled must complete step-up.
    try {
      const mfaRes = await pool.query('SELECT totp_enabled FROM users WHERE id = $1', [user.id]);
      if (mfaRes.rows[0]?.totp_enabled) {
        const mfaToken = jwt.sign(
          { id: user.id, type: 'mfa', jti: crypto.randomUUID(), iss: 'nexoraos', aud: 'nexoraos-api' },
          jwtSecret,
          { expiresIn: '5m' }
        );
        return res.json({
          status: 'mfa_required',
          mfaToken,
          message: 'رمز التحقق بخطوتين مطلوب — أدخل رمز تطبيق المصادقة',
        });
      }
    } catch {
      // Missing totp columns must not block login (matches server behavior).
    }

    try {
      await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
    } catch {
      /* non-critical */
    }

    loginAttempts.delete(ip);
    return res.json({ status: 'success', token, refreshToken, user: userSession });
  } catch (err: any) {
    console.error('[API/Login] handler error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
