'use client';

import * as RadixToast from '@radix-ui/react-toast';
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { cx } from '../../internal/cx';
import { directionOf } from '../../internal/overlay/side';
import type { Tone } from '../../types';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import { IconButton } from '../IconButton/IconButton';

/**
 * A brief message about something that just happened, at a corner of the
 * viewport, announced, gone after a moment.
 *
 * ONE PROVIDER, ONE HOOK, NO ELEMENT (spec §1): a toast is an event, not a
 * place in the tree. `ToastProvider` owns the queue and the region;
 * `useToast()` returns `toast`, `dismiss` and `update`.
 *
 * A TOAST IS AN ALERT THAT FLOATS (spec §2): every toast carries `pp-alert
 * pp-toast` and Alert's parts, so Alert.css draws the surface and Toast.css
 * adds the region, the shadow, the motion and the swipe (D-070 §1).
 *
 * Behaviour is Radix's toast primitive: the announcer, the pause on hover,
 * focus and blur, the swipe, the F8 hotkey. Sizing contract: fill, in a
 * region whose inline size is a token. RSC: client. Spec: docs/specs/Toast.md
 */

export type ToastPlacement = 'bottom-end' | 'bottom-start' | 'top-end' | 'top-start';
export type ToastLive = 'assertive' | 'polite';

export interface ToastAction {
  label: ReactNode;
  /** How else to do it, for a screen reader user who cannot reach the button in time (spec §6). */
  altText: string;
  onClick: () => void;
}

export interface ToastOptions {
  title: ReactNode;
  description?: ReactNode;
  /** Alert's; never the only signal (Alert §3). */
  tone?: Tone;
  /** An SVG, as Alert's `icon`. */
  icon?: ReactNode;
  /** Milliseconds; `Infinity` keeps the toast until dismissed. The provider's by default. */
  duration?: number;
  /** `assertive` for the result of what the user just did; `polite` for a background event (spec §5). */
  live?: ToastLive;
  action?: ToastAction;
  dismissible?: boolean;
  dismissLabel?: string;
  /** After it closes, by any means. */
  onDismiss?: () => void;
}

export interface ToastHandle {
  /** Shows a toast and returns its id. */
  toast: (options: ToastOptions) => string;
  /** Closes one toast, or every toast with no id. */
  dismiss: (id?: string) => void;
  /** Changes a showing toast in place. */
  update: (id: string, options: Partial<ToastOptions>) => void;
}

interface Item extends ToastOptions {
  id: string;
  open: boolean;
}

const ToastContext = createContext<ToastHandle | null>(null);

/** The three functions. Throws outside a `ToastProvider`. */
export function useToast(): ToastHandle {
  const handle = useContext(ToastContext);
  if (!handle) {
    throw new Error('[pixel-perfect] useToast() must be called under a <ToastProvider>.');
  }
  return handle;
}

export interface ToastProviderProps {
  /** Logical: `end` is the right in a left-to-right page (spec §3). */
  placement?: ToastPlacement;
  /** Milliseconds a toast stays, unless it says otherwise. */
  duration?: number;
  /** Toasts shown at once; the rest wait in order (spec §4). */
  limit?: number;
  /** Radix's: prefixes each announcement. */
  label?: string;
  /** The region's accessible name; `{hotkey}` is replaced. */
  viewportLabel?: string;
  /** The keys that move focus to the region. */
  hotkey?: string[];
  children?: ReactNode;
}

function DismissGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

/** How long the leave motion takes, read from the token where it applies. */
function leaveDuration(element: Element | null): number {
  if (!element) return 200;
  const raw = getComputedStyle(element).getPropertyValue('--pp-duration-fast').trim();
  const value = parseFloat(raw);
  if (!Number.isFinite(value)) return 200;
  return raw.endsWith('ms') ? value : value * 1000;
}

