import { describe, expect, it } from 'vitest';
import type { JsonValue } from '../src/index.js';
import { readChara } from '../src/index.js';

let seed = 0xabcdef;
function random(n: number) {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed % n;
}
function value(depth: number): JsonValue {
  const kind = random(depth ? 7 : 5);
  if (kind === 0) return null;
  if (kind === 1) return Boolean(random(2));
  if (kind === 2) return random(10000) - 5000;
  if (kind === 3) return random(10000) / 1000;
  if (kind === 4)
    return (
      ['😀é', '\\"\n\u0000', '{}[]', 'constructor', '\ud800'][random(5)] ?? ''
    );
  if (kind === 5)
    return Array.from({ length: random(5) }, () => value(depth - 1));
  const record: Record<string, JsonValue> = Object.create(null);
  for (let i = 0; i < random(5); i++) record[`key${i}`] = value(depth - 1);
  return record;
}

describe('deterministic JSON compatibility', () => {
  it('matches native JSON values for 2000 bounded synthetic documents', () => {
    for (let i = 0; i < 2000; i++) {
      const text = JSON.stringify({ Hair: 0, Future: value(5) });
      expect(readChara(text).fields).toEqual(JSON.parse(text));
    }
  });
  it('does not admit malformed JSON in 2000 seeded mutations', () => {
    for (let i = 0; i < 2000; i++) {
      const text = JSON.stringify({ Hair: 0, Future: value(3) });
      const pos = random(text.length);
      const mutated = `${text.slice(0, pos)}${['!', ',', ':', '\\', '\u0000'][random(5)]}${text.slice(pos + 1)}`;
      let valid = true;
      try {
        JSON.parse(mutated);
      } catch {
        valid = false;
      }
      if (!valid) expect(() => readChara(mutated)).toThrow();
    }
  });
});
