// Runs each top-level statement of one migration file separately to isolate failures.
import { readFileSync } from 'fs';
import { getPool, closePool } from '../src/server/core/database';

function splitStatements(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const stmts: string[] = [];
  let acc: string[] = [];
  let parenDepth = 0;
  let dollarDepth = 0;
  const countParens = (s: string) => {
    let d = 0;
    for (const ch of s) {
      if (ch === '(') d++;
      if (ch === ')') d--;
    }
    return d;
  };
  const flush = () => {
    const s = acc.join('\n').trim();
    if (s && !/^--/.test(s.split('\n').filter((l) => l.trim())[0] || '')) stmts.push(s);
    else if (s) stmts.push(s);
    acc = [];
    parenDepth = 0;
  };
  for (const line of lines) {
    const dollars = (line.match(/\$\$/g) || []).length;
    const trimmed = line.trim();
    if (dollarDepth === 0 && acc.length === 0 && /^--/.test(trimmed)) {
      stmts.push(line); // standalone comment
      continue;
    }
    if (dollarDepth === 0 && acc.length === 0 && trimmed === '') continue;
    acc.push(line);
    parenDepth += countParens(line);
    if (dollarDepth === 0 && /;\s*$/.test(line) && parenDepth <= 0) flush();
    if (dollars % 2 === 1) dollarDepth = dollarDepth === 0 ? 1 : 0;
  }
  if (acc.join('').trim()) flush();
  return stmts.filter((s) => s.trim() && !/^\s*--/.test(s));
}

async function main() {
  const file = process.argv[2];
  const text = readFileSync(file, 'utf8');
  const stmts = splitStatements(text);
  console.log(`statements: ${stmts.length}`);
  const pool = getPool();
  for (let i = 0; i < stmts.length; i++) {
    const preview = stmts[i].slice(0, 90).replace(/\s+/g, ' ');
    try {
      await pool.query(stmts[i]);
      console.log(`ok ${i}: ${preview}`);
    } catch (e: any) {
      console.log(`FAIL ${i}: ${preview}`);
      console.log(`  err: ${e.message}`);
      break;
    }
  }
  await closePool();
}
main().catch((e) => {
  console.error('PROBE-CRASH', e?.message || e);
  process.exit(2);
});
