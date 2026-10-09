import { describe, expect, it } from 'vitest';

import { classify } from '../../scripts/classify-visual.mjs';

/* The shape of Playwright's JSON report, cut to what the classifier reads. */
const test = (file: string, title: string, status: string, messages: string[][]) => ({
  file,
  title,
  tests: [
    {
      projectName: file.startsWith('phone') ? 'phone' : 'chromium',
      status,
      results: messages.map((errors) => ({ errors: errors.map((message) => ({ message })) })),
    },
  ],
});

const report = (specs: ReturnType<typeof test>[], errors: { message: string }[] = []) => ({
  suites: [{ title: 'root', suites: [{ title: 'describe', specs }] }],
  errors,
});

const MISSING = "Error: A snapshot doesn't exist at /repo/tests/visual/__screenshots__/kbd-light.png, writing actual.";

describe('classify-visual (D-108 §3)', () => {
  it('counts a screenshot test that failed only for a missing baseline as awaiting one', () => {
    const { missing, failed } = classify(
      report([test('screenshots.spec.ts', 'kbd (light)', 'unexpected', [[MISSING], [MISSING]])]),
    );
    expect(missing).toEqual(['[chromium] screenshots.spec.ts › kbd (light)']);
    expect(failed).toEqual([]);
  });

  it('counts a harness or phone failure as a failure even in a run that authors baselines — the hole D-106 §5 found', () => {
    const { missing, failed } = classify(
      report([
        test('screenshots.spec.ts', 'kbd (light)', 'unexpected', [[MISSING]]),
        test('harness.spec.ts', 'Toolbar › walks', 'unexpected', [['Error: expect(locator).toBeFocused() failed\n\nmore']]),
        test('phone.spec.ts', 'fits', 'unexpected', [['\u001b[31mError: overflow\u001b[39m']]),
      ]),
    );
    expect(missing).toHaveLength(1);
    expect(failed).toEqual([
      '[chromium] harness.spec.ts › Toolbar › walks: Error: expect(locator).toBeFocused() failed',
      '[phone] phone.spec.ts › fits: Error: overflow',
    ]);
  });

  it('counts a screenshot test with any other error — a mismatch, a timeout — as a failure', () => {
    const { failed } = classify(
      report([
        test('screenshots.spec.ts', 'link (dark)', 'unexpected', [[MISSING], ['Error: Screenshot comparison failed']]),
        test('screenshots.spec.ts', 'tree (dark)', 'unexpected', [[]]),
      ]),
    );
    expect(failed).toHaveLength(2);
  });

  it('ignores what passed, what passed on its retry and what was skipped; an error outside any test is a failure', () => {
    const { missing, failed } = classify(
      report(
        [
          test('harness.spec.ts', 'a', 'expected', [[]]),
          test('harness.spec.ts', 'b', 'flaky', [['Error: once'], []]),
          test('harness.spec.ts', 'c', 'skipped', []),
        ],
        [{ message: 'Error: Timed out waiting 300000ms from config.webServer.' }],
      ),
    );
    expect(missing).toEqual([]);
    expect(failed).toEqual(['(outside any test) Error: Timed out waiting 300000ms from config.webServer.']);
  });
});
