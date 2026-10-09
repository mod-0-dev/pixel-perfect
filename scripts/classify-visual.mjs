#!/usr/bin/env node
/*
 * Tells "Playwright failed only because baselines are missing" from "a test
 * failed" (D-106 §5, D-108 §3).
 *
 * THE HOLE THIS CLOSES. The `visual` job's last step failed the run when
 * Playwright failed and either a baseline differed or none was new. So a run
 * that authored baselines passed even when a harness or phone test failed in
 * it: those failures are not screenshots, write no `-diff.png`, and rode
 * along with the missing baselines. The next run reported them, but on a PR
 * whose head was its authoring commit the tick was green over a red test.
 *
 * WHAT IT READS. Playwright's JSON report, which the config writes on CI. A
 * test that ended `unexpected` counts as awaiting a baseline only if it is in
 * the screenshot suite AND every error of every attempt is Playwright's own
 * "A snapshot doesn't exist at …" — anything else is a failure, and so is
 * any error outside a test (a web server that never came up). `flaky`
 * passed on its retry, and is the run's to report, not this script's.
 *
 * Prints `functional=true|false` for $GITHUB_OUTPUT and names each failure.
 */
import { appendFileSync, existsSync, readFileSync } from 'node:fs';

export const REPORT = 'test-results/visual.json';

const MISSING = "A snapshot doesn't exist at ";
const SCREENSHOT_SUITE = 'screenshots.spec.ts';

function* testsOf(suite) {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) yield { spec, test };
  }
  for (const child of suite.suites ?? []) yield* testsOf(child);
}

/**
 * @param {any} report Playwright's JSON report
 * @returns {{ missing: string[], failed: string[] }}
 */
export function classify(report) {
  const missing = [];
  const failed = [];
  for (const error of report.errors ?? []) failed.push(`(outside any test) ${firstLine(error.message)}`);
  for (const suite of report.suites ?? []) {
    for (const { spec, test } of testsOf(suite)) {
      if (test.status !== 'unexpected') continue;
      const name = `[${test.projectName}] ${spec.file} › ${spec.title}`;
      const errors = (test.results ?? []).flatMap((r) => r.errors ?? []);
      const onlyMissing =
        spec.file?.endsWith(SCREENSHOT_SUITE) &&
        errors.length > 0 &&
        errors.every((e) => stripAnsi(e.message ?? '').includes(MISSING));
      if (onlyMissing) missing.push(name);
      else failed.push(`${name}: ${firstLine(errors[0]?.message ?? 'no error recorded')}`);
    }
  }
  return { missing, failed };
}

function stripAnsi(text) {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\u001b\[[0-9;]*m/g, '');
}

function firstLine(text = '') {
  return stripAnsi(text).split('\n').find((l) => l.trim() !== '')?.trim() ?? '';
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const path = process.argv[2] ?? REPORT;
  /* No report is no evidence: Playwright never ran, or died before writing. */
  const { missing, failed } = existsSync(path)
    ? classify(JSON.parse(readFileSync(path, 'utf8')))
    : { missing: [], failed: [`no report at ${path}`] };
  const functional = failed.length > 0;
  for (const name of missing) console.log(`awaiting a baseline: ${name}`);
  for (const line of failed) console.log(`::error::A test failed that no baseline can fix — ${line}`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `functional=${functional}\n`);
  else console.log(`functional=${functional}`);
}
