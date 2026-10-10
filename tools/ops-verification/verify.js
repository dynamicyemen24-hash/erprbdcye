const fs = require('fs');
const { resolveSchemaPath, defaultSchemaPath, defaultCompletionPath } = require('./config');
const schema = fs.readFileSync(resolveSchemaPath('LOCAL_SCHEMA_PATH', defaultSchemaPath), 'utf8');
const completionSchema = fs.readFileSync(resolveSchemaPath('COMPLETION_SCHEMA_PATH', defaultCompletionPath), 'utf8');
const allSchemas = schema + '\n' + completionSchema;
const checks = ['offline_enabled', 'sync_status', 'version', 'deleted_at'];
let found = 0;
checks.forEach(c => {
  if (allSchemas.includes(c)) {
    found++;
    console.log('[OK] Found:', c);
  } else {
    console.log('[FAIL] Missing:', c);
  }
});
console.log('\nTotal found:', found, '/4');
if (found < checks.length) {
  console.log('STATUS: NEEDS ATTENTION');
  process.exitCode = 1;
} else {
  console.log('STATUS: OK');
}
