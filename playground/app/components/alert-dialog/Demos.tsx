'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Cluster,
  Stack,
  Text,
} from 'pixel-perfect';
import { useState } from 'react';

/** The Matrix gallery: a cell is a viewport (Dialog §10). Open-autofocus prevented so three mounts do not fight. */
export function Gallery() {
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  return (
    <div ref={setStage} className="dialog-stage">
      {stage && (
        <AlertDialog defaultOpen>
          <AlertDialogContent container={stage} data-gallery="" onOpenAutoFocus={(event) => event.preventDefault()}>
            <Stack gap="4">
              <Stack gap="1">
                <AlertDialogTitle>Delete this report?</AlertDialogTitle>
                <AlertDialogDescription>
                  It is removed for everyone it is shared with. This cannot be undone.
                </AlertDialogDescription>
              </Stack>
              <Cluster justify="end" gap="2">
                <AlertDialogCancel asChild>
                  <Button variant="ghost">Keep it</Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button tone="danger">Delete</Button>
                </AlertDialogAction>
              </Cluster>
            </Stack>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

/** The usual: a destructive confirmation, with an outside counter for the scrim test. */
export function Delete() {
  const [deleted, setDeleted] = useState(0);
  const [kept, setKept] = useState(0);
  const [outside, setOutside] = useState(0);
  return (
    <Stack gap="2">
      <Cluster gap="3" align="center">
        <div data-testid="alert-dialog-delete">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" tone="danger">
                Delete report
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <Stack gap="4">
                <Stack gap="1">
                  <AlertDialogTitle>Delete this report?</AlertDialogTitle>
                  <AlertDialogDescription>
                    It is removed for everyone it is shared with. This cannot be undone.
                  </AlertDialogDescription>
                </Stack>
                <Cluster justify="end" gap="2">
                  <AlertDialogCancel asChild>
                    <Button variant="ghost" onClick={() => setKept((n) => n + 1)}>
                      Keep it
                    </Button>
                  </AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <Button tone="danger" onClick={() => setDeleted((n) => n + 1)}>
                      Delete
                    </Button>
                  </AlertDialogAction>
                </Cluster>
              </Stack>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <Button variant="ghost" data-testid="alert-dialog-outside" onClick={() => setOutside((n) => n + 1)}>
          Outside
        </Button>
      </Cluster>
      <Text size="sm" tone="muted">
        deleted {deleted}× · kept {kept}× · outside clicked {outside}×
      </Text>
    </Stack>
  );
}

/** No Cancel: the panel takes focus and development warns (spec §3). */
export function NoCancel() {
  return (
    <div data-testid="alert-dialog-no-cancel">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline">Acknowledge</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <Stack gap="4">
            <AlertDialogTitle>Your session has expired</AlertDialogTitle>
            <Cluster justify="end">
              <AlertDialogAction asChild>
                <Button>Sign in again</Button>
              </AlertDialogAction>
            </Cluster>
          </Stack>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** A dark region of a light page (4.1 §3). */
export function ThemeCrossing() {
  return (
    <div data-pp-theme="dark" data-testid="alert-dialog-theme" className="popover-dark-region">
      <Cluster gap="3" align="center">
        <Text size="sm">This region is dark.</Text>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button tone="danger">Open here</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <Stack gap="4">
              <AlertDialogTitle>A dark confirmation</AlertDialogTitle>
              <Cluster justify="end" gap="2">
                <AlertDialogCancel asChild>
                  <Button variant="ghost">Keep it</Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button tone="danger">Delete</Button>
                </AlertDialogAction>
              </Cluster>
            </Stack>
          </AlertDialogContent>
        </AlertDialog>
      </Cluster>
    </div>
  );
}
