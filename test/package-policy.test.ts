import { expect, it } from 'vitest';
import { assertPublicArtifact } from '../scripts/package-policy.js';

it.each([
  ['package/dist/read.js', 'export const code = "INVALID_JSON";'],
  [
    'package/dist/dyes.js',
    'const source = "https://raw.githubusercontent.com/xivapi/data/commit/Stain.csv";',
  ],
  [
    'apps/demo/dist/examples/example.chara',
    '{"Nickname":"Synthetic example","HairTone":0}',
  ],
])('admits expected public artifact %s', (path, text) => {
  expect(() => assertPublicArtifact(path, text)).not.toThrow();
});

it.each([
  ['package/dist/source.map', '{}'],
  ['package/dist/human.cmp', 'binary'],
  ['package/.env', 'VALUE=private'],
  ['package/../outside.js', 'export {};'],
  ['package/dist/file.js', 'const origin = "C:\\Users\\Someone\\private.ts";'],
  [
    'package/dist/file.js',
    'const origin = "/home/runner/work/project/source.ts";',
  ],
  [
    'package/dist/file.js',
    'const source = "C:/dev/XIVProjects/CharaSamples/test.chara";',
  ],
  ['package/dist/file.js', 'PRIVATE_IMAGE_CANARY'],
  ['package/dist/file.js', '-----BEGIN PRIVATE KEY-----'],
  ['package/dist/file.js', `ghp_${'a'.repeat(36)}`],
  ['package/dist/file.js', '//# sourceMappingURL=file.js.map'],
])('rejects private or unintended content in %s', (path, text) => {
  expect(() => assertPublicArtifact(path, text)).toThrow();
});
