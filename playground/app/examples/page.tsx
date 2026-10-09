import NextLink from 'next/link';
import type { ReactNode } from 'react';
import { Card, CardBody, CardFooter, CardHeader, Cluster, Code, Grid, Heading, Icon, Stack, Text } from '@mod-0-dev/pixel-perfect';

import { ArrowRightGlyph, GridGlyph, SlidersGlyph, UserGlyph } from './glyphs';

/*
 * The examples' index. A Server Component: each example is a Card that is a
 * link (`asChild` onto next/link, Card.md), and the grid fits as many 18rem
 * columns as the page has room for.
 */

const EXAMPLES: ReadonlyArray<{ href: string; title: string; summary: string; parts: string[]; glyph: ReactNode }> = [
  {
    href: '/examples/settings',
    title: 'Settings',
    summary: 'Account settings: a sidebar of sections, a profile form that saves, and switches that apply at once.',
    parts: ['AppShell', 'NavSidebar', 'PageHeader', 'Form', 'Switch', 'Progress'],
    glyph: <SlidersGlyph />,
  },
  {
    href: '/examples/sign-up',
    title: 'Sign-up',
    summary: 'A centred sign-up card under a stepper, with the error summary a failed submit brings.',
    parts: ['Container', 'Stepper', 'Card', 'Form', 'Field', 'Checkbox'],
    glyph: <UserGlyph />,
  },
  {
    href: '/examples/dashboard',
    title: 'Dashboard',
    summary: 'A release dashboard: four stat cards, then a table of deploys you can filter, sort and page.',
    parts: ['Grid', 'Tabs', 'Toolbar', 'Table', 'Pagination', 'EmptyState'],
    glyph: <GridGlyph />,
  },
];

export default function ExamplesIndex() {
  return (
    <>
      <h1>Examples</h1>
      <p>
        Three screens built from the library and nothing else. Each sits on a stage: drag its edge, or pick
        Phone, Tablet or Full, and watch every part answer to the width it was given &mdash; never the
        window.
      </p>

      <Grid minItemInlineSize="18rem" gap="4" asChild>
        <nav aria-label="Examples">
          {EXAMPLES.map((example) => (
            <Card key={example.href} asChild>
              <NextLink href={example.href}>
                <CardHeader>
                  <Cluster gap="3">
                    <Icon decorative size="md">
                      {example.glyph}
                    </Icon>
                    <Heading level={2} size="sm">
                      {example.title}
                    </Heading>
                  </Cluster>
                </CardHeader>
                <CardBody>
                  <Stack gap="3">
                    <Text size="sm" tone="muted">
                      {example.summary}
                    </Text>
                    <Cluster gap="1">
                      {example.parts.map((part) => (
                        <Code key={part} size="sm">
                          {part}
                        </Code>
                      ))}
                    </Cluster>
                  </Stack>
                </CardBody>
                <CardFooter>
                  <Cluster justify="between" gap="2">
                    <Text size="sm" weight="medium">
                      Open the {example.title.toLowerCase()} screen
                    </Text>
                    <Icon decorative size="sm">
                      <ArrowRightGlyph />
                    </Icon>
                  </Cluster>
                </CardFooter>
              </NextLink>
            </Card>
          ))}
        </nav>
      </Grid>
    </>
  );
}
