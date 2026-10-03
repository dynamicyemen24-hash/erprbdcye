import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Bundle budget guard.
 *
 * The defect this exists to prevent is invisible to every other check: a build
 * that type-checks, lints, passes all 751 unit tests and still ships a 1 MB PDF
 * library to every user before first paint. Performance regressions are only
 * visible when someone measures the number, so the number gets a test.
 *
 * The test is skipped (not failed) when no build manifest is present, so the
 * unit-test run stays hermetic — run `npx vite build --manifest` to enforce it.
 */

const ROOT = process.cwd();
const MANIFEST = join(ROOT, 'dist', '.vite', 'manifest.json');
const hasBuild = existsSync(MANIFEST);

/** Total bytes the browser must fetch before the app can paint. */
const CRITICAL_PATH_BUDGET_KB = 1200;

/** No single vendor chunk on the critical path may exceed this. */
const VENDOR_CHUNK_BUDGET_KB = 400;

interface Entry {
  file: string;
  isEntry?: boolean;
  imports?: string[];
}

let entries: Record<string, Entry> = {};
let entryKey = '';
let criticalPathKb = 0;
let entryFile = '';

beforeAll(() => {
  if (!hasBuild) return;
  entries = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  entryKey =
    Object.keys(entries).find((k) => entries[k].isEntry) ??
    Object.keys(entries).find((k) => !k.startsWith('_'));
  const sizeOf = (file: string) => {
    const p = join(ROOT, 'dist', file);
    return existsSync(p) ? readFileSync(p).length : 0;
  };
  entryFile = entries[entryKey].file;
  criticalPathKb =
    (sizeOf(entryFile) +
      (entries[entryKey].imports ?? []).reduce(
        (sum, k) => sum + sizeOf(entries[k]?.file ?? ''),
        0
      )) /
    1024;
});

describe.skipIf(!hasBuild)('bundle budget — first paint', () => {
  it(`keeps the blocking critical path under ${CRITICAL_PATH_BUDGET_KB} KB`, () => {
    // Was 2423 KB. The regression that caused it was `manualChunks` forcing
    // jspdf / html2canvas / xlsx / recharts / leaflet into static chunks, which
    // silently overrode the `await import()` boundaries the source already had.
    expect(
      Math.round(criticalPathKb),
      `critical path is ${Math.round(criticalPathKb)} KB (entry ${entryFile}). ` +
        'A heavy library has probably been pulled back onto the blocking path — ' +
        'run `node scripts/analyze-critical-path.cjs` and `node scripts/who-imports.cjs <lib>`.'
    ).toBeLessThanOrEqual(CRITICAL_PATH_BUDGET_KB);
  });

  it(`keeps every vendor chunk on the critical path under ${VENDOR_CHUNK_BUDGET_KB} KB`, () => {
    const sizeOf = (file: string) => {
      const p = join(ROOT, 'dist', file);
      return existsSync(p) ? readFileSync(p).length / 1024 : 0;
    };
    const offenders = (entries[entryKey].imports ?? [])
      .map((k) => entries[k]?.file)
      .filter((f): f is string => Boolean(f?.includes('vendor')))
      .map((f) => ({ file: f, kb: sizeOf(f) }))
      .filter((v) => v.kb > VENDOR_CHUNK_BUDGET_KB)
      .map((v) => `${v.file} (${Math.round(v.kb)} KB)`);

    expect(
      offenders,
      'no single-purpose vendor chunk above the budget may block first paint'
    ).toEqual([]);
  });

  it('does not preload the optional heavy libraries speculatively', () => {
    // Preloading a chart/PDF/map library costs bandwidth for users who never
    // open the feature that needs it.
    const config = readFileSync(join(ROOT, 'vite.config.ts'), 'utf8');
    const preloadBlock = config.slice(
      config.indexOf('modulePreload'),
      config.indexOf('rollupOptions')
    );
    for (const lib of ['jspdf', 'html2canvas', 'xlsx', 'recharts', 'leaflet']) {
      expect(
        preloadBlock,
        `${lib} must stay out of modulePreload`
      ).toContain(lib);
    }
  });
});

describe('build configuration invariants', () => {
  const config = readFileSync(join(ROOT, 'vite.config.ts'), 'utf8');

  it('pins an explicit browser target instead of esnext', () => {
    // 'esnext' emits syntax verbatim: engines without the newest proposals get a
    // parse error and a blank page. For an ERP that is a total, silent failure.
    expect(config, 'build.target must be an explicit browser list').not.toMatch(
      /target:\s*'esnext'/
    );
    expect(config).toMatch(/target:\s*\[/);
  });

  it('does not hand-split optional heavy libraries into static vendor chunks', () => {
    // Naming them in manualChunks makes them static units, which is precisely
    // what dragged 1 MB of PDF code onto the critical path before.
    for (const lib of ['jspdf', 'html2canvas', 'xlsx', 'recharts', 'leaflet']) {
      const manualChunkBlock = config.slice(
        config.indexOf('manualChunks'),
        config.indexOf('modulePreload') > 0
          ? config.indexOf('modulePreload')
          : config.length
      );
      expect(
        manualChunkBlock,
        `${lib} must not be forced into a static manual chunk`
      ).not.toContain(`includes('${lib}`);
    }
  });
});
