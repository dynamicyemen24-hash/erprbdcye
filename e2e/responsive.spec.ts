import { test, expect } from '@playwright/test';

/**
 * Responsive layout — WCAG 1.4.10 Reflow (Level AA).
 *
 * WCAG 1.4.10 requires content to reflow to 320 CSS pixels of width without
 * two-dimensional scrolling. Asserting that `<body>` is visible proves nothing:
 * a page can be fully visible and still overflow horizontally, which is the
 * exact failure this suite was supposed to catch.
 */

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'small mobile', width: 320, height: 640 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 },
];

test.describe('Responsive Design', () => {
  for (const vp of VIEWPORTS) {
    test(`renders at ${vp.name} (${vp.width}×${vp.height}) without horizontal scroll`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('body')).toBeVisible();

      // The real assertion: the document must not exceed the viewport width.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      // A 1px tolerance absorbs sub-pixel rounding in Chromium/Firefox.
      expect(
        overflow,
        `horizontal overflow of ${overflow}px at ${vp.width}px wide (WCAG 1.4.10 Reflow)`
      ).toBeLessThanOrEqual(1);
    });
  }

  test('keeps the primary navigation reachable at every breakpoint', async ({ page }) => {
    // Reflow must not mean "controls disappear": each breakpoint exposes the
    // navigation through one of its two forms (sidebar or drawer trigger).
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const sidebar = page.locator('aside');
      const drawerTrigger = page.getByRole('button', { name: /القائمة التشغيلية|Operational Menu/i });

      const sidebarCount = await sidebar.count();
      const triggerCount = await drawerTrigger.count();

      expect(
        sidebarCount + triggerCount,
        `no navigation affordance at ${vp.width}px`
      ).toBeGreaterThan(0);
    }
  });
});
