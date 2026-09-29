/**
 * Calendar arithmetic on plain dates, UTC-anchored so that no daylight
 * change ever moves a day (Calendar §Purpose). A day is `{ year, month, day }`
 * with `month` 1–12, and its wire form is the ISO date `YYYY-MM-DD`.
 */

export interface PlainDate {
  year: number;
  month: number;
  day: number;
}

export interface PlainMonth {
  year: number;
  month: number;
}

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH = /^(\d{4})-(\d{2})$/;

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** `null` for anything that is not a real date written as `YYYY-MM-DD`. */
export function parseDate(iso: string | undefined | null): PlainDate | null {
  if (!iso) return null;
  const m = DATE.exec(iso);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

export function parseMonth(ym: string | undefined | null): PlainMonth | null {
  if (!ym) return null;
  const m = MONTH.exec(ym);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

export const toISODate = (d: PlainDate): string => `${pad(d.year, 4)}-${pad(d.month)}-${pad(d.day)}`;
export const toISOMonth = (m: PlainMonth): string => `${pad(m.year, 4)}-${pad(m.month)}`;

export const toUTC = (d: PlainDate): Date => new Date(Date.UTC(d.year, d.month - 1, d.day));

export function fromUTC(date: Date): PlainDate {
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

export function addDays(d: PlainDate, n: number): PlainDate {
  return fromUTC(new Date(Date.UTC(d.year, d.month - 1, d.day + n)));
}

/** The same day of the month `n` months on, clamped to the month's length. */
export function addMonths(d: PlainDate, n: number): PlainDate {
  const total = d.year * 12 + (d.month - 1) + n;
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  return { year, month, day: Math.min(d.day, daysInMonth(year, month)) };
}

/** 0 is Sunday, as `Date` counts. */
export const weekdayOf = (d: PlainDate): number => toUTC(d).getUTCDay();

export function compareDates(a: PlainDate, b: PlainDate): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}

export const sameMonth = (d: PlainDate, m: PlainMonth): boolean => d.year === m.year && d.month === m.month;

/** The runtime's local date, as a plain date. */
export function todayLocal(): PlainDate {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

/**
 * The first day of the week for a locale, 0–6 with 0 Sunday: the locale's
 * week info where the runtime provides it, else Monday.
 */
export function weekStartFor(locale: string | undefined): number {
  try {
    const tag = locale ?? new Intl.DateTimeFormat().resolvedOptions().locale;
    const loc = new Intl.Locale(tag) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number };
      weekInfo?: { firstDay: number };
    };
    const info = loc.getWeekInfo?.() ?? loc.weekInfo;
    if (info && typeof info.firstDay === 'number') return info.firstDay % 7;
  } catch {
    /* an unknown locale: Monday */
  }
  return 1;
}

/** Six weeks of days from the first cell of the month's grid, 42 in all. */
export function monthGrid(month: PlainMonth, weekStartsOn: number): PlainDate[] {
  const first: PlainDate = { year: month.year, month: month.month, day: 1 };
  const lead = (weekdayOf(first) - weekStartsOn + 7) % 7;
  const start = addDays(first, -lead);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}
