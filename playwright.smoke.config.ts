import { defineConfig } from '@playwright/test';

/**
 * Release-certification smoke config: drives the LOCALLY INSTALLED Chrome
 * (channel: 'chrome') so no browser download is required. Boots the real
 * dev server (full bootstrap + migrations) before running.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: /smoke\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'ar-SA',
    timezoneId: 'Asia/Riyadh',
  },
  projects: [{ name: 'chrome-system', use: { channel: 'chrome' } }],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
    timeout: 420000,
    env: {
      ...process.env,
      PORT: '3000',
    } as Record<string, string>,
  },
});
