import { describe, expect, it, vi } from 'vitest';
import {
  checkOverride,
  compareVersions,
  describeStatus,
  pinnedOverride,
} from '../scripts/check-undici-override.js';

// The workspace pins undici for miniflare (pnpm-workspace.yaml) because the newest wrangler still
// ships a vulnerable one. This check says when that pin has become unnecessary, so it can be dropped.

describe('reading the pinned version out of the workspace file', () => {
  const file = (line: string) =>
    `packages:\n  - packages/*\nonlyBuiltDependencies:\n  - esbuild\noverrides:\n${line}\n`;
  it('finds an exact version under overrides', () => {
    expect(pinnedOverride(file('  miniflare>undici: 7.30.1'))).toBe('7.30.1');
  });
  it('accepts quotes around the key and the value', () => {
    expect(pinnedOverride(file('  "miniflare>undici": "7.30.1"'))).toBe(
      '7.30.1',
    );
    expect(pinnedOverride(file("  'miniflare>undici': '7.30.1'"))).toBe(
      '7.30.1',
    );
  });
  it('is null without the override, for another key and outside the overrides section', () => {
    expect(pinnedOverride('packages:\n  - a\n')).toBeNull();
    expect(pinnedOverride(file('  other>undici: 7.30.1'))).toBeNull();
    expect(
      pinnedOverride('onlyBuiltDependencies:\n  miniflare>undici: 7.30.1\n'),
    ).toBeNull();
    expect(
      pinnedOverride(
        'overrides:\n  other: 1.0.0\nextra:\n  miniflare>undici: 7.30.1\n',
      ),
    ).toBeNull();
  });
  it('refuses a range, because the pin is meant to be exact', () => {
    expect(() => pinnedOverride(file('  miniflare>undici: ^7.30.1'))).toThrow(
      /exact/,
    );
  });
});

describe('comparing dotted versions', () => {
  it.each([
    ['7.30.1', '7.29.1', 1],
    ['7.29.1', '7.30.1', -1],
    ['7.30.1', '7.30.1', 0],
    ['7.9.0', '7.30.0', -1],
    ['8.0.0', '7.99.99', 1],
    ['7.30.10', '7.30.9', 1],
  ])('%s against %s is %i', (a, b, sign) => {
    expect(Math.sign(compareVersions(a, b))).toBe(sign);
  });
  it('refuses what is not major.minor.patch', () => {
    for (const bad of ['7.30', '7.30.x', 'latest', '', '7.30.1.2']) {
      expect(() => compareVersions(bad, '7.30.1')).toThrow(/version/);
      expect(() => compareVersions('7.30.1', bad)).toThrow(/version/);
    }
  });
});

describe('asking the registry what the newest wrangler pulls in', () => {
  const registry = (undici: string, wrangler = '4.152.0') =>
    vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url === 'https://registry.npmjs.org/wrangler/latest')
        return Response.json({
          version: wrangler,
          dependencies: { miniflare: '5.20261019.2-beta' },
        });
      if (url === 'https://registry.npmjs.org/miniflare/5.20261019.2-beta')
        return Response.json({ dependencies: { undici } });
      return new Response('unexpected', { status: 404 });
    }) as unknown as typeof fetch;
  const workspace = 'overrides:\n  miniflare>undici: 7.30.1\n';

  it('keeps the override while the newest miniflare still pins an older undici', async () => {
    const status = await checkOverride({
      workspaceYaml: workspace,
      request: registry('7.29.1'),
    });
    expect(status).toEqual({
      pinned: '7.30.1',
      wrangler: '4.152.0',
      miniflare: '5.20261019.2-beta',
      undici: '7.29.1',
      droppable: false,
    });
    expect(describeStatus(status)).toContain('still needed');
  });
  it.each(['7.30.1', '7.30.2', '7.31.0', '8.0.0'])(
    'can drop the override once the newest miniflare pins undici %s',
    async (undici) => {
      const status = await checkOverride({
        workspaceYaml: workspace,
        request: registry(undici),
      });
      expect(status.droppable).toBe(true);
      expect(describeStatus(status)).toContain('can be dropped');
      expect(describeStatus(status)).toContain(undici);
    },
  );
  it('reads a caret or tilde range as its lower bound', async () => {
    expect(
      (
        await checkOverride({
          workspaceYaml: workspace,
          request: registry('^7.30.1'),
        })
      ).droppable,
    ).toBe(true);
    expect(
      (
        await checkOverride({
          workspaceYaml: workspace,
          request: registry('~7.29.1'),
        })
      ).droppable,
    ).toBe(false);
  });
  it('asks only for the two registry documents, without credentials', async () => {
    const request = registry('7.29.1');
    await checkOverride({ workspaceYaml: workspace, request });
    expect(request).toHaveBeenCalledTimes(2);
    for (const call of vi.mocked(request).mock.calls)
      expect(call[1]).toMatchObject({ redirect: 'error' });
  });
  it('fails clearly when the workspace has no override to check', async () => {
    await expect(
      checkOverride({
        workspaceYaml: 'packages:\n  - a\n',
        request: registry('7.29.1'),
      }),
    ).rejects.toThrow(/no override/);
  });
  it('fails clearly when the registry answers with an error or an unexpected document', async () => {
    for (const status of [301, 404, 429, 503]) {
      const error = vi.fn(
        async () => new Response('no', { status }),
      ) as unknown as typeof fetch;
      await expect(
        checkOverride({ workspaceYaml: workspace, request: error }),
      ).rejects.toThrow(new RegExp(String(status)));
    }
    const blank = vi.fn(async (input: string | URL | Request) =>
      String(input).includes('/wrangler/')
        ? Response.json({ dependencies: { miniflare: '' } })
        : Response.json({}),
    ) as unknown as typeof fetch;
    await expect(
      checkOverride({ workspaceYaml: workspace, request: blank }),
    ).rejects.toThrow(/wrangler lists no miniflare dependency/);
    const empty = vi.fn(async () =>
      Response.json({}),
    ) as unknown as typeof fetch;
    await expect(
      checkOverride({ workspaceYaml: workspace, request: empty }),
    ).rejects.toThrow(/miniflare/);
    const noUndici = vi.fn(async (input: string | URL | Request) =>
      String(input).includes('/wrangler/')
        ? Response.json({ dependencies: { miniflare: '5.1.0' } })
        : Response.json({ dependencies: {} }),
    ) as unknown as typeof fetch;
    await expect(
      checkOverride({ workspaceYaml: workspace, request: noUndici }),
    ).rejects.toThrow(/undici/);
  });
});
