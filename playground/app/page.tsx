import Link from 'next/link';

export default function Home() {
  return (
    <>
      <h1>pixel-perfect</h1>
      <p>
        Every page here renders its subject at three container widths in both themes at once.
        A component that outgrows the box its parent gave it is flagged in red — under the
        sizing contract that is always the component&apos;s bug, never the parent&apos;s.
      </p>
      <nav className="nav">
        <Link href="/tokens">Tokens</Link>
        <Link href="/harness">Harness self-check</Link>
      </nav>
    </>
  );
}
