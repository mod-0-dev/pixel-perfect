'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';

import { cx } from '../../internal/cx';
import { useFocusRestore } from '../../internal/overlay/focus';
import { useInheritedTheme } from '../../internal/overlay/theme';
import { mergeRefs } from '../../internal/refs';

/**
 * A window over the page that the user must deal with before continuing.
 * The page behind it is inert — no pointer, no scroll, no focus, nothing
 * read — until it closes.
 *
 * Sizing contract: hug, with the overlay exception (D-061 §3) and its other
 * half, the scrim's `inset: 0` (D-067 §2). RSC: client.
 *
 * Behaviour is Radix's — the portal, the focus scope, the dismissable layer,
 * the scroll lock, the `aria-hidden` sweep — and every node and pixel is
 * ours. Two things are added over Radix (spec §6, §7): `aria-modal="true"`
 * on the panel, and a dialog opened with no trigger returns focus to the
 * element that had it, where Radix drops it to <body>. One thing is taken
 * away: `modal` (spec §2) — a dialog IS its modality.
 *
 * THE SCRIM IS RENDERED BY CONTENT AND IS THE PANEL'S PARENT (spec §1, §4).
 * Radix's `Overlay` is not a part a consumer places: there is one way a
 * modal looks, and a scrim a consumer can forget is a panel floating over a
 * live-looking page that does not respond. As the panel's parent, the scrim
 * is also the positioner (a grid, centred in every direction) and the scroll
 * container — Radix's own recipe, and the one its scroll lock permits
 * scrolling inside.
 *
 * NAMED PARTS, NOT `Dialog.Trigger` (D-062 §1): a Server Component cannot dot
 * into a client module, and a Next App Router page is one by default.
 *
 * Spec: docs/specs/Dialog.md
 */

interface DialogContextValue {
  /** The trigger element: the theme's scope, and whether there is one to return focus to. */
  triggerRef: RefObject<HTMLElement | null>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext(part: string): DialogContextValue {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error(`[pixel-perfect] <Dialog${part}> must be rendered inside <Dialog>.`);
  }
  return context;
}

/* tsconfig.build.json compiles with `types: []`, so `process` is declared
   locally and guarded, as Popover does. */
declare const process: { env?: { NODE_ENV?: string } } | undefined;
const isProduction = () => typeof process !== 'undefined' && process?.env?.NODE_ENV === 'production';

// ---------------------------------------------------------------------------
// Root

