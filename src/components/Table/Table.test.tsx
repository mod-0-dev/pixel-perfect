import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Badge } from '../Badge/Badge';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow, type TableProps } from './Table';

function Invoices(props: { size?: 'sm' | 'md' | 'lg'; striped?: boolean; tableProps?: NonNullable<TableProps['tableProps']> } = {}) {
  return (
    <Table caption="Invoices" {...props}>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead align="end" sort="descending">
            Amount
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>INV-0091</TableCell>
          <TableCell align="end">1,240.00</TableCell>
        </TableRow>
        <TableRow selected>
          <TableCell>INV-0092</TableCell>
          <TableCell align="end">80.00</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell align="end">1,320.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

const region = () => document.querySelector('.pp-table') as HTMLElement;

describe('Table', () => {
  it('is a focusable region named by its caption, around a semantic table (spec §1, §2)', () => {
    const { getByRole } = renderWithTheme(<Invoices />);
    const el = getByRole('region', { name: 'Invoices' });
    expect(el).toBe(region());
    expect(el).toHaveAttribute('tabindex', '0');
    const caption = el.querySelector('caption')!;
    expect(caption).toHaveClass('pp-table__caption');
    expect(el.getAttribute('aria-labelledby')).toBe(caption.id);
    expect(caption.id).not.toBe('');
    expect(getByRole('table', { name: 'Invoices' })).toHaveClass('pp-table__table');
    expect(el).toHaveAttribute('data-size', 'md');
    expect(el).not.toHaveAttribute('data-striped');
  });

  it('renders the native parts: thead, tbody, tfoot, tr, th scope=col, td (spec §1)', () => {
    const { getByRole, getAllByRole } = renderWithTheme(<Invoices />);
    expect(region().querySelector('thead')).toHaveClass('pp-table__header');
    expect(region().querySelector('tbody')).toHaveClass('pp-table__body');
    expect(region().querySelector('tfoot')).toHaveClass('pp-table__footer');
    expect(getAllByRole('row')).toHaveLength(4);
    const head = getByRole('columnheader', { name: 'Invoice' });
    expect(head.tagName).toBe('TH');
    expect(head).toHaveAttribute('scope', 'col');
    expect(head).toHaveClass('pp-table__head');
    expect(getByRole('cell', { name: 'INV-0091' })).toHaveClass('pp-table__cell');
  });

  it('is named by aria-label or aria-labelledby instead, with no caption rendered (spec §2)', () => {
    const { getByRole, rerender } = renderWithTheme(
      <Table aria-label="Members">
        <TableBody>
          <TableRow>
            <TableCell>Ada</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(getByRole('region', { name: 'Members' })).toBe(region());
    expect(region().querySelector('caption')).toBeNull();
    rerender(
      <>
        <h2 id="t">Team</h2>
        <Table aria-labelledby="t">
          <TableBody>
            <TableRow>
              <TableCell>Ada</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </>,
    );
    expect(getByRole('region', { name: 'Team' })).toBe(region());
  });

  it('rejects a nameless table at the type level (spec §2)', () => {
    // @ts-expect-error — one of caption / aria-label / aria-labelledby is required.
    const nameless = <Table />;
    expect(nameless).toBeTruthy();
  });

  it('writes size and striped on the region, and tableProps on the table (spec §5)', () => {
    renderWithTheme(<Invoices size="sm" striped tableProps={{ 'data-testid': 't', className: 'mine' } as never} />);
    expect(region()).toHaveAttribute('data-size', 'sm');
    expect(region()).toHaveAttribute('data-striped', '');
    const table = region().querySelector('table')!;
    expect(table).toHaveAttribute('data-testid', 't');
    expect(table).toHaveClass('pp-table__table', 'mine');
  });

  it('writes align and sort on cells, and selected on a row without aria-selected (spec §5)', () => {
    const { getByRole, getAllByRole } = renderWithTheme(<Invoices />);
    const amount = getByRole('columnheader', { name: 'Amount' });
    expect(amount).toHaveAttribute('data-align', 'end');
    expect(amount).toHaveAttribute('aria-sort', 'descending');
    expect(getByRole('columnheader', { name: 'Invoice' })).not.toHaveAttribute('aria-sort');
    expect(getByRole('cell', { name: '80.00' })).toHaveAttribute('data-align', 'end');
    expect(getByRole('cell', { name: '80.00' })).not.toHaveAttribute('data-wrap');
    const rows = getAllByRole('row');
    expect(rows[2]).toHaveAttribute('data-state', 'selected');
    expect(rows[2]).toHaveAttribute('data-pp-tone', 'accent');
    expect(rows[2]).not.toHaveAttribute('aria-selected');
    expect(rows[1]).not.toHaveAttribute('data-state');
    expect(rows[1]).not.toHaveAttribute('data-pp-tone');
  });

  it('writes wrap on a prose cell (spec §5)', () => {
    const { getByRole } = renderWithTheme(
      <Table aria-label="x">
        <TableBody>
          <TableRow>
            <TableCell wrap>A sentence that may wrap.</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(getByRole('cell')).toHaveAttribute('data-wrap', '');
  });

  it('forwards refs and merges className and style on every part', () => {
    const root = createRef<HTMLDivElement>();
    const header = createRef<HTMLTableSectionElement>();
    const body = createRef<HTMLTableSectionElement>();
    const footer = createRef<HTMLTableSectionElement>();
    const row = createRef<HTMLTableRowElement>();
    const head = createRef<HTMLTableCellElement>();
    const cell = createRef<HTMLTableCellElement>();
    renderWithTheme(
      <Table ref={root} aria-label="x" className="r" style={{ opacity: 0.5 }} data-testid="root">
        <TableHeader ref={header} className="h" style={{ order: 1 }}>
          <TableRow>
            <TableHead ref={head} className="th" style={{ order: 2 }}>
              A
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody ref={body} className="b">
          <TableRow ref={row} className="tr" style={{ order: 3 }}>
            <TableCell ref={cell} className="td" style={{ order: 4 }}>
              1
            </TableCell>
          </TableRow>
        </TableBody>
        <TableFooter ref={footer} className="f" />
      </Table>,
    );
    expect(root.current).toBe(region());
    expect(root.current).toHaveClass('pp-table', 'r');
    expect(root.current).toHaveStyle({ opacity: '0.5' });
    expect(root.current).toHaveAttribute('data-testid', 'root');
    expect(header.current).toHaveClass('pp-table__header', 'h');
    expect(header.current).toHaveStyle({ order: '1' });
    expect(body.current).toHaveClass('pp-table__body', 'b');
    expect(footer.current).toHaveClass('pp-table__footer', 'f');
    expect(row.current).toHaveClass('pp-table__row', 'tr');
    expect(row.current).toHaveStyle({ order: '3' });
    expect(head.current).toHaveClass('pp-table__head', 'th');
    expect(head.current).toHaveStyle({ order: '2' });
    expect(cell.current).toHaveClass('pp-table__cell', 'td');
    expect(cell.current).toHaveStyle({ order: '4' });
  });

  it('has no axe violations with a sorted head, a selected row and a Badge, in both themes', async () => {
    const light = renderWithTheme(
      <Table caption="Members" striped>
        <TableHeader>
          <TableRow>
            <TableHead sort="ascending">Name</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow selected>
            <TableCell>Ada</TableCell>
            <TableCell>
              <Badge tone="success">Admin</Badge>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Grace</TableCell>
            <TableCell>
              <Badge>Member</Badge>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    await expectNoA11yViolations(light.container);
    light.unmount();
    const dark = renderWithTheme(<Invoices />, { theme: 'dark' });
    await expectNoA11yViolations(dark.container);
  });
});
