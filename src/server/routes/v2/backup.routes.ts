/**
 * NexoraOS™ — Backup & Disaster Recovery Routes
 * Extracted from server.ts for modular architecture
 */

import { Router, Response } from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { getPool } from '../../core/database';
import logger from '../../core/logger';
import { TABLE_WHITELIST, isWhitelisted } from '../../core/constants';
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
  const { TABLE_POLICY_DOMAIN } = await import('../../core/constants');
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
    const { TABLE_POLICY_DOMAIN } = await import('../../core/constants');
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

// ─── Routes ───────────────────────────────────────────────

// List all backups — SECURED: requires authentication
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const BACKUP_DIR = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const files = fs.readdirSync(BACKUP_DIR);
    const backupList = files
      .filter(file => file.endsWith('.json') && file !== 'backups_manifest.json')
      .map(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        
        let exportedBy = "System Administrator";
        let timestamp = stats.birthtime.toISOString();
        let tableCount = 0;
        let totalRecords = 0;

        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const parsed = JSON.parse(content);
          exportedBy = parsed.exported_by || "System Administrator";
          timestamp = parsed.timestamp || stats.birthtime.toISOString();
          if (parsed.tables) {
            tableCount = Object.keys(parsed.tables).length;
            totalRecords = (Object.values(parsed.tables) as any[]).reduce((sum: number, rows: any) => sum + (rows?.length || 0), 0);
          }
        } catch (e) {
          // ignore parsing error
        }

        return {
          filename: file,
          size: stats.size,
          timestamp,
          exportedBy,
          tableCount,
          totalRecords,
          downloadUrl: `/api/backups/download/${file}`
        };
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json(backupList);
  } catch (err: any) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Trigger a database backup export — SECURED: requires authentication + security level 4
