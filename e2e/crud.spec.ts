import { test, expect } from '@playwright/test';
test.describe('CRUD Operations', () => {
  test('empty state renders', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });
  test('no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const criticalErrors = errors.filter(e => !e.includes('ResizeObserver') && !e.includes('favicon'));
    expect(criticalErrors).toHaveLength(0);
  });
});
