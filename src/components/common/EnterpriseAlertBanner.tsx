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
import { Button } from '../../design-system/components/Button';

/**
 * Specialty banner (DEBT PAID): the collapsible + `ai` combination has no
 * Design System equivalent (`Alert`/`EnterpriseAlert` cover the four
 * standard tones inline), so this control keeps its API — but its palette is
 * now a CLOSED LOCAL MAP in the Design System convention instead of a third
 * token vocabulary, and both icon buttons are `Button` (platform focus ring).
 */

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
  bg: string;
  border: string;
  text: string;
  iconClass: string;
  Icon: React.ElementType;
};

const TONE: Record<NonNullable<EnterpriseAlertBannerProps['variant']>, AlertConfig> = {
  info:    { bg: 'bg-sky-50 dark:bg-sky-950/60',       border: 'border-sky-200 dark:border-sky-800/80',       text: 'text-sky-700 dark:text-sky-300',       iconClass: 'text-sky-600 dark:text-sky-400',       Icon: Info },
  warning: { bg: 'bg-amber-50 dark:bg-amber-950/60',   border: 'border-amber-200 dark:border-amber-800/80',   text: 'text-amber-700 dark:text-amber-300',   iconClass: 'text-amber-600 dark:text-amber-400',   Icon: AlertTriangle },
  danger:  { bg: 'bg-rose-50 dark:bg-rose-950/60',     border: 'border-rose-200 dark:border-rose-800/80',     text: 'text-rose-700 dark:text-rose-300',     iconClass: 'text-rose-600 dark:text-rose-400',     Icon: ShieldAlert },
  success: { bg: 'bg-emerald-50 dark:bg-emerald-950/60', border: 'border-emerald-200 dark:border-emerald-800/80', text: 'text-emerald-700 dark:text-emerald-300', iconClass: 'text-emerald-600 dark:text-emerald-400', Icon: CheckCircle2 },
  ai:      { bg: 'bg-violet-50 dark:bg-violet-950/60', border: 'border-violet-200 dark:border-violet-800/80', text: 'text-violet-700 dark:text-violet-300', iconClass: 'text-violet-600 dark:text-violet-400', Icon: Sparkles },
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

  const { bg, border, text, iconClass, Icon } = TONE[variant] ?? TONE.info;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`rounded-2xl border ${bg} ${border} shadow-xs transition-all ${className}`}
    >
      {/* Main Row */}
      <div className="flex items-start gap-3 p-3.5">
        <div className={`shrink-0 mt-0.5 ${iconClass}`}>
          <Icon className="w-4 h-4" aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          {title && (
            <div className={`text-xs font-extrabold ${text} leading-snug`}>{title}</div>
          )}
          {(!collapsible || expanded) && (
            <div className={`text-[11px] font-medium mt-0.5 leading-relaxed ${text} opacity-90`}>
              {description}
            </div>
          )}
          {(!collapsible || expanded) && action && (
            <div className="pt-2.5 flex items-center gap-2">{action}</div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {collapsible && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              iconOnly
              label={expanded ? 'Collapse' : 'Expand'}
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              className="text-current"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </Button>
          )}
          {onDismiss && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              iconOnly
              label="Dismiss alert"
              onClick={onDismiss}
              className="text-current"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnterpriseAlertBanner;
