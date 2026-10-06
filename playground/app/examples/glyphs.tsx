import type { ReactNode } from 'react';

/*
 * The examples' glyphs. The library ships no icons (Icon.md): an app brings
 * its own SVGs, drawn with currentColor, and hands them to `Icon`,
 * `IconButton` or a part's `icon` slot, which size and name them. These are
 * ours, drawn on a 24px grid with a 2px round stroke. Server-safe: no hooks.
 */

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Launchpad's mark: an arrow cut out of a rounded square, one fill. */
export function LaunchpadMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 4.5L6.5 12h3.75v6h3.5v-6h3.75L12 6.5Z"
      />
    </svg>
  );
}

export const UserGlyph = () => (
  <Glyph>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
  </Glyph>
);

export const BellGlyph = () => (
  <Glyph>
    <path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 8 2.5 8h-17S6 15 6 9" />
    <path d="M10.3 21a2 2 0 0 0 3.4 0" />
  </Glyph>
);

export const CardGlyph = () => (
  <Glyph>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
    <path d="M6 15h4" />
  </Glyph>
);

export const UsersGlyph = () => (
  <Glyph>
    <circle cx="9" cy="8" r="4" />
    <path d="M2 21c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5" />
    <path d="M16 3.6a4 4 0 0 1 0 7.8" />
    <path d="M18.5 14.9c2.1.9 3.5 3 3.5 6.1" />
  </Glyph>
);

export const ShieldGlyph = () => (
  <Glyph>
    <path d="M12 22s8-3.5 8-10V5.5L12 2.5l-8 3V12c0 6.5 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </Glyph>
);

export const ArrowLeftGlyph = () => (
  <Glyph>
    <path d="M19 12H5" />
    <path d="m11 6-6 6 6 6" />
  </Glyph>
);

export const GridGlyph = () => (
  <Glyph>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </Glyph>
);

export const PackageGlyph = () => (
  <Glyph>
    <path d="m21 7.5-9-5-9 5v9l9 5 9-5v-9Z" />
    <path d="m3 7.5 9 5 9-5" />
    <path d="M12 12.5V21.5" />
  </Glyph>
);

export const AlertGlyph = () => (
  <Glyph>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </Glyph>
);

export const LayersGlyph = () => (
  <Glyph>
    <path d="m12 2 10 5-10 5L2 7l10-5Z" />
    <path d="m2 12 10 5 10-5" />
    <path d="m2 17 10 5 10-5" />
  </Glyph>
);

export const SlidersGlyph = () => (
  <Glyph>
    <path d="M4 21v-7" />
    <path d="M4 10V3" />
    <path d="M12 21v-9" />
    <path d="M12 8V3" />
    <path d="M20 21v-5" />
    <path d="M20 12V3" />
    <path d="M1 14h6" />
    <path d="M9 8h6" />
    <path d="M17 16h6" />
  </Glyph>
);

export const FolderGlyph = () => (
  <Glyph>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
  </Glyph>
);

export const SearchGlyph = () => (
  <Glyph>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </Glyph>
);

export const DownloadGlyph = () => (
  <Glyph>
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 21h14" />
  </Glyph>
);

export const PlusGlyph = () => (
  <Glyph>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </Glyph>
);

export const TrendUpGlyph = () => (
  <Glyph>
    <path d="m3 17 6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
  </Glyph>
);

export const TrendDownGlyph = () => (
  <Glyph>
    <path d="m3 7 6 6 4-4 8 8" />
    <path d="M15 17h6v-6" />
  </Glyph>
);

export const CheckCircleGlyph = () => (
  <Glyph>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12 3 3 5-6" />
  </Glyph>
);

export const MailGlyph = () => (
  <Glyph>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 6-10 7L2 6" />
  </Glyph>
);

export const CameraGlyph = () => (
  <Glyph>
    <path d="M3 8a2 2 0 0 1 2-2h2.5l1.5-2h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" />
    <circle cx="12" cy="13" r="3.5" />
  </Glyph>
);

export const ArrowRightGlyph = () => (
  <Glyph>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </Glyph>
);

export const ArrowDownGlyph = () => (
  <Glyph>
    <path d="M12 5v14" />
    <path d="m6 13 6 6 6-6" />
  </Glyph>
);

export const ArrowUpGlyph = () => (
  <Glyph>
    <path d="M12 19V5" />
    <path d="m6 11 6-6 6 6" />
  </Glyph>
);
