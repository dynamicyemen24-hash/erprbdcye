/**
 * UAMEX ERP™ — Keyboard Utilities
 * Keyboard event helpers adapted from NICYE design-system utils/keyboard.ts
 */

export function isArrowKey(event: React.KeyboardEvent): boolean {
  return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);
}

export function isActivationKey(event: React.KeyboardEvent): boolean {
  return event.key === 'Enter' || event.key === ' ';
}

export function isEscapeKey(event: React.KeyboardEvent): boolean {
  return event.key === 'Escape';
}

export function isNavigationKey(event: React.KeyboardEvent): boolean {
  return ['Home', 'End', 'PageUp', 'PageDown'].includes(event.key);
}