router.post('/trigger', authenticateToken, async (req: any, res) => {
  if ((req.user?.security_level ?? 0) < 4) {
    return res.status(403).json({ error: 'Access Denied: Backup requires security level 4+' });
  }
  // Policy enforcement for backup
  try {
    const policyPool = getPool();
    const { allowed, violations } = await enforceTablePolicy(policyPool, req, 'audit_logs', 'CREATE');
    if (!allowed) {
      const envMode = req.headers['x-environment-mode'] || 'production';
      logTablePolicyViolation(policyPool, req, 'audit_logs', 'BACKUP', violations, envMode);
      return res.status(403).json({
        error: 'Policy Violation',
        message: violations[0]?.messageEn || 'Backup not allowed by policy',
        violations: violations.filter(v => v.severity === 'BLOCK').map(v => ({
          code: v.code, severity: v.severity, messageAr: v.messageAr, messageEn: v.messageEn,
        })),
      });
    }
  } catch (err) { /* don't block on policy errors */ }
  try {
    const dbPool = getPool();
    const backupData: any = {
      timestamp: new Date().toISOString(),
      version: "3.2.0-secure",
      exported_by: req.body.username || "System Administrator",
      tables: {}
    };

    // Query and export whitelisted tables — TENANT ISOLATED
    const tenantId = req.user?.org_id;
    if (!tenantId) return res.status(401).json({ error: 'Organization ID required' });
    await Promise.all(TABLE_WHITELIST.map(async (table) => {
      try {
        // Check if table has organization_id column for tenant isolation
        const colCheck = await dbPool.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema='public' AND table_name=$1 AND column_name='organization_id'
          )
        `, [table]);
        const hasOrgCol = colCheck.rows[0]?.exists;
        
        const result = hasOrgCol
          ? await dbPool.query(`SELECT * FROM "${table}" WHERE "organization_id" = $1`, [tenantId])
          : await dbPool.query(`SELECT * FROM "${table}"`);
        
        // SECURITY: Strip password_hash from backup exports
        backupData.tables[table] = result.rows.map((row: any) => {
          const clean = { ...row };
          delete clean.password_hash;
          delete clean.totp_secret;
          delete clean.refresh_token;
          return clean;
        });
      } catch (err: any) {
        logger.warn(`Could not export table ${table}: ${err.message}`, { context: 'backup' });
        backupData.tables[table] = []; // fallback
      }
    }));

    const BACKUP_DIR = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const randomSuffix = crypto.randomBytes(4).toString('hex');
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${timestampStr}_${randomSuffix}.json`;
    const filePath = path.join(BACKUP_DIR, filename);

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf8');

    // Create an audit log for the backup action!
    try {
      const logId = crypto.randomUUID();
      await dbPool.query(`
        INSERT INTO "audit_logs" (id, action, table_name, record_id, user_id, details, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        logId,
        'SYSTEM_BACKUP',
        'database',
        'all',
        req.body.userId || '00000000-0000-0000-0000-000000000001',
        JSON.stringify({ filename, size: fs.statSync(filePath).size, tables: Object.keys(backupData.tables) })
      ]);
    } catch (auditErr: any) {
      logger.warn(`Could not insert audit log for backup: ${auditErr.message}`, { context: 'backup' });
    }

    const totalRecords = Object.values(backupData.tables as Record<string, any[]>)
      .reduce((sum, rows) => sum + (rows?.length || 0), 0);

    res.json({
      success: true,
      filename,
      size: fs.statSync(filePath).size,
      downloadUrl: `/api/backups/download/${filename}`,
      tables: Object.keys(backupData.tables),
      tableCount: Object.keys(backupData.tables).length,
      totalRecords,
      message: "Database exported successfully."
    });
  } catch (err: any) {
    logger.error('Backup trigger failed', { context: 'backup', error: err });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Download a backup file — SECURED: requires authentication + minimum security level 4
router.get('/download/:filename', authenticateToken, async (req: any, res) => {
  const callerLevel = req.user?.security_level ?? 0;
  if (callerLevel < 4) {
    return res.status(403).json({ error: 'Access Denied: Backup download requires security level 4+' });
  }

  const { filename } = req.params;
  
  if (filename.includes('/') || filename.includes('\\') || !filename.endsWith('.json')) {
    return res.status(400).json({ error: "Invalid backup filename." });
  }

  const BACKUP_DIR = path.join(process.cwd(), 'backups');
  const filePath = path.join(BACKUP_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Backup file not found." });
  }

  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.setHeader('Content-Type', 'application/json');
  res.sendFile(filePath);
});

// Restore database from a backup — SECURED: requires authentication + highest security level
router.post('/restore', authenticateToken, async (req: any, res) => {
  if ((req.user?.security_level ?? 0) < 5) {
    return res.status(403).json({ error: 'Access Denied: Restore requires maximum security level (5)' });
  }
  // Policy enforcement for restore
  try {
    const policyPool = getPool();
    const { allowed, violations } = await enforceTablePolicy(policyPool, req, 'audit_logs', 'UPDATE');
    if (!allowed) {
      const envMode = req.headers['x-environment-mode'] || 'production';
      logTablePolicyViolation(policyPool, req, 'audit_logs', 'RESTORE', violations, envMode);
      return res.status(403).json({
        error: 'Policy Violation',
        message: violations[0]?.messageEn || 'Restore not allowed by policy',
        violations: violations.filter(v => v.severity === 'BLOCK').map(v => ({
          code: v.code, severity: v.severity, messageAr: v.messageAr, messageEn: v.messageEn,
        })),
      });
    }
  } catch (err) { /* don't block on policy errors */ }
  try {
    const dbPool = getPool();
    const { backupContent } = req.body;
    
    if (!backupContent || !backupContent.tables) {
      return res.status(400).json({ error: "Invalid backup payload: missing table data." });
    }

    const tables = backupContent.tables;
    
    // Verify all table keys are whitelisted
    const tableNames = Object.keys(tables);
    for (const table of tableNames) {
      if (!isWhitelisted(table)) {
        return res.status(403).json({ error: `Table '${table}' in backup is not whitelisted.` });
      }
    }

    const client = await dbPool.connect();
    try {
      await client.query('BEGIN');
      
      // Clear and restore tables in an appropriate order or cascade truncate
      // Whitelist sorting to avoid constraint failures when clearing/restoring
      const sortedTables = [
        'organizations',
        'organization_settings',
        'system_settings',
        'currencies',
        'roles',
        'users',
        'programs',
        'projects',
        'beneficiaries',
        'sponsorships',
        'chart_of_accounts',
        'budget_lines',
        'activities',
        'approval_requests',
        'approval_history',
        'workflow_definitions',
        'transaction_workflows',
        'approval_matrix',
        'approval_thresholds',
        'approval_delegations',
        'audit_logs',
        'user_activity_logs'
      ];

      // Filter to only tables present in the backup, in sorted dependency order
      const tablesToRestore = sortedTables.filter(t => tableNames.includes(t));
      // Truncate tables first in reverse sorted order to clear child references first
      for (let i = tablesToRestore.length - 1; i >= 0; i--) {
        const table = tablesToRestore[i];
        await client.query(`TRUNCATE TABLE "${table}" CASCADE`);
      }

      // Insert tables in dependency order
      for (const table of tablesToRestore) {
        const rows = tables[table];
        if (!Array.isArray(rows) || rows.length === 0) continue;

        const colsRes = await client.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = $1
        `, [table]);
        const validColumns = new Set(colsRes.rows.map((c: any) => c.column_name));

        // Batch inserts: process rows in chunks of 100 to avoid parameter limits
        const BATCH_SIZE = 100;
        for (let batchIdx = 0; batchIdx < rows.length; batchIdx += BATCH_SIZE) {
          const batch = rows.slice(batchIdx, batchIdx + BATCH_SIZE);
          if (batch.length === 0) continue;

          // Use first row to determine column set
          const keys = Object.keys(batch[0]).filter(k => validColumns.has(k));
          if (keys.length === 0) continue;

          const colNames = keys.map(k => `"${k}"`).join(', ');
          const allValues: any[] = [];
          const rowPlaceholders = batch.map((row: any, rowIdx: number) => {
            const cellPlaceholders = keys.map((_, colIdx) => `$${rowIdx * keys.length + colIdx + 1}`);
            keys.forEach((k) => allValues.push(row[k]));
            return `(${cellPlaceholders.join(', ')})`;
          }).join(', ');

          await client.query(`INSERT INTO "${table}" (${colNames}) VALUES ${rowPlaceholders}`, allValues);
        }
      }

      await client.query('COMMIT');
      
      // Audit log the restore!
      try {
        const logId = crypto.randomUUID();
        await dbPool.query(`
          INSERT INTO "audit_logs" (id, action, table_name, record_id, user_id, details, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, [
          logId,
          'SYSTEM_RESTORE',
          'database',
          'all',
          req.body.userId || '00000000-0000-0000-0000-000000000001',
          JSON.stringify({ timestamp: backupContent.timestamp, version: backupContent.version })
        ]);
      } catch (auditErr) {
        // ignore
      }

      res.json({ success: true, message: "Database restored successfully." });
    } catch (transactionErr: any) {
      await client.query('ROLLBACK');
      throw transactionErr;
    } finally {
      client.release();
    }
  } catch (err: any) {
    logger.error('Backup restore failed', { context: 'backup', error: err });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete a backup file — SECURED: requires authentication + security level 5
router.delete('/:filename', authenticateToken, async (req: any, res) => {
  const callerLevel = req.user?.security_level ?? 0;
  if (callerLevel < 5) {
    return res.status(403).json({ error: 'Access Denied: Backup deletion requires maximum security level (5)' });
  }

  const { filename } = req.params;
  
  if (filename.includes('/') || filename.includes('\\') || !filename.endsWith('.json')) {
    return res.status(400).json({ error: "Invalid backup filename." });
  }

  const BACKUP_DIR = path.join(process.cwd(), 'backups');
  const filePath = path.join(BACKUP_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Backup file not found." });
  }

  try {
    fs.unlinkSync(filePath);
    res.json({ message: "Backup file deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
