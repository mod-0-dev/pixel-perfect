import { expect, test } from '@playwright/test';

/**
 * These assertions verify the HARNESS, not a component. If overflow detection
 * is broken, every sizing-contract result the playground ever reports is
 * meaningless, so it is checked before it is trusted.
 */
test.describe('harness self-check', () => {
  test('a fill component is never flagged as overflowing', async ({ page }) => {
    await page.goto('/harness');

    const cells = page.locator('section', { hasText: 'Well-behaved' }).locator('.matrix__viewport');
    await expect(cells).toHaveCount(6); // 3 widths × 2 themes

    for (const cell of await cells.all()) {
      await expect(cell).not.toHaveAttribute('data-overflowing', /.*/);
    }
  });

  test('a component that sets its own width is caught at narrow widths', async ({ page }) => {
    await page.goto('/harness');

    const broken = page.locator('section', { hasText: 'Deliberately broken' });
    const cells = broken.locator('.matrix__viewport');
    await expect(cells).toHaveCount(6);

    // 720px content in 240px and 480px cells overflows; the 960px cell does not.
    const flagged = broken.locator('.matrix__viewport[data-overflowing]');
    await expect(flagged).toHaveCount(4); // 240 and 480 overflow; 960 does not
    await expect(broken.locator('.matrix__overflow').first()).toBeVisible();
  });

  test('both themes render distinct backgrounds side by side', async ({ page }) => {
    await page.goto('/harness');

    const bg = (theme: string) =>
      page
        .locator(`.matrix__theme[data-pp-theme="${theme}"]`)
        .first()
        .evaluate((el) => getComputedStyle(el).backgroundColor);

    // Regression guard for D-010: with themes pinned to :root these were equal.
    expect(await bg('light')).not.toBe(await bg('dark'));
  });
});
