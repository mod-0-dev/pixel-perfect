'use client';

import {
  Button,
  Cluster,
  IconButton,
  Kbd,
  Stack,
  Text,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@mod-0-dev/pixel-perfect';
import { useState } from 'react';

/**
 * The interactive islands of the Tooltip page, in one client file so the
 * page stays a Server Component. Each carries the `data-testid` the browser
 * suite drives it by; ids are written by nothing here — the tooltip's own
 * ids come from `useId()`.
 */

function Clipboard() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    </svg>
  );
}

function Trash() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14" />
    </svg>
  );
}

function X() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

/**
 * The Matrix gallery: one tooltip per cell, open from the start, on an
 * IconButton whose label it repeats — one string for both (spec §2).
 *
 * `side="end"` rather than the default `top`: the cells are stacked, and a
 * tooltip above the button would sit over the cell's own label. Three
 * `defaultOpen` tooltips coexist because a default open dispatches no
 * "another tooltip opened" event (D-064 §7).
 */
export function Gallery() {
  const label = 'Copy to clipboard';
  return (
    <Cluster>
      <Tooltip defaultOpen>
        <TooltipTrigger asChild>
          <IconButton label={label} variant="outline">
            <Clipboard />
          </IconButton>
        </TooltipTrigger>
        <TooltipContent side="end" data-gallery="">
          {label}
        </TooltipContent>
      </Tooltip>
    </Cluster>
  );
}

/** One provider around three buttons: the skip delay is what a toolbar is for (spec §1). */
export function Toolbar() {
  const actions = [
    { label: 'Copy', icon: <Clipboard /> },
    { label: 'Delete', icon: <Trash /> },
    { label: 'Close', icon: <X /> },
  ];
  return (
    <div data-testid="tooltip-toolbar">
      <TooltipProvider>
        <Cluster gap="1">
          {actions.map(({ label, icon }) => (
            <Tooltip key={label}>
              <TooltipTrigger asChild>
                <IconButton label={label}>{icon}</IconButton>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          ))}
        </Cluster>
      </TooltipProvider>
    </div>
  );
}

/** A shortcut beside a control that already has a text label. */
export function Shortcut() {
  return (
    <div data-testid="tooltip-shortcut">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Save</Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          Save <Kbd>⌘S</Kbd>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

/** Four sides, closed by default; the browser suite focuses each and measures. */
export function Sides({ dir }: { dir?: 'rtl' }) {
  const sides = ['top', 'bottom', 'start', 'end'] as const;
  return (
    <div dir={dir} data-testid={dir === 'rtl' ? 'tooltip-sides-rtl' : 'tooltip-sides'}>
      <Cluster gap="3" justify="center">
        {sides.map((side) => (
          <Tooltip key={side}>
            <TooltipTrigger asChild>
              <Button variant="outline" data-side-trigger={side}>
                {side}
              </Button>
            </TooltipTrigger>
            <TooltipContent side={side}>side=&quot;{side}&quot;</TooltipContent>
          </Tooltip>
        ))}
      </Cluster>
    </div>
  );
}

/** A dark region of a light page: the theme crosses the portal, and the tooltip inverts it (4.1 §3, spec §3). */
export function ThemeCrossing() {
  return (
    <div data-pp-theme="dark" data-testid="tooltip-theme" className="tooltip-dark-region">
      <Cluster gap="3" align="center">
        <Text size="sm">This region is dark.</Text>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button>Rest here</Button>
          </TooltipTrigger>
          <TooltipContent>Light on dark: the inverse of the region, not of the page</TooltipContent>
        </Tooltip>
      </Cluster>
    </div>
  );
}

/** Controlled: an owner that opens and closes it, and reads back what the tooltip did. */
export function Controlled() {
  const [open, setOpen] = useState(false);
  return (
    <Stack gap="2">
      <Cluster gap="3" align="center">
        <div data-testid="tooltip-controlled">
          <Tooltip open={open} onOpenChange={setOpen}>
            <TooltipTrigger asChild>
              <IconButton label="Delete" tone="danger" variant="outline">
                <Trash />
              </IconButton>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>
        {/* Two buttons that each SAY a state, not one that flips it: the press
            on either is an outside press, which closes the tooltip through
            `onOpenChange(false)` before the click handler runs — so a flip
            would read "closed" and open it again. */}
        <Button variant="ghost" data-testid="tooltip-show" onClick={() => setOpen(true)}>
          Show
        </Button>
        <Button variant="ghost" data-testid="tooltip-hide" onClick={() => setOpen(false)}>
          Hide
        </Button>
      </Cluster>
      <Text size="sm" tone="muted">
        open: {String(open)}
      </Text>
    </Stack>
  );
}

/** Long content: hugs its text up to the measure, then wraps (D-061 §3). */
export function Long() {
  return (
    <div data-testid="tooltip-long">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Why is this disabled?</Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          Exporting is unavailable while the report is being regenerated. This usually takes under a
          minute; the button re-enables on its own when the new version is ready.
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

/** A natively disabled trigger: whether it opens is the browser's, measured not promised (D-064 §7). */
export function Disabled() {
  return (
    <div data-testid="tooltip-disabled">
      <Cluster gap="3" align="center">
        <Tooltip>
          <TooltipTrigger asChild>
            <IconButton label="Copy to clipboard" variant="outline" disabled>
              <Clipboard />
            </IconButton>
          </TooltipTrigger>
          <TooltipContent>Copy to clipboard</TooltipContent>
        </Tooltip>
        <Text size="sm" tone="muted">
          disabled
        </Text>
      </Cluster>
    </div>
  );
}
