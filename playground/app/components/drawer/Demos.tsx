'use client';

import {
  Button,
  Cluster,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
  IconButton,
  Link,
  Stack,
  Text,
} from '@mod-0-dev/pixel-perfect';
import { useState } from 'react';

function Menu() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

/**
 * The Matrix gallery: a cell is a viewport (Dialog §10). Closed until its
 * cell's trigger is pressed, or all three open at load under `?gallery=open`
 * (D-102 §1), the only time open-autofocus is prevented.
 */
const keepFocus = { onOpenAutoFocus: (event: Event) => event.preventDefault() };

export function Gallery({ open }: { open: boolean }) {
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  return (
    <Drawer defaultOpen={open}>
      <div ref={setStage} className="dialog-stage">
        <DrawerTrigger asChild>
          <Button variant="outline">Open in this cell</Button>
        </DrawerTrigger>
        {stage && (
          <DrawerContent container={stage} data-gallery="" {...(open ? keepFocus : {})}>
            <Stack gap="4">
              <Stack gap="1">
                <DrawerTitle>Details</DrawerTitle>
                <DrawerDescription>Q3 revenue model.xlsx</DrawerDescription>
              </Stack>
              <Text size="sm">Owner: Finance. Last edited yesterday. Shared with 4 people.</Text>
              <Cluster justify="end">
                <DrawerClose asChild>
                  <Button variant="ghost">Close</Button>
                </DrawerClose>
              </Cluster>
            </Stack>
          </DrawerContent>
        )}
      </div>
    </Drawer>
  );
}

export function Navigation() {
  return (
    <div data-testid="drawer-nav">
      <Drawer>
        <DrawerTrigger asChild>
          <IconButton label="Menu" variant="outline">
            <Menu />
          </IconButton>
        </DrawerTrigger>
        <DrawerContent side="start" aria-label="Navigation">
          <Stack gap="3">
            <Link href="#home">Home</Link>
            <Link href="#reports">Reports</Link>
            <Link href="#settings">Settings</Link>
            <DrawerClose asChild>
              <Button variant="ghost">Close</Button>
            </DrawerClose>
          </Stack>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

/** Four sides, closed by default; the browser suite opens each and measures. */
export function Sides({ dir }: { dir?: 'rtl' }) {
  const sides = ['start', 'end', 'top', 'bottom'] as const;
  return (
    <div dir={dir} data-testid={dir === 'rtl' ? 'drawer-sides-rtl' : 'drawer-sides'}>
      <Cluster gap="3">
        {sides.map((side) => (
          <Drawer key={side}>
            <DrawerTrigger asChild>
              <Button variant="outline" data-side-trigger={side}>
                {side}
              </Button>
            </DrawerTrigger>
            <DrawerContent side={side} aria-label={`From the ${side}`}>
              <Stack gap="3">
                <Text>side=&quot;{side}&quot;</Text>
                <DrawerClose asChild>
                  <Button variant="ghost">Close</Button>
                </DrawerClose>
              </Stack>
            </DrawerContent>
          </Drawer>
        ))}
      </Cluster>
    </div>
  );
}

export function Sheet() {
  return (
    <div data-testid="drawer-sheet">
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline">Share</Button>
        </DrawerTrigger>
        <DrawerContent side="bottom">
          <Stack gap="4">
            <DrawerTitle>Share</DrawerTitle>
            <DrawerDescription>Anyone with the link can view.</DrawerDescription>
            <Cluster gap="2">
              <Button>Copy link</Button>
              <DrawerClose asChild>
                <Button variant="ghost">Done</Button>
              </DrawerClose>
            </Cluster>
          </Stack>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

export function Tall() {
  return (
    <div data-testid="drawer-tall">
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline">Activity</Button>
        </DrawerTrigger>
        <DrawerContent aria-label="Activity">
          <Stack gap="3">
            {Array.from({ length: 40 }, (_, i) => (
              <Text key={i} size="sm">
                Event {i + 1}: something happened to the file, and it is listed here so the list runs past
                the bottom of the viewport.
              </Text>
            ))}
            <DrawerClose asChild>
              <Button variant="ghost">Close</Button>
            </DrawerClose>
          </Stack>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

export function ThemeCrossing() {
  return (
    <div data-pp-theme="dark" data-testid="drawer-theme" className="popover-dark-region">
      <Cluster gap="3" align="center">
        <Text size="sm">This region is dark.</Text>
        <Drawer>
          <DrawerTrigger asChild>
            <Button>Open here</Button>
          </DrawerTrigger>
          <DrawerContent aria-label="A dark drawer">
            <Stack gap="3">
              <Text>Scrim and panel are dark too.</Text>
              <DrawerClose asChild>
                <Button variant="ghost">Close</Button>
              </DrawerClose>
            </Stack>
          </DrawerContent>
        </Drawer>
      </Cluster>
    </div>
  );
}
