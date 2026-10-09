import fs from 'node:fs';
import path from 'node:path';

import type { Metadata } from 'next';
import NextLink from 'next/link';
import { notFound } from 'next/navigation';
import { Cluster, Code, Heading, Link, Stack, Text, VisuallyHidden } from '@mod-0-dev/pixel-perfect';

import { Markdown, docsLinkResolver } from '../../../harness/Markdown';
import { COMPONENTS, type ComponentEntry } from '../../components/registry';
import '../docs.css';

/**
 * A component's documentation: `docs/components/<Name>.md`, the file the
 * repository already keeps, drawn by the library (harness/Markdown.tsx).
 * One page per registry entry, prerendered; any other slug is a 404.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return COMPONENTS.map(({ slug }) => ({ slug }));
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const entry = COMPONENTS.find((candidate) => candidate.slug === slug);
  return entry ? { title: `${entry.name} — pixel-perfect`, description: entry.summary } : {};
}

const resolveLink = docsLinkResolver('docs/components');

/** `process.cwd()` is `playground/` under both `next dev` and `next build`. */
function readDoc(name: string): string | null {
  try {
    return fs.readFileSync(path.join(process.cwd(), '..', 'docs', 'components', `${name}.md`), 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

function Neighbour({ entry, rel }: { entry: ComponentEntry; rel: 'prev' | 'next' }) {
  return (
    <Link asChild tone="neutral" underline="hover">
      <NextLink href={`/docs/${entry.slug}`} rel={rel}>
        {rel === 'prev' ? <span aria-hidden="true">←{'\u00a0'}</span> : null}
        <VisuallyHidden>{rel === 'prev' ? 'Previous: ' : 'Next: '}</VisuallyHidden>
        {entry.name}
        {rel === 'next' ? <span aria-hidden="true">{'\u00a0'}→</span> : null}
      </NextLink>
    </Link>
  );
}

export default async function DocPage({ params }: { params: Params }) {
  const { slug } = await params;
  const index = COMPONENTS.findIndex((candidate) => candidate.slug === slug);
  if (index === -1) notFound();

  const entry = COMPONENTS[index];
  const previous = index > 0 ? COMPONENTS[index - 1] : undefined;
  const next = index < COMPONENTS.length - 1 ? COMPONENTS[index + 1] : undefined;
  const source = readDoc(entry.name);

  return (
    <article className="doc">
      <Stack gap="4">
        <Text asChild size="sm">
          <nav aria-label="Component documentation">
            <Cluster gap="3" justify="between">
              {/* One run of text, so the tier stays with the link when the line wraps. */}
              <span>
                <span className="doc__tier">{entry.tier}</span>
                <Link asChild underline="hover">
                  <NextLink href={`/components/${entry.slug}`}>
                    Every variant at three widths, both themes<span aria-hidden="true">{'\u00a0'}→</span>
                  </NextLink>
                </Link>
              </span>
              <Cluster gap="4">
                {previous ? <Neighbour entry={previous} rel="prev" /> : null}
                {next ? <Neighbour entry={next} rel="next" /> : null}
              </Cluster>
            </Cluster>
          </nav>
        </Text>

        {source === null ? (
          <Stack gap="4">
            <Heading level={1} size="2xl">
              {entry.name}
            </Heading>
            <div className="doc__measure">
              <Text tone="muted">
                {entry.summary} There is no <Code>docs/components/{entry.name}.md</Code> yet; the harness page
                above shows every variant.
              </Text>
            </div>
          </Stack>
        ) : (
          <Markdown source={source} resolveLink={resolveLink} />
        )}
      </Stack>
    </article>
  );
}
