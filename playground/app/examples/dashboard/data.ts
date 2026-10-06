import type { Tone } from 'pixel-perfect';

/*
 * The dashboard's releases: 128 deploys over the 30 days to 6 October 2026,
 * newest first. Generated, but deterministically — a fixed seed and UTC
 * arithmetic, no clock and no locale — so the server's HTML and the client's
 * first render are the same rows (RULES §7). The failures are pinned so the
 * table agrees with the stat cards: 4 of 128.
 */

export type Environment = 'Production' | 'Staging' | 'Preview';
export type ReleaseStatus = 'Live' | 'Rolling out' | 'Rolled back' | 'Failed';

export interface Release {
  id: string;
  project: string;
  version: string;
  environment: Environment;
  status: ReleaseStatus;
  author: string;
  /** Milliseconds since the epoch, for sorting. */
  deployedAt: number;
  /** "6 Oct, 14:32", in UTC. */
  deployed: string;
  duration: string;
}

export const ENVIRONMENTS: readonly Environment[] = ['Production', 'Staging', 'Preview'];

/** The same faces as the settings screen's team. */
export const PEOPLE: Readonly<Record<string, Tone>> = {
  'Mara Ellison': 'accent',
  'Samuel Okafor': 'success',
  'Priya Raman': 'warning',
  'Jonas Lindqvist': 'neutral',
  'Aiko Tanaka': 'accent',
  'Diego Alvarez': 'success',
};

const PROJECTS: ReadonlyArray<{ name: string; version: readonly [number, number, number] }> = [
  { name: 'checkout-web', version: [4, 12, 3] },
  { name: 'payments-api', version: [2, 31, 0] },
  { name: 'mobile-ios', version: [7, 4, 1] },
  { name: 'search-service', version: [1, 18, 6] },
  { name: 'design-tokens', version: [3, 9, 2] },
];

const FAILURES: Readonly<Record<number, ReleaseStatus>> = {
  3: 'Rolled back',
  17: 'Failed',
  52: 'Rolled back',
  96: 'Failed',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const HOUR = 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, '0');

function build(): Release[] {
  // Park–Miller: every product stays below 2^53, so it is exact everywhere.
  let seed = 20261006;
  const random = () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };
  const people = Object.keys(PEOPLE);
  const versions = PROJECTS.map((project) => [...project.version]);
  let at = Date.UTC(2026, 9, 6, 14, 32);
  const releases: Release[] = [];

  for (let i = 0; i < 128; i += 1) {
    const p = Math.floor(random() * PROJECTS.length);
    const [major, minor, patch] = versions[p];
    const roll = random();
    const status: ReleaseStatus = i === 0 ? 'Rolling out' : (FAILURES[i] ?? 'Live');
    const environment: Environment =
      status === 'Rolling out' || status === 'Rolled back'
        ? 'Production'
        : roll < 0.5
          ? 'Production'
          : roll < 0.8
            ? 'Staging'
            : 'Preview';
    const seconds = 95 + Math.floor(random() * 480);
    const date = new Date(at);

    releases.push({
      id: `${PROJECTS[p].name}-${i}`,
      project: PROJECTS[p].name,
      version: `v${major}.${minor}.${patch}`,
      environment,
      status,
      author: people[Math.floor(random() * people.length)],
      deployedAt: at,
      deployed: `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}, ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`,
      duration: `${Math.floor(seconds / 60)}m ${pad(seconds % 60)}s`,
    });

    // Back in time: this project's previous version, and the deploy before.
    const restart = 3 + Math.floor(random() * 4);
    versions[p] =
      patch > 0 ? [major, minor, patch - 1] : minor > 0 ? [major, minor - 1, restart] : [major - 1, 9, restart];
    at = Math.round((at - (1 + random() * 9) * HOUR) / 60000) * 60000;
  }

  return releases;
}

export const RELEASES: readonly Release[] = build();
