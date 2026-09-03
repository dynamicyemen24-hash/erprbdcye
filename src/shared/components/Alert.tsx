// ═══════════════════════════════════════════════════════════════════════════════
// UAMEX ERP™ — Alert Component
// Premium Design System Component v2.0
// ═══════════════════════════════════════════════════════════════════════════════
//
// © 2026 Rohamaa Baynahum Charity Foundation - UAMEX ERP™
// One Platform. One Organization. One Vision.
//
// Advanced alert with:
// - Multiple types (info, success, warning, error)
// - Dismissible with animation
// - Actions support
// - Bilingual support
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { X, Info, CheckCircle2, AlertTriangle, XCircle, type LucideIcon } from 'lucide-react';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

export interface AlertAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface AlertProps {
  /** Alert type */
  type?: AlertType;
  /** Title (Arabic) */
  titleAr?: string;
  /** Title (English) */
  titleEn?: string;
  /** Description (Arabic) */
  descAr?: string;
  /** Description (English) */
  descEn?: string;
  /** Custom icon */
  icon?: LucideIcon;
  /** Dismissible */
  dismissible?: boolean;
  /** Initial dismissed state */
  defaultDismissed?: boolean;
  /** On dismiss callback */
  onDismiss?: () => void;
  /** Actions */
  actions?: AlertAction[];
  /** Language */
  lang: 'ar' | 'en';
  /** Rounded variant */
  rounded?: boolean;
  /** Border accent */
  borderAccent?: boolean;
  /** ARIA label */
  ariaLabel?: string;
}

const TYPE_CONFIG: Record<AlertType, {
  icon: React.ComponentType<{ className?: string }>;
  styles: { bg: string; border: string; text: string; icon: string; button: string };
}> = {
  info: {
    icon: Info,
    styles: {
      bg: 'bg-sky-50 dark:bg-sky-950/30',
      border: 'border-sky-200 dark:border-sky-800',
      text: 'text-sky-800 dark:text-sky-200',
      icon: 'text-sky-500 dark:text-sky-400',
      button: 'text-sky-600 hover:bg-sky-100 dark:hover:bg-sky-900/50',
    },
  },
  success: {
    icon: CheckCircle2,
    styles: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-800 dark:text-emerald-200',
      icon: 'text-emerald-500 dark:text-emerald-400',
      button: 'text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/50',
    },
  },
  warning: {
    icon: AlertTriangle,
    styles: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-800 dark:text-amber-200',
      icon: 'text-amber-500 dark:text-amber-400',
      button: 'text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/50',
    },
  },
  error: {
    icon: XCircle,
    styles: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
      icon: 'text-red-500 dark:text-red-400',
      button: 'text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50',
    },
  },
};

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  titleAr,
  titleEn,
  descAr,
  descEn,
  icon: CustomIcon,
  dismissible = false,
  defaultDismissed = false,
  onDismiss,
  actions,
  lang,
  rounded = true,
  borderAccent = true,
  ariaLabel,
}) => {
  const isRtl = lang === 'ar';
  const [dismissed, setDismissed] = useState(defaultDismissed);

  if (dismissed) return null;

  const config = TYPE_CONFIG[type];
  const Icon = CustomIcon ?? config.icon;
  const { bg, border, text, icon: iconColor, button } = config.styles;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      className={`
        relative overflow-hidden
        ${bg}
        ${borderAccent ? border : 'border-transparent'}
        ${rounded ? 'rounded-xl' : 'rounded-none'}
        border-l-4
      `}
      role="alert"
      aria-live="polite"
      aria-label={ariaLabel ?? (isRtl ? titleAr : titleEn)}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className={`flex-shrink-0 mt-0.5 ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {(titleAr || titleEn) && (
            <h3 className={`text-sm font-bold ${text}`}>
              {isRtl ? titleAr : titleEn}
            </h3>
          )}

          {(descAr || descEn) && (
            <p className={`text-xs font-medium mt-1 ${text} opacity-80`}>
              {isRtl ? descAr : descEn}
            </p>
          )}

          {/* Actions */}
          {actions && actions.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              {actions.map((action, i) => (
                <button
                  key={i}
                  onClick={action.onClick}
                  className={`
                    text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors
                    ${action.variant === 'danger'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : action.variant === 'primary'
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : `${border} ${text} hover:${bg}`
                    }
                  `}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dismiss button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={`
              flex-shrink-0 p-1 rounded-lg transition-colors
              ${button}
            `}
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;