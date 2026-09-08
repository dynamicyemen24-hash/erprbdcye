/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * UAMEX ERP™ — Enterprise Tabs Component v3.0
 * Accessible tab navigation with RTL support, icons, and badges
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '../utils/cn';
import { useDirection } from '../theme/ThemeContext';

export interface Tab {
  id: string;
  label: string;
  labelAr?: string;
  icon?: React.ReactNode;
  badge?: number | string;
  disabled?: boolean;
}

export interface EnterpriseTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'underline' | 'pill' | 'enclosed';
  fullWidth?: boolean;
  lang?: 'ar' | 'en';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'text-xs px-3 py-1.5 gap-1',
  md: 'text-sm px-4 py-2 gap-1.5',
  lg: 'text-base px-5 py-2.5 gap-2',
};

export function EnterpriseTabs({
  tabs,
  activeTab,
  onTabChange,
  size = 'md',
  variant = 'underline',
  fullWidth = false,
  lang = 'ar',
  className,
}: EnterpriseTabsProps) {
  const { direction } = useDirection();
  const tabListRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, tabId: string) => {
      const enabledTabs = tabs.filter((t) => !t.disabled);
      const currentIdx = enabledTabs.findIndex((t) => t.id === tabId);
      let nextIdx: number | null = null;

      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        const isRtl = direction === 'rtl';
        nextIdx = (currentIdx + dir * (isRtl ? -1 : 1) + enabledTabs.length) % enabledTabs.length;
      } else if (e.key === 'Home') {
        nextIdx = 0;
      } else if (e.key === 'End') {
        nextIdx = enabledTabs.length - 1;
      }

      if (nextIdx !== null) {
        e.preventDefault();
        onTabChange(enabledTabs[nextIdx].id);
      }
    },
    [tabs, onTabChange, direction]
  );

  const variantClasses = {
    underline: 'border-b-2 border-transparent hover:border-zinc-300 dark:hover:border-zinc-600',
    pill: 'rounded-xl',
    enclosed: 'rounded-t-xl border border-b-0 border-zinc-200 dark:border-zinc-700',
  };

  return (
    <div
      ref={tabListRef}
      role="tablist"
      className={cn(
        'flex',
        variant === 'underline' && 'border-b border-zinc-200 dark:border-zinc-700',
        variant === 'pill' && 'gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl',
        fullWidth && 'w-full',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            aria-disabled={tab.disabled}
            tabIndex={isActive ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, tab.id)}
            className={cn(
              'flex items-center font-semibold transition-all whitespace-nowrap',
              SIZE_CLASSES[size],
              variantClasses[variant],
              fullWidth && 'flex-1 justify-center',
              isActive
                ? variant === 'pill'
                  ? 'bg-white dark:bg-zinc-700 shadow-sm text-emerald-600 dark:text-emerald-400'
                  : 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200',
              tab.disabled && 'opacity-40 cursor-not-allowed'
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{lang === 'ar' ? (tab.labelAr || tab.label) : tab.label}</span>
            {tab.badge !== undefined && (
              <span className={cn(
                'shrink-0 min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full flex items-center justify-center',
                isActive
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                  : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
              )}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Tab Panel ───────────────────────────────────────────────

export interface TabPanelProps {
  tabId: string;
  activeTab: string;
  children: React.ReactNode;
  className?: string;
}

export function TabPanel({ tabId, activeTab, children, className }: TabPanelProps) {
  if (tabId !== activeTab) return null;
  return (
    <div
      role="tabpanel"
      id={`tabpanel-${tabId}`}
      aria-labelledby={`tab-${tabId}`}
      tabIndex={0}
      className={cn('focus-visible:outline-none', className)}
    >
      {children}
    </div>
  );
}
