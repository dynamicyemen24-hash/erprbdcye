import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Accessibility conformance guard — WCAG 2.2, Success Criterion cited per test.
 *
 * These are *static* invariants, in the same spirit as `architecture.test.ts`:
 * each guards a defect that is invisible to the type checker, to ESLint and to
 * the build. A view that drops `scope` from a header row still compiles, still
 * lints, still builds and still passes every component test — the screen reader
 * simply stops announcing which column a number belongs to.
 */

const SRC = join(process.cwd(), 'src');
const readSrc = (p: string) => readFileSync(join(SRC, p), 'utf8');

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|css)$/.test(full)) out.push(full);
  }
  return out;
}

const allSource = walk(SRC)
  .map((f) => ({ file: f.replace(SRC, 'src').replace(/\\/g, '/'), text: readFileSync(f, 'utf8') }))
  // The server tree is not part of the view surface being governed.
  .filter(({ file }) => !file.includes('__tests__') && !file.startsWith('src/server'));

describe('WCAG 2.4.7 — Focus Visible (AA)', () => {
  const css = readSrc('index.css');

  it('declares the focus baseline in the base layer, not as an unlayered rule', () => {
    // An unlayered rule outranks every Tailwind layer and would fight the
    // `focus:ring-*` utilities that individual components already configure.
    const layerStart = css.indexOf('@layer base');
    expect(layerStart, 'index.css must own a @layer base block').toBeGreaterThan(-1);
    expect(css.slice(layerStart), 'the base layer must carry a :focus-visible rule').toContain(
      ':focus-visible'
    );
  });

  it('applies the --ux-focus-ring token that tokens.css declares', () => {
    // tokens.css has carried this token since the Design System landed, but
    // nothing consumed it — a documented affordance no element ever had.
    expect(readSrc('design-system/tokens.css')).toContain('--ux-focus-ring:');

    const applied = allSource
      .filter(({ file }) => file.endsWith('.css') && file !== 'src/design-system/tokens.css')
      .filter(({ text }) => text.includes('var(--ux-focus-ring)'))
      .map(({ file }) => file);

    expect(
      applied,
      'the focus ring token must be applied by at least one stylesheet, not merely declared'
    ).not.toEqual([]);
  });

  it('uses box-shadow for the ring so `outline-none` cannot cancel it', () => {
    // `outline-none` only clears `outline-style`. An outline-based ring would be
    // deleted by every view-layer site that suppresses outlines.
    expect(css).toMatch(/box-shadow:\s*var\(--ux-focus-ring\)/);
  });
});

/**
 * Read the attributes of one JSX opening tag starting at `open` (the index of
 * its `<`).
 *
 * WHY A READER AND NOT A REGEX
 * The obvious `/<th\b([^>]*)>/g` stops at the first `>`, and a sortable column
 * header in this codebase contains `onClick={c.sortable ? () => handleSort(id) :
 * undefined}` — whose `>` is part of `=>`. That truncates the capture *before*
 * a legitimate `scope="col"` on the next line, so a compliant file is reported
 * as an offender (and, in the codemod that originally added these scopes, an
 * offender's missing attribute caused a duplicate to be inserted instead:
 * TS17001).
 *
 * Matching to `</th>` instead is also wrong: a self-closing `<th ... />` has no
 * own closer, so the matcher consumes the *next* header as its body and the
 * real offender is never inspected at all. Verified: this version finds three
 * `<th>` in `DataTable`'s thead, where the `</th>`-based version found two.
 *
 * A `>` only terminates the tag at brace depth 0, outside quotes. Inside a
 * `={...}` expression every `>` is content, arrow functions included.
 */
function readOpeningTag(src: string, open: number): { attrs: string; end: number } | null {
  let brace = 0;
  let quote: string | null = null;
  for (let i = open + 1; i < src.length; i += 1) {
    const ch = src[i];
    if (quote) {
      if (ch === '\\') i += 1;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '{') brace += 1;
    else if (ch === '}') brace -= 1;
    else if (ch === '>' && brace === 0) return { attrs: src.slice(open, i), end: i + 1 };
  }
  return null;
}

