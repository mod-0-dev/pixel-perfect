'use client';

import {
  Button,
  Cluster,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuItemIndicator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  IconButton,
  Stack,
  Text,
} from '@mod-0-dev/pixel-perfect';
import { useState } from 'react';

function Dots() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

/**
 * The Matrix gallery: one menu per cell, open from the start. Non-modal
 * (three modal menus would hide each other) and with Radix's two escape
 * hatches so the three sit still for the screenshot (D-062 §2).
 */
export function Gallery() {
  return (
    <Cluster>
      <DropdownMenu defaultOpen modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Open by default</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="end"
          data-gallery=""
          onFocusOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <DropdownMenuItem>
            Rename
            <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem defaultChecked onSelect={(event) => event.preventDefault()}>
            <DropdownMenuItemIndicator />
            Pinned
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem tone="danger">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Cluster>
  );
}

/** The actions on a row: plain items, a shortcut, a submenu, a destructive command. */
export function RowActions({ dir }: { dir?: 'rtl' }) {
  const [last, setLast] = useState('nothing');
  return (
    <Stack gap="2">
      <div dir={dir} data-testid={dir === 'rtl' ? 'dropdown-menu-actions-rtl' : 'dropdown-menu-actions'}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton label="More" variant="outline">
              <Dots />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => setLast('rename')}>
              Rename
              <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setLast('duplicate')}>
              Duplicate
              <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onSelect={() => setLast('archive')}>Archive</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setLast('shared')}>Shared with me</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setLast('trash')}>Trash</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Download</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem tone="danger" onSelect={() => setLast('delete')}>
              Delete
              <DropdownMenuShortcut>⌫</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Text size="sm" tone="muted">
        last: {last}
      </Text>
    </Stack>
  );
}

/** Checkable items and a radio group under labels: the gutter appears, and every label aligns. */
export function ViewMenu() {
  const [layout, setLayout] = useState('grid');
  const [hidden, setHidden] = useState(false);
  const [extensions, setExtensions] = useState(true);
  return (
    <Stack gap="2">
      <div data-testid="dropdown-menu-view">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">View</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Layout</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={layout} onValueChange={setLayout}>
                {['list', 'grid', 'columns'].map((value) => (
                  <DropdownMenuRadioItem key={value} value={value} onSelect={(event) => event.preventDefault()}>
                    <DropdownMenuItemIndicator />
                    {value[0]!.toUpperCase() + value.slice(1)}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Show</DropdownMenuLabel>
              <DropdownMenuCheckboxItem checked={hidden} onCheckedChange={setHidden} onSelect={(event) => event.preventDefault()}>
                <DropdownMenuItemIndicator />
                Hidden files
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={extensions}
                onCheckedChange={setExtensions}
                onSelect={(event) => event.preventDefault()}
              >
                <DropdownMenuItemIndicator />
                Extensions
              </DropdownMenuCheckboxItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                setLayout('grid');
                setHidden(false);
                setExtensions(true);
              }}
            >
              Reset to defaults
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Text size="sm" tone="muted">
        layout: {layout} · hidden: {String(hidden)} · extensions: {String(extensions)}
      </Text>
    </Stack>
  );
}

/** Modal by default: an outside press closes the menu and does not land. */
export function Outside() {
  const [clicks, setClicks] = useState(0);
  return (
    <Stack gap="2">
      <Cluster gap="3" align="center">
        <div data-testid="dropdown-menu-outside">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Open</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>One</DropdownMenuItem>
              <DropdownMenuItem>Two</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button variant="ghost" data-testid="dropdown-menu-outside-target" onClick={() => setClicks((n) => n + 1)}>
          Outside
        </Button>
      </Cluster>
      <Text size="sm" tone="muted">
        outside clicked {clicks}×
      </Text>
    </Stack>
  );
}

/** A long list with a long label: the ceiling holds the width, and the list scrolls inside itself. */
export function Long() {
  return (
    <div data-testid="dropdown-menu-long">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Workspaces</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            The workspace whose name was written by someone who had never seen a menu and did not expect one
          </DropdownMenuItem>
          {Array.from({ length: 30 }, (_, i) => (
            <DropdownMenuItem key={i}>Workspace {i + 1}</DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** A dark region of a light page: the theme must cross the portal (4.1 §3). */
export function ThemeCrossing() {
  return (
    <div data-pp-theme="dark" data-testid="dropdown-menu-theme" className="popover-dark-region">
      <Cluster gap="3" align="center">
        <Text size="sm">This region is dark.</Text>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Open here</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>The list is dark too</DropdownMenuItem>
            <DropdownMenuItem>And it is not inside this region</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Cluster>
    </div>
  );
}
