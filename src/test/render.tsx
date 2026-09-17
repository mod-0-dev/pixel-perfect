import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';

export interface RenderWithThemeOptions extends Omit<RenderOptions, 'wrapper'> {
  theme?: 'light' | 'dark';
  tone?: 'neutral' | 'accent' | 'danger' | 'success' | 'warning';
}

/**
 * Renders inside a theme scope, mirroring how components are actually mounted.
 * The attributes matter even in jsdom because components read them for state
 * and behaviour, not only for colour.
 */
export function renderWithTheme(
  ui: ReactElement,
  { theme = 'light', tone, ...options }: RenderWithThemeOptions = {},
): RenderResult {
  const container = document.createElement('div');
  container.setAttribute('data-pp-theme', theme);
  if (tone) container.setAttribute('data-pp-tone', tone);
  document.body.appendChild(container);

  return render(ui, { container, ...options });
}
