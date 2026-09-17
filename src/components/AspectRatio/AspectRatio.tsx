import { forwardRef, type ComponentPropsWithoutRef, type CSSProperties } from 'react';

import { cx } from '../../internal/cx';

/**
 * Reserves a box of a given ratio before its content loads, so an image, a
 * video embed or a map does not shift the page when it arrives.
 *
 * Sizing contract: fill. Inline size comes from the parent exactly as always;
 * block size is `aspect-ratio` applied to it. That is not the component
 * choosing a size — it is choosing a SHAPE, with the size still entirely the
 * parent's.
 *
 * RSC: server. No hooks, no browser APIs.
 *
 * Spec: docs/specs/tier-2-layout.md §2.7
 */

export interface AspectRatioProps extends ComponentPropsWithoutRef<'div'> {
  /**
   * `16 / 9`, `1`, `4 / 3`. Required: there is no ratio that is right when you
   * did not think about it.
   */
  ratio: number;
}

export const AspectRatio = forwardRef<HTMLDivElement, AspectRatioProps>(function AspectRatio(
  { ratio, className, style, ...props },
  ref,
) {
  // Private property, public override read first (D-024). Always written, so a
  // nested AspectRatio cannot inherit its parent's shape.
  const mergedStyle = { ...style, '--_pp-aspect-ratio': ratio } as CSSProperties;

  return (
    <div ref={ref} className={cx('pp-aspect-ratio', className)} style={mergedStyle} {...props} />
  );
});
