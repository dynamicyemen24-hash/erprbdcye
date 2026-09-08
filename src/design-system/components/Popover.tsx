/**
 * UAMEX ERP™ — Popover Component
 * Compound component: Popover, PopoverTrigger, PopoverContent
 * Adapted from NICYE design-system components/Popover/ with Tailwind CSS
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '../utils/cn';
import { useClickOutside } from '../hooks/useClickOutside';

interface PopoverContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopoverContext() {
  const ctx = useContext(PopoverContext);
  if (!ctx) throw new Error('Popover compound components must be used within <Popover>');
  return ctx;
}

export interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Popover({ children, open: controlledOpen, defaultOpen = false, onOpenChange }: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (v: boolean) => {
      if (!isControlled) setInternalOpen(v);
      onOpenChange?.(v);
    },
    [isControlled, onOpenChange]
  );

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-flex">{children}</div>
    </PopoverContext.Provider>
  );
}

export interface PopoverTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export function PopoverTrigger({ children }: PopoverTriggerProps) {
  const { open, setOpen } = usePopoverContext();
  return (
    <span onClick={() => setOpen(!open)} aria-haspopup="dialog" aria-expanded={open} className="inline-flex">
      {children}
    </span>
  );
}

export interface PopoverContentProps {
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom';
  className?: string;
}

export function PopoverContent({ children, align = 'start', side = 'bottom', className }: PopoverContentProps) {
  const { open, setOpen } = usePopoverContext();
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));

  if (!open) return null;

  const alignClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  };

  const sideClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
  };

  return (
    <div
      ref={ref}
      role="dialog"
      className={cn(
        'absolute z-50 w-72 p-4 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 animate-in fade-in zoom-in-95',
        sideClasses[side],
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  );
}
