'use client';

import * as RadixPopover from '@radix-ui/react-popover';
import {
  forwardRef,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';

import { cx } from '../../internal/cx';
import { parseDate, toUTC } from '../../internal/date';
import { directionOf, resolveSide } from '../../internal/overlay/side';
import { resolveSpace } from '../../internal/overlay/space';
import { useInheritedTheme } from '../../internal/overlay/theme';
import { mergeRefs } from '../../internal/refs';
import { useControllableState } from '../../internal/useControllableState';
import type { Size } from '../../types';
import { Calendar } from '../Calendar/Calendar';
import { useField } from '../Field/Field';

/**
 * A date typed or picked: Input's box with a text field and a calendar
 * button, and Calendar in a Popover behind the button.
 *
 * INPUT'S BOX BY THE TWO-CLASS CONTRACT (spec §1): the root carries
 * `pp-input`, so Input.css draws the height, the edge, the surface and the
 * states; this file adds the button in the box, Combobox's device.
 *
 * TYPED TEXT IS PARSED ON COMMIT, IN THE LOCALE'S ORDER (spec §2): what
 * `Intl` writes for the locale is what the field reads back.
 *
 * Sizing contract: fill (Input's). RSC: client. Spec: docs/specs/DatePicker.md
 */

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function partsOrder(locale: string | undefined): Array<'year' | 'month' | 'day'> {
  const parts = new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }).formatToParts(
    new Date(Date.UTC(2001, 1, 3)),
  );
  const order = parts.map((p) => p.type).filter((t): t is 'year' | 'month' | 'day' => t === 'year' || t === 'month' || t === 'day');
  return order.length === 3 ? order : ['year', 'month', 'day'];
}

/** The locale's numeric form: `09/28/2026`, `28.09.2026`. */
export function formatDate(iso: string, locale?: string): string {
  const d = parseDate(iso);
  if (!d) return '';
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }).format(toUTC(d));
}

/** `YYYY-MM-DD` as is; else three numbers in the locale's order. `undefined` when it is not a date. */
export function parseTypedDate(text: string, locale?: string): string | undefined {
  const trimmed = text.trim();
  if (ISO.test(trimmed)) return parseDate(trimmed) ? trimmed : undefined;
  const numbers = trimmed.match(/\d+/g);
  if (!numbers || numbers.length !== 3) return undefined;
  const order = partsOrder(locale);
  const values: Record<'year' | 'month' | 'day', number> = { year: 0, month: 0, day: 0 };
  order.forEach((part, i) => {
    values[part] = Number(numbers[i]);
  });
  if (numbers[order.indexOf('year')]!.length <= 2) values.year += 2000;
  const iso = `${String(values.year).padStart(4, '0')}-${String(values.month).padStart(2, '0')}-${String(values.day).padStart(2, '0')}`;
  return parseDate(iso) ? iso : undefined;
}

/** The locale's pattern as a placeholder: `MM/DD/YYYY`, `DD.MM.YYYY`. */
export function datePattern(locale?: string): string {
  const parts = new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }).formatToParts(
    new Date(Date.UTC(2001, 1, 3)),
  );
  return parts.map((p) => (p.type === 'year' ? 'YYYY' : p.type === 'month' ? 'MM' : p.type === 'day' ? 'DD' : p.value)).join('');
}

export interface DatePickerProps
  extends Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'value' | 'defaultValue' | 'size' | 'className' | 'style' | 'onChange'> {
  /** `YYYY-MM-DD`, or `undefined` for none. */
  value?: string | undefined;
  defaultValue?: string | undefined;
  onValueChange?: (value: string | undefined) => void;
  locale?: string;
  min?: string;
  max?: string;
  isDateDisabled?: (iso: string) => boolean;
  today?: string;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  format?: (iso: string, locale?: string) => string;
  parse?: (text: string, locale?: string) => string | undefined;
  size?: Size;
  invalid?: boolean;
  /** The button's and the dialog's name. */
  toggleLabel?: string;
  /** Land on the root, which is the box (D-039 §1). */
  className?: string;
  style?: CSSProperties;
}

function CalendarGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(
  {
    value: valueProp,
    defaultValue,
    onValueChange,
    locale,
    min,
    max,
    isDateDisabled,
    today,
    weekStartsOn,
    format = formatDate,
    parse = parseTypedDate,
    size: sizeProp,
    invalid: invalidProp,
    disabled: disabledProp,
    required: requiredProp,
    readOnly = false,
    toggleLabel = 'Choose date',
    placeholder,
    name,
    className,
    style,
    onBlur,
    onKeyDown,
    ...props
  },
  ref,
) {
  const field = useField();
  const size = sizeProp ?? field?.size ?? 'md';
  const disabled = disabledProp ?? field?.disabled ?? false;
  const required = requiredProp ?? field?.required ?? false;

  const [value, setValue] = useControllableState<string | undefined>({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
    component: 'DatePicker',
    prop: 'value',
  });
  const [open, setOpen] = useState(false);
  /* THE TEXT IS THE VALUE UNLESS THE USER IS MID-EDIT (D-091 §2): a draft
     holds what is typed until commit; committing drops the draft, so the
     field shows whatever the value became — the new date when the owner
     took it, the old one when a controlled owner refused it. A draft that
     did not parse stays, marked invalid, until it is edited or cleared. */
  const [draft, setDraft] = useState<string | null>(null);
  const [unparsable, setUnparsable] = useState(false);
  const text = draft ?? (value ? format(value, locale) : '');
  const invalid = (invalidProp ?? field?.invalid ?? false) || unparsable;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const setInputRef = useMemo(() => mergeRefs<HTMLInputElement>(ref, inputRef), [ref]);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  const commit = () => {
    if (draft === null) return;
    const trimmed = draft.trim();
    if (trimmed === '') {
      setUnparsable(false);
      setDraft(null);
      if (value !== undefined) setValue(undefined);
      return;
    }
    const iso = parse(trimmed, locale);
    if (!iso) {
      setUnparsable(true);
      return;
    }
    setUnparsable(false);
    setDraft(null);
    if (iso !== value) setValue(iso);
  };

  const pick = (iso: string) => {
    setDraft(null);
    setUnparsable(false);
    setValue(iso);
    setOpen(false);
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    } else if (event.key === 'ArrowDown' && !disabled && !readOnly) {
      event.preventDefault();
      setOpen(true);
    }
  };

  const hint = placeholder ?? datePattern(locale);

  return (
    <RadixPopover.Root open={open} onOpenChange={setOpen} modal={false}>
      <span
        className={cx('pp-input', 'pp-date-picker', className)}
        style={style}
        data-size={size}
        data-state={open ? 'open' : 'closed'}
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        data-readonly={readOnly || undefined}
        data-pp-tone={invalid ? 'danger' : undefined}
      >
        <RadixPopover.Anchor asChild>
          <div ref={boxRef} className="pp-date-picker__box">
            <input
              ref={setInputRef}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              className="pp-date-picker__control"
              id={field?.control.id}
              aria-describedby={field?.control['aria-describedby']}
              aria-invalid={invalid || undefined}
              required={required || undefined}
              disabled={disabled || undefined}
              readOnly={readOnly || undefined}
              placeholder={hint}
              value={text}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setDraft(event.target.value);
                setUnparsable(false);
              }}
              onBlur={(event) => {
                onBlur?.(event);
                commit();
              }}
              onKeyDown={onInputKeyDown}
              {...props}
            />
            <RadixPopover.Trigger asChild>
              <button
                ref={toggleRef}
                type="button"
                className="pp-date-picker__toggle"
                aria-label={toggleLabel}
                aria-haspopup="dialog"
                disabled={disabled || readOnly}
                tabIndex={disabled || readOnly ? -1 : 0}
              >
                <CalendarGlyph />
              </button>
            </RadixPopover.Trigger>
          </div>
        </RadixPopover.Anchor>
        {name !== undefined ? <input type="hidden" name={name} value={value ?? ''} /> : null}
        <RadixPopover.Portal>
          <Panel
            boxRef={boxRef}
            label={toggleLabel}
            calendar={{
              value,
              locale,
              min,
              max,
              isDateDisabled,
              today,
              weekStartsOn,
            }}
            onPick={pick}
          />
        </RadixPopover.Portal>
      </span>
    </RadixPopover.Root>
  );
});

interface PanelProps {
  boxRef: React.RefObject<HTMLDivElement | null>;
  label: string;
  calendar: {
    value: string | undefined;
    locale: string | undefined;
    min: string | undefined;
    max: string | undefined;
    isDateDisabled: ((iso: string) => boolean) | undefined;
    today: string | undefined;
    weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined;
  };
  onPick: (iso: string) => void;
}

/** The dialog holding the calendar; mounts on open, so the side and the offsets resolve then (4.1 §5). */
function Panel({ boxRef, label, calendar, onPick }: PanelProps) {
  const theme = useInheritedTheme(boxRef);
  const [resolved, setResolved] = useState(() => ({ side: resolveSide('bottom', 'ltr'), sideOffset: 0, collisionPadding: 0 }));
  useLayoutEffect(() => {
    const box = boxRef.current;
    setResolved({
      side: resolveSide('bottom', directionOf(box)),
      sideOffset: resolveSpace(box, '1'),
      collisionPadding: resolveSpace(box, '2'),
    });
  }, [boxRef]);
  const { value, locale, min, max, isDateDisabled, today, weekStartsOn } = calendar;

  return (
    <RadixPopover.Content
      role="dialog"
      aria-label={label}
      className="pp-popover pp-date-picker__panel"
      data-pp-theme={theme}
      side={resolved.side}
      align="start"
      sideOffset={resolved.sideOffset}
      collisionPadding={resolved.collisionPadding}
      /* Focus goes to the calendar's tab stop, not to the month's arrow. */
      onOpenAutoFocus={(event) => {
        const day = (event.currentTarget as HTMLElement).querySelector<HTMLElement>('.pp-calendar__day[tabindex="0"]');
        if (day) {
          event.preventDefault();
          day.focus();
        }
      }}
    >
      <Calendar
        size="sm"
        label={label}
        {...(value !== undefined ? { value } : {})}
        {...(locale !== undefined ? { locale } : {})}
        {...(min !== undefined ? { min } : {})}
        {...(max !== undefined ? { max } : {})}
        {...(isDateDisabled !== undefined ? { isDateDisabled } : {})}
        {...(today !== undefined ? { today } : {})}
        {...(weekStartsOn !== undefined ? { weekStartsOn } : {})}
        onValueChange={onPick}
      />
    </RadixPopover.Content>
  );
}
