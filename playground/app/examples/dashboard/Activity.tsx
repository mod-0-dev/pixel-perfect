'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import {
  Avatar,
  Badge,
  Button,
  ButtonGroup,
  Cluster,
  Code,
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
  Icon,
  Input,
  Pagination,
  Spinner,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  Toggle,
  Toolbar,
  VisuallyHidden,
  type BadgeProps,
} from 'pixel-perfect';

import { ArrowDownGlyph, ArrowUpGlyph, CheckCircleGlyph, SearchGlyph } from '../glyphs';
import { ENVIRONMENTS, PEOPLE, RELEASES, type Environment, type Release, type ReleaseStatus } from './data';

/*
 * The dashboard's client island: releases and incidents under Tabs. Every
 * control works — the environment toggles and the search filter the deploys,
 * the Deployed header sorts them, Pagination pages them — because the state
 * is this component's and the library's parts only report it: the Toggles
 * and Pagination are controlled here, TableHead says how the column is
 * sorted, and Tabs keeps its own selection (uncontrolled).
 */

const PAGE_SIZE = 8;

const ENVIRONMENT_BADGE: Record<Environment, Pick<BadgeProps, 'tone' | 'variant'>> = {
  Production: { tone: 'accent', variant: 'ghost' },
  Staging: { tone: 'neutral', variant: 'ghost' },
  Preview: { tone: 'neutral', variant: 'outline' },
};

const STATUS_TONE: Record<ReleaseStatus, BadgeProps['tone']> = {
  Live: 'success',
  'Rolling out': 'accent',
  'Rolled back': 'warning',
  Failed: 'danger',
};

/* The search field takes the rest of the toolbar's row, and a row of its own
   when it wraps — the call site's job, as Cluster.md says of a growing child. */
const GROW = { flex: '1 1 14rem', minInlineSize: 0 } as CSSProperties;

/* The sort button's label starts where the column's values start: Button's
   own inline-padding property, zeroed. */
const FLUSH = { '--pp-button-padding-inline': 'var(--pp-space-0)' } as CSSProperties;

function matches(release: Release, environments: ReadonlySet<Environment>, failuresOnly: boolean, query: string) {
  if (environments.size > 0 && !environments.has(release.environment)) return false;
  if (failuresOnly && release.status !== 'Failed' && release.status !== 'Rolled back') return false;
  if (!query) return true;
  const needle = query.toLowerCase();
  return [release.project, release.version, release.author].some((field) => field.toLowerCase().includes(needle));
}

