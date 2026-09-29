'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import { isEditing } from '../../internal/editing';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../Dialog/Dialog';
import { Kbd } from '../Kbd/Kbd';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';

/**
 * Three gestures for the reader who prefers the keyboard: hold a key to see
 * every control's shortcut on the control, press a key to label every
 * control on screen and type the label to focus it, press a key for the
 * sheet of every shortcut.
 *
 * A REVEAL, NEVER A MODE (spec §2, §6): the page under the hints is exactly
 * the page, so a lost `keyup` costs a flicker and nothing here is the only
 * way to reach anything (WCAG 2.1.1). EVERY SINGLE KEY IS A PROP AND `null`
 * TURNS IT OFF (spec §5, WCAG 2.1.4), and a bare key never fires inside a
 * text field (spec §1).
 *
 * ONE REGISTRY (spec §1): `data-pp-hotkey` on any element makes its chord
 * fire that element — focus, then click — and draws the hint on it;
 * `useKeyHint` registers a command with a label. Chords are CommandPalette's
 * grammar (`mod+shift+n`, `mod` resolved on the platform when pressed,
 * D-078 §4); a sequence is chords separated by spaces (`g i`).
 *
 * Sizing contract: none (no root element). RSC: client. Spec: docs/specs/KeyHints.md
 */

// ---------------------------------------------------------------------------
// Chords

interface Chord {
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean;
  key: string;
}

const MODIFIERS = new Set(['mod', 'ctrl', 'control', 'meta', 'cmd', 'command', 'alt', 'option', 'shift']);

const isApple = () => typeof navigator !== 'undefined' && /mac|iphone|ipad|ipod/i.test(navigator.platform ?? '');

function chordOf(text: string): Chord {
  const parts = text.toLowerCase().split('+');
  const key = parts[parts.length - 1] ?? '';
  const mods = new Set(parts.slice(0, -1).filter((p) => MODIFIERS.has(p)));
  if (mods.has('mod')) mods.add(isApple() ? 'meta' : 'ctrl');
  return {
    ctrl: mods.has('ctrl') || mods.has('control'),
    meta: mods.has('meta') || mods.has('cmd') || mods.has('command'),
    alt: mods.has('alt') || mods.has('option'),
    shift: mods.has('shift'),
    key,
  };
}

/** `'mod+shift+n'` → one chord; `'g i'` → two. */
function parseKeys(keys: string): Chord[] {
  return keys.trim().split(/\s+/).map(chordOf);
}

function chordFromEvent(event: KeyboardEvent): Chord {
  return { ctrl: event.ctrlKey, meta: event.metaKey, alt: event.altKey, shift: event.shiftKey, key: event.key.toLowerCase() };
}

/* A single character that is not a letter — `?`, `/`, `+` — is what Shift
   produced, so its chord does not also ask for Shift. */
const shiftless = (key: string) => key.length === 1 && !/[a-z]/i.test(key);

const same = (a: Chord, b: Chord) =>
  a.key === b.key && a.ctrl === b.ctrl && a.meta === b.meta && a.alt === b.alt && (a.shift === b.shift || shiftless(a.key));

const isModifierKey = (key: string) => key === 'Control' || key === 'Meta' || key === 'Alt' || key === 'Shift';

const KEY_LABELS: Record<string, string> = {
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
  escape: 'Esc',
  enter: 'Enter',
  backspace: '⌫',
  delete: 'Del',
  tab: 'Tab',
  ' ': 'Space',
  home: 'Home',
  end: 'End',
  pageup: 'PgUp',
  pagedown: 'PgDn',
};

/**
 * The chords of a key string as keycap labels, `mod` resolved on the
 * platform: `[['⌘', 'S']]` on Apple, `[['Ctrl', 'S']]` elsewhere. For an
 * app's own `Kbd`s.
 */
export function formatKeys(keys: string): string[][] {
  const apple = isApple();
  return parseKeys(keys).map((chord) => {
    const labels: string[] = [];
    if (chord.ctrl) labels.push(apple ? '⌃' : 'Ctrl');
    if (chord.alt) labels.push(apple ? '⌥' : 'Alt');
    if (chord.shift) labels.push(apple ? '⇧' : 'Shift');
    if (chord.meta) labels.push(apple ? '⌘' : 'Meta');
    labels.push(KEY_LABELS[chord.key] ?? (chord.key.length === 1 ? chord.key.toUpperCase() : chord.key.charAt(0).toUpperCase() + chord.key.slice(1)));
    return labels;
  });
}

// ---------------------------------------------------------------------------
// The registry

