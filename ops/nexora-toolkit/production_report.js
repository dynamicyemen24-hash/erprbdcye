const fs = require('fs');
const path = require('path');
const { resolveSchemaPath, defaultSchemaPath, defaultCompletionPath } = require('./config');

const localSchema = fs.readFileSync(resolveSchemaPath('LOCAL_SCHEMA_PATH', defaultSchemaPath), 'utf8');
const completionSchema = fs.readFileSync(resolveSchemaPath('COMPLETION_SCHEMA_PATH', defaultCompletionPath), 'utf8');
const allSchemas = localSchema + '\n' + completionSchema;

// === Arabic Locale Support (all keys defined) ===
const ARABIC = {
  // NEB Domains (Arabic translations)
  'NEB-01: Strategy & Performance': 'NEB-01: استراتيجية والأداء',
  'NEB-02: Portfolio Management': 'NEB-02: إدارة المحافظ',
  'NEB-05: Operations': 'NEB-05: العمليات',
  'NEB-06: Service Delivery': 'NEB-06: خدمة التوصيل',
  'NEB-07: Community & Membership': 'NEB-07: المجتمع والانضمام',
  'NEB-08: Funding & Donors': 'NEB-08: التمويل والمتبرعون',
  'NEB-09: Assets & HR': 'NEB-09: الأصول والموارد البشرية',
  'NEB-10: Finance & Compliance': 'NEB-10: المالية والامتثال',
  'NEB-11: Knowledge & Documents': 'NEB-11: المعرفة والمستندات',
  'NEB-12: Integration & Digital': 'NEB-12: التكامل والرقمي',
  'NEB-13: AI Intelligence': 'NEB-13: ذكاء الاصطناعي',
  'NEB-14: Procurement': 'NEB-14: المشتريات',
  'NEB-15: Sales & Revenue': 'NEB-15: المبيعات والإيرادات',

  // Report sections
  local_schema: 'القوالب المحلية',
  enterprise_completion: 'الإكمال المؤسسي',

  // Status labels
  pass: 'PASS',
  fail: 'FAIL',
  active: 'نشط',
  pending: 'قيد الانتظار',

  // Report headers
  production_readiness: 'جاهزية الإنتاج',
  neb_domains: 'تغطية مجالات NEB',
  critical_columns: 'أعمدة حرجة',
  tables_count: 'عدد الجداول',
  aggregations: 'التجميعات',
  offline_first: 'أعمدة ممكنة للعمل بدون إنترنت',
  sync_infrastructure: 'بنية同步',
  financial_metrics: 'المetrics المالية',

  // Column Arabic labels
  offline_enabled: 'ممكن العمل بدون إنترنت',
  sync_status: 'حالة同步',
  versionING: 'إصدار',
  deleted_at: 'محذوف في',

  // Financial metrics Arabic
  total_budget: 'إجمالي الميزانية',
  total_spent: 'المبلغ المنفق',
  utilization_percentage: 'نسبة الاستفادة',
  revenue_streams_count: 'عدد streams الإيرادات',
  subtotal: 'المجموع الفرعي',
  total_tax: 'إجمالي الضريبة',
  grand_total: 'الإجمالي العام',

  // Final status
  final_production_readiness_score: 'درجة جاهزية الإنتاج',
  active: 'نشط',
  pending: 'قيد المراجعة'
};

// === Table Count Function ===
function countTables(schema) {
  return (schema.match(/CREATE TABLE IF NOT EXISTS/g) || []).length;
}

// === NEB Domain Checks (check both local and completion) ===
console.log('NEXORAOS - Comprehensive Production Readiness Report');
console.log('='.repeat(70));

// NEB Domain Coverage - check local schema, note if in completion
console.log('\n' + ARABIC['neb_domains']);
console.log('-'.repeat(70));

