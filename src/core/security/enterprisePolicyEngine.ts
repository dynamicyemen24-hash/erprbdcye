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
