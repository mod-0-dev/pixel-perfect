import type { CSSProperties } from 'react';
import { Avatar, Badge, Cluster, Icon, Separator, Text, ThemeToggle } from 'pixel-perfect';

import { CheckCircleGlyph, LaunchpadMark } from './glyphs';

/*
 * The fictional product the examples are screens of: Launchpad, a release
 * tracker, signed in as Mara Ellison in the Northwind workspace. The frame
 * parts every AppShell example shares live here. Server Components: the one
 * client part in them, ThemeToggle, is the library's own.
 */

/*
 * The mark in the accent's solid step: `data-pp-tone` makes this icon an
 * accent context (the documented way to give a part a tone — Switch.md),
 * and `--pp-icon-color` is Icon's own styling property.
 */
const ACCENT_MARK = { '--pp-icon-color': 'var(--pp-tone-solid)' } as CSSProperties;

export function Brand() {
  return (
    <Cluster gap="2">
      <Icon decorative size="lg" data-pp-tone="accent" style={ACCENT_MARK}>
        <LaunchpadMark />
      </Icon>
      <Text weight="semibold">Launchpad</Text>
    </Cluster>
  );
}

/** AppShell's `header` slot: the product, the workspace, and the person. */
export function AppHeader() {
  return (
    <Cluster justify="between" gap="3">
      <Cluster gap="3">
        <Brand />
        <Separator orientation="vertical" />
        <Text size="sm" tone="muted">
          Northwind
        </Text>
      </Cluster>
      <Cluster gap="2">
        <ThemeToggle size="sm" />
        <Avatar name="Mara Ellison" size="sm" tone="accent" />
      </Cluster>
    </Cluster>
  );
}

/** AppShell's `footer` slot. */
export function AppFooter() {
  return (
    <Cluster justify="between" gap="3">
      <Text size="sm" tone="muted">
        © 2026 Launchpad, Inc.
      </Text>
      <Badge tone="success" size="sm">
        <Icon decorative>
          <CheckCircleGlyph />
        </Icon>
        All systems operational
      </Badge>
    </Cluster>
  );
}
