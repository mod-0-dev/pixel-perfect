import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuItemIndicator,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from './ContextMenu';

function Basic({ disabled = false, defaultOpen = false }: { disabled?: boolean; defaultOpen?: boolean }) {
  return (
    <ContextMenu defaultOpen={defaultOpen}>
      <ContextMenuTrigger disabled={disabled} data-testid="region">
        A file
      </ContextMenuTrigger>
      <ContextMenuContent aria-label="File">
        <ContextMenuItem>
          Rename
          <ContextMenuShortcut>⌘R</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem disabled>Duplicate</ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Move to</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>Archive</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem defaultChecked onSelect={(e) => e.preventDefault()}>
          <ContextMenuItemIndicator />
          Pinned
        </ContextMenuCheckboxItem>
        <ContextMenuItem tone="danger">Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

const menu = () => document.querySelector('.pp-context-menu') as HTMLElement | null;

describe('ContextMenu', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is a region that opens DropdownMenu\'s list on a secondary press (spec §1, §2, §3)', async () => {
    const user = userEvent.setup();
    const { getByTestId } = renderWithTheme(<Basic />);
    const region = getByTestId('region');
    expect(region.tagName).toBe('DIV');
    expect(region).toHaveClass('pp-context-menu__trigger');
    expect(region).toHaveAttribute('data-state', 'closed');
    expect(menu()).toBeNull();

    await user.pointer({ keys: '[MouseRight]', target: region });
    const list = screen.getByRole('menu', { name: 'File' });
    // The two-class contract: DropdownMenu's class first, its own second.
    expect(list).toHaveClass('pp-dropdown-menu', 'pp-context-menu');
    expect(region).toHaveAttribute('data-state', 'open');
    const rename = screen.getByRole('menuitem', { name: 'Rename' });
    expect(rename).toHaveClass('pp-dropdown-menu__item', 'pp-context-menu__item');
    expect(rename).toHaveAttribute('data-pp-tone', 'neutral');
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveAttribute('data-pp-tone', 'danger');
    expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('separator')).toHaveClass('pp-dropdown-menu__separator', 'pp-context-menu__separator');
    expect(list.querySelector('.pp-dropdown-menu__shortcut')).toHaveAttribute('aria-hidden', 'true');
    const pinned = screen.getByRole('menuitemcheckbox', { name: 'Pinned' });
    expect(pinned).toHaveAttribute('aria-checked', 'true');
    expect(pinned.querySelector('.pp-dropdown-menu__indicator.pp-context-menu__indicator svg')).not.toBeNull();
  });

  it('does not open when disabled, and Escape closes an open one', async () => {
    const user = userEvent.setup();
    const { getByTestId, unmount } = renderWithTheme(<Basic disabled />);
    const region = getByTestId('region');
    expect(region).toHaveAttribute('data-disabled');
    await user.pointer({ keys: '[MouseRight]', target: region });
    expect(menu()).toBeNull();
    unmount();

    const live = renderWithTheme(<Basic />);
    await user.pointer({ keys: '[MouseRight]', target: live.getByTestId('region') });
    expect(menu()).not.toBeNull();
    await user.keyboard('{Escape}');
    expect(menu()).toBeNull();
  });

  it('the shared parts behave: the checkbox item toggles and stays open, the submenu opens on ArrowRight', async () => {
    const user = userEvent.setup();
    const { getByTestId } = renderWithTheme(<Basic />);
    await user.pointer({ keys: '[MouseRight]', target: getByTestId('region') });
    const pinned = screen.getByRole('menuitemcheckbox', { name: 'Pinned' });
    await user.click(pinned);
    expect(pinned).toHaveAttribute('aria-checked', 'false');
    expect(menu()).not.toBeNull();
    // The click left the checkbox item highlighted; the arrows move from there.
    await user.keyboard('{ArrowUp}');
    const sub = screen.getByRole('menuitem', { name: 'Move to' });
    expect(sub).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('menuitem', { name: 'Archive' })).toHaveFocus();
    expect(screen.getByRole('menuitem', { name: 'Archive' }).closest('.pp-dropdown-menu')).toHaveClass(
      'pp-context-menu',
      'pp-dropdown-menu__sub',
      'pp-context-menu__sub',
    );
  });

  it("reads the region's direction at open time: under dir=rtl the submenu opens on ArrowLeft (spec §5)", async () => {
    const user = userEvent.setup();
    const { getByTestId } = renderWithTheme(
      <div dir="rtl">
        <Basic />
      </div>,
    );
    await user.pointer({ keys: '[MouseRight]', target: getByTestId('region') });
    expect(menu()).toHaveAttribute('dir', 'rtl');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Move to' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.queryByRole('menuitem', { name: 'Archive' })).toBeNull();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('menuitem', { name: 'Archive' })).toHaveFocus();
  });

  function Owner() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <ContextMenu open={open} onOpenChange={setOpen}>
          <ContextMenuTrigger data-testid="region">A file</ContextMenuTrigger>
          <ContextMenuContent aria-label="File">
            <ContextMenuItem>One</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        <output>{String(open)}</output>
      </>
    );
  }

  it('is controllable, and defaultOpen renders the list (spec §6)', async () => {
    const user = userEvent.setup();
    const owner = renderWithTheme(<Owner />);
    await user.pointer({ keys: '[MouseRight]', target: owner.getByTestId('region') });
    expect(menu()).not.toBeNull();
    expect(owner.container.querySelector('output')).toHaveTextContent('true');
    await user.keyboard('{Escape}');
    expect(menu()).toBeNull();
    expect(owner.container.querySelector('output')).toHaveTextContent('false');
    owner.unmount();

    renderWithTheme(<Basic defaultOpen />);
    expect(menu()).not.toBeNull();
  });

  it("writes the region's theme on the panel, and asChild renders the consumer's region", async () => {
    const user = userEvent.setup();
    const region = createRef<HTMLElement>();
    renderWithTheme(
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <section ref={region} className="card" data-testid="card">
            A card
          </section>
        </ContextMenuTrigger>
        <ContextMenuContent aria-label="Card">
          <ContextMenuItem>One</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
      { theme: 'dark', tone: 'danger' },
    );
    expect(region.current?.tagName).toBe('SECTION');
    expect(region.current).toHaveClass('card');
    expect(region.current).not.toHaveClass('pp-context-menu__trigger');
    expect(region.current).toHaveAttribute('data-state', 'closed');
    await user.pointer({ keys: '[MouseRight]', target: region.current! });
    expect(menu()).toHaveAttribute('data-pp-theme', 'dark');
    expect(menu()).not.toHaveAttribute('data-pp-tone');
  });

  it('forwards refs and merges className and style onto the region and the panel', () => {
    const content = createRef<HTMLDivElement>();
    const trigger = createRef<HTMLDivElement>();
    renderWithTheme(
      <ContextMenu defaultOpen>
        <ContextMenuTrigger ref={trigger} className="mine" style={{ opacity: 0.5 }}>
          A file
        </ContextMenuTrigger>
        <ContextMenuContent ref={content} aria-label="File" className="list" style={{ order: 2 }} data-testid="m">
          <ContextMenuItem>One</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    expect(trigger.current).toHaveClass('pp-context-menu__trigger', 'mine');
    expect(trigger.current).toHaveStyle({ opacity: '0.5' });
    expect(content.current).toBe(menu());
    expect(menu()).toHaveClass('pp-dropdown-menu', 'pp-context-menu', 'list');
    expect(menu()).toHaveStyle({ order: '2' });
    expect(menu()).toHaveAttribute('data-testid', 'm');
  });

  it('throws a readable error for a part outside the root', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderWithTheme(<ContextMenuItem>Lost</ContextMenuItem>)).toThrow(/<ContextMenuItem> must be rendered inside <ContextMenu>/);
    error.mockRestore();
  });

  /* axe's `region` rule, off for the reason DropdownMenu's test gives. */
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
