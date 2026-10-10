/**
 * NexoraOS™ — SAP-Style Operational Workspace Hierarchy (NEB-01..15)
 * ─────────────────────────────────────────────────────────────────
 * SAP mapping (like SAP S/4HANA modules):
 *   FI/CO  → NEB-10 Finance & IPSAS        (finance)
 *   GM     → NEB-08 Grants & Donors        (funding)
 *   MM/P2P → NEB-14 Procurement            (procurement)
 *   EWM/MM → NEB-05/09 Inventory           (inventory)
 *   AA     → NEB-09 Fixed Assets           (assets)
 *   HCM    → NEB-09 HR + NEB-07 Community  (hr / community)
 *   PS/PPM → NEB-02/03/04 Portfolio/Prog   (portfolio / programs)
 *   PM/CS  → NEB-05 Operations & Field     (operations / field_tasks)
 *   CRM    → NEB-06 Beneficiaries          (beneficiaries)
 *   SD     → NEB-15 Sales & Revenue        (sales)
 *   DMS    → NEB-11 Knowledge & Docs       (knowledge)
 *   BASIS/PI → NEB-12 Integration          (integration)
 *   BI/BW  → NEB-01/13 Strategy & AI/MEAL  (strategy / meal)
 *   GRC    → NEB-12 Governance & Access    (admin)
 *
 * Backward compatible: the original 12 keys are preserved verbatim.
 * 6 new keys complete 100% NEB coverage: portfolio, funding, assets,
 * community, knowledge, integration.
 */
export const WORKSPACE_ROLE_KEYS = [
  'strategy',
  'programs',
  'operations',
  'field_tasks',
  'beneficiaries',
  'finance',
  'procurement',
  'inventory',
  'sales',
  'hr',
  'meal',
  'admin',
  // ── Phase-2 completion (SAP parity, 100% NEB coverage) ──
  'portfolio',
  'funding',
  'assets',
  'community',
  'knowledge',
  'integration',
] as const;

export type WorkspaceRoleKey = typeof WORKSPACE_ROLE_KEYS[number];

export type LegacyWorkspaceRoleKey =
  | 'strategy' | 'programs' | 'operations' | 'field_tasks' | 'beneficiaries'
  | 'finance' | 'procurement' | 'inventory' | 'sales' | 'hr' | 'meal' | 'admin';

export const isWorkspaceRoleKey = (value: string | null | undefined): value is WorkspaceRoleKey =>
  value !== null && value !== undefined && (WORKSPACE_ROLE_KEYS as readonly string[]).includes(value);

export const WORKSPACE_STORAGE_KEYS = {
  active: 'uamex_active_workspace',
  favorites: 'uamex_workspace_favorites',
} as const;

/** SAP S/4HANA-style module code for every operational workspace. */
export type SapModuleCode =
  | 'FI' | 'CO' | 'GM' | 'MM' | 'EWM' | 'AA' | 'HCM'
  | 'PS' | 'PPM' | 'PM' | 'CRM' | 'SD' | 'DMS' | 'BASIS' | 'BI' | 'GRC';

export interface WorkspaceOperationalLink {
  /** Workspace key (this registry). */
  key: WorkspaceRoleKey;
  /** One or more NEB domain codes (NEB-01..15). */
  nebCodes: string[];
  /** SAP S/4HANA equivalent modules. */
  sapModules: SapModuleCode[];
  /** Frontend navigation target (existing ActiveTab — no new routes needed). */
  activeTab: string;
  /** Live DB tables (whitelist) this workspace reads/writes. */
  dbTables: string[];
  /** Production API endpoints consumed by the workspace. */
  apiEndpoints: string[];
  /** Linked report id in REPORT_WORKSPACE_REGISTRY. */
  reportId: string;
}

/**
 * Single source of truth: Workspace → NEB → SAP → Tab → DB → API → Report.
 * Used by InstitutionalRoleWorkspaces, DashboardOverviewTab, ReportsView,
 * HelperToolsPanel and the e2e readiness probe.
 */
