/**
 * UAMEX ERP™ — Checkbox Component
 * Adapted from NICYE design-system components/Checkbox/ with Tailwind CSS
 */

import React, { forwardRef, useId as useReactId } from 'react';
import { cn } from '../../utils/cn';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  labelAr?: string;
  lang?: 'ar' | 'en';
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, labelAr, lang = 'ar', className, id, ...props }, ref) => {
    const displayLabel = lang === 'ar' ? (labelAr || label) : label;
    const fallbackId = useReactId();
    const checkboxId = id || fallbackId;

    return (
      <label htmlFor={checkboxId} className={cn('inline-flex items-center gap-2 cursor-pointer', props.disabled && 'opacity-50 cursor-not-allowed', className)}>
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          role="checkbox"
          aria-checked={props.checked}
          aria-labelledby={`${checkboxId}-label`}
          className={cn(
            'w-4 h-4 rounded border-zinc-300 dark:border-zinc-600',
            'text-emerald-600 focus:ring-emerald-500 focus:ring-2 focus:ring-offset-0',
            'bg-white dark:bg-zinc-800',
            'transition-colors'
          )}
          {...props}
        />
        {displayLabel && (
          <span id={`${checkboxId}-label`} className="text-sm text-zinc-700 dark:text-zinc-300 select-none">{displayLabel}</span>
        )}
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';
