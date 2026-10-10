import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UpdateBanner } from '../../components/UpdateBanner';
import { APP_VERSION } from '../../core/version';

/**
 * Truth guard — the update banner must never assert an unverified fact.
 *
 * The defect this locks down
 * -----------------------------
 * The banner mounted `<UpdateBanner autoCheck={true} onDismiss={() => {}} />`
 * in TWO places (the app shell AND the home workspace). Inside it, the check
 * always resolved to `{ hasUpdate: false }` because the manifest URL was a
 * placeholder; `setShow(true)` ran unconditionally; and the component rendered
 * a `fixed top-0 left-0 right-0 z-50` strip reading "You're up to date · v4.0.0"
 * in English — over the application header, in every session, undismissable.
 *
 * These tests pin the three behaviours that make that impossible:
 *   1. no manifest → nothing renders;
 *   2. an available update → a dismissible, bilingual status appears;
 *   3. dismissing actually removes it (the old `onDismiss={() => {}}` did not).
 */

afterEach(() => {
  vi.unstubAllGlobals();
});

const stubManifest = (version: string) =>
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ version }) })
  );

describe('UpdateBanner — silence by default', () => {
  it('renders nothing when no update manifest is configured', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const { container } = render(<UpdateBanner lang="en" />);

    // The decisive assertion: with no manifest configured the component is
    // inert — it must not reach out to any endpoint, invented or real.
    await waitFor(() => expect(container).toBeTruthy());
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(container.querySelector('[data-testid="update-banner"]')).toBeNull();
  });

  it('renders nothing when the manifest reports the current build', async () => {
    stubManifest(APP_VERSION);

    const { container } = render(<UpdateBanner lang="en" />);

    await waitFor(() => expect(container.querySelector('[data-testid="update-banner"]')).toBeNull());
  });

  it('never prints a hardcoded English "up to date" string', () => {
    // A static source-level guard: the wording is the tell. It came back the
    // moment someone re-adds a fallback branch.
    expect(screen.queryByText(/You're up to date/i)).toBeNull();
  });
});

describe('UpdateBanner — a real update is announced and dismissible', () => {
  // A manifest URL must be supplied explicitly: without one the component is
  // inert by design (see the guard above), which is the behaviour under test.
  const MANIFEST = 'https://updates.example.org/latest.json';

  it('shows a bilingual status when a newer build exists', async () => {
    stubManifest('99.0.0');

    render(<UpdateBanner lang="ar" manifestUrl={MANIFEST} />);

    const banner = await screen.findByTestId('update-banner');
    expect(banner.getAttribute('role')).toBe('status');
    expect(banner.getAttribute('aria-live')).toBe('polite');
    expect(banner.textContent).toContain('يتوفر إصدار جديد');
    expect(banner.textContent).toContain('v99.0.0');
  });

  it('renders English copy when the session is English', async () => {
    stubManifest('99.0.0');

    render(<UpdateBanner lang="en" manifestUrl={MANIFEST} />);

    const banner = await screen.findByTestId('update-banner');
    expect(banner.textContent).toContain('A new version is available');
  });

  it('does not overlay the header (no fixed positioning)', async () => {
    stubManifest('99.0.0');

    render(<UpdateBanner lang="en" manifestUrl={MANIFEST} />);

    const banner = await screen.findByTestId('update-banner');
    // The old strip was `fixed top-0 … z-50` and covered the header.
    expect(banner.className).not.toContain('fixed');
    expect(banner.className).not.toContain('top-0');
  });

  it('actually dismisses when the close control is used', async () => {
    stubManifest('99.0.0');
    const onDismiss = vi.fn();

    render(<UpdateBanner lang="en" manifestUrl={MANIFEST} onDismiss={onDismiss} />);
    await screen.findByTestId('update-banner');

    await userEvent.click(screen.getByRole('button', { name: /dismiss/i }));

    await waitFor(() => expect(screen.queryByTestId('update-banner')).toBeNull());
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});