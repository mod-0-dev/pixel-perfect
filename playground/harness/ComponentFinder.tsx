'use client';

import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateTitle,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputGroupAddon,
  Kbd,
  Text,
  useFormatKeys,
} from '@mod-0-dev/pixel-perfect';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { SearchGlyph } from '../app/examples/glyphs';
import { COMPONENTS, TIERS } from '../app/components/registry';
import { findComponents, tierOf } from './find';

/**
 * The index's component list, and how to find one in it: a filter that
 * narrows the cards as you type, and a list of the tiers beside them that
 * jumps to each and says which one you are reading. Seventy-odd cards in one
 * scroll was a list you could only read top to bottom.
 *
 * Every tier keeps its `#tier-N` anchor and every card still links to its
 * `/docs/<slug>` page, so nothing that linked here before breaks. The filter
 * text is kept in `?q=`, so a filtered list can be shared; it is read after
 * hydration, so the server's page is the whole list and nothing mismatches.
 *
 * `/` focuses the filter from anywhere on the page; Enter in it opens the
 * first match; the quick-find palette (harness/QuickFind.tsx) does the same
 * from every page under mod+k.
 */
export function ComponentFinder() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [current, setCurrent] = useState<string | undefined>(undefined);
  const [chord] = useFormatKeys('mod+k');

  const matches = useMemo(() => findComponents(COMPONENTS, query), [query]);
  const tiers = useMemo(
    () => TIERS.map((tier) => ({ ...tier, entries: matches.filter((entry) => tierOf(entry) === tier.id) })),
    [matches],
  );

  // The filter from the URL, once, after hydration.
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get('q');
    if (initial) setQuery(initial);
  }, []);

  // And back into it, replaced rather than pushed: typing is not navigation.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (query) url.searchParams.set('q', query);
    else url.searchParams.delete('q');
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, '', url);
  }, [query]);

  // `/` focuses the filter, unless something that takes text has the key.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      event.preventDefault();
      input.current?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // Which tier is being read: the last one whose heading has passed the top
  // third of the viewport.
  useEffect(() => {
    const sections = [...document.querySelectorAll<HTMLElement>('[data-finder-tier]')];
    if (sections.length === 0) return;
    const update = () => {
      const line = window.innerHeight / 3;
      let reading: string | undefined;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= line) reading = section.dataset.finderTier;
      }
      setCurrent(reading);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [tiers]);

  const total = COMPONENTS.length;
  const status = query
    ? `${matches.length} of ${total} component${matches.length === 1 ? '' : 's'} match`
    : `${total} components`;

  return (
    <section className="finder" aria-labelledby="components">
      <div className="tier__head">
        <Heading level={2} size="lg" id="components">
          Components
        </Heading>
        <Text tone="muted">
          Every component by tier. Filter by name or by what it does
          <span className="finder__keys">
            , or press{' '}
            {chord?.map((key) => (
              <Kbd key={key} size="sm">
                {key}
              </Kbd>
            ))}{' '}
            on any page
          </span>
          .
        </Text>
      </div>

      <div className="finder__layout">
        <div className="finder__side">
          <InputGroup>
            <InputGroupAddon>
              <Icon decorative>
                <SearchGlyph />
              </Icon>
            </InputGroupAddon>
            <Input
              ref={input}
              type="search"
              aria-label="Filter components"
              aria-describedby="finder-status"
              placeholder="Filter components"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && matches[0]) router.push(`/docs/${matches[0].slug}`);
                if (event.key === 'Escape' && query) {
                  event.preventDefault();
                  setQuery('');
                }
              }}
            />
            {query ? null : (
              <InputGroupAddon aria-hidden="true" className="finder__keys">
                <Kbd size="sm">/</Kbd>
              </InputGroupAddon>
            )}
          </InputGroup>
          <Text size="sm" tone="muted" id="finder-status" role="status">
            {status}
          </Text>

          <nav aria-label="Tiers" className="finder__nav">
            <ul>
              {tiers.map((tier) => (
                <li key={tier.id}>
                  {tier.entries.length > 0 ? (
                    <a
                      href={`#tier-${tier.id}`}
                      className="finder__jump"
                      aria-current={current === tier.id ? 'location' : undefined}
                    >
                      <span className="finder__number">{tier.id}</span>
                      <span className="finder__name">{tier.name}</span>
                      <span className="finder__count">{tier.entries.length}</span>
                    </a>
                  ) : (
                    <span className="finder__jump" data-empty="">
                      <span className="finder__number">{tier.id}</span>
                      <span className="finder__name">{tier.name}</span>
                      <span className="finder__count">0</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="finder__results">
          {matches.length === 0 ? (
            <EmptyState variant="outline">
              <EmptyStateTitle level={3}>No component matches &ldquo;{query}&rdquo;</EmptyStateTitle>
              <EmptyStateDescription>
                The filter reads names and what each component does. Try fewer words.
              </EmptyStateDescription>
              <EmptyStateActions>
                <Button variant="outline" onClick={() => setQuery('')}>
                  Clear the filter
                </Button>
              </EmptyStateActions>
            </EmptyState>
          ) : null}
          {tiers.map((tier) =>
            tier.entries.length === 0 ? null : (
              <section
                key={tier.id}
                className="tier"
                aria-labelledby={`tier-${tier.id}`}
                data-finder-tier={tier.id}
              >
                <div className="tier__head">
                  <Heading level={3} size="lg" id={`tier-${tier.id}`}>
                    <span className="tier__number">Tier {tier.id}</span> {tier.name}
                  </Heading>
                  <Text tone="muted">{tier.blurb}</Text>
                </div>
                <ul className="cards">
                  {tier.entries.map((entry) => (
                    <li key={entry.slug}>
                      <NextLink href={`/docs/${entry.slug}`} className="card">
                        <span className="card__tier">{entry.tier}</span>
                        <span className="card__name">{entry.name}</span>
                        <span className="card__summary">{entry.summary}</span>
                      </NextLink>
                    </li>
                  ))}
                </ul>
              </section>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
