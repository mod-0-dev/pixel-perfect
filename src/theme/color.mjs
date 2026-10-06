// OKLCH <-> sRGB conversion and WCAG 2.1 contrast.
// Self-contained on purpose: the contrast guarantee behind every token in this
// library should not depend on a transitive dependency.

/** OKLab -> linear sRGB (Björn Ottosson's matrices). */
function oklabToLinearSrgb(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const gammaEncode = (c) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;

/** @returns {{rgb: [number,number,number], inGamut: boolean}} components in 0..1 */
export function oklchToSrgb(L, C, H) {
  const h = (H * Math.PI) / 180;
  const linear = oklabToLinearSrgb(L, C * Math.cos(h), C * Math.sin(h));
  const inGamut = linear.every((v) => v >= -1e-4 && v <= 1 + 1e-4);
  const rgb = linear.map((v) => gammaEncode(Math.min(1, Math.max(0, v))));
  return { rgb, inGamut };
}

/** Largest chroma <= C that keeps (L, ?, H) inside sRGB. */
export function clampChroma(L, C, H) {
  if (oklchToSrgb(L, C, H).inGamut) return C;
  let lo = 0;
  let hi = C;
  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2;
    if (oklchToSrgb(L, mid, H).inGamut) lo = mid;
    else hi = mid;
  }
  return lo;
}

/** WCAG 2.1 relative luminance from sRGB components in 0..1. */
export function relativeLuminance([r, g, b]) {
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG 2.1 contrast ratio between two sRGB triples. */
export function contrast(rgbA, rgbB) {
  const a = relativeLuminance(rgbA);
  const b = relativeLuminance(rgbB);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

export function contrastOklch(a, b) {
  return contrast(oklchToSrgb(...a).rgb, oklchToSrgb(...b).rgb);
}

export function formatOklch(L, C, H) {
  const c = clampChroma(L, C, H);
  const l = (L * 100).toFixed(2).replace(/\.?0+$/, '');
  const ch = c.toFixed(4).replace(/\.?0+$/, '');
  return `oklch(${l}% ${ch === '' ? '0' : ch} ${H})`;
}

export function parseOklch(value) {
  const m = /oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)\s*\)/.exec(value);
  if (!m) return null;
  return [Number(m[1]) / 100, Number(m[2]), Number(m[3])];
}

/**
 * Binary-search lightness so that (L, C, H) hits `target` contrast against
 * `against`. `direction` picks which end of the range we prefer: 'lightest'
 * keeps as much lightness as the target allows, 'darkest' as little.
 */
export function solveLightness({ against, target, hue, chroma, lo, hi, direction }) {
  const meets = (L) => contrastOklch([L, clampChroma(L, chroma, hue), hue], against) >= target;
  // Ensure the search is bracketed: one end must satisfy, the other must not.
  const preferred = direction === 'lightest' ? hi : lo;
  const fallback = direction === 'lightest' ? lo : hi;
  if (meets(preferred)) return preferred;
  if (!meets(fallback)) return null; // unreachable at this chroma/hue
  let good = fallback;
  let bad = preferred;
  for (let i = 0; i < 32; i++) {
    const mid = (good + bad) / 2;
    if (meets(mid)) good = mid;
    else bad = mid;
  }
  return good;
}

const gammaDecode = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

/**
 * sRGB components in 0..1 -> OKLCH (Björn Ottosson's matrices, the inverse of
 * `oklchToSrgb` above). Hue is in degrees, 0-360; an achromatic colour
 * reports hue 0.
 *
 * @param {[number, number, number]} rgb
 * @returns {[number, number, number]} [L 0..1, C, H degrees]
 */
export function srgbToOklch([r, g, b]) {
  const [lr, lg, lb] = [r, g, b].map(gammaDecode);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.hypot(A, B);
  const H = C < 1e-4 ? 0 : ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
  return [L, C, H];
}

/**
 * A colour as a person types it: `#7c3aed`, `#73e`, `oklch(55% 0.2 293)`,
 * `oklch(0.55 0.2 293deg)`, or a bare hue angle (`293`). A bare hue says
 * nothing about lightness or chroma, so only `hue` is returned for it.
 *
 * @param {string | number} input
 * @returns {{ L?: number, C?: number, H: number } | null} null when unreadable
 */
export function parseColor(input) {
  if (typeof input === 'number') return Number.isFinite(input) ? { H: ((input % 360) + 360) % 360 } : null;
  const text = String(input).trim().toLowerCase();
  if (/^-?\d+(\.\d+)?(deg)?$/.test(text)) return parseColor(parseFloat(text));

  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/.exec(text);
  if (hex) {
    const digits = hex[1].length === 3 ? [...hex[1]].map((d) => d + d).join('') : hex[1];
    const rgb = [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16) / 255);
    const [L, C, H] = srgbToOklch(rgb);
    return { L, C, H };
  }

  const oklch = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(deg)?\s*(\/\s*[\d.]+%?\s*)?\)$/.exec(text);
  if (oklch) {
    const L = oklch[2] === '%' ? Number(oklch[1]) / 100 : Number(oklch[1]);
    const C = Number(oklch[3]);
    const H = Number(oklch[4]) % 360;
    if ([L, C, H].every(Number.isFinite) && L >= 0 && L <= 1) return { L, C, H };
  }
  return null;
}
