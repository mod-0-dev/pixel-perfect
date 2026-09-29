'use client';

import {
  Button,
  CommandPalette,
  CommandPaletteContent,
  CommandPaletteEmpty,
  CommandPaletteGroup,
  CommandPaletteInput,
  CommandPaletteItem,
  CommandPaletteLabel,
  CommandPaletteList,
  CommandPaletteShortcut,
  CommandPaletteTrigger,
  Kbd,
  Stack,
  Text,
} from 'pixel-perfect';
import { useState } from 'react';

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function Plus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

const COMMANDS: Array<{ value: string; label: string; group: string; keys?: string[]; icon?: 'arrow' | 'plus' }> = [
  { value: 'inbox', label: 'Go to inbox', group: 'Navigate', keys: ['G', 'I'], icon: 'arrow' },
  { value: 'projects', label: 'Go to projects', group: 'Navigate', keys: ['G', 'P'], icon: 'arrow' },
  { value: 'settings', label: 'Go to settings', group: 'Navigate', keys: ['G', 'S'], icon: 'arrow' },
  { value: 'new-issue', label: 'New issue', group: 'Actions', keys: ['C'], icon: 'plus' },
  { value: 'new-project', label: 'New project', group: 'Actions', icon: 'plus' },
  { value: 'assign', label: 'Assign to me', group: 'Actions', keys: ['I'] },
  { value: 'theme', label: 'Toggle theme', group: 'Actions' },
  { value: 'export', label: 'Export workspace (unavailable)', group: 'Actions' },
];
const ICONS = { arrow: <Arrow />, plus: <Plus /> };

function Commands({ query, onRun, keepOpen }: { query: string; onRun: (value: string) => void; keepOpen?: boolean }) {
  const matches = COMMANDS.filter((c) => c.label.toLowerCase().includes(query.trim().toLowerCase()));
  const groups = Array.from(new Set(matches.map((c) => c.group)));
  return (
    <>
      {groups.map((group) => (
        <CommandPaletteGroup key={group}>
          <CommandPaletteLabel>{group}</CommandPaletteLabel>
          {matches
            .filter((c) => c.group === group)
            .map((c) => (
              <CommandPaletteItem
                key={c.value}
                value={c.value}
                {...(c.icon ? { icon: ICONS[c.icon] } : {})}
                disabled={c.value === 'export'}
                onSelect={(event) => {
                  onRun(event.value);
                  if (keepOpen) event.preventDefault();
                }}
              >
                {c.label}
                {c.keys && <CommandPaletteShortcut keys={c.keys} />}
              </CommandPaletteItem>
            ))}
        </CommandPaletteGroup>
      ))}
      {matches.length === 0 && <CommandPaletteEmpty>No commands match &ldquo;{query}&rdquo;.</CommandPaletteEmpty>}
    </>
  );
}

/** The Matrix gallery: an open palette per cell, portalled into a contained stage. */
export function Gallery() {
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  const [query, setQuery] = useState('go');
  return (
    <div ref={setStage} className="dialog-stage">
      {stage && (
        <CommandPalette defaultOpen inputValue={query} onInputValueChange={setQuery} label="Commands">
          <CommandPaletteContent container={stage} data-gallery="" onOpenAutoFocus={(event) => event.preventDefault()}>
            <CommandPaletteInput placeholder="Type a command…" />
            <CommandPaletteList>
              <Commands query={query} onRun={() => {}} keepOpen />
            </CommandPaletteList>
          </CommandPaletteContent>
        </CommandPalette>
      )}
    </div>
  );
}

/** The real thing: a trigger, the hotkey, and what ran. */
export function Launcher() {
  const [query, setQuery] = useState('');
  const [last, setLast] = useState('nothing');
  return (
    <Stack gap="2">
      <div data-testid="command-palette-launcher">
        <CommandPalette onInputValueChange={setQuery} hotkey="mod+k" label="Commands">
          <CommandPaletteTrigger asChild>
            <Button variant="outline">
              Search commands <Kbd size="sm">⌘K</Kbd>
            </Button>
          </CommandPaletteTrigger>
          <CommandPaletteContent>
            <CommandPaletteInput placeholder="Type a command…" />
            <CommandPaletteList>
              <Commands query={query} onRun={setLast} />
            </CommandPaletteList>
          </CommandPaletteContent>
        </CommandPalette>
      </div>
      <Text size="sm" tone="muted">
        last ran: {last}
      </Text>
    </Stack>
  );
}

/** Thirty commands: the list scrolls and keeps the highlight in view. */
export function Long() {
  const [query, setQuery] = useState('');
  const items = Array.from({ length: 30 }, (_, i) => `Command ${i + 1}`).filter((c) => c.toLowerCase().includes(query.toLowerCase()));
  return (
    <div data-testid="command-palette-long">
      <CommandPalette onInputValueChange={setQuery} label="Many commands">
        <CommandPaletteTrigger asChild>
          <Button variant="outline">Thirty commands</Button>
        </CommandPaletteTrigger>
        <CommandPaletteContent>
          <CommandPaletteInput placeholder="Filter…" />
          <CommandPaletteList>
            {items.map((c) => (
              <CommandPaletteItem key={c} value={c}>
                {c}
              </CommandPaletteItem>
            ))}
            {items.length === 0 && <CommandPaletteEmpty>Nothing.</CommandPaletteEmpty>}
          </CommandPaletteList>
        </CommandPaletteContent>
      </CommandPalette>
    </div>
  );
}

/** A dark region of a light page: the theme must cross the portal (4.1 §3). */
export function ThemeCrossing() {
  const [query, setQuery] = useState('');
  return (
    <div data-pp-theme="dark" data-testid="command-palette-theme" className="popover-dark-region">
      <CommandPalette onInputValueChange={setQuery} label="Commands, dark">
        <CommandPaletteTrigger asChild>
          <Button>Open here</Button>
        </CommandPaletteTrigger>
        <CommandPaletteContent>
          <CommandPaletteInput placeholder="This region is dark" />
          <CommandPaletteList>
            <Commands query={query} onRun={() => {}} />
          </CommandPaletteList>
        </CommandPaletteContent>
      </CommandPalette>
    </div>
  );
}
