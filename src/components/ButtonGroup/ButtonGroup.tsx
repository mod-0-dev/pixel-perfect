import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { cx } from '../../internal/cx';

/**
 * Two or more related buttons rendered as one attached visual unit: shared
 * borders, end radii on the ends, square corners between.
 *
 * IT DOES NOT SPACE BUTTONS OUT. A group that merely puts distance between
 * buttons is `<Cluster gap="2">`, and D-004 rejected `Box` on exactly that
 * ground — a component that duplicates a layout primitive is how sizing rules
 * die. So there is no `attached` prop: `attached={false}` is spelled `Cluster`.
 *
 * It also does not manage selection. A segmented control where exactly one
 * option is chosen is a `RadioGroup` (3.11) styled as buttons; one where
 * several may be is a set of `Toggle`s (3.5).
 *
 * Sizing contract: hug. inline-flex, no width declaration.
 * RSC: server. A container and nothing else.
 *
 * Spec: docs/specs/tier-3a-action.md §3.4
 */

export type ButtonGroupOrientation = 'horizontal' | 'vertical';

export interface ButtonGroupProps extends Omit<ComponentPropsWithoutRef<'div'>, 'role'> {
  /** **Required.** An unnamed group is an unnamed landmark for a screen reader. */
  label: string;
  orientation?: ButtonGroupOrientation;
}

export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup(
  { label, orientation = 'horizontal', className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx('pp-button-group', className)}
      role="group"
      aria-label={label}
      data-orientation={orientation}
      {...props}
    />
  );
});
