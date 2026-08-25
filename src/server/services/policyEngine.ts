/**
 * NexoraOS™ — Policy Engine Service
 * Central enforcement of operational policies, compliance rules, and workflow constraints.
 * Reads from system_settings & organization_settings tables and enforces in real-time.
 * Integrates entity-level policies from entityPolicies.ts for type-specific validation.
 */

import pg from 'pg';
import logger from '../core/logger';
import {
  validateEntityPolicy,
  getEntityPolicy,
  type EntityTypeKey,
  type BeneficiaryTypePolicy,
  type ActivityTypePolicy,
  type SponsorshipTypePolicy,
  type DisbursementMethodPolicy,
  type ProjectTypePolicy,
  type DonorTypePolicy,
  type TransactionTypePolicy,
} from '../../core/config/entityPolicies';

export interface PolicyContext {
  organizationId: string;
  userId: string;
  securityLevel: number;
  role: string;
  branchId?: string;
}

export interface PolicyViolation {
  code: string;
  severity: 'BLOCK' | 'WARN' | 'INFO';
  messageAr: string;
  messageEn: string;
  policyKey: string;
  currentValue?: any;
  limit?: any;
}

// ─────────────────────────────────────────────
// In-memory policy cache (refreshed every 5 min)
// ─────────────────────────────────────────────
let policyCache: Map<string, Record<string, any>> = new Map();
let lastCacheRefresh = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function loadPolicies(pool: pg.Pool, orgId: string): Promise<Record<string, any>> {
  const cacheKey = `org_${orgId}`;
  const now = Date.now();

  if (policyCache.has(cacheKey) && (now - lastCacheRefresh) < CACHE_TTL_MS) {
    return policyCache.get(cacheKey)!;
  }

  try {
    // Load system-wide policies
    const sysRes = await pool.query(
      `SELECT setting_key, setting_value, setting_type FROM system_settings`
    );

    // Load org-specific policies
    const orgRes = await pool.query(
      `SELECT setting_key, setting_value, setting_type FROM organization_settings WHERE organization_id = $1`,
      [orgId]
    );

    const policies: Record<string, any> = {};

    for (const row of sysRes.rows) {
      policies[row.setting_key] = parseSettingValue(row.setting_value, row.setting_type);
    }
    for (const row of orgRes.rows) {
      policies[`org:${row.setting_key}`] = parseSettingValue(row.setting_value, row.setting_type);
    }

    policyCache.set(cacheKey, policies);
    lastCacheRefresh = now;
    return policies;
  } catch (err) {
    logger.error('[PolicyEngine] Failed to load policies', { context: 'policy', error: err as any });
    return policyCache.get(cacheKey) || {};
  }
}

function parseSettingValue(value: string, type: string): any {
  if (type === 'boolean') return value === 'true';
  if (type === 'number') return Number(value);
  if (type === 'json') {
    try { return JSON.parse(value); } catch { return value; }
  }
  return value;
}

export function clearPolicyCache(orgId?: string) {
  if (orgId) {
    policyCache.delete(`org_${orgId}`);
  } else {
    policyCache.clear();
  }
}

// ─────────────────────────────────────────────
// POLICY ENFORCEMENT FUNCTIONS
// ─────────────────────────────────────────────

/**
 * Enforce approval tier limits based on transaction amount.
 * Returns violations if user exceeds their authorization level.
 */
