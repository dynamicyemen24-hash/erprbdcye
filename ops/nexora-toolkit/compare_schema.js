const { Pool } = require('pg');
const fs = require('fs');
const { requireDatabaseUrl, resolveSchemaPath, defaultSchemaPath } = require('./config');

function safeMessage(err) {
  let msg = err && err.message ? String(err.message) : String(err);
  if (process.env.DATABASE_URL) {
    msg = msg.replace(process.env.DATABASE_URL, '***');
  }
  const urlRe = new RegExp('postgres(?:ql)?' + String.fromCharCode(58, 47, 47) + '[^\\s\'"]*:[^\\s\'"]*@', 'gi');
  msg = msg.replace(urlRe, '[REDACTED_DATABASE_URL]');
  return msg;
}

const localSchema = fs.readFileSync(resolveSchemaPath('LOCAL_SCHEMA_PATH', defaultSchemaPath), 'utf8');

// Get cloud tables
const pool = new Pool({
  connectionString: requireDatabaseUrl(),
  connectionTimeoutMillis: 10000,
  statement_timeout: 15000,
  query_timeout: 15000,
  application_name: 'nexoraops-verify'
});
pool.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' ORDER BY table_name')
  .then(res => {
    const cloudTables = res.rows.map(r => r.table_name);
    console.log('CLOUD DATABASE TABLES:', cloudTables.length);

    // Get local tables from initial_schema.ts
    const localTables = localSchema.match(/CREATE TABLE IF NOT EXISTS (\w+)/g) || [];
    const localTableNames = localTables.map(t => t.replace('CREATE TABLE IF NOT EXISTS ', ''));

    console.log('LOCAL SCHEMA TABLES:', localTableNames.length);

    // Find missing and extra
    const cloudSet = new Set(cloudTables);
    const localSet = new Set(localTableNames);

    const missingInLocal = [...cloudSet].filter(x => !localSet.has(x));
    const extraInLocal = [...localSet].filter(x => !cloudSet.has(x));

    console.log('\n❌ TABLES IN CLOUD BUT MISSING in LOCAL SCHEMA:', missingInLocal.length);
    missingInLocal.slice(0, 30).forEach(t => console.log('  -', t));

    console.log('\n✅ TABLES in LOCAL BUT NOT in CLOUD:', extraInLocal.length);
    extraInLocal.slice(0, 30).forEach(t => console.log('  -', t));

    // Check for NEB domain tables specifically
    const nebTables = ['investment_portfolios', 'portfolio_projects', 'portfolio_risks', 
                       'portfolio_milestones', 'portfolio_benchmarks', 'portfolio_allocations',
                       'api_endpoints', 'api_credentials', 'iati_registrations', 'neon_connections',
                       'ai_model_configs', 'ai_prompt_templates', 'ai_interaction_logs', 'impact_metrics',
                       'journal_entries', 'journal_entry_lines', 'field_disbursements'];
    
    console.log('\n🔍 CHECKING NEB DOMAIN TABLES:');
    nebTables.forEach(t => {
      const inCloud = cloudSet.has(t);
      const inLocal = localSet.has(t);
      const status = (inCloud, inLocal) => inCloud ? (inLocal ? '✅ EXISTS BOTH' : '⚠️ CLOUD ONLY') : (inLocal ? '⚠️ LOCAL ONLY' : '❌ MISSING');
      console.log(`  ${t}: ${status(inCloud, inLocal)}`);
    });

    pool.end();
  })
  .catch(err => {
    console.error('ERROR:', safeMessage(err));
    pool.end();
    process.exitCode = 1;
  });