import { getDatabasePool } from './db.service';
import { serverConfig } from '../config/index';

export interface AuditLogPayload {
  organizationId?: string;
  userId?: string;
  action: string;
  tableName: string;
  recordId?: string;
  ipAddress?: string;
  details?: Record<string, any>;
}

function resolveIpAddress(payload: AuditLogPayload): string {
  if (payload.ipAddress) return payload.ipAddress;
  return '127.0.0.1';
}

export async function recordAuditLog(payload: AuditLogPayload): Promise<void> {
  try {
    const pool = getDatabasePool();
    const isUuid = payload.recordId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.recordId);
    await pool.query(`
      INSERT INTO audit_logs (
        organization_id, user_id, action, entity_type, entity_id, ip_address, new_values, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [
      payload.organizationId || serverConfig.defaultOrgId,
      payload.userId || null,
      payload.action,
      payload.tableName,
      isUuid ? payload.recordId : null,
      resolveIpAddress(payload),
      JSON.stringify(payload.details || {})
    ]);
  } catch (err: any) {
    console.warn('Audit log recording error:', err.message);
  }
}
