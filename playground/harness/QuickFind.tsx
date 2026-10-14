'use client';

import {
  CommandPalette,
  CommandPaletteContent,
  CommandPaletteEmpty,
  CommandPaletteGroup,
  CommandPaletteInput,
  CommandPaletteItem,
  CommandPaletteLabel,
  CommandPaletteList,
} from '@mod-0-dev/pixel-perfect';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { COMPONENTS, TIERS } from '../app/components/registry';
import { findComponents, tierOf } from './find';

/**
 * Quick find: mod+k on any playground page opens the library's own
 * CommandPalette over every component, by the same matcher as the index's
 * filter, and Enter opens the component's docs page.
 *
 * No trigger is drawn: the chrome is in every screenshot baseline, and a
 * button in it would move every one of them. The index's filter says the
 * shortcut is there. The CommandPalette page binds mod+k to its own demo,
 * which its browser test presses, so on that page this one stands down.
 */
export function QuickFind({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const matches = findComponents(COMPONENTS, query);

  return (
    <CommandPalette hotkey={enabled ? 'mod+k' : undefined} onInputValueChange={setQuery} label="Find a component">
      <CommandPaletteContent>
        <CommandPaletteInput placeholder="Find a component…" />
        <CommandPaletteList>
          {TIERS.map((tier) => {
            const entries = matches.filter((entry) => tierOf(entry) === tier.id);
            if (entries.length === 0) return null;
            return (
              <CommandPaletteGroup key={tier.id}>
                <CommandPaletteLabel>
                  Tier {tier.id} · {tier.name}
                </CommandPaletteLabel>
                {entries.map((entry) => (
                  <CommandPaletteItem
                    key={entry.slug}
                    value={entry.slug}
                    onSelect={() => router.push(`/docs/${entry.slug}`)}
                  >
                    <span className="quick-find__name">{entry.name}</span>
                    <span className="quick-find__tier">{entry.tier}</span>
                  </CommandPaletteItem>
                ))}
              </CommandPaletteGroup>
            );
          })}
          {matches.length === 0 ? <CommandPaletteEmpty>No component matches.</CommandPaletteEmpty> : null}
        </CommandPaletteList>
      </CommandPaletteContent>
    </CommandPalette>
  );
}
