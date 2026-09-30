/*
 * A Server Component, as the shell is. NOTHING HERE WRITES AN ID (D-035 §1):
 * the shell's main id is its own useId; the browser suite finds its sections
 * by `data-testid`. A gallery: three shells per section, so this page has
 * three <main>s on purpose — a real page has one.
 */
import { AppShell, Container, Heading, Link, Stack, Text, ThemeToggle } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

const SECTIONS = ['Overview', 'Assets', 'Releases', 'Settings'];

function Nav() {
  return (
    <nav aria-label="Sections">
      <Stack gap="2">
        {SECTIONS.map((label, i) => (
          <Link key={label} href="#" tone="neutral" underline="hover" aria-current={i === 0 ? 'page' : undefined}>
            {label}
          </Link>
        ))}
      </Stack>
    </nav>
  );
}

function Header() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--pp-space-4)' }}>
      <Text weight="semibold">launchpad</Text>
      <ThemeToggle size="sm" />
    </div>
  );
}

function Page({ paragraphs = 1 }: { paragraphs?: number }) {
  return (
    <Container size="md">
      <Stack gap="4">
        <Heading level={2} size="lg">
          Overview
        </Heading>
        {Array.from({ length: paragraphs }, (_, i) => (
          <Text key={i}>
            The content is the page&rsquo;s. Its measure and gutter are Container&rsquo;s, inside the
            main; the shell adds neither, so a full-bleed page can have none.
          </Text>
        ))}
      </Stack>
    </Container>
  );
}

const Footer = () => (
  <Text size="sm" tone="muted">
    © Acme — every link above goes nowhere.
  </Text>
);

export default function AppShellPage() {
  return (
    <>
      <h1>6.3 AppShell</h1>
      <p>
        The frame a layout wraps its pages in: a header across the top, a sidebar beside the
        content, the content as the page&rsquo;s <code>&lt;main&gt;</code>, a footer under both, and a
        skip link to the content rendered first &mdash; press <kbd>Tab</kbd> into a shell to see it. The
        middle row is <code>Split</code>: the sidebar stacks above the content when the shell is
        narrow, by the shell&rsquo;s own width. Every shell on this page is the same component; only
        the width it was given differs.
      </p>

      <section data-testid="app-shell-default">
        <h2>At every width</h2>
        <p>
          Below <code>collapseBelow=&quot;md&quot;</code> (45rem) the sidebar is above the content at full
          width; at 960px it is beside it, <code>16rem</code> wide. The parent gives no height here,
          so the shell is as tall as its content.
        </p>
        <Matrix>
          <AppShell header={<Header />} sidebar={<Nav />} footer={<Footer />}>
            <Page />
          </AppShell>
        </Matrix>
      </section>

      <section data-testid="app-shell-tall">
        <h2>In a parent with a height</h2>
        <p>
          The wrapper is <code>20rem</code> tall &mdash; the parent&rsquo;s line, not the shell&rsquo;s. The
          shell fills it: the footer sits at the bottom and the sidebar&rsquo;s surface runs the full
          height.
        </p>
        <Matrix>
          <div style={{ blockSize: '20rem' }}>
            <AppShell header={<Header />} sidebar={<Nav />} footer={<Footer />}>
              <Page />
            </AppShell>
          </div>
        </Matrix>
      </section>

      <section data-testid="app-shell-sticky">
        <h2>Sticky header, in a scrolling parent</h2>
        <p>
          The wrapper scrolls its 16rem; the shell inside is taller. With <code>sticky</code> the header
          stays at the top of the wrapper as the page scrolls under it.
        </p>
        <Matrix>
          <div style={{ blockSize: '16rem', overflow: 'auto' }}>
            <AppShell sticky header={<Header />} sidebar={<Nav />} footer={<Footer />}>
              <Page paragraphs={8} />
            </AppShell>
          </div>
        </Matrix>
      </section>

      <section data-testid="app-shell-plain">
        <h2>No sidebar, no footer; and right-to-left</h2>
        <p>
          With no sidebar there is no Split &mdash; the main is the middle row alone. Under{' '}
          <code>dir=&quot;rtl&quot;</code> the sidebar is at the inline start, which is the right.
        </p>
        <Matrix>
          <Stack gap="4">
            <AppShell header={<Header />}>
              <Page />
            </AppShell>
            <div dir="rtl" data-testid="app-shell-rtl">
              <AppShell header={<Header />} sidebar={<Nav />} footer={<Footer />}>
                <Page />
              </AppShell>
            </div>
          </Stack>
        </Matrix>
      </section>
    </>
  );
}
