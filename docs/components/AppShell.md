# AppShell

The frame a layout wraps its pages in: header, sidebar, main, footer, and a
skip link first. Spec: [`AppShell.md`](../specs/AppShell.md).

```tsx
import { AppShell } from 'pixel-perfect';
```

A Server Component. `header`, `sidebar` and `footer` are slots;
`children` is the page and renders in `<main>`. The middle row is
[`Split`](Split.md), so the sidebar stacks above the content when the
shell is narrow — by the shell's own width, never the viewport's. The
skip link is rendered first, hidden until focused, and moves focus to the
content.

**One per page.** One `<main>`, one `banner`, one `contentinfo`, one skip
link: the frame, not a panel.

## Usage

```tsx
// app/layout.tsx
import { AppShell, Cluster, Container, Text, ThemeToggle } from 'pixel-perfect';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      sticky
      header={
        <Cluster justify="between" align="center">
          <Brand />
          <ThemeToggle />
        </Cluster>
      }
      sidebar={<nav aria-label="Main">…</nav>}
      footer={<Text size="sm" tone="muted">© Acme</Text>}
    >
      <Container size="lg">{children}</Container>
    </AppShell>
  );
}
```

```css
/* Your stylesheet, once. The shell fills the block size its parent gives
   it; the viewport is yours to give. */
html, body { block-size: 100%; }
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `header` | `ReactNode` | — | In `<header>` (`banner`) |
| `sidebar` | `ReactNode` | — | In the Split's sidebar; bring your own `<nav>` |
| `footer` | `ReactNode` | — | In `<footer>` (`contentinfo`) |
| `children` | `ReactNode` | — | The page, in `<main>` |
| `skipLinkLabel` | `string` | `'Skip to content'` | |
| `sidebarInlineSize` | `string` | `'16rem'` | Split's |
| `collapseBelow` | `'sm' \| 'md' \| 'lg' \| 'never'` | `'md'` | Split's: below it the sidebar stacks |
| `sticky` | `boolean` | `false` | The header stays in view |

`ref`, `className`, `style` and the rest go to the root.

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-app-shell-header-bg` | `--pp-color-bg-page` | Header surface |
| `--pp-app-shell-header-padding-block` / `-inline` | `--pp-space-3` / `--pp-space-5` | |
| `--pp-app-shell-sidebar-bg` | `--pp-color-bg-sunken` | Sidebar surface |
| `--pp-app-shell-sidebar-padding` | `--pp-space-4` | |
| `--pp-app-shell-footer-padding-block` / `-inline` | `--pp-space-3` / `--pp-space-5` | |
| `--pp-app-shell-hairline` | `--pp-color-border-subtle` | Under the header, over the footer |
| `--pp-split-sidebar-inline-size`, `--pp-split-gap` | Split's | The middle row |

## Don't

```tsx
// ✗ A shell inside a shell, or two on a page. One <main>; one skip link.
<AppShell><AppShell>…</AppShell></AppShell>

// ✗ A gutter on the shell. Measure and gutter are Container's, inside main;
//   a full-bleed page wants none.
<AppShell style={{ padding: 24 }}>

// ✗ Making main scroll to get an "app frame". <main> becomes the page's
//   scroll container: sticky, scroll restoration and the toast region's
//   relationship to the page all break. Let the page scroll.
<AppShell style={{ blockSize: '100vh', overflow: 'hidden' }}>

// ✗ Wrapping the sidebar's <nav> in another landmark. The slot is a box.
<AppShell sidebar={<aside><nav>…</nav></aside>}>
```
