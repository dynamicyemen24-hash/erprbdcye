import React from 'react';
import { FormError } from './FormError';

interface FormFieldProps {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  description?: string;
}

export function FormField({ label, name, error, required, children, description }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-bold text-slate-700 dark:text-zinc-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {description && !error && <p className="text-xs text-slate-500 dark:text-zinc-400">{description}</p>}
      <FormError error={error} />
    </div>
  );
}
