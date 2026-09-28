import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Calendar } from './Calendar';

const grid = () => document.querySelector('.pp-calendar__grid') as HTMLElement;
const day = (iso: string) => document.querySelector(`[data-date="${iso}"]`) as HTMLButtonElement;
const monthLabel = () => document.querySelector('.pp-calendar__month')!.textContent;
const weekdays = () => Array.from(document.querySelectorAll('.pp-calendar__weekday')).map((w) => w.getAttribute('aria-label'));
const tabStops = () => Array.from(document.querySelectorAll('.pp-calendar__day[tabindex="0"]')).map((b) => b.getAttribute('data-date'));

describe('Calendar', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is a group around a grid labelled by the month; the weekdays for en-US start on Sunday; the month\'s days and hidden fillers (spec §2, §3)', () => {
    const { getByRole, getAllByRole } = renderWithTheme(<Calendar defaultValue="2026-09-28" today="2026-09-28" locale="en-US" />);
    expect(getByRole('group', { name: 'Calendar' })).toHaveClass('pp-calendar');
    const g = getByRole('grid', { name: 'September 2026' });
    expect(g).toBe(grid());
    expect(monthLabel()).toBe('September 2026');
    expect(weekdays()).toEqual(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
    /* The weekday row and five weeks: September 2026's sixth week is all
       October, hidden as a row (D-086 §4). */
    expect(getAllByRole('row')).toHaveLength(6);
    expect(document.querySelectorAll('.pp-calendar__week')).toHaveLength(6);
    expect(getAllByRole('gridcell')).toHaveLength(30);
    expect(document.querySelectorAll('.pp-calendar__cell')).toHaveLength(42);
    const filler = document.querySelector('.pp-calendar__day[data-outside]')!;
    expect(filler.tagName).toBe('SPAN');
    expect(filler.closest('.pp-calendar__cell')).toHaveAttribute('aria-hidden', 'true');
    /* September 2026 starts on a Tuesday: Sunday and Monday are August's. */
    expect(document.querySelectorAll('.pp-calendar__week')[0]!.textContent).toBe('303112345');
    expect(day('2026-09-28')).toHaveAccessibleName('Monday, September 28, 2026');
  });

  it('starts the week on Monday with weekStartsOn={1}, and names the days in the locale', () => {
    renderWithTheme(<Calendar defaultMonth="2026-09" locale="de-DE" weekStartsOn={1} />);
    expect(weekdays()).toEqual(['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']);
    expect(monthLabel()).toBe('September 2026');
    expect(document.querySelectorAll('.pp-calendar__week')[0]!.textContent).toBe('31123456');
  });

  it('marks the value selected and today current; the tab stop is the value, else today, else the first', () => {
    const first = renderWithTheme(<Calendar defaultValue="2026-09-05" today="2026-09-28" />);
    expect(day('2026-09-05')).toHaveAttribute('data-state', 'selected');
    expect(day('2026-09-05').closest('[role="gridcell"]')).toHaveAttribute('aria-selected', 'true');
    expect(day('2026-09-28')).toHaveAttribute('aria-current', 'date');
    expect(tabStops()).toEqual(['2026-09-05']);
    first.unmount();
    const second = renderWithTheme(<Calendar today="2026-09-28" />);
    expect(tabStops()).toEqual(['2026-09-28']);
    second.unmount();
    renderWithTheme(<Calendar today="2026-09-28" defaultMonth="2026-11" />);
    expect(tabStops()).toEqual(['2026-11-01']);
    /* October 2026's grid ends with a week that is all November: hidden as a row. */
    const rows = document.querySelectorAll('.pp-calendar__week');
    expect(rows[5]).toHaveAttribute('aria-hidden', 'true');
    expect(rows[0]).not.toHaveAttribute('aria-hidden');
  });

  it('picks on click and reports; moves when uncontrolled, holds when controlled (RULES §5.5)', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = renderWithTheme(<Calendar defaultMonth="2026-09" onValueChange={onValueChange} />);
    await user.click(day('2026-09-10'));
    expect(onValueChange).toHaveBeenLastCalledWith('2026-09-10');
    expect(day('2026-09-10')).toHaveAttribute('data-state', 'selected');
    rerender(<Calendar month="2026-09" value="2026-09-01" onValueChange={onValueChange} />);
    await user.click(day('2026-09-12'));
    expect(onValueChange).toHaveBeenLastCalledWith('2026-09-12');
    expect(day('2026-09-12')).not.toHaveAttribute('data-state');
    expect(day('2026-09-01')).toHaveAttribute('data-state', 'selected');
  });

  it('the arrows change the month and report it; a value set from outside brings its month in', async () => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn();
    const { getByRole, rerender } = renderWithTheme(<Calendar defaultMonth="2026-09" onMonthChange={onMonthChange} />);
    await user.click(getByRole('button', { name: 'Next month' }));
    expect(monthLabel()).toBe('October 2026');
    expect(onMonthChange).toHaveBeenLastCalledWith('2026-10');
    await user.click(getByRole('button', { name: 'Previous month' }));
    await user.click(getByRole('button', { name: 'Previous month' }));
    expect(monthLabel()).toBe('August 2026');
    rerender(<Calendar defaultMonth="2026-09" onMonthChange={onMonthChange} value="2027-01-15" />);
    expect(monthLabel()).toBe('January 2027');
  });

  it('disables by min, max, isDateDisabled and disabled (spec §1)', () => {
    const { rerender, getByRole } = renderWithTheme(
      <Calendar defaultMonth="2026-09" min="2026-09-05" max="2026-09-25" isDateDisabled={(iso) => iso === '2026-09-10'} />,
    );
    expect(day('2026-09-04')).toBeDisabled();
    expect(day('2026-09-05')).toBeEnabled();
    expect(day('2026-09-25')).toBeEnabled();
    expect(day('2026-09-26')).toBeDisabled();
    expect(day('2026-09-10')).toBeDisabled();
    rerender(<Calendar defaultMonth="2026-09" disabled />);
    expect(day('2026-09-15')).toBeDisabled();
    expect(getByRole('button', { name: 'Next month' })).toBeDisabled();
  });

  describe('keyboard (spec §2)', () => {
    it('moves a day and a week, to the week\'s ends, a month and a year; the tab stop follows; Enter picks', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      renderWithTheme(<Calendar defaultValue="2026-09-16" today="2026-09-28" weekStartsOn={0} onValueChange={onValueChange} />);
      day('2026-09-16').focus();
      await user.keyboard('{ArrowRight}');
      expect(day('2026-09-17')).toHaveFocus();
      await user.keyboard('{ArrowDown}');
      expect(day('2026-09-24')).toHaveFocus();
      await user.keyboard('{ArrowLeft}{ArrowUp}');
      expect(day('2026-09-16')).toHaveFocus();
      await user.keyboard('{Home}');
      expect(day('2026-09-13')).toHaveFocus();
      await user.keyboard('{End}');
      expect(day('2026-09-19')).toHaveFocus();
      expect(tabStops()).toEqual(['2026-09-19']);
      await user.keyboard('{PageDown}');
      expect(monthLabel()).toBe('October 2026');
      expect(day('2026-10-19')).toHaveFocus();
      await user.keyboard('{Shift>}{PageUp}{/Shift}');
      expect(monthLabel()).toBe('October 2025');
      expect(day('2025-10-19')).toHaveFocus();
      await user.keyboard('{Enter}');
      expect(onValueChange).toHaveBeenLastCalledWith('2025-10-19');
      expect(day('2025-10-19')).toHaveAttribute('data-state', 'selected');
    });

    it('crosses the month\'s edge and shows the next month with focus on the day; skips a disabled day', async () => {
      const user = userEvent.setup();
      renderWithTheme(<Calendar defaultValue="2026-09-30" today="2026-09-28" isDateDisabled={(iso) => iso === '2026-10-01'} />);
      day('2026-09-30').focus();
      await user.keyboard('{ArrowRight}');
      expect(monthLabel()).toBe('October 2026');
      expect(day('2026-10-02')).toHaveFocus();
      await user.keyboard('{ArrowLeft}');
      expect(monthLabel()).toBe('September 2026');
      expect(day('2026-09-30')).toHaveFocus();
    });

    it('does not leave the bounds: past max nothing moves', async () => {
      const user = userEvent.setup();
      renderWithTheme(<Calendar defaultValue="2026-09-25" max="2026-09-25" />);
      day('2026-09-25').focus();
      await user.keyboard('{ArrowRight}');
      expect(day('2026-09-25')).toHaveFocus();
      expect(monthLabel()).toBe('September 2026');
    });
  });

  function Owner() {
    const [date, setDate] = useState<string | undefined>('2026-09-01');
    return (
      <>
        <output>{date}</output>
        <Calendar value={date} onValueChange={setDate} today="2026-09-28" />
      </>
    );
  }

  it('moves with an owner that stores what it reports', async () => {
    const user = userEvent.setup();
    const { getByText } = renderWithTheme(<Owner />);
    await user.click(day('2026-09-21'));
    expect(getByText('2026-09-21')).toBeInTheDocument();
    expect(day('2026-09-21')).toHaveAttribute('data-state', 'selected');
  });

  it('warns and ignores a value that is not a date', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderWithTheme(<Calendar value="2026-13-40" today="2026-09-28" />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('`value` is not a date'));
    expect(document.querySelector('[data-state="selected"]')).toBeNull();
    expect(monthLabel()).toBe('September 2026');
  });

  it('takes size and label, forwards the ref and merges className and style', () => {
    const ref = createRef<HTMLDivElement>();
    const { getByRole } = renderWithTheme(
      <Calendar ref={ref} size="sm" label="Pick a date" className="mine" style={{ opacity: 0.5 }} data-testid="c" defaultMonth="2026-09" />,
    );
    const root = getByRole('group', { name: 'Pick a date' });
    expect(ref.current).toBe(root);
    expect(root).toHaveAttribute('data-size', 'sm');
    expect(root).toHaveAttribute('data-pp-tone', 'accent');
    expect(root).toHaveClass('pp-calendar', 'mine');
    expect(root).toHaveStyle({ opacity: '0.5' });
    expect(root).toHaveAttribute('data-testid', 'c');
    expect(root.querySelector('.pp-calendar__nav')).toHaveAttribute('data-size', 'sm');
  });

  it('has no axe violations in both themes', async () => {
    const light = renderWithTheme(<Calendar defaultValue="2026-09-28" today="2026-09-28" locale="en-US" />);
    await expectNoA11yViolations(light.container);
    light.unmount();
    const dark = renderWithTheme(<Calendar defaultMonth="2026-09" today="2026-09-28" min="2026-09-10" locale="en-US" />, { theme: 'dark' });
    await expectNoA11yViolations(dark.container);
  });
});
