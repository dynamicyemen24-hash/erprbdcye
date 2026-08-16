import { AuditLogItem, ActionType } from '../components/AuditLogsView';

export async function logAuditEvent(
  email: string,
  name: string,
  role: string,
  actionType: ActionType,
  actionAr: string,
  actionEn: string,
  module: 'finance' | 'projects' | 'sponsorships' | 'admin' | 'security' | 'beneficiaries',
  severity: 'low' | 'medium' | 'high' | 'critical',
  targetResource: string,
  status: 'success' | 'failed' | 'flagged' = 'success'
) {
  const payload: Partial<AuditLogItem> = {
    user_email: email,
    user_name: name,
    user_role: role,
    action_type: actionType,
    action_ar: actionAr,
    action_en: actionEn,
    module,
    severity,
    target_resource: targetResource,
    status,
    timestamp: new Date().toISOString(),
    ip_address: '127.0.0.1', // Should be populated by backend in real prod
    location: 'Sana\'a, Yemen' // Should be populated by backend in real prod
  };

  try {
    await fetch('/api/tables/audit_logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('Failed to log audit event:', err);
  }
}