export function Activity() {
  const [environments, setEnvironments] = useState<ReadonlySet<Environment>>(() => new Set());
  const [failuresOnly, setFailuresOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [newestFirst, setNewestFirst] = useState(true);
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    const kept = RELEASES.filter((release) => matches(release, environments, failuresOnly, query.trim()));
    return newestFirst ? kept : [...kept].reverse();
  }, [environments, failuresOnly, query, newestFirst]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const first = (current - 1) * PAGE_SIZE;
  const visible = rows.slice(first, first + PAGE_SIZE);
  const filtered = environments.size > 0 || failuresOnly || query.trim() !== '';

  const toggleEnvironment = (environment: Environment, on: boolean) => {
    setEnvironments((previous) => {
      const next = new Set(previous);
      if (on) next.add(environment);
      else next.delete(environment);
      return next;
    });
    setPage(1);
  };

  const clearFilters = () => {
    setEnvironments(new Set());
    setFailuresOnly(false);
    setQuery('');
    setPage(1);
  };

  return (
    <Tabs defaultValue="releases">
      <TabsList>
        <TabsTrigger value="releases">Releases</TabsTrigger>
        <TabsTrigger value="incidents">Incidents</TabsTrigger>
      </TabsList>

      <TabsContent value="releases">
        <Stack gap="4">
          <Toolbar label="Filter deploys">
            <ButtonGroup label="Environment">
              {ENVIRONMENTS.map((environment) => (
                <Toggle
                  key={environment}
                  size="sm"
                  variant="outline"
                  pressed={environments.has(environment)}
                  onPressedChange={(on) => toggleEnvironment(environment, on)}
                >
                  {environment}
                </Toggle>
              ))}
            </ButtonGroup>
            <Toggle
              size="sm"
              variant="outline"
              pressed={failuresOnly}
              onPressedChange={(on) => {
                setFailuresOnly(on);
                setPage(1);
              }}
            >
              Failures only
            </Toggle>
            <div style={GROW}>
              <Input
                size="sm"
                type="search"
                aria-label="Search deploys"
                placeholder="Project, version or author"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
              />
            </div>
          </Toolbar>

          {visible.length > 0 ? (
            <Table caption="Deploys in the last 30 days" size="sm">
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead sort={newestFirst ? 'descending' : 'ascending'}>
                    <Button
                      variant="plain"
                      size="sm"
                      style={FLUSH}
                      onClick={() => setNewestFirst((value) => !value)}
                    >
                      Deployed
                      <Icon decorative>{newestFirst ? <ArrowDownGlyph /> : <ArrowUpGlyph />}</Icon>
                    </Button>
                  </TableHead>
                  <TableHead align="end">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((release) => (
                  <TableRow key={release.id}>
                    <TableCell>
                      <Text asChild size="sm" weight="medium">
                        <span className="example-name">{release.project}</span>
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Code>{release.version}</Code>
                    </TableCell>
                    <TableCell>
                      <Badge size="sm" {...ENVIRONMENT_BADGE[release.environment]}>
                        {release.environment}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge size="sm" tone={STATUS_TONE[release.status]}>
                        {release.status === 'Rolling out' ? <Spinner decorative size="sm" tone="accent" /> : null}
                        {release.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {/* No wrap, as no cell wraps (Table.md): squeezed, the region scrolls; the face stays beside the name. */}
                      <Cluster gap="2" wrap={false}>
                        <Avatar name={release.author} size="sm" tone={PEOPLE[release.author]} />
                        {release.author}
                      </Cluster>
                    </TableCell>
                    <TableCell>{release.deployed}</TableCell>
                    <TableCell align="end">{release.duration}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState variant="outline">
              <EmptyStateIcon>
                <SearchGlyph />
              </EmptyStateIcon>
              <EmptyStateTitle level={2}>No deploys match</EmptyStateTitle>
              <EmptyStateDescription>Try a shorter search or another filter.</EmptyStateDescription>
              <EmptyStateActions>
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              </EmptyStateActions>
            </EmptyState>
          )}

          <Stack gap="2">
            {rows.length > 0 ? (
              <Pagination count={pageCount} page={current} onPageChange={setPage} label="Deploy pages" />
            ) : null}
            {/* Mounted whatever the count, so a change is announced (Alert.md); with
                no rows the empty state says it on screen, so the words are for the ear. */}
            <Text size="sm" tone="muted" align="center" role="status">
              {rows.length === 0 ? (
                <VisuallyHidden>No deploys match these filters</VisuallyHidden>
              ) : (
                `${first + 1}–${first + visible.length} of ${rows.length} deploys${filtered ? ' that match' : ''}`
              )}
            </Text>
          </Stack>
        </Stack>
      </TabsContent>

      <TabsContent value="incidents">
        <EmptyState variant="outline">
          <EmptyStateIcon>
            <CheckCircleGlyph />
          </EmptyStateIcon>
          <EmptyStateTitle level={2}>No open incidents</EmptyStateTitle>
          <EmptyStateDescription>
            The last one, checkout latency in eu-west, was resolved on 27 September.
          </EmptyStateDescription>
          <EmptyStateActions>
            <Button variant="outline">View incident history</Button>
          </EmptyStateActions>
        </EmptyState>
      </TabsContent>
    </Tabs>
  );
}
