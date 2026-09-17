import { Kbd, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

export default function KbdPage() {
  return (
    <>
      <h1>1.10 Kbd</h1>
      <p>A keycap. Chords are composed from single keys, not configured.</p>

      <section>
        <h2>Single keys and chords</h2>
        <Matrix>
          <div className="stack-tight">
            <div className="row-wrap" style={{ alignItems: 'center' }}>
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
              <Text size="sm" tone="muted">
                open the command palette
              </Text>
            </div>
            <div className="row-wrap" style={{ alignItems: 'center' }}>
              <Kbd>Ctrl</Kbd>
              <Kbd>Shift</Kbd>
              <Kbd>P</Kbd>
            </div>
            <div className="row-wrap" style={{ alignItems: 'center' }}>
              <Kbd>Esc</Kbd>
              <Kbd>↵</Kbd>
              <Kbd>Tab</Kbd>
              <Kbd>Space</Kbd>
            </div>
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Size</h2>
        <Matrix>
          <div className="row-wrap" style={{ alignItems: 'center' }}>
            <Kbd size="sm">S</Kbd>
            <Kbd size="md">M</Kbd>
            <Kbd size="lg">L</Kbd>
            <Kbd size="sm">Esc</Kbd>
            <Kbd size="md">Esc</Kbd>
            <Kbd size="lg">Esc</Kbd>
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Inline in a sentence</h2>
        <Matrix>
          <Text>
            Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to search, or <Kbd size="sm">?</Kbd> for every shortcut.
          </Text>
        </Matrix>
      </section>
    </>
  );
}
