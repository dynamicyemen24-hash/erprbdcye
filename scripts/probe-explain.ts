import { readFileSync } from 'fs';
import { getPool, closePool } from '../src/server/core/database';

async function main() {
  const text = readFileSync('migrations/20260902_business_intelligence_views.sql', 'utf8');
  const i = text.indexOf('v_project_portfolio AS');
  // extract SELECT ... up to the ORDER BY end (find ';' after GROUP BY section)
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
  const pool = getPool();
  try {
    await pool.query('EXPLAIN ' + select);
    console.log('EXPLAIN OK');
  } catch (e: any) {
    console.log('FAIL:', e.message);
    console.log('position:', e.position);
    if (e.position) {
      const pos = parseInt(e.position, 10);
      console.log('context:', JSON.stringify(select.slice(Math.max(0, pos - 120), pos + 60)));
    }
  }
  await closePool();
}
main().catch((e) => {
  console.error('PROBE-CRASH', e?.message || e);
  process.exit(2);
});
