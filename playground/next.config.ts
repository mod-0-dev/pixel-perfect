import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');

const config: NextConfig = {
  /*
   * The playground is not a workspace member (D-012), so it has its own
   * lockfile beside the library's. Next sees two and warns that it had to
   * guess a root. Pinning it removes the guesswork.
   *
   * It must be the REPOSITORY root, not this directory: the library resolves
   * through playground/node_modules/pixel-perfect, a symlink to the repo root,
   * and Turbopack will not resolve outside its configured root. Pinning this
   * to `here` fails with "Can't resolve 'pixel-perfect/styles.css'".
   */
  turbopack: { root: repoRoot },
  outputFileTracingRoot: repoRoot,

  typescript: { ignoreBuildErrors: false },
};

export default config;
