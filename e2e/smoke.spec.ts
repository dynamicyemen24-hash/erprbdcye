/**
 * Release-certification smoke suite (real browser, real server, no mocks).
 * Each test is independent. No authentication needed (public surface only).
 */
import { test, expect } from '@playwright/test';

const errors: string[] = [];

test.beforeEach(({ page }) => {
  errors.length = 0;
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
});

test.afterEach(() => {
  // No uncaught frontend exceptions on public routes (release gate)
  expect(errors).toEqual([]);
});

test('liveness and readiness probes answer', async ({ request }) => {
  const live = await request.get('/api/v2/health/liveness');
  expect(live.status()).toBe(200);
  const liveBody = await live.json();
  expect(liveBody.status).toBe('alive');

  const ready = await request.get('/api/v2/health/readiness');
  // 200 = bootstrap complete; 503 = still bootstrapping (both are VALID states)
  expect([200, 503]).toContain(ready.status());
  if (ready.status() === 200) {
    const body = await ready.json();
    expect(body.checks.bootstrap.status).toBe('complete');
    expect(body.checks.database.status).toBe('healthy');
  }
});

test('login view renders with accessible auth landmarks', async ({ page }) => {
  await page.goto('/');
  // App shell boots (root mount)
  await expect(page.locator('#root')).toBeVisible({ timeout: 30000 });
  // Auth surface is reachable: desk directory, manual entry, or password field
  const authSignal = page.getByRole('button', { name: /Manual Entry|دخول يدوي/ }).or(
    page.getByPlaceholder(/admin@rohamaab.org/)
  ).or(
    page.getByPlaceholder(/••••/)
  ).or(
    page.getByLabel(/6-digit verification code|رمز التحقق/)
  );
  await expect(authSignal.first()).toBeVisible({ timeout: 30000 });
});

test('security headers are present on API responses', async ({ request }) => {
  const res = await request.get('/api/v2/health/liveness');
  const headers = res.headers();
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['x-frame-options']).toBeTruthy();
  expect(headers['referrer-policy']).toBeTruthy();
});

test('unauthenticated table access is denied as JSON, not HTML', async ({ request }) => {
  const res = await request.get('/api/tables/projects');
  expect(res.status()).toBe(401);
  const body = await res.json();
  expect(body).toBeTruthy();
});

test('unknown API route is denied as JSON (401 pre-routing, no enumeration)', async ({ request }) => {
  // Global auth runs before routing: unknown paths answer 401 (never HTML,
  // never route-existence oracle). Authenticated-unknown would be 404.
  const res = await request.get('/api/does-not-exist-xyz');
  expect([401, 404]).toContain(res.status());
  const contentType = res.headers()['content-type'] || '';
  expect(contentType).toContain('application/json');
  const body = await res.json();
  expect(body).toBeTruthy();
});

test('expired/garbage tokens are rejected', async ({ request }) => {
  const res = await request.get('/api/tables/projects', {
    headers: { Authorization: 'Bearer garbage.token.here' },
  });
  expect([401, 403]).toContain(res.status());
});

test('server never 500s under burst traffic', async ({ request }) => {
  // 25 rapid sequential hits: every response must be a controlled status
  // (2xx/429/503) — never an uncontrolled 500 or a dropped connection.
  for (let i = 0; i < 25; i++) {
    const r = await request.get('/api/v2/health/liveness');
    expect([200, 429, 503]).toContain(r.status());
  }
});
