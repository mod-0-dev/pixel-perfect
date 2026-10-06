import { readFileSync } from 'node:fs';

import { expect, test } from './fixtures';

/**
 * THE PLAYGROUND ON A PHONE (D-102 §5). Behaviour only — no screenshot is
 * taken here, so this project authors no baseline and needs none.
 *
 * Every assertion below was a defect before it was a test. The suite had
 * only ever opened the playground at 1280x900, so nothing looked at 390px,
 * and at 390px:
 *
 *   - four pages could not be scrolled at all: the Dialog, AlertDialog,
 *     Drawer and CommandPalette galleries opened three modals at load, each
 *     locking the page, and the only way back the page offered was Escape —
 *     a key a phone does not have;
 *   - `/tokens` pushed the whole page 285px past the right edge;
 *   - the chrome was pinned to the top at 17-29% of the screen.
 *
 * The page list is read from the playground's registry rather than written
 * out a third time, as tests/unit/playground-registry.test.ts reads it: the
 * playground is not a workspace member (D-012), so it cannot be imported.
 * Every component has two pages — its harness page and its docs page (D-104).
 */
const registry = readFileSync('playground/app/components/registry.ts', 'utf8');
const SLUGS = [...registry.matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1] as string);
const EXAMPLES = ['/examples', '/examples/settings', '/examples/sign-up', '/examples/dashboard'];
const PAGES = [
  '/',
  '/tokens',
  '/harness',
  '/theme',
  '/rules',
  ...EXAMPLES,
  ...SLUGS.map((slug) => `/components/${slug}`),
  ...SLUGS.map((slug) => `/docs/${slug}`),
];

/*
 * A real swipe, as touch events through the DevTools protocol: `page.mouse`
 * is not a finger, and a scroll set from script proves nothing about a lock,
 * which only refuses gestures. It starts at x = 8, inside the shell's 16px
 * gutter, so the finger lands on the page itself and never on a control
 * that would take the gesture for its own.
 */
async function swipeUp(page: import('@playwright/test').Page) {
  const cdp = await page.context().newCDPSession(page);
  const x = 8;
  let y = 700;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 0; i < 20; i += 1) {
    y -= 25;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

test.describe('on a phone', () => {
  test('the registry was read', () => {
    // Every test below is vacuous if the regex stops matching.
    expect(SLUGS.length).toBeGreaterThan(20);
  });

  for (const path of PAGES) {
    test(`${path} fits the screen and scrolls under a finger`, async ({ page }) => {
      await page.goto(path);

      const width = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      expect(width.scroll, 'the page scrolls sideways').toBeLessThanOrEqual(width.client);

      const tall = await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight + 100);
      if (!tall) return;

      await swipeUp(page);
      await expect
        .poll(() => page.evaluate(() => window.scrollY), { message: 'a swipe did not scroll the page' })
        .toBeGreaterThan(100);

      // Scrolled past it, the chrome has gone with the page rather than
      // staying pinned over it.
      const chrome = await page.locator('.chrome').evaluate((el) => {
        const box = el.getBoundingClientRect();
        return { bottom: box.bottom, height: box.height, scrolled: window.scrollY };
      });
      if (chrome.scrolled > chrome.height) {
        expect(chrome.bottom, 'the chrome stayed pinned to the top of a phone').toBeLessThanOrEqual(0);
      }
    });
  }
});
