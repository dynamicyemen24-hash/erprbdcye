/**
 * UAMEX ERP™ — Enterprise Alert Banner 4.0
 *
 * Dismissible contextual alert with:
 * — 5 semantic variants: info, warning, danger, success, ai
 * — Accessible ARIA role="alert"
 * — Optional action slot and progressive disclosure
 * — Collapsible mode for persistent alerts
 */

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, ShieldAlert, X, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { enterpriseTokens } from '../../core/theme/enterpriseDesignTokens';

export interface EnterpriseAlertBannerProps {
  variant?: 'info' | 'warning' | 'danger' | 'success' | 'ai';
  title?: string;
  description: string | React.ReactNode;
  action?: React.ReactNode;
  onDismiss?: () => void;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

type AlertConfig = {
  theme: typeof enterpriseTokens.status.info;
  Icon: React.ElementType;
};

export const EnterpriseAlertBanner: React.FC<EnterpriseAlertBannerProps> = ({
  variant = 'info',
  title,
  description,
  action,
  onDismiss,
  collapsible = false,
  defaultOpen = true,
  className = ''
}) => {
  const [expanded, setExpanded] = useState(defaultOpen);

  const variantConfig: Record<NonNullable<typeof variant>, AlertConfig> = {
    info:    { theme: enterpriseTokens.status.info,    Icon: Info },
    warning: { theme: enterpriseTokens.status.warning, Icon: AlertTriangle },
    danger:  { theme: enterpriseTokens.status.danger,  Icon: ShieldAlert },
    success: { theme: enterpriseTokens.status.success, Icon: CheckCircle2 },
    ai:      { theme: enterpriseTokens.status.ai,      Icon: Sparkles },
  };

  const { theme, Icon } = variantConfig[variant] ?? variantConfig.info;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`rounded-2xl border ${theme.bg} ${theme.border} shadow-xs transition-all ${className}`}
    >
      {/* Main Row */}
      <div className="flex items-start gap-3 p-3.5">
        <div className={`shrink-0 mt-0.5 ${theme.iconClass}`}>
          <Icon className="w-4 h-4" aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          {title && (
            <div className={`text-xs font-extrabold ${theme.text} leading-snug`}>{title}</div>
          )}
          {(!collapsible || expanded) && (
            <div className={`text-[11px] font-medium mt-0.5 leading-relaxed ${theme.text} opacity-90`}>
              {description}
            </div>
          )}
          {(!collapsible || expanded) && action && (
            <div className="pt-2.5 flex items-center gap-2">{action}</div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {collapsible && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className={`p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 ${theme.text} transition-colors cursor-pointer`}
              aria-expanded={expanded}
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className={`p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 ${theme.text} transition-colors cursor-pointer`}
              aria-label="Dismiss alert"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnterpriseAlertBanner;
