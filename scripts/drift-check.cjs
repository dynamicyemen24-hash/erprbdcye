// Compares CREATE TABLE columns in a migration file vs information_schema.
require('dotenv').config();
const fs = require('fs');
const { Client } = require('pg');

async function main() {
  const file = process.argv[2];
  const sql = fs.readFileSync(file, 'utf8');
  const tables = {};
  const re = /CREATE TABLE IF NOT EXISTS\s+(\w+)\s*\(([\s\S]*?)\n\);/g;
  let m;
  while ((m = re.exec(sql)) !== null) {
    const cols = [];
    // split top-level commas (ignore parens depth)
    let depth = 0;
    let cur = '';
    for (const ch of m[2]) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && depth === 0) {
        cols.push(cur);
        cur = '';
      } else cur += ch;
    }
    if (cur.trim()) cols.push(cur);
    tables[m[1]] = cols
      .map((c) => c.trim().split(/\s+/)[0].replace(/["`,]/g, '').toLowerCase())
      .filter((c) => c && !['constraint', 'primary', 'foreign', 'unique', 'check', 'like'].includes(c));
  }
  console.log('tables found:', Object.keys(tables).join(', '));

  let client = null;
  let lastErr = null;
  for (let attempt = 1; attempt <= 6; attempt++) {
    client = new Client({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 60000,
      statement_timeout: 30000,
    });
    try {
      await client.connect();
      lastErr = null;
      break;
    } catch (e) {
      lastErr = e;
      try {
        await client.end().catch(() => {});
      } catch {}
      console.log(`connect attempt ${attempt} failed, retrying...`);
      await new Promise((r) => setTimeout(r, 4000 * attempt));
    }
  }
  if (lastErr) throw lastErr;
  for (const [t, cols] of Object.entries(tables)) {
    const r = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`,
      [t]
    );
    const actual = new Set(r.rows.map((x) => x.column_name));
    if (actual.size === 0) {
      console.log(`${t}: MISSING TABLE (will be created)`);
      continue;
    }
    const missing = cols.filter((c) => !actual.has(c));
    if (missing.length > 0) console.log(`${t}: MISSING COLUMNS -> ${missing.join(', ')}`);
    else console.log(`${t}: ok (${cols.length} cols)`);
  }
  await client.end();
}

main().catch((e) => {
  console.error('DRIFT-CHECK-FAIL', e.message);
  process.exit(1);
});
