/**
 * UAMEX ERP™ — RTL Utilities
 * Direction-aware helpers adapted from NICYE design-system utils/rtl.ts
 */

/**
 * Whether the current runtime is Apple (macOS / iPadOS desktop mode).
 *
 * WHY IT MATTERS: shortcut glyphs are part of the interface, not decoration.
 * Printing "Ctrl + K" on a Mac is the same class of mistake as printing "€"
 * for a YER ledger — the control works, but the instruction misleads the user.
 *
 * Evaluated once at module load (the platform cannot change mid-session) and
 * guarded for SSR/jsdom, where `navigator` exists but reports a Linux UA —
 * tests that assert the non-Apple branch rely on that.
 */
export const IS_APPLE_PLATFORM: boolean =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad|iPod/i.test(
    (navigator as { userAgentData?: { platform?: string }; platform?: string }).userAgentData
      ?.platform ??
      (navigator as { platform?: string }).platform ??
      navigator.userAgent ??
      ''
  );

/** The modifier glyph for the current platform, used in shortcut hints. */
export const MODIFIER_LABEL: string = IS_APPLE_PLATFORM ? '⌘' : 'Ctrl';

export type Direction = 'ltr' | 'rtl';

const RTL_LOCALES = ['ar', 'fa', 'ur', 'he', 'arc', 'ckb', 'mzn', 'ps', 'ug'];

export function isRTL(direction: Direction): boolean {
  return direction === 'rtl';
}

export function isRTLLocale(locale: string): boolean {
  return RTL_LOCALES.includes(locale.toLowerCase());
}

export function getDirection(locale: string): Direction {
  return isRTLLocale(locale) ? 'rtl' : 'ltr';
}

export function logicalStart(direction: Direction): 'left' | 'right' {
  return direction === 'rtl' ? 'right' : 'left';
}

export function logicalEnd(direction: Direction): 'left' | 'right' {
  return direction === 'rtl' ? 'left' : 'right';
}

export function mirrorIndex(index: number, length: number, direction: Direction): number {
  if (direction === 'ltr') return index;
  return length - 1 - index;
}
