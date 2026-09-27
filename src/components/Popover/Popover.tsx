'use client';

import * as RadixPopover from '@radix-ui/react-popover';
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';

import { cx } from '../../internal/cx';
import { directionOf, resolveSide, type LogicalSide } from '../../internal/overlay/side';
import { resolveSpace } from '../../internal/overlay/space';
import { useInheritedTheme } from '../../internal/overlay/theme';
import { mergeRefs } from '../../internal/refs';
import type { Space } from '../../types';

/**
 * A small panel of interactive content anchored to the control that opened it.
 *
 * Sizing contract: hug, with the overlay exception (D-061 §3). RSC: client.
 *
 * THE FIRST TIER 4 COMPONENT, AND THE ONE THAT EXERCISES EVERY PIECE OF THE
 * OVERLAY FOUNDATION (overlay-foundation.md): behaviour is Radix's — the
 * portal, the dismissable layer, the focus scope, the positioning — and
 * every DOM node, class name and pixel is ours.
 *
 * Three things the foundation adds that Radix does not do:
 *   - the THEME crosses the portal (`data-pp-theme` on the panel, read from
 *     the trigger's scope), and the tone does not (§3);
 *   - `side` is LOGICAL — `start` / `end`, resolved against the trigger's
 *     direction at open time (§5);
 *   - offsets are STEPS OF THE SPACE SCALE, not pixel numbers (D-061 §5).
 *
 * NAMED PARTS, NOT `Popover.Trigger` (D-062 §1). React forbids dotting into a
 * client module from a Server Component — its own words, from the flight
 * proxy: "You cannot dot into a client module from a server component. You
 * can only pass the imported name through." — and a Next App Router page is a
 * Server Component by default. `<Popover><PopoverTrigger/>…</Popover>` is one
 * spelling that works on both sides of the boundary.
 *
 * Spec: docs/specs/Popover.md
 */

export type PopoverSide = LogicalSide;
export type PopoverAlign = 'start' | 'center' | 'end';

interface PopoverContextValue {
  /** The trigger element: the theme's scope and the direction's source. */
  triggerRef: RefObject<HTMLElement | null>;
  titleId: string;
  descriptionId: string;
}

const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopoverContext(part: string): PopoverContextValue {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error(`[pixel-perfect] <Popover${part}> must be rendered inside <Popover>.`);
  }
  return context;
}

/* tsconfig.build.json compiles with `types: []`, so `process` is declared
   locally and guarded, as useControllableState does. */
declare const process: { env?: { NODE_ENV?: string } } | undefined;
const isProduction = () => typeof process !== 'undefined' && process?.env?.NODE_ENV === 'production';

// ---------------------------------------------------------------------------
// Root

export interface PopoverProps {
  /** Controlled. */
  open?: boolean;
  /** Uncontrolled seed. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * `true` disables outside pointer events, locks scroll, hides the rest of
   * the page from assistive tech and traps focus. A popover that needs this
   * is usually a Dialog (spec §6).
   */
  modal?: boolean;
  children?: ReactNode;
}

