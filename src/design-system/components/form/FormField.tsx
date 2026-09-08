/**
 * UAMEX ERP™ — Form Field Wrapper
 * Provides label, description, error message, and required indicator
 */

import React, { useId } from 'react';
import { cn } from '../../utils/cn';

export interface FormFieldProps {
  label?: string;
  labelAr?: string;
  description?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  lang?: 'ar' | 'en';
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, labelAr, description, error, required, disabled, lang = 'ar', children, className }: FormFieldProps) {
  const id = useId();
  const displayLabel = lang === 'ar' ? (labelAr || label) : label;
  const hasError = !!error;

  return (
    <div className={cn('flex flex-col gap-1.5', disabled && 'opacity-50 pointer-events-none', className)}>
      {displayLabel && (
        <label htmlFor={id} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {displayLabel}
          {required && <span className="text-red-500 ms-1">*</span>}
        </label>
      )}
      {description && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      )}
      <div aria-describedby={description ? `${id}-desc` : undefined} aria-invalid={hasError || undefined}>
        {React.isValidElement(children)
          ? React.cloneElement(children as React.ReactElement<any>, { id, 'aria-invalid': hasError || undefined })
          : children}
      </div>
      {hasError && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
