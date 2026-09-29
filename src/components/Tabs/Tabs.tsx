'use client';

import * as RadixTabs from '@radix-ui/react-tabs';
import {
  createContext,
  forwardRef,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from 'react';

import { cx } from '../../internal/cx';
import { directionOf, type Direction } from '../../internal/overlay/side';
import { mergeRefs } from '../../internal/refs';

/**
 * One panel of several, chosen by its tab.
 *
 * The first component of the tier that is not an overlay: nothing is
 * portalled and the page's direction is the component's. Behaviour is
 * Radix's — the roving focus, the activation modes, the wiring — and every
 * node, class and pixel is ours.
 *
 * THE PAGE'S DIRECTION IS THE COMPONENT'S (spec §5, D-074 §2): Radix writes
 * `dir` on its root, `ltr` unless told, which flips a tab strip inside a
 * right-to-left page. The root is rendered onto an element of ours that
 * sets `dir` to nothing, and the value Radix's arrow keys need is read
 * from the element at mount.
 *
 * Sizing contract: fill. RSC: client. Spec: docs/specs/Tabs.md
 */

export type TabsOrientation = 'horizontal' | 'vertical';
export type TabsActivationMode = 'automatic' | 'manual';

/**
 * The selected value, mirrored from Radix's state: a kept panel needs to
 * know whether it is the selected one to hide itself (spec §7), and Radix
 * exposes that to nothing outside its own parts.
 */
const TabsContext = createContext<{ selected: string } | null>(null);

function useTabsContext(part: string) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error(`[pixel-perfect] <Tabs${part}> must be rendered inside <Tabs>.`);
  }
  return context;
}

// ---------------------------------------------------------------------------
// Root

export interface TabsProps extends ComponentPropsWithoutRef<'div'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Layout and the arrow keys: a row with `ArrowLeft` / `ArrowRight`, or a column with `ArrowUp` / `ArrowDown`. */
  orientation?: TabsOrientation;
  /** `automatic` (APG's default): the arrows select. `manual`: the arrows focus, `Enter` / `Space` select (spec §6). */
  activationMode?: TabsActivationMode;
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  { value, defaultValue, onValueChange, orientation = 'horizontal', activationMode = 'automatic', className, children, ...props },
  ref,
) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const setRef = useMemo(() => mergeRefs<HTMLDivElement>(ref, rootRef), [ref]);

  /* Read from the element at mount, before paint, never at module scope
     (RULES §7). Until then Radix's default, which is the document's. */
  const [dir, setDir] = useState<Direction>('ltr');
  useLayoutEffect(() => {
    setDir(directionOf(rootRef.current));
  }, []);

  /* Radix owns the state; this is its shadow, for the kept panels. */
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? '');
  const selected = value ?? uncontrolled;
  const context = useMemo(() => ({ selected }), [selected]);
  const handleValueChange = (next: string) => {
    setUncontrolled(next);
    onValueChange?.(next);
  };

  return (
    <TabsContext.Provider value={context}>
      <RadixTabs.Root
        asChild
        {...(value !== undefined ? { value } : {})}
        {...(defaultValue !== undefined ? { defaultValue } : {})}
        onValueChange={handleValueChange}
        orientation={orientation}
        activationMode={activationMode}
        dir={dir}
      >
        {/* `dir={undefined}` after Radix's props: the Slot lets the child's
            value win, and an undefined one is no attribute at all. */}
        <div ref={setRef} className={cx('pp-tabs', className)} {...props} dir={undefined}>
          {children}
        </div>
      </RadixTabs.Root>
    </TabsContext.Provider>
  );
});

// ---------------------------------------------------------------------------
// List

export interface TabsListProps extends ComponentPropsWithoutRef<'div'> {
  /** The arrows wrap at the ends. Radix's default, which APG allows. */
  loop?: boolean;
}

export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(function TabsList({ loop = true, className, ...props }, ref) {
  useTabsContext('List');
  return (
    /* The strip is the scroll container and takes no props; the list grows
       past it with its tabs (spec §2). */
    <div className="pp-tabs__strip">
      <RadixTabs.List ref={ref} loop={loop} className={cx('pp-tabs__list', className)} {...props} />
    </div>
  );
});

// ---------------------------------------------------------------------------
// Trigger

export interface TabsTriggerProps extends ComponentPropsWithoutRef<'button'> {
  value: string;
}

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(function TabsTrigger({ className, ...props }, ref) {
  useTabsContext('Trigger');
  return <RadixTabs.Trigger ref={ref} className={cx('pp-tabs__tab', className)} data-pp-tone="accent" {...props} />;
});

// ---------------------------------------------------------------------------
// Content

export interface TabsContentProps extends ComponentPropsWithoutRef<'div'> {
  value: string;
  /** Keeps the panel in the DOM, `hidden`, while another tab is selected — for a form that must not lose what was typed (spec §7). */
  keepMounted?: boolean;
}

export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(function TabsContent(
  { keepMounted = false, className, value, ...props },
  ref,
) {
  const { selected } = useTabsContext('Content');
  /*
   * Radix's `forceMount` keeps the children rendered AND drops `hidden`,
   * leaving two panels showing; it expects the consumer to hide the
   * inactive one. This is that: `hidden` from the mirrored value, so a kept
   * panel is hidden exactly when a fresh one would be empty (D-074 §3).
   */
  return (
    <RadixTabs.Content
      ref={ref}
      className={cx('pp-tabs__panel', className)}
      value={value}
      {...(keepMounted ? { forceMount: true, hidden: value !== selected } : {})}
      {...props}
    />
  );
});
