import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { applyBaseSecurity, getPool, requireSecret } from '../../_shared/core.js';
import { verifyTotp } from '../../../src/server/core/totp.js';

/**
 * POST /api/auth/mfa/verify - Vercel serverless shim.
 * Mirrors src/server/routes/v2/auth-inline.routes.ts /mfa/verify:
 * verify the short-lived mfa token, check TOTP, then mint the real pair.
 * FLAT response shape (LoginView reads data.token directly).
 */

const ACCESS_EXPIRY = (process.env.JWT_ACCESS_EXPIRES || '1h') as any;
const REFRESH_EXPIRY = (process.env.JWT_REFRESH_EXPIRES || '7d') as any;

export default async function handler(req: any, res: any) {
  applyBaseSecurity(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { mfaToken, code } = req.body || {};
    if (!mfaToken || !code) {
      return res.status(400).json({ error: 'mfaToken and code are required' });
    }

    let pending: any;
    try {
      pending = jwt.verify(String(mfaToken), requireSecret('JWT_SECRET'), { algorithms: ['HS256'] });
      if (!pending || pending.type !== 'mfa') throw new Error('not an mfa token');
    } catch {
      return res.status(403).json({ error: 'Invalid or expired MFA session. Please sign in again.' });
    }

    const pool = getPool();
    if (!pool) return res.status(503).json({ error: 'Database unavailable. Please try again later.' });

    const userRes = await pool.query(
      `SELECT u.id, u.email, u.name_ar, u.name, u.department_code, u.position_code, u.security_level,
              u.can_approve, u.max_approval_amount, u.branch_code, u.organization_id, u.status,
              u.totp_secret, u.totp_enabled
       FROM users u WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [pending.id]
    );
    const user = userRes.rows[0];
    if (!user || (user.status && user.status !== 'active') || !user.totp_enabled || !user.totp_secret) {
      return res.status(403).json({ error: 'MFA is not active for this account' });
    }
    if (!verifyTotp(user.totp_secret, String(code))) {
      return res.status(401).json({ error: 'Invalid authenticator code' });
    }

    const jwtSecret = requireSecret('JWT_SECRET');
    const refreshSecret = process.env.JWT_REFRESH_SECRET || jwtSecret;
    const claims = {
      id: user.id,
      email: user.email,
      role: user.department_code || 'Administrator',
      org_id: user.organization_id,
      security_level: user.security_level || 3,
      mfa: true,
      jti: crypto.randomUUID(),
      iss: 'nexoraos',
      aud: 'nexoraos-api',
    };
    const token = jwt.sign(claims, jwtSecret, { expiresIn: ACCESS_EXPIRY });
    const refreshToken = jwt.sign(
      { ...claims, type: 'refresh', jti: crypto.randomUUID() },
      refreshSecret,
      { expiresIn: REFRESH_EXPIRY }
    );

    try {
      await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
    } catch {
      /* non-critical */
    }

    return res.json({
      status: 'success',
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name_ar || user.name || user.email,
        name_ar: user.name_ar || user.name,
        role: user.department_code || 'Administrator',
        organization_id: user.organization_id,
        security_level: user.security_level || 3,
        branch_code: user.branch_code || 'HQ',
      },
    });
  } catch (err: any) {
    console.error('[API/MFA] handler error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
