import { expect, test } from '@playwright/test';

/**
 * One full-page baseline per playground page. Component pages render every
 * variant at three container widths in both themes, so a single screenshot per
 * component covers the whole matrix.
 *
 * Keep this list in step with playground/app/components/registry.ts. The two
 * cannot share a module — the playground is not a workspace member (D-012) —
 * so a component page without a screenshot here is a Definition of Done miss.
 */
const PAGES: Array<{ name: string; path: string }> = [
  { name: 'tokens', path: '/tokens' },
  { name: 'harness', path: '/harness' },
  { name: 'text', path: '/components/text' },
  { name: 'heading', path: '/components/heading' },
  { name: 'icon', path: '/components/icon' },
  { name: 'separator', path: '/components/separator' },
  { name: 'badge', path: '/components/badge' },
  { name: 'kbd', path: '/components/kbd' },
  { name: 'code', path: '/components/code' },
  { name: 'spinner', path: '/components/spinner' },
  { name: 'skeleton', path: '/components/skeleton' },
  { name: 'avatar', path: '/components/avatar' },
  { name: 'visually-hidden', path: '/components/visually-hidden' },
  { name: 'stack', path: '/components/stack' },
  { name: 'cluster', path: '/components/cluster' },
  { name: 'grid', path: '/components/grid' },
  { name: 'container', path: '/components/container' },
];

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
  for (const { name, path } of PAGES) {
    test(name, async ({ page }) => {
      await ready(page, path);
      await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
    });
  }
});
