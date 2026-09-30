/*
 * A Server Component page; KeyHints and its demo are client components (a
 * portal, document listeners, state). NOTHING HERE WRITES AN ID (D-035 §1).
 */
import { Editor } from './Demos';

export default function KeyHintsPage() {
  return (
    <>
      <h1>6.7 KeyHints</h1>
      <p>
        Three gestures for the reader who prefers the keyboard. Hold a key to see every control&rsquo;s
        shortcut drawn on the control; press a key to label every control on screen and type the label to
        focus it; press a key for the sheet of every shortcut. A shortcut is declared on its control with{' '}
        <code>data-pp-hotkey</code> or registered as a command with <code>useKeyHint</code>. Nothing changes
        what a component does while a key is held: the hints are a picture, and every gesture is a shortcut
        into something Tab already reaches.
      </p>

      <section data-testid="key-hints-editor">
        <h2>An editor under KeyHints</h2>
        <p>
          <code>revealKey=&quot;Alt&quot;</code>; the jump and help keys at their defaults, <code>f</code> and{' '}
          <code>?</code>. The provider has no box: the card is the page&rsquo;s.
        </p>
        {/* No Matrix: the provider has no box, and one provider per page (spec: one registry per app). */}
        <div style={{ maxInlineSize: '40rem' }}>
          <Editor />
        </div>
      </section>
    </>
  );
}
