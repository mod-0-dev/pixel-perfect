'use client';

import { forwardRef, useEffect, type MouseEvent } from 'react';

import { cx } from '../../internal/cx';
import { useControllableState } from '../../internal/useControllableState';
import { Button, type ButtonProps } from '../Button/Button';

// The library ships no Node types; a bundler replaces this or leaves it out.
declare const process: { env?: { NODE_ENV?: string } } | undefined;
const isProduction = () => typeof process !== 'undefined' && process?.env?.NODE_ENV === 'production';

/**
 * A button that stays pressed. Bold in a text editor; a filter chip that is on.
 *
 * IT IS NOT `Switch` (3.12). A Toggle is `aria-pressed` — a button whose effect
 * is immediate and which carries no value in a form. A Switch is
 * `role="switch"` with `aria-checked`, a form control that has a value and
 * submits. If it has a label to its left and lives in a settings list, it is a
 * Switch. If it lives in a toolbar and has an icon, it is a Toggle.
 *
 * Sizing contract: hug, inherited from Button.
 * RSC: client — uncontrolled state.
 *
 * Spec: docs/specs/tier-3a-action.md §3.5
 */
/**
 * No `solid` (D-108 §1): pressed IS the solid fill, so a toggle that was
 * solid at rest would look the same pressed and not.
 */
export type ToggleVariant = Exclude<ButtonProps['variant'], 'solid' | undefined>;

export interface ToggleProps extends Omit<ButtonProps, 'loading' | 'variant'> {
  /** Off is quiet; on is the tone's solid fill. Default `'ghost'`. */
  variant?: ToggleVariant;
  /** Controlled. */
  pressed?: boolean;
  /** Uncontrolled. */
  defaultPressed?: boolean;
  /** Fires on activation in both modes. */
  onPressedChange?: (pressed: boolean) => void;
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  {
    pressed,
    defaultPressed = false,
    onPressedChange,
    variant = 'ghost',
    className,
    onClick,
    ...rest
  },
  ref,
) {
  // No `loading`: a toggle's effect is immediate by definition. If it needs a
  // spinner it is an action, and an action is a Button. Omitted from the type
  // AND dropped here, because Omit does not delete properties (D-031).
  const { loading: _loading, ...props } = rest as typeof rest & { loading?: boolean };
  void _loading;

  /* An untyped `solid` would draw on and off the same (D-108 §1). */
  const solid = (variant as string) === 'solid';
  useEffect(() => {
    if (solid && !isProduction()) {
      console.warn('[pixel-perfect] <Toggle> has no `solid` variant: pressed is the solid fill. Using `ghost`.');
    }
  }, [solid]);

  const [isPressed, setPressed] = useControllableState({
    value: pressed,
    defaultValue: defaultPressed,
    onChange: onPressedChange,
    component: 'Toggle',
    prop: 'pressed',
  });

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    // A consumer who calls preventDefault means it. Button has already
    // swallowed the event entirely if the toggle is disabled, so this never
    // runs in that case.
    if (!event.defaultPrevented) setPressed(!isPressed);
  };

  return (
    <Button
      ref={ref}
      className={cx('pp-toggle', className)}
      variant={solid ? 'ghost' : variant}
      // ALWAYS present, "true" or "false" — never absent. A button with no
      // aria-pressed is announced as a plain button, and the user is simply
      // never told it has two states.
      aria-pressed={isPressed}
      data-state={isPressed ? 'on' : 'off'}
      onClick={handleClick}
      {...props}
    />
  );
});
