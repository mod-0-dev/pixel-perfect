'use client';

import {
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type PointerEvent,
} from 'react';

import { cx } from '../../internal/cx';
import { numberIO, snapToRange, type NumericRange } from '../../internal/number';
import { mergeRefs } from '../../internal/refs';
import { useControllableState } from '../../internal/useControllableState';
import { useField } from '../Field/Field';
import type { Size } from '../../types';

/**
 * A two-thumb range control on the numeric contract of Tier 3D §1: two native
 * `<input type="range">` elements stacked in one cell, each spanning the full
 * `min`–`max`.
 *
 * Sizing contract: fill. RSC: client — useField(), state, pointer handlers.
 *
 * THE INPUTS ARE TRANSPARENT AND THE THUMBS YOU SEE ARE OURS (spec §1). That
 * one move dissolves the blocker that deferred this component from 3.15: a
 * transparent input's `:focus-visible` outline is transparent with it, so
 * nothing is suppressed — no `outline: none`, no `outline-width: 0` — and the
 * ring is drawn on our thumb span by a sibling selector. It is also the first
 * slider thumb in the library that a test can measure (D-052 §4 found the
 * platform's is not observable from script).
 *
 * WHAT IS STILL THE PLATFORM'S: the drag on a thumb, pointer capture, touch,
 * every keyboard row, `role="slider"` with its value attributes, and RTL. The
 * native thumbs are invisible but sized to ours and given `pointer-events:
 * auto` under an input that has none, so a press on a visible thumb lands on
 * the native one beneath it.
 *
 * WHAT IS OURS, AND WHY (spec §2): a press on BARE TRACK. With both inputs
 * `pointer-events: none`, a track press reaches no input — it reaches the
 * root, which maps it to a value, moves the nearer thumb, focuses that input
 * and captures the pointer so the drag continues. It is the one gesture the
 * stacking removed, and the alternative — a track that does nothing — is a
 * regression from every single-thumb slider, including ours.
 *
 * Spec: docs/specs/RangeSlider.md
 */

type Thumb = 'start' | 'end';

