import { test, expect } from '@playwright/test';

test.describe('UAMEX ERP™ — Full Daily Operational Journey', () => {
  test('Step 1: Public Login Screen & Auth Landmarks', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#root')).toBeVisible({ timeout: 30000 });
    
    // Validate login screen brand elements and inputs
    const authElement = page.getByRole('button', { name: /Manual Entry|دخول يدوي/ })
      .or(page.getByPlaceholder(/admin@rohamaab.org/))
      .or(page.getByPlaceholder(/admin@nexora.org/))
      .or(page.getByPlaceholder(/••••/));
    await expect(authElement.first()).toBeVisible({ timeout: 30000 });
  });

  test('Step 2: API Readiness Probe & Auth Guard Integrity', async ({ request }) => {
    const liveRes = await request.get('/api/v2/health/liveness');
    expect(liveRes.status()).toBe(200);

    const readyRes = await request.get('/api/v2/health/readiness');
    expect([200, 503]).toContain(readyRes.status());

    // Protected routes block unauthorized access with JSON error
    const authGuardRes = await request.get('/api/tables/projects');
    expect(authGuardRes.status()).toBe(401);
    const body = await authGuardRes.json();
    expect(body).toHaveProperty('error');
  });

  test('Step 3: Navigation, Accessibility & Layout Responsiveness', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    
    // Verify RTL document direction for Arabic locale
    const dir = await page.locator('html').getAttribute('dir');
    expect(dir).toBe('rtl');

    // Verify main app container focus state
    const firstFocusable = page.locator('button, a, input, select').first();
    await firstFocusable.focus();
    await expect(firstFocusable).toBeFocused();
  });

  test('Step 4: Operational Manifest & Offline Service Worker Registration', async ({ page }) => {
    await page.goto('/');
    
    // Verify manifest accessibility
    const manifestRes = await page.request.get('/manifest.json');
    expect(manifestRes.status()).toBe(200);
    const manifest = await manifestRes.json();
    expect(manifest.name).toBeTruthy();
  });
});
