'use client';

import * as RadixTooltip from '@radix-ui/react-tooltip';
import {
  createContext,
  forwardRef,
  useContext,
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
 * A short label beside a control, shown when the pointer rests on it or
 * keyboard focus lands on it. It DESCRIBES its trigger — `aria-describedby`,
 * never the name — and it is gone the moment the user does anything else.
 *
 * Sizing contract: hug, with the overlay exception (D-061 §3). RSC: client.
 *
 * The first component built on the overlay foundation alone
 * (overlay-foundation.md): the portal, the dismissable layer, the grace area
 * between trigger and content and the positioning are Radix's; every node,
 * class name and pixel is ours. Three things the foundation adds, as in
 * Popover: the THEME crosses the portal (§3), `side` is LOGICAL (§5), and the
 * offsets are STEPS OF THE SPACE SCALE (D-061 §5).
 *
 * THE PROVIDER IS OPTIONAL (spec §1, D-064 §5). Radix's tooltips share one
 * provider for the open delay and the SKIP delay — after one tooltip has
 * shown, a neighbouring trigger opens at once, which is how a toolbar feels
 * right — and Radix throws when a Tooltip renders outside one. Ours reads a
 * context of its own and, when nothing is above it, renders Radix's provider
 * itself with the defaults. One tooltip needs no setup; a toolbar wraps once.
 *
 * `data-state` IS RADIX'S THREE VALUES (spec §4, D-064 §3): `closed`,
 * `delayed-open` and `instant-open`. The third is the one paint-time fact the
 * stylesheet needs — a tooltip that opened because the pointer swept from a
 * neighbour must not animate in again.
 *
 * NAMED PARTS, NOT `Tooltip.Trigger` (D-062 §1): a Server Component cannot dot
 * into a client module, and a Next App Router page is one by default.
 *
 * Spec: docs/specs/Tooltip.md
 */

export type TooltipSide = LogicalSide;
export type TooltipAlign = 'start' | 'center' | 'end';

// ---------------------------------------------------------------------------
// Provider

/** `true` inside a <TooltipProvider>, so a <Tooltip> knows not to render its own. */
const HasProviderContext = createContext(false);

export interface TooltipProviderProps {
  /** Milliseconds the pointer rests on a trigger before its tooltip opens. Radix's 700. */
  delayDuration?: number;
  /**
   * Milliseconds after a tooltip closes in which a neighbouring trigger opens
   * at once, with no delay and no entry animation (`instant-open`). Radix's 300.
   */
  skipDelayDuration?: number;
  children?: ReactNode;
}

/**
 * Shares the delays across every Tooltip inside it. Optional: a Tooltip with
 * no provider above it provides for itself (spec §1).
 */
export function TooltipProvider({ delayDuration, skipDelayDuration, children }: TooltipProviderProps) {
  return (
    <HasProviderContext.Provider value={true}>
      <RadixTooltip.Provider
        /* Only the keys that were given: Radix types its optionals without
           `undefined`, and the build runs with exactOptionalPropertyTypes. */
        {...(delayDuration !== undefined ? { delayDuration } : {})}
        {...(skipDelayDuration !== undefined ? { skipDelayDuration } : {})}
      >
        {children}
      </RadixTooltip.Provider>
    </HasProviderContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Root

interface TooltipContextValue {
  /** The trigger element: the theme's scope, the direction's source, the tokens' element. */
  triggerRef: RefObject<HTMLElement | null>;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

function useTooltipContext(part: string): TooltipContextValue {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error(`[pixel-perfect] <Tooltip${part}> must be rendered inside <Tooltip>.`);
  }
  return context;
}

export interface TooltipProps {
  /** Controlled. */
  open?: boolean;
  /** Uncontrolled seed. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Overrides the provider's open delay for this one tooltip. */
  delayDuration?: number;
  children?: ReactNode;
}

export function Tooltip({ open, defaultOpen, onOpenChange, delayDuration, children }: TooltipProps) {
  const hasProvider = useContext(HasProviderContext);
  const triggerRef = useRef<HTMLElement | null>(null);
  const context = useMemo<TooltipContextValue>(() => ({ triggerRef }), []);

  const root = (
    <TooltipContext.Provider value={context}>
      {/* Radix owns the state and the controlled/uncontrolled pair (RULES §5.5). */}
      <RadixTooltip.Root
        {...(open !== undefined ? { open } : {})}
        {...(defaultOpen !== undefined ? { defaultOpen } : {})}
        {...(onOpenChange !== undefined ? { onOpenChange } : {})}
        {...(delayDuration !== undefined ? { delayDuration } : {})}
      >
        {children}
      </RadixTooltip.Root>
    </TooltipContext.Provider>
  );

  /*
   * THE FALLBACK PROVIDER (spec §1). Radix throws without one; a single
   * tooltip should not need setup. A provider per tooltip shares no skip
   * delay with its neighbours — that is what <TooltipProvider> is for.
   */
  return hasProvider ? root : <RadixTooltip.Provider>{root}</RadixTooltip.Provider>;
}

// ---------------------------------------------------------------------------
// Trigger

export interface TooltipTriggerProps extends ComponentPropsWithoutRef<'button'> {
  /** Renders the child instead of a `<button>`, merging the trigger's props onto it (RULES §5.7). */
  asChild?: boolean;
}

/**
 * Almost always `asChild`, onto a control that already has a name: the tooltip
 * describes, it does not name (spec §2). Whatever it renders must be
 * focusable, or keyboard users never see the tooltip.
 */
export const TooltipTrigger = forwardRef<HTMLButtonElement, TooltipTriggerProps>(function TooltipTrigger(
  { asChild = false, className, ...props },
  ref,
) {
  const { triggerRef } = useTooltipContext('Trigger');
  const setRef = useMemo(() => mergeRefs<HTMLButtonElement>(ref, triggerRef as Ref<HTMLButtonElement>), [ref, triggerRef]);
  return (
    <RadixTooltip.Trigger
      ref={setRef}
      asChild={asChild}
      className={cx(!asChild && 'pp-tooltip__trigger', className)}
      {...props}
    />
  );
});

// ---------------------------------------------------------------------------
// Content

export interface TooltipContentProps
  extends Omit<
    ComponentPropsWithoutRef<typeof RadixTooltip.Content>,
    | 'side'
    | 'sideOffset'
    | 'align'
    | 'alignOffset'
    | 'collisionPadding'
    | 'asChild'
    | 'forceMount'
    | 'avoidCollisions'
    | 'sticky'
    | 'hideWhenDetached'
  > {
  /** Logical: `start` and `end` follow the layout's direction (spec §5). */
  side?: TooltipSide;
  align?: TooltipAlign;
  /** A step of the space scale between the trigger and the tooltip. */
  sideOffset?: Space;
  /** A step of the space scale kept between the tooltip and the viewport's edges. */
  collisionPadding?: Space;
  /** Where the tooltip is portalled. Defaults to `document.body`. */
  container?: Element | null;
}

export const TooltipContent = forwardRef<HTMLDivElement, TooltipContentProps>(function TooltipContent(
  { container, ...props },
  ref,
) {
  return (
    /*
     * Radix's Portal keeps its child mounted while the child's own exit
     * animation runs, so the panel is the portal's direct child and there is
     * no wrapper of ours (D-061 §4). Nothing renders on the server.
     */
    <RadixTooltip.Portal container={container ?? undefined}>
      <TooltipPanel ref={ref} {...props} />
    </RadixTooltip.Portal>
  );
});

const TooltipPanel = forwardRef<HTMLDivElement, Omit<TooltipContentProps, 'container'>>(function TooltipPanel(
  { side = 'top', align = 'center', sideOffset = '1', collisionPadding = '2', className, ...props },
  ref,
) {
  const { triggerRef } = useTooltipContext('Content');

  /* 4.1 §3: the theme crosses the portal, on this element. The panel paints
     the INVERSE of that theme, which is why it has to know which one. */
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

  return (
    <RadixTooltip.Content
      ref={ref}
      className={cx('pp-tooltip', className)}
      data-pp-theme={theme}
      side={resolved.side}
      align={align}
      sideOffset={resolved.sideOffset}
      collisionPadding={resolved.collisionPadding}
      {...props}
    />
  );
});
