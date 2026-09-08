/**
 * UAMEX ERP™ — ARIA Utilities
 * Accessible Rich Internet Applications helpers
 */

export function joinAriaIds(...ids: Array<string | undefined>): string {
  return ids.filter(Boolean).join(' ');
}

export function getAriaBoolean(value: boolean): 'true' | 'false' {
  return value ? 'true' : 'false';
}
