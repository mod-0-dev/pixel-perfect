'use client';

import { Button, Card, CardBody, CardHeader, Cluster, IconButton, Input, Kbd, KeyHints, Stack, Text, useKeyHint } from 'pixel-perfect';
import { useState } from 'react';

function Plus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function Commands({ onInbox }: { onInbox: () => void }) {
  useKeyHint({ keys: 'g i', label: 'Go to inbox', onTrigger: onInbox });
  return null;
}

/** A page under KeyHints: two shortcut buttons, a field, a navigation command, and a log of what fired. */
export function Editor() {
  const [log, setLog] = useState<string[]>([]);
  const note = (what: string) => setLog((l) => [what, ...l].slice(0, 4));
  return (
    <KeyHints revealKey="Alt">
      <Commands onInbox={() => note('Went to the inbox (g, i)')} />
      <Card>
        <CardHeader>
          <Cluster gap="2" align="center" justify="between">
            <Text weight="semibold">Draft</Text>
            <Cluster gap="2">
              <IconButton size="sm" label="New" data-pp-hotkey="mod+shift+n" onClick={() => note('New (mod+shift+n)')}>
                <Plus />
              </IconButton>
              <Button size="sm" variant="outline" data-pp-hotkey="mod+e" onClick={() => note('Exported (mod+e)')}>
                Export
              </Button>
              <Button size="sm" tone="accent" data-pp-hotkey="mod+s" onClick={() => note('Saved (mod+s)')}>
                Save
              </Button>
            </Cluster>
          </Cluster>
        </CardHeader>
        <CardBody>
          <Stack gap="3">
            <Input size="sm" type="search" aria-label="Find in draft" placeholder="Find in draft — shortcuts stay off while typing here" />
            <Text size="sm" tone="muted">
              Hold <Kbd size="sm">Alt</Kbd> to see each button&rsquo;s shortcut. Press <Kbd size="sm">F</Kbd> to label
              every control and type a label to focus it. Press <Kbd size="sm">?</Kbd> for the sheet. Press{' '}
              <Kbd size="sm">G</Kbd> then <Kbd size="sm">I</Kbd> to run the registered command.
            </Text>
            <output data-role="log" aria-live="polite">
              <Text size="sm">{log[0] ?? 'Nothing fired yet.'}</Text>
            </output>
          </Stack>
        </CardBody>
      </Card>
    </KeyHints>
  );
}
