'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
} from 'react';

import { cx } from '../../internal/cx';
import {
  addDays,
  addMonths,
  compareDates,
  monthGrid,
  parseDate,
  parseMonth,
  sameMonth,
  toISODate,
  toISOMonth,
  toUTC,
  todayLocal,
  weekStartFor,
  weekdayOf,
  type PlainDate,
  type PlainMonth,
} from '../../internal/date';
import { directionOf } from '../../internal/overlay/side';
import { mergeRefs } from '../../internal/refs';
import { useControllableState } from '../../internal/useControllableState';
import type { Size } from '../../types';
import { IconButton } from '../IconButton/IconButton';

/**
 * A month of days to pick one from. Standalone; DatePicker (4.13) puts it
 * in a Popover behind an input.
 *
 * THE VALUE IS AN ISO DATE, NOT A `Date` (spec §1): a day is not an
 * instant in a time zone, and `2026-09-28` is what a URL, a form and a
 * database already hold. The month shown is `YYYY-MM`, controlled or not.
 *
 * OUR OWN GRID, ONE TAB STOP, THE APG KEYS (spec §2): Radix has no
 * calendar, and a <table> cannot fill its container; `div`s with the grid
 * roles, laid out by CSS grid, each day a button stretched to its cell.
 *
 * Sizing contract: fill. RSC: client. Spec: docs/specs/Calendar.md
 */

export type CalendarSize = Size;

export interface CalendarProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'aria-label' | 'defaultValue'> {
  /** The picked day, `YYYY-MM-DD`. `undefined` is "no day yet", so an owner may pass it. */
  value?: string | undefined;
  defaultValue?: string | undefined;
  onValueChange?: (value: string) => void;
  /** The month shown, `YYYY-MM`. */
  month?: string | undefined;
  defaultMonth?: string | undefined;
  onMonthChange?: (month: string) => void;
  /** `YYYY-MM-DD`. The runtime's date unless given; a server render and a test give it. */
  today?: string;
  min?: string;
  max?: string;
  isDateDisabled?: (iso: string) => boolean;
  disabled?: boolean;
  /** For the month and weekday names. Pass it in a server-rendered app, so both sides agree. */
  locale?: string;
  /** 0 is Sunday. The locale's first day where the runtime knows it, else Monday. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** The day's height. */
  size?: CalendarSize;
  /** The group's name. */
  label?: string;
}

declare const process: { env?: { NODE_ENV?: string } } | undefined;
const isProduction = () => typeof process !== 'undefined' && process?.env?.NODE_ENV === 'production';

function warnBad(prop: string, value: string) {
  if (!isProduction()) console.warn(`[pixel-perfect] <Calendar> \`${prop}\` is not a date written as YYYY-MM-DD: ${JSON.stringify(value)}. Ignored.`);
}

function useDate(prop: string, iso: string | undefined): PlainDate | undefined {
  return useMemo(() => {
    if (iso === undefined) return undefined;
    const parsed = parseDate(iso);
    if (!parsed) warnBad(prop, iso);
    return parsed ?? undefined;
  }, [prop, iso]);
}

function Chevron({ direction }: { direction: 'previous' | 'next' }) {
  return (
    <svg
      className="pp-calendar__chevron"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={direction === 'previous' ? 'm15 6-6 6 6 6' : 'm9 6 6 6-6 6'} />
    </svg>
  );
}

const NAV_SIZE: Record<Size, Size> = { sm: 'sm', md: 'sm', lg: 'md' };

