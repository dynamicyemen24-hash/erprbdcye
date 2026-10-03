import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import { contrastRatio, ensureMinContrast, relativeLuminance } from '../theme/brandContrast';

/**
 * Brand / theme truth guards.
 *
 * The failures these catch are silent: a stylesheet still type-checks, builds
 * and passes component tests while the subscriber theme stops propagating, or
 * an external font creeps back in through a print template.
 */

const SRC = join(process.cwd(), 'src');
const readSrc = (p: string) => readFileSync(join(SRC, p), 'utf8');

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|css)$/.test(full)) out.push(full);
  }
  return out;
}

describe('brand token derivation (single source of truth)', () => {
  it('design tokens derive from the --brand-* layer instead of hardcoding brand hexes', () => {
    const tokens = readSrc('design-system/tokens.css');
    expect(tokens).toContain('--ux-primary: var(--brand-primary);');
    expect(tokens).toContain('--ux-accent: var(--brand-accent);');
    expect(tokens).toContain('color-mix(in oklab, var(--brand-primary)');
    expect(tokens).toContain('color-mix(in oklab, var(--brand-accent)');
  });

  it('no brand hex (#059669/#d97706) is hardcoded in the ux token layer anymore', () => {
    const tokens = readSrc('design-system/tokens.css');
    expect(tokens).not.toContain('#059669');
    expect(tokens).not.toContain('#d97706');
  });

  it('index.css declares the global NexoraOS brand defaults', () => {
    const css = readSrc('index.css');
    expect(css).toContain('--brand-primary: #059669');
    expect(css).toContain('--brand-accent: #d97706');
  });

  it('scopes tenant palette derivation behind html[data-tenant-brand="custom"]', () => {
    const css = readSrc('index.css');
    expect(css).toContain('html[data-tenant-brand="custom"]');
    // Full-scale derivation — the old hijack touched only 3 shades.
    expect(css).toContain('--color-emerald-500: var(--brand-primary);');
    expect(css).toContain('--color-amber-500: var(--brand-accent);');
    expect(css).toContain('--color-emerald-700:');
    expect(css).toContain('--color-amber-700:');
  });

  it('EnterpriseContext no longer injects dead or partial palette overrides inline', () => {
    const ctx = readSrc('core/context/EnterpriseContext.tsx');
    expect(ctx).not.toContain("setProperty('--color-emerald-");
    expect(ctx).not.toContain("setProperty('--color-primary'");
    expect(ctx).toContain("setAttribute('data-tenant-brand', 'custom')");
    expect(ctx).toContain('FALLBACK_BRAND');
  });

  it('App.tsx injects contrast-guarded brand values', () => {
    const app = readSrc('App.tsx');
    expect(app).toContain('ensureMinContrast(branding.primaryColor');
    expect(app).toContain("root.style.setProperty('--brand-primary'");
  });
});

describe('no external font dependencies can return', () => {
  it('src/ and index.html reference no Google Fonts origin', () => {
    for (const file of walk(SRC)) {
      const text = readFileSync(file, 'utf8');
      expect(text, `${file} must not load Google Fonts`).not.toMatch(
        /fonts\.(googleapis|gstatic)\.com/
      );
    }
    const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
    expect(html).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
  });
});

describe('theme authority bridge', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(ThemeProvider, undefined, children);

  it('reads the legacy rbd_theme preference when the unified key is absent', () => {
    localStorage.setItem('rbd_theme', 'light');
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.mode).toBe('light');
  });

  it('prefers the unified key over the legacy one', () => {
    localStorage.setItem('rbd_theme', 'light');
    localStorage.setItem('nexora-theme-mode', 'dark');
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.mode).toBe('dark');
  });

  it('writes through to both keys so EnterpriseContext stays in agreement', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.setMode('dark'));
    expect(localStorage.getItem('nexora-theme-mode')).toBe('dark');
    expect(localStorage.getItem('rbd_theme')).toBe('dark');
    act(() => result.current.setMode('light'));
    expect(localStorage.getItem('nexora-theme-mode')).toBe('light');
    expect(localStorage.getItem('rbd_theme')).toBe('light');
  });

  it('follows the controlled mode passed by the app shell', () => {
    localStorage.setItem('rbd_theme', 'light');
    const controlled = ({ children }: { children: React.ReactNode }) =>
      React.createElement(ThemeProvider, { mode: 'dark', children });
    const { result } = renderHook(() => useTheme(), { wrapper: controlled });
    expect(result.current.mode).toBe('dark');
  });
});

describe('WCAG contrast guard', () => {
  it('computes known WCAG ratios', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
  });

  it('keeps a color that already meets the ratio unchanged', () => {
    const brand = '#059669';
    expect(ensureMinContrast(brand, '#f8fafc', 3)).toBe(brand);
  });

  it('repairs a failing color until the ratio is met (light surface)', () => {
    const repaired = ensureMinContrast('#ffffff', '#ffffff', 3);
    expect(repaired).not.toBe('#ffffff');
    expect(contrastRatio(repaired, '#ffffff')).toBeGreaterThanOrEqual(3);
  });

  it('repairs a failing color until the ratio is met (dark surface)', () => {
    const repaired = ensureMinContrast('#000000', '#090d16', 3);
    expect(repaired).not.toBe('#000000');
    expect(contrastRatio(repaired, '#090d16')).toBeGreaterThanOrEqual(3);
  });

  it('passes invalid input through untouched (caller keeps its fallback)', () => {
    expect(ensureMinContrast('brand-blue', '#ffffff', 3)).toBe('brand-blue');
  });

  it('short hex is accepted', () => {
    expect(relativeLuminance('#fff')).toBeCloseTo(1, 5);
    const repaired = ensureMinContrast('#abc', '#ffffff', 3);
    expect(contrastRatio(repaired, '#ffffff')).toBeGreaterThanOrEqual(3);
  });
});
