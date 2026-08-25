import React, { useMemo } from 'react';
import { policyEngine, type PolicyAction, type PolicyDecision } from './enterprisePolicyEngine';

interface PermissionGateProps {
  action: PolicyAction;
  domain: string;
  securityLevel: number;
  userRole: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onDenied?: (decision: PolicyDecision) => void;
  showTooltip?: boolean;
}

function PermissionGateInner({
  action,
  domain,
  securityLevel,
  userRole,
  children,
  fallback,
  onDenied,
  showTooltip = true,
}: PermissionGateProps) {
  const decision = useMemo(
    () => policyEngine.evaluate(securityLevel, userRole, action, domain),
    [securityLevel, userRole, action, domain]
  );

  if (!decision.allowed) {
    if (onDenied) onDenied(decision);
    if (fallback) return <>{fallback}</>;
    if (showTooltip) {
      return (
        <div className="relative inline-flex group">
          <div className="opacity-30 pointer-events-none select-none">{children}</div>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-red-900 text-red-200 text-xs rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
            {decision.reason || '\u063A\u064A\u0631 \u0645\u0635\u0631\u062D'}
          </div>
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
}

export const PermissionGate = React.memo(PermissionGateInner);

export function usePermission(action: PolicyAction, domain: string, securityLevel: number, userRole: string): PolicyDecision {
  return useMemo(
    () => policyEngine.evaluate(securityLevel, userRole, action, domain),
    [securityLevel, userRole, action, domain]
  );
}

interface PolicyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  action: PolicyAction;
  domain: string;
  securityLevel: number;
  userRole: string;
  actionLabel?: string;
}

function PolicyButtonInner({
  action,
  domain,
  securityLevel,
  userRole,
  actionLabel,
  children,
  className = '',
  disabled,
  ...props
}: PolicyButtonProps) {
  const decision = useMemo(
    () => policyEngine.evaluate(securityLevel, userRole, action, domain),
    [securityLevel, userRole, action, domain]
  );
  const isDisabled = disabled || !decision.allowed;

  return (
    <div className="relative inline-flex group">
      <button
        className={`${className} ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}`}
        disabled={isDisabled}
        title={decision.allowed ? (decision.requireApproval ? '\u064A\u062A\u0637\u0628 \u0645\u0648\u0627\u0641\u0642\u0629' : undefined) : decision.reason}
        {...props}
      >
        {children}
      </button>
      {!decision.allowed && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-red-900 text-red-200 text-xs rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
          {actionLabel ? `${actionLabel}: ${decision.reason}` : decision.reason}
        </div>
      )}
    </div>
  );
}

export const PolicyButton = React.memo(PolicyButtonInner);

export default PermissionGate;
