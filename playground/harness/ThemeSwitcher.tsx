'use client';

import { ButtonGroup, Toggle } from 'pixel-perfect';
import { useEffect, useState } from 'react';

/**
 * The playground's theme, chosen once and kept (D-063).
 *
 * Three choices. `system` sets nothing and lets the library follow
 * `prefers-color-scheme` through `:root:not([data-pp-theme])`; `light` and
 * `dark` set `data-pp-theme` on `<html>`, which is where an app most often
 * puts it (D-010 lets it bind anywhere). The choice is kept in localStorage
 * under one key, and `theme-script.ts` applies it before the first paint so a
 * dark page never flashes light.
 *
 * Built from the library's own parts: a `ButtonGroup` of three `Toggle`s,
 * exactly one pressed. Pressing the pressed one keeps it pressed, because a
 * theme is never "none".
 */

export const THEME_STORAGE_KEY = 'pp-theme';

export type ThemeChoice = 'system' | 'light' | 'dark';

const CHOICES: ReadonlyArray<{ value: ThemeChoice; label: string }> = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

function readChoice(): ThemeChoice {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    return 'system';
  }
}

function applyChoice(choice: ThemeChoice) {
  const html = document.documentElement;
  try {
    if (choice === 'system') {
      html.removeAttribute('data-pp-theme');
      window.localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      html.setAttribute('data-pp-theme', choice);
      window.localStorage.setItem(THEME_STORAGE_KEY, choice);
    }
  } catch {
    // Storage may be unavailable; the attribute alone still themes the page.
  }
}

export function ThemeSwitcher() {
  // Rendered as `system` on the server and on the first client render, so
  // hydration matches; the stored choice is read once mounted.
  const [choice, setChoice] = useState<ThemeChoice>('system');

  useEffect(() => {
    setChoice(readChoice());
  }, []);

  const choose = (next: ThemeChoice) => {
    setChoice(next);
    applyChoice(next);
  };

  return (
    <ButtonGroup label="Theme" data-testid="theme-switcher">
      {CHOICES.map(({ value, label }) => (
        <Toggle
          key={value}
          size="sm"
          variant="outline"
          pressed={choice === value}
          onPressedChange={() => choose(value)}
        >
          {label}
        </Toggle>
      ))}
    </ButtonGroup>
  );
}
