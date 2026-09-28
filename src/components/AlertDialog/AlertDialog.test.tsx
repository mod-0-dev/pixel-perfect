import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Button } from '../Button/Button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './AlertDialog';

function Basic({ defaultOpen = false, onAction }: { defaultOpen?: boolean; onAction?: () => void }) {
  return (
    <AlertDialog defaultOpen={defaultOpen}>
      <AlertDialogTrigger>Delete</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>Delete this report?</AlertDialogTitle>
        <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        <AlertDialogCancel>Keep it</AlertDialogCancel>
        <AlertDialogAction onClick={onAction}>Delete it</AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const panel = () => document.querySelector('.pp-alert-dialog') as HTMLElement | null;
const scrim = () => document.querySelector('.pp-alert-dialog__scrim') as HTMLElement | null;

describe('AlertDialog', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is an alertdialog, modal, named and described, drawn by Dialog (spec §2, §4)', async () => {
    const user = userEvent.setup();
    const { getByRole } = renderWithTheme(<Basic />);
    await user.click(getByRole('button', { name: 'Delete' }));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Delete this report?');
    expect(dialog).toHaveAccessibleDescription('This cannot be undone.');
    // The two-class contract: Dialog's stylesheet reaches every part.
    expect(dialog).toHaveClass('pp-dialog', 'pp-alert-dialog');
    expect(scrim()).toHaveClass('pp-dialog__scrim', 'pp-alert-dialog__scrim');
    expect(screen.getByText('Delete this report?')).toHaveClass('pp-dialog__title', 'pp-alert-dialog__title');
    expect(screen.getByText('This cannot be undone.')).toHaveClass('pp-dialog__description', 'pp-alert-dialog__description');
    expect(dialog.parentElement).toBe(scrim());
  });

  describe('focus (spec §3)', () => {
    it('lands on Cancel on open, and returns to the trigger on Escape', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<Basic />);
      const trigger = getByRole('button', { name: 'Delete' });
      await user.click(trigger);
      expect(screen.getByRole('button', { name: 'Keep it' })).toHaveFocus();
      await user.keyboard('{Escape}');
      expect(panel()).toBeNull();
      expect(trigger).toHaveFocus();
    });

    it('takes focus on the panel, and warns, when there is no Cancel', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(
        <AlertDialog>
          <AlertDialogTrigger>Delete</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>No way out</AlertDialogTitle>
            <AlertDialogAction>Delete it</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>,
      );
      await user.click(getByRole('button', { name: 'Delete' }));
      // Radix alone leaves focus on the trigger, outside the trap.
      expect(panel()).toHaveFocus();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('no <AlertDialogCancel>'));
    });
  });

  describe('closing (spec §3)', () => {
    it('does not close on a press on the scrim', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<Basic />);
      await user.click(getByRole('button', { name: 'Delete' }));
      await user.click(scrim()!);
      expect(panel()).not.toBeNull();
    });

    it('closes from Cancel, and from Action after its onClick', async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      const { getByRole } = renderWithTheme(<Basic onAction={onAction} />);
      await user.click(getByRole('button', { name: 'Delete' }));
      await user.click(screen.getByRole('button', { name: 'Keep it' }));
      expect(panel()).toBeNull();
      expect(onAction).not.toHaveBeenCalled();

      await user.click(getByRole('button', { name: 'Delete' }));
      await user.click(screen.getByRole('button', { name: 'Delete it' }));
      expect(panel()).toBeNull();
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('obeys a controlled open', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      const { getByRole } = renderWithTheme(
        <AlertDialog open={false} onOpenChange={onOpenChange}>
          <AlertDialogTrigger>Delete</AlertDialogTrigger>
          <AlertDialogContent aria-label="Delete?">
            <AlertDialogCancel>Keep it</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>,
      );
      await user.click(getByRole('button', { name: 'Delete' }));
      expect(onOpenChange).toHaveBeenLastCalledWith(true);
      expect(panel()).toBeNull();
    });

    it('rejects the outside-press handlers and modal at the type level', () => {
      // @ts-expect-error — a scrim press never closes an alert dialog (spec §3).
      const a = <AlertDialogContent onPointerDownOutside={() => {}} />;
      // @ts-expect-error — no `modal`.
      const b = <AlertDialog modal={false} />;
      expect(a).toBeTruthy();
      expect(b).toBeTruthy();
    });
  });

  describe('the name (spec §4)', () => {
    it('warns in development when nothing names the panel, and not otherwise', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const a = renderWithTheme(
        <AlertDialog defaultOpen>
          <AlertDialogContent>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>,
      );
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('no accessible name'));
      a.unmount();
      warn.mockClear();
      renderWithTheme(<Basic defaultOpen />);
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('the theme crosses the portal (4.1 §3)', () => {
    it("writes the trigger scope's theme on the scrim", () => {
      renderWithTheme(<Basic defaultOpen />, { theme: 'dark' });
      expect(scrim()).toHaveAttribute('data-pp-theme', 'dark');
      expect(scrim()).not.toHaveAttribute('data-pp-tone');
    });
  });

  describe('composition (RULES §5)', () => {
    it('merges the trigger, Cancel and Action onto Buttons with asChild', async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      const { getByRole } = renderWithTheme(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" tone="danger">
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent aria-label="Delete?">
            <AlertDialogCancel asChild>
              <Button variant="ghost">Keep it</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button tone="danger" onClick={onAction}>
                Delete it
              </Button>
            </AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>,
      );
      const trigger = getByRole('button', { name: 'Delete' });
      expect(trigger).toHaveClass('pp-button');
      await user.click(trigger);
      const cancel = screen.getByRole('button', { name: 'Keep it' });
      expect(cancel).toHaveClass('pp-button', 'pp-alert-dialog__cancel');
      expect(cancel).not.toHaveClass('pp-alert-dialog__button');
      expect(cancel).toHaveFocus();
      await user.click(screen.getByRole('button', { name: 'Delete it' }));
      expect(onAction).toHaveBeenCalledTimes(1);
      expect(panel()).toBeNull();
    });

    it('forwards refs and merges className and style onto the panel', () => {
      const content = createRef<HTMLDivElement>();
      renderWithTheme(
        <AlertDialog defaultOpen>
          <AlertDialogContent ref={content} aria-label="Panel" className="mine" style={{ opacity: 0.5 }} data-testid="p">
            <AlertDialogCancel>Keep it</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>,
      );
      expect(content.current).toBe(panel());
      expect(panel()).toHaveClass('pp-dialog', 'pp-alert-dialog', 'mine');
      expect(panel()).toHaveStyle({ opacity: '0.5' });
      expect(panel()).toHaveAttribute('data-testid', 'p');
    });

    it('throws a readable error for a part outside the root', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => renderWithTheme(<AlertDialogCancel>Lost</AlertDialogCancel>)).toThrow(
        /<AlertDialogCancel> must be rendered inside <AlertDialog>/,
      );
      error.mockRestore();
    });
  });

  it('has no axe violations, open, in both themes, with no rule disabled', async () => {
    const light = renderWithTheme(<Basic defaultOpen />);
    await expectNoA11yViolations(document.body);
    light.unmount();
    const dark = renderWithTheme(<Basic defaultOpen />, { theme: 'dark' });
    await expectNoA11yViolations(document.body);
    dark.unmount();
  });
});
