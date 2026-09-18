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
  { name: 'center', path: '/components/center' },
  { name: 'split', path: '/components/split' },
  { name: 'aspect-ratio', path: '/components/aspect-ratio' },
  { name: 'scroller', path: '/components/scroller' },
  { name: 'button', path: '/components/button' },
  { name: 'link', path: '/components/link' },
  { name: 'icon-button', path: '/components/icon-button' },
  { name: 'toggle', path: '/components/toggle' },
  { name: 'button-group', path: '/components/button-group' },
  { name: 'label', path: '/components/label' },
  { name: 'field', path: '/components/field' },
];

/**
 * Fonts are pinned in the playground, but they still load asynchronously.
 * Screenshotting before they settle produces a baseline of the fallback font.
 *
 * Network idle and `fonts.ready` are not enough on their own. Nothing in either
 * waits for LAYOUT to stop moving after hydration, and `toHaveScreenshot` has
 * only a 5-second budget in which to capture two consecutive identical frames.
 * On the two tallest pages (container at ~12,100px, aspect-ratio at ~11,500px)
 * CI spent that whole budget alternating between two heights 14px and 8px
 * apart and never converged — while this container, on a different Chromium
 * build, captured six identical full-page screenshots in a row.
 *
 * So settling happens HERE, before the budget starts. This is a wait, not a
 * tolerance: `maxDiffPixelRatio` is untouched and every pixel is still
 * compared. See D-026.
 */
async function settle(page: import('@playwright/test').Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        let last = -1;
        let stable = 0;
        let frames = 0;
        const tick = () => {
          const height = document.documentElement.scrollHeight;
          if (height === last) stable += 1;
          else {
            stable = 0;
            last = height;
          }
          frames += 1;
          // Five identical frames, or give up after ~3s and let
          // toHaveScreenshot report the instability rather than hide it.
          if (stable >= 5 || frames > 180) resolve();
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
  );
}

async function ready(page: import('@playwright/test').Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await settle(page);
}

test.describe('visual baselines', () => {
  for (const { name, path } of PAGES) {
    test(name, async ({ page }) => {
      await ready(page, path);
      await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
    });
  }
});
