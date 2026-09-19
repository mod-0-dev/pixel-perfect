'use client';

import {
  createContext,
  forwardRef,
  useContext,
  useId,
  useMemo,
  type ComponentPropsWithoutRef,
} from 'react';

import { cx } from '../../internal/cx';
import { useControllableState } from '../../internal/useControllableState';
import { Cluster } from '../Cluster/Cluster';
import { useField } from '../Field/Field';
import { Stack } from '../Stack/Stack';
import type { Size, Space } from '../../types';

/**
 * One choice from a visible set. The group owns the `name`, the value and the
 * grouping semantics; `Radio` is one option.
 *
 * Sizing contract: fill. It is a layout of its children and occupies the
 * field's inline space — and it does not declare that flow itself. It renders
 * `Stack` or `Cluster` (D-021: a layout primitive may size the boxes it
 * creates), which is why this file has no stylesheet: once the role and the
 * context are added there is nothing left to paint, and an empty rule set
 * would be a claim of ownership the component does not have.
 *
 * RSC: client — `useId`, `useControllableState` and a context provider.
 *
 * NO ROVING TABINDEX (D-039 §5). Radios sharing a `name` already implement the
 * APG Radio Group pattern in every browser — one tab stop, arrows that move
 * AND select, wrapping at both ends, disabled members skipped. Writing our own
 * means deleting that and rebuilding it, and the rebuild is what has the edge
 * cases. Asserted in tests/visual/harness.spec.ts, where a real browser is.
 *
 * Spec: docs/specs/tier-3c-inputs.md §3.11
 */

export type RadioGroupOrientation = 'vertical' | 'horizontal';

export interface RadioGroupContextValue {
  /** The shared `name`. Grouping *is* this attribute (D-039 §5). */
  name: string;
  /** The selected option's `value`, or `''` for nothing selected. */
  value: string;
  /** Called by a `Radio` whose own change event made it the selected one. */
  select: (value: string) => void;
  /**
   * Already resolved against the `Field` above the GROUP, which is why a
   * `Radio` reads these here in preference to its own `useField()`. See
   * `Radio.tsx` for why the inner field cannot be consulted first.
   */
  size: Size;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

/**
 * The group a `Radio` belongs to, or `null` outside one.
 *
 * Exported for the same reason `useField()` is: a consumer's own option control
 * should be able to get exactly the wiring the library's `Radio` gets.
 */
export function useRadioGroup(): RadioGroupContextValue | null {
  return useContext(RadioGroupContext);
}

export interface RadioGroupProps
  extends Omit<
    ComponentPropsWithoutRef<'div'>,
    'defaultValue' | 'defaultChecked' | 'onChange' | 'role'
  > {
  /** Controlled. `''` is "nothing selected" — see `defaultValue`. */
  value?: string;
  /**
   * Uncontrolled, and `''` (the default) means nothing is selected.
   *
   * The empty string rather than `undefined` because `undefined` is how
   * `useControllableState` spells "uncontrolled", so a controlled group with
   * no selection has to be able to say so some other way. `''` is that way,
   * in both modes, which is why a `Radio` may not use it as its `value`.
   */
  defaultValue?: string;
  /** Fires in both modes (D-032). Never called with `''`. */
  onValueChange?: (value: string) => void;
  /**
   * Generated from `useId()` when omitted, and that is load-bearing: grouping
   * IS the `name` attribute, so two unnamed groups on one page would be one
   * group, and selecting in either would clear the other (D-039 §5).
   */
  name?: string;
  /** `horizontal` renders a wrapping `Cluster` instead of a `Stack`. */
  orientation?: RadioGroupOrientation;
  /**
   * A step of the space scale, passed to the layout primitive (D-020).
   *
   * **`'3'` and not `'2'`, and it is a conformance floor rather than taste.**
   * The boxes are 16 / 20 / 24, so `sm` and `md` are under WCAG 2.2 SC 2.5.8's
   * 24×24 minimum and pass through the spacing exception instead. At `'2'`
   * (8px) a column of `sm` radios puts centres exactly 24px apart — tangent
   * circles, which is an argument with an auditor rather than a pass. Asserted
   * in tests/visual/harness.spec.ts.
   */
  gap?: Space;
  size?: Size;
  disabled?: boolean;
  required?: boolean;
  /** `Field` has no `invalid` prop, because `error` is its invalid state (D-036). */
  invalid?: boolean;
}

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroup(
  {
    value: valueProp,
    defaultValue = '',
    onValueChange,
    name: nameProp,
    orientation = 'vertical',
    gap = '3',
    size: sizeProp,
    disabled: disabledProp,
    required: requiredProp,
    invalid: invalidProp,
    className,
    children,
    ...rest
  },
  ref,
) {
  // Omit does not delete properties, so a caller who does not typecheck can
  // still hand us a role and turn the radiogroup into something else while
  // keeping its markup and its keyboard behaviour (D-031).
  const { role: _role, ...props } = rest as typeof rest & { role?: string };
  void _role;

  const field = useField();
  const uid = useId();
  const name = nameProp ?? uid;

  /* The one precedence rule, identical in all six controls of this tier:
     explicit prop, then the field, then the default. */
  const size = sizeProp ?? field?.size ?? 'md';
  const invalid = invalidProp ?? field?.invalid ?? false;
  const disabled = disabledProp ?? field?.disabled ?? false;
  const required = requiredProp ?? field?.required ?? false;

  /*
   * THE GROUP HOLDS THE VALUE, NOT THE RADIO, AND THAT IS NOT A STYLE CHOICE.
   *
   * A radio is deselected when a SIBLING is selected, and the deselected radio
   * is told nothing — no change event, no anything. So per-radio state can only
   * ever be right about selection and wrong about deselection, which is the one
   * case radios exist for. The group is the element that knows both.
   */
  const [value, select] = useControllableState<string>({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
    component: 'RadioGroup',
    prop: 'value',
  });

  const context = useMemo<RadioGroupContextValue>(
    () => ({ name, value, select, size, invalid, required, disabled }),
    [name, value, select, size, invalid, required, disabled],
  );

  const layout = {
    className: cx('pp-radio-group', className),
    role: 'radiogroup',
    /* Named by Field's label through aria-labelledby — the exact path Field's
       `group` prop exists for, since a <div> is not a labelable element. */
    'aria-labelledby': field?.control['aria-labelledby'],
    'aria-describedby': field?.control['aria-describedby'],
    'aria-invalid': invalid || undefined,
    // There is no `required` attribute for a div, and the constraint is on the
    // group rather than on any one of its members.
    'aria-required': required || undefined,
    'data-size': size,
    'data-orientation': orientation,
    'data-invalid': invalid || undefined,
    'data-disabled': disabled || undefined,
    'data-required': required || undefined,
    gap,
    ...props,
  } as const;

  const body = <RadioGroupContext.Provider value={context}>{children}</RadioGroupContext.Provider>;

  /* Two elements in the source, one in the DOM. `Cluster` wraps and `Stack`
     does not, and neither needs a container query to decide it (D-022). */
  return orientation === 'horizontal' ? (
    <Cluster ref={ref} align="center" {...layout}>
      {body}
    </Cluster>
  ) : (
    <Stack ref={ref} {...layout}>
      {body}
    </Stack>
  );
});
