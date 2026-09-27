import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { IconButton } from '../IconButton/IconButton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './Tooltip';

/* Radix's delays are timers, so every test runs on fake ones; the defaults
   are Radix's 700ms open and 300ms skip. The advance is wrapped in `act`
   because the timer's callback sets React state outside any event. */
const OPEN_DELAY = 700;
const SKIP_DELAY = 300;

function setup() {
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime, delay: null });
}

function advance(ms: number) {
  act(() => vi.advanceTimersByTime(ms));
}

function Basic({
  label = 'Copy',
  ...content
}: {
  label?: string;
  defaultOpen?: boolean;
  side?: 'top' | 'bottom' | 'start' | 'end';
}) {
  const { defaultOpen, ...rest } = content;
  return (
    <Tooltip {...(defaultOpen !== undefined ? { defaultOpen } : {})}>
      <TooltipTrigger>{label}</TooltipTrigger>
      <TooltipContent {...rest}>{label} to clipboard</TooltipContent>
    </Tooltip>
  );
}

/* The panel is PORTALLED to <body>, outside the render container, so it is
   found through the document, never through the container's own queries. */
const panel = () => document.querySelector('.pp-tooltip') as HTMLElement | null;

describe('Tooltip', () => {
  beforeEach(() => {
    /*
     * FAKE TIMERS THAT ALSO ADVANCE WITH REAL TIME, or every user-event call
     * hangs. Testing Library's async wrapper waits on a real `setTimeout(0)`
     * after each interaction and advances only JEST's fake timers past it —
     * it checks for a `jest` global — so under vitest's the wait never
     * returns. `shouldAdvanceTime` lets real time carry that zero-length
     * timer while `advance()` below moves Radix's delays deliberately.
     * Documented on the docs page, because a consumer's test hits the same.
     */
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('opening on the pointer (spec §6, §7)', () => {
    it('opens after the delay when the pointer rests, and not before', async () => {
      const user = setup();
      const { getByRole } = renderWithTheme(<Basic />);
      const trigger = getByRole('button', { name: 'Copy' });
      expect(trigger).toHaveAttribute('data-state', 'closed');

      await user.hover(trigger);
      // Not on the move itself: the delay has to run.
      expect(panel()).toBeNull();
      expect(trigger).toHaveAttribute('data-state', 'closed');
      advance(OPEN_DELAY);
      expect(panel()).not.toBeNull();
      // The pointer rested and the delay ran: Radix's word for it (spec §4).
      expect(trigger).toHaveAttribute('data-state', 'delayed-open');
      expect(panel()).toHaveAttribute('data-state', 'delayed-open');
    });

    it('honours a delay set on the tooltip itself', async () => {
      const user = setup();
      const { getByRole } = renderWithTheme(
        <Tooltip delayDuration={100}>
          <TooltipTrigger>Copy</TooltipTrigger>
          <TooltipContent>Copy to clipboard</TooltipContent>
        </Tooltip>,
      );
      await user.hover(getByRole('button', { name: 'Copy' }));
      advance(100);
      expect(panel()).not.toBeNull();
    });

    it('closes when the trigger is clicked: activating the control dismisses the label', async () => {
      const user = setup();
      const { getByRole } = renderWithTheme(<Basic />);
      const trigger = getByRole('button', { name: 'Copy' });
      await user.hover(trigger);
      advance(OPEN_DELAY);
      expect(panel()).not.toBeNull();
      await user.click(trigger);
      expect(panel()).toBeNull();
    });

    it('does not open on a touch pointer', async () => {
      const { getByRole } = renderWithTheme(<Basic />);
      const trigger = getByRole('button', { name: 'Copy' });
      fireEvent.pointerMove(trigger, { pointerType: 'touch' });
      advance(OPEN_DELAY);
      expect(panel()).toBeNull();
    });
  });

  describe('the provider and the skip delay (spec §1)', () => {
    function Toolbar({ delayDuration }: { delayDuration?: number }) {
      return (
        <TooltipProvider {...(delayDuration !== undefined ? { delayDuration } : {})}>
          <Tooltip>
            <TooltipTrigger>Bold</TooltipTrigger>
            <TooltipContent>Bold text</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>Italic</TooltipTrigger>
            <TooltipContent>Italic text</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    it('opens a neighbour at once while one tooltip has just shown, and closes the first', async () => {
      const user = setup();
      const { getByRole } = renderWithTheme(<Toolbar />);
      const bold = getByRole('button', { name: 'Bold' });
      const italic = getByRole('button', { name: 'Italic' });

      await user.hover(bold);
      advance(OPEN_DELAY);
      expect(bold).toHaveAttribute('data-state', 'delayed-open');

      await user.unhover(bold);
      // Leaving the trigger opens a grace area towards the panel (spec §6);
      // the pointer leaves that too, which is what closes the first tooltip,
      // and only then reaches the neighbour — the order a real pointer takes.
      fireEvent.pointerMove(document.body, { clientX: 500, clientY: 500 });
      expect(bold).toHaveAttribute('data-state', 'closed');
      await user.hover(italic);
      // No delay ran, and the attribute says so — which is what the stylesheet
      // reads to skip the entry animation (spec §4).
      expect(italic).toHaveAttribute('data-state', 'instant-open');
      expect(screen.getByRole('tooltip')).toHaveTextContent('Italic text');
    });

    it('needs the delay again once the skip window has passed', async () => {
      const user = setup();
      const { getByRole } = renderWithTheme(<Toolbar />);
      const bold = getByRole('button', { name: 'Bold' });
      const italic = getByRole('button', { name: 'Italic' });

      await user.hover(bold);
      advance(OPEN_DELAY);
      await user.unhover(bold);
      // The pointer leaves the grace area between trigger and panel.
      fireEvent.pointerMove(document.body, { clientX: 500, clientY: 500 });
      expect(bold).toHaveAttribute('data-state', 'closed');

      advance(SKIP_DELAY);
      await user.hover(italic);
      expect(italic).toHaveAttribute('data-state', 'closed');
      advance(OPEN_DELAY);
      expect(italic).toHaveAttribute('data-state', 'delayed-open');
    });

    it("applies the provider's delay to every tooltip inside it", async () => {
      const user = setup();
      const { getByRole } = renderWithTheme(<Toolbar delayDuration={50} />);
      await user.hover(getByRole('button', { name: 'Italic' }));
      advance(50);
      expect(screen.getByRole('tooltip')).toHaveTextContent('Italic text');
    });

    it('works with no provider at all: the tooltip provides for itself', async () => {
      // Every other test in this file renders without a provider too; this
      // one is the named assertion. Radix would throw "must be used within
      // `TooltipProvider`" here.
      const user = setup();
      const { getByRole } = renderWithTheme(<Basic />);
      await user.hover(getByRole('button', { name: 'Copy' }));
      advance(OPEN_DELAY);
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });

  describe('keyboard (spec §Keyboard)', () => {
    it('opens at once on keyboard focus and closes on blur', async () => {
      const user = setup();
      const { getByRole } = renderWithTheme(
        <>
          <Basic />
          <button type="button">Next</button>
        </>,
      );
      const trigger = getByRole('button', { name: 'Copy' });
      await user.tab();
      expect(trigger).toHaveFocus();
      expect(panel()).not.toBeNull();
      expect(trigger).toHaveAttribute('data-state', 'instant-open');
      await user.tab();
      expect(panel()).toBeNull();
    });

    it('closes on Escape and leaves focus where it was', async () => {
      const user = setup();
      const { getByRole } = renderWithTheme(<Basic />);
      const trigger = getByRole('button', { name: 'Copy' });
      await user.tab();
      expect(panel()).not.toBeNull();
      await user.keyboard('{Escape}');
      expect(panel()).toBeNull();
      expect(trigger).toHaveFocus();
    });

    it('does not open when the focus came from a pointer press', async () => {
      const user = setup();
      const { getByRole } = renderWithTheme(<Basic />);
      const trigger = getByRole('button', { name: 'Copy' });
      await user.pointer({ keys: '[MouseLeft>]', target: trigger });
      trigger.focus();
      expect(panel()).toBeNull();
      await user.pointer({ keys: '[/MouseLeft]' });
    });
  });

  describe('controlled and uncontrolled (RULES §5.5)', () => {
    it('opens with defaultOpen', () => {
      renderWithTheme(<Basic defaultOpen />);
      expect(panel()).not.toBeNull();
      // A default open ran no delay.
      expect(panel()).toHaveAttribute('data-state', 'instant-open');
    });

    it('obeys a controlled open and reports the change it did not make', async () => {
      const user = setup();
      const onOpenChange = vi.fn();
      const { getByRole } = renderWithTheme(
        <Tooltip open={false} onOpenChange={onOpenChange}>
          <TooltipTrigger>Copy</TooltipTrigger>
          <TooltipContent>Copy to clipboard</TooltipContent>
        </Tooltip>,
      );
      await user.hover(getByRole('button', { name: 'Copy' }));
      advance(OPEN_DELAY);
      expect(onOpenChange).toHaveBeenLastCalledWith(true);
      expect(panel()).toBeNull();
    });

    function Owner() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Tooltip open={open} onOpenChange={setOpen}>
            <TooltipTrigger>Copy</TooltipTrigger>
            <TooltipContent>Copy to clipboard</TooltipContent>
          </Tooltip>
          <output>{open ? 'open' : 'closed'}</output>
        </>
      );
    }

    it('round-trips through an owner', async () => {
      const user = setup();
      const { getByRole } = renderWithTheme(<Owner />);
      await user.tab();
      expect(getByRole('status')).toHaveTextContent('open');
      expect(panel()).not.toBeNull();
      await user.keyboard('{Escape}');
      expect(getByRole('status')).toHaveTextContent('closed');
    });
  });

  describe('a description, not a name (spec §2)', () => {
    it('describes the trigger while open, through role="tooltip", and stops when closed', async () => {
      const user = setup();
      const { getByRole } = renderWithTheme(<Basic />);
      const trigger = getByRole('button', { name: 'Copy' });
      expect(trigger).not.toHaveAttribute('aria-describedby');

      await user.tab();
      const tip = screen.getByRole('tooltip');
      expect(tip).toHaveClass('pp-tooltip');
      expect(trigger).toHaveAttribute('aria-describedby', tip.id);
      expect(trigger).toHaveAccessibleName('Copy');
      expect(trigger).toHaveAccessibleDescription('Copy to clipboard');

      await user.keyboard('{Escape}');
      expect(trigger).not.toHaveAttribute('aria-describedby');
    });

    it('moves the role to a hidden copy when aria-label is given', () => {
      renderWithTheme(
        <Tooltip defaultOpen>
          <TooltipTrigger>Save</TooltipTrigger>
          <TooltipContent aria-label="Command S">⌘S</TooltipContent>
        </Tooltip>,
      );
      const tip = screen.getByRole('tooltip');
      expect(tip).toHaveTextContent('Command S');
      expect(tip).not.toHaveClass('pp-tooltip');
      expect(panel()).not.toHaveAttribute('role');
      expect(screen.getByRole('button', { name: 'Save' })).toHaveAccessibleDescription('Command S');
    });

    it('repeats an IconButton\'s label as its description, with the name intact', async () => {
      const user = setup();
      const label = 'Copy to clipboard';
      const { getByRole } = renderWithTheme(
        <Tooltip>
          <TooltipTrigger asChild>
            <IconButton label={label}>
              <svg />
            </IconButton>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>,
      );
      const trigger = getByRole('button', { name: label });
      expect(trigger).toHaveClass('pp-icon-button');
      expect(trigger).not.toHaveClass('pp-tooltip__trigger');
      await user.tab();
      expect(trigger).toHaveAccessibleName(label);
      expect(trigger).toHaveAccessibleDescription(label);
    });
  });

  describe('the theme crosses the portal; the tone does not (4.1 §3)', () => {
    it("writes the trigger scope's theme on the panel", () => {
      renderWithTheme(<Basic defaultOpen />, { theme: 'dark' });
      expect(panel()).toHaveAttribute('data-pp-theme', 'dark');
      expect(panel()!.closest('[data-pp-theme="dark"]')).toBe(panel());
    });

    it('does not copy the tone', () => {
      renderWithTheme(<Basic defaultOpen />, { theme: 'light', tone: 'danger' });
      expect(panel()).toHaveAttribute('data-pp-theme', 'light');
      expect(panel()).not.toHaveAttribute('data-pp-tone');
    });
  });

  describe('positioning props (spec §5)', () => {
    it('defaults to the top', () => {
      renderWithTheme(<Basic defaultOpen />);
      expect(panel()).toHaveAttribute('data-side', 'top');
    });

    it('hands Radix a physical side resolved from the logical one', () => {
      renderWithTheme(<Basic defaultOpen side="end" />);
      // jsdom has no layout, so floating-ui places the panel on the side it
      // was asked for: `end` in the default left-to-right direction is right.
      expect(panel()).toHaveAttribute('data-side', 'right');
    });

    it('rejects a physical side and a pixel offset at the type level', () => {
      // @ts-expect-error — `left` is not a logical side (spec §5).
      const bad = <TooltipContent side="left" />;
      // @ts-expect-error — offsets are steps of the space scale, not pixels.
      const worse = <TooltipContent sideOffset={4} />;
      // @ts-expect-error — the switch whose only effect is to fail 1.4.13 (spec §6).
      const worst = <TooltipContent disableHoverableContent />;
      expect(bad).toBeTruthy();
      expect(worse).toBeTruthy();
      expect(worst).toBeTruthy();
    });
  });

  describe('composition (RULES §5)', () => {
    it('forwards refs to the trigger and to the panel', () => {
      const trigger = createRef<HTMLButtonElement>();
      const content = createRef<HTMLDivElement>();
      renderWithTheme(
        <Tooltip defaultOpen>
          <TooltipTrigger ref={trigger}>Copy</TooltipTrigger>
          <TooltipContent ref={content}>Copy to clipboard</TooltipContent>
        </Tooltip>,
      );
      expect(trigger.current).toHaveClass('pp-tooltip__trigger');
      expect(content.current).toHaveClass('pp-tooltip');
    });

    it('merges className and style onto the panel and spreads the rest', () => {
      renderWithTheme(
        <Tooltip defaultOpen>
          <TooltipTrigger>Copy</TooltipTrigger>
          <TooltipContent className="mine" style={{ opacity: 0.5 }} data-testid="tip">
            Copy to clipboard
          </TooltipContent>
        </Tooltip>,
      );
      expect(panel()).toHaveClass('pp-tooltip', 'mine');
      expect(panel()).toHaveStyle({ opacity: '0.5' });
      expect(panel()).toHaveAttribute('data-testid', 'tip');
    });

    it('throws a readable error for a part outside the root', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => renderWithTheme(<TooltipTrigger>Lost</TooltipTrigger>)).toThrow(
        /<TooltipTrigger> must be rendered inside <Tooltip>/,
      );
      error.mockRestore();
    });
  });

  describe('accessibility', () => {
    it('never takes focus: the panel is not focusable', async () => {
      const user = setup();
      const { getByRole } = renderWithTheme(
        <>
          <Basic />
          <button type="button">Next</button>
        </>,
      );
      await user.tab();
      expect(getByRole('button', { name: 'Copy' })).toHaveFocus();
      expect(panel()).not.toHaveAttribute('tabindex');
    });

    it('has no axe violations, open, on an IconButton whose label it repeats, in both themes', async () => {
      const label = 'Copy to clipboard';
      const tree = (
        <Tooltip defaultOpen>
          <TooltipTrigger asChild>
            <IconButton label={label}>
              <svg />
            </IconButton>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      );
      /*
       * axe's `region` rule is a page-composition rule — every piece of
       * content inside a landmark — and it is run here on the whole body
       * because the panel is portalled out of the render container. A
       * tooltip is portalled to <body>, outside any landmark, by design; a
       * popover passes the same rule only because axe exempts a dialog.
       * Everything else axe knows about a tooltip — the role, the
       * description, the name it must not replace — stays on.
       */
      const options = { rules: { region: { enabled: false } } };
      const light = renderWithTheme(tree);
      await expectNoA11yViolations(document.body, options);
      light.unmount();
      const dark = renderWithTheme(tree, { theme: 'dark' });
      await expectNoA11yViolations(document.body, options);
      dark.unmount();
    });
  });
});
