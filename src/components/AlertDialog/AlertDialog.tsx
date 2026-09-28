'use client';

import * as RadixAlertDialog from '@radix-ui/react-alert-dialog';
import {
  createContext,
  forwardRef,
  useCallback,
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
 * A modal that interrupts the user with a decision — usually a destructive
 * one — and does not let go until they make it.
 *
 * It is `Dialog` with two rules changed (Dialog.md, spec §1): a press on the
 * scrim does NOT close it, and focus lands on the safe button, `Cancel`,
 * rather than on the first control. Everything else is Dialog's: the scrim
 * is the positioner and the scroll container, the theme crosses the portal,
 * a trigger-less open returns focus to what had it, Escape closes.
 *
 * TWO CLASSES ON EVERY PART (spec §2), the way IconButton carries
 * `pp-button pp-icon-button`: the scrim, the panel, the title and the
 * description are `.pp-dialog__*` first and `.pp-alert-dialog__*` second, so
 * Dialog.css draws them and every `--pp-dialog-*` override still applies.
 * AlertDialog.css declares only what differs: a smaller ceiling.
 *
 * Sizing contract: hug, with the overlay exception (D-061 §3, D-067 §2).
 * RSC: client. Spec: docs/specs/AlertDialog.md
 */

interface AlertDialogContextValue {
  triggerRef: RefObject<HTMLElement | null>;
}

const AlertDialogContext = createContext<AlertDialogContextValue | null>(null);

function useAlertDialogContext(part: string): AlertDialogContextValue {
  const context = useContext(AlertDialogContext);
  if (!context) {
    throw new Error(`[pixel-perfect] <AlertDialog${part}> must be rendered inside <AlertDialog>.`);
  }
  return context;
}

declare const process: { env?: { NODE_ENV?: string } } | undefined;
const isProduction = () => typeof process !== 'undefined' && process?.env?.NODE_ENV === 'production';

// ---------------------------------------------------------------------------
// Root

export interface AlertDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export function AlertDialog({ open, defaultOpen, onOpenChange, children }: AlertDialogProps) {
  const triggerRef = useRef<HTMLElement | null>(null);
  const context = useMemo<AlertDialogContextValue>(() => ({ triggerRef }), []);
  return (
    <AlertDialogContext.Provider value={context}>
      <RadixAlertDialog.Root
        {...(open !== undefined ? { open } : {})}
        {...(defaultOpen !== undefined ? { defaultOpen } : {})}
        {...(onOpenChange !== undefined ? { onOpenChange } : {})}
      >
        {children}
      </RadixAlertDialog.Root>
    </AlertDialogContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Trigger

export interface AlertDialogTriggerProps extends ComponentPropsWithoutRef<'button'> {
  asChild?: boolean;
}

export const AlertDialogTrigger = forwardRef<HTMLButtonElement, AlertDialogTriggerProps>(
  function AlertDialogTrigger({ asChild = false, className, ...props }, ref) {
    const { triggerRef } = useAlertDialogContext('Trigger');
    const setRef = useMemo(
      () => mergeRefs<HTMLButtonElement>(ref, triggerRef as Ref<HTMLButtonElement>),
      [ref, triggerRef],
    );
    return (
      <RadixAlertDialog.Trigger
        ref={setRef}
        asChild={asChild}
        className={cx(!asChild && 'pp-alert-dialog__trigger', className)}
        {...props}
      />
    );
  },
);

// ---------------------------------------------------------------------------
// Content

export interface AlertDialogContentProps
  extends Omit<ComponentPropsWithoutRef<typeof RadixAlertDialog.Content>, 'asChild' | 'forceMount'> {
  /** Where the scrim and the panel are portalled, together. Defaults to `document.body`. */
  container?: Element | null;
}

export const AlertDialogContent = forwardRef<HTMLDivElement, AlertDialogContentProps>(
  function AlertDialogContent({ container, ...props }, ref) {
    const { triggerRef } = useAlertDialogContext('Content');
    const theme = useInheritedTheme(triggerRef);
    return (
      <RadixAlertDialog.Portal container={container ?? undefined}>
        <RadixAlertDialog.Overlay className="pp-dialog__scrim pp-alert-dialog__scrim" data-pp-theme={theme}>
          <AlertDialogPanel ref={ref} {...props} />
        </RadixAlertDialog.Overlay>
      </RadixAlertDialog.Portal>
    );
  },
);

const AlertDialogPanel = forwardRef<HTMLDivElement, Omit<AlertDialogContentProps, 'container'>>(
  function AlertDialogPanel(
    { className, onOpenAutoFocus, onCloseAutoFocus, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby, ...props },
    ref,
  ) {
    const { triggerRef } = useAlertDialogContext('Content');
    const panelRef = useRef<HTMLDivElement | null>(null);
    const setRef = useMemo(() => mergeRefs<HTMLDivElement>(ref, panelRef), [ref]);

    /*
     * FOCUS LANDS ON CANCEL, AND ON THE PANEL WHEN THERE IS NO CANCEL (spec
     * §3). Radix prevents the scope's autofocus and focuses its Cancel part;
     * with no Cancel rendered that is `undefined?.focus()` and focus stays
     * OUTSIDE the trap, on the trigger. So when the panel holds no Cancel,
     * the panel itself takes focus — and development says a Cancel is
     * missing, because a decision the user cannot decline is not a decision.
     */
    const restore = useFocusRestore(triggerRef, onOpenAutoFocus, onCloseAutoFocus);
    const handleOpenAutoFocus = useCallback(
      (event: Event) => {
        restore.handleOpenAutoFocus(event);
        if (event.defaultPrevented) return;
        const panel = panelRef.current;
        if (panel && !panel.querySelector('.pp-alert-dialog__cancel')) {
          event.preventDefault();
          panel.focus({ preventScroll: true });
        }
      },
      [restore],
    );

    const named = ariaLabel !== undefined || ariaLabelledby !== undefined;
    useEffect(() => {
      if (isProduction()) return;
      const panel = panelRef.current;
      if (!panel) return;
      if (!named && !panel.querySelector('.pp-alert-dialog__title')) {
        console.warn(
          '[pixel-perfect] <AlertDialogContent> has no accessible name. Render an <AlertDialogTitle>, or pass `aria-label` or `aria-labelledby`.',
        );
      }
      if (!panel.querySelector('.pp-alert-dialog__cancel')) {
        console.warn(
          '[pixel-perfect] <AlertDialogContent> has no <AlertDialogCancel>. An alert dialog is a decision; give the user a way to decline it.',
        );
      }
    }, [named]);

    return (
      <RadixAlertDialog.Content
        ref={setRef}
        className={cx('pp-dialog pp-alert-dialog', className)}
        aria-modal="true"
        {...(ariaLabel !== undefined ? { 'aria-label': ariaLabel } : {})}
        {...(ariaLabelledby !== undefined ? { 'aria-labelledby': ariaLabelledby } : {})}
        onOpenAutoFocus={handleOpenAutoFocus}
        onCloseAutoFocus={restore.handleCloseAutoFocus}
        {...props}
      />
    );
  },
);

// ---------------------------------------------------------------------------
// Title, Description, Cancel, Action

export interface AlertDialogTitleProps extends ComponentPropsWithoutRef<'div'> {}

export const AlertDialogTitle = forwardRef<HTMLDivElement, AlertDialogTitleProps>(function AlertDialogTitle(
  { className, ...props },
  ref,
) {
  useAlertDialogContext('Title');
  return (
    <RadixAlertDialog.Title asChild>
      <div ref={ref} className={cx('pp-dialog__title pp-alert-dialog__title', className)} {...props} />
    </RadixAlertDialog.Title>
  );
});

export interface AlertDialogDescriptionProps extends ComponentPropsWithoutRef<'p'> {}

export const AlertDialogDescription = forwardRef<HTMLParagraphElement, AlertDialogDescriptionProps>(
  function AlertDialogDescription({ className, ...props }, ref) {
    useAlertDialogContext('Description');
    return (
      <RadixAlertDialog.Description asChild>
        <p ref={ref} className={cx('pp-dialog__description pp-alert-dialog__description', className)} {...props} />
      </RadixAlertDialog.Description>
    );
  },
);

export interface AlertDialogCancelProps extends ComponentPropsWithoutRef<'button'> {
  asChild?: boolean;
}

/** The safe way out. Focused on open; closes on activation. Exactly one per dialog. */
export const AlertDialogCancel = forwardRef<HTMLButtonElement, AlertDialogCancelProps>(function AlertDialogCancel(
  { asChild = false, className, ...props },
  ref,
) {
  useAlertDialogContext('Cancel');
  return (
    <RadixAlertDialog.Cancel
      ref={ref}
      asChild={asChild}
      className={cx('pp-alert-dialog__cancel', asChild ? undefined : 'pp-alert-dialog__button', className)}
      {...props}
    />
  );
});

export interface AlertDialogActionProps extends ComponentPropsWithoutRef<'button'> {
  asChild?: boolean;
}

/** The decision. Closes on activation; the caller's `onClick` does the work. */
export const AlertDialogAction = forwardRef<HTMLButtonElement, AlertDialogActionProps>(function AlertDialogAction(
  { asChild = false, className, ...props },
  ref,
) {
  useAlertDialogContext('Action');
  return (
    <RadixAlertDialog.Action
      ref={ref}
      asChild={asChild}
      className={cx('pp-alert-dialog__action', asChild ? undefined : 'pp-alert-dialog__button', className)}
      {...props}
    />
  );
});
