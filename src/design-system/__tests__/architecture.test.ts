import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Design System architecture guard.
 *
 * These are *static* invariants about the token / motion layers. They exist
 * because the failures they catch are silent: a stylesheet that is never
 * imported still type-checks, still lints, still builds, and still passes every
 * component test — the animation simply never runs in the browser.
 */

const SRC = join(process.cwd(), 'src');
const readSrc = (p: string) => readFileSync(join(SRC, p), 'utf8');

/** Recursively collect every .ts/.tsx source file under `src`. */
function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(full)) out.push(full);
  }
  return out;
}

const allSource = walk(SRC).map((f) => ({
  file: f.replace(SRC, 'src').replace(/\\/g, '/'),
  text: readFileSync(f, 'utf8'),
}));

describe('design token layer', () => {
  it('declares the full governed z-index scale', () => {
    const css = readSrc('index.css');
    for (const step of [
      '--z-base',
      '--z-sticky',
      '--z-dropdown',
      '--z-popover',
      '--z-tooltip',
      '--z-drawer',
      '--z-dialog',
      '--z-command',
      '--z-critical',
      '--z-toast',
      '--z-skip-link',
    ]) {
      expect(css, `${step} must be declared`).toContain(`${step}:`);
    }
  });

  it('keeps the z-index scale strictly ascending', () => {
    const css = readSrc('index.css');
    // Anchor on the governance comment block (which sits immediately above the
    // scale inside `:root`) and stop at the density overrides, so the Tailwind
    // `@theme` mirror (`--z-index-*`) earlier in the file is not picked up.
    // The phrase appears twice: once in the `@theme` mirror block and once above
    // the canonical scale in `:root`. Take the *second* occurrence.
    const marker = 'Z-Index Governance Scale';
    const start = css.indexOf(marker, css.indexOf(marker) + 1);
    expect(start, 'index.css must document the canonical z-index block').toBeGreaterThan(-1);
    const end = css.indexOf('[data-density');
    const root = css.slice(start, end);
    const values = [...root.matchAll(/--z-([\w-]+):\s*(\d+)\s*;/g)].map((m) => ({
      name: `--z-${m[1]}`,
      n: Number(m[2]),
    }));

    expect(values.map((v) => v.name)).toEqual([
      '--z-base',
      '--z-sticky',
      '--z-dropdown',
      '--z-popover',
      '--z-tooltip',
      '--z-drawer',
      '--z-dialog',
      '--z-command',
      '--z-critical',
      '--z-toast',
      '--z-skip-link',
    ]);

    for (let i = 1; i < values.length; i++) {
      expect(
        values[i].n,
        `${values[i].name} must outrank ${values[i - 1].name}`
      ).toBeGreaterThan(values[i - 1].n);
    }
  });

  it('does not let tokens.css redeclare a competing z-index scale', () => {
    const tokens = readSrc('design-system/tokens.css');
    const hardcoded = [...tokens.matchAll(/--ux-z-[\w-]+:\s*(\d+)\s*;/g)].map((m) => m[0].trim());
    expect(
      hardcoded,
      'tokens.css must alias var(--z-*) instead of hardcoding a second scale'
    ).toEqual([]);
  });
});

describe('motion layer', () => {
  it('imports every animation stylesheet that defines utilities', () => {
    const css = readSrc('index.css');
    expect(css).toContain('@import "./shared/styles/animations.css"');
    expect(css).toContain('@import "./design-system/animations.css"');
  });

  it('resolves every project-specific animate-* utility to a real rule', () => {
    const defined = new Set<string>();
    for (const sheet of [
      'index.css',
      'design-system/animations.css',
      'shared/styles/animations.css',
    ]) {
      for (const m of readSrc(sheet).matchAll(/^\s*\.([a-z][a-z0-9-]+)\s*\{/gm)) {
        defined.add(m[1]);
      }
    }

    // Names that are utilities of Tailwind itself (generated on demand from the
    // `animate-*` namespace) or companion enter/exit state modifiers that are
    // not animation primitives in their own right.
    const TAILWIND_BUILTIN = new Set([
      'animate-spin',
      'animate-ping',
      'animate-pulse',
      'animate-bounce',
      'animate-none',
      // Pairing modifier for `.animate-in` — it carries no keyframes of its own.
      'animate-out',
    ]);

    const orphaned = new Map<string, number>();
    for (const { file, text } of allSource) {
      if (file.includes('__tests__')) continue;
      for (const m of text.matchAll(/(?<![\w-])((?:ux-)?animate-[a-z0-9]+(?:-[a-z0-9]+)*)(?![\w-])/g)) {
        const cls = m[1];
        if (defined.has(cls) || TAILWIND_BUILTIN.has(cls)) continue;
        orphaned.set(cls, (orphaned.get(cls) ?? 0) + 1);
      }
    }

    expect(
      [...orphaned.entries()].map(([cls, n]) => `${cls} (${n} use(s))`),
      'every custom animate-* utility used in source must be defined by an imported stylesheet'
    ).toEqual([]);
  });
});
