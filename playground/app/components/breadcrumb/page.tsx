/*
 * A Server Component, like Breadcrumb: nothing here needs a handler.
 *
 * NOTHING HERE WRITES AN ID (D-035 §1): the browser suite finds its
 * sections by `data-testid`.
 */
import { Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, Stack } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

function Trail() {
  return (
    <Breadcrumb>
      <BreadcrumbItem>
        <BreadcrumbLink href="#home">Home</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbItem>
        <BreadcrumbLink href="#projects">Projects</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbItem>
        <BreadcrumbLink href="#design-system">Design system</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbItem>
        <BreadcrumbLink href="#tokens">Tokens</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbItem>
        <BreadcrumbPage>Semantic colour</BreadcrumbPage>
      </BreadcrumbItem>
    </Breadcrumb>
  );
}

export default function BreadcrumbDemoPage() {
  return (
    <>
      <h1>5.6 Breadcrumb</h1>
      <p>
        Where the reader is, and the way back up: a trail of links from the root to here, the last one
        the page itself and not a link. A navigation landmark and an ordered list; the separator is the
        stylesheet&apos;s and never in the accessibility tree. A Server Component.
      </p>

      <section>
        <h2>At every width</h2>
        <p>Five crumbs. At 240px the trail wraps at a separator into lines of whole crumbs; at 960px it is one line.</p>
        <Matrix>
          <Trail />
        </Matrix>
      </section>

      {/* OUTSIDE THE MATRIX (D-035 §1). */}
      <section>
        <h2>Cut, with an ellipsis</h2>
        <p>The consumer cut the trail; the ellipsis is named &ldquo;More levels&rdquo;.</p>
        <div data-testid="breadcrumb-ellipsis">
          <Breadcrumb>
            <BreadcrumbItem>
              <BreadcrumbLink href="#home">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbEllipsis />
            <BreadcrumbItem>
              <BreadcrumbLink href="#tokens">Tokens</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>Semantic colour</BreadcrumbPage>
            </BreadcrumbItem>
          </Breadcrumb>
        </div>
      </section>

      <section>
        <h2>A different separator</h2>
        <p>The glyph is a custom property; a chevron here, its mirror under RTL the consumer&apos;s.</p>
        <div data-testid="breadcrumb-chevron" style={{ '--pp-breadcrumb-separator': '"›"' } as React.CSSProperties}>
          <Trail />
        </div>
      </section>

      <section>
        <h2>Two levels, and one</h2>
        <Stack gap="2" data-testid="breadcrumb-short">
          <Breadcrumb label="Two levels">
            <BreadcrumbItem>
              <BreadcrumbLink href="#home">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>Settings</BreadcrumbPage>
            </BreadcrumbItem>
          </Breadcrumb>
          <Breadcrumb label="One level">
            <BreadcrumbItem>
              <BreadcrumbPage>Home</BreadcrumbPage>
            </BreadcrumbItem>
          </Breadcrumb>
        </Stack>
      </section>

      <section>
        <h2>Right to left</h2>
        <p>The trail runs from the right; the slash needs no mirror.</p>
        <div dir="rtl" data-testid="breadcrumb-rtl">
          <Trail />
        </div>
      </section>
    </>
  );
}
