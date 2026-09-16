/**
 * NexoraOS™ — Optional Sentry Error Reporting (zero-dependency until enabled)
 * Activates only when SENTRY_DSN is set AND @sentry/node is installed.
 * Everything else (routes, tests, dev) works unchanged without it:
 *   npm i @sentry/node   # then set SENTRY_DSN to enable
 */

import logger from '../core/logger';

let sentryModule: any = null;
let enabled = false;

export async function initSentry(): Promise<boolean> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return false;
  if (enabled) return true;
  try {
    // @ts-expect-error - @sentry/node is an optional peer dependency; present only when installed
    sentryModule = await import('@sentry/node');
    sentryModule.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      release: process.env.BUILD_ID || process.env.npm_package_version || '3.8.0',
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    });
    enabled = true;
    logger.info('[Sentry] Error reporting enabled', { context: 'observability' });
    return true;
  } catch (err: any) {
    logger.warn(
      `[Sentry] SENTRY_DSN is set but @sentry/node is not installed (${err?.message || err}) — run "npm i @sentry/node" to enable error reporting`,
      { context: 'observability' },
    );
    return false;
  }
}

export function isSentryEnabled(): boolean {
  return enabled;
}

/** Fire-and-forget — never throws, never blocks the error response. */
export function captureError(err: unknown, context?: Record<string, any>): void {
  if (!enabled || !sentryModule) return;
  try {
    sentryModule.captureException(err, context ? { extra: context } : undefined);
  } catch {
    // Reporting must never break the request path
  }
}