export async function enforceApprovalLimits(
  pool: pg.Pool,
  ctx: PolicyContext,
  amount: number,
  currencyCode: string = 'YER'
): Promise<PolicyViolation[]> {
  const policies = await loadPolicies(pool, ctx.organizationId);
  const violations: PolicyViolation[] = [];

  // Get user's max approval amount from users table
  try {
    const userRes = await pool.query(
      `SELECT max_approval_amount, can_approve FROM users WHERE id = $1`,
      [ctx.userId]
    );

    if (userRes.rows.length > 0) {
      const user = userRes.rows[0];
      if (!user.can_approve) {
        violations.push({
          code: 'APPROVAL_UNAUTHORIZED',
          severity: 'BLOCK',
          messageAr: 'ليس لديك صلاحية الموافقة على المعاملات المالية',
          messageEn: 'You are not authorized to approve financial transactions',
          policyKey: 'can_approve',
          currentValue: false,
          limit: true,
        });
      } else if (amount > user.max_approval_amount) {
        violations.push({
          code: 'APPROVAL_LIMIT_EXCEEDED',
          severity: 'BLOCK',
          messageAr: `المبلغ ${amount.toLocaleString()} يتجاوز حد الموافقة ${user.max_approval_amount.toLocaleString()}`,
          messageEn: `Amount ${amount.toLocaleString()} exceeds your approval limit of ${user.max_approval_amount.toLocaleString()}`,
          policyKey: 'max_approval_amount',
          currentValue: amount,
          limit: user.max_approval_amount,
        });
      }
    }
  } catch (err) {
    logger.error('[PolicyEngine] Approval limit check failed', { context: 'policy', error: err as any });
  }

  // Check org-level tier limits
  const tier1Limit = policies['org:PROC_APPROVAL_TIER_1_LIMIT_YER'] || 1000000;
  const tier2Limit = policies['org:PROC_APPROVAL_TIER_2_LIMIT_YER'] || 10000000;
  const tier3Limit = policies['org:PROC_APPROVAL_TIER_3_LIMIT_YER'] || 50000000;

  if (amount > tier3Limit && ctx.securityLevel < 5) {
    violations.push({
      code: 'TIER_3_REQUIRES_EXECUTIVE',
      severity: 'BLOCK',
      messageAr: `المعاملات فوق ${tier3Limit.toLocaleString()} تتطلب موافقة تنفيذية (مستوى 5)`,
      messageEn: `Transactions above ${tier3Limit.toLocaleString()} require executive approval (Level 5)`,
      policyKey: 'PROC_APPROVAL_TIER_3_LIMIT_YER',
      currentValue: amount,
      limit: tier3Limit,
    });
  } else if (amount > tier2Limit && ctx.securityLevel < 4) {
    violations.push({
      code: 'TIER_2_REQUIRES_MANAGER',
      severity: 'BLOCK',
      messageAr: `المعاملات فوق ${tier2Limit.toLocaleString()} تتطلب موافقة إدارية (مستوى 4)`,
      messageEn: `Transactions above ${tier2Limit.toLocaleString()} require manager approval (Level 4)`,
      policyKey: 'PROC_APPROVAL_TIER_2_LIMIT_YER',
      currentValue: amount,
      limit: tier2Limit,
    });
  } else if (amount > tier1Limit && ctx.securityLevel < 3) {
    violations.push({
      code: 'TIER_1_REQUIRES_LEAD',
      severity: 'BLOCK',
      messageAr: `المعاملات فوق ${tier1Limit.toLocaleString()} تتطلب موافقة رئيس قسم (مستوى 3)`,
      messageEn: `Transactions above ${tier1Limit.toLocaleString()} require lead approval (Level 3)`,
      policyKey: 'PROC_APPROVAL_TIER_1_LIMIT_YER',
      currentValue: amount,
      limit: tier1Limit,
    });
  }

  return violations;
}

/**
 * Enforce IPSAS double-entry accounting rules.
 * Validates that debits equal credits and journals are balanced.
 */
export async function enforceIPSASCompliance(
  pool: pg.Pool,
  ctx: PolicyContext,
  journalLines: Array<{ debit: number; credit: number; accountId: string }>
): Promise<PolicyViolation[]> {
  const policies = await loadPolicies(pool, ctx.organizationId);
  const violations: PolicyViolation[] = [];

  const totalDebit = journalLines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = journalLines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);

  // Check if unbalanced journals are allowed
  const allowUnbalanced = policies['fin_unbalanced_journals_allowed'] ?? false;

  if (!allowUnbalanced && Math.abs(totalDebit - totalCredit) > 0.01) {
    violations.push({
      code: 'JOURNAL_UNBALANCED',
      severity: 'BLOCK',
      messageAr: `قيود غير متوازنة: إجمالي المدين ${totalDebit.toLocaleString()} ≠ إجمالي الدائن ${totalCredit.toLocaleString()}`,
      messageEn: `Unbalanced journal: Total debit ${totalDebit.toLocaleString()} ≠ Total credit ${totalCredit.toLocaleString()}`,
      policyKey: 'fin_unbalanced_journals_allowed',
      currentValue: { debit: totalDebit, credit: totalCredit },
      limit: 'Debit must equal Credit',
    });
  }

  // Check if any line has both debit and credit
  for (const line of journalLines) {
    if ((Number(line.debit) || 0) > 0 && (Number(line.credit) || 0) > 0) {
      violations.push({
        code: 'LINE_BOTH_SIDES',
        severity: 'BLOCK',
        messageAr: 'القيد يحتوي على مدين ودائن في نفس السطر',
        messageEn: 'Journal line has both debit and credit amounts',
        policyKey: 'fin_unbalanced_journals_allowed',
      });
    }
  }

  // Check petty cash limit
  const pettyCashMax = policies['fin_petty_cash_max_limit_yer'] || 5000000;
  if (totalDebit > pettyCashMax) {
    violations.push({
      code: 'PETTY_CASH_EXCEEDED',
      severity: 'WARN',
      messageAr: `المبلغ ${totalDebit.toLocaleString()} يتجاوز حد صندوق المصروفات النثرية ${pettyCashMax.toLocaleString()}`,
      messageEn: `Amount ${totalDebit.toLocaleString()} exceeds petty cash limit of ${pettyCashMax.toLocaleString()}`,
      policyKey: 'fin_petty_cash_max_limit_yer',
      currentValue: totalDebit,
      limit: pettyCashMax,
    });
  }

  return violations;
}

