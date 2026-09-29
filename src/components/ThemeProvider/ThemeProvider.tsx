'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

/**
 * Decides what `data-pp-theme` on `<html>` says — nothing, `light` or
 * `dark` — and says it BEFORE THE FIRST PAINT.
 *
 * ONE PROVIDER, AT THE ROOT, WRITING <html> (spec §1). A theme for part of a
 * page is that part's own `data-pp-theme` attribute (D-010); this component
 * is the one authority over the document's.
 *
 * `system` IS THE ABSENCE OF THE ATTRIBUTE (spec §2): the tokens'
 * `:root:not([data-pp-theme])` block follows `prefers-color-scheme`, which
 * is the library's default and its no-JavaScript path. The provider never
 * resolves `system` into an attribute.
 *
 * NO FLASH (spec §4): the provider renders one inline `<script>` ahead of
 * its children. It runs as the parser reaches it, reads the stored choice
 * (or carries the controlled one) and sets the attribute before anything
 * after it paints. React renders the script in place on the server; on the
 * client React never executes a script it renders, which is right — by then
 * it has run, or the effects below do the same work.
 *
 * Controlled and uncontrolled (spec §3). Uncontrolled persists under
 * `storageKey` — an explicit `light` or `dark` stored, `system` stored as
 * nothing — and follows another tab through the `storage` event. Controlled
 * is the app's persistence (a cookie): the prop is written, `setTheme` only
 * asks, storage is untouched.
 *
 * Sizing contract: n/a — no element. RSC: client. Spec: docs/specs/ThemeProvider.md
 */

export type Theme = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

/*
 * `value` / `defaultValue` / `onValueChange`, RULES §5.5's own words for a
 * controllable state — and not `theme`, which RULES §5 bans as a prop name
 * because on every other component it would be a synonym for `tone`. The
 * rule lint enforces the ban by name, and the vocabulary it points to reads
 * right here: the provider's value IS the theme (D-094 §1).
 */
export interface ThemeProviderProps {
  /** Controlled. */
  value?: Theme;
  /** Uncontrolled starting value, and what the script applies when nothing is stored. */
  defaultValue?: Theme;
  /** Every change of the choice: `setTheme`, or another tab's, in both modes. */
  onValueChange?: (theme: Theme) => void;
  /** `localStorage` key for the uncontrolled choice; `null` keeps it for the page's life only. Ignored when controlled. */
  storageKey?: string | null;
  /** For the inline script under a Content-Security-Policy. */
  nonce?: string;
  children?: ReactNode;
}

export interface ThemeContextValue {
  /** The choice. `defaultValue` (or the controlled `value`) until mounted; the stored choice after. */
  theme: Theme;
  /** What is showing. `undefined` until mounted while `theme` is `system`: the server does not know the system. */
  resolvedTheme: ResolvedTheme | undefined;
  setTheme: (theme: Theme) => void;
}

const ATTRIBUTE = 'data-pp-theme';
const QUERY = '(prefers-color-scheme: dark)';

const isExplicit = (value: unknown): value is ResolvedTheme => value === 'light' || value === 'dark';

/**
 * THE PRE-PAINT SCRIPT (spec §4). Serialised with `toString()` and its three
 * arguments, so it stays one function that is unit-tested as a function and
 * shipped as text. ES5 on purpose — `var`, no arrows — because it runs before
 * any module does, and a bundler that minifies it must not need to transform
 * it. Everything inside a `try`: a browser that forbids storage still gets
 * the default.
 */
function applyTheme(key: string | null, fallback: string, forced: string | null): void {
  try {
    var choice = forced;
    if (choice === null && key !== null) {
      var stored = window.localStorage.getItem(key);
      if (stored === 'light' || stored === 'dark') choice = stored;
    }
    if (choice === null) choice = fallback;
    if (choice === 'light' || choice === 'dark') document.documentElement.setAttribute('data-pp-theme', choice);
    else document.documentElement.removeAttribute('data-pp-theme');
  } catch (error) {
    /* Storage denied: the default stands. */
  }
}

