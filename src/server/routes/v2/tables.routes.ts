/**
 * NexoraOS™ — Dynamic Table CRUD Routes
 * Extracted from server.ts for modular architecture
 */

import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getPool, queryWithRetry, getTableSchemaInfo } from '../../core/database';
import { isWhitelisted, TABLE_POLICY_DOMAIN } from '../../core/constants';
import { apiCache } from '../../core/cache';
import logger from '../../core/logger';
import { enforceAllPolicies, type PolicyContext, type PolicyViolation } from '../../services/policyEngine';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

// ─── Helpers ──────────────────────────────────────────────

async function enforceTablePolicy(
  pool: any,
  req: any,
  table: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE'
): Promise<{ allowed: boolean; violations: PolicyViolation[] }> {
  const domain = TABLE_POLICY_DOMAIN[table];
  if (!domain) return { allowed: true, violations: [] };

  const ctx: PolicyContext = {
    organizationId: req.user?.org_id || '',
    userId: req.user?.id || '',
    securityLevel: req.user?.security_level ?? 0,
    role: req.user?.role ?? '',
  };

  return enforceAllPolicies(pool, ctx, domain, action, req.body);
}

async function logTablePolicyViolation(
  pool: any,
  req: any,
  table: string,
  action: string,
  violations: PolicyViolation[],
  envMode: string
): Promise<void> {
  try {
    const blockViolations = violations.filter(v => v.severity === 'BLOCK');
    const warnViolations = violations.filter(v => v.severity === 'WARN' || v.severity === 'INFO');
    await pool.query(`
      INSERT INTO audit_logs (id, action, table_name, record_id, user_id, details, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [
      crypto.randomUUID(),
      `POLICY_VIOLATION:generic:${table}:${action}`,
      'policy_enforcement',
      null,
      req.user?.id || null,
      JSON.stringify({
        domain: TABLE_POLICY_DOMAIN[table],
        table,
        action,
        environmentMode: envMode,
        blockCount: blockViolations.length,
        warnCount: warnViolations.length,
        violations: violations.map(v => ({
          code: v.code,
          severity: v.severity,
          messageEn: v.messageEn,
          policyKey: v.policyKey,
          limit: v.limit,
          currentValue: v.currentValue,
        })),
      }),
    ]);
  } catch (err) {
    logger.error('[PolicyEnforcement] Failed to log violation', { context: 'policy', error: err as any });
  }
}

const SENSITIVE_TABLES = ['users', 'roles', 'role_permissions', 'user_roles', 'user_org_memberships', 'organizations', 'system_settings'];

const SENSITIVE_RESPONSE_FIELDS = ['password_hash', 'totp_secret', 'refresh_token'];

// ─── Schema Route (mounted at /api/schema via server.ts) ──
export const schemaRouter = Router();

// Get table schema (columns metadata) to build dynamic UI forms
schemaRouter.get('/:table', authenticateToken, async (req, res) => {
  const { table } = req.params;
  if (!isWhitelisted(table)) {
    return res.status(403).json({ error: `Table '${table}' is not in the whitelist.` });
  }

  try {
    const dbPool = getPool();
    const colsRes = await dbPool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `, [table]);

    res.json({
      table,
      columns: colsRes.rows
    });
  } catch (err: any) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET all records for a table (Tenant Scoped, Paginated)
router.get('/:table', authenticateToken, async (req: any, res: any) => {
  const { table } = req.params;
  if (!isWhitelisted(table)) {
    return res.status(403).json({ error: `Table '${table}' is not in the whitelist.` });
  }

  try {
    const dbPool = getPool();
    const tenantId = req.user?.org_id;
    if (!tenantId) return res.status(401).json({ error: 'Organization ID required' });

    const { hasOrgCol, hasDeletedAt, hasCreatedAt } = await getTableSchemaInfo(dbPool, table);

    const whereClauses: string[] = [];
    const params: any[] = [];

    if (hasOrgCol) {
      params.push(tenantId);
      whereClauses.push(`"organization_id" = $${params.length}`);
    }

    if (hasDeletedAt) {
      whereClauses.push(`"deleted_at" IS NULL`);
    }

    // Pagination parameters
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit as string) || 100));
    const offset = (page - 1) * limit;

    let baseQuery = `SELECT * FROM "${table}"`;
    if (whereClauses.length > 0) {
      baseQuery += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    // Count total records for pagination metadata
    const countQuery = `SELECT COUNT(*) as total FROM "${table}"${whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : ''}`;
    const countResult = await queryWithRetry(countQuery, [...params]);
    const totalCount = parseInt(countResult.rows[0]?.total || '0', 10);

    let dataQuery = baseQuery;
    if (hasCreatedAt) {
      dataQuery += ` ORDER BY created_at DESC`;
    }
    params.push(limit);
    dataQuery += ` LIMIT $${params.length}`;
    params.push(offset);
    dataQuery += ` OFFSET $${params.length}`;

    res.setHeader('Cache-Control', 'private, max-age=10, stale-while-revalidate=30');

    const result = await queryWithRetry(dataQuery, params);
    let rows = result.rows;
    // SECURITY: Strip sensitive fields from response
    rows = rows.map(row => {
      const clean = { ...row };
      SENSITIVE_RESPONSE_FIELDS.forEach(f => delete clean[f]);
      return clean;
    });

    res.json({
      data: rows,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      }
    });
  } catch (err: any) {
    logger.warn(`Warning fetching table ${table}: ${err.message}`, { context: 'tables' });
    res.json({ data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0, hasNext: false, hasPrev: false } });
  }
});