/**
 * Enforce procurement three-way match (PO → Receipt → Invoice).
 * Tolerance percentage is configurable.
 */
export async function enforceProcurementMatch(
  pool: pg.Pool,
  ctx: PolicyContext,
  purchaseOrderId: string,
  invoiceAmount: number,
  receivedAmount: number
): Promise<PolicyViolation[]> {
  const policies = await loadPolicies(pool, ctx.organizationId);
  const violations: PolicyViolation[] = [];

  const tolerancePct = policies['proc_three_way_match_tolerance_pct'] ?? 1.5;

  if (receivedAmount === 0) {
    violations.push({
      code: 'NO_RECEIPT_CONFIRMED',
      severity: 'BLOCK',
      messageAr: 'لم يتم تأكيد استلام البضاعة بعد',
      messageEn: 'Goods receipt has not been confirmed',
      policyKey: 'proc_three_way_match_tolerance_pct',
    });
  }

  if (invoiceAmount > 0 && receivedAmount > 0) {
    const variancePct = Math.abs((invoiceAmount - receivedAmount) / receivedAmount) * 100;
    if (variancePct > tolerancePct) {
      violations.push({
        code: 'THREE_WAY_MISMATCH',
        severity: variancePct > tolerancePct * 2 ? 'BLOCK' : 'WARN',
        messageAr: `فرق ${variancePct.toFixed(1)}% بين فاتورة المورد (${invoiceAmount.toLocaleString()}) والاستلام (${receivedAmount.toLocaleString()}) — التolerance المسموح ${tolerancePct}%`,
        messageEn: `Variance ${variancePct.toFixed(1)}% between vendor invoice (${invoiceAmount.toLocaleString()}) and receipt (${receivedAmount.toLocaleString()}) — allowed tolerance ${tolerancePct}%`,
        policyKey: 'proc_three_way_match_tolerance_pct',
        currentValue: variancePct,
        limit: tolerancePct,
      });
    }
  }

  // Check minimum RFQ bids
  const minBids = policies['proc_min_rfq_vendor_bids'] || 3;
  try {
    const bidRes = await pool.query(
      `SELECT COUNT(*) as bid_count FROM vendor_bids WHERE purchase_order_id = $1`,
      [purchaseOrderId]
    );
    const bidCount = Number(bidRes.rows[0]?.bid_count || 0);
    if (bidCount > 0 && bidCount < minBids) {
      violations.push({
        code: 'INSUFFICIENT_RFQ_BIDS',
        severity: 'WARN',
        messageAr: `عدد العروض ${bidCount} أقل من الحد الأدنى ${minBids}`,
        messageEn: `Bid count ${bidCount} is below minimum ${minBids} required`,
        policyKey: 'proc_min_rfq_vendor_bids',
        currentValue: bidCount,
        limit: minBids,
      });
    }
  } catch (err) { /* table may not exist */ }

  return violations;
}

/**
 * Enforce beneficiary data protection and Sphere standards.
 */
