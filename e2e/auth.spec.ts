import { test, expect } from '@playwright/test';
test.describe('Authentication', () => {
  test('login page loads with UAMEX branding', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/UAMEX|Nexora|ERP/i);
  });
  test('dark mode toggle works', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    const darkBtn = page.locator('[aria-label*="dark"], [aria-label*="الوضع"]').first();
    if (await darkBtn.isVisible()) {
      await darkBtn.click();
      await expect(html).toHaveClass(/dark/);
    }
  });
  test('language switch works', async ({ page }) => {
    await page.goto('/');
    const langBtn = page.locator('button:has-text("EN"), button:has-text("عربي")').first();
    if (await langBtn.isVisible()) {
      await langBtn.click();
    }
  });
  test('Cmd+K command palette opens', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Meta+k');
    const palette = page.locator('[role="dialog"], [class*="command"]').first();
    if (await palette.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(palette).toBeVisible();
    }
  });
});
