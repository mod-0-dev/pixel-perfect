import fs from 'node:fs';
import path from 'node:path';

import type { Metadata } from 'next';

import { Markdown, docsLinkResolver } from '../../harness/Markdown';
import '../docs/docs.css';

/**
 * The constitution, `docs/RULES.md`, drawn by the same renderer as the
 * component docs. The file opens with its own `#` heading, which is the
 * page's h1; its links resolve from `docs/`.
 */

export const metadata: Metadata = {
  title: 'Rules — pixel-perfect',
  description: 'The ground rules every component is held to: sizing, margins, tokens, state, API, accessibility.',
};

const resolveLink = docsLinkResolver('docs');

export default function RulesPage() {
  const source = fs.readFileSync(path.join(process.cwd(), '..', 'docs', 'RULES.md'), 'utf8');

  return (
    <article className="doc">
      <Markdown source={source} resolveLink={resolveLink} />
    </article>
  );
}
