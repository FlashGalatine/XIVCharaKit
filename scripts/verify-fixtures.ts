import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { inspectChara, readChara } from '../packages/chara/src/index.js';

const root = new URL('../fixtures/', import.meta.url);
const manifest = JSON.parse(
  await readFile(new URL('manifest.json', root), 'utf8'),
) as {
  fixtures: {
    path: string;
    sha256: string;
    expected: { canonicalRace: string | null; facewear: number | null };
  }[];
};
for (const entry of manifest.fixtures) {
  const bytes = await readFile(new URL(entry.path, root));
  if (createHash('sha256').update(bytes).digest('hex') !== entry.sha256)
    throw new Error('Fixture hash mismatch.');
  const result = inspectChara(readChara(bytes));
  if (
    result.identity.canonicalRace !== entry.expected.canonicalRace ||
    (result.facewear.value ?? null) !== entry.expected.facewear
  )
    throw new Error('Fixture expectation mismatch.');
}
console.log(
  `Verified ${manifest.fixtures.length} synthetic fixture hashes and reviewed identity/facewear expectations.`,
);
