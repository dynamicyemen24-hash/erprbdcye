/**
 * UAMEX ERP™ — cn compatibility shim (DEBT PAID).
 * Canonical implementation lives in `../utils/cn` (tailwind-merge aware).
 * This barrel keeps legacy `from './cn'` imports working while guaranteeing
 * identical conflict-resolution semantics everywhere.
 */
export { cn, cx, default } from '../utils/cn';