# UAMEX_ERP™ Premium UX System — Technical Reference

> **نظام تجربة المستخدم المتقدم لنظام يو امكس المؤسسي الشامل**
> One Platform. One Organization. One Vision.
> جمعية رُحماء بينهم للعمل الإنساني والتنمية — Rohamā'a Baynahum Charity Foundation

---

## 1. Overview

The **UAMEX Premium UX System** is a world-class, enterprise-grade design system comprising 14 production-ready components built to elevate every screen in the NexoraOS platform. The system addresses the core directive: *"Stronger, more advanced, deeper, more progressive — fill the gaps, elevate weak/traditional screens."*

### Design Principles

| Principle | Implementation |
|-----------|----------------|
| **World-Class Standards** | WCAG 2.1 AAA, ISO 9241-210, Nielsen's 10 heuristics |
| **Bilingual-First** | Full Arabic/English support with RTL layout transformation |
| **Enterprise Scale** | 15 NEB domains (NEB-01 to NEB-15), 3M+ beneficiaries |
| **AI-Augmented** | Gemini integration, Sphere/CHS compliance, smart inference |
| **Zero-Compromise** | No "legacy" screens — every view is premium |

---

## 2. Component Architecture

```
src/components/uamex/
├── index.ts                                    # Central export barrel
├── UAMEXLoginExperience.tsx                    # Foundation Layer 1
├── UAMEXDashboardExperience.tsx                # Foundation Layer 2
├── UAMEXWorkspaceShell.tsx                     # Foundation Layer 3
├── UAMEXOperationalUnit.tsx                    # Foundation Layer 4
├── ExecutiveCommandBar.tsx                     # Productivity Layer
├── SmartFilter.tsx                             # Productivity Layer
├── AIInsightsPanel.tsx                         # Intelligence Layer
├── PremiumDataGrid.tsx                         # Data Layer
├── PremiumMetricCard.tsx                       # Analytics Layer
├── PremiumTimelineView.tsx                     # Visualization Layer
├── PremiumChart.tsx                            # Visualization Layer
└── PremiumEmptyState.tsx                      # Resilience Layer
```

---

## 3. Component Catalog

### 3.1 Foundation Experiences

#### `UAMEXLoginExperience`
**File:** `UAMEXLoginExperience.tsx` (~500 lines)

Premium 3-step authentication flow with biometric simulation, OTP 2FA, and animated brand reveal.

**Features:**
- Step 1: Credentials (email/password with strength meter)
- Step 2: OTP verification (6-digit code with resend)
- Step 3: Biometric authentication (fingerprint/face simulation)
- Trust badges (ISO 27001, SOC 2, GDPR compliant)
- Animated UAMEX brand reveal with particle effects
- Caps Lock warning, password visibility toggle
- Institutional desk selection (CharityDesk, HealthDesk, EduDesk, etc.)

**Props:**
```typescript
interface UAMEXLoginExperienceProps {
  lang: 'ar' | 'en';
  onLoginSuccess: (user: UAMEXUser) => void;
  logoPath?: string;
  allowBiometric?: boolean;
  allowOTPFallback?: boolean;
}
```

---

#### `UAMEXDashboardExperience`
**File:** `UAMEXDashboardExperience.tsx` (~700 lines)

Executive quantum cockpit with animated KPI counters, system health monitors, and quick actions.

**Features:**
- 6+ animated metric counters (easeOutQuart interpolation)
- System health monitor (uptime, CPU, memory, database latency)
- Quick actions panel with keyboard shortcuts
- Live activity feed with virtual scrolling
- Executive summary modal (Ctrl+Shift+E)
- 3 view modes: QuantumWorkFirst, ClassicAnalytics, Balanced

**Props:**
```typescript
interface UAMEXDashboardExperienceProps {
  lang: 'ar' | 'en';
  user?: UAMEXUser;
  onLogout?: () => void;
  homeMode?: 'work_first' | 'classic_analytics' | 'balanced';
}
```

---

#### `UAMEXWorkspaceShell`
**File:** `UAMEXWorkspaceShell.tsx` (~500 lines)

