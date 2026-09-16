import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : 1,
  reporter: isCI
    ? [['list'], ['junit', { outputFile: 'test-results/e2e-junit.xml' }]]
    : [['html', { open: 'never' }], ['list']],
  use: {
    baseURL,
    trace: isCI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: isCI ? 'retain-on-failure' : 'off',
    locale: 'ar-SA',
    timezoneId: 'Asia/Riyadh',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile viewports for responsive testing
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: isCI
    ? {
        command: 'node dist/server.cjs',
        port: 3000,
        reuseExistingServer: false,
        timeout: 180000,
        env: { NODE_ENV: 'production', PORT: '3000' },
      }
    : {
        command: 'npm run dev',
        port: 3000,
        reuseExistingServer: true,
        timeout: 180000,
      },
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
  },
});