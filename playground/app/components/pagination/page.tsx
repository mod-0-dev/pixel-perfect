/*
 * A Server Component page; the Pagination inside is a client component that
 * holds its page when uncontrolled. Every instance here is uncontrolled, so
 * pressing a number moves it. The linked one lives in Demos.tsx: its
 * `getHref` is a function, and a function cannot cross from a server page
 * into a client component.
 *
 * NOTHING HERE WRITES AN ID (D-035 §1): the browser suite finds its
 * sections by `data-testid`.
 */
import { Pagination, Stack } from '@mod-0-dev/pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

import { LinkedPagination } from './Demos';

export default function PaginationPage() {
  return (
    <>
      <h1>5.5 Pagination</h1>
      <p>
        Which page of many, and a way to the others: previous, next, and a window of page numbers
        around the current one with the first and the last always reachable. Narrower than its row,
        it is &ldquo;6 of 12&rdquo; between the arrows &mdash; the container decides, not the viewport.
      </p>

      <section>
        <h2>At every width</h2>
        <p>Page 6 of 12. At 240px the numbers are gone and the status is shown; at 480px and 960px the full row.</p>
        <Matrix>
          <Pagination count={12} defaultPage={6} />
        </Matrix>
      </section>

      {/* OUTSIDE THE MATRIX (D-035 §1). */}
      <section>
        <h2>Sizes</h2>
        <p>The Buttons&apos; sizes.</p>
        <Stack gap="3" data-testid="pagination-sizes">
          <Pagination count={12} defaultPage={6} size="sm" label="Small" />
          <Pagination count={12} defaultPage={6} label="Medium" />
          <Pagination count={12} defaultPage={6} size="lg" label="Large" />
        </Stack>
      </section>

      <section>
        <h2>The ends, and a wider window</h2>
        <p>Page 1 and page 12 keep seven slots; siblings 2 and boundaries 2 make eleven.</p>
        <Stack gap="3" data-testid="pagination-window">
          <Pagination count={12} defaultPage={1} label="First page" />
          <Pagination count={12} defaultPage={12} label="Last page" />
          <Pagination count={20} defaultPage={10} siblingCount={2} boundaryCount={2} label="Wide window" />
        </Stack>
      </section>

      <section>
        <h2>In a narrow parent that is not a container</h2>
        <p>
          The matrix&apos;s cells are size containers of their own; this parent is a plain block 15rem wide, so
          only the component&apos;s own container can answer the query.
        </p>
        <div style={{ maxInlineSize: '15rem' }} data-testid="pagination-compact">
          <Pagination count={12} defaultPage={6} label="Compact" />
        </div>
      </section>

      <section>
        <h2>Links</h2>
        <p>With getHref every page is a link; the current one is text.</p>
        <div data-testid="pagination-links">
          <LinkedPagination />
        </div>
      </section>

      <section>
        <h2>Disabled</h2>
        <div data-testid="pagination-disabled">
          <Pagination count={12} defaultPage={6} disabled label="Disabled" />
        </div>
      </section>

      <section>
        <h2>Right to left</h2>
        <p>The row runs from the right, previous at the right edge, and the chevrons point the way the pages run.</p>
        <div dir="rtl" data-testid="pagination-rtl">
          <Pagination count={12} defaultPage={6} label="من اليمين" />
        </div>
      </section>
    </>
  );
}
