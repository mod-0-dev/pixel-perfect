import { Badge, Cluster, Heading, Split, Stack, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

function Nav() {
  return (
    <Stack gap="1" asChild>
      <nav aria-label="Sections">
        {['Overview', 'Tasks', 'Assets', 'Settings'].map((label) => (
          <Text key={label} size="sm" asChild>
            <a href={`#${label.toLowerCase()}`}>{label}</a>
          </Text>
        ))}
      </nav>
    </Stack>
  );
}

export default function SplitPage() {
  return (
    <>
      <h1>2.6 Split</h1>
      <p>
        A fixed pane beside a flexible one, which stacks when the container gets narrow. This is
        the component that makes RULES §1&apos;s container-query claim real: the same Split
        collapses inside a 480px modal that it would at a 480px viewport, and it has never heard of
        the viewport.
      </p>

      <section>
        <h2>collapseBelow=&quot;md&quot; — the default, 45rem</h2>
        <p>
          Side by side at 960px, stacked at 480px and 240px. Nothing measured the window, and the
          rule targets the slots rather than the root &mdash; an element cannot query its own
          container, so the collapse is written as &ldquo;make the children full-width&rdquo;.
        </p>
        <Matrix>
          <Split sidebarInlineSize="10rem" gap="4">
            <Split.Sidebar>
              <Nav />
            </Split.Sidebar>
            <Split.Main>
              <Stack gap="2">
                <Heading level={2} size="md">
                  Northwind Go 4.0
                </Heading>
                <Cluster gap="2">
                  <Badge tone="warning">12 days out</Badge>
                  <Badge tone="success">On track</Badge>
                </Cluster>
              </Stack>
            </Split.Main>
          </Split>
        </Matrix>
      </section>

      <section>
        <h2>collapseBelow=&quot;never&quot;</h2>
        <p>
          The sidebar keeps its basis at every width and the main pane shrinks. Legitimate when the
          split is small and you know the container; an overflow bug otherwise.
        </p>
        <Matrix>
          <Split sidebarInlineSize="6rem" collapseBelow="never" gap="3">
            <Split.Sidebar>
              <Text size="xs" tone="muted">
                Fixed 6rem
              </Text>
            </Split.Sidebar>
            <Split.Main>
              <Text size="sm" truncate>
                privacy-policy-v4-final-REVIEWED-legal-signoff-pending.pdf
              </Text>
            </Split.Main>
          </Split>
        </Matrix>
      </section>

      <section>
        <h2>There is no side prop</h2>
        <p>
          A right-hand sidebar is <code>Split.Main</code> written first. The alternative is{' '}
          <code>order</code>, which desynchronises reading order from visual order &mdash; and a
          screen reader walks the DOM while a sighted user walks the screen (D-022 §3).
        </p>
        <Matrix>
          <Split sidebarInlineSize="8rem" collapseBelow="md" gap="3">
            <Split.Main>
              <Text size="sm">Main content, first in the DOM and first on screen</Text>
            </Split.Main>
            <Split.Sidebar>
              <Text size="xs" tone="muted">
                Sidebar on the end
              </Text>
            </Split.Sidebar>
          </Split>
        </Matrix>
      </section>

      <section>
        <h2>The main pane can shrink, so a wide child does not push the sidebar away</h2>
        <p>
          <code>min-inline-size: 0</code> on <code>Split.Main</code>. Without it the pane&apos;s
          floor is its min-content size, and one long token relocates the layout.
        </p>
        <Matrix>
          <Split sidebarInlineSize="6rem" collapseBelow="never" gap="2">
            <Split.Sidebar>
              <Badge tone="accent">Side</Badge>
            </Split.Sidebar>
            <Split.Main>
              <Text size="sm" truncate>
                launch-readiness-checklist-final-v4-REVIEWED-do-not-edit.xlsx
              </Text>
            </Split.Main>
          </Split>
        </Matrix>
      </section>
    </>
  );
}
