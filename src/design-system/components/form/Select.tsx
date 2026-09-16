/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * UAMEX ERP™ — Select Component v3.0
 * Premium select with search, grouped options, validation
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import React, { forwardRef, useState, useId as useReactId, useRef, useEffect, useMemo } from 'react';
import { cn } from '../../utils/cn';

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectOption {
  value: string;
  labelAr: string;
  labelEn: string;
  disabled?: boolean;
  group?: string;
  icon?: React.ReactNode;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children' | 'size'> {
  size?: SelectSize;
  error?: string;
  helperText?: string;
  label?: string;
  labelAr?: string;
  required?: boolean;
  options: SelectOption[];
  placeholder?: string;
  placeholderAr?: string;
  searchable?: boolean;
  lang?: 'ar' | 'en';
}

const SIZE_CLASSES: Record<SelectSize, string> = {
  sm: 'px-3 py-1.5 text-sm h-8',
  md: 'px-3.5 py-2 text-sm h-10',
  lg: 'px-4 py-2.5 text-base h-12',
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      size = 'md',
      error,
      helperText,
      label,
      labelAr,
      required,
      options,
      placeholder,
      placeholderAr,
      searchable = false,
      lang = 'ar',
      className,
      id: providedId,
      disabled,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const fallbackId = useReactId();
    const id = providedId || fallbackId;
    const displayLabel = lang === 'ar' ? (labelAr || label) : label;
    const hasError = !!error;
    const isRTL = lang === 'ar';

    if (searchable) {
      return (
        <SearchableSelect
          id={id}
          size={size}
          error={error}
          helperText={helperText}
          label={displayLabel}
          required={required}
          options={options}
          placeholder={lang === 'ar' ? (placeholderAr || placeholder || 'اختر...') : (placeholder || 'Select...')}
          lang={lang}
          disabled={disabled}
          value={value}
          onChange={onChange}
          className={className}
          {...props}
        />
      );
    }

    const displayPlaceholder = lang === 'ar' ? (placeholderAr || placeholder || 'اختر...') : (placeholder || 'Select...');

    return (
      <div className="w-full">
        {displayLabel && (
          <label htmlFor={id} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            {displayLabel}
            {required && <span className="text-red-500 ms-1">*</span>}
          </label>
        )}

        <select
          ref={ref}
          id={id}
          dir={isRTL ? 'rtl' : 'ltr'}
          disabled={disabled}
          value={value}
          onChange={onChange}
          className={cn(
            'block w-full rounded-lg border bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
            'transition-all duration-150 appearance-none',
            'bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E")] bg-[length:1.25rem] bg-[position:right_0.5rem_center] rtl:bg-[position:left_0.5rem_center] pe-8',
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
        >
          <option value="">{displayPlaceholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {lang === 'ar' ? opt.labelAr : opt.labelEn}
            </option>
          ))}
        </select>

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
Select.displayName = 'Select';

// ─── Searchable Select (Internal) ─────────────────────────────

type SearchableSelectProps = Omit<SelectProps, 'searchable'>;

function SearchableSelect({ id, size, error, helperText, label, required, options, placeholder, lang, disabled, value, onChange, className }: SearchableSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [highlightIndex, setHighlightIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const hasError = !!error;
    const isRTL = lang === 'ar';

    const filtered = useMemo(() => {
      if (!search) return options;
      const q = search.toLowerCase();
      return options.filter((opt) => {
        const label = isRTL ? opt.labelAr : opt.labelEn;
        return label.toLowerCase().includes(q);
      });
    }, [options, search, isRTL]);

    const selectedOption = options.find((opt) => opt.value === value);

    // Close on outside click
    useEffect(() => {
      if (!open) return;
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false);
          setSearch('');
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightIndex((i) => Math.max(i - 1, 0)); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        const opt = filtered[highlightIndex];
        if (opt) {
          onChange?.({ target: { value: opt.value } } as any);
          setOpen(false);
          setSearch('');
        }
      }
      else if (e.key === 'Escape') { setOpen(false); setSearch(''); }
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            {label}
            {required && <span className="text-red-500 ms-1">*</span>}
          </label>
        )}

        <div ref={containerRef} className="relative">
          <button
            type="button"
            onClick={() => { if (!disabled) { setOpen(!open); setTimeout(() => inputRef.current?.focus(), 0); } }}
            disabled={disabled}
            className={cn(
              'flex items-center justify-between w-full rounded-lg border bg-white dark:bg-zinc-800 text-sm',
              'transition-all duration-150 appearance-none',
              'bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E")] bg-[length:1.25rem] bg-[position:right_0.5rem_center] rtl:bg-[position:left_0.5rem_center] pe-8',
              'px-3.5 py-2 h-10 text-left rtl:text-right',
              hasError
                ? 'border-red-300 dark:border-red-600'
                : 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500',
              open && 'ring-2 ring-emerald-500/20 border-emerald-500',
              disabled && 'opacity-50 cursor-not-allowed',
              !selectedOption && 'text-zinc-400 dark:text-zinc-500'
            )}
          >
            <span className="truncate">{selectedOption ? (isRTL ? selectedOption.labelAr : selectedOption.labelEn) : placeholder}</span>
          </button>

          {open && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              <div className="p-2 border-b border-zinc-200 dark:border-zinc-700">
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setHighlightIndex(0); }}
                  onKeyDown={handleKeyDown}
                  placeholder={isRTL ? 'بحث...' : 'Search...'}
                  className="w-full px-3 py-1.5 text-sm bg-transparent outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400"
                />
              </div>
              <div className="max-h-48 overflow-y-auto py-1">
                {filtered.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400 text-center">
                    {isRTL ? 'لا توجد نتائج' : 'No results'}
                  </div>
                ) : (
                  filtered.map((opt, i) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange?.({ target: { value: opt.value } } as any);
                        setOpen(false);
                        setSearch('');
                      }}
                      className={cn(
                        'w-full px-3 py-2 text-sm text-left rtl:text-right transition-colors',
                        opt.value === value
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-medium'
                          : i === highlightIndex
                            ? 'bg-zinc-100 dark:bg-zinc-700'
                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50',
                        opt.disabled && 'opacity-50 cursor-not-allowed'
                      )}
                      disabled={opt.disabled}
                    >
                      {opt.icon && <span className="me-2 inline-flex">{opt.icon}</span>}
                      {isRTL ? opt.labelAr : opt.labelEn}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {hasError && (
          <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </p>
        )}
        {!hasError && helperText && (
          <p id={`${id}-helper`} className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">{helperText}</p>
        )}
      </div>
    );
  }
SearchableSelect.displayName = 'SearchableSelect';