// POST to insert a new record dynamically (Tenant Bound)
router.post('/:table', authenticateToken, async (req: any, res: any) => {
  const { table } = req.params;
  if (!isWhitelisted(table)) {
    return res.status(403).json({ error: `Table '${table}' is not in the whitelist.` });
  }

  if (SENSITIVE_TABLES.includes(table)) {
    const callerLevel = req.user?.security_level ?? 0;
    if (callerLevel < 4) {
      return res.status(403).json({ error: `Access Denied: Creating records in '${table}' requires administrator privileges (Level 4+)` });
    }
  }

  // Policy enforcement for domain-specific tables
  try {
    const policyPool = getPool();
    const { allowed, violations } = await enforceTablePolicy(policyPool, req, table, 'CREATE');
    if (!allowed) {
      const envMode = req.headers['x-environment-mode'] || 'production';
      logTablePolicyViolation(policyPool, req, table, 'CREATE', violations, envMode);
      const blockViolations = violations.filter(v => v.severity === 'BLOCK');
      const warnViolations = violations.filter(v => v.severity === 'WARN');
      return res.status(403).json({
        error: 'Policy Violation',
        message: blockViolations[0]?.messageEn || 'Operation not allowed by policy',
        messageAr: blockViolations[0]?.messageAr || 'العملية غير مسموح بها وفقاً للسياسة',
        violations: [...blockViolations, ...warnViolations].map(v => ({
          code: v.code,
          severity: v.severity,
          messageAr: v.messageAr,
          messageEn: v.messageEn,
          policyKey: v.policyKey,
          limit: v.limit,
          currentValue: v.currentValue,
        })),
        environmentMode: envMode,
      });
    }
  } catch (policyErr) {
    logger.error('[PolicyEnforcement] Error', { context: 'policy', error: policyErr as any });
  }

  try {
    const dbPool = getPool();
    const record = req.body;
    const tenantId = req.user?.org_id;
    if (!tenantId) return res.status(401).json({ error: 'Organization ID required' });

    if (table === 'projects' && record.code !== undefined && !record.project_code) {
      record.project_code = record.code;
    }

    const colsRes = await dbPool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1;
    `, [table]);

    const columns = colsRes.rows.map(c => c.column_name);

    const insertData: any = {};
    const BLOCKED_INSERT_FIELDS = [
      'id', 'organization_id', 'created_at', 'updated_at', 'deleted_at',
      'created_by', 'updated_by', 'is_system', 'is_default'
    ];
    const SENSITIVE_COLUMN_BLOCKLIST: Record<string, string[]> = {
      users: ['password_hash', 'role', 'security_level', 'is_active', 'is_superuser'],
      roles: ['is_system', 'is_default'],
      organizations: ['subscription_plan', 'is_active', 'security_level'],
      system_settings: ['is_system', 'created_by'],
      user_roles: ['granted_at'],
      role_permissions: ['granted_at'],
    };
    const blockedFields = [...BLOCKED_INSERT_FIELDS, ...(SENSITIVE_COLUMN_BLOCKLIST[table] || [])];
    for (const key of Object.keys(record)) {
      if (columns.includes(key) && record[key] !== undefined && !blockedFields.includes(key)) {
        insertData[key] = record[key];
      }
    }

    if (columns.includes('id') && !insertData['id']) {
      insertData['id'] = crypto.randomUUID();
    }

    const now = new Date().toISOString();
    if (columns.includes('created_at') && !insertData['created_at']) {
      insertData['created_at'] = now;
    }
    if (columns.includes('updated_at') && !insertData['updated_at']) {
      insertData['updated_at'] = now;
    }

    // Force strict authenticated tenant isolation (do not allow body parameter spoofing)
    if (columns.includes('organization_id')) {
      insertData['organization_id'] = tenantId;
    }

    if (table === 'users') {
      if (record.password) {
        insertData['password_hash'] = await bcrypt.hash(record.password, 10);
      } else if (!insertData['password_hash']) {
        const tempPassword = crypto.randomBytes(12).toString('base64url').slice(0, 16);
        insertData['password_hash'] = await bcrypt.hash(tempPassword, 10);
        insertData['_temp_password'] = tempPassword;
      }
      if (record.name && !insertData['name_ar']) {
        insertData['name_ar'] = record.name;
      }
    }

    if (columns.includes('security_level') && insertData['security_level'] === undefined) {
      insertData['security_level'] = 1;
    }

    const tempPassword = insertData['_temp_password'];
    delete insertData['_temp_password'];

    const keys = Object.keys(insertData);
    const values = Object.values(insertData);

    if (keys.length === 0) {
      return res.status(400).json({ error: "No valid columns provided for insertion." });
    }

    const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(', ');
    const query = keys.includes('id') 
      ? `
        INSERT INTO "${table}" (${keys.map(k => `"${k}"`).join(', ')})
        VALUES (${placeholders})
        ON CONFLICT (id) DO UPDATE SET updated_at = NOW()
        RETURNING *;
      `
      : `
        INSERT INTO "${table}" (${keys.map(k => `"${k}"`).join(', ')})
        VALUES (${placeholders})
        RETURNING *;
      `;

    const result = await dbPool.query(query, values);
    let createdRecord = result.rows[0];
    // SECURITY: Strip sensitive fields from response
    if (createdRecord && (table === 'users' || SENSITIVE_TABLES.includes(table))) {
      delete createdRecord.password_hash;
      delete createdRecord.totp_secret;
      delete createdRecord.refresh_token;
    }
    if (table === 'projects' && createdRecord) {
      createdRecord = {
        ...createdRecord,
        code: createdRecord.project_code
      };
    }
    if (table === 'users' && tempPassword) {
      createdRecord._temp_password = tempPassword;
    }
    apiCache.delete('dashboard-stats');
    apiCache.delete('consolidated-kpis');
    res.status(201).json(createdRecord);
  } catch (err: any) {
    logger.error(`Error inserting into ${table}`, { context: 'tables', error: err });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PUT to update a record dynamically (IDOR Protected)
router.put('/:table/:id', authenticateToken, async (req: any, res: any) => {
  const { table, id } = req.params;
  if (!isWhitelisted(table)) {
    return res.status(403).json({ error: `Table '${table}' is not in the whitelist.` });
  }

  if (SENSITIVE_TABLES.includes(table)) {
    const callerLevel = req.user?.security_level ?? 0;
    if (callerLevel < 4) {
      return res.status(403).json({ error: `Access Denied: Updating records in '${table}' requires administrator privileges (Level 4+)` });
    }
  }

  // Policy enforcement for domain-specific tables
  try {
    const policyPool = getPool();
    const { allowed, violations } = await enforceTablePolicy(policyPool, req, table, 'UPDATE');
    if (!allowed) {
      const envMode = req.headers['x-environment-mode'] || 'production';
      logTablePolicyViolation(policyPool, req, table, 'UPDATE', violations, envMode);
      const blockViolations = violations.filter(v => v.severity === 'BLOCK');
      const warnViolations = violations.filter(v => v.severity === 'WARN');
      return res.status(403).json({
        error: 'Policy Violation',
        message: blockViolations[0]?.messageEn || 'Operation not allowed by policy',
        messageAr: blockViolations[0]?.messageAr || 'العملية غير مسموح بها وفقاً للسياسة',
        violations: [...blockViolations, ...warnViolations].map(v => ({
          code: v.code,
          severity: v.severity,
          messageAr: v.messageAr,
          messageEn: v.messageEn,
          policyKey: v.policyKey,
          limit: v.limit,
          currentValue: v.currentValue,
        })),
        environmentMode: envMode,
      });
    }
  } catch (policyErr) {
    logger.error('[PolicyEnforcement] Error', { context: 'policy', error: policyErr as any });
  }

  try {
    const dbPool = getPool();
    const record = req.body;
    const tenantId = req.user?.org_id;
    if (!tenantId) return res.status(401).json({ error: 'Organization ID required' });

    // Verify record ownership / IDOR check
    const hasOrgColRes = await dbPool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' AND table_name=$1 AND column_name='organization_id'
      )
    `, [table]);
    
    if (hasOrgColRes.rows[0].exists) {
      const ownerCheck = await dbPool.query(`SELECT organization_id FROM "${table}" WHERE id = $1`, [id]);
      if (ownerCheck.rows.length === 0) {
        return res.status(404).json({ error: `Record with id ${id} not found.` });
      }
      if (ownerCheck.rows[0].organization_id !== tenantId) {
        return res.status(403).json({ error: "Access Denied: Tenant Isolation Violation (IDOR Protection)" });
      }
    }

    if (table === 'projects' && record.code !== undefined && !record.project_code) {
      record.project_code = record.code;
    }

    const colsRes = await dbPool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1;
    `, [table]);
    const columns = colsRes.rows.map(c => c.column_name);

    const updateData: any = {};
    const BLOCKED_UPDATE_FIELDS = [
      'id', 'organization_id', 'created_at', 'updated_at', 'deleted_at',
      'created_by', 'updated_by', 'is_system', 'is_default'
    ];
    const SENSITIVE_COLUMN_BLOCKLIST: Record<string, string[]> = {
      users: ['password_hash', 'role', 'security_level', 'is_active', 'is_superuser'],
      roles: ['is_system', 'is_default'],
      organizations: ['subscription_plan', 'is_active', 'security_level'],
      system_settings: ['is_system', 'created_by'],
      user_roles: ['granted_at'],
      role_permissions: ['granted_at'],
    };
    const blockedUpdateFields = [...BLOCKED_UPDATE_FIELDS, ...(SENSITIVE_COLUMN_BLOCKLIST[table] || [])];
    for (const key of Object.keys(record)) {
      if (key !== 'id' && key !== 'organization_id' && columns.includes(key) && record[key] !== undefined && !blockedUpdateFields.includes(key)) {
        updateData[key] = record[key];
      }
    }

    if (columns.includes('updated_at')) {
      updateData['updated_at'] = new Date().toISOString();
    }

    if (table === 'users' && record.password) {
      updateData['password_hash'] = await bcrypt.hash(record.password, 10);
    }

    const keys = Object.keys(updateData);
    const values = Object.values(updateData);

    if (keys.length === 0) {
      return res.status(400).json({ error: "No valid update fields provided." });
    }

    const setClause = keys.map((k, idx) => `"${k}" = $${idx + 2}`).join(', ');
    const query = `
      UPDATE "${table}"
      SET ${setClause}
      WHERE "id" = $1
      RETURNING *;
    `;

    const result = await dbPool.query(query, [id, ...values]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: `Record with id ${id} not found in table ${table}.` });
    }

    let updatedRecord = result.rows[0];
    // SECURITY: Strip sensitive fields from response
    if (updatedRecord && (table === 'users' || SENSITIVE_TABLES.includes(table))) {
      delete updatedRecord.password_hash;
      delete updatedRecord.totp_secret;
      delete updatedRecord.refresh_token;
    }
    if (table === 'projects' && updatedRecord) {
      updatedRecord = {
        ...updatedRecord,
        code: updatedRecord.project_code
      };
    }

    apiCache.delete('dashboard-stats');
    apiCache.delete('consolidated-kpis');
    res.json(updatedRecord);
  } catch (err: any) {
    logger.error(`Error updating table ${table}`, { context: 'tables', error: err });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE a record dynamically (IDOR Protected)
router.delete('/:table/:id', authenticateToken, async (req: any, res: any) => {
  const { table, id } = req.params;
  if (!isWhitelisted(table)) {
    return res.status(403).json({ error: `Table '${table}' is not in the whitelist.` });
  }

  if (SENSITIVE_TABLES.includes(table)) {
    const callerLevel = req.user?.security_level ?? 0;
    if (callerLevel < 5) {
      return res.status(403).json({ error: `Access Denied: Deleting records in '${table}' requires maximum security level (5)` });
    }
  }

  // Policy enforcement for domain-specific tables
  try {
    const policyPool = getPool();
    const { allowed, violations } = await enforceTablePolicy(policyPool, req, table, 'DELETE');
    if (!allowed) {
      const envMode = req.headers['x-environment-mode'] || 'production';
      logTablePolicyViolation(policyPool, req, table, 'DELETE', violations, envMode);
      const blockViolations = violations.filter(v => v.severity === 'BLOCK');
      const warnViolations = violations.filter(v => v.severity === 'WARN');
      return res.status(403).json({
        error: 'Policy Violation',
        message: blockViolations[0]?.messageEn || 'Operation not allowed by policy',
        messageAr: blockViolations[0]?.messageAr || 'العملية غير مسموح بها وفقاً للسياسة',
        violations: [...blockViolations, ...warnViolations].map(v => ({
          code: v.code,
          severity: v.severity,
          messageAr: v.messageAr,
          messageEn: v.messageEn,
          policyKey: v.policyKey,
          limit: v.limit,
          currentValue: v.currentValue,
        })),
        environmentMode: envMode,
      });
    }
  } catch (policyErr) {
    logger.error('[PolicyEnforcement] Error', { context: 'policy', error: policyErr as any });
  }

  try {
    const dbPool = getPool();
    const tenantId = req.user?.org_id;
    if (!tenantId) return res.status(401).json({ error: 'Organization ID required' });

    // IDOR Check
    const hasOrgColRes = await dbPool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' AND table_name=$1 AND column_name='organization_id'
      )
    `, [table]);
    
    if (hasOrgColRes.rows[0].exists) {
      const ownerCheck = await dbPool.query(`SELECT organization_id FROM "${table}" WHERE id = $1`, [id]);
      if (ownerCheck.rows.length === 0) {
        return res.status(404).json({ error: `Record with id ${id} not found.` });
      }
      if (ownerCheck.rows[0].organization_id !== tenantId) {
        return res.status(403).json({ error: "Access Denied: Tenant Isolation Violation (IDOR Protection)" });
      }
    }
    
    const colsRes = await dbPool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' AND table_name=$1 AND column_name='deleted_at'
      )
    `, [table]);
    
    const hasDeletedAt = colsRes.rows[0].exists;
    
    let query = "";
    if (hasDeletedAt) {
      query = `UPDATE "${table}" SET deleted_at = NOW() WHERE "id" = $1 RETURNING *`;
    } else {
      query = `DELETE FROM "${table}" WHERE "id" = $1 RETURNING *`;
    }

    const result = await dbPool.query(query, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: `Record with id ${id} not found in table ${table}.` });
    }

    apiCache.delete('dashboard-stats');
    apiCache.delete('consolidated-kpis');
    const deletedRecord = result.rows[0];
    // SECURITY: Strip sensitive fields from deleted record response
    if (deletedRecord) {
      delete deletedRecord.password_hash;
      delete deletedRecord.totp_secret;
      delete deletedRecord.refresh_token;
    }
    res.json({ message: "Record deleted successfully", deletedRecord });
  } catch (err: any) {
    logger.error(`Error deleting from table ${table}`, { context: 'tables', error: err });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
