import path from 'node:path';

import { marked, type MarkedToken, type Token, type Tokens } from 'marked';
import NextLink from 'next/link';
import {
  Code,
  CodeBlock,
  Heading,
  Kbd,
  Link,
  Separator,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  type HeadingLevel,
  type HeadingSize,
  type Space,
  type TableAlign,
} from 'pixel-perfect';
import { Fragment, type ReactNode } from 'react';

import { COMPONENTS } from '../app/components/registry';

/**
 * The repository's Markdown, drawn by the library. A Server Component: the
 * source is tokenized with `marked.lexer` and every token becomes a React
 * element built from pixel-perfect's own parts — `Heading`, `Text`, `Code`,
 * `CodeBlock`, `Table`, `Link`, `Separator`, `Kbd` — so a doc page is also a
 * page of the components it documents. No HTML string is ever produced, and
 * none is ever injected: raw HTML in the source is reduced to its text,
 * except `<kbd>`, which is a component here, and `<br>`.
 *
 * THE RHYTHM IS `gap`, NEVER MARGIN (RULES §2). The flat token list is
 * folded into an outline — a heading owns what follows it until the next
 * heading of its depth or shallower — and every level is a `Stack`: blocks
 * one step apart, sections further. A thematic break written just before a
 * heading is drawn as that section's top rule, so it sits the same distance
 * from the heading wherever it appears.
 */

export interface MarkdownProps {
  source: string;
  /** Maps an href as written in the source to where it should go from this page. */
  resolveLink: (href: string) => string;
}

export function Markdown({ source, resolveLink }: MarkdownProps) {
  const tokens = marked.lexer(source);
  const ctx: Context = { resolveLink, slugs: new Map(), labels: regionLabels(tokens), h1: false };
  return renderSection(outline(tokens), ctx, 'doc');
}

// ---------------------------------------------------------------------------
// Links

const REPOSITORY = 'https://github.com/mod-0-dev/pixel-perfect/blob/main/';

/**
 * A resolver for Markdown that lives at `fromDir` (repository-relative, e.g.
 * `docs/components`). Paths are resolved the way GitHub resolves them — from
 * the file's directory, or from the repository root when they start with
 * `/` — then: a component doc whose name is in the registry → its docs page;
 * `docs/RULES.md` → `/rules`; anything else in the repository → the file on
 * GitHub. Absolute URLs and in-page `#anchors` are returned as written.
 */
export function docsLinkResolver(fromDir: string): (href: string) => string {
  return (href) => {
    if (href.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith('//')) return href;

    const hashAt = href.indexOf('#');
    const target = hashAt === -1 ? href : href.slice(0, hashAt);
    const hash = hashAt === -1 ? '' : href.slice(hashAt);
    const file = path.posix.normalize(target.startsWith('/') ? target.slice(1) : path.posix.join(fromDir, target));
    if (file.startsWith('../')) return href;

    const doc = /^docs\/components\/([^/]+)\.md$/.exec(file);
    const entry = doc ? COMPONENTS.find(({ name }) => name === doc[1]) : undefined;
    if (entry) return `/docs/${entry.slug}${hash}`;
    if (file === 'docs/RULES.md') return `/rules${hash}`;
    return `${REPOSITORY}${file}${hash}`;
  };
}

// ---------------------------------------------------------------------------
// The outline

interface Section {
  /** 0 for the document itself. */
  depth: number;
  heading?: Tokens.Heading;
  /** A thematic break was written just before the heading. */
  rule: boolean;
  blocks: MarkedToken[];
  children: Section[];
}

function outline(tokens: Token[]): Section {
  const root: Section = { depth: 0, rule: false, blocks: [], children: [] };
  const open: Section[] = [root];
  const blocks = (tokens as MarkedToken[]).filter(isContent);
  let rule = false;

  blocks.forEach((token, index) => {
    if (token.type === 'heading') {
      while (open.length > 1 && open[open.length - 1].depth >= token.depth) open.pop();
      const section: Section = { depth: token.depth, heading: token, rule, blocks: [], children: [] };
      open[open.length - 1].children.push(section);
      open.push(section);
      rule = false;
    } else if (token.type === 'hr' && blocks[index + 1]?.type === 'heading') {
      rule = true;
    } else {
      open[open.length - 1].blocks.push(token);
    }
  });

  return root;
}

/** The space between a section's opening blocks and its subsections, by depth. */
const SECTION_GAP: Partial<Record<number, Space>> = { 0: '7', 1: '7', 2: '6' };