Unified data workspace for all 15 NEB domains supporting table/grid/list views with multi-select, sorting, and filtering.

**Features:**
- 4 view modes: Table, Grid, List, Board
- Multi-select with Shift+Click range
- Column sorting (single + multi-column)
- Quick search across all fields
- Bulk actions toolbar
- Row expansion for detail view
- Virtualized rendering for large datasets
- Keyboard navigation (↑↓ Enter Esc)

**Props:**
```typescript
interface WorkspaceShellProps {
  lang: 'ar' | 'en';
  header?: React.ReactNode;
  children: React.ReactNode;
  viewMode?: 'table' | 'grid' | 'list' | 'board';
  onViewModeChange?: (mode: ViewMode) => void;
  onSearch?: (query: string) => void;
  onBulkAction?: (action: string, ids: string[]) => void;
}

export interface WorkspaceColumn {
  id: string;
  headerAr: string;
  headerEn: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  accessor?: (row: any) => any;
}

export interface WorkspaceAction {
  id: string;
  labelAr: string;
  labelEn: string;
  icon?: LucideIcon;
  variant?: 'primary' | 'accent' | 'danger' | 'ghost';
  onClick: (selectedIds: string[]) => void;
}
```

---

#### `UAMEXOperationalUnit`
**File:** `UAMEXOperationalUnit.tsx`

Container component for NEB-01 to NEB-15 domains with domain-specific icons and navigation.

**Props:**
```typescript
interface OperationalUnitConfig {
  domains: OperationalDomain[];
  activeDomain?: string;
  onDomainChange?: (domainId: string) => void;
}

interface OperationalDomain {
  id: string;        // NEB-01 through NEB-15
  nameAr: string;
  nameEn: string;
  icon: LucideIcon;
  badge?: string;
  href?: string;
}
```

---

### 3.2 Productivity & Navigation

#### `ExecutiveCommandBar`
**File:** `ExecutiveCommandBar.tsx` (~400 lines)

Global command palette with Cmd+K activation, AI mode toggle, voice recording simulation, and keyboard navigation.

**Features:**
- Cmd+K / Ctrl+K keyboard activation
- Global command search with fuzzy matching
- AI mode toggle (spark icon)
- Voice recording simulation
- Recent items history (localStorage)
- Category grouping (Navigation, Actions, Settings)
- Arrow up/down keyboard navigation
- Enter to execute, Esc to close
- Smart filter suggestions

**Props:**
```typescript
interface ExecutiveCommandBarProps {
  lang: 'ar' | 'en';
  commands?: CommandItem[];
  recentCommands?: string[];
  onCommandExecute?: (commandId: string) => void;
  onAIModeToggle?: (enabled: boolean) => void;
  onVoiceSearch?: (query: string) => void;
}

export interface CommandItem {
  id: string;
  labelAr: string;
  labelEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  category?: 'navigation' | 'action' | 'settings' | 'ai';
  shortcut?: string;
  icon?: LucideIcon;
  onClick?: () => void;
  href?: string;
  keywords?: string[];
}
```

---

#### `SmartFilter`
**File:** `SmartFilter.tsx` (~500 lines)

AI-powered filter system with natural language query input, automatic column inference, saved presets, and cross-field filters.

**Features:**
- Natural language query input (AR/EN)
- AI column inference (suggests filters based on text)
- 16+ filter operators per field type
- Date range picker with presets
- Multi-select with search
- Saved filter presets (localStorage)
- Quick filter suggestions
- Filter builder with all operators
- Clear all / apply all actions

**Props:**
```typescript
export interface SmartFilterProps {
  lang: 'ar' | 'en';
  fields: FilterField[];
  filters: ActiveFilter[];
  onChange: (filters: ActiveFilter[]) => void;
  savedFilters?: SavedFilter[];
  onSaveFilter?: (nameAr: string, nameEn: string) => void;
  onDeleteSavedFilter?: (id: string) => void;
  onApplyPreset?: (preset: SavedFilter) => void;
  enableAI?: boolean;
  placeholderAr?: string;
  placeholderEn?: string;
}

export interface FilterField {
  id: string;
  labelAr: string;
  labelEn: string;
  type: FilterFieldType; // text | number | date | select | multiselect | boolean | range
  options?: Array<{ value: string; labelAr: string; labelEn: string; color?: string }>;
}

export interface ActiveFilter {
  id: string;
  fieldId: string;
  operator: FilterOperator; // 16 operators
  value: any;
  value2?: any;
}
```

