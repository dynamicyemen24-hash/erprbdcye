import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * ══════════════════════════════════════════════════════════════════════════
 * HONESTY GUARD — static invariants for the defects fixed in PHASE 0.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * These are *structural* assertions in the spirit of `architecture.test.ts`:
 * each guards a defect invisible to the type checker, to ESLint and to the
 * build. A screen that reintroduces a hardcoded currency still compiles, still
 * lints and still ships — and puts two different currencies in front of a board
 * reading the same books.
 *
 * The behavioural tests that accompany them prove the fix WORKS. These prove it
 * has not been undone, including in files nobody thought to write a test for.
 */

const SRC = join(process.cwd(), 'src');

function readSrc(rel: string): string {
  return readFileSync(join(SRC, rel), 'utf8');
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(full) && !full.includes('__tests__')) out.push(full);
  }
  return out;
}

/**
 * Strip comments before scanning.
 *
 * Without this the guard is unusable in practice: every fix documents the
 * defect it fixes, and a comment saying "this used to print €" would be reported
 * as "this prints €" — training the team to delete the explanation rather than
 * keep the invariant. What matters is what the CODE can do, not what the prose
 * mentions.
 */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const allViewSource = walk(SRC)
  .map((f) => ({ file: f.replace(SRC, 'src').replace(/\\/g, '/'), text: readFileSync(f, 'utf8') }))
  .filter(({ file }) => !file.startsWith('src/server'))
  .map(({ file, text }) => ({ file, text, code: stripComments(text) }));

/**
 * Files allowed to contain a dotted-number literal that is NOT the app version.
 *   core/version.ts             — the fallback constant itself.
 *   core/services/persistence.ts — a CACHE-SCHEMA version, bumped when the
 *     IndexedDB entry shape changes so stale caches are invalidated. Merging it
 *     into the product version is precisely the ambiguity this audit removes.
 */
const VERSION_ALLOWLIST = new Set([
  'src/core/version.ts',
  'src/core/services/persistence.ts',
]);

