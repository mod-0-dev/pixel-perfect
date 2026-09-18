'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
} from 'react';

import { cx } from '../../internal/cx';
import { mergeRefs } from '../../internal/refs';
import { useField } from '../Field/Field';
import type { Size } from '../../types';

/**
 * A multi-line text control on the same surface as `Input`, with opt-in
 * auto-resize. Not a rich-text editor and not a code editor — 5.12 is
 * `CodeBlock`, and it is read-only.
 *
 * Sizing contract: fill, on the inline axis, with the same grid root `Input`
 * needs. A `<textarea>` measured 182px inside a 600px parent for the reason an
 * `<input>` measured 185px: form controls carry an intrinsic inline size, so
 * RULES §1's mechanism — "a block element with no width declaration already
 * fills its parent" — is false for them (D-040). No width is declared anywhere;
 * the control stretches because it is a grid item.
 *
 * The BLOCK axis is a different question and RULES §1 does not govern it. `rows`
 * is kept and exposed, and `autoResize` writes `block-size` from JavaScript —
 * `Skeleton`'s `lines` is the precedent (D-025).
 *
 * RSC: client — `useField()` is a context read, and `autoResize` needs an effect.
 *
 * Spec: docs/specs/tier-3c-inputs.md §3.9
 */

export interface TextareaProps
  extends Omit<ComponentPropsWithoutRef<'textarea'>, 'size' | 'className' | 'style'> {
  /** The control scale (D-028). Font size and padding only — never a height. */
  size?: Size;
  /**
   * Native, and the floor `autoResize` never shrinks below. Kept as a prop
   * because the block axis is not what RULES §1 governs (spec §10).
   */
  rows?: number;
  /**
   * Grows with content on input, floored at `rows`. Opt-in, and it forces
   * `resize: none` — a drag handle and a JS-written height fight each other,
   * and the user loses.
   *
   * CSS `field-sizing: content` is deliberately not used even where supported:
   * shipping both means two resize behaviours depending on the browser, and the
   * one that is easy to test is the one that is not running for the user
   * (spec §10).
   */
  autoResize?: boolean;
  /**
   * No `'horizontal'`, and no `'both'`. A user-widened textarea overflows the
   * `Field` grid column and takes the layout with it — the one thing the sizing
   * contract exists to prevent, handed to the end user as a drag handle.
   */
  resize?: 'none' | 'vertical';
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

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    size: sizeProp,
    rows = 3,
    autoResize = false,
    resize = 'vertical',
    invalid: invalidProp,
    disabled: disabledProp,
    required: requiredProp,
    readOnly = false,
    className,
    style,
    onInput,
    value,
    ...props
  },
  ref,
) {
  const field = useField();
  const controlRef = useRef<HTMLTextAreaElement>(null);

  /* The one precedence rule, identical in all six controls of this tier:
     explicit prop, then the field, then the default. Including
     `disabled={false}` inside a disabled Field, which does enable this one. */
  const size = sizeProp ?? field?.size ?? 'md';
  const invalid = invalidProp ?? field?.invalid ?? false;
  const disabled = disabledProp ?? field?.disabled ?? false;
  const required = requiredProp ?? field?.required ?? false;

  /**
   * THE RESET TO `auto` IS NOT TIDINESS, IT IS THE MEASUREMENT.
   *
   * `scrollHeight` is max(content height, client height), so measuring against
   * a height we wrote ourselves can only ratchet upward — the control would
   * grow with the text and never shrink when it is deleted.
   *
   * Resetting first is also where the `rows` floor comes from, for free: with
   * no block-size, the element's own height is whatever `rows` says, and
   * `scrollHeight` cannot report less than that. No arithmetic, no second
   * source of truth for the minimum, nothing to drift from the attribute.
   *
   * Borders are added back because the reset sets `box-sizing: border-box`
   * globally and `scrollHeight` excludes them; without this the control loses
   * two pixels on every measurement and creeps shut.
   *
   * They are measured as offsetHeight − clientHeight rather than read off
   * getComputedStyle: that difference IS the border box minus the padding box,
   * it needs no parsing that can return NaN for a logical property an engine
   * spells differently, and it costs one layout read instead of two.
   */
  const measure = useCallback(() => {
    const el = controlRef.current;
    if (!el) return;
    el.style.blockSize = 'auto';
    const borders = el.offsetHeight - el.clientHeight;
    el.style.blockSize = `${el.scrollHeight + borders}px`;
  }, []);

  useEffect(() => {
    const el = controlRef.current;
    if (!el) return;

    /* Turning it off has to hand the height back, or the control keeps the last
       size JavaScript wrote for the rest of the session. */
    if (!autoResize) {
      el.style.blockSize = '';
      return;
    }

    measure();

    /*
     * A width change reflows the text and so changes the height it needs —
     * which is the container-query story for this component, and why the spec
     * says re-measure on resize rather than on input alone.
     *
     * Only the WIDTH, though. Writing block-size is itself a resize, so
     * observing height would re-enter this callback forever.
     */
    let lastWidth = el.getBoundingClientRect().width;
    const observer = new ResizeObserver(() => {
      const width = el.getBoundingClientRect().width;
      if (width === lastWidth) return;
      lastWidth = width;
      measure();
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, [autoResize, measure]);

  /* A controlled value can change without anyone typing — a form reset, a
     draft loaded from the server — and `onInput` does not fire for those. */
  useEffect(() => {
    if (autoResize) measure();
  }, [autoResize, measure, value, rows]);

  /* Typed from React's own definition rather than spelled out: `onInput` on a
     textarea takes an InputEvent, not the FormEvent a first version guessed at,
     and deriving it means this cannot drift from the prop it chains to. */
  const handleInput: ComponentPropsWithoutRef<'textarea'>['onInput'] = (event) => {
    if (autoResize) measure();
    onInput?.(event);
  };

  return (
    /* The root is the box: className, style and the state attributes. The tone
       context lives here rather than on the control, because D-007 works by
       inheritance and the control reads --pp-tone-border from it. */
    <span
      className={cx('pp-textarea', className)}
      style={style}
      data-size={size}
      data-resize={resize}
      data-auto-resize={autoResize || undefined}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-pp-tone={invalid ? 'danger' : undefined}
    >
      {/* The control is the element: the ref, and every remaining prop. `id` and
          `aria-describedby` are written BEFORE the spread, so an explicit prop
          still wins — the same precedence as above, expressed as source order. */}
      <textarea
        ref={mergeRefs(ref, controlRef)}
        className="pp-textarea__control"
        rows={rows}
        id={field?.control.id}
        aria-describedby={field?.control['aria-describedby']}
        aria-invalid={invalid || undefined}
        required={required || undefined}
        disabled={disabled || undefined}
        readOnly={readOnly || undefined}
        value={value}
        onInput={handleInput}
        {...props}
      />
    </span>
  );
});