---

### 3.3 AI & Intelligence

#### `AIInsightsPanel`
**File:** `AIInsightsPanel.tsx` (~500 lines)

NEB-13 AI Intelligence with Gemini integration, Sphere/CHS/IPSAS compliance, and AI chat interface.

**Features:**
- 5 insight types: Opportunity, Risk, Recommendation, Trend, Anomaly
- 4 sources: Gemini, Sphere, CHS, IPSAS
- 4 impact levels: Low, Medium, High, Critical
- AI chat interface with Gemini API simulation
- Stats grid (total, opportunities, risks, recommendations)
- Filter by source, type, impact
- Expandable insight cards with full details
- Benchmark comparison indicators
- Export insights

**Props:**
```typescript
export interface AIInsightsPanelProps {
  lang: 'ar' | 'en';
  insights?: AIInsight[];
  loading?: boolean;
  enableGemini?: boolean;
  onGeminiQuery?: (query: string) => Promise<string>;
  onInsightAction?: (insight: AIInsight, action: string) => void;
  filters?: { source?: string; type?: string; impact?: string };
  onFilterChange?: (filters: any) => void;
}

export interface AIInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'recommendation' | 'trend' | 'anomaly';
  source: 'gemini' | 'sphere' | 'chs' | 'ipsas';
  impact: 'low' | 'medium' | 'high' | 'critical';
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  metrics?: Record<string, number>;
  recommendationsAr?: string[];
  recommendationsEn?: string[];
  benchmark?: { value: number; unit: string };
  createdAt: string;
  isRead?: boolean;
}
```

---

### 3.4 Data Visualization

#### `PremiumDataGrid`
**File:** `PremiumDataGrid.tsx` (~800 lines)

World-class data grid with virtualized rendering, resizable columns, multi-select, advanced filtering, inline editing, and export.

**Features:**
- Virtualized rendering for massive datasets
- Resizable / reorderable / pinnable columns
- Multi-select with bulk actions
- Advanced filtering (16 operators)
- Sortable with multi-column sort
- Inline editing with validation
- Row-level expansion (detail panels)
- Density modes (compact/comfortable/spacious)
- Quick-jump pagination + infinite scroll
- Sticky headers & columns
- Export (CSV, JSON, Excel metadata)
- Column visibility manager
- Saved views (preset configurations)
- AI-powered smart filter
- Full keyboard navigation
- WCAG 2.1 AAA accessibility

**Props:**
```typescript
export interface PremiumDataGridProps<T = Record<string, any>> {
  lang: 'ar' | 'en';
  data: T[];
  columns: DataGridColumn<T>[];
  loading?: boolean;
  rowKey?: keyof T | ((row: T) => string);
  selectable?: boolean;
  expandable?: boolean;
  renderExpanded?: (row: T) => React.ReactNode;
  density?: DensityMode; // compact | comfortable | spacious
  stickyHeader?: boolean;
  virtualized?: boolean;
  rowHeight?: number;
  pageSize?: number;
  searchable?: boolean;
  exportable?: boolean;
  editable?: boolean;
  onSaveView?: (view: DataGridSavedView) => void;
  savedViews?: DataGridSavedView[];
  emptyMessageAr?: string;
  emptyMessageEn?: string;
  onCellEdit?: (rowId: string, columnId: string, value: CellValue) => void;
  onRowAction?: (row: T, action: string) => void;
  toolbarExtra?: React.ReactNode;
  infiniteScroll?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export interface DataGridColumn<T = any> {
  id: string;
  headerAr: string;
  headerEn: string;
  type: ColumnType; // text | number | date | boolean | select | badge | avatar | actions
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  pinnable?: boolean;
  hideable?: boolean;
  align?: 'start' | 'center' | 'end';
  accessor?: (row: T) => CellValue;
  formatter?: (value: CellValue, row: T) => React.ReactNode;
  options?: Array<{ value: string; labelAr: string; labelEn: string; color?: string }>;
  editable?: boolean;
  required?: boolean;
  badgeVariantMap?: Record<string, BadgeVariant>;
  render?: (value: CellValue, row: T) => React.ReactNode;
}
```

