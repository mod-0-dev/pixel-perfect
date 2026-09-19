import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

/**
 * Some environments (CI images, dev containers) ship a Chromium that does not
 * match the exact build this Playwright version would download. Use it when it
 * is there; fall back to Playwright's own managed browser everywhere else, so
 * nothing is pinned to a path that only exists on one machine.
 */
const SYSTEM_CHROMIUM = process.env.PP_CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';

/*
 * Pinning the webfont was necessary but not sufficient: CI still rendered the
 * page 2px taller. Glyph rasterisation depends on the host's freetype and
 * fontconfig, and hinting nudges each line box by a fraction that accumulates
 * down a long page.
 *
 * These flags take the platform out of it — metrics come from the font's own
 * tables rather than from hinted, subpixel-positioned rasterisation. Text is
 * marginally less crisp in screenshots, which costs nothing, because nobody
 * reads the baselines.
 */
const DETERMINISTIC_RENDERING = [
  '--font-render-hinting=none',
  '--disable-font-subpixel-positioning',
  '--disable-lcd-text',
  '--force-color-profile=srgb',
  '--disable-skia-runtime-opts',
];

const launchOptions = {
  args: DETERMINISTIC_RENDERING,
  ...(existsSync(SYSTEM_CHROMIUM) ? { executablePath: SYSTEM_CHROMIUM } : {}),
};

/**
 * Visual regression against the playground's production build.
 *
 * BASELINES ARE AUTHORED BY CI. Never run `test:visual:update` locally and
 * commit the result — a screenshot depends on the exact Chromium build, and
 * your machine almost certainly has a different one than the runner image.
 * To rebaseline a page, delete ITS baseline — not the whole directory — and
 * push to a PR branch; CI authors the missing file and commits it (D-013,
 * D-017). Only a PR branch: `main` is protected, so an authoring push there
 * is rejected and the job fails naming the file instead (D-042). The authoring
 * commit triggers no run of its own, so push once more afterwards to have the
 * new baseline actually compared.
 *
 * Two variables are pinned here rather than left to the host, because both
 * were caught producing cross-machine diffs:
 *   - the playground loads its fonts from npm instead of the system stack
 *   - Chromium renders with hinting and subpixel positioning disabled
 * Those got the pixel delta down but could not close it; the browser build
 * itself was the remainder, and that is not something a config can fix.
 *
 * `harness.spec.ts` is NOT affected by any of this — it asserts behaviour
 * rather than pixels, and runs identically everywhere.
 */
export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',

  expect: {
    toHaveScreenshot: {
      // Antialiasing noise is not a regression. A real visual change moves far
      // more than this.
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
      // The default 5s covers both settling AND comparison. A 12,000px page
      // can spend all of it settling and never reach the comparison, which
      // reports as "failed to take two consecutive stable screenshots" — an
      // outcome indistinguishable from a page that genuinely never settles.
      // Raising the budget separates the two: a page that converges is now
      // compared, and one that does not still fails. This is how long we wait,
      // not what we accept — maxDiffPixelRatio above is unchanged. See D-026.
      timeout: 20_000,
    },
  },

  use: {
    baseURL: 'http://127.0.0.1:4000',
    trace: 'on-first-retry',
    // Pin everything that would otherwise vary between machines.
    colorScheme: 'light',
    reducedMotion: 'reduce',
    timezoneId: 'UTC',
    locale: 'en-US',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 },
        channel: undefined,
        launchOptions,
      },
    },
  ],

  webServer: {
    command: 'npm run build && npm --prefix playground run build && npm --prefix playground run start',
    url: 'http://127.0.0.1:4000',
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
