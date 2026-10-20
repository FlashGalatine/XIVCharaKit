import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const data = JSON.parse(
  await readFile(
    new URL('../packages/chara/src/dyes/data.json', import.meta.url),
    'utf8',
  ),
);
assert.equal(data.formatVersion, 1);
assert.equal(data.table, 'Stain');
assert.equal(data.language, 'en');
assert.match(data.sourceCommit, /^[a-f0-9]{40}$/);
assert.match(data.sourceSha256, /^[a-f0-9]{64}$/);
const names = Object.entries(data.names);
assert.equal(names.length, data.namedRows);
for (const [key, name] of names) {
  assert(/^(?:0|[1-9]\d*)$/.test(key) && Number(key) <= 65535);
  assert(
    typeof name === 'string' &&
      name.length > 0 &&
      name.length <= 128 &&
      name === name.trim(),
  );
}
assert.equal(
  createHash('sha256').update(JSON.stringify(data.names)).digest('hex'),
  data.namesSha256,
);
assert.equal(data.names['0'], 'No Color');
assert.equal(data.names['3'], 'Goobbue Grey');
console.log(
  `Verified ${names.length} English Stain names and canonical name hash; no source download.`,
);
