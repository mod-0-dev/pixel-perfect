import { expect, test } from '@playwright/test';

test.describe('visual baselines', () => {
  test('tokens', async ({ page }) => {
    await page.goto('/tokens');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('tokens.png', { fullPage: true });
  });

  test('harness', async ({ page }) => {
    await page.goto('/harness');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('harness.png', { fullPage: true });
  });
});
