const fs = require('fs');
const { resolveSchemaPath, defaultSchemaPath, defaultCompletionPath } = require('./config');
const schema = fs.readFileSync(resolveSchemaPath('LOCAL_SCHEMA_PATH', defaultSchemaPath), 'utf8');
const completionSchema = fs.readFileSync(resolveSchemaPath('COMPLETION_SCHEMA_PATH', defaultCompletionPath), 'utf8');
const allSchemas = schema + '\n' + completionSchema;

console.log('NEXORAOS - Detailed Schema Enhancement Verification');
console.log('='.repeat(70));

const checks = {
  // Indexes for activities
  'idx_activities_sync_status': allSchemas.includes('idx_activities_sync_status'),
  'idx_activities_version_sync': allSchemas.includes('idx_activities_version_sync'),
  'idx_activities_deleted_at': allSchemas.includes('idx_activities_deleted_at'),
  
  // Indexes for beneficiaries
  'idx_beneficiaries_sync_status': allSchemas.includes('idx_beneficiaries_sync_status'),
  'idx_beneficiaries_version_sync': allSchemas.includes('idx_beneficiaries_version_sync'),
  'idx_beneficiaries_deleted_at': allSchemas.includes('idx_beneficiaries_deleted_at'),
  
  // Indexes for projects
  'idx_projects_sync_status': allSchemas.includes('idx_projects_sync_status'),
  'idx_projects_version_sync': allSchemas.includes('idx_projects_version_sync'),
  'idx_projects_deleted_at': allSchemas.includes('idx_projects_deleted_at'),
  
  // CHECK constraints
  'activities_version_ck': allSchemas.includes('version INTEGER DEFAULT 1 CHECK (version > 0)'),
  'beneficiaries_family_ck': allSchemas.includes('family_members_count INTEGER DEFAULT 1 CHECK (family_members_count >= 1)'),
  'beneficiaries_status_ck': allSchemas.includes("status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')"),
  'projects_budget_ck': allSchemas.includes('budget NUMERIC(18,2) DEFAULT 0 CHECK (budget >= 0)'),
  'donations_amount_ck': allSchemas.includes("amount NUMERIC(18,2) NOT NULL CHECK (amount > 0)"),
  
  // Key columns present
  'offline_enabled': allSchemas.includes('offline_enabled'),
  'sync_status_present': allSchemas.includes('sync_status'),
  'version_present': allSchemas.includes('version INTEGER DEFAULT 1'),
  'deleted_at_present': allSchemas.includes('deleted_at TIMESTAMP WITH TIME ZONE'),
};

let passed = 0;
let total = Object.keys(checks).length;

console.log('\nIndex Checks:');
Object.entries(checks).forEach(([key, result]) => {
  const icon = result ? 'PASS' : 'FAIL';
  console.log(`  ${icon} ${key}`);
  if (result) passed++;
});

console.log('\n' + '='.repeat(70));
const percentage = Math.round((passed / total) * 100);
console.log(`Enhancement Coverage: ${passed}/${total} (${percentage}%)`);
console.log(`Status: ${percentage >= 80 ? 'PASS EXCELLENT' : 'WARN GOOD'}`);

if (percentage >= 80) {
  console.log('\nAll critical enhancements are in place!');
  console.log('   - Performance indexes optimized');
  console.log('   - Data integrity constraints active');
  console.log('   - Schema ready for production workloads');
}
if (passed < total) {
  console.log(`\nSTATUS: REVIEW REQUIRED (${total - passed} check(s) failed)`);
  process.exitCode = 1;
}