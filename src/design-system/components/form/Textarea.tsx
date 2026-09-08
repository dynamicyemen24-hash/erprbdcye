/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * UAMEX ERP™ — Textarea Component v3.0
 * Premium textarea with character count, auto-resize, validation
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import React, { forwardRef, useId as useReactId } from 'react';
import { cn } from '../../utils/cn';

export type TextareaSize = 'sm' | 'md' | 'lg';

export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  size?: TextareaSize;
  error?: string;
  helperText?: string;
  label?: string;
  labelAr?: string;
  required?: boolean;
  showCharCount?: boolean;
  maxChars?: number;
  lang?: 'ar' | 'en';
}

const SIZE_CLASSES: Record<TextareaSize, string> = {
  sm: 'px-3 py-1.5 text-sm min-h-[60px]',
  md: 'px-3.5 py-2 text-sm min-h-[80px]',
  lg: 'px-4 py-2.5 text-base min-h-[120px]',
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      size = 'md',
      error,
      helperText,
      label,
      labelAr,
      required,
      showCharCount,
      maxChars,
      lang = 'ar',
      className,
      id: providedId,
      disabled,
      value,
      ...props
    },
    ref
  ) => {
    const fallbackId = useReactId();
    const id = providedId || fallbackId;
    const displayLabel = lang === 'ar' ? (labelAr || label) : label;
    const hasError = !!error;
    const isRTL = lang === 'ar';
    const charCount = typeof value === 'string' ? value.length : 0;
    const isOverLimit = maxChars ? charCount > maxChars : false;

    return (
      <div className="w-full">
        {/* Label */}
        {displayLabel && (
          <label htmlFor={id} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            {displayLabel}
            {required && <span className="text-red-500 ms-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={id}
          dir={isRTL ? 'rtl' : 'ltr'}
          disabled={disabled}
          value={value}
          maxLength={maxChars}
          className={cn(
            'block w-full rounded-lg border bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white',
            'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
            'transition-all duration-150 resize-y',
            SIZE_CLASSES[size],
            hasError
              ? 'border-red-300 dark:border-red-600 focus:ring-red-500/20 focus:border-red-500'
              : 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500',
            disabled && 'opacity-50 cursor-not-allowed bg-zinc-50 dark:bg-zinc-900',
            className
          )}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          aria-required={required || undefined}
          {...props}
        />

        {/* Error / Helper / Char Count */}
        <div className="flex items-start justify-between gap-2 mt-1.5">
          <div className="min-w-0">
            {hasError && (
              <p id={`${id}-error`} role="alert" className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {error}
              </p>
            )}
            {!hasError && helperText && (
              <p id={`${id}-helper`} className="text-xs text-zinc-500 dark:text-zinc-400">
                {helperText}
              </p>
            )}
          </div>
          {showCharCount && (
            <span className={cn(
              'text-xs tabular-nums shrink-0',
              isOverLimit ? 'text-red-600 dark:text-red-400 font-medium' : 'text-zinc-400 dark:text-zinc-500'
            )}>
              {charCount}{maxChars ? `/${maxChars}` : ''}
            </span>
          )}
        </div>
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
