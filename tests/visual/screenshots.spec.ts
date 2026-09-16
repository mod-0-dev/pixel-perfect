import { expect, test } from '@playwright/test';

/**
 * Fonts are pinned in the playground, but they still load asynchronously.
 * Screenshotting before they settle produces a baseline of the fallback font.
 */
async function ready(page: import('@playwright/test').Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
}

test.describe('visual baselines', () => {
  test('tokens', async ({ page }) => {
    await ready(page, '/tokens');
    await expect(page).toHaveScreenshot('tokens.png', { fullPage: true });
  });

  test('harness', async ({ page }) => {
    await ready(page, '/harness');
    await expect(page).toHaveScreenshot('harness.png', { fullPage: true });
  });
});
