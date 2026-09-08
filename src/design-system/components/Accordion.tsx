/**
 * UAMEX ERP™ — Accordion Component
 * Compound component: Accordion, AccordionItem, AccordionTrigger, AccordionContent
 * Adapted from NICYE design-system components/Accordion/ with Tailwind CSS
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '../utils/cn';

interface AccordionContextValue {
  expandedItems: Set<string>;
  toggle: (value: string) => void;
  type: 'single' | 'multiple';
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext() {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error('Accordion compound components must be used within <Accordion>');
  return ctx;
}

export interface AccordionProps {
  children: React.ReactNode;
  type?: 'single' | 'multiple';
  defaultValue?: string[];
  value?: string[];
  onValueChange?: (value: string[]) => void;
  className?: string;
}

export function Accordion({ children, type = 'single', defaultValue = [], value, onValueChange, className }: AccordionProps) {
  const [internalExpanded, setInternalExpanded] = useState<Set<string>>(new Set(defaultValue));
  const isControlled = value !== undefined;
  const expandedItems = isControlled ? new Set(value) : internalExpanded;

  const toggle = useCallback(
    (itemValue: string) => {
      const next = new Set(expandedItems);
      if (next.has(itemValue)) {
        next.delete(itemValue);
      } else {
        if (type === 'single') next.clear();
        next.add(itemValue);
      }
      if (!isControlled) setInternalExpanded(next);
      onValueChange?.(Array.from(next));
    },
    [expandedItems, type, isControlled, onValueChange]
  );

  return (
    <AccordionContext.Provider value={{ expandedItems, toggle, type }}>
      <div className={cn('divide-y divide-zinc-200 dark:divide-zinc-700 rounded-lg border border-zinc-200 dark:border-zinc-700', className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

const ItemContext = createContext<{ value: string; disabled: boolean } | null>(null);

function useItemContext() {
  const ctx = useContext(ItemContext);
  if (!ctx) throw new Error('AccordionItem must be used within <Accordion>');
  return ctx;
}

export function AccordionItem({ value, children, disabled = false, className }: AccordionItemProps) {
  return (
    <ItemContext.Provider value={{ value, disabled }}>
      <div data-state={useAccordionContext().expandedItems.has(value) ? 'open' : 'closed'} className={className}>
        {children}
      </div>
    </ItemContext.Provider>
  );
}

export interface AccordionTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export function AccordionTrigger({ children, className }: AccordionTriggerProps) {
  const { expandedItems, toggle } = useAccordionContext();
  const { value, disabled } = useItemContext();
  const isOpen = expandedItems.has(value);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => toggle(value)}
      aria-expanded={isOpen}
      className={cn(
        'flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-left',
        'text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
      <svg
        className={cn('w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 transition-transform duration-200', isOpen && 'rotate-180')}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

export interface AccordionContentProps {
  children: React.ReactNode;
  className?: string;
}

export function AccordionContent({ children, className }: AccordionContentProps) {
  const { expandedItems } = useAccordionContext();
  const { value } = useItemContext();
  if (!expandedItems.has(value)) return null;
  return (
    <div className={cn('px-4 pb-3 text-sm text-zinc-600 dark:text-zinc-400 animate-in slide-in-from-top-1 fade-in', className)}>
      {children}
    </div>
  );
}
