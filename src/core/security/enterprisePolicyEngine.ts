/**
 * NexoraOS™ — Enterprise Policy Engine
 * Enforces institutional CRUD+APPS controls on all operations.
 * Controls: Add, Edit, Save, Delete, Pause/Stop, Approve, Print, Share
 */

export type PolicyAction = 'create' | 'read' | 'update' | 'delete' | 'pause' | 'approve' | 'print' | 'share' | 'export';

export type SecurityLevel = 1 | 2 | 3 | 4 | 5;

export interface PolicyRule {
  action: PolicyAction;
  domain: string;
  minSecurityLevel: number;
  requireApproval?: boolean;
  requireTwoFactor?: boolean;
  auditLog?: boolean;
  blockedRoles?: string[];
  allowedRoles?: string[];
  timeRestriction?: { start: number; end: number };
}

export interface PolicyDecision {
  allowed: boolean;
  reason?: string;
  requireApproval?: boolean;
  requireTwoFactor?: boolean;
  auditRequired?: boolean;
}

const DEFAULT_POLICIES: PolicyRule[] = [
  { action: 'create', domain: '*', minSecurityLevel: 2, auditLog: true },
  { action: 'read', domain: '*', minSecurityLevel: 1 },
  { action: 'update', domain: '*', minSecurityLevel: 2, auditLog: true },
  { action: 'delete', domain: '*', minSecurityLevel: 3, requireApproval: true, auditLog: true },
  { action: 'pause', domain: '*', minSecurityLevel: 2, auditLog: true },
  { action: 'approve', domain: '*', minSecurityLevel: 4, requireTwoFactor: true, auditLog: true },
  { action: 'print', domain: '*', minSecurityLevel: 1, auditLog: true },
  { action: 'share', domain: '*', minSecurityLevel: 3, requireApproval: true, auditLog: true },
  { action: 'export', domain: '*', minSecurityLevel: 2, auditLog: true },

  // Domain-specific overrides
  { action: 'delete', domain: 'finance', minSecurityLevel: 5, requireApproval: true, requireTwoFactor: true, auditLog: true },
  { action: 'approve', domain: 'finance', minSecurityLevel: 5, requireTwoFactor: true, auditLog: true },
  { action: 'create', domain: 'finance', minSecurityLevel: 3, requireApproval: true, auditLog: true },
  { action: 'delete', domain: 'beneficiaries', minSecurityLevel: 4, requireApproval: true, auditLog: true },
  { action: 'approve', domain: 'beneficiaries', minSecurityLevel: 4, auditLog: true },
  { action: 'delete', domain: 'hr', minSecurityLevel: 4, requireApproval: true, auditLog: true },
  { action: 'approve', domain: 'hr', minSecurityLevel: 4, requireTwoFactor: true, auditLog: true },
  { action: 'create', domain: 'procurement', minSecurityLevel: 3, requireApproval: true, auditLog: true },
  { action: 'approve', domain: 'procurement', minSecurityLevel: 5, requireTwoFactor: true, auditLog: true },
  { action: 'delete', domain: 'procurement', minSecurityLevel: 5, requireApproval: true, requireTwoFactor: true, auditLog: true },
  { action: 'share', domain: 'beneficiaries', minSecurityLevel: 4, requireApproval: true, auditLog: true },
  { action: 'print', domain: 'finance', minSecurityLevel: 2, auditLog: true },
  { action: 'export', domain: 'finance', minSecurityLevel: 4, requireApproval: true, auditLog: true },
];

export interface UserDimensionScope {
  userId: string;
  allowedAccountPrefixes?: string[];
  blockedAccountPrefixes?: string[];
  maxVoucherAmount?: number;
  assignedProjectIds?: string[];
  assignedActivityIds?: string[];
  allowedProductCategories?: string[];
  maxDisbursementQty?: number;
}

export interface DimensionDecision {
  allowed: boolean;
  reason?: string;
  dimension: 'account' | 'project' | 'activity' | 'product';
}

class EnterprisePolicyEngine {
  private policies: PolicyRule[];
  private violations: Array<{ timestamp: number; userId: string; action: string; domain: string; reason: string }> = [];

  constructor(policies: PolicyRule[] = DEFAULT_POLICIES) {
    this.policies = policies;
  }

  evaluate(userSecurityLevel: number, userRole: string, action: PolicyAction, domain: string): PolicyDecision {
    const matchingPolicies = this.policies.filter(
      p => p.action === action && (p.domain === '*' || p.domain === domain)
    );

    if (matchingPolicies.length === 0) {
      return { allowed: true };
    }

    const strictest = matchingPolicies.reduce((max, p) => p.minSecurityLevel > max.minSecurityLevel ? p : max);

    if (strictest.blockedRoles?.includes(userRole)) {
      return { allowed: false, reason: `Role '${userRole}' is blocked from '${action}' on '${domain}'` };
    }

    if (strictest.allowedRoles && !strictest.allowedRoles.includes(userRole)) {
      return { allowed: false, reason: `Role '${userRole}' is not in allowed roles for '${action}' on '${domain}'` };
    }

    if (userSecurityLevel < strictest.minSecurityLevel) {
      const reason = `Security level ${userSecurityLevel} is below minimum ${strictest.minSecurityLevel} for '${action}' on '${domain}'`;
      this.logViolation(userSecurityLevel.toString(), action, domain, reason);
      return { allowed: false, reason };
    }

    if (strictest.timeRestriction) {
      const now = new Date().getHours();
      if (now < strictest.timeRestriction.start || now > strictest.timeRestriction.end) {
        return { allowed: false, reason: `'${action}' on '${domain}' is only allowed during ${strictest.timeRestriction.start}:00-${strictest.timeRestriction.end}:00` };
      }
    }

    return {
      allowed: true,
      requireApproval: strictest.requireApproval,
      requireTwoFactor: strictest.requireTwoFactor,
      auditRequired: strictest.auditLog,
    };
  }

