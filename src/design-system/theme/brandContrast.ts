/**
 * WCAG contrast guard for tenant brand colors.
 *
 * A subscriber may pick any color in their theme; light pastels can silently
 * drop text/UI contrast below acceptable ratios. This module quantifies the
 * problem (contrastRatio) and repairs it (ensureMinContrast) by mixing the
 * color toward black or white until the ratio is met — so brand customization
 * can never ship an unreadable interface.
 */

function normalizeHex(hex: string): string {
  const value = hex.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(value)) {
    return `#${value[0]}${value[0]}${value[1]}${value[1]}${value[2]}${value[2]}`.toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(value)) return `#${value.toLowerCase()}`;
  // rgb()/rgba() or unknown — treat as "no color" so callers keep their fallback.
  return '';
}

function channelToLinear(channel255: number): number {
  const v = channel255 / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance (0 = black, 1 = white). Invalid input → 0. */
export function relativeLuminance(hex: string): number {
  const norm = normalizeHex(hex);
  if (!norm) return 0;
  const r = parseInt(norm.slice(1, 3), 16);
  const g = parseInt(norm.slice(3, 5), 16);
  const b = parseInt(norm.slice(5, 7), 16);
  return 0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b);
}

/** WCAG contrast ratio between two hex colors (1 … 21). Invalid input → 1. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

function mixWith(hex: string, target: 'black' | 'white', ratio: number): string {
  const norm = normalizeHex(hex);
  const to = target === 'black' ? 0 : 255;
  const ch = (i: number): number => {
    const c = parseInt(norm.slice(1 + i * 2, 3 + i * 2), 16);
    return Math.round(c + (to - c) * ratio);
  };
  const hex2 = (n: number): string => n.toString(16).padStart(2, '0');
  return `#${hex2(ch(0))}${hex2(ch(1))}${hex2(ch(2))}`;
}

/**
 * Returns `hex` unchanged when it already meets `minRatio` against
 * `background`; otherwise the nearest mix toward black/white that does.
 * Unparseable input is returned unchanged (caller keeps its own fallback).
 */
export function ensureMinContrast(hex: string, background: string, minRatio = 3): string {
  if (!normalizeHex(hex) || !normalizeHex(background)) return hex;
  if (contrastRatio(hex, background) >= minRatio) return hex;

  // Darken toward black on light surfaces, lighten toward white on dark ones.
  const target: 'black' | 'white' = relativeLuminance(background) >= 0.5 ? 'black' : 'white';

  let low = 0;
  let high = 1;
  let best = mixWith(hex, target, 1);
  for (let i = 0; i < 24; i++) {
    const mid = (low + high) / 2;
    const candidate = mixWith(hex, target, mid);
    if (contrastRatio(candidate, background) >= minRatio) {
      best = candidate;
      high = mid;
    } else {
      low = mid;
    }
  }
  return best;
}
