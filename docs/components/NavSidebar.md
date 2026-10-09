# NavSidebar

An app's primary navigation, down the side, for
[`AppShell`](AppShell.md)'s sidebar slot. Spec:
[`NavSidebar.md`](../specs/NavSidebar.md).

```tsx
import { NavSidebar, NavSidebarSection, NavSidebarItem, NavSidebarGroup } from '@mod-0-dev/pixel-perfect';
```

A named `<nav>` of sections, each a list of links, with groups that
open to show more. Every link and every group's button is its own tab
stop; there is nothing to learn. The current link is the one you mark
`current`: the component does not read the router.

**A closed group's links are in the HTML.** They are `hidden`, out of
the accessibility tree and the tab order, but a crawler and a reader
without JavaScript get the whole map.

## Usage

```tsx
// app/layout.tsx
<AppShell sidebar={<Nav current={pathname} />}>{children}</AppShell>

// Nav.tsx
<NavSidebar label="Main">
  <NavSidebarSection>
    <NavSidebarItem asChild current={current === '/'} icon={<HomeGlyph />}>
      <Link href="/">Home</Link>
    </NavSidebarItem>
    <NavSidebarItem asChild current={current.startsWith('/inbox')} end={<Badge tone="accent">3</Badge>}>
      <Link href="/inbox">Inbox</Link>
    </NavSidebarItem>
  </NavSidebarSection>
  <NavSidebarSection title="Workspace">
    <NavSidebarGroup label="Projects" icon={<FolderGlyph />}>
      <NavSidebarItem href="/projects/alpha" current={current === '/projects/alpha'}>Alpha</NavSidebarItem>
      <NavSidebarItem href="/projects/beta">Beta</NavSidebarItem>
    </NavSidebarGroup>
    <NavSidebarItem href="/members">Members</NavSidebarItem>
  </NavSidebarSection>
</NavSidebar>
```

## Parts

| Part | Element | Props | Notes |
| --- | --- | --- | --- |
| `NavSidebar` | `<nav>` | `label` (required) | The landmark |
| `NavSidebarSection` | `<div>` + `<ul>` | `title?` | The title names the list |
| `NavSidebarItem` | `<li>` + `<a>` | `current?`, `icon?`, `end?`, `asChild?`, `href` and the rest on the link | `ref`, `className`, `style` on the link |
| `NavSidebarGroup` | `<li>` + `<button>` + `<ul>` | `label`, `icon?`, `open?` / `defaultOpen?` / `onOpenChange?` | Open by default when it holds the current item |

Items and groups must be inside a section: a `<nav>` holds lists.

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-nav-sidebar-row-height` | `--pp-control-height-sm` | Every row |
| `--pp-nav-sidebar-indent` | `--pp-space-4` | Per level |
| `--pp-nav-sidebar-gap` | `--pp-space-5` | Between sections |
| `--pp-nav-sidebar-current-bg` | `--pp-tone-bg` (accent) | The current link |
| `--pp-nav-sidebar-radius` | `--pp-control-radius` | A row's corners |

## Don't

```tsx
// ✗ Items loose in the nav. A section is the list.
<NavSidebar label="Main"><NavSidebarItem href="/">Home</NavSidebarItem></NavSidebar>

// ✗ A nav of buttons. A link goes somewhere; a button does something — that is Toolbar.
<NavSidebarItem onClick={openSettings}>Settings</NavSidebarItem>

// ✗ Two current links. aria-current is where you are, once.

// ✗ A drawer mode. On a narrow shell the sidebar stacks; an app that wants a
//   drawer puts a NavSidebar inside a Drawer and shows the trigger itself.
```
