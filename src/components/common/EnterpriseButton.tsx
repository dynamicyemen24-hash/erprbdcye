/**
 * UAMEX ERP™ — Enterprise Button 4.0
 *
 * Fully accessible, semantically typed button component with:
 * — Keyboard focus rings (WCAG 2.1 AA)
 * — Loading state with spinner
 * — Icon slots (leading / trailing)
 * — Variants: primary, secondary, danger, accent, ghost, iconOnly, ai
 * — Sizes: xs, sm, md, lg
 * — RTL-aware icon alignment
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { enterpriseTokens } from '../../core/theme/enterpriseDesignTokens';

export interface EnterpriseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'accent' | 'ghost' | 'icon' | 'ai';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  children?: React.ReactNode;
}

const SIZE_CLASSES: Record<string, string> = {
  xs: 'text-[10px] px-2.5 py-1 rounded-lg gap-1',
  sm: 'text-[11px] px-3 py-1.5 rounded-xl gap-1.5',
  md: 'text-xs px-3.5 py-2 rounded-xl gap-1.5',
  lg: 'text-sm px-5 py-2.5 rounded-2xl gap-2 font-black',
};

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
  const isIconOnly = variant === 'icon';

  let variantClass = enterpriseTokens.buttons.primary;
  switch (variant) {
    case 'secondary': variantClass = enterpriseTokens.buttons.secondary; break;
    case 'danger':    variantClass = enterpriseTokens.buttons.danger;    break;
    case 'accent':    variantClass = enterpriseTokens.buttons.accent;    break;
    case 'ghost':     variantClass = enterpriseTokens.buttons.ghost;     break;
    case 'icon':      variantClass = enterpriseTokens.buttons.iconOnly;  break;
    case 'ai':        variantClass = enterpriseTokens.buttons.ai;        break;
    default:          variantClass = enterpriseTokens.buttons.primary;   break;
  }

  const sizeClass = isIconOnly ? '' : (SIZE_CLASSES[size] ?? SIZE_CLASSES.md);

  return (
    <button
      {...props}
      type={props.type ?? 'button'}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`${variantClass} ${sizeClass} ${className}`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden="true" />
      ) : (
        icon && <span className="shrink-0" aria-hidden="true">{icon}</span>
      )}
      {children && <span>{children}</span>}
      {!loading && iconRight && <span className="shrink-0" aria-hidden="true">{iconRight}</span>}
    </button>
  );
};

export default EnterpriseButton;
