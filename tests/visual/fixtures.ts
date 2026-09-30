import { test as base, expect, type Page } from '@playwright/test';

/**
 * The suite's `test`: Playwright's, with one change — a navigation is not
 * over until the page has HYDRATED.
 *
 * `page.goto` resolves on `load`; React hydrates after that, on its own
 * scheduler. Locally hydration is done by `load` every time; on a loaded
 * runner nothing says it is, and a test that focuses, clicks or sets an
 * attribute in the gap acts on server HTML that React is about to take over
 * — a press on a button that has not hydrated does nothing. Closed on
 * principle (D-093 §5): the playground's root layout writes `data-hydrated`
 * on `<html>` from an effect that runs after the page's own, so that is what
 * a navigation waits for. `reload` is a navigation too — the theme
 * self-check reloads and then presses the switcher.
 */
function awaitHydration(page: Page) {
  const goto = page.goto.bind(page);
  const reload = page.reload.bind(page);
  const hydrated = () => page.locator('html[data-hydrated]').waitFor({ state: 'attached' });
  page.goto = async (url, options) => {
    const response = await goto(url, options);
    await hydrated();
    return response;
  };
  page.reload = async (options) => {
    const response = await reload(options);
    await hydrated();
    return response;
  };
}

export const test = base.extend({
  page: async ({ page }, use) => {
    awaitHydration(page);
    await use(page);
  },
});

export { expect };
