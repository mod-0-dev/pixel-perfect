import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Field } from '../Field/Field';
import { Combobox, ComboboxEmpty, ComboboxGroup, ComboboxInput, ComboboxLabel, ComboboxList, ComboboxOption } from './Combobox';

const CITIES: Record<string, string> = { ams: 'Amsterdam', ber: 'Berlin', bru: 'Brussels', cph: 'Copenhagen' };

/** A consumer's combobox: it filters, the component does the rest. */
function Cities({
  multiple = false,
  disabledCity,
  ariaLabel = 'City',
  ...rest
}: {
  multiple?: boolean;
  disabledCity?: string;
  ariaLabel?: string;
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (v: never) => void;
  getLabel?: (v: string) => string;
  loading?: boolean;
  name?: string;
  disabled?: boolean;
  defaultOpen?: boolean;
}) {
  // The consumer's pattern (spec §2): filter on what was TYPED; after a
  // selection the query is empty, so a reopened list shows everything.
  const [query, setQuery] = useState('');
  const matches = Object.entries(CITIES).filter(([, name]) => name.toLowerCase().includes(query.toLowerCase()));
  const props = {
    ...rest,
    onInputValueChange: (text: string, reason: string) => setQuery(reason === 'input' ? text : ''),
  } as Record<string, unknown>;
  return (
    <Combobox {...(multiple ? { multiple: true } : {})} {...(props as object)}>
      <ComboboxInput {...(ariaLabel ? { 'aria-label': ariaLabel } : {})} placeholder="Type a city" />
      <ComboboxList>
        {matches.map(([code, name]) => (
          <ComboboxOption key={code} value={code} disabled={code === disabledCity}>
            {name}
          </ComboboxOption>
        ))}
        {matches.length === 0 && <ComboboxEmpty>No cities match.</ComboboxEmpty>}
      </ComboboxList>
    </Combobox>
  );
}

const list = () => document.querySelector('.pp-combobox__list') as HTMLElement | null;
const input = () => screen.getByRole('combobox') as HTMLInputElement;

