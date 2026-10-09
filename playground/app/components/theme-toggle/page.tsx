/*
 * A Server Component: `ThemeToggle` is a client component that reads the
 * layout's provider, so nothing here needs a hook. NOTHING HERE WRITES AN ID
 * (D-035 §1): the browser suite finds its sections by `data-testid`.
 */
import { Cluster, IconButton, Stack, Text, ThemeToggle } from '@mod-0-dev/pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

function Gear() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  );
}

export default function ThemeTogglePage() {
  return (
    <>
      <h1>6.2 ThemeToggle</h1>
      <p>
        A square button that flips the page between light and dark. Both faces are in the DOM &mdash;
        a sun and &ldquo;Switch to dark theme&rdquo;, a moon and &ldquo;Switch to light theme&rdquo;
        &mdash; and the stylesheet displays one, chosen from <code>&lt;html&gt;</code>&rsquo;s theme
        or, with none set, from the system&rsquo;s preference: the tokens&rsquo; own four scopes, read
        from the toggle&rsquo;s side. So the face is right before React is, and it cannot disagree
        with the page.
      </p>
      <p>
        Pressing any toggle below flips this playground, the same provider the chrome&rsquo;s
        switcher sets. The way back to <em>System</em> is that switcher: three choices are a
        different control, and the docs page gives it as a recipe.
      </p>

      <section data-testid="theme-toggle-sizes">
        <h2>Sizes, beside an IconButton of each</h2>
        <p>
          The same box: Button&rsquo;s element, squared by IconButton&rsquo;s class. <code>ghost</code>{' '}
          by default, as IconButton is.
        </p>
        <Matrix>
          <Cluster gap="3" align="center">
            <ThemeToggle size="sm" />
            <IconButton size="sm" label="Settings">
              <Gear />
            </IconButton>
            <ThemeToggle size="md" />
            <IconButton size="md" label="Settings">
              <Gear />
            </IconButton>
            <ThemeToggle size="lg" />
            <IconButton size="lg" label="Settings">
              <Gear />
            </IconButton>
          </Cluster>
        </Matrix>
      </section>

      <section data-testid="theme-toggle-variants">
        <h2>Variants and tones</h2>
        <Matrix>
          <Cluster gap="3" align="center">
            <ThemeToggle variant="outline" />
            <ThemeToggle variant="solid" tone="accent" />
            <ThemeToggle variant="plain" />
            <ThemeToggle disabled />
          </Cluster>
        </Matrix>
      </section>

      <section data-testid="theme-toggle-nested">
        <h2>Inside a themed scope</h2>
        <p>
          The panel is <code>data-pp-theme=&quot;dark&quot;</code> on its own (D-010). The toggle in it
          shows the <em>document&rsquo;s</em> face, because the document is what it controls: on a light
          page it offers dark, whatever surface it sits on.
        </p>
        <Matrix>
            <div data-pp-theme="dark" style={{ padding: 'var(--pp-space-4)', background: 'var(--pp-color-bg-page)', color: 'var(--pp-color-text)', borderRadius: 'var(--pp-radius-2)' }}>
              <Stack gap="2">
                <Text size="sm">A dark panel on the page.</Text>
                <Cluster gap="3" align="center">
                  <ThemeToggle variant="outline" />
                  <Text size="sm" tone="muted">
                    offers the opposite of the page
                  </Text>
                </Cluster>
              </Stack>
            </div>
        </Matrix>
      </section>
    </>
  );
}
