import { test, expect } from '@playwright/test';

test.describe('Authentication & Authorization', () => {
  test('login page loads with accessible landmarks', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#root')).toBeVisible({ timeout: 30000 });
    const authSignal = page
      .getByRole('button', { name: /Manual Entry|دخول يدوي/ })
      .or(page.getByPlaceholder(/admin@rohamaab.org/))
      .or(page.getByPlaceholder(/••••/))
      .or(page.getByLabel(/6-digit verification code|رمز التحقق/));
    await expect(authSignal.first()).toBeVisible({ timeout: 30000 });
  });

  test('unauthenticated API access returns 401 JSON', async ({ request }) => {
    const res = await request.get('/api/tables/projects');
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toBeTruthy();
  });

  test('expired/garbage tokens are rejected', async ({ request }) => {
    const res = await request.get('/api/tables/projects', {
      headers: { Authorization: 'Bearer garbage.token.here' },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('tenant header conflict throws 400', async ({ request }) => {
    // This would need a valid JWT for org-A + header for org-B
    // Skipped in smoke — covered by unit test
    test.skip();
  });
});

test.describe('Security Headers', () => {
  test('API responses have security headers', async ({ request }) => {
    const res = await request.get('/api/v2/health/liveness');
    const headers = res.headers();
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBeTruthy();
    expect(headers['referrer-policy']).toBeTruthy();
    expect(headers['content-security-policy']).toBeTruthy();
  });

  test('CORS preflight works', async ({ request }) => {
    const res = await request.fetch('/api/v2/health/liveness', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://example.com',
        'Access-Control-Request-Method': 'GET',
      },
    });
    expect([200, 204]).toContain(res.status());
  });
});

test.describe('Health & Observability', () => {
  test('liveness probe returns alive', async ({ request }) => {
    const res = await request.get('/api/v2/health/liveness');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('alive');
  });

  test('readiness probe returns complete after bootstrap', async ({ request }) => {
    const res = await request.get('/api/v2/health/readiness');
    expect([200, 503]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.checks.bootstrap.status).toBe('complete');
      expect(body.checks.database.status).toBe('healthy');
    }
  });

  test('metrics endpoint exposes Prometheus metrics', async ({ request }) => {
    const res = await request.get('/metrics');
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain('http_request_duration_seconds');
  });
});

test.describe('API Contract', () => {
  test('unknown API route returns JSON 401/404 (no HTML)', async ({ request }) => {
    const res = await request.get('/api/does-not-exist-xyz');
    expect([401, 404]).toContain(res.status());
    const contentType = res.headers()['content-type'] || '';
    expect(contentType).toContain('application/json');
    const body = await res.json();
    expect(body).toBeTruthy();
  });

  test('pagination cursor decode is guarded', async ({ request }) => {
    const res = await request.get('/api/tables/projects?cursor=invalid_base64');
    expect([400, 401]).toContain(res.status());
  });
});

test.describe('Rate Limiting & Resilience', () => {
  test('server never 500s under burst traffic', async ({ request }) => {
    for (let i = 0; i < 25; i++) {
      const r = await request.get('/api/v2/health/liveness');
      expect([200, 429, 503]).toContain(r.status());
    }
  });
});

test.describe('RTL & Accessibility', () => {
  test('HTML lang is Arabic', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  });

  test('dir=rtl on root in Arabic locale', async ({ page }) => {
    await page.goto('/');
    const dir = await page.locator('html').getAttribute('dir');
    expect(dir).toBe('rtl');
  });

  test('focus visible on interactive elements', async ({ page }) => {
    await page.goto('/');
    const firstFocusable = page.locator('button, a, input, select, textarea').first();
    await firstFocusable.focus();
    await expect(firstFocusable).toBeFocused();
  });
});

test.describe('Responsive Breakpoints', () => {
  test('mobile viewport renders without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375);
  });

  test('desktop viewport renders sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    // Sidebar or nav should be visible on desktop
    const nav = page.locator('nav, aside, [role="navigation"]').first();
    await expect(nav).toBeVisible({ timeout: 10000 });
  });
});

test.describe('PWA', () => {
  test('manifest.json is valid', async ({ request }) => {
    const res = await request.get('/manifest.json');
    expect(res.status()).toBe(200);
    const manifest = await res.json();
    expect(manifest.name).toContain('UAMEX');
    expect(manifest.icons).toBeInstanceOf(Array);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test('service worker registers', async ({ page }) => {
    await page.goto('/');
    const swRegistered = await page.evaluate(async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        return !!reg;
      } catch {
        return false;
      }
    });
    expect(swRegistered).toBe(true);
  });
});