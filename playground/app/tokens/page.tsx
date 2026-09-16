const HUES = ['neutral', 'accent', 'danger', 'success', 'warning'] as const;
const STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

const SPACE = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;
const RADIUS = ['1', '2', '3', '4', '5', 'full'] as const;
const FONT_SIZE = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

function Ramps({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <div
      className="matrix__theme"
      data-pp-theme={theme}
      style={{ gap: 'var(--pp-space-3)' }}
    >
      <h3 className="matrix__theme-name">{theme}</h3>
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
        <div className="matrix">
          <Ramps theme="light" />
          <Ramps theme="dark" />
        </div>
      </section>

      <section>
        <h2>Tones</h2>
        <p>
          Each block below sets only <code>data-pp-tone</code>. Nothing else changes —
          the component CSS is identical.
        </p>
        <div className="matrix">
          {(['light', 'dark'] as const).map((theme) => (
            <div className="matrix__theme" key={theme} data-pp-theme={theme}>
              <h3 className="matrix__theme-name">{theme}</h3>
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
        <div className="matrix">
          <div className="matrix__theme">
            <h3 className="matrix__theme-name">space</h3>
            <div className="scale">
              {SPACE.map((s) => (
                <div className="scale__row" key={s}>
                  <span>--pp-space-{s}</span>
                  <div className="scale__bar" style={{ width: `var(--pp-space-${s})` }} />
                </div>
              ))}
            </div>
          </div>

          <div className="matrix__theme">
            <h3 className="matrix__theme-name">radius</h3>
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

          <div className="matrix__theme">
            <h3 className="matrix__theme-name">type</h3>
            <div className="scale">
              {FONT_SIZE.map((f) => (
                <div className="scale__row" key={f}>
                  <span>--pp-font-size-{f}</span>
                  <span style={{ fontSize: `var(--pp-font-size-${f})`, color: 'var(--pp-color-text)' }}>
                    Pixel perfect
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
