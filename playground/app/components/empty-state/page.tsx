/*
 * A Server Component, like EmptyState: nothing here needs a handler.
 *
 * NOTHING HERE WRITES AN ID (D-035 §1): the browser suite finds its
 * sections by `data-testid`.
 */
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
  Heading,
  Link,
  Stack,
} from '@mod-0-dev/pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

function InboxGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 13h5l2 3h4l2-3h5" />
      <path d="M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

function NoProjects({ variant }: { variant?: 'plain' | 'outline' }) {
  return (
    <EmptyState {...(variant ? { variant } : {})}>
      <EmptyStateIcon>
        <InboxGlyph />
      </EmptyStateIcon>
      <EmptyStateTitle level={2}>No projects yet</EmptyStateTitle>
      <EmptyStateDescription>
        Create your first project to start tracking work, or import one from a file you already have.
      </EmptyStateDescription>
      <EmptyStateActions>
        <Button tone="accent">New project</Button>
        <Button variant="ghost">Import</Button>
      </EmptyStateActions>
    </EmptyState>
  );
}

export default function EmptyStateDemoPage() {
  return (
    <>
      <h1>5.8 EmptyState</h1>
      <p>
        Nothing here yet, and what to do about it: a glyph, a title, a line and the action that would
        fill the space. Centred and held to a readable measure by a grid, not by a width. A Server
        Component.
      </p>

      <section>
        <h2>At every width</h2>
        <p>The column is the cell at 240px and 20rem, centred, at 960px.</p>
        <Matrix>
          <NoProjects />
        </Matrix>
      </section>

      {/* OUTSIDE THE MATRIX (D-035 §1). */}
      <section>
        <h2>Outline: a dashed frame on Card&apos;s surface</h2>
        <p>The form for a region that will hold things.</p>
        <div data-testid="empty-state-outline">
          <NoProjects variant="outline" />
        </div>
      </section>

      <section>
        <h2>In a Card</h2>
        <div data-testid="empty-state-card">
          <Card>
            <CardHeader>
              <Heading level={2} size="sm">
                Files
              </Heading>
            </CardHeader>
            <CardBody>
              <EmptyState>
                <EmptyStateTitle level={3}>No files</EmptyStateTitle>
                <EmptyStateDescription>
                  Drop files here or <Link href="#browse">browse your computer</Link>.
                </EmptyStateDescription>
              </EmptyState>
            </CardBody>
          </Card>
        </div>
      </section>

      <section>
        <h2>A title alone, and a search with nothing</h2>
        <Stack gap="4" data-testid="empty-state-short">
          <EmptyState>
            <EmptyStateTitle level={2}>Inbox zero</EmptyStateTitle>
          </EmptyState>
          <EmptyState variant="outline" role="status">
            <EmptyStateTitle level={2} size="sm">
              No results for &ldquo;quarterly&rdquo;
            </EmptyStateTitle>
            <EmptyStateDescription>Try a shorter word, or clear the filters.</EmptyStateDescription>
            <EmptyStateActions>
              <Button variant="outline" size="sm">
                Clear filters
              </Button>
            </EmptyStateActions>
          </EmptyState>
        </Stack>
      </section>
    </>
  );
}
