import { forwardRef, type ComponentPropsWithoutRef, type CSSProperties } from 'react';

import { cx } from '../../internal/cx';
import { Slot } from '../../internal/slot';
import type { TextAlign, TextTone, TextWeight } from '../Text/Text';

/**
 * A heading whose visual size is decoupled from its semantic level.
 *
 * Sizing contract: fill. Block-level, no width declaration, min-inline-size: 0.
 * RSC: server. No hooks, no browser APIs.
 *
 * Spec: docs/specs/tier-1-atoms.md §1.2
 */

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** Six named steps onto --pp-font-size-4 … -9 (D-016 §1). */
export type HeadingSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

export interface HeadingProps extends ComponentPropsWithoutRef<'h1'> {
  /**
   * The semantic level — which of h1–h6 is rendered. Required: a document
   * outline is a deliberate choice, and a component cannot guess it.
   */
  level: HeadingLevel;
  /** Visual size. Defaults from `level`; set it to break the coupling. */
  size?: HeadingSize;
  tone?: TextTone;
  weight?: TextWeight;
  align?: TextAlign;
  /** `true` clamps to one line with an ellipsis; a number clamps to that many lines. */
  truncate?: boolean | number;
  /** Render the single child element instead of the h-tag. `level` still picks the default size. */
  asChild?: boolean;
}

const DEFAULT_SIZE: Record<HeadingLevel, HeadingSize> = {
  1: '3xl',
  2: '2xl',
  3: 'xl',
  4: 'lg',
  5: 'md',
  6: 'sm',
};

const CONTEXT_TONES: ReadonlySet<string> = new Set(['accent', 'danger', 'success', 'warning']);

function truncateLines(truncate: boolean | number | undefined): number | undefined {
  if (truncate === true) return 1;
  if (typeof truncate === 'number' && truncate >= 1) return Math.floor(truncate);
  return undefined;
}

export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  {
    level,
    size,
    tone = 'neutral',
    weight = 'semibold',
    align,
    truncate,
    asChild = false,
    className,
    style,
    ...props
  },
  ref,
) {
  const Component = asChild ? Slot : (`h${level}` as 'h1');
  const lines = truncateLines(truncate);
  const mergedStyle =
    lines !== undefined && lines > 1 ? ({ ...style, '--pp-heading-lines': lines } as CSSProperties) : style;

  return (
    <Component
      ref={ref}
      className={cx('pp-heading', className)}
      style={mergedStyle}
      data-level={level}
      data-size={size ?? DEFAULT_SIZE[level]}
      data-tone={tone}
      data-weight={weight}
      data-align={align}
      data-truncate={lines}
      data-pp-tone={CONTEXT_TONES.has(tone) ? tone : undefined}
      {...props}
    />
  );
});
