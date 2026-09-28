import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import {
  CommandPalette,
  CommandPaletteContent,
  CommandPaletteEmpty,
  CommandPaletteGroup,
  CommandPaletteInput,
  CommandPaletteItem,
  CommandPaletteLabel,
  CommandPaletteList,
  CommandPaletteShortcut,
  CommandPaletteTrigger,
} from './CommandPalette';

const COMMANDS = [
  ['inbox', 'Go to inbox', 'Navigate', ['G', 'I']],
  ['projects', 'Go to projects', 'Navigate', ['G', 'P']],
  ['new', 'New issue', 'Actions', ['C']],
  ['assign', 'Assign to me', 'Actions', null],
  ['archive', 'Archive', 'Actions', null],
] as const;

function Palette({
  onRun,
  keepOpen,
  disabled,
  hotkey,
  defaultOpen = false,
}: {
  onRun?: (value: string) => void;
  keepOpen?: boolean;
  disabled?: string;
  hotkey?: string;
  defaultOpen?: boolean;
}) {
  const [query, setQuery] = useState('');
  const matches = COMMANDS.filter(([, label]) => label.toLowerCase().includes(query.toLowerCase()));
  const groups = Array.from(new Set(matches.map(([, , g]) => g)));
  return (
    <CommandPalette defaultOpen={defaultOpen} onInputValueChange={setQuery} {...(hotkey ? { hotkey } : {})} label="Commands">
      <CommandPaletteTrigger>Open</CommandPaletteTrigger>
      <CommandPaletteContent>
        <CommandPaletteInput placeholder="Type a command" />
        <CommandPaletteList>
          {groups.map((group) => (
            <CommandPaletteGroup key={group}>
              <CommandPaletteLabel>{group}</CommandPaletteLabel>
              {matches
                .filter(([, , g]) => g === group)
                .map(([value, label, , keys]) => (
                  <CommandPaletteItem
                    key={value}
                    value={value}
                    disabled={value === disabled}
                    onSelect={(event) => {
                      onRun?.(event.value);
                      if (keepOpen) event.preventDefault();
                    }}
                  >
                    {label}
                    {keys && <CommandPaletteShortcut keys={[...keys]} />}
                  </CommandPaletteItem>
                ))}
            </CommandPaletteGroup>
          ))}
          {matches.length === 0 && <CommandPaletteEmpty>No commands match.</CommandPaletteEmpty>}
        </CommandPaletteList>
      </CommandPaletteContent>
    </CommandPalette>
  );
}

const panel = () => document.querySelector('.pp-command-palette') as HTMLElement | null;

