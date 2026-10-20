import { smoke } from './smoke.js';

const context = globalThis as unknown as { postMessage(value: unknown): void };
context.postMessage(await smoke());
