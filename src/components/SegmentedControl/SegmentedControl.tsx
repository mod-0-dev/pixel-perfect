'use client';

import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useMemo,
  type ChangeEvent,
  type ComponentPropsWithoutRef,
} from 'react';

import { cx } from '../../internal/cx';
import { useControllableState } from '../../internal/useControllableState';
import { useField } from '../Field/Field';
import type { Size } from '../../types';

/**
 * Exactly one of a few options, drawn as an attached row of buttons:
 * System · Light · Dark.
 *
 * NATIVE RADIOS, PAINTED AS BUTTONS (spec §1). The root is a radiogroup and
 * each item a <label> around a real <input type="radio"> that covers it, so
 * the browser supplies the APG Radio Group pattern — one tab stop, arrows
 * that move and select, wrapping — and the value submits (D-039 §5). There
 * is no roving tabindex here, by design.
 *
 * THE TWO-CLASS CONTRACT (spec §3, D-070 §1): the root is also a
 * `pp-button-group` and each item a `pp-button`, so the box, the seams and
 * the radii are ButtonGroup's and Button's own code. This file adds the
 * checked fill, the hit area and the ring.
 *
 * Sizing contract: hug. RSC: client — useId, state, a context.
 * Spec: docs/specs/SegmentedControl.md
 */

declare const process: { env?: { NODE_ENV?: string } } | undefined;
const isProduction = () => typeof process !== 'undefined' && process?.env?.NODE_ENV === 'production';

export type SegmentedControlOrientation = 'horizontal' | 'vertical';

interface SegmentedControlContextValue {
  name: string;
  value: string;
  select: (value: string) => void;
  size: Size;
  disabled: boolean;
  required: boolean;
}

const SegmentedControlContext = createContext<SegmentedControlContextValue | null>(null);

export interface SegmentedControlProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'role' | 'defaultValue' | 'onChange' | 'aria-label'> {
  /** The radiogroup's name. Inside a `Field` with `group`, the field's label names it instead (spec §4). */
  label?: string;
  /** Controlled. `''` is nothing selected. */
  value?: string;
  /** Uncontrolled; `''` (the default) is nothing selected. */
  defaultValue?: string;
  /** Fires in both modes (D-032). Never called with `''`. */
  onValueChange?: (value: string) => void;
  /** Generated from `useId()` when omitted: grouping is the `name` (D-039 §5). */
  name?: string;
  size?: Size;
  orientation?: SegmentedControlOrientation;
  disabled?: boolean;
  required?: boolean;
}

export const SegmentedControl = forwardRef<HTMLDivElement, SegmentedControlProps>(function SegmentedControl(
  {
    label,
    value: valueProp,
    defaultValue = '',
    onValueChange,
    name: nameProp,
    size: sizeProp,
    orientation = 'horizontal',
    disabled: disabledProp,
    required: requiredProp,
    className,
    children,
    ...rest
  },
  ref,
) {
  // Omit does not delete properties (D-031): a role handed in anyway would
  // turn the radiogroup into something else while keeping its keyboard.
  const { role: _role, ...props } = rest as typeof rest & { role?: string };
  void _role;

  const field = useField();
  const uid = useId();
  const name = nameProp ?? uid;
  const size = sizeProp ?? field?.size ?? 'md';
  const disabled = disabledProp ?? field?.disabled ?? false;
  const required = requiredProp ?? field?.required ?? false;
  const invalid = field?.invalid ?? false;

  // The group holds the value, because a radio deselected by its sibling is
  // told nothing (D-047 §1).
  const [value, select] = useControllableState<string>({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
    component: 'SegmentedControl',
    prop: 'value',
  });

  /* A name from `label` or from the field; the type cannot see a context, so
     it cannot require one of the two (spec §4). */
  const labelledBy = label === undefined ? field?.control['aria-labelledby'] : undefined;
  const unnamed = (label === undefined || label.trim() === '') && labelledBy === undefined;
  useEffect(() => {
    if (unnamed && !isProduction()) {
      console.warn('[pixel-perfect] <SegmentedControl> needs a name: give it a `label`, or put it in a <Field group>.');
    }
  }, [unnamed]);

  const context = useMemo<SegmentedControlContextValue>(
    () => ({ name, value, select, size, disabled, required }),
    [name, value, select, size, disabled, required],
  );

  return (
    <div
      ref={ref}
      className={cx('pp-button-group pp-segmented-control', className)}
      role="radiogroup"
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-describedby={field?.control['aria-describedby']}
      aria-invalid={invalid || undefined}
      aria-required={required || undefined}
      aria-orientation={orientation === 'vertical' ? 'vertical' : undefined}
      data-orientation={orientation}
      data-size={size}
      data-disabled={disabled || undefined}
      data-invalid={invalid || undefined}
      /* Neutral, always: a single choice has no semantic colour, and an
         ancestor's tone context must not reach it (spec §2, D-059). */
      data-pp-tone="neutral"
      {...props}
    >
      <SegmentedControlContext.Provider value={context}>{children}</SegmentedControlContext.Provider>
    </div>
  );
});

export interface SegmentedControlItemProps
  extends Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'value' | 'checked' | 'defaultChecked' | 'size'> {
  /** What this segment contributes. Required, and never `''`. */
  value: string;
  disabled?: boolean;
}

export const SegmentedControlItem = forwardRef<HTMLInputElement, SegmentedControlItemProps>(function SegmentedControlItem(
  { value, disabled: disabledProp, className, style, children, onChange, ...rest },
  ref,
) {
  // Omit does not delete properties (D-031): `checked` here would be a
  // second source of truth for the group's value (D-047 §1).
  const { checked: _checked, defaultChecked: _defaultChecked, type: _type, ...props } = rest as typeof rest & {
    checked?: boolean;
    defaultChecked?: boolean;
    type?: string;
  };
  void _checked;
  void _defaultChecked;
  void _type;

  const group = useContext(SegmentedControlContext);
  const disabled = disabledProp ?? group?.disabled ?? false;
  const checked = group ? group.value === value : undefined;
  /* Omitted outside a group rather than guessed (D-047 §2). */
  const state = checked === undefined ? undefined : checked ? 'checked' : 'unchecked';

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    // Chained, not replaced: a form library's `onChange` must still see it
    // (D-039 §6). `change` fires only for the radio being selected (D-047 §4).
    onChange?.(event);
    if (event.defaultPrevented) return;
    group?.select(value);
  };

  return (
    /* The label is the box (D-039 §1): className, style and the state. */
    <label
      className={cx('pp-button pp-segmented-control__item', className)}
      style={style}
      data-variant="outline"
      data-size={group?.size ?? 'md'}
      data-state={state}
      data-disabled={disabled || undefined}
    >
      <input
        ref={ref}
        className="pp-segmented-control__input"
        type="radio"
        name={group?.name}
        value={value}
        checked={checked}
        required={group?.required || undefined}
        disabled={disabled || undefined}
        onChange={handleChange}
        {...props}
      />
      <span className="pp-button__content">{children}</span>
    </label>
  );
});
