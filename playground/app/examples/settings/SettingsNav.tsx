'use client';

import NextLink from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { NavSidebar, NavSidebarItem, NavSidebarSection } from '@mod-0-dev/pixel-perfect';

import { ArrowLeftGlyph, BellGlyph, CardGlyph, ShieldGlyph, UserGlyph, UsersGlyph } from '../glyphs';

/*
 * The settings' own navigation: its links jump to the sections of the page.
 * NavSidebar does not read the router — the current link is the one the app
 * marks (NavSidebar.md) — so this island marks the section the address
 * names, and Profile until it names one. The server renders Profile, the
 * first client render matches it, and the hash is read after hydration.
 */

const GROUPS: ReadonlyArray<{ title: string; items: ReadonlyArray<{ id: string; label: string; icon: ReactNode }> }> = [
  {
    title: 'Account',
    items: [
      { id: 'settings-profile', label: 'Profile', icon: <UserGlyph /> },
      { id: 'settings-notifications', label: 'Notifications', icon: <BellGlyph /> },
    ],
  },
  {
    title: 'Workspace',
    items: [
      { id: 'settings-billing', label: 'Billing', icon: <CardGlyph /> },
      { id: 'settings-team', label: 'Team', icon: <UsersGlyph /> },
      { id: 'settings-security', label: 'Security', icon: <ShieldGlyph /> },
    ],
  },
];

const IDS = GROUPS.flatMap((group) => group.items.map((item) => item.id));

export function SettingsNav() {
  const [current, setCurrent] = useState(IDS[0]);

  useEffect(() => {
    const follow = () => {
      const id = window.location.hash.slice(1);
      if (IDS.includes(id)) setCurrent(id);
    };
    follow();
    window.addEventListener('hashchange', follow);
    return () => window.removeEventListener('hashchange', follow);
  }, []);

  return (
    <NavSidebar label="Settings">
      <NavSidebarSection>
        <NavSidebarItem asChild icon={<ArrowLeftGlyph />}>
          <NextLink href="/examples/dashboard">Back to Overview</NextLink>
        </NavSidebarItem>
      </NavSidebarSection>
      {GROUPS.map((group) => (
        <NavSidebarSection key={group.title} title={group.title}>
          {group.items.map((item) => (
            <NavSidebarItem key={item.id} href={`#${item.id}`} current={item.id === current} icon={item.icon}>
              {item.label}
            </NavSidebarItem>
          ))}
        </NavSidebarSection>
      ))}
    </NavSidebar>
  );
}
