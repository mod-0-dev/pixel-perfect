import Link from 'next/link';

import { COMPONENTS } from './components/registry';

export default function Home() {
  return (
    <>
      <h1>pixel-perfect</h1>
      <p>
        Every page here renders its subject at three container widths in both themes at once.
        A component that outgrows the box its parent gave it is flagged in red — under the
        sizing contract that is always the component&apos;s bug, never the parent&apos;s.
      </p>
      <nav className="nav" aria-label="Foundations">
        <Link href="/tokens">Tokens</Link>
        <Link href="/harness">Harness self-check</Link>
      </nav>
      <h2>Components</h2>
      <nav className="nav" aria-label="Components">
        {COMPONENTS.map((entry) => (
          <Link key={entry.slug} href={`/components/${entry.slug}`}>
            {entry.tier} {entry.name}
          </Link>
        ))}
      </nav>
    </>
  );
}