  /**
   * Evaluates granular account-level access (Chart of Accounts scope)
   */
  evaluateAccountAccess(scope: UserDimensionScope | null | undefined, accountCode: string, amount?: number): DimensionDecision {
    if (!scope) return { allowed: true, dimension: 'account' };

    // 1. Check blocked prefixes (e.g. confidential payroll '212' or '511')
    if (scope.blockedAccountPrefixes && scope.blockedAccountPrefixes.some(p => accountCode.startsWith(p))) {
      return {
        allowed: false,
        dimension: 'account',
        reason: `Account '${accountCode}' is explicitly restricted from your user profile`
      };
    }

    // 2. Check allowed prefixes if not wildcard
    if (scope.allowedAccountPrefixes && !scope.allowedAccountPrefixes.includes('*')) {
      const isAllowed = scope.allowedAccountPrefixes.some(p => accountCode.startsWith(p));
      if (!isAllowed) {
        return {
          allowed: false,
          dimension: 'account',
          reason: `Account '${accountCode}' is outside your authorized ledger scope (${scope.allowedAccountPrefixes.join(', ')})`
        };
      }
    }

    // 3. Check transaction value ceiling
    if (amount !== undefined && scope.maxVoucherAmount !== undefined && amount > scope.maxVoucherAmount) {
      return {
        allowed: false,
        dimension: 'account',
        reason: `Transaction amount (${amount.toLocaleString()}) exceeds your authorized voucher ceiling (${scope.maxVoucherAmount.toLocaleString()})`
      };
    }

    return { allowed: true, dimension: 'account' };
  }

  /**
   * Evaluates granular project-level access
   */
  evaluateProjectAccess(scope: UserDimensionScope | null | undefined, projectId: string): DimensionDecision {
    if (!scope) return { allowed: true, dimension: 'project' };

    if (scope.assignedProjectIds && !scope.assignedProjectIds.includes('*') && !scope.assignedProjectIds.includes(projectId)) {
      return {
        allowed: false,
        dimension: 'project',
        reason: `Project '${projectId}' is not assigned to your operational workspace`
      };
    }

    return { allowed: true, dimension: 'project' };
  }

  /**
   * Evaluates granular activity-level access (WBS)
   */
  evaluateActivityAccess(scope: UserDimensionScope | null | undefined, activityId: string): DimensionDecision {
    if (!scope) return { allowed: true, dimension: 'activity' };

    if (scope.assignedActivityIds && !scope.assignedActivityIds.includes('*') && !scope.assignedActivityIds.includes(activityId)) {
      return {
        allowed: false,
        dimension: 'activity',
        reason: `Activity '${activityId}' is outside your assigned field milestone scope`
      };
    }

    return { allowed: true, dimension: 'activity' };
  }

  /**
   * Evaluates granular product/item-level access (Inventory SKUs)
   */
  evaluateProductAccess(scope: UserDimensionScope | null | undefined, category: string, quantity?: number): DimensionDecision {
    if (!scope) return { allowed: true, dimension: 'product' };

    if (scope.allowedProductCategories && !scope.allowedProductCategories.includes('*') && !scope.allowedProductCategories.includes(category)) {
      return {
        allowed: false,
        dimension: 'product',
        reason: `Product category '${category}' is restricted for your warehouse custody role`
      };
    }

    if (quantity !== undefined && scope.maxDisbursementQty !== undefined && quantity > scope.maxDisbursementQty) {
      return {
        allowed: false,
        dimension: 'product',
        reason: `Disbursement quantity (${quantity}) exceeds single-voucher allocation cap (${scope.maxDisbursementQty})`
      };
    }

    return { allowed: true, dimension: 'product' };
  }

  private logViolation(userId: string, action: string, domain: string, reason: string): void {
    this.violations.push({ timestamp: Date.now(), userId, action, domain, reason });
    if (this.violations.length > 1000) this.violations.shift();
  }

  getViolations(): typeof this.violations {
    return [...this.violations];
  }

  addPolicy(policy: PolicyRule): void {
    this.policies.push(policy);
  }

  removePolicy(action: PolicyAction, domain: string): void {
    this.policies = this.policies.filter(p => !(p.action === action && p.domain === domain));
  }
}

export const policyEngine = new EnterprisePolicyEngine();
export default policyEngine;