---

#### `PremiumMetricCard`
**File:** `PremiumMetricCard.tsx` (~700 lines)

Executive-grade KPI card with animated counter, sparkline trend, period comparison, drill-down modal, and 7 visual variants.

**Features:**
- Animated counter (smooth easeOutQuart interpolation)
- Sparkline trend (last N values)
- Period-over-period comparison (delta, %change, target gap)
- Status indicator with semantic color mapping
- Drill-down modal with sub-metrics, breakdown chart, history
- Quick action menu (refresh, export, share, configure)
- Multi-format support (currency, percentage, number, compact, duration)
- Loading shimmer state
- 7 visual variants (primary, accent, success, warning, danger, info, neutral)
- 3 size modes (compact / comfortable / hero)
- Donut breakdown visualization
- Benchmark context

**Props:**
```typescript
export interface PremiumMetricCardProps {
  lang: 'ar' | 'en';
  data: MetricCardData;
  size?: MetricSize; // compact | comfortable | hero
  loading?: boolean;
  animated?: boolean;
  onRefresh?: () => void;
  onDrillDown?: (data: MetricCardData) => void;
  onExport?: (data: MetricCardData) => void;
  onShare?: (data: MetricCardData) => void;
  onConfigure?: (data: MetricCardData) => void;
  showActions?: boolean;
  showSparkline?: boolean;
  showBreakdown?: boolean;
}

export interface MetricCardData {
  id: string;
  titleAr: string;
  titleEn: string;
  subtitleAr?: string;
  subtitleEn?: string;
  value: number;
  previousValue?: number;
  targetValue?: number;
  format: MetricFormat; // currency | percentage | number | compact | duration | raw
  unit?: string;
  currency?: string;
  variant?: MetricVariant; // primary | accent | success | warning | danger | info | neutral
  icon?: ComponentType<{ className?: string }>;
  trend?: number[];
  status?: 'healthy' | 'warning' | 'critical' | 'neutral';
  breakdown?: MetricBreakdown[];
  subMetrics?: MetricSubMetric[];
  lastUpdated?: string;
  contextAr?: string;
  contextEn?: string;
  benchmarkAr?: string;
  benchmarkEn?: string;
}
```

---

#### `PremiumTimelineView`
**File:** `PremiumTimelineView.tsx` (~600 lines)

Visual temporal workbench with horizontal timeline, Gantt-style bars, swimlanes, zoom levels, today marker, and critical path.

**Features:**
- Horizontal timeline (events, milestones)
- Gantt-style bars (project schedules)
- Swimlanes (group by entity)
- 5 zoom levels (hour/day/week/month/quarter)
- Today marker with gradient line
- Dependency arrows
- Interactive milestones with hover cards
- Drag-to-reschedule events
- Critical path highlighting
- Progress indicators on bars
- Click-to-edit events
- 6 event types (milestone, task, phase, release, review, approval)
- 5 status states (planned, in_progress, completed, blocked, cancelled)

**Props:**
```typescript
export interface PremiumTimelineViewProps {
  lang: 'ar' | 'en';
  events: TimelineEvent[];
  groups?: TimelineGroup[];
  defaultZoom?: TimelineZoom; // hour | day | week | month | quarter
  showSwimlanes?: boolean;
  showToday?: boolean;
  showCriticalPath?: boolean;
  showProgress?: boolean;
  editable?: boolean;
  height?: number;
  startDate?: string | Date;
  endDate?: string | Date;
  onEventClick?: (event: TimelineEvent) => void;
  onEventUpdate?: (event: TimelineEvent) => void;
}

export interface TimelineEvent {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  startDate: string | Date;
  endDate?: string | Date;
  type: TimelineEventType; // milestone | task | phase | release | review | approval
  status: TimelineEventStatus; // planned | in_progress | completed | blocked | cancelled
  progress?: number;
  groupId?: string;
  dependencies?: string[];
  isCritical?: boolean;
  ownerAr?: string;
  ownerEn?: string;
  color?: string;
}
```

