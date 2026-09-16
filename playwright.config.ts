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
 * The playground pins its fonts from npm rather than using the library's system
 * stack, because "same OS" is not the same as "same fonts": a system stack
 * resolved differently between the dev container and ubuntu-latest, and the
 * full-page screenshot came out 2px taller in CI.
 *
 * Rasterisation still differs across operating systems. Baselines are Linux;
 * a developer on macOS will see small diffs and should trust CI rather than
 * regenerate baselines locally.
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
    command: 'npm run build:css && npm --prefix playground run build && npm --prefix playground run start',
    url: 'http://127.0.0.1:4000',
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
