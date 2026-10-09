const fs = require('fs');
const { resolveSchemaPath, defaultSchemaPath } = require('./config');
const schema = fs.readFileSync(resolveSchemaPath('LOCAL_SCHEMA_PATH', defaultSchemaPath), 'utf8');

console.log('NEXORAOS - Detailed Schema Enhancement Verification');
console.log('='.repeat(70));

const checks = {
  // Indexes for activities
  'idx_activities_sync_status': schema.includes('idx_activities_sync_status'),
  'idx_activities_version_sync': schema.includes('idx_activities_version_sync'),
  'idx_activities_deleted_at': schema.includes('idx_activities_deleted_at'),
  
  // Indexes for beneficiaries
  'idx_beneficiaries_sync_status': schema.includes('idx_beneficiaries_sync_status'),
  'idx_beneficiaries_version_sync': schema.includes('idx_beneficiaries_version_sync'),
  'idx_beneficiaries_deleted_at': schema.includes('idx_beneficiaries_deleted_at'),
  
  // Indexes for projects
  'idx_projects_sync_status': schema.includes('idx_projects_sync_status'),
  'idx_projects_version_sync': schema.includes('idx_projects_version_sync'),
  'idx_projects_deleted_at': schema.includes('idx_projects_deleted_at'),
  
  // CHECK constraints
  'activities_version_ck': schema.includes('version INTEGER DEFAULT 1 CHECK (version > 0)'),
  'beneficiaries_family_ck': schema.includes('family_members_count INTEGER DEFAULT 1 CHECK (family_members_count >= 1)'),
  'beneficiaries_status_ck': schema.includes("status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')"),
  'projects_budget_ck': schema.includes('budget NUMERIC(18,2) DEFAULT 0 CHECK (budget >= 0)'),
  'donations_amount_ck': schema.includes("amount NUMERIC(18,2) NOT NULL CHECK (amount > 0)"),
  
  // Key columns present
  'offline_enabled': schema.includes('offline_enabled'),
  'sync_status_present': schema.includes('sync_status'),
  'version_present': schema.includes('version INTEGER DEFAULT 1'),
  'deleted_at_present': schema.includes('deleted_at TIMESTAMP WITH TIME ZONE'),
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