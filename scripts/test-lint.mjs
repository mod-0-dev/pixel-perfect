#!/usr/bin/env node
// Tests the linter. tests/lint-fixtures/violations.css contains one deliberate
// violation per rule; this asserts every rule still fires. A linter nobody has
// seen fail is a linter nobody can trust.

import { execFileSync } from 'node:child_process';
import stylelint from 'stylelint';

const EXPECTED = {
  'property-disallowed-list': [
    'width', 'max-width', 'min-width', 'inline-size', 'margin-top',
    'float', 'left', 'padding-left', 'border-left',
  ],
  'declaration-property-value-disallowed-list': [
    'color', 'background-color', 'box-shadow', 'padding', 'gap',
    'border-radius', 'font-size', 'transition', 'z-index', 'text-align',
    'outline', 'font-family', 'border-width',
    'max-inline-size', 'block-size', 'flex-basis',
  ],
  // Non-zero margins are value violations, not property violations (D-018):
  // `margin: 0` is how a component removes UA margin, which is the rule's aim.
  'declaration-property-value-allowed-list': ['min-inline-size', 'margin', 'margin-block-start'],
  'selector-class-pattern': ['Class names must be pp-'],
  'media-feature-name-disallowed-list': ['min-width'],
};

const result = await stylelint.lint({
  files: 'tests/lint-fixtures/violations.css',
  configFile: '.stylelintrc.json',
});

const warnings = result.results.flatMap((r) => r.warnings);
const byRule = new Map();
for (const w of warnings) {
  if (!byRule.has(w.rule)) byRule.set(w.rule, []);
  byRule.get(w.rule).push(w.text);
}

let failures = 0;
for (const [rule, subjects] of Object.entries(EXPECTED)) {
  const texts = byRule.get(rule) ?? [];
  if (texts.length === 0) {
    console.error(`✗ rule "${rule}" did not fire at all`);
    failures++;
    continue;
  }
  for (const subject of subjects) {
    const hit = texts.some((t) => t.includes(subject));
    if (!hit) {
      console.error(`✗ rule "${rule}" did not catch "${subject}"`);
      failures++;
    }
  }
}

const unexpected = [...byRule.keys()].filter((r) => !(r in EXPECTED));
for (const rule of unexpected) {
  console.error(`✗ unexpected rule fired: ${rule} — update EXPECTED in this file`);
  failures++;
}

if (failures > 0) {
  console.error(`\n${failures} linter self-test failure(s)`);
  process.exit(1);
}
// ---- the non-CSS rules ----------------------------------------------------

const EXPECTED_RULE_LINT = [
  'must be wrapped in `@layer pp.components',
  'references the raw palette token `--pp-palette-accent-9`',
  "missing the 'use client' directive",
  'declares banned prop `fullWidth`',
  'declares banned prop `maxWidth`',
  'declares banned prop `mt`',
  'declares banned prop `as`',
  '`window` is accessed at module scope',
];

const raw = execFileSync(
  process.execPath,
  ['scripts/lint-rules.mjs', '--src', 'tests/lint-fixtures/src'],
  { encoding: 'utf8' },
);
const found = JSON.parse(raw).map((p) => p.message);

for (const expected of EXPECTED_RULE_LINT) {
  if (!found.some((m) => m.includes(expected))) {
    console.error(`✗ rule lint did not catch: ${expected}`);
    failures++;
  }
}

// A browser global inside a comment, a string, a type or a function body is
// not a module-scope access and must NOT be flagged. Exactly one `window`
// access (the real one) may fire, and `document` must not fire at all.
const globalHits = found.filter((m) => m.includes('is accessed at module scope'));
if (globalHits.length !== 1 || globalHits.some((m) => m.includes('`document`'))) {
  console.error(`✗ module-scope global rule fired ${globalHits.length}× — expected exactly one, for window:\n  ${globalHits.join('\n  ')}`);
  failures++;
}

// `tone` is a legal prop name and must NOT be flagged.
if (found.some((m) => m.includes('banned prop `tone`'))) {
  console.error('✗ rule lint flagged `tone`, which is part of the approved vocabulary');
  failures++;
}

if (failures > 0) {
  console.error(`\n${failures} linter self-test failure(s)`);
  process.exit(1);
}

const total =
  Object.values(EXPECTED).reduce((n, s) => n + s.length, 0) + EXPECTED_RULE_LINT.length;
console.log(`✓ linter self-test: ${total} violations caught across ${Object.keys(EXPECTED).length} CSS rules and 5 source rules`);
