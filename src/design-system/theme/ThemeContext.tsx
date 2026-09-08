/**
 * UAMEX ERP™ — Theme Context & Provider
 * Adapted from NICYE design-system theme/ThemeContext.tsx + ThemeProvider.tsx
 * Integrated with NexoraOS Tailwind CSS dark mode (class-based)
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  /** Current theme mode preference */
  mode: ThemeMode;
  /** Resolved theme (actual 'light' or 'dark' after system detection) */
  resolvedTheme: 'light' | 'dark';
  /** Set theme mode */
  setMode: (mode: ThemeMode) => void;
  /** Toggle between light and dark */
  toggle: () => void;
  /** Current text direction */
  direction: 'ltr' | 'rtl';
  /** Set text direction */
  setDirection: (dir: 'ltr' | 'rtl') => void;
  /** Current locale */
  locale: string;
  /** Set locale */
  setLocale: (locale: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = 'nexora-theme-mode';
const DIRECTION_STORAGE_KEY = 'nexora-direction';
const LOCALE_STORAGE_KEY = 'nexora-locale';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {}
  return 'dark';
}

function getStoredDirection(): 'ltr' | 'rtl' {
  try {
    const stored = localStorage.getItem(DIRECTION_STORAGE_KEY);
    if (stored === 'ltr' || stored === 'rtl') return stored;
  } catch {}
  return 'rtl';
}

function getStoredLocale(): string {
  try {
    return localStorage.getItem(LOCALE_STORAGE_KEY) || 'ar';
  } catch {}
  return 'ar';
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
  defaultDirection?: 'ltr' | 'rtl';
  defaultLocale?: string;
}

export function ThemeProvider({
  children,
  defaultMode,
  defaultDirection,
  defaultLocale,
}: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(() => defaultMode ?? getStoredTheme());
  const [direction, setDirectionState] = useState<'ltr' | 'rtl'>(() => defaultDirection ?? getStoredDirection());
  const [locale, setLocaleState] = useState(() => defaultLocale ?? getStoredLocale());

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
    mode === 'system' ? getSystemTheme() : mode
  );

  // Resolve system theme
  useEffect(() => {
    if (mode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => setResolvedTheme(e.matches ? 'dark' : 'light');
      mq.addEventListener('change', handler);
      setResolvedTheme(mq.matches ? 'dark' : 'light');
      return () => mq.removeEventListener('change', handler);
    }
    setResolvedTheme(mode);
  }, [mode]);

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  // Apply direction to <html>
  useEffect(() => {
    document.documentElement.dir = direction;
  }, [direction]);

  // Apply lang to <html>
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    try { localStorage.setItem(THEME_STORAGE_KEY, newMode); } catch {}
  }, []);

  const toggle = useCallback(() => {
    setMode(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setMode]);

  const setDirection = useCallback((dir: 'ltr' | 'rtl') => {
    setDirectionState(dir);
    try { localStorage.setItem(DIRECTION_STORAGE_KEY, dir); } catch {}
  }, []);

  const setLocale = useCallback((newLocale: string) => {
    setLocaleState(newLocale);
    setDirection(newLocale === 'ar' ? 'rtl' : 'ltr');
    try { localStorage.setItem(LOCALE_STORAGE_KEY, newLocale); } catch {}
  }, [setDirection]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolvedTheme, setMode, toggle, direction, setDirection, locale, setLocale }),
    [mode, resolvedTheme, setMode, toggle, direction, setDirection, locale, setLocale]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Access theme context. Throws if used outside ThemeProvider.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}

/**
 * Convenience hook: returns isRtl boolean derived from theme direction.
 */
export function useDirection(): { direction: 'ltr' | 'rtl'; isRtl: boolean } {
  const { direction } = useTheme();
  return { direction, isRtl: direction === 'rtl' };
}