export interface KeyHintOptions {
  /** `'mod+s'`, `'g i'`. */
  keys: string;
  /** For the sheet. */
  label: string;
  onTrigger: () => void;
  enabled?: boolean;
}

interface Command extends KeyHintOptions {
  id: number;
}

interface Registry {
  register: (command: Command) => () => void;
}

const RegistryContext = createContext<Registry | null>(null);

let nextId = 0;

/** Registers a command while mounted (spec §1). */
export function useKeyHint({ keys, label, onTrigger, enabled = true }: KeyHintOptions): void {
  const registry = useContext(RegistryContext);
  if (!registry) throw new Error('[pixel-perfect] useKeyHint must be used inside <KeyHints>.');
  const [id] = useState(() => (nextId += 1));
  const onTriggerRef = useRef(onTrigger);
  onTriggerRef.current = onTrigger;
  useEffect(
    () => registry.register({ id, keys, label, enabled, onTrigger: () => onTriggerRef.current() }),
    [registry, id, keys, label, enabled],
  );
}

// ---------------------------------------------------------------------------
// The DOM

const HOTKEY_SELECTOR = '[data-pp-hotkey]';
const FOCUSABLE_SELECTOR =
  'a[href], button, input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

/* jsdom has no layout: every rect is empty and `checkVisibility` is
   missing, so there a connected, enabled element counts. A browser answers
   for real. */
function usable(el: HTMLElement): boolean {
  if (!el.isConnected) return false;
  if ((el as HTMLButtonElement).disabled === true || el.getAttribute('aria-disabled') === 'true') return false;
  if (el.closest('[hidden], [aria-hidden="true"]')) return false;
  if (typeof el.checkVisibility === 'function' && !el.checkVisibility()) return false;
  return true;
}

function inViewport(el: HTMLElement): boolean {
  if (typeof el.checkVisibility !== 'function') return true;
  const rect = el.getBoundingClientRect();
  return rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
}

const hotkeyElements = () => Array.from(document.querySelectorAll<HTMLElement>(HOTKEY_SELECTOR)).filter(usable);

const nameOf = (el: HTMLElement) => el.getAttribute('aria-label') ?? el.textContent?.trim() ?? '';

/* Labels from the home row, all the same length: one letter for up to nine
   targets, two for up to eighty-one, three beyond (spec §3). */
const HOME_ROW = 'asdfghjkl';
function jumpLabels(count: number): string[] {
  let length = 1;
  while (HOME_ROW.length ** length < count) length += 1;
  const labels: string[] = [];
  for (let i = 0; i < count; i += 1) {
    let n = i;
    let label = '';
    for (let j = 0; j < length; j += 1) {
      label = HOME_ROW[n % HOME_ROW.length] + label;
      n = Math.floor(n / HOME_ROW.length);
    }
    labels.push(label);
  }
  return labels;
}

interface Hint {
  el: HTMLElement;
  text: string[];
  top: number;
  left: number;
}

const SEQUENCE_TIMEOUT = 1000;

// ---------------------------------------------------------------------------
// KeyHints

export interface KeyHintsProps {
  /** Hold to see every shortcut on its control (spec §2). `null`, because which modifier an app can afford is its call. */
  revealKey?: 'Alt' | 'Control' | 'Meta' | 'Shift' | null;
  /** Press to label every control on screen (spec §3). `null` turns it off. */
  jumpKey?: string | null;
  /** Press for the sheet (spec §4). `null` turns it off. */
  helpKey?: string | null;
  helpTitle?: string;
  /** What the live region says while jumping. */
  jumpStatus?: string;
  children?: ReactNode;
}

