/**
 * UAMEX ERP — Update detection (client-side)
 * Checks the latest published version against the local package version.
 * The remote manifest URL should point to a JSON with a "version" field,
 * e.g. a GitHub releases API endpoint or a CDN-hosted file.
 * 
 * In production this would be called on app startup; here we expose a pure
 * function that returns a promise resolving to { hasUpdate: boolean, latest: string }.
 */

export interface UpdateCheckResult {
  hasUpdate: boolean;
  latest: string;
  current: string;
}

const CURRENT_VERSION = "4.0.0"; // read from package.json in real usage

export async function checkForUpdate(remoteManifestUrl?: string): Promise<UpdateCheckResult> {
  const current = CURRENT_VERSION;

  // If no remote URL provided, pretend we fetched from a known endpoint.
  // In a real deployment replace the fetch logic with the appropriate API.
  let remote = "";

  try {
    const url = remoteManifestUrl || "https://example.com/ua-mex/latestVersion.json";
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    remote = data.version || "";
  } catch (e) {
    console.warn("[updates] failed to fetch remote version:", e);
    remote = "";
  }

  const hasUpdate = remote && versionCompare(remote, current) > 0;
  return {
    hasUpdate,
    latest: remote || current,
    current,
  };
}

// Simple semver‑like comparison (major.minor.patch). Returns -1, 0, 1.
function versionCompare(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

export default checkForUpdate;