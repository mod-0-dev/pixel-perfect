import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Button } from '../Button/Button';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from './Popover';

function Basic({ defaultOpen = false, ...content }: { defaultOpen?: boolean; side?: 'top' | 'bottom' | 'start' | 'end' }) {
  return (
    <Popover defaultOpen={defaultOpen}>
      <PopoverTrigger>Open</PopoverTrigger>
      <PopoverContent {...content}>
        <PopoverTitle>Filters</PopoverTitle>
        <PopoverDescription>Narrow the list.</PopoverDescription>
        <button type="button">Apply</button>
        <PopoverClose>Done</PopoverClose>
      </PopoverContent>
    </Popover>
  );
}

/* The panel is PORTALLED to <body>, outside the render container, so
   anything inside it is found through `screen`, never through the container's
   own queries — which is also the first thing a consumer's test hits. */
const panel = () => document.querySelector('.pp-popover') as HTMLElement | null;

describe('Popover', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('open and close (spec §7)', () => {
    it('is closed until the trigger is pressed, and the trigger says so', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<Basic />);
      const trigger = getByRole('button', { name: 'Open' });

      expect(panel()).toBeNull();
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveAttribute('data-state', 'closed');

      await user.click(trigger);
      expect(panel()).not.toBeNull();
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(trigger).toHaveAttribute('data-state', 'open');
      expect(trigger).toHaveAttribute('aria-controls', panel()!.id);
      expect(panel()).toHaveAttribute('data-state', 'open');
    });

    it('closes on Escape and returns focus to the trigger', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<Basic />);
      const trigger = getByRole('button', { name: 'Open' });

      await user.click(trigger);
      expect(panel()).not.toBeNull();
      await user.keyboard('{Escape}');
      expect(panel()).toBeNull();
      expect(trigger).toHaveFocus();
    });

    it('closes on a press outside', async () => {
      const user = userEvent.setup();
      const { getByRole, getByText } = renderWithTheme(
        <>
          <Basic />
          <p>Elsewhere</p>
        </>,
      );
      await user.click(getByRole('button', { name: 'Open' }));
      expect(panel()).not.toBeNull();
      await user.click(getByText('Elsewhere'));
      expect(panel()).toBeNull();
    });

    it('closes from PopoverClose', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<Basic />);
      await user.click(getByRole('button', { name: 'Open' }));
      await user.click(screen.getByRole('button', { name: 'Done' }));
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
        <Popover open={false} onOpenChange={onOpenChange}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent aria-label="Panel">Inside</PopoverContent>
        </Popover>,
      );
      await user.click(getByRole('button', { name: 'Open' }));
      expect(onOpenChange).toHaveBeenLastCalledWith(true);
      // The owner never updated `open`, so nothing opened.
      expect(panel()).toBeNull();
    });

    function Owner() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger>Open</PopoverTrigger>
            <PopoverContent aria-label="Panel">Inside</PopoverContent>
          </Popover>
          <output>{open ? 'open' : 'closed'}</output>
        </>
      );
    }

    it('round-trips through an owner', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<Owner />);
      await user.click(getByRole('button', { name: 'Open' }));
      expect(getByRole('status')).toHaveTextContent('open');
      expect(panel()).not.toBeNull();
      await user.keyboard('{Escape}');
      expect(getByRole('status')).toHaveTextContent('closed');
    });
  });

  describe('the name and the description (spec §2)', () => {
    it('is a dialog named by its Title and described by its Description', () => {
      renderWithTheme(<Basic defaultOpen />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAccessibleName('Filters');
      expect(dialog).toHaveAccessibleDescription('Narrow the list.');
      expect(dialog).toHaveClass('pp-popover');
    });

    it('lets aria-label replace the Title wiring', () => {
      renderWithTheme(
        <Popover defaultOpen>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent aria-label="Share">
            <PopoverTitle>Ignored for the name</PopoverTitle>
          </PopoverContent>
        </Popover>,
      );
      expect(screen.getByRole('dialog')).toHaveAccessibleName('Share');
    });

    it('warns in development when nothing names the dialog', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      renderWithTheme(
        <Popover defaultOpen>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>No name here</PopoverContent>
        </Popover>,
      );
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('no accessible name'));
    });

    it('does not warn when a Title, aria-label or aria-labelledby is present', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      renderWithTheme(<Basic defaultOpen />);
      renderWithTheme(
        <Popover defaultOpen>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent aria-label="Named">…</PopoverContent>
        </Popover>,
      );
      expect(warn).not.toHaveBeenCalled();
    });

    it('renders the Title as a div, never a heading', () => {
      renderWithTheme(<Basic defaultOpen />);
      expect(screen.getByText('Filters').tagName).toBe('DIV');
    });
  });

  describe('the theme crosses the portal; the tone does not (4.1 §3)', () => {
    it('writes the trigger scope\'s theme on the panel', () => {
      renderWithTheme(<Basic defaultOpen />, { theme: 'dark' });
      expect(panel()).toHaveAttribute('data-pp-theme', 'dark');
      // Portalled: the panel is not inside the scope it copied from.
      expect(panel()!.closest('[data-pp-theme="dark"]')).toBe(panel());
    });

    it('does not copy the tone', () => {
      renderWithTheme(<Basic defaultOpen />, { theme: 'light', tone: 'danger' });
      expect(panel()).toHaveAttribute('data-pp-theme', 'light');
      expect(panel()).not.toHaveAttribute('data-pp-tone');
    });
  });

  describe('positioning props (spec §4)', () => {
    it('hands Radix a physical side resolved from the logical one', () => {
      renderWithTheme(<Basic defaultOpen side="end" />);
      // jsdom has no layout, so floating-ui places the panel on the side it
      // was asked for: `end` in the default left-to-right direction is right.
      expect(panel()).toHaveAttribute('data-side', 'right');
    });

    it('rejects a physical side at the type level', () => {
      // @ts-expect-error — `left` is not a logical side (spec §4).
      const bad = <PopoverContent side="left" />;
      // @ts-expect-error — offsets are steps of the space scale, not pixels.
      const worse = <PopoverContent sideOffset={8} />;
      expect(bad).toBeTruthy();
      expect(worse).toBeTruthy();
    });
  });

  describe('composition (RULES §5)', () => {
    it('merges the trigger onto a Button with asChild', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Filters</Button>
          </PopoverTrigger>
          <PopoverContent aria-label="Filters">…</PopoverContent>
        </Popover>,
      );
      const trigger = getByRole('button', { name: 'Filters' });
      expect(trigger).toHaveClass('pp-button');
      expect(trigger).not.toHaveClass('pp-popover__trigger');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await user.click(trigger);
      expect(trigger).toHaveAttribute('data-state', 'open');
    });

    it('forwards refs to the trigger and to the panel', () => {
      const trigger = createRef<HTMLButtonElement>();
      const content = createRef<HTMLDivElement>();
      renderWithTheme(
        <Popover defaultOpen>
          <PopoverTrigger ref={trigger}>Open</PopoverTrigger>
          <PopoverContent ref={content} aria-label="Panel">…</PopoverContent>
        </Popover>,
      );
      expect(trigger.current).toHaveClass('pp-popover__trigger');
      expect(content.current).toHaveClass('pp-popover');
    });

    it('merges className and style onto the panel and spreads the rest', () => {
      renderWithTheme(
        <Popover defaultOpen>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent aria-label="Panel" className="mine" style={{ opacity: 0.5 }} data-testid="panel">
            …
          </PopoverContent>
        </Popover>,
      );
      expect(panel()).toHaveClass('pp-popover', 'mine');
      expect(panel()).toHaveStyle({ opacity: '0.5' });
      expect(panel()).toHaveAttribute('data-testid', 'panel');
    });

    it('throws a readable error for a part outside the root', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => renderWithTheme(<PopoverTitle>Lost</PopoverTitle>)).toThrow(
        /<PopoverTitle> must be rendered inside <Popover>/,
      );
      error.mockRestore();
    });
  });

  describe('accessibility', () => {
    it('moves focus into the panel on open', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<Basic />);
      await user.click(getByRole('button', { name: 'Open' }));
      expect(screen.getByRole('button', { name: 'Apply' })).toHaveFocus();
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
});
