'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
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
import { useFocusRestore } from '../../internal/overlay/focus';
import { directionOf, resolveSide, type LogicalSide, type PhysicalSide } from '../../internal/overlay/side';
import { useInheritedTheme } from '../../internal/overlay/theme';
import { mergeRefs } from '../../internal/refs';

/**
 * A modal panel that slides in from an edge of the viewport and stays the
 * full height (or width) of it. The page behind it is inert until it
 * closes, exactly as behind a Dialog; what differs is where the panel is
 * and how it arrives.
 *
 * BUILT ON RADIX'S DIALOG (spec §2, D-071 §2): Radix has no drawer, and a
 * drawer IS a modal dialog with a different placement. The scrim carries
 * Dialog's class first (`pp-dialog__scrim pp-drawer__scrim`), so Dialog.css
 * gives it the viewport box, the layer, the fill and the fade; Drawer.css
 * places the panel per side. The panel is `pp-drawer`, its own class.
 *
 * `side` IS LOGICAL and `data-side` IS PHYSICAL (4.1 §5): `start` / `end`
 * resolve against the trigger's direction at open time, and the scrim's
 * grid places the panel with the physical keywords.
 *
 * Sizing contract: hug, with the overlay exception in its edge-anchored
 * form — the anchored axis is a token (D-071 §1). RSC: client.
 * Spec: docs/specs/Drawer.md
 */

export type DrawerSide = LogicalSide;

interface DrawerContextValue {
  triggerRef: RefObject<HTMLElement | null>;
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

function useDrawerContext(part: string): DrawerContextValue {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error(`[pixel-perfect] <Drawer${part}> must be rendered inside <Drawer>.`);
  }
  return context;
}

declare const process: { env?: { NODE_ENV?: string } } | undefined;
const isProduction = () => typeof process !== 'undefined' && process?.env?.NODE_ENV === 'production';

// ---------------------------------------------------------------------------
// Root

