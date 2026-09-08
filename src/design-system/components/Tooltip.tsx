/**
 * UAMEX ERP™ — Tooltip Component
 * Compound component: Tooltip, TooltipTrigger, TooltipContent
 * Adapted from NICYE design-system components/Tooltip/ with Tailwind CSS
 */

import React, { createContext, useContext, useState, useCallback, useRef, useId as useReactId } from 'react';
import { cn } from '../utils/cn';

interface TooltipContextValue {
  open: boolean;
  triggerId: string;
  contentId: string;
  show: () => void;
  hide: () => void;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

function useTooltipContext() {
  const ctx = useContext(TooltipContext);
  if (!ctx) throw new Error('Tooltip compound components must be used within <Tooltip>');
  return ctx;
}

export type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  delayDuration?: number;
}

export function Tooltip({ defaultOpen = false, open: controlledOpen, onOpenChange, children, delayDuration = 200 }: TooltipProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const id = useReactId();
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!isControlled) setInternalOpen(true);
      onOpenChange?.(true);
    }, delayDuration);
  }, [delayDuration, isControlled, onOpenChange]);

  const hide = useCallback(() => {
    clearTimeout(timerRef.current);
    if (!isControlled) setInternalOpen(false);
    onOpenChange?.(false);
  }, [isControlled, onOpenChange]);

  return (
    <TooltipContext.Provider
      value={{ open, triggerId: `${id}-trigger`, contentId: `${id}-content`, show, hide }}
    >
      <div className="relative inline-flex">{children}</div>
    </TooltipContext.Provider>
  );
}

export interface TooltipTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export function TooltipTrigger({ children }: TooltipTriggerProps) {
  const { triggerId, contentId, open, show, hide } = useTooltipContext();
  return (
    <span
      id={triggerId}
      aria-describedby={open ? contentId : undefined}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      className="inline-flex"
    >
      {children}
    </span>
  );
}

export interface TooltipContentProps {
  children: React.ReactNode;
  side?: TooltipSide;
  className?: string;
}

const sideClasses: Record<TooltipSide, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

export function TooltipContent({ children, side = 'top', className }: TooltipContentProps) {
  const { open, triggerId, contentId } = useTooltipContext();
  if (!open) return null;
  return (
    <div
      id={contentId}
      role="tooltip"
      aria-describedby={triggerId}
      className={cn(
        'absolute z-50 px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 dark:bg-zinc-700 rounded-lg shadow-lg whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95',
        sideClasses[side],
        className
      )}
    >
      {children}
    </div>
  );
}
