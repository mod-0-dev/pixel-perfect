import userEvent from '@testing-library/user-event';
import { act, fireEvent, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { formatKeys, KeyHints, useKeyHint, type KeyHintsProps } from './KeyHints';

function Commands({ onInbox, enabled = true }: { onInbox: () => void; enabled?: boolean }) {
  useKeyHint({ keys: 'g i', label: 'Go to inbox', onTrigger: onInbox, enabled });
  return null;
}

function App({ onSave = () => {}, onInbox = () => {}, enabled, ...props }: Partial<KeyHintsProps> & { onSave?: () => void; onInbox?: () => void; enabled?: boolean }) {
  return (
    <KeyHints {...props}>
      <Commands onInbox={onInbox} enabled={enabled ?? true} />
      <Button data-pp-hotkey="mod+s" onClick={onSave}>
        Save
      </Button>
      <Button data-pp-hotkey="mod+shift+n">New</Button>
      <Input aria-label="Search" />
      <a href="#docs">Docs</a>
    </KeyHints>
  );
}

const hints = () => Array.from(document.querySelectorAll('.pp-key-hints__hint')).map((n) => n.textContent);
const platform = (value: string) => vi.spyOn(navigator, 'platform', 'get').mockReturnValue(value);

afterEach(() => {
  vi.restoreAllMocks();
});

describe('KeyHints', () => {
  it('formats keys as keycaps, mod resolved on the platform', () => {
    platform('MacIntel');
    expect(formatKeys('mod+shift+n')).toEqual([['⇧', '⌘', 'N']]);
    expect(formatKeys('g i')).toEqual([['G'], ['I']]);
    expect(formatKeys('ctrl+arrowup')).toEqual([['⌃', '↑']]);
    platform('Win32');
    expect(formatKeys('mod+s')).toEqual([['Ctrl', 'S']]);
    expect(formatKeys('alt+escape')).toEqual([['Alt', 'Esc']]);
  });

  it('fires a data-pp-hotkey element on its chord — focus, then click — and not on another; a mod chord fires inside a text field (spec §1)', async () => {
    platform('Win32');
    const user = userEvent.setup();
    const onSave = vi.fn();
    const { getByRole } = renderWithTheme(<App onSave={onSave} />);
    await user.keyboard('{Control>}s{/Control}');
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(getByRole('button', { name: 'Save' }));
    await user.keyboard('{Control>}x{/Control}');
    expect(onSave).toHaveBeenCalledTimes(1);
    getByRole('textbox', { name: 'Search' }).focus();
    await user.keyboard('{Control>}s{/Control}');
    expect(onSave).toHaveBeenCalledTimes(2);
  });

  it('fires a registered command on its sequence within the timeout, not after it, not when disabled, and never a bare key inside a text field (spec §1)', async () => {
    vi.useFakeTimers();
    const onInbox = vi.fn();
    const { getByRole, rerender } = renderWithTheme(<App onInbox={onInbox} />);
    const press = (key: string, target: Element = document.body) => fireEvent.keyDown(target, { key });
    press('g');
    press('i');
    expect(onInbox).toHaveBeenCalledTimes(1);
    press('g');
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    press('i');
    expect(onInbox).toHaveBeenCalledTimes(1);
    const field = getByRole('textbox', { name: 'Search' });
    field.focus();
    press('g', field);
    press('i', field);
    expect(onInbox).toHaveBeenCalledTimes(1);
    rerender(<App onInbox={onInbox} enabled={false} />);
    press('g');
    press('i');
    expect(onInbox).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('skips a key a component already handled (defaultPrevented) (spec §1)', () => {
    platform('Win32');
    const onSave = vi.fn();
    renderWithTheme(<App onSave={onSave} />);
    const stop = (event: Event) => event.preventDefault();
    document.body.addEventListener('keydown', stop);
    fireEvent.keyDown(document.body, { key: 's', ctrlKey: true });
    expect(onSave).not.toHaveBeenCalled();
    document.body.removeEventListener('keydown', stop);
    fireEvent.keyDown(document.body, { key: 's', ctrlKey: true });
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('reveals a keycap per shortcut element while the key is held, and removes them on release, on another key, and on blur (spec §2)', () => {
    platform('Win32');
    renderWithTheme(<App revealKey="Alt" />);
    expect(document.querySelector('.pp-key-hints')).toBeNull();
    fireEvent.keyDown(document.body, { key: 'Alt' });
    const overlay = document.querySelector('.pp-key-hints') as HTMLElement;
    expect(overlay).toHaveAttribute('aria-hidden', 'true');
    expect(hints()).toEqual(['CtrlS', 'CtrlShiftN']);
    /* One keycap per key. */
    expect(Array.from(document.querySelectorAll('.pp-key-hints__hint')).map((h) => h.querySelectorAll('.pp-kbd').length)).toEqual([2, 3]);
    expect(document.querySelector('.pp-key-hints__hint')).toHaveAttribute('data-mode', 'reveal');
    fireEvent.keyUp(document.body, { key: 'Alt' });
    expect(document.querySelector('.pp-key-hints')).toBeNull();
    fireEvent.keyDown(document.body, { key: 'Alt' });
    expect(hints()).toHaveLength(2);
    fireEvent.keyDown(document.body, { key: 'x', altKey: true });
    expect(document.querySelector('.pp-key-hints')).toBeNull();
    fireEvent.keyDown(document.body, { key: 'Alt' });
    expect(hints()).toHaveLength(2);
    fireEvent(window, new Event('blur'));
    expect(document.querySelector('.pp-key-hints')).toBeNull();
  });

  it('labels every focusable control on the jump key; typing narrows, a full label focuses and ends, Escape ends; the live region says so (spec §3)', () => {
    const { getByRole } = renderWithTheme(<App />);
    const status = document.querySelector('.pp-key-hints__status') as HTMLElement;
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent('');
    fireEvent.keyDown(document.body, { key: 'f' });
    expect(hints()).toEqual(['a', 's', 'd', 'f']); // Save, New, Search, Docs
    expect(document.querySelector('.pp-key-hints__hint')).toHaveAttribute('data-mode', 'jump');
    expect(status).toHaveTextContent('Jump: type a label to focus a control. Escape cancels.');
    fireEvent.keyDown(document.body, { key: 's' });
    expect(document.activeElement).toBe(getByRole('button', { name: 'New' }));
    expect(document.querySelector('.pp-key-hints')).toBeNull();
    expect(status).toHaveTextContent('');
    fireEvent.keyDown(document.body, { key: 'f' });
    expect(hints()).toHaveLength(4);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(document.querySelector('.pp-key-hints')).toBeNull();
    /* Inside a text field, the jump key types. */
    getByRole('textbox', { name: 'Search' }).focus();
    fireEvent.keyDown(document.activeElement!, { key: 'f' });
    expect(document.querySelector('.pp-key-hints')).toBeNull();
  });

  it('uses two-letter labels past nine controls and narrows on the first letter', () => {
    renderWithTheme(
      <KeyHints>
        {Array.from({ length: 12 }, (_, i) => (
          <Button key={i}>B{i}</Button>
        ))}
      </KeyHints>,
    );
    fireEvent.keyDown(document.body, { key: 'f' });
    const labels = hints();
    expect(labels).toHaveLength(12);
    expect(labels.every((l) => l!.length === 2)).toBe(true);
    expect(labels.slice(0, 3)).toEqual(['aa', 'as', 'ad']);
    fireEvent.keyDown(document.body, { key: 'a' });
    expect(document.querySelectorAll('.pp-key-hints__typed')[0]).toHaveTextContent('a');
    fireEvent.keyDown(document.body, { key: 'd' });
    expect(document.activeElement).toHaveTextContent('B2');
  });

  it('opens the sheet on the help key, listing the gestures, commands and elements with keycaps; null turns each key off (spec §4, §5)', async () => {
    platform('MacIntel');
    const user = userEvent.setup();
    const { unmount } = renderWithTheme(<App revealKey="Alt" />);
    /* The Dialog portals to the body, outside the theme container the render's queries are bound to. */
    const { getByRole, queryByRole } = within(document.body);
    await user.keyboard('?');
    const dialog = getByRole('dialog', { name: 'Keyboard shortcuts' });
    const labels = Array.from(dialog.querySelectorAll('.pp-key-hints__label')).map((n) => n.textContent);
    expect(labels).toEqual(['This sheet', 'Jump to a control', 'Show shortcuts on their controls (hold)', 'Save', 'New', 'Go to inbox']);
    const keys = Array.from(dialog.querySelectorAll('.pp-key-hints__keys')).map((n) => Array.from(n.querySelectorAll('.pp-kbd')).map((k) => k.textContent));
    expect(keys[3]).toEqual(['⌘', 'S']);
    expect(keys[5]).toEqual(['G', 'I']);
    await user.keyboard('{Escape}');
    expect(queryByRole('dialog')).toBeNull();
    unmount();
    renderWithTheme(<App helpKey={null} jumpKey={null} />);
    await user.keyboard('?');
    expect(queryByRole('dialog')).toBeNull();
    fireEvent.keyDown(document.body, { key: 'f' });
    expect(document.querySelector('.pp-key-hints')).toBeNull();
  });

  it('throws for useKeyHint outside the provider; a command unregisters on unmount', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderWithTheme(<Commands onInbox={() => {}} />)).toThrow('useKeyHint must be used inside <KeyHints>');
    error.mockRestore();
    const onInbox = vi.fn();
    function Owner() {
      const [on, setOn] = useState(true);
      return (
        <KeyHints>
          {on ? <Commands onInbox={onInbox} /> : null}
          <button onClick={() => setOn(false)}>Off</button>
        </KeyHints>
      );
    }
    const { getByRole } = renderWithTheme(<Owner />);
    fireEvent.click(getByRole('button', { name: 'Off' }));
    fireEvent.keyDown(document.body, { key: 'g' });
    fireEvent.keyDown(document.body, { key: 'i' });
    expect(onInbox).not.toHaveBeenCalled();
  });

  it('passes axe with the sheet open, in both themes', async () => {
    for (const theme of ['light', 'dark'] as const) {
      const { container, unmount } = renderWithTheme(<App revealKey="Alt" />, { theme });
      fireEvent.keyDown(document.body, { key: '?' });
      await expectNoA11yViolations(document.body, { rules: { region: { enabled: false } } });
      fireEvent.keyDown(document.body, { key: 'Escape' });
      await expectNoA11yViolations(container);
      unmount();
    }
  });
});
