/**
 * UAMEX ERP™ — Update detection (client-side).
 *
 * ══════════════════════════════════════════════════════════════════════════
 * AN UPDATE CHECK IS OPTIONAL. WITHOUT A MANIFEST URL, THIS FUNCTION IS INERT.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * The previous implementation defaulted to `https://example.com/…`. That URL
 * does not exist, so the request always failed, the catch swallowed it, and
 * the caller was still handed `{ hasUpdate: false, latest: "4.0.0" }` — which
 * the banner rendered as a permanent, confident "You're up to date" strip
 * pinned over the application header, in English, on every Arabic session.
 *
 * A placeholder endpoint is not a harmless default here. It is a component
 * that asserts a fact it never verified. This version therefore:
 *
 *   1. reports `status: 'disabled'` when no manifest URL is configured,
 *   2. never invents a fallback URL,
 *   3. reports `hasUpdate: true` only on a parsed, higher remote version,
 *   4. surfaces the failure reason instead of swallowing it silently.
 *
 * Enable by providing `VITE_UPDATE_MANIFEST_URL` at build time.
 */

import { APP_VERSION } from './version';

export interface UpdateCheckResult {
  hasUpdate: boolean;
  latest: string;
  current: string;
}

/** Failure modes are typed so the banner can explain itself instead of shrugging. */
export type UpdateCheckOutcome =
  | { status: 'disabled' }
  | { status: 'up-to-date'; result: UpdateCheckResult }
  | { status: 'update-available'; result: UpdateCheckResult }
  | { status: 'failed'; reason: string };

/** Reads the build-time manifest URL. Undefined unless explicitly configured. */
export function getUpdateManifestUrl(): string | undefined {
  try {
    const url = import.meta.env?.VITE_UPDATE_MANIFEST_URL;
    return typeof url === 'string' && url.trim() !== '' ? url.trim() : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Compare `major.minor.patch` triples.
 * Returns -1 (a<b), 0 (a===b), 1 (a>b). Non-numeric segments compare as 0.
 */
export function versionCompare(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

function isValidVersion(v: unknown): v is string {
  return typeof v === 'string' && /^\d+\.\d+\.\d+$/.test(v.trim());
}

/**
 * Check for a newer published build.
 *
 * @param remoteManifestUrl Override for the manifest URL (used by tests).
 * @returns `status: 'disabled'` when no manifest is configured — the caller
 *          must render nothing in that case.
 */
export async function checkForUpdate(
  remoteManifestUrl?: string
): Promise<UpdateCheckOutcome> {
  const url = remoteManifestUrl ?? getUpdateManifestUrl();

  // No manifest configured: report honestly instead of inventing one.
  if (!url) return { status: 'disabled' };

  try {
    const resp = await fetch(url, { cache: 'no-store' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = (await resp.json()) as { version?: unknown };
    const remote = data.version;

    if (!isValidVersion(remote)) {
      return { status: 'failed', reason: 'manifest-unreadable' };
    }

    const latest = remote.trim();
    const result: UpdateCheckResult = { hasUpdate: false, latest, current: APP_VERSION };

    return versionCompare(latest, APP_VERSION) > 0
      ? { status: 'update-available', result: { ...result, hasUpdate: true } }
      : { status: 'up-to-date', result };
  } catch (e) {
    // The reason is returned rather than logged and dropped: a silent failure
    // here is exactly what made the old banner indistinguishable from truth.
    const reason = e instanceof Error ? e.message : 'request-failed';
    return { status: 'failed', reason };
  }
}

export default checkForUpdate;