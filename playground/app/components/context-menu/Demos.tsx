'use client';

import {
  Button,
  Cluster,
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuItemIndicator,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  Stack,
  Text,
} from 'pixel-perfect';
import { useEffect, useRef, useState } from 'react';

/**
 * The Matrix gallery: one region per cell, its list opened at a point inside
 * it by a dispatched `contextmenu` event after mount — a context menu has no
 * `defaultOpen` worth the name (spec §6). Non-modal, with Radix's two
 * escape hatches so the three sit still for the screenshot (D-062 §2).
 */
export function Gallery() {
  const region = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = region.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: box.left + 16, clientY: box.top + 16 }));
  }, []);
  return (
    <ContextMenu modal={false}>
      <ContextMenuTrigger ref={region} className="context-region">
        Opened here, at a point
      </ContextMenuTrigger>
      <ContextMenuContent
        aria-label="File"
        data-gallery=""
        onFocusOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <ContextMenuItem>
          Rename
          <ContextMenuShortcut>⌘R</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>Duplicate</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem defaultChecked onSelect={(event) => event.preventDefault()}>
          <ContextMenuItemIndicator />
          Pinned
        </ContextMenuCheckboxItem>
        <ContextMenuSeparator />
        <ContextMenuItem tone="danger">Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

/** A focusable region with the actions on a row; `dir="rtl"` for the mirrored one. */
export function Region({ dir }: { dir?: 'rtl' }) {
  const [last, setLast] = useState('nothing');
  return (
    <Stack gap="2">
      <div dir={dir} data-testid={dir === 'rtl' ? 'context-menu-region-rtl' : 'context-menu-region'}>
        <ContextMenu>
          <ContextMenuTrigger className="context-region" tabIndex={0}>
            {dir === 'rtl' ? 'Right-to-left: the submenu opens to the left' : 'Right-click, long-press, or focus and press Shift+F10'}
          </ContextMenuTrigger>
          <ContextMenuContent aria-label="File">
            <ContextMenuItem onSelect={() => setLast('rename')}>
              Rename
              <ContextMenuShortcut>⌘R</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => setLast('duplicate')}>Duplicate</ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>Move to</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem onSelect={() => setLast('archive')}>Archive</ContextMenuItem>
                <ContextMenuItem onSelect={() => setLast('trash')}>Trash</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
            <ContextMenuItem disabled>Download</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem tone="danger" onSelect={() => setLast('delete')}>
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>
      <Text size="sm" tone="muted">
        last: {last}
      </Text>
    </Stack>
  );
}

/** Disabled: the browser's own menu, and nothing of ours. */
export function Disabled() {
  return (
    <div data-testid="context-menu-disabled">
      <ContextMenu>
        <ContextMenuTrigger className="context-region" disabled>
          Disabled: the browser&rsquo;s own menu
        </ContextMenuTrigger>
        <ContextMenuContent aria-label="Never">
          <ContextMenuItem>Never shown</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}

/** Closed from outside: `open={false}` when the thing the menu is about is gone (spec §6). */
export function Controlled() {
  const [open, setOpen] = useState(false);
  return (
    <Stack gap="2">
      <div data-testid="context-menu-controlled">
        <ContextMenu open={open} onOpenChange={setOpen}>
          <ContextMenuTrigger className="context-region">Controlled: the button below closes it</ContextMenuTrigger>
          <ContextMenuContent aria-label="Controlled">
            <ContextMenuItem>One</ContextMenuItem>
            <ContextMenuItem>Two</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>
      <Cluster gap="3" align="center">
        <Button variant="outline" onClick={() => setOpen(false)}>
          Close it
        </Button>
        <Text size="sm" tone="muted">
          open: {String(open)}
        </Text>
      </Cluster>
    </Stack>
  );
}

/** A dark region of a light page: the theme must cross the portal (4.1 §3). */
export function ThemeCrossing() {
  return (
    <div data-pp-theme="dark" data-testid="context-menu-theme" className="popover-dark-region">
      <ContextMenu>
        <ContextMenuTrigger className="context-region">This region is dark; so is its list</ContextMenuTrigger>
        <ContextMenuContent aria-label="Dark">
          <ContextMenuItem>The list is dark too</ContextMenuItem>
          <ContextMenuItem>And it is not inside this region</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
