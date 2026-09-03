// ═══════════════════════════════════════════════════════════════════════════════
// UAMEX ERP™ — Premium UX Components Index
// One Platform. One Organization. One Vision.
// ═══════════════════════════════════════════════════════════════════════════════

// ── Foundation Experiences (Login → Dashboard → Workspace) ──
export { UAMEXLoginExperience } from './UAMEXLoginExperience';
export { UAMEXDashboardExperience } from './UAMEXDashboardExperience';
export { UAMEXWorkspaceShell, type WorkspaceColumn, type WorkspaceAction } from './UAMEXWorkspaceShell';
export { UAMEXOperationalUnit, type OperationalUnitConfig, type OperationalDomain } from './UAMEXOperationalUnit';

// ── Productivity & Navigation ──
export { ExecutiveCommandBar, type CommandItem } from './ExecutiveCommandBar';
export { SmartFilter, type FilterField, type ActiveFilter, type SavedFilter, type SmartFilterProps } from './SmartFilter';

// ── AI & Insights ──
export { AIInsightsPanel, type AIInsight, type AIInsightsPanelProps } from './AIInsightsPanel';

// ── Data Visualization ──
export { PremiumDataGrid, PremiumDataGridDemo, type DataGridColumn, type DataGridFilter, type DataGridSort, type DataGridSavedView } from './PremiumDataGrid';
export { PremiumMetricCard, PremiumMetricCardDemo, type MetricCardData, type MetricVariant, type MetricSize, type MetricFormat } from './PremiumMetricCard';
export { PremiumTimelineView, PremiumTimelineViewDemo, type TimelineEvent, type TimelineGroup, type TimelineZoom } from './PremiumTimelineView';
export { PremiumChart, PremiumChartDemo, type ChartType, type ChartVariant, type ChartSeries } from './PremiumChart';

// ── UX States & Resilience ──
export { PremiumEmptyState, PremiumErrorBoundary, PremiumLoadingState, type EmptyStateVariant } from './PremiumEmptyState';

// ═══════════════════════════════════════════════════════════════════════════════
// Component Catalog Summary:
// ═══════════════════════════════════════════════════════════════════════════════
// 1.  UAMEXLoginExperience     — Premium multi-step login with biometric/OTP
// 2.  UAMEXDashboardExperience — Executive quantum cockpit dashboard
// 3.  UAMEXWorkspaceShell      — Unified data workspace for 15 NEB domains
// 4.  UAMEXOperationalUnit     — Container for NEB-01 through NEB-15
// 5.  ExecutiveCommandBar      — Cmd+K command palette + AI mode + voice
// 6.  AIInsightsPanel          — NEB-13 AI Intelligence w/ Gemini/Sphere/CHS
// 7.  SmartFilter              — AI-powered natural language filter system
// 8.  PremiumDataGrid          — Advanced data grid (sort/filter/export/edit)
// 9.  PremiumMetricCard        — Deep analytics KPI tile with drill-down
// 10. PremiumTimelineView      — Gantt-style timeline w/ swimlanes
// 11. PremiumChart             — Line/Bar/Area/Donut/Radar charts
// 12. PremiumEmptyState        — 9 elegant empty state variants
// 13. PremiumErrorBoundary     — Resilient error boundary w/ recovery
// 14. PremiumLoadingState      — Premium loading state with animation
// ═══════════════════════════════════════════════════════════════════════════════
