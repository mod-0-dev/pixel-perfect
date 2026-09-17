import { describe, expect, it } from 'vitest';
import { findA11yViolations } from '../../src/test/a11y';
import { renderWithTheme } from '../../src/test/render';

/**
 * Canary for the accessibility harness itself.
 *
 * Every component from Tier 1 on will assert "axe finds nothing". That
 * assertion is only meaningful if axe would have found something. These tests
 * prove it does, so a silently broken harness cannot wave a whole library
 * through.
 */
describe('a11y harness', () => {
  it('catches an image with no alternative text', async () => {
    const { container } = renderWithTheme(<img src="/x.png" />);
    const violations = await findA11yViolations(container);
    expect(violations.map((v) => v.id)).toContain('image-alt');
  });

  it('catches a control with no accessible name', async () => {
    const { container } = renderWithTheme(
      <button type="button">
        <svg aria-hidden="true" width="16" height="16" />
      </button>,
    );
    const violations = await findA11yViolations(container);
    expect(violations.map((v) => v.id)).toContain('button-name');
  });

  it('passes clean markup', async () => {
    const { container } = renderWithTheme(
      <button type="button" aria-label="Close">
        <svg aria-hidden="true" width="16" height="16" />
      </button>,
    );
    expect(await findA11yViolations(container)).toEqual([]);
  });

  it('renders into the requested theme and tone scope', () => {
    const { container } = renderWithTheme(<span>hi</span>, { theme: 'dark', tone: 'danger' });
    expect(container).toHaveAttribute('data-pp-theme', 'dark');
    expect(container).toHaveAttribute('data-pp-tone', 'danger');
  });
});
