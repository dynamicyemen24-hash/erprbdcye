/**
 * NexoraOS™ — All Operational Engines Export
 * Central export point for all 15 NEB domain engines
 */

// ─── NEB-01: Strategy & Performance ────────────────────
export { StrategicPlanEngine, StrategicGoalEngine, KPIEngine2, SWOTEngine, StrategicAlignmentEngine } from './strategy.engine';

// ─── NEB-02 & NEB-03: Portfolio & Programs ─────────────
export { PortfolioEngine, ProgramEngine } from './portfolio.engine';

// ─── NEB-04: Project Management ────────────────────────
export { ProjectEngine, MilestoneEngine, ScheduleEngine, ProjectIntelligenceEngine } from './project.engine';

// ─── NEB-05: Operations & Field ────────────────────────
export { ActivityEngine, ResourceAllocationEngine, GeospatialEngine, TaskEngine } from './operations.engine';

// ─── NEB-06: Service Delivery ──────────────────────────
export { BeneficiaryEngine, ServiceDeliveryEngine, AidDistributionEngine, SponsorshipEngine } from './serviceDelivery.engine';

// ─── NEB-07: Community & Membership ────────────────────
export { VolunteerEngine, CommitteeEngine, MembershipEngine } from './community.engine';

// ─── NEB-08: Partnership & Funding ─────────────────────
export { DonorEngine, GrantEngine, GrantInstallmentEngine, ProposalEngine, PartnerAgreementEngine, UtilizationReportEngine } from './funding.engine';

// ─── NEB-09: Resource & Assets + HR ────────────────────
export { AssetEngine, InventoryEngine, WarehouseEngine } from './assets.engine';
export { HREngine, AttendanceEngine, LeaveEngine } from './hr.engine';

// ─── NEB-10: Finance & IPSAS ───────────────────────────
export { ChartOfAccountsService, LedgerEngine, FiscalYearService, BudgetService, CurrencyService } from './finance.engine';

// ─── NEB-11: Knowledge & Documents ─────────────────────
export { KnowledgeArticleEngine } from './knowledge.engine';

// ─── NEB-13: AI Intelligence ───────────────────────────
export { AIEngine } from './ai.engine';

// ─── NEB-14: Procurement ──────────────────────────────
export { RFQEngine, VendorBidEngine, PurchaseOrderEngine, ThreeWayMatchEngine, VendorPerformanceEngine } from './procurement.engine';

// ─── NEB-15: Sales, Revenue & Fundraising ──────────────
export { DonationEngine, InvoiceEngine, CampaignEngine, InvestmentEngine } from './sales.engine';
export { RevenueStreamEngine, RevenueEngine, RevenueIntelligenceEngine } from './revenue.engine';

// ─── NEB-10: Finance & Compliance OS — Expense Engine ───
export {
  ExpenseCategoryEngine,
  ExpenseEngine,
  ExpenseIntelligenceEngine,
  ExpenseBatchEngine,
  PettyCashEngine,
  RecurringExpenseEngine
} from './expense.engine';

// ─── Reporting & Analytics ─────────────────────────────
export { KPIEngine, ViewEngine, ReportExportEngine } from './reporting.engine';

// ─── NEB-12 + NEB-13: Unified Search & Query Engine ───
export {
  SearchIndexEngine,
  UnifiedSearchEngine,
  FacetEngine,
  SavedSearchEngine,
  SearchTelemetryEngine,
  RecommendationEngine,
  SearchEngine,
  SEARCHABLE_DOMAINS
} from './search.engine';
export type {
  SearchableDomain,
  UnifiedSearchInput,
  UnifiedSearchHit,
  UnifiedSearchResult,
  FacetRequest,
  SavedSearchInput,
  SearchIndexRow,
  SearchAnalyticsRow,
  RecommendationContext
} from './search.engine';

// ─── Auth ──────────────────────────────────────────────
export { AuthEngine } from './auth.engine';
