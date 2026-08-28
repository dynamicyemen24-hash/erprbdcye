import React from 'react';
import { Loader2 } from 'lucide-react';
import { enterpriseTokens } from '../../core/theme/enterpriseDesignTokens';

export interface EnterpriseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'accent' | 'ghost' | 'icon';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  children?: React.ReactNode;
}

export const EnterpriseButton: React.FC<EnterpriseButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  children,
  disabled,
  className = '',
  ...props
}) => {
  let variantClass = enterpriseTokens.buttons.primary;
  if (variant === 'secondary') variantClass = enterpriseTokens.buttons.secondary;
  if (variant === 'danger') variantClass = enterpriseTokens.buttons.danger;
  if (variant === 'accent') variantClass = enterpriseTokens.buttons.accent;
  if (variant === 'ghost') variantClass = enterpriseTokens.buttons.ghost;
  if (variant === 'icon') variantClass = enterpriseTokens.buttons.iconOnly;

  let sizeClass = '';
  if (variant !== 'icon') {
    switch (size) {
      case 'xs':
        sizeClass = 'text-[10px] px-2.5 py-1 rounded-lg gap-1';
        break;
      case 'sm':
        sizeClass = 'text-[11px] px-3 py-1.5 rounded-xl gap-1.5';
        break;
      case 'lg':
        sizeClass = 'text-sm px-5 py-2.5 rounded-2xl gap-2 font-black';
        break;
      case 'md':
      default:
        sizeClass = 'text-xs px-3.5 py-2 rounded-xl gap-1.5';
        break;
    }
  }

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${variantClass} ${sizeClass} ${className}`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children && <span>{children}</span>}
      {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
};

export default EnterpriseButton;
