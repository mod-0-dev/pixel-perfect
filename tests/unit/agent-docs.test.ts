import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

import { buildAgentDocs, rewriteLinks, summaryOf } from '../../scripts/build-agent-docs.mjs';

/**
 * dist/AGENTS.md and the docs beside it are what a consuming app's coding
 * agent reads (D-105). Built into a scratch directory here, so the test
 * needs no `dist/` and cannot pass on a stale one.
 */

const out = mkdtempSync(join(tmpdir(), 'pp-agent-docs-'));
afterAll(() => rmSync(out, { recursive: true, force: true }));
buildAgentDocs(out);

const components = readdirSync('docs/components').filter((name) => name.endsWith('.md'));
const agents = readFileSync(join(out, 'AGENTS.md'), 'utf8');

/** Every relative link in every shipped file, with the file it sits in. */
function relativeLinks() {
  const files = ['AGENTS.md', 'docs/RULES.md', ...components.map((name) => `docs/components/${name}`)];
  return files.flatMap((file) =>
    [...readFileSync(join(out, file), 'utf8').matchAll(/\]\(([^)\s]+)\)/g)]
      .map((m) => m[1] as string)
      .filter((href) => !/^[a-z]+:/i.test(href) && !href.startsWith('#'))
      .map((href) => ({ file, href })),
  );
}

describe('the agent docs shipped in the package', () => {
  it('index every component doc, once, with its opening line', () => {
    for (const name of components) {
      expect(agents, name).toContain(`](docs/components/${name})`);
    }
    expect(agents.match(/^- \[`/gm)).toHaveLength(components.length);
    expect(agents).not.toContain('<!-- COMPONENT INDEX');
  });

  it('leave no link an agent can follow into a file that did not ship', () => {
    const dead = relativeLinks().filter(({ file, href }) => !existsSync(join(out, dirname(file), href.split('#')[0]!)));
    expect(dead).toEqual([]);
  });

  it('say which version they describe', () => {
    const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(agents.split('\n')[0]).toBe(`# pixel-perfect ${version} — for the coding agent in your app`);
  });
});

describe('summaryOf', () => {
  it('takes the opening paragraph, without its Spec pointer or link syntax', () => {
    const doc = '# Slider\n\nA single-thumb range control on `<input type="range">`. Spec:\n[`tier-3d.md` §3.15](../specs/tier-3d.md).\n\n## Usage\n';
    expect(summaryOf(doc)).toBe('A single-thumb range control on `<input type="range">`.');
    expect(summaryOf('# X\n\nOn the [same contract](Y.md) as Y.\n')).toBe('On the same contract as Y.');
  });
});

describe('rewriteLinks', () => {
  const shipped = new Set(['docs/RULES.md', 'docs/components/Button.md']);
  it('keeps a link to a shipped file and sends the rest to the repository', () => {
    const doc = '[a](Button.md) [b](../RULES.md#2-no-outer-margins) [c](../specs/Button.md) [d](https://x.dev) [e](#usage)';
    expect(rewriteLinks(doc, 'docs/components/Button.md', shipped)).toBe(
      '[a](Button.md) [b](../RULES.md#2-no-outer-margins) ' +
        '[c](https://github.com/mod-0-dev/pixel-perfect/blob/main/docs/specs/Button.md) [d](https://x.dev) [e](#usage)',
    );
  });
});
