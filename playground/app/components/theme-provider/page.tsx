/*
 * A Server Component. The provider is the layout's — one per document,
 * spec §1 — so this page has nothing to mount; it reads and sets the one
 * above it through `useTheme()` in Demos.tsx.
 */
import { Matrix } from '../../../harness/Matrix';
import { Readout } from './Demos';

export default function ThemeProviderPage() {
  return (
    <>
      <h1>6.1 ThemeProvider</h1>
      <p>
        Decides what <code>data-pp-theme</code> on <code>&lt;html&gt;</code> says &mdash; nothing,{' '}
        <code>light</code> or <code>dark</code> &mdash; and says it before the first paint, with an
        inline script rendered ahead of the page. <code>system</code> is the absence of the
        attribute: the tokens follow <code>prefers-color-scheme</code> on their own. The choice is
        kept in <code>localStorage</code> and followed across tabs; an app that keeps it itself
        passes <code>value</code> and gets <code>onValueChange</code>.
      </p>
      <p>
        This playground is themed by it: the switcher in the chrome above reads and sets the same
        provider these buttons do. Nothing is rendered by the provider but the script, so there is
        nothing to size &mdash; the readout below is a consumer.
      </p>

      <section>
        <h2>At every width</h2>
        <p>
          One provider, three readouts. <em>Showing</em> is <code>resolvedTheme</code>: what the
          page is in, which under <code>system</code> is the operating system&rsquo;s answer, read
          after mount.
        </p>
        <Matrix>
          <Readout />
        </Matrix>
      </section>
    </>
  );
}
