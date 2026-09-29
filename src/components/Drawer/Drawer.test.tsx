import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from './Drawer';

function Basic({ defaultOpen = false, side }: { defaultOpen?: boolean; side?: 'start' | 'end' | 'top' | 'bottom' }) {
  return (
    <Drawer defaultOpen={defaultOpen}>
      <DrawerTrigger>Menu</DrawerTrigger>
      <DrawerContent {...(side ? { side } : {})}>
        <DrawerTitle>Navigation</DrawerTitle>
        <DrawerDescription>Where to next.</DrawerDescription>
        <a href="#home">Home</a>
        <DrawerClose>Close</DrawerClose>
      </DrawerContent>
    </Drawer>
  );
}

const panel = () => document.querySelector('.pp-drawer') as HTMLElement | null;
const scrim = () => document.querySelector('.pp-drawer__scrim') as HTMLElement | null;

describe('Drawer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is a modal dialog drawn on Dialog\'s scrim, anchored to the end by default (spec §1, §2)', async () => {
    const user = userEvent.setup();
    const { getByRole } = renderWithTheme(<Basic />);
    await user.click(getByRole('button', { name: 'Menu' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('pp-drawer');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Navigation');
    expect(dialog).toHaveAccessibleDescription('Where to next.');
    expect(scrim()).toHaveClass('pp-dialog__scrim', 'pp-drawer__scrim');
    expect(dialog.parentElement).toBe(scrim());
    // `end` in the default left-to-right direction is the right edge, and
    // the attribute is physical (4.1 §5).
    expect(scrim()).toHaveAttribute('data-side', 'right');
    expect(dialog).toHaveAttribute('data-side', 'right');
  });

  it.each([
    ['start', 'left'],
    ['end', 'right'],
    ['top', 'top'],
    ['bottom', 'bottom'],
  ] as const)('resolves side=%s to data-side=%s in LTR', (side, physical) => {
    renderWithTheme(<Basic defaultOpen side={side} />);
    expect(scrim()).toHaveAttribute('data-side', physical);
  });

  it('rejects a physical side at the type level', () => {
    // @ts-expect-error — `left` is not a logical side.
    const bad = <DrawerContent side="left" />;
    expect(bad).toBeTruthy();
  });

  describe('open and close (Dialog\'s rules)', () => {
    it('closes on Escape and returns focus to the trigger', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<Basic />);
      const trigger = getByRole('button', { name: 'Menu' });
      await user.click(trigger);
      // Radix's focus scope skips LINKS when it auto-focuses on mount, so a
      // navigation drawer's first focus is its first button (D-071 §4).
      expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
      await user.keyboard('{Escape}');
      expect(panel()).toBeNull();
      expect(trigger).toHaveFocus();
    });

    it('closes on a scrim press and from DrawerClose', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<Basic />);
      await user.click(getByRole('button', { name: 'Menu' }));
      await user.click(scrim()!);
      expect(panel()).toBeNull();
      await user.click(getByRole('button', { name: 'Menu' }));
      await user.click(screen.getByRole('button', { name: 'Close' }));
      expect(panel()).toBeNull();
    });

    function Owner() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Row actions
          </button>
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerContent aria-label="Details">
              <input aria-label="Value" />
            </DrawerContent>
          </Drawer>
        </>
      );
    }

    it('is controllable, and without a trigger returns focus to what opened it', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<Owner />);
      const opener = getByRole('button', { name: 'Row actions' });
      await user.click(opener);
      expect(screen.getByRole('textbox', { name: 'Value' })).toHaveFocus();
      await user.keyboard('{Escape}');
      expect(panel()).toBeNull();
      expect(opener).toHaveFocus();
    });
  });

  it('warns in development when nothing names the panel', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderWithTheme(
      <Drawer defaultOpen>
        <DrawerContent>No name</DrawerContent>
      </Drawer>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no accessible name'));
  });

  it("writes the trigger scope's theme on the scrim, and not the tone", () => {
    renderWithTheme(<Basic defaultOpen />, { theme: 'dark', tone: 'danger' });
    expect(scrim()).toHaveAttribute('data-pp-theme', 'dark');
    expect(scrim()).not.toHaveAttribute('data-pp-tone');
  });

  it('forwards refs and merges className and style onto the panel', () => {
    const content = createRef<HTMLDivElement>();
    renderWithTheme(
      <Drawer defaultOpen>
        <DrawerContent ref={content} aria-label="Panel" className="mine" style={{ opacity: 0.5 }} data-testid="p">
          …
        </DrawerContent>
      </Drawer>,
    );
    expect(content.current).toBe(panel());
    expect(panel()).toHaveClass('pp-drawer', 'mine');
    expect(panel()).toHaveStyle({ opacity: '0.5' });
    expect(panel()).toHaveAttribute('data-testid', 'p');
  });

  it('throws a readable error for a part outside the root', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderWithTheme(<DrawerTitle>Lost</DrawerTitle>)).toThrow(/<DrawerTitle> must be rendered inside <Drawer>/);
    error.mockRestore();
  });

  it('has no axe violations, open, in both themes', async () => {
    const light = renderWithTheme(<Basic defaultOpen />);
    await expectNoA11yViolations(document.body);
    light.unmount();
    const dark = renderWithTheme(<Basic defaultOpen />, { theme: 'dark' });
    await expectNoA11yViolations(document.body);
    dark.unmount();
  });
});
