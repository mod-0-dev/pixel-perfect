'use client';

import {
  createContext,
  forwardRef,
  useContext,
  type ComponentPropsWithoutRef,
  type MouseEvent,
} from 'react';

import { cx } from '../../internal/cx';
import { useField } from '../Field/Field';
import type { Size } from '../../types';

/**
 * An `Input` with things inside its box: an icon, a unit, a button that
 * clears it or shows the password.
 *
 * Sizing contract: fill. RSC: client — a context read and a provider.
 *
 * THE COMPONENT 3C PROMISED (tier-3c-inputs.md §3.8). An `<input>` is a void
 * element, so an addon needs a wrapper, and the wrapper needs a layout; the
 * spec turned slots down on `Input` for exactly that reason and said the
 * wrapper is "a different component with a different sizing story". This is
 * it. The group draws the box — edge, fill, radius, height, ring — and the
 * Input inside it gives its own box up, so there is one box and one ring.
 *
 * THE GROUP OWNS THE STATE THE BOX SHOWS (spec §2). An invalid box is drawn
 * in the danger tone, and a tone is a context (D-007) that has to sit on the
 * element that reads it. So the group resolves `size`, `invalid` and
 * `disabled` — prop, then the Field above it, then the default, the
 * precedence every control in Tier 3 uses — writes them on its root, and
 * hands them to the Input through context, which reads them between its own
 * props and the field.
 *
 * Spec: docs/specs/InputGroup.md
 */

export interface InputGroupContextValue {
  size: Size;
  invalid: boolean;
  disabled: boolean;
}

const InputGroupContext = createContext<InputGroupContextValue | null>(null);

/** The group an Input sits in, if any. Read by `Input` (spec §2). */
export function useInputGroup(): InputGroupContextValue | null {
  return useContext(InputGroupContext);
}

export interface InputGroupProps extends ComponentPropsWithoutRef<'div'> {
  /** The control scale, for the box and the Input in it. Default: the Field's, else `md`. */
  size?: Size;
  /** Draws the box in the danger tone. Default: the Field's. A standalone group has no `error`, so it needs this. */
  invalid?: boolean;
  /** Disables the Input inside. Buttons in an addon are yours to disable. Default: the Field's. */
  disabled?: boolean;
}

/*
 * A press on the group that lands on nothing interactive — an icon, a unit,
 * the padding — focuses the field, as a press on a label does. Default
 * prevented, so the field does not blur and refocus on the way.
 */
const INTERACTIVE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]';

export const InputGroup = forwardRef<HTMLDivElement, InputGroupProps>(function InputGroup(
  { size: sizeProp, invalid: invalidProp, disabled: disabledProp, className, onMouseDown, children, ...props },
  ref,
) {
  const field = useField();
  const size = sizeProp ?? field?.size ?? 'md';
  const invalid = invalidProp ?? field?.invalid ?? false;
  const disabled = disabledProp ?? field?.disabled ?? false;

  const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    onMouseDown?.(event);
    if (event.defaultPrevented || event.button !== 0) return;
    const target = event.target as Element;
    if (target.closest(INTERACTIVE)) return;
    const control = event.currentTarget.querySelector<HTMLInputElement>('.pp-input__control');
    if (!control || control.disabled) return;
    event.preventDefault();
    control.focus();
  };

  return (
    <InputGroupContext.Provider value={{ size, invalid, disabled }}>
      <div
        ref={ref}
        className={cx('pp-input-group', className)}
        data-size={size}
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        data-pp-tone={invalid ? 'danger' : undefined}
        onMouseDown={handleMouseDown}
        {...props}
      >
        {children}
      </div>
    </InputGroupContext.Provider>
  );
});

export type InputGroupAddonProps = ComponentPropsWithoutRef<'span'>;

/**
 * One thing inside the box, before or after the Input — in DOM order, so a
 * right-to-left page needs no `side`. Text and icons in it are muted; a
 * Button or IconButton in it keeps its own look. Sizing contract: hug.
 */
export const InputGroupAddon = forwardRef<HTMLSpanElement, InputGroupAddonProps>(function InputGroupAddon(
  { className, ...props },
  ref,
) {
  return <span ref={ref} className={cx('pp-input-group__addon', className)} {...props} />;
});
