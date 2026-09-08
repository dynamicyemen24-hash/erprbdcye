/**
 * UAMEX ERP™ — RTL Utilities
 * Direction-aware helpers adapted from NICYE design-system utils/rtl.ts
 */

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
