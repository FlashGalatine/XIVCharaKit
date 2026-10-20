import { describe, expect, it, vi } from 'vitest';
import {
  assertVersionUnpublished,
  createReleaseManifest,
  getPackageArtifactName,
  validateReleaseManifest,
  validateReleaseRequest,
} from '../scripts/release.js';

const metadata = {
  name: 'xivcharakit',
  version: '0.1.0-beta.1',
  type: 'module',
  license: 'MIT',
  repository: { url: 'git+https://github.com/FlashGalatine/XIVCharaKit.git' },
  publishConfig: {
    registry: 'https://registry.npmjs.org',
    access: 'public',
    tag: 'next',
  },
};
const context = {
  version: metadata.version,
  tag: 'next',
  dryRun: true,
  releaseEnabled: false,
  event: 'workflow_dispatch',
  repository: 'FlashGalatine/XIVCharaKit',
  ref: 'refs/heads/main',
  commit: 'a'.repeat(40),
};

describe('release admission', () => {
  it('allows an unpublished beta dry run without enabling registry writes', () => {
    expect(() => validateReleaseRequest(metadata, context)).not.toThrow();
    expect(getPackageArtifactName(metadata)).toBe(
      'xivcharakit-0.1.0-beta.1.tgz',
    );
  });
  it.each([
    { version: '0.1.0-beta.2' },
    { tag: 'latest' },
    { dryRun: false },
    { event: 'push' },
    { repository: 'someone/XIVCharaKit' },
    { ref: 'refs/heads/topic' },
    { commit: '../candidate' },
  ])('rejects an unsafe dispatch %j', (change) => {
    expect(() =>
      validateReleaseRequest(metadata, { ...context, ...change }),
    ).toThrow();
  });
  it('requires explicit release enablement for a real dispatch', () => {
    expect(() =>
      validateReleaseRequest(metadata, {
        ...context,
        dryRun: false,
        releaseEnabled: true,
      }),
    ).not.toThrow();
  });
  it.each([
    { private: true },
    { name: 'another-package' },
    { license: 'UNLICENSED' },
    { type: 'commonjs' },
    { dependencies: { unexpected: '1.0.0' } },
    {
      publishConfig: {
        ...metadata.publishConfig,
        registry: 'https://example.com',
      },
    },
    { publishConfig: { ...metadata.publishConfig, access: 'restricted' } },
    { publishConfig: { ...metadata.publishConfig, tag: 'latest' } },
    { repository: { url: 'git+https://github.com/someone/XIVCharaKit.git' } },
  ])('rejects unreviewed package metadata %j', (change) => {
    expect(() =>
      validateReleaseRequest({ ...metadata, ...change }, context),
    ).toThrow();
  });
  it.each([
    '../1.0.0',
    '01.0.0',
    '1.0.0-beta.01',
    '1.0.0\n',
    '1.0.0+build',
    '1.0',
    '1.0.0;echo',
  ])('rejects unsafe version %j', (version) => {
    expect(() => getPackageArtifactName({ ...metadata, version })).toThrow();
  });
  it('never admits a prerelease on latest even if metadata agrees', () => {
    expect(() =>
      validateReleaseRequest(
        {
          ...metadata,
          publishConfig: { ...metadata.publishConfig, tag: 'latest' },
        },
        { ...context, tag: 'latest' },
      ),
    ).toThrow();
  });
});

describe('verified artifact handoff', () => {
  const bytes = Buffer.from('reviewed candidate');
  it('accepts the original bytes and separate expected integrity', () => {
    const manifest = createReleaseManifest(metadata, context, bytes) as {
      integrity: string;
    };
    expect(() =>
      validateReleaseManifest(
        manifest,
        metadata,
        context,
        bytes,
        manifest.integrity,
      ),
    ).not.toThrow();
  });
  it.each([
    'commit',
    'repository',
    'version',
    'tag',
    'filename',
    'integrity',
    'schema',
  ])('rejects a changed %s', (key) => {
    const manifest = createReleaseManifest(metadata, context, bytes) as Record<
      string,
      unknown
    >;
    expect(() =>
      validateReleaseManifest(
        { ...manifest, [key]: 'changed' },
        metadata,
        context,
        bytes,
        manifest.integrity as string,
      ),
    ).toThrow();
  });
  it('rejects substituted bytes and a self-consistent replacement manifest', () => {
    const original = createReleaseManifest(metadata, context, bytes) as {
      integrity: string;
    };
    const changed = Buffer.from('different candidate');
    const replacement = createReleaseManifest(metadata, context, changed);
    expect(() =>
      validateReleaseManifest(
        original,
        metadata,
        context,
        changed,
        original.integrity,
      ),
    ).toThrow();
    expect(() =>
      validateReleaseManifest(
        replacement,
        metadata,
        context,
        changed,
        original.integrity,
      ),
    ).toThrow();
  });
});

describe('registry preflight', () => {
  it('accepts only a missing exact version', async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 404 }));
    await expect(
      assertVersionUnpublished(metadata.version, request),
    ).resolves.toBeUndefined();
    expect(request.mock.calls[0]?.[0]).toBe(
      'https://registry.npmjs.org/xivcharakit/0.1.0-beta.1',
    );
  });
  it.each([200, 401, 429, 500])('fails closed on HTTP %s', async (status) => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status }));
    await expect(
      assertVersionUnpublished(metadata.version, request),
    ).rejects.toThrow();
  });
  it('fails closed on network failure', async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error('offline'));
    await expect(
      assertVersionUnpublished(metadata.version, request),
    ).rejects.toThrow();
  });
});
