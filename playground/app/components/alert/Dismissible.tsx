'use client';

import { Alert, Button, Stack } from 'pixel-perfect';
import { useState } from 'react';

/**
 * `Alert` itself is a Server Component and holds no state — `onDismiss` reports
 * the intent and the caller unmounts it (spec §4). This is the caller, and it
 * HAS to be a client component: `onDismiss` reaches `IconButton`, which is
 * `'use client'`, and a function cannot cross that boundary. The page renders
 * every other example directly, which is the claim that `Alert` is `server`.
 *
 * The dismissed state renders a way back, because a playground page whose alert
 * can be clicked away and never returns is a screenshot baseline waiting to
 * change.
 */
function WarningGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

export function Dismissible() {
  const [open, setOpen] = useState(true);

  return (
    <Stack gap="3">
      {open ? (
        <Alert tone="accent" onDismiss={() => setOpen(false)}>
          You are viewing test data.
        </Alert>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Bring it back
        </Button>
      )}
      <Alert
        tone="danger"
        title="Export failed"
        icon={<WarningGlyph />}
        onDismiss={() => undefined}
      >
        A title, an icon, a body and a close button, all at once. The button is top-aligned,
        because on a three-line alert a centred one floats beside nothing.
      </Alert>
    </Stack>
  );
}
