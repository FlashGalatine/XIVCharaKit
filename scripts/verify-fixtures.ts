import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { inspectChara, readChara } from '../packages/chara/src/index.js';

const root = new URL('../fixtures/', import.meta.url);
const manifest = JSON.parse(
  await readFile(new URL('manifest.json', root), 'utf8'),
) as {
  equipmentRows: { path: string; sha256: string };
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
const rows = await readFile(new URL(manifest.equipmentRows.path, root));
if (
  createHash('sha256').update(rows).digest('hex') !==
  manifest.equipmentRows.sha256
)
  throw new Error('Equipment fixture hash mismatch.');
const examplesRoot = new URL('../apps/demo/public/examples/', import.meta.url);
for (const [example, source] of [
  ['anamnesis.chara', 'anamnesis/full.chara'],
  ['ktisis.chara', 'ktisis/full.chara'],
  ['brio.chara', 'brio/extended.chara'],
]) {
  if (!example || !source) throw new Error('Missing example mapping.');
  const [exampleBytes, sourceBytes] = await Promise.all([
    readFile(new URL(example, examplesRoot)),
    readFile(new URL(source, root)),
  ]);
  if (!exampleBytes.equals(sourceBytes))
    throw new Error('Public example differs from reviewed synthetic fixture.');
}
console.log(
  `Verified ${manifest.fixtures.length} synthetic character fixtures, equipment-row hash, and 3 exact public example copies; identity/facewear expectations checked.`,
);
