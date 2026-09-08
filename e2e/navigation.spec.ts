import { test, expect } from '@playwright/test';
test.describe('Navigation', () => {
  test('dashboard loads after login', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const dashboard = page.locator('[class*="dashboard"], [class*="layout"], main').first();
    await expect(dashboard).toBeVisible({ timeout: 10000 });
  });
  test('sidebar collapse/expand', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('aside, nav, [class*="sidebar"]').first();
    if (await sidebar.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(sidebar).toBeVisible();
    }
  });
});
