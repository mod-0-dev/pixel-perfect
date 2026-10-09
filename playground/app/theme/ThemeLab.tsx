'use client';

import NextLink from 'next/link';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Cluster,
  CodeBlock,
  Field,
  Grid,
  Input,
  Link,
  Progress,
  Scroller,
  Slider,
  Stack,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
} from '@mod-0-dev/pixel-perfect';
import { createTheme, parseColor, type AccentSummary, type Theme } from '@mod-0-dev/pixel-perfect/theme';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';

/**
 * The theme lab (D-103 §4): the library's own generator and its own contrast
 * checks, running in the browser on every move of a slider.
 *
 * The stylesheet `createTheme` returns is put in <head> as-is, so the page
 * wears it — chrome, previews, everything — exactly as an app that imported
 * the CLI's file would. It goes in from an effect rather than the render:
 * the first render is the library's own accent, which the generator
 * reproduces byte for byte, so the server's HTML is already right and there
 * is nothing to hydrate differently.
 */

type Accent = { L: number; C: number; H: number };

/* The library's accent, and the ranges `accentFrom` clamps to. */
const LIBRARY: Accent = { L: 0.55, C: 0.17, H: 258 };
const RANGE = { L: [0.25, 0.92], C: [0, 0.37], H: [0, 359] } as const;

const clamp = (v: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, v));
const trim = (n: number, digits: number) => String(Number(n.toFixed(digits)));
const format = ({ L, C, H }: Accent) => `oklch(${trim(L * 100, 1)}% ${trim(C, 3)} ${trim(H, 0)})`;

type Result = { theme: Theme } | { error: string };

