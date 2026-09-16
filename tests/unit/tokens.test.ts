import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BASE, THEME_SPECIFIC, TONES, toneMap } from '../../scripts/semantic-tokens.mjs';

const primitives = readFileSync('src/styles/tokens/primitives.css', 'utf8');
const semantic = readFileSync('src/styles/tokens/semantic.css', 'utf8');

const HUES = ['neutral', 'accent', 'danger', 'success', 'warning'];
const THEME_SCOPES = [':root', '[data-pp-theme="light"]', ':root:not([data-pp-theme])', '[data-pp-theme="dark"]'];

/** Extract the declarations of the block introduced by `marker`. */
function block(css: string, marker: string): string {
  const start = css.indexOf(marker);
  if (start === -1) throw new Error(`block not found: ${marker}`);
  const from = css.indexOf('{', start) + 1;
  let depth = 1;
  let i = from;
  while (depth > 0 && i < css.length) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') depth--;
    i++;
  }
  return css.slice(from, i);
}

describe('primitive tokens', () => {
  it.each(HUES)('%s has all 12 steps plus on-solid and focus in both themes', (hue) => {
    for (const scope of [':root {', '[data-pp-theme="dark"] {']) {
      const b = block(primitives, scope);
      for (let step = 1; step <= 12; step++) {
        expect(b, `${hue}-${step} in ${scope}`).toContain(`--pp-palette-${hue}-${step}:`);
      }
      expect(b).toContain(`--pp-palette-${hue}-on-solid:`);
      expect(b).toContain(`--pp-palette-${hue}-focus:`);
    }
  });

  it('declares every theme scope', () => {
    for (const scope of THEME_SCOPES) {
      expect(primitives).toContain(scope);
    }
  });
});

describe('semantic tokens', () => {
  const expectedKeys = [
    ...Object.values(BASE).flatMap((group) => Object.keys(group)),
    ...Object.keys(THEME_SPECIFIC.light),
  ];

  /**
   * Regression guard for D-011. A semantic token present in only one scope
   * resolves there and inherits its resolved value into the others, silently
   * rendering the wrong theme.
   */
  it.each(THEME_SCOPES)('scope %s carries the COMPLETE semantic set', (scope) => {
    const b = block(semantic, `${scope} {`);
    const missing = expectedKeys.filter((key) => !b.includes(`${key}:`));
    expect(missing, `missing from ${scope}`).toEqual([]);
  });

  it('gives every tone an identical token shape, so components never branch on tone', () => {
    const shape = Object.keys(toneMap('neutral')).sort();
    for (const tone of TONES) {
      const b = block(semantic, `[data-pp-tone="${tone}"] {`);
      const declared = [...b.matchAll(/(--pp-tone-[a-z-]+):/g)].map((m) => m[1]).sort();
      expect(declared, tone).toEqual(shape);
    }
  });

  it('never leaks a raw palette token as a component-facing name', () => {
    const componentFacing = [...semantic.matchAll(/^\s*(--pp-(?:color|tone|focus)[a-z-]*):/gm)];
    expect(componentFacing.length).toBeGreaterThan(0);
    for (const [, name] of componentFacing) {
      expect(name).not.toMatch(/^--pp-palette/);
    }
  });
});
