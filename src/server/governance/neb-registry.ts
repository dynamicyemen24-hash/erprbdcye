/**
 * UAMEX ERP™ — NEB Governance Registry (consultants track)
 * Single source of truth for the base catalog of 15 institutional
 * domains (NEB-01..15): Arabic/English names, owning engine, route
 * mount, anchor tables. Curated statically and guarded by an
 * integrity test so future drift (renames, splits, orphan domains)
 * fails the build instead of silently fragmenting governance.
 * Subscriber-specific systems extend the catalog at runtime via
 * registerNebDomain() — see the extensions contract below.
 */

export interface NebDomain {
  code: string;
  nameAr: string;
  nameEn: string;
  engine: string;
  routes: string;
  keyTables: string[];
}

export const NEB_DOMAINS: NebDomain[] = [
  { code: 'NEB-01', nameAr: 'الاستراتيجية والأداء', nameEn: 'Strategy & Performance', engine: 'strategy.engine', routes: '/api/v2/strategy', keyTables: ['strategic_plans', 'strategic_goals', 'kpi_indicators'] },
  { code: 'NEB-02', nameAr: 'إدارة المحافظ', nameEn: 'Portfolio Management', engine: 'portfolio.engine', routes: '/api/v2/ppm', keyTables: ['investment_portfolios', 'portfolio_projects'] },
  { code: 'NEB-03', nameAr: 'البرامج', nameEn: 'Programs', engine: 'portfolio.engine', routes: '/api/v2/domains', keyTables: ['programs'] },
  { code: 'NEB-04', nameAr: 'المشاريع', nameEn: 'Projects', engine: 'project.engine', routes: '/api/v2/projects', keyTables: ['projects', 'milestones'] },
  { code: 'NEB-05', nameAr: 'العمليات والميدان', nameEn: 'Operations & Field', engine: 'operations.engine', routes: '/api/v2/domains', keyTables: ['activities', 'field_disbursements'] },
  { code: 'NEB-06', nameAr: 'تقديم الخدمات والمستفيدون', nameEn: 'Service Delivery & Beneficiaries', engine: 'serviceDelivery.engine', routes: '/api/v2/services', keyTables: ['beneficiaries', 'service_deliveries'] },
  { code: 'NEB-07', nameAr: 'المجتمع والعضوية', nameEn: 'Community & Membership', engine: 'community.engine', routes: '/api/v2/domains', keyTables: ['volunteers'] },
  { code: 'NEB-08', nameAr: 'التمويل والمانحون', nameEn: 'Funding & Donors', engine: 'funding.engine', routes: '/api/v2/domains', keyTables: ['donors', 'grants', 'grant_installments'] },
  { code: 'NEB-09', nameAr: 'الأصول والموارد البشرية والمخزون', nameEn: 'Assets, HR & Inventory', engine: 'inventory.engine', routes: '/api/v2/inventory', keyTables: ['assets', 'hr_staff', 'inventory_items'] },
  { code: 'NEB-10', nameAr: 'المالية والامتثال (IPSAS)', nameEn: 'Finance & Compliance (IPSAS)', engine: 'finance.engine', routes: '/api/v2/finance', keyTables: ['chart_of_accounts', 'transactions', 'journal_entries', 'budget_lines'] },
  { code: 'NEB-11', nameAr: 'المعرفة والوثائق', nameEn: 'Knowledge & Documents', engine: 'knowledge.engine', routes: '/api/v2/communications', keyTables: ['knowledge_articles', 'documents'] },
  { code: 'NEB-12', nameAr: 'التكامل والخدمات الرقمية', nameEn: 'Integration & Digital', engine: 'search.engine', routes: '/api/v2/search', keyTables: ['api_endpoints', 'api_credentials'] },
  { code: 'NEB-13', nameAr: 'الذكاء الاصطناعي والأثر', nameEn: 'AI Intelligence & Impact', engine: 'ai.engine', routes: '/api/v2/ai', keyTables: ['ai_model_configs', 'ai_prompt_templates'] },
  { code: 'NEB-14', nameAr: 'المشتريات', nameEn: 'Procurement', engine: 'procurement.engine', routes: '/api/v2/procurement', keyTables: ['procurement_tenders', 'purchase_orders', 'vendors'] },
  { code: 'NEB-15', nameAr: 'الإيرادات وجمع التبرعات', nameEn: 'Revenue & Fundraising', engine: 'revenue.engine', routes: '/api/v2/revenue', keyTables: ['donations', 'donation_campaigns'] },
];

export interface NebCoverageAudit {
  total: number;
  domains: NebDomain[];
  generatedAt: string;
}

export function auditNebCoverage(): NebCoverageAudit {
  return { total: NEB_DOMAINS.length, domains: NEB_DOMAINS, generatedAt: new Date().toISOString() };
}

// ============================================================
// SUBSCRIBER DOMAIN EXTENSIONS (extensibility contract)
//
// The base catalog above (NEB-01..NEB-15) is frozen for governance
// and guarded by the integrity test. New systems required by
// clients/subscribers plug in at runtime via registerNebDomain() —
// the platform is never hard-capped to a fixed domain count.
// Extension domains satisfy the same integrity rules (unique NEB
// code, owning engine, /api/v2/ route mount, anchor tables).
// ============================================================

const EXTENDED_NEB_DOMAINS: NebDomain[] = [];

const NEB_CODE_PATTERN = /^NEB-(0[1-9]|[1-9][0-9])$/;

export function registerNebDomain(domain: NebDomain): NebDomain {
  if (!domain || !NEB_CODE_PATTERN.test(domain.code)) {
    throw new Error(`registerNebDomain: code must match NEB-NN (got '${domain?.code}')`);
  }
  if (!domain.nameAr || !domain.nameEn) {
    throw new Error(`registerNebDomain: ${domain.code} requires nameAr and nameEn`);
  }
  if (!/\.engine$/.test(domain.engine)) {
    throw new Error(`registerNebDomain: ${domain.code} engine must end with .engine`);
  }
  if (!/^\/api\/v2\//.test(domain.routes)) {
    throw new Error(`registerNebDomain: ${domain.code} routes must mount under /api/v2/`);
  }
  if (!domain.keyTables || domain.keyTables.length === 0) {
    throw new Error(`registerNebDomain: ${domain.code} requires at least one anchor table`);
  }
  const taken = new Set([...NEB_DOMAINS, ...EXTENDED_NEB_DOMAINS].map((d) => d.code));
  if (taken.has(domain.code)) {
    throw new Error(`registerNebDomain: ${domain.code} is already registered`);
  }
  EXTENDED_NEB_DOMAINS.push(domain);
  return domain;
}

export function getExtendedNebDomains(): NebDomain[] {
  return [...EXTENDED_NEB_DOMAINS];
}

export function getAllNebDomains(): NebDomain[] {
  return [...NEB_DOMAINS, ...EXTENDED_NEB_DOMAINS];
}
