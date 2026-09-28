'use client';

import { useCallback, useRef, useState, type RefObject } from 'react';

/**
 * THE HIGHLIGHT OF A LISTBOX, MOVED OVER THE DOM (Combobox §4, D-076 §6):
 * the enabled options are read from the list when a key is pressed, so a
 * consumer's filtering, grouping and disabling are honoured with nothing
 * registered, and a move asked for before the list is mounted waits for
 * the mount. The active option is `aria-activedescendant`'s target; focus
 * stays in the input. Shared by Combobox and CommandPalette (D-078 §1).
 *
 * Internal. Not exported from the package.
 */

export type ListboxMove = 'next' | 'prev' | 'first' | 'last';

/** The enabled options of a list, in DOM order. */
export function optionsOf(list: HTMLElement | null): HTMLElement[] {
  if (!list) return [];
  return Array.from(list.querySelectorAll<HTMLElement>('[role="option"]:not([aria-disabled="true"])'));
}

export function useActiveOption(listRef: RefObject<HTMLElement | null>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const pending = useRef<ListboxMove | null>(null);

  const move = useCallback(
    (to: ListboxMove) => {
      const options = optionsOf(listRef.current);
      if (options.length === 0) {
        pending.current = to;
        return;
      }
      const index = options.findIndex((n) => n.id === activeId);
      let next: number;
      if (to === 'first') next = 0;
      else if (to === 'last') next = options.length - 1;
      else if (index === -1) next = to === 'next' ? 0 : options.length - 1;
      else next = (index + (to === 'next' ? 1 : -1) + options.length) % options.length;
      setActiveId(options[next]!.id);
    },
    [listRef, activeId],
  );

  /** The list mounted: a move asked for before it runs now. */
  const listMounted = useCallback(() => {
    if (pending.current) {
      const to = pending.current;
      pending.current = null;
      move(to);
    }
  }, [move]);

  /** The active option's element, if it is enabled and in the list. */
  const active = useCallback((): HTMLElement | null => {
    if (!activeId) return null;
    const node = listRef.current?.querySelector<HTMLElement>(`[id="${activeId}"]`);
    if (!node || node.getAttribute('aria-disabled') === 'true') return null;
    return node;
  }, [listRef, activeId]);

  return { activeId, setActiveId, move, active, listMounted };
}
