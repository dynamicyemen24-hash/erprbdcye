/**
 * NexoraOS™ — Unified Security Middleware
 * Covers: JWT Auth, Role-Based Access, Rate Limiting, Input Validation/Sanitization
 * No duplicates — single source of truth for all middleware logic
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { serverConfig } from '../config';
import logger from '../core/logger';
import { queryOne } from '../core/database';

// ─────────────────────────────────────────────
// 1. JWT Authentication Middleware
// ─────────────────────────────────────────────

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    org_id: string;
    security_level?: number;
  };
}

/**
 * Verifies JWT Bearer token on every protected /api route.
 * Public paths: /api/auth/*, /api/health/*, /api/gemini/*
 */
export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Skip non-API routes (static files, SPA)
  if (!req.path.startsWith('/api')) {
    return next();
  }

  // Public endpoints — no token required
  const publicPrefixes = ['/api/auth', '/api/health', '/api/exchange-rates/live'];
  if (publicPrefixes.some(p => req.path.startsWith(p))) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access Denied: Missing Authentication Token' });
    return;
  }

  jwt.verify(token, serverConfig.jwtSecret, (err: any, decoded: any) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        res.status(401).json({ error: 'Access Denied: Token Expired. Please login again.' });
      } else {
        res.status(403).json({ error: 'Access Denied: Invalid Token' });
      }
      return;
    }
    req.user = decoded;
    next();
  });
};

// ─────────────────────────────────────────────
// 2. Role & Security Level Guards
// ─────────────────────────────────────────────

/** Requires minimum security level (1=lowest, 5=highest/admin) */
export const requireSecurityLevel = (minLevel: number) => (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const userLevel = req.user?.security_level ?? 0;
  if (userLevel < minLevel) {
    res.status(403).json({
      error: `Access Denied: Required security level ${minLevel}, your level is ${userLevel}`
    });
    return;
  }
  next();
};

/** Requires one of the specified roles */
export const requireRole = (...roles: string[]) => (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const userRole = req.user?.role ?? '';
  if (!roles.includes(userRole)) {
    res.status(403).json({
      error: `Access Denied: Role '${userRole}' is not authorized for this operation.`
    });
    return;
  }
  next();
};

// ─────────────────────────────────────────────
// 3. Rate Limiters (differentiated by sensitivity)
// ─────────────────────────────────────────────

/** For login, register, password-reset */
export const authRateLimiter = rateLimit({
  windowMs: serverConfig.rateLimitWindowMs,
  max: serverConfig.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: { error: 'Too many authentication attempts. Please wait 15 minutes and try again.' }
});

/** For general API reads */
export const apiReadRateLimiter = rateLimit({
  windowMs: serverConfig.rateLimitWindowMs,
  max: serverConfig.apiRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded. Please slow down your requests.' },
});

/** For write operations (POST/PUT/DELETE on data tables) */
export const apiWriteRateLimiter = rateLimit({
  windowMs: serverConfig.rateLimitWindowMs,
  max: serverConfig.writeRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Write rate limit exceeded. Max 50 writes per 15 minutes.' },
});

/** For sensitive ops: backup, restore, bulk-export, system settings */
export const sensitiveOpsRateLimiter = rateLimit({
  windowMs: serverConfig.rateLimitWindowMs,
  max: serverConfig.sensitiveRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Sensitive operation rate limit exceeded. Max 5 per 15 minutes.' },
});

// ─────────────────────────────────────────────
// 4. Input Validation & Sanitization Helpers
// ─────────────────────────────────────────────

/** Strips HTML tags and trims whitespace from a string */
export function sanitizeString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return String(value)
    .replace(/<[^>]*>/g, '')          // strip HTML tags
    .replace(/javascript:/gi, '')      // remove JS injections
    .replace(/on\w+\s*=/gi, '')        // remove event handlers
    .trim()
    .substring(0, 10000);             // max 10k chars
}

