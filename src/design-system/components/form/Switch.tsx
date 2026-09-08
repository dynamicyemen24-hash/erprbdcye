/**
 * UAMEX ERP™ — Switch / Toggle Component
 * Adapted from NICYE design-system components/Switch/ with Tailwind CSS
 */

import React, { forwardRef, useId as useReactId } from 'react';
import { cn } from '../../utils/cn';

export type SwitchSize = 'sm' | 'md' | 'lg';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  size?: SwitchSize;
  label?: string;
  labelAr?: string;
  lang?: 'ar' | 'en';
}

const sizeConfig: Record<SwitchSize, { track: string; thumb: string; translate: string }> = {
  sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'peer-checked:translate-x-4 rtl:peer-checked:-translate-x-4' },
  md: { track: 'w-10 h-5', thumb: 'w-4 h-4', translate: 'peer-checked:translate-x-5 rtl:peer-checked:-translate-x-5' },
  lg: { track: 'w-12 h-6', thumb: 'w-5 h-5', translate: 'peer-checked:translate-x-6 rtl:peer-checked:-translate-x-6' },
};

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ size = 'md', label, labelAr, lang = 'ar', className, id, ...props }, ref) => {
    const displayLabel = lang === 'ar' ? (labelAr || label) : label;
    const fallbackId = useReactId();
    const switchId = id || fallbackId;
    const config = sizeConfig[size];

    return (
      <label htmlFor={switchId} className={cn('inline-flex items-center gap-2 cursor-pointer', props.disabled && 'opacity-50 cursor-not-allowed', className)}>
        <span className="relative inline-flex">
          <input
            ref={ref}
            type="checkbox"
            id={switchId}
            role="switch"
            aria-checked={props.checked}
            className="peer sr-only"
            {...props}
          />
          <span className={cn(
            'rounded-full bg-zinc-300 dark:bg-zinc-600 peer-checked:bg-emerald-600 transition-colors',
            config.track
          )} />
          <span className={cn(
            'absolute top-0.5 start-0.5 rounded-full bg-white shadow-sm transition-transform',
            config.thumb,
            config.translate
          )} />
        </span>
        {displayLabel && (
          <span className="text-sm text-zinc-700 dark:text-zinc-300 select-none">{displayLabel}</span>
        )}
      </label>
    );
  }
);
Switch.displayName = 'Switch';
