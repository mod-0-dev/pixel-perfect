import type { Metadata } from 'next';
import Script from 'next/script';

/*
 * Pinned fonts, installed from npm rather than resolved from the system.
 *
 * The library's own token is a system font stack, which is correct for
 * consumers. But a system stack makes visual-regression baselines
 * machine-specific: this container and ubuntu-latest resolve
 * `ui-sans-serif, system-ui, …` to different fonts, text metrics differ, and
 * the full-page screenshot came out 2px taller in CI — an automatic failure no
 * pixel threshold can absorb. Pinning the font in the PLAYGROUND removes the
 * variable without changing what the library ships.
 */
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/600.css';

// Exactly how a consuming app pulls the library in: one stylesheet, once.
import 'pixel-perfect/styles.css';

import { Chrome } from '../harness/Chrome';
import { THEME_SCRIPT } from '../harness/theme-script';
import '../harness/matrix.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'pixel-perfect playground',
  description: 'Component harness: every component at three container widths, in the theme you pick.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /*
     * `suppressHydrationWarning`, because the theme script below sets
     * `data-pp-theme` on this element before React loads, and the server
     * rendered it without one. That is the one attribute React must not
     * "correct" (D-063).
     */
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="pp-theme" strategy="beforeInteractive">
          {THEME_SCRIPT}
        </Script>
      </head>
      <body>
        <Chrome />
        <div className="page">{children}</div>
      </body>
    </html>
  );
}
