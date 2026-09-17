import { waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Avatar, initialsOf } from './Avatar';

/** jsdom never loads images. This one loads unless the URL says "broken". */
class FakeImage {
  onload: null | (() => void) = null;
  onerror: null | (() => void) = null;
  set src(value: string) {
    queueMicrotask(() => (value.includes('broken') ? this.onerror?.() : this.onload?.()));
  }
}

describe('initialsOf', () => {
  it.each([
    ['Mara Ellison', 'ME'],
    ['Cher', 'C'],
    ['  devika   rao  ', 'DR'],
    ['Jean-Luc Picard', 'JP'],
    ['山田 太郎', '山太'],
    ['👩‍🚀 Astronaut', '👩‍🚀A'],
    ['', ''],
  ])('%s → %s', (name, expected) => {
    expect(initialsOf(name)).toBe(expected);
  });
});

describe('Avatar', () => {
  beforeEach(() => vi.stubGlobal('Image', FakeImage));
  afterEach(() => vi.unstubAllGlobals());

  it('without src shows initials, is named by `name`, and is in the error state', () => {
    const { getByRole } = renderWithTheme(<Avatar name="Mara Ellison" />);
    const el = getByRole('img', { name: 'Mara Ellison' });
    expect(el.tagName).toBe('SPAN');
    expect(el).toHaveClass('pp-avatar');
    expect(el).toHaveAttribute('data-state', 'error');
    expect(el).toHaveAttribute('data-size', 'md');
    expect(el).toHaveAttribute('data-pp-tone', 'neutral');
    const fallback = el.querySelector('.pp-avatar__fallback')!;
    expect(fallback).toHaveTextContent('ME');
    expect(fallback).toHaveAttribute('aria-hidden', 'true');
    expect(el.querySelector('img')).toBeNull();
  });

  it('with src starts loading with the fallback, then swaps to the image', async () => {
    const statuses: string[] = [];
    const { getByRole } = renderWithTheme(
      <Avatar name="Mara Ellison" src="/mara.jpg" onLoadingStatusChange={(s) => statuses.push(s)} />,
    );
    const el = getByRole('img', { name: 'Mara Ellison' });
    expect(el).toHaveAttribute('data-state', 'loading');
    expect(el.querySelector('.pp-avatar__fallback')).toHaveTextContent('ME');

    // Wait on the CALLBACK, not on data-state. The attribute is in the DOM as
    // soon as the render commits, while `onLoadingStatusChange` fires from a
    // passive effect afterwards — so waiting on the attribute and then
    // asserting the callback is a race, and it lost once in CI under load.
    // Waiting for the thing under assertion cannot race with itself.
    await waitFor(() => expect(statuses).toEqual(['loading', 'loaded']));

    expect(el).toHaveAttribute('data-state', 'loaded');
    const img = el.querySelector('img')!;
    expect(img).toHaveAttribute('src', '/mara.jpg');
    expect(img).toHaveAttribute('alt', '');
    expect(el.querySelector('.pp-avatar__fallback')).toBeNull();
  });

  it('falls back permanently when the image fails', async () => {
    const { getByRole } = renderWithTheme(<Avatar name="Mara Ellison" src="/broken.jpg" />);
    const el = getByRole('img');
    await waitFor(() => expect(el).toHaveAttribute('data-state', 'error'));
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('.pp-avatar__fallback')).toHaveTextContent('ME');
  });

  it('accepts a custom fallback', () => {
    const { getByRole } = renderWithTheme(
      <Avatar name="Unassigned" fallback={<svg data-testid="user-icon" aria-hidden="true" />} />,
    );
    expect(getByRole('img').querySelector('[data-testid="user-icon"]')).toBeInTheDocument();
  });

  it('exposes size and tone', () => {
    const { getByRole } = renderWithTheme(<Avatar name="x" size="lg" tone="accent" />);
    expect(getByRole('img')).toHaveAttribute('data-size', 'lg');
    expect(getByRole('img')).toHaveAttribute('data-pp-tone', 'accent');
  });

  it('forwards its ref, merges className and style, spreads the rest', () => {
    const ref = createRef<HTMLSpanElement>();
    const { getByRole } = renderWithTheme(
      <Avatar name="x" ref={ref} className="mine" style={{ opacity: 0.5 }} data-testid="a" title="t" />,
    );
    const el = getByRole('img');
    expect(ref.current).toBe(el);
    expect(el).toHaveClass('pp-avatar', 'mine');
    expect(el).toHaveStyle({ opacity: '0.5' });
    expect(el).toHaveAttribute('data-testid', 'a');
    expect(el).toHaveAttribute('title', 't');
  });

  it('has no axe violations in every state', async () => {
    const { container, getByText } = renderWithTheme(
      <>
        <Avatar name="Mara Ellison" />
        <Avatar name="Devika Rao" src="/devika.jpg" />
        <Avatar name="Broken" src="/broken.jpg" />
      </>,
    );
    await waitFor(() => expect(container.querySelector('img')).toBeInTheDocument());
    expect(getByText('ME')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });
});