export async function enforceBeneficiaryPolicy(
  pool: pg.Pool,
  ctx: PolicyContext,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  beneficiaryData?: any
): Promise<PolicyViolation[]> {
  const policies = await loadPolicies(pool, ctx.organizationId);
  const violations: PolicyViolation[] = [];

  // National ID deduplication check
  const dedupCheck = policies['serv_national_id_dedup_check'] ?? true;
  if (dedupCheck && action === 'CREATE' && beneficiaryData?.national_id) {
    try {
      const dupRes = await pool.query(
        `SELECT COUNT(*) as cnt FROM beneficiaries WHERE national_id = $1 AND deleted_at IS NULL`,
        [beneficiaryData.national_id]
      );
      if (Number(dupRes.rows[0]?.cnt || 0) > 0) {
        violations.push({
          code: 'BENEFICIARY_DUPLICATE_NATIONAL_ID',
          severity: 'BLOCK',
          messageAr: `رقم الهوية الوطنية ${beneficiaryData.national_id} مسجل مسبقاً`,
          messageEn: `National ID ${beneficiaryData.national_id} already exists in the system`,
          policyKey: 'serv_national_id_dedup_check',
        });
      }
    } catch (err) { /* table may not have national_id column */ }
  }

  // Vulnerability reassessment check
  const reassessDays = policies['serv_vulnerability_reassess_days'] || 180;
  if (action === 'UPDATE' && beneficiaryData?.last_vulnerability_assessment) {
    const lastAssess = new Date(beneficiaryData.last_vulnerability_assessment);
    const daysSince = Math.floor((Date.now() - lastAssess.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > reassessDays) {
      violations.push({
        code: 'VULNERABILITY_REASSESSMENT_DUE',
        severity: 'WARN',
        messageAr: `تقييم الحساسية مستحق منذ ${daysSince} يوم (الحد ${reassessDays} يوم)`,
        messageEn: `Vulnerability reassessment overdue by ${daysSince} days (threshold: ${reassessDays})`,
        policyKey: 'serv_vulnerability_reassess_days',
        currentValue: daysSince,
        limit: reassessDays,
      });
    }
  }

  return violations;
}

/**
 * Enforce HR policies (probation, appraisal, leave).
 */
export async function enforceHRPolicy(
  pool: pg.Pool,
  ctx: PolicyContext,
  employeeId: string,
  action: string
): Promise<PolicyViolation[]> {
  const policies = await loadPolicies(pool, ctx.organizationId);
  const violations: PolicyViolation[] = [];

  const probationMonths = policies['hr_probation_period_months'] || 3;
  const appraisalInterval = policies['hr_appraisal_interval_months'] || 6;

  if (action === 'PROMOTION' || action === 'TRANSFER') {
    try {
      const empRes = await pool.query(
        `SELECT created_at, last_appraisal_date FROM hr_staff WHERE id = $1`,
        [employeeId]
      );
      if (empRes.rows.length > 0) {
        const emp = empRes.rows[0];
        const hireDate = new Date(emp.created_at);
        const monthsSinceHire = (Date.now() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

        if (monthsSinceHire < probationMonths) {
          violations.push({
            code: 'STILL_IN_PROBATION',
            severity: 'BLOCK',
            messageAr: `الموظف لا يزال في فترة التجربة (${Math.floor(monthsSinceHire)} شهر من ${probationMonths} مطلوب)`,
            messageEn: `Employee is still in probation period (${Math.floor(monthsSinceHire)} months of ${probationMonths} required)`,
            policyKey: 'hr_probation_period_months',
            currentValue: Math.floor(monthsSinceHire),
            limit: probationMonths,
          });
        }

        if (emp.last_appraisal_date) {
          const lastAppraisal = new Date(emp.last_appraisal_date);
          const monthsSinceAppraisal = (Date.now() - lastAppraisal.getTime()) / (1000 * 60 * 60 * 24 * 30);
          if (monthsSinceAppraisal > appraisalInterval + 1) {
            violations.push({
              code: 'APPRAISAL_OVERDUE',
              severity: 'WARN',
              messageAr: `تقييم الأداء متأخر (${Math.floor(monthsSinceAppraisal)} شهر من آخر تقييم)`,
              messageEn: `Performance appraisal overdue (${Math.floor(monthsSinceAppraisal)} months since last appraisal)`,
              policyKey: 'hr_appraisal_interval_months',
              currentValue: Math.floor(monthsSinceAppraisal),
              limit: appraisalInterval,
            });
          }
        }
      }
    } catch (err) { /* table may not exist */ }
  }

  return violations;
}

/**
 * Enforce document retention policy.
 */
export async function enforceRetentionPolicy(
  pool: pg.Pool,
  ctx: PolicyContext
): Promise<PolicyViolation[]> {
  const policies = await loadPolicies(pool, ctx.organizationId);
  const violations: PolicyViolation[] = [];

  const retentionYears = policies['doc_retention_policy_years'] || 10;
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - retentionYears);

  try {
    const oldAuditRes = await pool.query(
      `SELECT COUNT(*) as cnt FROM audit_logs WHERE created_at < $1`,
      [cutoffDate.toISOString()]
    );
    const oldCount = Number(oldAuditRes.rows[0]?.cnt || 0);
    if (oldCount > 0) {
      violations.push({
        code: 'AUDIT_LOGS_RETENTION_DUE',
        severity: 'INFO',
        messageAr: `${oldCount} سجل تدقيق عمرها أكثر من ${retentionYears} سنة جاهز للأرشفة`,
        messageEn: `${oldCount} audit log records older than ${retentionYears} years are due for archival`,
        policyKey: 'doc_retention_policy_years',
        currentValue: oldCount,
        limit: retentionYears,
      });
    }
  } catch (err) { /* table may not exist */ }

  return violations;
}

/**
 * Enforce field app sync policies.
 * Validates data integrity for offline-to-online synchronization.
 */
export async function enforceFieldSyncPolicy(
  pool: pg.Pool,
  ctx: PolicyContext,
  syncPayload: {
    entityType: string;
    action: string;
    data: any;
    deviceId: string;
    timestamp: string;
  }
): Promise<PolicyViolation[]> {
  const violations: PolicyViolation[] = [];

  // Validate device is enrolled in the field device registry
  try {
    const deviceRes = await pool.query(
      `SELECT id, status FROM field_devices WHERE device_id = $1 LIMIT 1`,
      [syncPayload.deviceId]
    );
    const device = deviceRes.rows[0];
    if (!device) {
      violations.push({
        code: 'DEVICE_NOT_ENROLLED',
        severity: 'BLOCK',
        messageAr: `الجهاز "${syncPayload.deviceId}" غير مسجل في سجل الأجهزة الميدانية — لا يمكن المزامنة`,
        messageEn: `Device "${syncPayload.deviceId}" is not enrolled in the field device registry — sync denied`,
        policyKey: 'field_sync_device_registry',
      });
    } else if (device.status === 'BLOCKED' || device.status === 'RETIRED') {
      violations.push({
        code: 'DEVICE_BLOCKED',
        severity: 'BLOCK',
        messageAr: `الجهاز "${syncPayload.deviceId}" محجوب أو متقاعد (${device.status})`,
        messageEn: `Device "${syncPayload.deviceId}" is ${device.status} and cannot sync`,
        policyKey: 'field_sync_device_registry',
      });
    } else {
      // Heartbeat: record the successful sync attempt time
      await pool.query(
        `UPDATE field_devices SET last_seen_at = NOW(), updated_at = NOW() WHERE device_id = $1`,
        [syncPayload.deviceId]
      ).catch((err) => { logger.warn(`[PolicyEngine] Failed to update device heartbeat: ${err.message}`, { context: 'policy' }); });
    }
  } catch (err) { /* field_devices may not exist yet on legacy databases */ }

  // Validate entity type is allowed for field sync
  const allowedEntityTypes = [
    'beneficiary', 'service_delivery', 'aid_distribution',
    'activity', 'volunteer_task', 'geographic_area',
    'project_schedule', 'milestone'
  ];

  if (!allowedEntityTypes.includes(syncPayload.entityType)) {
    violations.push({
      code: 'ENTITY_TYPE_NOT_SYNCABLE',
      severity: 'BLOCK',
      messageAr: `نوع الكيان "${syncPayload.entityType}" غير مسموح به للمزامنة الميدانية`,
      messageEn: `Entity type "${syncPayload.entityType}" is not allowed for field sync`,
      policyKey: 'field_sync_allowed_entities',
    });
  }

  // Validate timestamp is not too old (72 hours max for field data)
  const syncTimestamp = new Date(syncPayload.timestamp);
  const hoursSince = (Date.now() - syncTimestamp.getTime()) / (1000 * 60 * 60);
  if (hoursSince > 72) {
    violations.push({
      code: 'SYNC_DATA_STALE',
      severity: 'WARN',
      messageAr: `بيانات المزامنة عمرها ${Math.floor(hoursSince)} ساعة — الحد الأقصى 72 ساعة`,
      messageEn: `Sync data is ${Math.floor(hoursSince)} hours old — maximum is 72 hours`,
      policyKey: 'field_sync_max_age_hours',
      currentValue: Math.floor(hoursSince),
      limit: 72,
    });
  }

  // Validate GPS coordinates if present
  if (syncPayload.data?.latitude && syncPayload.data?.longitude) {
    const lat = Number(syncPayload.data.latitude);
    const lng = Number(syncPayload.data.longitude);
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      violations.push({
        code: 'INVALID_GPS_COORDINATES',
        severity: 'BLOCK',
        messageAr: 'إحداثيات GPS غير صالحة',
        messageEn: 'Invalid GPS coordinates provided',
        policyKey: 'field_gps_validation',
      });
    }
  }

  // Run entity-specific policy validation for syncable entity types
  // This ensures field data conforms to the same entity policies as API-created data
  const entityTypeMap: Record<string, { entityType: EntityTypeKey; subtypeField: string }> = {
    beneficiary: { entityType: 'beneficiaries', subtypeField: 'category' },
    activity: { entityType: 'activities', subtypeField: 'sector' },
    service_delivery: { entityType: 'activities', subtypeField: 'sector' },
  };

  const entityMapping = entityTypeMap[syncPayload.entityType];
  if (entityMapping && syncPayload.data) {
    const subtype = syncPayload.data[entityMapping.subtypeField];
    if (subtype) {
      const action = syncPayload.action === 'DELETE' ? 'DELETE' : 'CREATE';
      violations.push(...await enforceEntityPolicies(
        entityMapping.entityType,
        subtype,
        syncPayload.data,
        action
      ));
    }
  }

  // Run disbursement-specific validation if syncing disbursement data
  if (syncPayload.entityType === 'aid_distribution' && syncPayload.data) {
    const { disbursement_method, amount, witness_count, latitude, longitude, photo_url } = syncPayload.data;
    if (disbursement_method) {
      violations.push(...validateDisbursementPolicy(
        disbursement_method,
        amount || 0,
        witness_count || 0,
        !!(latitude && longitude),
        !!photo_url
      ));
    }
  }

  return violations;
}

