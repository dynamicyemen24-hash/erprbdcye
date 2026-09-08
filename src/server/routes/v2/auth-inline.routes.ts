import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { getPool, queryWithRetry } from '../../core/database';
import { serverConfig } from '../../config/index';
import logger from '../../core/logger';
import { validateBody } from '../../middleware/validation.middleware';
import { loginSchema, registerSchema } from '../../validators/schemas';
import { checkPasswordStrength } from '../../core/security';

const router = Router();

const JWT_SECRET = serverConfig.jwtSecret;
const JWT_REFRESH_SECRET = serverConfig.jwtRefreshSecret;
const ACCESS_TOKEN_EXPIRY = (serverConfig.jwtExpiresIn || '1h') as any;
const REFRESH_TOKEN_EXPIRY = (serverConfig.jwtRefreshExpiresIn || '7d') as any;
const BCRYPT_ROUNDS = serverConfig.bcryptRounds || 12;

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many registration attempts. Please wait.' }
});

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please wait 15 minutes.' }
});

// ─── Account Lockout ──────────────────────────────────────────
const loginAttempts = new Map<string, { count: number; lockedUntil?: number }>();

function getLockoutKey(ip: string, email: string): string {
  return `${ip}:${email.toLowerCase()}`;
}

function checkLockout(ip: string, email: string): { locked: boolean; retryAfter?: number } {
  const key = getLockoutKey(ip, email);
  const entry = loginAttempts.get(key);
  if (!entry) return { locked: false };
  if (entry.lockedUntil && Date.now() < entry.lockedUntil) {
    return { locked: true, retryAfter: Math.ceil((entry.lockedUntil - Date.now()) / 1000) };
  }
  return { locked: false };
}

function recordFailedAttempt(ip: string, email: string): void {
  const key = getLockoutKey(ip, email);
  const entry = loginAttempts.get(key) || { count: 0 };
  entry.count++;
  if (entry.count >= 10) entry.lockedUntil = Date.now() + 3600000;
  else if (entry.count >= 5) entry.lockedUntil = Date.now() + 900000;
  loginAttempts.set(key, entry);
}

function clearAttempts(ip: string, email: string): void {
  loginAttempts.delete(getLockoutKey(ip, email));
}

// ─── Audit Log Helper ─────────────────────────────────────────
async function logAuthEvent(event: string, details: Record<string, any>): Promise<void> {
  try {
    const dbPool = getPool();
    await dbPool.query(
      `INSERT INTO audit_logs (id, action, table_name, user_id, details, ip_address, user_agent, created_at)
       VALUES ($1, $2, 'auth', $3, $4, $5, $6, NOW())`,
      [
        crypto.randomUUID(),
        event,
        details.userId || null,
        JSON.stringify(details),
        details.ip || null,
        details.userAgent || null,
      ]
    );
  } catch {
    // Non-critical — don't fail auth flow
  }
}

