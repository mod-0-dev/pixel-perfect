#!/usr/bin/env node
/*
 * Records baseline geometry into tests/visual/__screenshots__/dimensions.json,
 * which `tests/unit/screenshot-dimensions.test.ts` checks re-authored baselines
 * against (D-050 §5).
 *
 * WHY THIS EXISTS. That guard's comment says to "regenerate the manifest
 * deliberately, the same way a baseline is re-authored deliberately" — and
 * there was nothing to regenerate it WITH, so it was hand-edited JSON and then
 * not edited at all. `number-input.png` and `slider.png` shipped unrecorded
 * with Tier 3D; `alert.png` made three, and the guard's own "an unrecorded page
 * is unguarded, and the count going up silently is how a guard stops guarding"
 * assertion fired at exactly the limit it was given. It was right, and it was
 * the only thing that noticed.
 *
 * DEFAULT: ADD MISSING ENTRIES ONLY. Overwriting an existing entry is how the
 * guard would be made to bless the drift it exists to catch, so it is not the
 * default. Pass `--all` to re-record everything, which is the D-050 §5 move and
 * belongs immediately BEFORE a deliberate re-baseline, never after one.
 *
 * Read the PNG header directly — width and height are the two big-endian
 * uint32s at byte 16, in the IHDR chunk, which is always first — so this needs
 * no image library, exactly as the test that consumes it does.
 *
 * ONE CAVEAT, AND IT IS THE WHOLE POINT OF THE FILE: baselines are authored by
 * CI (D-013), so run this against COMMITTED baselines. A locally rendered PNG
 * is a different Chromium build and 2-4px shorter; recording one would write
 * this machine's geometry in as the truth.
 *
 * WHICH IS WHY CI RUNS IT (D-092): the `visual` job's authoring step records
 * what it authors in the same commit, so the manifest holds the runner's
 * geometry from the first commit a baseline exists in, and an authoring
 * commit passes the guard on its own. Locally this is for the deliberate
 * moves — `--rebaseline`, `--all` — and for a baseline that somehow landed
 * unrecorded.
 */
import { readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';

import { countRegistryEntries } from './registry-count.mjs';

const DIR = 'tests/visual/__screenshots__';
const MANIFEST = `${DIR}/dimensions.json`;
const all = process.argv.includes('--all');

const recorded = JSON.parse(readFileSync(MANIFEST, 'utf8'));

/*
 * `--rebaseline <page>`: THE DELIBERATE RE-BASELINE, AS ONE COMMAND (D-066 §2).
 * Deletes the page's baselines (both themes) AND their manifest entries in
 * the same step, so that the window between deleting and re-recording is
 * one the guard skips (no file, no entry) rather than one it fails (a new
 * file against an old entry — the red run D-063 §3 accepted by design).
 * Push; CI authors the replacements and records them in the same commit
 * (D-092). The index page needs this whenever a component is added,
 * because it draws one card per registry entry.
 */
const rebaselineAt = process.argv.indexOf('--rebaseline');
if (rebaselineAt !== -1) {
  const page = process.argv[rebaselineAt + 1];
  if (!page) {
    console.error('usage: npm run dimensions -- --rebaseline <page>   (e.g. index)');
    process.exit(2);
  }
  const targets = readdirSync(DIR).filter((f) => new RegExp(`^${page}-(light|dark)\\.png$`).test(f));
  if (targets.length === 0) {
    console.error(`no baselines named ${page}-light.png / ${page}-dark.png in ${DIR}`);
    process.exit(2);
  }
  for (const file of targets) {
    unlinkSync(`${DIR}/${file}`);
    delete recorded[file];
  }
  writeFileSync(MANIFEST, `${JSON.stringify(recorded, null, 2)}\n`);
  console.log(`deleted ${targets.join(', ')} and their manifest entries.`);
  console.log('Commit and push; CI authors the replacements on the PR branch and records their geometry in the same commit.');
  process.exit(0);
}

const present = readdirSync(DIR)
  .filter((f) => f.endsWith('.png'))
  .sort();

const added = [];
const changed = [];

/*
 * THE INDEX PAGE'S GEOMETRY DEPENDS ON HOW MANY COMPONENTS IT LISTS, so its
 * entry records the registry count it was authored with. Adding a component
 * without re-baselining the index is the one visual change no component's
 * own baseline can catch; the unit guard compares this number to the
 * registry and names the command (D-066 §2).
 */
const components = countRegistryEntries();
const isIndex = (file) => /^index-(light|dark)\.png$/.test(file);

for (const file of present) {
  const bytes = readFileSync(`${DIR}/${file}`);
  const size = { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  if (isIndex(file)) size.components = components;
  const was = recorded[file];

  if (!was) {
    recorded[file] = size;
    added.push(`${file} ${size.width}×${size.height}${isIndex(file) ? ` (${components} components)` : ''}`);
  } else if (all && (was.width !== size.width || was.height !== size.height)) {
    recorded[file] = size;
    changed.push(`${file} ${was.width}×${was.height} → ${size.width}×${size.height}`);
  } else if (isIndex(file) && was.components === undefined) {
    // A field the entry predates: adding it is adding a missing entry, not
    // re-recording one. The count is the registry's NOW, which is right only
    // when the committed baseline was authored against it — true once, at
    // the commit that introduced the field, and guarded from then on.
    recorded[file] = { ...was, components };
    added.push(`${file}: components = ${components}`);
  }
}

// Entries whose baseline is gone are dropped: a manifest that guards a file
// nobody renders any more is noise, and it hides the real count.
const stale = Object.keys(recorded).filter((f) => !present.includes(f));
for (const file of stale) delete recorded[file];

const sorted = Object.fromEntries(Object.keys(recorded).sort().map((k) => [k, recorded[k]]));
writeFileSync(MANIFEST, `${JSON.stringify(sorted, null, 2)}\n`);

console.log(`${Object.keys(sorted).length} baselines recorded in ${MANIFEST}`);
if (added.length) console.log(`  added:   ${added.join('\n           ')}`);
if (changed.length) console.log(`  RE-RECORDED (--all):\n           ${changed.join('\n           ')}`);
if (stale.length) console.log(`  dropped: ${stale.join(', ')}`);
if (!added.length && !changed.length && !stale.length) console.log('  no change');
