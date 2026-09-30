'use client';

import { ButtonGroup, Toggle, useTheme, type Theme } from 'pixel-perfect';

/**
 * The playground's theme, chosen once and kept (D-063), through the
 * library's own `ThemeProvider` since 6.1 (D-094): the layout renders the
 * provider, this reads and sets its choice. Same key, same values, same
 * attribute, same DOM as before, so no baseline moved.
 *
 * Built from the library's own parts: a `ButtonGroup` of three `Toggle`s,
 * exactly one pressed. Pressing the pressed one keeps it pressed, because a
 * theme is never "none". `theme` is `system` on the server and on the first
 * client render (the provider reads the stored choice after mount, spec §5),
 * so the pressed toggle catches up one render after hydration; the page's
 * colours do not wait for it — the provider's script set the attribute
 * before the first paint.
 */

const CHOICES: ReadonlyArray<{ value: Theme; label: string }> = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <ButtonGroup label="Theme" data-testid="theme-switcher">
      {CHOICES.map(({ value, label }) => (
        <Toggle key={value} size="sm" variant="outline" pressed={theme === value} onPressedChange={() => setTheme(value)}>
          {label}
        </Toggle>
      ))}
    </ButtonGroup>
  );
}
