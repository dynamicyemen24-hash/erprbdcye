/**
 * UAMEX ERP™ — Class Name Utility
 * Merges class names conditionally, filtering falsy values.
 * Adapted from NICYE design-system utils/cn.ts for Tailwind CSS.
 */

export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

export default cn;
