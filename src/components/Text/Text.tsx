import { forwardRef, type ComponentPropsWithoutRef, type CSSProperties } from 'react';

import { cx } from '../../internal/cx';
import { Slot } from '../../internal/slot';
import type { Tone } from '../../types';

/**
 * Body copy with a typography scale, a colour role and truncation.
 *
 * Sizing contract: fill. Block-level, no width declaration, min-inline-size: 0.
 * RSC: server. No hooks, no browser APIs.
 *
 * Spec: docs/specs/tier-1-atoms.md §1.1
 */

/** Four steps, not three — a type scale cannot carry caption and body in three (D-016 §1). */
export type TextSize = 'xs' | 'sm' | 'md' | 'lg';

/** `muted` is a colour role local to Text and Heading, not a global tone (D-016 §2). */
export type TextTone = Tone | 'muted';

export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

/** Logical, so it is correct in RTL without a second thought. */
export type TextAlign = 'start' | 'center' | 'end';

export interface TextProps extends ComponentPropsWithoutRef<'p'> {
  size?: TextSize;
  tone?: TextTone;
  weight?: TextWeight;
  align?: TextAlign;
  /** `true` clamps to one line with an ellipsis; a number clamps to that many lines. */
  truncate?: boolean | number;
  /** Render the single child element instead of a `<p>`. */
  asChild?: boolean;
}

/** Tones that route through the `--pp-tone-*` context. `neutral` and `muted` read page colours directly. */
const CONTEXT_TONES: ReadonlySet<string> = new Set(['accent', 'danger', 'success', 'warning']);

function truncateLines(truncate: boolean | number | undefined): number | undefined {
  if (truncate === true) return 1;
  if (typeof truncate === 'number' && truncate >= 1) return Math.floor(truncate);
  return undefined;
}

export const Text = forwardRef<HTMLParagraphElement, TextProps>(function Text(
  {
    size = 'md',
    tone = 'neutral',
    weight = 'regular',
    align,
    truncate,
    asChild = false,
    className,
    style,
    ...props
  },
  ref,
) {
  const Component = asChild ? Slot : 'p';
  const lines = truncateLines(truncate);
  const mergedStyle =
    lines !== undefined && lines > 1 ? ({ ...style, '--pp-text-lines': lines } as CSSProperties) : style;

  return (
    <Component
      ref={ref}
      className={cx('pp-text', className)}
      style={mergedStyle}
      data-size={size}
      data-tone={tone}
      data-weight={weight}
      data-align={align}
      data-truncate={lines}
      data-pp-tone={CONTEXT_TONES.has(tone) ? tone : undefined}
      {...props}
    />
  );
});