/**
 * Validate entity against type-specific policies from entityPolicies.ts.
 * Converts entity policy violations to PolicyViolation format.
 */
export async function enforceEntityPolicies(
  entityType: EntityTypeKey,
  subtype: string,
  entityData: Record<string, any>,
  action: 'CREATE' | 'UPDATE' | 'DELETE'
): Promise<PolicyViolation[]> {
  const violations: PolicyViolation[] = [];

  // Skip entity validation for DELETE (no data to validate)
  if (action === 'DELETE') return violations;

  const entityViolations = validateEntityPolicy(entityType, subtype, entityData);
  for (const v of entityViolations) {
    violations.push({
      code: v.code,
      severity: v.severity,
      messageAr: v.messageAr,
      messageEn: v.messageEn,
      policyKey: `${entityType}:${subtype}`,
    });
  }

  return violations;
}

/**
 * Validate disbursement against method-specific policies.
 */
export function validateDisbursementPolicy(
  method: string,
  amount: number,
  witnessCount: number,
  hasGps: boolean,
  hasPhoto: boolean
): PolicyViolation[] {
  const policy = getEntityPolicy('disbursements', method) as DisbursementMethodPolicy | null;
  if (!policy) return [];

  const violations: PolicyViolation[] = [];

  if (amount > policy.maxAmountPerTransactionYer) {
    violations.push({
      code: 'DISBURSEMENT_MAX_EXCEEDED',
      severity: 'BLOCK',
      messageAr: `مبلغ الصرف ${amount.toLocaleString()} يتجاوز الحد ${policy.maxAmountPerTransactionYer.toLocaleString()} لطريقة ${policy.labelAr}`,
      messageEn: `Disbursement amount ${amount.toLocaleString()} exceeds limit ${policy.maxAmountPerTransactionYer.toLocaleString()} for ${policy.labelEn}`,
      policyKey: `disbursements:${method}:maxAmountPerTransactionYer`,
      currentValue: amount,
      limit: policy.maxAmountPerTransactionYer,
    });
  }

  if (policy.requiresWitness && witnessCount < policy.witnessCount) {
    violations.push({
      code: 'INSUFFICIENT_WITNESSES',
      severity: 'BLOCK',
      messageAr: `عدد الشهود ${witnessCount} أقل من المطلوب ${policy.witnessCount} لطريقة ${policy.labelAr}`,
      messageEn: `Witness count ${witnessCount} is below required ${policy.witnessCount} for ${policy.labelEn}`,
      policyKey: `disbursements:${method}:witnessCount`,
      currentValue: witnessCount,
      limit: policy.witnessCount,
    });
  }

  if (policy.requiresGPS && !hasGps) {
    violations.push({
      code: 'GPS_REQUIRED',
      severity: 'BLOCK',
      messageAr: `إحداثيات GPS مطلوبة لطريقة الصرف ${policy.labelAr}`,
      messageEn: `GPS coordinates are required for ${policy.labelEn} disbursement`,
      policyKey: `disbursements:${method}:requiresGPS`,
    });
  }

  if (policy.requiresPhoto && !hasPhoto) {
    violations.push({
      code: 'PHOTO_REQUIRED',
      severity: 'BLOCK',
      messageAr: `توثيق بالصورة مطلوب لطريقة الصرف ${policy.labelAr}`,
      messageEn: `Photo documentation is required for ${policy.labelEn} disbursement`,
      policyKey: `disbursements:${method}:requiresPhoto`,
    });
  }

  return violations;
}

