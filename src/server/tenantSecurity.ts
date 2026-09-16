import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import { serverConfig } from './config';
import logger from './core/logger';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  organizationId: string;
  branchId?: string;
  fiscalYearId?: string;
  securityLevel: number;
}

export interface AuthenticatedRequest extends Request {
  userContext?: AuthenticatedUser;
}

const JWT_SECRET = serverConfig.jwtSecret;

/**
 * Middleware to extract and verify JWT authentication and Tenant Context
 */
export async function authenticateTenantContext(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
  pool: pg.Pool
) {
  try {
    const authHeader = req.headers.authorization;
    
    let userId: string | null = null;
    let userEmail: string | null = null;
    let tokenOrgId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as any;
        userId = decoded.id;
        userEmail = decoded.email;
        tokenOrgId = decoded.organizationId || decoded.orgId || decoded.org_id;
      } catch (err) {
        // Token invalid or expired
      }
    }

    // Tenant ID comes ONLY from JWT claims — never from headers (prevents cross-tenant spoofing).
    // No default-org fallback: a token without an org claim cannot be scoped, so it is rejected.
    if (!tokenOrgId) {
      return res.status(401).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Authentication required. Token must carry an organization claim.' },
        timestamp: new Date().toISOString(),
      });
    }
    const targetOrgId = tokenOrgId;

    if (userId) {
      // Verify user membership in the target organization
      const memberCheck = await pool.query(
        `SELECT m.organization_id, m.role_code, u.security_level, u.email, u.name
         FROM user_org_memberships m
         JOIN users u ON u.id = m.user_id
         WHERE m.user_id = $1 AND m.organization_id = $2 AND m.status = 'active' AND u.deleted_at IS NULL`,
        [userId, targetOrgId]
      );

      if (memberCheck.rows.length > 0) {
        const row = memberCheck.rows[0];
        req.userContext = {
          id: userId,
          email: row.email,
          name: row.name,
          role: row.role_code,
          organizationId: row.organization_id,
          securityLevel: row.security_level || 5
        };
        return next();
      }
    }

    // Reject unauthenticated requests — no fallback with max privileges
    // Public routes (health, docs) should be exempted before this middleware is called
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required. Valid JWT token must be provided.' },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('[TenantSecurity] Middleware error', { context: 'tenant', error });
    res.status(500).json({ error: 'Tenant authentication verification failed' });
  }
}

/**
 * Enforces Tenant Scope on raw SQL SELECT queries
 */
export async function enforceTenantQueryScope(
  pool: pg.Pool,
  table: string,
  tenantId: string,
  extraConditions: string = ''
) {
  // Check if table has organization_id column
  const hasOrgColRes = await pool.query(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema='public' AND table_name=$1 AND column_name='organization_id'
    )`,
    [table]
  );
  const hasOrgCol = hasOrgColRes.rows[0].exists;

  const hasDeletedAtRes = await pool.query(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema='public' AND table_name=$1 AND column_name='deleted_at'
    )`,
    [table]
  );
  const hasDeletedAt = hasDeletedAtRes.rows[0].exists;

  const whereClauses: string[] = [];
  const params: any[] = [];

  if (hasOrgCol) {
    params.push(tenantId);
    whereClauses.push(`"organization_id" = $${params.length}`);
  }

  if (hasDeletedAt) {
    whereClauses.push(`"deleted_at" IS NULL`);
  }

  if (extraConditions) {
    whereClauses.push(extraConditions);
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const query = `SELECT * FROM "${table}" ${whereStr}`;

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Express middleware factory: enforces record-level tenant ownership
 * (IDOR protection) for `:id` routes backed by the given table.
 * Tables WITHOUT an organization_id column are treated as global and pass
 * through (verifyRecordTenantOwnership returns true for those).
 * Missing records and cross-tenant records both yield 404 to avoid
 * existence oracle leaks.
 */
export function enforceOwnership(table: string, idParam: string = 'id') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId =
        (req as any).user?.org_id ||
        (req as any).user?.orgId ||
        req.userContext?.organizationId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: { code: 'TENANT_REQUIRED', message: 'Authentication required.' },
          timestamp: new Date().toISOString(),
        });
      }
      const recordId = (req.params as any)?.[idParam];
      if (!recordId) return next();
      let ok = false;
      try {
        const { getPool } = await import('./core/database');
        ok = await verifyRecordTenantOwnership(getPool(), table, String(recordId), tenantId);
      } catch (error: any) {
        logger.warn('[TenantSecurity] Ownership probe unreachable, failing closed to 404', { context: 'tenant', error: error.message });
        ok = false;
      }
      if (!ok) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Record not found.' },
          timestamp: new Date().toISOString(),
        });
      }
      return next();
    } catch (error: any) {
      logger.error('[TenantSecurity] Ownership check failed', { context: 'tenant', error });
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Record not found.' },
        timestamp: new Date().toISOString(),
      });
    }
  };
}

/**
 * IDOR Protection: Verifies a record belongs to the tenant before Mutation or Access
 */
export async function verifyRecordTenantOwnership(
  pool: pg.Pool,
  table: string,
  recordId: string,
  tenantId: string
): Promise<boolean> {
  try {
    const hasOrgColRes = await Promise.race([
      pool.query(
        `SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema='public' AND table_name=$1 AND column_name='organization_id'
        )`,
        [table]
      ),
      new Promise<any>((_, reject) => setTimeout(() => reject(new Error('DB Probe Timeout')), 1500))
    ]);

    if (!hasOrgColRes?.rows?.[0]?.exists) {
      return true;
    }

    const check = await Promise.race([
      pool.query(
        `SELECT organization_id FROM "${table}" WHERE id = $1`,
        [recordId]
      ),
      new Promise<any>((_, reject) => setTimeout(() => reject(new Error('DB Probe Timeout')), 1500))
    ]);

    if (!check?.rows || check.rows.length === 0) return false;
    return check.rows[0].organization_id === tenantId;
  } catch {
    return false;
  }
}
