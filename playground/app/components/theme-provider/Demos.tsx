'use client';

import { Button, ButtonGroup, Stack, Text, useTheme } from '@mod-0-dev/pixel-perfect';

/**
 * Reads the layout's provider — the same one the chrome's switcher sets —
 * and sets it. Three cells, one provider, so the three readouts agree.
 * NOTHING HERE WRITES AN ID (D-035 §1).
 */
export function Readout() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <Stack gap="3" data-testid="theme-readout">
      <Text size="sm">
        Choice: <code data-testid="theme-choice">{theme}</code> · Showing:{' '}
        <code data-testid="theme-resolved">{resolvedTheme ?? 'not yet known'}</code>
      </Text>
      <ButtonGroup label="Set the theme">
        <Button size="sm" variant="outline" onClick={() => setTheme('system')}>
          System
        </Button>
        <Button size="sm" variant="outline" onClick={() => setTheme('light')}>
          Light
        </Button>
        <Button size="sm" variant="outline" onClick={() => setTheme('dark')}>
          Dark
        </Button>
      </ButtonGroup>
    </Stack>
  );
}
