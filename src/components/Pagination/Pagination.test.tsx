import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Pagination, paginationItems } from './Pagination';

/** The row as text: page numbers, ellipses and the arrows' names, in order. */
const row = (root: HTMLElement) =>
  Array.from(root.querySelectorAll('li'))
    .filter((li) => !li.classList.contains('pp-pagination__status'))
    .map((li) => (li.querySelector('[aria-label]')?.getAttribute('aria-label') ?? li.textContent ?? '').trim());

describe('Pagination', () => {
  describe('the window (spec §1)', () => {
    it.each([
      [1, [1, 2, 3, 4, 5, 'end-ellipsis', 12]],
      [2, [1, 2, 3, 4, 5, 'end-ellipsis', 12]],
      [6, [1, 'start-ellipsis', 5, 6, 7, 'end-ellipsis', 12]],
      [11, [1, 'start-ellipsis', 8, 9, 10, 11, 12]],
      [12, [1, 'start-ellipsis', 8, 9, 10, 11, 12]],
    ])('12 pages at page %i, siblings 1, boundaries 1 — seven slots every time', (page, expected) => {
      expect(paginationItems(12, page, 1, 1)).toEqual(expected);
    });

    it('widens with siblingCount and boundaryCount, and has no ellipsis when everything fits', () => {
      expect(paginationItems(20, 10, 2, 2)).toEqual([1, 2, 'start-ellipsis', 8, 9, 10, 11, 12, 'end-ellipsis', 19, 20]);
      expect(paginationItems(5, 3, 1, 1)).toEqual([1, 2, 3, 4, 5]);
      expect(paginationItems(1, 1, 1, 1)).toEqual([1]);
    });
  });

  it('is a navigation landmark of buttons, the current page marked, the arrows named (spec §2, §3)', () => {
    const { getByRole, getAllByRole } = renderWithTheme(<Pagination count={12} defaultPage={6} />);
    const nav = getByRole('navigation', { name: 'Pagination' });
    expect(nav.tagName).toBe('NAV');
    expect(nav).toHaveClass('pp-pagination');
    expect(row(nav)).toEqual(['Previous page', '1', '…', '5', '6', '7', '…', '12', 'Next page']);
    const current = getByRole('button', { name: '6', current: 'page' });
    expect(current).toHaveClass('pp-button', 'pp-pagination__page');
    expect(current).toHaveAttribute('data-pp-tone', 'accent');
    expect(getByRole('button', { name: '5' })).not.toHaveAttribute('aria-current');
    expect(getByRole('button', { name: '5' })).toHaveAttribute('data-pp-tone', 'neutral');
    expect(getAllByRole('button')).toHaveLength(7);
    expect(nav.querySelector('.pp-pagination__status')).toHaveTextContent('6 of 12');
  });

  it('disables previous on the first page and next on the last', () => {
    const { getByRole, rerender } = renderWithTheme(<Pagination count={12} page={1} />);
    expect(getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(getByRole('button', { name: 'Next page' })).toBeEnabled();
    rerender(<Pagination count={12} page={12} />);
    expect(getByRole('button', { name: 'Previous page' })).toBeEnabled();
    expect(getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('reports and moves the page when uncontrolled; reports and holds it when controlled (RULES §5.5)', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const { getByRole, rerender } = renderWithTheme(<Pagination count={12} defaultPage={6} onPageChange={onPageChange} />);
    await user.click(getByRole('button', { name: '7' }));
    expect(onPageChange).toHaveBeenLastCalledWith(7);
    expect(getByRole('button', { name: '7' })).toHaveAttribute('aria-current', 'page');
    await user.click(getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(8);
    await user.click(getByRole('button', { name: 'Previous page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(7);
    onPageChange.mockClear();
    await user.click(getByRole('button', { name: '7', current: 'page' }));
    expect(onPageChange).not.toHaveBeenCalled();

    rerender(<Pagination count={12} page={3} onPageChange={onPageChange} />);
    await user.click(getByRole('button', { name: '4' }));
    expect(onPageChange).toHaveBeenLastCalledWith(4);
    expect(getByRole('button', { name: '3' })).toHaveAttribute('aria-current', 'page');
  });

  function Owner() {
    const [page, setPage] = useState(2);
    return (
      <>
        <output>page {page}</output>
        <Pagination count={4} page={page} onPageChange={setPage} />
      </>
    );
  }

  it('moves with an owner that stores what it reports', async () => {
    const user = userEvent.setup();
    const { getByRole, getByText } = renderWithTheme(<Owner />);
    await user.click(getByRole('button', { name: '4' }));
    expect(getByText('page 4')).toBeInTheDocument();
    expect(getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('renders links with getHref, the current page as text, and a disabled arrow as a button (spec §2)', () => {
    const onPageChange = vi.fn();
    const { getByRole, getAllByRole } = renderWithTheme(
      <Pagination count={12} page={1} getHref={(p) => `/list?page=${p}`} onPageChange={onPageChange} />,
    );
    expect(getByRole('link', { name: '2' })).toHaveAttribute('href', '/list?page=2');
    expect(getByRole('link', { name: 'Next page' })).toHaveAttribute('href', '/list?page=2');
    const current = getByRole('navigation').querySelector('[aria-current="page"]')!;
    expect(current.tagName).toBe('SPAN');
    expect(current).toHaveTextContent('1');
    expect(current).toHaveClass('pp-pagination__page');
    expect(getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(getAllByRole('link')).toHaveLength(6);
  });

  it('passes size to every Button, disables every control, and treats a count below one as one page', () => {
    const { getAllByRole, getByRole, rerender } = renderWithTheme(<Pagination count={12} defaultPage={6} size="sm" />);
    for (const b of getAllByRole('button')) expect(b).toHaveAttribute('data-size', 'sm');
    expect(getByRole('navigation')).toHaveAttribute('data-size', 'sm');
    rerender(<Pagination count={12} defaultPage={6} disabled />);
    for (const b of getAllByRole('button')) expect(b).toBeDisabled();
    rerender(<Pagination count={0} />);
    expect(row(getByRole('navigation'))).toEqual(['Previous page', '1', 'Next page']);
    expect(getByRole('button', { name: '1' })).toHaveAttribute('aria-current', 'page');
  });

  it('forwards the ref and merges className and style; names the landmark by `label`', () => {
    const ref = createRef<HTMLElement>();
    const { getByRole } = renderWithTheme(
      <Pagination ref={ref} count={3} label="Search results" className="mine" style={{ opacity: 0.5 }} data-testid="p" />,
    );
    const nav = getByRole('navigation', { name: 'Search results' });
    expect(ref.current).toBe(nav);
    expect(nav).toHaveClass('pp-pagination', 'mine');
    expect(nav).toHaveStyle({ opacity: '0.5' });
    expect(nav).toHaveAttribute('data-testid', 'p');
  });

  it('has no axe violations, as buttons and as links, in both themes', async () => {
    const light = renderWithTheme(
      <>
        <Pagination count={12} defaultPage={6} />
        <Pagination count={12} page={3} getHref={(p) => `?page=${p}`} label="Results" />
      </>,
    );
    await expectNoA11yViolations(light.container);
    light.unmount();
    const dark = renderWithTheme(<Pagination count={12} defaultPage={1} />, { theme: 'dark' });
    await expectNoA11yViolations(dark.container);
  });
});
