/**
 * NexoraOS™ — Client-side production logger (DEBT PAID).
 *
 * Console-compatible signature (`logger.warn(...)` drops in for
 * `console.warn(...)`) with ONE production rule: verbose channels
 * (`debug`/`info`/`log`) are dev-only and silent in production builds,
 * while `warn`/`error` always report. This is what keeps ~70 infra
 * call-sites honest without spamming operator consoles in the field
 * (cf. SAP Fiori / Dynamics telemetry discipline: verbose off by default).
 *
 * Test-safe: `import.meta.env` is stubbed when unavailable (SSR/tests).
 */

type LogArgs = unknown[];

function isDev(): boolean {
  try {
    const env = (import.meta as unknown as { env?: Record<string, unknown> })?.env;
    if (env) return env.DEV === true || env.MODE === 'test' || env.MODE === 'development';
  } catch {
    /* non-Vite runtime: fall through */
  }
  try {
    return typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';
  } catch {
    return false;
  }
}

function emit(fn: (...args: LogArgs) => void, args: LogArgs): void {
  try {
    fn(...args);
  } catch {
    /* logging must never throw */
  }
}

export const logger = {
  debug(...args: LogArgs): void {
    if (isDev()) emit(console.debug.bind(console), args);
  },
  info(...args: LogArgs): void {
    if (isDev()) emit(console.info.bind(console), args);
  },
  log(...args: LogArgs): void {
    if (isDev()) emit(console.log.bind(console), args);
  },
  warn(...args: LogArgs): void {
    emit(console.warn.bind(console), args);
  },
  error(...args: LogArgs): void {
    emit(console.error.bind(console), args);
  },
};

export default logger;
