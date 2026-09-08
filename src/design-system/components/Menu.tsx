/**
 * UAMEX ERP™ — Menu Component
 * Compound component: Menu, MenuTrigger, MenuContent, MenuItem, MenuSeparator, MenuGroup, MenuLabel
 * Adapted from NICYE design-system components/Menu/ with Tailwind CSS
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '../utils/cn';
import { useClickOutside } from '../hooks/useClickOutside';

interface MenuContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  close: () => void;
}

const MenuContext = createContext<MenuContextValue | null>(null);

function useMenuContext() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('Menu compound components must be used within <Menu>');
  return ctx;
}

export interface MenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Menu({ children, open: controlledOpen, onOpenChange }: MenuProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (v: boolean) => {
      if (!isControlled) setInternalOpen(v);
      onOpenChange?.(v);
    },
    [isControlled, onOpenChange]
  );

  const close = useCallback(() => setOpen(false), [setOpen]);

  return (
    <MenuContext.Provider value={{ open, setOpen, close }}>
      <div className="relative inline-flex">{children}</div>
    </MenuContext.Provider>
  );
}

export interface MenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export function MenuTrigger({ children }: MenuTriggerProps) {
  const { open, setOpen } = useMenuContext();
  return (
    <span onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open} className="inline-flex">
      {children}
    </span>
  );
}

export interface MenuContentProps {
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
}

export function MenuContent({ children, align = 'start', className }: MenuContentProps) {
  const { open, close } = useMenuContext();
  const ref = useClickOutside<HTMLDivElement>(close);

  if (!open) return null;

  const alignClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  };

  return (
    <div
      ref={ref}
      role="menu"
      className={cn(
        'absolute top-full mt-1 z-50 min-w-[12rem] py-1 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 animate-in fade-in zoom-in-95',
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  );
}

export interface MenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function MenuItem({ children, onClick, disabled = false, danger = false, icon, className }: MenuItemProps) {
  const { close } = useMenuContext();
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={() => { if (!disabled) { onClick?.(); close(); } }}
      className={cn(
        'flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors',
        'focus-visible:outline-none focus-visible:bg-zinc-100 dark:focus-visible:bg-zinc-700',
        danger ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

export function MenuSeparator({ className }: { className?: string }) {
  return <div className={cn('my-1 h-px bg-zinc-200 dark:bg-zinc-700', className)} role="separator" />;
}

export interface MenuGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function MenuGroup({ children, className }: MenuGroupProps) {
  return <div role="group" className={cn('py-1', className)}>{children}</div>;
}

export interface MenuLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function MenuLabel({ children, className }: MenuLabelProps) {
  return <div role="presentation" className={cn('px-3 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400', className)}>{children}</div>;
}
