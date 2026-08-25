
// NEB-10: Finance & Compliance OS - Financial Report Approval Service
import { DigitalSignature } from '../security/signature';

export interface FinancialReport {
  id: string;
  type: 'annual' | 'quarterly' | 'monthly';
  period: string;
  data_hash: string;
}

export async function approveFinancialReport(
  reportId: string,
  signature: DigitalSignature,
  approver?: { email?: string; name?: string; role?: string }
): Promise<{ success: boolean; message: string }> {
  // Persist the approval decision as an immutable audit trail record.
  try {
    const res = await fetch('/api/tables/audit_logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_email: approver?.email || signature.user_id,
        user_name: approver?.name || '',
        user_role: approver?.role || '',
        action_type: 'REPORT_APPROVED',
        action_ar: `اعتماد التقرير المالي ${reportId}`,
        action_en: `Financial report ${reportId} approved`,
        module: 'finance',
        severity: 'high',
        target_resource: reportId,
        status: 'success',
        timestamp: new Date().toISOString(),
        details: JSON.stringify(signature)
      })
    });
    if (!res.ok) throw new Error(`Audit write failed (${res.status})`);
    return {
      success: true,
      message: 'Report approval recorded in the audit ledger.'
    };
  } catch (err) {
    console.error('[reportApproval] Failed to record approval:', err);
    return {
      success: false,
      message: 'Could not record the approval. Please retry.'
    };
  }
}
