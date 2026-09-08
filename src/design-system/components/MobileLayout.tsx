/**
 * UAMEX ERP™ — Mobile Layout Component v3.0
 * Responsive mobile navigation with bottom tab bar, pull-to-refresh, and swipe gestures
 */

import React, { useState, useRef, useCallback } from 'react';
import { cn } from '../utils/cn';
import { useDirection } from '../theme/ThemeContext';

export interface MobileTab {
  id: string;
  label: string;
  labelAr?: string;
  icon: React.ReactNode;
  badge?: number;
}

export interface MobileLayoutProps {
  tabs: MobileTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
  lang?: 'ar' | 'en';
  onRefresh?: () => void;
  className?: string;
}

export function MobileLayout({ tabs, activeTab, onTabChange, children, lang = 'ar', onRefresh, className }: MobileLayoutProps) {
  const { direction } = useDirection();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!onRefresh) return;
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  }, [onRefresh]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || !onRefresh) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0 && diff < 150) {
      setPullDistance(diff);
    }
  }, [onRefresh]);

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current || !onRefresh) return;
    isDragging.current = false;
    if (pullDistance > 80) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, onRefresh]);

  return (
    <div className={cn('flex flex-col h-screen bg-zinc-50 dark:bg-zinc-950', className)} dir={direction}>
      {/* Pull to refresh indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="flex items-center justify-center overflow-hidden transition-all"
          style={{ height: isRefreshing ? 48 : pullDistance * 0.5 }}
        >
          <div className={cn(
            'w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full',
            isRefreshing && 'animate-spin'
          )} />
        </div>
      )}

      {/* Main content area */}
      <div
        id="main-content"
        className="flex-1 overflow-y-auto overscroll-contain pb-20"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-lg border-t border-zinc-200 dark:border-zinc-800 safe-area-inset-bottom" role="tablist">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[56px]',
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
                )}
              >
                <div className="relative">
                  {tab.icon}
                  {tab.badge && tab.badge > 0 && (
                    <span className="absolute -top-1 -end-1 w-4 h-4 text-[9px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center">
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold truncate max-w-[56px]">
                  {lang === 'ar' ? (tab.labelAr || tab.label) : tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