---

#### `PremiumChart`
**File:** `PremiumChart.tsx` (~600 lines)

Enterprise visualization suite with 7 chart types, smooth animations, interactive tooltips, and gradient fills.

**Features:**
- 7 chart types: Line, Bar, Area, Donut, Radar, Stacked, Horizontal Bar
- Smooth entrance animations
- Interactive tooltips on hover
- Legend with toggle visibility
- Data point markers
- Gradient fills
- Responsive sizing
- 7 color variants (primary, accent, success, warning, danger, info, rainbow)
- Show/hide grid lines
- Data labels
- Export button

**Props:**
```typescript
export interface PremiumChartProps {
  lang: 'ar' | 'en';
  type: ChartType; // line | bar | area | donut | radar | stacked | horizontal-bar
  titleAr?: string;
  titleEn?: string;
  labels: string[];
  series: ChartSeries[];
  variant?: ChartVariant; // primary | accent | success | warning | danger | info | rainbow
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  showDataLabels?: boolean;
  enable3D?: boolean;
  onExport?: () => void;
}

export interface ChartSeries {
  id: string;
  nameAr: string;
  nameEn: string;
  data: number[];
  color?: string;
  dashed?: boolean;
  fillArea?: boolean;
}
```

---

### 3.5 UX States & Resilience

#### `PremiumEmptyState`
**File:** `PremiumEmptyState.tsx` (~600 lines)

World-class empty, error, loading, and 404 states with animated SVG illustrations, AI-powered suggestions, and quick actions.

**Features:**
- 9 elegant empty state variants:
  1. `no-data` — No data in this section yet
  2. `no-results` — No matching search results
  3. `no-permissions` — Insufficient permissions
  4. `no-connection` — Connection lost
  5. `no-notifications` — All caught up
  6. `error` — Unexpected error occurred
  7. `maintenance` — System under maintenance
  8. `coming-soon` — Feature coming soon
  9. `404` — Page not found
- Pure SVG animated illustrations
- Primary/secondary action buttons
- Suggestion chips with clickable quick actions
- Contact support options (phone, email, chat)
- 3 illustration sizes (sm/md/lg)
- Bilingual with RTL support

**Props:**
```typescript
export interface PremiumEmptyStateProps {
  lang: 'ar' | 'en';
  variant?: EmptyStateVariant;
  titleAr?: string;
  titleEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  primaryAction?: { labelAr: string; labelEn: string; onClick: () => void };
  secondaryAction?: { labelAr: string; labelEn: string; onClick: () => void };
  suggestions?: Array<{ labelAr: string; labelEn: string; onClick: () => void }>;
  contactSupport?: boolean;
  illustrationSize?: 'sm' | 'md' | 'lg';
}
```

---

#### `PremiumErrorBoundary`
**File:** `PremiumEmptyState.tsx`

Production-ready React ErrorBoundary with error details, copy-to-clipboard, retry, and home navigation.

**Features:**
- Catches render errors gracefully
- Error message display with stack trace
- Copy error to clipboard
- Try again / Home / Contact Support actions
- Integration with `onError` callback for logging
- Accessible `aria-live` region

**Props:**
```typescript
interface PremiumErrorBoundaryProps {
  lang: 'ar' | 'en';
  children: ReactNode;
  fallbackTitleAr?: string;
  fallbackTitleEn?: string;
  fallbackDescAr?: string;
  fallbackDescEn?: string;
  onError?: (error: Error, info: ErrorInfo) => void;
  onReset?: () => void;
  onHome?: () => void;
  contactSupport?: boolean;
}
```

---

#### `PremiumLoadingState`
**File:** `PremiumEmptyState.tsx`

Premium animated loading state with configurable size and full-screen mode.

**Props:**
```typescript
export interface PremiumLoadingStateProps {
  lang: 'ar' | 'en';
  messageAr?: string;
  messageEn?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}
```

---

## 4. Usage Patterns

### 4.1 Quick Start

