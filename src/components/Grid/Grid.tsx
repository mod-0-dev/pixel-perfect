import { forwardRef, type ComponentPropsWithoutRef, type CSSProperties } from 'react';

import { cx } from '../../internal/cx';
import { Slot } from '../../internal/slot';
import type { Space } from '../../types';

/**
 * Two-dimensional layout in three modes: a fixed column count, an `auto-fit`
 * track that reflows with no query at all, and a raw track template for the
 * asymmetric cases neither covers (D-022 §4).
 *
 * Sizing contract: fill.
 * RSC: server. No hooks, no browser APIs.
 *
 * Spec: docs/specs/tier-2-layout.md §2.3
 */

/** Grid places items but never re-orders them; `baseline` is meaningless across tracks. */
export type GridAlign = 'start' | 'center' | 'end' | 'stretch';

interface GridBase extends ComponentPropsWithoutRef<'div'> {
  /** A step of the space scale: `gap="4"` is `--pp-space-4` (D-020). */
  gap?: Space;
  align?: GridAlign;
  /** Render the single child element instead of a `<div>`. */
  asChild?: boolean;
}

/**
 * `columns` and `minItemInlineSize` are mutually exclusive in the type rather
 * than by precedence. Passing both is a mistake, and silently picking a winner
 * hides it until someone wonders why their column count is ignored.
 */
export type GridProps =
  | (GridBase & {
      /** A number is `repeat(n, minmax(0, 1fr))`; a string goes to `grid-template-columns` as-is. */
      columns?: number | string;
      minItemInlineSize?: never;
    })
  | (GridBase & {
      columns?: never;
      /** `repeat(auto-fit, minmax(<value>, 1fr))` — the container-native mode. */
      minItemInlineSize: string;
    });

export type GridMode = 'fixed' | 'template' | 'auto' | 'none';

/**
 * Every generated track is `minmax(0, 1fr)`, never `1fr`. `1fr` carries a
 * `min-content` floor, so one long unbreakable string in one cell pushes the
 * whole grid past its container — which is the exact failure RULES §1 exists to
 * prevent, arriving through the back door.
 */
export function gridTracks(
  columns: number | string | undefined,
  minItemInlineSize: string | undefined,
): { template: string | undefined; mode: GridMode } {
  if (typeof columns === 'number') {
    return { template: `repeat(${columns}, minmax(0, 1fr))`, mode: 'fixed' };
  }
  if (typeof columns === 'string') {
    return { template: columns, mode: 'template' };
  }
  if (minItemInlineSize !== undefined) {
    return {
      template: `repeat(auto-fit, minmax(${minItemInlineSize}, 1fr))`,
      mode: 'auto',
    };
  }
  return { template: undefined, mode: 'none' };
}

export const Grid = forwardRef<HTMLDivElement, GridProps>(function Grid(
  { gap = '0', align = 'stretch', columns, minItemInlineSize, asChild = false, className, style, ...props },
  ref,
) {
  const Component = asChild ? Slot : 'div';
  const { template, mode } = gridTracks(columns, minItemInlineSize);

  // The props write a PRIVATE property, and the stylesheet reads the public
  // --pp-grid-template-columns first. Writing the public one here would put it
  // in an inline style, which nothing on an ancestor can outrank — so the
  // documented escape hatch would be dead for every Grid that took a prop.
  //
  // Always written, even in `none` mode, for the reason the gap scale is always
  // emitted: a custom property inherits, so a propless Grid nested inside a
  // three-column one would otherwise lay itself out in three columns.
  const mergedStyle = { ...style, '--_pp-grid-tracks': template ?? 'none' } as CSSProperties;

  return (
    <Component
      ref={ref}
      className={cx('pp-grid', className)}
      style={mergedStyle}
      // Never omitted, even at '0' — see src/components/_shared/layout.css.
      data-pp-gap={gap}
      data-align={align}
      data-mode={mode}
      {...props}
    />
  );
});
