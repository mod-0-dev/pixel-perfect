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
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const DIR = 'tests/visual/__screenshots__';
const MANIFEST = `${DIR}/dimensions.json`;
const all = process.argv.includes('--all');

const recorded = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const present = readdirSync(DIR)
  .filter((f) => f.endsWith('.png'))
  .sort();

const added = [];
const changed = [];

for (const file of present) {
  const bytes = readFileSync(`${DIR}/${file}`);
  const size = { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  const was = recorded[file];

  if (!was) {
    recorded[file] = size;
    added.push(`${file} ${size.width}×${size.height}`);
  } else if (all && (was.width !== size.width || was.height !== size.height)) {
    recorded[file] = size;
    changed.push(`${file} ${was.width}×${was.height} → ${size.width}×${size.height}`);
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
