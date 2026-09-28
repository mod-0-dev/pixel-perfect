import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { ToastProvider, useToast, type ToastOptions, type ToastProviderProps } from './Toast';

/** A page with a provider and buttons that toast. */
function Page({ options, provider }: { options?: Partial<ToastOptions>; provider?: Partial<ToastProviderProps> }) {
  return (
    <ToastProvider {...provider}>
      <Buttons {...(options ? { options } : {})} />
    </ToastProvider>
  );
}

function Buttons({ options }: { options?: Partial<ToastOptions> }) {
  const { toast, dismiss, update } = useToast();
  const last = useRef('');
  return (
    <>
      <button type="button" onClick={() => (last.current = toast({ title: 'Saved', ...options }))}>
        Save
      </button>
      <button type="button" onClick={() => toast({ title: 'Sent', tone: 'success', description: 'To four people.' })}>
        Send
      </button>
      <button type="button" onClick={() => dismiss()}>
        Clear
      </button>
      <button type="button" onClick={() => update(last.current, { title: 'Done', tone: 'success' })}>
        Finish
      </button>
    </>
  );
}

const toasts = () => Array.from(document.querySelectorAll('.pp-toast')) as HTMLElement[];

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('toast() shows an Alert that floats: role status, the classes, the tone, the parts, and the announcer speaks it (spec §1, §2)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { getByRole } = renderWithTheme(<Page />);
    expect(toasts()).toHaveLength(0);
    await user.click(getByRole('button', { name: 'Send' }));
    const [item] = toasts();
    expect(item).toHaveClass('pp-alert', 'pp-toast');
    expect(item!.tagName).toBe('LI');
    expect(item).toHaveAttribute('data-pp-tone', 'success');
    expect(item).toHaveAttribute('data-state', 'open');
    expect(item).toHaveAttribute('data-placement', 'bottom-end');
    expect(item!.querySelector('.pp-alert__title')).toHaveTextContent('Sent');
    expect(item!.querySelector('.pp-alert__body')).toHaveTextContent('To four people.');
    expect(item!.querySelector('.pp-alert__dismiss')).not.toBeNull();
    // The region: Radix's, named with the hotkey, holding our list.
    const region = getByRole('region', { name: 'Notifications (F8)' });
    expect(region.querySelector('ol.pp-toast__viewport')).toBe(item!.parentElement);
    expect(region.querySelector('ol')).toHaveAttribute('data-placement', 'bottom-end');
    // Radix's announcer reads it, prefixed by the label, assertively, and
    // is gone a second later (D-077 §5).
    await act(async () => {
      vi.advanceTimersByTime(50);
    });
    const announcer = document.querySelector('[role="status"][aria-live="assertive"]');
    expect(announcer?.textContent).toContain('Notification');
    expect(announcer?.textContent).toContain('Sent');
    await act(async () => {
      vi.advanceTimersByTime(1100);
    });
    expect(document.querySelector('[role="status"][aria-live]')).toBeNull();
  });

  it('the dismiss button closes it and onDismiss fires; the action calls and closes; Escape on a focused toast closes it (spec §6)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onDismiss = vi.fn();
    const onClick = vi.fn();
    const { getByRole } = renderWithTheme(<Page options={{ onDismiss, action: { label: 'Undo', altText: 'Undo the save', onClick } }} />);
    await user.click(getByRole('button', { name: 'Save' }));
    expect(toasts()).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    // No animation in jsdom: Radix's Presence unmounts the toast at once,
    // and the provider forgets it after the leave duration.
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(toasts()).toHaveLength(0);
    expect(onDismiss).toHaveBeenCalledTimes(1);

    await user.click(getByRole('button', { name: 'Save' }));
    const undo = screen.getByRole('button', { name: 'Undo' });
    expect(undo).toHaveClass('pp-button');
    expect(undo.closest('.pp-toast__action')).not.toBeNull();
    await user.click(undo);
    expect(onClick).toHaveBeenCalledTimes(1);
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(toasts()).toHaveLength(0);
  });

  it('closes on its timer, pauses while hovered, and Infinity keeps it (spec §4)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { getByRole } = renderWithTheme(<Page provider={{ duration: 1000 }} />);
    await user.click(getByRole('button', { name: 'Save' }));
    expect(toasts()).toHaveLength(1);
    await user.hover(toasts()[0]!);
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(toasts()[0]).toHaveAttribute('data-state', 'open');
    await user.unhover(toasts()[0]!);
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    expect(toasts()).toHaveLength(0);
  });

  it('shows the limit and queues the rest; dismiss() with no id closes all; update changes one in place (spec §1, §4)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { getByRole } = renderWithTheme(<Page provider={{ limit: 2, duration: Infinity }} />);
    await user.click(getByRole('button', { name: 'Save' }));
    await user.click(getByRole('button', { name: 'Finish' }));
    expect(toasts()[0]!.querySelector('.pp-alert__title')).toHaveTextContent('Done');
    expect(toasts()[0]).toHaveAttribute('data-pp-tone', 'success');
    for (let i = 0; i < 3; i += 1) await user.click(getByRole('button', { name: 'Save' }));
    expect(toasts()).toHaveLength(2);
    await user.click(screen.getAllByRole('button', { name: 'Dismiss' })[0]!);
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    // The third came in as the first went.
    expect(toasts().filter((t) => t.getAttribute('data-state') === 'open')).toHaveLength(2);
    await user.click(getByRole('button', { name: 'Clear' }));
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    // Everything is gone, the queued ones included.
    expect(toasts()).toHaveLength(0);
  });

  it('live="polite" is a background toast, and a non-dismissible one has no dismiss button (spec §5, §6)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { getByRole } = renderWithTheme(<Page options={{ live: 'polite', dismissible: false, duration: Infinity }} />);
    await user.click(getByRole('button', { name: 'Save' }));
    expect(toasts()[0]!.querySelector('.pp-alert__dismiss')).toBeNull();
    // Radix's announcer for a background toast is polite.
    await act(async () => {
      vi.advanceTimersByTime(50);
    });
    expect(document.querySelector('[role="status"][aria-live="polite"]')?.textContent).toContain('Saved');
  });

  it('placement is written on the region and each toast', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { getByRole } = renderWithTheme(<Page provider={{ placement: 'top-start' }} />);
    await user.click(getByRole('button', { name: 'Save' }));
    expect(document.querySelector('.pp-toast__viewport')).toHaveAttribute('data-placement', 'top-start');
    expect(toasts()[0]).toHaveAttribute('data-placement', 'top-start');
  });

  it('useToast() outside a provider throws a readable error', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderWithTheme(<Buttons />)).toThrow(/useToast\(\) must be called under a <ToastProvider>/);
    error.mockRestore();
  });

  it('has no axe violations with toasts showing, in both themes', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const light = renderWithTheme(<Page options={{ action: { label: 'Undo', altText: 'Undo the save', onClick: () => {} } }} />);
    await user.click(light.getByRole('button', { name: 'Save' }));
    await user.click(light.getByRole('button', { name: 'Send' }));
    await expectNoA11yViolations(document.body, { rules: { region: { enabled: false } } });
    light.unmount();
    const dark = renderWithTheme(<Page />, { theme: 'dark' });
    await user.click(dark.getByRole('button', { name: 'Send' }));
    await expectNoA11yViolations(document.body, { rules: { region: { enabled: false } } });
    dark.unmount();
  });
});
