import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

/**
 * Some environments (CI images, dev containers) ship a Chromium that does not
 * match the exact build this Playwright version would download. Use it when it
 * is there; fall back to Playwright's own managed browser everywhere else, so
 * nothing is pinned to a path that only exists on one machine.
 */
const SYSTEM_CHROMIUM = process.env.PP_CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';
const launchOptions = existsSync(SYSTEM_CHROMIUM)
  ? { executablePath: SYSTEM_CHROMIUM }
  : {};

/**
 * Visual regression against the playground's production build.
 *
 * Screenshots are inherently platform-specific — font rasterisation differs
 * between Linux, macOS and Windows. Baselines here are generated on Linux and
 * CI runs on Linux, so they match. A developer on macOS will see diffs; that is
 * expected, and the answer is to trust CI rather than to regenerate baselines
 * locally.
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
    command: 'npm run build:css && npm run --workspace playground build && npm run --workspace playground start',
    url: 'http://127.0.0.1:4000',
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
