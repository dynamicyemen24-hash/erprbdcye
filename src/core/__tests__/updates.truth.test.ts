import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  checkForUpdate,
  versionCompare,
  getUpdateManifestUrl,
} from '../updates';
import { APP_VERSION, APP_VERSION_LABEL } from '../version';

/**
 * Trust guard — PHASE 0 "Truth Repair".
 *
 * WHAT THIS PREVENTS
 * `checkForUpdate` used to default to `https://example.com/ua-mex/latestVersion.json`.
 * That host does not exist, so the request always failed; the `catch` swallowed
 * it; and the caller received `{ hasUpdate: false, latest: "4.0.0" }`, which the
 * banner rendered as a permanent "You're up to date" strip pinned over the app
 * header. A component that asserts a fact it never verified is a correctness
 * defect, not a cosmetic one — so the inert-by-default behaviour is now a test.
 *
 * The inverse is guarded too: a real manifest reporting a NEWER version must
 * still produce an update, or "silence everything" would become its own lie.
 */

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('update detection — inert by default', () => {
  it('reports "disabled" and performs NO request when no manifest is configured', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const outcome = await checkForUpdate(undefined);

    expect(outcome.status).toBe('disabled');
    // The decisive assertion: no invented endpoint is ever contacted.
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('never falls back to a placeholder host', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ version: '9.9.9' }) });
    vi.stubGlobal('fetch', fetchSpy);

    await checkForUpdate(undefined);

    const calledUrls = fetchSpy.mock.calls.map((c) => String(c[0]));
    expect(calledUrls.some((u) => u.includes('example.com'))).toBe(false);
  });

  it('reports no manifest URL when the build variable is unset', () => {
    expect(getUpdateManifestUrl()).toBeUndefined();
  });
});

describe('update detection — honest outcomes', () => {
  it('reports update-available for a genuinely newer remote version', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ version: '99.0.0' }),
      })
    );

    const outcome = await checkForUpdate('https://updates.example.org/latest.json');

    expect(outcome.status).toBe('update-available');
    if (outcome.status === 'update-available') {
      expect(outcome.result.hasUpdate).toBe(true);
      expect(outcome.result.latest).toBe('99.0.0');
      expect(outcome.result.current).toBe(APP_VERSION);
    }
  });

  it('reports up-to-date when the remote equals the local build', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ version: APP_VERSION }),
      })
    );

    const outcome = await checkForUpdate('https://updates.example.org/latest.json');
    expect(outcome.status).toBe('up-to-date');
  });

  it('reports up-to-date when the remote is OLDER', async () => {
    // "Older" is expressed relative to the build actually in use. Under Vitest
    // the define-injected version is absent, so APP_VERSION falls back to
    // 0.0.0 and nothing can be older — in that case the honest assertion is
    // simply that no update is advertised.
    const older =
      APP_VERSION === '0.0.0' ? null : `${Number(APP_VERSION.split('.')[0]) - 1}.0.0`;

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ version: older ?? APP_VERSION }),
      })
    );

    const outcome = await checkForUpdate('https://updates.example.org/latest.json');
    expect(outcome.status).toBe('up-to-date');
    if ('result' in outcome) expect(outcome.result.hasUpdate).toBe(false);
  });

  it('surfaces a failure reason instead of pretending success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) })
    );

    const outcome = await checkForUpdate('https://updates.example.org/latest.json');
    expect(outcome.status).toBe('failed');
  });

  it('rejects a malformed version rather than comparing garbage', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ version: 'latest' }),
      })
    );

    const outcome = await checkForUpdate('https://updates.example.org/latest.json');
    expect(outcome.status).toBe('failed');
    if (outcome.status === 'failed') expect(outcome.reason).toBe('manifest-unreadable');
  });
});

describe('versionCompare', () => {
  it('orders major, minor and patch components', () => {
    expect(versionCompare('2.0.0', '1.9.9')).toBe(1);
    expect(versionCompare('1.9.9', '2.0.0')).toBe(-1);
    expect(versionCompare('1.2.3', '1.2.3')).toBe(0);
    expect(versionCompare('1.2.10', '1.2.9')).toBe(1);
    expect(versionCompare('1.10.0', '1.9.0')).toBe(1);
  });
});

describe('single version source', () => {
  it('applies the "v" prefix in exactly one place', () => {
    expect(APP_VERSION_LABEL).toBe(`v${APP_VERSION}`);
  });

  it('exposes a non-empty version string', () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});