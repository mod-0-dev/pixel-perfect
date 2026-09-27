import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from './Dialog';

function Basic({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <Dialog defaultOpen={defaultOpen}>
      <DialogTrigger>Rename</DialogTrigger>
      <DialogContent>
        <DialogTitle>Rename file</DialogTitle>
        <DialogDescription>The new name is applied everywhere.</DialogDescription>
        <input aria-label="Name" defaultValue="report.pdf" />
        <DialogClose>Cancel</DialogClose>
      </DialogContent>
    </Dialog>
  );
}

/* Scrim and panel are PORTALLED to <body>, outside the render container, so
   they are found through the document, never through the container. */
const panel = () => document.querySelector('.pp-dialog') as HTMLElement | null;
const scrim = () => document.querySelector('.pp-dialog__scrim') as HTMLElement | null;

describe('Dialog', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('open and close (spec §5)', () => {
    it('is closed until the trigger is pressed, and the trigger says so', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<Basic />);
      const trigger = getByRole('button', { name: 'Rename' });

      expect(panel()).toBeNull();
      expect(scrim()).toBeNull();
      expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveAttribute('data-state', 'closed');

      await user.click(trigger);
      expect(panel()).not.toBeNull();
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(trigger).toHaveAttribute('aria-controls', panel()!.id);
      expect(trigger).toHaveAttribute('data-state', 'open');
      expect(panel()).toHaveAttribute('data-state', 'open');
      expect(scrim()).toHaveAttribute('data-state', 'open');
      // The scrim is the panel's parent (spec §4).
      expect(panel()!.parentElement).toBe(scrim());
    });

    it('closes on Escape and returns focus to the trigger', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<Basic />);
      const trigger = getByRole('button', { name: 'Rename' });
      await user.click(trigger);
      expect(panel()).not.toBeNull();
      await user.keyboard('{Escape}');
      expect(panel()).toBeNull();
      expect(scrim()).toBeNull();
      expect(trigger).toHaveFocus();
    });

    it('closes on a press on the scrim, and not on a right-click there', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<Basic />);
      await user.click(getByRole('button', { name: 'Rename' }));
      expect(panel()).not.toBeNull();

      await user.pointer({ keys: '[MouseRight>]', target: scrim()! });
      await user.pointer({ keys: '[/MouseRight]' });
      expect(panel()).not.toBeNull();

      await user.click(scrim()!);
      expect(panel()).toBeNull();
    });

    it('closes from DialogClose', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<Basic />);
      await user.click(getByRole('button', { name: 'Rename' }));
      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(panel()).toBeNull();
    });

    it('opens with defaultOpen', () => {
      renderWithTheme(<Basic defaultOpen />);
      expect(panel()).not.toBeNull();
    });

    it('obeys a controlled open and reports the change it did not make', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      const { getByRole } = renderWithTheme(
        <Dialog open={false} onOpenChange={onOpenChange}>
          <DialogTrigger>Rename</DialogTrigger>
          <DialogContent aria-label="Rename">Inside</DialogContent>
        </Dialog>,
      );
      await user.click(getByRole('button', { name: 'Rename' }));
      expect(onOpenChange).toHaveBeenLastCalledWith(true);
      expect(panel()).toBeNull();
    });

    function Owner() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>Rename</DialogTrigger>
            <DialogContent aria-label="Rename">Inside</DialogContent>
          </Dialog>
          <output>{open ? 'open' : 'closed'}</output>
        </>
      );
    }

    it('round-trips through an owner', async () => {
      const user = userEvent.setup();
      const { getByRole, getByText } = renderWithTheme(<Owner />);
      await user.click(getByRole('button', { name: 'Rename' }));
      // By text, not by role: while the dialog is open the owner's <output>
      // is aria-hidden with the rest of the page, and role queries skip it.
      expect(getByText('open')).toBeInTheDocument();
      expect(panel()).not.toBeNull();
      await user.keyboard('{Escape}');
      expect(getByRole('status')).toHaveTextContent('closed');
    });

    it('lets onEscapeKeyDown veto the close', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(
        <Dialog>
          <DialogTrigger>Rename</DialogTrigger>
          <DialogContent aria-label="Rename" onEscapeKeyDown={(event) => event.preventDefault()}>
            Inside
          </DialogContent>
        </Dialog>,
      );
      await user.click(getByRole('button', { name: 'Rename' }));
      await user.keyboard('{Escape}');
      expect(panel()).not.toBeNull();
    });

    it('rejects a modal prop at the type level: a dialog is its modality (spec §2)', () => {
      // @ts-expect-error — there is no `modal` prop.
      const bad = <Dialog modal={false} />;
      expect(bad).toBeTruthy();
    });
  });

  describe('the name and the description (spec §6)', () => {
    it('is a modal dialog named by its Title and described by its Description', () => {
      renderWithTheme(<Basic defaultOpen />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('pp-dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAccessibleName('Rename file');
      expect(dialog).toHaveAccessibleDescription('The new name is applied everywhere.');
      expect(dialog).toHaveAttribute('aria-labelledby', screen.getByText('Rename file').id);
      expect(dialog).toHaveAttribute('aria-describedby', screen.getByText('The new name is applied everywhere.').id);
    });

    it('wires nothing that is not there: no Title, no aria-labelledby', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      renderWithTheme(
        <Dialog defaultOpen>
          <DialogContent>No title here</DialogContent>
        </Dialog>,
      );
      expect(panel()).not.toHaveAttribute('aria-labelledby');
      expect(panel()).not.toHaveAttribute('aria-describedby');
    });

    it('lets aria-label name a dialog with no visible title', () => {
      renderWithTheme(
        <Dialog defaultOpen>
          <DialogContent aria-label="Edit row">…</DialogContent>
        </Dialog>,
      );
      expect(screen.getByRole('dialog')).toHaveAccessibleName('Edit row');
    });

    it('warns in development when nothing names the dialog', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      renderWithTheme(
        <Dialog defaultOpen>
          <DialogContent>No name here</DialogContent>
        </Dialog>,
      );
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('no accessible name'));
    });

    it('does not warn with a Title, an aria-label or an aria-labelledby', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const a = renderWithTheme(<Basic defaultOpen />);
      a.unmount();
      const b = renderWithTheme(
        <Dialog defaultOpen>
          <DialogContent aria-label="Named">…</DialogContent>
        </Dialog>,
      );
      b.unmount();
      renderWithTheme(
        <>
          <span id="elsewhere">Elsewhere</span>
          <Dialog defaultOpen>
            <DialogContent aria-labelledby="elsewhere">…</DialogContent>
          </Dialog>
        </>,
      );
      expect(warn).not.toHaveBeenCalled();
    });

    it('renders the Title as a div and the Description as a p', () => {
      renderWithTheme(<Basic defaultOpen />);
      expect(screen.getByText('Rename file').tagName).toBe('DIV');
      expect(screen.getByText('The new name is applied everywhere.').tagName).toBe('P');
    });
  });

  describe('focus (spec §7)', () => {
    it('moves focus to the first tabbable on open', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<Basic />);
      await user.click(getByRole('button', { name: 'Rename' }));
      expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus();
    });

    function RowMenu() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Row actions
          </button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent aria-label="Edit row">
              <input aria-label="Value" />
            </DialogContent>
          </Dialog>
        </>
      );
    }

    it('without a trigger, returns focus to the element that had it', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<RowMenu />);
      const menu = getByRole('button', { name: 'Row actions' });
      await user.click(menu);
      expect(screen.getByRole('textbox', { name: 'Value' })).toHaveFocus();
      await user.keyboard('{Escape}');
      expect(panel()).toBeNull();
      // Radix alone lands this on <body> (spec §7, read in the 1.1.23 source).
      expect(menu).toHaveFocus();
    });

    it('lets onCloseAutoFocus take over the restore', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(
        <>
          <button type="button">Elsewhere</button>
          <Basic />
        </>,
      );
      await user.click(getByRole('button', { name: 'Rename' }));
      await user.keyboard('{Escape}');
      expect(getByRole('button', { name: 'Rename' })).toHaveFocus();
    });
  });

  describe('the page behind (spec §2, §4)', () => {
    it('hides the rest of the page from assistive tech while open, and restores it', async () => {
      const user = userEvent.setup();
      const { getByRole, getByText } = renderWithTheme(
        <>
          <p>Page content</p>
          <Basic />
        </>,
      );
      const content = getByText('Page content');
      expect(content.closest('[aria-hidden="true"]')).toBeNull();
      await user.click(getByRole('button', { name: 'Rename' }));
      expect(content.closest('[aria-hidden="true"]')).not.toBeNull();
      expect(panel()!.closest('[aria-hidden="true"]')).toBeNull();
      await user.keyboard('{Escape}');
      expect(content.closest('[aria-hidden="true"]')).toBeNull();
    });
  });

  describe('the theme crosses the portal; the tone does not (4.1 §3)', () => {
    it("writes the trigger scope's theme on the scrim", () => {
      renderWithTheme(<Basic defaultOpen />, { theme: 'dark' });
      expect(scrim()).toHaveAttribute('data-pp-theme', 'dark');
      // Portalled: the scrim is not inside the scope it copied from, and the
      // panel inherits from the scrim.
      expect(scrim()!.closest('[data-pp-theme="dark"]')).toBe(scrim());
      expect(panel()!.closest('[data-pp-theme]')).toBe(scrim());
    });

    it('does not copy the tone', () => {
      renderWithTheme(<Basic defaultOpen />, { theme: 'light', tone: 'danger' });
      expect(scrim()).toHaveAttribute('data-pp-theme', 'light');
      expect(scrim()).not.toHaveAttribute('data-pp-tone');
      expect(panel()).not.toHaveAttribute('data-pp-tone');
    });
  });

  describe('composition (RULES §5)', () => {
    it('merges the trigger and the close onto a Button and an IconButton with asChild', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Settings</Button>
          </DialogTrigger>
          <DialogContent aria-label="Settings">
            <DialogClose asChild>
              <IconButton label="Close">
                <svg />
              </IconButton>
            </DialogClose>
          </DialogContent>
        </Dialog>,
      );
      const trigger = getByRole('button', { name: 'Settings' });
      expect(trigger).toHaveClass('pp-button');
      expect(trigger).not.toHaveClass('pp-dialog__trigger');
      await user.click(trigger);
      expect(trigger).toHaveAttribute('data-state', 'open');
      const close = screen.getByRole('button', { name: 'Close' });
      expect(close).toHaveClass('pp-icon-button');
      expect(close).not.toHaveClass('pp-dialog__close');
      await user.click(close);
      expect(panel()).toBeNull();
    });

    it('forwards refs to the trigger and to the panel', () => {
      const trigger = createRef<HTMLButtonElement>();
      const content = createRef<HTMLDivElement>();
      renderWithTheme(
        <Dialog defaultOpen>
          <DialogTrigger ref={trigger}>Open</DialogTrigger>
          <DialogContent ref={content} aria-label="Panel">
            …
          </DialogContent>
        </Dialog>,
      );
      expect(trigger.current).toHaveClass('pp-dialog__trigger');
      expect(content.current).toHaveClass('pp-dialog');
    });

    it('merges className and style onto the panel and spreads the rest', () => {
      renderWithTheme(
        <Dialog defaultOpen>
          <DialogContent aria-label="Panel" className="mine" style={{ opacity: 0.5 }} data-testid="panel">
            …
          </DialogContent>
        </Dialog>,
      );
      expect(panel()).toHaveClass('pp-dialog', 'mine');
      expect(panel()).toHaveStyle({ opacity: '0.5' });
      expect(panel()).toHaveAttribute('data-testid', 'panel');
      expect(scrim()).not.toHaveClass('mine');
    });

    it('throws a readable error for a part outside the root', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => renderWithTheme(<DialogTitle>Lost</DialogTitle>)).toThrow(
        /<DialogTitle> must be rendered inside <Dialog>/,
      );
      error.mockRestore();
    });
  });

  describe('accessibility', () => {
    it('has no axe violations, open, in both themes, with no rule disabled', async () => {
      const light = renderWithTheme(<Basic defaultOpen />);
      await expectNoA11yViolations(document.body);
      light.unmount();
      const dark = renderWithTheme(<Basic defaultOpen />, { theme: 'dark' });
      await expectNoA11yViolations(document.body);
      dark.unmount();
    });
  });
});
