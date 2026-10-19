import { createHash } from 'node:crypto';
import { open, readFile, writeFile } from 'node:fs/promises';
import {
  CMP_MAX_BYTES,
  CMP_MIN_BYTES,
  generatePaletteTables,
} from './palette-generation.js';

const args = process.argv.slice(2).filter((arg) => arg !== '--');
const path = args[0];
const check = args.includes('--check');
const datasetVersion = args[args.indexOf('--dataset-version') + 1];
const gameVersion = args.includes('--game-version')
  ? args[args.indexOf('--game-version') + 1]
  : null;
if (
  !path ||
  path.startsWith('--') ||
  (!check &&
    (!args.includes('--dataset-version') ||
      !datasetVersion ||
      !/^[a-z0-9][a-z0-9._-]{0,63}$/i.test(datasetVersion))) ||
  (gameVersion !== null &&
    (!gameVersion || !/^\d{1,3}\.\d{1,3}(?:\.\d{1,3})?$/.test(gameVersion)))
)
  throw new Error(
    'Usage: build-palettes.ts <explicit-local-human.cmp> --check | --dataset-version <version> [--game-version <revision>]',
  );
const file = await open(path, 'r');
let bytes: Buffer;
try {
  const stat = await file.stat();
  if (
    !stat.isFile() ||
    stat.size < CMP_MIN_BYTES ||
    stat.size > CMP_MAX_BYTES ||
    stat.size % 4 !== 0
  )
    throw new Error('Invalid human.cmp layout.');
  // Read only the admitted layout; a concurrently growing file cannot expand this allocation.
  bytes = Buffer.alloc(stat.size);
  let offset = 0;
  while (offset < bytes.length) {
    const result = await file.read(
      bytes,
      offset,
      bytes.length - offset,
      offset,
    );
    if (result.bytesRead === 0)
      throw new Error('Source file changed during reading.');
    offset += result.bytesRead;
  }
} finally {
  await file.close();
}
const tables = generatePaletteTables(bytes);
const hash = (data: string | Uint8Array) =>
  createHash('sha256').update(data).digest('hex');
const count = (value: unknown): number =>
  Array.isArray(value)
    ? value.length
    : Object.values(value as object).reduce<number>(
        (total, child) => total + count(child),
        0,
      );
const artifacts = Object.entries(tables).map(([name, value]) => ({
  file: `data/${name}.json`,
  sha256: hash(JSON.stringify(value)),
  colorCount: count(value),
}));
if (!check) {
  const root = new URL('../packages/chara/src/palettes/', import.meta.url);
  const metadata = JSON.parse(
    await readFile(new URL('metadata.json', root), 'utf8'),
  );
  const updated = {
    ...metadata,
    datasetVersion,
    gameVersion,
    generatedFrom: { sha256: hash(bytes), bytes: bytes.length },
    artifacts,
  };
  for (const [name, value] of Object.entries(tables))
    await writeFile(
      new URL(`data/${name}.json`, root),
      `${JSON.stringify(value)}\n`,
    );
  await writeFile(
    new URL('metadata.json', root),
    `${JSON.stringify(updated, null, 2)}\n`,
  );
}
console.log(
  JSON.stringify(
    {
      mode: check ? 'check' : 'write',
      sourceSha256: hash(bytes),
      sourceBytes: bytes.length,
      artifacts,
    },
    null,
    2,
  ),
);
