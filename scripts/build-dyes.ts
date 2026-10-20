import { createHash } from 'node:crypto';
import { readFile, stat, writeFile } from 'node:fs/promises';

const commit = 'ab3b961d58988b493283eb9fd28cb930ea07b169';
const sourceSha256 =
  '0392c152bba1a3fbdeed89bc3e007e3b9e83d5a5ce618779f1a9439f009400bc';
const [source, mode, ...extra] = process.argv.slice(2);
if (!source || (mode !== undefined && mode !== '--check') || extra.length)
  throw new Error(
    'Usage: tsx scripts/build-dyes.ts <explicit-Stain.csv-path> [--check]',
  );
if ((await stat(source)).size > 128 * 1024)
  throw new Error('Dye source is too large.');
const bytes = await readFile(source);
if (
  bytes.length > 128 * 1024 ||
  createHash('sha256').update(bytes).digest('hex') !== sourceSha256
)
  throw new Error(
    'Dye source differs from the pinned baseline. Review a new revision before updating.',
  );
const lines = new TextDecoder('utf-8', { fatal: true })
  .decode(bytes)
  .trimEnd()
  .split(/\r?\n/);
if (
  lines.shift() !==
  '#,InlineName,Name,Color,Item[0],Item[1],Shade,SubOrder,IsMetallic,IsHousingApplicable'
)
  throw new Error('Unexpected Stain columns.');
const names: Record<string, string> = Object.create(null);
const ids = new Set<number>();
for (const line of lines) {
  // This hash-pinned baseline has unquoted fields. Fail closed on any CSV shape change.
  const cells = line.split(',');
  const idText = cells[0] ?? '';
  const id = Number(idText);
  if (
    cells.length !== 10 ||
    line.includes('"') ||
    !/^\d+$/.test(idText) ||
    !Number.isInteger(id) ||
    id > 65535 ||
    ids.has(id)
  )
    throw new Error('Invalid Stain row.');
  ids.add(id);
  const name = cells[2]?.trim();
  if (name) names[String(id)] = name;
}
const result = `${JSON.stringify(
  {
    formatVersion: 1,
    table: 'Stain',
    language: 'en',
    gameVersion: null,
    sourceCommit: commit,
    sourceUrl: `https://raw.githubusercontent.com/xivapi/ffxiv-datamining/${commit}/csv/en/Stain.csv`,
    sourceSha256,
    sourceRows: ids.size,
    namedRows: Object.keys(names).length,
    normalization: 'Trim surrounding name whitespace; omit blank names.',
    namesSha256: createHash('sha256')
      .update(JSON.stringify(names))
      .digest('hex'),
    names,
  },
  null,
  2,
)}\n`;
const target = new URL('../packages/chara/src/dyes/data.json', import.meta.url);
if (mode === '--check') {
  if ((await readFile(target, 'utf8')) !== result)
    throw new Error('Generated dye data differs.');
} else await writeFile(target, result);
console.log(
  `Verified pinned Stain source: ${ids.size} rows, ${Object.keys(names).length} names; ${mode === '--check' ? 'output unchanged' : 'output generated'}.`,
);