describe('WCAG 1.3.1 — Info and Relationships (A): table headers', () => {
  it('gives every column header cell an explicit scope', () => {
    const offenders = new Set<string>();

    for (const { file, text } of allSource) {
      if (!file.endsWith('.tsx')) continue;
      // Only the <thead> row is a column-header row by definition.
      for (const block of text.matchAll(/<thead\b[^>]*>([\s\S]*?)<\/thead>/gi)) {
        const inner = block[1];
        let cursor = 0;
        for (;;) {
          const at = inner.indexOf('<th', cursor);
          if (at === -1) break;
          // `<thead>`/`</thead>`/`<th-something>` must not be mistaken for a cell.
          if (!/^<th(\s|>)/.test(inner.slice(at, at + 5))) {
            cursor = at + 3;
            continue;
          }
          const tag = readOpeningTag(inner, at);
          if (!tag) break;
          if (!/\bscope\s*=/.test(tag.attrs)) offenders.add(file);
          cursor = tag.end;
        }
      }
    }

    expect(
      [...offenders],
      'every <th> in a <thead> must declare scope="col" so screen readers announce the column name'
    ).toEqual([]);
  });
  it('associates every mechanically-linkable label with a control', () => {
    // 770 labels had no `htmlFor` and no nested control, so a screen reader
    // announced each field as "edit blank" — a Level-A failure of 1.3.1, 3.3.2
    // and 4.1.2 at once. 734 were sibling labels, of which 584 were linkable
    // mechanically; the rest need per-instance logic (see below).
    //
    // The codemod links the mechanical cases and deliberately skips two shapes
    // that need per-instance logic: labels inside a `.map()` (a constant id would
    // repeat across rows) and labels above a conditional control (the other
    // branch may hold a different control entirely). This guard is a RATCHET,
    // not a zero: the count may only go down, so new unlabelled markup is
    // caught immediately while the remainder stays visible for a
    // component-by-component pass.
    const offenders: string[] = [];

    for (const { file, text } of allSource) {
      if (!file.endsWith('.tsx') || file.startsWith('src/server')) continue;
      for (const m of text.matchAll(/<label\b([^>]*)>([\s\S]*?)<\/label>/g)) {
        const [, attrs, body] = m;
        if (/\bhtmlFor\s*=/.test(attrs)) continue;
        // Implicit association: the control is nested inside the label.
        if (/<(input|select|textarea)\b/.test(body)) continue;
        offenders.push(file);
      }
    }

    expect(
      offenders.length,
      `${offenders.length} labels still lack an association (baseline was 734). ` +
        'A label inside a .map() or above a conditional control needs useId() per instance — ' +
        'linking it mechanically would associate the wrong control.'
    ).toBeLessThanOrEqual(65);
  });
});

describe('the canonical ERP form pattern (SAP Fiori / Oracle Redwood / Fluent)', () => {
  const formField = readSrc('design-system/components/form/FormField.tsx');

  it('derives the association from useId instead of asking the caller to wire it', () => {
    // This is the property that makes the pattern correct by construction: the
    // caller never writes an id, so a field inside a `.map()` cannot collide the
    // way a hand-written id does. Without it, new screens keep reintroducing the
    // 99 remaining unlinked labels.
    expect(formField).toMatch(/useId\(\)/);
    expect(formField).toMatch(/htmlFor=\{id\}/);
    expect(formField).toMatch(/cloneElement/);
  });

  it('wires the full accessibility contract on the control', () => {
    // aria-describedby (WCAG 1.3.1), aria-invalid (3.3.1), a live region for the
    // message (4.1.3) and a non-colour-only required marker (1.4.1).
    for (const attr of ['aria-describedby', 'aria-invalid', 'aria-required']) {
      expect(formField, `FormField must wire ${attr}`).toContain(attr);
    }
    expect(formField, 'the error must be announced, not merely drawn').toContain(
      'role="alert"'
    );
    expect(formField, 'the required asterisk must be hidden from the a11y tree').toContain(
      'aria-hidden="true"'
    );
    expect(formField, 'required needs a textual equivalent for screen readers').toContain(
      'sr-only'
    );
  });

  it('gives the error precedence over the help text in aria-describedby', () => {
    // Only one element can own aria-describedby, and the error is what the user
    // needs to hear first.
    expect(formField).toMatch(/describedBy\s*=\s*errId\s*\?\?\s*descId/);
  });

  it('is exported from the design system barrel for discovery', () => {
    expect(readSrc('design-system/index.ts')).toMatch(
      /export \{ FormField, type FormFieldProps \}/
    );
  });
});