// POST /api/auth/login — Local offline-first login with DB query + fallback
router.post('/login', loginRateLimiter, validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const localEmail = email.toLowerCase().trim();
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  // Account lockout check
  const lockout = checkLockout(clientIp, localEmail);
  if (lockout.locked) {
    await logAuthEvent('LOGIN_LOCKED', { email: localEmail, ip: clientIp, retryAfter: lockout.retryAfter });
    return res.status(429).json({
      error: 'Account temporarily locked due to too many failed attempts',
      retryAfter: lockout.retryAfter,
    });
  }

  // Dev admin bypass — ONLY in development with env-gated credentials.
  // Disabled entirely in production/staging/test to prevent credential-stuffing fallback.
  if (process.env.NODE_ENV === 'development') {
    const devAdminEmail = process.env.DEV_ADMIN_EMAIL;
    const devAdminPassword = process.env.DEV_ADMIN_PASSWORD;
    if (
      devAdminEmail && devAdminPassword &&
      localEmail === devAdminEmail && password === devAdminPassword
    ) {
      logger.warn('Using DEV_ADMIN_EMAIL/DEV_ADMIN_PASSWORD fallback — NOT for production use', { context: 'auth' });
      const localUser = {
        id: crypto.randomUUID(),
        email: localEmail,
        name: 'مدير النظام المحلي',
        name_ar: 'مدير النظام المحلي',
        name_en: 'Local System Administrator',
        role: 'Administrator',
        department_code: 'ADMIN',
        position_code: 'CHIEF',
        security_level: 5,
        can_approve: true,
        max_approval_amount: '999999999',
        branch_code: 'HQ',
        organization_id: serverConfig.defaultOrgId,
        organization_name: 'جمعية رُحماء بينهم للعمل الإنساني والتنمية',
        organization_code: 'ROH-001'
      };
      const jti = crypto.randomUUID();
      const token = jwt.sign(
        { id: localUser.id, email: localEmail, role: 'Administrator', org_id: localUser.organization_id, security_level: 5, jti, iss: 'nexoraos', aud: 'nexoraos-api' },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
      );
      const refreshToken = jwt.sign(
        { id: localUser.id, email: localEmail, role: 'Administrator', org_id: localUser.organization_id, security_level: 5, type: 'refresh', jti: crypto.randomUUID(), iss: 'nexoraos', aud: 'nexoraos-api' },
        JWT_REFRESH_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
      );
      clearAttempts(clientIp, localEmail);
      await logAuthEvent('LOGIN_SUCCESS', { userId: localUser.id, email: localEmail, ip: clientIp, userAgent, devMode: true });
      return res.json({
        status: 'success',
        token,
        refreshToken,
        user: localUser,
        offlineMode: true,
        offlineMessage: 'تم الدخول بنجاح بالوضع المحلي التجريبي — النظام يعمل دون الحاجة لاتصال سحابي.'
      });
    }
  }

  const handleLocalFallback = (_errMessage?: string) => {
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      message: 'Database connection is currently unreachable. Please try again later.',
      offline: true
    });
  };

  try {
    let userRes: any;
    try {
      userRes = await Promise.race([
        queryWithRetry(`
          SELECT u.id, u.email, u.name, u.name_ar, u.password_hash, u.department_code, u.position_code, u.security_level, u.can_approve, u.max_approval_amount, u.branch_code, u.organization_id, u.status, u.last_login_at, u.created_at, o.name_ar AS org_name_ar, o.id AS org_code
          FROM users u
          LEFT JOIN organizations o ON o.id = u.organization_id
          WHERE LOWER(u.email) = LOWER($1) AND u.deleted_at IS NULL
        `, [email], 2),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Slow network - login timeout after 8s')), 8000))
      ]);
    } catch (raceErr: any) {
      logger.warn(`[LOGIN FALLBACK] DB connection too slow, attempting local fallback: ${raceErr.message}`, { context: 'auth' });
      return handleLocalFallback(raceErr.message);
    }

    if (!userRes || userRes.rows.length === 0) {
      recordFailedAttempt(clientIp, localEmail);
      await logAuthEvent('LOGIN_FAILED', { email: localEmail, ip: clientIp, userAgent, reason: 'user_not_found' });
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const user = userRes.rows[0];

    let isValid = false;
    if (user.password_hash) {
      try {
        isValid = await bcrypt.compare(password, user.password_hash);
      } catch {
        isValid = false;
      }
    }

    if (!isValid) {
      recordFailedAttempt(clientIp, localEmail);
      await logAuthEvent('LOGIN_FAILED', { email: localEmail, ip: clientIp, userAgent, reason: 'invalid_password' });
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
      organization_code: user.org_code || 'ROH-001'
    };

    const jti = crypto.randomUUID();
    const token = jwt.sign(
      {
        id: userSession.id,
        email: userSession.email,
        role: userSession.role,
        org_id: userSession.organization_id,
        security_level: userSession.security_level,
        jti,
        iss: 'nexoraos',
        aud: 'nexoraos-api',
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      {
        id: userSession.id,
        email: userSession.email,
        role: userSession.role,
        org_id: userSession.organization_id,
        security_level: userSession.security_level,
        type: 'refresh',
        jti: crypto.randomUUID(),
        iss: 'nexoraos',
        aud: 'nexoraos-api',
      },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    // Update last_login_at
    try {
      const dbPool = getPool();
      await dbPool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [userSession.id]);
    } catch {
      // Non-critical — don't fail login
    }

    clearAttempts(clientIp, localEmail);
    await logAuthEvent('LOGIN_SUCCESS', { userId: userSession.id, email: userSession.email, ip: clientIp, userAgent });

    res.json({
      status: 'success',
      token,
      refreshToken,
      user: userSession
    });
  } catch (err: any) {
    logger.error('[LOGIN DB ERROR]', { context: 'auth', error: err });
    return handleLocalFallback(err.message);
  }
});

// POST /api/auth/refresh — Exchange refresh token for new access token (with rotation)
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  jwt.verify(refreshToken, JWT_REFRESH_SECRET, { algorithms: ['HS256'] }, async (err: any, decoded: any) => {
    if (err || decoded.type !== 'refresh') {
      return res.status(403).json({ error: 'Invalid or expired refresh token' });
    }

    try {
      const dbPool = getPool();
      const userRes = await dbPool.query(
        'SELECT id, email, name_ar, name, department_code, position_code, security_level, can_approve, max_approval_amount, branch_code, organization_id, status FROM users WHERE id = $1 AND deleted_at IS NULL',
        [decoded.id]
      );

      if (userRes.rows.length === 0) {
        return res.status(403).json({ error: 'User account not found or deactivated' });
      }

      const u = userRes.rows[0];

      // Reject refresh if user account is no longer active
      if (u.status !== 'active') {
        return res.status(403).json({ error: 'Account is no longer active' });
      }

      // Rotate: issue new access + refresh token pair; old refresh token is effectively replaced
      const newToken = jwt.sign(
        {
          id: u.id,
          email: u.email,
          role: u.department_code || 'Administrator',
          org_id: u.organization_id || decoded.org_id,
          security_level: u.security_level || decoded.security_level
        },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
      );

      const newRefreshToken = jwt.sign(
        {
          id: u.id,
          email: u.email,
          role: u.department_code || 'Administrator',
          org_id: u.organization_id || decoded.org_id,
          security_level: u.security_level || decoded.security_level,
          type: 'refresh'
        },
        JWT_REFRESH_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
      );

      res.json({ status: 'success', token: newToken, refreshToken: newRefreshToken });
    } catch (dbErr: any) {
      logger.error('[REFRESH] DB lookup failed', { context: 'auth', error: dbErr });
      // Do NOT fall back to re-signing claims from the unverified token.
      // Return a clear error so the client must re-authenticate.
      return res.status(403).json({ error: 'Unable to verify refresh token. Please sign in again.' });
    }
  });
});

