'use client';

import { Button, Cluster, Stack, Text, ToastProvider, useToast, type ToastPlacement } from '@mod-0-dev/pixel-perfect';
import { useEffect, useRef } from 'react';

function Tick() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

/** Fires one toast on mount, kept, so a cell shows one. */
function OnMount({ title, tone }: { title: string; tone: 'success' | 'neutral' | 'danger' }) {
  const { toast } = useToast();
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    toast({ title, description: 'A toast fixed inside its cell, kept for the screenshot.', tone, icon: tone === 'success' ? <Tick /> : undefined, duration: Infinity });
  }, [toast, title, tone]);
  return null;
}

/**
 * The Matrix gallery: a provider per cell, its region fixed inside a
 * `contain: layout` stage (the Dialog gallery's device, D-068), holding one
 * toast fired on mount.
 */
export function Gallery() {
  return (
    <div className="toast-stage">
      <ToastProvider>
        <OnMount title="Saved" tone="success" />
      </ToastProvider>
    </div>
  );
}

function Firing() {
  const { toast, dismiss } = useToast();
  return (
    <Stack gap="3">
      <Cluster gap="2">
        <Button variant="outline" onClick={() => toast({ title: 'Saved', description: 'Your changes are live.', tone: 'success', icon: <Tick /> })}>
          Success
        </Button>
        <Button variant="outline" onClick={() => toast({ title: 'Could not send', description: 'The server did not answer. Try again in a moment.', tone: 'danger', duration: Infinity })}>
          Failure, kept
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast({
              title: 'Message archived',
              action: { label: 'Undo', altText: 'Undo archiving the message', onClick: () => toast({ title: 'Restored', tone: 'success' }) },
            })
          }
        >
          With an action
        </Button>
        <Button variant="outline" onClick={() => toast({ title: 'Sync finished', live: 'polite', description: 'Announced when you are idle.' })}>
          Polite
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            for (let i = 1; i <= 5; i += 1) toast({ title: `Notification ${i}`, description: i <= 3 ? 'Shown now.' : 'Waiting its turn.', duration: 4000 });
          }}
        >
          Five at once
        </Button>
        <Button variant="ghost" onClick={() => dismiss()}>
          Dismiss all
        </Button>
      </Cluster>
      <Text size="sm" tone="muted">
        Press F8 to move focus to the region; Escape dismisses the focused toast. Hover a toast to keep it.
      </Text>
    </Stack>
  );
}

/** The page's own provider, at the default corner. */
export function Corner() {
  return (
    <div data-testid="toast-corner">
      <ToastProvider>
        <Firing />
      </ToastProvider>
    </div>
  );
}

/** Four placements, each in its own contained stage. */
export function Placements() {
  const placements: ToastPlacement[] = ['top-start', 'top-end', 'bottom-start', 'bottom-end'];
  return (
    <div data-testid="toast-placements" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--pp-space-4)' }}>
      {placements.map((placement) => (
        <div key={placement} className="toast-stage" data-placement={placement}>
          <ToastProvider placement={placement}>
            <OnMount title={placement} tone="neutral" />
          </ToastProvider>
        </div>
      ))}
    </div>
  );
}

/** A right-to-left stage: `bottom-end` is the bottom left. */
export function Rtl() {
  return (
    <div dir="rtl" data-testid="toast-rtl" className="toast-stage">
      <ToastProvider>
        <OnMount title="محفوظ" tone="success" />
      </ToastProvider>
    </div>
  );
}
