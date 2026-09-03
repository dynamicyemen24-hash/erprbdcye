/**
 * UAMEX ERP™ — Common Enterprise Components v4.0
 * Barrel export for all shared enterprise-grade UI components.
 *
 * Usage:
 *   import { EnterpriseButton, EnterpriseStatusBadge, EnterpriseKPICard } from '@/components/common';
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