/**
 * Validate transaction against type-specific policies.
 */
export function validateTransactionPolicy(
  transactionType: string,
  amount: number,
  backdatingDays: number = 0,
  hasDescription: boolean = true,
  hasReference: boolean = true
): PolicyViolation[] {
  const policy = getEntityPolicy('transactions', transactionType) as TransactionTypePolicy | null;
  if (!policy) return [];

  const violations: PolicyViolation[] = [];

  if (policy.maxAmountYer > 0 && amount > policy.maxAmountYer) {
    violations.push({
      code: 'TRANSACTION_MAX_EXCEEDED',
      severity: 'BLOCK',
      messageAr: `المبلغ ${amount.toLocaleString()} يتجاوز الحد ${policy.maxAmountYer.toLocaleString()} لنوع المعاملة ${policy.labelAr}`,
      messageEn: `Amount ${amount.toLocaleString()} exceeds limit ${policy.maxAmountYer.toLocaleString()} for ${policy.labelEn}`,
      policyKey: `transactions:${transactionType}:maxAmountYer`,
      currentValue: amount,
      limit: policy.maxAmountYer,
    });
  }

  if (policy.requiresDescription && !hasDescription) {
    violations.push({
      code: 'DESCRIPTION_REQUIRED',
      severity: 'BLOCK',
      messageAr: `الوصف مطلوب لنوع المعاملة ${policy.labelAr}`,
      messageEn: `Description is required for ${policy.labelEn}`,
      policyKey: `transactions:${transactionType}:requiresDescription`,
    });
  }

  if (policy.requiresReferenceNo && !hasReference) {
    violations.push({
      code: 'REFERENCE_REQUIRED',
      severity: 'BLOCK',
      messageAr: `رقم المرجع مطلوب لنوع المعاملة ${policy.labelAr}`,
      messageEn: `Reference number is required for ${policy.labelEn}`,
      policyKey: `transactions:${transactionType}:requiresReferenceNo`,
    });
  }

  if (!policy.allowsBackdating && backdatingDays > 0) {
    violations.push({
      code: 'BACKDATING_NOT_ALLOWED',
      severity: 'BLOCK',
      messageAr: `التاريخ الخلفي غير مسموح لنوع المعاملة ${policy.labelAr}`,
      messageEn: `Backdating is not allowed for ${policy.labelEn}`,
      policyKey: `transactions:${transactionType}:allowsBackdating`,
    });
  } else if (policy.allowsBackdating && backdatingDays > policy.maxBackdatingDays) {
    violations.push({
      code: 'BACKDATING_LIMIT_EXCEEDED',
      severity: 'BLOCK',
      messageAr: `التاريخ الخلفي ${backdatingDays} يوم يتجاوز الحد ${policy.maxBackdatingDays} يوم`,
      messageEn: `Backdating ${backdatingDays} days exceeds limit ${policy.maxBackdatingDays} days`,
      policyKey: `transactions:${transactionType}:maxBackdatingDays`,
      currentValue: backdatingDays,
      limit: policy.maxBackdatingDays,
    });
  }

  return violations;
}