/** Validates and coerces to a positive number, returns null if invalid */
export function sanitizeNumeric(value: unknown): number | null {
  const n = Number(value);
  return isNaN(n) ? null : n;
}

/** Validates UUID format */
export function isValidUUID(value: unknown): boolean {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/** Validates email format */
export function isValidEmail(value: unknown): boolean {
  return typeof value === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) &&
    value.length <= 254;
}

/** Validates ISO date string */
export function isValidDate(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}

/** Ensures a required string field is present and non-empty */
export function requireString(value: unknown, fieldName: string): string {
  if (!value || typeof value !== 'string' || !value.trim()) {
    throw new Error(`Field '${fieldName}' is required and must be a non-empty string`);
  }
  return sanitizeString(value) as string;
}

/** Builds a structured validation error response */
export function validationError(res: Response, message: string, field?: string): void {
  res.status(400).json({
    error: 'Validation Error',
    message,
    field: field ?? null,
  });
}

// ─────────────────────────────────────────────
// 5. Tenant Extraction Helper
// ─────────────────────────────────────────────

/** Extracts organization ID from JWT only — no header fallback to prevent cross-tenant spoofing */
export function extractTenantId(req: AuthenticatedRequest): string {
  return req.user?.org_id || serverConfig.defaultOrgId;
}

/**
 * Checks if user has permission to access a specific activity.
 * Supports: org-admin (all), staff owner (own activities), volunteer owner (own activities)
 * Also checks hr_staff/volunteers assignment to the activity.
 */
export const checkActivityPermission = (activityId: string, allowOrgAdmin: boolean = true):
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => void => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    try {
      // Org admins have full access
      if (allowOrgAdmin && req.user.security_level === 5) {
        return next();
      }

      // SUPER_ADMIN role bypass
      if (req.user.role === 'SUPER_ADMIN') {
        return next();
      }

      // REAL assignment check against the activities table:
      // the user must be linked via users.hr_staff_id / users.volunteer_id,
      // or be the activity's assigned staff/volunteer record owner.
      const activity = await queryOne<{ id: string; organization_id: string; staff_id: string | null; volunteer_id: string | null }>(
        `SELECT id, organization_id, staff_id, volunteer_id
         FROM activities
         WHERE id = $1 AND deleted_at IS NULL`,
        [activityId]
      );

      if (!activity) {
        res.status(404).json({ error: 'Activity not found' });
        return;
      }

      // Tenant isolation first — cross-org access is always denied
      if (req.user.org_id && activity.organization_id && String(activity.organization_id) !== String(req.user.org_id)) {
        res.status(403).json({ error: 'Access Denied: activity belongs to another organization' });
        return;
      }

      // Resolve which hr_staff / volunteers rows belong to this user.
      // hr_staff links directly via user_id; volunteers link via party email match on the user's email.
      const identity = await queryOne<{ staff_id: string | null; volunteer_id: string | null }>(
        `SELECT
           (SELECT id FROM hr_staff WHERE user_id = $1 AND deleted_at IS NULL LIMIT 1) AS staff_id,
           (SELECT v.id FROM volunteers v
              JOIN parties p ON p.id = v.party_id
              JOIN users u ON LOWER(u.email) = LOWER(p.email)
              WHERE u.id = $1 LIMIT 1) AS volunteer_id`,
        [req.user.id]
      );

      const hasStaffAssignment = !!(identity?.staff_id && activity.staff_id === identity.staff_id);
      const hasVolunteerAssignment = !!(identity?.volunteer_id && activity.volunteer_id === identity.volunteer_id);

      if (hasStaffAssignment || hasVolunteerAssignment) {
        return next();
      }

      res.status(403).json({
        error: 'Access Denied: You are not assigned to this activity as staff or volunteer. ' +
               'Contact an administrator to be assigned, or request appropriate permissions.'
      });
      return;
    } catch (error) {
      logger.error('Permission check error: ' + (error instanceof Error ? error.message : String(error)));
      res.status(500).json({ error: 'Internal server error during permission check' });
      return;
    }
};
};