export function KeyHints({
  revealKey = null,
  jumpKey = 'f',
  helpKey = '?',
  helpTitle = 'Keyboard shortcuts',
  jumpStatus = 'Jump: type a label to focus a control. Escape cancels.',
  children,
}: KeyHintsProps) {
  const commands = useRef(new Map<number, Command>());
  const [version, setVersion] = useState(0);
  const registry = useMemo<Registry>(
    () => ({
      register: (command) => {
        commands.current.set(command.id, command);
        setVersion((v) => v + 1);
        return () => {
          commands.current.delete(command.id);
          setVersion((v) => v + 1);
        };
      },
    }),
    [],
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [revealing, setRevealing] = useState(false);
  const [jump, setJump] = useState<{ targets: HTMLElement[]; labels: string[]; typed: string } | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [hints, setHints] = useState<Hint[]>([]);
  const pending = useRef<Chord[]>([]);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* The hints' positions, read when a mode starts and on scroll and resize. */
  const place = useCallback(() => {
    if (jump) {
      setHints(
        jump.targets.map((el, i) => {
          const rect = el.getBoundingClientRect();
          return { el, text: [jump.labels[i] ?? ''], top: rect.top, left: rect.left };
        }),
      );
    } else if (revealing) {
      setHints(
        hotkeyElements()
          .filter(inViewport)
          .map((el) => {
            const rect = el.getBoundingClientRect();
            return { el, text: formatKeys(el.getAttribute('data-pp-hotkey') ?? '').flat(), top: rect.top, left: rect.left };
          }),
      );
    } else {
      setHints([]);
    }
  }, [jump, revealing]);

  /* Re-placed on scroll, on resize, and when a font finishes loading: a
     keycap measured in the fallback face is narrower than in the mono face
     it ends up in, and the stagger below was computed against the wrong
     widths once, on a cold CI cache (D-101 §3). */
  useEffect(() => {
    place();
    if (!jump && !revealing) return;
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    const fonts = typeof document !== 'undefined' ? document.fonts : undefined;
    fonts?.addEventListener('loadingdone', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
      fonts?.removeEventListener('loadingdone', place);
    };
  }, [place, jump, revealing]);

  /* Anything that could have swallowed the keyup ends the reveal (spec §2). */
  useEffect(() => {
    if (!revealing) return;
    const end = () => setRevealing(false);
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === revealKey) end();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') end();
    };
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', end);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', end);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [revealing, revealKey]);

  const startJump = useCallback(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => usable(el) && inViewport(el));
    if (targets.length === 0) return;
    setJump({ targets, labels: jumpLabels(targets.length), typed: '' });
  }, []);

  const fire = useCallback((keys: Chord[]) => {
    for (const el of hotkeyElements()) {
      const chords = parseKeys(el.getAttribute('data-pp-hotkey') ?? '');
      if (chords.length === keys.length && chords.every((c, i) => same(c, keys[i]!))) {
        el.focus();
        el.click();
        return true;
      }
    }
    for (const command of commands.current.values()) {
      if (command.enabled === false) continue;
      const chords = parseKeys(command.keys);
      if (chords.length === keys.length && chords.every((c, i) => same(c, keys[i]!))) {
        command.onTrigger();
        return true;
      }
    }
    return false;
  }, []);

  const hasPrefix = useCallback((keys: Chord[]) => {
    const all = [
      ...hotkeyElements().map((el) => el.getAttribute('data-pp-hotkey') ?? ''),
      ...Array.from(commands.current.values())
        .filter((c) => c.enabled !== false)
        .map((c) => c.keys),
    ];
    return all.some((text) => {
      const chords = parseKeys(text);
      return chords.length > keys.length && keys.every((k, i) => same(chords[i]!, k));
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (helpOpen) return;
      const target = event.target as HTMLElement;

      if (jump) {
        event.preventDefault();
        if (event.key === 'Escape') {
          setJump(null);
        } else if (event.key === 'Backspace') {
          setJump({ ...jump, typed: jump.typed.slice(0, -1) });
        } else if (event.key.length === 1 && HOME_ROW.includes(event.key.toLowerCase()) && !event.ctrlKey && !event.metaKey && !event.altKey) {
          const typed = jump.typed + event.key.toLowerCase();
          const index = jump.labels.indexOf(typed);
          if (index !== -1) {
            jump.targets[index]?.focus();
            setJump(null);
          } else if (jump.labels.some((l) => l.startsWith(typed))) {
            setJump({ ...jump, typed });
          } else {
            setJump(null);
          }
        } else {
          setJump(null);
        }
        return;
      }

      if (revealKey && event.key === revealKey) {
        if (!event.repeat && !isEditing(target)) {
          event.preventDefault();
          setRevealing(true);
        }
        return;
      }
      if (revealing) setRevealing(false);
      if (event.defaultPrevented || isModifierKey(event.key)) return;

      const chord = chordFromEvent(event);
      const bare = !chord.ctrl && !chord.meta && !chord.alt;
      if (bare && isEditing(target)) return;

      if (bare && helpKey && chord.key === helpKey.toLowerCase()) {
        event.preventDefault();
        setHelpOpen(true);
        return;
      }
      if (bare && jumpKey && chord.key === jumpKey.toLowerCase()) {
        event.preventDefault();
        startJump();
        return;
      }

      const next = [...pending.current, chord];
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
      pendingTimer.current = null;
      if (fire(next)) {
        event.preventDefault();
        pending.current = [];
        return;
      }
      if (hasPrefix(next)) {
        event.preventDefault();
        pending.current = next;
        pendingTimer.current = setTimeout(() => {
          pending.current = [];
        }, SEQUENCE_TIMEOUT);
        return;
      }
      pending.current = [];
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [helpOpen, jump, revealing, revealKey, helpKey, jumpKey, startJump, fire, hasPrefix]);

  /* The sheet's rows, read when it opens: commands by label, elements by name (spec §4). */
  const rows = useMemo(() => {
    if (!helpOpen) return [];
    const list: Array<{ label: string; keys: string }> = [];
    for (const el of hotkeyElements()) list.push({ label: nameOf(el), keys: el.getAttribute('data-pp-hotkey') ?? '' });
    for (const command of commands.current.values()) if (command.enabled !== false) list.push({ label: command.label, keys: command.keys });
    return list;
    // `version` is the registry's change counter; the map itself is a ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [helpOpen, version]);

  const gestures: Array<{ label: string; keys: string }> = [];
  if (helpKey) gestures.push({ label: 'This sheet', keys: helpKey });
  if (jumpKey) gestures.push({ label: 'Jump to a control', keys: jumpKey });
  if (revealKey) gestures.push({ label: 'Show shortcuts on their controls (hold)', keys: revealKey.toLowerCase() });

  const mode = jump ? 'jump' : revealing ? 'reveal' : null;

  /* HINTS THAT WOULD OVERLAP ARE STAGGERED UPWARD (D-100 §3): two shortcut
     buttons side by side have hints wider than the gap between them. After
     the hints render, each is measured against the ones placed before it
     and lifted by its own height until it clears them, so the stack climbs
     away from the controls instead of covering them; at the viewport's top
     it climbs down instead. A picture may be rearranged; the page may not. */
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [stagger, setStagger] = useState<number[]>([]);
  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) {
      setStagger([]);
      return;
    }
    const boxes: Array<{ left: number; right: number; top: number; bottom: number }> = [];
    const offsets: number[] = [];
    for (const el of Array.from(overlay.querySelectorAll<HTMLElement>('.pp-key-hints__hint'))) {
      const r = el.getBoundingClientRect();
      const box = { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      let offset = 0;
      const step = r.height + 2;
      const collides = () => boxes.some((b) => box.left < b.right && box.right > b.left && box.top < b.bottom && box.bottom > b.top);
      const move = (by: number) => {
        offset += by;
        box.top = r.top + offset;
        box.bottom = r.bottom + offset;
      };
      while (r.height > 0 && collides() && offset > -step * 8 && box.top - step >= 0) move(-step);
      while (r.height > 0 && collides() && offset < step * 8) move(step);
      boxes.push(box);
      offsets.push(offset);
    }
    setStagger((prev) => (prev.length === offsets.length && prev.every((o, i) => o === offsets[i]) ? prev : offsets));
  }, [hints]);

  return (
    <RegistryContext.Provider value={registry}>
      {children}
      <VisuallyHidden className="pp-key-hints__status" aria-live="polite">
        {jump ? jumpStatus : ''}
      </VisuallyHidden>
      {mounted && mode
        ? createPortal(
            <div ref={overlayRef} className="pp-key-hints" aria-hidden="true">
              {hints.map((hint, i) => (
                <span
                  key={i}
                  className="pp-key-hints__hint"
                  data-mode={mode}
                  data-pp-tone={mode === 'jump' ? 'accent' : undefined}
                  style={{ top: hint.top + (stagger[i] ?? 0), left: hint.left }}
                >
                  {mode === 'jump' && jump ? (
                    <Kbd size="sm">
                      <span className="pp-key-hints__typed">{jump.typed}</span>
                      {(hint.text[0] ?? '').slice(jump.typed.length)}
                    </Kbd>
                  ) : (
                    hint.text.map((label, k) => (
                      <Kbd key={k} size="sm">
                        {label}
                      </Kbd>
                    ))
                  )}
                </span>
              ))}
            </div>,
            document.body,
          )
        : null}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent>
          <DialogTitle>{helpTitle}</DialogTitle>
          <DialogDescription>Shortcuts fire outside text fields; chords with a modifier fire anywhere.</DialogDescription>
          <dl className="pp-key-hints__sheet">
            {[...gestures, ...rows].map((row, i) => (
              <div key={i} className="pp-key-hints__row">
                <dt className="pp-key-hints__label">{row.label}</dt>
                <dd className="pp-key-hints__keys">
                  {formatKeys(row.keys).map((chord, c) => (
                    <span key={c} className="pp-key-hints__chord">
                      {chord.map((label, k) => (
                        <Kbd key={k} size="sm">
                          {label}
                        </Kbd>
                      ))}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </DialogContent>
      </Dialog>
    </RegistryContext.Provider>
  );
}