```tsx
import { 
  UAMEXLoginExperience,
  UAMEXDashboardExperience,
  ExecutiveCommandBar,
  PremiumDataGrid,
  PremiumMetricCard,
  PremiumChart,
  PremiumEmptyState,
  PremiumErrorBoundary,
} from '@/components/uamex';

// Wrap your app
<PremiumErrorBoundary lang="ar">
  <ExecutiveCommandBar lang="ar" />
  <PremiumDataGrid lang="ar" data={projects} columns={projectColumns} />
</PremiumErrorBoundary>
```

### 4.2 DataGrid Integration

```tsx
const columns: DataGridColumn[] = [
  { id: 'id', headerAr: 'الرمز', headerEn: 'ID', type: 'text', sortable: true },
  { id: 'nameAr', headerAr: 'الاسم', headerEn: 'Name', type: 'text', sortable: true, editable: true },
  { id: 'status', headerAr: 'الحالة', headerEn: 'Status', type: 'badge', 
    options: [{ value: 'ACTIVE', labelAr: 'نشط', labelEn: 'Active' }],
    badgeVariantMap: { ACTIVE: 'success' }
  },
  { id: 'budget', headerAr: 'الميزانية', headerEn: 'Budget', type: 'number', 
    formatter: (v) => v ? `SAR ${v.toLocaleString()}` : '—' 
  },
];

<PremiumDataGrid
  lang="ar"
  data={projects}
  columns={columns}
  rowKey="id"
  selectable
  expandable
  editable
  exportable
  onCellEdit={(rowId, colId, value) => updateProject(rowId, colId, value)}
/>
```

### 4.3 MetricCard Dashboard

```tsx
const metrics: MetricCardData[] = [
  { id: 'p1', titleAr: 'المشاريع النشطة', titleEn: 'Active Projects', value: 247, format: 'number', variant: 'primary', icon: Zap,
    trend: [180, 192, 205, 212, 220, 232, 240, 247], status: 'healthy', targetValue: 300, previousValue: 198 },
  { id: 'p2', titleAr: 'الميزانية المنفقة', titleEn: 'Budget Spent', value: 8420000, format: 'currency', variant: 'accent', icon: DollarSign,
    trend: [5, 7, 6, 8, 7.5, 8.2, 8.1, 8.42], status: 'warning', targetValue: 10000000 },
  { id: 'p3', titleAr: 'معدل الإنجاز', titleEn: 'Completion Rate', value: 87.5, format: 'percentage', variant: 'success', icon: Target,
    trend: [80, 82, 84, 85, 86, 86.5, 87, 87.5], status: 'healthy', targetValue: 95 },
];

<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {metrics.map(m => (
    <PremiumMetricCard key={m.id} lang="ar" data={m} size="hero" />
  ))}
</div>
```

### 4.4 Chart Integration

```tsx
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

<PremiumChart
  lang="ar"
  type="line"
  titleAr="نمو المشاريع"
  titleEn="Project Growth"
  labels={months}
  series={[
    { id: 's1', nameAr: 'منجزة', nameEn: 'Completed', data: [12, 18, 25, 32, 28, 35], fillArea: true },
    { id: 's2', nameAr: 'جديدة', nameEn: 'New', data: [8, 12, 15, 18, 14, 22] },
  ]}
  variant="primary"
  height={280}
  showDataLabels
  showLegend
/>
```

### 4.5 Timeline Integration

```tsx
<PremiumTimelineView
  lang="ar"
  events={[
    { id: 'e1', titleAr: 'بناء المدارس', titleEn: 'School Construction',
      startDate: new Date('2025-01-01'), endDate: new Date('2025-06-01'),
      type: 'phase', status: 'in_progress', progress: 60, groupId: 'edu',
      isCritical: true, ownerAr: 'م. أحمد', ownerEn: 'Eng. Ahmed' },
    { id: 'e2', titleAr: 'تسليم المرحلة الأولى', titleEn: 'Phase 1 Delivery',
      startDate: new Date('2025-03-15'), type: 'milestone', status: 'planned', groupId: 'edu' },
  ]}
  groups={[
    { id: 'edu', labelAr: 'البرامج التعليمية', labelEn: 'Education Programs', color: '#059669' },
  ]}
  defaultZoom="week"
  showSwimlanes
  showToday
  showCriticalPath
/>
```

