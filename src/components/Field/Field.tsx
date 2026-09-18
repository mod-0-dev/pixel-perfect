'use client';

import {
  createContext,
  forwardRef,
  useContext,
  useId,
  useMemo,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';

import { cx } from '../../internal/cx';
import { Label } from '../Label/Label';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';
import type { Size } from '../../types';

/**
 * A labelled control with its description, its error, and the ARIA
 * relationships between them — wired once here instead of eleven times by hand.
 *
 * Sizing contract: fill. Grid, no width declaration, min-inline-size: 0.
 * RSC: client — `useId` and a context provider, both of which need the client.
 *
 * IT DOES NOT CLONE ITS CHILDREN. Controls read the wiring from context
 * (D-033's reasoning, one tier later): cloning requires the control to be the
 * direct child, so it breaks the moment anyone wraps it in a Tooltip, a div or
 * a component of their own, and it silently overwrites props the caller set.
 *
 * Spec: docs/specs/Field.md
 */

export type FieldOrientation = 'vertical' | 'horizontal';

/**
 * Spreadable onto a control element. Every value is a real DOM attribute.
 *
 * Each property is `?: T | undefined` rather than plain `?: T`, because the
 * build runs with `exactOptionalPropertyTypes` and this object is assembled
 * with `undefined` for every value that does not apply — `id` is undefined for
 * a group, `aria-labelledby` for a single control. Writing the undefined out
 * is what lets the object be built in one pass instead of by conditionally
 * adding keys, and React omits an undefined attribute anyway.
 */
export interface FieldControlProps {
  /** The control's id. Absent for a `group` field, which has no single control. */
  id?: string | undefined;
  /** A group's accessible name. Absent for a single labelable control. */
  'aria-labelledby'?: string | undefined;
  /** Description then error, in that order — and only the ones that rendered. */
  'aria-describedby'?: string | undefined;
  'aria-invalid'?: true | undefined;
  required?: boolean | undefined;
  disabled?: boolean | undefined;
}

export interface FieldContextValue {
  /** Spread onto the control element. */
  control: FieldControlProps;
  /**
   * NOT part of `control`, and that is load-bearing: spreading `size` onto a
   * native <input> sets the HTML size attribute, which is a character-width
   * declaration — a component sizing itself, in the one place RULES §1 would
   * never think to look. Controls read it from here and map it themselves.
   */
  size: Size;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

/**
 * The wiring for the control inside a `Field`, or `null` outside one — so every
 * control still works standalone.
 *
 * Exported, because a consumer's own control should get exactly the wiring the
 * library's controls get. Precedence is the same in all of them, for all three
 * shared values:
 *
 *   const size = sizeProp ?? field?.size ?? 'md';
 *
 * Explicit prop, then the field, then the default. Including `disabled={false}`
 * inside a disabled Field, which does enable that control: "explicit wins" is a
 * rule you can hold in your head, "explicit wins except for disabled" is one
 * you have to look up.
 */
export function useField(): FieldContextValue | null {
  return useContext(FieldContext);
}

/**
 * `null`, `undefined`, `false` and `''` are absent. The empty string matters:
 * `error={errors.email}` hands one over for every valid field in most form
 * libraries, and an empty <p> that flips the field to invalid is a field that
 * is wrong and silent about it.
 */
function isPresent(node: ReactNode): boolean {
  return node !== null && node !== undefined && node !== false && node !== '';
}

export interface FieldProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** Required. A field with no label is what this component exists to prevent. */
  label: ReactNode;
  /** The control, or a render prop receiving the props to spread onto one. */
  children: ReactNode | ((control: FieldControlProps) => ReactNode);
  /** Instruction text, above the control. */
  description?: ReactNode;
  /** Non-empty means invalid. There is no separate `invalid` prop to contradict it. */
  error?: ReactNode;
  /** Marks the Label and sets `required` on the control. */
  required?: boolean;
  /** Dims the Label and disables the control. */
  disabled?: boolean;
  size?: Size;
  /** Wraps the Label in VisuallyHidden. Still rendered, still associated. */
  labelHidden?: boolean;
  /** `horizontal` puts the control first, beside the label — the checkbox arrangement. */
  orientation?: FieldOrientation;
  /** The control is a group (RadioGroup), not a labelable element. */
  group?: boolean;
  /**
   * The control's id, when it has to be a known value — an error summary that
   * links to `#email`, or a form rendered without JS. Defaults to one derived
   * from `useId()`.
   *
   * It is `controlId` and not `id` deliberately: `id` spreads onto the root
   * like it does on every other component in the library (RULES §5.3), and a
   * prop that lands somewhere other than where it says is worse than no prop.
   */
  controlId?: string;
}

export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field(
  {
    label,
    children,
    description,
    error,
    required = false,
    disabled = false,
    size = 'md',
    labelHidden = false,
    orientation = 'vertical',
    group = false,
    controlId: controlIdProp,
    className,
    ...props
  },
  ref,
) {
  const uid = useId();
  /*
   * A caller cannot do this through the render prop. `<input {...control}
   * id="email" />` overrides the id the control receives but not the `for` on
   * the label that Field has already rendered, so the label ends up pointing at
   * nothing and the control ends up with no accessible name — silently. Found
   * by a test written to prove the spec's §10 escape hatch worked; it did not.
   */
  const controlId = controlIdProp ?? `${uid}-control`;
  const labelId = `${uid}-label`;
  const descriptionId = `${uid}-description`;
  const errorId = `${uid}-error`;

  const hasDescription = isPresent(description);
  const invalid = isPresent(error);

  /*
   * Built from what ACTUALLY rendered. A token pointing at an element that does
   * not exist is ignored silently by assistive tech, so an optimistically
   * assembled list fails invisibly in testing and totally in use. `cx` returns
   * undefined for an empty join, which is exactly the semantics wanted: no
   * description and no error means no attribute at all.
   */
  const describedBy = cx(hasDescription && descriptionId, invalid && errorId);

  const context = useMemo<FieldContextValue>(
    () => ({
      control: {
        id: group ? undefined : controlId,
        'aria-labelledby': group ? labelId : undefined,
        'aria-describedby': describedBy,
        'aria-invalid': invalid || undefined,
        required: required || undefined,
        disabled: disabled || undefined,
      },
      size,
      invalid,
      required,
      disabled,
    }),
    [group, controlId, labelId, describedBy, invalid, required, disabled, size],
  );

  const labelNode = (
    <Label
      id={labelId}
      // A group is not a labelable element, so there is nothing for `for` to
      // point at. The label stays a real <label> and the group references it
      // with aria-labelledby instead.
      htmlFor={group ? undefined : controlId}
      className="pp-field__label"
      size={size}
      required={required}
      disabled={disabled}
      invalid={invalid}
    >
      {label}
    </Label>
  );

  // `asChild`, so the label element itself is hidden rather than a wrapper span
  // around it. Hidden, not removed: the element, its `for` and the accessible
  // name are all still there.
  const labelSlot = labelHidden ? <VisuallyHidden asChild>{labelNode}</VisuallyHidden> : labelNode;

  const descriptionSlot = hasDescription ? (
    <p className="pp-field__description" id={descriptionId}>
      {description}
    </p>
  ) : null;

  const errorSlot = invalid ? (
    <p className="pp-field__error" id={errorId} data-pp-tone="danger">
      {error}
    </p>
  ) : null;

  const controlSlot = (
    <div className="pp-field__control">
      {typeof children === 'function' ? children(context.control) : children}
    </div>
  );

  return (
    <div
      ref={ref}
      className={cx('pp-field', className)}
      data-size={size}
      data-orientation={orientation}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
      data-required={required || undefined}
      {...props}
    >
      <FieldContext.Provider value={context}>
        {/*
         * Source order, not just grid placement. In the horizontal arrangement
         * the control genuinely comes first, so reading order matches visual
         * order without anyone relying on `order` to fix it up.
         */}
        {orientation === 'horizontal' ? (
          <>
            {controlSlot}
            {labelSlot}
            {descriptionSlot}
            {errorSlot}
          </>
        ) : (
          <>
            {labelSlot}
            {descriptionSlot}
            {controlSlot}
            {errorSlot}
          </>
        )}
      </FieldContext.Provider>
    </div>
  );
});
