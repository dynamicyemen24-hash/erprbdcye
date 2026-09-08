/**
 * UAMEX ERP™ — Accessibility Provider v3.0
 * Provides skip-to-content link, ARIA landmarks, focus management, and reduced motion detection
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { cn } from '../utils/cn';

export interface AccessibilityContextValue {
  reducedMotion: boolean;
  highContrast: boolean;
  focusVisible: boolean;
  skipToContent: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue>({
  reducedMotion: false,
  highContrast: false,
  focusVisible: true,
  skipToContent: () => {},
});

export function useAccessibility() {
  return useContext(AccessibilityContext);
}

export interface AccessibilityProviderProps {
  children: React.ReactNode;
  skipTargetId?: string;
  className?: string;
}

export function AccessibilityProvider({ children, skipTargetId = 'main-content', className }: AccessibilityProviderProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-contrast: more)');
    setHighContrast(mq.matches);
    const handler = (e: MediaQueryListEvent) => setHighContrast(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const skipToContent = useCallback(() => {
    const el = document.getElementById(skipTargetId);
    if (el) {
      el.tabIndex = -1;
      el.focus();
      el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  }, [skipTargetId, reducedMotion]);

  return (
    <AccessibilityContext.Provider value={{ reducedMotion, highContrast, focusVisible: true, skipToContent }}>
      {/* Skip to content link — visible on focus */}
      <a
        href={`#${skipTargetId}`}
        onClick={(e) => { e.preventDefault(); skipToContent(); }}
        className={cn(
          'sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-[9999]',
          'px-4 py-2 rounded-xl text-sm font-bold',
          'bg-emerald-600 text-white shadow-lg',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
          className
        )}
      >
        تخطي إلى المحتوى الرئيسي / Skip to main content
      </a>
      {children}
    </AccessibilityContext.Provider>
  );
}
