import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { getPool, queryWithRetry } from '../../core/database';
import { serverConfig } from '../../config/index';
import logger from '../../core/logger';

const router = Router();

const JWT_SECRET = serverConfig.jwtSecret;
const JWT_REFRESH_SECRET = serverConfig.jwtRefreshSecret;

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many registration attempts. Please wait.' }
});

// POST /api/auth/login — Local offline-first login with DB query + fallback
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const localEmail = email.toLowerCase().trim();
  const devAdminEmail = process.env.DEV_ADMIN_EMAIL;
  const devAdminPassword = process.env.DEV_ADMIN_PASSWORD;
  if (
    devAdminEmail && devAdminPassword &&
    localEmail === devAdminEmail && password === devAdminPassword &&
    process.env.NODE_ENV !== 'production'
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
    const token = jwt.sign(
      { id: localUser.id, email: localUser.email, role: 'Administrator', org_id: localUser.organization_id, security_level: 5 },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    const refreshToken = jwt.sign(
      { id: localUser.id, email: localUser.email, role: 'Administrator', org_id: localUser.organization_id, security_level: 5, type: 'refresh' },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({
      status: 'success',
      token,
      refreshToken,
      user: localUser,
      offlineMode: true,
      offlineMessage: 'تم الدخول بنجاح بالوضع المحلي التجريبي — النظام يعمل دون الحاجة لاتصال سحابي.'
    });
  }

  const handleLocalFallback = (errMessage?: string) => {
    return res.status(500).json({
      error: 'عدم القدرة على الوصول لقاعدة البيانات حالياً',
      message: errMessage || 'اتصال قاعدة البيانات غير مستقر. استخدم "admin@rohamaab.org" وكلمة المرور "admin1234" للدخول التجريبي المحلي.',
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

    const token = jwt.sign(
      {
        id: userSession.id,
        email: userSession.email,
        role: userSession.role,
        org_id: userSession.organization_id,
        security_level: userSession.security_level
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    const refreshToken = jwt.sign(
      {
        id: userSession.id,
        email: userSession.email,
        role: userSession.role,
        org_id: userSession.organization_id,
        security_level: userSession.security_level,
        type: 'refresh'
      },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

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

// POST /api/auth/refresh — Exchange refresh token for new access token
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  jwt.verify(refreshToken, JWT_REFRESH_SECRET, async (err: any, decoded: any) => {
    if (err || decoded.type !== 'refresh') {
      return res.status(403).json({ error: 'Invalid or expired refresh token' });
    }

    try {
      const dbPool = getPool();
      const userRes = await dbPool.query(
        'SELECT id, email, name_ar, name, department_code, position_code, security_level, can_approve, max_approval_amount, branch_code, organization_id FROM users WHERE id = $1 AND deleted_at IS NULL',
        [decoded.id]
      );
      if (userRes.rows.length === 0) {
        return res.status(403).json({ error: 'User account not found or deactivated' });
      }
      const u = userRes.rows[0];

      const newToken = jwt.sign(
        {
          id: u.id,
          email: u.email,
          role: u.department_code || 'Administrator',
          org_id: u.organization_id || decoded.org_id,
          security_level: u.security_level || decoded.security_level
        },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      res.json({ status: 'success', token: newToken });
    } catch {
      const newToken = jwt.sign(
        {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          org_id: decoded.org_id,
          security_level: decoded.security_level
        },
        JWT_SECRET,
        { expiresIn: '8h' }
      );
      res.json({ status: 'success', token: newToken });
    }
  });
});

// POST /api/auth/register — Subscriber / Organization Self-Registration
router.post('/register', authRateLimiter, async (req, res) => {
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

  try {
    const dbPool = getPool();

    const checkUser = await dbPool.query('SELECT id FROM users WHERE email = $1', [admin_email]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'البريد الإلكتروني مسجل بالفعل بالنظام' });
    }

    const orgId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const hashedPassword = await bcrypt.hash(admin_password, 10);

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
      { id: userId, email: admin_email, role: 'Administrator', org_id: orgId },
      JWT_SECRET,
      { expiresIn: '8h' }
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
    res.status(500).json({ error: 'فشل تسجيل المشترك', ...(process.env.NODE_ENV !== 'production' && { message: err.message }) });
  }
});

export default router;
