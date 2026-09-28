import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Field } from '../Field/Field';
import { DatePicker, datePattern, formatDate, parseTypedDate } from './DatePicker';

const control = () => document.querySelector('.pp-date-picker__control') as HTMLInputElement;
const toggle = () => document.querySelector('.pp-date-picker__toggle') as HTMLButtonElement;
const root = () => document.querySelector('.pp-date-picker') as HTMLElement;
const panel = () => document.querySelector('.pp-date-picker__panel') as HTMLElement | null;

describe('DatePicker', () => {
  describe('the helpers (spec §2)', () => {
    it('formats in the locale\'s numeric form and gives its pattern', () => {
      expect(formatDate('2026-09-28', 'en-US')).toBe('09/28/2026');
      expect(formatDate('2026-09-28', 'de-DE')).toBe('28.09.2026');
      expect(formatDate('2026-09-28', 'en-GB')).toBe('28/09/2026');
      expect(formatDate('nonsense', 'en-US')).toBe('');
      expect(datePattern('en-US')).toBe('MM/DD/YYYY');
      expect(datePattern('de-DE')).toBe('DD.MM.YYYY');
    });

    it('parses ISO as is, else three numbers in the locale\'s order, a two-digit year this century, nothing else', () => {
      expect(parseTypedDate('2026-09-28', 'en-US')).toBe('2026-09-28');
      expect(parseTypedDate('9/28/2026', 'en-US')).toBe('2026-09-28');
      expect(parseTypedDate('28.9.2026', 'de-DE')).toBe('2026-09-28');
      expect(parseTypedDate('28/09/26', 'en-GB')).toBe('2026-09-28');
      expect(parseTypedDate(' 28.09.2026 ', 'de-DE')).toBe('2026-09-28');
      expect(parseTypedDate('31/02/2026', 'en-GB')).toBeUndefined();
      expect(parseTypedDate('soon', 'en-US')).toBeUndefined();
      expect(parseTypedDate('2026-13-01', 'en-US')).toBeUndefined();
      expect(parseTypedDate('1/2', 'en-US')).toBeUndefined();
    });
  });

  it('is Input\'s box with a text field and a named button; the value shown in the locale (spec §1)', () => {
    const { getByRole } = renderWithTheme(<DatePicker defaultValue="2026-09-28" locale="de-DE" aria-label="Due" />);
    expect(root()).toHaveClass('pp-input', 'pp-date-picker');
    expect(root()).toHaveAttribute('data-state', 'closed');
    expect(root()).toHaveAttribute('data-size', 'md');
    expect(getByRole('textbox', { name: 'Due' })).toBe(control());
    expect(control()).toHaveValue('28.09.2026');
    expect(control()).toHaveAttribute('placeholder', 'DD.MM.YYYY');
    expect(control()).toHaveAttribute('inputmode', 'numeric');
    const button = getByRole('button', { name: 'Choose date' });
    expect(button).toBe(toggle());
    expect(button).toHaveAttribute('aria-haspopup', 'dialog');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(panel()).toBeNull();
  });

  it('typing and Enter reports the ISO value and reformats; blur commits too; ISO typed; an emptied field reports undefined', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithTheme(<DatePicker locale="en-US" aria-label="Due" onValueChange={onValueChange} />);
    await user.type(control(), '9/28/2026{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith('2026-09-28');
    expect(control()).toHaveValue('09/28/2026');
    await user.clear(control());
    await user.type(control(), '2026-10-01');
    await user.tab();
    expect(onValueChange).toHaveBeenLastCalledWith('2026-10-01');
    expect(control()).toHaveValue('10/01/2026');
    await user.clear(control());
    await user.tab();
    expect(onValueChange).toHaveBeenLastCalledWith(undefined);
    expect(control()).toHaveValue('');
    expect(onValueChange).toHaveBeenCalledTimes(3);
  });

  it('unparsable text marks the field invalid and reports nothing; fixing it clears the mark (spec §2)', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithTheme(<DatePicker locale="en-US" aria-label="Due" onValueChange={onValueChange} />);
    await user.type(control(), 'soon{Enter}');
    expect(onValueChange).not.toHaveBeenCalled();
    expect(control()).toHaveAttribute('aria-invalid', 'true');
    expect(root()).toHaveAttribute('data-invalid');
    expect(root()).toHaveAttribute('data-pp-tone', 'danger');
    expect(control()).toHaveValue('soon');
    await user.clear(control());
    await user.type(control(), '1/2/2027{Enter}');
    expect(control()).not.toHaveAttribute('aria-invalid');
    expect(onValueChange).toHaveBeenLastCalledWith('2027-01-02');
  });

  it('the button opens a named dialog with the calendar, focus on the day; a pick reports, closes and returns focus (spec §1)', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithTheme(<DatePicker defaultValue="2026-09-28" today="2026-09-28" locale="en-US" aria-label="Due" onValueChange={onValueChange} />);
    await user.click(toggle());
    const dialog = screen.getByRole('dialog', { name: 'Choose date' });
    expect(dialog).toHaveClass('pp-popover', 'pp-date-picker__panel');
    expect(root()).toHaveAttribute('data-state', 'open');
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    const calendar = dialog.querySelector('.pp-calendar')!;
    expect(calendar).toHaveAttribute('data-size', 'sm');
    expect(dialog.querySelector('[data-date="2026-09-28"]')).toHaveFocus();
    await user.click(dialog.querySelector('[data-date="2026-09-30"]')!);
    expect(onValueChange).toHaveBeenLastCalledWith('2026-09-30');
    expect(panel()).toBeNull();
    expect(control()).toHaveValue('09/30/2026');
    expect(toggle()).toHaveFocus();
  });

  it('Arrow Down in the field opens the dialog; Escape closes it and returns to the button', async () => {
    const user = userEvent.setup();
    renderWithTheme(<DatePicker today="2026-09-28" locale="en-US" aria-label="Due" />);
    control().focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('dialog', { name: 'Choose date' })).toBeInTheDocument();
    expect(document.querySelector('[data-date="2026-09-28"]')).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(panel()).toBeNull();
    expect(toggle()).toHaveFocus();
  });

  it('passes min, max and the rest to the calendar', async () => {
    const user = userEvent.setup();
    renderWithTheme(<DatePicker defaultValue="2026-09-15" today="2026-09-28" locale="en-US" min="2026-09-10" max="2026-09-20" aria-label="Due" />);
    await user.click(toggle());
    expect(document.querySelector('[data-date="2026-09-09"]')).toBeDisabled();
    expect(document.querySelector('[data-date="2026-09-10"]')).toBeEnabled();
    expect(document.querySelector('[data-date="2026-09-21"]')).toBeDisabled();
  });

  it('in a Field: the label names the field, the description and error describe it, invalid, disabled and size follow', () => {
    const { getByRole } = renderWithTheme(
      <Field label="Due" description="DD/MM/YYYY" error="Required" size="sm" disabled>
        <DatePicker locale="en-GB" />
      </Field>,
    );
    const field = getByRole('textbox', { name: 'Due' });
    expect(field).toHaveAccessibleDescription('DD/MM/YYYY Required');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toBeDisabled();
    expect(root()).toHaveAttribute('data-size', 'sm');
    expect(root()).toHaveAttribute('data-disabled');
    expect(toggle()).toBeDisabled();
  });

  it('carries the ISO value in a hidden input by name; is controlled and uncontrolled', async () => {
    const user = userEvent.setup();
    function Owner() {
      const [due, setDue] = useState<string | undefined>('2026-09-28');
      return (
        <>
          <output>{due ?? 'none'}</output>
          <DatePicker value={due} onValueChange={setDue} locale="en-US" name="due" aria-label="Due" />
        </>
      );
    }
    const { getByText, unmount } = renderWithTheme(<Owner />);
    const hidden = () => document.querySelector('input[type="hidden"][name="due"]') as HTMLInputElement;
    expect(hidden()).toHaveValue('2026-09-28');
    await user.clear(control());
    await user.type(control(), '10/02/2026{Enter}');
    expect(getByText('2026-10-02')).toBeInTheDocument();
    expect(hidden()).toHaveValue('2026-10-02');
    unmount();
    const onValueChange = vi.fn();
    renderWithTheme(<DatePicker value="2026-09-28" locale="en-US" aria-label="Due" onValueChange={onValueChange} />);
    await user.clear(control());
    await user.type(control(), '10/02/2026{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith('2026-10-02');
    expect(control()).toHaveValue('09/28/2026');
  });

  it('forwards the ref to the field; className and style land on the root; readOnly', () => {
    const ref = createRef<HTMLInputElement>();
    renderWithTheme(<DatePicker ref={ref} className="mine" style={{ opacity: 0.5 }} readOnly defaultValue="2026-09-28" locale="en-US" aria-label="Due" />);
    expect(ref.current).toBe(control());
    expect(root()).toHaveClass('pp-input', 'pp-date-picker', 'mine');
    expect(root()).toHaveStyle({ opacity: '0.5' });
    expect(root()).toHaveAttribute('data-readonly');
    expect(control()).toHaveAttribute('readonly');
    expect(toggle()).toBeDisabled();
  });

  it('has no axe violations closed and open, in both themes', async () => {
    /* axe's `region` rule, off for the reason DropdownMenu's test gives. */
    const options = { rules: { region: { enabled: false } } };
    const user = userEvent.setup();
    const light = renderWithTheme(
      <Field label="Due" description="MM/DD/YYYY">
        <DatePicker defaultValue="2026-09-28" today="2026-09-28" locale="en-US" />
      </Field>,
    );
    await expectNoA11yViolations(document.body, options);
    await user.click(toggle());
    await expectNoA11yViolations(document.body, options);
    light.unmount();
    const dark = renderWithTheme(<DatePicker aria-label="Due" locale="en-US" />, { theme: 'dark' });
    await expectNoA11yViolations(dark.container);
  });
});
