import { VisuallyHidden } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

/**
 * There is nothing to see, which is the point. Each cell renders a control
 * whose accessible name exists only inside a VisuallyHidden; inspect the
 * accessibility tree, or tab to the button with a screen reader running.
 */
export default function VisuallyHiddenPage() {
  return (
    <>
      <h1>1.4 VisuallyHidden</h1>
      <p>
        Content for assistive technology only. The button below has the accessible name
        &ldquo;Close dialog&rdquo; and no visible text; the second cell hides an entire heading.
      </p>

      <section>
        <h2>Icon-only control with a hidden name</h2>
        <Matrix>
          <button type="button" className="demo-button">
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <VisuallyHidden>Close dialog</VisuallyHidden>
          </button>
        </Matrix>
      </section>

      <section>
        <h2>asChild — a hidden heading</h2>
        <p>The heading is in the document outline and nowhere on screen.</p>
        <Matrix>
          <div className="demo-box">
            <VisuallyHidden asChild>
              <h3>Section landmark for screen readers</h3>
            </VisuallyHidden>
            Visible content follows the hidden heading.
          </div>
        </Matrix>
      </section>
    </>
  );
}
