'use client';

import { type MouseEvent, type ReactNode } from 'react';

import { useControllableState } from '../../internal/useControllableState';
import { Drawer, DrawerContent, DrawerTrigger } from '../Drawer/Drawer';
import { IconButton } from '../IconButton/IconButton';

/**
 * The sidebar of an AppShell with `collapseTo="drawer"`, below its breakpoint:
 * a menu button at the start of the header that opens the same content in a
 * Drawer from the start edge (AppShell.md §9, D-110 §8).
 *
 * Internal — AppShell renders it, so a drawer shell can never be left with
 * no way to reach its navigation. AppShell is a Server Component and stays
 * one; this is the client island inside it.
 *
 * Shown and hidden by AppShell.css's named container query, never by a
 * viewport query: the button exists in the DOM at every width, and the
 * stylesheet decides, at the same threshold that hides the sidebar.
 */
export interface AppShellMenuProps {
  label: string;
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  children: ReactNode;
}

function MenuGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function AppShellMenu({ label, open, defaultOpen, onOpenChange, children }: AppShellMenuProps) {
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
    component: 'AppShell',
    prop: 'menuOpen',
  });

  /*
   * A link followed from the menu closes it. A client-side navigation does
   * not unmount the shell, so without this the drawer would stay open over
   * the page the user just asked for. A link that opens elsewhere — a new
   * tab, a download, a modified click — leaves it open.
   */
  const closeOnNavigate = (event: MouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest('a[href]');
    if (!link || link.getAttribute('target') === '_blank' || link.hasAttribute('download')) return;
    setOpen(false);
  };

  return (
    <Drawer open={isOpen} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <IconButton label={label} variant="ghost" className="pp-app-shell__menu">
          <MenuGlyph />
        </IconButton>
      </DrawerTrigger>
      <DrawerContent side="start" aria-label={label} className="pp-app-shell__drawer" onClick={closeOnNavigate}>
        {children}
      </DrawerContent>
    </Drawer>
  );
}
