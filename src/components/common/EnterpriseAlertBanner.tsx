import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  ShieldAlert, 
  X 
} from 'lucide-react';
import { enterpriseTokens } from '../../core/theme/enterpriseDesignTokens';

export interface EnterpriseAlertBannerProps {
  variant?: 'info' | 'warning' | 'danger' | 'success';
  title?: string;
  description: string | React.ReactNode;
  action?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export const EnterpriseAlertBanner: React.FC<EnterpriseAlertBannerProps> = ({
  variant = 'info',
  title,
  description,
  action,
  onDismiss,
  className = ''
}) => {
  let theme = enterpriseTokens.status.info;
  let Icon = Info;

  switch (variant) {
    case 'warning':
      theme = enterpriseTokens.status.warning;
      Icon = AlertTriangle;
      break;
    case 'danger':
      theme = enterpriseTokens.status.danger;
      Icon = ShieldAlert;
      break;
    case 'success':
      theme = enterpriseTokens.status.success;
      Icon = CheckCircle2;
      break;
    case 'info':
    default:
      theme = enterpriseTokens.status.info;
      Icon = Info;
      break;
  }

  return (
    <div 
      role="alert"
      className={`p-3.5 rounded-2xl border ${theme.bg} ${theme.border} ${theme.text} shadow-xs flex items-start gap-3 text-xs leading-relaxed ${className}`}
    >
      <Icon className={`w-4 h-4 ${theme.iconClass} shrink-0 mt-0.5`} />
      <div className="flex-1 space-y-1">
        {title && <div className="font-extrabold text-slate-900 dark:text-white">{title}</div>}
        <div className="font-medium text-slate-700 dark:text-zinc-300">{description}</div>
        {action && <div className="pt-2">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          aria-label="Dismiss alert"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default EnterpriseAlertBanner;
