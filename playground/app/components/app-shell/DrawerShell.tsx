'use client';

import { AppShell } from '@mod-0-dev/pixel-perfect';
import { useState, type ReactNode } from 'react';

/**
 * A drawer shell in a box of its own: a cell is the shell's page, so the
 * drawer is portalled into the cell (`menuContainer`) rather than over the
 * gallery. The stage is the drawer's containing block, the Dialog gallery's
 * device (globals.css `.app-shell-stage`).
 */
export function DrawerShell({
  header,
  sidebar,
  footer,
  children,
}: {
  header: ReactNode;
  sidebar: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  return (
    <div ref={setStage} className="app-shell-stage">
      <AppShell collapseTo="drawer" menuContainer={stage} header={header} sidebar={sidebar} footer={footer}>
        {children}
      </AppShell>
    </div>
  );
}
