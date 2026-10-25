import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { isEntryPoint } from './release.js';

// pnpm-workspace.yaml pins undici for miniflare because wrangler's newest release still resolves a
// vulnerable one (the three advisories that make `pnpm audit` fail). This reports when the newest
// wrangler no longer needs the pin, so that the override can be dropped. It reads the public npm
// registry only; run it with `pnpm check:undici-override`, or with `--strict`, which exits with 2 once
// the override can go (an error, including an undici major it has no patched release for, exits with
// 1). Once pnpm-workspace.yaml no longer mentions the override, it says there is nothing to check and
// exits with 0.

const KEY = 'miniflare>undici';
const VERSION = /^\d+\.\d+\.\d+$/;
const REGISTRY = 'https://registry.npmjs.org';

// The first release of each undici major that is patched against the three advisories behind the pin
// (GHSA-xjj6-f33q-929c, GHSA-4qv8-2p9j-2685 and GHSA-f72v-6w45-q472). Newer than the pin is not
// enough: undici 8.0.0 to 8.12.1 are still vulnerable. Update this together with the pin.
const PATCHED: Readonly<Record<string, string>> = {
  '7': '7.30.1',
  '8': '8.12.2',
};

/** The exact version that the `overrides:` section of pnpm-workspace.yaml pins for miniflare's undici. */
export function pinnedOverride(workspaceYaml: string): string | null {
  const lines = workspaceYaml.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trimEnd() === 'overrides:');
  if (start < 0) return null;
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === '') continue;
    if (!/^\s/.test(line)) return null;
    const match = line.match(
      /^\s+(["']?)([^"':]+)\1:\s*(["']?)([^"'\s]+)\3\s*$/,
    );
    if (match?.[2] !== KEY) continue;
    const value = match[4] as string;
    if (!VERSION.test(value))
      throw new Error(
        `The override for ${KEY} must be an exact major.minor.patch version, not "${value}".`,
      );
    return value;
  }
  return null;
}

/** A positive number when a is newer than b, negative when older, zero when equal. */
export function compareVersions(a: string, b: string): number {
  for (const version of [a, b])
    if (!VERSION.test(version))
      throw new Error(`"${version}" is not a major.minor.patch version.`);
  const x = a.split('.').map(Number);
  const y = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const difference = (x[i] as number) - (y[i] as number);
    if (difference !== 0) return difference;
  }
  return 0;
}

/** The first patched release in the major of an exact undici version; an unknown major cannot be decided. */
function patchedRelease(version: string): string {
  if (!VERSION.test(version))
    throw new Error(`"${version}" is not a major.minor.patch version.`);
  const patched = PATCHED[version.split('.')[0] as string];
  if (patched === undefined)
    throw new Error(
      `Whether undici ${version} is patched cannot be decided: the check knows the patched releases of undici ${Object.keys(PATCHED).join(' and ')} only.`,
    );
  return patched;
}

export interface OverrideStatus {
  /** The version the workspace pins. */
  pinned: string;
  /** The newest wrangler on the registry. */
  wrangler: string;
  /** The miniflare that wrangler depends on. */
  miniflare: string;
  /** The undici that miniflare depends on, as the registry states it. */
  undici: string;
  /** The first patched release in the major of that undici's lower bound. */
  patched: string;
  /** True when that lower bound is a patched release and at least as new as the pin. */
  droppable: boolean;
}

async function document(
  url: string,
  request: typeof fetch,
): Promise<Record<string, unknown>> {
  const response = await request(url, {
    signal: AbortSignal.timeout(15_000),
    redirect: 'error',
    headers: { accept: 'application/json' },
  });
  if (response.status !== 200) {
    await response.body?.cancel();
    throw new Error(
      `The registry answered HTTP ${response.status} for ${url}.`,
    );
  }
  return (await response.json()) as Record<string, unknown>;
}

function dependency(
  doc: Record<string, unknown>,
  name: string,
  owner: string,
): string {
  const dependencies = doc.dependencies as Record<string, unknown> | undefined;
  const value = dependencies?.[name];
  if (typeof value !== 'string' || value === '')
    throw new Error(`${owner} lists no ${name} dependency.`);
  return value;
}

export async function checkOverride({
  workspaceYaml,
  request = fetch,
}: {
  workspaceYaml: string;
  request?: typeof fetch;
}): Promise<OverrideStatus> {
  const pinned = pinnedOverride(workspaceYaml);
  if (pinned === null)
    throw new Error(`pnpm-workspace.yaml has no override for ${KEY}.`);
  const wranglerDoc = await document(`${REGISTRY}/wrangler/latest`, request);
  const miniflare = dependency(wranglerDoc, 'miniflare', 'The newest wrangler');
  const miniflareDoc = await document(
    `${REGISTRY}/miniflare/${miniflare}`,
    request,
  );
  const undici = dependency(miniflareDoc, 'undici', `miniflare ${miniflare}`);
  const lowerBound = undici.replace(/^[\^~]/, '');
  const patched = patchedRelease(lowerBound);
  return {
    pinned,
    wrangler: String(wranglerDoc.version),
    miniflare,
    undici,
    patched,
    droppable:
      compareVersions(lowerBound, patched) >= 0 &&
      compareVersions(lowerBound, pinned) >= 0,
  };
}

export function describeStatus(status: OverrideStatus): string {
  const facts = `the newest wrangler (${status.wrangler}) uses miniflare ${status.miniflare}, which pins undici ${status.undici}`;
  return status.droppable
    ? `The override ${KEY}=${status.pinned} can be dropped: ${facts}. Bump wrangler to ${status.wrangler}, remove the override from pnpm-workspace.yaml, then run pnpm install and pnpm audit.`
    : `The override ${KEY}=${status.pinned} is still needed: ${facts}, and the first patched release of that major is ${status.patched}.`;
}

/**
 * The exit status: 0, or 2 when --strict is given and the override can be dropped. It is also 0, without
 * asking the registry, once pnpm-workspace.yaml no longer mentions the override at all; an override line
 * it cannot read still fails. A failure throws.
 */
export async function run({
  workspaceYaml,
  request = fetch,
  strict,
  log = console.log,
}: {
  workspaceYaml: string;
  request?: typeof fetch;
  strict: boolean;
  log?: (message: string) => void;
}): Promise<number> {
  if (!workspaceYaml.includes(KEY)) {
    log(
      `pnpm-workspace.yaml has no override for ${KEY}, so there is nothing to check.`,
    );
    return 0;
  }
  const status = await checkOverride({ workspaceYaml, request });
  log(describeStatus(status));
  return strict && status.droppable ? 2 : 0;
}

async function main(): Promise<void> {
  const workspaceYaml = await readFile(
    fileURLToPath(new URL('../pnpm-workspace.yaml', import.meta.url)),
    'utf8',
  );
  process.exitCode = await run({
    workspaceYaml,
    strict: process.argv.includes('--strict'),
  });
}

if (isEntryPoint(import.meta.url, process.argv[1])) await main();
