const HUES = ['neutral', 'accent', 'danger', 'success', 'warning'] as const;

/* The three steps solved for a contrast target that are NOT ramp positions.
   `focus` is >= 3:1 on steps 1, 2 and 3 of every hue since 0.11; the two edges
   have been >= 3:1 and >= 4.5:1 on steps 1-3 since D-050. */
const SOLVED = [
  { step: 'focus', label: 'focus  >= 3:1', kind: 'ring' },
  { step: 'edge', label: 'edge  >= 3:1', kind: 'line' },
  { step: 'edge-strong', label: 'edge-strong  >= 4.5:1', kind: 'line' },
] as const;
const STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

const SPACE = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;
const SIZE = ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] as const;
const RADIUS = ['1', '2', '3', '4', '5', 'full'] as const;
const FONT_SIZE = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

function Ramps({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <div className="panel" data-pp-theme={theme}>
      <h3 className="panel__name">{theme}</h3>
      {HUES.map((hue) => (
        <div className="ramp" key={hue}>
          <div className="ramp__name">{hue}</div>
          {STEPS.map((step) => (
            <div
              className="ramp__step"
              key={step}
              style={{ backgroundColor: `var(--pp-palette-${hue}-${step})` }}
              title={`--pp-palette-${hue}-${step}`}
            >
              {step}
            </div>
          ))}
          <div
            className="ramp__solid"
            style={{
              backgroundColor: `var(--pp-palette-${hue}-9)`,
              color: `var(--pp-palette-${hue}-on-solid)`,
            }}
          >
            on-solid
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * THE SOLVED OFF-RAMP STEPS, WHICH THIS PAGE HAS NEVER DRAWN (0.11).
 *
 * The paragraph above says "the focus ring are solved for their contrast
 * targets" and the ramps below render steps 1-12 and `on-solid` — so the three
 * steps that carry an explicit WCAG obligation were the only ones the token
 * gallery did not show. A change to any of them moved no pixel in any of the 37
 * screenshots, which is the same failure mode 0.11 itself was about: a value
 * nothing looked at.
 *
 * Each swatch is drawn ON STEP 3, the surface each step is hardest against, and
 * as a line rather than a fill, because a line is what all three of them are.
 */
function SolvedSteps({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <div className="panel" data-pp-theme={theme}>
      <h3 className="panel__name">{theme}</h3>
      {HUES.map((hue) => (
        <div className="solved" key={hue}>
          <div className="ramp__name">{hue}</div>
          {SOLVED.map(({ step, label, kind }) => (
            <div
              className="solved__cell"
              key={step}
              style={{ backgroundColor: `var(--pp-palette-${hue}-3)` }}
            >
              <span
                className="solved__mark"
                data-kind={kind}
                style={
                  kind === 'ring'
                    ? { outlineColor: `var(--pp-palette-${hue}-${step})` }
                    : { borderColor: `var(--pp-palette-${hue}-${step})` }
                }
              />
              <span className="solved__label">{label}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function TokensPage() {
  return (
    <>
      <h1>Tokens</h1>
      <p>
        Twelve steps per hue per theme. Steps 8 through 12 and the focus ring are solved
        for their contrast targets rather than picked by eye, and every ratio is
        re-derived from this committed CSS by <code>npm run lint:contrast</code>.
      </p>

      <section>
        <h2>Palette</h2>
        <div className="stack">
          <Ramps theme="light" />
          <Ramps theme="dark" />
        </div>
      </section>

      <section>
        <h2>Solved steps</h2>
        <p>
          Three steps carry an explicit WCAG obligation and none of them is a ramp
          position — hanging a contrast requirement on a ramp step tears a hole in the
          ramp (D-050). Each is drawn on <code>step 3</code>, the surface it is hardest
          against, and as a line, because a line is what all three are. Until{' '}
          <strong>0.11</strong> this page rendered none of them, so the only tokens with
          a stated obligation were the only ones no screenshot could regress.
        </p>
        <div className="scales">
          <SolvedSteps theme="light" />
          <SolvedSteps theme="dark" />
        </div>
      </section>

      <section>
        <h2>Tones</h2>
        <p>
          Each block below sets only <code>data-pp-tone</code>. Nothing else changes —
          the component CSS is identical.
        </p>
        <div className="scales">
          {(['light', 'dark'] as const).map((theme) => (
            <div className="panel" key={theme} data-pp-theme={theme}>
              <h3 className="panel__name">{theme}</h3>
              {(['neutral', 'accent', 'danger', 'success', 'warning'] as const).map((tone) => (
                <div className="demo-box" data-pp-tone={tone} key={tone}>
                  <strong>{tone}</strong> — muted text on a tone background, plus a solid
                  chip:{' '}
                  <span
                    style={{
                      backgroundColor: 'var(--pp-tone-solid)',
                      color: 'var(--pp-tone-on-solid)',
                      padding: '2px 8px',
                      borderRadius: 'var(--pp-radius-full)',
                      fontSize: 'var(--pp-font-size-1)',
                    }}
                  >
                    solid
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Scales</h2>
        <div className="scales">
          <div className="panel">
            <h3 className="panel__name">space</h3>
            <div className="scale">
              {SPACE.map((s) => (
                <div className="scale__row" key={s}>
                  <span>--pp-space-{s}</span>
                  <div className="scale__bar" style={{ width: `var(--pp-space-${s})` }} />
                </div>
              ))}

              {SIZE.map((s) => (
                <div className="scale__row" key={s}>
                  <span>--pp-size-{s}</span>
                  <div className="scale__bar" style={{ width: `var(--pp-size-${s})` }} />
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <h3 className="panel__name">radius</h3>
            <div className="scale">
              {RADIUS.map((r) => (
                <div className="scale__row" key={r}>
                  <span>--pp-radius-{r}</span>
                  <div
                    style={{
                      width: 'var(--pp-space-8)',
                      height: 'var(--pp-space-5)',
                      borderRadius: `var(--pp-radius-${r})`,
                      backgroundColor: 'var(--pp-tone-solid)',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <h3 className="panel__name">type</h3>
            <div className="scale">
              {FONT_SIZE.map((f) => (
                <div className="scale__row" key={f}>
                  <span>--pp-font-size-{f}</span>
                  <span className="scale__sample" style={{ fontSize: `var(--pp-font-size-${f})` }}>
                    Pixel
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
