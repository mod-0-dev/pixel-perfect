/*
 * A Server Component, like Table: nothing here needs a handler. The sorted
 * head shows the hook; the button that would change it is a consumer's
 * client component, and this page has none.
 *
 * NOTHING HERE WRITES AN ID THE TEST NEEDS (D-035 §1): the browser suite
 * finds its sections by `data-testid`. The one id on the page is a
 * heading's, which `aria-labelledby` is for.
 */
import { Badge, Stack, Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

const invoices = [
  { id: 'INV-0091', customer: 'Northwind Traders', status: 'Paid', tone: 'success', amount: '1,240.00', due: '2026-09-04' },
  { id: 'INV-0092', customer: 'Contoso', status: 'Open', tone: 'accent', amount: '80.00', due: '2026-09-18' },
  { id: 'INV-0093', customer: 'Fabrikam Residences', status: 'Overdue', tone: 'danger', amount: '3,905.50', due: '2026-08-30' },
  { id: 'INV-0094', customer: 'Adventure Works', status: 'Paid', tone: 'success', amount: '412.00', due: '2026-09-11' },
] as const;

function Invoices({ size, striped, selected }: { size?: 'sm' | 'md' | 'lg'; striped?: boolean; selected?: string }) {
  return (
    <Table caption="Invoices for September" {...(size ? { size } : {})} {...(striped ? { striped } : {})}>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Status</TableHead>
          <TableHead align="end" sort="descending">
            Amount
          </TableHead>
          <TableHead>Due</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((row) => (
          <TableRow key={row.id} {...(row.id === selected ? { selected: true } : {})}>
            <TableCell>{row.id}</TableCell>
            <TableCell>{row.customer}</TableCell>
            <TableCell>
              <Badge tone={row.tone} size="sm">
                {row.status}
              </Badge>
            </TableCell>
            <TableCell align="end">{row.amount}</TableCell>
            <TableCell>{row.due}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell align="end">5,637.50</TableCell>
          <TableCell />
        </TableRow>
      </TableFooter>
    </Table>
  );
}

export default function TablePage() {
  return (
    <>
      <h1>5.4 Table</h1>
      <p>
        A semantic table in a named region that scrolls. Rows and columns of data the reader scans, with
        the native element&apos;s semantics and nothing that needs a data layer: the header says how it
        is sorted, the row says it is selected, and deciding either is yours. A Server Component.
      </p>

      <section>
        <h2>At every width</h2>
        <p>
          Five columns, a footer. At 240px the region scrolls inside its own box; at 960px the table
          is stretched to the region by its grid, not by a width.
        </p>
        <Matrix>
          <Invoices />
        </Matrix>
      </section>

      {/* OUTSIDE THE MATRIX (D-035 §1). */}
      <section>
        <h2>Sizes</h2>
        <p>The row&apos;s density: small, medium, large.</p>
        <Stack gap="4" data-testid="table-sizes">
          <Invoices size="sm" />
          <Invoices />
          <Invoices size="lg" />
        </Stack>
      </section>

      <section>
        <h2>Striped, and a selected row</h2>
        <p>Even rows on the sunken surface; a selected row on the accent one.</p>
        <Stack gap="4">
          <div data-testid="table-striped">
            <Invoices striped />
          </div>
          <div data-testid="table-selected">
            <Invoices selected="INV-0092" />
          </div>
        </Stack>
      </section>

      <section>
        <h2 id="members-title">Named from outside</h2>
        <p>No caption: the region is named by the heading above it. The last column is prose and says `wrap`.</p>
        <div data-testid="table-labelled">
          <Table aria-labelledby="members-title" size="sm">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead align="end">Joined</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Ada Lovelace</TableCell>
                <TableCell>Admin</TableCell>
                <TableCell align="end">1843</TableCell>
                <TableCell wrap>
                  Wrote the first published algorithm intended for a machine, in the notes to her translation of
                  Menabrea&apos;s memoir on the Analytical Engine, and saw that the engine could act on more than numbers.
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Grace Hopper</TableCell>
                <TableCell>Member</TableCell>
                <TableCell align="end">1952</TableCell>
                <TableCell wrap>
                  Built the first compiler and argued that programs should be written in something closer to English,
                  which became COBOL; the phrase &ldquo;it is easier to ask forgiveness than permission&rdquo; is hers.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <h2>Right to left</h2>
        <p>The columns run from the right, and an end-aligned number sits at the left.</p>
        <div dir="rtl" data-testid="table-rtl">
          <Invoices size="sm" />
        </div>
      </section>
    </>
  );
}
