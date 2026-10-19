import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const scratch = new URL('.superpowers/package-smoke/', root);
const tarball = fileURLToPath(new URL('ffxiv-chara-0.0.0.tgz', scratch));
const entries = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' })
  .trim()
  .split(/\r?\n/);
assert(entries.length > 2);
for (const entry of entries) {
  assert(
    /^package\/(?:package\.json|dist\/[a-z-]+\.(?:js|d\.ts))$/.test(entry),
    'Unexpected package file.',
  );
}
const consumer = await mkdtemp(fileURLToPath(new URL('consumer-', scratch)));
const installed = `${consumer}/node_modules/ffxiv-chara`;
await mkdir(installed, { recursive: true });
execFileSync('tar', ['-xzf', tarball, '-C', installed, '--strip-components=1']);
const metadata = JSON.parse(
  await readFile(`${installed}/package.json`, 'utf8'),
);
assert.equal(metadata.type, 'module');
assert.equal(Object.keys(metadata.dependencies ?? {}).length, 0);
await writeFile(`${consumer}/package.json`, '{"private":true,"type":"module"}');
await writeFile(
  `${consumer}/tsconfig.json`,
  JSON.stringify({
    compilerOptions: {
      strict: true,
      noEmit: true,
      target: 'ES2022',
      module: 'NodeNext',
      types: [],
    },
    files: ['consumer.ts'],
  }),
);
await writeFile(
  `${consumer}/consumer.ts`,
  `import { readChara, inspectChara, modelKey, type CharaInspection } from 'ffxiv-chara';
const result: CharaInspection = inspectChara(readChara('{"HairTone":0}'));
const key: string = modelKey({ slot: 'MainHand', set: 634, base: 19, variant: 1 });
void result; void key;
`,
);
execFileSync(
  process.execPath,
  [
    fileURLToPath(new URL('node_modules/typescript/bin/tsc', root)),
    '--project',
    'tsconfig.json',
  ],
  { cwd: consumer, stdio: 'pipe' },
);
await writeFile(
  `${consumer}/worker.mjs`,
  `import { parentPort } from 'node:worker_threads';
globalThis.fetch = () => { throw new Error('Unexpected network'); };
const { readChara, inspectChara } = await import('ffxiv-chara');
const result = inspectChara(readChara('{"Body":{"ModelBase":361,"ModelVariant":5}}'));
parentPort.postMessage(result.equipment.Body.model);
`,
);
await writeFile(
  `${consumer}/consumer.mjs`,
  `import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
globalThis.fetch = () => { throw new Error('Unexpected network'); };
const { readChara, inspectChara, modelKey } = await import('ffxiv-chara');
assert.equal(inspectChara(readChara('{"Tribe":"Dunesfolk"}')).identity.canonicalRace, 'Lalafell');
assert.equal(modelKey({ slot:'MainHand', set:634, base:19, variant:1 }), '4296213114');
const worker = new Worker(new URL('./worker.mjs', import.meta.url));
try {
  const result = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Worker deadline exceeded')), 5000);
    worker.once('message', value => { clearTimeout(timer); resolve(value); });
    worker.once('error', error => { clearTimeout(timer); reject(error); });
  });
  assert.deepEqual(result, { slot:'Body', base:361, variant:5 });
} finally { await worker.terminate(); }
console.log('Installed tarball: JavaScript, TypeScript, Node Worker, and zero-I/O imports passed.');
`,
);
execFileSync(process.execPath, ['consumer.mjs'], {
  cwd: consumer,
  stdio: 'inherit',
});
console.log(
  `Package allowlist verified: ${entries.length} files; no runtime dependencies.`,
);