describe('CommandPalette', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens from the trigger as a named modal dialog with focus in the combobox, over Dialog\'s scrim; the first command is highlighted (spec §2, §3)', async () => {
    const user = userEvent.setup();
    const { getByRole } = renderWithTheme(<Palette />);
    expect(panel()).toBeNull();
    await user.click(getByRole('button', { name: 'Open' }));
    const dialog = screen.getByRole('dialog', { name: 'Commands' });
    expect(dialog).toHaveClass('pp-dialog', 'pp-command-palette');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog.parentElement).toHaveClass('pp-dialog__scrim', 'pp-command-palette__scrim');
    const input = screen.getByRole('combobox');
    expect(input).toHaveFocus();
    expect(input).toHaveClass('pp-command-palette__input');
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    const list = screen.getByRole('listbox', { name: 'Commands' });
    expect(input).toHaveAttribute('aria-controls', list.id);
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(5);
    expect(options[0]).toHaveClass('pp-dropdown-menu__item', 'pp-command-palette__item');
    expect(options[0]).toHaveAttribute('data-highlighted', '');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', options[0]!.id);
    expect(screen.getByRole('group', { name: 'Navigate' })).toHaveClass('pp-dropdown-menu__group');
    // Shortcuts are Kbds, hidden from assistive tech.
    const shortcut = options[0]!.querySelector('.pp-command-palette__shortcut')!;
    expect(shortcut).toHaveAttribute('aria-hidden', 'true');
    expect(shortcut.querySelectorAll('kbd.pp-kbd')).toHaveLength(2);
    expect(options[0]).toHaveAccessibleName('Go to inbox');
  });

  it('typing narrows and highlights the first match; the arrows move and wrap, skipping a disabled item; Enter runs and closes (spec §3, §6)', async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    const { getByRole } = renderWithTheme(<Palette onRun={onRun} disabled="assign" />);
    const trigger = getByRole('button', { name: 'Open' });
    await user.click(trigger);
    const input = screen.getByRole('combobox');
    await user.type(input, 'a');
    expect(screen.getAllByRole('option')).toHaveLength(2);
    expect(screen.getByRole('option', { name: 'Assign to me' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Archive' })).toBeInTheDocument();
    // Assign is disabled: the first ENABLED match is highlighted.
    expect(screen.getByRole('option', { name: 'Archive' })).toHaveAttribute('data-highlighted', '');
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: 'Archive' })).toHaveAttribute('data-highlighted', '');
    await user.clear(input);
    await user.type(input, 'go');
    expect(screen.getAllByRole('option')).toHaveLength(2);
    expect(screen.getByRole('option', { name: 'Go to inbox' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Go to inbox' })).toHaveAttribute('data-highlighted', '');
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: 'Go to projects' })).toHaveAttribute('data-highlighted', '');
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: 'Go to inbox' })).toHaveAttribute('data-highlighted', '');
    await user.keyboard('{ArrowUp}');
    await user.keyboard('{Enter}');
    expect(onRun).toHaveBeenCalledWith('projects');
    expect(panel()).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('preventDefault keeps it open; a click runs; Escape closes and clears the text for the next open', async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    const { getByRole } = renderWithTheme(<Palette onRun={onRun} keepOpen />);
    await user.click(getByRole('button', { name: 'Open' }));
    await user.click(screen.getByRole('option', { name: 'New issue' }));
    expect(onRun).toHaveBeenCalledWith('new');
    expect(panel()).not.toBeNull();
    await user.type(screen.getByRole('combobox'), 'arch');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    await user.keyboard('{Escape}');
    expect(panel()).toBeNull();
    await user.click(getByRole('button', { name: 'Open' }));
    expect(screen.getByRole('combobox')).toHaveValue('');
    expect(screen.getAllByRole('option')).toHaveLength(5);
  });

  it('the hotkey toggles it, mod being Ctrl off Apple platforms; focus returns to where it was (spec §5)', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <>
        <button type="button">Elsewhere</button>
        <Palette hotkey="mod+k" />
      </>,
    );
    const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });
    elsewhere.focus();
    await user.keyboard('{Control>}k{/Control}');
    expect(panel()).not.toBeNull();
    expect(screen.getByRole('combobox')).toHaveFocus();
    await user.keyboard('{Control>}k{/Control}');
    expect(panel()).toBeNull();
    expect(elsewhere).toHaveFocus();
    // A bare k, or a k with another modifier, does nothing.
    await user.keyboard('k');
    await user.keyboard('{Shift>}{Control>}k{/Control}{/Shift}');
    expect(panel()).toBeNull();
  });

  it('is controllable, and the empty row sits beside the listbox when nothing matches', async () => {
    const user = userEvent.setup();
    function Owner() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <Palette />
          <CommandPalette open={open} onOpenChange={setOpen} label="Owned">
            <CommandPaletteContent>
              <CommandPaletteInput />
              <CommandPaletteList>
                <CommandPaletteEmpty>Nothing here.</CommandPaletteEmpty>
              </CommandPaletteList>
            </CommandPaletteContent>
          </CommandPalette>
          <output>{String(open)}</output>
        </>
      );
    }
    const { container } = renderWithTheme(<Owner />);
    const dialog = screen.getByRole('dialog', { name: 'Owned' });
    const empty = dialog.querySelector('.pp-command-palette__empty')!;
    expect(empty).toHaveTextContent('Nothing here.');
    expect(empty.closest('[role="listbox"]')).toBeNull();
    expect(empty.parentElement).toHaveClass('pp-command-palette__list');
    await user.keyboard('{Escape}');
    expect(container.querySelector('output')).toHaveTextContent('false');
  });

  it('forwards refs and merges className and style onto the panel, the input, the list and an item', () => {
    const content = createRef<HTMLDivElement>();
    const input = createRef<HTMLInputElement>();
    const list = createRef<HTMLDivElement>();
    const item = createRef<HTMLDivElement>();
    renderWithTheme(
      <CommandPalette defaultOpen>
        <CommandPaletteContent ref={content} className="c" style={{ opacity: 0.5 }} data-testid="panel">
          <CommandPaletteInput ref={input} className="i" style={{ order: 1 }} />
          <CommandPaletteList ref={list} className="l" style={{ order: 2 }}>
            <CommandPaletteItem ref={item} className="o" style={{ order: 3 }}>
              One
            </CommandPaletteItem>
          </CommandPaletteList>
        </CommandPaletteContent>
      </CommandPalette>,
    );
    expect(content.current).toBe(panel());
    expect(panel()).toHaveClass('pp-command-palette', 'c');
    expect(panel()).toHaveStyle({ opacity: '0.5' });
    expect(panel()).toHaveAttribute('data-testid', 'panel');
    expect(input.current).toHaveClass('pp-command-palette__input', 'i');
    expect(list.current).toHaveClass('pp-command-palette__list', 'l');
    expect(item.current).toHaveClass('pp-command-palette__item', 'o');
    expect(item.current).toHaveStyle({ order: '3' });
    // Without a value, the item reports its text.
    expect(item.current).not.toHaveAttribute('data-value');
  });

  it('throws a readable error for a part outside the root', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderWithTheme(<CommandPaletteInput />)).toThrow(/<CommandPaletteInput> must be rendered inside <CommandPalette>/);
    error.mockRestore();
  });

  it('has no axe violations, open, in both themes', async () => {
    const light = renderWithTheme(<Palette defaultOpen />);
    await expectNoA11yViolations(document.body);
    light.unmount();
    const dark = renderWithTheme(<Palette defaultOpen />, { theme: 'dark' });
    await expectNoA11yViolations(document.body);
    dark.unmount();
  });
});