export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(function Calendar(
  {
    value: valueProp,
    defaultValue,
    onValueChange,
    month: monthProp,
    defaultMonth,
    onMonthChange,
    today: todayProp,
    min,
    max,
    isDateDisabled,
    disabled = false,
    locale,
    weekStartsOn,
    size = 'md',
    label = 'Calendar',
    className,
    ...props
  },
  ref,
) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const setRootRef = useMemo(() => mergeRefs<HTMLDivElement>(ref, rootRef), [ref]);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const monthId = useId();

  const [valueISO, setValueISO] = useControllableState<string | undefined>({
    value: valueProp,
    defaultValue,
    onChange: onValueChange as ((v: string | undefined) => void) | undefined,
    component: 'Calendar',
    prop: 'value',
  });
  const value = useDate('value', valueISO);
  const today = useMemo<PlainDate>(() => {
    if (todayProp !== undefined) {
      const parsed = parseDate(todayProp);
      if (parsed) return parsed;
      warnBad('today', todayProp);
    }
    return todayLocal();
  }, [todayProp]);
  const minDate = useDate('min', min);
  const maxDate = useDate('max', max);

  /* The month shown: the prop, else the value's, else today's. */
  const [monthISO, setMonthISO] = useControllableState<string | undefined>({
    value: monthProp,
    defaultValue: defaultMonth ?? (value ? toISOMonth(value) : toISOMonth(today)),
    onChange: onMonthChange as ((m: string | undefined) => void) | undefined,
    component: 'Calendar',
    prop: 'month',
  });
  const month = useMemo<PlainMonth>(() => {
    const parsed = parseMonth(monthISO);
    if (parsed) return parsed;
    if (monthISO !== undefined && !isProduction()) {
      console.warn(`[pixel-perfect] <Calendar> \`month\` is not YYYY-MM: ${JSON.stringify(monthISO)}. Showing the value's month.`);
    }
    return value ? { year: value.year, month: value.month } : { year: today.year, month: today.month };
  }, [monthISO, value, today]);

  /* A value set from outside to a day in another month brings that month
     into view when the month is not controlled. */
  const previousValue = useRef(valueISO);
  useEffect(() => {
    if (previousValue.current === valueISO) return;
    previousValue.current = valueISO;
    if (monthProp === undefined && value && !sameMonth(value, month)) setMonthISO(toISOMonth(value));
  }, [valueISO, value, month, monthProp, setMonthISO]);

  const weekStart = weekStartsOn ?? weekStartFor(locale);
  const days = useMemo(() => monthGrid(month, weekStart), [month, weekStart]);

  const isOff = useCallback(
    (d: PlainDate): boolean => {
      if (disabled) return true;
      if (minDate && compareDates(d, minDate) < 0) return true;
      if (maxDate && compareDates(d, maxDate) > 0) return true;
      return isDateDisabled ? isDateDisabled(toISODate(d)) : false;
    },
    [disabled, minDate, maxDate, isDateDisabled],
  );

  /* THE TAB STOP (spec §2): the focused day when it is in the month, else
     the value, else today, else the first. */
  const [focusedISO, setFocusedISO] = useState<string | undefined>(undefined);
  const tabStop = useMemo<PlainDate>(() => {
    const focused = parseDate(focusedISO);
    if (focused && sameMonth(focused, month)) return focused;
    if (value && sameMonth(value, month)) return value;
    if (sameMonth(today, month)) return today;
    return { year: month.year, month: month.month, day: 1 };
  }, [focusedISO, month, value, today]);

  /* Focus follows a keyboard move across a month's edge, once the new month
     has rendered. */
  const pendingFocus = useRef<string | null>(null);
  useEffect(() => {
    if (!pendingFocus.current) return;
    const target = gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${pendingFocus.current}"]`);
    pendingFocus.current = null;
    target?.focus();
  });

  const moveTo = useCallback(
    (target: PlainDate, step: number) => {
      /* A disabled day is skipped, not landed on: keep stepping the way the
         key went, up to a year, and stay put if nothing is pickable. */
      let candidate = target;
      for (let i = 0; i < 366 && isOff(candidate); i += 1) candidate = addDays(candidate, step);
      if (isOff(candidate)) return;
      const iso = toISODate(candidate);
      setFocusedISO(iso);
      if (!sameMonth(candidate, month)) {
        setMonthISO(toISOMonth(candidate));
        pendingFocus.current = iso;
      } else {
        gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)?.focus();
      }
    },
    [isOff, month, setMonthISO],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const button = event.target as HTMLElement;
    const iso = button.getAttribute('data-date');
    const from = parseDate(iso);
    if (!from) return;
    const rtl = directionOf(rootRef.current) === 'rtl';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    const weekdayIndex = (weekdayOf(from) - weekStart + 7) % 7;
    let target: PlainDate | null = null;
    let step = 1;
    switch (event.key) {
      case forward:
        target = addDays(from, 1);
        break;
      case back:
        target = addDays(from, -1);
        step = -1;
        break;
      case 'ArrowDown':
        target = addDays(from, 7);
        break;
      case 'ArrowUp':
        target = addDays(from, -7);
        step = -1;
        break;
      case 'Home':
        target = addDays(from, -weekdayIndex);
        break;
      case 'End':
        target = addDays(from, 6 - weekdayIndex);
        step = -1;
        break;
      case 'PageUp':
        target = addMonths(from, event.shiftKey ? -12 : -1);
        step = -1;
        break;
      case 'PageDown':
        target = addMonths(from, event.shiftKey ? 12 : 1);
        break;
      default:
        return;
    }
    event.preventDefault();
    if (target) moveTo(target, step);
  };

  const pick = (d: PlainDate) => {
    const iso = toISODate(d);
    setFocusedISO(iso);
    setValueISO(iso);
  };

  const shift = (n: number) => {
    const next = addMonths({ year: month.year, month: month.month, day: 1 }, n);
    setMonthISO(toISOMonth(next));
  };

  const monthName = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(toUTC({ year: month.year, month: month.month, day: 1 })),
    [locale, month],
  );
  const weekdays = useMemo(() => {
    const narrow = new Intl.DateTimeFormat(locale, { weekday: 'narrow', timeZone: 'UTC' });
    const long = new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' });
    /* 2024-01-07 is a Sunday. */
    return Array.from({ length: 7 }, (_, i) => {
      const d = toUTC({ year: 2024, month: 1, day: 7 + ((weekStart + i) % 7) });
      return { narrow: narrow.format(d), long: long.format(d) };
    });
  }, [locale, weekStart]);
  const dayName = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }),
    [locale],
  );
  /* The day's number in the locale's digits too: an Arabic month name over
     Latin day numbers was the screenshot's one mismatch (D-086 §4). */
  const dayNumber = useMemo(() => new Intl.NumberFormat(locale, { useGrouping: false }), [locale]);

  const tabStopISO = toISODate(tabStop);
  const todayISO = toISODate(today);

  return (
    <div
      ref={setRootRef}
      role="group"
      aria-label={label}
      className={cx('pp-calendar', className)}
      data-size={size}
      data-pp-tone="accent"
      {...props}
    >
      <div className="pp-calendar__header">
        <IconButton
          label="Previous month"
          variant="ghost"
          size={NAV_SIZE[size]}
          className="pp-calendar__nav"
          disabled={disabled}
          onClick={() => shift(-1)}
        >
          <Chevron direction="previous" />
        </IconButton>
        <span id={monthId} className="pp-calendar__month" aria-live="polite">
          {monthName}
        </span>
        <IconButton
          label="Next month"
          variant="ghost"
          size={NAV_SIZE[size]}
          className="pp-calendar__nav"
          disabled={disabled}
          onClick={() => shift(1)}
        >
          <Chevron direction="next" />
        </IconButton>
      </div>
      <div ref={gridRef} role="grid" aria-labelledby={monthId} className="pp-calendar__grid" onKeyDown={onKeyDown}>
        <div role="row" className="pp-calendar__weekdays">
          {weekdays.map((w) => (
            <span key={w.long} role="columnheader" aria-label={w.long} className="pp-calendar__weekday">
              {w.narrow}
            </span>
          ))}
        </div>
        {Array.from({ length: 6 }, (_, row) => {
          const week = days.slice(row * 7, row * 7 + 7);
          /* A sixth week that is all fillers has no gridcell for a screen
             reader to land on: the row is hidden with them (D-086 §4). */
          const inert = week.every((d) => !sameMonth(d, month));
          return (
          <div key={row} role="row" className="pp-calendar__week" {...(inert ? { 'aria-hidden': true } : {})}>
            {week.map((d) => {
              const iso = toISODate(d);
              if (!sameMonth(d, month)) {
                return (
                  <div key={iso} className="pp-calendar__cell" aria-hidden="true">
                    <span className="pp-calendar__day" data-outside="">
                      {dayNumber.format(d.day)}
                    </span>
                  </div>
                );
              }
              const selected = value !== undefined && compareDates(d, value) === 0;
              return (
                <div key={iso} role="gridcell" className="pp-calendar__cell" {...(selected ? { 'aria-selected': true } : {})}>
                  <button
                    type="button"
                    className="pp-calendar__day"
                    data-date={iso}
                    data-state={selected ? 'selected' : undefined}
                    tabIndex={iso === tabStopISO ? 0 : -1}
                    aria-label={dayName.format(toUTC(d))}
                    {...(iso === todayISO ? { 'aria-current': 'date' as const } : {})}
                    disabled={isOff(d)}
                    onClick={() => pick(d)}
                    onFocus={() => setFocusedISO(iso)}
                  >
                    {dayNumber.format(d.day)}
                  </button>
                </div>
              );
            })}
          </div>
          );
        })}
      </div>
    </div>
  );
});