function renderSection(section: Section, ctx: Context, key: string): ReactNode {
  const lead: ReactNode[] = [];
  if (section.rule) lead.push(<Separator key="rule" />);
  if (section.heading) lead.push(renderHeading(section.heading, 'heading', ctx));
  section.blocks.forEach((block, index) => lead.push(renderBlock(block, `block-${index}`, ctx, true)));

  const children = section.children.map((child, index) => renderSection(child, ctx, `section-${index}`));
  if (children.length === 0) {
    return (
      <Stack key={key} gap="4">
        {lead}
      </Stack>
    );
  }
  if (lead.length === 0 && children.length === 1) return children[0];
  return (
    <Stack key={key} gap={SECTION_GAP[section.depth] ?? '5'}>
      {lead.length > 0 ? (
        <Stack key="lead" gap="4">
          {lead}
        </Stack>
      ) : null}
      {children}
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Blocks

interface Context {
  resolveLink: (href: string) => string;
  /** github-slugger's occurrence table, so an anchor written for GitHub lands here too. */
  slugs: Map<string, number>;
  /** The region name of every table and code block, from the heading above it. */
  labels: Map<Token, string>;
  /** The page's one `<h1>` has been drawn; a second `#` is demoted. */
  h1: boolean;
}

/** One `#`, the page's h1; then a step down the scale per level. */
const HEADING_SIZE: Record<HeadingLevel, HeadingSize> = { 1: '2xl', 2: 'lg', 3: 'md', 4: 'sm', 5: 'sm', 6: 'sm' };

function renderHeading(token: Tokens.Heading, key: string, ctx: Context) {
  let level = Math.min(Math.max(token.depth, 1), 6) as HeadingLevel;
  if (level === 1) {
    if (ctx.h1) level = 2;
    ctx.h1 = true;
  }
  return (
    <Heading
      key={key}
      level={level}
      size={HEADING_SIZE[level]}
      id={slug(plainText(token.tokens), ctx.slugs)}
      className="doc__heading"
    >
      {renderInline(token.tokens, ctx)}
    </Heading>
  );
}

/**
 * `top` is a block in a section's own flow, where a paragraph is held to a
 * reading measure by a wrapper of ours: the measure is a parent's decision,
 * never a width on `Text` (RULES §1). Inside a list item or a quote, the
 * list or the quote already holds it.
 */
function renderBlock(token: MarkedToken, key: string, ctx: Context, top: boolean): ReactNode {
  const prose = (children: ReactNode) =>
    top ? (
      <div key={key} className="doc__measure">
        <Text>{children}</Text>
      </div>
    ) : (
      <Text key={key}>{children}</Text>
    );

  switch (token.type) {
    case 'space':
    case 'def':
      return null;
    case 'heading':
      return renderHeading(token, key, ctx);
    case 'paragraph':
    case 'text':
      return prose(token.tokens ? renderInline(token.tokens, ctx) : decodeEntities(token.text));
    case 'code':
      return (
        <CodeBlock
          key={key}
          code={token.text}
          language={token.lang?.trim().split(/\s+/)[0] || undefined}
          label={ctx.labels.get(token) ?? 'Document, code'}
        />
      );
    case 'table':
      return renderTable(token, key, ctx);
    case 'list':
      return renderList(token, key, ctx);
    case 'blockquote':
      return (
        <blockquote key={key} className="doc__quote">
          {renderFlow(token.tokens, ctx, '3')}
        </blockquote>
      );
    case 'hr':
      return <Separator key={key} />;
    /* Raw HTML is never rendered as HTML: a block keeps its text, a comment is nothing. */
    case 'html': {
      const text = decodeEntities(token.text.replace(/<!--[\s\S]*?(?:-->|$)/g, '').replace(/<[^>]*>/g, '')).trim();
      return text ? prose(text) : null;
    }
    default:
      return prose(token.raw);
  }
}

/** Several blocks in a list item or a quote: one apart, or just the one. */
function renderFlow(tokens: Token[], ctx: Context, gap: Space): ReactNode {
  const nodes = (tokens as MarkedToken[]).filter(isContent).map((token, index) => renderBlock(token, `flow-${index}`, ctx, false));
  if (nodes.length <= 1) return nodes[0] ?? null;
  return <Stack gap={gap}>{nodes}</Stack>;
}

function renderList(token: Tokens.List, key: string, ctx: Context) {
  const items = token.items.map((item, index) => <li key={index}>{renderFlow(item.tokens, ctx, '2')}</li>);
  const loose = token.loose ? '' : undefined;
  if (!token.ordered) {
    return (
      <ul key={key} className="doc__list" data-loose={loose}>
        {items}
      </ul>
    );
  }
  const start = typeof token.start === 'number' && token.start !== 1 ? token.start : undefined;
  return (
    <ol key={key} className="doc__list" data-loose={loose} start={start}>
      {items}
    </ol>
  );
}

const ALIGN: Record<'left' | 'center' | 'right', TableAlign> = { left: 'start', center: 'center', right: 'end' };

/** Longer than this, a cell is a sentence rather than a value. */
const LONG_CELL = 40;

/**
 * A cell does not wrap unless it holds prose (Table.md). Here a column wraps
 * when one of its cells runs past `LONG_CELL` characters; a name, a token or
 * a short phrase stays on its line, and the region scrolls instead.
 *
 * A wrapping column gets a floor, set by a box of ours in its header cell
 * (never a width on the library's cell): when the table is wider than its
 * region its columns fall to their min-content, and a prose column's
 * min-content is its longest word — one word a line, rows a screen tall.
 */
function renderTable(token: Tokens.Table, key: string, ctx: Context) {
  const wraps = token.header.map((_, column) =>
    token.rows.some((row) => plainText(row[column]?.tokens).trim().length > LONG_CELL),
  );
  return (
    <Table key={key} aria-label={ctx.labels.get(token) ?? 'Table'}>
      <TableHeader>
        <TableRow>
          {token.header.map((cell, column) => (
            <TableHead key={column} align={cell.align ? ALIGN[cell.align] : undefined}>
              {wraps[column] ? <div className="doc__column">{renderInline(cell.tokens, ctx)}</div> : renderInline(cell.tokens, ctx)}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {token.rows.map((row, index) => (
          <TableRow key={index}>
            {row.map((cell, column) => (
              <TableCell key={column} align={cell.align ? ALIGN[cell.align] : undefined} wrap={wraps[column]}>
                {renderInline(cell.tokens, ctx)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ---------------------------------------------------------------------------
// Inline

function renderInline(tokens: Token[] | undefined, ctx: Context): ReactNode[] {
  const list = (tokens ?? []) as MarkedToken[];
  const out: ReactNode[] = [];
  for (let index = 0; index < list.length; index++) {
    const token = list[index];
    if (token.type !== 'html') {
      out.push(renderSpan(token, index, ctx));
      continue;
    }
    /*
     * marked hands inline HTML over a tag at a time, with the text between
     * as tokens of its own. `<kbd>…</kbd>` is a key and becomes `Kbd`; `<br>`
     * is a break; every other tag is dropped and its text kept.
     */
    const tag = parseTag(token.text);
    if (tag?.name === 'kbd' && !tag.closing) {
      const end = list.findIndex((candidate, at) => {
        if (at <= index || candidate.type !== 'html') return false;
        const closing = parseTag(candidate.text);
        return closing?.name === 'kbd' && closing.closing;
      });
      if (end !== -1) {
        out.push(<Kbd key={index}>{renderInline(list.slice(index + 1, end), ctx)}</Kbd>);
        index = end;
        continue;
      }
    }
    if (tag?.name === 'br') out.push(<br key={index} />);
  }
  return out;
}

function renderSpan(token: MarkedToken, key: number, ctx: Context): ReactNode {
  switch (token.type) {
    case 'text':
      return token.tokens ? <Fragment key={key}>{renderInline(token.tokens, ctx)}</Fragment> : decodeEntities(token.text);
    case 'escape':
      return decodeEntities(token.text);
    case 'strong':
      return <strong key={key}>{renderInline(token.tokens, ctx)}</strong>;
    case 'em':
      return <em key={key}>{renderInline(token.tokens, ctx)}</em>;
    case 'del':
      return <del key={key}>{renderInline(token.tokens, ctx)}</del>;
    /* Code is literal: CommonMark resolves no entity inside it, and marked leaves it as written. */
    case 'codespan':
      return <Code key={key}>{token.text}</Code>;
    case 'br':
      return <br key={key} />;
    case 'link': {
      const href = ctx.resolveLink(token.href);
      const title = token.title ? decodeEntities(token.title) : undefined;
      const children = renderInline(token.tokens, ctx);
      if (href.startsWith('/')) {
        return (
          <Link key={key} asChild className="doc__link">
            <NextLink href={href} title={title}>
              {children}
            </NextLink>
          </Link>
        );
      }
      return (
        <Link key={key} href={href} title={title} className="doc__link">
          {children}
        </Link>
      );
    }
    /* No image is served from the repository here; its description stands in for it. */
    case 'image':
      return decodeEntities(token.text);
    default:
      return token.raw;
  }
}

function parseTag(html: string): { name: string; closing: boolean } | undefined {
  const match = /^<(\/?)([a-z][a-z\d-]*)\b[^>]*>$/i.exec(html.trim());
  return match ? { name: match[2].toLowerCase(), closing: match[1] === '/' } : undefined;
}

// ---------------------------------------------------------------------------
// Text

function isContent(token: MarkedToken): boolean {
  return token.type !== 'space' && token.type !== 'def';
}

/** What a heading or a cell says, without its markup — for an id, a name, a length. */
function plainText(tokens: Token[] | undefined): string {
  return ((tokens ?? []) as MarkedToken[])
    .map((token) => {
      switch (token.type) {
        case 'text':
          return token.tokens ? plainText(token.tokens) : decodeEntities(token.text);
        case 'escape':
        case 'image':
          return decodeEntities(token.text);
        case 'codespan':
          return token.text;
        case 'html':
          return '';
        case 'br':
          return ' ';
        default:
          return 'tokens' in token && Array.isArray(token.tokens) ? plainText(token.tokens) : '';
      }
    })
    .join('');
}

/**
 * GitHub's heading anchors (github-slugger): lower case, everything but
 * letters, marks, numbers, connectors, hyphens and spaces removed, spaces to
 * hyphens, and a repeat numbered. So `Dialog.md#right-to-left-and-the-scrollbar`
 * lands on "Right-to-left, and the scrollbar" here as it does there.
 */
function slug(text: string, occurrences: Map<string, number>): string {
  const original = text.toLowerCase().replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, '').replace(/ /g, '-') || 'section';
  let result = original;
  while (occurrences.has(result)) {
    const count = (occurrences.get(original) ?? 0) + 1;
    occurrences.set(original, count);
    result = `${original}-${count}`;
  }
  occurrences.set(result, 0);
  return result;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  larr: '←',
  rarr: '→',
  times: '×',
  sect: '§',
  copy: '©',
};

/**
 * marked resolves numeric character references in text and leaves named
 * ones as written (its HTML renderer, which is not used here, relies on
 * that). React escapes what it renders, so they are resolved here — once, so
 * `&amp;lt;` stays `&lt;`.
 */
function decodeEntities(text: string): string {
  return text.replace(/&(#\d+|#x[\da-f]+|[a-z][a-z\d]*);/gi, (match, body: string) => {
    if (body[0] !== '#') return NAMED_ENTITIES[body] ?? match;
    const code = body[1] === 'x' || body[1] === 'X' ? Number.parseInt(body.slice(2), 16) : Number.parseInt(body.slice(1), 10);
    return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : '\uFFFD';
  });
}

/**
 * Every table and code block is a named, focusable region, and a page of
 * regions all called "Code" says nothing. Each is named for the heading it
 * sits under, numbered when that heading has more than one.
 */
function regionLabels(tokens: Token[]): Map<Token, string> {
  const groups = new Map<string, { heading: string; tokens: Token[] }>();
  let heading: Tokens.Heading | undefined;
  let headingIndex = 0;

  const walk = (list: Token[]) => {
    for (const token of list as MarkedToken[]) {
      if (token.type === 'heading') {
        heading = token;
        headingIndex++;
      } else if (token.type === 'code' || token.type === 'table') {
        const key = `${headingIndex}:${token.type}`;
        const group = groups.get(key) ?? { heading: heading ? plainText(heading.tokens) : 'Document', tokens: [] };
        group.tokens.push(token);
        groups.set(key, group);
      } else if (token.type === 'blockquote') {
        walk(token.tokens);
      } else if (token.type === 'list') {
        for (const item of token.items) walk(item.tokens);
      }
    }
  };
  walk(tokens);

  const labels = new Map<Token, string>();
  for (const { heading: name, tokens: group } of groups.values()) {
    group.forEach((token, index) => {
      const kind = token.type === 'code' ? 'code' : 'table';
      const numbered = group.length > 1 ? ` ${index + 1} of ${group.length}` : '';
      labels.set(token, kind === 'table' && !numbered ? name : `${name}, ${kind}${numbered}`);
    });
  }
  return labels;
}
