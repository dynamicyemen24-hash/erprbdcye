/**
 * UAMEX ERP™ — Single source of truth for the application version.
 *
 * WHY THIS FILE EXISTS
 * Three hardcoded version strings once coexisted: `package.json` said 4.0.0,
 * `core/updates.ts` said 4.0.0, and the global footer said 2.4.0-Enterprise.
 * A user comparing the footer with the About dialog saw two different builds
 * of the same product, which reads as an unmaintained deployment — the single
 * most damaging impression an ERP can give.
 *
 * The version is injected at BUILD time from package.json by `vite.config.ts`
 * (`define: { __APP_VERSION__ }`). There is exactly one literal left in the
 * repository — the one in package.json — and it is read at build time rather
 * than copied by hand.
 *
 * The runtime fallback exists for two real cases, not for convenience:
 *   1. Vitest/jsdom, where `define` substitution does not run.
 *   2. `server.ts`, which esbuild-bundles without Vite's define pipeline.
 *
 * THE FALLBACK MUST STAY PARSEABLE
 * It is deliberately `0.0.0` and NOT `0.0.0-dev`. The update checker validates
 * versions against `^\d+\.\d+\.\d+$` before comparing them, so a suffixed
 * fallback fails its own validation and makes every comparison collapse to
 * "failed" — a build that can never be recognised as out of date. Whether the
 * value was injected is exposed separately, through `IS_INJECTED_VERSION`,
 * rather than by corrupting the value itself.
 */

// `__APP_VERSION__` is declared ambiently in src/env.d.ts, not here: a
// `declare const` inside a module file is scoped to that module, so every
// other file that needs the same constant would have to redeclare it.

/** Must match the validator in core/updates.ts — keep the two in step. */
const SEMVER = /^\d+\.\d+\.\d+$/;

const FALLBACK_VERSION = '0.0.0';

function resolveVersion(): { value: string; injected: boolean } {
  try {
    if (typeof __APP_VERSION__ === 'string' && SEMVER.test(__APP_VERSION__.trim())) {
      return { value: __APP_VERSION__.trim(), injected: true };
    }
  } catch {
    // `__APP_VERSION__` is not defined in this runtime — fall through.
  }
  return { value: FALLBACK_VERSION, injected: false };
}

const RESOLVED = resolveVersion();

/** e.g. "4.0.0". Single source: package.json → vite define → here. */
export const APP_VERSION: string = RESOLVED.value;

/**
 * False in Vitest/jsdom and in the esbuild-bundled server, where Vite's
 * `define` substitution does not run. Consumers that must distinguish a real
 * build from a default should read this rather than parsing APP_VERSION.
 */
export const IS_INJECTED_VERSION: boolean = RESOLVED.injected;

/** e.g. "v4.0.0". The only place the "v" prefix is applied. */
export const APP_VERSION_LABEL: string = `v${APP_VERSION}`;

/** e.g. "4.0.0 · Enterprise". Used by the global status footer. */
export const APP_VERSION_FULL_LABEL: string = `${APP_VERSION} · Enterprise`;

export default APP_VERSION;