/**
 * SQL hygiene regression tests — guards defects that fatally break bootstrap.
 * 1. No JS `//` comments inside SQL template literals sent to Postgres.
 * 2. Migration files must not contain NUL bytes or SQLite-only dialect.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

function templateBlocks(source: string): { start: number; end: number }[] {
  const lines = source.split('\n');
  const blocks: { start: number; end: number }[] = [];
  let cur: number | null = null;
  lines.forEach((x, i) => {
    if (/await client\.query\(`/.test(x)) cur = i;
    else if (cur !== null && x.includes('`')) {
      blocks.push({ start: cur, end: i });
      cur = null;
    }
  });
  return blocks;
}

describe('SQL hygiene', () => {
  it('has no JS // comments inside SQL template literals', () => {
    const file = join(process.cwd(), 'src/server/database/enterprise_schema_completion.ts');
    const source = readFileSync(file, 'utf8');
    const lines = source.split('\n');
    const offenders: string[] = [];
    for (const b of templateBlocks(source)) {
      for (let i = b.start; i < b.end; i++) {
        if (/^\s*\/\//.test(lines[i])) offenders.push(`line ${i + 1}: ${lines[i].trim().slice(0, 60)}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('migration files avoid SQLite-only dialect', () => {
    const dir = join(process.cwd(), 'migrations');
    const bad: string[] = [];
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.sql'))) {
      const text = readFileSync(join(dir, f), 'utf8');
      if (/AUTOINCREMENT/i.test(text)) bad.push(`${f}: AUTOINCREMENT is SQLite-only`);
      if (text.includes('\0')) bad.push(`${f}: NUL byte`);
    }
    expect(bad).toEqual([]);
  });
});