describe('P0-2 — exactly one version literal may exist', () => {
  it('declares the version in package.json only', () => {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('contains no hand-copied version string in the view layer', () => {
    // FOUR numbers once described one product: 4.0.0 (package.json), 4.0.0
    // (core/updates.ts), 2.4.0-Enterprise (footer), 2.6.0-Enterprise
    // (core/config). The fourth was found by this guard, not by inspection.
    const offenders = allViewSource
      .filter(({ file, code }) => !VERSION_ALLOWLIST.has(file))
      .filter(({ code }) => /['"`]\s*v?\d+\.\d+\.\d+(-Enterprise)?\s*['"`]/.test(code))
      .map(({ file }) => file);

    expect(offenders, 'the build number must come from core/version.ts, never a literal').toEqual([]);
  });

  it('reads the version from the single source module', () => {
    expect(readSrc('core/version.ts')).toContain('__APP_VERSION__');
    expect(readSrc('components/GlobalOperationalFooter.tsx')).toContain('APP_VERSION_FULL_LABEL');
    expect(stripComments(readSrc('core/config/index.ts'))).toContain('version: APP_VERSION');
  });
});

describe('P0-1 — no invented network endpoints', () => {
  it('never contacts a placeholder host', () => {
    // example.com is the host that made the update banner assert a fact it had
    // never verified. `updates.example.org` in the tests is the deliberately
    // unreachable stand-in used to drive the "failed" branch.
    const offenders = allViewSource
      .filter(({ code }) => /https?:\/\/(www\.)?example\.com/.test(code))
      .map(({ file }) => file);

    expect(offenders, 'placeholder endpoints must not ship to production').toEqual([]);
  });

  it('makes the update check inert without a manifest URL', () => {
    const updates = readSrc('core/updates.ts');
    expect(updates).toContain("status: 'disabled'");
    // The old code fell back to a literal URL; the guard is its absence.
    expect(updates).not.toMatch(/remoteManifestUrl\s*\|\|/);
  });
});

describe('P0-3 — financial amounts never hardcode a currency symbol', () => {
  it('renders every amount through the shared currency formatter', () => {
    for (const rel of ['reports/CashFlowReport.tsx', 'reports/ProfitabilityReport.tsx']) {
      const code = stripComments(readSrc(rel));
      expect(code, `${rel} must use formatCurrency`).toContain('formatCurrency');
      expect(code, `${rel} must not print a euro symbol`).not.toContain('€');
    }
  });

  it('contains no stray euro sign anywhere in the view layer', () => {
    // `CurrenciesView` is exempt only for its input placeholder: that field
    // exists to let an administrator type ANY currency symbol, so naming real
    // ones is correct — but the examples must be currencies this ledger
    // actually supports (YER/SAR/USD), not the euro.
    const offenders = allViewSource
      .filter(({ file }) => !file.endsWith('CurrenciesView.tsx'))
      .filter(({ code }) => code.includes('€'))
      .map(({ file }) => file);

    expect(
      offenders,
      'the ledger is YER/SAR/USD — a hardcoded € misrepresents the books (ISO 4217)'
    ).toEqual([]);
  });

  it('offers supported currencies as the symbol examples', () => {
    const code = stripComments(readSrc('components/CurrenciesView.tsx'));
    expect(code, 'the placeholder must not suggest the euro').not.toContain('€');
  });
});
describe('P0-4 — no component is mounted with permanently-empty props', () => {
  it('does not pass all-null figures to the profitability report', () => {
    const home = readSrc('components/dashboard/UnifiedHomeWorkspace.tsx');
    // `<ProfitabilityReport revenue={null} expenses={null} netMargin={null} />`
    // made the report return null forever under a heading that promised it.
    expect(home).not.toMatch(/<ProfitabilityReport[^>]*revenue=\{null\}/s);
  });
});

describe('P0-5 — a singleton is mounted exactly once', () => {
  it('mounts UpdateBanner in the shell only', () => {
    const shellMounts = (readSrc('App.tsx').match(/<UpdateBanner/g) ?? []).length;
    const homeMounts = (
      readSrc('components/dashboard/UnifiedHomeWorkspace.tsx').match(/<UpdateBanner/g) ?? []
    ).length;

    expect(shellMounts, 'the shell must own the banner').toBe(1);
    expect(homeMounts, 'a view must never mount a second copy').toBe(0);
  });

  it('does not position the banner over the header', () => {
    // `fixed top-0 … z-50` covered the application header on every session.
    // Scanned with comments stripped: the file's doc block necessarily *names*
    // the pattern it removed, and that must not count as a violation.
    const code = stripComments(readSrc('components/UpdateBanner.tsx'));
    expect(code).not.toMatch(/fixed top-0/);
  });
});

describe('P0-6 — connectivity is probed, not inferred from truthiness', () => {
  it('no longer derives the database status from `!!serverStats`', () => {
    // `serverStats` legitimately feeds the KPI memo; what must not come back is
    // the boolean it used to imply. Scanned with comments stripped, because the
    // fix's own doc block names the expression it removed.
    const code = stripComments(readSrc('App.tsx'));
    expect(
      code,
      'a stale cached object must not be able to report the database as healthy'
    ).not.toContain('!!serverStats');
  });

  it('reads the readiness probe that already exists in the API', () => {
    expect(readSrc('core/hooks/useDbHealth.ts')).toContain('/api/v2/health/readiness');
  });
});

describe('P2-1 — status is never encoded by colour alone (WCAG 1.4.1)', () => {
  it('gives every MetricTile freshness state a spoken label and a distinct shape', () => {
    const tile = readSrc('design-system/pro/MetricTile.tsx');
    expect(tile, 'text equivalent').toContain('FRESHNESS_AR');
    expect(tile, 'english equivalent').toContain('FRESHNESS_EN');
    expect(tile, 'shape mapping').toContain('FRESHNESS_SHAPE');
    expect(tile, 'state exposed to tests').toContain('data-freshness');
  });

  it('does not rely on a title attribute to convey state', () => {
    const tile = readSrc('design-system/pro/MetricTile.tsx');
    // `title` is not reliably announced and is unreachable by keyboard.
    expect(tile).not.toMatch(/title=\{[^}]*FRESHNESS/);
  });
});

describe('P2-2 — aria-label must not hide rendered content (WCAG 1.3.1)', () => {
  it('does not override the tile content with a synthesized label', () => {
    const tile = readSrc('design-system/pro/MetricTile.tsx');
    expect(tile).not.toMatch(/aria-label=\{ariaLabel\}/);
    expect(tile, 'state must travel via aria-describedby').toContain('aria-describedby');
  });
});

describe('P2-3 — exactly one skip link, logically positioned', () => {
  it('is mounted only by AccessibilityProvider', () => {
    expect(readSrc('App.tsx')).not.toContain('href="#main-content"');
    expect(readSrc('design-system/components/AccessibilityProvider.tsx')).toContain('skipTargetId');
  });

  it('positions it with a logical offset so RTL is correct', () => {
    const provider = readSrc('design-system/components/AccessibilityProvider.tsx');
    expect(provider).toContain('focus:start-4');
    expect(provider).not.toContain('focus:left-4');
  });
});

describe('P2-11 — no click handler lives on an unfocusable element (WCAG 2.1.1)', () => {
  it('exposes the header search as a real button', () => {
    // Anchors are taken from the CODE (comments stripped), because the section
    // labels used to slice this block are themselves JSX comments — which the
    // stripper removes along with the explanation of what was fixed.
    const code = stripComments(readSrc('components/GlobalEnterpriseHeader.tsx'));
    const start = code.indexOf('onClick={() => setIsCommandCenterOpen(true)}');
    // Slice to the NEXT occurrence, not the declaration further up the file:
    // `toggleEnvironmentMode` appears in the destructuring above this block.
    const end = code.indexOf('onClick={toggleEnvironmentMode}', start);

    expect(start, 'the search trigger must exist').toBeGreaterThan(-1);
    expect(end, 'the marker after the search block must exist').toBeGreaterThan(start);

    const block = code.slice(start, end);
    // A `<div onClick>` is unreachable without a mouse (WCAG 2.1.1, Level A).
    expect(block).toContain('<button');
    expect(block, 'an accessible name is required').toContain('aria-label');
    expect(block).not.toMatch(/<div\s+onClick/);
  });
});

describe('P3-5 — the e2e suite can actually fail', () => {
  it('contains no tautological assertions', () => {
    const specs = ['accessibility.spec.ts', 'i18n.spec.ts', 'responsive.spec.ts']
      .map((f) => stripComments(readFileSync(join(process.cwd(), 'e2e', f), 'utf8')))
      .join('\n');

    // Scanned with comments stripped: each rewritten file explains in prose
    // which tautology it removed, and quoting that prose is not a regression.
    // These patterns produced a green suite while asserting nothing at all.
    expect(specs, 'toBeGreaterThanOrEqual(0) can never fail').not.toContain(
      'toBeGreaterThanOrEqual(0)'
    );
    expect(specs, 'accepting `null` as a direction asserts nothing').not.toContain("'ltr', null");
    expect(specs).not.toContain("'rtl', 'ltr', null");
  });
});