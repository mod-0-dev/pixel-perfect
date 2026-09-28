import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuItemIndicator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './DropdownMenu';

function Basic({
  defaultOpen = false,
  onRename,
  onDelete,
}: {
  defaultOpen?: boolean;
  onRename?: (event: Event) => void;
  onDelete?: (event: Event) => void;
}) {
  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger>Options</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem {...(onRename ? { onSelect: onRename } : {})}>
          Rename
          <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>Duplicate</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem tone="danger" {...(onDelete ? { onSelect: onDelete } : {})}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* Portalled: everything inside the menu is found through `screen`. */
const menu = () => document.querySelector('.pp-dropdown-menu') as HTMLElement | null;

describe('DropdownMenu', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('open and close (spec §1, §6, §8)', () => {
    it('is a menu named by its trigger, opened by a click, with the roles the pattern asks for', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<Basic />);
      const trigger = getByRole('button', { name: 'Options' });
      expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveAttribute('data-state', 'closed');
      expect(menu()).toBeNull();

      await user.click(trigger);
      const list = screen.getByRole('menu', { name: 'Options' });
      expect(list).toHaveClass('pp-dropdown-menu');
      expect(list).toHaveAttribute('data-state', 'open');
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(trigger).toHaveAttribute('aria-controls', list.id);
      expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveClass('pp-dropdown-menu__item');
      expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveAttribute('aria-disabled', 'true');
      expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveAttribute('data-disabled');
      expect(screen.getByRole('separator')).toHaveClass('pp-dropdown-menu__separator');
    });

    it('opens on ArrowDown with the first item focused, and Escape returns focus to the trigger', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<Basic />);
      const trigger = getByRole('button', { name: 'Options' });
      trigger.focus();
      await user.keyboard('{ArrowDown}');
      expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveFocus();
      await user.keyboard('{Escape}');
      expect(menu()).toBeNull();
      expect(trigger).toHaveFocus();
    });

    it('activates an item on Enter: onSelect fires and the menu closes', async () => {
      const user = userEvent.setup();
      const onRename = vi.fn();
      const { getByRole } = renderWithTheme(<Basic onRename={onRename} />);
      getByRole('button', { name: 'Options' }).focus();
      await user.keyboard('{ArrowDown}{Enter}');
      expect(onRename).toHaveBeenCalledTimes(1);
      expect(menu()).toBeNull();
    });

    it('stays open when onSelect prevents the default, and a disabled item never selects', async () => {
      const user = userEvent.setup();
      const onRename = vi.fn((event: Event) => event.preventDefault());
      const { getByRole } = renderWithTheme(<Basic onRename={onRename} />);
      await user.click(getByRole('button', { name: 'Options' }));
      await user.click(screen.getByRole('menuitem', { name: 'Rename' }));
      expect(onRename).toHaveBeenCalledTimes(1);
      expect(menu()).not.toBeNull();
      await user.click(screen.getByRole('menuitem', { name: 'Duplicate' }));
      expect(menu()).not.toBeNull();
    });

    function Owner() {
      const [open, setOpen] = useState(false);
      return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger>{open ? 'Close' : 'Open'}</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>One</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    it('is controllable', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<Owner />);
      const trigger = getByRole('button', { name: 'Open' });
      await user.click(trigger);
      // A modal menu hides the rest of the page from assistive tech — the
      // trigger included — so the button is read by its text, not its role.
      expect(trigger).toHaveTextContent('Close');
      expect(menu()).not.toBeNull();
      await user.keyboard('{Escape}');
      expect(trigger).toHaveTextContent('Open');
      expect(menu()).toBeNull();
    });
  });

  describe('items (spec §7)', () => {
    it('writes the tone on a danger item and neutral on the rest; the shortcut is hidden from assistive tech', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<Basic />);
      await user.click(getByRole('button', { name: 'Options' }));
      expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveAttribute('data-pp-tone', 'danger');
      expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveAttribute('data-pp-tone', 'neutral');
      const shortcut = menu()!.querySelector('.pp-dropdown-menu__shortcut');
      expect(shortcut).toHaveAttribute('aria-hidden', 'true');
      // The accessible name is the command, not the hint.
      expect(screen.getByRole('menuitem', { name: 'Rename' })).not.toHaveAccessibleName(/⌘/);
    });

    it('a checkbox item is uncontrolled with defaultChecked, reports its state, and shows the mark while checked', async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      renderWithTheme(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Options</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem defaultChecked onCheckedChange={onCheckedChange} onSelect={(e) => e.preventDefault()}>
              <DropdownMenuItemIndicator />
              Grid
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );
      const item = screen.getByRole('menuitemcheckbox', { name: 'Grid' });
      expect(item).toHaveAttribute('aria-checked', 'true');
      expect(item).toHaveAttribute('data-state', 'checked');
      expect(item.querySelector('.pp-dropdown-menu__indicator svg')).not.toBeNull();
      await user.click(item);
      expect(onCheckedChange).toHaveBeenCalledWith(false);
      expect(item).toHaveAttribute('aria-checked', 'false');
      expect(item).toHaveAttribute('data-state', 'unchecked');
      expect(item.querySelector('.pp-dropdown-menu__indicator')).toBeNull();
      expect(menu()).not.toBeNull();
    });

    it('a controlled checkbox item follows its owner, and indeterminate draws the dash', async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      renderWithTheme(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Options</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked="indeterminate" onCheckedChange={onCheckedChange} onSelect={(e) => e.preventDefault()}>
              <DropdownMenuItemIndicator />
              Some
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );
      const item = screen.getByRole('menuitemcheckbox', { name: 'Some' });
      expect(item).toHaveAttribute('aria-checked', 'mixed');
      expect(item).toHaveAttribute('data-state', 'indeterminate');
      // The dash has one straight path; the check has a bent one.
      expect(item.querySelector('.pp-dropdown-menu__indicator path')).toHaveAttribute('d', 'M6 12h12');
      await user.click(item);
      expect(onCheckedChange).toHaveBeenCalledWith(true);
      // Controlled: still indeterminate until the owner says otherwise.
      expect(item).toHaveAttribute('aria-checked', 'mixed');
    });

    it('a radio group is uncontrolled with defaultValue and controlled with value; the checked item draws the dot', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      renderWithTheme(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Sort</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup defaultValue="name" onValueChange={onValueChange}>
              <DropdownMenuRadioItem value="name" onSelect={(e) => e.preventDefault()}>
                <DropdownMenuItemIndicator />
                Name
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="date" onSelect={(e) => e.preventDefault()}>
                <DropdownMenuItemIndicator />
                Date
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>,
      );
      const name = screen.getByRole('menuitemradio', { name: 'Name' });
      const date = screen.getByRole('menuitemradio', { name: 'Date' });
      expect(name).toHaveAttribute('aria-checked', 'true');
      expect(name.querySelector('.pp-dropdown-menu__indicator circle')).not.toBeNull();
      expect(date).toHaveAttribute('aria-checked', 'false');
      await user.click(date);
      expect(onValueChange).toHaveBeenCalledWith('date');
      expect(date).toHaveAttribute('aria-checked', 'true');
      expect(name).toHaveAttribute('aria-checked', 'false');
    });

    it('a label names its group, and warns in development when a group has none', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      renderWithTheme(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Options</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuLabel>View</DropdownMenuLabel>
              <DropdownMenuItem>Grid</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuGroup>
              <DropdownMenuItem>Nameless</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>,
      );
      expect(screen.getByRole('group', { name: 'View' })).toHaveClass('pp-dropdown-menu__group');
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('<DropdownMenuGroup> has no accessible name'));
    });
  });

  describe('submenus and direction (spec §5)', () => {
    function WithSub() {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger>Options</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Rename</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Archive</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    it('the sub trigger is an item with a popup, and the submenu opens on ArrowRight in LTR', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<WithSub />);
      getByRole('button', { name: 'Options' }).focus();
      await user.keyboard('{ArrowDown}{ArrowDown}');
      const sub = screen.getByRole('menuitem', { name: 'Move to' });
      expect(sub).toHaveFocus();
      expect(sub).toHaveClass('pp-dropdown-menu__item', 'pp-dropdown-menu__sub-trigger');
      expect(sub).toHaveAttribute('aria-haspopup', 'menu');
      expect(sub).toHaveAttribute('aria-expanded', 'false');
      expect(sub.querySelector('.pp-dropdown-menu__chevron')).not.toBeNull();
      await user.keyboard('{ArrowRight}');
      expect(sub).toHaveAttribute('aria-expanded', 'true');
      const archive = screen.getByRole('menuitem', { name: 'Archive' });
      expect(archive).toHaveFocus();
      expect(archive.closest('.pp-dropdown-menu')).toHaveClass('pp-dropdown-menu__sub');
      await user.keyboard('{ArrowLeft}');
      expect(screen.queryByRole('menuitem', { name: 'Archive' })).toBeNull();
      expect(sub).toHaveFocus();
    });

    it("reads the trigger's direction at open time: under dir=rtl the submenu opens on ArrowLeft", async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(
        <div dir="rtl">
          <WithSub />
        </div>,
      );
      getByRole('button', { name: 'Options' }).focus();
      await user.keyboard('{ArrowDown}{ArrowDown}');
      const sub = screen.getByRole('menuitem', { name: 'Move to' });
      // Radix writes the direction it was given on the panel.
      expect(menu()).toHaveAttribute('dir', 'rtl');
      await user.keyboard('{ArrowRight}');
      expect(screen.queryByRole('menuitem', { name: 'Archive' })).toBeNull();
      await user.keyboard('{ArrowLeft}');
      expect(screen.getByRole('menuitem', { name: 'Archive' })).toHaveFocus();
      expect(sub).toHaveAttribute('aria-expanded', 'true');
    });
  });

  it("writes the trigger scope's theme on the panel, and not the tone", async () => {
    const user = userEvent.setup();
    const { getByRole } = renderWithTheme(<Basic />, { theme: 'dark', tone: 'danger' });
    await user.click(getByRole('button', { name: 'Options' }));
    expect(menu()).toHaveAttribute('data-pp-theme', 'dark');
    expect(menu()).not.toHaveAttribute('data-pp-tone');
  });

  it('forwards refs and merges className and style onto the panel and the items', () => {
    const content = createRef<HTMLDivElement>();
    const item = createRef<HTMLDivElement>();
    renderWithTheme(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Options</DropdownMenuTrigger>
        <DropdownMenuContent ref={content} className="mine" style={{ opacity: 0.5 }} data-testid="m">
          <DropdownMenuItem ref={item} className="row" style={{ order: 2 }}>
            One
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(content.current).toBe(menu());
    expect(menu()).toHaveClass('pp-dropdown-menu', 'mine');
    expect(menu()).toHaveStyle({ opacity: '0.5' });
    expect(menu()).toHaveAttribute('data-testid', 'm');
    expect(item.current).toBe(screen.getByRole('menuitem', { name: 'One' }));
    expect(item.current).toHaveClass('pp-dropdown-menu__item', 'row');
    expect(item.current).toHaveStyle({ order: '2' });
  });

  it('throws a readable error for a part outside the root', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderWithTheme(<DropdownMenuItem>Lost</DropdownMenuItem>)).toThrow(
      /<DropdownMenuItem> must be rendered inside <DropdownMenu>/,
    );
    error.mockRestore();
  });

  /*
   * axe's `region` rule (a best practice about page landmarks) flags the
   * portalled list because it lands in <body> outside any landmark — as a
   * `role="dialog"` does not, being exempt. That is where every portal puts
   * every menu, in every app; the docs page says so, and the rule is off
   * here so the ones that matter (`aria-*`, roles, names) are what is run.
   */
  const options = { rules: { region: { enabled: false } } };

  it('has no axe violations, open, in both themes', async () => {
    const light = renderWithTheme(<Basic defaultOpen />);
    await expectNoA11yViolations(document.body, options);
    light.unmount();
    const dark = renderWithTheme(<Basic defaultOpen />, { theme: 'dark' });
    await expectNoA11yViolations(document.body, options);
    dark.unmount();
  });
});
