import type { Metadata } from 'next';

// Exactly how a consuming app pulls the library in: one stylesheet, once.
import 'pixel-perfect/styles.css';

import '../harness/matrix.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'pixel-perfect playground',
  description: 'Component harness: every component at three container widths, in both themes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="page">{children}</div>
      </body>
    </html>
  );
}