---

## 5. Animation Reference

New animations added in `src/shared/styles/animations.css`:

| Animation | Duration | Purpose |
|-----------|----------|---------|
| `animate-float-slow` | 12s | Gentle floating (emerald glow orbs) |
| `animate-float-slower` | 18s | Very slow float |
| `animate-pulse-slow` | 6s | Slow pulse |
| `animate-brand-reveal` | 700ms | UAMEX brand reveal |
| `animate-glow-emerald` | 2s | Emerald glow pulse |
| `animate-glow-amber` | 2s | Amber glow pulse |
| `animate-scale-in` | 300ms | Scale-up entrance (modals) |

---

## 6. NEB Domain Coverage

| Domain | NEB Code | Components Used |
|--------|----------|----------------|
| Strategy & Performance | NEB-01 | `PremiumMetricCard`, `PremiumChart` |
| Portfolio Management | NEB-02 | `PremiumDataGrid`, `PremiumChart` |
| Program Management | NEB-03 | `PremiumTimelineView`, `PremiumChart` |
| Project Management | NEB-04 | `PremiumTimelineView`, `PremiumDataGrid` |
| Operations OS | NEB-05 | `PremiumDataGrid`, `SmartFilter` |
| Service Delivery | NEB-06 | `PremiumDataGrid`, `PremiumMetricCard` |
| Community & Membership | NEB-07 | `PremiumDataGrid`, `PremiumChart` |
| Partnership & Funding | NEB-08 | `PremiumChart`, `PremiumMetricCard` |
| Resource & Asset | NEB-09 | `PremiumDataGrid`, `PremiumTimelineView` |
| Finance & Compliance | NEB-10 | `PremiumChart`, `PremiumMetricCard` |
| Knowledge & Document | NEB-11 | `PremiumDataGrid`, `SmartFilter` |
| Integration & Digital | NEB-12 | `PremiumEmptyState`, `ExecutiveCommandBar` |
| AI Intelligence | NEB-13 | `AIInsightsPanel`, `SmartFilter` |
| Procurement & Tenders | NEB-14 | `PremiumDataGrid`, `PremiumTimelineView` |
| Sales & Fundraising | NEB-15 | `PremiumChart`, `PremiumMetricCard` |

---

## 7. TypeScript Integration

All components export their types. Import types as needed:

```tsx
import type { 
  DataGridColumn,
  DataGridFilter,
  MetricCardData,
  TimelineEvent,
  ChartSeries,
  AIInsight,
  FilterField,
  CommandItem,
  SavedFilter,
  WorkspaceColumn,
  WorkspaceAction,
} from '@/components/uamex';
```

---

## 8. Standards & Compliance

| Standard | Implementation |
|----------|----------------|
| **WCAG 2.1 AAA** | Color contrast ratios, focus management, ARIA labels |
| **ISO 9241-210** | Human-centered design process |
| **ISO 27001** | Security-conscious UI patterns |
| **Sphere CHS** | Humanitarian standards compliance |
| **IPSAS** | Financial transparency indicators |
| **PMBOK® 7th** | EVM-aware metric cards |
| **PRINCE2® 2017** | Timeline phases and gates |

---

## 9. Migration Guide

To replace traditional screens with premium components:

### Before → After

| Traditional Pattern | Premium Component |
|--------------------|------------------|
| Basic HTML table | `PremiumDataGrid` |
| Static KPI boxes | `PremiumMetricCard` |
| Basic chart library | `PremiumChart` |
| Simple timeline div | `PremiumTimelineView` |
| Basic filter select | `SmartFilter` |
| Empty `div` with text | `PremiumEmptyState` |
| No error boundary | `PremiumErrorBoundary` |
| Basic loading spinner | `PremiumLoadingState` |
| No search | `ExecutiveCommandBar` |
| Basic alerts | `AIInsightsPanel` |

---

## 10. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-09-02 | Initial release: 14 premium components |

---

*Document generated by UAMEX_ERP™ AI System — NexoraOS Production Environment*