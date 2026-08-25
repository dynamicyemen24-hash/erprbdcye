/**
 * NexoraOS™ — Secure ID Generation
 * Replaces Math.random() with cryptographically secure alternatives.
 */

/**
 * Generate a cryptographically secure unique ID.
 * Uses crypto.randomUUID() which is available in all modern browsers and Node 19+.
 */
export function generateId(prefix?: string): string {
  const uuid = crypto.randomUUID();
  return prefix ? `${prefix}-${uuid}` : uuid;
}

/**
 * Generate a short cryptographically secure ID (first 8 chars of UUID).
 * Useful for display codes where full UUID is too long.
 */
export function generateShortId(prefix?: string): string {
  const short = crypto.randomUUID().replace(/-/g, '').substring(0, 8);
  return prefix ? `${prefix}-${short}` : short;
}

/**
 * Generate a numeric code within a range using crypto.getRandomValues.
 * Replaces Math.floor(Math.random() * N) patterns.
 */
export function generateNumericCode(min: number, max: number): number {
  const range = max - min + 1;
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return min + (array[0] % range);
}

/**
 * Generate a formatted reference code (e.g., PO-YEM-2026-123).
 * Replaces patterns like `PO-YEM-${year}-${Math.floor(100 + Math.random() * 900)}`.
 */
export function generateRefCode(prefix: string, year?: number, digits: number = 3): string {
  const y = year || new Date().getFullYear();
  const max = Math.pow(10, digits) - 1;
  const min = Math.pow(10, digits - 1);
  const code = generateNumericCode(min, max);
  return `${prefix}-${y}-${code}`;
}