describe('design system authority — one definition per control', () => {
  it('keeps the canonical Button in the design system, exported from the barrel', () => {
    // The baseline audit found three button definitions. A primitive that lives
    // outside the Design System has no single owner, which is how they drift.
    const button = readSrc('design-system/components/Button.tsx');
    expect(button).toContain('export const Button');
    expect(readSrc('design-system/index.ts')).toContain("from './components/Button'");
  });

  it('delegates the legacy wrappers instead of re-declaring variants', () => {
    // A second variant map is a second set of focus/disabled/loading behaviour
    // that nobody reviews. Both wrappers must be pure re-exports.
    for (const f of [
      'components/common/EnterpriseButton.tsx',
      'components/enterprise/ToolbarButton.tsx',
    ]) {
      const src = readSrc(f);
      expect(src, `${f} must not re-declare VARIANT_MAP`).not.toMatch(/VARIANT_MAP\s*[:=]/);
      expect(src, `${f} must not re-declare SIZE_MAP`).not.toMatch(/SIZE_MAP\s*[:=]/);
    }
    expect(readSrc('components/common/EnterpriseButton.tsx')).toContain(
      'export const EnterpriseButton = Button;'
    );
  });

  it('keeps the baseline primitive set from regressing', () => {
    // The audit in scripts/audit-design-system.cjs scores the shipped primitives
    // against the set every mature system converges on. A ratchet: it may only
    // rise, so deleting a primitive is a visible test failure.
    const ds = readSrc('design-system/index.ts');
    for (const name of ['Button', 'Input', 'Select', 'Modal', 'Drawer', 'DataTable', 'FormField']) {
      expect(ds, `${name} must stay exported from the design system`).toMatch(
        new RegExp(`\\b${name}\\b`)
      );
    }
  });
});

describe('operational readiness — the health contract', () => {
  const health = readSrc('server/routes/health.routes.ts');

  it('probes cache through the redis module\'s own healthCheck', () => {
    // The first draft of readiness called `getRedisClient()`, a name the module
    // does not export. The route still answered 200 — the try/catch swallowed
    // the TypeError and reported `degraded` — so the bug was invisible in
    // testing and only visible in the response body.
    expect(health).toContain("import('../redis/client')");
    expect(health).toContain('healthCheck');
    expect(health, 'must not invent an export name').not.toContain('getRedisClient');

    expect(readSrc('server/redis/client.ts'), 'healthCheck must actually be exported').toMatch(
      /export\s+async\s+function\s+healthCheck/
    );
  });

  it('keeps liveness independent of every external dependency', () => {
    // A liveness probe that touches the database reports the *database* as dead
    // and gets the process restarted, turning a Neon hiccup into an outage.
    const liveness = health.slice(
      health.indexOf("healthRouter.get('/liveness'"),
      health.indexOf("healthRouter.get('/readiness'")
    );
    expect(liveness, 'the liveness route must be locatable').not.toBe(health);
    expect(liveness).toContain('process.uptime()');
    for (const dep of ['getDatabasePool', 'pool.query', 'healthCheck', 'fetch(']) {
      expect(liveness, `liveness must not depend on ${dep}`).not.toContain(dep);
    }
  });
});

describe('WCAG 4.1.3 — Status Messages (AA): notification pipeline', () => {
  const app = readSrc('App.tsx');

  it('mounts the Design System renderer, which models politeness per variant', () => {
    expect(app, 'the shell must mount ToastProvider').toContain('<ToastProvider>');
  });

  it('mounts exactly one notification viewport', () => {
    // Two mounted subscribers to the same bus means every message renders twice.
    expect(app, 'the legacy container must not be mounted alongside ToastProvider').not.toMatch(
      /<EnterpriseToastContainer[\s/>]/
    );
    const mounted = app.match(/<(ToastProvider|EnterpriseToastContainer)[\s/>]/g) ?? [];
    expect(mounted, 'exactly one notification renderer may be mounted').toHaveLength(1);
  });

  it('keeps the bus as the contract so existing call sites keep working', () => {
    // ~40 view files import showToast from the legacy module. It must stay
    // exported and must stay a pure write to the bus, or the migration silently
    // breaks every one of them.
    const container = readSrc('components/enterprise/EnterpriseToastContainer.tsx');
    expect(container, 'showToast must stay exported for the view layer').toMatch(
      /export const showToast/
    );
    expect(container, 'showToast must still write to the bus').toContain(
      'EnterpriseNotificationBus.getInstance().notifyToast'
    );
  });

  it('derives assertive vs polite from the variant rather than hard-coding polite', () => {
    // The legacy container announced failures with aria-live="polite", so a
    // failed payment was as quiet as a routine sync confirmation.
    expect(readSrc('design-system/components/Toast.tsx')).toContain(
      "toast.variant === 'error' || toast.variant === 'warning' ? 'assertive' : 'polite'"
    );
  });
});

describe('WCAG 2.4.1 — Bypass Blocks (A)', () => {
  it('provides the skip link from exactly one provider', () => {
    // A duplicate skip link is announced twice by every screen reader.
    const providers = readSrc('App.tsx').match(/<AccessibilityProvider[\s/>]/g) ?? [];
    expect(providers, 'AccessibilityProvider must be mounted exactly once').toHaveLength(1);
  });
});

