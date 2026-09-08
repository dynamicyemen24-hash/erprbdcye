import { test as setup, expect } from '@playwright/test';
const authFile = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"], input[placeholder*="بريد"]').first();
  if (await emailInput.isVisible()) {
    await emailInput.fill('admin@nexora.local');
    const passInput = page.locator('input[type="password"]').first();
    await passInput.fill('Admin@123456');
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    await page.waitForURL('**/');
    await page.context().storageState({ path: authFile });
  }
});
