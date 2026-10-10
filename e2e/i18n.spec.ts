import { test, expect } from '@playwright/test';

/**
 * Internationalization — ISO 9241-176 / WCAG 3.1.1.
 *
 * The previous version accepted `['rtl', 'ltr', null]` — i.e. it passed when
 * the document declared no direction at all. A missing direction in an Arabic
 * ERP inverts the entire layout, so "no value" is not an acceptable outcome; it
 * is the exact defect the test existed to catch.
 */
test.describe('Internationalization', () => {
  test('declares a real text direction matching the content language', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    const lang = await html.getAttribute('lang');
    const dir = await html.getAttribute('dir');

    // Not null, not empty — the assertion the old suite skipped past.
    expect(dir, 'html[dir] must be declared').toBeTruthy();
    expect(['rtl', 'ltr']).toContain(dir);

    expect(lang, 'html[lang] must be declared').toBeTruthy();
    expect(['ar', 'en']).toContain(lang);

    // Arabic content ⇒ RTL direction. This is the part that used to pass
    // unconditionally.
    if (lang === 'ar') {
      expect(dir, 'Arabic sessions must render right-to-left').toBe('rtl');
    } else {
      expect(dir, 'English sessions must render left-to-right').toBe('ltr');
    }
  });

  test('renders without a build or runtime error overlay', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('[class*="error-overlay"], [id*="vite-error"]')).toHaveCount(0);
  });

  test('sets the text-direction CSS property consistently with the attribute', async ({ page }) => {
    await page.goto('/');
    const dir = await page.locator('html').getAttribute('dir');

    // The attribute and the computed style must agree; a mismatch is what makes
    // an RTL page render with LTR punctuation and mirrored arrows.
    const computed = await page.evaluate(() => getComputedStyle(document.documentElement).direction);
    expect(computed).toBe(dir);
  });

  test('does not ship untranslated English chrome into the Arabic shell', async ({ page }) => {
    await page.goto('/');
    const lang = await page.locator('html').getAttribute('lang');
    if (lang !== 'ar') return;

    // The update banner used to render a fixed English strip over the header
    // ("You're up to date · v4.0.0"). Its absence is now asserted rather than
    // assumed.
    await expect(page.getByText(/You're up to date/i)).toHaveCount(0);
  });
});
