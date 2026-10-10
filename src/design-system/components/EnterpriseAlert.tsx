/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * UAMEX ERP™ — Enterprise Alert Component v3.0
 * System-wide alert/notification banner with auto-dismiss and actions
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '../utils/cn';
import { Alert, type AlertVariant } from './Alert';
import { Button } from './Button';

/**
 * Canonical alert vocabulary (DEBT PAID). `Alert` owns the inline-alert
 * pattern (`role="alert"`, dismiss via `Button`, focus ring from the
 * platform baseline). `EnterpriseAlert` keeps its richer props
 * (bilingual copy, multi-action, auto-dismiss, `lang`) but renders THROUGH
 * `Alert` — no second dismiss button, no competing focus style.
 */
export type AlertType = AlertVariant;

export interface EnterpriseAlertProps {
  type?: AlertType;
  title?: string;
  titleAr?: string;
  message?: string;
  messageAr?: string;
  icon?: React.ReactNode;
  actions?: Array<{ label: string; labelAr?: string; onClick: () => void; variant?: 'primary' | 'ghost' }>;
  dismissible?: boolean;
  autoDismiss?: number; // ms
  onDismiss?: () => void;
  lang?: 'ar' | 'en';
  className?: string;
}



export function EnterpriseAlert({
  type = 'info',
  title,
  titleAr,
  message,
  messageAr,
  icon,
  actions,
  dismissible = true,
  autoDismiss,
  onDismiss,
  lang = 'ar',
  className,
}: EnterpriseAlertProps) {
  const [visible, setVisible] = useState(true);

  const displayTitle = lang === 'ar' ? (titleAr || title) : title;
  const displayMessage = lang === 'ar' ? (messageAr || message) : message;

  const handleDismiss = useCallback(() => {
    setVisible(false);
    onDismiss?.();
  }, [onDismiss]);

  useEffect(() => {
    if (autoDismiss && visible) {
      const timer = setTimeout(handleDismiss, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, visible, handleDismiss]);

  if (!visible) return null;

  // Custom icon overlays the canonical glyph: `Alert` owns layout + dismiss,
  // this adapter only supplies content. A custom icon renders inside the
  // message body so the status glyph pairing stays intact.
  const actionNode =
    actions && actions.length > 0 ? (
      <div className="flex items-center gap-2">
        {actions.map((action, i) => (
          <Button
            key={i}
            type="button"
            variant={action.variant === 'ghost' || i > 0 ? 'ghost' : 'primary'}
            size="sm"
            onClick={action.onClick}
            label={lang === 'ar' ? (action.labelAr || action.label) : action.label}
          >
            {lang === 'ar' ? (action.labelAr || action.label) : action.label}
          </Button>
        ))}
      </div>
    ) : undefined;

  return (
    <Alert
      variant={type}
      title={displayTitle}
      action={actionNode}
      onDismiss={dismissible ? handleDismiss : undefined}
      dismissLabel={lang === 'ar' ? 'إغلاق التنبيه' : 'Dismiss alert'}
      className={cn('p-4', className)}
    >
      {icon && (
        <span className="mb-1 inline-flex" aria-hidden="true">
          {icon}
        </span>
      )}
      {displayMessage}
    </Alert>
  );
}
