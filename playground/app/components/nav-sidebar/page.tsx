/*
 * A Server Component page; the NavSidebar's groups are client components
 * that hold whether they are open. Every group here is uncontrolled.
 *
 * NOTHING HERE WRITES AN ID (D-035 §1): the browser suite finds its
 * sections by `data-testid`.
 */
import {
  AppShell,
  Badge,
  NavSidebar,
  NavSidebarGroup,
  NavSidebarItem,
  NavSidebarSection,
  Text,
} from '@mod-0-dev/pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

function HomeGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9Z" />
    </svg>
  );
}

function InboxGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 13h5l2 3h4l2-3h5" />
      <path d="M5 4h14l2 9v7H3v-7l2-9Z" />
    </svg>
  );
}

function FolderGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    </svg>
  );
}

function UsersGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4.5-6.2" />
    </svg>
  );
}

function GearGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  );
}

function Nav({ current = '/projects/alpha', label = 'Main' }: { current?: string; label?: string }) {
  return (
    <NavSidebar label={label}>
      <NavSidebarSection>
        <NavSidebarItem href="#" icon={<HomeGlyph />} current={current === '/'}>
          Home
        </NavSidebarItem>
        <NavSidebarItem href="#" icon={<InboxGlyph />} end={<Badge tone="accent">3</Badge>} current={current === '/inbox'}>
          Inbox
        </NavSidebarItem>
      </NavSidebarSection>
      <NavSidebarSection title="Workspace">
        <NavSidebarGroup label="Projects" icon={<FolderGlyph />}>
          <NavSidebarItem href="#" current={current === '/projects/alpha'}>
            Alpha
          </NavSidebarItem>
          <NavSidebarItem href="#" current={current === '/projects/beta'}>
            Beta
          </NavSidebarItem>
          <NavSidebarGroup label="Archive">
            <NavSidebarItem href="#" current={current === '/projects/archive/2025'}>
              2025
            </NavSidebarItem>
          </NavSidebarGroup>
        </NavSidebarGroup>
        <NavSidebarItem href="#" icon={<UsersGlyph />} current={current === '/members'}>
          Members
        </NavSidebarItem>
        <NavSidebarItem href="#" icon={<GearGlyph />} current={current === '/settings'}>
          Settings, integrations and a label long enough to truncate
        </NavSidebarItem>
      </NavSidebarSection>
    </NavSidebar>
  );
}

export default function NavSidebarPage() {
  return (
    <>
      <h1>6.4 NavSidebar</h1>
      <p>
        An app&rsquo;s primary navigation, down the side, for AppShell&rsquo;s sidebar slot: a named
        nav of sections, links with an icon and a count, and groups that open to show more. Plain links
        &mdash; every one a tab stop. The app marks the current link; a group holding it is open by
        default and its row reads at full weight. A closed group&rsquo;s links stay in the HTML, hidden.
      </p>

      <section data-testid="nav-sidebar-alone">
        <h2>On its own</h2>
        <p>
          The current page is <code>Alpha</code>, inside <code>Projects</code>, which is therefore open;{' '}
          <code>Archive</code> is closed. The last label truncates.
        </p>
        <Matrix>
          <Nav />
        </Matrix>
      </section>

      <section data-testid="nav-sidebar-shell">
        <h2>In the shell</h2>
        <p>
          Beside the main at 960; above it at 240 and 480, every row the full width. The shell&rsquo;s{' '}
          <code>Split</code> decides; the nav has no query of its own.
        </p>
        <Matrix>
          <AppShell header={<Text weight="semibold">Acme</Text>} sidebar={<Nav current="/inbox" />}>
            <div style={{ padding: '1rem' }}>
              <Text tone="muted">The page.</Text>
            </div>
          </AppShell>
        </Matrix>
      </section>

      <section data-testid="nav-sidebar-rtl">
        <h2>Right to left</h2>
        <p>The indent is on the right, and the chevron is mirrored.</p>
        <Matrix>
          <div dir="rtl">
            <NavSidebar label="الرئيسية">
              <NavSidebarSection title="مساحة العمل">
                <NavSidebarItem href="#" icon={<HomeGlyph />}>
                  الرئيسية
                </NavSidebarItem>
                <NavSidebarGroup label="المشاريع" icon={<FolderGlyph />}>
                  <NavSidebarItem href="#" current>
                    ألفا
                  </NavSidebarItem>
                  <NavSidebarItem href="#">بيتا</NavSidebarItem>
                </NavSidebarGroup>
                <NavSidebarGroup label="الأرشيف">
                  <NavSidebarItem href="#">٢٠٢٥</NavSidebarItem>
                </NavSidebarGroup>
              </NavSidebarSection>
            </NavSidebar>
          </div>
        </Matrix>
      </section>
    </>
  );
}