export function ToastProvider({
  placement = 'bottom-end',
  duration = 5000,
  limit = 3,
  label = 'Notification',
  viewportLabel = 'Notifications ({hotkey})',
  hotkey = ['F8'],
  children,
}: ToastProviderProps) {
  const [items, setItems] = useState<Item[]>([]);
  const counter = useRef(0);
  const viewportRef = useRef<HTMLOListElement | null>(null);

  /* The one physical thing Radix asks for: the swipe's direction, resolved
     from the region's direction at mount (spec §7). */
  const [swipe, setSwipe] = useState<'left' | 'right'>('right');
  useLayoutEffect(() => {
    const rtl = directionOf(viewportRef.current) === 'rtl';
    const end = placement.endsWith('end');
    setSwipe(end !== rtl ? 'right' : 'left');
  }, [placement]);

  const removeLater = useCallback((id: string) => {
    const wait = leaveDuration(viewportRef.current);
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), wait);
  }, []);

  const close = useCallback(
    (id: string) => {
      let closed: Item | undefined;
      setItems((current) =>
        current.map((item) => {
          if (item.id !== id || !item.open) return item;
          closed = item;
          return { ...item, open: false };
        }),
      );
      removeLater(id);
      // After the state settles: the caller's hook, once.
      window.setTimeout(() => closed?.onDismiss?.(), 0);
    },
    [removeLater],
  );

  const handle = useMemo<ToastHandle>(
    () => ({
      toast: (options) => {
        counter.current += 1;
        const id = `toast-${counter.current}`;
        setItems((current) => [...current, { ...options, id, open: true }]);
        return id;
      },
      dismiss: (id) => {
        if (id !== undefined) {
          close(id);
          return;
        }
        setItems((current) => {
          current.forEach((item) => item.open && close(item.id));
          return current;
        });
      },
      update: (id, options) => {
        setItems((current) => current.map((item) => (item.id === id ? { ...item, ...options } : item)));
      },
    }),
    [close],
  );

  /* The queue: the first `limit` open toasts show, the rest wait (spec §4).
     Closed ones stay until their leave motion ends. */
  const showing = useMemo(() => {
    const result: Item[] = [];
    let open = 0;
    for (const item of items) {
      if (item.open) {
        if (open >= limit) continue;
        open += 1;
      }
      result.push(item);
    }
    return result;
  }, [items, limit]);

  return (
    <ToastContext.Provider value={handle}>
      <RadixToast.Provider label={label} duration={duration} swipeDirection={swipe}>
        {children}
        {showing.map((item) => (
          <RadixToast.Root
            key={item.id}
            open={item.open}
            onOpenChange={(open) => {
              if (!open) close(item.id);
            }}
            type={item.live === 'polite' ? 'background' : 'foreground'}
            {...(item.duration !== undefined ? { duration: item.duration } : {})}
            className="pp-alert pp-toast"
            data-pp-tone={item.tone ?? 'neutral'}
            data-placement={placement}
          >
            {item.icon !== undefined && item.icon !== null && (
              <span className="pp-alert__icon">
                <Icon decorative>{item.icon}</Icon>
              </span>
            )}
            <div className="pp-alert__content">
              <RadixToast.Title className="pp-alert__title">{item.title}</RadixToast.Title>
              {item.description !== undefined && item.description !== null && (
                <RadixToast.Description className="pp-alert__body">{item.description}</RadixToast.Description>
              )}
              {item.action && (
                <div className="pp-toast__action">
                  <RadixToast.Action asChild altText={item.action.altText}>
                    <Button variant="ghost" size="sm" tone={item.tone ?? 'neutral'} onClick={item.action.onClick}>
                      {item.action.label}
                    </Button>
                  </RadixToast.Action>
                </div>
              )}
            </div>
            {item.dismissible !== false && (
              <RadixToast.Close asChild>
                <IconButton className="pp-alert__dismiss" label={item.dismissLabel ?? 'Dismiss'} tone={item.tone ?? 'neutral'} variant="plain" size="sm">
                  <DismissGlyph />
                </IconButton>
              </RadixToast.Close>
            )}
          </RadixToast.Root>
        ))}
        <RadixToast.Viewport
          ref={viewportRef}
          className={cx('pp-toast__viewport')}
          data-placement={placement}
          label={viewportLabel}
          hotkey={hotkey}
        />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}
