const fs = require('fs');
const path = require('path');
const { resolveSchemaPath, defaultSchemaPath, defaultCompletionPath } = require('./config');

const sources = [
  fs.readFileSync(resolveSchemaPath('LOCAL_SCHEMA_PATH', defaultSchemaPath), 'utf8'),
  fs.readFileSync(resolveSchemaPath('COMPLETION_SCHEMA_PATH', defaultCompletionPath), 'utf8'),
];

// Also scan local migration files so newly added indexes count.
const migrationsDir = path.join(path.dirname(resolveSchemaPath('LOCAL_SCHEMA_PATH', defaultSchemaPath)), '..', '..', '..', 'migrations');
let migrationText = '';
try {
  if (fs.existsSync(migrationsDir)) {
    for (const f of fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'))) {
      migrationText += '\n' + fs.readFileSync(path.join(migrationsDir, f), 'utf8');
    }
  }
} catch { /* migrations dir optional */ }
sources.push(migrationText);

const schema = sources.join('\n');

console.log('[SCAN] Checking required performance indexes...\n');

// Check for index patterns in the local schema
const indexChecks = [
  'idx_activities_sync_status',
  'idx_beneficiaries_sync_status',
  'idx_projects_sync_status',
  'idx_donations_sync_status',
  'idx_field_disbursements_sync_status',
  'idx_transactions_sync_status',
  'idx_journal_entries_sync_status'
];

indexChecks.forEach(check => {
  const found = schema.includes(check);
  console.log((found ? '[OK]' : '[FAIL]') + ' ' + check);
});

const missing = indexChecks.filter(c => !schema.includes(c));
console.log(`\nIndexes found: ${indexChecks.length - missing.length}/${indexChecks.length}`);
if (missing.length > 0) {
  console.log('STATUS: NEEDS ATTENTION');
  process.exitCode = 1;
} else {
  console.log('STATUS: OK');
}
