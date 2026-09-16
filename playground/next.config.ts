import type { NextConfig } from 'next';

const config: NextConfig = {
  // The library is a workspace sibling shipping untranspiled ESM; Next handles
  // it directly. Kept explicit so a future move to a registry dependency is a
  // one-line change rather than a debugging session.
  transpilePackages: [],
  typescript: { ignoreBuildErrors: false },
};

export default config;
