import { spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import {
  CharaInputError,
  READ_DEFAULTS,
  readChara,
} from '../packages/chara/src/index.js';

const cases = [
  'image-at-byte-limit',
  'array-at-node-limit',
  'object-near-node-limit',
  'over-depth',
  'over-nodes',
] as const;
const selected = process.argv[process.argv.indexOf('--case') + 1];
if (process.argv.includes('--case')) {
  let text: string;
  if (selected === 'image-at-byte-limit') {
    const empty = '{"Hair":0,"Base64Image":""}';
    text = `{"Hair":0,"Base64Image":"${'a'.repeat(READ_DEFAULTS.maxBytes - empty.length)}"}`;
  } else if (selected === 'array-at-node-limit' || selected === 'over-nodes') {
    text = JSON.stringify({
      Hair: 0,
      Future: Array.from(
        { length: selected === 'over-nodes' ? 100000 : 99995 },
        () => 0,
      ),
    });
  } else if (selected === 'object-near-node-limit') {
    text = JSON.stringify({
      Hair: 0,
      Future: Object.fromEntries(
        Array.from({ length: 49997 }, (_, i) => [`k${i}`, 0]),
      ),
    });
  } else {
    text = `{"Hair":0,"Future":${'['.repeat(33)}0${']'.repeat(33)}}`;
  }
  global.gc?.();
  const beforeHeap = process.memoryUsage().heapUsed;
  const start = performance.now();
  let outcome = 'accepted';
  try {
    readChara(text);
  } catch (error) {
    if (!(error instanceof CharaInputError)) throw error;
    outcome = error.code;
  }
  console.log(
    JSON.stringify({
      case: selected,
      bytes: Buffer.byteLength(text),
      outcome,
      elapsedMs: Number((performance.now() - start).toFixed(2)),
      sampledHeapDeltaBytes: process.memoryUsage().heapUsed - beforeHeap,
      processPeakRssKiB: process.resourceUsage().maxRSS,
    }),
  );
} else {
  console.log(
    JSON.stringify({
      runtime: process.version,
      platform: process.platform,
      arch: process.arch,
      note: 'Isolated synthetic cases; sampled heap delta is not peak heap or a memory guarantee. Process RSS includes input and tooling.',
    }),
  );
  for (const name of cases) {
    const child = spawnSync(
      process.execPath,
      ['--expose-gc', '--import', 'tsx', import.meta.filename, '--case', name],
      { encoding: 'utf8', timeout: 10_000 },
    );
    if (child.status !== 0) throw new Error(`Benchmark failed: ${name}`);
    process.stdout.write(child.stdout);
  }
}
