import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { cx } from '../../internal/cx';

/**
 * A placeholder for content that has not arrived. Holds layout still so the
 * page does not jump when data lands.
 *
 * Sizing contract: fill. Inline size from the parent; block size from
 * `lines`, from the parent's layout, or from `--pp-skeleton-block-size`.
 * There is no height prop (D-016 §4).
 * RSC: server.
 *
 * Spec: docs/specs/tier-1-atoms.md §1.7
 */

/** `shape`, not `variant`: those four words describe treatments of a tone (D-016 §3). */
export type SkeletonShape = 'text' | 'block' | 'circle';

export type SkeletonRadius = 'sm' | 'md' | 'lg' | 'full';

export interface SkeletonProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'aria-hidden'> {
  shape?: SkeletonShape;
  /** `text` only. Number of line placeholders. */
  lines?: number;
  /** Defaults by shape: text `sm`, block `md`, circle `full`. */
  radius?: SkeletonRadius;
}

const DEFAULT_RADIUS: Record<SkeletonShape, SkeletonRadius> = { text: 'sm', block: 'md', circle: 'full' };

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { shape = 'block', lines = 1, radius, className, ...props },
  ref,
) {
  const count = shape === 'text' ? Math.max(1, Math.floor(lines)) : 0;

  return (
    <div
      ref={ref}
      className={cx('pp-skeleton', className)}
      data-shape={shape}
      data-radius={radius ?? DEFAULT_RADIUS[shape]}
      data-lines={shape === 'text' ? count : undefined}
      aria-hidden="true"
      {...props}
    >
      {shape === 'text'
        ? Array.from({ length: count }, (_, i) => <span key={i} className="pp-skeleton__line" />)
        : null}
    </div>
  );
});