export interface DrawerProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export function Drawer({ open, defaultOpen, onOpenChange, children }: DrawerProps) {
  const triggerRef = useRef<HTMLElement | null>(null);
  const context = useMemo<DrawerContextValue>(() => ({ triggerRef }), []);
  return (
    <DrawerContext.Provider value={context}>
      <RadixDialog.Root
        {...(open !== undefined ? { open } : {})}
        {...(defaultOpen !== undefined ? { defaultOpen } : {})}
        {...(onOpenChange !== undefined ? { onOpenChange } : {})}
      >
        {children}
      </RadixDialog.Root>
    </DrawerContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Trigger

export interface DrawerTriggerProps extends ComponentPropsWithoutRef<'button'> {
  asChild?: boolean;
}

export const DrawerTrigger = forwardRef<HTMLButtonElement, DrawerTriggerProps>(function DrawerTrigger(
  { asChild = false, className, ...props },
  ref,
) {
  const { triggerRef } = useDrawerContext('Trigger');
  const setRef = useMemo(() => mergeRefs<HTMLButtonElement>(ref, triggerRef as Ref<HTMLButtonElement>), [ref, triggerRef]);
  return (
    <RadixDialog.Trigger
      ref={setRef}
      asChild={asChild}
      className={cx(!asChild && 'pp-drawer__trigger', className)}
      {...props}
    />
  );
});

// ---------------------------------------------------------------------------
// Content

export interface DrawerContentProps
  extends Omit<ComponentPropsWithoutRef<typeof RadixDialog.Content>, 'asChild' | 'forceMount' | 'onFocusOutside'> {
  /** The edge the panel is anchored to. Logical: `start` and `end` follow the layout's direction. */
  side?: DrawerSide;
  /** Where the scrim and the panel are portalled, together. Defaults to `document.body`. */
  container?: Element | null;
}

export const DrawerContent = forwardRef<HTMLDivElement, DrawerContentProps>(function DrawerContent(
  { container, ...props },
  ref,
) {
  return (
    /*
     * The surface — scrim and panel — is ONE child of Radix's portal, so it
     * mounts when the drawer opens and not before. That is what makes the
     * side resolve at OPEN time (4.1 §5): the first draft resolved it in
     * this component, which is mounted with the page, and a `dir` set after
     * load never reached it (D-071 §3).
     */
    <RadixDialog.Portal container={container ?? undefined}>
      <DrawerSurface panelRef={ref} {...props} />
    </RadixDialog.Portal>
  );
});

/**
 * Scrim and panel, mounted together on open. The forwarded ref is the
 * portal's (Presence reads the scrim's animations through it); the
 * consumer's `ref` arrives as `panelRef` and lands on the panel, the root
 * RULES §5 means.
 */
const DrawerSurface = forwardRef<
  HTMLDivElement,
  Omit<DrawerContentProps, 'container'> & { panelRef: Ref<HTMLDivElement> }
>(function DrawerSurface({ side = 'end', panelRef, ...props }, scrimRef) {
  const { triggerRef } = useDrawerContext('Content');
  const theme = useInheritedTheme(triggerRef);

  /* The logical side resolves against the TRIGGER's direction, in a layout
     effect on mount — before paint, and at open time because this element
     mounts on open. Until it has run, the left-to-right reading. */
  const [physical, setPhysical] = useState<PhysicalSide>(() => resolveSide(side, 'ltr'));
  useLayoutEffect(() => {
    setPhysical(resolveSide(side, directionOf(triggerRef.current)));
  }, [triggerRef, side]);

  return (
    <RadixDialog.Overlay ref={scrimRef} className="pp-dialog__scrim pp-drawer__scrim" data-side={physical} data-pp-theme={theme}>
      <DrawerPanel ref={panelRef} data-side={physical} {...props} />
    </RadixDialog.Overlay>
  );
});

const DrawerPanel = forwardRef<HTMLDivElement, Omit<DrawerContentProps, 'container' | 'side'>>(function DrawerPanel(
  { className, onOpenAutoFocus, onCloseAutoFocus, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby, ...props },
  ref,
) {
  const { triggerRef } = useDrawerContext('Content');
  const panelRef = useRef<HTMLDivElement | null>(null);
  const setRef = useMemo(() => mergeRefs<HTMLDivElement>(ref, panelRef), [ref]);
  const { handleOpenAutoFocus, handleCloseAutoFocus } = useFocusRestore(triggerRef, onOpenAutoFocus, onCloseAutoFocus);

  const named = ariaLabel !== undefined || ariaLabelledby !== undefined;
  useEffect(() => {
    if (isProduction() || named) return;
    if (!panelRef.current?.querySelector('.pp-drawer__title')) {
      console.warn(
        '[pixel-perfect] <DrawerContent> has no accessible name. Render a <DrawerTitle>, or pass `aria-label` or `aria-labelledby`.',
      );
    }
  }, [named]);

  return (
    <RadixDialog.Content
      ref={setRef}
      className={cx('pp-drawer', className)}
      aria-modal="true"
      {...(ariaLabel !== undefined ? { 'aria-label': ariaLabel } : {})}
      {...(ariaLabelledby !== undefined ? { 'aria-labelledby': ariaLabelledby } : {})}
      onOpenAutoFocus={handleOpenAutoFocus}
      onCloseAutoFocus={handleCloseAutoFocus}
      {...props}
    />
  );
});

// ---------------------------------------------------------------------------
// Title, Description, Close

export interface DrawerTitleProps extends ComponentPropsWithoutRef<'div'> {}

export const DrawerTitle = forwardRef<HTMLDivElement, DrawerTitleProps>(function DrawerTitle({ className, ...props }, ref) {
  useDrawerContext('Title');
  return (
    <RadixDialog.Title asChild>
      <div ref={ref} className={cx('pp-drawer__title', className)} {...props} />
    </RadixDialog.Title>
  );
});

export interface DrawerDescriptionProps extends ComponentPropsWithoutRef<'p'> {}

export const DrawerDescription = forwardRef<HTMLParagraphElement, DrawerDescriptionProps>(function DrawerDescription(
  { className, ...props },
  ref,
) {
  useDrawerContext('Description');
  return (
    <RadixDialog.Description asChild>
      <p ref={ref} className={cx('pp-drawer__description', className)} {...props} />
    </RadixDialog.Description>
  );
});

export interface DrawerCloseProps extends ComponentPropsWithoutRef<'button'> {
  asChild?: boolean;
}

export const DrawerClose = forwardRef<HTMLButtonElement, DrawerCloseProps>(function DrawerClose(
  { asChild = false, className, ...props },
  ref,
) {
  useDrawerContext('Close');
  return (
    <RadixDialog.Close ref={ref} asChild={asChild} className={cx(!asChild && 'pp-drawer__close', className)} {...props} />
  );
});
