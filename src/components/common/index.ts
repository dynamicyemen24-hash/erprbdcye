/**
 * UAMEX ERP™ — Common Enterprise Components v4.0
 * Barrel export for all shared enterprise-grade UI components.
 *
 * Usage:
 *   import { EnterpriseButton, EnterpriseStatusBadge, EnterpriseKPICard } from '@/components/common';
 *
 * OWNERSHIP (DEBT PAID): generic primitives live in `src/design-system/`
 * (`Alert/Badge/Card/ConfirmDialog/EmptyState/Skeleton/...`). The
 * `Enterprise*` names below are kept ONLY where they carry a contract the
 * canonicals don't cover — collapsible+`ai` banner, explicit
 * open/onConfirm/onCancel dialog, hints+dual-CTA empty state, unit/trend/
 * progress/footer KPI card, in-`<tbody>` table shimmer. All render through
 * Design System motion, buttons, and closed palettes; the `enterpriseTokens`
 * render dependency is gone.
 */

// ── Core Design System ────────────────────────────────────────────────────────
export { EnterpriseButton }          from './EnterpriseButton';
export type { EnterpriseButtonProps } from './EnterpriseButton';

export { EnterpriseStatusBadge }          from './EnterpriseStatusBadge';
export type { EnterpriseStatusBadgeProps, EnterpriseStatusType } from './EnterpriseStatusBadge';

export { EnterpriseAlertBanner }          from './EnterpriseAlertBanner';
export type { EnterpriseAlertBannerProps } from './EnterpriseAlertBanner';

// ── Data Visualization & KPI ──────────────────────────────────────────────────
export { EnterpriseKPICard }          from './EnterpriseKPICard';
export type { EnterpriseKPICardProps } from './EnterpriseKPICard';

// ── Layout & State ────────────────────────────────────────────────────────────
export { EnterpriseEmptyState }          from './EnterpriseEmptyState';
export type { EnterpriseEmptyStateProps } from './EnterpriseEmptyState';

export { default as EnterpriseSkeletonTable } from './EnterpriseSkeletonTable';

export { default as ViewSkeleton }           from './ViewSkeleton';
export { default as SuspenseFallback }       from './SuspenseFallback';

// ── Dialog & Confirmations ─────────────────────────────────────────────────────
export { EnterpriseConfirmDialog }          from './EnterpriseConfirmDialog';
export type { EnterpriseConfirmDialogProps } from './EnterpriseConfirmDialog';

// ── Input & Geospatial ────────────────────────────────────────────────────────
export { default as SmartAutocompleteInput }    from './SmartAutocompleteInput';
export { default as GlobalAddressCascadePicker} from './GlobalAddressCascadePicker';
export { default as InteractiveGlobalMapPicker} from './InteractiveGlobalMapPicker';

// ── Telemetry & Sync ─────────────────────────────────────────────────────────
export { default as OfflineSyncTelemetryBar }   from './OfflineSyncTelemetryBar';

// ── Object Pages ─────────────────────────────────────────────────────────────
export { default as UniversalObjectPageModal }  from './UniversalObjectPageModal';

// ── Icon System ───────────────────────────────────────────────────────────────
export * from './SovereignSystemIcons';
