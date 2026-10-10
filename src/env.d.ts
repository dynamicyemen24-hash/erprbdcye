/**
 * Ambient declarations for build-time constants.
 *
 * WHY THIS FILE EXISTS
 * `vite.config.ts` injects `__APP_VERSION__` through `define`, but TypeScript
 * has no way to know that: a bare `declare const __APP_VERSION__` inside
 * `core/version.ts` compiles fine on its own and then breaks the moment another
 * module reads the same symbol, because ambient declarations in a module file
 * are scoped to that module.
 *
 * It also gives the project a typed `import.meta.env`, so an environment
 * variable that does not exist is a compile-time error rather than a silent
 * `undefined` that becomes a wrong value at runtime — the failure mode that
 * produced the placeholder update manifest in the first place.
 */

/** Injected by Vite `define` from `package.json.version` at build time. */
declare const __APP_VERSION__: string | undefined;

interface ImportMetaEnv {
  /**
   * Absolute URL of the JSON manifest used for update checks.
   * Optional by design: when it is unset the update checker is inert.
   */
  readonly VITE_UPDATE_MANIFEST_URL?: string;
  readonly VITE_CACHE_VERSION?: string;
  readonly MODE?: string;
  readonly DEV?: boolean;
  readonly PROD?: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}