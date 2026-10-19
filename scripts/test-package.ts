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
    /^package\/(?:package\.json|dist\/(?:THIRD_PARTY_NOTICES\.md|(?:[a-z-]+\/)*[a-zA-Z0-9_-]+\.(?:js|d\.ts)))$/.test(
      entry,
    ),
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
import { createDefaultPaletteProvider, type PaletteProvider } from 'ffxiv-chara/palettes';
const palettes: PaletteProvider = createDefaultPaletteProvider();
import { resolveAppearance, type AppearanceInspection } from 'ffxiv-chara/appearance';
const appearance: AppearanceInspection = await resolveAppearance(result, { palettes });
void appearance;
void palettes;
void result; void key;
import { createXivapiClient, createMemoryCache, type XivapiClient } from 'ffxiv-chara/xivapi';
const transport: XivapiClient = createXivapiClient({ cache: createMemoryCache() });
void transport;
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
const { createDefaultPaletteProvider } = await import('ffxiv-chara/palettes');
const color = await createDefaultPaletteProvider().getColor({ table:'shader', palette:'eyes', index:0 });
if (color?.hex !== '#F7F7F7') throw new Error('Worker palette mismatch');
const { resolveAppearance } = await import('ffxiv-chara/appearance');
const appearance = await resolveAppearance(inspectChara(readChara('{"LEyeColor":0}')), { palettes:createDefaultPaletteProvider() });
if (appearance.slots.leftEye.displayHex !== '#F7F7F7') throw new Error('Worker appearance mismatch');
const { createXivapiClient } = await import('ffxiv-chara/xivapi');
const transport = createXivapiClient({ fetch: async () => new Response(JSON.stringify({ version:'0123456789abcdef', schema:'exdschema@2:rev:' + 'a'.repeat(40), rows:[] })), version:'0123456789abcdef' });
if ((await transport.getGlasses(8)).status !== 'complete') throw new Error('Worker transport mismatch');
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
const { createDefaultPaletteProvider } = await import('ffxiv-chara/palettes');
assert.equal((await createDefaultPaletteProvider().getColor({ table:'creator', palette:'hair', index:42, tribe:'Raen', gender:'Feminine' }))?.hex, '#FFDC98');
const { resolveAppearance } = await import('ffxiv-chara/appearance');
const appearance = await resolveAppearance(inspectChara(readChara('{"LEyeColor":0}')), { palettes:createDefaultPaletteProvider() });
assert.equal(appearance.slots.leftEye.displayHex, '#F7F7F7');
const { createXivapiClient, createMemoryCache } = await import('ffxiv-chara/xivapi');
const transport = createXivapiClient({ cache:createMemoryCache() });
assert.equal((await transport.searchItems([])).status, 'complete');
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
