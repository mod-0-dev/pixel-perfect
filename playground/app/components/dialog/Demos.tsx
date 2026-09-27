'use client';

import {
  Button,
  Cluster,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Field,
  Heading,
  IconButton,
  Input,
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
  Stack,
  Text,
} from 'pixel-perfect';
import { useState } from 'react';

/**
 * The interactive islands of the Dialog page, in one client file so the
 * page stays a Server Component. Each carries the `data-testid` the browser
 * suite drives it by; ids are written by nothing here — the dialog's own
 * ids come from `useId()`.
 */

function X() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

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
 * The Matrix gallery: a cell is a viewport (spec §10).
 *
 * `contain: layout` on the stage makes it the containing block for the
 * dialog's `position: fixed` scrim, so a dialog portalled into it fills the
 * box and is centred in it. The dialog is rendered only once the stage
 * exists, so it never lands on the body first. Three modals open at once
 * is a gallery, not a use (D-062 §2): open-autofocus is prevented so three
 * mounts do not fight over focus, and the panels are marked `data-gallery`
 * so the interactive tests can tell them from the one they opened.
 */
export function Gallery() {
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  return (
    <div ref={setStage} className="dialog-stage" data-testid="dialog-stage">
      {stage && (
        <Dialog defaultOpen>
          <DialogContent container={stage} data-gallery="" onOpenAutoFocus={(event) => event.preventDefault()}>
            <Stack gap="4">
              <Stack gap="1">
                <DialogTitle>Rename file</DialogTitle>
                {/* Long enough that the panel WANTS more than its ceiling: a
                    hug panel is as wide as its content asks, and a short form
                    asks for less than 40rem (D-068 §1). */}
                <DialogDescription>
                  The new name is applied everywhere the file is linked, including shared folders and
                  the reports that embed it.
                </DialogDescription>
              </Stack>
              <Field label="Name">
                <Input defaultValue="report.pdf" />
              </Field>
              <Cluster justify="end" gap="2">
                <DialogClose asChild>
                  <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button>Rename</Button>
                </DialogClose>
              </Cluster>
            </Stack>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/** The usual: a short form, with an outside counter for the scrim-press test. */
export function Rename() {
  const [renamed, setRenamed] = useState(0);
  const [outside, setOutside] = useState(0);
  return (
    <Stack gap="2">
      <Cluster gap="3" align="center">
        <div data-testid="dialog-form">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Rename</Button>
            </DialogTrigger>
            <DialogContent>
              <Stack gap="4">
                <Stack gap="1">
                  <DialogTitle>Rename file</DialogTitle>
                  {/* One unbreakable token, longer than a 320px panel's content
                      box: it must wrap inside the panel, not push it wider. */}
                  <DialogDescription>
                    The new name is applied everywhere it is linked, including
                    shared/2026/q3/revenue-model-final-v3.xlsx.
                  </DialogDescription>
                </Stack>
                <Field label="Name">
                  <Input defaultValue="report.pdf" />
                </Field>
                <Cluster justify="end" gap="2">
                  <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button onClick={() => setRenamed((n) => n + 1)}>Rename</Button>
                  </DialogClose>
                </Cluster>
              </Stack>
            </DialogContent>
          </Dialog>
        </div>
        <Button variant="ghost" data-testid="dialog-outside" onClick={() => setOutside((n) => n + 1)}>
          Outside
        </Button>
      </Cluster>
      <Text size="sm" tone="muted">
        renamed {renamed}× · outside clicked {outside}×
      </Text>
    </Stack>
  );
}

/** A corner close: the end of the title row, not an absolute position (spec §5). */
export function CornerClose() {
  return (
    <div data-testid="dialog-corner">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Settings</Button>
        </DialogTrigger>
        <DialogContent>
          <Stack gap="4">
            <Cluster justify="between" align="start" gap="3">
              <DialogTitle>
                <Heading level={2} size="sm">
                  Settings
                </Heading>
              </DialogTitle>
              <DialogClose asChild>
                <IconButton label="Close" variant="plain" size="sm">
                  <X />
                </IconButton>
              </DialogClose>
            </Cluster>
            <DialogDescription>The title is a heading here because this dialog is a section of the page.</DialogDescription>
            <Field label="Display name">
              <Input defaultValue="Ago" />
            </Field>
          </Stack>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Opened from a row's action button, with no trigger: focus returns to that button (spec §7). */
export function NoTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <div data-testid="dialog-no-trigger">
      <Cluster gap="3" align="center" justify="between">
        <Text>Q3 revenue model.xlsx</Text>
        <IconButton label="Row actions" variant="plain" size="sm" onClick={() => setOpen(true)}>
          <Dots />
        </IconButton>
      </Cluster>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-label="Edit row">
          <Stack gap="4">
            <Field label="File name">
              <Input defaultValue="Q3 revenue model.xlsx" />
            </Field>
            <Cluster justify="end" gap="2">
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button>Save</Button>
              </DialogClose>
            </Cluster>
          </Stack>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Unsaved changes: veto the close through the events (spec §5). */
export function Veto() {
  const [value, setValue] = useState('');
  const dirty = value.length > 0;
  return (
    <div data-testid="dialog-veto">
      <Dialog onOpenChange={(open) => !open && setValue('')}>
        <DialogTrigger asChild>
          <Button variant="outline">New note</Button>
        </DialogTrigger>
        <DialogContent
          onEscapeKeyDown={(event) => dirty && event.preventDefault()}
          onPointerDownOutside={(event) => dirty && event.preventDefault()}
        >
          <Stack gap="4">
            <Stack gap="1">
              <DialogTitle>New note</DialogTitle>
              <DialogDescription>{dirty ? 'Unsaved: Escape and the scrim are vetoed.' : 'Nothing typed yet.'}</DialogDescription>
            </Stack>
            <Field label="Note">
              <Input value={value} onChange={(event) => setValue(event.target.value)} />
            </Field>
            <Cluster justify="end" gap="2">
              <DialogClose asChild>
                <Button variant="ghost">Discard</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button>Save</Button>
              </DialogClose>
            </Cluster>
          </Stack>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Taller than the viewport: the scrim scrolls, the page does not (spec §4). */
export function Long() {
  return (
    <div data-testid="dialog-long">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Terms</Button>
        </DialogTrigger>
        <DialogContent className="dialog-long">
          <Stack gap="4">
            <DialogTitle>Terms of use</DialogTitle>
            {Array.from({ length: 24 }, (_, i) => (
              <p key={i}>
                Clause {i + 1}. This is a paragraph of the terms, long enough that twenty-four of them run
                past the bottom of any viewport this page is likely to be read in, so that what
                scrolls is the scrim and not the page.
              </p>
            ))}
            <Cluster justify="end">
              <DialogClose asChild>
                <Button>Agree</Button>
              </DialogClose>
            </Cluster>
          </Stack>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** A popover and a second dialog opened from inside the first (spec §4, stacking). */
export function Nested() {
  return (
    <div data-testid="dialog-nested">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Open the first</Button>
        </DialogTrigger>
        <DialogContent>
          <Stack gap="4">
            <DialogTitle>The first dialog</DialogTitle>
            <Cluster gap="2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">Pick a colour</Button>
                </PopoverTrigger>
                <PopoverContent>
                  <PopoverTitle>Colour</PopoverTitle>
                  <Text size="sm">Above the scrim, not hidden by the sweep.</Text>
                </PopoverContent>
              </Popover>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Open another</Button>
                </DialogTrigger>
                <DialogContent>
                  <Stack gap="4">
                    <DialogTitle>The second dialog</DialogTitle>
                    <DialogDescription>Escape closes only this one.</DialogDescription>
                    <Cluster justify="end">
                      <DialogClose asChild>
                        <Button>Done</Button>
                      </DialogClose>
                    </Cluster>
                  </Stack>
                </DialogContent>
              </Dialog>
            </Cluster>
            <Cluster justify="end">
              <DialogClose asChild>
                <Button variant="ghost">Close</Button>
              </DialogClose>
            </Cluster>
          </Stack>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** A dark region of a light page: the theme must cross the portal (4.1 §3). */
export function ThemeCrossing() {
  return (
    <div data-pp-theme="dark" data-testid="dialog-theme" className="popover-dark-region">
      <Cluster gap="3" align="center">
        <Text size="sm">This region is dark.</Text>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open here</Button>
          </DialogTrigger>
          <DialogContent>
            <Stack gap="4">
              <DialogTitle>A dark dialog</DialogTitle>
              <DialogDescription>Scrim and panel are dark too, and neither is inside this region.</DialogDescription>
              <Cluster justify="end">
                <DialogClose asChild>
                  <Button>Close</Button>
                </DialogClose>
              </Cluster>
            </Stack>
          </DialogContent>
        </Dialog>
      </Cluster>
    </div>
  );
}
