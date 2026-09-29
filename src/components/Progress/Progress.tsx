import { forwardRef, type ComponentPropsWithoutRef, type CSSProperties } from 'react';

import { cx } from '../../internal/cx';
import type { Size, Tone } from '../../types';

/**
 * How far along a thing is: a bar filled as far as the value says, or a
 * sweeping segment when the size of the work is not known.
 *
 * `value` PRESENT IS DETERMINATE, ABSENT IS INDETERMINATE (spec §1): no
 * boolean beside the number. `aria-valuenow` is omitted when there is no
 * value, which is what ARIA 1.2 says an indeterminate progressbar does.
 *
 * A NAME IS REQUIRED AT THE TYPE LEVEL (spec §2): `label` or
 * `aria-labelledby`. A progress bar has no decorative case.
 *
 * THE FILL IS WRITTEN AS AN INLINE CUSTOM PROPERTY (spec §3, Slider's
 * device): the stylesheet reads `--_pp-progress-fill` into the fill's
 * `flex-basis`, which is what makes the width a percentage of the track
 * with no width declaration and no rule about direction.
 *
 * Sizing contract: fill. RSC: server — no state, no effect, no handler;
 * the motion is CSS. Spec: docs/specs/Progress.md
 */

type ProgressBase = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'role' | 'aria-label' | 'aria-labelledby'> & {
  /** The value, in `[0, max]`. Leave it off while the size of the work is unknown. */
  value?: number;
  /** The value at which the bar is full. Positive and finite; otherwise 100. */
  max?: number;
  /** The thickness of the bar. */
  size?: Size;
  /** The fill's colour. `accent` by default: a bar stands alone, and a grey one reads as disabled. */
  tone?: Tone;
};

/** One of `label` and `aria-labelledby` is required: a progressbar without a name reports a number of nothing. */
export type ProgressProps = ProgressBase &
  ({ label: string; 'aria-labelledby'?: never } | { 'aria-labelledby': string; label?: never });

declare const process: { env?: { NODE_ENV?: string } } | undefined;
const isProduction = () => typeof process !== 'undefined' && process?.env?.NODE_ENV === 'production';

function resolveMax(max: number | undefined): number {
  if (max === undefined) return 100;
  if (Number.isFinite(max) && max > 0) return max;
  if (!isProduction()) {
    console.warn(`[pixel-perfect] <Progress> \`max\` must be a positive finite number; got ${String(max)}. Using 100.`);
  }
  return 100;
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  { value, max, size = 'md', tone = 'accent', className, style, ...rest },
  ref,
) {
  const { label, 'aria-labelledby': labelledBy, ...props } = rest as {
    label?: string;
    'aria-labelledby'?: string;
  } & Omit<ProgressBase, 'value' | 'max' | 'size' | 'tone' | 'className' | 'style'>;

  const resolvedMax = resolveMax(max);
  const determinate = value !== undefined;
  const clamped = determinate ? Math.min(resolvedMax, Math.max(0, value)) : 0;
  const percent = determinate ? (clamped / resolvedMax) * 100 : 0;

  return (
    <div
      ref={ref}
      role="progressbar"
      className={cx('pp-progress', className)}
      data-state={determinate ? 'determinate' : 'indeterminate'}
      data-size={size}
      data-pp-tone={tone}
      {...(label !== undefined ? { 'aria-label': label } : {})}
      {...(labelledBy !== undefined ? { 'aria-labelledby': labelledBy } : {})}
      aria-valuemin={0}
      aria-valuemax={resolvedMax}
      {...(determinate ? { 'aria-valuenow': clamped } : {})}
      style={{ ...style, '--_pp-progress-fill': `${percent}%` } as CSSProperties}
      {...props}
    >
      <div className="pp-progress__fill" />
    </div>
  );
});
