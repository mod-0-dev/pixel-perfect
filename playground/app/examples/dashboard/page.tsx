import NextLink from 'next/link';
import type { CSSProperties } from 'react';
import {
  AppShell,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  Button,
  Card,
  CardBody,
  Cluster,
  Container,
  Grid,
  Icon,
  NavSidebar,
  NavSidebarGroup,
  NavSidebarItem,
  NavSidebarSection,
  PageHeader,
  PageHeaderActions,
  PageHeaderDescription,
  PageHeaderTitle,
  Progress,
  Stack,
  Text,
  type Tone,
} from 'pixel-perfect';

import { Stage } from '../../../harness/Stage';
import {
  AlertGlyph,
  DownloadGlyph,
  FolderGlyph,
  GridGlyph,
  LayersGlyph,
  PackageGlyph,
  PlusGlyph,
  SlidersGlyph,
  TrendDownGlyph,
  TrendUpGlyph,
} from '../glyphs';
import { AppFooter, AppHeader } from '../launchpad';
import { Activity } from './Activity';
import '../examples.css';

/*
 * Launchpad's overview: four numbers, then the deploys behind them. A Server
 * Component; the table of deploys and its filters are the client island
 * (Activity). The stat grid has no breakpoint: `minItemInlineSize` fits as
 * many 13rem columns as the main has room for. Links to pages this example
 * does not have go to "#"; Overview and Settings are real.
 */

function MainNav() {
  return (
    <NavSidebar label="Main">
      <NavSidebarSection>
        <NavSidebarItem asChild current icon={<GridGlyph />}>
          <NextLink href="/examples/dashboard">Overview</NextLink>
        </NavSidebarItem>
        <NavSidebarItem href="#" icon={<PackageGlyph />} end={<Badge size="sm" tone="accent">1</Badge>}>
          Releases
        </NavSidebarItem>
        <NavSidebarItem href="#" icon={<AlertGlyph />}>
          Incidents
        </NavSidebarItem>
        <NavSidebarItem href="#" icon={<LayersGlyph />}>
          Environments
        </NavSidebarItem>
      </NavSidebarSection>
      <NavSidebarSection title="Projects">
        <NavSidebarGroup label="Pinned" icon={<FolderGlyph />}>
          <NavSidebarItem href="#">checkout-web</NavSidebarItem>
          <NavSidebarItem href="#">payments-api</NavSidebarItem>
          <NavSidebarItem href="#">mobile-ios</NavSidebarItem>
        </NavSidebarGroup>
        <NavSidebarItem href="#" icon={<FolderGlyph />}>
          All 14 projects
        </NavSidebarItem>
      </NavSidebarSection>
      <NavSidebarSection>
        <NavSidebarItem asChild icon={<SlidersGlyph />}>
          <NextLink href="/examples/settings">Settings</NextLink>
        </NavSidebarItem>
      </NavSidebarSection>
    </NavSidebar>
  );
}

/* A figure is not a heading and Text stops at `lg`: Text's own size and
   leading properties, its documented styling API, make it one. */
const FIGURE = {
  '--pp-text-size': 'var(--pp-font-size-7)',
  '--pp-text-line-height': 'var(--pp-line-height-tight)',
} as CSSProperties;

/*
 * Every card has the same three rows — what it counts, the figure, and how
 * it moved against the 30 days before (or, for an allowance, how much of it
 * is used) — so the cards line up however many columns the grid makes.
 * Tone says whether a move is good; the badge's words say which way it went.
 */
type Stat = {
  label: string;
  value: string;
} & (
  | { trend: { tone: Tone; direction: 'up' | 'down'; change: string; before: string } }
  | { meter: { value: number; max: number; reading: string; note: string } }
);

const STATS: readonly Stat[] = [
  {
    label: 'Deploys',
    value: '128',
    trend: { tone: 'success', direction: 'up', change: '+12%', before: 'vs. 114' },
  },
  {
    label: 'Median lead time',
    value: '2h 41m',
    trend: { tone: 'success', direction: 'down', change: '−18 min', before: 'vs. 2h 59m' },
  },
  {
    label: 'Change failure rate',
    value: '3.1%',
    trend: { tone: 'warning', direction: 'up', change: '+0.4 pts', before: 'vs. 2.7%' },
  },
  {
    label: 'Build minutes',
    value: '3,412',
    meter: { value: 3412, max: 5000, reading: '3,412 of 5,000 build minutes', note: 'of 5,000 · resets 1 Nov' },
  },
];

function StatCard({ stat }: { stat: Stat }) {
  return (
    <Card>
      <CardBody>
        <Stack gap="3">
          <Text size="sm" tone="muted" weight="medium">
            {stat.label}
          </Text>
          <Text weight="semibold" style={FIGURE}>
            {stat.value}
          </Text>
          {'trend' in stat ? (
            <Cluster gap="2">
              <Badge size="sm" tone={stat.trend.tone}>
                <Icon decorative>{stat.trend.direction === 'up' ? <TrendUpGlyph /> : <TrendDownGlyph />}</Icon>
                {stat.trend.change}
              </Badge>
              <Text size="sm" tone="muted">
                {stat.trend.before}
              </Text>
            </Cluster>
          ) : (
            <Stack gap="2">
              <Progress label={stat.label} value={stat.meter.value} max={stat.meter.max} aria-valuetext={stat.meter.reading} />
              <Text size="sm" tone="muted">
                {stat.meter.note}
              </Text>
            </Stack>
          )}
        </Stack>
      </CardBody>
    </Card>
  );
}

export default function DashboardExample() {
  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <NextLink href="/examples">Examples</NextLink>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbPage>Dashboard</BreadcrumbPage>
        </BreadcrumbItem>
      </Breadcrumb>
      <h1>Dashboard</h1>
      <p>
        A release dashboard in an <code>AppShell</code>. At a phone&rsquo;s width the sidebar stacks above
        the page, the stat cards fall to one column, the toolbar wraps, the table scrolls inside its own
        frame and the pagination shortens to &ldquo;1 of 16&rdquo;. On a full page the stats sit four
        across and the table has room for every column. The filters, the sort and the pages all work.
      </p>

      <Stage label="Dashboard screen">
        <AppShell header={<AppHeader />} sidebar={<MainNav />} footer={<AppFooter />}>
          <div className="example-page">
            <Container size="lg">
              <Stack gap="6">
                <PageHeader>
                  <PageHeaderTitle size="xl">Overview</PageHeaderTitle>
                  <PageHeaderDescription>
                    Deploys and incidents across Northwind&rsquo;s 14 projects, 6 September to 6 October.
                  </PageHeaderDescription>
                  <PageHeaderActions>
                    <Button variant="outline">
                      <Icon decorative>
                        <DownloadGlyph />
                      </Icon>
                      Export
                    </Button>
                    <Button tone="accent">
                      <Icon decorative>
                        <PlusGlyph />
                      </Icon>
                      New release
                    </Button>
                  </PageHeaderActions>
                </PageHeader>

                <Grid minItemInlineSize="13rem" gap="4">
                  {STATS.map((stat) => (
                    <StatCard key={stat.label} stat={stat} />
                  ))}
                </Grid>

                <Activity />
              </Stack>
            </Container>
          </div>
        </AppShell>
      </Stage>
    </>
  );
}
