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

const pool = new Pool({
  connectionString: requireDatabaseUrl(),
  connectionTimeoutMillis: 10000,
  statement_timeout: 15000,
  query_timeout: 15000,
  application_name: 'nexoraops-verify'
});

(async () => {
  let client;
  try {
    client = await pool.connect();
  } catch (err) {
    console.error('❌ CONNECTION FAILED:', safeMessage(err));
    await pool.end();
    process.exitCode = 1;
    return;
  }
  try {
    console.log('✅ CONNECTION SUCCESSFUL');
    const tables = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.log('\n📊 TABLES IN CLOUD DATABASE (' + tables.rows.length + ' tables):');
    tables.rows.forEach((t, i) => {
      console.log(`${i + 1}. ${t.table_name}`);
    });
    const total = await client.query(
      "SELECT COUNT(*) as total FROM information_schema.tables WHERE table_schema = 'public'"
    );
    console.log('\nTotal tables:', total.rows[0].total);
  } catch (err) {
    console.error('❌ CONNECTION FAILED:', safeMessage(err));
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();