describe('Combobox', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("is Input's box with a combobox in it, closed until typed in, and the list is a listbox named as the input is (spec §1, §5, §6)", async () => {
    const user = userEvent.setup();
    const { container } = renderWithTheme(<Cities />);
    const root = container.querySelector('.pp-combobox')!;
    expect(root).toHaveClass('pp-input', 'pp-combobox');
    expect(root).toHaveAttribute('data-size', 'md');
    expect(root).toHaveAttribute('data-state', 'closed');
    const control = input();
    expect(control).toHaveClass('pp-combobox__control');
    expect(control).toHaveAttribute('aria-expanded', 'false');
    expect(control).toHaveAttribute('aria-autocomplete', 'list');
    expect(control).toHaveAttribute('autocomplete', 'off');
    expect(control).not.toHaveAttribute('aria-controls');
    expect(list()).toBeNull();
    expect(screen.getByRole('button', { name: 'Show options' })).toHaveAttribute('tabindex', '-1');

    await user.type(control, 'b');
    expect(root).toHaveAttribute('data-state', 'open');
    expect(control).toHaveAttribute('aria-expanded', 'true');
    const box = screen.getByRole('listbox', { name: 'City' });
    expect(box).toHaveClass('pp-combobox__listbox');
    // The panel around it is DropdownMenu's box (spec §6).
    expect(box.parentElement).toBe(list());
    expect(list()).toHaveClass('pp-dropdown-menu', 'pp-combobox__list');
    expect(list()).toHaveAttribute('role', 'presentation');
    expect(control).toHaveAttribute('aria-controls', box.id);
    expect(box).not.toHaveAttribute('aria-multiselectable');
    const options = screen.getAllByRole('option');
    expect(options.map((o) => o.textContent)).toEqual(['Berlin', 'Brussels']);
    expect(options[0]).toHaveClass('pp-dropdown-menu__item', 'pp-combobox__option');
    expect(options[0]).toHaveAttribute('aria-selected', 'false');
    expect(options[0]).toHaveAttribute('data-state', 'unchecked');
    expect(control).not.toHaveAttribute('aria-activedescendant');
  });

  it('the arrows highlight, wrap, skip a disabled option, and Enter takes: the text is the label, the list closes, the value reports (spec §4)', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithTheme(<Cities onValueChange={onValueChange} disabledCity="bru" />);
    const control = input();
    await user.type(control, 'b');
    await user.keyboard('{ArrowDown}');
    const [berlin, brussels] = screen.getAllByRole('option');
    expect(berlin).toHaveAttribute('data-highlighted', '');
    expect(control).toHaveAttribute('aria-activedescendant', berlin!.id);
    expect(brussels).toHaveAttribute('aria-disabled', 'true');
    // Only Berlin is enabled: next wraps onto itself.
    await user.keyboard('{ArrowDown}');
    expect(berlin).toHaveAttribute('data-highlighted', '');
    await user.keyboard('{ArrowUp}');
    expect(berlin).toHaveAttribute('data-highlighted', '');
    await user.keyboard('{Enter}');
    expect(onValueChange).toHaveBeenCalledWith('ber');
    expect(control).toHaveValue('Berlin');
    expect(list()).toBeNull();
    expect(control).toHaveAttribute('aria-expanded', 'false');
    expect(control).toHaveFocus();
  });

  it('ArrowDown opens a closed list with the first option highlighted; Escape closes; Tab closes and keeps the text', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <>
        <Cities />
        <button type="button">After</button>
      </>,
    );
    const control = input();
    control.focus();
    await user.keyboard('{ArrowDown}');
    expect(list()).not.toBeNull();
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('data-highlighted', '');
    await user.keyboard('{Escape}');
    expect(list()).toBeNull();
    await user.type(control, 'co');
    expect(list()).not.toBeNull();
    await user.keyboard('{Tab}');
    expect(list()).toBeNull();
    // What was typed stays (spec §4).
    expect(control).toHaveValue('co');
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('a click takes an option, and a pointer over one highlights it; the selected option carries the mark', async () => {
    const user = userEvent.setup();
    renderWithTheme(<Cities defaultValue="cph" getLabel={(v) => CITIES[v]!} />);
    const control = input();
    // A value from outside: the text is its label, by getLabel (spec §3).
    expect(control).toHaveValue('Copenhagen');
    await user.click(screen.getByRole('button', { name: 'Show options' }));
    expect(list()).not.toBeNull();
    expect(control).toHaveFocus();
    const copenhagen = screen.getByRole('option', { name: 'Copenhagen' });
    expect(copenhagen).toHaveAttribute('aria-selected', 'true');
    expect(copenhagen).toHaveAttribute('data-state', 'checked');
    expect(copenhagen.querySelector('.pp-dropdown-menu__indicator.pp-combobox__indicator svg')).not.toBeNull();
    const berlin = screen.getByRole('option', { name: 'Berlin' });
    await user.hover(berlin);
    expect(berlin).toHaveAttribute('data-highlighted', '');
    await user.click(berlin);
    expect(control).toHaveValue('Berlin');
    expect(list()).toBeNull();
  });

  it('multiple: tokens, the list stays open, aria-multiselectable, Backspace and the remove button remove (spec §7)', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = renderWithTheme(<Cities multiple onValueChange={onValueChange} />);
    const control = input();
    await user.type(control, 'b');
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
    await user.click(screen.getByRole('option', { name: 'Berlin' }));
    expect(onValueChange).toHaveBeenCalledWith(['ber']);
    expect(list()).not.toBeNull();
    expect(control).toHaveValue('');
    const tokens = () => Array.from(container.querySelectorAll('.pp-combobox__token')).map((t) => t.textContent);
    expect(tokens()).toEqual(['Berlin']);
    await user.click(screen.getByRole('option', { name: 'Amsterdam' }));
    expect(tokens()).toEqual(['Berlin', 'Amsterdam']);
    expect(screen.getByRole('option', { name: 'Amsterdam' })).toHaveAttribute('aria-selected', 'true');
    // Taking a selected one again unselects it.
    await user.click(screen.getByRole('option', { name: 'Berlin' }));
    expect(tokens()).toEqual(['Amsterdam']);
    await user.keyboard('{Backspace}');
    expect(tokens()).toEqual([]);
    await user.click(screen.getByRole('option', { name: 'Brussels' }));
    expect(tokens()).toEqual(['Brussels']);
    await user.click(screen.getByRole('button', { name: 'Remove Brussels' }));
    expect(tokens()).toEqual([]);
    expect(onValueChange).toHaveBeenLastCalledWith([]);
  });

  it('multiple with values from outside shows their labels through getLabel, and posts hidden inputs with name (spec §3, §8)', () => {
    const { container } = renderWithTheme(<Cities multiple defaultValue={['ams', 'cph']} getLabel={(v) => CITIES[v]!} name="cities" />);
    expect(Array.from(container.querySelectorAll('.pp-combobox__token')).map((t) => t.textContent)).toEqual(['Amsterdam', 'Copenhagen']);
    const hidden = Array.from(container.querySelectorAll('input[type="hidden"][name="cities"]')) as HTMLInputElement[];
    expect(hidden.map((h) => h.value)).toEqual(['ams', 'cph']);
  });

  it('is controllable: value, text and open', async () => {
    const user = userEvent.setup();
    function Owner() {
      const [value, setValue] = useState('ams');
      const [open, setOpen] = useState(false);
      return (
        <>
          <Cities value={value} onValueChange={setValue as never} getLabel={(v) => CITIES[v]!} />
          <button type="button" onClick={() => setValue('ber')}>
            Berlin!
          </button>
          <output>{`${value} ${open}`}</output>
          <Combobox open={open} onOpenChange={setOpen}>
            <ComboboxInput aria-label="Other" />
            <ComboboxList>
              <ComboboxOption value="x">X</ComboboxOption>
            </ComboboxList>
          </Combobox>
        </>
      );
    }
    const { getByRole, container } = renderWithTheme(<Owner />);
    const city = screen.getAllByRole('combobox')[0]!;
    expect(city).toHaveValue('Amsterdam');
    await user.click(getByRole('button', { name: 'Berlin!' }));
    expect(city).toHaveValue('Berlin');
    const other = screen.getAllByRole('combobox')[1]!;
    await user.type(other, 'x');
    expect(container.querySelector('output')).toHaveTextContent('ber true');
    await user.keyboard('{Escape}');
    expect(container.querySelector('output')).toHaveTextContent('ber false');
  });

  it("takes Field's id, description and error, and the list is named by the field's label", async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <Field label="Home city" description="Where you live." error="Pick one.">
        <Cities ariaLabel="" />
      </Field>,
    );
    const control = screen.getByRole('combobox', { name: 'Home city' });
    expect(control).toHaveAccessibleDescription(/Where you live\..*Pick one\./);
    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(control.closest('.pp-combobox')).toHaveAttribute('data-invalid');
    expect(control.closest('.pp-combobox')).toHaveAttribute('data-pp-tone', 'danger');
    await user.type(control, 'a');
    expect(screen.getByRole('listbox', { name: 'Home city' })).toBeInTheDocument();
  });

  it('loading shows a spinner in the end slot and marks the list busy; disabled disables the input and the toggle', async () => {
    const user = userEvent.setup();
    const loading = renderWithTheme(<Cities loading defaultOpen />);
    expect(loading.container.querySelector('.pp-combobox__toggle .pp-spinner')).not.toBeNull();
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-busy', 'true');
    loading.unmount();
    const off = renderWithTheme(<Cities disabled />);
    expect(input()).toBeDisabled();
    expect(off.getByRole('button', { name: 'Show options' })).toBeDisabled();
    await user.click(off.getByRole('button', { name: 'Show options' }));
    expect(list()).toBeNull();
  });

  it('groups are named by their labels, and the empty row shows when nothing matches', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <Combobox defaultOpen>
        <ComboboxInput aria-label="Grouped" />
        <ComboboxList>
          <ComboboxGroup>
            <ComboboxLabel>Europe</ComboboxLabel>
            <ComboboxOption value="ams">Amsterdam</ComboboxOption>
          </ComboboxGroup>
        </ComboboxList>
      </Combobox>,
    );
    expect(screen.getByRole('group', { name: 'Europe' })).toHaveClass('pp-dropdown-menu__group', 'pp-combobox__group');
    const empty = renderWithTheme(<Cities />);
    await user.type(empty.getByRole('combobox'), 'zzz');
    const row = document.querySelector('.pp-combobox__empty')!;
    expect(row).toHaveTextContent('No cities match.');
    // Beside the listbox, not in it: a listbox holds options only (D-076 §4).
    expect(row.parentElement).toBe(list());
    expect(row.closest('[role="listbox"]')).toBeNull();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('forwards refs and merges className and style onto the root, the input, the list and an option', async () => {
    const user = userEvent.setup();
    const root = createRef<HTMLDivElement>();
    const control = createRef<HTMLInputElement>();
    const panel = createRef<HTMLDivElement>();
    const option = createRef<HTMLDivElement>();
    renderWithTheme(
      <Combobox ref={root} className="r" style={{ opacity: 0.5 }} data-testid="root">
        <ComboboxInput ref={control} aria-label="Refs" className="c" style={{ order: 1 }} />
        <ComboboxList ref={panel} className="l" style={{ order: 2 }}>
          <ComboboxOption ref={option} value="a" className="o" style={{ order: 3 }}>
            A
          </ComboboxOption>
        </ComboboxList>
      </Combobox>,
    );
    expect(root.current).toHaveClass('pp-input', 'pp-combobox', 'r');
    expect(root.current).toHaveStyle({ opacity: '0.5' });
    expect(root.current).toHaveAttribute('data-testid', 'root');
    expect(control.current).toHaveClass('pp-combobox__control', 'c');
    await user.type(control.current!, 'a');
    expect(panel.current).toBe(list());
    expect(panel.current).toHaveClass('pp-combobox__list', 'l');
    expect(option.current).toHaveClass('pp-combobox__option', 'o');
    expect(option.current).toHaveStyle({ order: '3' });
  });

  it('throws a readable error for a part outside the root', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderWithTheme(<ComboboxInput />)).toThrow(/<ComboboxInput> must be rendered inside <Combobox>/);
    error.mockRestore();
  });

  /* axe's `region` rule, off for the reason DropdownMenu's test gives. */
  const options = { rules: { region: { enabled: false } } };

  it('has no axe violations: closed, open with options, open with only the empty row, multiple with tokens, both themes', async () => {
    const user = userEvent.setup();
    const closed = renderWithTheme(<Cities />);
    await expectNoA11yViolations(document.body, options);
    await user.type(closed.getByRole('combobox'), 'b');
    await user.keyboard('{ArrowDown}');
    await expectNoA11yViolations(document.body, options);
    await user.clear(closed.getByRole('combobox'));
    await user.type(closed.getByRole('combobox'), 'zzz');
    await expectNoA11yViolations(document.body, options);
    closed.unmount();
    const many = renderWithTheme(<Cities multiple defaultValue={['ams']} getLabel={(v) => CITIES[v]!} defaultOpen />, { theme: 'dark' });
    await expectNoA11yViolations(document.body, options);
    many.unmount();
  });
});