/** The script's source for `key`, `fallback` and `forced`. Exported for the unit test only. */
export function themeScript(key: string | null, fallback: Theme, forced: Theme | null): string {
  return `(${applyTheme.toString()})(${JSON.stringify(key)},${JSON.stringify(fallback)},${JSON.stringify(forced)})`;
}

function readStored(key: string | null): ResolvedTheme | null {
  if (key === null) return null;
  try {
    const stored = window.localStorage.getItem(key);
    return isExplicit(stored) ? stored : null;
  } catch {
    return null;
  }
}

function writeStored(key: string | null, theme: Theme): void {
  if (key === null) return;
  try {
    if (theme === 'system') window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, theme);
  } catch {
    /* Storage denied: the attribute alone still themes the page. */
  }
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  value: themeProp,
  defaultValue: defaultTheme = 'system',
  onValueChange,
  storageKey = 'pp-theme',
  nonce,
  children,
}: ThemeProviderProps) {
  const controlled = themeProp !== undefined;
  /*
   * Not `useControllableState`: the stored choice has to be written into the
   * uncontrolled state on mount WITHOUT reporting it as a change, and a tab's
   * change has to be written WITH one; the shared hook offers neither seam.
   * The contract is the same — controlled never stores, `onValueChange` fires
   * in both modes.
   */
  const [uncontrolled, setUncontrolled] = useState<Theme>(defaultTheme);
  const theme = controlled ? themeProp : uncontrolled;
  /* The system's answer, read after mount; `undefined` is "not yet asked". */
  const [system, setSystem] = useState<ResolvedTheme | undefined>(undefined);
  /* Flips after the mount reconciliation, so the attribute is never written from a state older than the storage (spec §5). */
  const [ready, setReady] = useState(false);

  const onChangeRef = useRef(onValueChange);
  useEffect(() => {
    onChangeRef.current = onValueChange;
  });

  /* Mount: the stored choice into state (no callback — it is not a change), then ready. */
  useEffect(() => {
    if (!controlled) {
      const stored = readStored(storageKey);
      if (stored !== null) setUncontrolled(stored);
    }
    setReady(true);
    // Mount only: what is stored is read once; later changes arrive by `storage` events.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* The attribute follows the choice, once the choice is the real one (spec §2, §5). */
  useEffect(() => {
    if (!ready) return;
    const html = document.documentElement;
    if (theme === 'system') html.removeAttribute(ATTRIBUTE);
    else html.setAttribute(ATTRIBUTE, theme);
  }, [ready, theme]);

  /* The system's preference, live (spec §5). */
  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const read = () => setSystem(media.matches ? 'dark' : 'light');
    read();
    media.addEventListener('change', read);
    return () => media.removeEventListener('change', read);
  }, []);

  /* Another tab's choice (spec §3). Uncontrolled only: a controlled app owns its persistence. */
  useEffect(() => {
    if (controlled || storageKey === null) return;
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage) return;
      if (event.key !== null && event.key !== storageKey) return;
      const next: Theme = isExplicit(event.newValue) ? event.newValue : 'system';
      setUncontrolled(next);
      onChangeRef.current?.(next);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [controlled, storageKey]);

  const setTheme = useCallback(
    (next: Theme) => {
      if (!controlled) {
        setUncontrolled(next);
        writeStored(storageKey, next);
      }
      onChangeRef.current?.(next);
    },
    [controlled, storageKey],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme: theme === 'system' ? system : theme, setTheme }),
    [theme, system, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <script
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: themeScript(controlled ? null : storageKey, defaultTheme, controlled ? themeProp : null),
        }}
      />
      {children}
    </ThemeContext.Provider>
  );
}

/** The choice, what is showing, and the setter. Throws outside a `ThemeProvider`. */
export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('[pixel-perfect] useTheme() must be called under a <ThemeProvider>.');
  }
  return value;
}
