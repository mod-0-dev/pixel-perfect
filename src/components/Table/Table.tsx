import { forwardRef, useId, type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { cx } from '../../internal/cx';
import type { Size } from '../../types';

/**
 * A semantic table in a named region that scrolls (spec §1). The native
 * element's semantics — a screen reader announces the header with the
 * cell — and nothing that needs a data layer: sorting and selection are
 * hooks the consumer's client component decides (`sort`, `selected`).
 *
 * THE REGION IS FOCUSABLE AND NAMED (spec §1, §2): a keyboard user must be
 * able to scroll a table wider than its box, and a Server Component
 * cannot know whether this one is, so the tab stop is always there and
 * always says what it is. The name is the caption's, by one `useId` —
 * which is why `caption` is a prop of the root and not a part: there is
 * no context on the server to hand an id across.
 *
 * Sizing contract: fill — the region takes its parent's width; the table
 * inside is stretched by the region's grid, never by a width (spec §3).
 * RSC: server. Spec: docs/specs/Table.md
 */

export type TableAlign = 'start' | 'center' | 'end';
export type TableSort = 'ascending' | 'descending' | 'none';

type TableBase = Omit<ComponentPropsWithoutRef<'div'>, 'role' | 'aria-label' | 'aria-labelledby'> & {
  /** The row's density. */
  size?: Size;
  /** Every even body row on the sunken surface. */
  striped?: boolean;
  /** Attributes for the `<table>` element itself, for the rare one that belongs there. */
  tableProps?: Omit<ComponentPropsWithoutRef<'table'>, 'children'>;
};

/** One of `caption`, `aria-label` and `aria-labelledby` is required: the region is named by it. */
export type TableProps = TableBase &
  (
    | { caption: ReactNode; 'aria-label'?: never; 'aria-labelledby'?: never }
    | { 'aria-label': string; caption?: never; 'aria-labelledby'?: never }
    | { 'aria-labelledby': string; caption?: never; 'aria-label'?: never }
  );

export const Table = forwardRef<HTMLDivElement, TableProps>(function Table(
  { size = 'md', striped = false, tableProps, className, children, ...rest },
  ref,
) {
  const {
    caption,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    ...props
  } = rest as {
    caption?: ReactNode;
    'aria-label'?: string;
    'aria-labelledby'?: string;
  } & Omit<TableBase, 'size' | 'striped' | 'tableProps' | 'className' | 'children'>;

  const captionId = useId();
  const hasCaption = caption !== undefined && caption !== null && caption !== false;

  return (
    <div
      ref={ref}
      role="region"
      tabIndex={0}
      className={cx('pp-table', className)}
      data-size={size}
      data-striped={striped ? '' : undefined}
      {...(hasCaption ? { 'aria-labelledby': captionId } : {})}
      {...(ariaLabel !== undefined ? { 'aria-label': ariaLabel } : {})}
      {...(ariaLabelledby !== undefined ? { 'aria-labelledby': ariaLabelledby } : {})}
      {...props}
    >
      <table {...tableProps} className={cx('pp-table__table', tableProps?.className)}>
        {hasCaption ? (
          <caption id={captionId} className="pp-table__caption">
            {caption}
          </caption>
        ) : null}
        {children}
      </table>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Sections

export interface TableHeaderProps extends ComponentPropsWithoutRef<'thead'> {}

export const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(function TableHeader(
  { className, ...props },
  ref,
) {
  return <thead ref={ref} className={cx('pp-table__header', className)} {...props} />;
});

export interface TableBodyProps extends ComponentPropsWithoutRef<'tbody'> {}

export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(function TableBody(
  { className, ...props },
  ref,
) {
  return <tbody ref={ref} className={cx('pp-table__body', className)} {...props} />;
});

export interface TableFooterProps extends ComponentPropsWithoutRef<'tfoot'> {}

export const TableFooter = forwardRef<HTMLTableSectionElement, TableFooterProps>(function TableFooter(
  { className, ...props },
  ref,
) {
  return <tfoot ref={ref} className={cx('pp-table__footer', className)} {...props} />;
});

// ---------------------------------------------------------------------------
// Row and cells

export interface TableRowProps extends ComponentPropsWithoutRef<'tr'> {
  /**
   * The row is selected: `data-state="selected"` and the accent tone scope,
   * so the surface paints in the accent ramp with no colour named here.
   * No `aria-selected` — not allowed on a row outside a grid; the consumer's
   * Checkbox in the row carries the state for assistive technology (spec §5).
   */
  selected?: boolean;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(function TableRow(
  { selected = false, className, ...props },
  ref,
) {
  return (
    <tr
      ref={ref}
      className={cx('pp-table__row', className)}
      data-state={selected ? 'selected' : undefined}
      data-pp-tone={selected ? 'accent' : undefined}
      {...props}
    />
  );
});

/** `align` is ours, logical (`start | end`), and replaces the deprecated HTML attribute of the same name. */
export interface TableHeadProps extends Omit<ComponentPropsWithoutRef<'th'>, 'align'> {
  align?: TableAlign;
  /** How the column is sorted, written as `aria-sort`. The button that changes it is yours, inside. */
  sort?: TableSort;
}

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(function TableHead(
  { align, sort, scope = 'col', className, ...props },
  ref,
) {
  return (
    <th
      ref={ref}
      scope={scope}
      className={cx('pp-table__head', className)}
      data-align={align}
      {...(sort !== undefined ? { 'aria-sort': sort } : {})}
      {...props}
    />
  );
});

export interface TableCellProps extends Omit<ComponentPropsWithoutRef<'td'>, 'align'> {
  align?: TableAlign;
  /** The cell holds prose and may wrap. By default a cell does not: an id or a date broken across lines is worse than a region that scrolls. */
  wrap?: boolean;
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(function TableCell(
  { align, wrap = false, className, ...props },
  ref,
) {
  return (
    <td ref={ref} className={cx('pp-table__cell', className)} data-align={align} data-wrap={wrap ? '' : undefined} {...props} />
  );
});
