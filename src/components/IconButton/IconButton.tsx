'use client';

import { forwardRef, type ReactNode } from 'react';

import { cx } from '../../internal/cx';
import { Button, type ButtonProps } from '../Button/Button';
import { Icon } from '../Icon/Icon';

/**
 * A square Button whose entire content is one icon, and which CANNOT be
 * constructed without an accessible name.
 *
 * It is a separate component rather than a Button prop because that guarantee
 * has to be a type, not a code review: RULES §6 requires the type system to
 * make the omission impossible, and `label: string` is non-optional in a way
 * that `aria-label?: string` never is.
 *
 * `variant` defaults to `ghost` rather than Button's `solid`: an icon button is
 * overwhelmingly a secondary affordance — a close, a copy, an overflow menu, a
 * row action — and a grid of solid squares is noise. Deliberate, and recorded
 * in D-030 §10 so it stays a decision rather than drift.
 *
 * NO `asChild`. Button's `asChild` delegates to the element passed as
 * `children`, and here `children` is already spoken for: it is the SVG. There
 * is no slot left for a delegate. An icon-only link wants the same required
 * name this component exists to enforce, so it is a `Link` with an `Icon`
 * inside and an `aria-label`, not an `IconButton` in disguise.
 *
 * Sizing contract: hug, square. See IconButton.css for the D-019 exemption.
 * RSC: client — it renders Button.
 *
 * Spec: docs/specs/tier-3a-action.md §3.2
 */
export interface IconButtonProps
  extends Omit<ButtonProps, 'children' | 'aria-label' | 'asChild'> {
  /** The accessible name. Required, and that is the whole component. */
  label: string;
  /** The SVG. Wrapped in `<Icon decorative>`, so it never names the control twice. */
  children: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, children, variant = 'ghost', size = 'md', className, ...rest },
  ref,
) {
  // `asChild` is omitted from IconButtonProps, but TypeScript does not delete
  // properties — a JS caller, or a spread of a wider object, would otherwise
  // hand it to Button, which would delegate to the <Icon> element and render a
  // <span> with a button's class list and no button semantics at all. Dropped
  // here so the type and the runtime agree. Found by a test written to assert
  // the type error, which rendered the broken markup instead.
  const { asChild: _asChild, ...props } = rest as typeof rest & { asChild?: boolean };
  void _asChild;

  return (
    <Button
      ref={ref}
      className={cx('pp-icon-button', className)}
      variant={variant}
      size={size}
      aria-label={label}
      {...props}
    >
      {/*
        `size` passes straight through: Icon's sm/md/lg are --pp-size-4/5/6,
        which is 16/20/24px, and those are the right icon sizes for 32/40/48px
        controls. No second scale, no mapping table.
      */}
      <Icon decorative size={size}>
        {children}
      </Icon>
    </Button>
  );
});
