import { readFileSync } from 'fs';
import { getPool, closePool } from '../src/server/core/database';

// Replicates the splitter: run exactly statement <idx> of a migration file.
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
    const acc = [line];
    let depth = countParens(line);
    i++;
    while (i < lines.length && !(/;\s*$/.test(lines[i]) && depth + countParens(lines[i]) <= 0)) {
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
  const idx = parseInt(process.argv[3], 10);
  const stmts = splitTopLevel(readFileSync(file, 'utf8'));
  console.log(`running stmt ${idx}: ${stmts[idx].slice(0, 80).replace(/\s+/g, ' ')}`);
  const pool = getPool();
  try {
    await pool.query(stmts[idx]);
    console.log('OK');
  } catch (e: any) {
    console.log('FAIL:', e.message);
    console.log('detail:', e.detail || '-', 'position:', e.position || '-', 'where:', (e.where || '-').slice(0, 300));
  }
  await closePool();
}
main().catch((e) => {
  console.error('PROBE-CRASH', e?.message || e);
  process.exit(2);
});
