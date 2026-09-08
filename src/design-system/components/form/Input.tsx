/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * UAMEX ERP™ — Input Component v3.0
 * Premium input with addons, validation, password toggle, RTL
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import React, { forwardRef, useState, useId as useReactId } from 'react';
import { cn } from '../../utils/cn';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'default' | 'filled' | 'flushed';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
  variant?: InputVariant;
  error?: string;
  helperText?: string;
  label?: string;
  labelAr?: string;
  required?: boolean;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  lang?: 'ar' | 'en';
}

const SIZE_CLASSES: Record<InputSize, string> = {
  sm: 'px-3 py-1.5 text-sm h-8',
  md: 'px-3.5 py-2 text-sm h-10',
  lg: 'px-4 py-2.5 text-base h-12',
};

const VARIANT_CLASSES: Record<InputVariant, string> = {
  default: 'rounded-lg border bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500',
  filled: 'rounded-lg border-0 bg-zinc-100 dark:bg-zinc-800/80 border-transparent hover:bg-zinc-200 dark:hover:bg-zinc-700/80',
  flushed: 'rounded-none border-0 border-b-2 bg-transparent border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500 px-0',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      variant = 'default',
      error,
      helperText,
      label,
      labelAr,
      required,
      leftAddon,
      rightAddon,
      leftElement,
      rightElement,
      lang = 'ar',
      className,
      id: providedId,
      disabled,
      ...props
    },
    ref
  ) => {
    const fallbackId = useReactId();
    const id = providedId || fallbackId;
    const displayLabel = lang === 'ar' ? (labelAr || label) : label;
    const hasError = !!error;
    const isRTL = lang === 'ar';

    return (
      <div className="w-full">
        {/* Label */}
        {displayLabel && (
          <label htmlFor={id} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            {displayLabel}
            {required && <span className="text-red-500 ms-1">*</span>}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative flex items-center">
          {/* Left addon */}
          {leftAddon && (
            <div className={cn(
              'flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-sm border border-r-0 border-zinc-300 dark:border-zinc-600 h-10 px-3 shrink-0',
              isRTL ? 'rounded-r-lg border-r border-l-0' : 'rounded-l-lg border-l border-r-0'
            )}>
              {leftAddon}
            </div>
          )}

          {/* Left element (icon inside input) */}
          {leftElement && !leftAddon && (
            <div className="absolute start-3 text-zinc-400 dark:text-zinc-500 pointer-events-none">
              {leftElement}
            </div>
          )}

          <input
            ref={ref}
            id={id}
            dir={isRTL ? 'rtl' : 'ltr'}
            disabled={disabled}
            className={cn(
              'block w-full text-zinc-900 dark:text-white',
              'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
              'transition-all duration-150',
              SIZE_CLASSES[size],
              VARIANT_CLASSES[variant],
              leftAddon && (isRTL ? 'rounded-l-none' : 'rounded-l-none'),
              rightAddon && (isRTL ? 'rounded-r-none' : 'rounded-r-none'),
              !leftAddon && !rightAddon && (variant === 'default' ? 'rounded-lg' : ''),
              leftElement && 'ps-10',
              rightElement && 'pe-10',
              hasError
                ? 'border-red-300 dark:border-red-600 focus:ring-red-500/20 focus:border-red-500'
                : '',
              disabled && 'opacity-50 cursor-not-allowed bg-zinc-50 dark:bg-zinc-900',
              className
            )}
            aria-invalid={hasError || undefined}
            aria-describedby={hasError ? `${id}-error` : helperText ? `${id}-helper` : undefined}
            aria-required={required || undefined}
            {...props}
          />

          {/* Right element (icon inside input) */}
          {rightElement && !rightAddon && (
            <div className="absolute end-3 text-zinc-400 dark:text-zinc-500">
              {rightElement}
            </div>
          )}

          {/* Right addon */}
          {rightAddon && (
            <div className={cn(
              'flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-sm border border-l-0 border-zinc-300 dark:border-zinc-600 h-10 px-3 shrink-0',
              isRTL ? 'rounded-l-lg border-l border-r-0' : 'rounded-r-lg border-r border-l-0'
            )}>
              {rightAddon}
            </div>
          )}
        </div>

        {/* Error / Helper text */}
        {hasError && (
          <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </p>
        )}
        {!hasError && helperText && (
          <p id={`${id}-helper`} className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ─── Password Input ───────────────────────────────────────────

export interface PasswordInputProps extends Omit<InputProps, 'type' | 'rightElement'> {
  showToggle?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showToggle = true, lang = 'ar', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    return (
      <Input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        lang={lang}
        rightElement={
          showToggle ? (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors focus:outline-none"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          ) : undefined
        }
        {...props}
      />
    );
  }
);
PasswordInput.displayName = 'PasswordInput';
