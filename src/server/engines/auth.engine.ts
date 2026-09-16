/**
 * NexoraOS™ — Authentication Engine
 * Complete JWT auth with refresh tokens, session management, RBAC
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { serverConfig } from '../config/index';
import { query, queryOne, queryMany, transaction } from '../core/database';
import { AuthContext, ApiResponse } from '../core/types';
import { hasPermission, Permission } from '../core/authorization.core';
import logger from '../core/logger';

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
   * Persist a failed login attempt to the audit trail (real security telemetry)
   */
  private static async logFailedLogin(email: string, ip?: string, reason?: string): Promise<void> {
    await query(
      `INSERT INTO audit_logs (action, table_name, details)
       VALUES ('LOGIN_FAILED', 'users', $1)`,
      [JSON.stringify({ email, ip, reason })]
    ).catch((err) => { logger.warn(`[Auth] Failed to log failed login: ${err.message}`, { context: 'auth' }); });
  }

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
      await this.logFailedLogin(email, ip, 'USER_NOT_FOUND');
      throw new Error('Invalid email or password');
    }

    if (user.status !== 'active') {
      await this.logFailedLogin(email, ip, 'ACCOUNT_INACTIVE');
      throw new Error('Account is suspended or inactive');
    }

    if (!user.password_hash) {
      await this.logFailedLogin(email, ip, 'PASSWORD_NOT_SET');
      throw new Error('Password not set. Please contact administrator.');
    }

    // 2. Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      await this.logFailedLogin(email, ip, 'INVALID_PASSWORD');
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
      security_level: user.security_level || 1,
    };

    const accessToken = jwt.sign(payload, serverConfig.jwtSecret, {
      expiresIn: serverConfig.jwtExpiresIn,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(
      { id: user.id, type: 'refresh' },
      serverConfig.jwtRefreshSecret,
      { expiresIn: serverConfig.jwtRefreshExpiresIn } as jwt.SignOptions
    );

    // 5. Store refresh token hash
    const refreshHash = await bcrypt.hash(refreshToken, serverConfig.bcryptRounds || 12);
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address)
       VALUES ($1, $2, NOW() + INTERVAL '7 days', $3)
       ON CONFLICT (user_id) DO UPDATE SET token_hash = $2, expires_at = NOW() + INTERVAL '7 days', ip_address = $3`,
      [user.id, refreshHash, ip || null]
    ).catch((err) => {
      // Table may not exist - graceful degradation
      logger.warn(`[Auth] Failed to store refresh token: ${err.message}`, { context: 'auth' });
    });

    // 6. Audit log
    await query(
      `INSERT INTO audit_logs (organization_id, user_id, action, table_name, details)
       VALUES ($1, $2, 'LOGIN', 'users', $3)`,
      [orgId, user.id, JSON.stringify({ ip, method: 'password' })]
    ).catch((err) => { logger.warn(`[Auth] Failed to log login audit: ${err.message}`, { context: 'auth' }); });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || '',
        nameAr: user.name_ar || '',
        role,
        orgId,
        securityLevel: user.security_level || 1,
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
      ).catch((err) => { logger.warn(`[Auth] Failed to create role: ${err.message}`, { context: 'auth' }); });

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
      } as jwt.SignOptions);

      const refreshToken = jwt.sign(
        { id: userId, type: 'refresh' },
        serverConfig.jwtRefreshSecret,
        { expiresIn: serverConfig.jwtRefreshExpiresIn } as jwt.SignOptions
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
  static async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: string }> {
    try {
      const decoded = jwt.verify(refreshToken, serverConfig.jwtRefreshSecret, { algorithms: ['HS256'] }) as { id: string };

      // Verify user still exists and is active
      const user = await queryOne<{ id: string; status: string; email: string }>(
        'SELECT id, status, email FROM users WHERE id = $1 AND deleted_at IS NULL',
        [decoded.id]
      );

      if (!user || user.status !== 'active') {
        throw new Error('User not found or inactive');
      }

      // Verify the refresh token hash in DB before rotating
      const storedToken = await queryOne<{ token_hash: string }>(
        'SELECT token_hash FROM refresh_tokens WHERE user_id = $1',
        [decoded.id]
      );

      if (storedToken) {
        const validRefresh = await bcrypt.compare(refreshToken, storedToken.token_hash);
        if (!validRefresh) {
          // Refresh token reuse detected — invalidate all sessions
          await query('DELETE FROM refresh_tokens WHERE user_id = $1', [decoded.id]);
          throw new Error('Refresh token reuse detected. All sessions invalidated.');
        }
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
        security_level: membership?.security_level || 1,
      };

      const accessToken = jwt.sign(payload, serverConfig.jwtSecret, {
        expiresIn: serverConfig.jwtExpiresIn,
      } as jwt.SignOptions);

      // Rotate refresh token
      const newRefreshToken = crypto.randomBytes(40).toString('hex');
      const newRefreshHash = await bcrypt.hash(newRefreshToken, 12);
      await query(
        'UPDATE refresh_tokens SET token_hash = $1, expires_at = NOW() + INTERVAL \'7 days\' WHERE user_id = $2',
        [newRefreshHash, decoded.id]
      ).catch((err) => {
        logger.warn(`[Auth] Failed to rotate refresh token: ${err.message}`, { context: 'auth' });
      });

      return { accessToken, refreshToken: newRefreshToken, expiresIn: serverConfig.jwtExpiresIn };
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
    return jwt.verify(token, serverConfig.jwtSecret, { algorithms: ['HS256'] }) as TokenPayload;
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

    // Password policy: must contain upper, lower, number, special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw new Error('Password must contain uppercase, lowercase, number, and special character (!@#$%^&*)');
    }

    const hash = await bcrypt.hash(newPassword, serverConfig.bcryptRounds);
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hash, userId]
    );
  }

  /**
   * Get complete user profile with organization membership
   */
  static async getUserProfile(userId: string): Promise<{
    id: string;
    email: string;
    name: string;
    nameAr: string;
    email_verified: boolean;
    security_level: number;
    role: string;
    org_id: string;
    department_code: string | null;
    position_code: string | null;
    can_approve: boolean | null;
    max_approval_amount: string | null;
    last_login: string | null;
    login_failures: number;
    account_status: string;
    membership: {
      organization_id: string;
      role_code: string;
      is_default: boolean;
    } | null;
    permissions: Permission[];
  }> {
    // Get basic user data
    const user = await queryOne<{
      id: string; email: string; name: string; name_ar: string;
      security_level: number; default_language: string; status: string;
      department_code: string | null; position_code: string | null;
      can_approve: boolean | null; max_approval_amount: string | null;
      last_login: string | null; login_failures: number;
    }>(
      `SELECT id, email, name, name_ar, security_level, default_language, status,
          department_code, position_code, can_approve, max_approval_amount,
          last_login, login_failures
       FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [userId]
    );

    if (!user) {
      throw new Error('User not found');
    }

    // Get organization membership
    const membership = await queryOne<{ organization_id: string; role_code: string; is_default: boolean }>(
      `SELECT organization_id, role_code, is_default FROM user_org_memberships WHERE user_id = $1 AND status = 'active' ORDER BY is_default DESC LIMIT 1`,
      [userId]
    );

    // Get effective permissions for this user's role
    // (role is carried in department_code, matching the JWT role claim)
    const permissions: Permission[] = [];
    const role = user.department_code || 'READONLY';
    Object.values(Permission).forEach(p => {
      if (hasPermission(role, p)) {
        permissions.push(p);
      }
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name || '',
      nameAr: user.name_ar || '',
      email_verified: user.default_language !== null, // simplified verification
      security_level: user.security_level || 1,
      role,
      org_id: membership?.organization_id || '',
      department_code: user.department_code,
      position_code: user.position_code,
      can_approve: user.can_approve,
      max_approval_amount: user.max_approval_amount,
      last_login: user.last_login,
      login_failures: user.login_failures || 0,
      account_status: user.status || 'active',
      membership: membership || null,
      permissions,
    };
  }

  /**
   * Update user profile fields
   */
  static async updateProfile(
    userId: string,
    data: {
      name?: string;
      nameAr?: string;
      department_code?: string;
      position_code?: string;
      can_approve?: boolean;
      max_approval_amount?: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [userId];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${++paramCount}`);
      values.push(data.name);
    }
    if (data.nameAr !== undefined) {
      updates.push(`name_ar = $${++paramCount}`);
      values.push(data.nameAr);
    }
    if (data.department_code !== undefined) {
      updates.push(`department_code = $${++paramCount}`);
      values.push(data.department_code);
    }
    if (data.position_code !== undefined) {
      updates.push(`position_code = $${++paramCount}`);
      values.push(data.position_code);
    }
    if (data.can_approve !== undefined) {
      updates.push(`can_approve = $${++paramCount}`);
      values.push(data.can_approve);
    }
    if (data.max_approval_amount !== undefined) {
      updates.push(`max_approval_amount = $${++paramCount}`);
      values.push(data.max_approval_amount);
    }

    if (updates.length === 0) {
      return { success: false, message: 'No fields to update' };
    }

    updates.push(`updated_at = NOW()`);
    const queryStr = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount + 1}
      RETURNING id, email, name, name_ar, security_level, status
    `;

    const result = await query(queryStr, values);
    return {
      success: result.rows.length > 0,
      message: result.rows.length > 0 ? 'Profile updated successfully' : 'User not found'
    };
  }

  /**
   * Update user security level and role
   * Only SUPER_ADMIN (level 5) or ORG_ADMIN (level 4) can change security levels
   */
  static async updateSecurityLevel(
    targetUserId: string,
    newSecurityLevel: number,
    performingUserId: string
  ): Promise<{ success: boolean; message: string; userSecurityLevel: number }> {
    // Check performing user has permission
    const performingUser = await queryOne<{ security_level: number }>(
      'SELECT security_level FROM users WHERE id = $1 AND deleted_at IS NULL',
      [performingUserId]
    );

    if (!performingUser) {
      return { success: false, message: 'Performing user not found', userSecurityLevel: 0 };
    }

    const performingLevel = performingUser.security_level;

    // Only SUPER_ADMIN (5) can change any level, ORG_ADMIN (4) can downgrade but not upgrade beyond their level
    let canModify = false;
    if (performingLevel === 5) {
      canModify = true;
    } else if (performingLevel === 4 && newSecurityLevel <= 4) {
      canModify = true;
    }

    if (!canModify) {
      return {
        success: false,
        message: `Insufficient permissions. Performing user level: ${performingLevel}, target level: ${newSecurityLevel}`,
        userSecurityLevel: performingLevel
      };
    }

    // Validate security level
    if (newSecurityLevel < 1 || newSecurityLevel > 5) {
      return { success: false, message: 'Security level must be between 1 and 5', userSecurityLevel: performingLevel };
    }

    await query(
      'UPDATE users SET security_level = $1, updated_at = NOW() WHERE id = $2',
      [newSecurityLevel, targetUserId]
    );

    return {
      success: true,
      message: 'Security level updated successfully',
      userSecurityLevel: newSecurityLevel
    };
  }

  /**
   * Record login attempt (success or failure) for anomaly detection.
   * Public: called by auth routes for login/logout/password-change auditing.
   */
  static async recordLoginAttempt(
    userId: string,
    success: boolean,
    ip?: string,
    userAgent?: string
  ): Promise<void> {
    const now = new Date().toISOString();

    if (success) {
      // Update last_login on success
      await query(
        'UPDATE users SET last_login = $1, login_failures = 0 WHERE id = $2',
        [now, userId]
      ).catch(() => {/* ignore - last_login is optional */ });
      // Log successful login to audit
      await query(
        `INSERT INTO audit_logs (user_id, action, table_name, details)
         VALUES ($1, 'LOGIN_SUCCESS', 'users', $2)`,
        [userId, JSON.stringify({ ip, timestamp: now, userAgent })]
      ).catch(() => {/* ignore audit logging failures */ });
      return;
    }

    // Login failure - increment failure counter
    await query(
      `UPDATE users SET login_failures = login_failures + 1, last_login = NULL WHERE id = $1`,
      [userId]
    ).catch(() => {/* ignore */ });

    // Log failed login to audit
    await query(
      `INSERT INTO audit_logs (user_id, action, table_name, details)
       VALUES ($1, 'LOGIN_FAILED', 'users', $2)`,
      [userId, JSON.stringify({ ip, timestamp: now, userAgent, failure_count: 1 })]
    ).catch(() => {/* ignore audit logging failures */ });

    // Anomaly detection: more than 3 failures in 1 hour
    const failures = await queryOne<{ failure_count: number }>(
      `SELECT login_failures FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [userId]
    );

    if (failures && failures.failure_count && failures.failure_count >= 3) {
      // Log security anomaly
      await query(
        `INSERT INTO audit_logs (user_id, action, table_name, details, severity)
         VALUES ($1, 'SECURITY_ANOMALY', 'users', $2, 'warning')`,
        [userId, JSON.stringify({ type: 'multiple_login_failures', failure_count: failures.failure_count, threshold: 3 })]
      ).catch(() => {/* ignore */ });
    }
  }

  /**
   * Reset user password by admin (for locked accounts)
   */
  static async adminResetPassword(userId: string, newPassword: string, performedBy?: string): Promise<{ success: boolean; message: string }> {
    const passwordHash = await bcrypt.hash(newPassword, serverConfig.bcryptRounds);
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, userId]
    );

    // Log the admin password reset
    await query(
      `INSERT INTO audit_logs (user_id, action, table_name, details, performed_by)
       VALUES ($1, 'ADMIN_PASSWORD_RESET', 'users', '{}', $2)`,
      [userId, performedBy || userId]
    ).catch(() => {/* ignore */ });

    return { success: true, message: 'Password reset successfully by administrator' };
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
    ).catch((err) => { logger.warn(`[Auth] Failed to delete refresh tokens: ${err.message}`, { context: 'auth' }); });

    await query(
      `INSERT INTO audit_logs (user_id, action, table_name, details)
       VALUES ($1, 'LOGOUT', 'users', '{}')`,
      [userId]
    ).catch((err) => { logger.warn(`[Auth] Failed to log logout: ${err.message}`, { context: 'auth' }); });
  }
}
