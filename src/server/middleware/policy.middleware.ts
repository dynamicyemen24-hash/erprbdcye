/**
 * NexoraOS™ — Policy Enforcement Middleware
 * Wraps PolicyEngineService into Express middleware for route-level enforcement.
 * Supports both environment mode (training/production) and entity-level policies.
 * Logs policy violations to audit_logs for compliance tracking.
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, extractTenantId } from './auth.middleware';
import { getDatabasePool } from '../services/db.service';
import {
  enforceAllPolicies,
  type PolicyContext,
  type PolicyViolation,
} from '../services/policyEngine';

// ─────────────────────────────────────────────
// Policy Violation Audit Logger
// ─────────────────────────────────────────────

/**
 * Logs policy violations to audit_logs table for compliance tracking.
 * Fire-and-forget — does not block the request.
 */
async function logPolicyViolation(
  orgId: string,
  userId: string | undefined,
  domain: string,
  action: string,
  violations: PolicyViolation[],
  environmentMode: string
): Promise<void> {
  try {
    const pool = getDatabasePool();
    const blockViolations = violations.filter(v => v.severity === 'BLOCK');
    const warnViolations = violations.filter(v => v.severity === 'WARN' || v.severity === 'INFO');

    await pool.query(`
      INSERT INTO audit_logs (id, action, table_name, record_id, user_id, details, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [
      crypto.randomUUID(),
      `POLICY_VIOLATION:${domain}:${action}`,
      'policy_enforcement',
      null,
      userId || null,
      JSON.stringify({
        domain,
        action,
        environmentMode,
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
    console.error('[PolicyMiddleware] Failed to log violation to audit:', err);
  }
}

// ─────────────────────────────────────────────
// Environment Mode Header
// ─────────────────────────────────────────────

export interface EnvironmentAwareRequest extends AuthenticatedRequest {
  environmentMode?: 'production' | 'training';
}

/**
 * Extracts environment mode from x-environment-mode header.
 * Defaults to 'production' if not specified.
 */
export function extractEnvironmentMode(req: EnvironmentAwareRequest): 'production' | 'training' {
  const mode = req.headers['x-environment-mode'];
  if (mode === 'training' || mode === 'production') {
    return mode;
  }
  return 'production';
}

// ─────────────────────────────────────────────
// Policy Enforcement Middleware
// ─────────────────────────────────────────────

/**
 * Creates a policy enforcement middleware for a specific domain.
 * 
 * @param domain - The entity domain to enforce policies for (e.g., 'finance', 'beneficiaries')
 * @param action - The action being performed (e.g., 'CREATE', 'UPDATE', 'DELETE')
 * @param extractPayload - Function to extract the payload from the request
 * @param options - Additional options
 */
export function requirePolicyEnforcement(
  domain: string,
  action: string,
  extractPayload: (req: EnvironmentAwareRequest) => any = (req) => req.body,
  options: {
    /** Skip policy enforcement for certain roles */
    bypassRoles?: string[];
    /** Skip policy enforcement in training mode */
    skipInTraining?: boolean;
    /** Extract custom domain from payload (e.g., 'transactions' for finance domain) */
    customDomainExtractor?: (payload: any) => string;
  } = {}
) {
  return async (
    req: EnvironmentAwareRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Check environment mode
      const envMode = extractEnvironmentMode(req);

      // Skip enforcement in training mode if configured
      if (options.skipInTraining && envMode === 'training') {
        return next();
      }

      // Check bypass roles
      const userRole = req.user?.role ?? '';
      if (options.bypassRoles?.includes(userRole)) {
        return next();
      }

      // Get database pool
      const pool = getDatabasePool();

      // Build policy context
      const ctx: PolicyContext = {
        organizationId: extractTenantId(req),
        userId: req.user?.id || '',
        securityLevel: req.user?.security_level ?? 0,
        role: userRole,
      };

      // Extract payload
      const payload = extractPayload(req);

      // Determine effective domain (allow custom domain extraction)
      const effectiveDomain = options.customDomainExtractor
        ? options.customDomainExtractor(payload)
        : domain;

      // Enforce policies
      const { allowed, violations } = await enforceAllPolicies(
        pool,
        ctx,
        effectiveDomain,
        action,
        payload
      );

      if (!allowed) {
        // Log violation to audit trail (fire-and-forget)
        logPolicyViolation(
          ctx.organizationId,
          ctx.userId,
          effectiveDomain,
          action,
          violations,
          envMode
        );

        // Return violations as error response
        const blockViolations = violations.filter(v => v.severity === 'BLOCK');
        const warnViolations = violations.filter(v => v.severity === 'WARN');

        res.status(403).json({
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
        return;
      }

      // Log warnings to audit trail (non-blocking violations)
      if (violations.length > 0) {
        logPolicyViolation(
          ctx.organizationId,
          ctx.userId,
          effectiveDomain,
          action,
          violations,
          envMode
        );
      }

      // Add warnings to response headers (non-blocking)
      if (violations.length > 0) {
        const warnViolations = violations.filter(v => v.severity === 'WARN' || v.severity === 'INFO');
        if (warnViolations.length > 0) {
          res.setHeader('X-Policy-Warnings', JSON.stringify(warnViolations.map(v => ({
            code: v.code,
            message: v.messageEn,
          }))));
        }
      }

      // Attach policy context to request for downstream use
      req.policyContext = ctx;
      req.policyViolations = violations;

      next();
    } catch (err) {
      console.error('[PolicyMiddleware] Enforcement error:', err);
      // Don't block on middleware errors - log and continue
      next();
    }
  };
}

// Extend AuthenticatedRequest with policy context
declare module './auth.middleware' {
  interface AuthenticatedRequest {
    policyContext?: PolicyContext;
    policyViolations?: PolicyViolation[];
  }
}

// ─────────────────────────────────────────────
// Convenience Middleware Factories
// ─────────────────────────────────────────────

/**
 * Finance domain policy enforcement.
 * Enforces approval limits, IPSAS compliance, and transaction type policies.
 */
export function requireFinancePolicy(action: string) {
  return requirePolicyEnforcement('finance', action, (req) => ({
    ...req.body,
    // Map finance-specific fields
    totalDebit: req.body.totalDebit || req.body.amount,
    lines: req.body.lines || [],
  }));
}

/**
 * Beneficiary domain policy enforcement.
 * Enforces deduplication, family size limits, and category-specific rules.
 */
export function requireBeneficiaryPolicy(action: string) {
  return requirePolicyEnforcement('beneficiaries', action);
}

/**
 * Activity domain policy enforcement.
 * Enforces sector-specific requirements (GPS, photos, signatures).
 */
export function requireActivityPolicy(action: string) {
  return requirePolicyEnforcement('activities', action);
}

/**
 * Disbursement domain policy enforcement.
 * Enforces method-specific limits, witness requirements, and documentation.
 */
export function requireDisbursementPolicy(action: string) {
  return requirePolicyEnforcement('disbursements', action);
}

/**
 * Sponsorship domain policy enforcement.
 * Enforces amount limits, report requirements, and renewal policies.
 */
export function requireSponsorshipPolicy(action: string) {
  return requirePolicyEnforcement('sponsorships', action);
}

/**
 * Project domain policy enforcement.
 * Enforces reporting requirements, budget limits, and documentation rules.
 */
export function requireProjectPolicy(action: string) {
  return requirePolicyEnforcement('projects', action);
}

/**
 * Donor domain policy enforcement.
 * Enforces due diligence, KYC, and reporting requirements.
 */
export function requireDonorPolicy(action: string) {
  return requirePolicyEnforcement('donors', action);
}

/**
 * Procurement domain policy enforcement.
 * Enforces three-way match, RFQ requirements, and approval tiers.
 */
export function requireProcurementPolicy(action: string) {
  return requirePolicyEnforcement('procurement', action);
}

/**
 * HR domain policy enforcement.
 * Enforces probation periods, appraisal requirements, and promotion rules.
 */
export function requireHRPolicy(action: string) {
  return requirePolicyEnforcement('hr', action, (req) => ({
    employeeId: req.body.employeeId || req.body.id,
  }), { bypassRoles: ['super_admin'] });
}

/**
 * Audit domain policy enforcement.
 * Enforces immutable audit trail policies.
 */
export function requireAuditPolicy(action: string) {
  return requirePolicyEnforcement('audit', action);
}
