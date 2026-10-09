#!/usr/bin/env node
// `pixel-perfect theme` — a brand accent, solved and proven (D-103).
//
//   npx pixel-perfect theme --accent "#7c3aed" --out src/brand.css
//
// Writes the library's complete palette, solved around the accent, as a
// stylesheet to import after @mod-0-dev/pixel-perfect/styles.css, and refuses to write
// one that fails any of the checks the library's own tokens pass.

import { readFileSync, writeFileSync } from 'node:fs';

import { createTheme } from './index.mjs';

const USAGE = `Usage: pixel-perfect theme --accent <colour> [--neutral <accent|hue>] [--out <file>]

  --accent   Your brand colour: #7c3aed, oklch(55% 0.2 293), or a hue angle (293).
  --neutral  Tint the greys: "accent" leans them toward your hue, a number toward that hue.
  --out      Write the stylesheet to this file instead of standard output.

Solves the library's complete palette around your accent with the library's own
generator, then checks the stylesheet with the checks its own tokens pass: text,
fills, control edges and the focus ring, in both themes. A palette that fails one
is reported and not written.

Import the file after @mod-0-dev/pixel-perfect/styles.css. Regenerate it after upgrading.`;

/** `--name value` and `--name=value`, nothing cleverer. */
function parse(argv) {
  const flags = {};
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') flags.help = true;
    else if (arg.startsWith('--')) {
      const eq = arg.indexOf('=');
      if (eq !== -1) flags[arg.slice(2, eq)] = arg.slice(eq + 1);
      else flags[arg.slice(2)] = argv[(i += 1)];
    } else rest.push(arg);
  }
  return { flags, rest };
}

function version() {
  try {
    // Two levels up from src/theme/ or dist/theme/: the package root.
    return JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')).version;
  } catch {
    return 'unknown';
  }
}

const quote = (value) => (/^[\w#.%-]+$/.test(value) ? value : `"${value}"`);

function main(argv) {
  const { flags, rest } = parse(argv);
  if (flags.help || rest[0] !== 'theme' || rest.length > 1) {
    (flags.help ? console.log : console.error)(USAGE);
    return flags.help ? 0 : 2;
  }
  if (!flags.accent) {
    console.error('pixel-perfect theme: --accent is required.\n');
    console.error(USAGE);
    return 2;
  }

  const command = [
    'npx pixel-perfect theme',
    `--accent ${quote(flags.accent)}`,
    ...(flags.neutral ? [`--neutral ${quote(flags.neutral)}`] : []),
    ...(flags.out ? [`--out ${quote(flags.out)}`] : []),
  ].join(' ');

  let theme;
  try {
    theme = createTheme({
      accent: flags.accent,
      ...(flags.neutral ? { neutral: flags.neutral === 'accent' ? 'accent' : Number(flags.neutral) } : {}),
      command: `${command}  (pixel-perfect ${version()})`,
    });
  } catch (error) {
    console.error(`✗ ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }

  const line = (name, a) =>
    `${name.padEnd(6)} fill ${a.fill.padEnd(26)} ${a.text.padEnd(5)} text  ${a.ratio.toFixed(2)}:1` +
    (Math.abs(a.landed - a.started) >= 0.001
      ? `   (moved from L ${a.started} to ${a.landed} to carry its text)`
      : '');
  console.error(`accent ${flags.accent}  →  hue ${theme.hues.accent.hue}, chroma ${theme.hues.accent.peak.toFixed(3)}`);
  console.error(line('light', theme.accent.light));
  console.error(line('dark', theme.accent.dark));

  if (theme.checks.failures.length > 0) {
    for (const failure of theme.checks.failures) console.error(failure);
    console.error(`\n✗ ${theme.checks.failures.length} of ${theme.checks.checked} assertions failed. Nothing was written.`);
    return 1;
  }
  console.error(`✓ ${theme.checks.checked} contrast and ramp assertions passed on the generated stylesheet`);

  if (flags.out) {
    writeFileSync(flags.out, theme.css);
    console.error(`wrote ${flags.out}`);
  } else {
    process.stdout.write(theme.css);
  }
  return 0;
}

process.exitCode = main(process.argv.slice(2));
