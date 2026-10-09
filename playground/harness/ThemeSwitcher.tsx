'use client';

import { SegmentedControl, SegmentedControlItem, useTheme, type Theme } from '@mod-0-dev/pixel-perfect';

/**
 * The playground's theme, chosen once and kept (D-063), through the
 * library's own `ThemeProvider` since 6.1 (D-094): the layout renders the
 * provider, this reads and sets its choice. Same key, same values, same
 * attribute, same DOM as before, so no baseline moved.
 *
 * Built from the library's own parts: a `SegmentedControl`, because a theme
 * is exactly one of three. It was a `ButtonGroup` of `Toggle`s until D-107
 * §3 — pressed buttons, of which pressing the pressed one did nothing, and
 * which a screen reader never heard as one of three. `theme` is `system` on
 * the server and on the first client render (the provider reads the stored
 * choice after mount, spec §5), so the checked segment catches up one render
 * after hydration; the page's colours do not wait for it — the provider's
 * script set the attribute before the first paint.
 */

const CHOICES: ReadonlyArray<{ value: Theme; label: string }> = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <SegmentedControl label="Theme" size="sm" value={theme} onValueChange={(value) => setTheme(value as Theme)} data-testid="theme-switcher">
      {CHOICES.map(({ value, label }) => (
        <SegmentedControlItem key={value} value={value}>
          {label}
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  );
}