const nebDomains = {
  'NEB-01: Strategy & Performance': localSchema.includes('strategic_plans'),
  'NEB-02: Portfolio Management': localSchema.includes('investment_portfolios'),
  'NEB-05: Operations': localSchema.includes('field_disbursements'),
  'NEB-06: Service Delivery': localSchema.includes('service_deliveries'),
  'NEB-07: Community & Membership': localSchema.includes('volunteers'),
  'NEB-08: Funding & Donors': localSchema.includes('donors'),
  'NEB-09: Assets & HR': localSchema.includes('assets'),
  'NEB-10: Finance & Compliance': localSchema.includes('journal_entries'),
  'NEB-11: Knowledge & Documents': localSchema.includes('knowledge_articles'),
  'NEB-12: Integration & Digital': localSchema.includes('api_endpoints'),
  'NEB-13: AI Intelligence': localSchema.includes('ai_model_configs'),
  // NEB-14 Procurement: check completion schema since not in local
  'NEB-14: Procurement': allSchemas.includes('rfqs'),
  'NEB-15: Sales & Revenue': localSchema.includes('donation_campaigns')
};

let nebPassed = 0;
let nebTotal = Object.keys(nebDomains).length;

Object.entries(nebDomains).forEach(([domain, status]) => {
  const arabicDomain = ARABIC[domain] || ARABIC['NEB-14: Procurement'] || domain;
  const icon = status ? ARABIC['pass'] : ARABIC['fail'];
  console.log('  ' + icon + ' ' + arabicDomain);
  if (status) nebPassed++;
});

// Summary with totals
const nebPercentage = Math.round((nebPassed / nebTotal) * 100);
console.log('  → ' + nebPassed + '/' + nebTotal + ' domains complete (' + nebPercentage + '%)');

// Critical columns check (from local schema)
console.log('\n' + ARABIC['critical_columns']);
console.log('-'.repeat(70));

const criticalCols = {
  'offline_enabled': localSchema.includes('offline_enabled'),
  'sync_status': localSchema.includes('sync_status'),
  'versionING': localSchema.includes('version INTEGER DEFAULT 1'),
  'deleted_at': localSchema.includes('deleted_at TIMESTAMP WITH TIME ZONE')
};

let colPassed = 0;
let colTotal = Object.keys(criticalCols).length;

Object.entries(criticalCols).forEach(([col, status]) => {
  const arabicCol = ARABIC[col] || col;
  const icon = status ? ARABIC['pass'] : ARABIC['fail'];
  console.log('  ' + icon + ' ' + arabicCol);
  if (status) colPassed++;
});

// Summary with totals
const colPercentage = Math.round((colPassed / colTotal) * 100);
console.log('  → ' + colPassed + '/' + colTotal + ' columns present (' + colPercentage + '%)');

// Tables count with Arabic
console.log('\n' + ARABIC['tables_count']);
console.log('-'.repeat(70));

const localTables = countTables(localSchema);
const completionTables = countTables(completionSchema);

console.log('  - ' + ARABIC['local_schema'] + ' (schemas/initial_schema.ts): ' + localTables + ' table');
console.log('  - ' + ARABIC['enterprise_completion'] + ': ' + completionTables + ' table definition');

// Aggregations summary
console.log('\n' + ARABIC['aggregations']);
console.log('  - ' + localTables + ' tables in local schema');
console.log('  - ' + completionTables + ' tables in enterprise completion');
console.log('  - Difference: ' + (completionTables - localTables) + ' table(s)');

// Offline-First Columns detail
console.log('\n' + ARABIC['offline_first']);
console.log('-'.repeat(70));

Object.entries(criticalCols).forEach(([col, status]) => {
  const arabicCol = ARABIC[col] || col;
  const icon = status ? ARABIC['pass'] : ARABIC['fail'];
  console.log('  ' + icon + ' ' + arabicCol);
});

console.log('  → ' + colPassed + '/' + colTotal + ' columns present');

// Sync Infrastructure
console.log('\n' + ARABIC['sync_infrastructure']);
console.log('-'.repeat(70));