export function Popover({ open, defaultOpen, onOpenChange, modal = false, children }: PopoverProps) {
  const triggerRef = useRef<HTMLElement | null>(null);
  const uid = useId();
  const context = useMemo<PopoverContextValue>(
    () => ({ triggerRef, titleId: `${uid}-title`, descriptionId: `${uid}-description` }),
    [uid],
  );

  return (
    <PopoverContext.Provider value={context}>
      {/* Radix owns the state and the controlled/uncontrolled pair (RULES §5.5). */}
      <RadixPopover.Root
        /* Only the keys that were given: Radix types its optionals without
           `undefined`, and the build runs with exactOptionalPropertyTypes. */
        {...(open !== undefined ? { open } : {})}
        {...(defaultOpen !== undefined ? { defaultOpen } : {})}
        {...(onOpenChange !== undefined ? { onOpenChange } : {})}
        modal={modal}
      >
        {children}
      </RadixPopover.Root>
    </PopoverContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Trigger

export interface PopoverTriggerProps extends ComponentPropsWithoutRef<'button'> {
  /** Renders the child instead of a `<button>`, merging the trigger's props onto it (RULES §5.7). */
  asChild?: boolean;
}

export const PopoverTrigger = forwardRef<HTMLButtonElement, PopoverTriggerProps>(function PopoverTrigger(
  { asChild = false, className, ...props },
  ref,
) {
  const { triggerRef } = usePopoverContext('Trigger');
  const setRef = useMemo(() => mergeRefs<HTMLButtonElement>(ref, triggerRef as Ref<HTMLButtonElement>), [ref, triggerRef]);
  return (
    <RadixPopover.Trigger
      ref={setRef}
      asChild={asChild}
      className={cx(!asChild && 'pp-popover__trigger', className)}
      {...props}
    />
  );
});

// ---------------------------------------------------------------------------
// Content

export interface PopoverContentProps
  extends Omit<ComponentPropsWithoutRef<typeof RadixPopover.Content>, 'side' | 'sideOffset' | 'align' | 'alignOffset' | 'collisionPadding' | 'asChild' | 'forceMount'> {
  /** Logical: `start` and `end` follow the layout's direction (spec §4). */
  side?: PopoverSide;
  align?: PopoverAlign;
  /** A step of the space scale between the trigger and the panel. */
  sideOffset?: Space;
  /** A step of the space scale kept between the panel and the viewport's edges. */
  collisionPadding?: Space;
  /** Where the panel is portalled. Defaults to `document.body`. */
  container?: Element | null;
}

export const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>(function PopoverContent(
  { container, ...props },
  ref,
) {
  return (
    /*
     * Radix's Portal keeps its child mounted while the child's own exit
     * animation runs, so the panel is the portal's direct child and there is
     * no wrapper of ours (D-061 §4). Nothing renders on the server.
     */
    <RadixPopover.Portal container={container ?? undefined}>
      <PopoverPanel ref={ref} {...props} />
    </RadixPopover.Portal>
  );
});

const PopoverPanel = forwardRef<HTMLDivElement, Omit<PopoverContentProps, 'container'>>(function PopoverPanel(
  {
    side = 'bottom',
    align = 'center',
    sideOffset = '2',
    collisionPadding = '2',
    className,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
    ...props
  },
  ref,
) {
  const { triggerRef, titleId, descriptionId } = usePopoverContext('Content');

  /* 4.1 §3: the theme crosses the portal, on this element. */
  const theme = useInheritedTheme(triggerRef);

  /*
   * 4.1 §5 and D-061 §5: the logical side and the space-scale offsets are
   * resolved against the TRIGGER, at open time, in a layout effect — before
   * paint, and never at module scope (RULES §7). Until the effect has run the
   * fallbacks are the defaults floating-ui would have used anyway.
   */
  const [resolved, setResolved] = useState(() => ({
    side: resolveSide(side, 'ltr'),
    sideOffset: 0,
    collisionPadding: 0,
  }));
  useLayoutEffect(() => {
    const trigger = triggerRef.current;
    setResolved({
      side: resolveSide(side, directionOf(trigger)),
      sideOffset: resolveSpace(trigger, sideOffset),
      collisionPadding: resolveSpace(trigger, collisionPadding),
    });
  }, [triggerRef, side, sideOffset, collisionPadding]);

  /*
   * THE NAME IS WIRED UNCONDITIONALLY AND THE GAP IS WARNED ABOUT (spec §2).
   * A dialog needs a name. Unless the caller supplied one, `aria-labelledby`
   * points at the Title's id; if no Title rendered, that reference dangles
   * and assistive tech reads a nameless dialog — so development says so.
   */
  const wiresTitle = ariaLabel === undefined && ariaLabelledby === undefined;
  useEffect(() => {
    if (isProduction() || !wiresTitle) return;
    if (!document.getElementById(titleId)) {
      console.warn(
        '[pixel-perfect] <PopoverContent> has no accessible name. Render a <PopoverTitle>, or pass `aria-label` or `aria-labelledby`.',
      );
    }
  }, [wiresTitle, titleId]);

  return (
    <RadixPopover.Content
      ref={ref}
      className={cx('pp-popover', className)}
      data-pp-theme={theme}
      side={resolved.side}
      align={align}
      sideOffset={resolved.sideOffset}
      collisionPadding={resolved.collisionPadding}
      aria-label={ariaLabel}
      aria-labelledby={wiresTitle ? titleId : ariaLabelledby}
      aria-describedby={ariaDescribedby ?? descriptionId}
      {...props}
    />
  );
});

// ---------------------------------------------------------------------------
// Title, Description, Close

export interface PopoverTitleProps extends ComponentPropsWithoutRef<'div'> {}

/** A `<div>`, not a heading: the right level is the page's to know (Alert.md §6). Pass a `Heading` as the child when it is a section. */
export const PopoverTitle = forwardRef<HTMLDivElement, PopoverTitleProps>(function PopoverTitle(
  { className, ...props },
  ref,
) {
  const { titleId } = usePopoverContext('Title');
  return <div ref={ref} id={titleId} className={cx('pp-popover__title', className)} {...props} />;
});

export interface PopoverDescriptionProps extends ComponentPropsWithoutRef<'p'> {}

export const PopoverDescription = forwardRef<HTMLParagraphElement, PopoverDescriptionProps>(
  function PopoverDescription({ className, ...props }, ref) {
    const { descriptionId } = usePopoverContext('Description');
    return <p ref={ref} id={descriptionId} className={cx('pp-popover__description', className)} {...props} />;
  },
);

export interface PopoverCloseProps extends ComponentPropsWithoutRef<'button'> {
  asChild?: boolean;
}

export const PopoverClose = forwardRef<HTMLButtonElement, PopoverCloseProps>(function PopoverClose(
  { asChild = false, className, ...props },
  ref,
) {
  usePopoverContext('Close');
  return (
    <RadixPopover.Close
      ref={ref}
      asChild={asChild}
      className={cx(!asChild && 'pp-popover__close', className)}
      {...props}
    />
  );
});

