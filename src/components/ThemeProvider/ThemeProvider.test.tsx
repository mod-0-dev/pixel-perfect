import { act, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations } from '../../test';
import { ThemeProvider, themeScript, useTheme, type Theme } from './ThemeProvider';

const html = () => document.documentElement;
const attribute = () => html().getAttribute('data-pp-theme');

/** Runs the pre-paint script the way a browser would: as text, against this document. */
const runScript = (source: string) => {
  // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
  new Function(source)();
};

/* A media query the test controls. jsdom's stub (src/test/setup.ts) never matches. */
type Listener = (event: { matches: boolean }) => void;
function mockMatchMedia(matches: boolean) {
  const listeners = new Set<Listener>();
  const media = {
    matches,
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_: string, l: Listener) => listeners.add(l),
    removeEventListener: (_: string, l: Listener) => listeners.delete(l),
  };
  vi.spyOn(window, 'matchMedia').mockImplementation(() => media as unknown as MediaQueryList);
  return {
    change(next: boolean) {
      media.matches = next;
      act(() => listeners.forEach((l) => l({ matches: next })));
    },
  };
}

function Readout({ onSet }: { onSet?: (set: (t: Theme) => void) => void }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  onSet?.(setTheme);
  return (
    <p>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme ?? 'unknown'}</span>
      <button type="button" onClick={() => setTheme('dark')}>Dark</button>
      <button type="button" onClick={() => setTheme('light')}>Light</button>
      <button type="button" onClick={() => setTheme('system')}>System</button>
    </p>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    html().removeAttribute('data-pp-theme');
  });
  afterEach(() => {
    vi.restoreAllMocks();
    html().removeAttribute('data-pp-theme');
  });

  describe('the pre-paint script (spec §4)', () => {
    it('is rendered before the children, and is the only element the provider renders', () => {
      const markup = renderToString(
        <ThemeProvider nonce="n1">
          <main>app</main>
        </ThemeProvider>,
      );
      expect(markup.indexOf('<script')).toBe(0);
      expect(markup.indexOf('<script')).toBeLessThan(markup.indexOf('<main>'));
      expect(markup).toContain('nonce="n1"');
      expect(markup.match(/<(\w+)/g)).toEqual(['<script', '<main']);
    });

    it('applies a stored choice; the default when nothing is stored; nothing for system', () => {
      window.localStorage.setItem('pp-theme', 'dark');
      runScript(themeScript('pp-theme', 'system', null));
      expect(attribute()).toBe('dark');

      window.localStorage.clear();
      runScript(themeScript('pp-theme', 'light', null));
      expect(attribute()).toBe('light');

      runScript(themeScript('pp-theme', 'system', null));
      expect(attribute()).toBeNull();

      window.localStorage.setItem('pp-theme', 'nonsense');
      runScript(themeScript('pp-theme', 'system', null));
      expect(attribute()).toBeNull();
    });

    it('carries a controlled theme and reads no storage; storageKey null reads none either', () => {
      window.localStorage.setItem('pp-theme', 'dark');
      const getItem = vi.spyOn(Storage.prototype, 'getItem');
      runScript(themeScript(null, 'system', 'light'));
      expect(attribute()).toBe('light');
      expect(getItem).not.toHaveBeenCalled();
      runScript(themeScript(null, 'system', null));
      expect(attribute()).toBeNull();
      expect(getItem).not.toHaveBeenCalled();
    });

    it('survives storage that throws: the default stands', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('denied');
      });
      expect(() => runScript(themeScript('pp-theme', 'dark', null))).not.toThrow();
      // The throw happens before the fallback is applied, by design: nothing is written, the page keeps what the server sent.
      expect(attribute()).toBeNull();
    });
  });

  describe('uncontrolled (spec §3, §5)', () => {
    it('starts at the default, then reads the stored choice on mount without reporting it', async () => {
      window.localStorage.setItem('pp-theme', 'dark');
      const onValueChange = vi.fn();
      const { getByTestId } = render(
        <ThemeProvider onValueChange={onValueChange}>
          <Readout />
        </ThemeProvider>,
      );
      expect(getByTestId('theme')).toHaveTextContent('dark');
      expect(attribute()).toBe('dark');
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('setTheme writes the attribute, the storage and the callback; system removes both', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const { getByRole, getByTestId } = render(
        <ThemeProvider onValueChange={onValueChange}>
          <Readout />
        </ThemeProvider>,
      );
      await user.click(getByRole('button', { name: 'Dark' }));
      expect(getByTestId('theme')).toHaveTextContent('dark');
      expect(attribute()).toBe('dark');
      expect(window.localStorage.getItem('pp-theme')).toBe('dark');
      expect(onValueChange).toHaveBeenLastCalledWith('dark');

      await user.click(getByRole('button', { name: 'System' }));
      expect(attribute()).toBeNull();
      expect(window.localStorage.getItem('pp-theme')).toBeNull();
      expect(onValueChange).toHaveBeenLastCalledWith('system');
    });

    it('storageKey={null} persists nothing; a custom key is used', async () => {
      const user = userEvent.setup();
      const { getByRole, unmount } = render(
        <ThemeProvider storageKey={null}>
          <Readout />
        </ThemeProvider>,
      );
      await user.click(getByRole('button', { name: 'Dark' }));
      expect(attribute()).toBe('dark');
      expect(window.localStorage.length).toBe(0);
      unmount();

      const second = render(
        <ThemeProvider storageKey="acme-theme">
          <Readout />
        </ThemeProvider>,
      );
      await user.click(second.getByRole('button', { name: 'Light' }));
      expect(window.localStorage.getItem('acme-theme')).toBe('light');
      expect(window.localStorage.getItem('pp-theme')).toBeNull();
    });

    it('follows another tab through the storage event, and reports it', () => {
      const onValueChange = vi.fn();
      const { getByTestId } = render(
        <ThemeProvider onValueChange={onValueChange}>
          <Readout />
        </ThemeProvider>,
      );
      const fire = (key: string | null, newValue: string | null) =>
        act(() => {
          window.dispatchEvent(new StorageEvent('storage', { key, newValue, storageArea: window.localStorage }));
        });
      fire('pp-theme', 'dark');
      expect(getByTestId('theme')).toHaveTextContent('dark');
      expect(attribute()).toBe('dark');
      expect(onValueChange).toHaveBeenLastCalledWith('dark');

      fire('other-key', 'light');
      expect(getByTestId('theme')).toHaveTextContent('dark');

      fire(null, null); // clear()
      expect(getByTestId('theme')).toHaveTextContent('system');
      expect(attribute()).toBeNull();
    });
  });

  describe('controlled (spec §3)', () => {
    it('writes the prop, reports setTheme without storing, and follows the prop', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const { getByRole, rerender } = render(
        <ThemeProvider value="dark" onValueChange={onValueChange}>
          <Readout />
        </ThemeProvider>,
      );
      expect(attribute()).toBe('dark');
      await user.click(getByRole('button', { name: 'Light' }));
      expect(onValueChange).toHaveBeenCalledWith('light');
      expect(attribute()).toBe('dark');
      expect(window.localStorage.length).toBe(0);

      rerender(
        <ThemeProvider value="light" onValueChange={onValueChange}>
          <Readout />
        </ThemeProvider>,
      );
      expect(attribute()).toBe('light');
    });

    it('ignores the storage event', () => {
      const { getByTestId } = render(
        <ThemeProvider value="light">
          <Readout />
        </ThemeProvider>,
      );
      act(() => {
        window.dispatchEvent(new StorageEvent('storage', { key: 'pp-theme', newValue: 'dark', storageArea: window.localStorage }));
      });
      expect(getByTestId('theme')).toHaveTextContent('light');
      expect(attribute()).toBe('light');
    });
  });

  describe('resolvedTheme (spec §5)', () => {
    it('is unknown on the first render under system, then the system\'s, and follows a change', () => {
      const media = mockMatchMedia(true);
      const first = renderToString(
        <ThemeProvider>
          <Readout />
        </ThemeProvider>,
      );
      expect(first).toContain('>unknown<');

      const { getByTestId } = render(
        <ThemeProvider>
          <Readout />
        </ThemeProvider>,
      );
      expect(getByTestId('resolved')).toHaveTextContent('dark');
      media.change(false);
      expect(getByTestId('resolved')).toHaveTextContent('light');
    });

    it('equals the choice when the choice is explicit, from the first render', () => {
      mockMatchMedia(true);
      expect(
        renderToString(
          <ThemeProvider defaultValue="light">
            <Readout />
          </ThemeProvider>,
        ),
      ).toContain('>light<');
    });
  });

  it('useTheme throws outside a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Readout />)).toThrow('[pixel-perfect] useTheme() must be called under a <ThemeProvider>.');
  });

  it('hydrates server HTML in a client with a stored choice, with no recoverable error (D-093 §1)', async () => {
    const element = (
      <ThemeProvider>
        <Readout />
      </ThemeProvider>
    );
    const markup = renderToString(element);
    window.localStorage.setItem('pp-theme', 'dark');
    runScript(themeScript('pp-theme', 'system', null)); // as the browser would, before hydration
    const host = document.createElement('div');
    host.innerHTML = markup;
    document.body.appendChild(host);
    const recoverable = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    let root!: Root;
    await act(async () => {
      root = hydrateRoot(host, element, { onRecoverableError: recoverable });
    });
    expect(recoverable).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    expect(host.querySelector('[data-testid="theme"]')).toHaveTextContent('dark');
    expect(attribute()).toBe('dark');
    await act(async () => root.unmount());
    host.remove();
  });

  it('passes axe with a page under it', async () => {
    const { container } = render(
      <ThemeProvider>
        <main>
          <h1>Page</h1>
          <Readout />
        </main>
      </ThemeProvider>,
    );
    await expectNoA11yViolations(container);
  });
});