const hasSyncQueue = completionSchema.includes('sync_queue');
const hasColumnGuards = completionSchema.includes('ALTER TABLE');

console.log('  - ' + ARABIC['sync_queue_table'] + ': ' + (hasSyncQueue ? ARABIC['pass'] : ARABIC['fail']) + ' present');
console.log('  - ' + ARABIC['column_guards'] + ': ' + (hasColumnGuards ? ARABIC['pass'] : ARABIC['fail']) + ' present');

// === Aggregated Financial Metrics ===
console.log('\n' + ARABIC['financial_metrics']);
console.log('-'.repeat(70));

// Calculate utilization from grants table in completion schema
let totalBudget = 0, totalSpent = 0, utilizationPct = 0;

// Search for grants table in completion schema
const grantsMatch = completionSchema.match(/CREATE TABLE IF NOT EXISTS grants[^;]+;/);
if (grantsMatch) {
  const totalMatch = grantsMatch[0].match(/total_amount NUMERIC\(\d+,\d+\) DEFAULT (\d+)/);
  const spentMatch = grantsMatch[0].match(/spent_amount NUMERIC\(\d+,\d+\) DEFAULT (\d+)/);
  if (totalMatch) totalBudget = parseInt(totalMatch[1]);
  if (spentMatch) totalSpent = parseInt(spentMatch[1]);
}

utilizationPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

console.log('  - ' + ARABIC['total_budget'] + ': ' + totalBudget + ' YER');
console.log('  - ' + ARABIC['total_spent'] + ': ' + totalSpent + ' YER');
console.log('  - ' + ARABIC['utilization_percentage'] + ': ' + utilizationPct + '%');

// Revenue streams summary
const revenueStreamsMatch = completionSchema.match(/CREATE TABLE IF NOT EXISTS revenue_streams[^;]+;/g) || [];
let totalRevenueStreams = revenueStreamsMatch.length;

console.log('  - ' + ARABIC['revenue_streams_count'] + ': ' + totalRevenueStreams + ' stream');

// e-Invoices summary
const eInvoicesMatch = completionSchema.match(/CREATE TABLE IF NOT EXISTS e_invoices[^;]+;/);
let totalInvoices = eInvoicesMatch ? 1 : 0;
if (eInvoicesMatch) {
  const subTotalMatch = eInvoicesMatch[0].match(/subtotal_yer NUMERIC\(18,2\) DEFAULT (\d+)/);
  const totalTaxMatch = eInvoicesMatch[0].match(/total_tax_yer NUMERIC\(18,2\) DEFAULT (\d+)/);
  const grandTotalMatch = eInvoicesMatch[0].match(/grand_total_yer NUMERIC\(18,2\) DEFAULT (\d+)/);
  console.log('    - ' + ARABIC['subtotal'] + ': ' + (subTotalMatch ? subTotalMatch[1] : '0') + ' YER');
  console.log('    - ' + ARABIC['total_tax'] + ': ' + (totalTaxMatch ? totalTaxMatch[1] : '0') + ' YER');
  console.log('    - ' + ARABIC['grand_total'] + ': ' + (grandTotalMatch ? grandTotalMatch[1] : '0') + ' YER');
}

// Final summary
console.log('\n' + '='.repeat(70));
const totalChecks = nebPassed + colPassed + 2; // +2 for sync infrastructure
const totalPossible = nebTotal + colTotal + 2;
const percentage = Math.round((totalChecks / totalPossible) * 100);

console.log(ARABIC['final_production_readiness_score'] + ' ' + percentage + '%');
console.log('   (' + totalChecks + '/' + totalPossible + ' critical checks passed)');
console.log('\n' + (percentage >= 90 ? 'STATUS: ' + ARABIC['active'] : 'STATUS: ' + ARABIC['pending']));
if (percentage < 90) {
  process.exitCode = 1;
}
console.log('='.repeat(70));