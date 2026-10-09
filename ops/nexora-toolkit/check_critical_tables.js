const { Pool } = require('pg');
const { requireDatabaseUrl } = require('./config');

function safeMessage(err) {
  let msg = err && err.message ? String(err.message) : String(err);
  if (process.env.DATABASE_URL) {
    msg = msg.replace(process.env.DATABASE_URL, '***');
  }
  const urlRe = new RegExp('postgres(?:ql)?' + String.fromCharCode(58, 47, 47) + '[^\\s\'"]*:[^\\s\'"]*@', 'gi');
  msg = msg.replace(urlRe, '[REDACTED_DATABASE_URL]');
  return msg;
}

const cloudPool = new Pool({
  connectionString: requireDatabaseUrl(),
  connectionTimeoutMillis: 10000,
  statement_timeout: 15000,
  query_timeout: 15000,
  application_name: 'nexoraops-verify'
});

const CRITICAL_TABLES = ['activities', 'beneficiaries', 'projects', 'donations'];
const CRITICAL_COLUMNS = ['offline_enabled', 'sync_status', 'version', 'deleted_at'];

(async () => {
  let client;
  try {
    client = await cloudPool.connect();
  } catch (err) {
    console.error('CONNECTION FAILED:', safeMessage(err));
    await cloudPool.end();
    process.exitCode = 1;
    return;
  }
  try {
    console.log('[SCAN] Checking critical offline/sync columns...\n');
    let failed = 0;
    for (const table of CRITICAL_TABLES) {
      const res = await client.query(
        'SELECT column_name FROM information_schema.columns WHERE table_schema = \'public\' AND table_name = $1',
        [table]
      );
      const cols = new Set(res.rows.map((r) => r.column_name));
      console.log('TABLE ' + table + ' (' + cols.size + ' columns):');
      for (const col of CRITICAL_COLUMNS) {
        const ok = cols.has(col);
        console.log('  ' + (ok ? '[OK]' : '[FAIL]') + ' ' + col);
        if (!ok) failed++;
      }
    }
    if (failed > 0) {
      console.log('\nSTATUS: NEEDS ATTENTION (' + failed + ' missing)');
      process.exitCode = 1;
    } else {
      console.log('\nSTATUS: OK');
    }
  } catch (err) {
    console.error('ERROR:', safeMessage(err));
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    await cloudPool.end();
  }
})();
