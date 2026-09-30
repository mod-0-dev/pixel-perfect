/*
 * A Server Component page; the Toolbar is a client component that manages
 * the tab stop. Every Toggle here is uncontrolled.
 *
 * NOTHING HERE WRITES AN ID (D-035 §1): the browser suite finds its
 * sections by `data-testid`.
 */
import { Button, ButtonGroup, IconButton, Input, Separator, Toggle, Toolbar } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

function LinkGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </svg>
  );
}

function ImageGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="m21 16-5-5-9 9" />
    </svg>
  );
}

function CodeGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m8 7-5 5 5 5" />
      <path d="m16 7 5 5-5 5" />
    </svg>
  );
}

function PointerGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3l14 8-6 2-3 6-5-16Z" />
    </svg>
  );
}

function PenGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20l4-1L19 8l-3-3L5 16l-1 4Z" />
    </svg>
  );
}

function ShapeGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="3" />
    </svg>
  );
}

function TextGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 6h14M12 6v13" />
    </svg>
  );
}

function Formatting({ label = 'Formatting', field = true }: { label?: string; field?: boolean }) {
  return (
    <Toolbar label={label}>
      <ButtonGroup label="Style">
        <Toggle size="sm" aria-label="Bold" defaultPressed>
          <strong>B</strong>
        </Toggle>
        <Toggle size="sm" aria-label="Italic">
          <em>I</em>
        </Toggle>
        <Toggle size="sm" aria-label="Underline">
          <u>U</u>
        </Toggle>
      </ButtonGroup>
      <Separator orientation="vertical" />
      <IconButton size="sm" label="Insert link">
        <LinkGlyph />
      </IconButton>
      <IconButton size="sm" label="Insert image">
        <ImageGlyph />
      </IconButton>
      <IconButton size="sm" label="Insert code">
        <CodeGlyph />
      </IconButton>
      <Separator orientation="vertical" />
      {field ? <Input size="sm" type="search" aria-label="Find in document" placeholder="Find" /> : null}
      <Button size="sm" variant="outline">
        Publish
      </Button>
    </Toolbar>
  );
}

export default function ToolbarPage() {
  return (
    <>
      <h1>6.6 Toolbar</h1>
      <p>
        A named row of controls reached with one Tab and walked with the arrow keys. The toolbar finds
        its controls in its own subtree &mdash; no wrapper part &mdash; and keeps one of them as the tab
        stop: the one focused last, else the first. Inside a text field the arrows stay the caret&rsquo;s.
        It lays the controls out in a wrapping row with a gap, or a column; the controls are yours.
      </p>

      <section data-testid="toolbar-formatting">
        <h2>Formatting</h2>
        <p>A ButtonGroup of Toggles, two Separators, three IconButtons, a search field and a Button. The row wraps.</p>
        <Matrix>
          <Formatting />
        </Matrix>
      </section>

      <section data-testid="toolbar-tab">
        <h2>One tab stop</h2>
        <p>Tab from the button before lands on the toolbar&rsquo;s remembered control; Tab again leaves for the button after.</p>
        <Matrix>
          <div style={{ display: 'grid', gap: '0.5rem', justifyItems: 'start' }}>
            <Button size="sm" variant="ghost" data-role="before">
              Before
            </Button>
            <Formatting label="Editing" field={false} />
            <Button size="sm" variant="ghost" data-role="after">
              After
            </Button>
          </div>
        </Matrix>
      </section>

      <section data-testid="toolbar-vertical">
        <h2>Vertical</h2>
        <p>
          A column of tools, <code>orientation=&quot;vertical&quot;</code>: Down and Up move, and{' '}
          <code>loop={'{false}'}</code> stops at the ends.
        </p>
        <Matrix>
          <Toolbar label="Tools" orientation="vertical" loop={false}>
            <IconButton label="Select">
              <PointerGlyph />
            </IconButton>
            <IconButton label="Draw">
              <PenGlyph />
            </IconButton>
            <IconButton label="Shape">
              <ShapeGlyph />
            </IconButton>
            <IconButton label="Text">
              <TextGlyph />
            </IconButton>
          </Toolbar>
        </Matrix>
      </section>

      <section data-testid="toolbar-rtl">
        <h2>Right to left</h2>
        <p>The row runs from the right; ArrowRight goes to the control on the right.</p>
        <Matrix>
          <div dir="rtl">
            <Toolbar label="تنسيق">
              <ButtonGroup label="نمط">
                <Toggle size="sm" aria-label="عريض" defaultPressed>
                  <strong>B</strong>
                </Toggle>
                <Toggle size="sm" aria-label="مائل">
                  <em>I</em>
                </Toggle>
              </ButtonGroup>
              <Separator orientation="vertical" />
              <IconButton size="sm" label="إدراج رابط">
                <LinkGlyph />
              </IconButton>
              <IconButton size="sm" label="إدراج صورة">
                <ImageGlyph />
              </IconButton>
              <Button size="sm" variant="outline">
                نشر
              </Button>
            </Toolbar>
          </div>
        </Matrix>
      </section>
    </>
  );
}
