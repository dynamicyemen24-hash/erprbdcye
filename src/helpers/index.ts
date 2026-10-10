/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NexoraOS™ — Pure Helpers Barrel (DEBT PAID: helpers vs core separation)
 *
 * BOUNDARY RULE (enforced by review, not by bundler):
 *   helpers = pure, stateless, no I/O.
 *   A helper MUST NOT call fetch, MUST NOT touch localStorage/sessionStorage,
 *   MUST NOT touch document/window except through an explicitly passed argument.
 *   Anything with network, storage, or context side-effects belongs in
 *   `src/core/*` (operations) or `src/lib/*` (mature infra), never here.
 *
 * This barrel is the ONLY public entry for pure helpers. `src/utils/*`,
 * `src/shared/utils/*` and `src/core/utils/arabicSearch` remain as
 * backward-compatible re-exports so existing imports keep working, but new
 * code MUST import from `@/helpers` (or `../../helpers`).
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Text / search (pure) — canonical owner, re-exported for compat by core/utils.
export {
  normalizeArabicText,
  fuzzyMatchArabic,
} from '../core/utils/arabicSearch';

// Formatting (pure)
export {
  formatCurrency,
  formatNumber,
  formatDate,
} from '../shared/utils/formatters';

// Export engine facades stay in core/export (they do I/O) — helpers only
// re-expose the pure filename builder so callers don't reach into core.
export function buildExportFileName(base: string, ext: 'xlsx' | 'csv' | 'pdf'): string {
  const stamp = new Date().toISOString().slice(0, 10);
  const safe = base.trim().replace(/\s+/g, '-').slice(0, 60) || 'export';
  return `${safe}-${stamp}.${ext}`;
}