export interface RangeSliderProps
  extends Omit<ComponentPropsWithoutRef<'span'>, 'defaultValue'> {
  /** Controlled. Snapped and ordered on the way in (spec §4). */
  value?: readonly [number, number];
  /** Uncontrolled seed. Defaults to `[min, max]` — the whole range, which is what "no filter yet" means. */
  defaultValue?: readonly [number, number];
  /** Fires CONTINUOUSLY — every input event during a drag. Always ordered. */
  onValueChange?: (value: [number, number]) => void;
  /** Fires ONCE, on release, key release or blur of either thumb, and only on a change. */
  onValueCommit?: (value: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  /** For `aria-valuetext` only, per thumb — this control displays no text (3D §4). */
  locale?: string;
  /** Passed to `Intl.NumberFormat(locale, …)`. Does nothing without `locale`. */
  formatOptions?: Intl.NumberFormatOptions;
  /** Each input's `aria-label`. The GROUP is named by the field (spec §5). */
  thumbLabels?: readonly [string, string];
  /** Set on both inputs, so `FormData.getAll(name)` is `[start, end]` (spec §7). */
  name?: string;
  /** The control scale (D-028). Thumb 16 / 20 / 24, as `Slider`. */
  size?: Size;
  /** `Field` has no `invalid` prop, because `error` is its invalid state (D-036). */
  invalid?: boolean;
  /** Both inputs. */
  disabled?: boolean;
}

const DEFAULT_LABELS: readonly [string, string] = ['Minimum', 'Maximum'];

/** Snap both ends and put them in order. Every tuple that reaches state or a callback has been through this. */
function normalise(pair: readonly [number, number], range: NumericRange): [number, number] {
  const a = snapToRange(pair[0], range);
  const b = snapToRange(pair[1], range);
  return a <= b ? [a, b] : [b, a];
}

export const RangeSlider = forwardRef<HTMLSpanElement, RangeSliderProps>(function RangeSlider(
  {
    value: valueProp,
    defaultValue,
    onValueChange,
    onValueCommit,
    min = 0,
    max = 100,
    step = 1,
    locale,
    formatOptions,
    thumbLabels = DEFAULT_LABELS,
    name,
    size: sizeProp,
    invalid: invalidProp,
    disabled: disabledProp,
    className,
    style,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture,
    ...props
  },
  ref,
) {
  const field = useField();

  /* The one precedence rule, identical in every control since 3C: explicit
     prop, then the field, then the default. */
  const size = sizeProp ?? field?.size ?? 'md';
  const invalid = invalidProp ?? field?.invalid ?? false;
  const disabled = disabledProp ?? field?.disabled ?? false;

  const range = useMemo<NumericRange>(() => ({ min, max, step }), [min, max, step]);

  /*
   * `[min, max]` rather than a midpoint pair: the whole range selected is what
   * "no filter yet" means, and it is the only default that needs no argument
   * about where two thumbs should sit (spec §4).
   */
  const seed = useMemo(() => normalise(defaultValue ?? [min, max], range), [defaultValue, min, max, range]);

  const [value, setValue] = useControllableState<[number, number]>({
    value: valueProp === undefined ? undefined : normalise(valueProp, range),
    defaultValue: seed,
    onChange: onValueChange,
    component: 'RangeSlider',
    prop: 'value',
  });
  const [start, end] = value;

  const io = useMemo(() => numberIO(locale, formatOptions), [locale, formatOptions]);

  /*
   * THE CLAMP IS ON THE VALUE, NOT ON THE ELEMENT (spec §3). Each input keeps
   * the full `min`/`max` — narrowing the start input's `max` to the end's
   * value would rescale its thumb travel and break the alignment with our
   * thumb. A change that would cross is clamped before it reaches state, and
   * one that changes nothing is dropped: React then restores the controlled
   * input to the value it was given, which D-058's addendum measured.
   */
  const moveThumb = useCallback(
    (thumb: Thumb, raw: number) => {
      const next: [number, number] =
        thumb === 'start' ? [Math.min(raw, end), end] : [start, Math.max(raw, start)];
      if (next[0] === start && next[1] === end) return;
      setValue(next);
    },
    [start, end, setValue],
  );

  /*
   * Only a CHANGE is committed — `Slider`'s guard, for the same reason: a
   * consumer who wired this to a request would otherwise send one for every
   * range a user tabbed through.
   */
  const lastCommitted = useRef<[number, number]>(value);
  const commit = useCallback(() => {
    const [a, b] = lastCommitted.current;
    if (a === start && b === end) return;
    lastCommitted.current = [start, end];
    onValueCommit?.([start, end]);
  }, [start, end, onValueCommit]);

  /*
   * A TRACK PRESS (spec §2). The inputs take no pointer events, so a press on
   * bare track arrives here with the root as its target. A press on a thumb
   * lands on the native thumb beneath it and never reaches this handler as a
   * root-targeted event — the `HTMLInputElement` check is what tells the two
   * apart.
   */
  const rootRef = useRef<HTMLSpanElement>(null);
  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const dragging = useRef<Thumb | null>(null);
  const setRoot = useMemo(() => mergeRefs(ref, rootRef), [ref]);

  const valueAt = useCallback(
    (clientX: number): number => {
      const root = rootRef.current;
      const thumb = thumbRef.current;
      if (!root || !thumb) return start;
      const rect = root.getBoundingClientRect();
      const thumbSize = thumb.getBoundingClientRect().width;
      /* The platform's own formula, inset by half a thumb at each end, so a
         value maps to the same pixel the native thumb sits at (spec §1). */
      const travel = rect.width - thumbSize;
      let fraction = travel > 0 ? (clientX - rect.left - thumbSize / 2) / travel : 0;
      /* Read at event time, never at module scope (RULES §7). A native range
         input reverses in RTL, so the mapping does too. */
      if (getComputedStyle(root).direction === 'rtl') fraction = 1 - fraction;
      fraction = Math.min(1, Math.max(0, fraction));
      return snapToRange(min + fraction * (max - min), range);
    },
    [start, min, max, range],
  );

  const handlePointerDown = (event: PointerEvent<HTMLSpanElement>) => {
    onPointerDown?.(event);
    if (event.defaultPrevented || disabled || event.button !== 0) return;
    if (event.target instanceof HTMLInputElement) return;

    const pressed = valueAt(event.clientX);
    /*
     * The NEARER thumb. On a tie the press's side decides, which is what
     * makes a coincident pair separable: a press beyond them on either side
     * takes the thumb that can move that way (spec §2, §3).
     */
    const toStart = Math.abs(pressed - start);
    const toEnd = Math.abs(pressed - end);
    const thumb: Thumb = toStart < toEnd ? 'start' : toEnd < toStart ? 'end' : pressed < start ? 'start' : 'end';

    dragging.current = thumb;
    moveThumb(thumb, pressed);
    (thumb === 'start' ? startRef : endRef).current?.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    /* The focus has already moved where it should; the default would move it
       again, to the root, and start a text selection on the way. */
    event.preventDefault();
  };

  const handlePointerMove = (event: PointerEvent<HTMLSpanElement>) => {
    onPointerMove?.(event);
    if (dragging.current === null) return;
    moveThumb(dragging.current, valueAt(event.clientX));
  };

  const release = () => {
    if (dragging.current === null) return;
    dragging.current = null;
    commit();
  };

  /*
   * THE STACKING ORDER WHEN THE THUMBS MEET (spec §3). Two coincident inputs
   * cover each other, and only the top one can be grabbed — so the top one is
   * the one that can move toward the open side: the start input when the pair
   * sits above the midpoint, the end input below it. Applied to the pair's
   * own midpoint rather than only to the coincident case, so a partially
   * overlapping pair is resolved the same way; when the thumbs are clear of
   * each other the order is immaterial.
   */
  const thumbTop: Thumb = (start + end) / 2 > (min + max) / 2 ? 'start' : 'end';

  /*
   * THE TWO FRACTIONS, PRIVATE AND ALWAYS WRITTEN (D-024). Unitless, so the
   * fill can multiply by `100%` and the thumbs by `100% - thumb`. Never
   * conditional, because custom properties inherit and a nested slider would
   * otherwise draw its ancestor's range.
   */
  const span = max - min;
  const fraction = (v: number) => (span === 0 ? 0 : Math.min(1, Math.max(0, (v - min) / span)));

  const control = (thumb: Thumb) => {
    const own = thumb === 'start' ? start : end;
    return (
      <input
        ref={thumb === 'start' ? startRef : endRef}
        className="pp-range-slider__control"
        data-thumb={thumb}
        type="range"
        min={min}
        max={max}
        step={step}
        value={own}
        name={name}
        aria-label={thumb === 'start' ? thumbLabels[0] : thumbLabels[1]}
        /* Both thumbs: the description and the error are about the range, and
           a user landing on either should hear them (spec §Accessibility). */
        aria-describedby={field?.control['aria-describedby']}
        aria-valuetext={io.formatted ? io.format(own) : undefined}
        aria-invalid={invalid || undefined}
        disabled={disabled || undefined}
        onChange={(event) => moveThumb(thumb, Number(event.target.value))}
        onPointerUp={commit}
        onKeyUp={commit}
        onBlur={commit}
      />
    );
  };

  return (
    /*
     * The root is the box, the group, and the prop target. Two inputs and no
     * reason to prefer one, so `ref` and the rest land here — RULES §5.1's
     * default rather than `Slider`'s D-039 §1 exception.
     */
    <span
      ref={setRoot}
      className={cx('pp-range-slider', className)}
      style={
        {
          ...style,
          '--_pp-range-slider-start': String(fraction(start)),
          '--_pp-range-slider-end': String(fraction(end)),
        } as CSSProperties
      }
      role="group"
      aria-labelledby={field?.control['aria-labelledby']}
      data-size={size}
      data-thumb-top={thumbTop}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
      data-pp-tone={invalid ? 'danger' : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        release();
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        release();
      }}
      onLostPointerCapture={(event) => {
        onLostPointerCapture?.(event);
        release();
      }}
      {...props}
    >
      {/* Ours, as in Slider. The fill is grid COLUMN TWO of
          `start (end − start) 1fr`, so it follows the inline axis and RTL
          needs nothing declared (D-052 §1). */}
      <span className="pp-range-slider__track" aria-hidden="true">
        <span className="pp-range-slider__fill" />
      </span>
      {/*
       * THE INPUTS PRECEDE THE THUMBS IN SOURCE ORDER because the ring
       * selector is a subsequent-sibling combinator — not `:has()`, which
       * jsdom does not implement, so a unit test could not see it.
       */}
      {control('start')}
      {control('end')}
      <span ref={thumbRef} className="pp-range-slider__thumb" data-thumb="start" aria-hidden="true" />
      <span className="pp-range-slider__thumb" data-thumb="end" aria-hidden="true" />
    </span>
  );
});
