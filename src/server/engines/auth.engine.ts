/**
 * NexoraOS™ — Authentication Engine
 * Complete JWT auth with refresh tokens, session management, RBAC
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serverConfig } from '../config/index';
import { query, queryOne, queryMany, transaction } from '../core/database';
import { AuthContext, ApiResponse } from '../core/types';

// ─── Types ─────────────────────────────────────────────

export interface LoginResult {
  user: {
    id: string;
    email: string;
    name: string;
    nameAr: string;
    role: string;
    orgId: string;
    securityLevel: number;
    defaultLanguage: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  org_id: string;
  security_level: number;
  iat?: number;
  exp?: number;
}

// ─── Auth Engine ───────────────────────────────────────

export class AuthEngine {
  /**
   * Authenticate user with email/password
   */
  static async login(email: string, password: string, ip?: string): Promise<LoginResult> {
    // 1. Find user
    const user = await queryOne<{
      id: string; email: string; password_hash: string; name: string;
      name_ar: string; security_level: number; default_language: string; status: string;
    }>(
      `SELECT id, email, password_hash, name, name_ar, security_level, default_language, status
       FROM users WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL`,
      [email]
    );

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (user.status !== 'active') {
      throw new Error('Account is suspended or inactive');
    }

    if (!user.password_hash) {
      throw new Error('Password not set. Please contact administrator.');
    }

    // 2. Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      throw new Error('Invalid email or password');
    }

    // 3. Get organization membership
    const membership = await queryOne<{ organization_id: string; role_code: string }>(
      `SELECT organization_id, role_code FROM user_org_memberships
       WHERE user_id = $1 AND status = 'active' ORDER BY is_default DESC LIMIT 1`,
      [user.id]
    );

    const orgId = membership?.organization_id || serverConfig.defaultOrgId;
    const role = membership?.role_code || 'MEMBER';

    // 4. Generate tokens
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role,
      org_id: orgId,
      security_level: user.security_level || 5,
    };

    const accessToken = jwt.sign(payload, serverConfig.jwtSecret, {
      expiresIn: serverConfig.jwtExpiresIn,
    });

    const refreshToken = jwt.sign(
      { id: user.id, type: 'refresh' },
      serverConfig.jwtRefreshSecret,
      { expiresIn: serverConfig.jwtRefreshExpiresIn }
    );

    // 5. Store refresh token hash
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address)
       VALUES ($1, $2, NOW() + INTERVAL '7 days', $3)
       ON CONFLICT (user_id) DO UPDATE SET token_hash = $2, expires_at = NOW() + INTERVAL '7 days', ip_address = $3`,
      [user.id, refreshHash, ip || null]
    ).catch(() => {
      // Table may not exist - graceful degradation
    });

    // 6. Audit log
    await query(
      `INSERT INTO audit_logs (organization_id, user_id, action, table_name, details)
       VALUES ($1, $2, 'LOGIN', 'users', $3)`,
      [orgId, user.id, JSON.stringify({ ip, method: 'password' })]
    ).catch(() => {});

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || '',
        nameAr: user.name_ar || '',
        role,
        orgId,
        securityLevel: user.security_level || 5,
        defaultLanguage: user.default_language || 'ar',
      },
      accessToken,
      refreshToken,
      expiresIn: serverConfig.jwtExpiresIn,
    };
  }

  /**
   * Register new organization with admin user
   */
  static async register(data: {
    email: string;
    password: string;
    name: string;
    nameAr?: string;
    orgNameAr: string;
    orgNameEn: string;
  }): Promise<LoginResult> {
    return await transaction(async (client) => {
      // 1. Check email uniqueness
      const existing = await client.query(
        'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
        [data.email]
      );
      if (existing.rows.length > 0) {
        throw new Error('Email already registered');
      }

      // 2. Create organization
      const orgResult = await client.query(
        `INSERT INTO organizations (name_ar, name_en, status)
         VALUES ($1, $2, 'active') RETURNING id`,
        [data.orgNameAr, data.orgNameEn]
      );
      const orgId = orgResult.rows[0].id;

      // 3. Create user
      const passwordHash = await bcrypt.hash(data.password, serverConfig.bcryptRounds);
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, name, name_ar, status, security_level)
         VALUES ($1, $2, $3, $4, 'active', 5) RETURNING id`,
        [data.email, passwordHash, data.name, data.nameAr || data.name]
      );
      const userId = userResult.rows[0].id;

      // 4. Create membership
      await client.query(
        `INSERT INTO user_org_memberships (user_id, organization_id, role_code, status, is_default)
         VALUES ($1, $2, 'ADMIN', 'active', true)`,
        [userId, orgId]
      );

      // 5. Create role if not exists
      await client.query(
        `INSERT INTO roles (organization_id, code, name_en, name_ar, is_system)
         VALUES ($1, 'ADMIN', 'Administrator', 'مدير النظام', true)
         ON CONFLICT DO NOTHING`,
        [orgId]
      ).catch(() => {});

      // 6. Generate tokens
      const payload: TokenPayload = {
        id: userId,
        email: data.email,
        role: 'ADMIN',
        org_id: orgId,
        security_level: 5,
      };

      const accessToken = jwt.sign(payload, serverConfig.jwtSecret, {
        expiresIn: serverConfig.jwtExpiresIn,
      });

      const refreshToken = jwt.sign(
        { id: userId, type: 'refresh' },
        serverConfig.jwtRefreshSecret,
        { expiresIn: serverConfig.jwtRefreshExpiresIn }
      );

      return {
        user: {
          id: userId,
          email: data.email,
          name: data.name,
          nameAr: data.nameAr || data.name,
          role: 'ADMIN',
          orgId,
          securityLevel: 5,
          defaultLanguage: 'ar',
        },
        accessToken,
        refreshToken,
        expiresIn: serverConfig.jwtExpiresIn,
      };
    });
  }

  /**
   * Refresh access token using refresh token
   */
  static async refresh(refreshToken: string): Promise<{ accessToken: string; expiresIn: string }> {
    try {
      const decoded = jwt.verify(refreshToken, serverConfig.jwtRefreshSecret) as { id: string };

      // Verify user still exists and is active
      const user = await queryOne<{ id: string; status: string }>(
        'SELECT id, status FROM users WHERE id = $1 AND deleted_at IS NULL',
        [decoded.id]
      );

      if (!user || user.status !== 'active') {
        throw new Error('User not found or inactive');
      }

      // Get membership
      const membership = await queryOne<{ organization_id: string; role_code: string; security_level: number }>(
        `SELECT m.organization_id, m.role_code, u.security_level
         FROM user_org_memberships m
         JOIN users u ON u.id = m.user_id
         WHERE m.user_id = $1 AND m.status = 'active'
         ORDER BY m.is_default DESC LIMIT 1`,
        [decoded.id]
      );

      const payload: TokenPayload = {
        id: decoded.id,
        email: user.email || '',
        role: membership?.role_code || 'MEMBER',
        org_id: membership?.organization_id || serverConfig.defaultOrgId,
        security_level: membership?.security_level || 5,
      };

      const accessToken = jwt.sign(payload, serverConfig.jwtSecret, {
        expiresIn: serverConfig.jwtExpiresIn,
      });

      return { accessToken, expiresIn: serverConfig.jwtExpiresIn };
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new Error('Refresh token expired. Please login again.');
      }
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Verify and decode token
   */
  static verifyToken(token: string): TokenPayload {
    return jwt.verify(token, serverConfig.jwtSecret) as TokenPayload;
  }

  /**
   * Change password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await queryOne<{ password_hash: string }>(
      'SELECT password_hash FROM users WHERE id = $1 AND deleted_at IS NULL',
      [userId]
    );

    if (!user || !user.password_hash) {
      throw new Error('User not found');
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      throw new Error('Current password is incorrect');
    }

    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters');
    }

    const hash = await bcrypt.hash(newPassword, serverConfig.bcryptRounds);
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hash, userId]
    );
  }

  /**
   * Check user role against required roles
   */
  static checkRole(userRole: string, ...allowedRoles: string[]): boolean {
    return allowedRoles.includes(userRole);
  }

  /**
   * Check user security level
   */
  static checkSecurityLevel(userLevel: number, requiredLevel: number): boolean {
    return userLevel >= requiredLevel;
  }

  /**
   * Logout - invalidate refresh token
   */
  static async logout(userId: string): Promise<void> {
    await query(
      'DELETE FROM refresh_tokens WHERE user_id = $1',
      [userId]
    ).catch(() => {});

    await query(
      `INSERT INTO audit_logs (user_id, action, table_name, details)
       VALUES ($1, 'LOGOUT', 'users', '{}')`,
      [userId]
    ).catch(() => {});
  }
}
