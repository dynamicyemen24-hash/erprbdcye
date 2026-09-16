require('dotenv').config();
const fs = require('fs');
const { Client } = require('pg');
(async () => {
  const text = fs.readFileSync('migrations/20260902_business_intelligence_views.sql', 'utf8');
  const i = text.indexOf('v_project_portfolio AS');
  const selStart = text.indexOf('SELECT', i);
  let depth = 0;
  let end = selStart;
  for (let k = selStart; k < text.length; k++) {
    const ch = text[k];
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ';' && depth === 0) {
      end = k;
      break;
    }
  }
  const select = text.slice(selStart, end);
  let c = null;
  for (let a = 0; a < 5; a++) {
    c = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 60000 });
    try {
      await c.connect();
      break;
    } catch (e) {
      try {
        await c.end().catch(() => {});
      } catch {}
      await new Promise((r) => setTimeout(r, 3000 * (a + 1)));
      if (a === 4) throw e;
      c = null;
    }
  }
  try {
    await c.query('EXPLAIN ' + select);
    console.log('EXPLAIN OK');
  } catch (e) {
    console.log('FAIL:', e.message);
    const pos = parseInt(e.position || '0', 10);
    const marked = select.slice(0, pos) + ' <<HERE>> ' + select.slice(pos);
    const at = marked.indexOf('<<HERE>>');
    console.log('CONTEXT:', JSON.stringify(marked.slice(Math.max(0, at - 200), at + 100)));
  }
  await c.end();
})().catch((e) => {
  console.log('FAIL', e.message);
  process.exit(1);
});
