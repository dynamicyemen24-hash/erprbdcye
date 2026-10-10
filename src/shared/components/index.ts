/**
 * Shared components barrel — RETIRED as a component library (DEBT PAID).
 *
 * This directory used to be a third, parallel component vocabulary
 * (`Alert/Badge/Skeleton/Tabs/StatCard/ProgressBar/EmptyState/…` with
 * different variant names from the Design System). Per enterprise
 * single-ownership standards (cf. SAP Fiori / Dynamics Fluent: one control
 * catalogue), all of them now live in `src/design-system/components/`:
 *
 *   shared Alert/Badge/Skeleton/Tabs → design-system Alert/Badge/Skeleton/
 *     EnterpriseAlert/EnterpriseTabs (consumers migrated 1:1)
 *   shared ProgressBar → adopted AS-IS into the Design System
 *     (+1 RTL fix: fill anchors `start-0`)
 *   shared StatCard/EmptyState/FormError/FormField/SuspenseWrapper →
 *     DELETED (zero consumers; `MetricTile`/`EmptyState`/`FormField`
 *     canonicals already exist in the Design System)
 *
 * The single remaining export is `ViewGuidanceBanner`: domain guidance, not
 * a primitive — it has exactly one owner and stays here.
 */
export { ViewGuidanceBanner } from './ViewGuidanceBanner';
