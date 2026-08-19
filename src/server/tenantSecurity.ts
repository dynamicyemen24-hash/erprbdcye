import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import { serverConfig } from './config';

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
const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

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
    const headerOrgId = req.headers['x-organization-id'] as string || req.headers['x-tenant-id'] as string;
    
    let userId: string | null = null;
    let userEmail: string | null = null;
    let tokenOrgId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        userId = decoded.id;
        userEmail = decoded.email;
        tokenOrgId = decoded.organizationId || decoded.orgId;
      } catch (err) {
        // Token invalid or expired
      }
    }

    // Determine target organization ID
    let targetOrgId = headerOrgId || tokenOrgId || DEFAULT_ORG_ID;

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

    // Fallback/System context for unauthenticated or public API routes
    req.userContext = {
      id: userId || '00000000-0000-0000-0000-000000000000',
      email: userEmail || 'system@nexora.org',
      name: 'Authenticated Tenant Scope',
      role: 'SYSTEM',
      organizationId: targetOrgId,
      securityLevel: 5
    };

    next();
  } catch (error: any) {
    console.error('[TenantSecurity] Middleware error:', error.message);
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
 * IDOR Protection: Verifies a record belongs to the tenant before Mutation or Access
 */
export async function verifyRecordTenantOwnership(
  pool: pg.Pool,
  table: string,
  recordId: string,
  tenantId: string
): Promise<boolean> {
  const hasOrgColRes = await pool.query(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema='public' AND table_name=$1 AND column_name='organization_id'
    )`,
    [table]
  );

  if (!hasOrgColRes.rows[0].exists) {
    // Table doesn't partition by organization_id (system wide table)
    return true;
  }

  const check = await pool.query(
    `SELECT organization_id FROM "${table}" WHERE id = $1`,
    [recordId]
  );

  if (check.rows.length === 0) return false;
  return check.rows[0].organization_id === tenantId;
}
