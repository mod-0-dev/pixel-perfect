'use client';

import { useCallback, useRef, type RefObject } from 'react';

/**
 * Focus goes back to SOMETHING when a modal had no trigger (Dialog.md §7).
 *
 * Radix's modal close handler prevents the focus scope's own restore and
 * focuses `triggerRef.current` — for a dialog opened from a row's menu, a
 * shortcut or a controlled `open` set from anywhere, that is
 * `undefined?.focus()`, and focus drops to <body>. The element that had
 * focus is recorded when the open-autofocus event fires — before the scope
 * moves it — and, only when no trigger exists, focused again on close.
 * With a trigger, nothing here changes what Radix does — unless `always`
 * is set, for a modal that is as often opened by a shortcut as by its
 * trigger (CommandPalette, D-078 §3): then the element that had focus is
 * always the one restored, which is the trigger when the trigger was used.
 * Either handler the consumer passes runs first and can `preventDefault()`.
 *
 * Shared by every modal built on Radix's dialog (Dialog, AlertDialog,
 * Drawer, CommandPalette). Internal. Not exported from the package.
 */
export function useFocusRestore(
  triggerRef: RefObject<HTMLElement | null>,
  onOpenAutoFocus: ((event: Event) => void) | undefined,
  onCloseAutoFocus: ((event: Event) => void) | undefined,
  always = false,
) {
  const restoreRef = useRef<HTMLElement | null>(null);

  const handleOpenAutoFocus = useCallback(
    (event: Event) => {
      const doc = (event.currentTarget as Node | null)?.ownerDocument ?? document;
      const active = doc.activeElement;
      restoreRef.current = active instanceof HTMLElement && active !== doc.body ? active : null;
      onOpenAutoFocus?.(event);
    },
    [onOpenAutoFocus],
  );

  const handleCloseAutoFocus = useCallback(
    (event: Event) => {
      onCloseAutoFocus?.(event);
      if (event.defaultPrevented || (triggerRef.current && !always)) return;
      const target = restoreRef.current;
      if (target?.isConnected) {
        event.preventDefault();
        target.focus();
      }
    },
    [onCloseAutoFocus, triggerRef, always],
  );

  return { handleOpenAutoFocus, handleCloseAutoFocus };
}
