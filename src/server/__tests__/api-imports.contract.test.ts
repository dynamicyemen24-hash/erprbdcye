import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Every relative import inside api/ must resolve to a file that actually
 * exists. Vercel bundles api/** per-function, so a wrong depth (e.g.
 * ../../../ from a two-level-deep handler escaping the project root)
 * only shows up as ERR_MODULE_NOT_FOUND 500s in production. This test
 * fails the build before that can happen.
 */

const API_DIR = path.join(process.cwd(), 'api');

function listTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listTsFiles(full));
    else if (entry.name.endsWith('.ts')) out.push(full);
  }
  return out;
}

function resolvesOnDisk(fromFile: string, spec: string): boolean {
  const base = path.resolve(path.dirname(fromFile), spec);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.js'),
  ];
  // A `.js` specifier may legally map to a sibling `.ts` source file
  // (ESM + TypeScript convention used across this repo).
  if (base.endsWith('.js')) candidates.push(`${base.slice(0, -3)}.ts`);
  return candidates.some((c) => fs.existsSync(c));
}

describe('api/ relative import contract', () => {
  it('every relative import in api/ resolves to an existing file', () => {
    const offenders: string[] = [];
    for (const file of listTsFiles(API_DIR)) {
      const source = fs.readFileSync(file, 'utf8');
      const pattern = /from\s+['"](\.[^'"]+)['"]/g;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(source)) !== null) {
        const spec = match[1];
        if (!resolvesOnDisk(file, spec)) {
          offenders.push(`${path.relative(process.cwd(), file)} -> ${spec}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
