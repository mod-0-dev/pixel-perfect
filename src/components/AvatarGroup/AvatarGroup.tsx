import { Children, forwardRef, isValidElement, type ComponentPropsWithoutRef } from 'react';

import { cx } from '../../internal/cx';
import type { Size } from '../../types';

/**
 * Who is on it: a few avatars overlapping in a row, and "+3" for the rest.
 *
 * A LIST OF THE CHILDREN, THE FIRST `max` SHOWN, THE REST A COUNT (spec §1):
 * a <ul> with each child in a <li>, so a screen reader hears the count and
 * then each Avatar's name; the count is drawn as an Avatar by the two-class
 * contract (`pp-avatar pp-avatar-group__more`).
 *
 * OVERLAP BY A GRID WHOSE COLUMNS ARE NARROWER THAN AN AVATAR (spec §2): a
 * negative margin is what RULES §2 bans; the stylesheet does it with no
 * margin and no width.
 *
 * Sizing contract: hug. RSC: server. Spec: docs/specs/AvatarGroup.md
 */

export interface AvatarGroupProps extends Omit<ComponentPropsWithoutRef<'ul'>, 'aria-label'> {
  /** The first `max` children are shown; the rest are one count. */
  max?: number;
  /** Every avatar's, and the count's. */
  size?: Size;
  /** The list's name. */
  label?: string;
  /** The count's accessible name. */
  moreLabel?: (count: number) => string;
}

const defaultMoreLabel = (count: number) => `${count} more`;

export const AvatarGroup = forwardRef<HTMLUListElement, AvatarGroupProps>(function AvatarGroup(
  { max, size = 'md', label, moreLabel = defaultMoreLabel, className, children, ...props },
  ref,
) {
  const items = Children.toArray(children).filter((child) => isValidElement(child));
  const limit = max !== undefined && max >= 0 ? Math.floor(max) : items.length;
  const shown = items.slice(0, limit);
  const rest = items.length - shown.length;

  return (
    <ul
      ref={ref}
      className={cx('pp-avatar-group', className)}
      data-size={size}
      {...(label !== undefined ? { 'aria-label': label } : {})}
      {...props}
    >
      {shown.map((child, i) => (
        <li key={(child as { key?: string | null }).key ?? i} className="pp-avatar-group__item">
          {child}
        </li>
      ))}
      {rest > 0 ? (
        <li className="pp-avatar-group__item">
          <span
            className="pp-avatar pp-avatar-group__more"
            role="img"
            aria-label={moreLabel(rest)}
            data-size={size}
            data-pp-tone="neutral"
          >
            {/* An isolated left-to-right run: "+" and a digit are bidi-weak, and
                an RTL page rendered "2+" (D-090 §4). */}
            <span className="pp-avatar__fallback" aria-hidden="true" dir="ltr">
              +{rest}
            </span>
          </span>
        </li>
      ) : null}
    </ul>
  );
});