// POST /api/auth/register — Subscriber / Organization Self-Registration
router.post('/register', authRateLimiter, validateBody(registerSchema), async (req, res) => {
  const {
    org_name_ar,
    org_name_en,
    admin_email,
    admin_name,
    admin_password,
    type_code = 'charity',
    subscription_plan = 'enterprise',
    phone = '+967-770000000',
    city = 'صنعاء',
    country = 'اليمن'
  } = req.body;

  if (!org_name_ar || !admin_email || !admin_password) {
    return res.status(400).json({ error: 'اسم المنظمة/المستأجر والبريد الإلكتروني وكلمة المرور مطلوبة' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(admin_email)) {
    return res.status(400).json({ error: 'البريد الإلكتروني غير صالح' });
  }

  if (typeof admin_password !== 'string' || admin_password.length < 8) {
    return res.status(400).json({ error: 'يجب أن لا تقل كلمة المرور عن 8 أحرف' });
  }

  // Enforce password complexity
  const strength = checkPasswordStrength(admin_password);
  if (!strength.isStrong) {
    return res.status(400).json({
      error: 'كلمة المرور غير كافية القوة',
      message: 'يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل مع حروف كبيرة وصغيرة وأرقام ورموز خاصة',
      feedback: strength.feedback
    });
  }

  try {
    const dbPool = getPool();

    const checkUser = await dbPool.query('SELECT id FROM users WHERE email = $1', [admin_email]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'البريد الإلكتروني مسجل بالفعل بالنظام' });
    }

    const orgId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const hashedPassword = await bcrypt.hash(admin_password, BCRYPT_ROUNDS);

    await dbPool.query(`
      INSERT INTO organizations (
        id, name_ar, name_en, type_code, subscription_plan, status, security_level, phone, city, country, default_currency_code, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, 'active', 5, $6, $7, $8, 'YER', NOW(), NOW())
    `, [orgId, org_name_ar, org_name_en || org_name_ar, type_code, subscription_plan, phone, city, country]);

    await dbPool.query(`
      INSERT INTO users (
        id, email, password_hash, name, name_ar, phone, default_language, status, security_level, department_code, can_approve, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'ar', 'active', 5, 'EXEC_DIR', true, NOW(), NOW())
    `, [userId, admin_email, hashedPassword, admin_name || org_name_ar, admin_name || org_name_ar, phone]);

    const token = jwt.sign(
      { id: userId, email: admin_email, role: 'Administrator', org_id: orgId, jti: crypto.randomUUID(), iss: 'nexoraos', aud: 'nexoraos-api' },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    res.json({
      status: 'success',
      message: 'تم تسجيل المشترك وتأسيس المنظمة بنجاح',
      token,
      organization: {
        id: orgId,
        name_ar: org_name_ar,
        name_en: org_name_en || org_name_ar,
        subscription_plan
      },
      user: {
        id: userId,
        email: admin_email,
        name: admin_name || org_name_ar,
        role: 'Administrator',
        organization_id: orgId
      }
    });

  } catch (err: any) {
    logger.error('Registration error', { context: 'auth', error: err });
    res.status(500).json({ error: 'فشل تسجيل المشترك' });
  }
});

// POST /api/auth/change-password — Change password for authenticated user
router.post('/change-password', async (req: any, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }

  const strength = checkPasswordStrength(newPassword);
  if (!strength.isStrong) {
    return res.status(400).json({
      error: 'New password is not strong enough',
      feedback: strength.feedback,
    });
  }

  try {
    const dbPool = getPool();
    const userRes = await dbPool.query(
      'SELECT id, password_hash, status FROM users WHERE id = $1 AND deleted_at IS NULL',
      [decoded.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRes.rows[0];

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is not active' });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      await logAuthEvent('PASSWORD_CHANGE_FAILED', { userId: decoded.id, ip: req.ip, reason: 'wrong_current_password' });
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await dbPool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, decoded.id]);

    // Invalidate all existing tokens for this user
    try {
      const { revokeAllUserTokens } = await import('../../core/tokenRevocation');
      revokeAllUserTokens(decoded.id, 'password_change');
    } catch {
      // Non-critical
    }

    await logAuthEvent('PASSWORD_CHANGED', { userId: decoded.id, ip: req.ip });

    res.json({
      status: 'success',
      message: 'تم تغيير كلمة المرور بنجاح — يرجى إعادة تسجيل الدخول',
    });
  } catch (err: any) {
    logger.error('[CHANGE-PASSWORD] Error', { context: 'auth', error: err });
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
