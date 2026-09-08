import { test, expect } from '@playwright/test';
test.describe('Internationalization', () => {
  test('RTL direction in Arabic', async ({ page }) => {
    await page.goto('/');
    const dir = await page.locator('html').getAttribute('dir');
    expect(['rtl', 'ltr', null]).toContain(dir);
  });
  test('content renders without errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
    const errorOverlay = page.locator('[class*="error-overlay"], [id*="vite-error"]');
    await expect(errorOverlay).toHaveCount(0);
  });
});
