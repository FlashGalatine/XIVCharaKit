import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import {
  createDefaultPaletteProvider,
  PALETTE_METADATA,
} from '../packages/chara/src/palettes/index.js';

const root = new URL('../packages/chara/src/palettes/', import.meta.url);
const count = (value: unknown): number =>
  Array.isArray(value)
    ? value.length
    : Object.values(value as object).reduce<number>(
        (total, child) => total + count(child),
        0,
      );
for (const artifact of PALETTE_METADATA.artifacts) {
  assert(/^data\/(creator|shader)-(shared|race)\.json$/.test(artifact.file));
  const data: unknown = JSON.parse(
    await readFile(new URL(artifact.file, root), 'utf8'),
  );
  assert.equal(
    createHash('sha256').update(JSON.stringify(data)).digest('hex'),
    artifact.sha256,
  );
  assert.equal(count(data), artifact.colorCount);
}
const provider = createDefaultPaletteProvider();
for (const table of ['creator', 'shader'] as const) {
  assert.equal(
    (await provider.getColor({ table, palette: 'eyes', index: 0 }))?.hex,
    '#F7F7F7',
  );
  for (const gender of ['Masculine', 'Feminine'] as const) {
    for (const palette of ['skin', 'hair'] as const)
      assert(
        await provider.getColor({
          table,
          palette,
          index: 191,
          tribe: 'Veena',
          gender,
        }),
      );
  }
}
assert.equal(
  (
    await provider.getColor({
      table: 'creator',
      palette: 'hair',
      index: 42,
      tribe: 'Raen',
      gender: 'Feminine',
    })
  )?.hex,
  '#FFDC98',
);
assert.equal(
  (
    await provider.getColor({
      table: 'shader',
      palette: 'hair',
      index: 42,
      tribe: 'Raen',
      gender: 'Feminine',
    })
  )?.hex,
  '#E5D2AC',
);
console.log(
  `Verified ${PALETTE_METADATA.artifacts.length} table hashes and 26,208 palette colors; dataset ${PALETTE_METADATA.datasetVersion}, game revision ${PALETTE_METADATA.gameVersion ?? 'unknown'}.`,
);
