'use client';

import { forwardRef, type ComponentPropsWithoutRef, type CSSProperties } from 'react';

import { cx } from '../../internal/cx';
import { useField } from '../Field/Field';
import { Icon } from '../Icon/Icon';
import type { Size } from '../../types';

/**
 * The native `<select>` on the shared control surface, with our chevron.
 *
 * Sizing contract: fill. RSC: client — `useField()` is a context read.
 *
 * THE PLATFORM POPUP IS KEPT, AND THAT IS THE COMPONENT'S WHOLE ARGUMENT.
 * `appearance: none` repaints the closed box and nothing else, so the open list
 * stays the operating system's: a wheel on iOS, a listbox on desktop, correct
 * with a screen reader and in a right-to-left locale without us writing a line.
 * The custom listbox — typeahead, async options, multi-select — is `Combobox`
 * (4.11), built on the overlay foundation rather than on this.
 *
 * Spec: docs/specs/tier-3c-inputs.md §3.13
 */

export interface SelectProps
  extends Omit<
    ComponentPropsWithoutRef<'select'>,
    'size' | 'multiple' | 'className' | 'style' | 'placeholder'
  > {
  /**
   * The CONTROL scale (D-028), not an HTML attribute. `<select>` has a `size`
   * attribute too, and it means "show this many rows at once" — setting it
   * turns the control into a list box, which is a different widget with a
   * different keyboard model. Never forwarded, asserted in a test.
   */
  size?: Size;
  /**
   * Renders a disabled, hidden `<option value="">` FIRST, and makes it the
   * initial selection.
   *
   * The last clause is work rather than a description. The HTML "ask for a
   * reset" algorithm selects the first option *that is not disabled*, so a
   * disabled placeholder is skipped and the caller sees option two — the
   * behaviour the spec asked for cannot be had from the three attributes it
   * named. So the component seeds `defaultValue=""` when the caller has given
   * neither `value` nor `defaultValue`, which selects it through the `value`
   * setter, where no such exclusion exists (D-049 §1).
   */
  placeholder?: string;
  /**
   * `never`, not absent: a multi-select has a different keyboard model and a
   * different visual, and it is `Combobox` (4.11). Stripped at runtime as well
   * as in the type, for the reason D-031 gives — `Omit` does not delete a
   * property, so a caller who does not typecheck can still hand us one.
   */
  multiple?: never;
  /**
   * `Field` has no `invalid` prop, because `error` is its invalid state and a
   * second prop could only contradict it (D-036). A standalone control has no
   * `error`, so it needs this one.
   */
  invalid?: boolean;
  /** Lands on the root, which is the box. The control gets everything else (D-039 §1). */
  className?: string;
  /** Lands on the root. See `className`. */
  style?: CSSProperties;
}

/**
 * The chevron, as markup rather than as a `mask-image` data URI (D-039 §3).
 * `1em` of the control's own font size, because the root declares `font-size`
 * and `Icon` defaults to `1em` — so the glyph tracks the size step without this
 * file knowing the step's name.
 */
function Chevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    size: sizeProp,
    placeholder,
    invalid: invalidProp,
    disabled: disabledProp,
    required: requiredProp,
    className,
    style,
    children,
    ...rest
  },
  ref,
) {
  /*
   * `multiple` is pulled out because the type says never and this is what makes
   * it true for the caller who ignored the type.
   *
   * `value` and `defaultValue` are pulled out for a different reason: they are
   * written back onto the element BELOW THE SPREAD ORDER, so the seed in
   * `defaultValue` cannot be undone by a caller passing the prop explicitly as
   * `undefined`. `<Select placeholder="…" defaultValue={maybeUndefined} />` is
   * an ordinary thing to write, the key exists, and left in the spread it would
   * overwrite the seed with `undefined` and hand the caller option two — which
   * is D-049 §1's bug arriving through a second door.
   */
  const {
    multiple: _multiple,
    value,
    defaultValue,
    ...props
  } = rest as typeof rest & { multiple?: boolean };
  void _multiple;

  const field = useField();

  /* The one precedence rule, identical in all six controls of this tier:
     explicit prop, then the field, then the default. Including
     `disabled={false}` inside a disabled Field, which does enable this one. */
  const size = sizeProp ?? field?.size ?? 'md';
  const invalid = invalidProp ?? field?.invalid ?? false;
  const disabled = disabledProp ?? field?.disabled ?? false;
  const required = requiredProp ?? field?.required ?? false;

  /*
   * Seeded ONLY when the caller has given neither, because React errors on a
   * select that has both `value` and `defaultValue`. With a `value` the caller
   * is controlled and the placeholder is theirs to select; with a
   * `defaultValue` they have already said which option starts selected.
   */
  const seedsPlaceholder =
    placeholder !== undefined && value === undefined && defaultValue === undefined;

  /*
   * EMITTED ONLY WHEN REACT ACTUALLY KNOWS, AND OMITTED RATHER THAN GUESSED —
   * D-047 §2's shape, with a different cause (D-049 §2).
   *
   * Spec §2 rules that the text controls pass `value` straight to the DOM and
   * hold no state, so an uncontrolled select's selection lives in the DOM and
   * changes without this render being told. A `data-placeholder` written from
   * the initial value would be right until the first change and wrong
   * afterwards, and it would also be wrong after a `form.reset()` or a write
   * through the ref — the cases a consumer is most likely to hit and least
   * likely to suspect.
   *
   * So the attribute is for consumers and describes only what we know, and the
   * STYLESHEET paints from `:has(option[data-pp-placeholder]:checked)` instead,
   * which is the platform's own state and is correct in every one of those
   * cases. Proven by the only test that can tell the two mechanisms apart: an
   * uncontrolled select, whose placeholder is muted with no attribute present.
   */
  const placeholderSelected =
    placeholder !== undefined && value !== undefined ? value === '' : undefined;

  return (
    /* The root is the box: className, style and the state attributes. The tone
       context lives here rather than on the control, because D-007 works by
       inheritance and the control reads --pp-tone-* from it. */
    <span
      className={cx('pp-select', className)}
      style={style}
      data-size={size}
      data-placeholder={placeholderSelected || undefined}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
      data-pp-tone={invalid ? 'danger' : undefined}
    >
      {/* The control is the element: the ref, and every remaining prop. `id`
          and `aria-describedby` come from the field and are written BEFORE the
          spread, so an explicit prop still wins — the same precedence as above,
          expressed as source order. */}
      <select
        ref={ref}
        className="pp-select__input"
        id={field?.control.id}
        aria-describedby={field?.control['aria-describedby']}
        aria-invalid={invalid || undefined}
        required={required || undefined}
        disabled={disabled || undefined}
        {...props}
        value={value}
        defaultValue={seedsPlaceholder ? '' : defaultValue}
      >
        {placeholder !== undefined && (
          /*
           * `disabled` so it cannot be chosen again, `hidden` so it is not
           * drawn in the open list, and `data-pp-placeholder` so the stylesheet
           * matches the option WE rendered rather than any option that happens
           * to carry an empty value — a caller's own `<option value="">None</option>`
           * is a real choice and must not be painted as an absent one.
           */
          <option value="" disabled hidden data-pp-placeholder>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      {/* aria-hidden through `decorative`, so the accessibility tree sees one
          combobox, and `pointer-events: none` in CSS so a click on the chevron
          still opens the platform popup. */}
      <Icon decorative className="pp-select__indicator">
        <Chevron />
      </Icon>
    </span>
  );
});
