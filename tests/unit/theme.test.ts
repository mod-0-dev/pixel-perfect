import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { checkPalette, parsePalette } from '../../src/theme/check.mjs';
import { parseColor } from '../../src/theme/color.mjs';
import { createTheme, LIBRARY_ACCENT } from '../../src/theme/index.mjs';
import { paletteDeclarations, solvePalette } from '../../src/theme/palette.mjs';

/**
 * pixel-perfect/theme (D-103): a consumer's accent goes through the solver
 * the library's own palette comes from, and the stylesheet it writes is held
 * to the checks `npm run lint:contrast` holds primitives.css to.
 *
 * The two halves are tested apart on purpose (D-008): the solver against the
 * committed file it writes, the checker against text it must reject.
 */

const primitives = readFileSync('src/styles/tokens/primitives.css', 'utf8');
const declarations = (css: string) => css.match(/--pp-palette-[a-z]+-[a-z0-9-]+: oklch\([^)]*\);/g) ?? [];

describe('the palette solver', () => {
  it('is the source of the committed palette: its output for the library hues is in primitives.css', () => {
    // CI's token-freshness step proves the whole file; this proves the module
    // a consumer's theme goes through is the one that wrote it.
    expect(primitives).toContain(paletteDeclarations(solvePalette('light').ramps, '    '));
    expect(primitives).toContain(paletteDeclarations(solvePalette('dark').ramps, '      '));
  });
});

describe('the contrast checks, run on CSS text', () => {
  it('pass on the committed primitives', () => {
    const { checked, failures } = checkPalette(parsePalette(primitives));
    expect(failures).toEqual([]);
    // 2 themes x 5 hues x (19 pairings + 7 ramp steps), plus the shipped ring
    // on 3 surfaces of 5 hues in 2 themes. The semantic mappings are the
    // script's, not the module's.
    expect(checked).toBe(2 * 5 * (19 + 7) + 2 * 5 * 3);
  });

  it('fail by name when muted text is re-pointed at a pale value', () => {
    const broken = primitives.replace(/(--pp-palette-accent-11: )oklch\([^)]*\)/, '$1oklch(90% 0.02 258)');
    expect(broken).not.toBe(primitives);
    const { failures } = checkPalette(parsePalette(broken));
    expect(failures.some((f) => f.includes('light/accent') && f.includes('muted text'))).toBe(true);
  });

  it('fail the shipped ring on another hue’s surface, which no per-hue check can see', () => {
    // A pale accent ring: accent's own checks fail too, but the message that
    // matters names danger's surface.
    const broken = primitives.replace(/(--pp-palette-accent-focus: )oklch\([^)]*\)/, '$1oklch(85% 0.05 258)');
    const { failures } = checkPalette(parsePalette(broken));
    expect(failures.some((f) => f.includes('the shipped ring (accent focus) vs danger'))).toBe(true);
  });
});

describe('createTheme', () => {
  it('reproduces the library palette, declaration for declaration, from the library accent', () => {
    const { css, checks } = createTheme({ accent: LIBRARY_ACCENT });
    const decls = declarations(css);
    expect(decls).toHaveLength(4 * 5 * 17);
    expect(decls.filter((d) => !primitives.includes(d))).toEqual([]);
    expect(checks.failures).toEqual([]);
  });

  it('writes every scope inside pp.overrides, after the library’s layer order', () => {
    const { css } = createTheme({ accent: '#7c3aed' });
    const body = css.slice(css.indexOf('*/') + 2).trimStart();
    expect(body.startsWith('@layer pp.reset, pp.tokens, pp.base, pp.components, pp.overrides;')).toBe(true);
    expect(body).toContain('@layer pp.overrides {');
    for (const scope of [':root {', '[data-pp-theme="light"] {', ':root:not([data-pp-theme]) {', '[data-pp-theme="dark"] {']) {
      expect(body).toContain(scope);
    }
    // The dark block comes after :root, so an element carrying both is dark.
    expect(body.indexOf('[data-pp-theme="dark"] {')).toBeGreaterThan(body.indexOf(':root {'));
  });

  it('solves and passes every check around the hue wheel, light to dark, muted to vivid', () => {
    for (let hue = 0; hue < 360; hue += 15) {
      for (const [L, C] of [
        [0.35, 0.12],
        [0.55, 0.2],
        [0.75, 0.15],
        [0.9, 0.1],
      ] as const) {
        const theme = createTheme({ accent: `oklch(${L * 100}% ${C} ${hue})` });
        expect(theme.checks.failures, `oklch(${L * 100}% ${C} ${hue})`).toEqual([]);
      }
    }
  });

  it('keeps the light fill at the brand colour when that colour can carry white text', () => {
    const { accent } = createTheme({ accent: '#7c3aed' });
    expect(accent.light.text).toBe('white');
    expect(accent.light.landed).toBe(accent.light.started);
    expect(accent.light.ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('moves the fill, and says how far, when the colour cannot carry its text', () => {
    // Green 600 carries white text at 3.3:1; the solver gives it dark text
    // and lightens the fill until that and its pressed state read.
    const { accent, checks } = createTheme({ accent: '#16a34a' });
    expect(accent.light.text).toBe('dark');
    expect(accent.light.landed).toBeGreaterThan(accent.light.started);
    expect(checks.failures).toEqual([]);
  });

  it('leans the greys toward the accent when asked, and only then', () => {
    expect(createTheme({ accent: '#7c3aed' }).hues.neutral.hue).toBe(258);
    expect(createTheme({ accent: '#7c3aed', neutral: 'accent' }).hues.neutral.hue).toBe(293);
    expect(createTheme({ accent: '#7c3aed', neutral: 120 }).hues.neutral.hue).toBe(120);
  });

  it('refuses what is not a colour, naming the forms it reads', () => {
    expect(() => createTheme({ accent: 'teal-ish' })).toThrow(/Not a colour/);
  });
});

describe('parseColor', () => {
  it('reads hex, short hex, oklch() in both spellings, and a bare hue', () => {
    expect(parseColor('#ff0000')).toMatchObject({ H: expect.closeTo(29.23, 1) });
    expect(parseColor('#f00')).toEqual(parseColor('#ff0000'));
    expect(parseColor('oklch(55% 0.17 258)')).toEqual({ L: 0.55, C: 0.17, H: 258 });
    expect(parseColor('oklch(0.55 0.17 258deg)')).toEqual({ L: 0.55, C: 0.17, H: 258 });
    expect(parseColor('293')).toEqual({ H: 293 });
    expect(parseColor(-30)).toEqual({ H: 330 });
  });

  it('returns null for anything else', () => {
    for (const value of ['', 'red', '#12', 'oklch(55% 0.17)', 'rgb(1, 2, 3)']) {
      expect(parseColor(value), value).toBeNull();
    }
  });
});

describe('the CLI', () => {
  const run = (...args: string[]) => spawnSync(process.execPath, ['src/theme/cli.mjs', ...args], { encoding: 'utf8' });

  it('writes a checked stylesheet to stdout and reports where the fill landed', () => {
    const result = run('theme', '--accent', '#7c3aed');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('@layer pp.overrides {');
    expect(result.stdout).toContain('Regenerate: npx pixel-perfect theme --accent #7c3aed');
    expect(result.stderr).toMatch(/✓ \d+ contrast and ramp assertions passed/);
  });

  it('exits 1 on a value that is not a colour, and 2 without the subcommand', () => {
    expect(run('theme', '--accent', 'nope').status).toBe(1);
    expect(run('--accent', '#7c3aed').status).toBe(2);
  });
});
