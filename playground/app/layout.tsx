import type { Metadata } from 'next';

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
import { ThemeProvider } from 'pixel-perfect';

import { Chrome } from '../harness/Chrome';
import { HydrationMark } from '../harness/HydrationMark';
import '../harness/matrix.css';
import '../harness/stage.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'pixel-perfect playground',
  description: 'Component harness: every component at three container widths, in the theme you pick.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /*
     * `suppressHydrationWarning`, because the ThemeProvider's script sets
     * `data-pp-theme` on this element before React loads, and the server
     * rendered it without one. That is the one attribute React must not
     * "correct" (D-063; ThemeProvider spec §1).
     */
    <html lang="en" suppressHydrationWarning>
      <body>
        {/*
          * THE PROVIDER IS THE FIRST THING IN <body> (ThemeProvider spec §4):
          * it renders the pre-paint script ahead of everything, so the page
          * paints in the stored theme. The playground consumes the library's
          * provider exactly as an app would (D-094).
          */}
        <ThemeProvider>
          {/*
            * The page gutter is on THIS wrapper, not on <body>: Radix's scroll
            * lock rewrites the body's top, left and right padding to its
            * margins (zero) while a modal is open, so a padded body jumps by
            * its gutter every time a Dialog, AlertDialog or Drawer opens
            * (D-071 §6). A padded wrapper is untouched.
            */}
          <div className="shell">
            <Chrome />
            <div className="page">{children}</div>
            {/* After the page, so its effect runs after the page's (D-093 §5). */}
            <HydrationMark />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