function solve(accent: string, tint: boolean): Result {
  try {
    const command = `npx pixel-perfect theme --accent "${accent}"${tint ? ' --neutral accent' : ''} --out src/brand.css`;
    return { theme: createTheme({ accent, ...(tint ? { neutral: 'accent' as const } : {}), command }) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export function ThemeLab() {
  const [accent, setAccent] = useState<Accent>(LIBRARY);
  const [tint, setTint] = useState(false);
  const [text, setText] = useState(format(LIBRARY));
  const [textError, setTextError] = useState<string | null>(null);

  // A slider moves on every input event; the solve (tens of milliseconds)
  // runs on the deferred value, so the thumb never waits for it.
  const input = useMemo(() => ({ accent: format(accent), tint }), [accent, tint]);
  const deferred = useDeferredValue(input);
  const result = useMemo(() => solve(deferred.accent, deferred.tint), [deferred]);
  const css = 'theme' in result ? result.theme.css : null;

  useEffect(() => {
    if (!css) return;
    const style = document.createElement('style');
    style.dataset.themeLab = '';
    style.textContent = css;
    document.head.append(style);
    return () => style.remove();
  }, [css]);

  const move = (patch: Partial<Accent>) => {
    const next = { ...accent, ...patch };
    setAccent(next);
    setText(format(next));
    setTextError(null);
  };

  const type = (value: string) => {
    setText(value);
    const color = parseColor(value);
    if (!color) {
      setTextError('Not a colour. Try #7c3aed, oklch(55% 0.2 293) or a hue angle like 293.');
      return;
    }
    setTextError(null);
    setAccent((current) => ({
      L: color.L === undefined ? current.L : clamp(color.L, RANGE.L),
      C: color.C === undefined ? current.C : clamp(color.C, RANGE.C),
      H: Math.round(color.H) % 360,
    }));
  };

  const reset = () => {
    setTint(false);
    move(LIBRARY);
  };

  const command = `npx pixel-perfect theme --accent "${input.accent}"${tint ? ' --neutral accent' : ''} --out src/brand.css`;

  return (
    <>
      <section>
        <h2>Pick</h2>
        <Grid minItemInlineSize="18rem" gap="6" align="start">
          <Stack gap="4">
            <Field label="Colour" description="A hex value, oklch(), or a hue angle." error={textError ?? undefined}>
              <Input value={text} onChange={(event) => type(event.target.value)} spellCheck={false} autoComplete="off" />
            </Field>
            <Field label="Hue">
              <Slider
                min={RANGE.H[0]}
                max={RANGE.H[1]}
                step={1}
                value={accent.H}
                onValueChange={(H) => move({ H })}
                formatOptions={{ style: 'unit', unit: 'degree' }}
              />
            </Field>
            <Field label="Chroma">
              <Slider
                min={RANGE.C[0]}
                max={RANGE.C[1]}
                step={0.005}
                value={accent.C}
                onValueChange={(C) => move({ C })}
                formatOptions={{ maximumFractionDigits: 3 }}
              />
            </Field>
            <Field label="Lightness">
              <Slider
                min={RANGE.L[0]}
                max={RANGE.L[1]}
                step={0.005}
                value={accent.L}
                onValueChange={(L) => move({ L })}
                formatOptions={{ style: 'percent', maximumFractionDigits: 1 }}
              />
            </Field>
            <Field label="Lean the greys toward the accent" orientation="horizontal">
              <Switch checked={tint} onCheckedChange={setTint} />
            </Field>
            <Cluster gap="2">
              <Button variant="outline" onClick={reset}>
                Back to the library&rsquo;s accent
              </Button>
            </Cluster>
          </Stack>
          <Proof result={result} />
        </Grid>
      </section>

      <section>
        <h2>Wearing it</h2>
        <p>
          Both themes side by side. The rest of the page — the chrome included — wears the theme the
          switcher at the top picked, because the stylesheet is on this page exactly as it would be in
          an app.
        </p>
        <Grid minItemInlineSize="20rem" gap="4" align="start">
          <Preview theme="light" />
          <Preview theme="dark" />
        </Grid>
      </section>

      <section>
        <h2>Take it with you</h2>
        <p>
          Generate the file in your app with the same code, then import it after{' '}
          <code>@mod-0-dev/pixel-perfect/styles.css</code>. It sits in the <code>pp.overrides</code> layer and carries
          all four theme scopes, so import order does not matter and light, dark, system and nested
          themes all follow it.
        </p>
        <CodeBlock code={command} language="sh" title="In your app" />
        {css && (
          <Scroller label="brand.css" className="lab__css">
            <CodeBlock code={css} language="css" title="brand.css" />
          </Scroller>
        )}
      </section>
    </>
  );
}

function Proof({ result }: { result: Result }) {
  if ('error' in result) {
    return (
      <Alert tone="danger" title="This accent cannot be solved">
        {result.error}
      </Alert>
    );
  }
  const { checks, accent } = result.theme;
  const ok = checks.failures.length === 0;
  return (
    <Stack gap="4">
      <Alert
        tone={ok ? 'success' : 'danger'}
        title={
          ok
            ? `${checks.checked} of ${checks.checked} assertions pass`
            : `${checks.failures.length} of ${checks.checked} assertions fail`
        }
      >
        {ok ? (
          <Text size="sm">
            Text, fills, control edges and the focus ring, in both themes: the checks the library&rsquo;s
            own tokens pass, run on the stylesheet this page is wearing.
          </Text>
        ) : (
          <Stack gap="1">
            {checks.failures.slice(0, 6).map((failure) => (
              <Text size="sm" key={failure}>
                {failure}
              </Text>
            ))}
          </Stack>
        )}
      </Alert>
      <Fill theme="light" summary={accent.light} />
      <Fill theme="dark" summary={accent.dark} />
    </Stack>
  );
}

/** Where the solid fill landed in one theme, drawn in that theme. */
function Fill({ theme, summary }: { theme: 'light' | 'dark'; summary: AccentSummary }) {
  const moved = Math.abs(summary.landed - summary.started) >= 0.001;
  return (
    <div className="lab__fill-row" data-pp-theme={theme}>
      <div className="lab__fill" aria-hidden="true">
        Aa
      </div>
      <Stack gap="1">
        <Text size="sm" weight="semibold">
          {theme === 'light' ? 'Light' : 'Dark'}: {summary.text} text, {summary.ratio.toFixed(2)}:1
        </Text>
        <Text size="sm" tone="muted">
          <code>{summary.fill}</code>
          {moved ? ` — moved from L ${summary.started} to ${summary.landed} so its text reads.` : ''}
        </Text>
      </Stack>
    </div>
  );
}

const STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

/*
 * The checkable controls and the Slider take no `tone` prop — their root's
 * tone is reserved for `invalid` — so the accent is set on their Field, as
 * their docs say (D-059).
 */
function Preview({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <div className="panel lab__preview" data-pp-theme={theme}>
      <h3 className="panel__name">{theme}</h3>
      <Stack gap="4">
        <Cluster gap="2">
          <Button tone="accent">Publish</Button>
          <Button tone="accent" variant="outline">
            Preview
          </Button>
          <Button tone="accent" variant="ghost">
            Share
          </Button>
          <Button>Cancel</Button>
        </Cluster>
        <Cluster gap="2" align="center">
          <Badge tone="accent">New</Badge>
          <Badge tone="accent" variant="solid">
            Beta
          </Badge>
          <Link asChild>
            <NextLink href="/tokens">See every token</NextLink>
          </Link>
        </Cluster>
        <Field label="Email me about releases" orientation="horizontal" data-pp-tone="accent">
          <Checkbox defaultChecked />
        </Field>
        <Field label="Deploy main automatically" orientation="horizontal" data-pp-tone="accent">
          <Switch defaultChecked />
        </Field>
        <Field label="Rollout" data-pp-tone="accent">
          <Slider defaultValue={60} />
        </Field>
        <Progress label="Build" value={64} />
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <Text size="sm">Three releases this week.</Text>
          </TabsContent>
          <TabsContent value="activity">
            <Text size="sm">Nothing new.</Text>
          </TabsContent>
        </Tabs>
        <Alert tone="accent" title="A new version is ready">
          It ships in your colour.
        </Alert>
        <div className="lab__ramp" aria-hidden="true">
          {STEPS.map((step) => (
            <span key={step} style={{ backgroundColor: `var(--pp-palette-accent-${step})` }} />
          ))}
        </div>
      </Stack>
    </div>
  );
}
