/**
 * NexoraOS™ — NEB Governance Registry (consultants track)
 * Single source of truth for the 15 institutional domains (NEB-01..15):
 * Arabic/English names, owning engine, route mount, anchor tables.
 * Curated statically and guarded by an integrity test so future
 * drift (renames, splits, orphan domains) fails the build instead
 * of silently fragmenting governance.
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
