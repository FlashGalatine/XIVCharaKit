import { readdir, readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('protects the served document, module worker and legal files with security headers', async ({
  request,
}) => {
  const assets = await readdir(new URL('../dist/assets/', import.meta.url));
  const worker = assets.find((name) => /^worker-[\w-]+\.js$/.test(name));
  expect(worker).toBeTruthy();
  for (const path of [
    '/',
    `/assets/${worker}`,
    '/LICENSE.txt',
    '/THIRD_PARTY_NOTICES.txt',
  ]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const headers = response.headers();
    expect(headers['cache-control']).toContain('no-transform');
    expect(headers['referrer-policy']).toBe('no-referrer');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['permissions-policy']).toBe(
      'camera=(), microphone=(), geolocation=()',
    );
    const csp = headers['content-security-policy'];
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("worker-src 'self'");
    expect(csp).toContain("connect-src 'self' https://v2.xivapi.com");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval/);
    if (path === '/') {
      expect(headers['content-type']).toContain('text/html');
      expect(await response.body()).toEqual(
        await readFile(new URL('../dist/index.html', import.meta.url)),
      );
    }
    if (path.endsWith('.js'))
      expect(headers['content-type']).toMatch(
        /(?:application|text)\/javascript/,
      );
    if (path.endsWith('.txt'))
      expect(headers['content-type']).toContain('text/plain');
  }
});

test('does not expose repository inputs or substitute HTML for missing assets', async ({
  request,
}) => {
  for (const path of [
    '/package.json',
    '/fixtures/manifest.json',
    '/fixtures/producer-exports/README.md',
    '/human.cmp',
    '/_headers',
    '/assets/missing.js',
    '/assets/missing.js.map',
  ]) {
    const response = await request.get(path, {
      headers: { Accept: 'text/html' },
    });
    expect(response.status()).toBe(404);
    expect(await response.text()).not.toContain('<!doctype html>');
  }
});
