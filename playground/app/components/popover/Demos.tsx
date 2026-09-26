'use client';

import {
  Button,
  Cluster,
  Field,
  Input,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
  Stack,
  Text,
} from 'pixel-perfect';
import { useState } from 'react';

/**
 * The interactive islands of the Popover page, in one client file so the
 * page stays a Server Component. Each carries the `data-testid` the browser
 * suite drives it by; ids are written by nothing here — the popover's own
 * ids come from `useId()`.
 */

/**
 * The Matrix gallery: one popover per cell, open from the start.
 *
 * SIX NON-MODAL POPOVERS OPEN AT ONCE IS NOT A USE, IT IS A GALLERY
 * (D-062 §2). Left to themselves they dismiss each other: each one's
 * auto-focus on mount is a "focus outside" for the one before it, and the
 * last one's unmount cascade returns focus to a trigger, which is outside the
 * last. The three handlers below are Radix's own escape hatches, passed
 * through by PopoverContent, and they make the six sit still for the
 * screenshot. An app never needs them for one popover.
 */
export function Gallery() {
  return (
    <Cluster>
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button variant="outline">Open by default</Button>
        </PopoverTrigger>
        {/* Beside the trigger rather than below it: three cells are stacked
            105px apart, and a panel below each would cover the next cell. */}
        <PopoverContent
          side="end"
          align="start"
          data-gallery=""
          onOpenAutoFocus={(event) => event.preventDefault()}
          onFocusOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <Stack gap="1">
            <PopoverTitle>A titled popover</PopoverTitle>
            <PopoverDescription>The title names the dialog; the theme came across the portal.</PopoverDescription>
          </Stack>
        </PopoverContent>
      </Popover>
    </Cluster>
  );
}

/** A form in a popover: the case the `max-inline-size` ceiling exists for (spec §3). */
export function FilterPopover() {
  const [applied, setApplied] = useState(0);
  return (
    <Stack gap="2">
      <div data-testid="popover-form">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Filters</Button>
          </PopoverTrigger>
          <PopoverContent align="start">
            <Stack gap="3">
              <div>
                <PopoverTitle>Filters</PopoverTitle>
                <PopoverDescription>Narrow the list. Every control fills the panel.</PopoverDescription>
              </div>
              <Field label="Name contains">
                <Input placeholder="e.g. invoice" />
              </Field>
              <Field label="Owner">
                <Input placeholder="anyone" />
              </Field>
              <Cluster justify="end" gap="2">
                <PopoverClose asChild>
                  <Button variant="ghost">Cancel</Button>
                </PopoverClose>
                <PopoverClose asChild>
                  <Button onClick={() => setApplied((n) => n + 1)}>Apply</Button>
                </PopoverClose>
              </Cluster>
            </Stack>
          </PopoverContent>
        </Popover>
      </div>
      <Text size="sm" tone="muted">
        applied {applied}×
      </Text>
    </Stack>
  );
}

/** Four sides, closed by default; the browser suite opens each and measures. */
export function Sides({ dir }: { dir?: 'rtl' }) {
  const sides = ['top', 'bottom', 'start', 'end'] as const;
  return (
    <div dir={dir} data-testid={dir === 'rtl' ? 'popover-sides-rtl' : 'popover-sides'}>
      <Cluster gap="3" justify="center">
        {sides.map((side) => (
          <Popover key={side}>
            <PopoverTrigger asChild>
              <Button variant="outline" data-side-trigger={side}>
                {side}
              </Button>
            </PopoverTrigger>
            <PopoverContent side={side} aria-label={`On the ${side}`}>
              <Text size="sm">side=&quot;{side}&quot;</Text>
            </PopoverContent>
          </Popover>
        ))}
      </Cluster>
    </div>
  );
}

/** A dark region of a light page: the theme must cross the portal (4.1 §3). */
export function ThemeCrossing() {
  return (
    <div data-pp-theme="dark" data-testid="popover-theme" className="popover-dark-region">
      <Cluster gap="3" align="center">
        <Text size="sm">This region is dark.</Text>
        <Popover>
          <PopoverTrigger asChild>
            <Button>Open here</Button>
          </PopoverTrigger>
          <PopoverContent aria-label="A dark popover">
            <Text size="sm">The panel is dark too, and it is not inside this region.</Text>
          </PopoverContent>
        </Popover>
      </Cluster>
    </div>
  );
}

/** Controlled, with the reason the page cannot see: an outside click still lands. */
export function Controlled() {
  const [open, setOpen] = useState(false);
  const [outsideClicks, setOutsideClicks] = useState(0);
  return (
    <Stack gap="2">
      <Cluster gap="3" align="center">
        <div data-testid="popover-controlled">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline">{open ? 'Close' : 'Open'}</Button>
            </PopoverTrigger>
            <PopoverContent aria-label="Controlled">
              <Text size="sm">Escape, an outside press, or the trigger closes this.</Text>
            </PopoverContent>
          </Popover>
        </div>
        <Button variant="ghost" data-testid="popover-outside" onClick={() => setOutsideClicks((n) => n + 1)}>
          Outside
        </Button>
      </Cluster>
      <Text size="sm" tone="muted">
        open: {String(open)} · outside clicked {outsideClicks}×
      </Text>
    </Stack>
  );
}

/** Modal: for the popover a flow cannot proceed past (spec §6). */
export function Modal() {
  return (
    <div data-testid="popover-modal">
      <Popover modal>
        <PopoverTrigger asChild>
          <Button variant="outline">Choose a plan</Button>
        </PopoverTrigger>
        <PopoverContent>
          <Stack gap="3">
            <PopoverTitle>Pick one to continue</PopoverTitle>
            <Cluster gap="2">
              <PopoverClose asChild>
                <Button>Monthly</Button>
              </PopoverClose>
              <PopoverClose asChild>
                <Button>Yearly</Button>
              </PopoverClose>
            </Cluster>
          </Stack>
        </PopoverContent>
      </Popover>
    </div>
  );
}
