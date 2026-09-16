import { readFileSync } from 'fs';
import { getPool, closePool } from '../src/server/core/database';

function splitTopLevel(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const stmts: string[] = [];
  let i = 0;
  const countParens = (s: string) => {
    let d = 0;
    for (const ch of s) {
      if (ch === '(') d++;
      if (ch === ')') d--;
    }
    return d;
  };
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('--')) {
      i++;
      continue;
    }
    // DO block: consume through the line that is exactly $$; (or ends the block)
    if (/^DO\s+\$(\w*)\$/.test(trimmed)) {
      const tag = trimmed.match(/^DO\s+\$(\w*)\$/)?.[1] || '';
      const close = `$${tag}$;`;
      const acc = [line];
      i++;
      while (i < lines.length && lines[i].trim() !== close) {
        acc.push(lines[i]);
        i++;
      }
      if (i < lines.length) acc.push(lines[i]);
      i++;
      stmts.push(acc.join('\n'));
      continue;
    }
    // Ordinary statement: accumulate to ; at depth 0
    const acc = [line];
    let depth = countParens(line);
    i++;
    while (i < lines.length && !( /;\s*$/.test(lines[i]) && depth + countParens(lines[i]) <= 0)) {
      acc.push(lines[i]);
      depth += countParens(lines[i]);
      i++;
    }
    if (i < lines.length) {
      acc.push(lines[i]);
      i++;
    }
    stmts.push(acc.join('\n'));
  }
  return stmts.filter((s) => s.trim());
}

async function main() {
  const file = process.argv[2];
  const only = process.argv[3] ? parseInt(process.argv[3], 10) : -1;
  const stmts = splitTopLevel(readFileSync(file, 'utf8'));
  console.log(`statements: ${stmts.length}`);
  const pool = getPool();
  for (let k = 0; k < stmts.length; k++) {
    if (only >= 0 && k !== only) continue;
    const preview = stmts[k].slice(0, 100).replace(/\s+/g, ' ');
    try {
      await pool.query(stmts[k]);
      console.log(`ok ${k}: ${preview}`);
    } catch (e: any) {
      console.log(`FAIL ${k}: ${preview}`);
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