/**
 * Master policy enforcement function.
 * Runs all applicable policy checks for a given context and action.
 */
export async function enforceAllPolicies(
  pool: pg.Pool,
  ctx: PolicyContext,
  domain: string,
  action: string,
  payload: any
): Promise<{ allowed: boolean; violations: PolicyViolation[] }> {
  let violations: PolicyViolation[] = [];

  switch (domain) {
    case 'finance':
    case 'transactions':
      if (action === 'CREATE' || action === 'APPROVE') {
        violations = [
          ...(await enforceApprovalLimits(pool, ctx, payload.totalDebit || payload.amount || 0)),
          ...(await enforceIPSASCompliance(pool, ctx, payload.lines || [])),
        ];

        // Add transaction type-specific validation
        if (payload.transaction_type) {
          const backdatingDays = payload.transaction_date && payload.date
            ? Math.floor((new Date(payload.date).getTime() - new Date(payload.transaction_date).getTime()) / (1000 * 60 * 60 * 24))
            : 0;
          violations.push(...validateTransactionPolicy(
            payload.transaction_type,
            payload.totalDebit || payload.amount || 0,
            backdatingDays,
            !!payload.description,
            !!payload.reference_no
          ));
        }
      }
      break;

    case 'procurement':
    case 'purchase_orders':
      if (action === 'APPROVE') {
        violations = await enforceProcurementMatch(
          pool, ctx, payload.id, payload.invoiceAmount || 0, payload.receivedAmount || 0
        );
      }
      break;

    case 'beneficiaries':
      violations = await enforceBeneficiaryPolicy(pool, ctx, action as any, payload);
      // Add entity type-specific validation
      if (payload.category) {
        violations.push(...await enforceEntityPolicies('beneficiaries', payload.category, payload, action as any));
      }
      break;

    case 'activities':
      if (payload.sector) {
        violations.push(...await enforceEntityPolicies('activities', payload.sector, payload, action as any));
      }
      break;

    case 'sponsorships':
      if (payload.sponsorship_type) {
        violations.push(...await enforceEntityPolicies('sponsorships', payload.sponsorship_type, payload, action as any));
      }
      break;

    case 'disbursements':
      if (payload.disbursement_method) {
        violations.push(...validateDisbursementPolicy(
          payload.disbursement_method,
          payload.amount || 0,
          payload.witness_count || 0,
          !!(payload.latitude && payload.longitude),
          !!payload.photo_url
        ));
      }
      break;

    case 'projects':
      if (payload.project_type) {
        violations.push(...await enforceEntityPolicies('projects', payload.project_type, payload, action as any));
      }
      break;

    case 'donors':
      if (payload.donor_type) {
        violations.push(...await enforceEntityPolicies('donors', payload.donor_type, payload, action as any));
      }
      break;

    case 'hr_staff':
    case 'hr':
      if (action === 'PROMOTION' || action === 'TRANSFER') {
        violations = await enforceHRPolicy(pool, ctx, payload.employeeId || payload.id, action);
      }
      break;

    case 'field_sync':
      violations = await enforceFieldSyncPolicy(pool, ctx, payload);
      break;

    case 'audit':
      if (action === 'DELETE') {
        const policies = await loadPolicies(pool, ctx.organizationId);
        if (policies['sec_audit_trail_immutable']) {
          violations.push({
            code: 'AUDIT_LOG_IMMUTABLE',
            severity: 'BLOCK',
            messageAr: 'سجلات التدقيق لا يمكن حذفها — السياسة تفرض عدم التعديل',
            messageEn: 'Audit logs cannot be deleted — immutable audit policy enforced',
            policyKey: 'sec_audit_trail_immutable',
          });
        }
      }
      break;
  }

  const blocked = violations.some(v => v.severity === 'BLOCK');
  return { allowed: !blocked, violations };
}
