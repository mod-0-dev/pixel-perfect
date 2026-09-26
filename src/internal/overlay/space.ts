import type { Space } from '../../types';

/**
 * A step of the space scale, as the pixels it resolves to on an element
 * (overlay-foundation.md §9, D-061 §5).
 *
 * The positioning library takes its offsets as pixel numbers. A `8` in a
 * component's JavaScript is the `8px` RULES §3 bans in its CSS, one file over,
 * so a Tier 4 offset prop is typed `Space` — the index D-020 gave every layout
 * primitive's `gap` — and resolved here at open time, by reading the token's
 * computed value on the element that will be positioned against and
 * converting its unit.
 *
 * The computed value of a custom property is the token's own text —
 * `0.5rem`, not a pixel length — which is why the unit is converted by hand.
 * `rem` and `px` are what the scale is written in; `em` is handled for an app
 * that overrides a step on an ancestor in its own terms.
 *
 * Internal. Not exported from the package.
 */
export function resolveSpace(element: Element | null | undefined, step: Space): number {
  if (!element) return 0;
  const view = element.ownerDocument.defaultView;
  if (!view) return 0;

  const raw = view.getComputedStyle(element).getPropertyValue(`--pp-space-${step}`).trim();
  return lengthToPixels(raw, element, view);
}

function lengthToPixels(raw: string, element: Element, view: Window): number {
  const value = parseFloat(raw);
  if (!Number.isFinite(value)) return 0;
  if (raw.endsWith('rem')) {
    return value * fontSizeOf(view.document.documentElement, view);
  }
  if (raw.endsWith('em')) {
    return value * fontSizeOf(element, view);
  }
  // `px`, or a bare zero.
  return value;
}

function fontSizeOf(element: Element, view: Window): number {
  const size = parseFloat(view.getComputedStyle(element).fontSize);
  // jsdom reports no font size at all; the browser default is what it would
  // have been.
  return Number.isFinite(size) && size > 0 ? size : 16;
}
