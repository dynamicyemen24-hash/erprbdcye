/**
 * NexoraOS™ — Bootstrap Readiness State
 * Tracks whether the awaited startup bootstrap (schema + migrations + seeds)
 * has completed. Readiness probes return 503 until this is marked done so no
 * traffic is served before migrations are applied.
 */

let bootstrapped = false;
let bootstrapFatal: string | null = null;
let bootstrapErrors: string[] = [];
let bootstrapAt: string | null = null;

export function markBootstrapped(errors: string[] = [], fatal: string | null = null): void {
  bootstrapErrors = errors;
  bootstrapFatal = fatal;
  bootstrapAt = new Date().toISOString();
  // Non-fatal warnings still count as ready — migrations themselves succeeded.
  bootstrapped = fatal === null;
}

export function isBootstrapped(): boolean {
  return bootstrapped;
}

export function getBootstrapFatal(): string | null {
  return bootstrapFatal;
}

export function getBootstrapErrors(): string[] {
  return [...bootstrapErrors];
}

export function getBootstrapInfo(): {
  bootstrapped: boolean;
  fatal: string | null;
  errors: string[];
  at: string | null;
} {
  return { bootstrapped, fatal: bootstrapFatal, errors: [...bootstrapErrors], at: bootstrapAt };
}