export const WORKSPACE_OPERATIONAL_MAP: Record<WorkspaceRoleKey, WorkspaceOperationalLink> = {
  strategy: {
    key: 'strategy', nebCodes: ['NEB-01'], sapModules: ['BI', 'PPM'],
    activeTab: 'strategic_planning',
    dbTables: ['strategic_plans', 'strategic_goals', 'kpi_indicators', 'strategic_kpis'],
    apiEndpoints: ['GET /api/v2/strategy/plans', 'GET /api/v2/strategy/kpis', 'GET /api/v2/ppm/scorecard'],
    reportId: 'strategy',
  },
  programs: {
    key: 'programs', nebCodes: ['NEB-03', 'NEB-04'], sapModules: ['PS', 'PPM'],
    activeTab: 'programs',
    dbTables: ['programs', 'projects', 'milestones', 'project_schedules'],
    apiEndpoints: ['GET /api/v2/domains/programs', 'GET /api/v2/projects', 'GET /api/v2/ppm/timeline'],
    reportId: 'projects',
  },
  portfolio: {
    key: 'portfolio', nebCodes: ['NEB-02'], sapModules: ['PPM', 'CO'],
    activeTab: 'portfolio_intelligence',
    dbTables: ['investment_portfolios', 'portfolio_projects', 'portfolio_risks', 'portfolio_milestones', 'portfolio_benchmarks', 'portfolio_allocations'],
    apiEndpoints: ['GET /api/v2/domains/portfolio/overview', 'GET /api/v2/domains/portfolio/health', 'GET /api/v2/domains/portfolio/timeline', 'GET /api/v2/ppm/dashboard'],
    reportId: 'portfolio',
  },
  operations: {
    key: 'operations', nebCodes: ['NEB-05'], sapModules: ['PM'],
    activeTab: 'activities',
    dbTables: ['activities', 'field_disbursements', 'project_schedules'],
    apiEndpoints: ['GET /api/v2/domains/activities', 'GET /api/v2/domains/activities/:id/wbs'],
    reportId: 'activities',
  },
  field_tasks: {
    key: 'field_tasks', nebCodes: ['NEB-05'], sapModules: ['PM'],
    activeTab: 'field_tasks',
    dbTables: ['activities', 'field_tasks'],
    apiEndpoints: ['GET /api/v2/domains/activities/:activityId/tasks', 'PUT /api/v2/domains/tasks/:taskId/progress'],
    reportId: 'activities',
  },
  beneficiaries: {
    key: 'beneficiaries', nebCodes: ['NEB-06'], sapModules: ['CRM'],
    activeTab: 'beneficiaries',
    dbTables: ['beneficiaries', 'parties', 'service_deliveries', 'aid_distributions', 'distribution_beneficiaries', 'sponsorships'],
    apiEndpoints: ['GET /api/tables/beneficiaries', 'GET /api/v2/services/deliveries', 'GET /api/v2/services/distributions'],
    reportId: 'beneficiaries',
  },
  community: {
    key: 'community', nebCodes: ['NEB-07'], sapModules: ['HCM'],
    activeTab: 'beneficiaries',
    dbTables: ['volunteers', 'volunteer_tasks', 'community_committees', 'membership_applications'],
    apiEndpoints: ['GET /api/v2/domains/volunteers', 'GET /api/v2/domains/committees', 'GET /api/v2/domains/membership'],
    reportId: 'community',
  },
  funding: {
    key: 'funding', nebCodes: ['NEB-08'], sapModules: ['GM'],
    activeTab: 'contracts',
    dbTables: ['donors', 'grants', 'grant_installments', 'funding_proposals', 'donor_reports', 'donor_compliance_requirements', 'partner_agreements'],
    apiEndpoints: ['GET /api/v2/domains/donors', 'GET /api/v2/domains/grants', 'GET /api/v2/domains/proposals', 'GET /api/v2/domains/utilization', 'GET /api/funding/donors'],
    reportId: 'funding',
  },
  finance: {
    key: 'finance', nebCodes: ['NEB-10'], sapModules: ['FI', 'CO'],
    activeTab: 'finance',
    dbTables: ['chart_of_accounts', 'fiscal_years', 'transactions', 'transaction_lines', 'journal_entries', 'journal_entry_lines', 'budget_lines', 'currencies', 'exchange_rates'],
    apiEndpoints: ['GET /api/v2/finance/chart-of-accounts', 'GET /api/v2/finance/transactions', 'GET /api/v2/finance/trial-balance', 'GET /api/v2/expense/records'],
    reportId: 'finance',
  },
  procurement: {
    key: 'procurement', nebCodes: ['NEB-14'], sapModules: ['MM'],
    activeTab: 'procurement',
    dbTables: ['vendors', 'parties', 'procurement_tenders', 'rfqs', 'vendor_bids', 'purchase_orders', 'goods_receipts', 'vendor_invoices', 'three_way_match_records', 'tender_auctions', 'auction_bids'],
    apiEndpoints: ['GET /api/v2/procurement/rfqs', 'GET /api/v2/procurement/purchase-orders', 'POST /api/v2/procurement/three-way-match'],
    reportId: 'procurement',
  },
  inventory: {
    key: 'inventory', nebCodes: ['NEB-05', 'NEB-09'], sapModules: ['EWM', 'MM'],
    activeTab: 'inventory',
    dbTables: ['warehouses', 'inventory_items', 'inventory_categories', 'inventory_uoms', 'inventory_stock_balances', 'inventory_movements', 'inventory_transfers', 'inventory_adjustments'],
    apiEndpoints: ['GET /api/v2/inventory/items', 'GET /api/v2/inventory/movements', 'GET /api/v2/inventory/balances'],
    reportId: 'inventory',
  },
  assets: {
    key: 'assets', nebCodes: ['NEB-09'], sapModules: ['AA'],
    activeTab: 'inventory',
    dbTables: ['assets', 'fixed_assets', 'resource_allocations'],
    apiEndpoints: ['GET /api/v2/domains/assets', 'GET /api/v2/domains/assets/dashboard', 'GET /api/v2/domains/assets/depreciation'],
    reportId: 'assets',
  },
  sales: {
    key: 'sales', nebCodes: ['NEB-15'], sapModules: ['SD'],
    activeTab: 'sales',
    dbTables: ['donation_campaigns', 'donations', 'revenue_streams', 'revenue_records', 'revenue_collections', 'revenue_batches', 'revenue_schedules', 'funding_caps', 'e_invoices', 'sales_invoices'],
    apiEndpoints: ['GET /api/v2/revenue/records', 'GET /api/v2/domains/donations', 'GET /api/v2/domains/campaigns', 'GET /api/v2/domains/investments'],
    reportId: 'sales',
  },
  hr: {
    key: 'hr', nebCodes: ['NEB-09'], sapModules: ['HCM'],
    activeTab: 'hr_dashboard',
    dbTables: ['hr_staff', 'staff', 'attendance', 'leave_requests'],
    apiEndpoints: ['GET /api/v2/domains/hr/staff', 'GET /api/v2/domains/hr/dashboard', 'POST /api/v2/domains/hr/leaves'],
    reportId: 'hr',
  },
  meal: {
    key: 'meal', nebCodes: ['NEB-01', 'NEB-13'], sapModules: ['BI'],
    activeTab: 'reports',
    dbTables: ['chs_evaluations', 'sphere_benchmarks', 'impact_metrics', 'ai_insights', 'anomaly_logs'],
    apiEndpoints: ['GET /api/v2/domains/ai/insights', 'GET /api/v2/domains/ai/anomalies', 'GET /api/v2/domains/ai/impact'],
    reportId: 'meal',
  },
  knowledge: {
    key: 'knowledge', nebCodes: ['NEB-11'], sapModules: ['DMS'],
    activeTab: 'docs',
    dbTables: ['knowledge_articles'],
    apiEndpoints: ['GET /api/v2/domains/knowledge', 'GET /api/v2/domains/knowledge/search', 'GET /api/v2/communications/memoranda'],
    reportId: 'knowledge',
  },
  integration: {
    key: 'integration', nebCodes: ['NEB-12'], sapModules: ['BASIS'],
    activeTab: 'admin_control_center',
    dbTables: ['api_endpoints', 'api_credentials', 'api_keys', 'webhook_subscriptions', 'iati_activities', 'iati_registrations', 'field_devices', 'sync_queue', 'neon_connections'],
    apiEndpoints: ['GET /api/v2/integration/status', 'GET /api/v2/system/health', 'GET /api/tables/sync_queue'],
    reportId: 'integration',
  },
  admin: {
    key: 'admin', nebCodes: ['NEB-12'], sapModules: ['GRC'],
    activeTab: 'users',
    dbTables: ['users', 'roles', 'user_org_memberships', 'audit_logs', 'organization_settings'],
    apiEndpoints: ['GET /api/v2/auth/users', 'GET /api/v2/rbac/roles', 'GET /api/tables/audit_logs'],
    reportId: 'admin',
  },
};

export function getWorkspaceLink(key: WorkspaceRoleKey): WorkspaceOperationalLink {
  return WORKSPACE_OPERATIONAL_MAP[key];
}

export function getWorkspacesByNeb(nebCode: string): WorkspaceOperationalLink[] {
  const needle = nebCode.toUpperCase();
  return (Object.values(WORKSPACE_OPERATIONAL_MAP) as WorkspaceOperationalLink[]).filter((w) =>
    w.nebCodes.some((c) => c.toUpperCase() === needle),
  );
}

export function getWorkspacesBySap(sap: SapModuleCode): WorkspaceOperationalLink[] {
  return (Object.values(WORKSPACE_OPERATIONAL_MAP) as WorkspaceOperationalLink[]).filter((w) =>
    w.sapModules.includes(sap),
  );
}