export interface DialogProps {
  /** Controlled. */
  open?: boolean;
  /** Uncontrolled seed. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

/** Holds the state. Modal, and only modal: there is no `modal` prop (spec §2). */
export function Dialog({ open, defaultOpen, onOpenChange, children }: DialogProps) {
  const triggerRef = useRef<HTMLElement | null>(null);
  const context = useMemo<DialogContextValue>(() => ({ triggerRef }), []);

  return (
    <DialogContext.Provider value={context}>
      {/* Radix owns the state and the controlled/uncontrolled pair (RULES §5.5). */}
      <RadixDialog.Root
        /* Only the keys that were given: Radix types its optionals without
           `undefined`, and the build runs with exactOptionalPropertyTypes. */
        {...(open !== undefined ? { open } : {})}
        {...(defaultOpen !== undefined ? { defaultOpen } : {})}
        {...(onOpenChange !== undefined ? { onOpenChange } : {})}
      >
        {children}
      </RadixDialog.Root>
    </DialogContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Trigger

export interface DialogTriggerProps extends ComponentPropsWithoutRef<'button'> {
  /** Renders the child instead of a `<button>`, merging the trigger's props onto it (RULES §5.7). */
  asChild?: boolean;
}

export const DialogTrigger = forwardRef<HTMLButtonElement, DialogTriggerProps>(function DialogTrigger(
  { asChild = false, className, ...props },
  ref,
) {
  const { triggerRef } = useDialogContext('Trigger');
  const setRef = useMemo(() => mergeRefs<HTMLButtonElement>(ref, triggerRef as Ref<HTMLButtonElement>), [ref, triggerRef]);
  return (
    <RadixDialog.Trigger
      ref={setRef}
      asChild={asChild}
      className={cx(!asChild && 'pp-dialog__trigger', className)}
      {...props}
    />
  );
});

// ---------------------------------------------------------------------------
// Content

export interface DialogContentProps
  extends Omit<ComponentPropsWithoutRef<typeof RadixDialog.Content>, 'asChild' | 'forceMount' | 'onFocusOutside'> {
  /** Where the scrim and the panel are portalled, together. Defaults to `document.body`. */
  container?: Element | null;
}

export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(function DialogContent(
  { container, ...props },
  ref,
) {
  const { triggerRef } = useDialogContext('Content');

  /* 4.1 §3: the theme crosses the portal, on the outermost element of ours —
     the scrim — so the panel inside resolves every token in it too. */
  const theme = useInheritedTheme(triggerRef);

  return (
    /*
     * Radix's Portal wraps its child in Presence, and the Overlay carries a
     * Presence of its own; the panel inside has a third. Because the panel
     * is the scrim's child, the scrim's exit ending unmounts the panel with
     * it, which is why the two exits are one token (spec §8). Nothing
     * renders on the server (4.1 §7).
     */
    <RadixDialog.Portal container={container ?? undefined}>
      <RadixDialog.Overlay className="pp-dialog__scrim" data-pp-theme={theme}>
        <DialogPanel ref={ref} {...props} />
      </RadixDialog.Overlay>
    </RadixDialog.Portal>
  );
});

const DialogPanel = forwardRef<HTMLDivElement, Omit<DialogContentProps, 'container'>>(function DialogPanel(
  {
    className,
    onOpenAutoFocus,
    onCloseAutoFocus,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    ...props
  },
  ref,
) {
  const { triggerRef } = useDialogContext('Content');
  const panelRef = useRef<HTMLDivElement | null>(null);
  const setRef = useMemo(() => mergeRefs<HTMLDivElement>(ref, panelRef), [ref]);

  /* Focus goes back to something when there was no trigger (spec §7):
     shared with every modal built on Radix's dialog. */
  const { handleOpenAutoFocus, handleCloseAutoFocus } = useFocusRestore(triggerRef, onOpenAutoFocus, onCloseAutoFocus);

  /*
   * THE NAME IS WARNED ABOUT, NOT WIRED (spec §6). Radix wires
   * `aria-labelledby` to its Title only while one is mounted, so nothing
   * dangles; what remains is a dialog with no Title and no `aria-label`,
   * which is nameless, and development says so — by reading the DOM for
   * the part rather than an id, so the check does not race Radix's count.
   */
  const named = ariaLabel !== undefined || ariaLabelledby !== undefined;
  useEffect(() => {
    if (isProduction() || named) return;
    if (!panelRef.current?.querySelector('.pp-dialog__title')) {
      console.warn(
        '[pixel-perfect] <DialogContent> has no accessible name. Render a <DialogTitle>, or pass `aria-label` or `aria-labelledby`.',
      );
    }
  }, [named]);

  return (
    <RadixDialog.Content
      ref={setRef}
      className={cx('pp-dialog', className)}
      /* APG asks for it; Radix relies on its aria-hidden sweep alone. The two
         do not conflict (spec §6). */
      aria-modal="true"
      /* Only when given: Radix sets `aria-labelledby` to its Title's id
         before spreading these, and an explicit `undefined` would erase it. */
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

export interface DialogTitleProps extends ComponentPropsWithoutRef<'div'> {}

/**
 * A `<div>`, not Radix's `<h2>`: the right level is the page's to know
 * (Alert.md §6, Popover §2, spec §6). Pass a `Heading` as the child when the
 * dialog is a section of the outline.
 */
export const DialogTitle = forwardRef<HTMLDivElement, DialogTitleProps>(function DialogTitle(
  { className, ...props },
  ref,
) {
  useDialogContext('Title');
  return (
    <RadixDialog.Title asChild>
      <div ref={ref} className={cx('pp-dialog__title', className)} {...props} />
    </RadixDialog.Title>
  );
});

export interface DialogDescriptionProps extends ComponentPropsWithoutRef<'p'> {}

export const DialogDescription = forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  function DialogDescription({ className, ...props }, ref) {
    useDialogContext('Description');
    return (
      <RadixDialog.Description asChild>
        <p ref={ref} className={cx('pp-dialog__description', className)} {...props} />
      </RadixDialog.Description>
    );
  },
);

export interface DialogCloseProps extends ComponentPropsWithoutRef<'button'> {
  asChild?: boolean;
}

/** Closes on activation. Any number, anywhere inside the panel. */
export const DialogClose = forwardRef<HTMLButtonElement, DialogCloseProps>(function DialogClose(
  { asChild = false, className, ...props },
  ref,
) {
  useDialogContext('Close');
  return (
    <RadixDialog.Close
      ref={ref}
      asChild={asChild}
      className={cx(!asChild && 'pp-dialog__close', className)}
      {...props}
    />
  );
});
