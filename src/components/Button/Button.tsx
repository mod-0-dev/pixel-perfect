'use client';

import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';

import { cx } from '../../internal/cx';
import { Slot } from '../../internal/slot';
import { Spinner } from '../Spinner/Spinner';
import type { Size, Tone, Variant } from '../../types';

/**
 * A control that performs an action. Renders a real <button>, or delegates to
 * a child element via `asChild`.
 *
 * Sizing contract: hug. inline-flex, no width declaration.
 *
 * RSC: client — and NOT because of hooks, of which it has none. It wraps
 * `onClick` with its own function so activation can be swallowed while
 * `loading`, and a Server Component may not hand a function to a DOM element's
 * event handler. `npm run lint:rules` decides 'use client' by scanning for
 * hooks, so it would not have caught the absence of this directive. Noted here
 * because the next person to "tidy up" the unused-looking directive needs the
 * reason.
 *
 * Spec: docs/specs/tier-3a-action.md §3.1
 */

export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  /** `solid` by default: a button that does not look pressable is not a button. */
  variant?: Variant;
  /** Hierarchy lives here, not in `variant`. One accent button per view. */
  tone?: Tone;
  size?: Size;
  /**
   * Busy. Keeps the button FOCUSABLE and swallows activation, rather than
   * setting `disabled` — a browser blurs a focused element the instant it
   * becomes disabled, so the conventional pattern drops a keyboard user at the
   * top of the document at the exact moment they pressed Save.
   */
  loading?: boolean;
  /** Render the single child element instead of a `<button>`. */
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'solid',
    tone = 'neutral',
    size = 'md',
    loading = false,
    disabled = false,
    asChild = false,
    // HTML defaults this to "submit", which means every non-submit button
    // inside a <form> silently submits it. Submitting is opted into.
    type = 'button',
    className,
    children,
    onClick,
    onKeyDown,
    ...props
  },
  ref,
) {
  // `disabled` on a <button> is the real attribute. An <a> has no such
  // attribute, so under `asChild` the state degrades to ARIA plus an
  // intercepted activation — genuinely weaker, and documented as such.
  const nativeDisabled = !asChild && disabled;
  const ariaDisabled = loading || (asChild && disabled);
  const blocked = disabled || loading;

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if (blocked) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onClick?.(event as MouseEvent<HTMLButtonElement>);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    // A natively disabled <button> never fires this. An aria-disabled one does,
    // and so does an <a> under `asChild`, where Enter would otherwise navigate.
    if (blocked && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      return;
    }
    onKeyDown?.(event as KeyboardEvent<HTMLButtonElement>);
  };

  const Component = asChild ? Slot : 'button';

  /**
   * The label lives in its own element so `loading` can hide it with
   * `visibility` while the box keeps its size. A button that shrinks under the
   * cursor mid-click is how a mis-click happens.
   */
  const inner = (node: ReactNode) => (
    <>
      <span className="pp-button__content">{node}</span>
      {loading ? (
        <span className="pp-button__spinner">
          <Spinner decorative size={size} />
        </span>
      ) : null}
    </>
  );

  const child = asChild && isValidElement<{ children?: ReactNode }>(children) ? children : null;

  if (asChild && child === null) {
    throw new Error('[pixel-perfect] <Button asChild> expects exactly one React element as its child.');
  }

  return (
    <Component
      ref={ref}
      className={cx('pp-button', className)}
      type={asChild ? undefined : type}
      disabled={nativeDisabled || undefined}
      data-variant={variant}
      data-pp-tone={tone}
      data-size={size}
      data-loading={loading || undefined}
      data-disabled={disabled || undefined}
      aria-disabled={ariaDisabled || undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...props}
      tabIndex={asChild && disabled ? (props.tabIndex ?? -1) : props.tabIndex}
    >
      {child ? cloneElement(child, undefined, inner(child.props.children)) : inner(children)}
    </Component>
  );
});
