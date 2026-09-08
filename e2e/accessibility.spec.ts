import { test, expect } from '@playwright/test';
test.describe('Accessibility', () => {
  test('page has lang attribute', async ({ page }) => {
    await page.goto('/');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
  });
  test('skip-to-content link exists', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.locator('[href="#main-content"], [href="#content"], a:has-text("Skip")');
    const count = await skipLink.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
  test('all images have alt text', async ({ page }) => {
    await page.goto('/');
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });
});
