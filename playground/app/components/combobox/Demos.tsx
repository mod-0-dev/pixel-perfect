'use client';

import {
  Combobox,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxLabel,
  ComboboxList,
  ComboboxOption,
  Field,
  Stack,
  Text,
} from '@mod-0-dev/pixel-perfect';
import { useEffect, useState } from 'react';

const CITIES: Array<[string, string, string]> = [
  ['ams', 'Amsterdam', 'Europe'],
  ['ber', 'Berlin', 'Europe'],
  ['bru', 'Brussels', 'Europe'],
  ['cph', 'Copenhagen', 'Europe'],
  ['lis', 'Lisbon', 'Europe'],
  ['mad', 'Madrid', 'Europe'],
  ['osl', 'Oslo', 'Europe'],
  ['prg', 'Prague', 'Europe'],
  ['tll', 'Tallinn', 'Europe'],
  ['vie', 'Vienna', 'Europe'],
  ['bos', 'Boston', 'Americas'],
  ['mex', 'Mexico City', 'Americas'],
  ['sao', 'São Paulo', 'Americas'],
  ['yvr', 'Vancouver', 'Americas'],
  ['bkk', 'Bangkok', 'Asia'],
  ['sin', 'Singapore', 'Asia'],
  ['tyo', 'Tokyo', 'Asia'],
];
const NAME = Object.fromEntries(CITIES.map(([code, name]) => [code, name])) as Record<string, string>;
const label = (code: string) => NAME[code] ?? code;
const matching = (query: string) => CITIES.filter(([, name]) => name.toLowerCase().includes(query.trim().toLowerCase()));

/** The Matrix gallery: open, two of seventeen matching, one of them selected. */
export function Gallery() {
  const [query, setQuery] = useState('os');
  return (
    <Combobox
      defaultOpen
      defaultValue="osl"
      getLabel={label}
      inputValue={query}
      onInputValueChange={(text, reason) => {
        if (reason === 'input') setQuery(text);
      }}
    >
      <ComboboxInput aria-label="City" />
      <ComboboxList data-gallery="" onFocusOutside={(event) => event.preventDefault()} onInteractOutside={(event) => event.preventDefault()}>
        {matching(query)
          .slice(0, 5)
          .map(([code, name]) => (
            <ComboboxOption key={code} value={code}>
              {name}
            </ComboboxOption>
          ))}
        {matching(query).length === 0 && <ComboboxEmpty>No cities match.</ComboboxEmpty>}
      </ComboboxList>
    </Combobox>
  );
}

/** One city, in a Field: the consumer filters; the value and the text are shown. */
export function Single() {
  const [value, setValue] = useState('');
  const [query, setQuery] = useState('');
  const matches = matching(query);
  return (
    <Stack gap="2">
      <div data-testid="combobox-single">
        <Field label="City" description="Type to search seventeen cities.">
          {/* The pattern: filter on what was TYPED; after a selection the
              query is empty, so a reopened list shows everything. */}
          <Combobox value={value} onValueChange={setValue} onInputValueChange={(text, reason) => setQuery(reason === 'input' ? text : '')} getLabel={label}>
            <ComboboxInput placeholder="Type a city" />
            <ComboboxList>
              {matches.map(([code, name]) => (
                <ComboboxOption key={code} value={code} disabled={code === 'prg'}>
                  {name}
                </ComboboxOption>
              ))}
              {matches.length === 0 && <ComboboxEmpty>No cities match &ldquo;{query}&rdquo;.</ComboboxEmpty>}
            </ComboboxList>
          </Combobox>
        </Field>
      </div>
      <Text size="sm" tone="muted">
        value: {value || 'none'} · query: {query || '—'}
      </Text>
    </Stack>
  );
}

/** Several cities as tokens, grouped by region. */
export function Multiple() {
  const [value, setValue] = useState<string[]>(['ams', 'tyo']);
  const [query, setQuery] = useState('');
  const matches = matching(query);
  const regions = Array.from(new Set(matches.map(([, , region]) => region)));
  return (
    <Stack gap="2">
      <div data-testid="combobox-multiple">
        <Field label="Cities" description="Backspace on an empty field removes the last.">
          <Combobox multiple value={value} onValueChange={setValue} onInputValueChange={(text, reason) => setQuery(reason === 'input' ? text : '')} getLabel={label}>
            <ComboboxInput placeholder="Add a city" />
            <ComboboxList>
              {regions.map((region) => (
                <ComboboxGroup key={region}>
                  <ComboboxLabel>{region}</ComboboxLabel>
                  {matches
                    .filter(([, , r]) => r === region)
                    .map(([code, name]) => (
                      <ComboboxOption key={code} value={code}>
                        {name}
                      </ComboboxOption>
                    ))}
                </ComboboxGroup>
              ))}
              {matches.length === 0 && <ComboboxEmpty>No cities match.</ComboboxEmpty>}
            </ComboboxList>
          </Combobox>
        </Field>
      </div>
      <Text size="sm" tone="muted">
        value: {value.join(', ') || 'none'}
      </Text>
    </Stack>
  );
}

/** Options that arrive later: loading while a fake fetch runs. */
export function Async() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<[string, string]>>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      setResults(matching(query).map(([code, name]) => [code, name]));
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [query]);
  return (
    <div data-testid="combobox-async">
      <Field label="City, from a server" description="Results arrive after a moment.">
        <Combobox onInputValueChange={(text, reason) => setQuery(reason === 'input' ? text : '')} loading={loading} getLabel={label}>
          <ComboboxInput placeholder="Search" />
          <ComboboxList>
            {results.map(([code, name]) => (
              <ComboboxOption key={code} value={code}>
                {name}
              </ComboboxOption>
            ))}
            {loading && <ComboboxEmpty>Searching…</ComboboxEmpty>}
            {!loading && results.length === 0 && <ComboboxEmpty>{query.trim() ? 'No cities match.' : 'Type to search.'}</ComboboxEmpty>}
          </ComboboxList>
        </Combobox>
      </Field>
    </div>
  );
}

/** A narrow field and a wide one: the list is never narrower than its control. */
export function Widths() {
  const [query, setQuery] = useState('');
  return (
    <div data-testid="combobox-widths" style={{ display: 'grid', gridTemplateColumns: '12rem 1fr', gap: 'var(--pp-space-4)' }}>
      {(['narrow', 'wide'] as const).map((id) => (
        <div key={id} data-testid={`combobox-${id}`}>
          <Combobox onInputValueChange={(text, reason) => setQuery(reason === 'input' ? text : '')} getLabel={label}>
            <ComboboxInput aria-label={`City (${id})`} placeholder={id} />
            <ComboboxList>
              {matching(query).map(([code, name]) => (
                <ComboboxOption key={code} value={code}>
                  {name}
                </ComboboxOption>
              ))}
            </ComboboxList>
          </Combobox>
        </div>
      ))}
    </div>
  );
}

/** A dark region of a light page: the theme must cross the portal (4.1 §3). */
export function ThemeCrossing() {
  const [query, setQuery] = useState('');
  return (
    <div data-pp-theme="dark" data-testid="combobox-theme" className="popover-dark-region">
      <Combobox onInputValueChange={(text, reason) => setQuery(reason === 'input' ? text : '')} getLabel={label}>
        <ComboboxInput aria-label="City, dark" placeholder="This region is dark" />
        <ComboboxList>
          {matching(query).map(([code, name]) => (
            <ComboboxOption key={code} value={code}>
              {name}
            </ComboboxOption>
          ))}
        </ComboboxList>
      </Combobox>
    </div>
  );
}
